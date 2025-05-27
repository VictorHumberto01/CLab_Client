import { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditor = ({ code, setCode, language = 'c', triggerResize }) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      fontSize: 14,
      fontFamily: 'Geist Mono, monospace',
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
      }
    });
  };

  // Trigger resize when needed
  useEffect(() => {
    if (editorRef.current && triggerResize) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        editorRef.current.layout();
      }, 100);
    }
  }, [triggerResize]);

  return (
    <div className="flex-1 h-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        onChange={setCode}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: 'Geist Mono, monospace',
          minimap: {
            enabled: false
          }
        }}
        className="flex-1"
      />
    </div>
  );
};

export default MonacoEditor;