import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { limited } from "@/lib/ratelimit";
import { sameOrigin } from "@/lib/auth";
const th = (t: string) => createHash("sha256").update(t).digest("hex");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
/** Recuperação de senha via Resend (RESEND_API_KEY, MAIL_FROM, APP_URL). Sem provedor configurado, informa indisponibilidade. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return bad("Origem inválida", 403);
  const b = await req.json().catch(() => null);
  if (await limited("r:" + (req.headers.get("x-forwarded-for") ?? "local"), 5, 600_000)) return bad("Muitas tentativas. Tente mais tarde.", 429);
  if (b?.action === "request") {
    const { RESEND_API_KEY: key, MAIL_FROM: from, APP_URL: app } = process.env;
    if (!key || !from || !app) return bad("Recuperação de senha indisponível: provedor de e-mail não configurado.", 503);
    const u = await db.user.findUnique({ where: { email: String(b.email ?? "").trim().toLowerCase() } });
    if (u) {
      const t = randomBytes(32).toString("hex");
      await db.passwordReset.create({ data: { tokenHash: th(t), userId: u.id, expiresAt: new Date(Date.now() + 3600_000) } });
      await fetch("https://api.resend.com/emails", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [u.email], subject: "Redefinir senha do SiteHunter", text: `Use este link (válido por 1 hora): ${app}/reset?token=${t}\nSe não foi você, ignore.` }) }).catch(() => {});
    }
    return NextResponse.json({ ok: true }); // resposta idêntica exista ou não o e-mail
  }
  if (b?.action === "confirm") {
    const pw = String(b.password ?? ""); if (pw.length < 10 || pw.length > 200) return bad("Senha de 10+ caracteres.");
    const r = await db.passwordReset.findUnique({ where: { tokenHash: th(String(b.token ?? "")) } });
    if (!r || r.expiresAt < new Date()) return bad("Link inválido ou expirado.");
    await db.$transaction([db.user.update({ where: { id: r.userId }, data: { passwordHash: hashPassword(pw) } }), db.passwordReset.deleteMany({ where: { userId: r.userId } }), db.session.deleteMany({ where: { userId: r.userId } })]);
    return NextResponse.json({ ok: true });
  }
  return bad("Ação inválida");
}
