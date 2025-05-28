"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Sparkles, Loader2, AlertCircle, Code, Zap, MessageSquare, CheckCircle2, Brain, Target, Lightbulb, BookOpen } from "lucide-react";
import ReactMarkdown from 'react-markdown';

const AnalysisPanel = ({ aiAnalysis, isAnalyzing }) => {
  const [activeSection, setActiveSection] = useState("analysis");
  const [parsedAnalysis, setParsedAnalysis] = useState({
    sections: [],
    fullText: ""
  });
  const [visibleSections, setVisibleSections] = useState(new Set());

  // Parse the analysis response into structured sections
  useEffect(() => {
    if (aiAnalysis) {
      try {
        const analysisText = typeof aiAnalysis === 'string' 
          ? aiAnalysis 
          : aiAnalysis.analysis || aiAnalysis.response || '';

        // Extract analysis content - remove the ===Analysis=== wrapper if present
        const analysisMatch = analysisText.match(/===Analysis===\s*\n([\s\S]*?)(?:===|$)/);
        const content = analysisMatch ? analysisMatch[1].trim() : analysisText.trim();

        // Parse sections based on ## headers
        const sections = [];
        const sectionRegex = /## ([^#\n]+)\n([\s\S]*?)(?=##|$)/g;
        let match;
        
        while ((match = sectionRegex.exec(content)) !== null) {
          const title = match[1].trim();
          let sectionContent = match[2].trim();
          
          // Remove the bracketed explanations like [explicar a estrutura do código]
          sectionContent = sectionContent.replace(/^\[.*?\]\s*/gm, '');
          
          let icon = Code;
          let color = "purple";
          
          if (title.toLowerCase().includes('estrutura')) {
            icon = Target;
            color = "blue";
          } else if (title.toLowerCase().includes('biblioteca') || title.toLowerCase().includes('função')) {
            icon = Brain;
            color = "green";
          } else if (title.toLowerCase().includes('sugest') || title.toLowerCase().includes('melhor')) {
            icon = Lightbulb;
            color = "yellow";
          } else if (title.toLowerCase().includes('dica') || title.toLowerCase().includes('aprendizado')) {
            icon = BookOpen;
            color = "indigo";
          } else if (title.toLowerCase().includes('funcionamento')) {
            icon = Zap;
            color = "cyan";
          }
          
          sections.push({
            title,
            content: sectionContent,
            icon,
            color,
            id: `section-${sections.length}`
          });
        }

        // Also clean up the full text for display
        const cleanedFullText = content.replace(/^\[.*?\]\s*/gm, '');

        setParsedAnalysis({
          sections,
          fullText: cleanedFullText
        });

        // Reset section visibility
        setVisibleSections(new Set());

      } catch (error) {
        console.error('Error parsing AI analysis:', error);
        setParsedAnalysis({
          sections: [],
          fullText: "Erro ao analisar o código"
        });
      }
    }
  }, [aiAnalysis]);

  // Animate sections visibility
  useEffect(() => {
    if (activeSection === "sections" && parsedAnalysis.sections.length > 0) {
      parsedAnalysis.sections.forEach((section, index) => {
        setTimeout(() => {
          setVisibleSections(prev => new Set([...prev, section.id]));
        }, index * 200);
      });
    }
  }, [activeSection, parsedAnalysis.sections]);

  const getColorClasses = (color) => {
    const colors = {
      purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-300",
      blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-300",
      green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-300",
      yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-300",
      indigo: "from-indigo-500/20 to-indigo-600/20 border-indigo-500/30 text-indigo-300",
      cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30 text-cyan-300"
    };
    return colors[color] || colors.purple;
  };

  const markdownComponents = {
    p: ({ node, ...props }) => (
      <p {...props} className="text-sm text-gray-300 leading-relaxed mb-3" />
    ),
    h1: ({ node, ...props }) => (
      <h1 {...props} className="text-xl font-bold text-gray-100 mb-4" />
    ),
    h2: ({ node, ...props }) => (
      <h2 {...props} className="text-lg font-bold text-gray-200 mb-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse" />
        {props.children}
      </h2>
    ),
    code: ({ node, ...props }) => (
      <code {...props} className="px-2 py-1 bg-gray-800/70 rounded text-purple-300 font-mono text-xs" />
    ),
    pre: ({ node, ...props }) => (
      <pre {...props} className="p-3 bg-gray-800/50 rounded-lg overflow-x-auto border border-gray-700/50" />
    ),
  };

  const generateSummary = () => {
    if (!aiAnalysis || !parsedAnalysis.sections.length) {
      return {
        positive: "Desculpe, não conseguimos analisar seu código neste momento.",
        suggestions: "Por favor, tente novamente mais tarde.",
        nextSteps: "Se o problema persistir, verifique sua conexão com o servidor."
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
      positive: positivePoints[0] || "Código funcional e bem estruturado.",
      suggestions: suggestions[0] || "Continue praticando para aprimorar suas habilidades.",
      nextSteps: nextSteps[0] || "Explore conceitos mais avançados como estruturas de dados."
    };
  };

  const summary = generateSummary();

  return (
    <div className="w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium bg-gradient-to-r from-purple-200 to-blue-200 text-transparent bg-clip-text">
            Assistente de Código
          </span>
          {isAnalyzing && (
            <div className="ml-auto">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: "analysis", icon: Code, label: "Análise" },
          { id: "sections", icon: MessageSquare, label: "Seções" },
          { id: "summary", icon: Zap, label: "Resumo" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-all duration-300
              ${activeSection === tab.id 
                ? "text-purple-400 border-b-2 border-purple-500 bg-purple-500/5" 
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/30"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full" />
                <div className="relative p-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-pulse">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm bg-gradient-to-r from-purple-200 to-blue-200 text-transparent bg-clip-text font-medium">
                  Analisando seu código...
                </p>
                <div className="flex justify-center space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : !aiAnalysis ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div className="space-y-2">
              <Code className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-400">Execute seu código para ver a análise</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSection === "analysis" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-200 to-blue-200 text-transparent bg-clip-text">
                    Análise Completa
                  </h3>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-gray-300 leading-relaxed">
                    <ReactMarkdown components={markdownComponents}>
                      {parsedAnalysis.fullText || "Nenhuma análise disponível"}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === "sections" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-200 to-purple-200 text-transparent bg-clip-text">
                    Seções Detalhadas
                  </h3>
                </div>
                
                {parsedAnalysis.sections.length > 0 ? (
                  <div className="space-y-3">
                    {parsedAnalysis.sections.map((section, idx) => {
                      const isVisible = visibleSections.has(section.id);
                      const IconComponent = section.icon;
                      
                      return (
                        <div
                          key={section.id}
                          className={`transform transition-all duration-500 ${
                            isVisible 
                              ? 'translate-x-0 opacity-100' 
                              : 'translate-x-4 opacity-0'
                          }`}
                          style={{ transitionDelay: `${idx * 100}ms` }}
                        >
                          <div className={`p-4 rounded-xl bg-gradient-to-r ${getColorClasses(section.color)} border backdrop-blur-sm`}>
                            <div className="flex items-center gap-2 mb-2">
                              <IconComponent className="w-5 h-5" />
                              <h4 className="font-semibold text-gray-100">{section.title}</h4>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {section.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Nenhuma seção identificada</p>
                  </div>
                )}
              </div>
            )}

            {activeSection === "summary" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-yellow-200 to-orange-200 text-transparent bg-clip-text">
                    Resumo Executivo
                  </h3>
                </div>
                
                <div className="grid gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <span className="font-medium text-green-300">Pontos Positivos</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {summary.positive}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-5 h-5 text-yellow-400" />
                      <span className="font-medium text-yellow-300">Oportunidades</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {summary.suggestions}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                      <span className="font-medium text-blue-300">Próximos Passos</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      {summary.nextSteps}
                    </p>
                  </div>
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