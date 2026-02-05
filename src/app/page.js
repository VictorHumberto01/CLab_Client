"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Terminal as TerminalIcon } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
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
  const [exerciseDescription, setExerciseDescription] = useState(""); 
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

  // Restore code and state
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedExerciseId = localStorage.getItem('clab-exercise-id');
        const defaultCode = `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`;

        if (storedExerciseId) {
            const exId = parseInt(storedExerciseId);
            setExerciseId(exId);
            
            const storedTitle = localStorage.getItem('clab-exercise-title');
            if (storedTitle) setExercise({ id: exId, title: storedTitle });
            
            const storedDesc = localStorage.getItem('clab-exercise-description');
            if (storedDesc) setExerciseDescription(storedDesc);

            const savedExerciseCode = localStorage.getItem(`clab-code-exercise-${exId}`);
            if (savedExerciseCode) {
                setCode(savedExerciseCode);
            } else {
                const targetInitialCode = localStorage.getItem('clab-target-initial-code');
                if (targetInitialCode) {
                    setCode(targetInitialCode);
                     localStorage.removeItem('clab-target-initial-code'); 
                } else {
                    setCode(defaultCode);
                }
            }
        } else {
            setExerciseId(null);
            setExercise(null);
            setExerciseDescription("");

            const savedScratchpad = localStorage.getItem('clab-code-scratchpad');
            if (savedScratchpad) {
                setCode(savedScratchpad);
            } else {
                setCode(defaultCode);
            }
        }
    }
  }, []);

  // Auto-save code
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (exerciseId) {
            localStorage.setItem(`clab-code-exercise-${exerciseId}`, code);
        } else {
            localStorage.setItem('clab-code-scratchpad', code);
        }
    }
  }, [code, exerciseId]);

  // Auto-save exercise metadata
  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (exercise) {
            localStorage.setItem('clab-exercise-id', exercise.id);
            localStorage.setItem('clab-exercise-title', exercise.title);
            if (exerciseDescription) {
                localStorage.setItem('clab-exercise-description', exerciseDescription);
            }
        } else {
            localStorage.removeItem('clab-exercise-id');
            localStorage.removeItem('clab-exercise-title');
            localStorage.removeItem('clab-exercise-description');
        }
    }
  }, [exercise, exerciseDescription]); 
  
  useEffect(() => {
      if (!exercise && typeof window !== 'undefined') {

      }
  }, [exercise]); 
  
  // Connect WebSocket
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsUrl = `${getWsUrl()}/ws`;

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            wsUrl += `?token=${token}`;
        }
    } 
    
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
            
            if (typeof text === 'string') {
                try {
                    if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
                         const payload = JSON.parse(text);
                         if (payload.type) { 
                             if (payload.type === 'ai_analysis' || (payload.type === 'status' && payload.payload === 'stopped')) {
                                 jsonPayload = payload;
                             }
                             outputText = ""; 
                         }
                    } else {
                        const aiMatch = text.match(/\{.*"type":"ai_analysis".*\}/);
                        const statusMatch = text.match(/\{.*"type":"status".*\}/);
                        
                        if (aiMatch) {
                            try { jsonPayload = JSON.parse(aiMatch[0]); } catch(e){}
                        } else if (statusMatch) {
                            try { jsonPayload = JSON.parse(statusMatch[0]); } catch(e){}
                        }

                        outputText = outputText.replace(/\{.*"type":".*?".*?\}/g, "");
                    }
                } catch (e) {
                    console.warn("Error parsing WS message:", e);
                }
            }

            if (jsonPayload) {
                if (jsonPayload.type === 'ai_analysis') {
                     setShowAiPanel(true);
                     setAiAnalysis(jsonPayload.payload);
                     setIsAnalyzing(false);
                } else if (jsonPayload.type === 'status' && jsonPayload.payload === 'stopped') {
                    setIsRunning(false);
                }
            }

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
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
            if (terminalRef.current?.term && typeof event.data === 'string' && !event.data.includes('"type":')) {
                terminalRef.current.term.write(event.data);
            }
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
  }, [user]); 

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
        exerciseId: parseInt(exerciseId) 
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
          setIsRunning(false); 
          if (terminalRef.current?.term) {
              terminalRef.current.term.writeln('\r\n\x1b[31m[Stopping process...]\x1b[0m');
          }
      }
  };

  const handleExitExercise = () => {
      setExerciseId(null);
      setExercise(null);
      setExerciseDescription("");
      
      if (typeof window !== 'undefined') {
          localStorage.removeItem('clab-exercise-id');
          localStorage.removeItem('clab-exercise-title');
          localStorage.removeItem('clab-exercise-description');
          
          const savedScratchpad = localStorage.getItem('clab-code-scratchpad');
          if (savedScratchpad) {
              setCode(savedScratchpad);
          } else {
              setCode(`#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`);
          }
      }
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <MenuBar 
            runInCloud={runCode} 
            stopCode={stopCode} 
            isRunning={isRunning}
            showAiPanel={showAiPanel}
            setShowAiPanel={setShowAiPanel}
            exercise={exercise}
            submitInCloud={submitInCloud}
            exitExercise={handleExitExercise}
        />
      
      <div className="flex flex-1 min-h-0 pt-0 px-0 pb-0 gap-0">
        {/* Main Editor + Terminal Section */}

        
        {/* Exercise Description Panel - LeetCode Style */}
        {exerciseId && exerciseDescription && (
             <div className="w-[400px] shrink-0 border-r border-border bg-surface overflow-y-auto p-6 flex flex-col">
                 <h2 className="text-xl font-bold text-foreground mb-4 font-sans">{exercise?.title}</h2>
                 <div className="prose prose-invert prose-sm max-w-none text-secondary">
                    <ReactMarkdown>{exerciseDescription}</ReactMarkdown>
                 </div>
             </div>
        )}

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
          <div className="h-64 border-t border-border bg-surface relative flex flex-col">
            <div className="px-3 py-1.5 border-b border-white/5 flex items-center justify-between bg-surface-hover select-none text-foreground">
                <div className="flex items-center">
                    <TerminalIcon size={12} className="mr-2 text-secondary" />
                    <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide">Terminal</span>
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
            
            <div className="flex-1 w-full bg-background p-2 min-h-0 relative overflow-hidden group">
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
                            className="bg-surface hover:bg-surface-hover text-foreground text-sm px-4 py-2 rounded-md border border-border shadow-lg flex items-center transition-all duration-200"
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
    </div>
  </div>
  );
};

export default IDE;