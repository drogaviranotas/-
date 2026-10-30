export type SiteStatus = "NO_SITE_FOUND" | "CONFIRMED" | "PENDING" | "POSSIBLY_INACTIVE";
export type UrlKind = "own" | "social" | "directory";
export interface SearchQuery { location: string; category: string; limit?: number }
export interface Business {
  id: string; source: string; sourceRef: string; name: string; category?: string;
  address?: string; phone?: string; website?: string; socials: string[];
  lat?: number; lon?: number; rating?: number; reviews?: number;
}
export interface SiteCheck { status: SiteStatus; kind?: UrlKind; confidence: "low" | "medium" | "high"; note: string; checkedAt: string }
export interface Provider { name: string; isConfigured(): boolean; searchBusinesses(q: SearchQuery): Promise<Business[]> }
export interface Scored extends Business { check: SiteCheck; score: number; reasons: string[] }
