import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/state/ThemeContext";

export type SignalNode = {
  id: string;
  name: string;
  hashtag?: string;
  coords: [number, number]; // [lat, lng]
  velocity: number; // 0-100
  status: "High Tension" | "Consensus" | "Restraint";
};

// Mock signal nodes spread across the globe
const MOCK_NODES: SignalNode[] = [
  { id: "tn", name: "Tunis",     hashtag: "#YasmineChallenge", coords: [36.8065, 10.1815], velocity: 87, status: "High Tension" },
  { id: "ny", name: "New York",  hashtag: "#WallStBuzz",       coords: [40.7128, -74.006], velocity: 72, status: "Consensus" },
  { id: "tk", name: "Tokyo",     hashtag: "#ShibuyaWave",      coords: [35.6762, 139.6503], velocity: 64, status: "Consensus" },
  { id: "ld", name: "London",    hashtag: "#ThamesLive",       coords: [51.5074, -0.1278], velocity: 81, status: "High Tension" },
  { id: "sp", name: "São Paulo", hashtag: "#PaulistaPulse",    coords: [-23.5505, -46.6333], velocity: 58, status: "Consensus" },
  { id: "ct", name: "Cape Town", hashtag: "#TableMtnTrend",    coords: [-33.9249, 18.4241], velocity: 49, status: "Consensus" },
  { id: "sg", name: "Singapore", hashtag: "#MarinaSignal",     coords: [1.3521, 103.8198],  velocity: 76, status: "Restraint" },
];

function nodeColorClass(status: SignalNode["status"], theme: "light" | "dark") {
  if (status === "High Tension") return "bg-rose-500";
  if (status === "Restraint") return "bg-amber-500";
  return theme === "dark" ? "bg-teal-400" : "bg-blue-500";
}

function nodeGlow(status: SignalNode["status"]) {
  if (status === "High Tension") return "rgba(244,63,94,0.85)";   // rose-500
  if (status === "Restraint")    return "rgba(245,158,11,0.85)";  // amber-500
  return "rgba(20,184,166,0.85)";                                 // teal-500
}

function buildDivIcon(node: SignalNode, theme: "light" | "dark") {
  const colorClass = nodeColorClass(node.status, theme);
  const glow = nodeGlow(node.status);
  // Velocity scales the ping size (1.0 -> 1.8)
  const scale = 1 + (node.velocity / 100) * 0.8;

  const html = `
    <div class="signal-node-root" style="position:relative;width:0;height:0;">
      <span class="signal-ping ${colorClass}" style="
        position:absolute; left:-14px; top:-14px;
        width:28px; height:28px; border-radius:9999px;
        opacity:0.55;
        transform:scale(${scale});
        animation: leaflet-ping 1.8s cubic-bezier(0,0,0.2,1) infinite;
      "></span>
      <span class="signal-ping-2 ${colorClass}" style="
        position:absolute; left:-10px; top:-10px;
        width:20px; height:20px; border-radius:9999px;
        opacity:0.4;
        animation: leaflet-ping 2.6s cubic-bezier(0,0,0.2,1) infinite;
        animation-delay: 0.5s;
      "></span>
      <span class="signal-halo" style="
        position:absolute; left:-9px; top:-9px;
        width:18px; height:18px; border-radius:9999px;
        background:${glow};
        filter:blur(6px); opacity:0.55;
      "></span>
      <span class="signal-core ${colorClass}" style="
        position:absolute; left:-5px; top:-5px;
        width:10px; height:10px; border-radius:9999px;
        border:2px solid ${theme === "dark" ? "#020617" : "#FFFFFF"};
        box-shadow: 0 0 0 2px ${theme === "dark" ? "#020617" : "#FFFFFF"}, 0 0 14px ${glow}, 0 0 28px ${glow};
      "></span>
      <span class="signal-label" style="
        position:absolute; left:10px; top:-22px;
        white-space:nowrap;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size:10px; font-weight:600;
        padding:3px 7px; border-radius:6px;
        color: ${theme === "dark" ? "#F8FAFC" : "#1E293B"};
        background: ${theme === "dark" ? "rgba(2,6,23,0.85)" : "rgba(255,255,255,0.92)"};
        border: 1px solid ${theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.08)"};
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px -4px rgba(15,23,42,0.25);
        pointer-events:none;
      ">${node.name} <span style="opacity:0.6;font-weight:400">· v${node.velocity}%</span></span>
    </div>
  `;

  return L.divIcon({
    html,
    className: "signal-node-icon",
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Internal: smooth resize handling
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

export function GlobalMap({ nodes = MOCK_NODES }: { nodes?: SignalNode[] }) {
  const { theme } = useTheme();

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  // Rebuild icons whenever theme or nodes change
  const markerData = useMemo(
    () => nodes.map(n => ({ node: n, icon: buildDivIcon(n, theme) })),
    [nodes, theme]
  );

  // Force tile layer remount on theme switch so old tiles don't linger
  const tileKey = theme;

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border glass">
      {/* HUD overlay */}
      <div className="absolute top-4 left-4 z-[500] font-mono text-[10px] tracking-[0.3em] text-muted-foreground pointer-events-none">
        GLOBAL SIGNAL MAP · LIVE
      </div>
      <div className="absolute top-4 right-4 z-[500] font-mono text-[10px] text-muted-foreground flex items-center gap-2 pointer-events-none">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        SCANNING · {nodes.length} NODES
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[500] glass rounded-lg p-2.5 space-y-1.5 font-mono text-[9px] pointer-events-none">
        <div className="text-muted-foreground tracking-[0.2em] mb-1">SIGNAL STATUS</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500" style={{ boxShadow: "0 0 8px rgba(244,63,94,0.8)" }} />
          <span className="text-foreground/80">High Tension</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" style={{ boxShadow: "0 0 8px rgba(245,158,11,0.8)" }} />
          <span className="text-foreground/80">Restraint</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-teal-400" : "bg-blue-500"}`}
                style={{ boxShadow: "0 0 8px rgba(20,184,166,0.8)" }} />
          <span className="text-foreground/80">Consensus</span>
        </div>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={8}
        zoomControl={false}
        worldCopyJump
        scrollWheelZoom
        attributionControl
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <TileLayer
          key={tileKey}
          url={tileUrl}
          attribution={attribution}
          subdomains={["a", "b", "c", "d"]}
          maxZoom={20}
          detectRetina
        />
        <MapResize />
        {markerData.map(({ node, icon }) => (
          <Marker key={node.id} position={node.coords} icon={icon} />
        ))}
      </MapContainer>
    </div>
  );
}

export default GlobalMap;
