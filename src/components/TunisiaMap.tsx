import { ComposableMap, Geographies, Geography, Sphere, Graticule } from "react-simple-maps";
import { motion } from "framer-motion";
import { useDecode } from "@/state/DecodeContext";
import { GEO_NAME_TO_ID, GOVERNORATES } from "@/ingestion/mockData";
import type { Trend } from "@/shared/types";
import { useNavigate } from "react-router-dom";

const GEO_URL = "/data/tunisia-governorates.geojson";

function pinColor(t: Trend) {
  if (t.safety === "TOXIC") return "hsl(var(--magma))";
  if (t.safety === "RESTRAINT") return "hsl(var(--amber))";
  return "hsl(var(--primary))";
}

export function TunisiaMap() {
  const { trends, emotionFilter, setSelectedTrendId, selectedTrendId } = useDecode();
  const navigate = useNavigate();

  const visibleTrends = emotionFilter === "all"
    ? trends
    : trends.filter(t => t.dominantEmotion === emotionFilter);

  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden border border-border transition-colors duration-300"
      style={{
        background:
          "radial-gradient(ellipse at 30% 20%, hsl(var(--map-bg-from)), hsl(var(--map-bg-to)) 80%)",
      }}
    >
      {/* Subtle graticule grid */}
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.55) 100%)",
        }}
      />

      {/* Top-left HUD label */}
      <div className="absolute top-4 left-4 z-10 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
        TUNISIA · MEDITERRANEAN BASIN · LIVE
      </div>
      <div className="absolute top-4 right-4 z-10 font-mono text-[10px] text-muted-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        SCANNING
      </div>

      {/* Compass rose */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-[9px] text-muted-foreground flex flex-col items-center gap-0.5">
        <span>N</span>
        <div className="flex items-center gap-1">
          <span>W</span>
          <div className="h-3 w-3 rounded-full border border-current grid place-items-center">
            <div className="h-0.5 w-0.5 rounded-full bg-current" />
          </div>
          <span>E</span>
        </div>
        <span>S</span>
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-4 right-4 z-10 font-mono text-[9px] text-muted-foreground flex items-center gap-2">
        <div className="h-[3px] w-16 bg-current/30 relative">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-current/60" />
        </div>
        <span>200 km</span>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [9.6, 34.4], scale: 2800 }}
        width={800}
        height={700}
        style={{ width: "100%", height: "100%" }}
      >
        <Sphere
          id="sphere"
          fill="transparent"
          stroke="hsl(var(--border))"
          strokeWidth={0.4}
        />
        <Graticule stroke="hsl(var(--border))" strokeWidth={0.3} step={[2, 2]} />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.shapeName as string;
              const govId = GEO_NAME_TO_ID[name];
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  data-gov={govId ?? "unknown"}
                  style={{
                    default: {
                      fill: "hsl(var(--map-land))",
                      stroke: "hsl(var(--map-stroke))",
                      strokeWidth: 0.8,
                      outline: "none",
                      filter: "drop-shadow(0 1px 2px hsl(0 0% 0% / 0.15))",
                      transition: "all 0.4s",
                    },
                    hover: {
                      fill: "hsl(var(--primary) / 0.18)",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 1.1,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Glowing trend nodes — overlayed with animate-ping */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleTrends.map((t) => {
          const g = GOVERNORATES.find((x) => x.id === t.governorateId);
          if (!g) return null;
          const pos = projectApprox(g.lng, g.lat);
          const color = pinColor(t);
          const isSel = selectedTrendId === t.id;
          // Velocity scales the ping intensity: faster trends = larger, faster ping
          const ringScale = 0.9 + (t.velocity / 100) * 1.6;
          return (
            <motion.button
              key={t.id}
              layoutId={`pin-${t.id}`}
              onClick={() => {
                setSelectedTrendId(t.id);
                navigate("/intelligence");
              }}
              className="absolute pointer-events-auto group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
              whileHover={{ scale: 1.25 }}
              transition={{ type: "spring", stiffness: 300 }}
              aria-label={`${t.title} — velocity ${t.velocity}%`}
            >
              <div className="relative grid place-items-center">
                {/* Outer ping ring — live velocity */}
                <span
                  className="absolute inline-flex h-6 w-6 rounded-full opacity-60 animate-ping"
                  style={{ backgroundColor: color, transform: `scale(${ringScale})` }}
                />
                {/* Mid halo */}
                <span
                  className="absolute h-4 w-4 rounded-full opacity-40"
                  style={{ backgroundColor: color, filter: "blur(4px)" }}
                />
                {/* Solid node */}
                <span
                  className="relative h-3 w-3 rounded-full border-2 border-background"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 14px ${color}, 0 0 28px ${color}`,
                  }}
                />
                {/* Hover/selected label */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full whitespace-nowrap font-mono text-[10px] px-2 py-1 rounded-md glass-strong transition-opacity pointer-events-none ${
                    isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="font-semibold text-foreground">{t.hashtag}</div>
                  <div className="text-muted-foreground">v {t.velocity}% · g {t.gravity}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Linear approximation of geoMercator center [9.6, 34.4], scale 2800, 800x700.
function projectApprox(lng: number, lat: number) {
  const x = ((lng - 7.5) / (11.6 - 7.5)) * 90 + 5;
  const y = ((37.6 - lat) / (37.6 - 30.2)) * 90 + 5;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}
