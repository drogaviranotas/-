import type { Business, Provider, SearchQuery } from "../types";
import { classifyUrl } from "../website";
/** Google Places API (New) — Text Search. Requer GOOGLE_PLACES_API_KEY. Não testado com chave real. */
export const google: Provider = {
  name: "Google Places",
  isConfigured: () => !!process.env.GOOGLE_PLACES_API_KEY,
  async searchBusinesses({ location, category }: SearchQuery) {
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { "content-type": "application/json", "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.location,places.googleMapsUri,places.primaryTypeDisplayName" },
      body: JSON.stringify({ textQuery: `${category} em ${location}`, pageSize: 20 }),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return ((await r.json()).places ?? []).map((p: any): Business => {
      const w: string | undefined = p.websiteUri, own = !!w && classifyUrl(w) === "own";
      return { id: `google:${p.id}`, source: "Google Places", sourceRef: p.googleMapsUri ?? "", name: p.displayName?.text ?? "", category: p.primaryTypeDisplayName?.text,
        address: p.formattedAddress, phone: p.nationalPhoneNumber, website: own ? w : undefined, socials: w && !own ? [w] : [], lat: p.location?.latitude, lon: p.location?.longitude, rating: p.rating, reviews: p.userRatingCount };
    }).filter((b: Business) => b.name);
  },
};
