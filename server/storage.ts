import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc } from "drizzle-orm";
import { quotes, type Quote, type InsertQuote } from "@shared/schema";

export interface IStorage {
  getQuote(id: number): Promise<Quote | undefined>;
  getQuotes(): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private quotes: Map<number, Quote>;
  private currentId: number;

  constructor() {
    this.quotes = new Map();
    this.currentId = 1;
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    return this.quotes.get(id);
  }

  async getQuotes(): Promise<Quote[]> {
    return Array.from(this.quotes.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const id = this.currentId++;
    const now = new Date();
    const quote: Quote = {
      id,
      title: insertQuote.title,
      clientName: insertQuote.clientName || null,
      clientEmail: insertQuote.clientEmail || null,
      clientAddress: insertQuote.clientAddress || null,
      freelancerName: insertQuote.freelancerName,
      freelancerTitle: insertQuote.freelancerTitle || null,
      freelancerEmail: insertQuote.freelancerEmail || null,
      freelancerPhone: insertQuote.freelancerPhone || null,
      hourlyRate: insertQuote.hourlyRate,
      hoursPerDay: insertQuote.hoursPerDay,
      tasks: insertQuote.tasks,
      subtotal: insertQuote.subtotal,
      tax: insertQuote.tax || 0,
      total: insertQuote.total,
      terms: insertQuote.terms || null,
      createdAt: now,
      updatedAt: now,
    };
    this.quotes.set(id, quote);
    return quote;
  }

  async updateQuote(id: number, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const existingQuote = this.quotes.get(id);
    if (!existingQuote) {
      return undefined;
    }

    const updatedQuote: Quote = {
      ...existingQuote,
      ...updateData,
      updatedAt: new Date(),
    };
    
    this.quotes.set(id, updatedQuote);
    return updatedQuote;
  }

  async deleteQuote(id: number): Promise<boolean> {
    return this.quotes.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getQuote(id: number): Promise<Quote | undefined> {
    const result = await this.db
      .select()
      .from(quotes)
      .where(eq(quotes.id, id))
      .limit(1);
    
    return result[0];
  }

  async getQuotes(): Promise<Quote[]> {
    return await this.db
      .select()
      .from(quotes)
      .orderBy(desc(quotes.createdAt));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const result = await this.db
      .insert(quotes)
      .values(insertQuote)
      .returning();
    
    return result[0];
  }

  async updateQuote(id: number, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await this.db
      .update(quotes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    
    return result[0];
  }

  async deleteQuote(id: number): Promise<boolean> {
    const result = await this.db
      .delete(quotes)
      .where(eq(quotes.id, id))
      .returning();
    
    return result.length > 0;
  }
}

// Use database storage if DATABASE_URL is available, otherwise fall back to memory storage
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
