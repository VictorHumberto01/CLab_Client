import React, { useState, useEffect } from "react";

const ConnectionSettings = () => {
    const [serverIp, setServerIp] = useState("http://localhost:8080");
    const [saveMessage, setSaveMessage] = useState("");

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('clab-server-ip');
            if (saved) setServerIp(saved);
        }
    }, []);

    const handleSaveIp = () => {
        localStorage.setItem('clab-server-ip', serverIp);
        setSaveMessage("// salvo");
        setTimeout(() => setSaveMessage(""), 3000);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-2 text-secondary text-xs">
                <span className="text-primary">$</span>
                <span>Conexão</span>
            </div>

            <section>
                <div className="text-[10px] text-secondary uppercase tracking-widest mb-2">// servidor backend</div>
                <div className="bg-background border border-border rounded p-3">
                    <div className="text-[10px] text-secondary mb-2">BASE_URL =</div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={serverIp}
                            onChange={(e) => setServerIp(e.target.value)}
                            className="flex-1 bg-transparent border-b border-border px-1 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                        <button
                            onClick={handleSaveIp}
                            className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded text-[10px] transition-colors"
                        >
                            salvar
                        </button>
                    </div>
                    {saveMessage && <div className="text-green-400 text-[10px] mt-2">{saveMessage}</div>}
                </div>
            </section>
        </div>
    );
};

export default ConnectionSettings;
