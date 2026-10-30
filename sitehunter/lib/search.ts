import type { Provider, Scored, SearchQuery } from "./types";
import { overpass } from "./providers/overpass";
import { google } from "./providers/google";
import { deduplicateBusinesses } from "./dedupe";
import { detectSite, verifyWebsite } from "./website";
import { scoreLead } from "./score";
export const providers: Provider[] = [google, overpass]; // adicione novas fontes aqui
export type Out = { results: Scored[]; errors: string[]; sources: string[]; partial: boolean };
type Verdict = "ok" | "failed" | "inconclusive";
const searchCache = new Map<string, { at: number; v: Out }>(), siteCache = new Map<string, { at: number; v: Verdict }>();
const fresh = (at: number, ttl: number) => Date.now() - at < ttl;
/** `emit` envia progresso e resultados parciais (antes da verificação dos sites) para o stream da API. */
export async function searchAll(q: SearchQuery, list: Provider[] = providers, emit: (e: any) => void = () => {}): Promise<Out> {
  const key = `${q.location.toLowerCase()}|${q.category.toLowerCase()}`, useCache = list === providers;
  const hit = useCache ? searchCache.get(key) : undefined; if (hit && fresh(hit.at, 10 * 60_000)) return hit.v;
  emit({ type: "progress", msg: "Consultando fontes…" });
  const active = list.filter((p) => p.isConfigured());
  const errors = list.filter((p) => !p.isConfigured()).map((p) => `${p.name}: não configurado`);
  const settled = await Promise.allSettled(active.map((p) => p.searchBusinesses(q)));
  const all: any[] = [];
  settled.forEach((r, i) => (r.status === "fulfilled" ? all.push(...r.value) : errors.push(`${active[i].name}: ${(r.reason as Error).message}`)));
  const unique = deduplicateBusinesses(all);
  const build = (v: Map<string, Verdict>) => unique.map((b) => { const check = detectSite(b, v.get(b.id), active.length); return { ...b, check, ...scoreLead(b, check) }; }).sort((a, b) => b.score - a.score);
  const verdict = new Map<string, Verdict>(), withSite = unique.filter((b) => b.website);
  emit({ type: "partial", results: build(verdict) }); // cards aparecem já, antes de verificar os sites
  for (let i = 0; i < withSite.length; i += 16) {
    await Promise.all(withSite.slice(i, i + 16).map(async (b) => {
      const c = siteCache.get(b.website!), v = c && fresh(c.at, 3600_000) ? c.v : await verifyWebsite(b.website!);
      siteCache.set(b.website!, { at: Date.now(), v }); verdict.set(b.id, v);
    }));
    emit({ type: "progress", msg: `Verificando sites ${Math.min(i + 16, withSite.length)}/${withSite.length}…` });
  }
  const out = { results: build(verdict), errors, sources: active.map((p) => p.name), partial: errors.length > 0 };
  if (useCache && out.results.length && !out.sources.includes("Google Places")) searchCache.set(key, { at: Date.now(), v: out });
  return out;
}
