import type { Business, SiteCheck } from "./types";
/** Dados ausentes são neutros: só evidências positivas somam pontos. Estimativa, não certeza de compra. */
export function scoreLead(b: Business, c: SiteCheck): { score: number; reasons: string[] } {
  let s = 20; const r: string[] = ["Base: 20"];
  const add = (n: number, why: string) => { s += n; r.push(`${n > 0 ? "+" : ""}${n} ${why}`); };
  if (c.status === "NO_SITE_FOUND") add(c.confidence === "low" ? 25 : 35, c.kind ? "presença digital limitada a rede social/diretório" : "nenhum site identificado");
  if (c.status === "POSSIBLY_INACTIVE") add(20, "site informado não respondeu");
  if (b.phone) add(10, "telefone comercial disponível");
  if (b.reviews !== undefined) add(Math.min(10, Math.floor(b.reviews / 10)), "avaliações públicas indicam atividade");
  if (b.rating !== undefined && b.rating >= 4) add(5, "boa avaliação média");
  if (b.address) add(5, "endereço público registrado");
  return { score: Math.max(0, Math.min(100, s)), reasons: r };
}
