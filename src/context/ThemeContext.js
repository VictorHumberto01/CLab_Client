"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_THEMES, applyTheme } from '../utils/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(DEFAULT_THEMES[0]);
  const [customThemes, setCustomThemes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedThemeId = localStorage.getItem('clab-theme-id');
      const savedCustomThemes = JSON.parse(localStorage.getItem('clab-custom-themes') || '[]');
      
      setCustomThemes(savedCustomThemes);
      
      const allThemes = [...DEFAULT_THEMES, ...savedCustomThemes];
      const foundTheme = allThemes.find(t => t.id === savedThemeId) || DEFAULT_THEMES[0];
      
      setCurrentTheme(foundTheme);
      applyTheme(foundTheme);
    } catch (e) {
      console.error("Failed to load theme:", e);
    }
    setIsLoaded(true);
  }, []);

  const changeTheme = (themeId) => {
    const allThemes = [...DEFAULT_THEMES, ...customThemes];
    const theme = allThemes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
      applyTheme(theme);
      localStorage.setItem('clab-theme-id', theme.id);
    }
  };

  const addCustomTheme = (newTheme) => {
    setCustomThemes(prev => {
      // Check if theme already exists
      if (prev.some(t => t.id === newTheme.id)) {
        return prev;
      }
      const updatedCustom = [...prev, newTheme];
      localStorage.setItem('clab-custom-themes', JSON.stringify(updatedCustom));
      return updatedCustom;
    });
    // Automatically switch to it
    changeTheme(newTheme.id);
  };
  
  const removeCustomTheme = (themeId) => {
      const updatedCustom = customThemes.filter(t => t.id !== themeId);
      setCustomThemes(updatedCustom);
      localStorage.setItem('clab-custom-themes', JSON.stringify(updatedCustom));
      
      if (currentTheme.id === themeId) {
          changeTheme('zinc');
      }
  };

  return (
    <ThemeContext.Provider value={{ 
        currentTheme, 
        availableThemes: [...DEFAULT_THEMES, ...customThemes], 
        changeTheme, 
        addCustomTheme,
        removeCustomTheme,
        isLoaded 
    }}>
      {/* Prevent flash of wrong theme by hiding until loaded, optional but cleaner */}
      <div style={{ visibility: isLoaded ? 'visible' : 'hidden', height: '100%', width: '100%' }}>
          {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
