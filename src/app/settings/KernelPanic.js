import React, { useState, useEffect } from "react";

const KernelPanic = ({ onClose }) => {
  const [lines, setLines] = useState([]);
  const [isRebooting, setIsRebooting] = useState(false);
  
  const [showRebootButton, setShowRebootButton] = useState(false);

  useEffect(() => {
     if (isRebooting) return;

      const panics = [
          "KERNEL PANIC: Out of coffee exception at 0xCAFEMACHINE",
          "CPU: 0 PID: 1 Comm: init Not tainted 5.15.0-clab #1",
          "Loading infinite recursion... Done.",
          "Loading infinite recursion... Done.",
          "Loading infinite recursion... Done.",
          "Loading infinite recursion... Done.",
          "Loading infinite recursion... Done.",
          "Loading infinite recursion... Done.",
          "Sorry about the loading times, Javascript is still thinking why NaN is a number",
          "Call Trace:",
          " [<ffffffff817c1b6d>] dump_stack+0x63/0x81",
          " [<ffffffff817c1b6d>] panic+0xe4/0x22d",
          "Searching for meaning of life... 404 Not Found",
          "Error: User is too cool for this system",
          "Quantum entanglement instability detected in sector 7G",
          "Trying to exit vim... failed.",
          "Code: 8b 45 00 48 8b 40 10 48 85 c0 74 04 ...",
          "Keyboard not found. Press F1 to continue.",
          "Unexpected ; on line 99999",
          "Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)",
          "Error: Success operation failed successfully.",
          "---[ end Kernel panic - not syncing: Fatal user error ]---"
      ];
      let i = 0;
      const interval = setInterval(() => {
          if (i < panics.length) {
              setLines(prev => [...prev, panics[i]]);
              i++;
          } else {
              clearInterval(interval);
              setShowRebootButton(true);
          }
      }, 50);
      return () => clearInterval(interval);
  }, [isRebooting]);

  const handleReboot = () => {
    setIsRebooting(true);
    setLines([]);
    setShowRebootButton(false);
    
    const bootLogs = [
        "[  OK  ] Started CLab File System Check.",
        "[  OK  ] Mounted /root.",
        "[  OK  ] Reached target Local File Systems.",
        "[  OK  ] Started Network Manager.",
        "[  OK  ] Reached target Network.",
        "[  OK  ] Started D-Bus System Message Bus.",
        "[  OK  ] Started User Login Management.",
        "[  OK  ] Started CLab Client Service.",
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < bootLogs.length) {
            setLines(prev => [...prev, bootLogs[i]]);
            i++;
        } else {
            clearInterval(interval);
            // Simulate hang
            let seconds = 0;
            let dots = 0;
            const hangInterval = setInterval(() => {
                seconds++;
                setLines(prev => {
                    const newLines = [...prev];
                    // Remove previous timer line if it exists (check last line)
                    if (newLines.length > 0 && newLines[newLines.length - 1] && newLines[newLines.length - 1].includes("start job")) {
                       newLines.pop();
                    }
                    
                    // Cycle dots for animation: * -> ** -> *** -> *
                    dots = (dots % 3) + 1;
                    const stars = "*".repeat(dots).padEnd(3, ' ');
                    
                    newLines.push(`[ ${stars}  ] A start job is running for User Manager (${seconds}s / no limit)`);
                    return newLines;
                });
                
                if (seconds >= 15) {
                    clearInterval(hangInterval);
                    setLines(prev => {
                        const newLines = [...prev];
                        if (newLines.length > 0 && newLines[newLines.length - 1] && newLines[newLines.length - 1].includes("stop job")) {
                           newLines.pop();
                        }
                        newLines.push(`[ ***  ] A start job is running for User Manager (15s / no limit)`);
                        newLines.push("[  OK  ] Reached target Graphical Interface.");
                        return newLines;
                    });
                    setTimeout(onClose, 800);
                }
            }, 1000);
        }
    }, 150);
  };

  return (
      <div className="absolute inset-0 bg-black z-50 p-4 font-mono text-xs overflow-hidden leading-tight cursor-default text-red-500 select-none">
           {lines.map((l, i) => (
             <div key={i} className={`mb-1 border-b border-transparent ${!isRebooting && 'hover:border-red-900/30'}`}>
                {isRebooting ? (
                    l && l.includes('start job') ? (
                        <span className="text-yellow-500">{l}</span>
                    ) : (
                        l && l.startsWith("[  OK  ]") ? (
                            <>
                                <span className="text-green-500 font-bold">[  OK  ]</span>
                                <span className="text-white">{l.substring(8)}</span>
                            </>
                        ) : (
                            <span className="text-white">{l || ''}</span>
                        )
                    )
                ) : (
                    l
                )}
             </div>
           ))}
           {lines.length === 0 && !isRebooting && <div className="animate-pulse">Initializing panic protocol...</div>}
           {isRebooting && lines.length === 0 && <div className="text-white animate-pulse">Rebooting system...</div>}
           
           {!isRebooting && showRebootButton && (
           <button 
             onClick={handleReboot}
             className="fixed bottom-4 right-4 px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500/10 active:bg-red-500/20 rounded transition-colors animate-in fade-in zoom-in duration-500"
           >
             [ FORCE REBOOT ]
           </button>
           )}
      </div>
  );
};

export default KernelPanic;
