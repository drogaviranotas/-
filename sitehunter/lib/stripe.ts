import { createHmac, timingSafeEqual } from "crypto";
/** Valida o cabeçalho Stripe-Signature (t=...,v1=...) com tolerância de 5 minutos. */
export function verifyStripeSignature(raw: string, header: string | null, secret: string, now = Date.now()): boolean {
  if (!header) return false;
  const p = Object.fromEntries(header.split(",").map((x) => x.split("=") as [string, string])), t = p.t, v = p.v1;
  if (!t || !v || Math.abs(now / 1000 - Number(t)) > 300) return false;
  const a = Buffer.from(createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex")), b = Buffer.from(v);
  return a.length === b.length && timingSafeEqual(a, b);
}
