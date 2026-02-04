"use client";

import React, { useState } from "react";
import MenuBar from "../../components/MenuBar";
import { useTheme } from "../../context/ThemeContext";
import { Check, Trash2, Plus, ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SettingsPage = () => {
  const { currentTheme, availableThemes, changeTheme, addCustomTheme, removeCustomTheme } = useTheme();
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleImport = (jsonStr) => {
    try {
      const theme = JSON.parse(jsonStr);
      
      // Basic Validation
      if (!theme.name || !theme.colors) {
          throw new Error("Invalid theme format. Missing 'name' or 'colors'.");
      }
      if (!theme.id) {
          theme.id = theme.name.toLowerCase().replace(/\s+/g, '-');
      }
      
      // Check for required colors
      const requiredColors = ['background', 'foreground', 'surface', 'surfaceHover', 'border', 'primary', 'primaryHover', 'secondary', 'accent'];
      const missing = requiredColors.filter(c => !theme.colors[c]);
      if (missing.length > 0) {
          throw new Error(`Missing colors: ${missing.join(', ')}`);
      }

      addCustomTheme(theme);
      setJsonInput("");
      setError("");
      alert("Theme added successfully!");
    } catch (e) {
      setError(e.message);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        handleImport(event.target.result);
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const ThemeCard = ({ theme }) => (
    <div 
        onClick={() => changeTheme(theme.id)}
        className={`
            relative p-4 rounded-lg border cursor-pointer transition-all group
            ${currentTheme.id === theme.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'border-border bg-surface hover:border-gray-500'
            }
        `}
    >
        <div className="flex justify-between items-start mb-3">
            <span className="font-medium text-sm text-gray-200">{theme.name}</span>
            {currentTheme.id === theme.id && <Check size={16} className="text-primary" />}
        </div>
        
        {/* Color Preview Swatches */}
        <div className="flex space-x-2">
            <div className="w-6 h-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: theme.colors.background }} title="Background" />
            <div className="w-6 h-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: theme.colors.surface }} title="Surface" />
            <div className="w-6 h-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: theme.colors.primary }} title="Primary" />
            <div className="w-6 h-6 rounded-full ring-1 ring-white/10" style={{ backgroundColor: theme.colors.accent }} title="Accent" />
        </div>

        {/* Delete Button (only for custom themes) */}
        {!['zinc', 'dracula', 'monokai', 'latte'].includes(theme.id) && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`Delete theme "${theme.name}"?`)) removeCustomTheme(theme.id);
                }}
                className="absolute top-2 right-2 p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all"
            >
                <Trash2 size={14} />
            </button>
        )}
    </div>
  );

  // Load Server IP 
  const [serverIp, setServerIp] = useState("http://localhost:8080");

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('clab-server-ip');
        if (saved) setServerIp(saved);
    }
  }, []);

  const handleSaveIp = () => {
    localStorage.setItem('clab-server-ip', serverIp);
    alert("IP do servidor salvo! Recarregue a página para aplicar.");
    window.location.reload();
  };

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* We reuse MenuBar, but maybe disable 'Run' since we are in settings? Or just keep it consistency */}
      {/* Actually simpler to just have a header for settings since we are 'navigating away' from IDE context conceptually */}
      <div className="h-10 border-b border-border bg-surface flex items-center px-3 select-none app-drag">
           <Link href="/" className="flex items-center text-secondary hover:text-foreground transition-colors no-drag">
               <ArrowLeft size={16} className="mr-2" />
               <span className="text-sm font-medium">Voltar ao Editor</span>
           </Link>
           <div className="mx-auto font-semibold text-sm text-foreground">Configurações</div>
      </div>

      <div className="flex-1 overflow-auto p-8 max-w-4xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-6 text-foreground">Aparência</h1>
          
          <section className="mb-10">
              <h2 className="text-lg font-medium mb-4 text-foreground/80">Selecionar Tema</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {availableThemes.map(t => <ThemeCard key={t.id} theme={t} />)}
              </div>
          </section>

          <section className="mb-10 pt-8 border-t border-border">
              <h2 className="text-lg font-medium mb-4 text-foreground/80">Criar Tema Personalizado</h2>
              <div className="bg-surface border border-border rounded-lg p-6">
                  <p className="text-sm text-secondary mb-4">
                      Cole um JSON de configuração abaixo para adicionar um novo tema. 
                      Deve incluir <code>id</code>, <code>name</code>, e objeto <code>colors</code>.
                  </p>
                  
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full h-48 bg-background border border-border rounded-md p-4 font-mono text-sm text-foreground focus:border-primary focus:outline-none mb-4"
                    placeholder={`{
  "id": "ocean-blue",
  "name": "Ocean Blue",
  "colors": {
    "background": "#0f172a",
    "foreground": "#e2e8f0",
    "surface": "#1e293b",
    "surfaceHover": "#334155",
    "border": "#334155",
    "primary": "#38bdf8",
    "primaryHover": "#0ea5e9",
    "secondary": "#94a3b8",
    "accent": "#4ade80"
  }
}`}
                  />
                  
                  {error && (
                      <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
                          {error}
                      </div>
                  )}

                  <div className="flex gap-4">
                      <button 
                        onClick={() => handleImport(jsonInput)}
                        disabled={!jsonInput.trim()}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          <Plus size={16} className="mr-2" />
                          Adicionar Texto
                      </button>
                      
                      <div className="flex-1 relative">
                          <input 
                            type="file" 
                            accept=".json"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <button 
                            className="w-full h-full flex items-center justify-center px-4 py-2 bg-surface hover:bg-surface-hover border border-border text-secondary rounded-md text-sm font-medium transition-colors"
                          >
                              <Upload size={16} className="mr-2" />
                              Importar JSON
                          </button>
                      </div>
                  </div>
              </div>
          </section>

          <section className="mb-10 pt-8 border-t border-border">
            <h1 className="text-2xl font-bold mb-6 text-foreground">Conexão</h1>
            <h2 className="text-lg font-medium mb-4 text-foreground/80">Endereço do Servidor</h2>
            <div className="bg-surface border border-border rounded-lg p-6">
                 <p className="text-sm text-secondary mb-4">
                    Defina o IP ou URL do servidor backend. Padrão: <code>http://localhost:8080</code>
                  </p>
                  <div className="flex gap-4">
                    <input 
                        type="text" 
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-md px-4 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                    <button 
                        onClick={handleSaveIp}
                        className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-md text-sm font-medium transition-colors"
                    >
                        Salvar
                    </button>
                  </div>
            </div>
          </section>
      </div>
    </main>
  );
};

export default SettingsPage;
