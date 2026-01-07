/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Loader2, CheckCircle, FileText, X } from "lucide-react";

export type FileUploadHandle = { 
  openPicker: () => void;
  triggerUpload: () => void;
};

type UploadCallbacks = {
  onUploadStart?: () => void;
  onUploaded?: (info: { fileName: string; chunks?: number; characters?: number; docId?: string; filename?: string }) => void;
  onError?: (message: string) => void;
};

const FileUpload = forwardRef<FileUploadHandle, UploadCallbacks>(function FileUpload(
  { onUploadStart, onUploaded, onError },
  ref
) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedFileName, setProcessedFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => ({
    openPicker: () => fileInputRef.current?.click(),
    triggerUpload: () => fileInputRef.current?.click(),
  }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📄 File selected:", file.name, `(${file.size} bytes)`);

    setSelectedFile(file);
    setUploading(true);
    setStatus("idle");
    onUploadStart?.();

    const formData = new FormData();
    formData.append("file", file);
    // Get userId from auth (we'll pass it as prop)
    const userId = (window as any).__VERBA_USER_ID__;
    console.log("👤 User ID:", userId);
    if (userId) formData.append("userId", userId);

    try {
      console.log("⬆️ Starting upload to /api/ingest...");
      const response = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("📥 Response:", response.status, data);
      
      if (!response.ok) throw new Error(data?.error || "Upload failed");

      setStatus("success");
      setProcessedFileName(file.name);
      onUploaded?.({ 
        fileName: file.name, 
        chunks: data?.chunks, 
        characters: data?.characters,
        docId: data?.docId, // Pass docId to parent for document scoping
        filename: data?.filename
      });
      
    } catch (error) {
      console.error("❌ Upload error:", error);
      setStatus("error");
      setSelectedFile(null);
      onError?.(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setProcessedFileName("");
  };

  return (
    <div className="mt-6 mb-6 space-y-3">
      {/* File Upload Button */}
      <label 
        className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer text-sm transition-all duration-300
          ${uploading 
            ? "border-slate-700 bg-slate-900/30 cursor-not-allowed text-slate-500" 
            : status === "success"
            ? "border-green-500/50 bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-slate-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/25"
            : "border-white/10 bg-slate-900/30 hover:bg-gradient-to-r hover:from-yellow-500/15 hover:to-orange-500/15 hover:border-transparent text-slate-300 hover:scale-105 hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/25"
          }
        `}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing PDF...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Upload Another PDF
          </>
        ) : (
          <>
            📄 Upload PDF
          </>
        )}
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf" 
          className="hidden" 
          onChange={handleFileChange} 
          disabled={uploading}
        />
      </label>

      {/* Selected File Display with X button */}
      {selectedFile && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-sm">
          <FileText className="w-4 h-4 text-orange-400" />
          <span className="text-orange-400 font-medium flex-1 truncate max-w-xs">
            {selectedFile.name}
          </span>
          <button
            onClick={removeFile}
            className="p-1 hover:bg-slate-700/50 rounded-full transition-colors"
            aria-label="Remove file"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {status === "success" && processedFileName && (
        <div className="text-slate-300 text-sm text-center bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          I&apos;ve processed <span className="font-bold text-green-400">{processedFileName}</span>. You can now ask me anything about its content!
        </div>
      )}
      
      {/* Error Message */}
      {status === "error" && (
        <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          Upload failed. Please try again.
        </p>
      )}
    </div>
  );
});

export default FileUpload;