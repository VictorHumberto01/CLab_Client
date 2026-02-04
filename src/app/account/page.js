"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Code, Terminal, Calendar } from 'lucide-react';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        try {
          const res = await api.get('/history');
          setHistory(res.data || []);
        } catch (error) {
          console.error("Failed to fetch history", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [user]);

  if (loading || !user) return null;

  const [selectedItem, setSelectedItem] = useState(null);

  const handleRestore = (code) => {
    // Save to localStorage so the main page can pick it up (we'll need to update page.js to check this)
    if (typeof window !== 'undefined') {
        localStorage.setItem('clab-restore-code', code);
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen p-8 relative overflow-hidden bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <Link 
            href="/" 
            className="flex items-center text-secondary hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Voltar ao IDE
          </Link>
          <button 
            onClick={logout}
            className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded hover:bg-red-500/10 transition-colors"
          >
            Sair
          </button>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Profile Card */}
          <div className="bg-surface border border-border p-5 rounded-lg col-span-1 h-fit">
            <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-lg font-bold text-white mr-3">
                {user.email?.[0].toUpperCase()}
                </div>
                <div>
                    <h2 className="text-sm font-bold text-foreground">Minha Conta</h2>
                    <p className="text-secondary text-xs">{user.email}</p>
                </div>
            </div>
            
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary">Função</span>
                <span className="text-xs font-mono px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                  Estudante
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">Entrou em</span>
                <span className="text-foreground">Fev 2026</span>
              </div>
            </div>
          </div>

          {/* Activity / History */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-lg font-bold flex items-center text-foreground">
              <Clock className="mr-2 text-primary" size={18} />
              Atividade Recente
            </h3>

            {loadingHistory ? (
              <div className="text-center py-12 text-secondary text-sm">Carregando histórico...</div>
            ) : history.length === 0 ? (
              <div className="bg-surface border border-border p-8 rounded-lg text-center">
                <Terminal className="mx-auto text-secondary mb-3" size={32} />
                <p className="text-secondary text-sm">Nenhum histórico encontrado.</p>
                <Link href="/" className="text-primary hover:text-primary-hover text-sm mt-2 inline-block">
                  Começar a codar &rarr;
                </Link>
              </div>
            ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div 
                        key={item.ID}
                        onClick={() => setSelectedItem(item)}
                        className="bg-surface border border-border hover:border-primary/50 p-3 rounded hover:bg-surface-hover transition-colors group cursor-pointer flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3 overflow-hidden">
                             <span className={`flex-shrink-0 w-2 h-2 rounded-full ${!item.Error ? 'bg-green-500' : 'bg-red-500'}`} />
                             <div className="flex flex-col min-w-0">
                                <span className="font-mono text-xs text-foreground truncate max-w-[300px]">
                                    {item.Code?.substring(0, 40)}...
                                </span>
                                <span className="text-[10px] text-secondary flex items-center mt-1">
                                    <Calendar size={10} className="mr-1" />
                                    {new Date(item.CreatedAt).toLocaleDateString()}
                                </span>
                             </div>
                        </div>
                        <div className="text-xs text-secondary font-mono truncate max-w-[150px] hidden sm:block">
                            {item.Output ? `> ${item.Output.substring(0, 20)}` : ''}
                        </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        </motion.div>

        {/* Detail Modal */}
        {selectedItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-3 border-b border-border bg-surface-hover">
                        <h3 className="font-semibold text-foreground text-sm">Detalhes da Execução</h3>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => handleRestore(selectedItem.Code)}
                                className="px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded transition-colors flex items-center"
                            >
                                <Code size={14} className="mr-1.5" />
                                Abrir no Editor
                            </button>
                            <button onClick={() => setSelectedItem(null)} className="text-secondary hover:text-foreground">
                                &times;
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-0 overflow-auto flex-1 font-mono text-xs">
                        {/* Code Section */}
                        <div className="p-4 border-b border-border">
                            <div className="text-secondary mb-2 uppercase tracking-wide font-bold text-[10px]">Código Fonte</div>
                            <pre className="bg-background p-3 rounded text-foreground overflow-x-auto border border-border">
                                <code>{selectedItem.Code}</code>
                            </pre>
                        </div>

                        <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                            <div className="p-4">
                                <div className="text-secondary mb-2 uppercase tracking-wide font-bold text-[10px]">Entrada (Stdin)</div>
                                <pre className="text-foreground whitespace-pre-wrap">{selectedItem.Input || "—"}</pre>
                            </div>
                            <div className="p-4">
                                <div className="text-secondary mb-2 uppercase tracking-wide font-bold text-[10px]">Saída (Stdout)</div>
                                <pre className="text-foreground whitespace-pre-wrap">{selectedItem.Output || "—"}</pre>
                            </div>
                        </div>

                        {selectedItem.Error && (
                            <div className="p-4 bg-red-500/5">
                                <div className="text-red-500 mb-2 uppercase tracking-wide font-bold text-[10px]">Log de Erro</div>
                                <pre className="text-red-400 whitespace-pre-wrap">{selectedItem.Error}</pre>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        )}
      </div>
    </div>
  );
}
