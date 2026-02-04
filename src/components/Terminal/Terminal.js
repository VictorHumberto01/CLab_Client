import React, { useEffect, useRef } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const Terminal = ({ onData, onResize, terminalRef: externalRef }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize Xterm
    const term = new Xterm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#09090b', // zinc-950
        foreground: '#e4e4e7', // zinc-200
        cursor: '#a1a1aa',     // zinc-400
        selectionBackground: '#3f3f46', // zinc-700
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Output Buffering Mechanism
    const writeBuffer = [];
    let isFlushing = false;

    const flushBuffer = () => {
        if (writeBuffer.length === 0) {
            isFlushing = false;
            return;
        }
        
        // Combine all chunks in buffer significantly improves performance
        // vs many small writes
        const chunk = writeBuffer.join('');
        writeBuffer.length = 0; // Clear buffer
        
        term.write(chunk, () => {
             // Optional callback after write
        });

        // Schedule next flush
        requestAnimationFrame(flushBuffer);
    };

    const bufferedWrite = (data) => {
        writeBuffer.push(data);
        if (!isFlushing) {
            isFlushing = true;
            requestAnimationFrame(flushBuffer);
        }
    };

    // Expose refs to parent
    if (externalRef) {
        externalRef.current = { 
            term, 
            fitAddon,
            write: bufferedWrite // Expose safe write method
        };
    }

    // Handle Input
    term.onData((data) => {
      if (onData) {
        onData(data);
      }
    });
    
    // Handle Resize (send to backend)
    term.onResize((size) => {
        if (onResize) {
            onResize(size);
        }
    });

    // Handle window resize
    const handleResize = () => {
      fitAddon.fit();
      if (onResize) {
         onResize({ cols: term.cols, rows: term.rows });
      }
    };

    window.addEventListener('resize', handleResize);

    // Initial fit delay
    setTimeout(() => {
        fitAddon.fit();
    }, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []); // Run once on mount

  // Allow re-fitting from parent (e.g. when panel size changes)
  useEffect(() => {
     if (fitAddonRef.current) {
         // Create a ResizeObserver to monitor the container
         const resizeObserver = new ResizeObserver(() => {
             fitAddonRef.current.fit();
             if (xtermRef.current && onResize) {
                 onResize({ cols: xtermRef.current.cols, rows: xtermRef.current.rows });
             }
         });
         
         if (terminalRef.current) {
             resizeObserver.observe(terminalRef.current);
         }
         
         return () => resizeObserver.disconnect();
     }
  }, []);

  return <div ref={terminalRef} className="w-full h-full overflow-hidden bg-[#09090b]" />;
};

export default Terminal;
