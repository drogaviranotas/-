import { randomBytes, createHash } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "./db";
const th = (t: string) => createHash("sha256").update(t).digest("hex");
const DAYS = 7;
export async function startSession(userId: string) {
  const t = randomBytes(32).toString("hex");
  await db.session.create({ data: { tokenHash: th(t), userId, expiresAt: new Date(Date.now() + DAYS * 864e5) } });
  (await cookies()).set("sh_session", t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: DAYS * 86400 });
}
export async function endSession() {
  const c = await cookies(), t = c.get("sh_session")?.value;
  if (t) await db.session.deleteMany({ where: { tokenHash: th(t) } });
  c.delete("sh_session");
}
export async function currentUser() {
  const t = (await cookies()).get("sh_session")?.value; if (!t) return null;
  const s = await db.session.findUnique({ where: { tokenHash: th(t) }, include: { user: true } });
  return s && s.expiresAt > new Date() ? s.user : null;
}
/** Proteção CSRF extra para mutações: Origin deve coincidir com o Host (além de SameSite=Lax). */
export async function sameOrigin() {
  const h = await headers(), o = h.get("origin"); if (!o) return true;
  try { return new URL(o).host === h.get("host"); } catch { return false; }
}
