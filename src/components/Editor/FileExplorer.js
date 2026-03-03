import React, { useState, useRef, useEffect } from 'react';
import { FileCode, FileText, Trash2, FilePlus, ChevronLeft, ChevronRight, X } from 'lucide-react';

const FileExplorer = ({ files, activeFileName, setActiveFileName, onAddFile, onDeleteFile }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onAddFile(newFileName.trim());
      setNewFileName('');
      setIsAdding(false);
    }
  };

  const cancelAdd = () => {
    setNewFileName('');
    setIsAdding(false);
  };

  if (isCollapsed) {
    return (
      <div className="w-[50px] shrink-0 border-r border-border bg-background flex flex-col h-full items-center py-4 select-none">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-secondary hover:text-foreground transition-colors hover:bg-surface rounded-md mb-4"
          title="Expand Explorer"
        >
          <ChevronRight size={18} />
        </button>
        
        {/* Render vertical icons only */}
        {files.map((file) => {
          const isC = file.name.endsWith('.c') || file.name.endsWith('.h');
          const isActive = activeFileName === file.name;
          
          return (
            <button
              key={file.name}
              onClick={() => setActiveFileName(file.name)}
              className={`p-2 my-1 rounded-md transition-colors ${
                isActive ? 'bg-primary/20 text-primary' : 'text-secondary hover:text-foreground hover:bg-surface'
              }`}
              title={file.name}
            >
              {isC ? <FileCode size={16} /> : <FileText size={16} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-[200px] shrink-0 border-r border-border bg-background flex flex-col h-full select-none">
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-surface-hover">
        <span className="text-[11px] font-semibold text-secondary uppercase tracking-wide">Explorer</span>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsAdding(true)}
            className="text-secondary hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded"
            title="Novo Arquivo"
          >
            <FilePlus size={14} />
          </button>
          <button 
            onClick={() => setIsCollapsed(true)}
            className="text-secondary hover:text-foreground transition-colors p-1 hover:bg-white/10 rounded"
            title="Colapsar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {isAdding && (
          <form onSubmit={handleAddSubmit} className="px-3 py-1.5 flex items-center">
             <FileText size={16} className="mr-2 text-secondary shrink-0" />
             <input
               ref={inputRef}
               type="text"
               value={newFileName}
               onChange={(e) => setNewFileName(e.target.value)}
               onBlur={cancelAdd}
               onKeyDown={(e) => {
                 if (e.key === 'Escape') cancelAdd();
               }}
               className="flex-1 bg-surface border border-primary/50 text-foreground text-sm px-1 py-0.5 rounded outline-none w-full"
               placeholder="arquivo.c"
             />
          </form>
        )}

        {files.map((file) => {
          const isC = file.name.endsWith('.c') || file.name.endsWith('.h');
          const isActive = activeFileName === file.name;
          
          return (
            <div
              key={file.name}
              className={`flex items-center group cursor-pointer px-3 py-1.5 transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-surface hover:text-foreground'
              }`}
              onClick={() => setActiveFileName(file.name)}
            >
              {isC ? <FileCode size={16} className={`mr-2 shrink-0 ${isActive ? 'text-primary' : 'text-secondary'}`} /> 
                   : <FileText size={16} className={`mr-2 shrink-0 ${isActive ? 'text-blue-400' : 'text-secondary'}`} />}
              
              <span className="truncate text-sm flex-1">{file.name}</span>
              
              {file.name !== 'program.c' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.name);
                  }}
                  className={`ml-1 p-1 rounded-md hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all ${
                    isActive ? 'text-primary' : 'text-secondary'
                  }`}
                  title="Excluir arquivo"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileExplorer;
