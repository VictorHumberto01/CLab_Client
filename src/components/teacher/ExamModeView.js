"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import api, { getWsUrl } from "../../utils/api";
import { GraduationCap, BookOpen, Clock, Play, Square, AlertCircle, CheckCircle } from "lucide-react";

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
    const [newExam, setNewExam] = useState({
        classroomId: "",
        title: "",
        expireDate: ""
    });

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!newExam.classroomId) return;
        
        try {
            const payload = {
                title: newExam.title,
                expireDate: newExam.expireDate ? new Date(newExam.expireDate).toISOString() : null,
                isExam: true
            };
            
            const res = await api.post(`/classrooms/${newExam.classroomId}/topics`, payload);
            if (res.data.success) {
                setShowCreateModal(false);
                setNewExam({ classroomId: "", title: "", expireDate: "" });
                fetchClassrooms(); // Refresh list to show new exam
            }
        } catch (err) {
            alert("Erro ao criar prova: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
            <header className="mb-8 border-b border-border pb-4 flex justify-between items-end">
                <div>
                    <div className="flex items-center space-x-3">
                        <GraduationCap className="text-primary" size={28} />
                        <h1 className="text-2xl font-bold text-foreground">Modo Prova</h1>
                    </div>
                    <p className="text-secondary mt-2 text-sm">Gerencie sessões de prova ativas. Durante uma prova, os alunos perdem acesso à IA e a outros exercícios.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center space-x-2"
                >
                    <BookOpen size={18} />
                    <span>Criar Nova Prova</span>
                </button>
            </header>

            {loading ? (
                <div className="text-center py-20">Carregando...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-20 text-secondary">Nenhuma turma encontrada.</div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {classrooms.map(cls => (
                        <div key={cls.id} className={`bg-surface border rounded-xl overflow-hidden transition-all ${cls.activeExamId ? 'border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5' : 'border-border'}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground flex items-center">
                                            {cls.name}
                                            {cls.activeExamId && (
                                                <span className="ml-3 px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded-full font-bold uppercase animate-pulse flex items-center">
                                                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                                                    Ao Vivo
                                                </span>
                                            )}
                                        </h2>
                                        <p className="text-sm text-secondary mt-1">{getStatusText(cls)}</p>
                                    </div>
                                    {cls.activeExamId && (
                                        <button 
                                            onClick={() => handleToggleExam(cls.id, null)}
                                            disabled={toggling === cls.id}
                                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors shadow-sm"
                                        >
                                            {toggling === cls.id ? <span className="animate-pulse">Parando...</span> : (
                                                <>
                                                    <Square size={16} fill="currentColor" />
                                                    <span>Encerrar Prova</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">Provas Disponíveis</h3>
                                    
                                    {cls.topics?.filter(t => t.isExam).length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {cls.topics.filter(t => t.isExam).map(topic => {
                                                const isActive = cls.activeExamId === topic.id;
                                                return (
                                                    <div 
                                                        key={topic.id} 
                                                        className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                                            isActive 
                                                                ? 'bg-primary/5 border-primary/30' 
                                                                : 'bg-background border-border hover:border-primary/30'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 flex-1 mr-4">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <BookOpen size={16} className={isActive ? "text-primary" : "text-secondary"} />
                                                                <span className={`font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{topic.title}</span>
                                                            </div>
                                                            <div className="flex items-center text-xs text-secondary space-x-3">
                                                                <span>{topic.exercises?.length || 0} questões</span>
                                                                {topic.expireDate && (
                                                                    <span className="flex items-center">
                                                                        <Clock size={12} className="mr-1" />
                                                                        {new Date(topic.expireDate).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            {/* View Submissions Button */}
                                                            <button 
                                                                onClick={() => fetchSubmissions(topic.id)}
                                                                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                                                    selectedExamId === topic.id
                                                                        ? 'bg-green-500 text-white'
                                                                        : 'bg-surface-hover text-secondary hover:text-foreground'
                                                                }`}
                                                                title="Ver Submissões"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>

                                                            {!isActive ? (
                                                                <button 
                                                                    onClick={() => handleToggleExam(cls.id, topic.id)}
                                                                    disabled={toggling === cls.id || !!cls.activeExamId}
                                                                    className={`p-2 rounded-lg transition-colors ${
                                                                        cls.activeExamId 
                                                                            ? 'text-gray-300 cursor-not-allowed' 
                                                                            : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'
                                                                    }`}
                                                                    title="Iniciar Prova"
                                                                >
                                                                    <Play size={20} fill="currentColor" />
                                                                </button>
                                                            ) : (
                                                                <div className="text-primary font-bold text-xs bg-primary/10 px-3 py-1 rounded-full">
                                                                    EM ANDAMENTO
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-background rounded-xl border border-dashed border-border">
                                            <p className="text-secondary text-sm">Nenhuma lista marcada como "Modo Prova" nesta turma.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Submissions Section */}
            {selectedExamId && (
                <div className="mt-8 bg-surface border border-border rounded-xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <CheckCircle size={20} className="text-green-500" />
                            Submissões da Prova
                        </h3>
                        <button 
                            onClick={() => fetchSubmissions(selectedExamId)}
                            className="text-xs text-primary hover:text-primary-hover"
                        >
                            Atualizar
                        </button>
                    </div>
                    
                    {loadingSubmissions ? (
                        <div className="text-center py-8 text-secondary">Carregando submissões...</div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-8 text-secondary bg-background rounded-xl border border-dashed border-border">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Nenhuma submissão ainda.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                <div key={idx} className="bg-background border border-border rounded-xl p-4 flex flex-col hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
                                        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-primary font-bold">
                                            {(studentGroup.user?.name || studentGroup.user?.email || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-foreground truncate">{studentGroup.user?.name || 'Aluno Desconhecido'}</h4>
                                            <p className="text-xs text-secondary truncate">{studentGroup.user?.email}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 flex-1">
                                        {studentGroup.submissions.map((sub, sIdx) => (
                                            <button 
                                                key={sub.ID || sIdx} 
                                                onClick={() => setExpandedSubmission(sub)}
                                                className="w-full text-left flex justify-between items-center text-sm p-2 rounded-lg bg-surface-hover/50 hover:bg-surface-hover hover:border-primary/30 border border-transparent transition-all group"
                                            >
                                                <div className="flex flex-col min-w-0 mr-2">
                                                    <span className="text-foreground font-medium truncate group-hover:text-primary transition-colors" title={sub.exercise?.title}>
                                                        {sub.exercise?.title || `Ex ${sub.exerciseId}`}
                                                    </span>
                                                    <span className="text-[10px] text-secondary">
                                                        {new Date(sub.CreatedAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                                                    sub.score >= (sub.exercise?.examMaxNote || 10) * 0.7 ? 'bg-green-500/10 text-green-500' :
                                                    sub.score >= (sub.exercise?.examMaxNote || 10) * 0.5 ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {sub.score?.toFixed(1) || '0.0'}/{sub.exercise?.examMaxNote?.toFixed(1) || '10.0'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-secondary">
                                        <span>Total: {studentGroup.submissions.length} envio(s)</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-foreground">
                                                Total: {studentGroup.submissions.reduce((acc, curr) => acc + (curr.score || 0), 0).toFixed(1)}
                                                /{studentGroup.submissions.reduce((acc, curr) => acc + (curr.exercise?.examMaxNote || 10), 0).toFixed(1)}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
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
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground">Criar Nova Prova</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-foreground">✕</button>
                        </div>
                        <form onSubmit={handleCreateExam} className="space-y-4">
                             <div>
                                <label className="block text-sm text-secondary mb-2 font-medium">Turma</label>
                                <select
                                    value={newExam.classroomId}
                                    onChange={(e) => setNewExam({...newExam, classroomId: e.target.value})}
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    required
                                >
                                    <option value="">Selecione uma turma...</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-secondary mb-2 font-medium">Título da Prova</label>
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
                                <p className="text-xs text-secondary mt-1">Obrigatório para provas.</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-surface-hover hover:bg-surface border border-border text-foreground py-3 rounded-xl font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-colors"
                                >
                                    Criar Prova
                                </button>
                            </div>
                        </form>
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
