"use client";

import React, { useState, useEffect } from "react";
import { Bot, Sparkles, Loader2, AlertCircle, Code, Zap, MessageSquare, CheckCircle2 } from "lucide-react";

const AnalysisPanel = ({ aiAnalysis, isAnalyzing }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSection, setActiveSection] = useState("analysis");

  const mockAnalysis = {
    overview: "Programa Hello World simples demonstrando sintaxe básica de C",
    elements: [
      { type: "#include <stdio.h>", desc: "Inclusão da biblioteca padrão I/O para funções de entrada/saída" },
      { type: "int main()", desc: "Função principal que inicia a execução do programa" },
      { type: "printf()", desc: "Função que exibe texto no console" },
      { type: "return 0", desc: "Indica que o programa foi executado com sucesso" }
    ],
    explanation: `Este é um programa básico em C que demonstra os elementos fundamentais da linguagem:

1. Primeiro incluímos a biblioteca stdio.h
2. Definimos a função main como ponto de entrada
3. Usamos printf para exibir "Hello, World!"
4. Retornamos 0 para indicar execução bem sucedida`,
    suggestions: [
      "Adicione comentários para documentar o código",
      "Inclua '\\n' ao final do printf para quebrar linha",
      "Considere adicionar verificação de erros",
      "Use constantes para valores fixos"
    ]
  };

  useEffect(() => {
    if (!isAnalyzing && mockAnalysis.explanation) {
      const timer = setInterval(() => {
        if (currentIndex < mockAnalysis.explanation.length) {
          setDisplayedText(prev => prev + mockAnalysis.explanation[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        } else {
          clearInterval(timer);
        }
      }, 20);

      return () => clearInterval(timer);
    }
  }, [isAnalyzing, currentIndex]);

  return (
    <div className="w-96 bg-gray-900/95 backdrop-blur-xl border-l border-gray-800 flex flex-col">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-medium bg-gradient-to-r from-purple-200 to-blue-200 text-transparent bg-clip-text">
            Assistente de Código
          </span>
        </div>
      </div>

      <div className="flex border-b border-gray-800">
        {[
          { id: "analysis", icon: Code, label: "Análise" },
          { id: "elements", icon: MessageSquare, label: "Elementos" },
          { id: "suggestions", icon: Zap, label: "Sugestões" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors
              ${activeSection === tab.id 
                ? "text-purple-400 border-b-2 border-purple-500" 
                : "text-gray-400 hover:text-gray-300"}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full" />
                <div className="relative p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm bg-gradient-to-r from-purple-200 to-blue-200 text-transparent bg-clip-text font-medium">
                Analisando seu código...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSection === "analysis" && (
              <div className="prose prose-invert">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {displayedText}
                  {currentIndex < mockAnalysis.explanation.length && (
                    <span className="animate-pulse">▋</span>
                  )}
                </p>
              </div>
            )}
            
            {activeSection === "elements" && (
              <div className="space-y-2">
                {mockAnalysis.elements.map((el, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gray-800/50 space-y-1">
                    <code className="text-sm font-mono text-purple-300">{el.type}</code>
                    <p className="text-sm text-gray-400">{el.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "suggestions" && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-800/50">
                <ul className="space-y-2">
                  {mockAnalysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <Zap className="w-4 h-4 text-yellow-500 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;