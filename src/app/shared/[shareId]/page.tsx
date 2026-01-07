"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bot, User, ExternalLink, AlertCircle, Link2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type SharedChat = {
  shareId: string;
  sessionId: string;
  userId: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    citations?: Array<{ filename: string; page?: number; score?: number }>;
  }>;
  createdAt: { toDate?: () => Date } | null;
  views: number;
};

export default function SharedDocumentPage() {
  const params = useParams();
  const shareId = params?.shareId as string;
  
  const [sharedChat, setSharedChat] = useState<SharedChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedChat = async () => {
      try {
        const docRef = doc(db, "sharedChats", shareId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Shared chat not found.");
          setLoading(false);
          return;
        }

        const data = docSnap.data() as SharedChat;
        setSharedChat(data);

        // Increment view count
        await updateDoc(docRef, {
          views: increment(1),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching shared chat:", err);
        setError("Failed to load shared chat.");
        setLoading(false);
      }
    };

    fetchSharedChat();
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-slate-100">
        <p className="text-sm text-slate-400">Loading shared chat...</p>
      </div>
    );
  }

  if (error || !sharedChat) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-slate-100">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <p className="text-lg text-red-400">{error || "Chat not found"}</p>
          <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300 underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/xi.png" alt="Verba" className="w-10 h-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-white">Shared Chat</h1>
              <p className="text-xs text-slate-400">Powered by Verba</p>
            </div>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm flex items-center gap-2 transition-colors"
          >
            <ExternalLink size={16} />
            Try Verba
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Chat Info */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">{sharedChat.title}</h2>
          <p className="text-sm text-slate-400">
            Shared on {sharedChat.createdAt?.toDate?.()?.toLocaleDateString() || "Unknown"} · 
            {sharedChat.views} {sharedChat.views === 1 ? "view" : "views"}
          </p>
        </div>

        {/* Chat Messages */}
        <div className="space-y-6">
          {sharedChat.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "model" && (
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-cyan-400" />
                </div>
              )}
              
              <div className={`flex-1 max-w-3xl ${msg.role === "user" ? "text-right" : ""}`}>
                <div
                  className={`inline-block px-6 py-4 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                      : "bg-slate-800 border border-slate-700"
                  }`}
                >
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.role === "model" && msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] bg-cyan-500/10 text-cyan-200 border border-cyan-500/30"
                        >
                          <Link2 size={12} />
                          {c.filename}{c.page ? ` · p${c.page}` : ""}
                          {typeof c.score === "number" ? ` · ${(c.score * 100).toFixed(0)}%` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>This chat was shared using <span className="text-blue-400 font-semibold">Verba</span></p>
          <p className="mt-1">An AI-powered Second Brain for your knowledge</p>
        </div>
      </main>
    </div>
  );
}
