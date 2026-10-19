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

// base64url of 32 random bytes: always 43 characters. Rejecting anything else
// before touching the database keeps junk traffic off the public endpoint.
const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

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

  // Create (or return the existing) public share link for a quote. Idempotent:
  // calling it twice must not invalidate a link already sent to a client.
  app.post("/api/quotes/:id/share", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const share = await storage.createQuoteShare(id, req.user!.id);
      if (!share) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      res.json({ token: share.token });
    } catch (error) {
      res.status(500).json({ message: "No se pudo generar el enlace para compartir" });
    }
  });

  // Report whether a share link currently exists for a quote.
  app.get("/api/quotes/:id/share", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const share = await storage.getQuoteShare(id, req.user!.id);
      res.json({ token: share?.token ?? null });
    } catch (error) {
      res.status(500).json({ message: "No se pudo obtener el enlace para compartir" });
    }
  });

  // Revoke the share link. The row is deleted, so sharing again mints a new token
  // and the old link can never come back to life.
  app.delete("/api/quotes/:id/share", async (req, res) => {
    try {
      const id = parseQuoteId(req.params.id);
      if (id === null) {
        return res.status(400).json({ message: "ID de presupuesto inválido" });
      }

      const quote = await storage.getQuote(id, req.user!.id);
      if (!quote) {
        return res.status(404).json({ message: "Presupuesto no encontrado" });
      }

      await storage.deleteQuoteShare(id, req.user!.id);
      res.json({ message: "Enlace desactivado" });
    } catch (error) {
      res.status(500).json({ message: "No se pudo desactivar el enlace" });
    }
  });

  // Public read-only access. This route sits outside the /api/quotes auth mount on
  // purpose: the unguessable token IS the credential. It must never return the
  // owner id, and responses must not be cached or indexed by search engines.
  app.get("/api/shared/:token", async (req, res) => {
    const { token } = req.params;

    if (!SHARE_TOKEN_PATTERN.test(token)) {
      return res.status(404).json({ message: "Enlace no encontrado" });
    }

    try {
      const quote = await storage.getPublicQuoteByToken(token);
      if (!quote) {
        return res.status(404).json({ message: "Enlace no encontrado o desactivado" });
      }

      res.set("Cache-Control", "no-store");
      res.set("X-Robots-Tag", "noindex, nofollow");
      res.json(quote);
    } catch (error) {
      res.status(500).json({ message: "No se pudo obtener el presupuesto" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
