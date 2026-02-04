"use client";

import React, { useState, useEffect } from "react";
import api, { getWsUrl } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Terminal as TerminalIcon, 
  Monitor, 
  Clock, 
  User, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  ArrowLeft,
  LayoutDashboard,
  Users
} from "lucide-react";

// --- Sub-components for Views ---

const MonitoringView = ({ activeCompilations }) => {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
                <div className="flex items-center space-x-3">
                    <Monitor className="text-blue-500" size={28} />
                    <h1 className="text-2xl font-bold text-white">
                        Monitoramento ao Vivo
                    </h1>
                </div>
                <p className="text-gray-400 mt-2 text-sm">Visualização em tempo real das atividades de compilação dos alunos.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.values(activeCompilations).length === 0 && (
                    <div className="col-span-full text-center py-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <Monitor size={48} className="mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-zinc-500 font-medium text-lg">Nenhuma sessão ativa</h3>
                        <p className="text-zinc-600 text-sm mt-1">Quando os alunos executarem código, aparecerá aqui automaticamente.</p>
                    </div>
                )}

                {Object.values(activeCompilations).map((comp) => (
                    <div key={comp.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col shadow-xl hover:ring-1 hover:ring-blue-500/50 transition-all">
                        <div className="bg-zinc-950 px-4 py-3 flex items-center justify-between border-b border-zinc-800">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                                    <User size={14} />
                                </div>
                                <div>
                                    <span className="font-medium text-sm text-gray-200 block leading-tight">{comp.name || "Desconhecido"}</span>
                                    <span className="text-[10px] text-zinc-500 block leading-tight">ID: {comp.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-zinc-900 rounded-full px-2 py-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'Running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-[10px] text-zinc-400 font-medium uppercase">{comp.status === 'Running' ? 'Executando' : 'Concluído'}</span>
                            </div>
                        </div>
                        <div className="flex-1 bg-black p-3 h-56 overflow-auto font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            {comp.output}
                        </div>
                        <div className="bg-zinc-950 px-3 py-2 border-t border-zinc-800 text-[10px] text-zinc-500 flex items-center justify-between">
                             <div className="flex items-center">
                                <Clock size={10} className="mr-1.5" />
                                {new Date(comp.timestamp).toLocaleTimeString()}
                             </div>
                             <span className="text-zinc-700 font-mono">C</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClassroomsView = () => (
    <div className="animate-in fade-in duration-500">
        <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
            <div className="flex items-center space-x-3">
                <Users className="text-emerald-500" size={28} />
                <h1 className="text-2xl font-bold text-white">Turmas</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm">Gerencie alunos, tarefas e notas.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder Card 1 */}
            <div className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <BookOpen size={24} />
                    </div>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Ativa</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Introdução à Programação C</h3>
                <p className="text-zinc-500 text-sm mb-4">CS101 • 32 Alunos</p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%]" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-right">65% Curso Concluído</p>
            </div>

            {/* Placeholder Card 2 */}
            <div className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <BookOpen size={24} />
                    </div>
                     <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Ativa</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Estruturas de Dados</h3>
                <p className="text-zinc-500 text-sm mb-4">CS201 • 28 Alunos</p>
                 <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[30%]" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-right">30% Curso Concluído</p>
            </div>

             <div className="border border-dashed border-zinc-800 rounded-xl flex items-center justify-center p-6 hover:bg-zinc-900/50 transition-colors cursor-pointer text-zinc-600 hover:text-zinc-400">
                <div className="text-center">
                    <span className="text-3xl font-light block mb-2">+</span>
                    <span className="text-sm font-medium">Criar Nova Turma</span>
                </div>
            </div>
        </div>
    </div>
);

const ExamModeView = () => (
     <div className="animate-in fade-in duration-500">
        <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
            <div className="flex items-center space-x-3">
                <GraduationCap className="text-purple-500" size={28} />
                <h1 className="text-2xl font-bold text-white">Modo Prova</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm">Configurações de ambiente seguro e sessões de prova ativas.</p>
        </header>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto mt-20">
             <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <GraduationCap size={40} className="text-purple-500" />
             </div>
             <h2 className="text-xl font-semibold text-white mb-2">Nenhuma Prova Ativa</h2>
             <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                 Você pode agendar uma nova prova ou iniciar uma sessão instantânea. Os alunos serão bloqueados no ambiente seguro do navegador.
             </p>
             <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg active:scale-95 transition-all font-medium">
                 Criar Sessão de Prova
             </button>
        </div>
    </div>
);


const UsersView = ({ user }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    
    const isAdmin = user?.role === "ADMIN";

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (roleFilter) params.append("role", roleFilter);
            
            const res = await api.get(`/users?${params.toString()}`);
            if (res.data.success) {
                setUsers(res.data.data.users || []);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [roleFilter]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError("");
        try {
            const res = await api.post("/users", newUser);
            if (res.data.success) {
                setShowCreateModal(false);
                setNewUser({ name: "", email: "", password: "", role: "USER" });
                fetchUsers();
            } else {
                setError(res.data.error || "Failed to create user");
            }
        } catch (err) {
            setError("Failed to create user");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Users className="text-amber-500" size={28} />
                        <h1 className="text-2xl font-bold text-white">Gerenciamento de Usuários</h1>
                    </div>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="no-drag bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        + Criar Usuário
                    </button>
                </div>
                <p className="text-gray-400 mt-2 text-sm">
                    {isAdmin ? "Gerencie professores e alunos." : "Gerencie seus alunos."}
                </p>
            </header>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button 
                    onClick={() => setRoleFilter("")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!roleFilter ? "bg-zinc-700 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                >
                    Todos
                </button>
                {isAdmin && (
                    <button 
                        onClick={() => setRoleFilter("TEACHER")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "TEACHER" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                    >
                        Professores
                    </button>
                )}
                <button 
                    onClick={() => setRoleFilter("USER")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "USER" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
                >
                    Alunos
                </button>
            </div>

            {/* User List */}
            {loading ? (
                <div className="text-center py-12 text-zinc-500">Carregando...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-xl">
                    <Users size={48} className="mx-auto mb-4 text-zinc-700" />
                    <p className="text-zinc-500">Nenhum usuário encontrado</p>
                </div>
            ) : (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-zinc-950 border-b border-zinc-800">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Nome</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-500 uppercase">Função</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 text-white font-medium">{u.name}</td>
                                    <td className="px-6 py-4 text-zinc-400">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            u.role === "TEACHER" ? "bg-blue-500/20 text-blue-400" :
                                            u.role === "ADMIN" ? "bg-red-500/20 text-red-400" :
                                            "bg-emerald-500/20 text-emerald-400"
                                        }`}>
                                            {u.role === "TEACHER" ? "Professor" : u.role === "ADMIN" ? "Admin" : "Aluno"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Criar Usuário</h2>
                        {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                                <input 
                                    type="text" 
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Email</label>
                                <input 
                                    type="email" 
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Senha</label>
                                <input 
                                    type="password" 
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            {isAdmin && (
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Função</label>
                                    <select 
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    >
                                        <option value="USER">Aluno</option>
                                        <option value="TEACHER">Professor</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {creating ? "Criando..." : "Criar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


// --- Main Layout ---

export default function TeacherDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("monitoring");
  const [activeCompilations, setActiveCompilations] = useState({}); 

  useEffect(() => {
    if (!loading && (!user || (user.role !== "TEACHER" && user.role !== "ADMIN"))) {
      router.push("/");
    }
  }, [user, loading, router]);

  // WebSocket Logic (Preserved)
  useEffect(() => {
    if (!user) return;

    const wsUrl = `${getWsUrl()}/ws`; 
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => { console.log("Monitor Connected"); };

    socket.onmessage = (event) => {
        try {
            const msg = JSON.parse(event.data);
            if (msg.type === "compile_start") {
                setActiveCompilations(prev => ({
                    ...prev,
                    [msg.userId]: {
                        id: msg.userId,
                        name: msg.userName,
                        output: msg.payload + "\n",
                        status: "Running",
                        timestamp: msg.timestamp
                    }
                }));
            } else if (msg.type === "output_chunk") {
                setActiveCompilations(prev => {
                     const existing = prev[msg.userId] || { id: msg.userId, name: msg.userName, output: "", status: "Running" };
                     return {
                         ...prev,
                         [msg.userId]: {
                             ...existing,
                             output: existing.output + msg.payload,
                             lastUpdate: Date.now()
                         }
                     };
                });
            } else if (msg.type === "compile_end") {
                 setActiveCompilations(prev => {
                     const existing = prev[msg.userId];
                     if (!existing) return prev;
                     return {
                         ...prev,
                         [msg.userId]: {
                             ...existing,
                             status: "Completed",
                             output: existing.output + "\n" + msg.payload
                         }
                     };
                });
            }
        } catch (e) {
            console.error("Monitor Error", e);
        }
    };

    return () => { socket.close(); };
  }, [user]);

  if (loading || !user) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">Loading...</div>;

  const NavItem = ({ id, label, icon: Icon }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeTab === id 
            ? "bg-zinc-800 text-white shadow-sm" 
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
        }`}
      >
          <Icon size={18} className={activeTab === id ? "text-blue-400" : ""} />
          <span className="font-medium text-sm">{label}</span>
      </button>
  );

  return (
    <div className="flex min-h-screen bg-[#09090b] text-white font-sans selection:bg-blue-500/30">
        
        {/* Sidebar */}
        <aside className="w-64 fixed h-full border-r border-zinc-800 bg-[#0c0c0e] flex flex-col z-10">
            {/* Branding */}
            <div className="h-16 flex items-center px-6 border-b border-zinc-800/50 app-drag">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Monitor size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">CLab <span className="text-zinc-500 font-normal">Teacher</span></span>
                 </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1">
                <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 px-4 mt-4">Visão Geral</div>
                <NavItem id="monitoring" label="Monitoramento" icon={LayoutDashboard} />
                <NavItem id="classrooms" label="Turmas" icon={BookOpen} />
                <NavItem id="users" label="Usuários" icon={Users} />
                <NavItem id="exams" label="Modo Prova" icon={GraduationCap} />
            </nav>

            {/* User & Exit */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
                <div className="flex items-center space-x-3 mb-4 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shadow-inner">
                        {user.name ? user.name[0].toUpperCase() : "T"}
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

        {/* Main Content */}
        <main className="flex-1 ml-64 min-h-screen bg-[#09090b]">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {activeTab === "monitoring" && <MonitoringView activeCompilations={activeCompilations} />}
                {activeTab === "classrooms" && <ClassroomsView />}
                {activeTab === "users" && <UsersView user={user} />}
                {activeTab === "exams" && <ExamModeView />}
            </div>
        </main>

    </div>
  );
}
