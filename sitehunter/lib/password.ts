import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
export function hashPassword(p: string) { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(p, salt, 64).toString("hex")}`; }
export function verifyPassword(p: string, stored: string) {
  const [salt, h] = stored.split(":"); if (!salt || !h) return false;
  const a = Buffer.from(h, "hex"), b = scryptSync(p, salt, 64); return a.length === b.length && timingSafeEqual(a, b);
}
