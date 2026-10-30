import type { Business, Provider, SearchQuery } from "../types";
import { classifyUrl, safeUrl } from "../website";
const TAGS: Record<string, string[]> = {
  restaurante: ['"amenity"="restaurant"', '"amenity"="fast_food"'], cafeteria: ['"amenity"="cafe"', '"shop"="bakery"'],
  barbearia: ['"shop"="hairdresser"', '"shop"="barber"'], salao: ['"shop"="hairdresser"', '"shop"="beauty"'],
  dentista: ['"amenity"="dentist"'], oficina: ['"shop"="car_repair"'], academia: ['"leisure"="fitness_centre"'],
  petshop: ['"shop"="pet"'], roupas: ['"shop"="clothes"'], mercado: ['"shop"="supermarket"', '"shop"="convenience"'],
  imobiliaria: ['"office"="estate_agent"'], advocacia: ['"office"="lawyer"'], hotel: ['"tourism"="hotel"', '"tourism"="guest_house"'],
};
Object.assign(TAGS, {
  lanchonete: ['"amenity"="fast_food"'], padaria: ['"shop"="bakery"'], beleza: ['"shop"="beauty"', '"shop"="hairdresser"'], odonto: ['"amenity"="dentist"'],
  mecanica: ['"shop"="car_repair"'], mercearia: ['"shop"="convenience"', '"shop"="greengrocer"'], farmacia: ['"amenity"="pharmacy"'], acougue: ['"shop"="butcher"'],
  floricultura: ['"shop"="florist"'], lavanderia: ['"shop"="laundry"', '"shop"="dry_cleaning"'], escola: ['"amenity"="school"'], pousada: ['"tourism"="guest_house"'],
  eletricista: ['"craft"="electrician"'], encanador: ['"craft"="plumber"'], construcao: ['"office"="construction_company"', '"craft"="builder"'], advogado: ['"office"="lawyer"'],
  restaurant: ['"amenity"="restaurant"'], cafe: ['"amenity"="cafe"'], barber: ['"shop"="barber"'], hairdresser: ['"shop"="hairdresser"'], dentist: ['"amenity"="dentist"'],
  gym: ['"leisure"="fitness_centre"'], supermarket: ['"shop"="supermarket"'], pharmacy: ['"amenity"="pharmacy"'], lawyer: ['"office"="lawyer"'], realestate: ['"office"="estate_agent"'],
});
const slug = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
/** Aceita sinônimos e variações ("Clínica odontológica", "salão de beleza", "gym"). */
export function resolveTags(category: string): string[] | undefined {
  const s = slug(category), k = Object.keys(TAGS).find((k) => s === k || s.includes(k) || (s.length >= 4 && k.includes(s)));
  return k ? TAGS[k] : undefined;
}
const UA = () => `SiteHunter/0.1 (${process.env.CONTACT_EMAIL ?? "contato-nao-configurado"})`;
async function getJson(url: string, init?: RequestInit, tries = 2): Promise<any> {
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { ...init, signal: AbortSignal.timeout(30000), headers: { "user-agent": UA(), ...(init?.headers ?? {}) } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) { if (i >= tries - 1) throw e; await new Promise((res) => setTimeout(res, 1500 * (i + 1))); }
  }
}
export function normalizeBusiness(el: any): Business | null {
  const t = el.tags ?? {}; if (!t.name) return null;
  const raw = safeUrl(t.website ?? t["contact:website"] ?? t.url);
  const socials = [t["contact:facebook"], t["contact:instagram"], t.facebook, t.instagram].filter(Boolean) as string[];
  const isSocial = raw && classifyUrl(raw) !== "own";
  if (isSocial) socials.push(raw);
  const addr = [t["addr:street"], t["addr:housenumber"], t["addr:suburb"], t["addr:city"]].filter(Boolean).join(", ");
  return { id: `osm:${el.type}/${el.id}`, source: "OpenStreetMap", sourceRef: `https://www.openstreetmap.org/${el.type}/${el.id}`, name: t.name,
    category: t.amenity ?? t.shop ?? t.office ?? t.tourism ?? t.leisure, address: addr || undefined, phone: t.phone ?? t["contact:phone"],
    website: raw && !isSocial ? raw : undefined, socials, lat: el.lat ?? el.center?.lat, lon: el.lon ?? el.center?.lon };
}
export const overpass: Provider = {
  name: "OpenStreetMap",
  isConfigured: () => true, // API pública; sem chave
  async searchBusinesses({ location, category, limit = 100 }: SearchQuery) {
    const filters = resolveTags(category);
    if (!filters) throw new Error(`Categoria "${category}" ainda não mapeada para tags OSM. Use: ${Object.keys(TAGS).join(", ")}.`);
    const geo = await getJson(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`);
    if (!geo[0]) throw new Error(`Localização não encontrada: ${location}`);
    const [s, n, w, e] = geo[0].boundingbox.map(Number);
    const q = `[out:json][timeout:25];(${filters.map((f) => `nwr[${f}]["name"](${s},${w},${n},${e});`).join("")});out center tags ${limit};`;
    const init = { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "content-type": "application/x-www-form-urlencoded" } };
    let data: any, lastErr: unknown; // tenta o servidor principal e um espelho
    for (const ep of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]) { try { data = await getJson(ep, init, 1); break; } catch (e) { lastErr = e; } }
    if (!data) throw lastErr;
    return (data.elements as any[]).map(normalizeBusiness).filter(Boolean) as Business[];
  },
};
