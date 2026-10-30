"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Badge, Button, Card } from "@/components/ui";
import { pitch } from "@/lib/pitch";
import type { Scored } from "@/lib/types";
import { toCsv } from "@/lib/csv";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false, loading: () => <div className="map" /> });
const LABEL = { NO_SITE_FOUND: "Sem site identificado", CONFIRMED: "Site confirmado", PENDING: "Verificação pendente", POSSIBLY_INACTIVE: "Site possivelmente inativo" } as const;
const CATS = ["restaurante", "cafeteria", "barbearia", "salao", "dentista", "oficina", "academia", "petshop", "roupas", "mercado", "imobiliaria", "advocacia", "hotel"];
const PAGE = 12;
type Data = { results: Scored[]; errors: string[]; sources: string[]; usage?: { used: number; max: number } };
export default function Home() {
  const [data, setData] = useState<Data | null>(null), [loading, setLoading] = useState(false), [err, setErr] = useState(""), [prog, setProg] = useState(""), [saved, setSaved] = useState<string[]>([]), [detail, setDetail] = useState<Scored | null>(null);
  const [f, setF] = useState({ noSite: true, phone: false, social: false, minRating: 0, minReviews: 0, sort: "score" }), [view, setView] = useState<"list" | "map">("list"), [n, setN] = useState(PAGE), [sel, setSel] = useState("");
  const formRef = useRef<HTMLFormElement>(null), tmr = useRef<any>(null), [hist, setHist] = useState<any[]>([]), [geo, setGeo] = useState<string[]>([]);
  const loadHist = () => fetch("/api/searches").then((r) => (r.ok ? r.json() : [])).then(setHist);
  useEffect(() => { loadHist(); }, []);
  const suggest = (q: string) => { clearTimeout(tmr.current); if (q.length < 3) return; tmr.current = setTimeout(() => fetch("/api/geocode?q=" + encodeURIComponent(q)).then((r) => r.json()).then((j) => setGeo(j.items ?? [])).catch(() => {}), 400); };
  const fav = (h: any) => fetch("/api/searches", { method: "PATCH", body: JSON.stringify({ id: h.id, favorite: !h.favorite }) }).then(loadHist);
  const refill = (h: any) => { const el = formRef.current!.elements; (el.namedItem("location") as HTMLInputElement).value = h.location; (el.namedItem("custom") as HTMLInputElement).value = h.category; };
  const set = (p: Partial<typeof f>) => { setF({ ...f, ...p }); setN(PAGE); };
  async function go(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setErr(""); setN(PAGE); setData(null);
    const fd = new FormData(e.currentTarget), category = String(fd.get("custom") || fd.get("category"));
    const r = await fetch("/api/search", { method: "POST", body: JSON.stringify({ location: fd.get("location"), category }) });
    if (!r.ok || !r.body) { const j = await r.json().catch(() => ({})); if (r.status === 401) location.href = "/login"; else setErr(j.error ?? `Erro na busca (HTTP ${r.status}). Abra /api/health e veja o terminal do servidor.`); }
    else {
      const rd = r.body.getReader(), dec = new TextDecoder(); let buf = "";
      for (;;) {
        const { done, value } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true }); const lines = buf.split("\n"); buf = lines.pop()!;
        for (const ln of lines) { if (!ln) continue; const ev = JSON.parse(ln);
          if (ev.type === "progress") setProg(ev.msg); else if (ev.type === "partial") setData({ results: ev.results, errors: [], sources: [] }); else if (ev.type === "done") setData(ev); else if (ev.type === "error") setErr(ev.error); }
      }
    }
    setProg("");
    setLoading(false); loadHist();
  }
  async function save(b: Scored) { const r = await fetch("/api/leads", { method: "POST", body: JSON.stringify({ business: b }) }); if (r.status === 401) location.href = "/login"; else if (r.ok) setSaved((x) => [...x, b.id]); else setErr((await r.json()).error); }
  const list = useMemo(() => (data?.results ?? [])
    .filter((b) => (!f.noSite || b.check.status === "NO_SITE_FOUND") && (!f.phone || b.phone) && (!f.social || b.socials.length > 0) && (!f.minRating || (b.rating ?? 0) >= f.minRating) && (!f.minReviews || (b.reviews ?? 0) >= f.minReviews))
    .sort((a, b) => f.sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : f.sort === "reviews" ? (b.reviews ?? 0) - (a.reviews ?? 0) : b.score - a.score), [data, f]);
  const pick = useCallback((id: string) => { setSel(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }); }, []);
  function exportCsv() { // fontes com restrição de exportação (Google) ficam de fora
    const rows = list.filter((b) => b.source !== "Google Places").map((b) => ({ nome: b.name, categoria: b.category, endereco: b.address, telefone: b.phone, site: b.website, redes: b.socials, status_site: LABEL[b.check.status], pontuacao: b.score, fonte: b.source, referencia: b.sourceRef }));
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([toCsv(rows, ["nome", "categoria", "endereco", "telefone", "site", "redes", "status_site", "pontuacao", "fonte", "referencia"])], { type: "text/csv" })); a.download = "resultados.csv"; a.click();
  }
  const logout = () => fetch("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) }).then(() => { location.href = "/login"; });
  async function saveAs(b: Scored, status?: string) {
    const r = await fetch("/api/leads", { method: "POST", body: JSON.stringify({ business: b }) });
    if (r.status === 401) { location.href = "/login"; return; }
    const lead = await r.json(); if (!r.ok) { setErr(lead.error); return; }
    if (status) await fetch("/api/leads", { method: "PATCH", body: JSON.stringify({ id: lead.id, status }) });
    setSaved((x) => [...x, b.id]);
  }
  async function exportXlsx() { // Google Places fica de fora (licença); servidor revalida
    const items = list.filter((b) => b.source !== "Google Places").map((b) => ({ nome: b.name, categoria: b.category, endereco: b.address, telefone: b.phone, site: b.website, redes: b.socials.join("; "), status_site: LABEL[b.check.status], pontuacao: b.score, fonte: b.source, referencia: b.sourceRef }));
    const r = await fetch("/api/export/results", { method: "POST", body: JSON.stringify({ items: items.map((i) => ({ ...i, fonte: i.fonte })) }) });
    if (!r.ok) return setErr("Falha ao exportar XLSX.");
    const a = document.createElement("a"); a.href = URL.createObjectURL(await r.blob()); a.download = "resultados.xlsx"; a.click();
  }
  const theme = () => { const r = document.documentElement; r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark"; };
  return (<main>
    <header className="top"><h1>SiteHunter</h1><nav className="row" style={{ gap: 14 }}>{data?.usage && <span className="muted">{data.usage.used}/{data.usage.max} buscas hoje</span>}<a href="/leads">Meus leads</a><a href="/plans">Planos</a><button onClick={logout}>Sair</button><button onClick={theme} aria-label="Alternar tema">◐</button></nav></header>
    <form className="panel" ref={formRef} onSubmit={go}>
      <input name="location" list="geo" onChange={(e) => suggest(e.target.value)} placeholder="Cidade, bairro, região ou país" required style={{ flex: "1 1 240px" }} /><datalist id="geo">{geo.map((g) => <option key={g} value={g} />)}</datalist>
      <select name="category">{CATS.map((c) => <option key={c}>{c}</option>)}</select>
      <input name="custom" placeholder="ou categoria personalizada" />
      <button className="primary" disabled={loading}>{loading && <span className="spin" />}{loading ? prog || "Buscando…" : "Buscar empresas"}</button>
    </form>
    <div className="filters">
      <label><input type="checkbox" checked={f.noSite} onChange={(e) => set({ noSite: e.target.checked })} />só sem site identificado</label>
      <label><input type="checkbox" checked={f.phone} onChange={(e) => set({ phone: e.target.checked })} />com telefone</label>
      <label><input type="checkbox" checked={f.social} onChange={(e) => set({ social: e.target.checked })} />com redes sociais</label>
      <label>nota mín. <input type="number" min={0} max={5} step={0.5} value={f.minRating} onChange={(e) => set({ minRating: +e.target.value })} style={{ width: 64 }} /></label>
      <label>avaliações mín. <input type="number" min={0} value={f.minReviews} onChange={(e) => set({ minReviews: +e.target.value })} style={{ width: 72 }} /></label>
      <label>ordenar <select value={f.sort} onChange={(e) => set({ sort: e.target.value })}><option value="score">potencial</option><option value="rating">avaliação</option><option value="reviews">nº de avaliações</option></select></label>
      <button onClick={() => setView(view === "list" ? "map" : "list")}>{view === "list" ? "Ver mapa" : "Ver lista"}</button>
      {list.length > 0 && <button onClick={exportCsv}>Exportar CSV</button>}{list.length > 0 && <button onClick={exportXlsx}>Exportar XLSX</button>}
    </div>
    {hist.length > 0 && <div className="filters">{hist.map((h) => <span key={h.id} className="row" style={{ gap: 2 }}><button onClick={() => refill(h)}>{h.category} · {h.location}</button><button onClick={() => fav(h)} aria-label="Favoritar">{h.favorite ? "★" : "☆"}</button></span>)}</div>}
    {err && <p role="alert" className="panel">{err}</p>}
    {data?.errors.map((m) => <p key={m} className="muted">⚠ {m}</p>)}
    {data && <p className="muted"><b>{list.length}</b> de {data.results.length} resultados · fontes: {data.sources.join(", ")}</p>}
    {loading && !data?.results.length && <div className="grid">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="card sk" style={{ height: 190 }} />)}</div>}
    {view === "map" && <MapView items={list} onPick={pick} />}
    {<div className="grid">{list.slice(0, n).map((b) => (
      <div className={`card${sel === b.id ? " sel" : ""}`} id={b.id} key={b.id}>
        <div className="row"><div><b>{b.name}</b><div className="muted">{b.category ?? "Categoria não informada"}</div></div><span className="ring" style={{ ["--p" as any]: b.score }} data-v={b.score} title="Potencial comercial (0–100)" /></div>
        <div><span className={`badge s-${b.check.status}`}>{LABEL[b.check.status]}</span> <span className="muted">confiança {b.check.confidence}</span></div>
        <div className="muted">{b.address ?? "Endereço não informado"}{b.rating != null && ` · ★ ${b.rating} (${b.reviews ?? 0})`}</div>
        {b.socials.length > 0 && <div className="muted">Redes/diretórios: {b.socials.length}</div>}
        <details><summary className="muted">Por que esta nota? {b.check.note}</summary><ul>{b.reasons.map((r) => <li key={r}>{r}</li>)}</ul></details>
        <div className="muted">Fonte: <a href={b.sourceRef} target="_blank" rel="noreferrer">{b.source}</a> · verificado em {new Date(b.check.checkedAt).toLocaleDateString("pt-BR")}</div>
        <div className="actions"><button onClick={() => setDetail(b)}>Detalhes</button>
          {b.phone && <a href={`tel:${b.phone}`}>Ligar</a>}
          {b.phone?.startsWith("+") && <a href={`https://wa.me/${b.phone.replace(/\D/g, "")}?text=${encodeURIComponent(pitch(b.name))}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          {b.lat != null && <a href={`https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lon}#map=18/${b.lat}/${b.lon}`} target="_blank" rel="noreferrer">Mapa</a>}
          {b.website && <a href={b.website} target="_blank" rel="noreferrer">Site</a>}
          <button disabled={saved.includes(b.id)} onClick={() => save(b)}>{saved.includes(b.id) ? "Salvo ✓" : "Salvar lead"}</button>
        </div></div>))}</div>}
    {list.length > n && <p style={{ textAlign: "center" }}><button onClick={() => setN(n + PAGE)}>Carregar mais</button></p>}
    {data && !list.length && <p className="muted">Nenhum resultado com estes filtros.</p>}
    {detail && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setDetail(null)}>
      <Card className="max-h-[85vh] w-full max-w-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3"><div><b className="text-lg">{detail.name}</b><div className="muted">{detail.category ?? "Categoria não informada"}</div></div><Button variant="ghost" onClick={() => setDetail(null)} aria-label="Fechar">✕</Button></div>
        <p><Badge className={`s-${detail.check.status}`}>{LABEL[detail.check.status]}</Badge> <span className="muted">confiança {detail.check.confidence} · potencial {detail.score}/100</span></p>
        <p className="muted">{detail.check.note}</p>
        <ul className="list-disc pl-5 text-sm">{detail.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        <dl className="mt-3 grid gap-1 text-sm"><dt className="muted">Endereço</dt><dd>{detail.address ?? "Não informado"}</dd><dt className="muted">Telefone</dt><dd>{detail.phone ?? "Não informado"}</dd>
          <dt className="muted">Site</dt><dd>{detail.website ? <a href={detail.website} target="_blank" rel="noreferrer">{detail.website}</a> : "Não informado"}</dd>
          <dt className="muted">Redes e diretórios</dt><dd>{detail.socials.length ? detail.socials.map((s) => /^https?:\/\//.test(s) ? <div key={s}><a href={s} target="_blank" rel="noreferrer">{s}</a></div> : <div key={s}>{s}</div>) : "Não informado"}</dd>
          <dt className="muted">Fonte</dt><dd><a href={detail.sourceRef} target="_blank" rel="noreferrer">{detail.source}</a> · verificado em {new Date(detail.check.checkedAt).toLocaleString("pt-BR")}</dd></dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => saveAs(detail)} disabled={saved.includes(detail.id)}>{saved.includes(detail.id) ? "Salvo ✓" : "Salvar lead"}</Button>
          <Button onClick={() => saveAs(detail, "CONTACTED")}>Marcar como contatada</Button><Button onClick={() => saveAs(detail, "CLIENT")}>Marcar como cliente</Button>
          <Button onClick={() => navigator.clipboard.writeText(pitch(detail.name))}>Copiar mensagem</Button></div>
      </Card></div>}
  </main>);
}
