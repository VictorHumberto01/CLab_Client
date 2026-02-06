"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  ArrowLeft,
  LayoutDashboard,
  Code2,
  CheckCircle,
  XCircle,
  Play,
  ChevronDown,
  Clock,
  Lock,
  Shield
} from "lucide-react";

export default function StudentDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchClassrooms = async () => {
    setLoadingData(true);
    try {
      const res = await api.get('/classrooms');

      if (res.data.success) {
        setClassrooms(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
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

  useEffect(() => {
    if (user) fetchClassrooms();
  }, [user]);

  useEffect(() => {
    if (selectedClassroom) {
        fetchTopics(selectedClassroom.id);
    }
  }, [selectedClassroom]);

  // Auto-expand exam topic if active
  useEffect(() => {
      if (selectedClassroom?.activeExamId && topics.length > 0) {
          const examTopic = topics.find(t => t.id === selectedClassroom.activeExamId);
          if (examTopic) {
              setExpandedTopic(examTopic.id);
          }
      }
  }, [selectedClassroom, topics]);

  const handleSolveExercise = (ex, topic) => {
      // Save context and redirect to IDE
      if (typeof window !== 'undefined') {
          // Store the exercise details
          localStorage.setItem('clab-exercise-title', ex.title);
          localStorage.setItem('clab-exercise-description', ex.description || "");
          
          const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';
          const shouldBeExam = topic.isExam && !isTeacher;
          
          localStorage.setItem('clab-exercise-is-exam', shouldBeExam ? "true" : "false");
          if (shouldBeExam) {
              localStorage.setItem('clab-classroom-id', selectedClassroom.id.toString());
              localStorage.setItem('clab-topic-id', topic.id.toString());
          } else {
              localStorage.removeItem('clab-classroom-id');
              localStorage.removeItem('clab-topic-id');
          }
          
          if (topic.expireDate) localStorage.setItem('clab-exercise-expire-date', topic.expireDate);
          else localStorage.removeItem('clab-exercise-expire-date');

          localStorage.setItem('clab-target-initial-code', ex.initialCode || "");
          
          router.push('/');
      }
  };

  if (loading || !user) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
        <aside className="w-64 fixed h-full border-r border-border bg-surface flex flex-col z-10">
            <div className="h-16 flex items-center px-6 border-b border-border app-drag">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <BookOpen size={18} className="text-primary" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CLab <span className="text-secondary font-normal">Student</span></span>
                 </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-surface-hover text-foreground shadow-sm transition-all">
                    <LayoutDashboard size={18} className="text-primary" />
                    <span className="font-medium text-sm">Minhas Turmas</span>
                </button>
            </nav>

            <div className="p-4 border-t border-border bg-surface/30">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center text-xs font-bold shadow-inner text-primary">
                        {user.name ? user.name[0].toUpperCase() : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-secondary truncate">{user.email}</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push("/")}
                    className="w-full flex items-center justify-center space-x-2 bg-surface hover:bg-surface-hover text-secondary hover:text-foreground py-2 rounded-lg text-sm font-medium transition-colors border border-border"
                >
                    <ArrowLeft size={16} />
                    <span>Voltar ao IDE</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 ml-64 h-screen overflow-y-auto bg-background pb-20">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {selectedClassroom ? (
                    <div className="animate-in fade-in duration-300">
                        <button 
                            onClick={() => setSelectedClassroom(null)}
                            className="flex items-center space-x-2 text-secondary hover:text-foreground mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar para Turmas</span>
                        </button>

                        <header className="mb-8 border-b border-border pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground mb-2">{selectedClassroom.name}</h1>
                                    <p className="text-secondary">Listas de exercícios disponíveis.</p>
                                </div>
                                {selectedClassroom.activeExamId && (
                                    <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center space-x-3 text-red-500 animate-pulse">
                                        <Shield size={24} />
                                        <div>
                                            <h3 className="font-bold text-sm uppercase tracking-wide">Modo Prova Ativo</h3>
                                            <p className="text-xs opacity-80">Ambiente restrito.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </header>

                        {loadingTopics ? (
                            <div className="text-center py-20 text-zinc-500">Buscando listas de exercícios...</div>
                        ) : topics.length === 0 ? (
                            <div className="text-center py-20 bg-surface/30 border-2 border-dashed border-border rounded-xl">
                                <div className="p-3 bg-surface w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 text-secondary">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-secondary font-medium">Nenhuma lista disponível</h3>
                                <p className="text-secondary text-sm mt-1">O professor ainda não publicou exercícios para esta turma.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">

                                {topics.map((topic) => {
                                    // Filter by Active Exam Topic ID
                                    if (selectedClassroom.activeExamId && selectedClassroom.activeExamId !== topic.id) {
                                        return null;
                                    }

                                    const isExpanded = expandedTopic === topic.id || (selectedClassroom.activeExamId === topic.id);
                                    const isExpired = topic.expireDate && new Date(topic.expireDate) < new Date();
                                    
                                    return (
                                        <div key={topic.id} className={`bg-surface border rounded-xl overflow-hidden ${selectedClassroom.activeExamId ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-border'}`}>
                                            <div 
                                                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface-hover transition-colors"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-2 rounded-lg ${topic.isExam ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                                        {topic.isExam ? <Shield size={20} /> : <Code2 size={20} />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                                            {topic.title}
                                                            {topic.isExam && (
                                                                <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full uppercase font-bold">Prova</span>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center space-x-3 text-xs text-secondary mt-1">
                                                            <span className="uppercase font-bold tracking-wider">{topic.exercises?.length || 0} exercícios</span>
                                                            {topic.expireDate && (
                                                                <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-400' : 'text-orange-400'}`}>
                                                                    <Clock size={12} />
                                                                    <span>
                                                                        {isExpired ? "Expirou em: " : "Expira em: "} 
                                                                        {new Date(topic.expireDate).toLocaleString('pt-BR')}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button className="text-secondary hover:text-foreground transition-colors">
                                                    <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                                    {topic.exercises?.map((ex) => {
                                                        return (
                                                        <div key={ex.id} className={`bg-background border p-4 rounded-lg transition-all group shadow-sm ${selectedClassroom.activeExamId ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-border hover:border-primary/50'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                                                    {ex.title}
                                                                </h4>
                                                                <button 
                                                                    onClick={() => handleSolveExercise(ex, topic)}
                                                                    disabled={isExpired && !selectedClassroom.activeExamId}
                                                                    className={`px-3 py-1 text-[10px] font-bold rounded uppercase transition-colors ${
                                                                        selectedClassroom.activeExamId 
                                                                            ? 'bg-red-500 hover:bg-red-600 text-white'
                                                                            : isExpired 
                                                                                ? 'bg-surface-hover text-secondary cursor-not-allowed'
                                                                                : 'bg-primary hover:bg-primary-hover text-white'
                                                                    }`}
                                                                >
                                                                    {selectedClassroom.activeExamId ? 'Resolver' : isExpired ? 'Expirado' : 'Resolver'}
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-secondary line-clamp-2 leading-relaxed mb-3">{ex.description}</p>
                                                        </div>
                                                    )})}
                                                    {(!topic.exercises || topic.exercises.length === 0) && (
                                                        <p className="text-xs text-secondary col-span-full italic py-2">Esta lista ainda não possui exercícios.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in duration-500">
                        <header className="mb-8 border-b border-border pb-4">
                            <h1 className="text-2xl font-bold text-foreground">Minhas Turmas</h1>
                            <p className="text-secondary mt-2 text-sm">Selecione uma turma para ver os exercícios.</p>
                        </header>

                        {loadingData ? (
                            <div className="text-center py-20 text-secondary">Carregando turmas...</div>
                        ) : classrooms.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
                                <BookOpen size={48} className="mx-auto mb-4 text-secondary" />
                                <p className="text-secondary">Você não está matriculado em nenhuma turma.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classrooms.map((cls) => (
                                    <div 
                                        key={cls.id} 
                                        onClick={() => setSelectedClassroom(cls)}
                                        className="border border-border bg-surface hover:bg-surface-hover rounded-xl p-6 transition-all cursor-pointer hover:border-primary/50 group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                                <BookOpen size={24} />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-1">{cls.name}</h3>
                                        <p className="text-secondary text-sm">ID: {cls.id}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
}
