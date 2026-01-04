/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Plus, History, Settings, FileUp, Menu } from "lucide-react";
import ReactMarkdown from "react-markdown"; //Import the magic text fixer
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; parts: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // FIXED: Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]); //Added loading to dependency to scroll when "Thinking..." appears

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput("");
    setLoading(true);

    const newHistory = [...messages, { role: "user", parts: userMessage }];
    setMessages(newHistory);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, history: [] }), 
      });

      const data = await response.json();
      setMessages([...newHistory, { role: "model", parts: data.reply }]);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-slate-100 font-sans overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0 opacity-20" />
      
      {/* Aurora Background Animation */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px] animate-aurora-1" />
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px] animate-aurora-2" />
        <div className="absolute -bottom-1/4 left-1/3 w-1/2 h-1/2 bg-pink-500/10 rounded-full blur-[120px] animate-aurora-3" />
      </div>
      
      {/* --- START SIDEBAR CODE --- */}
      <div className={`${isSidebarOpen ? "w-72" : "w-0"} transition-all duration-300 ease-in-out border-r border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl flex flex-col z-20 overflow-hidden shrink-0`}>
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src="xi.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-lg shadow-blue-500/20" />
            <span className="font-bold text-lg tracking-tight text-slate-200">Verba</span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            aria-label="Close sidebar"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Buttons */}
        <div className="px-4 space-y-2">
            <button 
                onClick={() => setMessages([])}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-500 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 group"
            >
                <Plus size={18} /> <span className="font-medium text-sm">New Chat</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all border border-white/5 hover:border-white/10 group">
                <FileUp size={18} className="text-purple-400 group-hover:scale-110 transition-transform"/> 
                <span className="font-medium text-sm">Upload PDF</span>
            </button>
        </div>

        {/* Recent History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2 mb-2">Recent</div>
            {/* Mock Data - We will wire this up later */}
            {[1, 2, 3].map((_, i) => (
                <button key={i} className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 text-sm transition-colors truncate flex items-center gap-2 group">
                    <History size={14} className="opacity-50 group-hover:opacity-100"/>
                    Chat Session {i + 1}
                </button>
            ))}
        </div>

        {/* Settings Footer */}
        <div className="p-4 border-t border-white/5">
            <button className="flex items-center gap-3 text-sm text-slate-500 hover:text-white transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/5">
                <Settings size={16} /> Settings
            </button>
        </div>
      </div>
      {/* --- END SIDEBAR CODE --- */}
      
      {/* Content Layer */}
      <div className="z-10 flex flex-col h-full flex-1">
        
        {/* Header */}
        <header className="p-4 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            {/* closedsidebar */}
            {!isSidebarOpen && (
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-700 rounded-xl blur opacity-70 group-hover:opacity-60 transition duration-500"></div>
                  <img src="xi.png" alt="Verba Logo" className="relative w-12 h-12 object-cover rounded-xl shadow-2xl border border-white/10" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-p-500 to-pink-400 flex items-center gap-2">
                    Verba <Sparkles size={16} className="text-yellow-400 animate-pulse"/>
                  </h1>
                  <p className="text-xs text-slate-400 font-medium tracking-wide">AI SECOND BRAIN v1.0</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area - FIXED SCROLLING */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent no-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-100 transition-opacity duration-700">
                <div className="flex items-center justify-center mb-6">
                  <img src="xi.png" alt="Loading" width={50} height={50} className="drop-shadow-[0_10px_35px_rgba(79,70,229,0.35)] animate-pulse" />
                </div>
                <h2 className="text-6xl font-bold mb-3 animate-gradient-text bg-gradient-to-r from-blue-950  via-blue-100 to-yellow-200 bg-clip-text text-transparent bg-[length:200%_auto] drop-shadow-[0_8px_30px_rgba(79,70,229,0.25)]" style={{ letterSpacing: '-0.02em' }}>
                  Hello, I&apos;m Verba.
                </h2>
                <p className="text-slate-400 max-w-md mb-8">Your personalized AI tutor. Upload documents or ask me anything to get started.</p>
                
                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-3 justify-center max-w-2xl mt-4">
                  <button 
                    onClick={() => setInput("Summarize this PDF for me")}
                    className="px-4 py-2.5 rounded-full border border-white/10 bg-slate-900/30 hover:bg-gradient-to-r hover:from-cyan-500/15 hover:to-blue-500/15 hover:border-transparent text-slate-300 text-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/25"
                  >
                    📄 Summarize this PDF
                  </button>
                  <button 
                    onClick={() => setInput("Explain Quantum Physics in simple terms")}
                    className="px-4 py-2.5 rounded-full border border-white/10 bg-slate-900/30 hover:bg-gradient-to-r hover:from-purple-500/15 hover:to-blue-500/15 hover:border-transparent text-slate-300 text-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/25"
                  >
                    🔬 Explain Quantum Physics
                  </button>
                  <button 
                    onClick={() => setInput("Help me understand Machine Learning")}
                    className="px-4 py-2.5 rounded-full border border-white/10 bg-slate-900/30 hover:bg-gradient-to-r hover:from-pink-500/15 hover:to-purple-500/15 hover:border-transparent text-slate-300 text-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/25"
                  >
                    🤖 Teach me ML
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse animate-slide-in-right" : "animate-slide-in-left"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === "user" ? "bg-gradient-to-br from-blue-500 to-blue-700 shadow-blue-500/40" : "bg-slate-800 border border-slate-700 shadow-cyan-500/30"
                }`}>
                  {msg.role === "user" ? <User size={18} /> : <Bot size={18} className="text-cyan-400" />}
                </div>

                {/* Message Bubble - NOW WITH MARKDOWN SUPPORT & GLASSMORPHISM */}
                <div className={`p-4 rounded-2xl max-w-[85%] shadow-md text-[15px] leading-7 ${
                  msg.role === "user" 
                    ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-500/10" 
                    : "rounded-tl-sm bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 text-slate-200 shadow-xl"
                }`}>
                  {/* THIS IS THE MAGIC FIX FOR LINE BREAKS AND BOLD TEXT */}
                  <ReactMarkdown
                    components={{
                      strong: ({ node, ...props }) => <span className="font-bold text-white" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1" {...props} />,
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");

                        return !inline && match ? (
                          <div className="rounded-xl overflow-hidden my-4 ring-1 ring-blue-500/20 bg-[#0a0a0a] shadow-2xl shadow-blue-500/5 group relative">
                            <div className="flex items-center justify-between px-4 py-2 bg-[#121212] border-b border-white/5">
                              <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                {match[1]}
                              </span>
                            </div>

                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ margin: 0, padding: "1.5rem", background: "transparent", fontSize: "0.85rem", lineHeight: "1.5" }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-slate-800/50 text-slate-200 px-1.5 py-0.5 rounded-md text-sm font-mono ring-1 ring-white/10" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.parts}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                   <Bot size={18} className="text-cyan-400 animate-pulse" />
                 </div>
                 <div className="relative w-16 h-12 flex items-center justify-center">
                   <div className="absolute inset-0 rounded-xl bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 shadow-lg shadow-cyan-500/10" />
                   <div className="orbit-dot bg-blue-400" />
                   <div className="orbit-dot bg-cyan-400 orbit-delay-150" />
                   <div className="orbit-dot bg-pink-400 orbit-delay-300" />
                 </div>
              </div>
            )}
            {/* The invisible div that pulls the scroll down */}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input Area */}
        {/* Input Area - GOOGLE STYLE GLOW */}
        {/* Input Area - GEMINI STYLE (soft cyan→purple glow) */}
        <footer className="p-4 pb-8">
          <div className="max-w-3xl mx-auto relative group">
            
            {/* LAYER 1: The Outer Glow (Blurry Reflection) */}
            {/* CHANGED: via-purple/pink -> via-yellow/orange */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-yellow-500 to-orange-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
            
            {/* LAYER 2: The Moving Gradient Border */}
            {/* CHANGED: via-purple/pink -> via-yellow/orange */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-yellow-400 to-orange-500 animate-gradient-border"></div>

            {/* LAYER 3: The Actual Input Box */}
            <div className="relative flex items-center bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden z-10">
              
              {/* Optional: The Sparkle Icon (Changed to Yellow to match) */}
              <div className="pl-4">
                 <Sparkles size={20} className="text-purple-200 animate-pulse" />
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask Verba regarding your documents..."
                className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none placeholder-slate-500 text-lg font-light"
              />
              
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-3 mr-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
            
          </div>
          <div className="text-center mt-3">
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest opacity-60">
              Powered by Google Gemini • Built for TechSprint
            </p>
          </div>
        </footer>
        
      </div>
    </div>
  );
}



  // const checkSystemHealth = async () => {
  //  alert("Running diagnostics...");
  //   const res = await fetch("/api/health");
  //   const data = await res.json();
  //   alert(JSON.stringify(data, null, 2));
  // };
        