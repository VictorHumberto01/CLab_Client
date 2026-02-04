"use client";

import React, { useState, useEffect } from "react";
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
                        Live Monitoring
                    </h1>
                </div>
                <p className="text-gray-400 mt-2 text-sm">Real-time view of student compilation activities.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Object.values(activeCompilations).length === 0 && (
                    <div className="col-span-full text-center py-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <Monitor size={48} className="mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-zinc-500 font-medium text-lg">No active sessions</h3>
                        <p className="text-zinc-600 text-sm mt-1">When students run code, it will appear here automatically.</p>
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
                                    <span className="font-medium text-sm text-gray-200 block leading-tight">{comp.name || "Unknown"}</span>
                                    <span className="text-[10px] text-zinc-500 block leading-tight">ID: {comp.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-zinc-900 rounded-full px-2 py-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${comp.status === 'Running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                                <span className="text-[10px] text-zinc-400 font-medium uppercase">{comp.status}</span>
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
                <h1 className="text-2xl font-bold text-white">Classrooms</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm">Manage students, assignments, and grades.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Placeholder Card 1 */}
            <div className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <BookOpen size={24} />
                    </div>
                    <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Active</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">Intro to C Programming</h3>
                <p className="text-zinc-500 text-sm mb-4">CS101 • 32 Students</p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[65%]" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-right">65% Course Completed</p>
            </div>

            {/* Placeholder Card 2 */}
            <div className="group border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 rounded-xl p-6 transition-all cursor-pointer">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
                        <BookOpen size={24} />
                    </div>
                     <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded">Active</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">Data Structures</h3>
                <p className="text-zinc-500 text-sm mb-4">CS201 • 28 Students</p>
                 <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[30%]" />
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-right">30% Course Completed</p>
            </div>

             <div className="border border-dashed border-zinc-800 rounded-xl flex items-center justify-center p-6 hover:bg-zinc-900/50 transition-colors cursor-pointer text-zinc-600 hover:text-zinc-400">
                <div className="text-center">
                    <span className="text-3xl font-light block mb-2">+</span>
                    <span className="text-sm font-medium">Create New Class</span>
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
                <h1 className="text-2xl font-bold text-white">Exam Mode</h1>
            </div>
            <p className="text-gray-400 mt-2 text-sm">Secure environment settings and active exam sessions.</p>
        </header>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center max-w-2xl mx-auto mt-20">
             <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <GraduationCap size={40} className="text-purple-500" />
             </div>
             <h2 className="text-xl font-semibold text-white mb-2">No Active Exams</h2>
             <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                 You can schedule a new exam or start an instant session. Students will be locked into the secure browser environment.
             </p>
             <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg active:scale-95 transition-all font-medium">
                 Create Exam Session
             </button>
        </div>
    </div>
);


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

    const wsUrl = `ws://localhost:8080/ws`; 
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
                <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 px-4 mt-4">Overview</div>
                <NavItem id="monitoring" label="Live Monitoring" icon={LayoutDashboard} />
                <NavItem id="classrooms" label="Classrooms" icon={BookOpen} />
                <NavItem id="exams" label="Exam Mode" icon={GraduationCap} />
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
                    <span>Back to IDE</span>
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 min-h-screen bg-[#09090b]">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {activeTab === "monitoring" && <MonitoringView activeCompilations={activeCompilations} />}
                {activeTab === "classrooms" && <ClassroomsView />}
                {activeTab === "exams" && <ExamModeView />}
            </div>
        </main>

    </div>
  );
}
