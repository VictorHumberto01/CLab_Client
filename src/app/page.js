"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { FileText } from "lucide-react";
import IntroModal from "../components/IntroModal";
import MenuBar from "../components/MenuBar";
import AnalysisPanel from "../components/AIPanel/AnalysisPanel";

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
  const [input, setInput] = useState("5 10");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showIntro, setShowIntro] = useState(true);

  // IntelliSense states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const textareaRef = useRef(null);

  // Trigger for Monaco Editor resize
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // Effect to trigger Monaco Editor resize when AI panel visibility changes
  useEffect(() => {
    setResizeTrigger(prev => prev + 1);
  }, [showAiPanel]);

  // Run code in cloud server
  const runInCloud = async () => {
    setIsRunning(true);
    setIsAnalyzing(true);
    setOutput("");
    setError("");
    setAiAnalysis(""); // Clear previous analysis

    try {
      // Check if input contains newlines to determine format
      const hasMultipleLines = input.includes('\n');
      const requestBody = {
        code: code,
        ...(hasMultipleLines 
          ? { inputLines: input.split('\n').filter(line => line.trim()) }
          : { input: input }
        )
      };

      const response = await fetch("http://localhost:8080/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

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
      setError(
        "Failed to connect to compiler service. Make sure your Go API is running on the main server",
      );
    } finally {
      setIsRunning(false);
      setIsAnalyzing(false);
    }
  };

  // Apply selected suggestion
  const applySuggestion = (suggestion) => {
    if (!suggestion) return;

    const textarea = textareaRef.current;
    const beforeCursor = code.substring(0, cursorPosition);
    const afterCursor = code.substring(cursorPosition);

    // Find the start of the current word
    const wordStart = beforeCursor.search(/[a-zA-Z_#][a-zA-Z0-9_]*$/);
    const start = wordStart === -1 ? cursorPosition : wordStart;

    let newText;
    let newCursorPos;

    if (suggestion.type === "function") {
      newText =
        beforeCursor.substring(0, start) + suggestion.name + "()" + afterCursor;
      newCursorPos = start + suggestion.name.length + 1; // Position cursor inside parentheses
    } else {
      newText =
        beforeCursor.substring(0, start) + suggestion.name + afterCursor;
      newCursorPos = start + suggestion.name.length;
    }

    setCode(newText);
    setShowSuggestions(false);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-950">
      <MenuBar 
        runInCloud={runInCloud}
        isRunning={isRunning}
        showAiPanel={showAiPanel}
        setShowAiPanel={setShowAiPanel}
      />
      
      <div className="flex flex-1 min-h-0">
        {/* Main Editor + IO Section */}
        <div className="flex flex-col flex-1">
          {/* Editor Area */}
          <div className="flex-1 min-h-0">
            <MonacoEditor 
              code={code}
              setCode={setCode}
              language="c"
              triggerResize={resizeTrigger}
            />
          </div>

          {/* Input/Output Panel */}
          <div className="h-48 border-t border-gray-800 bg-gray-900/50 backdrop-blur-sm flex">
            {/* Input Section */}
            <div className="flex-1 p-4 border-r border-gray-800">
              <h2 className="text-sm font-medium text-gray-400 mb-2">Input</h2>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-28 bg-gray-950 text-gray-300 font-mono text-sm p-2 rounded border border-gray-800 resize-none focus:outline-none focus:border-blue-500"
                placeholder="Program input..."
              />
            </div>

            {/* Output Section */}
            <div className="flex-1 p-4">
              <h2 className="text-sm font-medium text-gray-400 mb-2">Output</h2>
              <div className="w-full h-28 bg-gray-950 text-gray-300 font-mono text-sm p-2 rounded border border-gray-800 overflow-auto">
                {error ? (
                  <span className="text-red-400">{error}</span>
                ) : (
                  output || <span className="text-gray-500">Program output will appear here...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {showAiPanel && (
          <AnalysisPanel
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </div>

      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} />
    </main>
  );
};

export default IDE;