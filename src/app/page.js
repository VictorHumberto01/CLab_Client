"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Terminal as TerminalIcon } from "lucide-react";
import IntroModal from "../components/IntroModal";
import MenuBar from "../components/MenuBar";
import AnalysisPanel from "../components/AIPanel/AnalysisPanel"; 
import Terminal from "../components/Terminal/Terminal";
import { useAuth } from "../context/AuthContext";
import { getWsUrl } from "../utils/api";

// Import Monaco Editor dynamically to avoid SSR issues
const MonacoEditor = dynamic(
  () => import("../components/Editor/MonacoEditor"),
  { ssr: false }
);

const IDE = () => {
  const [code, setCode] = useState(`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`);
  const [isRunning, setIsRunning] = useState(false);
  const [exerciseId, setExerciseId] = useState(null);
  const [exercise, setExercise] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  
  // WebSocket State
  const wsRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const terminalRef = useRef(null);
  const { user } = useAuth();
  
  // Trigger for Monaco Editor resize
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setResizeTrigger(prev => prev + 1);
  }, [showAiPanel]);

  // Restore code
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const restoredCode = localStorage.getItem('clab-restore-code');
        if (restoredCode) {
            setCode(restoredCode);

            localStorage.removeItem('clab-restore-code');
        }
        
        const storedExerciseId = localStorage.getItem('clab-exercise-id');
        const storedExerciseTitle = localStorage.getItem('clab-exercise-title');
        
        if (storedExerciseId) {
            setExerciseId(parseInt(storedExerciseId));
            if (storedExerciseTitle) {
                setExercise({ id: parseInt(storedExerciseId), title: storedExerciseTitle });
            }
        } else {
            setExerciseId(null);
            setExercise(null);
        }
    }
  }, []);

  // Connect WebSocket
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${getWsUrl()}/ws`; 
    
    // Close existing connection if any
    if (wsRef.current) {
        wsRef.current.close();
    }

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      if (terminalRef.current?.term) {
        terminalRef.current.term.writeln('\x1b[32m[Connected to CLab Compilation Server]\x1b[0m');
      }
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      // Don't nullify ws here immediately to avoid flickering, or do it if you want to ensure cleanup
      // setWs(null); 
       if (terminalRef.current?.term) {
        terminalRef.current.term.writeln('\r\n\x1b[31m[Disconnected]\x1b[0m');
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
      setIsConnected(false);
    };

    socket.onmessage = (event) => {
        try {
            const text = event.data;
            let outputText = text;
            let jsonPayload = null;

            // Robust JSON extraction for AI Analysis
            // We look for the specific marker and try to extract the object
            const marker = '{"type":"ai_analysis"';
            const markerIndex = typeof text === 'string' ? text.indexOf(marker) : -1;

            if (markerIndex !== -1) {
                 // Found the potential start of the JSON
                 // Strategy: Assume JSON ends at the last '}' in the string 
                 // (This assumes the AI JSON is the last/main JSON object in the stream chunk)
                 const lastBraceIndex = text.lastIndexOf('}');
                 
                 if (lastBraceIndex > markerIndex) {
                     const jsonCandidate = text.substring(markerIndex, lastBraceIndex + 1);
                     try {
                         const parsed = JSON.parse(jsonCandidate);
                         if (parsed.type === 'ai_analysis') {
                             jsonPayload = parsed;
                             
                             // Construct the terminal output by removing the JSON part
                             const preText = text.substring(0, markerIndex);
                             const postText = text.substring(lastBraceIndex + 1);
                             outputText = preText + postText;
                         }
                     } catch (e) {
                         // Failed to parse extracted chunk, fall back to process original text
                         console.warn("Failed to parse extracted AI JSON:", e);
                     }
                 }
            } else {
                 // Try parsing the whole text as JSON (fallback for clean messages)
                 if (typeof text === 'string' && text.trim().startsWith('{')) {
                     try {
                         const msg = JSON.parse(text);
                         if (msg.type === 'ai_analysis') {
                             jsonPayload = msg;
                             outputText = ""; // Don't print anything to terminal
                         }
                     } catch (e) {
                         // Not valid JSON, process as text
                     }
                 }
            }

            // Handle AI Action
            if (jsonPayload) {
                 setAiAnalysis(jsonPayload.payload);
                 setIsAnalyzing(false);
                 setShowAiPanel(true);
            }
            
            // Output to Terminal
            if (outputText) {
                if (terminalRef.current?.write) {
                    terminalRef.current.write(outputText);
                } else if (terminalRef.current?.term) {
                    terminalRef.current.term.write(outputText);
                }
                
                if (outputText.includes("Program exited")) {
                    setIsRunning(false);
                }
                if (outputText.includes("Analyzing...")) {
                    setIsAnalyzing(true);
                }
            }
            
        } catch (e) {
            console.error("WS Message Error", e);
        }
    };

    wsRef.current = socket;
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
          wsRef.current.close();
      }
    };
  }, []); // Run once on mount to setup initial connection

  // Re-connect trigger (manual)
  const handleConnect = () => {
      connectWebSocket();
  };

  const handleTerminalData = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "input", payload: data }));
    }
  };

  const handleTerminalResize = ({ rows, cols }) => {
     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
         wsRef.current.send(JSON.stringify({ type: "resize", rows: rows, cols: cols }));
     }
  };

  const runCode = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        if (terminalRef.current?.term) {
            terminalRef.current.term.writeln('\x1b[31m[Error] Not connected to server.\x1b[0m');
        }
        return;
    }
    
    setIsRunning(true);
    if (terminalRef.current?.term) {
        terminalRef.current.term.clear();
        terminalRef.current.term.writeln('\x1b[33m[Compiling and Running...]\x1b[0m');
    }

    // Send code with exerciseId = 0 (Regular run)
    wsRef.current.send(JSON.stringify({ 
        type: "run_code", 
        payload: code, 
        exerciseId: 0 
    }));
  };

  const submitInCloud = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    if (!exerciseId) return;

    setIsRunning(true);
    if (terminalRef.current?.term) {
        terminalRef.current.term.clear();
        terminalRef.current.term.writeln('\x1b[35m[Submitting for Validation...]\x1b[0m');
    }

    wsRef.current.send(JSON.stringify({ 
        type: "run_code", 
        payload: code, 
        exerciseId: exerciseId 
    }));
  };

  const exitExercise = () => {
      if (confirm("Deseja sair do exercício? O código atual não será perdido.")) {
          setExerciseId(null);
          setExercise(null);
          localStorage.removeItem('clab-exercise-id');
          localStorage.removeItem('clab-exercise-title');
      }
  };

  const stopCode = () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }));
          setIsRunning(false); // Optimistic update
          if (terminalRef.current?.term) {
              terminalRef.current.term.writeln('\r\n\x1b[31m[Stopping process...]\x1b[0m');
          }
      }
  };

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      <MenuBar 
        runInCloud={runCode}
        submitInCloud={submitInCloud}
        stopCode={stopCode}
        isRunning={isRunning}
        showAiPanel={showAiPanel}
        setShowAiPanel={setShowAiPanel}
        exercise={exercise}
        exitExercise={exitExercise}
      />
      
      <div className="flex flex-1 min-h-0 pt-0 px-0 pb-0 gap-0">
        {/* Main Editor + Terminal Section */}
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

          {/* Terminal Panel */}
          <div className="h-64 border-t border-border bg-black relative flex flex-col">
            <div className="px-3 py-1.5 border-b border-white/10 flex items-center justify-between bg-zinc-900 select-none text-white">
                <div className="flex items-center">
                    <TerminalIcon size={12} className="mr-2 text-zinc-400" />
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wide">Terminal</span>
                </div>
                <div className="flex items-center space-x-3">
                     {isConnected ? (
                        <span className="flex items-center text-[10px] text-green-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"/>
                            Online
                        </span>
                    ) : (
                        <span className="flex items-center text-[10px] text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"/>
                            Offline
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex-1 w-full bg-black p-2 min-h-0 relative overflow-hidden group">
                <Terminal 
                    onData={handleTerminalData} 
                    onResize={handleTerminalResize}
                    terminalRef={terminalRef}
                />
                
                {/* Disconnected Overlay */}
                {!isConnected && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
                        <button 
                            onClick={handleConnect}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm px-4 py-2 rounded-md border border-zinc-700 shadow-lg flex items-center transition-all duration-200"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"/>
                            Connect to Server
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* AI Analysis Panel */}
        {showAiPanel && (
          <div className="w-[350px] shrink-0 border-l border-border bg-background">
             <AnalysisPanel
                code={code}
                user={user}
                isAnalyzing={isAnalyzing} 
                aiAnalysis={aiAnalysis}
             />
          </div>
        )}
      </div>

      <IntroModal isOpen={showIntro} onClose={() => setShowIntro(false)} />
    </main>
  );
};

export default IDE;