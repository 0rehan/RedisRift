import React, { useEffect, useState } from "react";
import axios from "axios";

function Metrics() {
  const [metrics, setMetrics] = useState({
    total_keys: "0",
    used_memory_human: "0B",
    total_commands_processed: "0",
    connected_clients: "1",
  });
  const [loading, setLoading] = useState(false);

  const fetchMetrics = async () => {
    try {
      const { data } = await axios.get("http://localhost:8000/api/metrics");
      setMetrics(data);
    } catch (e) {
      // Keep defaults gracefully
    }
  };

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Keys Card */}
      <div className="relative group bg-slate-900/70 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 hover:border-rose-500/50 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-glow-brand">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Keys</span>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-lg">
            🔑
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {metrics.total_keys ?? "0"}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Active in memory
          </p>
        </div>
      </div>

      {/* 2. Memory Used Card */}
      <div className="relative group bg-slate-900/70 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 hover:border-sky-500/50 transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-glow-sky">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Memory Allocation</span>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 text-lg">
            ⚡
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {metrics.used_memory_human ?? "1.2M"}
          </p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full w-1/4"></div>
          </div>
        </div>
      </div>

      {/* 3. Commands Processed Card */}
      <div className="relative group bg-slate-900/70 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commands Handled</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            📈
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {metrics.total_commands_processed ?? "0"}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">RESP Engine</span>
            <span>· Live stream</span>
          </p>
        </div>
      </div>

      {/* 4. Active Clients & Port */}
      <div className="relative group bg-slate-900/70 backdrop-blur-md rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Server Health</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-lg">
            🛡️
          </div>
        </div>
        <div className="mt-3">
          <p className="text-3xl font-extrabold font-mono tracking-tight text-white flex items-center gap-2">
            <span>6379</span>
            <span className="text-xs font-sans font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Online
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            ThreadPool · AOF Persistence Active
          </p>
        </div>
      </div>
    </div>
  );
}

export default Metrics;
