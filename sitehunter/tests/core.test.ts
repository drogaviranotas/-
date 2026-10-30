import { describe, it, expect } from "vitest";
import { classifyUrl, detectSite } from "@/lib/website";
import { deduplicateBusinesses } from "@/lib/dedupe";
import { scoreLead } from "@/lib/score";
import { normalizeBusiness } from "@/lib/providers/overpass";
import { searchAll } from "@/lib/search";
const base = { id: "t1", source: "TESTE", sourceRef: "", name: "Fictícia Teste", socials: [] as string[] }; // dado fictício só para teste
describe("detecção de site", () => {
  it("distingue rede social, diretório e site próprio", () => {
    expect(classifyUrl("https://instagram.com/x")).toBe("social");
    expect(classifyUrl("https://www.tripadvisor.com/x")).toBe("directory");
    expect(classifyUrl("https://meusite.com.br")).toBe("own");
  });
  it("ausência de URL é 'sem site identificado' com confiança baixa, não certeza", () => {
    const c = detectSite(base); expect(c.status).toBe("NO_SITE_FOUND"); expect(c.confidence).toBe("low");
  });
  it("site que falhou é possivelmente inativo; não verificado é pendente", () => {
    expect(detectSite({ ...base, website: "https://a.com" }, "failed").status).toBe("POSSIBLY_INACTIVE");
    expect(detectSite({ ...base, website: "https://a.com" }, "inconclusive").status).toBe("PENDING");
  });
});
it("normaliza OSM: site em rede social vira social", () => {
  const b = normalizeBusiness({ type: "node", id: 1, lat: 1, lon: 2, tags: { name: "X", website: "https://facebook.com/x" } })!;
  expect(b.website).toBeUndefined(); expect(b.socials).toHaveLength(1);
});
it("deduplica por telefone", () => {
  expect(deduplicateBusinesses([{ ...base, phone: "+55 11 9999-0000" }, { ...base, id: "t2", name: "Outro nome", phone: "5511 99990000" }])).toHaveLength(1);
});
it("pontuação é explicável e dados ausentes não penalizam", () => {
  const c = detectSite(base); const { score, reasons } = scoreLead(base, c);
  expect(score).toBeGreaterThanOrEqual(20); expect(reasons.length).toBeGreaterThan(1);
});
it("falha de provedor vira resultado parcial", async () => {
  const bad = { name: "Falha", isConfigured: () => true, searchBusinesses: async () => { throw new Error("boom"); } };
  const r = await searchAll({ location: "x", category: "y" }, [bad]); expect(r.partial).toBe(true); expect(r.results).toEqual([]);
});
