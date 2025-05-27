"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import MenuBar from "../components/MenuBar";
import CodeEditor from "../components/Editor/CodeEditor";
import TerminalPanel from "../components/Terminal/TerminalPanel";
import AnalysisPanel from "../components/AIPanel/AnalysisPanel";

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

  // IntelliSense states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const textareaRef = useRef(null);

  // Run code in cloud server
  const runInCloud = async () => {
    setIsRunning(true);
    setOutput("");
    setError("");

    try {
      const response = await fetch("http://localhost:8080/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          input: input,
        }),
      });

      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setOutput(result.output || "");
      }
    } catch (err) {
      setError(
        "Failed to connect to compiler service. Make sure your Go API is running on localhost:8080",
      );
    } finally {
      setIsRunning(false);
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

  // Simulate AI analysis
  const analyzeCode = async () => {
    setIsAnalyzing(true);
    setAiAnalysis("");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock AI analysis based on code content
    let analysis = "## Code Analysis\n\n";

    if (code.includes("scanf")) {
      analysis +=
        "✅ **Input Detection**: Found `scanf` statements requiring user input.\n\n";
    }

    if (code.includes("printf")) {
      analysis +=
        "✅ **Output Operations**: Code includes output statements.\n\n";
    }

    if (code.includes("int main")) {
      analysis += "✅ **Structure**: Valid C program structure detected.\n\n";
    }

    analysis += "### Suggestions:\n";
    analysis += "- Consider adding input validation\n";
    analysis += "- Use more descriptive variable names\n";
    analysis += "- Add error handling for scanf\n\n";

    analysis += "### Security Notes:\n";
    analysis += "- `scanf` can be vulnerable to buffer overflow\n";
    analysis += "- Consider using `fgets` for string input";

    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  // Auto-analyze when code changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.trim() && showAiPanel) {
        analyzeCode();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, showAiPanel]);

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      <MenuBar 
        runInCloud={runInCloud}
        isRunning={isRunning}
        showAiPanel={showAiPanel}
        setShowAiPanel={setShowAiPanel}
      />

      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-900 px-4 py-2 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">main.c</span>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </div>
          </div>

          <CodeEditor 
            code={code}
            setCode={setCode}
            cursorPosition={cursorPosition}
            setCursorPosition={setCursorPosition}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            selectedSuggestion={selectedSuggestion}
            setSelectedSuggestion={setSelectedSuggestion}
            applySuggestion={applySuggestion}
          />

          <TerminalPanel 
            input={input}
            setInput={setInput}
            output={output}
            error={error}
            isRunning={isRunning}
          />
        </div>

        {showAiPanel && (
          <AnalysisPanel 
            aiAnalysis={aiAnalysis}
            isAnalyzing={isAnalyzing}
          />
        )}
      </div>
    </div>
  );
};

export default IDE;
