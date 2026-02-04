"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Terminal, Database } from "lucide-react";
import IntroModal from "../components/IntroModal";
import MenuBar from "../components/MenuBar";
import AnalysisPanel from "../components/AIPanel/AnalysisPanel";
import api from "../utils/api";

// Import Monaco Editor dynamically to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("../components/Editor/MonacoEditor"),
  { ssr: false }
);

const IDE = () => {
  const [code, setCode] = useState(`#include <stdio.h>

int main() {
    printf("Hello, World!");

    return 0;
}`);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // Trigger for Monaco Editor resize
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // Effect to trigger Monaco Editor resize when AI panel visibility changes
  useEffect(() => {
    setResizeTrigger(prev => prev + 1);
  }, [showAiPanel]);

  // Restore code from history if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const restoredCode = localStorage.getItem('clab-restore-code');
        if (restoredCode) {
            setCode(restoredCode);
            localStorage.removeItem('clab-restore-code');
        }
    }
  }, []);

  // Run code in cloud server
  const runInCloud = async (overrideInputs = null) => {
    setIsRunning(true);
    setIsAnalyzing(true);
    setOutput("");
    setError("");
    setAiAnalysis(""); // Clear previous analysis

    try {
      // Use overrideInputs if provided (though we removed the interactive terminal, keeping arg for flexibility)
      // Otherwise use the manual input state
      const inputToUse = typeof overrideInputs === 'string' ? overrideInputs : input;

      const hasMultipleLines = inputToUse && inputToUse.includes('\n');
      const requestBody = {
        code: code,
        ...(hasMultipleLines 
          ? { inputLines: inputToUse.split('\n').filter(line => line.trim()) }
          : { input: inputToUse }
        )
      };

      // Use Axios API instance for consistent Auth and Logging
      const response = await api.post("/compile", requestBody);
      const result = response.data;

      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output || "");
      }

      // Update AI analysis with server response
      if (result.analysis) {
        setAiAnalysis(result.analysis);
      }
    } catch (err) {
      console.error("Compile Error:", err);
      // Construct a more useful error message based on the error type
      let errorMessage = "Failed to connect to compiler service.";
      
      if (err.code === "ERR_NETWORK") {
         errorMessage += " Server is unreachable (Connection Refused).";
      } else if (err.response) {
         errorMessage += ` Server Error (${err.response.status}): ${err.response.data?.error || "Unknown Error"}`;
      }
      
      setError(errorMessage);
    } finally {
      setIsRunning(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <MenuBar 
        runInCloud={() => runInCloud(null)}
        isRunning={isRunning}
        showAiPanel={showAiPanel}
        setShowAiPanel={setShowAiPanel}
      />
      
      <div className="flex flex-1 min-h-0 pt-0 px-0 pb-0 gap-0">
        {/* Main Editor + IO Section */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Editor Area */}
          <div className="flex-1 min-h-0 border-r border-border bg-background">
            <MonacoEditor 
              code={code}
              setCode={setCode}
              language="c"
              triggerResize={resizeTrigger}
            />
          </div>

          {/* Input/Output Panel */}
          <div className="h-48 border-t border-border bg-surface relative">
            <div className="grid grid-cols-2 h-full">
                {/* Input Section */}
                <div className="flex flex-col border-r border-border min-h-0">
                <div className="px-3 py-1.5 border-b border-border flex items-center bg-surface-hover select-none">
                    <Database size={12} className="mr-2 text-secondary" />
                    <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide">Entrada</span>
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 w-full bg-background p-3 text-sm font-mono text-foreground resize-none focus:outline-none placeholder-secondary/50"
                    placeholder="Entrada padrão (stdin)..."
                />
                </div>

                {/* Output Section */}
                <div className="flex flex-col min-h-0 relative">
                <div className="px-3 py-1.5 border-b border-border flex items-center justify-between bg-surface-hover select-none">
                    <div className="flex items-center">
                        <Terminal size={12} className="mr-2 text-secondary" />
                        <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide">Terminal</span>
                    </div>
                    {isRunning && (
                        <span className="text-[10px] text-accent font-mono flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse"/>
                            Executando
                        </span>
                    )}
                </div>
                <div className="flex-1 w-full bg-background p-3 text-sm font-mono overflow-auto">
                    {error ? (
                    <div className="text-red-400 whitespace-pre-wrap font-mono relative pl-3">
                        <span className="absolute left-0 top-1 w-0.5 h-3 bg-red-400" />
                        {error}
                    </div>
                    ) : (
                    output ? (
                        <div className="text-foreground whitespace-pre-wrap">{output}</div>
                    ) : (
                        <span className="text-secondary italic">Sem saída.</span>
                    )
                    )}
                </div>
                </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {showAiPanel && (
          <div className="w-[350px] shrink-0 border-l border-border bg-background">
             <AnalysisPanel
                aiAnalysis={aiAnalysis}
                isAnalyzing={isAnalyzing}
             />
          </div>
        )}
      </div>

      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} />
    </main>
  );
};

export default IDE;