/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FileText, Trash2, Search, ArrowLeft, Loader2 } from "lucide-react";

type Document = {
  filename: string;
  userId: string;
  uploadedAt: string;
  chunks: number;
};

export default function DocumentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) loadDocuments(u.uid);
    });
    return () => unsub();
  }, []);

  const loadDocuments = async (uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents?userId=${uid}`);
      const data = await res.json();
      if (res.ok) setDocuments(data.documents || []);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (filename: string) => {
    if (!user) return;
    if (!confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    
    setDeletingFile(filename);
    try {
      const res = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, filename }),
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.filename !== filename));
      } else {
        alert("Failed to delete document");
      }
    } catch (err) {
      console.error("Delete failed", err);
      alert("Delete failed");
    } finally {
      setDeletingFile(null);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050505] text-slate-100">
        <p className="text-sm text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-0 opacity-20" />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[120px] animate-aurora-1" />
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px] animate-aurora-2" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/chat")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Chat
          </button>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Documents
              </h1>
              <p className="text-slate-400 mt-2">
                Manage your uploaded PDFs and their vector embeddings
              </p>
            </div>
            <div className="flex items-center gap-3">
              <img
                src={user.photoURL || "https://ui-avatars.com/api/?name=V"}
                alt="avatar"
                className="w-10 h-10 rounded-full border border-white/10"
              />
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition"
            />
          </div>
        </div>

        {/* Document Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">
              {searchQuery ? "No documents match your search" : "No documents uploaded yet"}
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-semibold transition-all"
            >
              Upload Your First PDF
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <div
                key={doc.filename}
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-white/5 hover:border-blue-500/30 transition-all backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <FileText className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-100 truncate mb-1">
                      {doc.filename}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-cyan-400 font-semibold">{doc.chunks}</span>
                    <span className="text-slate-500 ml-1">chunks</span>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.filename)}
                    disabled={deletingFile === doc.filename}
                    className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
                    title="Delete document"
                  >
                    {deletingFile === doc.filename ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {documents.length > 0 && (
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl font-bold text-blue-400 mb-2">{documents.length}</div>
              <div className="text-sm text-slate-500">Total Documents</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl font-bold text-cyan-400 mb-2">
                {documents.reduce((sum, d) => sum + d.chunks, 0)}
              </div>
              <div className="text-sm text-slate-500">Total Chunks</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-slate-900/40 border border-white/5">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {documents.length > 0
                  ? new Date(
                      Math.max(...documents.map((d) => new Date(d.uploadedAt).getTime()))
                    ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </div>
              <div className="text-sm text-slate-500">Last Upload</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
