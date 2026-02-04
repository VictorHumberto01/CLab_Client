"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Monitor, 
  BookOpen, 
  GraduationCap, 
  ArrowLeft,
  LayoutDashboard,
  Users
} from "lucide-react";

import MonitoringView from "../../components/teacher/MonitoringView";
import ClassroomsView from "../../components/teacher/ClassroomsView";
import UsersView from "../../components/teacher/UsersView";
import ExamModeView from "../../components/teacher/ExamModeView";

// --- Main Layout ---

export default function TeacherDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("monitoring"); 

  useEffect(() => {
    if (!loading && (!user || (user.role !== "TEACHER" && user.role !== "ADMIN"))) {
      router.push("/");
    }
  }, [user, loading, router]);

  console.log("Teacher dashboard loaded");

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
        <main className="flex-1 ml-64 h-screen overflow-y-auto bg-[#09090b] pb-20">
            <div className="max-w-7xl mx-auto p-8 lg:p-12">
                {activeTab === "monitoring" && <MonitoringView />}
                {activeTab === "classrooms" && <ClassroomsView />}
                {activeTab === "users" && <UsersView user={user} />}
                {activeTab === "exams" && <ExamModeView />}
            </div>
        </main>

    </div>
  );
}
