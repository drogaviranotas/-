const n = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** Retorna ids a remover, mantendo o lead mais antigo. Duplicata = mesmo telefone ou mesmo nome+endereço. */
export function findDuplicateIds(leads: { id: string; createdAt: Date | string; snapshot: any }[]): string[] {
  const seen = new Set<string>(), drop: string[] = [];
  for (const l of [...leads].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))) {
    const s = l.snapshot ?? {};
    const keys = [s.phone ? "p" + String(s.phone).replace(/\D/g, "") : "", s.name && s.address ? "n" + n(s.name) + n(s.address) : ""].filter(Boolean);
    if (keys.some((k) => seen.has(k))) drop.push(l.id); else keys.forEach((k) => seen.add(k));
  }
  return drop;
}
