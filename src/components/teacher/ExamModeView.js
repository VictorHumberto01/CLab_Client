"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import api, { getWsUrl } from "../../utils/api";
import { GraduationCap, BookOpen, Clock, Play, Square, AlertCircle, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, Copy, Shuffle } from "lucide-react";

const Terminal = dynamic(() => import('../Terminal/Terminal'), { ssr: false });

const ExamModeView = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [expandedSubmission, setExpandedSubmission] = useState(null);
    const [runLoading, setRunLoading] = useState(false);
    const [runOutput, setRunOutput] = useState(null);
    const [showTerminal, setShowTerminal] = useState(false);
    const [isWsConnected, setIsWsConnected] = useState(false);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);

    const handleRunCodeInteractive = (submission) => {
        setShowTerminal(true);
        setRunLoading(true);
        setRunOutput(null);
        
        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
        }

        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const wsUrl = `${getWsUrl()}/ws?token=${token}`;
        
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            setIsWsConnected(true);
            if (terminalRef.current?.term) {
                terminalRef.current.term.clear();
                terminalRef.current.term.writeln('\x1b[32m[Conectado - Executando código do aluno]\x1b[0m\r\n');
            }
            // Send run_code message
            socket.send(JSON.stringify({
                type: 'run_code',
                payload: submission.code,
                exerciseId: 0 // Teacher run, no exercise context
            }));
            setRunLoading(false);
        };
        
        socket.onclose = () => {
            setIsWsConnected(false);
            if (terminalRef.current?.term) {
                terminalRef.current.term.writeln('\r\n\x1b[33m[Desconectado]\x1b[0m');
            }
        };
        
        socket.onerror = (err) => {
            console.error('WS Error', err);
            setIsWsConnected(false);
            setRunLoading(false);
        };
        
        socket.onmessage = (event) => {
            const text = event.data;
            // Filter out JSON status messages
            let output = text;
            if (text.includes('"type":')) {
                output = text.replace(/\{.*"type":".*?".*?\}/g, "");
            }
            if (output && terminalRef.current?.write) {
                terminalRef.current.write(output);
            } else if (output && terminalRef.current?.term) {
                terminalRef.current.term.write(output);
            }
        };
        
        wsRef.current = socket;
    };
    
    const handleTerminalInput = (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', payload: data }));
        }
    };
    
    const handleStopCode = () => {
        if (wsRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'kill' }));
        }
    };

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/classrooms');
            if (res.data.success) {
                const classes = res.data.data || [];
                // Fetch topics for each class to find exams
                const classesWithTopics = await Promise.all(classes.map(async (cls) => {
                    try {
                        const topicRes = await api.get(`/classrooms/${cls.id}/topics`);
                        if (topicRes.data.success) {
                            return { ...cls, topics: topicRes.data.data || [] };
                        }
                    } catch (e) {
                         console.error("Failed to fetch topics for class", cls.id);
                    }
                    return { ...cls, topics: [] };
                }));
                setClassrooms(classesWithTopics);
            }
        } catch (err) {
            console.error("Failed to fetch classrooms", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const fetchSubmissions = async (topicId) => {
        setLoadingSubmissions(true);
        setSelectedExamId(topicId);
        try {
            const res = await api.get(`/history?topicId=${topicId}&limit=100`);
            if (res.data && res.data.data) {
                setSubmissions(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    // Auto-fetch submissions for active exam
    useEffect(() => {
        const activeClassroom = classrooms.find(c => c.activeExamId);
        if (activeClassroom && activeClassroom.activeExamId !== selectedExamId) {
            fetchSubmissions(activeClassroom.activeExamId);
        }
    }, [classrooms]);

    const handleToggleExam = async (classroomId, topicId) => {
        setToggling(classroomId);
        try {
            // If topicId is null, we are stopping the exam
            // If topicId is provided, we are starting that exam
            const res = await api.post(`/classrooms/${classroomId}/exam`, { activeExamId: topicId });
            if (res.data.success) {
                // Update local state
                setClassrooms(classrooms.map(c => {
                    if (c.id === classroomId) {
                        return { ...c, activeExamId: topicId };
                    }
                    return c;
                }));
            }
        } catch (err) {
            alert("Erro ao alterar modo prova: " + (err.response?.data?.error || err.message));
        } finally {
            setToggling(null);
        }
    };

    const getStatusText = (classroom) => {
        if (classroom.activeExamId) {
            const activeTopic = classroom.topics?.find(t => t.id === classroom.activeExamId);
            return `Prova em andamento: ${activeTopic?.title || 'Desconhecida'}`;
        }
        return "Nenhuma prova ativa";
    };

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [newExam, setNewExam] = useState({
        classroomId: "",
        title: "",
        expireDate: "",
        questions: []
    });

    const handleCreateExam = async (e) => {
        if (e) e.preventDefault();
        if (!newExam.classroomId) return;
        
        try {
            const exercisesPayload = newExam.questions.map(q => ({
                variantGroupId: q.id,
                variants: q.variants.map(v => ({
                    title: v.title,
                    description: v.description,
                    expectedOutput: v.expectedOutput,
                    initialCode: v.initialCode,
                    examMaxNote: parseFloat(v.examMaxNote) || 10.0
                }))
            }));

            const payload = {
                title: newExam.title,
                expireDate: newExam.expireDate ? new Date(newExam.expireDate).toISOString() : null,
                isExam: true,
                exercises: exercisesPayload
            };
            
            const res = await api.post(`/classrooms/${newExam.classroomId}/topics`, payload);
            if (res.data.success) {
                setShowCreateModal(false);
                setNewExam({ classroomId: "", title: "", expireDate: "", questions: [] });
                setCurrentStep(1);
                fetchClassrooms(); // Refresh list to show new exam
            }
        } catch (err) {
            alert("Erro ao criar prova: " + (err.response?.data?.error || err.message));
        }
    };

    const addQuestion = () => {
        setNewExam({
            ...newExam,
            questions: [
                ...newExam.questions, 
                { 
                    id: Math.random().toString(36).substr(2, 9), 
                    variants: [{ title: `Questão ${newExam.questions.length + 1}`, description: "", expectedOutput: "", initialCode: "// Escreva seu código aqui\n", examMaxNote: 10 }] 
                }
            ]
        });
    };

    const addVariant = (qIndex) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[qIndex].variants.push({ 
            title: `${updatedQuestions[qIndex].variants[0].title} (Variante ${updatedQuestions[qIndex].variants.length + 1})`, 
            description: "", 
            expectedOutput: "", 
            initialCode: "// Escreva seu código aqui\n", 
            examMaxNote: updatedQuestions[qIndex].variants[0].examMaxNote 
        });
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const removeQuestion = (qIndex) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions.splice(qIndex, 1);
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const removeVariant = (qIndex, vIndex) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[qIndex].variants.splice(vIndex, 1);
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const updateVariant = (qIndex, vIndex, field, value) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[qIndex].variants[vIndex][field] = value;
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
            <header className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <GraduationCap className="text-primary" size={22} />
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Modo Prova</h1>
                        <p className="text-xs text-secondary">Gerencie avaliações — alunos perdem acesso à IA durante uma prova ativa.</p>
                    </div>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={16} />
                    <span>Nova Prova</span>
                </button>
            </header>

            {loading ? (
                <div className="text-center py-16 text-secondary text-sm">Carregando...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-16 text-secondary text-sm">Nenhuma turma encontrada.</div>
            ) : (
                <div className="space-y-5">
                    {classrooms.map(cls => (
                        <div key={cls.id} className={`bg-surface border rounded-xl transition-all ${cls.activeExamId ? 'border-primary/40 shadow-md' : 'border-border'}`}>
                            <div className="px-5 py-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cls.activeExamId ? 'bg-primary/15 text-primary' : 'bg-background text-secondary'}`}>
                                            <BookOpen size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                                <span className="truncate">{cls.name}</span>
                                                {cls.activeExamId && (
                                                    <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] rounded-full font-bold uppercase flex items-center shrink-0">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                                                        Ao Vivo
                                                    </span>
                                                )}
                                            </h2>
                                            <p className="text-xs text-secondary truncate">{getStatusText(cls)}</p>
                                        </div>
                                    </div>
                                    {cls.activeExamId && (
                                        <button 
                                            onClick={() => handleToggleExam(cls.id, null)}
                                            disabled={toggling === cls.id}
                                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                                        >
                                            {toggling === cls.id ? <span className="animate-pulse">Parando...</span> : (
                                                <>
                                                    <Square size={12} fill="currentColor" />
                                                    <span>Encerrar</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                {cls.topics?.filter(t => t.isExam).length > 0 ? (
                                    <div className="space-y-2">
                                        {cls.topics.filter(t => t.isExam).map(topic => {
                                            const isActive = cls.activeExamId === topic.id;
                                            return (
                                                <div 
                                                    key={topic.id} 
                                                    className={`px-4 py-3 rounded-lg border flex items-center justify-between transition-all ${
                                                        isActive 
                                                            ? 'bg-primary/5 border-primary/30' 
                                                            : 'bg-background border-border hover:border-primary/20'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1 mr-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{topic.title}</span>
                                                        </div>
                                                        <div className="flex items-center text-[11px] text-secondary gap-3 mt-0.5">
                                                            <span>{topic.exercises?.length || 0} questão(ões)</span>
                                                            {topic.expireDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(topic.expireDate).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button 
                                                            onClick={() => fetchSubmissions(topic.id)}
                                                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
                                                                selectedExamId === topic.id
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'text-secondary hover:text-foreground hover:bg-surface-hover'
                                                            }`}
                                                        >
                                                            Resultados
                                                        </button>

                                                        {!isActive ? (
                                                            <button 
                                                                onClick={() => handleToggleExam(cls.id, topic.id)}
                                                                disabled={toggling === cls.id || !!cls.activeExamId}
                                                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                                                    cls.activeExamId 
                                                                        ? 'text-secondary/40 cursor-not-allowed' 
                                                                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                                                }`}
                                                            >
                                                                <Play size={12} fill="currentColor" /> Iniciar
                                                            </button>
                                                        ) : (
                                                            <span className="text-primary text-xs font-bold bg-primary/10 px-2.5 py-1.5 rounded-md flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                                Ativa
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-secondary text-xs border border-dashed border-border rounded-lg bg-background">
                                        Nenhuma prova criada para esta turma.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submissions Section */}
            {selectedExamId && (
                <div className="mt-5 bg-surface border border-border rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <CheckCircle size={16} className="text-green-500" />
                            Resultados
                        </h3>
                        <button 
                            onClick={() => fetchSubmissions(selectedExamId)}
                            className="text-[11px] text-primary hover:text-primary-hover font-medium"
                            disabled={loadingSubmissions}
                        >
                            {loadingSubmissions ? 'Atualizando...' : 'Atualizar'}
                        </button>
                    </div>
                    
                    {loadingSubmissions ? (
                        <div className="text-center py-8 text-secondary text-sm">Carregando submissões...</div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-8 text-secondary text-xs border border-dashed border-border rounded-lg bg-background">
                            Nenhuma submissão ainda.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Object.values(submissions.reduce((acc, sub) => {
                                const userId = sub.user?.id || sub.user?.email || 'unknown';
                                if (!acc[userId]) {
                                    acc[userId] = {
                                        user: sub.user,
                                        submissions: []
                                    };
                                }
                                acc[userId].submissions.push(sub);
                                return acc;
                            }, {})).map((studentGroup, idx) => (
                                <div key={idx} className="bg-background border border-border rounded-lg p-3 flex flex-col hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                            {(studentGroup.user?.name || studentGroup.user?.email || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs text-foreground truncate">{studentGroup.user?.name || 'Aluno Desconhecido'}</h4>
                                            <p className="text-[10px] text-secondary truncate">{studentGroup.user?.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[200px]">
                                        {studentGroup.submissions.map((sub, sIdx) => {
                                            const gradeRatio = sub.score / (sub.exercise?.examMaxNote || 10);
                                            let gradeColor = 'text-red-500 bg-red-500/10';
                                            if (gradeRatio >= 0.7) gradeColor = 'text-green-500 bg-green-500/10';
                                            else if (gradeRatio >= 0.5) gradeColor = 'text-yellow-500 bg-yellow-500/10';

                                            return (
                                              <button 
                                                  key={sub.ID || sIdx} 
                                                  onClick={() => setExpandedSubmission(sub)}
                                                  className="w-full text-left flex justify-between items-center text-xs p-2 rounded-md bg-surface hover:bg-surface-hover transition-colors group"
                                              >
                                                  <div className="flex flex-col min-w-0 mr-2">
                                                      <span className="text-foreground font-medium truncate group-hover:text-primary transition-colors" title={sub.exercise?.title}>
                                                          {sub.exercise?.title || `Ex ${sub.exerciseId}`}
                                                      </span>
                                                      <span className="text-[10px] text-secondary">
                                                          {new Date(sub.CreatedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                      </span>
                                                  </div>
                                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${gradeColor}`}>
                                                    {sub.score?.toFixed(1) || '0.0'}/{sub.exercise?.examMaxNote?.toFixed(1) || '10.0'}
                                                </span>
                                              </button>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="mt-2 pt-2 border-t border-border flex justify-between items-center text-[10px] text-secondary">
                                        <span>{studentGroup.submissions.length} envio(s)</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-foreground text-xs">
                                                {studentGroup.submissions.reduce((acc, curr) => acc + (curr.score || 0), 0).toFixed(1)}
                                                /{studentGroup.submissions.reduce((acc, curr) => acc + (curr.exercise?.examMaxNote || 10), 0).toFixed(1)}
                                            </span>
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                                                {((studentGroup.submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / studentGroup.submissions.reduce((acc, curr) => acc + (curr.exercise?.examMaxNote || 10), 0)) * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create Exam Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center px-5 py-4 border-b border-border">
                            <div>
                                <h2 className="text-base font-bold text-foreground">Criar Nova Prova</h2>
                                <p className="text-xs text-secondary mt-0.5">
                                    {currentStep === 1 ? 'Passo 1: Configurações básicas' : 'Passo 2: Questões e variantes'}
                                </p>
                            </div>
                            <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-foreground text-lg">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {currentStep === 1 ? (
                                <form id="exam-form-step-1" onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} className="space-y-4 max-w-md mx-auto py-4">
                                    <div>
                                        <label className="block text-xs text-secondary mb-1.5 font-medium">Turma</label>
                                        <select
                                            value={newExam.classroomId}
                                            onChange={(e) => setNewExam({...newExam, classroomId: e.target.value})}
                                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                                            required
                                        >
                                            <option value="">Selecione uma turma...</option>
                                            {classrooms.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-secondary mb-1.5 font-medium">Título da Prova</label>
                                        <input 
                                            type="text" 
                                            value={newExam.title}
                                            onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                                            placeholder="Ex: Prova Final - Estrutura de Dados"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-secondary mb-2 font-medium">Data/Hora de Expiração (Consumação)</label>
                                        <input 
                                            type="datetime-local" 
                                            value={newExam.expireDate}
                                            onChange={(e) => setNewExam({...newExam, expireDate: e.target.value})}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                            required
                                        />
                                        <p className="text-xs text-secondary mt-1">O tempo limite padrão. Após esta data a prova será fechada.</p>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6 pb-8">
                                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex gap-4 text-sm text-foreground items-start">
                                        <div className="p-2 bg-primary/20 rounded-lg text-primary shrink-0">
                                            <Shuffle size={20} />
                                        </div>
                                        <div>
                                            <strong className="text-primary block mb-1 text-base">Sistema de Variantes Anti-Cola</strong>
                                            <p className="text-secondary leading-relaxed">Para cada questão, você pode adicionar múltiplas versões equivalentes. Quando um aluno iniciar a prova, o sistema sorteará (de forma determinística) apenas uma variante de cada questão para aquele aluno. Assim, alunos próximos receberão provas diferentes geradas a partir do mesmo banco de questões.</p>
                                        </div>
                                    </div>

                                    {newExam.questions.length === 0 ? (
                                        <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-surface flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-surface-hover rounded-full flex items-center justify-center mb-4">
                                                <BookOpen className="text-secondary" size={32} />
                                            </div>
                                            <h3 className="font-black text-xl text-foreground">Sua prova está vazia</h3>
                                            <p className="text-secondary mt-2 mb-6 max-w-sm">Comece adicionando a primeira questão e, se desejar, crie variantes para ela.</p>
                                            <button 
                                                onClick={addQuestion}
                                                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg"
                                            >
                                                <Plus size={18} /> Adicionar Primeira Questão
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            {newExam.questions.map((q, qIndex) => (
                                                <div key={q.id} className="bg-background border border-border rounded-xl overflow-hidden relative">
                                                    <div className="bg-surface-hover border-b border-border px-4 py-3 flex justify-between items-center">
                                                        <h3 className="font-bold text-foreground flex items-center gap-2">
                                                            <div className="bg-primary text-white w-6 h-6 rounded flex items-center justify-center text-xs">
                                                                {qIndex + 1}
                                                            </div>
                                                            Questão {qIndex + 1}
                                                        </h3>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => addVariant(qIndex)}
                                                                className="text-xs font-medium text-primary hover:text-primary-hover bg-primary/10 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                                                            >
                                                                <Copy size={12} /> Adicionar Variante
                                                            </button>
                                                            <button 
                                                                onClick={() => removeQuestion(qIndex)}
                                                                className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-500/10 px-2 py-1.5 rounded-lg transition-colors"
                                                                title="Remover Questão"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="p-6 space-y-6 bg-surface-hover/30 border-t border-border">
                                                        {q.variants.map((v, vIndex) => (
                                                            <div key={vIndex} className="bg-background border border-border shadow-sm rounded-xl p-6 relative group transition-colors hover:border-primary/30">
                                                                {q.variants.length > 1 && (
                                                                    <div className="absolute top-5 right-5 text-xs font-black text-secondary tracking-widest uppercase bg-surface px-3 py-1.5 rounded-lg border border-border">
                                                                        Variante_{vIndex + 1}
                                                                    </div>
                                                                )}
                                                                {q.variants.length > 1 && (
                                                                    <button 
                                                                        onClick={() => removeVariant(qIndex, vIndex)}
                                                                        className="absolute top-5 right-32 text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg border border-transparent hover:border-red-600"
                                                                        title="Remover Variante"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="block text-xs text-secondary mb-1">Título da Variante</label>
                                                                            <input 
                                                                                type="text" 
                                                                                value={v.title}
                                                                                onChange={(e) => updateVariant(qIndex, vIndex, 'title', e.target.value)}
                                                                                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                                                placeholder="Ex: Buscando pares (Array)"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-secondary mb-1">Descrição</label>
                                                                            <textarea 
                                                                                value={v.description}
                                                                                onChange={(e) => updateVariant(qIndex, vIndex, 'description', e.target.value)}
                                                                                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                                                                                placeholder="Descrição da questão..."
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <label className="block text-xs text-secondary mb-1">Código Inicial</label>
                                                                            <textarea 
                                                                                value={v.initialCode}
                                                                                onChange={(e) => updateVariant(qIndex, vIndex, 'initialCode', e.target.value)}
                                                                                className="w-full bg-black border border-border rounded text-xs px-3 py-2 font-mono text-green-400 focus:ring-1 focus:ring-primary outline-none min-h-[100px]"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-secondary mb-1">Saída Esperada (Validação Oculta)</label>
                                                                            <textarea 
                                                                                value={v.expectedOutput}
                                                                                onChange={(e) => updateVariant(qIndex, vIndex, 'expectedOutput', e.target.value)}
                                                                                className="w-full bg-black border border-border rounded text-xs px-3 py-2 font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                                                placeholder="Saída exata do terminal..."
                                                                                rows={2}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-secondary mb-1">Nota Máxima Desta Questão</label>
                                                                            <input 
                                                                                type="number" 
                                                                                step="0.1"
                                                                                value={v.examMaxNote}
                                                                                onChange={(e) => updateVariant(qIndex, vIndex, 'examMaxNote', e.target.value)}
                                                                                className="w-full bg-background border border-border rounded text-sm px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={addQuestion}
                                                    className="bg-surface hover:bg-surface-hover border border-dashed border-border text-foreground px-6 py-3 rounded-xl text-sm font-medium inline-flex items-center gap-2 transition-colors w-full justify-center"
                                                >
                                                    <Plus size={18} /> Adicionar Próxima Questão
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-5 py-3 border-t border-border flex justify-between items-center shrink-0">
                            {currentStep === 1 ? (
                                <>
                                    <button 
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2 rounded-lg text-sm text-secondary hover:text-foreground transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        form="exam-form-step-1"
                                        className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        Continuar <ArrowRight size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        type="button"
                                        onClick={() => setCurrentStep(1)}
                                        className="px-4 py-2 rounded-lg text-sm text-secondary hover:text-foreground transition-colors flex items-center gap-1.5"
                                    >
                                        <ArrowLeft size={14} /> Voltar
                                    </button>
                                    <button 
                                        onClick={handleCreateExam}
                                        disabled={newExam.questions.length === 0}
                                        className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <CheckCircle size={14} /> Publicar Prova
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Submission Details Modal */}
            {expandedSubmission && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setExpandedSubmission(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm">
                                        {(expandedSubmission.user?.name || '?')[0].toUpperCase()}
                                    </span>
                                    {expandedSubmission.user?.name || 'Aluno Desconhecido'}
                                </h2>
                                <p className="text-sm text-secondary mt-1">
                                    {expandedSubmission.exercise?.title} • Nota: {expandedSubmission.score?.toFixed(1)}/{expandedSubmission.exercise?.examMaxNote?.toFixed(1) || '10.0'}
                                </p>
                            </div>
                            <button onClick={() => setExpandedSubmission(null)} className="text-secondary hover:text-foreground">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Problem Info - Full Width */}
                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm text-secondary uppercase tracking-wide">
                                        Problema
                                    </h3>
                                    <div className="bg-surface-hover rounded-lg p-3 text-sm text-foreground/80 border border-border/50 h-24 overflow-y-auto">
                                        {expandedSubmission.exercise?.description || "Sem descrição."}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm text-secondary uppercase tracking-wide">
                                        Saída Esperada
                                    </h3>
                                    <div className="bg-surface-hover rounded-lg p-3 text-sm font-mono text-foreground/80 border border-border/50 h-24 overflow-y-auto whitespace-pre-wrap">
                                        {expandedSubmission.exercise?.expectedOutput || "N/A"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-sm text-secondary uppercase tracking-wide flex items-center gap-2">
                                        <code className="text-xs bg-surface-hover px-1 rounded">Code</code>
                                        Código do Aluno
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleRunCodeInteractive(expandedSubmission)}
                                            disabled={runLoading || isWsConnected}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/10 hover:bg-green-600/20 text-green-500 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                        >
                                            <Play size={12} />
                                            {runLoading ? 'Conectando...' : 'Executar (Interativo)'}
                                        </button>
                                        {isWsConnected && (
                                            <button 
                                                onClick={handleStopCode}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded text-xs font-medium transition-colors"
                                            >
                                                <Square size={12} />
                                                Parar
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto border border-border/50 max-h-[250px]">
                                    <pre>{expandedSubmission.code}</pre>
                                </div>

                                {/* Interactive Terminal */}
                                {showTerminal && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                                Terminal Interativo
                                            </h4>
                                            <button onClick={() => { setShowTerminal(false); if(wsRef.current) wsRef.current.close(); }} className="text-xs text-secondary hover:text-foreground">Fechar</button>
                                        </div>
                                        <div className="rounded-lg border border-border/50 overflow-hidden h-[200px] bg-black">
                                            <Terminal
                                                terminalRef={terminalRef}
                                                onData={handleTerminalInput}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm text-secondary uppercase tracking-wide flex items-center gap-2">
                                        <AlertCircle size={14} />
                                        Análise da IA / Correção
                                    </h3>
                                    <div className="bg-surface-hover rounded-lg p-4 text-sm text-foreground border border-border/50 max-h-[300px] overflow-y-auto">
                                        {expandedSubmission.teacherGrading ? (
                                            <div>
                                                <p className="font-bold text-green-400 mb-2">Feedback para Professor:</p>
                                                {expandedSubmission.teacherGrading}
                                            </div>
                                        ) : (
                                            expandedSubmission.aiAnalysis || "Nenhuma análise disponível."
                                        )}
                                    </div>
                                </div>
                                
                                {expandedSubmission.error && (
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-sm text-red-500 uppercase tracking-wide flex items-center gap-2">
                                            <AlertCircle size={14} />
                                            Erro de Compilação/Execução
                                        </h3>
                                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-400 font-mono overflow-x-auto">
                                            {expandedSubmission.error}
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <h3 className="font-bold text-sm text-secondary uppercase tracking-wide">Output</h3>
                                    <div className="bg-black rounded-lg p-3 font-mono text-xs text-green-400 border border-border/50">
                                        {expandedSubmission.output || "(Sem output)"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamModeView;
