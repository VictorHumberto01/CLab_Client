"use client";

import React from "react";
import { GraduationCap } from "lucide-react";

const ExamModeView = () => (
     <div className="animate-in fade-in duration-500">
        <header className="mb-8 border-b border-border pb-4 app-drag">
            <div className="flex items-center space-x-3">
                <GraduationCap className="text-primary" size={28} />
                <h1 className="text-2xl font-bold text-foreground">Modo Prova</h1>
            </div>
            <p className="text-secondary mt-2 text-sm">Configurações de ambiente seguro e sessões de prova ativas.</p>
        </header>

        <div className="bg-surface border border-border rounded-xl p-8 text-center max-w-2xl mx-auto mt-20">
             <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <GraduationCap size={40} className="text-primary" />
             </div>
             <h2 className="text-xl font-semibold text-foreground mb-2">Nenhuma Prova Ativa</h2>
             <p className="text-secondary mb-8 max-w-md mx-auto">
                 Você pode agendar uma nova prova ou iniciar uma sessão instantânea. Os alunos serão bloqueados no ambiente seguro do navegador.
             </p>
             <button className="bg-primary hover:bg-primary-hover text-primary-foreground px-6 py-2.5 rounded-lg active:scale-95 transition-all font-medium">
                 Criar Sessão de Prova
             </button>
        </div>
    </div>
);

export default ExamModeView;
