import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth } from "./auth";
import { insertQuoteSchema } from "@shared/schema";
import { z } from "zod";

function parseQuoteId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) {
    return null;
  }

  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Every quote operation requires an authenticated owner.
  app.use("/api/quotes", requireAuth);

  // Get all quotes owned by the current user
  app.get("/api/quotes", async (req, res) => {
    try {
      const quotes = await storage.getQuotes(req.user!.id);
      res.json(quotes);
    } catch (error) {
      res.status(500).json({ message: "No se pudieron obtener los presupuestos" });
    }
  });

  // Get single quote owned by the current user
  app.get("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const quote = await storage.getQuote(id, req.user!.id);
      if (!quote) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "No se pudo obtener el presupuesto" });
    }
  });

  // Create new quote for the current user
  app.post("/api/quotes", async (req, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote({
        ...validatedData,
        ownerId: req.user!.id,
      });
      res.status(201).json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "No se pudo crear el presupuesto" });
    }
  });

  // Update quote owned by the current user
  app.put("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const validatedData = insertQuoteSchema.parse(req.body);
      const quote = await storage.updateQuote(id, req.user!.id, validatedData);

      if (!quote) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      res.json(quote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Error de validación",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "No se pudo actualizar el presupuesto" });
    }
  });

  // Delete quote owned by the current user
  app.delete("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const deleted = await storage.deleteQuote(id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      res.json({ message: "Presupuesto eliminado correctamente" });
    } catch (error) {
      res.status(500).json({ message: "No se pudo eliminar el presupuesto" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
