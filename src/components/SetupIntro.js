"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowRight,
  Wifi,
  WifiOff,
  Loader2,
  Palette,
  Code2,
  Terminal,
  Bot,
  Play,
  Mail,
  Lock,
  Hash,
  User,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------
const ease = [0.16, 1, 0.3, 1];
const easeOut = [0.22, 1, 0.36, 1];

const pageVariants = {
  enter: (dir) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
    filter: "blur(20px)",
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.7, ease },
  },
  exit: (dir) => ({
    x: dir < 0 ? 80 : -80,
    opacity: 0,
    filter: "blur(20px)",
    scale: 0.97,
    transition: { duration: 0.45, ease: easeOut },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } },
};

const fadeBlur = {
  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease },
  },
};

// ---------------------------------------------------------------------------
// Step 0 — Welcome
// ---------------------------------------------------------------------------
const WelcomeStep = () => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
    <motion.div variants={fadeBlur} className="relative mb-10">
      <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="relative w-[88px] h-[88px] rounded-[1.75rem] bg-surface border border-border flex items-center justify-center shadow-xl">
        <Code2 className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>
    </motion.div>

    <motion.h1 variants={fadeBlur} className="text-[2.75rem] leading-[1.1] font-extrabold tracking-tight text-foreground mb-5">
      Bem-vindo ao CLab<span className="inline-block w-[3px] h-[2.2rem] bg-primary/60 ml-1 rounded-full animate-pulse align-middle" />
    </motion.h1>

    <motion.p variants={fadeBlur} className="text-base text-secondary max-w-sm leading-relaxed mb-6">
      Já que essa é a sua primeira vez aqui, vamos configurar tudo em poucos passos.
    </motion.p>

  </motion.div>
);

// ---------------------------------------------------------------------------
// Step 1 — Beta Warning
// ---------------------------------------------------------------------------
const BetaWarningStep = () => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
    <motion.div variants={fadeBlur} className="relative mb-10">
      <div className="absolute -inset-4 rounded-[2rem] bg-orange-500/10 blur-3xl" />
      <div className="relative w-[88px] h-[88px] rounded-[1.75rem] bg-surface border border-border flex items-center justify-center shadow-xl">
        <Terminal className="w-10 h-10 text-orange-400" strokeWidth={1.5} />
      </div>
    </motion.div>

    <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
      Aviso Importante
    </motion.h2>

    <motion.p variants={fadeBlur} className="text-sm text-secondary max-w-sm leading-relaxed mb-6">
      O CLab ainda está em fase <strong className="text-foreground">Beta</strong>. Isso significa que você pode encontrar instabilidades ou alguns bugs. Agradecemos a sua compreensão e feedback!
    </motion.p>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Step 2 — Server Connection
// ---------------------------------------------------------------------------
const ServerStep = ({ serverUrl, setServerUrl }) => {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null);

  const testConnection = async () => {
    setTesting(true);
    setStatus(null);
    try {
      const res = await fetch(`${serverUrl}/health`, { method: "GET", signal: AbortSignal.timeout(5000) });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
    setTesting(false);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
      <motion.div variants={fadeBlur} className="relative mb-8">
        <div className="absolute -inset-4 rounded-[2rem] bg-green-500/10 blur-3xl" />
        <div className="relative w-[72px] h-[72px] rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg">
          <Wifi className="w-8 h-8 text-green-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
        Conectar ao Servidor
      </motion.h2>
      <motion.p variants={fadeBlur} className="text-sm text-secondary mb-8 max-w-sm leading-relaxed">
        Seu código é compilado em um servidor central. Cole o endereço que o professor forneceu.
      </motion.p>

      <motion.div variants={fadeBlur} className="w-full max-w-md">
        <div className="flex gap-2 p-1.5 rounded-2xl bg-surface border border-border">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="http://192.168.1.100:8080"
            className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder-secondary/40 focus:outline-none font-mono rounded-xl"
          />
          <button
            onClick={testConnection}
            disabled={testing || !serverUrl.trim()}
            className="px-5 py-2.5 bg-surface-hover hover:bg-border rounded-xl text-sm font-medium text-foreground transition-all duration-200 disabled:opacity-30 flex items-center gap-2 shrink-0 active:scale-[0.97]"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : "Testar"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease }}
              className={`mt-4 flex items-center justify-center gap-2 text-sm font-medium ${
                status === "ok" ? "text-green-400" : "text-red-400"
              }`}
            >
              {status === "ok" ? (
                <><div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Conectado com sucesso</>
              ) : (
                <><WifiOff size={14} /> Não foi possível conectar</>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-xs text-secondary/50 mt-5">Altere depois em Configurações → Conexão</p>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Step X — Login
// ---------------------------------------------------------------------------
const LoginStep = () => {
  const { login, loginWithToken, user } = useAuth();
  const [view, setView] = useState('login'); // 'login', 'setup', 'success'
  const [loginMode, setLoginMode] = useState('email');
  
  // Login fields
  const [email, setEmail] = useState('');
  const [matricula, setMatricula] = useState('');
  const [password, setPassword] = useState('');
  
  // Setup fields
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && view === 'login') {
      setView('success');
    }
  }, [user, view]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      if (loginMode === 'email') {
        const result = await login(email.trim(), password.trim());
        if (result.success) {
          setView('success');
        } else {
          setError(result.error);
        }
      } else {
        const res = await api.post('/login/matricula', {
          matricula: matricula.trim(),
          password: password.trim()
        });
        if (res.data.success) {
          const { token, needsSetup } = res.data.data;
          await loginWithToken(token); // AuthContext function
          if (needsSetup) {
            setView('setup');
          } else {
            setView('success');
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    }
    setIsSubmitting(false);
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');
    
    if (setupPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (setupPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await api.put('/profile', { email: setupEmail.trim(), password: setupPassword });
      if (res.data.success) {
        const token = localStorage.getItem('token');
        if (token) {
          await loginWithToken(token);
        }
        setView('success');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil');
    }
    setIsSubmitting(false);
  };

  if (view === 'success') {
    return (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4 w-full">
        <motion.div variants={fadeBlur} className="relative mb-6">
          <div className="absolute -inset-4 rounded-full bg-green-500/10 blur-3xl" />
          <div className="relative w-[72px] h-[72px] rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg">
            <CheckCircle className="w-8 h-8 text-green-400" strokeWidth={1.5} />
          </div>
        </motion.div>
        
        <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          Login Concluído
        </motion.h2>
        <motion.p variants={fadeBlur} className="text-sm text-secondary mb-8">
          Você está conectado como {user?.nome || user?.email || 'usuário'}. Pode prosseguir!
        </motion.p>
      </motion.div>
    );
  }

  if (view === 'setup') {
    return (
      <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4 w-full max-w-sm mx-auto">
        <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
          Complete seu Perfil
        </motion.h2>
        <motion.p variants={fadeBlur} className="text-sm text-secondary mb-6">
          Por ser seu primeiro acesso, configure um email e uma nova senha.
        </motion.p>

        <motion.form variants={fadeBlur} onSubmit={handleSetup} className="w-full space-y-4 text-left">
          {error && (
            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input
                type="email"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Nova Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
                placeholder="Mínimo 4 caracteres"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Confirmar Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={16} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
                placeholder="Repita a senha"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center mt-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Salvar e Continuar'}
          </button>
        </motion.form>
      </motion.div>
    ); // end setup
  }

  // view === 'login'
  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4 w-full max-w-sm mx-auto">
      <motion.div variants={fadeBlur} className="relative mb-6">
        <div className="absolute -inset-4 rounded-[2rem] bg-blue-500/10 blur-3xl" />
        <div className="relative w-[72px] h-[72px] rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg">
          <User className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
        Acessar Conta
      </motion.h2>
      <motion.p variants={fadeBlur} className="text-sm text-secondary mb-6">
        Faça login para acessar suas turmas e salvar seu progresso.
      </motion.p>

      <motion.div variants={fadeBlur} className="w-full text-left">
        <div className="flex gap-2 mb-4 bg-surface p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setLoginMode('email')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMode === 'email' ? 'bg-background border border-border text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('matricula')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
              loginMode === 'matricula' ? 'bg-background border border-border text-foreground shadow-sm' : 'text-secondary hover:text-foreground'
            }`}
          >
            Matrícula
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
                  className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
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
                  className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
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
                className="w-full bg-background border border-border rounded-xl py-2 pl-9 pr-3 text-sm text-foreground placeholder-secondary/50 focus:outline-none focus:border-primary transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 flex items-center justify-center mt-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Step 2 — Theme Picker
// ---------------------------------------------------------------------------
const ThemeStep = ({ selectedTheme, onSelect, themes }) => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
    <motion.div variants={fadeBlur} className="relative mb-8">
      <div className="absolute -inset-4 rounded-[2rem] bg-purple-500/10 blur-3xl" />
      <div className="relative w-[72px] h-[72px] rounded-2xl bg-surface border border-border flex items-center justify-center shadow-lg">
        <Palette className="w-8 h-8 text-purple-400" strokeWidth={1.5} />
      </div>
    </motion.div>

    <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
      Escolha seu Tema
    </motion.h2>
    <motion.p variants={fadeBlur} className="text-sm text-secondary mb-8">
      Você pode alterar os temas depois em Configurações → Aparência. <br /> É possivel também importar temas customizados em JSON.
    </motion.p>

    <motion.div variants={fadeBlur} className="grid grid-cols-2 gap-3 w-full max-w-md">
      {themes.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        return (
          <motion.button
            key={theme.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(theme.id)}
            className={`relative p-4 rounded-2xl border text-left transition-colors duration-200 ${
              isSelected
                ? "border-primary bg-primary/[0.06]"
                : "border-border bg-surface hover:bg-surface-hover"
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[13px] font-semibold text-foreground">{theme.name}</span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, filter: "blur(4px)" }}
                  animate={{ scale: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.3, ease }}
                  className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                >
                  <Check size={11} className="text-white" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <div className="flex gap-1.5">
              {[theme.colors.background, theme.colors.surface, theme.colors.primary, theme.colors.accent, theme.colors.foreground].map((c, i) => (
                <div key={i} className="w-[22px] h-[22px] rounded-md border border-border" style={{ backgroundColor: c }} />
              ))}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Step 3 — Quick Tour
// ---------------------------------------------------------------------------
const tourItems = [
  { icon: <Code2 size={20} strokeWidth={1.5} />, label: "Editor", desc: "Escreva código C com syntax highlighting.", color: "text-blue-400" },
  { icon: <Terminal size={20} strokeWidth={1.5} />, label: "Terminal", desc: "Interaja com scanf/fgets em tempo real.", color: "text-green-400" },
  { icon: <Play size={20} strokeWidth={1.5} />, label: "Executar", desc: "Compile e rode com um clique na barra superior.", color: "text-amber-400" },
  { icon: <Bot size={20} strokeWidth={1.5} />, label: "Assistente IA", desc: "Receba explicações sobre erros do GCC.", color: "text-purple-400" },
];

const TourStep = () => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
    <motion.h2 variants={fadeBlur} className="text-2xl font-bold text-foreground mb-2 tracking-tight">
      Conhecendo o Ambiente
    </motion.h2>
    <motion.p variants={fadeBlur} className="text-sm text-secondary mb-10">
      Os elementos principais que você vai usar no dia a dia.
    </motion.p>

    <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
      {tourItems.map((item, i) => (
        <motion.div
          key={i}
          variants={fadeBlur}
          className="flex flex-col items-center text-center p-5 rounded-2xl border border-border bg-surface"
        >
          <div className={`${item.color} mb-3`}>{item.icon}</div>
          <span className="text-sm font-semibold text-foreground mb-1">{item.label}</span>
          <span className="text-xs text-secondary leading-relaxed">{item.desc}</span>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// ---------------------------------------------------------------------------
// Step 4 — Ready
// ---------------------------------------------------------------------------
const ReadyStep = () => (
  <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col items-center text-center px-4">
    <motion.div variants={fadeBlur} className="relative mb-10">
      <div className="absolute -inset-6 rounded-full bg-green-500/10 blur-3xl" />
      <motion.div
        initial={{ scale: 0.6, filter: "blur(12px)" }}
        animate={{ scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease, delay: 0.15 }}
        className="relative w-[88px] h-[88px] rounded-full bg-surface border border-border flex items-center justify-center shadow-lg"
      >
        <Check className="w-10 h-10 text-green-400" strokeWidth={1.8} />
      </motion.div>
    </motion.div>

    <motion.h1 variants={fadeBlur} className="text-[2.5rem] leading-[1.1] font-extrabold tracking-tight text-foreground mb-4">
      Tudo pronto.
    </motion.h1>

    <motion.p variants={fadeBlur} className="text-base text-secondary max-w-xs leading-relaxed mb-6">
      Seu ambiente está configurado.
    </motion.p>


  </motion.div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
const STEPS = ["welcome", "beta", "server", "login", "theme", "tour", "ready"];

const SetupIntro = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [exiting, setExiting] = useState(false);
  const [serverUrl, setServerUrl] = useState("http://localhost:8080");
  const { availableThemes, currentTheme, changeTheme } = useTheme();
  const { user } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme?.id || "zinc");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clab-server-ip");
      if (saved) setServerUrl(saved);
    }
  }, []);

  useEffect(() => {
    if (step > 1 && serverUrl.trim()) {
      localStorage.setItem("clab-server-ip", serverUrl);
    }
  }, [step, serverUrl]);

  const handleThemeSelect = useCallback((id) => {
    setSelectedTheme(id);
    changeTheme(id);
  }, [changeTheme]);

  const go = useCallback((dir) => {
    setDirection(dir);
    setStep((p) => p + dir);
  }, []);

  const finish = useCallback(() => {
    setExiting(true);
    setTimeout(() => onComplete?.(), 800);
  }, [onComplete]);

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const id = STEPS[step];

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="setup"
          initial={{ opacity: 0, filter: "blur(16px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(24px)", scale: 1.04 }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-background overflow-hidden"
        >

          {/* Single soft ambient glow */}
          <div className="absolute w-[600px] h-[600px] rounded-full blur-[200px] bg-primary/[0.07] pointer-events-none" />

          <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
            {/* Progress */}
            <div className="flex justify-center gap-1.5 mb-14">
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ width: i === step ? 28 : 6, opacity: i <= step ? 1 : 0.2 }}
                  transition={{ duration: 0.45, ease }}
                  className={`h-[5px] rounded-full ${i <= step ? "bg-primary" : "bg-secondary/30"}`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative min-h-[400px] flex items-center justify-center">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div key={step} custom={direction} variants={pageVariants} initial="enter" animate="center" exit="exit" className="w-full">
                  {id === "welcome" && <WelcomeStep />}
                  {id === "beta" && <BetaWarningStep />}
                  {id === "server" && <ServerStep serverUrl={serverUrl} setServerUrl={setServerUrl} />}
                  {id === "login" && <LoginStep />}
                  {id === "theme" && <ThemeStep selectedTheme={selectedTheme} onSelect={handleThemeSelect} themes={availableThemes} />}
                  {id === "tour" && <TourStep />}
                  {id === "ready" && <ReadyStep />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-14">
              <motion.button
                animate={{ opacity: isFirst ? 0 : 1 }}
                transition={{ duration: 0.25 }}
                onClick={() => go(-1)}
                disabled={isFirst}
                className="flex items-center gap-1 text-sm font-medium text-secondary hover:text-foreground transition-colors disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
                Voltar
              </motion.button>

              {isLast ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={finish}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 active:brightness-90 shadow-lg shadow-primary/20"
                >
                  Começar
                  <ArrowRight size={15} />
                </motion.button>
              ) : (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => go(1)}
                  className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border text-foreground px-7 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                >
                  {id === "login" && !user ? "Pular Login" : (isFirst ? "Configurar" : "Próximo")}
                  <ChevronRight size={15} />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SetupIntro;
