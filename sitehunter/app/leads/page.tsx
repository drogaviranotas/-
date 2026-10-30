"use client";
import { useEffect, useState } from "react";
import { STATUSES } from "@/lib/crm";
import { pitch } from "@/lib/pitch";
const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]), [q, setQ] = useState(""), [st, setSt] = useState(""), [ls, setLs] = useState(""), [msg, setMsg] = useState(""), [sel, setSel] = useState<string[]>([]), [view, setView] = useState<"list" | "board">("list");
  const load = () => fetch("/api/leads").then((r) => (r.status === 401 ? (location.href = "/login", []) : r.json())).then(setLeads);
  useEffect(() => { load(); }, []);
  const patch = (id: string, p: object) => fetch("/api/leads", { method: "PATCH", body: JSON.stringify({ id, ...p }) });
  const del = (id: string) => confirm("Remover este lead?") && fetch("/api/leads?id=" + id, { method: "DELETE" }).then(load);
  const dedupe = async () => { const r = await (await fetch("/api/leads", { method: "PUT" })).json(); setMsg(`${r.removed} duplicado(s) removido(s).`); load(); };
  const bulk = async (status: string) => { if (!status) return; await Promise.all(sel.map((id) => patch(id, { status }))); setSel([]); load(); };
  const lists = [...new Set(leads.map((l) => l.list).filter(Boolean))] as string[];
  const shown = leads.filter((l) => (!st || l.status === st) && (!ls || l.list === ls) && (JSON.stringify(l.snapshot) + l.tags.join(" ")).toLowerCase().includes(q.toLowerCase()));
  const count = (s: string) => leads.filter((l) => l.status === s).length, closed = (l: any) => l.status === "CLIENT" || l.status === "NOT_INTERESTED";
  const overdue = (l: any) => !closed(l) && l.nextActionAt && new Date(l.nextActionAt) < new Date(new Date().toDateString());
  const sum = (f: (l: any) => boolean) => leads.filter(f).reduce((a, l) => a + (l.valueCents ?? 0), 0);
  const qs = (fmt: string) => `/api/export?format=${fmt}` + (sel.length ? sel.map((i) => `&id=${i}`).join("") : ls ? `&list=${encodeURIComponent(ls)}` : "");
  return (<main><header className="top"><h1>Meus leads</h1><a href="/">← Buscar</a></header>
    <div className="filters"><span className="badge s-CONFIRMED">Em aberto: {brl(sum((l) => !closed(l)))}</span><span className="badge s-NO_SITE_FOUND">Fechado: {brl(sum((l) => l.status === "CLIENT"))}</span>
      <span className={`badge ${leads.some(overdue) ? "s-POSSIBLY_INACTIVE" : "s-PENDING"}`}>Ações atrasadas: {leads.filter(overdue).length}</span>
      <span className="muted">{leads.length} leads · conversão {leads.length ? Math.round((count("CLIENT") / leads.length) * 100) : 0}%</span></div>
    <form className="panel" onSubmit={(e) => e.preventDefault()}>
      <input placeholder="Pesquisar nome, tag, telefone…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }} />
      <select value={st} onChange={(e) => setSt(e.target.value)}><option value="">Todos os status</option>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v} ({count(k)})</option>)}</select>
      <select value={ls} onChange={(e) => setLs(e.target.value)}><option value="">Todas as listas</option>{lists.map((l) => <option key={l}>{l}</option>)}</select>
      <button onClick={() => setSel(sel.length === shown.length ? [] : shown.map((l) => l.id))}>{sel.length === shown.length && shown.length ? "Limpar seleção" : "Selecionar todos"}</button>
      <a href={qs("csv")}>CSV{sel.length ? ` (${sel.length})` : ""}</a><a href={qs("xlsx")}>XLSX{sel.length ? ` (${sel.length})` : ""}</a><button onClick={dedupe}>Remover duplicados</button><button onClick={() => setView(view === "list" ? "board" : "list")}>{view === "list" ? "Ver quadro" : "Ver lista"}</button>
      {sel.length > 0 && <select value="" onChange={(e) => bulk(e.target.value)}><option value="">Mudar status de {sel.length}…</option>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>}
    </form>{msg && <p className="muted">{msg}</p>}
    {view === "board" && <div className="board">{Object.entries(STATUSES).map(([k, v]) => (
      <div key={k} className="col" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("id"); if (id) patch(id, { status: k }).then(load); }}>
        <b className="muted">{v} ({shown.filter((l) => l.status === k).length})</b>
        {shown.filter((l) => l.status === k).map((l) => <div key={l.id} className="card mini" draggable onDragStart={(e) => e.dataTransfer.setData("id", l.id)}>{l.snapshot.name}<div className="muted">{l.valueCents != null ? brl(l.valueCents) : ""}</div></div>)}
      </div>))}</div>}
    {view === "list" && <div className="grid">{shown.map((l) => (<div className="card" key={l.id}>
      <div className="row"><label><input type="checkbox" checked={sel.includes(l.id)} onChange={(e) => setSel(e.target.checked ? [...sel, l.id] : sel.filter((x) => x !== l.id))} /> <b>{l.snapshot.name}</b></label><button onClick={() => del(l.id)} aria-label="Remover">✕</button></div>
      <div className="muted">{l.snapshot.phone ?? "Telefone não informado"} · último contato: {l.lastContactAt ? new Date(l.lastContactAt).toLocaleDateString("pt-BR") : "—"} {overdue(l) && <span className="badge s-POSSIBLY_INACTIVE">Atrasado</span>}</div>
      <select value={l.status} onChange={(e) => patch(l.id, { status: e.target.value }).then(load)}>{Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input placeholder="Próxima ação" defaultValue={l.nextAction ?? ""} onBlur={(e) => patch(l.id, { nextAction: e.target.value })} />
      <input type="date" title="Data da próxima ação" defaultValue={l.nextActionAt?.slice(0, 10) ?? ""} onChange={(e) => patch(l.id, { nextActionAt: e.target.value }).then(load)} />
      <input type="number" min={0} placeholder="Valor potencial (R$)" defaultValue={l.valueCents != null ? l.valueCents / 100 : ""} onBlur={(e) => e.target.value && patch(l.id, { valueCents: Math.round(+e.target.value * 100) }).then(load)} />
      <input placeholder="Lista (ex.: Barbearias SP)" defaultValue={l.list ?? ""} onBlur={(e) => patch(l.id, { list: e.target.value }).then(load)} />
      <input placeholder="Tags separadas por vírgula" defaultValue={l.tags.join(", ")} onBlur={(e) => patch(l.id, { tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) })} />
      <textarea placeholder="Notas" defaultValue={l.notes} onBlur={(e) => patch(l.id, { notes: e.target.value })} />
      <div className="actions">{l.snapshot.phone?.startsWith("+") && <a href={`https://wa.me/${l.snapshot.phone.replace(/\D/g, "")}?text=${encodeURIComponent(pitch(l.snapshot.name))}`} target="_blank" rel="noreferrer">WhatsApp</a>}{l.sourceRef && <a href={l.sourceRef} target="_blank" rel="noreferrer">Fonte</a>}</div>
      {l.events?.length > 0 && <details><summary className="muted">Histórico</summary><ul>{l.events.map((ev: any) => <li key={ev.id} className="muted">{new Date(ev.createdAt).toLocaleString("pt-BR")}: {Object.keys(ev.changes).join(", ")}</li>)}</ul></details>}
    </div>))}</div>}</main>);
}
