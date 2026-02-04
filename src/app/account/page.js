"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Code, Terminal, Calendar, User, ChevronRight } from 'lucide-react';

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        setDebouncedSearch(search);
        setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
          const res = await api.get('/history', {
            params: {
              page: page,
              limit: 10,
              search: debouncedSearch
            }
          });
          
          if (res.data && res.data.meta) {
              setHistory(res.data.data || []);
              setTotalPages(res.data.meta.total_pages || 1);
          } else {
             // Fallback for old API response (array)
             setHistory(Array.isArray(res.data) ? res.data : []);
             setTotalPages(1);
          }
        } catch (error) {
          console.error("Failed to fetch history", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [user, page, debouncedSearch]);

  if (loading || !user) return null;

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
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <User size={22} className="text-primary" />
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
                <p className="text-secondary text-sm">Nenhum histórico encontrado{search ? ` para "${search}"` : ""}.</p>
                {search && (
                   <button 
                      onClick={() => setSearch("")} 
                      className="text-primary hover:text-primary-hover text-sm mt-2 inline-block"
                   >
                     Limpar busca
                   </button>
                )}
                {!search && (
                   <Link href="/" className="text-primary hover:text-primary-hover text-sm mt-2 inline-block">
                     Começar a codar &rarr;
                   </Link>
                )}
              </div>
            ) : (
                <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col h-[500px]">
                   {/* Search Bar */}
                   <div className="p-3 border-b border-border bg-surface-hover flex items-center space-x-2">
                      <div className="relative flex-1">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock size={14} className="text-secondary" />
                         </div>
                         <input
                            type="text"
                            placeholder="Buscar no histórico..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                             className="w-full bg-background border border-border rounded-md py-1.5 pl-9 pr-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                         />
                      </div>
                   </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-border min-h-0">
                    {history.map((item, index) => (
                      <div 
                          key={item.ID}
                          onClick={() => setSelectedItem(item)}
                          className="p-3 hover:bg-surface-hover transition-colors cursor-pointer flex items-center justify-between group"
                      >
                          <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
                               <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-surface-hover group-hover:bg-background transition-colors">
                                 <span className={`w-2.5 h-2.5 rounded-full ${!item.Error ? 'bg-green-500' : 'bg-red-500'}`} />
                               </div>
                               <div className="flex flex-col min-w-0 flex-1">
                                  <code className="text-xs text-foreground truncate block">
                                      {(() => {
                                        const lines = item.Code?.split('\n') || [];
                                        const meaningfulLines = lines
                                          .filter(line => 
                                            line.trim() && 
                                            !line.trim().startsWith('#include') && 
                                            !line.trim().startsWith('//')
                                          )
                                          .map(line => line.trim())
                                          .join(' ');
                                        const preview = meaningfulLines.substring(0, 60);
                                        return preview.length < meaningfulLines.length ? preview + '...' : preview || 'Código';
                                      })()}
                                  </code>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-secondary flex items-center">
                                        <Calendar size={10} className="mr-1" />
                                        {new Date(item.CreatedAt).toLocaleDateString('pt-BR', {
                                          day: '2-digit',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                    </span>
                                    {!item.Error && item.Output && (
                                      <span className="text-[10px] text-green-500 font-medium">✓ Sucesso</span>
                                    )}
                                    {item.Error && (
                                      <span className="text-[10px] text-red-500 font-medium">✗ Erro</span>
                                    )}
                                  </div>
                               </div>
                          </div>
                          <div className="text-secondary group-hover:text-primary transition-colors ml-2">
                            <ChevronRight size={16} />
                          </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="p-2 border-t border-border bg-surface flex items-center justify-between">
                     <div className="text-xs text-secondary">
                        Página {page} de {totalPages || 1}
                     </div>
                     <div className="flex space-x-1">
                        <button 
                           onClick={() => setPage(p => Math.max(1, p - 1))}
                           disabled={page === 1}
                           className="p-1 px-2 rounded hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-xs text-foreground font-medium transition-colors"
                        >
                           Anterior
                        </button>
                         <button 
                           onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                           disabled={page >= totalPages}
                           className="p-1 px-2 rounded hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed text-xs text-foreground font-medium transition-colors"
                        >
                           Próximo
                        </button>
                     </div>
                  </div>
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
