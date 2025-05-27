"use client";

import React from "react";
import {
  Play,
  Cloud,
  Bot,
  Code,
  FileText,
  Settings,
  Save,
  FolderOpen,
  Terminal,
  Loader2,
} from "lucide-react";

const MenuBar = ({ runInCloud, isRunning, showAiPanel, setShowAiPanel }) => {
  const handleRunClick = (e) => {
    e.preventDefault();
    if (!isRunning && typeof runInCloud === 'function') {
      runInCloud();
    }
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Code className="w-6 h-6 text-blue-400" />
          <span className="font-semibold text-lg">CLab IDE</span>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">Open</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
            <Save className="w-4 h-4" />
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors ${
            showAiPanel
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-800 hover:bg-gray-700"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span className="text-sm">AI Assistant</span>
        </button>

        <button
          onClick={handleRunClick}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
        >
          {isRunning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}
          <span className="text-sm">Run</span>
        </button>

        <button className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default MenuBar;