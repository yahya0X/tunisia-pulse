import { ComposableMap, Geographies, Geography, Sphere, Graticule, Marker } from "react-simple-maps";
import { motion } from "framer-motion";
import { useMemo } from "react";
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

function regionTint(t?: Trend) {
  if (!t) return null;
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

  // Map governorate -> dominant trend (highest velocity) for region heat tinting
  const govTrend = useMemo(() => {
    const m = new Map<string, Trend>();
    for (const t of visibleTrends) {
      const cur = m.get(t.governorateId);
      if (!cur || t.velocity > cur.velocity) m.set(t.governorateId, t);
    }
    return m;
  }, [visibleTrends]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-border transition-colors duration-300">
      {/* SEA gradient backdrop */}
      <div
        className="absolute inset-0 transition-colors duration-500"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 20%, hsl(var(--map-bg-from)), hsl(var(--map-bg-to)) 75%)",
        }}
      />
      {/* Faint hex/grid pattern */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, hsl(var(--background) / 0.55) 100%)",
        }}
      />

      {/* Geo HUD labels */}
      <div className="absolute top-4 left-4 z-10 font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
        TUNISIA · MEDITERRANEAN BASIN · LIVE
      </div>
      <div className="absolute top-4 right-4 z-10 font-mono text-[10px] text-muted-foreground flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        SCANNING · 24 GOV
      </div>

      {/* Sea labels */}
      <div className="absolute top-[18%] left-[8%] z-[5] pointer-events-none font-mono text-[11px] tracking-[0.4em] text-muted-foreground/70 italic select-none">
        MEDITERRANEAN
      </div>
      <div className="absolute top-[42%] left-[6%] z-[5] pointer-events-none font-mono text-[10px] tracking-[0.35em] text-muted-foreground/40 select-none">
        ALGERIA
      </div>
      <div className="absolute bottom-[18%] right-[6%] z-[5] pointer-events-none font-mono text-[10px] tracking-[0.35em] text-muted-foreground/40 select-none">
        LIBYA
      </div>

      {/* Compass rose */}
      <div className="absolute bottom-4 left-4 z-10 font-mono text-[9px] text-muted-foreground/80 flex flex-col items-center gap-0.5 select-none">
        <span>N</span>
        <div className="flex items-center gap-1.5">
          <span>W</span>
          <div className="h-4 w-4 rounded-full border border-current/60 grid place-items-center relative">
            <div className="absolute h-3 w-px bg-primary/70" />
            <div className="h-1 w-1 rounded-full bg-primary" />
          </div>
          <span>E</span>
        </div>
        <span>S</span>
      </div>

      {/* Scale bar */}
      <div className="absolute bottom-4 right-4 z-10 font-mono text-[9px] text-muted-foreground flex items-center gap-2">
        <div className="h-[3px] w-20 bg-current/30 relative">
          <div className="absolute inset-y-0 left-0 w-1/2 bg-primary/70" />
          <div className="absolute -top-1 left-0 h-2 w-px bg-current/60" />
          <div className="absolute -top-1 left-1/2 h-2 w-px bg-current/60" />
          <div className="absolute -top-1 right-0 h-2 w-px bg-current/60" />
        </div>
        <span>0 — 100 — 200 km</span>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [9.6, 34.4], scale: 2900 }}
        width={800}
        height={700}
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* Land gradient */}
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--map-land))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--map-land))" stopOpacity="0.85" />
          </linearGradient>
          {/* Hot region overlay (TOXIC) */}
          <radialGradient id="hotGrad">
            <stop offset="0%" stopColor="hsl(var(--magma))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--magma))" stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id="warmGrad">
            <stop offset="0%" stopColor="hsl(var(--amber))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--amber))" stopOpacity="0.05" />
          </radialGradient>
          <radialGradient id="coolGrad">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </radialGradient>

          {/* Drop shadow filter for embossed continent feel */}
          <filter id="landShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="off" />
            <feComponentTransfer><feFuncA type="linear" slope="0.45" /></feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow for selected/hovered region */}
          <filter id="regionGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <Sphere
          id="sphere"
          fill="transparent"
          stroke="hsl(var(--border))"
          strokeWidth={0.4}
        />
        <Graticule stroke="hsl(var(--border))" strokeWidth={0.25} step={[1, 1]} />

        {/* Underglow shadow layer for the entire country */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) => (
            <g filter="url(#landShadow)">
              {geographies.map((geo) => (
                <Geography
                  key={`shadow-${geo.rsmKey}`}
                  geography={geo}
                  style={{
                    default: {
                      fill: "url(#landGrad)",
                      stroke: "transparent",
                      outline: "none",
                    },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))}
            </g>
          )}
        </Geographies>

        {/* Interactive layer with per-region tint based on dominant trend */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const name = geo.properties.shapeName as string;
              const govId = GEO_NAME_TO_ID[name];
              const t = govId ? govTrend.get(govId) : undefined;
              const tint = regionTint(t);
              const isHot = t?.safety === "TOXIC";
              const isSelected = t && selectedTrendId === t.id;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (t) {
                      setSelectedTrendId(t.id);
                      navigate("/intelligence");
                    }
                  }}
                  style={{
                    default: {
                      fill: tint
                        ? `color-mix(in oklab, hsl(var(--map-land)) 70%, ${tint} 30%)`
                        : "url(#landGrad)",
                      stroke: "hsl(var(--map-stroke))",
                      strokeWidth: 0.9,
                      outline: "none",
                      transition: "all 0.4s",
                      filter: isSelected ? "url(#regionGlow)" : isHot ? "brightness(1.05)" : undefined,
                      cursor: t ? "pointer" : "default",
                    },
                    hover: {
                      fill: tint
                        ? `color-mix(in oklab, hsl(var(--map-land)) 50%, ${tint} 50%)`
                        : "hsl(var(--primary) / 0.18)",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 1.3,
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

        {/* Capital marker — Tunis */}
        <Marker coordinates={[10.1815, 36.8065]}>
          <g>
            <circle r={7} fill="hsl(var(--primary) / 0.15)" />
            <circle r={3.5} fill="none" stroke="hsl(var(--primary))" strokeWidth={1.2} />
            <circle r={1.4} fill="hsl(var(--primary))" />
            <text textAnchor="start" x={8} y={3} className="font-mono"
              style={{ fontSize: 8, fill: "hsl(var(--foreground))", fontWeight: 600, letterSpacing: 1 }}>
              TUNIS ★
            </text>
          </g>
        </Marker>
      </ComposableMap>

      {/* Glowing trend nodes */}
      <div className="absolute inset-0 pointer-events-none">
        {visibleTrends.map((t) => {
          const g = GOVERNORATES.find((x) => x.id === t.governorateId);
          if (!g) return null;
          const pos = projectApprox(g.lng, g.lat);
          const color = pinColor(t);
          const isSel = selectedTrendId === t.id;
          const ringScale = 0.9 + (t.velocity / 100) * 1.8;
          const pingDuration = `${Math.max(1.2, 2.4 - t.velocity / 60)}s`;
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
                {/* Outer ping ring */}
                <span
                  className="absolute inline-flex h-7 w-7 rounded-full opacity-60 animate-ping"
                  style={{
                    backgroundColor: color,
                    transform: `scale(${ringScale})`,
                    animationDuration: pingDuration,
                  }}
                />
                {/* Second offset ping for richness */}
                <span
                  className="absolute inline-flex h-5 w-5 rounded-full opacity-40 animate-ping"
                  style={{
                    backgroundColor: color,
                    animationDuration: `calc(${pingDuration} * 1.4)`,
                    animationDelay: "0.4s",
                  }}
                />
                {/* Soft halo */}
                <span
                  className="absolute h-5 w-5 rounded-full opacity-50"
                  style={{ backgroundColor: color, filter: "blur(5px)" }}
                />
                {/* Solid core */}
                <span
                  className="relative h-3 w-3 rounded-full border-2 border-background"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 14px ${color}, 0 0 28px ${color}`,
                  }}
                />
                {/* Label */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full whitespace-nowrap font-mono text-[10px] px-2 py-1 rounded-md glass-strong transition-opacity pointer-events-none ${
                    isSel ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="font-semibold text-foreground">{t.hashtag}</div>
                  <div className="text-muted-foreground">v {t.velocity}% · g {t.gravity} · {g.name}</div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute top-14 right-4 z-10 glass rounded-lg p-2.5 space-y-1.5 font-mono text-[9px]">
        <div className="text-muted-foreground tracking-[0.2em] mb-1">SAFETY VERDICT</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" style={{ boxShadow: "0 0 8px hsl(var(--primary))" }} />
          <span className="text-foreground/80">SAFE</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber" style={{ boxShadow: "0 0 8px hsl(var(--amber))" }} />
          <span className="text-foreground/80">RESTRAINT</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-magma" style={{ boxShadow: "0 0 8px hsl(var(--magma))" }} />
          <span className="text-foreground/80">TOXIC</span>
        </div>
      </div>
    </div>
  );
}

// Linear approximation matching projection center [9.6, 34.4], scale ~2900, 800x700.
function projectApprox(lng: number, lat: number) {
  const x = ((lng - 7.4) / (11.7 - 7.4)) * 90 + 5;
  const y = ((37.7 - lat) / (37.7 - 30.1)) * 90 + 5;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}
