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
          sectionContent = sectionContent.replace(/^\[.*?\]\s*/gm, '');
          
          let icon = Code;
          let colorClass = "text-gray-400";
          
          if (title.toLowerCase().includes('estrutura')) {
            icon = Target;
            colorClass = "text-blue-400";
          } else if (title.toLowerCase().includes('biblioteca') || title.toLowerCase().includes('função')) {
            icon = Brain;
            colorClass = "text-green-400";
          } else if (title.toLowerCase().includes('sugest') || title.toLowerCase().includes('melhor')) {
            icon = Lightbulb;
            colorClass = "text-yellow-400";
          } else if (title.toLowerCase().includes('dica') || title.toLowerCase().includes('aprendizado')) {
            icon = BookOpen;
            colorClass = "text-indigo-400";
          } else if (title.toLowerCase().includes('funcionamento')) {
            icon = Zap;
            colorClass = "text-cyan-400";
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
      <p {...props} className="text-sm text-gray-300 leading-relaxed mb-3 font-sans" />
    ),
    h1: ({ ...props }) => (
      <h1 {...props} className="text-base font-bold text-gray-100 mb-2 mt-4" />
    ),
    h2: ({ ...props }) => (
      <h2 {...props} className="text-sm font-bold text-gray-200 mb-2 mt-3 flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        {props.children}
      </h2>
    ),
    code: ({ ...props }) => (
      <code {...props} className="px-1.5 py-0.5 bg-[#18181b] border border-border rounded text-gray-300 font-mono text-[11px]" />
    ),
    pre: ({ ...props }) => (
      <pre {...props} className="p-2 bg-[#18181b] border border-border rounded-md overflow-x-auto my-2" />
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
    <div className="h-full flex flex-col bg-[#09090b] text-gray-200">
      {/* Header */}
      <div className="h-10 border-b border-border bg-[#18181b] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <Bot className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Assistant</span>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-2 px-2 py-0.5 bg-primary/10 rounded text-xs text-primary">
            <Sparkles className="w-3 h-3 animate-spin" />
            <span className="font-mono text-[10px]">Processing...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-[#09090b]">
        {[
          { id: "analysis", icon: Code, label: "Full Analysis" },
          { id: "sections", icon: MessageSquare, label: "Sections" },
          { id: "summary", icon: Zap, label: "Summary" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium transition-colors border-b-2
              ${activeSection === tab.id 
                ? "text-primary border-primary bg-[#18181b]" 
                : "text-gray-500 border-transparent hover:text-gray-300 hover:bg-[#18181b]/50"}`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-0 overflow-auto scrollbar-thin">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <div className="relative">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-xs font-mono">Analyzing code structure...</p>
          </div>
        ) : !aiAnalysis ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <Bot className="w-8 h-8 opacity-20" />
            <p className="text-xs max-w-[200px] text-center">Run your code to generate an AI analysis.</p>
          </div>
        ) : (
          <div className="p-4">
            {activeSection === "analysis" && (
              <div className="prose prose-invert max-w-none">
                 <ReactMarkdown components={markdownComponents}>
                    {parsedAnalysis.fullText || "No analysis available."}
                  </ReactMarkdown>
              </div>
            )}
            
            {activeSection === "sections" && (
              <div className="space-y-3">
                {parsedAnalysis.sections.length > 0 ? (
                  parsedAnalysis.sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                        <div key={section.id} className="border border-border rounded-md bg-[#18181b] overflow-hidden">
                          <div className="px-3 py-2 border-b border-border bg-[#27272a]/30 flex items-center gap-2">
                             <IconComponent className={`w-3.5 h-3.5 ${section.colorClass}`} />
                             <span className="text-xs font-medium text-gray-200">{section.title}</span>
                          </div>
                          <div className="p-3 text-xs text-gray-400 leading-relaxed font-sans">
                             {section.content}
                          </div>
                        </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500 text-xs">
                    No structured sections found.
                  </div>
                )}
              </div>
            )}

            {activeSection === "summary" && (
              <div className="space-y-3">
                 <div className="p-3 bg-[#18181b] border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-bold text-gray-300">Positives</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{summary.positive}</p>
                 </div>

                 <div className="p-3 bg-[#18181b] border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs font-bold text-gray-300">Suggestions</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{summary.suggestions}</p>
                 </div>

                 <div className="p-3 bg-[#18181b] border border-border rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-gray-300">Next Steps</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{summary.nextSteps}</p>
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