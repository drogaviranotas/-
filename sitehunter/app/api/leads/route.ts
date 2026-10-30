import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, sameOrigin } from "@/lib/auth";
import { planOf } from "@/lib/plans";
import { findDuplicateIds } from "@/lib/leaddupes";
import { STATUSES } from "@/lib/crm";
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
export async function GET() {
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  return NextResponse.json(await db.lead.findMany({ where: { userId: u.id }, orderBy: { updatedAt: "desc" }, take: 500, include: { events: { orderBy: { createdAt: "desc" }, take: 3 } } }));
}
export async function POST(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const b = (await req.json().catch(() => null))?.business;
  if (typeof b?.id !== "string" || typeof b?.name !== "string") return bad("Empresa inválida");
  if ((await db.lead.count({ where: { userId: u.id } })) >= planOf(u.plan).leads) return bad("Limite de leads do plano atingido.", 402);
  if (b.id.length > 200) return bad("Empresa inválida");
  const cut = (v: unknown, n = 300) => (typeof v === "string" ? v.slice(0, n) : undefined), num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : undefined);
  const snapshot = { name: b.name.slice(0, 200), category: cut(b.category), address: cut(b.address), phone: cut(b.phone, 40), website: cut(b.website, 500), socials: Array.isArray(b.socials) ? b.socials.slice(0, 10).map((x: unknown) => cut(x, 500)) : [], lat: num(b.lat), lon: num(b.lon), siteStatus: cut(b.check?.status, 30), score: num(b.score) };
  const lead = await db.lead.upsert({ where: { userId_businessId: { userId: u.id, businessId: b.id } }, update: {},
    create: { userId: u.id, businessId: b.id, source: String(b.source ?? "").slice(0, 50), sourceRef: /^https?:\/\//.test(String(b.sourceRef)) ? String(b.sourceRef).slice(0, 500) : undefined, snapshot, tags: [] } });
  return NextResponse.json(lead);
}
export async function PATCH(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const b = await req.json().catch(() => null);
  const lead = typeof b?.id === "string" ? await db.lead.findFirst({ where: { id: b.id, userId: u.id } }) : null; // isolamento por usuário
  if (!lead) return bad("Lead não encontrado", 404);
  const d: Record<string, unknown> = {};
  if (b.status !== undefined) { if (!(b.status in STATUSES)) return bad("Status inválido"); d.status = b.status; if (b.status === "CONTACTED") d.lastContactAt = new Date(); }
  if (typeof b.notes === "string") d.notes = b.notes.slice(0, 5000);
  if (typeof b.list === "string") d.list = b.list.trim().slice(0, 40) || null;
  if (typeof b.nextActionAt === "string") { const dt = b.nextActionAt ? new Date(b.nextActionAt) : null; if (dt && isNaN(+dt)) return bad("Data inválida"); d.nextActionAt = dt; }
  if (typeof b.nextAction === "string") d.nextAction = b.nextAction.slice(0, 300);
  if (Number.isInteger(b.valueCents) && b.valueCents >= 0) d.valueCents = b.valueCents;
  if (Array.isArray(b.tags)) d.tags = b.tags.slice(0, 20).map((t: unknown) => String(t).slice(0, 30));
  if (!Object.keys(d).length) return bad("Nada para atualizar");
  const [updated] = await db.$transaction([db.lead.update({ where: { id: lead.id }, data: d as any }), db.leadEvent.create({ data: { leadId: lead.id, changes: d as any } })]);
  return NextResponse.json(updated);
}
export async function DELETE(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const id = new URL(req.url).searchParams.get("id") ?? "";
  await db.lead.deleteMany({ where: { id, userId: u.id } }); return NextResponse.json({ ok: true });
}
export async function PUT() { // remove duplicados do usuário
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  const ids = findDuplicateIds(await db.lead.findMany({ where: { userId: u.id }, select: { id: true, createdAt: true, snapshot: true } }));
  await db.lead.deleteMany({ where: { id: { in: ids }, userId: u.id } });
  return NextResponse.json({ removed: ids.length });
}
