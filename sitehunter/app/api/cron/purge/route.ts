import { db } from "@/lib/db";
/** Retenção de dados: apaga pesquisas com +90 dias, sessões e links de reset expirados. Chamado pelo cron (vercel.json) com Bearer CRON_SECRET. */
export async function GET(req: Request) {
  const s = process.env.CRON_SECRET;
  if (!s || req.headers.get("authorization") !== `Bearer ${s}`) return new Response("Forbidden", { status: 403 });
  const now = new Date();
  const [a, b, c] = await Promise.all([db.searchLog.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 90 * 864e5) } } }), db.session.deleteMany({ where: { expiresAt: { lt: now } } }), db.passwordReset.deleteMany({ where: { expiresAt: { lt: now } } })]);
  await db.rateHit.deleteMany({ where: { resetAt: { lt: now } } });
  return Response.json({ searches: a.count, sessions: b.count, resets: c.count });
}
