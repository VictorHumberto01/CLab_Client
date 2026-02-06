"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  Trash2,
  Code2,
  Monitor,
  Bot,
  User,
  Clock,
  CheckCircle,
  XCircle,
  FileCode,
  Search,
  MoreVertical,
  Eye,
  Calendar,
  Activity,
  Loader2
} from "lucide-react";

const ClassroomsView = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassroomName, setNewClassroomName] = useState("");
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [studentEmail, setStudentEmail] = useState("");
    const [studentMatricula, setStudentMatricula] = useState("");
    const [addStudentMode, setAddStudentMode] = useState('email'); // 'email' or 'matricula'
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('students');
    const [newExercise, setNewExercise] = useState({ 
        topicId: 0, 
        title: "", 
        description: "", 
        expectedOutput: "", 
        initialCode: "",
        examMaxNote: 10.0
    });
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [newTopic, setNewTopic] = useState({
        title: "",
        expireDate: "",
        isExam: false
    });
    const [expandedTopic, setExpandedTopic] = useState(null);
    const [expandedStudentActivity, setExpandedStudentActivity] = useState(null);
    const [studentHistory, setStudentHistory] = useState([]);
    const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);
    const [expandedExercise, setExpandedExercise] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    const fetchClassrooms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/classrooms');
            if (res.data.success) {
                setClassrooms(res.data.data || []);
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

    const handleCreateClassroom = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/classrooms', { name: newClassroomName });
            if (res.data.success) {
                setShowCreateModal(false);
                setNewClassroomName("");
                fetchClassrooms();
            }
        } catch (err) {
            setError("Falha ao criar turma");
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!selectedClassroom) return;
        try {
            const payload = addStudentMode === 'email' 
                ? { email: studentEmail } 
                : { matricula: studentMatricula };
            const res = await api.post(`/classrooms/${selectedClassroom.id}/students`, payload);
            if (res.data.success) {
                setStudentEmail("");
                setStudentMatricula("");
                alert("Aluno adicionado com sucesso!");
                fetchClassrooms(); 
            }
        } catch (err) {
            alert(addStudentMode === 'email' 
                ? "Falha ao adicionar aluno. Verifique o email." 
                : "Falha ao adicionar aluno. Verifique a matrícula.");
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!selectedClassroom) return;
        if (!confirm("Tem certeza que deseja remover este aluno desta turma?")) return;

        try {
            const res = await api.delete(`/classrooms/${selectedClassroom.id}/students/${studentId}`);
            if (res.data.success) {
                alert("Aluno removido com sucesso.");
                fetchClassrooms();
                const updatedClassroom = classrooms.find(c => c.id === selectedClassroom.id);
                if (updatedClassroom) setSelectedClassroom(updatedClassroom);
            }
        } catch (err) {
            alert("Erro ao remover aluno.");
            console.error(err);
        }
    };

    const fetchTopics = async (classroomId) => {
        setLoadingTopics(true);
        try {
            const res = await api.get(`/classrooms/${classroomId}/topics`);
            if (res.data.success) {
                setTopics(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTopics(false);
        }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...newTopic,
                expireDate: newTopic.expireDate ? new Date(newTopic.expireDate).toISOString() : null
            };
            const res = await api.post(`/classrooms/${selectedClassroom.id}/topics`, payload);
            if (res.data.success) {
                setShowTopicModal(false);
                setNewTopic({ title: "", expireDate: "", isExam: false });
                fetchTopics(selectedClassroom.id);
            }
        } catch (err) {
            alert("Falha ao criar lista");
        }
    };

    const handleCreateExercise = async (e) => {
        e.preventDefault();
        if (!selectedClassroom) return;
        try {
            const res = await api.post(`/classrooms/${selectedClassroom.id}/exercises`, newExercise);
            if (res.data.success) {
                setShowExerciseModal(false);
                setNewExercise({ 
                    topicId: 0, 
                    title: "", 
                    description: "", 
                    expectedOutput: "", 
                    initialCode: "",
                    examMaxNote: 10.0
                });
                fetchTopics(selectedClassroom.id);
            }
        } catch (err) {
            alert("Falha ao criar exercício.");
        }
    };

    const fetchStudentActivity = async (studentId) => {
        setLoadingStudentHistory(true);
        try {
            const url = `/history?user_id=${studentId}&classroomId=${selectedClassroom.id}`;
            const res = await api.get(url);
            if (res.data.data) {
                setStudentHistory(res.data.data || []);
            }
        } catch (err) {
            console.error("ClassroomsView: Fetch error", err);
        } finally {
            setLoadingStudentHistory(false);
        }
    };

    useEffect(() => {
        if (expandedStudentActivity) {
            fetchStudentActivity(expandedStudentActivity.id);
        } else {
            setStudentHistory([]);
        }
    }, [expandedStudentActivity]);

    const handleDeleteClassroom = async () => {
        if (!selectedClassroom) return;
        if (!confirm("Tem certeza que deseja excluir esta turma? Esta ação é irreversível.")) return;

        try {
            await api.delete(`/classrooms/${selectedClassroom.id}`);
            setSelectedClassroom(null);
            fetchClassrooms();
            alert("Turma excluída com sucesso.");
        } catch (err) {
            alert("Erro ao excluir turma.");
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedClassroom && activeTab === 'exercises') {
            fetchTopics(selectedClassroom.id);
        }
    }, [selectedClassroom, activeTab]);

    // --- Classroom Detail View ---
    if (selectedClassroom) {
        return (
            <div className="animate-in fade-in duration-300">
                {/* Back Button */}
                <button 
                    onClick={() => setSelectedClassroom(null)}
                    className="flex items-center space-x-2 text-secondary hover:text-foreground mb-6 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Voltar para Turmas</span>
                </button>

                {/* Header */}
                <header className="mb-8 pb-6 border-b border-border">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                                <BookOpen size={28} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">{selectedClassroom.name}</h1>
                                <p className="text-sm text-secondary mt-1">
                                    Professor: {selectedClassroom.teacher?.name} • {selectedClassroom.students?.length || 0} alunos
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleDeleteClassroom}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium border border-transparent hover:border-red-500/20"
                        >
                            <Trash2 size={16} />
                            <span>Excluir</span>
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 p-1 bg-surface rounded-xl w-fit">
                    {[
                        { id: 'students', label: 'Alunos', icon: Users },
                        { id: 'exercises', label: 'Exercícios', icon: Code2 }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-background text-foreground shadow-sm' 
                                    : 'text-secondary hover:text-foreground'
                            }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Students Tab */}
                <AnimatePresence mode="wait">
                    {activeTab === 'students' && (
                        <motion.div 
                            key="students"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Add Student */}
                            <div className="bg-surface border border-border rounded-2xl p-6">
                                <h3 className="text-base font-semibold text-foreground mb-4 flex items-center">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                                        <User size={16} className="text-primary" />
                                    </div>
                                    Adicionar Aluno
                                </h3>
                                <form onSubmit={handleAddStudent} className="space-y-3">
                                    <div className="flex gap-2 mb-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setAddStudentMode('email')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${addStudentMode === 'email' ? 'bg-primary text-white' : 'bg-background border border-border text-secondary'}`}
                                        >
                                            Por Email
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setAddStudentMode('matricula')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${addStudentMode === 'matricula' ? 'bg-primary text-white' : 'bg-background border border-border text-secondary'}`}
                                        >
                                            Por Matrícula
                                        </button>
                                    </div>
                                    <div className="flex gap-3">
                                        {addStudentMode === 'email' ? (
                                            <input 
                                                type="email" 
                                                placeholder="Email do aluno..."
                                                value={studentEmail}
                                                onChange={(e) => setStudentEmail(e.target.value)}
                                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                required
                                            />
                                        ) : (
                                            <input 
                                                type="text" 
                                                placeholder="Matrícula do aluno..."
                                                value={studentMatricula}
                                                onChange={(e) => setStudentMatricula(e.target.value)}
                                                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                                required
                                            />
                                        )}
                                        <button type="submit" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center space-x-2">
                                            <Plus size={18} />
                                            <span>Adicionar</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Students List */}
                            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                                    <h3 className="text-base font-semibold text-foreground">Alunos Matriculados</h3>
                                    <span className="text-xs text-secondary bg-surface-hover px-3 py-1 rounded-full">
                                        {selectedClassroom.students?.length || 0} alunos
                                    </span>
                                </div>
                                
                                {selectedClassroom.students && selectedClassroom.students.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {selectedClassroom.students.map((student) => (
                                            <div key={student.id} className="p-4 hover:bg-surface-hover/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                                            {(student.name || student.email)[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground text-sm">{student.name || student.email.split('@')[0]}</p>
                                                            <p className="text-xs text-secondary">{student.email}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center space-x-3">
                                                        <button 
                                                            onClick={() => setExpandedStudentActivity(student)}
                                                            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                                                        >
                                                            <Activity size={14} />
                                                            <span>Atividade</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRemoveStudent(student.id)}
                                                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                                            title="Remover aluno"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                                            <Users size={28} className="text-secondary" />
                                        </div>
                                        <p className="text-secondary text-sm">Nenhum aluno matriculado nesta turma.</p>
                                        <p className="text-secondary/60 text-xs mt-1">Adicione alunos usando o formulário acima.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Exercises Tab */}
                    {activeTab === 'exercises' && (
                        <motion.div 
                            key="exercises"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Actions */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-foreground">Listas de Exercícios</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowTopicModal(true)}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium text-secondary hover:text-foreground bg-surface hover:bg-surface-hover border border-border transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Nova Lista</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowExerciseModal(true)}
                                        className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
                                    >
                                        <Plus size={16} />
                                        <span>Novo Exercício</span>
                                    </button>
                                </div>
                            </div>

                            {loadingTopics ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="animate-spin text-secondary" size={24} />
                                </div>
                            ) : topics.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl bg-surface/30">
                                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                                        <Code2 size={28} className="text-secondary" />
                                    </div>
                                    <p className="text-secondary">Nenhuma lista criada ainda.</p>
                                    <p className="text-secondary/60 text-xs mt-1">Crie uma lista para organizar seus exercícios.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topics.map((topic) => {
                                        const isExpanded = expandedTopic === topic.id;
                                        return (
                                            <div key={topic.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                                                <div 
                                                    onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                                                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-hover/50 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                                            <BookOpen size={18} className="text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground">{topic.title}</h4>
                                                            <p className="text-xs text-secondary">{topic.exercises?.length || 0} exercícios</p>
                                                        </div>
                                                    </div>
                                                    <ChevronDown className={`text-secondary transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="border-t border-border bg-background/50"
                                                        >
                                                            <div className="p-4 space-y-2">
                                                                {topic.exercises?.map((ex) => (
                                                                    <div 
                                                                        key={ex.id} 
                                                                        className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center space-x-3">
                                                                                <FileCode size={16} className="text-secondary" />
                                                                                <span className="font-medium text-sm text-foreground">{ex.title}</span>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}
                                                                                className="text-secondary hover:text-foreground p-1"
                                                                            >
                                                                                <ChevronRight className={`transition-transform ${expandedExercise === ex.id ? 'rotate-90' : ''}`} size={16} />
                                                                            </button>
                                                                        </div>
                                                                        
                                                                        {expandedExercise === ex.id && (
                                                                            <motion.div 
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                className="mt-4 pt-4 border-t border-border space-y-3"
                                                                            >
                                                                                <div>
                                                                                    <label className="text-[10px] text-secondary uppercase font-bold">Descrição</label>
                                                                                    <p className="text-xs text-secondary/80 mt-1 whitespace-pre-wrap">{ex.description}</p>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div>
                                                                                        <label className="text-[10px] text-secondary uppercase font-bold">Saída Esperada</label>
                                                                                        <pre className="text-[10px] bg-background p-2 rounded-lg border border-border text-primary font-mono mt-1 overflow-x-auto">{ex.expectedOutput || "—"}</pre>
                                                                                    </div>
                                                                                    <div>
                                                                                        <label className="text-[10px] text-secondary uppercase font-bold">Código Inicial</label>
                                                                                        <pre className="text-[10px] bg-background p-2 rounded-lg border border-border text-secondary font-mono mt-1 overflow-x-auto">{ex.initialCode || "—"}</pre>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                {(!topic.exercises || topic.exercises.length === 0) && (
                                                                    <p className="text-center py-6 text-xs text-secondary italic">Nenhum exercício nesta lista.</p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Exercise Modal */}
                <AnimatePresence>
                    {showExerciseModal && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-surface border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-foreground">Novo Exercício</h2>
                                    <button onClick={() => setShowExerciseModal(false)} className="text-secondary hover:text-foreground p-2 hover:bg-surface-hover rounded-lg transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateExercise} className="space-y-5">
                                    <div>
                                        <label className="block text-sm text-secondary mb-2 font-medium">Lista (Tópico)</label>
                                        <select 
                                            value={newExercise.topicId}
                                            onChange={(e) => setNewExercise({...newExercise, topicId: parseInt(e.target.value)})}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            required
                                        >
                                            <option value="">Selecione uma lista...</option>
                                            {topics.map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-secondary mb-2 font-medium">Título</label>
                                        <input 
                                            type="text" 
                                            value={newExercise.title}
                                            onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            placeholder="Ex: Soma de Matrizes"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-secondary mb-2 font-medium">Descrição</label>
                                        <textarea 
                                            value={newExercise.description}
                                            onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all h-28 resize-none"
                                            placeholder="Descreva o problema..."
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-secondary mb-2 font-medium">Saída Esperada</label>
                                            <textarea 
                                                value={newExercise.expectedOutput}
                                                onChange={(e) => setNewExercise({...newExercise, expectedOutput: e.target.value})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all h-32 resize-none"
                                                placeholder="Ex: Hello World"
                                            />
                                            <p className="text-xs text-secondary mt-2">A IA usará isso para corrigir.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-secondary mb-2 font-medium">Código Inicial</label>
                                            <textarea 
                                                value={newExercise.initialCode}
                                                onChange={(e) => setNewExercise({...newExercise, initialCode: e.target.value})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all h-32 resize-none"
                                                placeholder="#include <stdio.h>..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
                                        <div>
                                            <label className="block text-sm text-secondary mb-2 font-medium">Nota Máxima</label>
                                            <input 
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                value={newExercise.examMaxNote}
                                                onChange={(e) => setNewExercise({...newExercise, examMaxNote: parseFloat(e.target.value)})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                            />
                                            <p className="text-xs text-secondary mt-1">Usado apenas se a lista for uma Prova</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setShowExerciseModal(false)}
                                            className="flex-1 bg-surface-hover hover:bg-surface border border-border text-foreground py-3 rounded-xl font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-colors"
                                        >
                                            Criar Exercício
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Create Topic Modal */}
                <AnimatePresence>
                    {showTopicModal && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-foreground">Nova Lista</h2>
                                    <button onClick={() => setShowTopicModal(false)} className="text-secondary hover:text-foreground p-2 hover:bg-surface-hover rounded-lg transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTopic} className="space-y-5">
                                    <div>
                                        <label className="block text-sm text-secondary mb-2 font-medium">Título da Lista</label>
                                        <input 
                                            type="text" 
                                            value={newTopic.title}
                                            onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                                            placeholder="Ex: Alocação Dinâmica"
                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm text-secondary mb-2 font-medium">Expiração (Opcional)</label>
                                            <input 
                                                type="datetime-local" 
                                                value={newTopic.expireDate}
                                                onChange={(e) => setNewTopic({...newTopic, expireDate: e.target.value})}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowTopicModal(false)}
                                            className="flex-1 bg-surface-hover hover:bg-surface border border-border text-foreground py-3 rounded-xl font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 bg-primary hover:bg-primary-hover text-white py-3 rounded-xl font-medium transition-colors"
                                        >
                                            Criar Lista
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Student Activity Modal - IMPROVED */}
                <AnimatePresence>
                    {expandedStudentActivity && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                            onClick={() => { setExpandedStudentActivity(null); setSelectedSubmission(null); }}
                        >
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-surface border border-border rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="p-6 border-b border-border bg-background/50 flex items-center justify-between shrink-0">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                            {(expandedStudentActivity.name || expandedStudentActivity.email)[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-foreground">{expandedStudentActivity.name || expandedStudentActivity.email}</h2>
                                            <p className="text-sm text-secondary flex items-center">
                                                <Activity size={14} className="mr-1.5" />
                                                Histórico de submissões
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => { setExpandedStudentActivity(null); setSelectedSubmission(null); }}
                                        className="text-secondary hover:text-foreground p-2 hover:bg-surface-hover rounded-xl transition-colors"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                
                                {/* Modal Content */}
                                <div className="flex flex-1 min-h-0">
                                    {/* Submissions List */}
                                    <div className="w-1/2 border-r border-border flex flex-col">
                                        <div className="p-4 border-b border-border bg-surface/50">
                                            <div className="text-xs text-secondary uppercase font-bold tracking-wider">
                                                {loadingStudentHistory ? 'Carregando...' : `${studentHistory.length} submissões`}
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            {loadingStudentHistory ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="animate-spin text-secondary" size={24} />
                                                </div>
                                            ) : studentHistory.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
                                                        <Monitor size={28} className="text-secondary" />
                                                    </div>
                                                    <p className="text-secondary text-sm">Nenhuma submissão encontrada.</p>
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border">
                                                    {studentHistory.map((item) => (
                                                        <div 
                                                            key={item.id || item.ID}
                                                            onClick={() => setSelectedSubmission(item)}
                                                            className={`p-4 cursor-pointer transition-colors ${
                                                                selectedSubmission?.id === item.id || selectedSubmission?.ID === item.ID
                                                                    ? 'bg-primary/10 border-l-2 border-l-primary'
                                                                    : 'hover:bg-surface-hover/50'
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    {item.isSuccess ? (
                                                                        <CheckCircle size={16} className="text-green-500" />
                                                                    ) : (
                                                                        <XCircle size={16} className="text-red-500" />
                                                                    )}
                                                                    <span className="font-medium text-sm text-foreground truncate max-w-[200px]">
                                                                        {item.exercise?.title || "Código Livre"}
                                                                    </span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                    item.isSuccess 
                                                                        ? 'bg-green-500/10 text-green-500' 
                                                                        : 'bg-red-500/10 text-red-500'
                                                                }`}>
                                                                    {item.isSuccess ? 'OK' : 'Erro'}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center text-xs text-secondary">
                                                                <Calendar size={12} className="mr-1.5" />
                                                                {new Date(item.createdAt || item.CreatedAt).toLocaleString('pt-BR', {
                                                                    day: '2-digit',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Submission Detail */}
                                    <div className="w-1/2 flex flex-col bg-background">
                                        {selectedSubmission ? (
                                            <>
                                                <div className="p-4 border-b border-border bg-surface/50">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-foreground text-sm">
                                                            {selectedSubmission.exercise?.title || "Código Livre"}
                                                        </h4>
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                            selectedSubmission.isSuccess 
                                                                ? 'bg-green-500/10 text-green-500' 
                                                                : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {selectedSubmission.isSuccess ? 'Sucesso' : 'Erro'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-secondary mt-1">
                                                        {new Date(selectedSubmission.createdAt || selectedSubmission.CreatedAt).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                                    {/* Code */}
                                                    <div>
                                                        <label className="text-[10px] text-secondary uppercase font-bold tracking-wider mb-2 block flex items-center">
                                                            <FileCode size={12} className="mr-1.5" />
                                                            Código Enviado
                                                        </label>
                                                        <pre className="text-xs bg-surface border border-border rounded-xl p-4 text-foreground font-mono overflow-x-auto max-h-48 overflow-y-auto">
                                                            {selectedSubmission.code}
                                                        </pre>
                                                    </div>

                                                    {/* Output */}
                                                    {selectedSubmission.output && (
                                                        <div>
                                                            <label className="text-[10px] text-secondary uppercase font-bold tracking-wider mb-2 block flex items-center">
                                                                <Monitor size={12} className="mr-1.5" />
                                                                Saída
                                                            </label>
                                                            <pre className="text-xs bg-surface border border-border rounded-xl p-4 text-secondary font-mono overflow-x-auto max-h-32">
                                                                {selectedSubmission.output}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {/* Error */}
                                                    {selectedSubmission.error && (
                                                        <div>
                                                            <label className="text-[10px] text-red-400 uppercase font-bold tracking-wider mb-2 block">
                                                                Erro
                                                            </label>
                                                            <pre className="text-xs bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-red-400 font-mono overflow-x-auto max-h-32">
                                                                {selectedSubmission.error}
                                                            </pre>
                                                        </div>
                                                    )}

                                                    {/* AI Analysis */}
                                                    {selectedSubmission.aiAnalysis && (
                                                        <div>
                                                            <label className="text-[10px] text-blue-400 uppercase font-bold tracking-wider mb-2 block flex items-center">
                                                                <Bot size={12} className="mr-1.5" />
                                                                Análise da IA
                                                            </label>
                                                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                                                                <p className="text-xs text-blue-300 whitespace-pre-wrap leading-relaxed">
                                                                    {selectedSubmission.aiAnalysis}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="w-16 h-16 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-4">
                                                        <Eye size={28} className="text-secondary" />
                                                    </div>
                                                    <p className="text-secondary text-sm">Selecione uma submissão</p>
                                                    <p className="text-secondary/60 text-xs mt-1">para ver os detalhes</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // --- Classroom List View ---
    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8 pb-6 border-b border-border flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="text-primary" size={22} />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Turmas</h1>
                    </div>
                    <p className="text-secondary text-sm">Gerencie suas turmas e alunos.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center space-x-2 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                    <Plus size={18} />
                    <span>Nova Turma</span>
                </button>
            </header>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="animate-spin text-secondary" size={32} />
                </div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-border rounded-2xl bg-surface/30">
                    <div className="w-20 h-20 rounded-full bg-surface-hover flex items-center justify-center mx-auto mb-6">
                        <BookOpen size={36} className="text-secondary" />
                    </div>
                    <h3 className="text-secondary font-medium text-lg mb-2">Nenhuma turma encontrada</h3>
                    <p className="text-secondary/60 text-sm">Crie sua primeira turma para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classrooms.map((cls) => (
                        <motion.div 
                            key={cls.id}
                            whileHover={{ y: -4 }}
                            onClick={() => setSelectedClassroom(cls)}
                            className="group border border-border bg-surface hover:bg-surface-hover rounded-2xl p-6 transition-all cursor-pointer hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                        >
                            <div className="flex items-start justify-between mb-5">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:from-primary group-hover:to-primary/80 transition-all">
                                    <BookOpen size={22} className="text-primary group-hover:text-white transition-colors" />
                                </div>
                                <ChevronRight size={18} className="text-secondary group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">{cls.name}</h3>
                            <p className="text-secondary text-sm">Prof. {cls.teacher?.name}</p>
                            <div className="mt-4 pt-4 border-t border-border flex items-center text-xs text-secondary">
                                <Users size={14} className="mr-1.5" />
                                {cls.students?.length || 0} alunos
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Nova Turma</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-secondary hover:text-foreground p-2 hover:bg-surface-hover rounded-lg transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateClassroom} className="space-y-5">
                                <div>
                                    <label className="block text-sm text-secondary mb-2 font-medium">Nome da Turma</label>
                                    <input 
                                        type="text" 
                                        value={newClassroomName}
                                        onChange={(e) => setNewClassroomName(e.target.value)}
                                        placeholder="Ex: Estruturas de Dados 2024"
                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
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
                                        Criar Turma
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ClassroomsView;
