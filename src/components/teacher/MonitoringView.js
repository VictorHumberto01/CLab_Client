"use client";

import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import { useRouter } from "next/navigation";
import { 
  Terminal as TerminalIcon, 
  Monitor, 
  ChevronDown,
  Bot
} from "lucide-react";

const MonitoringView = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUser, setExpandedUser] = useState(null);
    const router = useRouter();

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history?limit=100');
            if (res.data.data !== undefined) {
                // Debug logs
                console.log("MonitoringView: Received history:", res.data.data);
                res.data.data.forEach((h, index) => {
                    if (!h.user && !h.User) {
                        console.warn(`MonitoringView: History item ${index} has no user!`, h);
                    } else {
                        const u = h.user || h.User;
                        console.log(`MonitoringView: Item ${index} User:`, u.name || u.Name || "No Name", u);
                    }
                });

                const validHistory = res.data.data.filter(h => h.user || h.User);
                setHistory(validHistory);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
        const interval = setInterval(fetchHistory, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRunCode = (code) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('clab-restore-code', code);
            router.push('/');
        }
    };

    // Group history by User ID
    const groupedHistory = history.reduce((acc, item) => {
        const userId = item.UserID;
        if (!acc[userId]) {
            acc[userId] = {
                user: item.User || item.user,
                items: []
            };
        }
        acc[userId].items.push(item);
        return acc;
    }, {});

    const sortedGroups = Object.values(groupedHistory).sort((a, b) => {
        const latestA = new Date(a.items[0].CreatedAt);
        const latestB = new Date(b.items[0].CreatedAt);
        return latestB - latestA;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
             <header className="mb-8 border-b border-border pb-4 app-drag">
                <div className="flex items-center space-x-3">
                    <Monitor className="text-primary" size={28} />
                    <h1 className="text-2xl font-bold text-foreground">
                        Histórico de Atividades
                    </h1>
                </div>
                <p className="text-secondary mt-2 text-sm">Visualização das atividades agrupadas por aluno.</p>
            </header>

            <div className="space-y-4">
                {sortedGroups.length === 0 && !loading && (
                    <div className="text-center py-32 border-2 border-dashed border-border rounded-xl bg-surface/30">
                        <Monitor size={48} className="mx-auto mb-4 text-secondary" />
                        <h3 className="text-secondary font-medium text-lg">Nenhuma atividade recente</h3>
                        <p className="text-secondary text-sm mt-1">O histórico de compilações aparecerá aqui.</p>
                    </div>
                )}

                {sortedGroups.map((group) => {
                    const latestItem = group.items[0];
                    const userName = group.user?.name || group.user?.email || "Aluno Desconhecido";
                    const userInitial = (userName[0] || "?").toUpperCase();
                    const isExpanded = expandedUser === group.user?.id;

                    return (
                        <div key={group.user?.id || 'unknown'} className="bg-surface border border-border rounded-lg overflow-hidden transition-all duration-300">
                             <div 
                                onClick={() => setExpandedUser(isExpanded ? null : group.user?.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-hover"
                             >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
                                        {userInitial}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">
                                            {group.user?.name || group.user?.Name || group.user?.email || group.user?.Email || "Aluno (Nome não encontrado)"}
                                        </h3>
                                        <p className="text-xs text-secondary">
                                            {group.items.length} submiss{group.items.length !== 1 ? 'ões' : 'ão'} • Última: {new Date(latestItem.CreatedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${latestItem.error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        Última: {latestItem.error ? 'Erro' : 'Sucesso'}
                                    </div>
                                    <ChevronDown className={`text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                </div>
                             </div>

                             {isExpanded && (
                                <div className="border-t border-border bg-black/20 p-4 space-y-3">
                                    {group.items.map((item) => (
                                        <div key={item.ID} className="bg-background border border-border rounded p-3 flex flex-col md:flex-row gap-3 hover:border-surface-hover transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-secondary">{new Date(item.CreatedAt).toLocaleString()}</span>
                                                    <span className={`text-[10px] font-bold uppercase ${item.error ? 'text-red-400' : 'text-green-400'}`}>
                                                        {item.error ? 'Erro' : 'Sucesso'}
                                                    </span>
                                                </div>
                                                <div className="bg-black/40 rounded p-2 font-mono text-xs text-foreground overflow-hidden max-h-24 relative mb-2 border border-border/50">
                                                    <div className="opacity-50 text-[10px] mb-1 select-none">Output:</div>
                                                    {item.output || item.error}
                                                </div>
                                                {item.AIAnalysis && (
                                                    <div className="bg-primary/5 border border-primary/20 rounded p-2 text-xs text-primary-foreground/80">
                                                        <div className="flex items-center text-[10px] text-primary font-bold uppercase mb-1">
                                                            <Bot size={12} className="mr-1" />
                                                            Análise da IA:
                                                        </div>
                                                        <div className="whitespace-pre-wrap">{item.aiAnalysis}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRunCode(item.code); }}
                                                    className="flex items-center justify-center space-x-2 bg-surface hover:bg-primary hover:text-white text-secondary px-3 py-1.5 rounded text-xs font-medium transition-all border border-border"
                                                >
                                                    <TerminalIcon size={14} />
                                                    <span>Executar</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MonitoringView;
