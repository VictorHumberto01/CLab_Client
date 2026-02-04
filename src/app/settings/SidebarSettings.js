import React from "react";
import { Palette, Server, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";

const SidebarSettings = ({ activeSection, onSectionChange }) => {
    return (
        <div className="w-44 border-r border-border bg-surface flex flex-col no-drag">
            {/* Header - Drag Region */}
            <div className="p-3 pt-[50px] border-b border-border app-drag">
                <code className="text-xs text-secondary pointer-events-none">~/configurações</code>
            </div>

            {/* Navigation */}
            <nav className="p-2 flex flex-col space-y-0.5 flex-1">
                <button
                    onClick={() => onSectionChange('appearance')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 text-xs mb-0.5 transition-colors ${activeSection === 'appearance' ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-foreground hover:bg-white/5'}`}
                >
                    <Palette size={14} />
                    <span>Aparência</span>
                </button>

                <button
                    onClick={() => onSectionChange('connection')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 text-xs mb-0.5 transition-colors ${activeSection === 'connection' ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-foreground hover:bg-white/5'}`}
                >
                    <Server size={14} />
                    <span>Conexão</span>
                </button>

                <button
                    onClick={() => onSectionChange('about')}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center space-x-2 text-xs transition-colors ${activeSection === 'about' ? 'bg-primary/10 text-primary' : 'text-secondary hover:text-foreground hover:bg-white/5'}`}
                >
                    <Info size={14} />
                    <span>Sobre</span>
                </button>
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
    );
};

export default SidebarSettings;
