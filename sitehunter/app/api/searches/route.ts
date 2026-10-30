import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, sameOrigin } from "@/lib/auth";
export async function GET() {
  const u = await currentUser(); if (!u) return NextResponse.json([], { status: 401 });
  const rows = await db.searchLog.findMany({ where: { userId: u.id }, orderBy: [{ favorite: "desc" }, { createdAt: "desc" }], take: 40 });
  const seen = new Set<string>();
  return NextResponse.json(rows.filter((r) => { const k = `${r.location}|${r.category}`.toLowerCase(); return seen.has(k) ? false : (seen.add(k), true); }).slice(0, 10));
}
export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });
  const u = await currentUser(); if (!u) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const b = await req.json().catch(() => null);
  await db.searchLog.updateMany({ where: { id: String(b?.id ?? ""), userId: u.id }, data: { favorite: !!b?.favorite } });
  return NextResponse.json({ ok: true });
}
