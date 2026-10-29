import React, { useEffect, useState } from "react";
import axios from "axios";

function KeyList() {
  const [keys, setKeys] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/api/keys");
        setKeys(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
    const id = setInterval(fetch, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow overflow-x-auto">
      <h2 className="font-medium mb-2">Key Explorer</h2>
      <table className="w-full table-auto">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-2 py-1 text-left">Key</th>
            <th className="px-2 py-1 text-left">Type</th>
            <th className="px-2 py-1 text-left">TTL (s)</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k.key} className="border-t">
              <td className="px-2 py-1">{k.key}</td>
              <td className="px-2 py-1">{k.type}</td>
              <td className="px-2 py-1">{k.ttl >= 0 ? k.ttl : "∞"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default KeyList;

