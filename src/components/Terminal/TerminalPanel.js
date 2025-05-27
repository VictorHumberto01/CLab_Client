"use client";

import React from "react";
import { Terminal } from "lucide-react";
import InputPanel from "./InputPanel";
import OutputPanel from "./OutputPanel";

const TerminalPanel = ({ input, setInput, output, error, isRunning }) => {
  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4 h-48">
      <div className="flex items-center space-x-4 mb-3">
        <InputPanel input={input} setInput={setInput} />
      </div>
      
      <OutputPanel 
        output={output} 
        error={error} 
        isRunning={isRunning} 
      />
    </div>
  );
};

export default TerminalPanel;