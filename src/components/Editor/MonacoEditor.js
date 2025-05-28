import { useRef, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditor = ({ code, setCode, language = 'c', triggerResize }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure editor with better settings for cursor positioning
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Geist Mono, Consolas, "Courier New", monospace',
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
  }, []);

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
        theme="vs-dark"
        loading={
          <div className="flex items-center justify-center h-full text-gray-400">
            Loading editor...
          </div>
        }
        options={{
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'Geist Mono, Consolas, "Courier New", monospace',
          minimap: { enabled: false },
          scrollBeyondLastLine: false
        }}
      />
    </div>
  );
};

export default MonacoEditor;