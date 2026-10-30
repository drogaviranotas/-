import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { Business, SiteCheck, UrlKind } from "./types";
const SOCIAL = ["facebook.com", "fb.com", "instagram.com", "wa.me", "whatsapp.com", "tiktok.com", "x.com", "twitter.com", "linktr.ee"];
const DIRECTORY = ["tripadvisor.", "yelp.", "foursquare.com", "google.com", "goo.gl", "maps.app.goo.gl", "ifood.com.br", "paginasamarelas", "guiamais", "booking.com"];
export function hostOf(url: string): string | null {
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
}
export function classifyUrl(url: string): UrlKind | null {
  const h = hostOf(url); if (!h) return null;
  if (SOCIAL.some((d) => h === d || h.endsWith("." + d))) return "social";
  if (DIRECTORY.some((d) => h.includes(d))) return "directory";
  return "own";
}
/** Aceita só http(s) com domínio; descarta javascript:, ftp:, hosts sem ponto etc. */
export function safeUrl(raw?: string): string | undefined {
  const s = (raw ?? "").trim(); if (!s || s.length > 500) return undefined;
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(s) && !/^https?:\/\//i.test(s)) return undefined;
  try { const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); return u.hostname.includes(".") ? u.toString() : undefined; } catch { return undefined; }
}
export function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) { const [a, b] = ip.split(".").map(Number); return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224; }
  const v = ip.toLowerCase(); if (v === "::" || v === "::1") return true;
  const m = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); if (m) return isPrivateIp(m[1]);
  return /^f[cd]/.test(v) || /^fe[89ab]/.test(v);
}
/** Anti-SSRF: os sites vêm de dados de terceiros; nunca consultamos endereços internos. */
async function guard(host: string): Promise<"ok" | "blocked" | "nodns"> {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return "blocked";
  if (isIP(h)) return isPrivateIp(h) ? "blocked" : "ok";
  try { const a = await lookup(h, { all: true }); return a.length && a.every((x) => !isPrivateIp(x.address)) ? "ok" : "blocked"; } catch { return "nodns"; }
}
export async function verifyWebsite(url: string, timeoutMs = 4000): Promise<"ok" | "failed" | "inconclusive"> {
  let target: URL; try { target = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`); } catch { return "failed"; }
  const headers = { "user-agent": "SiteHunterBot/0.1 (verificação de disponibilidade)" };
  const hit = (u: URL, method: string) => fetch(u, { method, redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers }); // redirecionamentos seguidos à mão, revalidando cada destino
  for (let hop = 0; hop <= 3; hop++) {
    const g = await guard(target.hostname); if (g === "blocked") return "inconclusive"; if (g === "nodns") return "failed";
    let r: Response;
    try { r = await hit(target, "HEAD"); if (r.status >= 400) r = await hit(target, "GET"); } catch { try { r = await hit(target, "GET"); } catch { return "failed"; } }
    if (r.status >= 300 && r.status < 400) {
      const loc = r.headers.get("location"); if (!loc) return "ok";
      try { target = new URL(loc, target); } catch { return "failed"; }
      if (!/^https?:$/.test(target.protocol)) return "inconclusive"; continue;
    }
    if (r.status < 400) return "ok";
    return r.status === 403 || r.status === 429 ? "inconclusive" : "failed"; // bloqueio de bot não prova que o site esteja fora
  }
  return "inconclusive"; // redirecionamentos demais
}
/** Nunca afirma "sem site" com certeza: apenas "não identificado nas fontes consultadas". */
export function detectSite(b: Business, verify?: "ok" | "failed" | "inconclusive", sourcesConsulted = 1): SiteCheck {
  const checkedAt = new Date().toISOString();
  const kind = b.website ? classifyUrl(b.website) : null;
  if (b.website && kind === "own") {
    if (verify === "ok") return { status: "CONFIRMED", kind, confidence: "high", note: "Site próprio respondeu.", checkedAt };
    if (verify === "failed") return { status: "POSSIBLY_INACTIVE", kind, confidence: "medium", note: "O endereço não respondeu na verificação.", checkedAt };
    return { status: "PENDING", kind, confidence: "low", note: "Site informado, ainda não verificado.", checkedAt };
  }
  const onlySocial = b.website ? kind !== null : b.socials.length > 0;
  const confidence = sourcesConsulted >= 2 ? "medium" : "low";
  return { status: "NO_SITE_FOUND", kind: onlySocial ? (kind ?? "social") : undefined, confidence,
    note: onlySocial ? "Apenas rede social ou diretório identificado." : `Nenhuma URL encontrada em ${sourcesConsulted} fonte(s) consultada(s); não é prova de ausência.`, checkedAt };
}
