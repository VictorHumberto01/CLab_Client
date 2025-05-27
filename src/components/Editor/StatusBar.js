"use client";

import React from "react";

const StatusBar = ({ code, showSuggestions }) => {
  const lineCount = code.split("\n").length;
  const charCount = code.length;

  return (
    <div className="absolute bottom-4 right-4 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
      Lines: {lineCount} | Chars: {charCount}
      {showSuggestions && (
        <span className="ml-2 text-yellow-400">• IntelliSense</span>
      )}
    </div>
  );
};

export default StatusBar;