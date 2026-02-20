"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Loader2, Sparkles, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnalysisPanel = ({ code, user, isAnalyzing, aiAnalysis }) => {
  // Parse AI Analysis content
  let parsedAnalysis = null;
  let analysisContent = "";
  
  if (aiAnalysis) {
      try {
          // Attempt to parse as JSON
          if (aiAnalysis.trim().startsWith('{')) {
             parsedAnalysis = JSON.parse(aiAnalysis);
             analysisContent = parsedAnalysis.content;
          } else {
             analysisContent = aiAnalysis;
          }
      } catch (e) {
          console.warn("Failed to parse AI Analysis JSON", e);
          
          // Fallback: Regex extraction for common JSON issues (like unescaped newlines)
          const statusMatch = aiAnalysis.match(/"status"\s*:\s*"([^"]+)"/);
          const contentMatch = aiAnalysis.match(/"content"\s*:\s*"([\s\S]*?)"\s*}/);
          
          if (statusMatch && contentMatch) {
              parsedAnalysis = { 
                  status: statusMatch[1], 
                  content: contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') // Unescape manually
              };
              analysisContent = parsedAnalysis.content;
          } else {
              // Final fallback: just clean up formatting artifacts if possible, or show raw
              analysisContent = aiAnalysis;
          }
      }
  }

  // Detect the type of analysis based on content keywords or JSON status
  const getAnalysisType = () => {
    if (!aiAnalysis) return null;
    
    // Priority: JSON status
    if (parsedAnalysis && parsedAnalysis.status) {
        return parsedAnalysis.status; // 'success', 'error', 'info'
    }

    // Fallback: Keyword matching
    const lower = analysisContent.toLowerCase();
    if (lower.includes('erro') || lower.includes('error')) return 'error';
    if (lower.includes('sucesso') || lower.includes('correto') || lower.includes('parabéns')) return 'success';
    return 'info';
  };

  const analysisType = getAnalysisType();

  const getTypeStyles = () => {
    switch (analysisType) {
      case 'error':
        return {
          icon: <AlertTriangle size={16} className="text-red-400" />,
          borderColor: 'border-red-500/30',
          bgColor: 'bg-red-500/5',
          label: 'Erro Detectado',
          labelColor: 'text-red-400'
        };
      case 'success':
        return {
          icon: <CheckCircle size={16} className="text-green-400" />,
          borderColor: 'border-green-500/30',
          bgColor: 'bg-green-500/5',
          label: 'Análise Concluída',
          labelColor: 'text-green-400'
        };
      default:
        return {
          icon: <Lightbulb size={16} className="text-blue-400" />,
          borderColor: 'border-blue-500/30',
          bgColor: 'bg-blue-500/5',
          label: 'Dicas e Sugestões',
          labelColor: 'text-blue-400'
        };
    }
  };

  const typeStyles = analysisType ? getTypeStyles() : null;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bot size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assistente IA</h3>
            <p className="text-[10px] text-secondary">Análise inteligente do código</p>
          </div>
        </div>

        {isAnalyzing && (
          <div className="flex items-center space-x-1.5 text-xs text-primary">
            <Loader2 size={12} className="animate-spin" />
            <span className="font-medium">Analisando...</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {isAnalyzing && !aiAnalysis && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-4 rounded-full bg-surface border border-border">
                  <Bot size={32} className="text-primary animate-pulse" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">Analisando seu código...</h4>
              <p className="text-xs text-secondary max-w-[200px]">
                A IA está processando seu código para fornecer feedback personalizado.
              </p>
              <div className="flex space-x-1 mt-4">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {!isAnalyzing && !aiAnalysis && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full p-8 text-center"
            >
              <div className="p-4 rounded-full bg-surface border border-border mb-4">
                <Sparkles size={28} className="text-secondary" />
              </div>
              <h4 className="text-sm font-medium text-foreground mb-1">Nenhuma análise ainda</h4>
              <p className="text-xs text-secondary max-w-[220px]">
                Execute seu código para receber feedback automático da IA.
              </p>
            </motion.div>
          )}

          {aiAnalysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              {/* Analysis Type Badge */}
              {typeStyles && (
                <div className={`mb-4 p-3 rounded-lg border ${typeStyles.borderColor} ${typeStyles.bgColor}`}>
                  <div className="flex items-center space-x-2">
                    {typeStyles.icon}
                    <span className={`text-xs font-semibold ${typeStyles.labelColor}`}>
                      {typeStyles.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Markdown Content */}
              <div className="prose prose-sm prose-invert max-w-none
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4
                prose-h2:text-base prose-h2:border-b prose-h2:border-border prose-h2:pb-2
                prose-h3:text-sm
                prose-p:text-secondary prose-p:text-xs prose-p:leading-relaxed prose-p:my-2
                prose-ul:text-secondary prose-ul:text-xs prose-ul:my-2 prose-ul:pl-4
                prose-ol:text-secondary prose-ol:text-xs prose-ol:my-2 prose-ol:pl-4
                prose-li:my-0.5
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[11px] prose-code:font-mono
                prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-3 prose-pre:my-3
                prose-pre:overflow-x-auto
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              ">
                <ReactMarkdown>{analysisContent}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalysisPanel;
