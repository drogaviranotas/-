import ExcelJS from "exceljs";
export async function buildXlsx(rows: Record<string, unknown>[], cols: string[], attribution: string): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook(), ws = wb.addWorksheet("Dados");
  ws.columns = cols.map((c) => ({ header: c, key: c, width: 22 }));
  rows.forEach((r) => ws.addRow(Object.fromEntries(cols.map((c) => [c, String(r[c] ?? "")]))));
  ws.addRow([]); ws.addRow([attribution]); ws.getRow(1).font = { bold: true };
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
