"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, Send, AlertTriangle } from 'lucide-react';

const InteractiveTerminal = ({ steps = [], isComplex, onComplete, onCancel }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [history, setHistory] = useState([]); // Array of { type: 'output' | 'input', text: string }
  const [currentInput, setCurrentInput] = useState("");
  const [collectedInputs, setCollectedInputs] = useState([]);
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize history with pre-input prompts
  useEffect(() => {
    processSteps(0, [], collectedInputs);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    if (inputRef.current) {
        inputRef.current.focus();
    }
  }, [history, currentStepIndex]);

  const processSteps = (startIndex, currentHistory, currentCollected) => {
    let newHistory = [...currentHistory];
    let nextIndex = startIndex;

    // Fast-forward through 'print' steps until we hit an input or end
    while (nextIndex < steps.length && steps[nextIndex].type === 'print') {
      newHistory.push({ type: 'output', text: steps[nextIndex].content });
      nextIndex++;
    }

    setHistory(newHistory);
    setCurrentStepIndex(nextIndex);

    // If we reached the end, we are done!
    if (nextIndex >= steps.length) {
       onComplete(currentCollected.join('\n'));
    }
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const inputValue = currentInput;
    const newCollected = [...collectedInputs, inputValue];
    setCollectedInputs(newCollected);
    setCurrentInput("");

    // Add user input to visual history
    const historyWithInput = [...history, { type: 'input', text: inputValue }];

    // Move to next step (skipping the 'input' step we just satisfied)
    // Pass newCollected explicitly because state update is async
    processSteps(currentStepIndex + 1, historyWithInput, newCollected);
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] font-mono text-sm relative">
       {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-[#18181b]">
        <div className="flex items-center text-accent">
           <TerminalIcon size={14} className="mr-2" />
           <span className="font-semibold tracking-wide text-xs">Interactive Terminal</span>
        </div>
        
        <div className="flex items-center space-x-3">
            {isComplex && (
                 <div className="flex items-center text-yellow-500 text-[10px]" title="Logic loops detected. Simulation might not be perfect.">
                    <AlertTriangle size={12} className="mr-1" />
                    <span>Complex Logic</span>
                 </div>
            )}
            <button 
                onClick={onCancel}
                className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
                Cancel
            </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin">
         {history.map((item, idx) => (
             <div key={idx} className={`${item.type === 'input' ? 'text-white font-bold' : 'text-gray-300'} whitespace-pre-wrap flex`}>
                 {item.type === 'input' && <span className="text-secondary mr-2">{'>'}</span>}
                 {item.text}
             </div>
         ))}

         {/* Input Field */}
         {currentStepIndex < steps.length && steps[currentStepIndex].type === 'input' && (
             <form onSubmit={handleInputSubmit} className="flex items-center mt-1">
                 <span className="text-accent mr-2 animate-pulse">{'>'}</span>
                 <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-700"
                    placeholder="Enter value..."
                    autoFocus
                 />
             </form>
         )}
         
         {currentStepIndex >= steps.length && (
            <div className="text-green-500 mt-4 italic text-xs">
                -- Input collection complete. Running code... --
            </div>
         )}

         <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default InteractiveTerminal;
