import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

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
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">Key-Value Explorer</h2>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredKeys.length} keys
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Live index of in-memory keys with active expiration timers</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs sm:text-sm bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5 pl-8 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 w-40 sm:w-56 text-slate-200 placeholder-slate-500 transition"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchKeys}
            disabled={loading}
            title="Refresh database keys"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/70 border border-slate-700/80 rounded-xl hover:bg-slate-700 transition"
          >
            🔄
          </button>

          {/* Add Key Button */}
          <button
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="flex items-center space-x-1.5 text-xs sm:text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold px-3.5 py-1.5 rounded-xl shadow-lg shadow-rose-900/30 transition duration-200"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Key</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase font-mono tracking-wider border-b border-slate-800/80">
            <tr>
              <th className="px-5 py-3">Key Name</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Expiration (TTL)</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredKeys.length > 0 ? (
              filteredKeys.map((k) => (
                <tr
                  key={k.key}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => openEditModal(k)}
                >
                  <td className="px-5 py-3.5 font-mono font-medium text-slate-200 max-w-xs truncate">
                    <span className="text-slate-500 mr-2 select-none group-hover:text-rose-400 transition">#</span>
                    {k.key}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                      {k.type || "string"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs">
                    {k.ttl >= 0 ? (
                      <span className="text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        {k.ttl}s remaining
                      </span>
                    ) : (
                      <span className="text-slate-500">∞ Persistent</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyToClipboard(k.key, k.key)}
                      title="Copy key name"
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition"
                    >
                      {copiedKey === k.key ? "✓ Copied" : "Copy"}
                    </button>
                    <button
                      onClick={() => openEditModal(k)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 transition"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.key)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-3xl">📭</span>
                    <p className="text-sm font-medium text-slate-400">
                      {searchTerm
                        ? `No keys matching "${searchTerm}"`
                        : "No keys in Redis database yet."}
                    </p>
                    <p className="text-xs text-slate-500">
                      Click the "+ Add Key" button or use the terminal below to store records.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD KEY */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2">
                <span className="text-rose-500 font-bold text-lg">➕</span>
                <h3 className="font-bold text-white text-base">Create New Key</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="p-6 space-y-4">
              {formError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Key Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user:session:token"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full text-sm bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  Value Payload *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter string value or JSON payload..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full text-sm bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                  TTL Expiration (Seconds, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for persistent key (no TTL)"
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="w-full text-sm bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono text-white placeholder-slate-600 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-900/30 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & EDIT KEY */}
      {isEditOpen && selectedKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <span className="text-xs px-2.5 py-0.5 font-mono font-bold uppercase rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {selectedKey.type || "string"}
                </span>
                <h3 className="font-mono font-bold text-white truncate text-base">{selectedKey.key}</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editLoading ? (
                <div className="py-12 text-center text-slate-400 font-mono text-sm">
                  <span className="inline-block animate-spin mr-2">⚙️</span>
                  Reading key from C++ storage...
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                      Stored Value
                    </label>
                    <textarea
                      rows="6"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-sm border border-slate-700/80 rounded-xl p-3.5 font-mono bg-slate-950 text-slate-100 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono">
                      TTL Expiration (Seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 60 (leave empty for persistent)"
                      value={editTtl}
                      onChange={(e) => setEditTtl(e.target.value)}
                      className="w-full text-sm border border-slate-700/80 rounded-xl px-3.5 py-2.5 font-mono bg-slate-950 text-slate-100 focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteKey(selectedKey.key)}
                  className="px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl transition"
                >
                  Delete Key
                </button>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting || editLoading}
                    className="px-5 py-2 text-sm bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold rounded-xl shadow-lg shadow-rose-900/30 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
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
