import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { STATUSES, type LeadStatus } from "@/lib/crm";
const ATTR = "Dados de OpenStreetMap contributors (ODbL)"; // atribuição exigida
export async function GET(req: Request) {
  const u = await currentUser(); if (!u) return new Response("Não autenticado", { status: 401 });
  const p = new URL(req.url).searchParams, ids = p.getAll("id"), list = p.get("list");
  const leads = await db.lead.findMany({ where: { userId: u.id, ...(ids.length ? { id: { in: ids } } : {}), ...(list ? { list } : {}) } });
  const rows = leads.map((l) => { const s = l.snapshot as any; return { nome: s.name, categoria: s.category, endereco: s.address, telefone: s.phone, site: s.website, redes: s.socials,
    status_site: s.siteStatus, pontuacao: s.score, status_crm: STATUSES[l.status as LeadStatus], lista: l.list, proxima_acao: l.nextAction, valor: l.valueCents != null ? l.valueCents / 100 : "", notas: l.notes, tags: l.tags, fonte: l.source, referencia: l.sourceRef }; });
  const cols = Object.keys(rows[0] ?? { nome: 1 });
  if (p.get("format") === "xlsx") {
    const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet("Leads");
    ws.columns = cols.map((c) => ({ header: c, key: c, width: 22 }));
    rows.forEach((r: any) => ws.addRow(Object.fromEntries(cols.map((c) => [c, Array.isArray(r[c]) ? r[c].join("; ") : r[c] ?? ""]))));
    ws.addRow([]); ws.addRow([ATTR]); ws.getRow(1).font = { bold: true };
    return new Response((await wb.xlsx.writeBuffer()) as ArrayBuffer, { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": 'attachment; filename="sitehunter-leads.xlsx"' } });
  }
  return new Response(toCsv(rows, cols) + `\r\n"${ATTR}"\r\n`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="sitehunter-leads.csv"' } });
}
