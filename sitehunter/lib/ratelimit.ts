import { db } from "./db";
const mem = new Map<string, number[]>();
function memLimited(key: string, max: number, windowMs: number) {
  const now = Date.now(), r = (mem.get(key) ?? []).filter((t) => now - t < windowMs);
  if (r.length >= max) { mem.set(key, r); return true; }
  mem.set(key, [...r, now]); return false;
}
/** Limite compartilhado entre instâncias via banco (tabela RateHit). Se o banco falhar, cai para memória local. */
export async function limited(key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const now = new Date(), row = await db.rateHit.findUnique({ where: { key } }), resetAt = new Date(+now + windowMs);
    if (!row || row.resetAt < now) { await db.rateHit.upsert({ where: { key }, update: { count: 1, resetAt }, create: { key, count: 1, resetAt } }); return false; }
    if (row.count >= max) return true;
    await db.rateHit.update({ where: { key }, data: { count: { increment: 1 } } }); return false;
  } catch { return memLimited(key, max, windowMs); }
}
