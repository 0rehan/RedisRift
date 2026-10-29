import React, { useEffect, useState } from "react";
import axios from "axios";

function Metrics() {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axios.get("http://localhost:8000/api/metrics");
        setMetrics(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetch();
    const id = setInterval(fetch, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-medium">Total Keys</h2>
        <p className="text-2xl">{metrics.total_keys ?? "-"}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-medium">Memory Used</h2>
        <p className="text-2xl">{metrics.used_memory_human ?? "-"}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h2 className="font-medium">Commands Processed</h2>
        <p className="text-2xl">{metrics.total_commands_processed ?? "-"}</p>
      </div>
    </div>
  );
}

export default Metrics;

