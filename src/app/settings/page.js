"use client";

import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Check, Trash2, Plus, ArrowLeft, Upload, Palette, Server, Info, Code, Terminal, Cpu, Database, Monitor } from "lucide-react";
import Link from "next/link";

const SettingsPage = () => {
  const { currentTheme, availableThemes, changeTheme, addCustomTheme, removeCustomTheme } = useTheme();
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("appearance");
  const [saveMessage, setSaveMessage] = useState("");

  const [serverIp, setServerIp] = useState("http://localhost:8080");

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
      <div className="flex justify-between items-center mb-2">
        <code className="text-xs text-foreground">{theme.name}</code>
        {currentTheme.id === theme.id && <Check size={12} className="text-primary" />}
      </div>
      <div className="flex space-x-1">
        {[theme.colors.background, theme.colors.surface, theme.colors.primary, theme.colors.accent].map((c, i) => (
          <div key={i} className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: c }} />
        ))}
      </div>
      {!['zinc', 'dracula', 'monokai', 'latte'].includes(theme.id) && (
        <button 
          onClick={(e) => { e.stopPropagation(); if(confirm(`Excluir ${theme.name}?`)) removeCustomTheme(theme.id); }}
          className="absolute top-1.5 right-1.5 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all"
        >
          <Trash2 size={10} />
        </button>
      )}
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
        <div className="w-44 border-r border-border bg-surface flex flex-col">
          {/* Header */}
          <div className="p-3 pt-[50px] border-b border-border">
            <code className="text-xs text-secondary">~/configurações</code>
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
        <div className="flex-1 overflow-auto p-6">
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
                  <span>neofetch</span>
                </div>

                <div className="bg-background border border-border rounded p-4">
                  <div className="flex items-start space-x-4">
                    {/* ASCII Art Logo */}
                    <pre className="text-primary text-[8px] leading-tight hidden sm:block">{`
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
                      <div className="border-t border-border my-2" />
                      <div className="flex">
                        <span className="text-secondary w-20">frontend</span>
                        <span className="text-foreground">Next.js 14</span>
                      </div>
                      <div className="flex">
                        <span className="text-secondary w-20">backend</span>
                        <span className="text-foreground">Go + Gin</span>
                      </div>
                      <div className="flex">
                        <span className="text-secondary w-20">editor</span>
                        <span className="text-foreground">Monaco</span>
                      </div>
                      <div className="flex">
                        <span className="text-secondary w-20">runtime</span>
                        <span className="text-foreground">Electron</span>
                      </div>
                      <div className="border-t border-border my-2" />
                      <div className="flex space-x-1">
                        {['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-cyan-500', 'bg-blue-500', 'bg-purple-500'].map((c, i) => (
                          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
