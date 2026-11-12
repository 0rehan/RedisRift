import React, { useState, useEffect } from "react";
import Metrics from "./components/Metrics";
import KeyList from "./components/KeyList";
import Terminal from "./components/Terminal";

/* ── Inline SVG Icons ─────────────────────────────────────── */
const IconOverview = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconKey = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="8" cy="15" r="4" />
    <path d="M11.5 11.5L17 6" />
    <path d="M15 8l2-2" />
    <path d="M17 6l2 2" />
  </svg>
);

const IconTerminal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <polyline points="6 9 10 12 6 15" />
    <line x1="13" y1="15" x2="18" y2="15" />
  </svg>
);

const IconGitHub = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.607.069-.607 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const IconChevron = ({ collapsed }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/* ── Navigation items ─────────────────────────────────────── */
const navItems = [
  { id: "all", label: "Overview", icon: IconOverview },
  { id: "keys", label: "Key Explorer", icon: IconKey },
  { id: "terminal", label: "Terminal", icon: IconTerminal },
];

/* ── Main App ─────────────────────────────────────────────── */
function App() {
  const [activeTab, setActiveTab] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contentKey, setContentKey] = useState(0); // drives re-mount animation

  /* Trigger fade-in animation on tab change */
  useEffect(() => {
    setContentKey((k) => k + 1);
  }, [activeTab]);

  /* Auto-collapse sidebar on small viewports */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = (e) => setSidebarCollapsed(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* ── Ambient background glows ──────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 left-1/3 w-[800px] h-[500px] bg-gradient-to-br from-rose-600/10 via-indigo-600/8 to-transparent blur-[100px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-gradient-to-tl from-indigo-700/8 via-transparent to-transparent blur-[80px] opacity-40" />
      </div>

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen flex flex-col border-r border-slate-800/60 bg-[#070b15]/90 backdrop-blur-xl transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "w-[68px]" : "w-[210px]"
        }`}
      >
        {/* Sidebar header — logo */}
        <div className="flex items-center gap-2.5 px-4 h-[60px] border-b border-slate-800/60 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-500 p-[2px] shadow-lg shadow-rose-900/30 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#0a0e1a] rounded-[10px] flex items-center justify-center text-base">
              ⚡
            </div>
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-extrabold tracking-tight whitespace-nowrap bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Redis<span className="text-rose-500">Rift</span>
            </span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 px-2.5 pt-5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                title={sidebarCollapsed ? label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white bg-slate-800/60"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                }`}
              >
                {/* Active indicator bar */}
                <span
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-300 ${
                    isActive
                      ? "h-6 bg-gradient-to-b from-rose-500 to-indigo-500 shadow-md shadow-rose-500/30"
                      : "h-0 bg-transparent"
                  }`}
                />

                <span className={`shrink-0 transition-colors duration-200 ${isActive ? "text-rose-400" : "text-slate-500 group-hover:text-slate-300"}`}>
                  <Icon />
                </span>

                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap">{label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed((c) => !c)}
          className="flex items-center justify-center h-11 mx-2.5 mb-3 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors duration-200"
        >
          <IconChevron collapsed={sidebarCollapsed} />
        </button>
      </aside>

      {/* ── Right wrapper (header + content) ──────────────── */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "ml-[68px]" : "ml-[210px]"
        }`}
      >
        {/* ── Top Navbar ────────────────────────────────────── */}
        <header className="relative z-20 sticky top-0 border-b border-slate-800/50 bg-[#0a0e1a]/70 backdrop-blur-xl px-6 py-3 flex items-center justify-between shrink-0">
          {/* Left: branding + tag */}
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-white/90">
              {navItems.find((n) => n.id === activeTab)?.label ?? "Overview"}
            </h1>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 tracking-wider">
              STUDIO v1.0
            </span>
            <span className="hidden lg:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/60">
              C++20 Engine
            </span>
          </div>

          {/* Right: connection + GitHub */}
          <div className="flex items-center gap-3">
            {/* Connection indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/70 text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>127.0.0.1:6379</span>
            </div>

            {/* GitHub */}
            <a
              href="https://github.com/0rehan/RedisRift"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/60 border border-slate-700/50 transition-all duration-200"
            >
              <IconGitHub />
            </a>
          </div>
        </header>

        {/* ── Main Content ──────────────────────────────────── */}
        <main className="relative z-10 flex-1 p-5 sm:p-6 lg:p-8">
          {/* Metrics row — always visible */}
          <Metrics />

          {/* Animated tab content */}
          <div
            key={contentKey}
            className="mt-6"
            style={{
              animation: "fadeSlideIn 0.35s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {activeTab === "all" && (
              <div className="space-y-6">
                <KeyList />
                <Terminal />
              </div>
            )}

            {activeTab === "keys" && <KeyList />}

            {activeTab === "terminal" && <Terminal />}
          </div>

          {/* ── Footer (inside content area) ───────────────── */}
          <footer className="mt-14 mb-2 pt-5 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 max-w-5xl mx-auto">
            <p>
              RedisRift — Built with{" "}
              <span className="text-rose-500/80">C++20</span>, Winsock/POSIX,
              ThreadPool, AOF Persistence &amp; React.
            </p>
            <div className="flex items-center gap-2 font-mono text-slate-500/70">
              <span>RESP 2.0</span>
              <span className="text-slate-700">•</span>
              <span>MIT License</span>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Keyframe animation injected once ────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
