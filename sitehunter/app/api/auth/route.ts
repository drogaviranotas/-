import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { limited } from "@/lib/ratelimit";
import { startSession, endSession, currentUser, sameOrigin } from "@/lib/auth";
const DUMMY = hashPassword("senha-ficticia-para-tempo-constante");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
export async function POST(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const b = await req.json().catch(() => null);
  const email = String(b?.email ?? "").trim().toLowerCase(), password = String(b?.password ?? "");
  if (await limited("a:" + (req.headers.get("x-forwarded-for") ?? "local") + email, 8, 300_000)) return bad("Muitas tentativas. Tente em alguns minutos.", 429);
  if (b?.action === "logout") { await endSession(); return NextResponse.json({ ok: true }); }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || password.length < 10 || password.length > 200) return bad("E-mail válido e senha de 10+ caracteres são obrigatórios.");
  if (b.action === "register") {
    if (await db.user.findUnique({ where: { email } })) return bad("Não foi possível cadastrar este e-mail.", 409);
    const u = await db.user.create({ data: { email, passwordHash: hashPassword(password) } });
    await startSession(u.id); return NextResponse.json({ ok: true });
  }
  if (b.action === "login") {
    const u = await db.user.findUnique({ where: { email } });
    const okPw = verifyPassword(password, u?.passwordHash ?? DUMMY); // mesmo custo exista o usuário ou não
    if (!u || !okPw) return bad("Credenciais inválidas.", 401);
    await startSession(u.id); return NextResponse.json({ ok: true });
  }
  return bad("Ação inválida");
}
/** LGPD/GDPR: exclui a conta e, em cascata, sessões, leads, histórico e pesquisas. */
export async function DELETE() {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const u = await currentUser(); if (!u) return bad("Não autenticado", 401);
  await db.user.delete({ where: { id: u.id } }); await endSession();
  return NextResponse.json({ ok: true });
}
