import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { and, eq, desc } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  quotes,
  quoteShares,
  type Quote,
  type QuoteShare,
  type InsertQuote,
  type NewQuote,
  type PublicQuote,
} from "@shared/schema";

// 256 bits of entropy, URL-safe. For a shared quote the token is the credential.
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface IStorage {
  getQuote(id: number, ownerId: string): Promise<Quote | undefined>;
  getQuotes(ownerId: string): Promise<Quote[]>;
  createQuote(quote: NewQuote): Promise<Quote>;
  updateQuote(id: number, ownerId: string, quote: Partial<InsertQuote>): Promise<Quote | undefined>;
  deleteQuote(id: number, ownerId: string): Promise<boolean>;
  // Share links. All owner-scoped lookups verify ownership through getQuote.
  getQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined>;
  createQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined>;
  deleteQuoteShare(quoteId: number, ownerId: string): Promise<boolean>;
  // Public read path: the token alone grants read access, owner id is stripped.
  getPublicQuoteByToken(token: string): Promise<PublicQuote | undefined>;
}

export class MemStorage implements IStorage {
  private quotes: Map<number, Quote>;
  private shares: Map<number, QuoteShare>;
  private sharesByToken: Map<string, QuoteShare>;
  private currentId: number;
  private currentShareId: number;

  constructor() {
    this.quotes = new Map();
    this.shares = new Map();
    this.sharesByToken = new Map();
    this.currentId = 1;
    this.currentShareId = 1;
  }

  private removeShare(quoteId: number): boolean {
    const share = this.shares.get(quoteId);
    if (!share) {
      return false;
    }
    this.sharesByToken.delete(share.token);
    return this.shares.delete(quoteId);
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
    this.removeShare(id);
    return this.quotes.delete(id);
  }

  async getQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return undefined;
    }
    return this.shares.get(quoteId);
  }

  async createQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return undefined;
    }

    const existing = this.shares.get(quoteId);
    if (existing) {
      return existing;
    }

    const share: QuoteShare = {
      id: this.currentShareId++,
      quoteId,
      token: generateShareToken(),
      createdAt: new Date(),
    };
    this.shares.set(quoteId, share);
    this.sharesByToken.set(share.token, share);
    return share;
  }

  async deleteQuoteShare(quoteId: number, ownerId: string): Promise<boolean> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return false;
    }
    return this.removeShare(quoteId);
  }

  async getPublicQuoteByToken(token: string): Promise<PublicQuote | undefined> {
    const share = this.sharesByToken.get(token);
    if (!share) {
      return undefined;
    }

    const quote = this.quotes.get(share.quoteId);
    if (!quote) {
      return undefined;
    }

    return {
      title: quote.title,
      createdAt: quote.createdAt,
      freelancerName: quote.freelancerName,
      freelancerTitle: quote.freelancerTitle,
      freelancerEmail: quote.freelancerEmail,
      freelancerPhone: quote.freelancerPhone,
      clientName: quote.clientName,
      clientAddress: quote.clientAddress,
      currency: quote.currency,
      tasks: quote.tasks,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      terms: quote.terms,
    };
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

    // quote_shares cascades on delete, so the share link dies with the quote.
    return result.length > 0;
  }

  async getQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return undefined;
    }

    const result = await this.db
      .select()
      .from(quoteShares)
      .where(eq(quoteShares.quoteId, quoteId))
      .limit(1);

    return result[0];
  }

  async createQuoteShare(quoteId: number, ownerId: string): Promise<QuoteShare | undefined> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return undefined;
    }

    // Idempotent: the unique quote_id constraint decides the winner if two
    // requests race, and the loser simply reads the existing token back.
    const inserted = await this.db
      .insert(quoteShares)
      .values({ quoteId, token: generateShareToken() })
      .onConflictDoNothing({ target: quoteShares.quoteId })
      .returning();

    if (inserted[0]) {
      return inserted[0];
    }

    return this.getQuoteShare(quoteId, ownerId);
  }

  async deleteQuoteShare(quoteId: number, ownerId: string): Promise<boolean> {
    const quote = await this.getQuote(quoteId, ownerId);
    if (!quote) {
      return false;
    }

    const result = await this.db
      .delete(quoteShares)
      .where(eq(quoteShares.quoteId, quoteId))
      .returning();

    return result.length > 0;
  }

  async getPublicQuoteByToken(token: string): Promise<PublicQuote | undefined> {
    // Explicit column allowlist: the public payload must not grow automatically
    // when the quotes table gains internal columns.
    const result = await this.db
      .select({
        title: quotes.title,
        createdAt: quotes.createdAt,
        freelancerName: quotes.freelancerName,
        freelancerTitle: quotes.freelancerTitle,
        freelancerEmail: quotes.freelancerEmail,
        freelancerPhone: quotes.freelancerPhone,
        clientName: quotes.clientName,
        clientAddress: quotes.clientAddress,
        currency: quotes.currency,
        tasks: quotes.tasks,
        subtotal: quotes.subtotal,
        tax: quotes.tax,
        total: quotes.total,
        terms: quotes.terms,
      })
      .from(quoteShares)
      .innerJoin(quotes, eq(quoteShares.quoteId, quotes.id))
      .where(eq(quoteShares.token, token))
      .limit(1);

    return result[0];
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
