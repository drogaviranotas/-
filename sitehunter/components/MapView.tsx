"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Scored } from "@/lib/types";
export default function MapView({ items, onPick }: { items: Scored[]; onPick: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current);
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
    const pts = items.filter((b) => b.lat != null && b.lon != null);
    pts.forEach((b) => {
      const d = document.createElement("div"); d.textContent = `${b.name} · ${b.score}/100`; // textContent evita XSS
      L.circleMarker([b.lat!, b.lon!], { radius: 8, color: b.check.status === "NO_SITE_FOUND" ? "#16a34a" : "#64748b", fillOpacity: 0.8 }).addTo(map).bindPopup(d).on("click", () => onPick(b.id));
    });
    pts.length ? map.fitBounds(L.latLngBounds(pts.map((b) => [b.lat!, b.lon!] as [number, number])).pad(0.1)) : map.setView([0, 0], 2);
    return () => { map.remove(); };
  }, [items, onPick]);
  return <div ref={el} className="map" />;
}
