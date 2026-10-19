import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { and, eq, desc } from "drizzle-orm";
import { quotes, type Quote, type InsertQuote, type NewQuote } from "@shared/schema";

export interface IStorage {
  getQuote(id: number, ownerId: string): Promise<Quote | undefined>;
  getQuotes(ownerId: string): Promise<Quote[]>;
  createQuote(quote: NewQuote): Promise<Quote>;
  updateQuote(id: number, ownerId: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number, ownerId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private quotes: Map<number, Quote>;
  private currentId: number;

  constructor() {
    this.quotes = new Map();
    this.currentId = 1;
  }

  async getQuote(id: number, ownerId: string): Promise<Quote | undefined> {
    const quote = this.quotes.get(id);
    return quote && quote.ownerId === ownerId ? quote : undefined;
  }

  async getQuotes(ownerId: string): Promise<Quote[]> {
    return Array.from(this.quotes.values())
      .filter((quote) => quote.ownerId === ownerId)
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async createQuote(insertQuote: NewQuote): Promise<Quote> {
    const id = this.currentId++;
    const now = new Date();
    const quote: Quote = {
      id,
      ownerId: insertQuote.ownerId,
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
      currency: insertQuote.currency || "USD",
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

  async updateQuote(id: number, ownerId: string, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const existingQuote = this.quotes.get(id);
    if (!existingQuote || existingQuote.ownerId !== ownerId) {
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

  async deleteQuote(id: number, ownerId: string): Promise<boolean> {
    const existingQuote = this.quotes.get(id);
    if (!existingQuote || existingQuote.ownerId !== ownerId) {
      return false;
    }
    return this.quotes.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getQuote(id: number, ownerId: string): Promise<Quote | undefined> {
    const result = await this.db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.ownerId, ownerId)))
      .limit(1);

    return result[0];
  }

  async getQuotes(ownerId: string): Promise<Quote[]> {
    return await this.db
      .select()
      .from(quotes)
      .where(eq(quotes.ownerId, ownerId))
      .orderBy(desc(quotes.createdAt));
  }

  async createQuote(insertQuote: NewQuote): Promise<Quote> {
    const result = await this.db
      .insert(quotes)
      .values(insertQuote)
      .returning();

    return result[0];
  }

  async updateQuote(id: number, ownerId: string, updateData: Partial<InsertQuote>): Promise<Quote | undefined> {
    const result = await this.db
      .update(quotes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(quotes.id, id), eq(quotes.ownerId, ownerId)))
      .returning();

    return result[0];
  }

  async deleteQuote(id: number, ownerId: string): Promise<boolean> {
    const result = await this.db
      .delete(quotes)
      .where(and(eq(quotes.id, id), eq(quotes.ownerId, ownerId)))
      .returning();

    return result.length > 0;
  }
}

const databaseUrl = process.env.DATABASE_URL?.trim();
const isProduction = process.env.NODE_ENV === "production";

function createStorage(): IStorage {
  if (databaseUrl) {
    console.log("[storage] Using PostgreSQL storage");
    return new DatabaseStorage();
  }

  if (isProduction) {
    throw new Error(
      "[storage] DATABASE_URL is required in production; refusing to start with in-memory storage",
    );
  }

  console.log("[storage] DATABASE_URL not set; using in-memory storage (development/test only)");
  return new MemStorage();
}

export const storage = createStorage();
