import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

/* ── Inline SVG Icons ─────────────────────────────────────────────── */
const DatabaseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" />
  </svg>
);

const ChipIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="14" rx="2" />
    <rect x="9" y="9" width="6" height="6" rx="1" />
    <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
  </svg>
);

const TerminalIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 10l4 2-4 2" />
    <path d="M14 16h4" />
  </svg>
);

const ServerIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" />
    <circle cx="6" cy="6" r="1" fill="currentColor" />
    <circle cx="6" cy="18" r="1" fill="currentColor" />
    <path d="M18 6h.01M18 18h.01" />
  </svg>
);

/* ── Pulsing Status Dot ───────────────────────────────────────────── */
const PulseDot = ({ color = "bg-emerald-400" }) => (
  <span className="relative flex h-2 w-2">
    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${color} opacity-75`} />
    <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
  </span>
);

/* ── Animated Number ──────────────────────────────────────────────── */
const AnimatedValue = ({ value, className }) => {
  const [pop, setPop] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 300);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className={`inline-block transition-transform duration-300 ease-out ${pop ? "scale-110" : "scale-100"} ${className}`}
    >
      {value}
    </span>
  );
};

/* ── Gradient-Border Card Wrapper ─────────────────────────────────── */
const GradientCard = ({ gradientFrom, gradientTo, children }) => (
  <div
    className="rounded-2xl p-[1px] group"
    style={{
      background: `linear-gradient(135deg, ${gradientFrom}33, ${gradientTo}22, transparent 60%)`,
    }}
  >
    <div className="relative h-full rounded-2xl bg-slate-950/80 backdrop-blur-xl p-5 transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-xl group-hover:shadow-black/30">
      {children}
    </div>
  </div>
);

/* ── Memory progress helper ───────────────────────────────────────── */
function parseMemoryPercent(memStr) {
  if (!memStr) return 5;
  const match = memStr.match(/([\d.]+)\s*([KMGT]?)/i);
  if (!match) return 5;
  const val = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  const bytes =
    unit === "G" ? val * 1e9 :
    unit === "M" ? val * 1e6 :
    unit === "K" ? val * 1e3 : val;
  // Assume 512 MB total for a lightweight Redis; cap at 100%
  const pct = Math.min(100, Math.max(2, (bytes / (512 * 1e6)) * 100));
  return Math.round(pct);
}

/* ── Main Component ───────────────────────────────────────────────── */
function Metrics() {
  const [metrics, setMetrics] = useState({
    total_keys: "0",
    used_memory_human: "0B",
    total_commands_processed: "0",
    connected_clients: "1",
  });
  const [healthy, setHealthy] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      const { data } = await axios.get("http://localhost:8000/api/metrics");
      setMetrics(data);
      setHealthy(true);
    } catch (e) {
      setHealthy(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 3000);
    return () => clearInterval(id);
  }, []);

  const memPercent = parseMemoryPercent(metrics.used_memory_human);

  /* ── Card Definitions ─────────────────────────────────────────── */
  const cards = [
    {
      key: "keys",
      label: "Total Keys",
      value: metrics.total_keys ?? "0",
      sub: "Active in memory",
      icon: DatabaseIcon,
      accent: "rose",
      gradientFrom: "#f43f5e",
      gradientTo: "#e11d48",
      iconBg: "bg-rose-500/10",
      iconBorder: "border-rose-500/20",
      iconColor: "text-rose-400",
      dotColor: "bg-rose-400",
    },
    {
      key: "memory",
      label: "Memory Allocation",
      value: metrics.used_memory_human ?? "0B",
      sub: null,
      icon: ChipIcon,
      accent: "violet",
      gradientFrom: "#8b5cf6",
      gradientTo: "#7c3aed",
      iconBg: "bg-violet-500/10",
      iconBorder: "border-violet-500/20",
      iconColor: "text-violet-400",
      dotColor: "bg-violet-400",
      progress: true,
    },
    {
      key: "commands",
      label: "Commands Processed",
      value: metrics.total_commands_processed ?? "0",
      sub: "RESP Engine · Live stream",
      icon: TerminalIcon,
      accent: "emerald",
      gradientFrom: "#10b981",
      gradientTo: "#059669",
      iconBg: "bg-emerald-500/10",
      iconBorder: "border-emerald-500/20",
      iconColor: "text-emerald-400",
      dotColor: "bg-emerald-400",
    },
    {
      key: "health",
      label: "Server Health",
      value: metrics.connected_clients ?? "1",
      sub: "ThreadPool · AOF Active",
      icon: ServerIcon,
      accent: "sky",
      gradientFrom: "#0ea5e9",
      gradientTo: "#0284c7",
      iconBg: "bg-sky-500/10",
      iconBorder: "border-sky-500/20",
      iconColor: "text-sky-400",
      dotColor: "bg-sky-400",
      isHealth: true,
    },
  ];

  return (
    <div>
      {/* ── Section Header ──────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
          <span className="inline-block w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-violet-500" />
          System Overview
        </h2>
        <p className="text-xs text-slate-500 mt-1 ml-3">
          Real-time server metrics · Auto-refreshing every 3s
        </p>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <GradientCard
              key={card.key}
              gradientFrom={card.gradientFrom}
              gradientTo={card.gradientTo}
            >
              {/* Header row */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  {card.label}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl ${card.iconBg} border ${card.iconBorder} flex items-center justify-center`}
                >
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>

              {/* Value */}
              <div className="mt-3">
                {card.isHealth ? (
                  /* ── Health Card ─────────────────────────────── */
                  <div>
                    <div className="flex items-center gap-2.5">
                      <AnimatedValue
                        value={card.value}
                        className="text-3xl font-extrabold font-mono tracking-tight text-white"
                      />
                      <span className="text-xs font-medium text-slate-500">
                        clients
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <PulseDot
                        color={healthy ? "bg-emerald-400" : "bg-red-400"}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          healthy ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {healthy ? "Online" : "Offline"}
                      </span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[11px] text-slate-500">
                        Port 6379
                      </span>
                    </div>
                    {card.sub && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {card.sub}
                      </p>
                    )}
                  </div>
                ) : card.progress ? (
                  /* ── Memory Card ─────────────────────────────── */
                  <div>
                    <AnimatedValue
                      value={card.value}
                      className="text-3xl font-extrabold font-mono tracking-tight text-white"
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                          style={{ width: `${memPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 min-w-[28px] text-right">
                        {memPercent}%
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ── Standard Card ───────────────────────────── */
                  <div>
                    <AnimatedValue
                      value={card.value}
                      className="text-3xl font-extrabold font-mono tracking-tight text-white"
                    />
                    {card.sub && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                        <PulseDot color={card.dotColor} />
                        <span>{card.sub}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </GradientCard>
          );
        })}
      </div>
    </div>
  );
}

export default Metrics;
