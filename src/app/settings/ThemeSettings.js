import React, { useState } from "react";
import { Check, Trash2, Plus, Upload } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThemeCard = ({ theme, currentTheme, changeTheme, removeCustomTheme }) => (
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

const ThemeSettings = () => {
  const { currentTheme, availableThemes, changeTheme, addCustomTheme, removeCustomTheme } = useTheme();
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="space-y-6">
    <div className="flex items-center space-x-2 text-secondary text-xs">
        <span className="text-primary">$</span>
        <span>Temas</span>
    </div>

    <section>
        <div className="text-[10px] text-secondary uppercase tracking-widest mb-2">// temas disponíveis</div>
        <div className="grid grid-cols-2 gap-2">
        {availableThemes.map(t => (
            <ThemeCard 
                key={t.id} 
                theme={t} 
                currentTheme={currentTheme}
                changeTheme={changeTheme}
                removeCustomTheme={removeCustomTheme}
            />
        ))}
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
  );
};

export default ThemeSettings;
