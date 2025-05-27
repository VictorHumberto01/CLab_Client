"use client";

import React from "react";
import { Lightbulb } from "lucide-react";

const Intellisense = ({ suggestions, selectedSuggestion, applySuggestion }) => {
  return (
    <div
      className="absolute bg-gray-800 border border-gray-600 rounded-md shadow-2xl z-50 min-w-80 max-w-96"
      style={{
        top: "120px",
        left: "60px",
      }}
    >
      <div className="px-3 py-1.5 border-b border-gray-700 bg-gray-900">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-3 h-3 text-yellow-400" />
          <span className="text-xs font-medium text-gray-300">
            IntelliSense
          </span>
          <span className="text-xs text-gray-500">
            ({suggestions.length})
          </span>
        </div>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`px-3 py-2 cursor-pointer border-b border-gray-750 last:border-b-0 transition-colors ${
              index === selectedSuggestion
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-700 text-gray-200"
            }`}
            onClick={() => applySuggestion(suggestion)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    suggestion.type === "keyword"
                      ? "bg-purple-400"
                      : suggestion.type === "function"
                        ? "bg-green-400"
                        : "bg-blue-400"
                  }`}
                ></div>
                <span className="font-mono text-sm font-medium">
                  {suggestion.name}
                </span>
              </div>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  suggestion.type === "keyword"
                    ? "bg-purple-600 text-purple-100"
                    : suggestion.type === "function"
                      ? "bg-green-600 text-green-100"
                      : "bg-blue-600 text-blue-100"
                }`}
              >
                {suggestion.type}
              </span>
            </div>
            {suggestion.signature && (
              <div className="mt-0.5 text-xs text-gray-400 font-mono truncate">
                {suggestion.signature}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="px-3 py-1.5 bg-gray-900 text-xs text-gray-400 border-t border-gray-700">
        ↑↓ navigate • Tab/Enter select • Esc close
      </div>
    </div>
  );
};

export default Intellisense;