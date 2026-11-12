import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

/* ── SVG Icon Components ─────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
  </svg>
);

const RefreshIcon = ({ spinning }) => (
  <svg className={`w-4 h-4 ${spinning ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.49 9A9 9 0 005.64 5.64L4 4m16 16l-1.64-1.64A9 9 0 013.51 15" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CopyIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const KeyIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

const EmptyBoxIcon = () => (
  <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

/* ── TTL Circular Progress ───────────────────────────────────────────── */
const TtlCircle = ({ ttl }) => {
  const maxTtl = 300;
  const ratio = Math.min(ttl / maxTtl, 1);
  const circumference = 2 * Math.PI * 10;
  const offset = circumference - ratio * circumference;
  const isLow = ttl < 30;
  const strokeColor = isLow ? "#f87171" : "#fbbf24";
  const bgColor = isLow ? "rgba(248,113,113,0.15)" : "rgba(251,191,36,0.1)";
  const textColor = isLow ? "text-red-400" : "text-amber-400";
  const borderColor = isLow ? "border-red-500/25" : "border-amber-500/20";

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border ${borderColor} font-mono text-xs font-medium ${textColor}`} style={{ background: bgColor }}>
      <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" opacity={0.15} />
        <circle
          cx="12" cy="12" r="10" fill="none"
          stroke={strokeColor} strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {ttl}s
      {isLow && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
    </span>
  );
};

/* ── Type Badge Color Map ────────────────────────────────────────────── */
const typeBadgeStyles = {
  string:  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  list:    "bg-violet-500/10 text-violet-400 border-violet-500/20",
  set:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  hash:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  zset:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const getTypeBadge = (type) => {
  const t = (type || "string").toLowerCase();
  return typeBadgeStyles[t] || typeBadgeStyles.string;
};

/* ── Tooltip Wrapper ─────────────────────────────────────────────────── */
const Tooltip = ({ text, children }) => (
  <span className="relative group/tip">
    {children}
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 border border-slate-700 px-2 py-1 text-[10px] font-medium text-slate-300 opacity-0 shadow-xl transition-all duration-200 group-hover/tip:opacity-100 group-hover/tip:-top-10 z-50">
      {text}
      <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-px border-4 border-transparent border-t-slate-700" />
    </span>
  </span>
);

/* ══════════════════════════════════════════════════════════════════════ */
/*  KeyList Component                                                    */
/* ══════════════════════════════════════════════════════════════════════ */
function KeyList() {
  const [keys, setKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Add Key Form
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newTtl, setNewTtl] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Key Form
  const [selectedKey, setSelectedKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editTtl, setEditTtl] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("http://localhost:8000/api/keys");
      setKeys(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch keys:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
    const interval = setInterval(fetchKeys, 4000);
    return () => clearInterval(interval);
  }, [fetchKeys]);

  // Handle Add Key
  const handleAddKey = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newKey.trim()) {
      setFormError("Key name cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        value: newValue,
      };
      if (newTtl.trim()) {
        const ttlNum = parseInt(newTtl, 10);
        if (isNaN(ttlNum) || ttlNum <= 0) {
          setFormError("TTL must be a positive integer in seconds");
          setIsSubmitting(false);
          return;
        }
        payload.ttl = ttlNum;
      }

      await axios.post(`http://localhost:8000/api/key/${encodeURIComponent(newKey.trim())}`, payload);
      setNewKey("");
      setNewValue("");
      setNewTtl("");
      setIsAddOpen(false);
      fetchKeys();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message || "Failed to save key");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit / View Key Modal
  const openEditModal = async (k) => {
    setSelectedKey(k);
    setEditValue("");
    setEditTtl(k.ttl > 0 ? k.ttl.toString() : "");
    setIsEditOpen(true);
    setEditLoading(true);

    try {
      const { data } = await axios.get(`http://localhost:8000/api/key/${encodeURIComponent(k.key)}`);
      setEditValue(typeof data.value === "object" ? JSON.stringify(data.value, null, 2) : (data.value ?? ""));
    } catch (err) {
      console.error("Failed to load key value:", err);
    } finally {
      setEditLoading(false);
    }
  };

  // Save changes to existing key
  const handleSaveEdit = async () => {
    if (!selectedKey) return;
    try {
      setIsSubmitting(true);
      await axios.post(`http://localhost:8000/api/key/${encodeURIComponent(selectedKey.key)}`, {
        value: editValue,
      });

      if (editTtl.trim()) {
        const ttlNum = parseInt(editTtl, 10);
        if (!isNaN(ttlNum) && ttlNum > 0) {
          await axios.post(`http://localhost:8000/api/expire/${encodeURIComponent(selectedKey.key)}`, {
            ttl: ttlNum,
          });
        }
      }

      setIsEditOpen(false);
      fetchKeys();
    } catch (err) {
      alert("Error saving key: " + (err.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a key
  const handleDeleteKey = async (keyName) => {
    if (!window.confirm(`Are you sure you want to delete key "${keyName}"?`)) return;
    try {
      await axios.delete(`http://localhost:8000/api/key/${encodeURIComponent(keyName)}`);
      if (isEditOpen && selectedKey?.key === keyName) {
        setIsEditOpen(false);
      }
      fetchKeys();
    } catch (err) {
      alert("Failed to delete key: " + (err.response?.data?.error || err.message));
    }
  };

  const copyToClipboard = (text, keyName) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const filteredKeys = keys.filter((k) =>
    k.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl shadow-black/20">
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/10 border border-rose-500/10">
            <KeyIcon />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-white tracking-wide">Key-Value Explorer</h2>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-800 to-slate-800/80 text-slate-300 border border-slate-700 shadow-inner shadow-black/10">
                {filteredKeys.length} {filteredKeys.length === 1 ? "key" : "keys"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Live index of in-memory keys with active expiration timers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-rose-400 transition-colors duration-200">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Filter keys…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 w-44 sm:w-64 text-slate-200 placeholder-slate-600 transition-all duration-200 focus:shadow-[0_0_15px_rgba(244,63,94,0.08)]"
            />
          </div>

          {/* Refresh Button */}
          <Tooltip text="Refresh keys">
            <button
              onClick={fetchKeys}
              disabled={loading}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-800/70 border border-slate-700/80 rounded-xl hover:bg-slate-700/80 hover:border-slate-600 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshIcon spinning={loading} />
            </button>
          </Tooltip>

          {/* Add Key Button */}
          <button
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs sm:text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold pl-3 pr-4 py-2 rounded-xl shadow-lg shadow-rose-900/25 hover:shadow-rose-800/40 transition-all duration-200 hover:-translate-y-px active:translate-y-0"
          >
            <PlusIcon />
            <span>Add Key</span>
          </button>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/50 text-slate-500 text-[11px] uppercase font-mono tracking-widest border-b border-slate-800/80">
            <tr>
              <th className="px-5 py-3 font-semibold">Key Name</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold">Expiration (TTL)</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filteredKeys.length > 0 ? (
              filteredKeys.map((k, idx) => (
                <tr
                  key={k.key}
                  className={`group cursor-pointer transition-all duration-150 border-l-2 border-l-transparent hover:border-l-rose-500 hover:bg-slate-800/30 ${idx % 2 === 0 ? "bg-transparent" : "bg-slate-800/[0.06]"}`}
                  onClick={() => openEditModal(k)}
                >
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-200 max-w-xs truncate text-[13px]">
                    <span className="text-rose-500/60 mr-1.5 select-none group-hover:text-rose-400 transition-colors duration-150 font-bold">#</span>
                    {k.key}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md border uppercase tracking-widest ${getTypeBadge(k.type)}`}>
                      {k.type || "string"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    {k.ttl >= 0 ? (
                      <TtlCircle ttl={k.ttl} />
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1.5 text-xs">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
                        ∞ Persistent
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip text={copiedKey === k.key ? "Copied!" : "Copy key"}>
                        <button
                          onClick={() => copyToClipboard(k.key, k.key)}
                          className={`p-2 rounded-lg transition-all duration-150 ${copiedKey === k.key ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-slate-200 hover:bg-slate-700/60"}`}
                        >
                          {copiedKey === k.key ? <CheckIcon /> : <CopyIcon />}
                        </button>
                      </Tooltip>
                      <Tooltip text="Inspect key">
                        <button
                          onClick={() => openEditModal(k)}
                          className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all duration-150"
                        >
                          <EyeIcon />
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete key">
                        <button
                          onClick={() => handleDeleteKey(k.key)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
                        >
                          <TrashIcon />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30">
                      <EmptyBoxIcon />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">
                      {searchTerm
                        ? `No keys matching "${searchTerm}"`
                        : "No keys in database"}
                    </p>
                    <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                      {searchTerm
                        ? "Try adjusting your search filter or clear it to see all keys."
                        : "Click the \"+ Add Key\" button above or use the terminal below to store your first record."}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL: ADD KEY ─────────────────────────────────────────── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsAddOpen(false)}>
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/80 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent line */}
            <div className="h-[2px] bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500" />

            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-rose-500/10">
                  <PlusIcon />
                </div>
                <h3 className="font-bold text-white text-base">Create New Key</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors duration-150"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleAddKey} className="p-6 space-y-5">
              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Key Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user:session:token"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full text-sm bg-slate-950/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  Value Payload <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter string value or JSON payload..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full text-sm bg-slate-950/80 border border-slate-700/60 rounded-xl p-3.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 focus:outline-none transition-all duration-200 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  TTL Expiration <span className="text-slate-600 normal-case tracking-normal">(seconds, optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for persistent key (no TTL)"
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="w-full text-sm bg-slate-950/80 border border-slate-700/60 rounded-xl px-3.5 py-2.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 focus:outline-none transition-all duration-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 text-sm text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-lg shadow-rose-900/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.25} />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  {isSubmitting ? "Saving…" : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW & EDIT KEY ─────────────────────────────────── */}
      {isEditOpen && selectedKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setIsEditOpen(false)}>
          <div
            className="bg-slate-900 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/80 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient accent line */}
            <div className="h-[2px] bg-gradient-to-r from-sky-500 via-violet-400 to-sky-500" />

            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <span className={`shrink-0 text-[10px] px-2.5 py-0.5 font-mono font-bold uppercase rounded-md border tracking-widest ${getTypeBadge(selectedKey.type)}`}>
                  {selectedKey.type || "string"}
                </span>
                <h3 className="font-mono font-bold text-white truncate text-sm">{selectedKey.key}</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="shrink-0 text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors duration-150"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {editLoading ? (
                <div className="py-14 text-center text-slate-500 font-mono text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <svg className="w-6 h-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.2} />
                      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span>Reading key from storage…</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Stored Value
                    </label>
                    <textarea
                      rows="6"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-sm border border-slate-700/60 rounded-xl p-3.5 font-mono bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 focus:outline-none transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      TTL Expiration <span className="text-slate-600 normal-case tracking-normal">(seconds)</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 60 (leave empty for persistent)"
                      value={editTtl}
                      onChange={(e) => setEditTtl(e.target.value)}
                      className="w-full text-sm border border-slate-700/60 rounded-xl px-3.5 py-2.5 font-mono bg-slate-950/80 text-slate-100 focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 focus:outline-none transition-all duration-200"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteKey(selectedKey.key)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/30 rounded-xl transition-all duration-200"
                >
                  <TrashIcon />
                  Delete Key
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2.5 text-sm text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting || editLoading}
                    className="px-5 py-2.5 text-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold rounded-xl shadow-lg shadow-rose-900/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity={0.25} />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    )}
                    {isSubmitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KeyList;
