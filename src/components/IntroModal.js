import React from 'react';

const IntroModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className="bg-surface p-6 rounded-lg max-w-md w-full mx-4 relative border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-foreground">Bem-vindo ao CLab IDE</h2>
        <div className="text-secondary space-y-3">
          <p>👋 Esta é uma versão de desenvolvimento do CLab IDE.</p>
          <p>Funcionalidades atuais:</p>
          <ul className="list-disc list-inside ml-2">
            <li>Edição de código C</li>
            <li>Compilação e execução</li>
          </ul>
        </div>
        <button
          onClick={handleClick}
          className="mt-6 w-full bg-primary hover:bg-primary-hover text-white py-2 px-4 rounded transition-colors cursor-pointer active:transform active:scale-95 text-sm font-medium"
        >
          Começar
        </button>
      </div>
    </div>
  );
};

export default IntroModal;