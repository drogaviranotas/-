import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { limited } from "@/lib/ratelimit";
/** Autocompletar via Photon (a política do Nominatim proíbe autocompletar). Fair use; troque por instância própria em produção. */
export async function GET(req: Request) {
  const u = await currentUser(); if (!u) return NextResponse.json({ items: [] }, { status: 401 });
  if (await limited("g:" + u.id, 30, 60_000)) return NextResponse.json({ items: [] }, { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 80); if (q.length < 3) return NextResponse.json({ items: [] });
  try {
    const r = await fetch(`https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(4000), headers: { "user-agent": `SiteHunter/0.1 (${process.env.CONTACT_EMAIL ?? "n/a"})` } });
    const j = await r.json();
    const items = [...new Set<string>((j.features ?? []).map((f: any) => [f.properties.name, f.properties.state, f.properties.country].filter(Boolean).join(", ")))];
    return NextResponse.json({ items });
  } catch { return NextResponse.json({ items: [] }); }
}
