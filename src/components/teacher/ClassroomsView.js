"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { 
  Users, 
  BookOpen, 
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  Trash2,
  Code2,
  Monitor,
  Bot,
  User
} from "lucide-react";

const ClassroomsView = () => {
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassroomName, setNewClassroomName] = useState("");
    const [selectedClassroom, setSelectedClassroom] = useState(null);
    const [studentEmail, setStudentEmail] = useState("");
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState('students');
    const [newExercise, setNewExercise] = useState({ topicId: 0, title: "", description: "", expectedOutput: "", initialCode: "" });
    const [topics, setTopics] = useState([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showExerciseModal, setShowExerciseModal] = useState(false);
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [expandedTopic, setExpandedTopic] = useState(null);
    const [expandedStudentActivity, setExpandedStudentActivity] = useState(null);
    const [studentHistory, setStudentHistory] = useState([]);
    const [loadingStudentHistory, setLoadingStudentHistory] = useState(false);
    const [expandedExercise, setExpandedExercise] = useState(null);

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
            const res = await api.post(`/classrooms/${selectedClassroom.id}/students`, { email: studentEmail });
            if (res.data.success) {
                setStudentEmail("");
                alert("Aluno adicionado com sucesso!");
                fetchClassrooms(); 
            }
        } catch (err) {
            alert("Falha ao adicionar aluno. Verifique o email.");
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
                // If the selected classroom state holds the students, we might need to update it
                // Since fetchClassrooms updates the main list, if we are in detail view, we might need more
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
            const res = await api.post(`/classrooms/${selectedClassroom.id}/topics`, { title: newTopicTitle });
            if (res.data.success) {
                setShowTopicModal(false);
                setNewTopicTitle("");
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
                setNewExercise({ topicId: 0, title: "", description: "", expectedOutput: "", initialCode: "" });
                fetchTopics(selectedClassroom.id);
            }
        } catch (err) {
            alert("Falha ao criar exercício.");
        }
    };

    const fetchStudentActivity = async (studentId) => {
        setLoadingStudentHistory(true);
        try {
            const res = await api.get(`/history?user_id=${studentId}&classroomId=${selectedClassroom.id}`);
            if (res.data.success) {
                setStudentHistory(res.data.data || []);
            }
        } catch (err) {
            console.error(err);
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

    if (selectedClassroom) {
        return (
            <div className="animate-in fade-in duration-300">
                <button 
                    onClick={() => setSelectedClassroom(null)}
                    className="flex items-center space-x-2 text-zinc-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar para Turmas</span>
                </button>

                <header className="mb-8 border-b border-zinc-800 pb-4 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">{selectedClassroom.name}</h1>
                        <p className="text-zinc-500">ID: {selectedClassroom.id} • Professor: {selectedClassroom.teacher?.name}</p>
                    </div>
                    <button 
                        onClick={handleDeleteClassroom}
                        className="flex items-center space-x-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                        <Trash2 size={18} />
                        <span>Excluir Turma</span>
                    </button>
                </header>

                    <div className="flex gap-4 mb-6 border-b border-zinc-800">
                        <button 
                            className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'students' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                            onClick={() => setActiveTab('students')}
                        >
                            Alunos
                        </button>
                        <button 
                            className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'exercises' ? 'border-blue-500 text-blue-400' : 'border-transparent text-zinc-400 hover:text-zinc-200'}`}
                            onClick={() => setActiveTab('exercises')}
                        >
                            Exercícios
                        </button>
                    </div>

                    {activeTab === 'students' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                             <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                    <User className="mr-2 text-blue-500" size={20} />
                                    Adicionar Aluno
                                </h3>
                                <form onSubmit={handleAddStudent} className="flex gap-4">
                                    <input 
                                        type="email" 
                                        placeholder="Email do aluno (ex: aluno@clab.com)"
                                        value={studentEmail}
                                        onChange={(e) => setStudentEmail(e.target.value)}
                                        className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                                        Adicionar
                                    </button>
                                </form>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-zinc-800">
                                    <h3 className="text-lg font-semibold text-white">Alunos Matriculados</h3>
                                </div>
                                {selectedClassroom.students && selectedClassroom.students.length > 0 ? (
                                    <table className="w-full text-left text-sm text-zinc-400">
                                        <thead className="bg-zinc-950 text-zinc-500 uppercase font-medium text-xs">
                                            <tr>
                                                <th className="px-6 py-3">Nome</th>
                                                <th className="px-6 py-3">Email</th>
                                                <th className="px-6 py-3">Progresso</th>
                                                <th className="px-6 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800">
                                             {selectedClassroom.students.map((student) => (
                                                 <tr key={student.id} className="hover:bg-zinc-800/50 transition-colors text-xs">
                                                     <td className="px-6 py-3 font-medium text-white">{student.name || student.email}</td>
                                                     <td className="px-6 py-3">{student.email}</td>
                                                     <td className="px-6 py-3">
                                                         <div className="flex items-center space-x-2">
                                                             <div className="flex-1 h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                                                                 <div 
                                                                     className="h-full bg-blue-500 rounded-full" 
                                                                     style={{ width: `${(student.completedExercises / (student.totalExercises || 1)) * 100}%` }}
                                                                 />
                                                             </div>
                                                             <span className="text-[10px] text-zinc-500 font-mono">
                                                                 {student.completedExercises}/{student.totalExercises}
                                                             </span>
                                                         </div>
                                                     </td>
                                                     <td className="px-6 py-3 text-right">
                                                         <div className="flex items-center justify-end space-x-3">
                                                            <button 
                                                                onClick={() => setExpandedStudentActivity(student)}
                                                                className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase tracking-wider"
                                                            >
                                                                Ver Atividade
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRemoveStudent(student.id)}
                                                                className="text-red-500 hover:text-red-400 text-[10px] font-medium uppercase tracking-wider"
                                                            >
                                                                Remover
                                                            </button>
                                                         </div>
                                                     </td>
                                                 </tr>
                                             ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="p-8 text-center text-zinc-500">
                                        <Users size={32} className="mx-auto mb-3 text-zinc-700" />
                                        <p>Nenhum aluno matriculado nesta turma.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeTab === 'exercises' && (
                         <div className="space-y-6 animate-in fade-in duration-300">
                              <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-xl font-semibold text-white">Listas de Exercícios</h3>
                                 <div className="flex gap-2">
                                     <button 
                                         onClick={() => setShowTopicModal(true)}
                                         className="bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors border border-blue-500/20"
                                     >
                                         <Plus size={18} />
                                         <span>Nova Lista</span>
                                     </button>
                                     <button 
                                         onClick={() => setShowExerciseModal(true)}
                                         className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                                     >
                                         <Plus size={18} />
                                         <span>Criar Exercício</span>
                                     </button>
                                 </div>
                              </div>

                              {loadingTopics ? (
                                  <div className="text-center py-10 text-zinc-500">Carregando listas...</div>
                              ) : topics.length === 0 ? (
                                 <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                                     <Code2 size={48} className="mx-auto mb-4 text-zinc-700" />
                                     <p className="text-zinc-500">Nenhuma lista criada ainda.</p>
                                 </div>
                              ) : (
                                 <div className="space-y-4">
                                     {topics.map((topic) => {
                                         const isExpanded = expandedTopic === topic.id;
                                         return (
                                             <div key={topic.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                                                  <div 
                                                     onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                                                     className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-colors"
                                                  >
                                                      <div className="flex items-center space-x-4">
                                                          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                                              <BookOpen size={20} />
                                                          </div>
                                                          <div>
                                                              <h4 className="text-lg font-bold text-white">{topic.title}</h4>
                                                              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{topic.exercises?.length || 0} exercícios</p>
                                                          </div>
                                                      </div>
                                                      <ChevronDown className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                                  </div>

                                                  {isExpanded && (
                                                      <div className="border-t border-zinc-800 bg-black/20 p-5 space-y-3">
                                                           {topic.exercises?.map((ex) => {
                                                               const isExExpanded = expandedExercise === ex.id;
                                                               return (
                                                                   <div key={ex.id} className="bg-zinc-950 border border-zinc-800/50 rounded-lg overflow-hidden">
                                                                        <div 
                                                                            onClick={() => setExpandedExercise(isExExpanded ? null : ex.id)}
                                                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-900 transition-colors"
                                                                        >
                                                                            <span className="text-sm font-medium text-zinc-300">{ex.title}</span>
                                                                            <ChevronDown className={`text-zinc-600 transition-transform ${isExExpanded ? 'rotate-180' : ''}`} size={16} />
                                                                        </div>
                                                                        {isExExpanded && (
                                                                            <div className="p-4 pt-2 border-t border-zinc-900 space-y-4">
                                                                                <div>
                                                                                    <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Descrição:</div>
                                                                                    <p className="text-xs text-zinc-400 whitespace-pre-wrap">{ex.description}</p>
                                                                                </div>
                                                                                <div className="grid grid-cols-2 gap-4">
                                                                                    <div>
                                                                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Saída:</div>
                                                                                        <pre className="text-[10px] bg-black p-2 rounded text-emerald-500 overflow-x-auto">{ex.expectedOutput || "Nenhuma"}</pre>
                                                                                    </div>
                                                                                    <div>
                                                                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Código:</div>
                                                                                        <pre className="text-[10px] bg-black p-2 rounded text-blue-500 overflow-x-auto">{ex.initialCode || "Nenhum"}</pre>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                   </div>
                                                               );
                                                           })}
                                                           {(!topic.exercises || topic.exercises.length === 0) && (
                                                               <p className="text-center py-4 text-xs text-zinc-600 italic">Nenhum exercício nesta lista.</p>
                                                           )}
                                                      </div>
                                                  )}
                                             </div>
                                         );
                                     })}
                                 </div>
                              )}
                         </div>
                    )}

                    {/* Create Exercise Modal */}
                    {showExerciseModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Novo Exercício</h2>
                                    <button onClick={() => setShowExerciseModal(false)} className="text-zinc-500 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateExercise} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Lista (Tópico)</label>
                                        <select 
                                            value={newExercise.topicId}
                                            onChange={(e) => setNewExercise({...newExercise, topicId: parseInt(e.target.value)})}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            required
                                        >
                                            <option value="">Selecione uma lista...</option>
                                            {topics.map(t => (
                                                <option key={t.id} value={t.id}>{t.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Título</label>
                                        <input 
                                            type="text" 
                                            value={newExercise.title}
                                            onChange={(e) => setNewExercise({...newExercise, title: e.target.value})}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Descrição</label>
                                        <textarea 
                                            value={newExercise.description}
                                            onChange={(e) => setNewExercise({...newExercise, description: e.target.value})}
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 h-24"
                                            placeholder="Descreva o problema..."
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Saída Esperada (Exact Match)</label>
                                            <textarea 
                                                value={newExercise.expectedOutput}
                                                onChange={(e) => setNewExercise({...newExercise, expectedOutput: e.target.value})}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32"
                                                placeholder="Ex: Hello World"
                                            />
                                            <p className="text-xs text-zinc-500 mt-1">A IA usará isso para corrigir automaticamente.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-zinc-400 mb-1">Código Inicial (Boilerplate)</label>
                                            <textarea 
                                                value={newExercise.initialCode}
                                                onChange={(e) => setNewExercise({...newExercise, initialCode: e.target.value})}
                                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 h-32"
                                                placeholder="#include <stdio.h>..."
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            type="button"
                                            onClick={() => setShowExerciseModal(false)}
                                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                        >
                                            Criar Exercício
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Create Topic Modal */}
                    {showTopicModal && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-white">Nova Lista de Exercícios</h2>
                                    <button onClick={() => setShowTopicModal(false)} className="text-zinc-500 hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>
                                <form onSubmit={handleCreateTopic} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-zinc-400 mb-1">Título da Lista</label>
                                        <input 
                                            type="text" 
                                            value={newTopicTitle}
                                            onChange={(e) => setNewTopicTitle(e.target.value)}
                                            placeholder="Ex: Alocação Dinâmica"
                                            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            type="button"
                                            onClick={() => setShowTopicModal(false)}
                                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                        >
                                            Criar Lista
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Student Activity Modal */}
                    {expandedStudentActivity && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 rounded-t-xl">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{expandedStudentActivity.name || expandedStudentActivity.email}</h2>
                                        <p className="text-sm text-zinc-500">Histórico de submissões nesta turma</p>
                                    </div>
                                    <button onClick={() => setExpandedStudentActivity(null)} className="text-zinc-500 hover:text-white p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
                                    {loadingStudentHistory ? (
                                        <div className="flex items-center justify-center h-full text-zinc-500">
                                            <span>Carregando histórico...</span>
                                        </div>
                                    ) : studentHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-12">
                                            <Monitor size={48} className="mb-4 opacity-20" />
                                            <p>Nenhuma submissão encontrada para este aluno nesta turma.</p>
                                        </div>
                                    ) : (
                                        studentHistory.map((item) => (
                                            <div key={item.ID} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="text-xs text-zinc-500 mb-1">{new Date(item.CreatedAt).toLocaleString()}</div>
                                                        <h4 className="font-semibold text-zinc-200">{item.exercise?.title || "Código Livre"}</h4>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.isSuccess ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {item.isSuccess ? 'Sucesso' : 'Erro'}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                    <div>
                                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Código Enviado:</div>
                                                        <pre className="text-[10px] bg-black p-3 rounded border border-zinc-800 text-zinc-300 font-mono h-32 overflow-y-auto">
                                                            {item.Code}
                                                        </pre>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Resultado / Análise IA:</div>
                                                        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 h-32 overflow-y-auto">
                                                            {item.aiAnalysis ? (
                                                                <div className="text-xs text-blue-300 whitespace-pre-wrap">
                                                                    <div className="flex items-center text-[9px] text-blue-400 font-bold uppercase mb-1">
                                                                        <Bot size={10} className="mr-1" /> IA:
                                                                    </div>
                                                                    {item.aiAnalysis}
                                                                </div>
                                                            ) : (
                                                                <pre className="text-[10px] text-zinc-500 font-mono">
                                                                    {item.Output || item.Error || "Sem saída"}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8 border-b border-gray-800 pb-4 app-drag flex justify-between items-center">
                <div>
                    <div className="flex items-center space-x-3">
                        <Users className="text-emerald-500" size={28} />
                        <h1 className="text-2xl font-bold text-white">Turmas</h1>
                    </div>
                    <p className="text-gray-400 mt-2 text-sm">Gerencie suas turmas e alunos.</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="no-drag bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors"
                >
                    <Plus size={18} />
                    <span>Nova Turma</span>
                </button>
            </header>

            {loading ? (
                 <div className="text-center py-20 text-zinc-500">Carregando turmas...</div>
            ) : classrooms.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                    <BookOpen size={48} className="mx-auto mb-4 text-zinc-700" />
                    <h3 className="text-zinc-500 font-medium text-lg">Nenhuma turma encontrada</h3>
                    <p className="text-zinc-600 text-sm mt-1">Crie sua primeira turma para começar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classrooms.map((cls) => (
                        <div 
                            key={cls.id} 
                            onClick={() => setSelectedClassroom(cls)}
                            className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer hover:border-emerald-500/50"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    <BookOpen size={24} />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">{cls.name}</h3>
                            <p className="text-zinc-500 text-sm">Prof. {cls.teacher?.name}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Nova Turma</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClassroom} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nome da Turma</label>
                                <input 
                                    type="text" 
                                    value={newClassroomName}
                                    onChange={(e) => setNewClassroomName(e.target.value)}
                                    placeholder="Ex: Estruturas de Dados 2024"
                                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                                >
                                    Criar Turma
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassroomsView;
