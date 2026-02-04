import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../../context/ThemeContext';

const MonacoEditor = ({ code, setCode, language = 'c', triggerResize }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const containerRef = useRef(null);
  const { currentTheme } = useTheme();

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Iterate on theme application
    applyMonacoTheme(monaco, currentTheme);

    // Configure editor with better settings for cursor positioning
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
      fontLigatures: true,
      minimap: {
        enabled: false
      },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      wordWrap: 'on',
      automaticLayout: true,
      padding: {
        top: 16,
        bottom: 16
      },
      // Better cursor behavior
      cursorStyle: 'line',
      cursorBlinking: 'blink',
      selectOnLineNumbers: true,
      mouseWheelZoom: false,
      contextmenu: true,
      multiCursorModifier: 'ctrlCmd',
      selectionHighlight: true,
      occurrencesHighlight: true,
      smoothScrolling: true
    });

    // Force initial layout and focus
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
        editorRef.current.focus();
      }
    }, 100);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to define and set theme
  const applyMonacoTheme = (monaco, theme) => {
    if (!monaco) return;

    if (theme.monacoTheme && ['vs', 'vs-dark', 'hc-black'].includes(theme.monacoTheme)) {
        monaco.editor.setTheme(theme.monacoTheme);
    } else {
        // Define Custom Theme
        const isDark = theme.id !== 'latte'; // Simple heuristic, or check background brightness
        const base = isDark ? 'vs-dark' : 'vs';

        monaco.editor.defineTheme('custom-theme', {
            base: base,
            inherit: true,
            rules: [
                { token: '', foreground: theme.colors.foreground },
                { token: 'keyword', foreground: theme.colors.primary },
                { token: 'comment', foreground: theme.colors.secondary, fontStyle: 'italic' },
                { token: 'string', foreground: theme.colors.accent },
                { token: 'number', foreground: theme.colors.accent },
                { token: 'delimiter', foreground: theme.colors.foreground },
            ],
            colors: {
                'editor.background': theme.colors.background,
                'editor.foreground': theme.colors.foreground,
                'editorCursor.foreground': theme.colors.primary,
                'editor.lineHighlightBackground': theme.colors.surfaceHover,
                'editorLineNumber.foreground': theme.colors.secondary,
                'editor.selectionBackground': theme.colors.primary + '40', // 25% opacity
                'editor.inactiveSelectionBackground': theme.colors.primary + '20',
            }
        });
        monaco.editor.setTheme('custom-theme');
    }
  };

  // React to theme changes
  useEffect(() => {
    if (monacoRef.current && currentTheme) {
        applyMonacoTheme(monacoRef.current, currentTheme);
    }
  }, [currentTheme]);

  // Handle triggerResize prop changes
  useEffect(() => {
    if (editorRef.current && triggerResize) {
      const editor = editorRef.current;
      
      const performLayout = () => {
        if (editor && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          editor.layout({
            width: Math.floor(rect.width),
            height: Math.floor(rect.height)
          });
        }
      };

      // Multiple layout attempts with delays
      performLayout();
      setTimeout(performLayout, 50);
      setTimeout(performLayout, 200);
    }
  }, [triggerResize]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple container resize handling
  useEffect(() => {
    if (!containerRef.current || !window.ResizeObserver) return;

    const resizeObserver = new ResizeObserver(() => {
      if (editorRef.current) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.layout();
          }
        }, 50);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="flex-1 h-full"
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%'
      }}
    >
      <Editor
        height="100%"
        width="100%"
        defaultLanguage={language}
        value={code}
        onChange={setCode}
        onMount={handleEditorDidMount}
        // theme prop is handled manually by applyMonacoTheme
        loading={
          <div className="flex items-center justify-center h-full text-secondary">
            Carregando editor...
          </div>
        }
        options={{
          automaticLayout: true,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Menlo', 'Consolas', monospace",
          fontLigatures: true,
          renderWhitespace: 'selection',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          contextmenu: true,
          mouseWheelZoom: false,
          
          // Professional feel:
          lineNumbersMinChars: 4,
          ruler: 80,
          minimap: { enabled: false },
          scrollBeyondLastLine: false
        }}
      />
    </div>
  );
};

export default MonacoEditor;