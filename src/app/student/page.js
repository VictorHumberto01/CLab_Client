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
  ChevronDown
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
      const res = await api.get('/classrooms'); // Assuming this returns classrooms the student is in? 
      // Actually, ListClassrooms on backend currently returns ALL classrooms or just teacher's?
      // Start with listing all, or need a backend endpoint generic enough. 
      // The current backend ListClassrooms filters by TeacherID if user is teacher.
      // If student, does it return all? 
      // Let's assume for now the backend might need a tweak or it returns all public.
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

  const handleSolveExercise = (ex) => {
      // Save context and redirect to IDE
      if (typeof window !== 'undefined') {
          localStorage.setItem('clab-restore-code', ex.initialCode || "");
          localStorage.setItem('clab-exercise-id', ex.id.toString());
          localStorage.setItem('clab-exercise-title', ex.title);
          router.push('/');
      }
  };

  if (loading || !user) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
        <aside className="w-64 fixed h-full border-r border-zinc-800 bg-[#0c0c0e] flex flex-col z-10">
            <div className="h-16 flex items-center px-6 border-b border-zinc-800/50 app-drag">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-900/20">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CLab <span className="text-zinc-500 font-normal">Student</span></span>
                 </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-zinc-800 text-white shadow-sm transition-all">
                    <LayoutDashboard size={18} className="text-emerald-400" />
                    <span className="font-medium text-sm">Minhas Turmas</span>
                </button>
            </nav>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold shadow-inner">
                        {user.name ? user.name[0].toUpperCase() : "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                </div>
                <button 
                    onClick={() => router.push("/")}
                    className="w-full flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span>Voltar ao IDE</span>
                </button>
            </div>
        </aside>

        <main className="flex-1 ml-64 h-screen overflow-y-auto bg-[#09090b] pb-20">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {selectedClassroom ? (
                    <div className="animate-in fade-in duration-300">
                        <button 
                            onClick={() => setSelectedClassroom(null)}
                            className="flex items-center space-x-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                        >
                            <ArrowLeft size={20} />
                            <span>Voltar para Turmas</span>
                        </button>

                        <header className="mb-8 border-b border-zinc-800 pb-4">
                            <h1 className="text-3xl font-bold text-white mb-2">{selectedClassroom.name}</h1>
                            <p className="text-zinc-500">Listas de exercícios disponíveis.</p>
                        </header>

                        {loadingTopics ? (
                            <div className="text-center py-20 text-zinc-500">Buscando listas de exercícios...</div>
                        ) : topics.length === 0 ? (
                            <div className="text-center py-20 bg-zinc-900/30 border-2 border-dashed border-zinc-800 rounded-xl">
                                <div className="p-3 bg-zinc-800 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 text-zinc-600">
                                    <BookOpen size={24} />
                                </div>
                                <h3 className="text-zinc-400 font-medium">Nenhuma lista disponível</h3>
                                <p className="text-zinc-600 text-sm mt-1">O professor ainda não publicou exercícios para esta turma.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {topics.map((topic) => {
                                    const isExpanded = expandedTopic === topic.id;
                                    return (
                                        <div key={topic.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                            <div 
                                                onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                                                className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                                        <Code2 size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-white">{topic.title}</h3>
                                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{topic.exercises?.length || 0} exercícios</p>
                                                    </div>
                                                </div>
                                                <button className="text-zinc-500 hover:text-white transition-colors">
                                                    <ChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="px-5 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                                    {topic.exercises?.map((ex) => (
                                                        <div key={ex.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-lg hover:border-blue-500/50 transition-all group shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-semibold text-zinc-200 group-hover:text-blue-400 transition-colors">{ex.title}</h4>
                                                                <button 
                                                                    onClick={() => handleSolveExercise(ex)}
                                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded uppercase transition-colors"
                                                                >
                                                                    Resolver
                                                                </button>
                                                            </div>
                                                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{ex.description}</p>
                                                        </div>
                                                    ))}
                                                    {(!topic.exercises || topic.exercises.length === 0) && (
                                                        <p className="text-xs text-zinc-600 col-span-full italic py-2">Esta lista ainda não possui exercícios.</p>
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
                        <header className="mb-8 border-b border-gray-800 pb-4">
                            <h1 className="text-2xl font-bold text-white">Minhas Turmas</h1>
                            <p className="text-gray-400 mt-2 text-sm">Selecione uma turma para ver os exercícios.</p>
                        </header>

                        {loadingData ? (
                            <div className="text-center py-20 text-zinc-500">Carregando turmas...</div>
                        ) : classrooms.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                                <BookOpen size={48} className="mx-auto mb-4 text-zinc-700" />
                                <p className="text-zinc-500">Você não está matriculado em nenhuma turma.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {classrooms.map((cls) => (
                                    <div 
                                        key={cls.id} 
                                        onClick={() => setSelectedClassroom(cls)}
                                        className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer hover:border-emerald-500/50 group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <BookOpen size={24} />
                                            </div>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-1">{cls.name}</h3>
                                        <p className="text-zinc-500 text-sm">ID: {cls.id}</p>
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
