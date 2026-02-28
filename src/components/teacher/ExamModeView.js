"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import api, { getWsUrl } from "../../utils/api";
import { GraduationCap, BookOpen, Clock, Play, Square, AlertCircle, CheckCircle, Plus, Trash2, ArrowRight, ArrowLeft, Copy, Shuffle, Sparkles, Loader2, Wand2, FolderOpen, FolderPlus, Edit3, Send, ChevronRight, FileText, MoreHorizontal, Folder, Search } from "lucide-react";

const Terminal = dynamic(() => import('../Terminal/Terminal'), { ssr: false });

const ExamModeView = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('all');
    const [toggling, setToggling] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [selectedExamId, setSelectedExamId] = useState(null);
    const [expandedSubmission, setExpandedSubmission] = useState(null);
    const [runLoading, setRunLoading] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [isWsConnected, setIsWsConnected] = useState(false);
    const wsRef = useRef(null);
    const terminalRef = useRef(null);

    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState(null);
    const [editFolderName, setEditFolderName] = useState('');
    const [assigningExam, setAssigningExam] = useState(null);
    const [assignClassroomId, setAssignClassroomId] = useState('');
    const [startingExam, setStartingExam] = useState(null);
    const [startClassroomId, setStartClassroomId] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [newExam, setNewExam] = useState({ title: "", expireDate: "", folderId: null, questions: [] });
    const [contextMenu, setContextMenu] = useState(null);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const [showAiForm, setShowAiForm] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState({ numQuestions: 3, variantsPerQuestion: 3, difficulty: 'médio', topic: '', notePerQuestion: 10.0 });
    const [searchExam, setSearchExam] = useState('');
    const [searchResults, setSearchResults] = useState('');

    // --- Terminal ---
    const handleRunCodeInteractive = (submission) => {
        setShowTerminal(true); setRunLoading(true);
        if (wsRef.current) wsRef.current.close();
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
        const socket = new WebSocket(`${getWsUrl()}/ws?token=${token}`);
        socket.onopen = () => { setIsWsConnected(true); if (terminalRef.current?.term) { terminalRef.current.term.clear(); terminalRef.current.term.writeln('\x1b[32m[Executando código]\x1b[0m\r\n'); } socket.send(JSON.stringify({ type: 'run_code', payload: submission.code, exerciseId: 0 })); setRunLoading(false); };
        socket.onclose = () => { setIsWsConnected(false); if (terminalRef.current?.term) terminalRef.current.term.writeln('\r\n\x1b[33m[Desconectado]\x1b[0m'); };
        socket.onerror = () => { setIsWsConnected(false); setRunLoading(false); };
        socket.onmessage = (event) => { let o = event.data; if (o.includes('"type":')) o = o.replace(/\{.*"type":".*?".*?\}/g, ""); if (o && terminalRef.current?.write) terminalRef.current.write(o); else if (o && terminalRef.current?.term) terminalRef.current.term.write(o); };
        wsRef.current = socket;
    };
    const handleTerminalInput = (data) => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'input', payload: data })); };
    const handleStopCode = () => { if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'kill' })); };

    // --- Data ---
    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cr, er, fr] = await Promise.all([api.get('/classrooms'), api.get('/exams'), api.get('/folders')]);
            if (cr.data.success) setClassrooms(cr.data.data || []);
            if (er.data.success) setExams(er.data.data || []);
            if (fr.data.success) setFolders(fr.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };
    useEffect(() => { fetchAll(); }, []);

    const fetchSubmissions = async (topicId) => {
        setLoadingSubmissions(true); setSelectedExamId(topicId);
        try { const r = await api.get(`/history?topicId=${topicId}&limit=100`); if (r.data?.data) setSubmissions(r.data.data); } catch (e) { console.error(e); }
        finally { setLoadingSubmissions(false); }
    };

    // --- Actions ---
    const handleCreateExam = async (e) => {
        if (e) e.preventDefault();
        try {
            const payload = { title: newExam.title, expireDate: newExam.expireDate ? new Date(newExam.expireDate).toISOString() : null, folderId: newExam.folderId || null, exercises: newExam.questions.map(q => ({ variantGroupId: q.id, variants: q.variants.map(v => ({ title: v.title, description: v.description, expectedOutput: v.expectedOutput, initialCode: v.initialCode, examMaxNote: parseFloat(v.examMaxNote) || 10.0 })) })) };
            const r = await api.post('/exams', payload);
            if (r.data.success) { setShowCreateModal(false); setNewExam({ title: "", expireDate: "", folderId: null, questions: [] }); setCurrentStep(1); fetchAll(); }
        } catch (err) { alert("Erro: " + (err.response?.data?.error || err.message)); }
    };
    const handleAssignExam = async () => {
        if (!assigningExam || !assignClassroomId) return;
        try { const r = await api.post(`/exams/${assigningExam.id}/assign`, { classroomId: parseInt(assignClassroomId) }); if (r.data.success) { setAssigningExam(null); setAssignClassroomId(''); fetchAll(); } } catch (err) { alert("Erro: " + (err.response?.data?.error || err.message)); }
    };
    const handleDeleteExam = async (examId) => { if (!confirm('Deletar esta prova?')) return; try { await api.delete(`/exams/${examId}`); fetchAll(); } catch (err) { alert("Erro: " + (err.response?.data?.error || err.message)); } };
    const handleToggleExam = async (classroomId, topicId) => { setToggling(classroomId); try { const r = await api.post(`/classrooms/${classroomId}/exam`, { activeExamId: topicId }); if (r.data.success) fetchAll(); } catch (err) { alert("Erro: " + (err.response?.data?.error || err.message)); } finally { setToggling(null); } };
    const handleStartExam = async () => {
        if (!startingExam || !startClassroomId) return;
        try {
            // First assign the exam to the classroom
            await api.post(`/exams/${startingExam.id}/assign`, { classroomId: parseInt(startClassroomId) });
            // Then activate it
            const r = await api.post(`/classrooms/${startClassroomId}/exam`, { activeExamId: startingExam.id });
            if (r.data.success) { setStartingExam(null); setStartClassroomId(''); fetchAll(); }
        } catch (err) { alert("Erro ao iniciar prova: " + (err.response?.data?.error || err.message)); }
    };

    // --- Folders ---
    const handleCreateFolder = async () => { if (!newFolderName.trim()) return; try { await api.post('/folders', { name: newFolderName }); setNewFolderName(''); setShowNewFolder(false); fetchAll(); } catch (e) { alert(e.response?.data?.error || e.message); } };
    const handleRenameFolder = async (id) => { if (!editFolderName.trim()) return; try { await api.put(`/folders/${id}`, { name: editFolderName }); setEditingFolder(null); fetchAll(); } catch (e) { alert(e.response?.data?.error || e.message); } };
    const handleDeleteFolder = async (id) => { if (!confirm('Deletar pasta? As provas serão movidas para "Sem Pasta".')) return; try { await api.delete(`/folders/${id}`); if (selectedFolder === String(id)) setSelectedFolder('all'); fetchAll(); } catch (e) { alert(e.response?.data?.error || e.message); } };
    const handleMoveToFolder = async (examId, folderId) => { try { await api.put(`/exams/${examId}/folder`, { folderId: folderId || null }); fetchAll(); } catch (e) { console.error(e); } };
    const onDragStart = (e, examId) => { e.dataTransfer.setData('examId', String(examId)); e.dataTransfer.effectAllowed = 'move'; };
    const onFolderDrop = (e, folderId) => { e.preventDefault(); setDragOverFolder(null); const examId = e.dataTransfer.getData('examId'); if (examId) handleMoveToFolder(parseInt(examId), folderId); };
    const onFolderDragOver = (e, folderId) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverFolder(folderId); };

    // --- Questions ---
    const addQuestion = () => { setNewExam({ ...newExam, questions: [...newExam.questions, { id: Math.random().toString(36).substr(2, 9), variants: [{ title: `Questão ${newExam.questions.length + 1}`, description: "", expectedOutput: "", initialCode: "// Escreva seu código aqui\n", examMaxNote: 10 }] }] }); };
    const addVariant = (qi) => { const q = [...newExam.questions]; q[qi].variants.push({ title: `${q[qi].variants[0].title} (V${q[qi].variants.length + 1})`, description: "", expectedOutput: "", initialCode: "// Escreva seu código aqui\n", examMaxNote: q[qi].variants[0].examMaxNote }); setNewExam({ ...newExam, questions: q }); };
    const removeQuestion = (qi) => { const q = [...newExam.questions]; q.splice(qi, 1); setNewExam({ ...newExam, questions: q }); };
    const removeVariant = (qi, vi) => { const q = [...newExam.questions]; q[qi].variants.splice(vi, 1); setNewExam({ ...newExam, questions: q }); };
    const updateVariant = (qi, vi, f, v) => { const q = [...newExam.questions]; q[qi].variants[vi][f] = v; setNewExam({ ...newExam, questions: q }); };

    // --- AI ---
    const handleGenerateExam = async () => { setAiGenerating(true); try { const cid = classrooms[0]?.id; if (!cid) { alert('Nenhuma turma.'); return; } const r = await api.post(`/classrooms/${cid}/generate-questions`, aiConfig); if (r.data.success && r.data.data) { const gen = r.data.data.map(q => ({ id: q.id || Math.random().toString(36).substr(2, 9), variants: q.variants.map(v => ({ title: v.title, description: v.description, expectedOutput: v.expectedOutput, initialCode: v.initialCode || '// Código\n', examMaxNote: v.examMaxNote || aiConfig.notePerQuestion })) })); setNewExam({ ...newExam, questions: [...newExam.questions, ...gen] }); setShowAiForm(false); } } catch (e) { alert('Erro: ' + (e.response?.data?.error || e.message)); } finally { setAiGenerating(false); } };
    const handleGenerateSingle = async () => { setAiGenerating(true); try { const cid = classrooms[0]?.id; if (!cid) { alert('Nenhuma turma.'); return; } const r = await api.post(`/classrooms/${cid}/generate-questions`, { ...aiConfig, numQuestions: 1 }); if (r.data.success && r.data.data?.[0]) { const q = r.data.data[0]; setNewExam({ ...newExam, questions: [...newExam.questions, { id: q.id || Math.random().toString(36).substr(2, 9), variants: q.variants.map(v => ({ title: v.title, description: v.description, expectedOutput: v.expectedOutput, initialCode: v.initialCode || '// Código\n', examMaxNote: v.examMaxNote || aiConfig.notePerQuestion })) }] }); } } catch (e) { alert('Erro: ' + (e.response?.data?.error || e.message)); } finally { setAiGenerating(false); } };

    // --- Derived ---
    const folderFiltered = selectedFolder === 'all' ? exams : selectedFolder === 'none' ? exams.filter(e => !e.folderId) : exams.filter(e => String(e.folderId) === selectedFolder);
    const filteredExams = searchExam.trim() ? folderFiltered.filter(e => e.title?.toLowerCase().includes(searchExam.toLowerCase())) : folderFiltered;
    const getActiveClassroom = (examId) => classrooms.find(c => c.activeExamId === examId);
    const selectedFolderName = selectedFolder === 'all' ? 'Todas as Provas' : selectedFolder === 'none' ? 'Sem Pasta' : folders.find(f => String(f.ID) === selectedFolder)?.name || 'Pasta';

    return (
        <div className="animate-in fade-in duration-500 h-full flex flex-col" style={{maxHeight: 'calc(100vh - 80px)'}}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-surface/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2.5">
                    <GraduationCap className="text-primary" size={20} />
                    <h1 className="text-base font-bold text-foreground">Banco de Provas</h1>
                    <ChevronRight size={14} className="text-secondary" />
                    <span className="text-sm text-secondary">{selectedFolderName}</span>
                    <span className="text-xs text-secondary bg-surface-hover px-2 py-0.5 rounded-full ml-1">{filteredExams.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                        <input type="text" value={searchExam} onChange={e => setSearchExam(e.target.value)} placeholder="Buscar provas..." className="bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground w-48 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-secondary/50" />
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                        <Plus size={15} /> Nova Prova
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-secondary text-sm">Carregando...</div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar — Finder style */}
                    <div className="w-52 border-r border-border bg-surface/50 overflow-y-auto py-3 shrink-0">
                        <div className="px-4 mb-2"><span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Locais</span></div>
                        <button onClick={() => setSelectedFolder('all')} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors rounded-lg mx-1 ${selectedFolder === 'all' ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground/70 hover:bg-surface-hover'}`} style={{width: 'calc(100% - 8px)'}}>
                            <BookOpen size={15} /> Todas <span className="ml-auto text-xs text-secondary">{exams.length}</span>
                        </button>
                        <button onClick={() => setSelectedFolder('none')} onDragOver={(e) => onFolderDragOver(e, 'none')} onDragLeave={() => setDragOverFolder(null)} onDrop={(e) => onFolderDrop(e, null)} className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors rounded-lg mx-1 ${dragOverFolder === 'none' ? 'bg-blue-500/20 ring-1 ring-blue-400/50' : selectedFolder === 'none' ? 'bg-primary/15 text-primary font-semibold' : 'text-foreground/70 hover:bg-surface-hover'}`} style={{width: 'calc(100% - 8px)'}}>
                            <FileText size={15} /> Sem Pasta <span className="ml-auto text-xs text-secondary">{exams.filter(e => !e.folderId).length}</span>
                        </button>

                        <div className="px-4 mt-4 mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Pastas</span>
                            <button onClick={() => setShowNewFolder(true)} className="text-secondary hover:text-primary transition-colors"><FolderPlus size={14} /></button>
                        </div>

                        {showNewFolder && (
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="mx-2 mb-2 flex gap-1">
                                <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Nome da pasta..." className="flex-1 bg-background border border-primary/50 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" autoFocus onBlur={() => { if (!newFolderName.trim()) setShowNewFolder(false); }} />
                            </form>
                        )}

                        {folders.map(f => (
                            <div key={f.ID} onDragOver={(e) => onFolderDragOver(e, f.ID)} onDragLeave={() => setDragOverFolder(null)} onDrop={(e) => onFolderDrop(e, f.ID)} className={`group flex items-center rounded-lg mx-1 transition-colors ${dragOverFolder === f.ID ? 'bg-blue-500/20 ring-1 ring-blue-400/50' : String(selectedFolder) === String(f.ID) ? 'bg-primary/15' : 'hover:bg-surface-hover'}`} style={{width: 'calc(100% - 8px)'}}>
                                {editingFolder === f.ID ? (
                                    <form onSubmit={(e) => { e.preventDefault(); handleRenameFolder(f.ID); }} className="flex-1 px-1 py-0.5">
                                        <input value={editFolderName} onChange={e => setEditFolderName(e.target.value)} className="w-full bg-background border border-primary/50 rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none" autoFocus onBlur={() => setEditingFolder(null)} />
                                    </form>
                                ) : (
                                    <>
                                        <button onClick={() => setSelectedFolder(String(f.ID))} className={`flex-1 text-left px-4 py-2 text-sm flex items-center gap-2.5 truncate ${String(selectedFolder) === String(f.ID) ? 'text-primary font-semibold' : 'text-foreground/70'}`}>
                                            <Folder size={15} className={String(selectedFolder) === String(f.ID) ? 'text-primary' : 'text-blue-400'} />
                                            <span className="truncate">{f.name}</span>
                                        </button>
                                        <div className="opacity-0 group-hover:opacity-100 flex shrink-0 pr-2 gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingFolder(f.ID); setEditFolderName(f.name); }} className="p-1 text-secondary hover:text-foreground rounded"><Edit3 size={12} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.ID); }} className="p-1 text-red-400/60 hover:text-red-500 rounded"><Trash2 size={12} /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Main Content — File list */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredExams.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-secondary">
                                <FolderOpen size={40} className="mb-3 text-secondary/40" />
                                <p className="text-sm">Nenhuma prova aqui.</p>
                                <button onClick={() => setShowCreateModal(true)} className="mt-3 text-xs text-primary hover:text-primary-hover font-medium">Criar nova prova</button>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {filteredExams.map(exam => {
                                    const activeIn = getActiveClassroom(exam.id);
                                    return (
                                        <div key={exam.id} draggable onDragStart={(e) => onDragStart(e, exam.id)} className={`flex flex-wrap items-center gap-3 px-5 py-4 transition-colors group cursor-grab active:cursor-grabbing ${activeIn ? 'bg-primary/5' : 'hover:bg-surface-hover/50'}`}>
                                            {/* Icon + Title */}
                                            <FileText size={18} className={`shrink-0 ${activeIn ? 'text-primary' : 'text-secondary/60'}`} />
                                            <div className="flex-1 min-w-[180px]">
                                                <span className="text-sm font-semibold text-foreground block truncate">{exam.title}</span>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                                                    <span className="text-xs text-secondary">{exam.questionCount || 0} questão(ões)</span>
                                                    {exam.expireDate && <span className="text-xs text-secondary flex items-center gap-1"><Clock size={11} />{new Date(exam.expireDate).toLocaleDateString('pt-BR')}</span>}
                                                    {exam.classroomId && !activeIn && <span className="text-xs text-secondary">Turma #{exam.classroomId}</span>}
                                                </div>
                                            </div>
                                            {/* Status */}
                                            <div className="shrink-0">
                                                {activeIn ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full whitespace-nowrap"><span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />Ao Vivo · {activeIn.name}</span>
                                                ) : exam.classroomId ? (
                                                    <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2.5 py-1 rounded-full">Pronta</span>
                                                ) : (
                                                    <span className="text-xs text-secondary/50 bg-surface-hover px-2.5 py-1 rounded-full">Rascunho</span>
                                                )}
                                            </div>
                                            {/* Actions */}
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button onClick={() => fetchSubmissions(exam.id)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${selectedExamId === exam.id ? 'bg-primary/15 text-primary' : 'text-secondary hover:text-foreground hover:bg-surface-hover'}`}>Resultados</button>
                                                {!activeIn && (
                                                    <button onClick={() => { setStartingExam(exam); setStartClassroomId(''); }} className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"><Play size={11} fill="currentColor" /> Iniciar</button>
                                                )}
                                                {activeIn && (
                                                    <button onClick={() => handleToggleExam(activeIn.id, null)} className="px-3 py-1.5 text-xs font-bold text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"><Square size={11} fill="currentColor" /> Encerrar</button>
                                                )}
                                                <button onClick={() => handleDeleteExam(exam.id)} className="p-1.5 text-red-400/40 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Deletar"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Iniciar Prova Modal */}
            {startingExam && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setStartingExam(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Play className="text-primary" size={20} fill="currentColor" /></div>
                            <div>
                                <h2 className="text-base font-bold text-foreground">Iniciar Prova</h2>
                                <p className="text-sm text-secondary mt-0.5">"{startingExam.title}"</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-secondary mb-2 font-medium">Selecione a turma</label>
                            <select value={startClassroomId} onChange={e => setStartClassroomId(e.target.value)} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all">
                                <option value="">Escolha uma turma...</option>
                                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <p className="text-xs text-secondary/70">A prova será atribuída à turma selecionada e iniciada imediatamente. Os alunos poderão acessá-la na tela da IDE.</p>
                        <div className="flex justify-end gap-3 pt-1">
                            <button onClick={() => setStartingExam(null)} className="px-4 py-2 text-sm text-secondary hover:text-foreground rounded-lg transition-colors">Cancelar</button>
                            <button onClick={handleStartExam} disabled={!startClassroomId} className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex items-center gap-2"><Play size={14} fill="currentColor" /> Iniciar Prova</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submissions — Full Screen */}
            {selectedExamId && (
                <div className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface shrink-0">
                        <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-green-500" />
                            <div>
                                <h2 className="text-base font-bold text-foreground">Resultados da Prova</h2>
                                <p className="text-xs text-secondary mt-0.5">{submissions.length} submissão(ões) • {Object.keys(submissions.reduce((a, s) => { a[s.user?.id || 'x'] = 1; return a; }, {})).length} aluno(s)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                <input type="text" value={searchResults} onChange={e => setSearchResults(e.target.value)} placeholder="Buscar aluno..." className="bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground w-48 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-secondary/50" />
                            </div>
                            <button onClick={() => fetchSubmissions(selectedExamId)} className="px-3 py-1.5 text-xs text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors" disabled={loadingSubmissions}>{loadingSubmissions ? 'Atualizando...' : 'Atualizar'}</button>
                            <button onClick={() => setSelectedExamId(null)} className="px-3 py-1.5 text-xs text-secondary hover:text-foreground hover:bg-surface-hover rounded-lg transition-colors">✕ Fechar</button>
                        </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {loadingSubmissions ? <div className="flex items-center justify-center h-full text-secondary text-sm">Carregando...</div> : submissions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-secondary">
                                <FolderOpen size={40} className="mb-3 text-secondary/30" />
                                <p className="text-sm">Nenhuma submissão ainda.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
                                {Object.values(submissions.reduce((acc, sub) => { const uid = sub.user?.id || 'x'; if (!acc[uid]) acc[uid] = { user: sub.user, submissions: [] }; acc[uid].submissions.push(sub); return acc; }, {})).filter(sg => !searchResults.trim() || sg.user?.name?.toLowerCase().includes(searchResults.toLowerCase()) || sg.user?.email?.toLowerCase().includes(searchResults.toLowerCase())).map((sg, i) => {
                                    const totalScore = sg.submissions.reduce((a,c) => a+(c.score||0), 0);
                                    const totalMax = sg.submissions.reduce((a,c) => a+(c.exercise?.examMaxNote||10), 0);
                                    const pct = totalMax > 0 ? (totalScore/totalMax)*100 : 0;
                                    let pctColor = 'text-red-500 bg-red-500/10'; if (pct >= 70) pctColor = 'text-green-500 bg-green-500/10'; else if (pct >= 50) pctColor = 'text-yellow-500 bg-yellow-500/10';
                                    return (
                                    <div key={i} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{(sg.user?.name || '?')[0].toUpperCase()}</div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-foreground truncate">{sg.user?.name || 'Aluno'}</h4>
                                                <p className="text-xs text-secondary truncate">{sg.user?.email}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${pctColor}`}>{pct.toFixed(0)}%</span>
                                        </div>
                                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                            {sg.submissions.map((sub, si) => {
                                                const r = sub.score/(sub.exercise?.examMaxNote||10); let gc = 'text-red-500 bg-red-500/10'; if (r>=0.7) gc='text-green-500 bg-green-500/10'; else if (r>=0.5) gc='text-yellow-500 bg-yellow-500/10';
                                                return <button key={sub.ID||si} onClick={() => setExpandedSubmission(sub)} className="w-full text-left flex justify-between items-center text-xs p-2 rounded-lg bg-background hover:bg-surface-hover transition-colors"><span className="truncate text-foreground/80 mr-2">{sub.exercise?.title || `Ex ${sub.exerciseId}`}</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${gc}`}>{sub.score?.toFixed(1)||'0.0'}/{sub.exercise?.examMaxNote?.toFixed(1)||'10.0'}</span></button>;
                                            })}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs text-secondary">
                                            <span>{sg.submissions.length} envio(s)</span>
                                            <span className="font-bold text-foreground">{totalScore.toFixed(1)}/{totalMax.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
                        <div className="flex justify-between items-center px-5 py-3 border-b border-border">
                            <div><h2 className="text-sm font-bold text-foreground">Nova Prova</h2><p className="text-[10px] text-secondary mt-0.5">{currentStep === 1 ? 'Configurações' : 'Questões e variantes'}</p></div>
                            <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-foreground text-lg">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {currentStep === 1 ? (
                                <form id="exam-form-step-1" onSubmit={(e) => { e.preventDefault(); setCurrentStep(2); }} className="space-y-4 max-w-md mx-auto py-4">
                                    <div><label className="block text-xs text-secondary mb-1.5 font-medium">Título</label><input type="text" value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="Ex: Prova Final" className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" required /></div>
                                    <div><label className="block text-xs text-secondary mb-1.5 font-medium">Data de Expiração</label><input type="datetime-local" value={newExam.expireDate} onChange={e => setNewExam({...newExam, expireDate: e.target.value})} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" required /></div>
                                    <div><label className="block text-xs text-secondary mb-1.5 font-medium">Pasta</label><select value={newExam.folderId || ''} onChange={e => setNewExam({...newExam, folderId: e.target.value ? parseInt(e.target.value) : null})} className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"><option value="">Sem pasta</option>{folders.map(f => <option key={f.ID} value={f.ID}>{f.name}</option>)}</select></div>
                                </form>
                            ) : (
                                <div className="space-y-5 pb-6">
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex gap-3 text-xs text-foreground items-center">
                                        <Shuffle size={16} className="text-primary shrink-0" />
                                        <span className="text-secondary">Variantes: Ao criar mais de uma variante de cada questão, o sistema por meio de um algoritmo de hashing irá sortear uma variante para cada aluno.</span>
                                    </div>
                                    {/* AI */}
                                    <div className="border border-border rounded-lg overflow-hidden">
                                        <button onClick={() => setShowAiForm(!showAiForm)} className="w-full flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-violet-500/10 to-blue-500/10 hover:from-violet-500/15 hover:to-blue-500/15 transition-colors text-xs">
                                            <span className="flex items-center gap-2 font-medium text-foreground"><Sparkles size={14} className="text-violet-400" /> Gerar com IA</span>
                                            <span className="text-[10px] text-secondary">{showAiForm ? '▲' : '▼'}</span>
                                        </button>
                                        {showAiForm && (
                                            <div className="p-3 border-t border-border bg-surface space-y-2.5">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    <div><label className="block text-[10px] text-secondary mb-0.5 uppercase font-medium">Questões</label><input type="number" min="1" max="3" value={aiConfig.numQuestions} onChange={e => setAiConfig({...aiConfig, numQuestions: Math.min(3, parseInt(e.target.value) || 1)})} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground" /></div>
                                                    <div><label className="block text-[10px] text-secondary mb-0.5 uppercase font-medium">Variantes</label><input type="number" min="1" max="5" value={aiConfig.variantsPerQuestion} onChange={e => setAiConfig({...aiConfig, variantsPerQuestion: parseInt(e.target.value) || 1})} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground" /></div>
                                                    <div><label className="block text-[10px] text-secondary mb-0.5 uppercase font-medium">Dificuldade</label><select value={aiConfig.difficulty} onChange={e => setAiConfig({...aiConfig, difficulty: e.target.value})} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground"><option value="fácil">Fácil</option><option value="médio">Médio</option><option value="difícil">Difícil</option></select></div>
                                                    <div><label className="block text-[10px] text-secondary mb-0.5 uppercase font-medium">Nota</label><input type="number" step="0.5" min="0.5" value={aiConfig.notePerQuestion} onChange={e => setAiConfig({...aiConfig, notePerQuestion: parseFloat(e.target.value) || 10})} className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground" /></div>
                                                </div>
                                                <div><label className="block text-[10px] text-secondary mb-0.5 uppercase font-medium">Tema</label><input type="text" value={aiConfig.topic} onChange={e => setAiConfig({...aiConfig, topic: e.target.value})} placeholder="arrays, ponteiros, structs..." className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs text-foreground" /></div>
                                                <div className="flex gap-2">
                                                    <button onClick={handleGenerateExam} disabled={aiGenerating} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">{aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}{aiGenerating ? 'Gerando...' : `Gerar ${aiConfig.numQuestions}`}</button>
                                                    <button onClick={handleGenerateSingle} disabled={aiGenerating} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 disabled:opacity-50">{aiGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}+1</button>
                                                </div>
                                                <p className="text-[9px] text-secondary text-center">Máx 3/geração. Gere mais depois.</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Questions */}
                                    {newExam.questions.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl bg-surface flex flex-col items-center">
                                            <BookOpen className="text-secondary/40 mb-2" size={24} />
                                            <p className="text-xs text-secondary mb-3">Use a IA ou adicione manualmente</p>
                                            <button onClick={addQuestion} className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"><Plus size={12} /> Adicionar</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {newExam.questions.map((q, qi) => (
                                                <div key={q.id} className="bg-background border border-border rounded-lg overflow-hidden">
                                                    <div className="bg-surface-hover border-b border-border px-3 py-2 flex justify-between items-center">
                                                        <h3 className="font-bold text-xs text-foreground flex items-center gap-2"><div className="bg-primary text-white w-5 h-5 rounded flex items-center justify-center text-[10px]">{qi+1}</div>Questão {qi+1}</h3>
                                                        <div className="flex gap-1.5">
                                                            <button onClick={() => addVariant(qi)} className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1"><Copy size={10} /> Variante</button>
                                                            <button onClick={() => removeQuestion(qi)} className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-1 rounded"><Trash2 size={10} /></button>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 space-y-4">
                                                        {q.variants.map((v, vi) => (
                                                            <div key={vi} className="bg-surface border border-border rounded-lg p-4 relative group hover:border-primary/30 transition-colors">
                                                                {q.variants.length > 1 && <div className="absolute top-3 right-3 text-[9px] font-bold text-secondary bg-background px-2 py-0.5 rounded border border-border">V{vi+1}</div>}
                                                                {q.variants.length > 1 && <button onClick={() => removeVariant(qi, vi)} className="absolute top-3 right-12 text-red-500 opacity-0 group-hover:opacity-100 p-1 bg-red-500/10 rounded"><Trash2 size={11} /></button>}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <div><label className="block text-[10px] text-secondary mb-0.5">Título</label><input type="text" value={v.title} onChange={e => updateVariant(qi, vi, 'title', e.target.value)} className="w-full bg-background border border-border rounded text-xs px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none" /></div>
                                                                        <div><label className="block text-[10px] text-secondary mb-0.5">Descrição</label><textarea value={v.description} onChange={e => updateVariant(qi, vi, 'description', e.target.value)} className="w-full bg-background border border-border rounded text-xs px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[80px]" /></div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <div><label className="block text-[10px] text-secondary mb-0.5">Código Inicial</label><textarea value={v.initialCode} onChange={e => updateVariant(qi, vi, 'initialCode', e.target.value)} className="w-full bg-black border border-border rounded text-[10px] px-2.5 py-1.5 font-mono text-green-400 focus:ring-1 focus:ring-primary outline-none min-h-[80px]" /></div>
                                                                        <div><label className="block text-[10px] text-secondary mb-0.5">Saída Esperada</label><textarea value={v.expectedOutput} onChange={e => updateVariant(qi, vi, 'expectedOutput', e.target.value)} className="w-full bg-black border border-border rounded text-[10px] px-2.5 py-1.5 font-mono text-foreground focus:ring-1 focus:ring-primary outline-none" rows={2} /></div>
                                                                        <div><label className="block text-[10px] text-secondary mb-0.5">Nota Máxima</label><input type="number" step="0.1" value={v.examMaxNote} onChange={e => updateVariant(qi, vi, 'examMaxNote', e.target.value)} className="w-full bg-background border border-border rounded text-xs px-2.5 py-1.5 text-foreground focus:ring-1 focus:ring-primary outline-none" /></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={addQuestion} className="bg-surface hover:bg-surface-hover border border-dashed border-border text-foreground px-4 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors w-full justify-center"><Plus size={14} /> Adicionar Questão</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="px-5 py-2.5 border-t border-border flex justify-between items-center shrink-0">
                            {currentStep === 1 ? (<><button onClick={() => setShowCreateModal(false)} className="px-3 py-1.5 text-xs text-secondary hover:text-foreground">Cancelar</button><button type="submit" form="exam-form-step-1" className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">Continuar <ArrowRight size={12} /></button></>) : (<><button onClick={() => setCurrentStep(1)} className="px-3 py-1.5 text-xs text-secondary hover:text-foreground flex items-center gap-1"><ArrowLeft size={12} /> Voltar</button><button onClick={handleCreateExam} disabled={newExam.questions.length === 0} className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"><CheckCircle size={12} /> Salvar Prova</button></>)}
                        </div>
                    </div>
                </div>
            )}

            {/* Submission Detail */}
            {expandedSubmission && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setExpandedSubmission(null)}>
                    <div className="bg-surface border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b border-border flex justify-between items-start">
                            <div>
                                <h2 className="text-base font-bold text-foreground flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">{(expandedSubmission.user?.name || '?')[0].toUpperCase()}</span>{expandedSubmission.user?.name || 'Aluno'}</h2>
                                <p className="text-xs text-secondary mt-1">{expandedSubmission.exercise?.title} • {expandedSubmission.score?.toFixed(1)}/{expandedSubmission.exercise?.examMaxNote?.toFixed(1) || '10.0'}</p>
                            </div>
                            <button onClick={() => setExpandedSubmission(null)} className="text-secondary hover:text-foreground">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2 grid grid-cols-2 gap-3">
                                <div><h3 className="font-bold text-[10px] text-secondary uppercase mb-1">Problema</h3><div className="bg-surface-hover rounded-lg p-2.5 text-xs text-foreground/80 border border-border/50 h-20 overflow-y-auto">{expandedSubmission.exercise?.description || "N/A"}</div></div>
                                <div><h3 className="font-bold text-[10px] text-secondary uppercase mb-1">Saída Esperada</h3><div className="bg-surface-hover rounded-lg p-2.5 text-xs font-mono text-foreground/80 border border-border/50 h-20 overflow-y-auto whitespace-pre-wrap">{expandedSubmission.exercise?.expectedOutput || "N/A"}</div></div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between"><h3 className="font-bold text-[10px] text-secondary uppercase">Código</h3><div className="flex gap-1.5"><button onClick={() => handleRunCodeInteractive(expandedSubmission)} disabled={runLoading||isWsConnected} className="flex items-center gap-1 px-2 py-1 bg-green-600/10 text-green-500 rounded text-[10px] font-medium disabled:opacity-50"><Play size={10} />{runLoading ? '...' : 'Executar'}</button>{isWsConnected && <button onClick={handleStopCode} className="flex items-center gap-1 px-2 py-1 bg-red-600/10 text-red-500 rounded text-[10px] font-medium"><Square size={10} />Parar</button>}</div></div>
                                <div className="bg-black/50 rounded-lg p-3 font-mono text-xs text-gray-300 overflow-x-auto border border-border/50 max-h-[200px]"><pre>{expandedSubmission.code}</pre></div>
                                {showTerminal && (<div><div className="flex items-center justify-between mb-1"><h4 className="text-[10px] font-bold text-secondary uppercase flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />Terminal</h4><button onClick={() => { setShowTerminal(false); if(wsRef.current) wsRef.current.close(); }} className="text-[10px] text-secondary hover:text-foreground">Fechar</button></div><div className="rounded-lg border border-border/50 overflow-hidden h-[160px] bg-black"><Terminal terminalRef={terminalRef} onData={handleTerminalInput} /></div></div>)}
                            </div>
                            <div className="space-y-3">
                                <div><h3 className="font-bold text-[10px] text-secondary uppercase mb-1 flex items-center gap-1"><AlertCircle size={11} />Análise IA</h3><div className="bg-surface-hover rounded-lg p-3 text-xs text-foreground border border-border/50 max-h-[200px] overflow-y-auto">{expandedSubmission.teacherGrading ? <div><p className="font-bold text-green-400 mb-1 text-[10px]">Feedback:</p>{expandedSubmission.teacherGrading}</div> : expandedSubmission.aiAnalysis || "—"}</div></div>
                                {expandedSubmission.error && <div><h3 className="font-bold text-[10px] text-red-500 uppercase mb-1 flex items-center gap-1"><AlertCircle size={11} />Erro</h3><div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-mono overflow-x-auto">{expandedSubmission.error}</div></div>}
                                <div><h3 className="font-bold text-[10px] text-secondary uppercase mb-1">Output</h3><div className="bg-black rounded-lg p-2.5 font-mono text-[10px] text-green-400 border border-border/50">{expandedSubmission.output || "(vazio)"}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamModeView;
