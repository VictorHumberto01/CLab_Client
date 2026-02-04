import React, { useState, useEffect } from "react";

const AboutSettings = ({ currentTheme, onTriggerPanic }) => {
    const [browserInfo, setBrowserInfo] = useState({});
    const [typedCommand, setTypedCommand] = useState("");
    const [neofetchStage, setNeofetchStage] = useState(0); // 0: hidden, 1: head, 2: specs, 3: palette

    useEffect(() => {
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

    useEffect(() => {
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
    }, []); // Only run once on mount (when About tab is active)

    return (
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
                        <span className="text-foreground">0.2.0</span>

                        <span className="text-secondary text-right">Build:</span>
                        <span 
                            className="text-foreground cursor-pointer hover:underline hover:text-red-500 transition-colors"
                            onClick={onTriggerPanic}
                            title="Click for system diagnostics"
                        >
                            {browserInfo.build}
                        </span>

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
    );
};

export default AboutSettings;
