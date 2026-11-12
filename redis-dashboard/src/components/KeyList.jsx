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

  const filteredKeys = keys.filter((k) =>
    k.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Key-Value Explorer</h2>
          <p className="text-xs text-slate-500">Inspect, search, add, edit, and delete keys</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search keys..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm bg-white border border-slate-300 rounded-lg px-3 py-1.5 pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44 sm:w-56 transition"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchKeys}
            disabled={loading}
            title="Refresh keys"
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            🔄
          </button>

          {/* Add Key Button */}
          <button
            onClick={() => {
              setFormError("");
              setIsAddOpen(true);
            }}
            className="flex items-center space-x-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            <span>+</span>
            <span>Add Key</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/70 text-slate-600 text-xs uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">TTL</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredKeys.length > 0 ? (
              filteredKeys.map((k) => (
                <tr
                  key={k.key}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => openEditModal(k)}
                >
                  <td className="px-4 py-3 font-mono font-medium text-slate-900 max-w-xs truncate">
                    {k.key}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 uppercase">
                      {k.type || "string"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {k.ttl >= 0 ? (
                      <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        ⏱️ {k.ttl}s
                      </span>
                    ) : (
                      <span className="text-slate-400">∞ No expiration</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openEditModal(k)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.key)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                  {searchTerm
                    ? `No keys matching "${searchTerm}"`
                    : "No keys in Redis database yet. Click '+ Add Key' to create one!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD KEY */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Add New Key</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKey} className="p-6 space-y-4">
              {formError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Key Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user:profile:100"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Value *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Enter string value or JSON payload..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  TTL Expiration (Seconds, optional)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Leave empty for infinite TTL"
                  value={newTtl}
                  onChange={(e) => setNewTtl(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="text-xs px-2 py-0.5 font-bold uppercase rounded bg-blue-100 text-blue-700">
                  {selectedKey.type || "string"}
                </span>
                <h3 className="font-mono font-bold text-slate-800 truncate">{selectedKey.key}</h3>
              </div>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editLoading ? (
                <div className="py-8 text-center text-slate-400">Loading key value...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Value
                    </label>
                    <textarea
                      rows="6"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg p-3 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      TTL (Seconds)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 60 (empty for persistent)"
                      value={editTtl}
                      onChange={(e) => setEditTtl(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDeleteKey(selectedKey.key)}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 font-medium rounded-lg transition"
                >
                  Delete Key
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting || editLoading}
                    className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition disabled:opacity-50"
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
