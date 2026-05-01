import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* ============================================================
 * GlobalMap — Tunisia Tactical Radar
 * Ultra-premium black & red intelligence map.
 * Built on react-leaflet (Vite/React 18 — no Next.js SSR needed).
 * ============================================================ */

type CityLabel = { name: string; coords: [number, number] };

const CITY_LABELS: CityLabel[] = [
  { name: "Sousse",    coords: [35.82, 10.63] },
  { name: "Sfax",      coords: [34.74, 10.76] },
  { name: "Kairouan",  coords: [35.67, 10.10] },
  { name: "Bizerte",   coords: [37.27,  9.87] },
  { name: "Nabeul",    coords: [36.45, 10.73] },
  { name: "Béja",      coords: [36.72,  9.18] },
  { name: "Gafsa",     coords: [34.42,  8.78] },
  { name: "Al-Kef",    coords: [36.18,  8.70] },
  { name: "Gabes",     coords: [33.88, 10.09] },
  { name: "NALUT",     coords: [31.86, 10.98] },
];

const TUNIS: [number, number] = [36.8065, 10.1815];

/* ---------- Tunis Radar Node (3-layer pulse + floating tooltip) ---------- */
const tunisRadarIcon = L.divIcon({
  className: "tunis-radar-root",
  iconSize: [0, 0],
  iconAnchor: [0, 0],
  html: `
    <div class="relative" style="width:0;height:0;">
      <!-- Layer 3: massive slow radar pulse -->
      <span
        class="bg-rose-500/10 w-32 h-32 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style="animation: tactical-radar-pulse 3.2s cubic-bezier(0,0,0.2,1) infinite;"
      ></span>
      <!-- Layer 3b: secondary slower pulse for depth -->
      <span
        class="bg-rose-500/10 w-32 h-32 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style="animation: tactical-radar-pulse 3.2s cubic-bezier(0,0,0.2,1) infinite; animation-delay: 1.2s;"
      ></span>
      <!-- Layer 2: static ring -->
      <span class="border-4 border-rose-500/50 w-8 h-8 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></span>
      <!-- Layer 1: solid core dot -->
      <span
        class="bg-rose-500 w-3 h-3 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style="box-shadow: 0 0 12px rgba(244,63,94,0.95), 0 0 24px rgba(244,63,94,0.6);"
      ></span>

      <!-- Floating tooltip -->
      <div
        class="absolute top-[-30px] left-[30px] z-50 flex items-center gap-2 bg-[#0a0f1c] rounded-lg border border-blue-900/50 px-3 py-1.5"
        style="box-shadow: 0 0 15px rgba(30,58,138,0.3); white-space:nowrap;"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-rose-500" style="box-shadow:0 0 6px rgba(244,63,94,0.9);"></span>
        <span class="text-[#e2e8f0] font-mono text-sm font-bold tracking-wide">Tunis • v8...</span>
      </div>
    </div>
  `,
});

/* ---------- Faint static city/region labels ---------- */
function makeCityLabelIcon(name: string) {
  return L.divIcon({
    className: "city-label-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    html: `
      <div class="absolute -translate-x-1/2 -translate-y-1/2 text-[#555555] text-[10px] font-bold tracking-widest uppercase select-none pointer-events-none" style="white-space:nowrap;">
        ${name}
      </div>
    `,
  });
}

/* ---------- Map sizing fix ---------- */
function MapResize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

export function GlobalMap() {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-rose-900/20 bg-[#111111]"
         style={{ boxShadow: "0 0 60px -20px rgba(244,63,94,0.25), inset 0 0 80px rgba(0,0,0,0.6)" }}>
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-[500] font-mono text-[10px] tracking-[0.3em] text-rose-500/70 pointer-events-none">
        TUNISIA · TACTICAL RADAR · LIVE
      </div>
      <div className="absolute top-4 right-4 z-[500] font-mono text-[10px] text-rose-500/70 flex items-center gap-2 pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        SCANNING
      </div>

      {/* Crosshairs */}
      <div className="absolute inset-0 z-[400] pointer-events-none">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-rose-500/5" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-rose-500/5" />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 z-[450] pointer-events-none"
           style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)" }} />

      <MapContainer
        center={[34.5, 9.5]}
        zoom={7}
        minZoom={6}
        maxZoom={10}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={false}
        style={{ width: "100%", height: "100%", background: "#111111" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
          detectRetina
        />
        <MapResize />

        {/* Faint city labels */}
        {CITY_LABELS.map((c) => (
          <Marker key={c.name} position={c.coords} icon={makeCityLabelIcon(c.name)} interactive={false} />
        ))}

        {/* Tunis radar node — rendered last so it sits on top */}
        <Marker position={TUNIS} icon={tunisRadarIcon} />
      </MapContainer>
    </div>
  );
}

export default GlobalMap;
