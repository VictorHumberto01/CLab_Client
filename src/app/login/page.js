"use client";

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, Hash } from 'lucide-react';
import api from '../../utils/api';

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'matricula'
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithToken } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (loginMode === 'email') {
        const result = await login(email.trim(), password.trim());
        if (result.success) {
          router.push('/');
        } else {
          setError(result.error);
        }
      } else {
        // Matricula login
        const res = await api.post('/login/matricula', {
          matricula: matricula.trim(),
          password: password.trim()
        });
        if (res.data.success) {
          const { token, needsSetup } = res.data.data;
          loginWithToken(token);
          if (needsSetup) {
            router.push('/setup');
          } else {
            router.push('/');
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <Link 
          href="/" 
          className="inline-flex items-center text-secondary hover:text-foreground mb-8 transition-colors text-sm"
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar ao IDE
        </Link>
        
        <div className="bg-surface p-8 rounded-lg border border-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">
              Bem-vindo
            </h1>
            <p className="text-secondary mt-2 text-sm">Entre para acessar seu ambiente</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLoginMode('email')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                loginMode === 'email' 
                  ? 'bg-primary text-white' 
                  : 'bg-background border border-border text-secondary hover:text-foreground'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('matricula')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                loginMode === 'matricula' 
                  ? 'bg-primary text-white' 
                  : 'bg-background border border-border text-secondary hover:text-foreground'
              }`}
            >
              Matrícula
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {loginMode === 'email' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="nome@exemplo.com"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">Matrícula</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    className="w-full bg-background border border-border rounded py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Sua matrícula"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 bg-primary hover:bg-primary-hover rounded text-sm font-medium text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
