/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PDFViewerProps = {
  filename: string;
  pageNumber?: number;
  highlightText?: string;
  onClose: () => void;
};

export default function PDFViewer({ filename, pageNumber = 1, highlightText, onClose }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [scale, setScale] = useState(0.8);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // Get userId from window global set in chat page
  const userId = typeof window !== 'undefined' ? (window as any).__VERBA_USER_ID__ : null;
  
  // Construct PDF URL from Firebase Storage via API
  const pdfUrl = userId 
    ? `/api/pdf/${encodeURIComponent(filename)}?userId=${userId}`
    : `/api/pdf/${encodeURIComponent(filename)}`;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[600px] z-50 bg-slate-900 shadow-2xl flex flex-col border-l border-slate-700 animate-slide-in-right">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white truncate">{filename}</h2>
            {highlightText && (
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                &quot;{highlightText.substring(0, 60)}...&quot;
              </p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white ml-2 flex-shrink-0"
            aria-label="Close PDF viewer"
          >
            <X size={18} />
          </button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 overflow-auto p-4 flex items-start justify-center bg-slate-800/50">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="text-slate-400 text-sm">Loading PDF...</div>
            }
            error={
              <div className="text-red-400 text-sm">
                Failed to load PDF. Make sure the file exists.
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-2xl"
            />
          </Document>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700 bg-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors text-white"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            
            <span className="text-xs text-slate-300 px-2 min-w-[70px] text-center">
              {currentPage} / {numPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
              disabled={currentPage >= numPages}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed rounded transition-colors text-white"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setScale(Math.max(0.5, scale - 0.2))}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs transition-colors"
            >
              −
            </button>
            <span className="text-xs text-slate-300 px-2 min-w-[45px] text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale(Math.min(1.5, scale + 0.2))}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs transition-colors"
            >
              +
            </button>
          </div>
        </div>
    </div>
  );
}
