"use client";

import React from "react";
import { 
  Play, 
  Settings, 
  Loader2, 
  Bot,
  User,
  LogOut,
  ChevronDown,
  Code,
  Monitor
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MenuBar = ({ runInCloud, stopCode, isRunning, showAiPanel, setShowAiPanel, exercise, submitInCloud, exitExercise }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  return (
    <div className="h-10 border-b border-border bg-surface flex items-center justify-between px-3 select-none app-drag">
      {/* Left: Branding & Actions */}
      <div className="flex items-center space-x-4 pl-20">
        <div className="flex items-center space-x-2 opacity-80 hover:opacity-100 transition-opacity">
          <Code className="text-primary" size={16} />
          <span className="font-semibold text-foreground text-sm tracking-tight">CLab IDE</span>
        </div>

        <div className="h-4 w-px bg-border my-auto" />

        {exercise && (
          <>
            <div className="flex items-center space-x-2 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              <span className="text-[10px] uppercase font-bold text-blue-400">Resolvendo:</span>
              <span className="text-xs font-medium text-white max-w-[150px] truncate">{exercise.title}</span>
            </div>
            <button 
                onClick={exitExercise}
                className="flex items-center space-x-1 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded text-xs font-medium transition-colors ml-2 no-drag"
                title="Sair do exercício atual"
            >
                <LogOut size={12} className="mr-1" />
                <span>Sair</span>
            </button>
            <div className="h-4 w-px bg-border my-auto" />
          </>
        )}

        <div className="flex items-center space-x-1 no-drag">
          {isRunning ? (
              <button
                onClick={stopCode}
                className="flex items-center space-x-2 px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded text-xs font-medium transition-all"
              >
                 <Loader2 size={12} className="animate-spin mr-1.5" />
                 Parar
              </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={runInCloud}
                className="flex items-center space-x-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs font-medium transition-all"
                title="Apenas compila e executa sem validar"
              >
                 <Play size={10} className="fill-current mr-1" />
                 Executar
              </button>

              {exercise && (
                <button
                    onClick={submitInCloud}
                    className="flex items-center space-x-2 px-3 py-1 bg-green-600/10 hover:bg-green-600/20 text-green-500 border border-green-600/20 rounded text-xs font-bold transition-all"
                    title="Executa e envia para correção da IA"
                >
                    <Bot size={12} className="mr-1" />
                    Submeter
                </button>
              )}
            </div>
          )}
          {!exercise && user?.role === 'USER' && (
              <button
                onClick={() => router.push('/student')}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border border-blue-600/20 rounded text-xs font-medium transition-all mr-2"
              >
                 <Monitor size={12} className="mr-1.5" />
                 Meus Exercícios
              </button>
          )}
        </div>
      </div>

      {/* Right: Tools & Profile */}
      <div className="flex items-center space-x-2 no-drag">
          <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className={`p-1.5 rounded transition-all flex items-center text-xs font-medium ${
            showAiPanel 
              ? 'bg-primary/20 text-primary' 
              : 'text-secondary hover:text-foreground hover:bg-surface-hover'
          }`}
          title="Alternar Assistente IA"
        >
          <Bot size={14} className="mr-1.5" />
          Assistente IA
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        {user ? (
          <div className="relative">
             <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-surface-hover transition-all text-xs text-foreground"
             >
                <User size={18} className="text-primary" />
                <span className="max-w-[100px] truncate">{user.email}</span>
                <ChevronDown size={12} className="text-secondary" />
             </button>

             {showProfileMenu && (
                 <div className="absolute top-full right-0 mt-1 w-48 bg-surface border border-border rounded shadow-xl py-1 z-50">
                      <div className="p-1">
                        <Link 
                            href="/settings"
                            className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover rounded transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                        >
                            <Settings size={14} className="mr-2 opacity-70" />
                            Configurações
                        </Link>
                        <Link 
                            href="/account"
                            className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover rounded transition-colors"
                            onClick={() => setShowProfileMenu(false)}
                        >
                            <User size={14} className="mr-2 opacity-70" />
                            Meu Perfil
                        </Link>
                        {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
                            <Link 
                                href="/teacher"
                                className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover rounded transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                            >
                                <Monitor size={14} className="mr-2 opacity-70" />
                                Painel do Professor
                            </Link>
                        )}
                        {user.role === 'USER' && (
                            <Link 
                                href="/student"
                                className="flex items-center px-3 py-1.5 text-xs text-foreground hover:bg-surface-hover rounded transition-colors"
                                onClick={() => setShowProfileMenu(false)}
                            >
                                <Monitor size={14} className="mr-2 opacity-70" />
                                Minhas Turmas
                            </Link>
                        )}
                        <button 
                            onClick={() => {
                                logout();
                                setShowProfileMenu(false);
                            }}
                            className="w-full flex items-center px-3 py-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded transition-colors"
                        >
                            <LogOut size={14} className="mr-2 opacity-70" />
                            Sair
                        </button>
                      </div>
                 </div>
             )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
             <Link 
                href="/settings"
                className="p-1.5 text-secondary hover:text-foreground hover:bg-surface-hover rounded transition-colors"
                title="Configurações"
             >
                 <Settings size={16} />
             </Link>
             <Link 
                href="/login"
                className="px-3 py-1 text-xs font-medium text-foreground hover:bg-surface-hover rounded transition-colors"
             >
                 Entrar
             </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;