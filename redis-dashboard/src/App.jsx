import React, { useState } from "react";
import Metrics from "./components/Metrics";
import KeyList from "./components/KeyList";
import Terminal from "./components/Terminal";

function App() {
  const [activeTab, setActiveTab] = useState("all"); // "all", "keys", "terminal"

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* Background radial glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-rose-600/15 via-indigo-600/10 to-transparent blur-3xl opacity-70"></div>
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Logo icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shadow-lg shadow-rose-900/40 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-rose-500 font-extrabold text-xl">
              ⚡
            </div>
          </div>

          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Redis<span className="text-rose-500">Rift</span>
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 tracking-wider">
                STUDIO v1.0
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                C++20 Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">High-Performance In-Memory Key-Value Server & Visual Dashboard</p>
          </div>
        </div>

        {/* Right Nav actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Server: 127.0.0.1:6379</span>
          </div>

          <a
            href="https://github.com/0rehan/RedisRift"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition"
          >
            <span>⭐ GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Live Metrics Row */}
        <Metrics />

        {/* View Switcher Controls */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 pt-2">
          <div className="flex items-center space-x-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab("all")}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === "all"
                  ? "bg-rose-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Overview (Split View)
            </button>
            <button
              onClick={() => setActiveTab("keys")}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === "keys"
                  ? "bg-rose-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔑 Key Explorer
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition ${
                activeTab === "terminal"
                  ? "bg-rose-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              💻 Interactive CLI
            </button>
          </div>

          <span className="text-xs text-slate-500 hidden sm:inline">
            Active Mode: {activeTab.toUpperCase()}
          </span>
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === "all" && (
          <div className="space-y-6">
            <KeyList />
            <Terminal />
          </div>
        )}

        {activeTab === "keys" && (
          <div>
            <KeyList />
          </div>
        )}

        {activeTab === "terminal" && (
          <div>
            <Terminal />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 px-4 sm:px-8 mt-12 bg-slate-950/80 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-7xl w-full mx-auto gap-3">
        <p>
          RedisRift — Built with <span className="text-rose-500">C++20</span>, Winsock/POSIX, ThreadPool, AOF Persistence, and React.
        </p>
        <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
          <span>RESP 2.0 Compliant</span>
          <span>•</span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
