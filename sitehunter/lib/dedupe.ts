import type { Business } from "./types";
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const digits = (s?: string) => (s ?? "").replace(/\D/g, "");
function km(a: Business, b: Business) {
  if (a.lat == null || a.lon == null || b.lat == null || b.lon == null) return Infinity;
  const R = 6371, d = Math.PI / 180, dLat = (b.lat - a.lat) * d, dLon = (b.lon - a.lon) * d;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * d) * Math.cos(b.lat * d) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
export function deduplicateBusinesses(list: Business[]): Business[] {
  const out: Business[] = [];
  for (const b of list) {
    const dup = out.find((o) => (digits(b.phone) && digits(b.phone) === digits(o.phone)) || (norm(b.name) === norm(o.name) && km(b, o) < 0.15));
    if (!dup) out.push({ ...b, socials: [...b.socials] });
    else { dup.phone ??= b.phone; dup.rating ??= b.rating; dup.reviews ??= b.reviews; dup.website ??= b.website; dup.address ??= b.address; dup.socials = [...new Set([...dup.socials, ...b.socials])]; }
  }
  return out;
}
