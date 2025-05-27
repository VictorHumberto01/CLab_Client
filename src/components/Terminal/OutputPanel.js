"use client";

import React from "react";

const OutputPanel = ({ output, error, isRunning }) => {
  return (
    <div className="grid grid-cols-2 gap-4 h-24">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium text-gray-400">
            OUTPUT
          </span>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded p-2 h-16 overflow-auto">
          <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
            {output || (isRunning ? "Running..." : "No output yet")}
          </pre>
        </div>
      </div>

      <div>
        <div className="flex items-center space-x-2 mb-2">
          <div
            className={`w-3 h-3 rounded-full ${error ? "bg-red-500" : "bg-gray-600"}`}
          ></div>
          <span className="text-xs font-medium text-gray-400">
            ERRORS
          </span>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded p-2 h-16 overflow-auto">
          <pre className="text-xs text-red-400 whitespace-pre-wrap font-mono">
            {error || "No errors"}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default OutputPanel;