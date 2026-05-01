import { NavLink, useLocation } from "react-router-dom";
import { Radar, Brain, ScrollText, ShieldAlert, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useDecode } from "@/state/DecodeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { to: "/", label: "Tactical Radar", icon: Radar },
  { to: "/intelligence", label: "Intelligence", icon: Brain },
  { to: "/strategist", label: "Strategist", icon: ScrollText },
  { to: "/safety", label: "Safety Radar", icon: ShieldAlert },
];

export function AppHeader() {
  const { pathname } = useLocation();
  const { trends, alerts } = useDecode();
  const live = trends.filter(t => t.phase !== "Declining").length;

  return (
    <header className="sticky top-0 z-40 glass-strong border-b border-border">
      <div className="flex items-center gap-4 px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative h-8 w-8 rounded-md grid place-items-center bg-gradient-to-br from-primary to-magma overflow-hidden">
            <Activity className="h-4 w-4 text-background relative z-10" strokeWidth={2.5}/>
            <div className="absolute inset-0 animate-pulse-ring rounded-md ring-2 ring-primary/60" />
          </div>
          <div className="leading-tight hidden sm:block">
            <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">DECODE-TN</div>
            <div className="font-semibold tracking-tight text-sm">Tunisia <span className="text-gradient-cyan">Command</span></div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1 ml-1 min-w-0">
          {nav.map(item => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                title={item.label}
                className={`relative px-2.5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0"/>
                <span className="hidden xl:inline">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/30 -z-10"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 font-mono text-xs shrink-0">
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/5 border border-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary glow-cyan animate-pulse"/>
            <span className="text-muted-foreground">LIVE</span>
            <span className="text-foreground tabular-nums">{live}</span>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-magma/10 border border-magma/30 text-magma">
              <ShieldAlert className="h-3.5 w-3.5"/>
              <span className="tabular-nums">{alerts.length}</span>
            </div>
          )}
          <ThemeToggle/>
        </div>
      </div>
    </header>
  );
}
