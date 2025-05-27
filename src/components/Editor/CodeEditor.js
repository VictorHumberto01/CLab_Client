"use client";

import { Main } from "next/document";
import React, { useEffect, useRef } from "react";

const CodeEditor = ({
  code,
  setCode,
  cursorPosition,
  setCursorPosition,
  suggestions,
  setSuggestions,
  showSuggestions,
  setShowSuggestions,
  selectedSuggestion,
  setSelectedSuggestion,
  applySuggestion,
}) => {
  const editorRef = useRef(null);

  // Handle tab and other special keys
  const handleKeyDown = (e) => {
    const brackets = {
      "(": ")",
      "{": "}",
      "[": "]",
      '"': '"',
      "'": "'",
    };

    // Handle Tab key
    if (e.key === 'Tab') {
      e.preventDefault();
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      
      // Insert 2 spaces for tab
      const newText = 
        code.substring(0, selStart) + 
        "  " + 
        code.substring(selEnd);
      
      setCode(newText);
      
      // Move cursor after indent
      setTimeout(() => {
        e.target.selectionStart = selStart + 2;
        e.target.selectionEnd = selStart + 2;
      }, 0);
      return;
    }

    // Handle auto-closing brackets
    if (brackets[e.key]) {
      e.preventDefault();
      const selStart = e.target.selectionStart;
      const selEnd = e.target.selectionEnd;
      const newText =
        code.substring(0, selStart) +
        e.key +
        brackets[e.key] +
        code.substring(selEnd);

      setCode(newText);

      // Place cursor between brackets
      setTimeout(() => {
        e.target.selectionStart = selStart + 1;
        e.target.selectionEnd = selStart + 1;
      }, 0);
    }

    // Handle IntelliSense navigation
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (e.key === 'Enter' && suggestions.length > 0) {
        e.preventDefault();
        applySuggestion(suggestions[selectedSuggestion]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  // Enhanced IntelliSense trigger
  const handleInput = (e) => {
    const text = e.target.value;
    const pos = e.target.selectionStart;
    setCode(text);
    setCursorPosition(pos);

    // Get word before cursor
    const beforeCursor = text.substring(0, pos);
    const wordMatch = beforeCursor.match(/[\w_#]+$/);

    if (wordMatch && wordMatch[0].length >= 2) { // Reduced to 2 characters
      const matchedText = wordMatch[0].toLowerCase();
      const suggestions = getCSuggestions(matchedText);
      
      if (suggestions.length > 0) {
        setSuggestions(suggestions);
        setShowSuggestions(true);
        setSelectedSuggestion(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Enhanced C language suggestions
  const getCSuggestions = (prefix) => {
    const cKeywords = [
      // Standard C keywords
      { name: "include", type: "preprocessor", desc: "#include directive" },
      { name: "stdio.h", type: "library", desc: "Standard I/O header" },
      { name: "stdlib.h", type: "library", desc: "Standard library header" },
      { name: "string.h", type: "library", desc: "String handling header" },
      { name: "printf", type: "function", desc: "Print formatted output" },
      { name: "scanf", type: "function", desc: "Read formatted input" },
      { name: "malloc", type: "function", desc: "Allocate memory" },
      { name: "free", type: "function", desc: "Free allocated memory" },
      { name: "strlen", type: "function", desc: "Get string length" },
      { name: "strcpy", type: "function", desc: "Copy string" },
      { name: "return", type: "keyword", desc: "Return statement" },
      { name: "int", type: "type", desc: "Integer type" },
      { name: "char", type: "type", desc: "Character type" },
      { name: "float", type: "type", desc: "Floating point type" },
      { name: "double", type: "type", desc: "Double precision type" },
      { name: "void", type: "type", desc: "Void type" },
      { name: "struct", type: "keyword", desc: "Structure declaration" },
      { name: "while", type: "keyword", desc: "While loop" },
      { name: "for", type: "keyword", desc: "For loop" },
      { name: "if", type: "keyword", desc: "If condition" },
      { name: "else", type: "keyword", desc: "Else statement" },
      { name: "switch", type: "keyword", desc: "Switch statement" },
      { name: "case", type: "keyword", desc: "Case label" },
      { name: "break", type: "keyword", desc: "Break statement" },
      { name: "continue", type: "keyword", desc: "Continue statement" },
    ];

    return cKeywords
      .filter(k => k.name.toLowerCase().includes(prefix))
      .slice(0, 8); // Show more suggestions
  };

  return (
    <div className="relative flex-1 bg-gray-950">
      <textarea
        ref={editorRef}
        value={code}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        className="w-full h-full bg-transparent text-gray-300 font-mono p-4 resize-none outline-none"
        spellCheck="false"
      />

      {showSuggestions && (
        <div
          className="absolute bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto"
          style={{
            left: `${editorRef.current?.selectionStart * 8}px`,
            top: `${editorRef.current?.selectionEnd * 20}px`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              className={`px-4 py-2 cursor-pointer ${
                index === selectedSuggestion 
                  ? "bg-blue-600" 
                  : "hover:bg-gray-700"
              }`}
              onClick={() => applySuggestion(suggestion)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">{suggestion.name}</span>
                <span className="ml-4 text-xs text-gray-400">{suggestion.type}</span>
              </div>
              {index === selectedSuggestion && suggestion.desc && (
                <div className="text-xs text-gray-400 mt-1">{suggestion.desc}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
