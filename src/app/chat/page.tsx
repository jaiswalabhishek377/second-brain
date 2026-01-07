/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, Bot, User, Sparkles, Plus, History, Settings, FileUp, Menu, Image as ImageIcon, X, LogIn, LogOut, Link2, FileText, FileImage, Zap, Download, Share2, Loader2, Database } from "lucide-react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { collection, getDocs, orderBy, query, limit, setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown"; //Import the magic text fixer
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import FileUpload, { FileUploadHandle } from "../component/fileupload";

// Dynamically import PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import("../component/PDFViewer"), { ssr: false });

type Citation = { filename: string; page?: number | null; score?: number; preview?: string };
type ChatMessage = { role: string; parts: string; citations?: Citation[] };
type Toast = { id: number; message: string; type?: "info" | "success" | "error" };

export default function Home() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; title: string; updatedAt?: Date | null }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-flash-lite-latest");
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfToView, setPdfToView] = useState<{ filename: string; page?: number; preview?: string } | null>(null);
  const [uploadingPDF, setUploadingPDF] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null); // Track current document scope
  const [currentDocName, setCurrentDocName] = useState<string | null>(null); // Track document filename for display
  const [searchAllDocs, setSearchAllDocs] = useState(false); // Toggle: search single doc vs all docs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileUploadRef = useRef<FileUploadHandle>(null);

  // FIXED: Auto-scroll to bottom whenever messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addToast = (message: string, type: "info" | "success" | "error" = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      // Set global userId for FileUpload
      if (u) {
        (window as any).__VERBA_USER_ID__ = u.uid;
      } else {
        delete (window as any).__VERBA_USER_ID__;
      }
      if (u) {
        (async () => {
          const list = await loadSessions(u.uid);
          // Start fresh - don't auto-load old sessions
          setMessages([]);
          setCurrentSessionId(null);
        })();
      } else {
        setMessages([]);
        setSessions([]);
        setCurrentSessionId(null);
      }
    });
    return () => unsub();
  }, []);

  const loadSessions = async (uid: string) => {
    const sessionsQuery = query(
      collection(db, `users/${uid}/sessions`),
      orderBy("updatedAt", "desc"),
      limit(10)
    );
    const snap = await getDocs(sessionsQuery);
    const list = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: data?.title || "New Chat",
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : null,
      };
    });
    setSessions(list);
    return list;
  };

  const loadMessages = async (uid: string, sessionId: string) => {
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, `users/${uid}/sessions/${sessionId}/messages`),
        orderBy("timestamp", "asc")
      );
      const snap = await getDocs(q);
      const loaded = snap.docs
        .map((d) => {
          const data = d.data();
          const citations = (data as any)?.citations as Citation[] | undefined;
          return [
            { role: "user", parts: data.userMessage as string },
            { role: "model", parts: data.botMessage as string, citations },
          ];
        })
        .flat();
      setMessages(loaded as any);
      setCurrentSessionId(sessionId);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const createSession = async (title = "New Chat") => {
    if (!user) return null;
    const sessionRef = doc(collection(db, `users/${user.uid}/sessions`));
    await setDoc(sessionRef, {
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setCurrentSessionId(sessionRef.id);
    await loadSessions(user.uid);
    return sessionRef.id;
  };

  const handleNewChat = async () => {
    if (!user) return;
    await createSession("New Chat");
    setMessages([]);
    setCurrentDocId(null); // Clear document scope for fresh chat
    setSearchAllDocs(false); // Reset toggle
  };

  const deleteSession = async (sessionId?: string | null) => {
    if (!user || !sessionId) {
      addToast("No session to delete", "error");
      return;
    }
    setHistoryLoading(true);
    try {
      const messagesCol = collection(db, `users/${user.uid}/sessions/${sessionId}/messages`);
      const msgSnap = await getDocs(messagesCol);
      await Promise.all(msgSnap.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, `users/${user.uid}/sessions/${sessionId}`));
      setMessages([]);
      setCurrentSessionId(null);
      setCurrentDocId(null); // Clear document scope when deleting chat
      setSearchAllDocs(false); // Reset toggle
      await loadSessions(user.uid);
      addToast("Session deleted", "success");
    } catch (err) {
      console.error("Delete session failed", err);
      addToast("Failed to delete session", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectSession = async (sessionId: string) => {
    if (!user) return;
    setMessages([]);
    await loadMessages(user.uid, sessionId);
  };

  const renameSession = async (sessionId: string, newTitle: string) => {
    if (!user || !newTitle.trim()) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/sessions/${sessionId}`), {
        title: newTitle.trim(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s))
      );
      setEditingSession(null);
      addToast("Session renamed", "success");
    } catch (err) {
      console.error("Rename failed", err);
      addToast("Failed to rename", "error");
    }
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImageData(result);
    };
    reader.readAsDataURL(file);
  };

  const openPDFViewer = (citation: Citation) => {
    setPdfToView({
      filename: citation.filename,
      page: citation.page || 1,
      preview: citation.preview
    });
    setPdfViewerOpen(true);
  };

  const exportChatToWord = async () => {
    if (messages.length === 0) {
      addToast("No messages to export", "info");
      return;
    }

    // Dynamically import docx and file-saver to avoid SSR issues
    const { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } = await import('docx');
    const { saveAs } = await import('file-saver');

    // Find the current session title
    const sessionTitle = currentSessionId 
      ? sessions.find(s => s.id === currentSessionId)?.title || "Chat Export"
      : "Chat Export";

    const children: any[] = [
      // Title
      new Paragraph({
        text: sessionTitle,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
      // Export info
      new Paragraph({
        children: [
          new TextRun({
            text: `Exported from Verba on ${new Date().toLocaleString()}`,
            italics: true,
            size: 20,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
      }),
    ];

    // Add messages
    messages.forEach((msg) => {
      const role = msg.role === "user" ? "You" : "Verba AI";
      const roleColor = msg.role === "user" ? "2563EB" : "06B6D4";

      // Role heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: role,
              bold: true,
              size: 28,
              color: roleColor,
            }),
          ],
          spacing: { before: 400, after: 200 },
        })
      );

      // Message content
      children.push(
        new Paragraph({
          text: msg.parts,
          spacing: { after: 200 },
        })
      );

      // Add citations if present
      if (msg.role === "model" && msg.citations && msg.citations.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Sources:",
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );

        msg.citations.forEach((c: Citation) => {
          const citationText = `• ${c.filename}${c.page ? ` (Page ${c.page})` : ""}${
            c.score ? ` - Relevance: ${(c.score * 100).toFixed(0)}%` : ""
          }`;
          children.push(
            new Paragraph({
              text: citationText,
              spacing: { after: 50 },
              indent: { left: 400 },
            })
          );
        });
      }

      // Separator
      children.push(
        new Paragraph({
          text: "━".repeat(50),
          spacing: { before: 200, after: 200 },
        })
      );
    });

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: children,
        },
      ],
    });

    // Generate and download
    try {
      const blob = await Packer.toBlob(doc);
      const filename = `${sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.docx`;
      saveAs(blob, filename);
      addToast("Chat exported to Word! 📄", "success");
    } catch (error) {
      console.error("Export failed:", error);
      addToast("Export failed", "error");
    }
  };

  const shareChat = async () => {
    if (messages.length === 0 || !user || !currentSessionId) {
      addToast("No chat to share", "info");
      return;
    }

    try {
      const sessionTitle = sessions.find(s => s.id === currentSessionId)?.title || "Untitled Chat";
      
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionId: currentSessionId,
          userId: user.uid,
          title: sessionTitle,
          messages: messages.map(m => ({
            role: m.role,
            content: m.parts,
            citations: m.citations
          }))
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        await navigator.clipboard.writeText(data.shareUrl);
        addToast("Share link copied to clipboard! 🔗", "success");
      } else {
        addToast("Failed to create share link", "error");
      }
    } catch (error) {
      console.error("Share failed:", error);
      addToast("Share failed", "error");
    }
  };

  // Handle chat submission using non-streaming endpoint
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !imageData) return;
    if (!user) return;

    const userMessage = input || (imageData ? "(Image uploaded)" : "");
    setInput("");
    setIsLoading(true);

    // Create session if needed
    let activeSession = currentSessionId;
    if (!activeSession) {
      activeSession = (await createSession(userMessage.slice(0, 60) || "New Chat")) || null;
      setCurrentSessionId(activeSession);
    }

    // Add user message
    const userMsg: ChatMessage = { role: "user", parts: userMessage };
    setMessages(prev => [...prev, userMsg]);

    try {
      // Build message history for API
      const history = [...messages, userMsg].slice(-8).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.parts || "" }],
      }));

      // Make request to non-streaming endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history,
          userId: user.uid,
          model: selectedModel,
          sessionId: activeSession,
          imageData,
          docId: currentDocId, // Pass current document ID for scoped search
          searchAllDocs, // Pass toggle state
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error || `API error: ${response.status}`);
      }

      const data = await response.json();

      const botMsg: ChatMessage = {
        role: "model",
        parts: data.reply || "",
        citations: data.citations || [],
      };
      setMessages((prev) => [...prev, botMsg]);

      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
      }

      if (botMsg.citations && botMsg.citations.length > 0) {
        addToast(`Cited ${botMsg.citations.length} source${botMsg.citations.length > 1 ? "s" : ""}`, "success");
      }
    } catch (error) {
      console.error("Chat failed:", error);
      addToast("Sorry, something went wrong 😞", "error");
    } finally {
      setIsLoading(false);
      setImageData(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-slate-100">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative flex items-center justify-center h-screen bg-[#050505] text-slate-100 overflow-hidden">
        {/* ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-24 top-10 w-72 h-72 bg-blue-500/20 blur-[110px]" />
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-amber-400/15 blur-[120px]" />
        </div>

        <div className="relative bg-[#0b0b0b]/80 border border-white/10 rounded-3xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] w-[380px] text-center backdrop-blur-xl">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-blue-500/30 via-cyan-400/20 to-amber-400/25 blur-2xl" />
              <img src="xi.png" alt="Verba" className="relative w-14 h-14 rounded-2xl shadow-lg shadow-blue-500/30" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Welcome to Verba</h1>
              <p className="text-sm text-slate-400 mt-1">Sign in to sync your chats across sessions.</p>
            </div>
          </div>

          <button
            onClick={() => signInWithPopup(auth, googleProvider)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25"
          >
            <LogIn size={18} /> Continue with Google
          </button>

          <div className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5">⚡ Powered by Firebase</span>
          </div>
        </div>
      </div>
    );
  }

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
      
      {/* Main Content Area - Adjust width when PDF viewer is open */}
      <div className={`flex-1 flex transition-all duration-300 ${pdfViewerOpen ? 'mr-[600px]' : ''}`}>
      
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
              onClick={handleNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-500 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-900/20 group"
            >
                <Plus size={18} /> <span className="font-medium text-sm">New Chat</span>
            </button>
            
            <button 
              onClick={() => fileUploadRef.current?.openPicker()}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all border border-white/5 hover:border-white/10 group"
            >
              <FileUp size={18} className="text-purple-400 group-hover:scale-110 transition-transform"/> 
              <span className="font-medium text-sm">Upload PDF</span>
            </button>
            
            <button 
              onClick={() => router.push("/documents")}
              className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl transition-all border border-white/5 hover:border-white/10 group"
            >
              <FileText size={18} className="text-cyan-400 group-hover:scale-110 transition-transform"/> 
              <span className="font-medium text-sm">Documents</span>
            </button>
        </div>

        {/* Recent History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-2 mb-2">Recent</div>
            {sessions.length === 0 && (
              <div className="text-slate-600 text-sm px-3">No chats yet</div>
            )}
            {sessions.map((s) => (
                <div key={s.id} className="group">
                  {editingSession === s.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameSession(s.id, editTitle);
                        if (e.key === "Escape") setEditingSession(null);
                      }}
                      onBlur={() => {
                        if (editTitle.trim()) renameSession(s.id, editTitle);
                        else setEditingSession(null);
                      }}
                      autoFocus
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-blue-500/50 text-slate-100 text-sm focus:outline-none"
                    />
                  ) : (
                    <div className="flex items-center gap-1 group/item">
                      <button 
                        onClick={() => handleSelectSession(s.id)}
                        className={`flex-1 text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate flex items-center gap-2 ${
                          currentSessionId === s.id ? "bg-white/5 text-slate-100" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                      >
                          <History size={14} className="opacity-70"/>
                          {s.title}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSession(s.id);
                          setEditTitle(s.title);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                        title="Rename"
                      >
                        <Settings size={14} />
                      </button>
                    </div>
                  )}
                </div>
            ))}
        </div>

        {/* Settings Footer */}
        <div className="p-4 border-t border-white/5">
            <button 
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-3 text-sm text-slate-500 hover:text-white transition-colors w-full px-2 py-2 rounded-lg hover:bg-white/5"
            >
                <Settings size={16} /> Settings
            </button>
        </div>
      </div>
      {/* --- END SIDEBAR CODE --- */}
      
      {/* Content Layer */}
      <div className="z-10 flex flex-col h-full flex-1">
        
        {/* Header */}
        <header className="p-4 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4 justify-between">
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

            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden md:flex items-center gap-2 mr-2">
                <button
                  onClick={shareChat}
                  disabled={messages.length === 0}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-green-900/40 text-green-200 text-xs border border-green-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Share chat conversation"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={exportChatToWord}
                  disabled={messages.length === 0}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-blue-900/40 text-blue-200 text-xs border border-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Export chat to Word document"
                >
                  <Download size={14} />
                  Export
                </button>
                <button
                  onClick={() => deleteSession(currentSessionId)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-red-900/40 text-red-200 text-xs border border-red-500/30"
                >
                  Delete
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-200 font-semibold">{user.displayName || "User"}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <img src={user.photoURL || "https://ui-avatars.com/api/?name=V"} alt="avatar" className="w-10 h-10 rounded-full border border-white/10" />
              <button
                onClick={() => signOut(auth)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Chat Area - FIXED SCROLLING */}
        <main className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-transparent no-scrollbar">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {historyLoading && (
              <div className="text-center text-xs text-slate-500">Loading chat...</div>
            )}
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
                <div className="mt-4 flex justify-center">
                  <FileUpload
                    ref={fileUploadRef}
                    onUploadStart={() => setUploadingPDF(true)}
                    onUploaded={(info: any) => {
                      setUploadingPDF(false);
                      // Store docId and filename from upload to scope future queries to this document
                      if (info.docId) {
                        setCurrentDocId(info.docId);
                        setCurrentDocName(info.filename || info.fileName); // Store filename for display
                        console.log(`Document uploaded with ID: ${info.docId}, Name: ${info.filename || info.fileName}`);
                      }
                      addToast(`Embedded ${info.fileName}${info.chunks ? ` (${info.chunks} chunks)` : ""}`, "success");
                    }}
                    onError={(msg) => {
                      setUploadingPDF(false);
                      addToast(msg, "error");
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* Hidden FileUpload for menu trigger when messages exist */}
            {messages.length > 0 && (
              <div className="hidden">
                <FileUpload
                  ref={fileUploadRef}
                  onUploadStart={() => setUploadingPDF(true)}
                  onUploaded={(info: any) => {
                    setUploadingPDF(false);
                    // Store docId and filename from upload to scope future queries to this document
                    if (info.docId) {
                      setCurrentDocId(info.docId);
                      setCurrentDocName(info.filename || info.fileName); // Store filename for display
                      console.log(`Document uploaded with ID: ${info.docId}, Name: ${info.filename || info.fileName}`);
                    }
                    addToast(`Embedded ${info.fileName}${info.chunks ? ` (${info.chunks} chunks)` : ""}`, "success");
                  }}
                  onError={(msg) => {
                    setUploadingPDF(false);
                    addToast(msg, "error");
                  }}
                />
              </div>
            )}

            {/* Render messages */}
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
                  {msg.role === "model" && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.citations.map((c: Citation, idx: number) => (
                        <button
                          key={`${c.filename}-${idx}`}
                          onClick={() => openPDFViewer(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer"
                          title={c.preview ? `Click to view: ${c.preview}` : "Click to view PDF"}
                        >
                          <Link2 size={12} />
                          {c.filename}{c.page ? ` · p${c.page}` : ""}
                          {typeof c.score === "number" ? ` · ${(c.score * 100).toFixed(0)}%` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
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
        <footer className="p-2 sm:p-4 pb-4 sm:pb-8">
          <div className="max-w-3xl mx-auto space-y-3">
            
            {/* Document Scope Toggle - Show OUTSIDE the input gradient container */}
            {currentDocId && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Database size={14} className={searchAllDocs ? "text-blue-400" : "text-green-400"} />
                    <span className="text-[11px] text-slate-400 uppercase tracking-wide">
                      {searchAllDocs ? "All Documents" : "Single Document"}
                    </span>
                  </div>
                  {currentDocName && !searchAllDocs && (
                    <div className="flex items-center gap-1.5 pl-5">
                      <FileText size={12} className="text-slate-500" />
                      <span className="text-xs text-slate-300 truncate font-medium">
                        {currentDocName}
                      </span>
                    </div>
                  )}
                  {searchAllDocs && (
                    <span className="text-xs text-slate-400 pl-5">Searching across all uploads</span>
                  )}
                </div>
                <button
                  onClick={() => setSearchAllDocs(!searchAllDocs)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    searchAllDocs ? "bg-blue-600" : "bg-slate-600"
                  }`}
                  title={searchAllDocs ? "Switch to single document mode" : "Search all documents"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      searchAllDocs ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            )}
            
            <div className="relative group">
            
            {/* LAYER 1: The Outer Glow (Blurry Reflection) - Reduced on mobile */}
            {/* CHANGED: via-purple/pink -> via-yellow/orange */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-yellow-500 to-orange-600 rounded-2xl blur-lg opacity-20 sm:opacity-30 group-hover:opacity-80 transition duration-1000 group-hover:duration-200"></div>
            
            {/* LAYER 2: The Moving Gradient Border */}
            {/* CHANGED: via-purple/pink -> via-yellow/orange */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-500 via-yellow-400 to-orange-500 animate-gradient-border"></div>

            {/* + Menu Dropdown - Positioned outside overflow-hidden container */}
            {showUploadMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-[60]"
                  onClick={() => setShowUploadMenu(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute bottom-[calc(100%+0.5rem)] right-4 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-[70] overflow-hidden">
                  {/* UplUploadingPDF(true);
                      setoad PDF */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowUploadMenu(false);
                      setTimeout(() => {
                        fileUploadRef.current?.triggerUpload();
                      }, 50);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left text-white"
                  >
                    <FileUp size={18} className="text-blue-400" />
                    <span className="text-sm font-medium">Upload PDF</span>
                  </button>
                  
                  {/* Upload Image */}
                  <label className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors cursor-pointer text-white">
                    <FileImage size={18} className="text-purple-400" />
                    <span className="text-sm font-medium">Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        handleImageSelect(e.target.files?.[0] || null);
                        setShowUploadMenu(false);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  
                  {/* Generate Quiz */}
                  <button
                    onClick={() => {
                      setInput("Generate a 5-question quiz with multiple choice answers based on my uploaded documents. Include the correct answers at the end.");
                      setShowUploadMenu(false);
                      // Auto-submit the quiz request
                      setTimeout(() => {
                        handleChatSubmit({ preventDefault: () => {} } as any);
                      }, 100);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left text-white"
                  >
                    <Zap size={18} className="text-yellow-400" />
                    <span className="text-sm font-medium">Generate Quiz</span>
                  </button>
                </div>
              </>
            )}

            {/* LAYER 3: The Actual Input Box */}
            <div className="relative flex items-center bg-[#0a0a0a] rounded-2xl shadow-2xl overflow-hidden z-10">
              
              {/* Optional: The Sparkle Icon (Changed to Yellow to match) */}
              <div className="pl-2 sm:pl-4">
                 <Sparkles size={18} className="text-purple-200 animate-pulse hidden sm:block" />
              </div>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(e as any);
                  }
                }}
                placeholder="Ask Verba regarding your documents..."
                className="w-full bg-transparent border-none text-white px-3 sm:px-4 py-3 sm:py-4 focus:outline-none placeholder-slate-500 text-base sm:text-lg font-light"
              />

              {/* + Menu for Upload Options */}
              <button
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className="p-2 sm:p-3 cursor-pointer text-blue-300 hover:text-blue-100 transition-all flex items-center justify-center min-w-[44px]"
                title="Add content"
              >
                <Plus size={20} />
              </button>
              
              {/* PDF Processing Indicator */}
              {uploadingPDF && (
                <div className="flex items-center gap-2 pr-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-xs text-blue-300">Processing PDF...</span>
                  </div>
                </div>
              )}
              
              {imageData && (
                <div className="flex items-center gap-2 pr-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border border-white/10 bg-slate-800">
                    <img src={imageData} alt="preview" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => setImageData(null)}
                    className="text-slate-400 hover:text-white p-1 min-w-[44px] flex items-center justify-center"
                    aria-label="Remove image"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleChatSubmit(e as any);
                }}
                disabled={(!input.trim() && !imageData) || isLoading}
                className="p-2 sm:p-3 mr-1 sm:mr-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95 min-w-[44px] flex items-center justify-center"
              >
                <Send size={20} />
              </button>
            </div>
            
            </div>
          </div>
          <div className="text-center mt-2 sm:mt-3">
            <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-widest opacity-60">
              Powered by Google Gemini • Built for TechSprint
            </p>
          </div>
        </footer>
        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-xl shadow-lg border text-sm backdrop-blur-md ${
                t.type === "success"
                  ? "bg-green-500/10 border-green-400/30 text-green-100"
                  : t.type === "error"
                  ? "bg-red-500/10 border-red-400/30 text-red-100"
                  : "bg-slate-800/70 border-white/10 text-slate-100"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative bg-[#0b0b0b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <button
                onClick={() => setShowSettings(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-3">AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500/50 transition"
                  >
                    <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-flash-latest">Gemini Flash (Latest)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-pro-latest">Gemini Pro (Latest)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">Choose which Gemini model to use for responses</p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button
                    onClick={() => {
                      if (confirm("Clear all context for this session? This will start fresh but keep your uploaded PDFs.")) {
                        setMessages([]);
                        setCurrentSessionId(null);
                        addToast("Context cleared", "info");
                        setShowSettings(false);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 hover:border-white/20 transition"
                  >
                    Clear Current Context
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* PDF Viewer Modal */}
        {pdfViewerOpen && pdfToView && (
          <PDFViewer
            filename={pdfToView.filename}
            pageNumber={pdfToView.page}
            highlightText={pdfToView.preview}
            onClose={() => {
              setPdfViewerOpen(false);
              setPdfToView(null);
            }}
          />
        )}
        
      </div>
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
        