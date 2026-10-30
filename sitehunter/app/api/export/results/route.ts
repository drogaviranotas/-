import { currentUser, sameOrigin } from "@/lib/auth";
import { buildXlsx } from "@/lib/xlsx";
const COLS = ["nome", "categoria", "endereco", "telefone", "site", "redes", "status_site", "pontuacao", "fonte", "referencia"];
/** XLSX dos resultados da busca (antes de salvar como lead). Campos fixos e truncados; Google Places é recusado por restrição de licença. */
export async function POST(req: Request) {
  if (!(await sameOrigin())) return new Response("Origem inválida", { status: 403 });
  if (!(await currentUser())) return new Response("Não autenticado", { status: 401 });
  const items = (await req.json().catch(() => null))?.items;
  if (!Array.isArray(items) || items.length > 1000) return new Response("Dados inválidos", { status: 400 });
  const rows = items.filter((i: any) => i?.fonte !== "Google Places").map((i: any) => Object.fromEntries(COLS.map((c) => [c, String(i?.[c] ?? "").slice(0, 500)])));
  return new Response(await buildXlsx(rows, COLS, "Dados de OpenStreetMap contributors (ODbL)"), { headers: { "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "content-disposition": 'attachment; filename="resultados.xlsx"' } });
}
