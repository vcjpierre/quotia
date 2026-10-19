import { pgTable, text, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  clientName: text("client_name"),
  clientEmail: text("client_email"),
  clientAddress: text("client_address"),
  freelancerName: text("freelancer_name").notNull(),
  freelancerTitle: text("freelancer_title"),
  freelancerEmail: text("freelancer_email"),
  freelancerPhone: text("freelancer_phone"),
  hourlyRate: integer("hourly_rate").notNull(),
  hoursPerDay: integer("hours_per_day").notNull().default(8),
  currency: text("currency").notNull().default("USD"),
  tasks: jsonb("tasks").notNull(), // Array of task objects
  subtotal: integer("subtotal").notNull(), // In cents
  tax: integer("tax").notNull().default(0), // In cents
  total: integer("total").notNull(), // In cents
  terms: text("terms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdIdx: index("quotes_owner_id_idx").on(table.ownerId),
}));

export const taskSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "La descripción de la tarea es obligatoria"),
  type: z.enum(["project", "feature", "microtask"]),
  hours: z.number().min(0.1, "Las horas deben ser al menos 0.1"),
  cost: z.number().min(0),
});

const supportedCurrencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "MXN", "BRL", "INR", "COP", "BOB"] as const;

export const currencySchema = z.enum(supportedCurrencies);

export const insertQuoteSchema = createInsertSchema(quotes, {
  tasks: z.array(taskSchema),
  hourlyRate: z.number().min(1, "La tarifa por hora debe ser al menos 1"),
  hoursPerDay: z.number().min(1, "Las horas por día deben ser al menos 1"),
  currency: currencySchema.default("USD"),
  tax: z.number().default(0),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ownerId: true,
});

export const SUPPORTED_CURRENCIES = supportedCurrencies;

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type NewQuote = InsertQuote & { ownerId: string };
export type Quote = typeof quotes.$inferSelect;
export type Task = z.infer<typeof taskSchema>;
