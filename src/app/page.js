"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Terminal as TerminalIcon, Shield, CheckCircle } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Import ReactMarkdown
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
  const [isExam, setIsExam] = useState(false);
  const [expireDate, setExpireDate] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(true);
  
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

            const storedIsExam = localStorage.getItem('clab-exercise-is-exam');
            const isExamMode = storedIsExam === 'true';
            setIsExam(isExamMode);
            if (isExamMode) setShowAiPanel(false); // Force AI Panel off for exams

            const storedExpire = localStorage.getItem('clab-exercise-expire-date');
            if (storedExpire) setExpireDate(storedExpire);
            else setExpireDate(null);

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

  // Exam Mode State
  const [examQuestions, setExamQuestions] = useState([]);
  const [examTopicTitle, setExamTopicTitle] = useState("");
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());

  // Auto-detect Active Exam on Load
  useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    
    const checkForActiveExam = async () => {
        try {
            const token = localStorage.getItem('token');
            const baseUrl = window.localStorage.getItem('clab-server-ip') || 'http://localhost:8080';
            
            // Fetch classrooms
            const res = await fetch(`${baseUrl}/classrooms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            
            if (json.success && json.data) {
                // Find a classroom with an active exam
                const classroomWithExam = json.data.find(cls => cls.activeExamId);
                
                if (classroomWithExam) {
                    // Fetch topics for this classroom
                    const topicsRes = await fetch(`${baseUrl}/classrooms/${classroomWithExam.id}/topics`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const topicsJson = await topicsRes.json();
                    
                    if (topicsJson.success && topicsJson.data) {
                        const examTopic = topicsJson.data.find(t => t.id === classroomWithExam.activeExamId);
                        
                        if (examTopic && examTopic.exercises && examTopic.exercises.length > 0) {
                            // Activate Exam Mode!
                            setIsExam(true);
                            setShowAiPanel(false);
                            setExamQuestions(examTopic.exercises);
                            setExamTopicTitle(examTopic.title);
                            
                            // Store context
                            localStorage.setItem('clab-classroom-id', classroomWithExam.id.toString());
                            localStorage.setItem('clab-topic-id', examTopic.id.toString());
                            localStorage.setItem('clab-exercise-is-exam', 'true');
                            
                            // If no exercise is currently selected, auto-select the first one
                            if (!exerciseId && examTopic.exercises[0]) {
                                const firstQ = examTopic.exercises[0];
                                setExerciseId(firstQ.id);
                                setExercise(firstQ);
                                setExerciseDescription(firstQ.description || "");
                                setCode(firstQ.initialCode || "// Escreva seu código aqui");
                            }
                        }
                    }
                } else {
                    // No active exam, clear exam state if it was set
                    if (isExam) {
                        setIsExam(false);
                        setExamQuestions([]);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to check for active exam", e);
        }
    };
    
    checkForActiveExam();
  }, [user]);

  // Fetch Exam Questions (fallback if already in exam mode from localStorage)
  useEffect(() => {
    if (isExam && examQuestions.length === 0 && typeof window !== 'undefined') {
        const clsId = localStorage.getItem('clab-classroom-id');
        const topicId = localStorage.getItem('clab-topic-id');
        
        if (clsId && topicId) {
             const fetchExamData = async () => {
                 try {
                     const token = localStorage.getItem('token');
                     const baseUrl = window.localStorage.getItem('clab-server-ip') || 'http://localhost:8080';
                     
                     const res = await fetch(`${baseUrl}/classrooms/${clsId}/topics`, {
                         headers: { 'Authorization': `Bearer ${token}` }
                     });
                     const json = await res.json();
                     if (json.success) {
                         const topic = json.data.find(t => t.id.toString() === topicId);
                         if (topic && topic.exercises) {
                             setExamQuestions(topic.exercises);
                             setExamTopicTitle(topic.title);
                         }
                     }
                 } catch (e) {
                     console.error("Failed to fetch exam questions", e);
                 }
             };
             fetchExamData();
        }
    }
  }, [isExam, examQuestions.length]);

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

    const token = localStorage.getItem('token');
    if (token) {
        wsUrl += `?token=${token}`;
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
    
    // Prevent double submission only for exams
    if (isExam && submittedQuestions.has(exerciseId)) {
        if (terminalRef.current?.term) {
            terminalRef.current.term.writeln('\x1b[33m[Esta questão já foi enviada!]\x1b[0m');
        }
        return;
    }

    setIsRunning(true);
    if (terminalRef.current?.term) {
        terminalRef.current.term.clear();
        terminalRef.current.term.writeln('\x1b[35m[Submitting for Validation...]\x1b[0m');
    }

    // Mark as submitted
    const newSubmitted = new Set(submittedQuestions);
    newSubmitted.add(exerciseId);
    setSubmittedQuestions(newSubmitted);

    wsRef.current.send(JSON.stringify({ 
        type: "run_code", 
        payload: code, 
        exerciseId: parseInt(exerciseId) 
    }));
    
    // Check if all exam questions are now submitted
    if (isExam && examQuestions.length > 0) {
        const allSubmitted = examQuestions.every(q => newSubmitted.has(q.id));
        if (allSubmitted) {
            // Auto-exit exam after a short delay to show feedback
            setTimeout(() => {
                alert("Prova finalizada! Todas as questões foram enviadas.");
                
                // Clear exam state
                setIsExam(false);
                setExamQuestions([]);
                setSubmittedQuestions(new Set());
                setExerciseId(null);
                setExercise(null);
                setExerciseDescription("");
                setShowAiPanel(true);
                
                // Clear localStorage
                localStorage.removeItem('clab-exercise-id');
                localStorage.removeItem('clab-exercise-title');
                localStorage.removeItem('clab-exercise-description');
                localStorage.removeItem('clab-exercise-is-exam');
                localStorage.removeItem('clab-classroom-id');
                localStorage.removeItem('clab-topic-id');
                
                // Restore scratchpad
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
            }, 1500);
        }
    }
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
      if (isExam) {
          if (!confirm("Tem certeza? Esta é uma prova! Se sair agora, nada será salvo além do histórico de envio.")) return;
      }
      setExerciseId(null);
      setExercise(null);
      setExerciseDescription("");
      setIsExam(false);
      setExpireDate(null);
      
      if (typeof window !== 'undefined') {
          localStorage.removeItem('clab-exercise-id');
          localStorage.removeItem('clab-exercise-title');
          localStorage.removeItem('clab-exercise-description');
          localStorage.removeItem('clab-exercise-is-exam');
          localStorage.removeItem('clab-exercise-expire-date');
          
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
        
        {/* Exam Banner - Non-overlapping */}
        {isExam && (
            <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-500/20">
                <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"/>
                MODO PROVA - IA DESATIVADA
                <span className="ml-4 text-xs font-normal opacity-80">({submittedQuestions.size}/{examQuestions.length} enviadas)</span>
            </div>
        )}
      
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

        {/* AI Analysis Panel or Exam Questions */}
        {(showAiPanel && !isExam) ? (
          <div className="w-[350px] shrink-0 border-l border-border bg-background">
             <AnalysisPanel
                code={code}
                user={user}
                isAnalyzing={isAnalyzing} 
                aiAnalysis={aiAnalysis}
             />
          </div>
        ) : (isExam) ? (
            <div className="w-[300px] shrink-0 border-l border-border bg-surface flex flex-col">
                <div className="p-4 border-b border-border bg-red-500/5">
                    <h3 className="font-bold text-red-500 flex items-center gap-2">
                        <Shield size={18} />
                        Questões da Prova
                    </h3>
                    <p className="text-xs text-secondary mt-1">Navegue pelas questões livremente.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {examQuestions.map((q, idx) => (
                        <button 
                            key={q.id}
                            onClick={() => {
                                if (q.id === exerciseId) return;
                                if (confirm("Trocar de questão? Certifique-se de ter enviado seu código.")) {
                                    setExerciseId(q.id);
                                    setExercise(q);
                                    setExerciseDescription(q.description);
                                    setCode(q.initialCode || "// Escreva seu código aqui");
                                    // Update persistent state logic for the new question would happen via existing effects
                                }
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                                submittedQuestions.has(q.id)
                                    ? 'bg-green-500/10 border-green-500 text-green-500'
                                    : q.id === exerciseId
                                        ? 'bg-primary/10 border-primary text-primary' 
                                        : 'bg-background border-border hover:border-primary/50 hover:bg-surface-hover text-foreground'
                            }`}
                        >
                            <div className="font-medium text-sm truncate flex items-center justify-between">
                                <span>Q{idx + 1}. {q.title}</span>
                                {submittedQuestions.has(q.id) && <CheckCircle size={16} className="text-green-500" />}
                            </div>
                        </button>
                    ))}
                    {examQuestions.length === 0 && (
                        <div className="text-center py-10 text-secondary text-sm">
                            Carregando questões...
                        </div>
                    )}
                </div>
            </div>
        ) : null}
      </div>

    </div>
  </div>
  );
};

export default IDE;