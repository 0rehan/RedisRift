import React from "react";
import Metrics from "./components/Metrics";
import KeyList from "./components/KeyList";
import Terminal from "./components/Terminal";

function App() {
  return (
    <div className="min-h-screen p-6 bg-gray-100 space-y-6">
      <h1 className="text-2xl font-bold">RedisRift Dashboard</h1>
      <Metrics />
      <KeyList />
      <Terminal />
    </div>
  );
}

export default App;

