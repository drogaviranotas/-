import { NextResponse } from "next/server";
import { searchAll } from "@/lib/search";
import { currentUser, sameOrigin } from "@/lib/auth";
import { db } from "@/lib/db";
import { planOf } from "@/lib/plans";
import { limited } from "@/lib/ratelimit";
export const maxDuration = 60;
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
/** Resposta em NDJSON: progress → partial → done (ou error). */
async function handle(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Faça login para buscar.", 401);
  if (await limited("s:" + u.id, 10, 60_000)) return bad("Muitas requisições. Aguarde um minuto.", 429);
  const b = await req.json().catch(() => null);
  const location = String(b?.location ?? "").trim().slice(0, 120), category = String(b?.category ?? "").trim().slice(0, 60);
  if (!location || !category) return bad("Informe localização e categoria.");
  const used = await db.searchLog.count({ where: { userId: u.id, createdAt: { gte: new Date(Date.now() - 864e5) } } }), max = planOf(u.plan).searchesPerDay;
  if (used >= max) return bad(`Limite diário do plano atingido (${max} buscas).`, 429);
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(c) {
      const send = (o: object) => c.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        const out = await searchAll({ location, category }, undefined, send);
        await db.searchLog.create({ data: { userId: u.id, location, category, count: out.results.length } });
        send({ type: "done", ...out, usage: { used: used + 1, max } });
      } catch (e) { send({ type: "error", error: (e as Error).message }); }
      c.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" } });
}
export async function POST(req: Request) {
  try { return await handle(req); }
  catch (e) { console.error("[search]", e); return bad(process.env.NODE_ENV === "production" ? "Erro interno do servidor." : `Erro interno: ${(e as Error).message}`, 500); }
}
