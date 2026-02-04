"use client";

import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { Check, Trash2, Plus, ArrowLeft, Upload, Palette, Server, Info, Code, Terminal, Cpu, Database, Monitor, Shield, User } from "lucide-react";
import Link from "next/link";

const SettingsPage = () => {
  const { currentTheme, availableThemes, changeTheme, addCustomTheme, removeCustomTheme } = useTheme();
  const { user } = useAuth();
  const [jsonInput, setJsonInput] = useState("");
  const [browserInfo, setBrowserInfo] = useState({});

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent;
      
      const getOS = () => {
        if (ua.indexOf("Win") !== -1) return "Windows";
        if (ua.indexOf("Mac") !== -1) return "MacOS";
        if (ua.indexOf("Linux") !== -1) return "Linux";
        return "Unknown";
      };

      const getElectronVersion = () => {
        const match = ua.match(/Electron\/([\d\.]+)/);
        return match ? match[1] : "Unknown (Web)";
      };

      setBrowserInfo({
        os: getOS(),
        electron: getElectronVersion(),
        build: "04022026-0.0.1"
      });
    }
  }, []);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("appearance");
  const [saveMessage, setSaveMessage] = useState("");

  const [serverIp, setServerIp] = useState("http://localhost:8080");

  // Neofetch animation state
  const [typedCommand, setTypedCommand] = useState("");
  const [neofetchStage, setNeofetchStage] = useState(0); // 0: hidden, 1: head, 2: specs, 3: palette

  React.useEffect(() => {
    if (activeSection === 'about') {
      setTypedCommand("");
      setNeofetchStage(0);
      let i = 0;
      const cmd = "neofetch";
      const interval = setInterval(() => {
        setTypedCommand(cmd.substring(0, i + 1));
        i++;
        if (i === cmd.length) {
          clearInterval(interval);
          // Sequence the loading stages
          setTimeout(() => setNeofetchStage(1), 600);  // Initial lag -> Header/Logo
          setTimeout(() => setNeofetchStage(2), 1000); // Then Specs
          setTimeout(() => setNeofetchStage(3), 1400); // Last Palette
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [activeSection]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('clab-server-ip');
        if (saved) setServerIp(saved);
    }
  }, []);

  const handleSaveIp = () => {
    localStorage.setItem('clab-server-ip', serverIp);
    setSaveMessage("// salvo");
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleImport = (jsonStr, silent = false) => {
    try {
      const theme = JSON.parse(jsonStr);
      if (!theme.name || !theme.colors) throw new Error("Faltando 'name' ou 'colors'");
      if (!theme.id) theme.id = theme.name.toLowerCase().replace(/\s+/g, '-');
      
      const requiredColors = ['background', 'foreground', 'surface', 'surfaceHover', 'border', 'primary', 'primaryHover', 'secondary', 'accent'];
      const missing = requiredColors.filter(c => !theme.colors[c]);
      if (missing.length > 0) throw new Error(`Faltando: ${missing.join(', ')}`);

      addCustomTheme(theme);
      if (!silent) {
        setJsonInput("");
        setError("");
      }
    } catch (e) {
      if (!silent) setError(e.message);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    let importedCount = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleImport(event.target.result, true);
        importedCount++;
        if (importedCount === files.length && files.length > 1) {
          setError(null);
        }
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const themeTemplate = `{
  "name": "Meu Tema",
  "colors": {
    "background": "#1a1b26",
    "foreground": "#c0caf5",
    "surface": "#24283b",
    "surfaceHover": "#414868",
    "border": "#414868",
    "primary": "#7aa2f7",
    "primaryHover": "#5d7fc7",
    "secondary": "#565f89",
    "accent": "#9ece6a"
  }
}`;

  const ThemeCard = ({ theme }) => (
    <div 
      onClick={() => changeTheme(theme.id)}
      className={`relative p-2.5 rounded border cursor-pointer transition-all group ${
        currentTheme.id === theme.id 
          ? 'border-primary bg-primary/5' 
          : 'border-border bg-background hover:border-secondary'
      }`}
    >
      {/* Delete button - top right, only on hover */}
      {!['zinc', 'dracula', 'monokai', 'latte'].includes(theme.id) && (
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm(`Excluir ${theme.name}?`)) removeCustomTheme(theme.id); }}
          className="absolute top-1.5 right-1.5 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all z-10"
        >
          <Trash2 size={10} />
        </button>
      )}
      
      {/* Selected indicator - bottom right */}
      {currentTheme.id === theme.id && (
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
      
      <div className="flex items-center mb-2 pr-4">
        <code className="text-xs text-foreground truncate">{theme.name}</code>
      </div>
      <div className="flex space-x-1">
        {[theme.colors.background, theme.colors.surface, theme.colors.primary, theme.colors.accent].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );

  const navItems = [
    { id: 'appearance', label: 'tema', icon: Palette },
    { id: 'connection', label: 'rede', icon: Server },
    { id: 'about', label: 'sobre', icon: Terminal },
  ];

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-mono">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 border-r border-border bg-surface flex flex-col no-drag">
          {/* Header - Drag Region */}
          <div className="p-3 pt-[50px] border-b border-border app-drag">
            <code className="text-xs text-secondary pointer-events-none">~/configurações</code>
          </div>

          {/* Navigation */}
          <nav className="p-2 flex flex-col space-y-0.5 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center px-2 py-1.5 rounded text-xs transition-colors ${
                  activeSection === item.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-secondary hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <item.icon size={12} className="mr-2" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Back Button - Bottom */}
          <div className="p-3 border-t border-border">
            <Link 
              href="/" 
              className="flex items-center text-secondary hover:text-primary transition-colors text-xs"
            >
              <ArrowLeft size={12} className="mr-1.5" />
              <span>voltar</span>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-drag">
          <div className="max-w-xl">

            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-secondary text-xs">
                  <span className="text-primary">$</span>
                  <span>ver temas</span>
                </div>

                <section>
                  <div className="text-[10px] text-secondary uppercase tracking-widest mb-2">// temas disponíveis</div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableThemes.map(t => <ThemeCard key={t.id} theme={t} />)}
                  </div>
                </section>

                <section className="pt-4 border-t border-border">
                  <div className="text-[10px] text-secondary uppercase tracking-widest mb-2">// importar tema</div>
                  <div className="bg-background border border-border rounded p-3">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-40 bg-transparent text-xs text-foreground focus:outline-none resize-none"
                      placeholder={themeTemplate}
                      spellCheck={false}
                    />
                    {error && <div className="text-red-400 text-[10px] mt-2">// erro: {error}</div>}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <button 
                        onClick={() => handleImport(jsonInput)}
                        disabled={!jsonInput.trim()}
                        className="flex-1 flex items-center justify-center px-2 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] transition-colors disabled:opacity-40"
                      >
                        <Plus size={10} className="mr-1" /> adicionar
                      </button>
                      <div className="flex-1 relative">
                        <input type="file" accept=".json" multiple onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <button className="w-full flex items-center justify-center px-2 py-1 border border-border text-secondary rounded text-[10px] hover:text-foreground">
                          <Upload size={10} className="mr-1" /> importar
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'connection' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-secondary text-xs">
                  <span className="text-primary">$</span>
                  <span>testar conexão</span>
                </div>

                <section>
                  <div className="text-[10px] text-secondary uppercase tracking-widest mb-2">// servidor backend</div>
                  <div className="bg-background border border-border rounded p-3">
                    <div className="text-[10px] text-secondary mb-2">BASE_URL =</div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        className="flex-1 bg-transparent border-b border-border px-1 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                      <button 
                        onClick={handleSaveIp}
                        className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] transition-colors"
                      >
                        salvar
                      </button>
                    </div>
                    {saveMessage && <div className="text-green-400 text-[10px] mt-2">{saveMessage}</div>}
                  </div>
                </section>
              </div>
            )}

            {activeSection === 'about' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-2 text-secondary text-xs">
                  <span className="text-primary">$</span>
                  <span>{typedCommand}</span>
                  {neofetchStage === 0 && <span className="w-1.5 h-3 bg-secondary animate-pulse"/>}
                </div>

                {neofetchStage > 0 && (
                <div className="bg-background border border-border rounded p-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-start space-x-4">
                    {/* ASCII Art Logo */}
                    <pre className="text-primary text-[8px] leading-tight hidden sm:block select-none">{`
   _____ _       _     
  / ____| |     | |    
 | |    | | __ _| |__  
 | |    | |/ _\` | '_ \\ 
 | |____| | (_| | |_) |
  \\_____|_|\\__,_|_.__/ 
                       `}</pre>
                    
                    {/* Info */}
                    <div className="text-xs space-y-1 flex-1">
                      <div className="flex">
                        <span className="text-primary w-20">app</span>
                        <span className="text-foreground">CLab IDE</span>
                      </div>
                      <div className="flex">
                        <span className="text-primary w-20">version</span>
                        <span className="text-foreground">0.1.0-alpha</span>
                      </div>

                      {/* STAGE 2: Specs */}
                      {neofetchStage >= 2 && (
                        <div className="animate-in slide-in-from-left-2 duration-300 fade-in text-[10px] font-mono">
                          <div className="border-t border-border my-2" />
                          
                          <div className="grid grid-cols-[100px_1fr] gap-x-2">
                            <span className="text-secondary text-right">CLab Server:</span>
                            <span className="text-foreground">1.0.0 (Go/Gin)</span>

                            <span className="text-secondary text-right">Build:</span>
                            <span className="text-foreground">{browserInfo.build}</span>

                            <span className="text-secondary text-right">Electron:</span>
                            <span className="text-foreground">{browserInfo.electron}</span>

                            <span className="text-secondary text-right">OS:</span>
                            <span className="text-foreground">{browserInfo.os}</span>

                            <span className="text-secondary text-right">Theme:</span>
                            <span className="text-foreground">{currentTheme.name}</span>
                          </div>
                        </div>
                      )}

                      {/* STAGE 3: Palette */}
                      {neofetchStage >= 3 && (
                        <div className="animate-in slide-in-from-left-2 duration-300 fade-in delay-100">
                          <div className="border-t border-border my-2" />
                          <div className="flex space-x-1">
                            {[
                              currentTheme.colors.background,
                              currentTheme.colors.surface, 
                              currentTheme.colors.primary,
                              currentTheme.colors.accent,
                              currentTheme.colors.secondary,
                              currentTheme.colors.foreground
                            ].map((c, i) => (
                              <div key={i} className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
