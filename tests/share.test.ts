import "dotenv/config";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { neon } from "@neondatabase/serverless";
import { storage } from "../server/storage";
import { type NewQuote, type PublicQuote, type Quote } from "../shared/schema";

/**
 * Public share links are a security boundary, so these tests exercise the real
 * Postgres predicates (owner scoping, idempotency, revoke, cascade) instead of
 * mocks. They create and delete their own rows under fixed test owners, so a
 * crashed run self-heals on the next one.
 */

const OWNER_A = "test-user-a";
const OWNER_B = "test-user-b";
// Separate owner so the HTTP suite never races the storage suite's fixtures.
const OWNER_HTTP = "test-user-http";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const PUBLIC_QUOTE_KEYS = [
  "clientAddress",
  "clientName",
  "createdAt",
  "currency",
  "freelancerEmail",
  "freelancerName",
  "freelancerPhone",
  "freelancerTitle",
  "subtotal",
  "tasks",
  "tax",
  "terms",
  "title",
  "total",
].sort();

const skipReason = !process.env.DATABASE_URL
  ? "DATABASE_URL no está definido: se omite la verificación real contra Postgres"
  : false;

if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log(`[tests] base de datos: ${url.hostname}${url.pathname}`);
  } catch {
    // host is only informational
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sampleQuote(ownerId: string, title: string): NewQuote {
  return {
    ownerId,
    title,
    clientName: "Estudio Marfil",
    clientEmail: "secreto@estudiomarfil.test",
    clientAddress: "Av. Siempreviva 742",
    freelancerName: "Ana Pérez",
    freelancerTitle: "Desarrolladora freelance",
    freelancerEmail: "ana@example.test",
    freelancerPhone: "+54 11 5555-1234",
    hourlyRate: 5000,
    hoursPerDay: 8,
    currency: "EUR",
    tasks: [
      { id: "t1", description: "Maquetación del catálogo", type: "project", hours: 10, cost: 700 },
      { id: "t2", description: "Integración de pagos", type: "feature", hours: 4, cost: 534 },
    ],
    subtotal: 123400,
    tax: 0,
    total: 123400,
    terms: "50% al inicio y 50% contra entrega.",
  };
}

async function purgeOwner(ownerId: string): Promise<void> {
  for (const quote of await storage.getQuotes(ownerId)) {
    await storage.deleteQuote(quote.id, ownerId);
  }
}

describe("quote shares · storage", { skip: skipReason }, () => {
  let quoteA: Quote;
  let quoteB: Quote;
  let token: string;

  before(async () => {
    await purgeOwner(OWNER_A);
    await purgeOwner(OWNER_B);
    quoteA = await storage.createQuote(sampleQuote(OWNER_A, "Presupuesto A"));
    quoteB = await storage.createQuote(sampleQuote(OWNER_B, "Presupuesto B"));
  });

  after(async () => {
    if (quoteA) await storage.deleteQuote(quoteA.id, OWNER_A).catch(() => undefined);
    if (quoteB) await storage.deleteQuote(quoteB.id, OWNER_B).catch(() => undefined);
    assert.equal((await storage.getQuotes(OWNER_A)).length, 0, "quedaron presupuestos de prueba");
    assert.equal((await storage.getQuotes(OWNER_B)).length, 0, "quedaron presupuestos de prueba");
  });

  test("no hay enlace antes de compartir", async () => {
    assert.equal(await storage.getQuoteShare(quoteA.id, OWNER_A), undefined);
  });

  test("crear devuelve un token base64url de 43 caracteres", async () => {
    const share = await storage.createQuoteShare(quoteA.id, OWNER_A);
    assert.ok(share);
    assert.match(share.token, TOKEN_PATTERN);
    token = share.token;
  });

  test("compartir dos veces no invalida el enlace ya enviado", async () => {
    const again = await storage.createQuoteShare(quoteA.id, OWNER_A);
    assert.equal(again?.token, token);
  });

  test("getQuoteShare reporta el token vigente", async () => {
    const share = await storage.getQuoteShare(quoteA.id, OWNER_A);
    assert.equal(share?.token, token);
  });

  test("el enlace público expone solo la allowlist de campos", async () => {
    const publicQuote = (await storage.getPublicQuoteByToken(token)) as PublicQuote;
    assert.ok(publicQuote);
    assert.deepEqual(Object.keys(publicQuote).sort(), PUBLIC_QUOTE_KEYS);
    assert.equal(publicQuote.title, "Presupuesto A");
    assert.equal(publicQuote.total, 123400);
    assert.equal(publicQuote.currency, "EUR");
    assert.equal((publicQuote.tasks as unknown[]).length, 2);
    assert.ok(!("ownerId" in publicQuote));
    assert.ok(!("id" in publicQuote));
    assert.ok(!("clientEmail" in publicQuote));
  });

  test("otro dueño no puede leer, crear ni revocar el enlace", async () => {
    assert.equal(await storage.getQuoteShare(quoteA.id, OWNER_B), undefined);
    assert.equal(await storage.createQuoteShare(quoteA.id, OWNER_B), undefined);
    assert.equal(await storage.deleteQuoteShare(quoteA.id, OWNER_B), false);
    // El enlace sigue vivo: el intento ajeno no lo revocó.
    assert.ok(await storage.getPublicQuoteByToken(token));
  });

  test("otro dueño no puede borrar el presupuesto", async () => {
    assert.equal(await storage.deleteQuote(quoteA.id, OWNER_B), false);
  });

  test("un token inexistente no resuelve", async () => {
    assert.equal(await storage.getPublicQuoteByToken("x".repeat(43)), undefined);
  });

  test("revocar invalida el token de inmediato", async () => {
    assert.equal(await storage.deleteQuoteShare(quoteA.id, OWNER_A), true);
    assert.equal(await storage.getPublicQuoteByToken(token), undefined);
  });

  test("volver a compartir emite un token nuevo", async () => {
    const next = await storage.createQuoteShare(quoteA.id, OWNER_A);
    assert.ok(next);
    assert.notEqual(next.token, token);
    assert.match(next.token, TOKEN_PATTERN);
    token = next.token;
  });

  test("borrar el presupuesto borra la fila de quote_shares (cascade)", async () => {
    const quoteId = quoteA.id;
    assert.equal(await storage.deleteQuote(quoteId, OWNER_A), true);
    assert.equal(await storage.getPublicQuoteByToken(token), undefined);

    const sql = neon(process.env.DATABASE_URL!);
    const rows = (await sql`
      select count(*)::int as count from quote_shares where quote_id = ${quoteId}
    `) as Array<{ count: number }>;
    assert.equal(rows[0]?.count, 0);
  });
});

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(base: string, timeoutMs = 40_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {
      // not listening yet
    }
    await sleep(250);
  }
  throw new Error(`el servidor no arrancó en ${base}`);
}

const httpSkipReason = skipReason
  ? skipReason
  : !existsSync("dist/index.js")
    ? "falta dist/: corré `npm run build` antes de `npm test`"
    : false;

describe("quote shares · HTTP", { skip: httpSkipReason }, () => {
  let server: ChildProcess;
  let base: string;
  let quote: Quote;
  let token: string;
  let serverLog = "";

  before(async () => {
    const port = await getFreePort();
    base = `http://127.0.0.1:${port}`;

    server = spawn(process.execPath, ["dist/index.js"], {
      env: { ...process.env, NODE_ENV: "production", PORT: String(port) },
      stdio: ["ignore", "pipe", "pipe"],
    });
    server.stdout?.on("data", (chunk) => {
      serverLog += String(chunk);
    });
    server.stderr?.on("data", (chunk) => {
      serverLog += String(chunk);
    });

    await waitForServer(base);

    await purgeOwner(OWNER_HTTP);
    quote = await storage.createQuote(sampleQuote(OWNER_HTTP, "Presupuesto HTTP"));
    token = (await storage.createQuoteShare(quote.id, OWNER_HTTP))!.token;
  });

  after(async () => {
    if (quote) await storage.deleteQuote(quote.id, OWNER_HTTP).catch(() => undefined);
    if (server?.pid) {
      server.kill();
      await sleep(400);
      try {
        process.kill(server.pid, "SIGKILL");
      } catch {
        // already gone
      }
    }
  });

  test("la API pública responde 200 con headers que impiden cachear e indexar", async () => {
    const response = await fetch(`${base}/api/shared/${token}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
  });

  test("la API pública no filtra datos internos", async () => {
    const response = await fetch(`${base}/api/shared/${token}`);
    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;

    assert.deepEqual(Object.keys(body).sort(), PUBLIC_QUOTE_KEYS);
    assert.ok(!text.includes("ownerId"));
    assert.ok(!text.includes("secreto@estudiomarfil.test"));
    assert.equal(body.total, 123400);
  });

  test("la página /s/:token sirve el shell y no se indexa ni filtra el referrer", async () => {
    const response = await fetch(`${base}/s/${token}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /id="root"/);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  test("tokens desconocidos o malformados devuelven 404", async () => {
    assert.equal((await fetch(`${base}/api/shared/${"x".repeat(43)}`)).status, 404);
    assert.equal((await fetch(`${base}/api/shared/short`)).status, 404);
  });

  test("los endpoints de gestión exigen autenticación", async () => {
    assert.equal((await fetch(`${base}/api/quotes/${quote.id}/share`, { method: "POST" })).status, 401);
    assert.equal((await fetch(`${base}/api/quotes/${quote.id}/share`)).status, 401);
    assert.equal((await fetch(`${base}/api/quotes/${quote.id}/share`, { method: "DELETE" })).status, 401);
  });

  test("el token nunca aparece en los logs y la ruta se redacta", async () => {
    await fetch(`${base}/api/shared/${token}`);
    await sleep(400);

    assert.ok(!serverLog.includes(token), "el token quedó escrito en los logs");
    assert.match(serverLog, /\/api\/shared\/:token/);
    assert.ok(!serverLog.includes("subtotal"), "se está logueando el cuerpo de la respuesta");
  });

  test("revocar corta el acceso público", async () => {
    assert.equal(await storage.deleteQuoteShare(quote.id, OWNER_HTTP), true);
    assert.equal((await fetch(`${base}/api/shared/${token}`)).status, 404);
  });
});
