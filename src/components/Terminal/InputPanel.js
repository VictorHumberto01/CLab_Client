"use client";

import React from "react";
import { Terminal } from "lucide-react";

const InputPanel = ({ input, setInput }) => {
  return (
    <div className="flex-1">
      <div className="flex items-center space-x-2 mb-2">
        <Terminal className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium">Input</span>
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter input for scanf (space/newline separated)"
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
    </div>
  );
};

export default InputPanel;