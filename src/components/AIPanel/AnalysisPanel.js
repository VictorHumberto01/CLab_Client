"use client";

import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Code, Zap, MessageSquare, CheckCircle2, Brain, Target, Lightbulb, BookOpen, AlertCircle } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const AnalysisPanel = ({ aiAnalysis, isAnalyzing }) => {
  const [activeSection, setActiveSection] = useState("analysis");
  const [parsedAnalysis, setParsedAnalysis] = useState({
    sections: [],
    fullText: ""
  });

  useEffect(() => {
    if (aiAnalysis) {
      try {
        const analysisText = typeof aiAnalysis === 'string' 
          ? aiAnalysis 
          : aiAnalysis.analysis || aiAnalysis.response || '';

        const analysisMatch = analysisText.match(/===Analysis===\s*\n([\s\S]*?)(?:===|$)/);
        const content = analysisMatch ? analysisMatch[1].trim() : analysisText.trim();

        const sections = [];
        const sectionRegex = /## ([^#\n]+)\n([\s\S]*?)(?=##|$)/g;
        let match;
        
        while ((match = sectionRegex.exec(content)) !== null) {
          const title = match[1].trim();
          let sectionContent = match[2].trim();
          
          let icon = Code;
          let colorClass = "text-secondary";
          const lowerTitle = title.toLowerCase();
          
          // Success analysis sections
          if (lowerTitle === 'resumo') {
            icon = Target;
            colorClass = "text-blue-400";
          } else if (lowerTitle === 'estrutura') {
            icon = Code;
            colorClass = "text-cyan-400";
          } else if (lowerTitle === 'funções' || lowerTitle === 'funcoes') {
            icon = Brain;
            colorClass = "text-green-400";
          } else if (lowerTitle === 'fluxo') {
            icon = Zap;
            colorClass = "text-purple-400";
          } else if (lowerTitle === 'melhorias') {
            icon = Lightbulb;
            colorClass = "text-yellow-400";
          } else if (lowerTitle === 'dicas') {
            icon = BookOpen;
            colorClass = "text-indigo-400";
          }
          // Error analysis sections
          else if (lowerTitle === 'erro') {
            icon = AlertCircle;
            colorClass = "text-red-400";
          } else if (lowerTitle === 'causa') {
            icon = Target;
            colorClass = "text-orange-400";
          } else if (lowerTitle === 'solução' || lowerTitle === 'solucao') {
            icon = CheckCircle2;
            colorClass = "text-green-400";
          } else if (lowerTitle === 'conceito') {
            icon = Brain;
            colorClass = "text-blue-400";
          }
          
          sections.push({
            title,
            content: sectionContent,
            icon,
            colorClass,
            id: `section-${sections.length}`
          });
        }

        const cleanedFullText = content.replace(/^\[.*?\]\s*/gm, '');

        setParsedAnalysis({
          sections,
          fullText: cleanedFullText
        });

      } catch (error) {
        console.error('Error parsing AI analysis:', error);
        setParsedAnalysis({
          sections: [],
          fullText: "Erro ao analisar o código"
        });
      }
    }
  }, [aiAnalysis]);

  const markdownComponents = {
    p: ({ ...props }) => (
      <p {...props} className="text-sm text-foreground/80 leading-relaxed mb-3 font-sans" />
    ),
    h1: ({ ...props }) => (
      <h1 {...props} className="text-base font-bold text-foreground mb-2 mt-4" />
    ),
    h2: ({ ...props }) => (
      <h2 {...props} className="text-sm font-bold text-foreground mb-2 mt-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        {props.children}
      </h2>
    ),
    code: ({ ...props }) => (
      <code {...props} className="px-1.5 py-0.5 bg-background border border-border rounded text-foreground font-mono text-[11px]" />
    ),
    pre: ({ ...props }) => (
      <pre {...props} className="p-2 bg-background border border-border rounded-md overflow-x-auto my-2" />
    ),
  };

  const generateSummary = () => {
    if (!aiAnalysis || !parsedAnalysis.sections.length) {
      return {
        positive: "Análise pendente.",
        suggestions: "Aguardando execução.",
        nextSteps: "-"
      };
    }

    const positivePoints = [];
    const suggestions = [];
    const nextSteps = [];

    parsedAnalysis.sections.forEach(section => {
      const lowerTitle = section.title.toLowerCase();
      if (lowerTitle.includes('estrutura') || lowerTitle.includes('biblioteca')) {
        positivePoints.push(section.content.slice(0, 100) + '...');
      } else if (lowerTitle.includes('sugest') || lowerTitle.includes('melhor')) {
        suggestions.push(section.content.slice(0, 100) + '...');
      } else if (lowerTitle.includes('dica') || lowerTitle.includes('aprendizado')) {
        nextSteps.push(section.content.slice(0, 100) + '...');
      }
    });

    return {
      positive: positivePoints[0] || "Código funcional.",
      suggestions: suggestions[0] || "Pratique mais.",
      nextSteps: nextSteps[0] || "Estude estruturas."
    };
  };

  const summary = generateSummary();

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="h-10 border-b border-border bg-surface px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-secondary uppercase tracking-wide">Assistente</span>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-2 px-2 py-0.5 bg-primary/10 rounded text-xs text-primary">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span className="font-mono text-[10px]">Analisando...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-background">
        {[
          { id: "analysis", icon: Code, label: "Análise" },
          { id: "sections", icon: MessageSquare, label: "Seções" },
          { id: "summary", icon: Zap, label: "Resumo" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors border-b-2
              ${activeSection === tab.id 
                ? "text-primary border-primary bg-surface" 
                : "text-secondary border-transparent hover:text-foreground hover:bg-surface-hover"}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-0 overflow-auto scrollbar-thin">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary space-y-4">
            <div className="relative">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-xs font-mono">Analisando estrutura do código...</p>
          </div>
        ) : !aiAnalysis ? (
          <div className="flex flex-col items-center justify-center h-full text-secondary space-y-4">
            <Bot className="w-8 h-8 opacity-20" />
            <p className="text-xs max-w-[200px] text-center">Execute seu código para gerar uma análise.</p>
          </div>
        ) : (
          <div className="p-4">
            {activeSection === "analysis" && (
              <div className="prose prose-invert max-w-none">
                 <ReactMarkdown components={markdownComponents}>
                    {parsedAnalysis.fullText || "Nenhuma análise disponível."}
                  </ReactMarkdown>
              </div>
            )}
            
            {activeSection === "sections" && (
              <div className="space-y-3">
                {parsedAnalysis.sections.length > 0 ? (
                  parsedAnalysis.sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                        <div key={section.id} className="border border-border rounded-md bg-surface overflow-hidden">
                          <div className="px-3 py-2 border-b border-border bg-surface-hover flex items-center gap-2">
                             <IconComponent className={`w-3.5 h-3.5 ${section.colorClass}`} />
                             <span className="text-xs font-medium text-foreground">{section.title}</span>
                          </div>
                          <div className="p-3 text-xs text-secondary leading-relaxed font-sans">
                             {section.content}
                          </div>
                        </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-secondary text-xs">
                    Nenhuma seção estruturada encontrada.
                  </div>
                )}
              </div>
            )}

            {activeSection === "summary" && (
              <div className="space-y-3">
                 <div className="p-3 bg-surface border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-foreground">Pontos Positivos</span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{summary.positive}</p>
                 </div>

                 <div className="p-3 bg-surface border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-bold text-foreground">Sugestões</span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{summary.suggestions}</p>
                 </div>

                 <div className="p-3 bg-surface border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-foreground">Próximos Passos</span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">{summary.nextSteps}</p>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;