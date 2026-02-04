"use client";

import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import KernelPanic from "./KernelPanic";
import SidebarSettings from "./SidebarSettings";
import ThemeSettings from "./ThemeSettings";
import ConnectionSettings from "./ConnectionSettings";
import AboutSettings from "./AboutSettings";

const SettingsPage = () => {
  const { currentTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState("appearance");
  
  // Easter Egg State
  const [panicCount, setPanicCount] = useState(0);
  const [lastPanicTime, setLastPanicTime] = useState(0);
  const [isPanicked, setIsPanicked] = useState(false);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const triggerPanic = () => {
      const now = Date.now();
      if (now - lastPanicTime < 1000) { 
          const newCount = panicCount + 1;
          setPanicCount(newCount);
          if (newCount >= 1) { // 5 clicks on build number
            setIsPanicked(true);
            setPanicCount(0);
          }
      } else {
        setPanicCount(1);
      }
      setLastPanicTime(now);
  };

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-mono">
      <div className="flex-1 flex overflow-hidden">
        
        <SidebarSettings 
            activeSection={activeSection} 
            onSectionChange={handleSectionChange} 
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 no-drag relative">
            
          {isPanicked && <KernelPanic onClose={() => setIsPanicked(false)} />}

          <div className="max-w-xl">
            {activeSection === 'appearance' && <ThemeSettings />}
            {activeSection === 'connection' && <ConnectionSettings />}
            {activeSection === 'about' && !isPanicked && <AboutSettings currentTheme={currentTheme} onTriggerPanic={triggerPanic} />}
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
