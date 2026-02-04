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
                setHistory(res.data.data || []);
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
                user: item.User,
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
             <header className="mb-8 border-b border-gray-800 pb-4 app-drag">
                <div className="flex items-center space-x-3">
                    <Monitor className="text-blue-500" size={28} />
                    <h1 className="text-2xl font-bold text-white">
                        Histórico de Atividades
                    </h1>
                </div>
                <p className="text-gray-400 mt-2 text-sm">Visualização das atividades agrupadas por aluno.</p>
            </header>

            <div className="space-y-4">
                {sortedGroups.length === 0 && !loading && (
                    <div className="text-center py-32 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <Monitor size={48} className="mx-auto mb-4 text-zinc-700" />
                        <h3 className="text-zinc-500 font-medium text-lg">Nenhuma atividade recente</h3>
                        <p className="text-zinc-600 text-sm mt-1">O histórico de compilações aparecerá aqui.</p>
                    </div>
                )}

                {sortedGroups.map((group) => {
                    const latestItem = group.items[0];
                    const userName = group.user?.name || group.user?.email || "Aluno Desconhecido";
                    const userInitial = (userName[0] || "?").toUpperCase();
                    const isExpanded = expandedUser === group.user?.id;

                    return (
                        <div key={group.user?.id || 'unknown'} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300">
                             <div 
                                onClick={() => setExpandedUser(isExpanded ? null : group.user?.id)}
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/50"
                             >
                                <div className="flex items-center space-x-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                        {userInitial}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-200">{userName}</h3>
                                        <p className="text-xs text-zinc-500">
                                            {group.items.length} submiss{group.items.length !== 1 ? 'ões' : 'ão'} • Última: {new Date(latestItem.CreatedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${latestItem.Error ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        Última: {latestItem.Error ? 'Erro' : 'Sucesso'}
                                    </div>
                                    <ChevronDown className={`text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={20} />
                                </div>
                             </div>

                             {isExpanded && (
                                <div className="border-t border-zinc-800 bg-black/20 p-4 space-y-3">
                                    {group.items.map((item) => (
                                        <div key={item.ID} className="bg-zinc-950 border border-zinc-800/50 rounded p-3 flex flex-col md:flex-row gap-3 hover:border-zinc-700 transition-colors">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs text-zinc-500">{new Date(item.CreatedAt).toLocaleString()}</span>
                                                    <span className={`text-[10px] font-bold uppercase ${item.Error ? 'text-red-400' : 'text-green-400'}`}>
                                                        {item.Error ? 'Erro' : 'Sucesso'}
                                                    </span>
                                                </div>
                                                <div className="bg-black rounded p-2 font-mono text-xs text-zinc-400 overflow-hidden max-h-24 relative mb-2">
                                                    <div className="opacity-50 text-[10px] mb-1 select-none">Output:</div>
                                                    {item.Output || item.Error}
                                                </div>
                                                {item.AIAnalysis && (
                                                    <div className="bg-blue-900/10 border border-blue-500/20 rounded p-2 text-xs text-blue-200">
                                                        <div className="flex items-center text-[10px] text-blue-400 font-bold uppercase mb-1">
                                                            <Bot size={12} className="mr-1" />
                                                            Análise da IA:
                                                        </div>
                                                        <div className="whitespace-pre-wrap">{item.AIAnalysis}</div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-end">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRunCode(item.Code); }}
                                                    className="flex items-center justify-center space-x-2 bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-300 px-3 py-1.5 rounded text-xs font-medium transition-all"
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
