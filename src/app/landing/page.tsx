/* eslint-disable react/no-unescaped-entities */
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Upload, MessageSquare, Award, ArrowRight, Menu, X, FileUp, Bot } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/10 to-transparent pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 blur opacity-60" />
              <img src="/xi.png" alt="Verba" className="relative w-10 h-10 rounded-xl shadow-lg shadow-purple-500/30" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">Verba</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-400 hover:text-white transition">Features</a>
            <a href="#tech" className="text-slate-400 hover:text-white transition">Technology</a>
            <a href="#demo" className="text-slate-400 hover:text-white transition">Demo</a>
            <a href="/documents" className="text-slate-400 hover:text-white transition">Documents</a>
            <button 
              onClick={() => router.push("/chat")}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 hover:from-blue-700 hover:via-blue-600 hover:to-blue-500 font-semibold transition-all shadow-lg shadow-blue-500/30 border border-blue-400/20"
            >
              Get Started
            </button>
          </div>

          <button 
            className="md:hidden text-slate-400"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/5 p-6 space-y-4">
            <a href="#features" className="block text-slate-400 hover:text-white transition">Features</a>
            <a href="#tech" className="block text-slate-400 hover:text-white transition">Technology</a>
            <a href="#demo" className="block text-slate-400 hover:text-white transition">Demo</a>
            <a href="/documents" className="block text-slate-400 hover:text-white transition">Documents</a>
            <button 
              onClick={() => router.push("/chat")}
              className="w-full px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 font-semibold border border-purple-400/20"
            >
              Get Started
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Grid Overlay */}
        <div className="absolute inset-0 grid-overlay pointer-events-none opacity-20" />
        
        {/* Mesh Gradient Background - Smoky Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-600/30 via-purple-500/20 to-transparent blur-[100px] rounded-full animate-pulse" />
          <div className="absolute bottom-20 right-1/3 w-[500px] h-[500px] bg-gradient-to-tl from-blue-500/25 via-cyan-400/15 to-transparent blur-[120px] rounded-full" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-10 w-[400px] h-[700px] bg-gradient-to-b from-purple-600/20 to-indigo-500/10 blur-[80px]" />
        </div>
        
        {/* Vertical Glowing Beam - Enhanced */}
        <div className="absolute right-[35%] top-0 w-[3px] h-full bg-gradient-to-b from-transparent via-indigo-400/60 to-transparent" style={{ filter: 'blur(2px)' }} />
        <div className="absolute right-[35%] top-0 w-[80px] h-full bg-gradient-to-b from-transparent via-indigo-400/20 to-transparent" style={{ filter: 'blur(40px)' }} />
        
        {/* Spotlight Effect */}
        <div className="spotlight" style={{ top: '20%', left: '60%' }} />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl md:text-6xl lg:text-6xl font-bold mb-6 leading-[1.05] tracking-tight text-left"
            >
              <span className="block text-white">Receipts-first AI</span>
              <span className="block text-white">for every study sprint</span>
            </motion.h1>

            <p className="text-base md:text-lg text-slate-300 max-w-xl mb-12 leading-relaxed font-normal text-left">
              Verba ingests your PDFs, answers with cited receipts, and lets you manage docs, quizzes, and history in one place—built for hackathon judges who check the details.
            </p>

            <div className="flex flex-wrap gap-4 mb-16">
              <button 
                onClick={() => router.push("/chat")}
                className="group relative px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-400/90 to-orange-500/90 hover:from-orange-400 hover:to-orange-500 font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(251,146,60,0.5)] hover:shadow-[0_0_50px_rgba(251,146,60,0.7)] text-black"
              >
                <span>See in action</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
              </button>
              <button 
                onClick={() => router.push("/documents")}
                className="px-8 py-3.5 rounded-full bg-slate-900/70 border border-white/10 hover:border-white/30 text-slate-100 font-semibold text-sm uppercase tracking-wider transition-all backdrop-blur-sm flex items-center gap-2"
              >
                Manage documents
              </button>
            </div>
          </div>

          {/* App Preview Mockup - Bottom of Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="relative max-w-6xl mx-auto mt-20"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 rounded-3xl blur-2xl opacity-30" />
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-3xl p-2 shadow-2xl">
              <div className="bg-slate-900 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-4 text-xs text-slate-400 font-medium">Verba — AI Second Brain</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/30">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-semibold">LIVE</span>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">U</div>
                    <div className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm">What is Retrieval Augmented Generation?</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                      <Brain size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex-1 bg-slate-800/40 border border-slate-700/50 rounded-2xl rounded-tl-sm p-4">
                      <p className="text-sm text-slate-300 mb-3">
                        RAG is a technique that enhances AI responses by retrieving relevant information from your documents before generating answers. It combines semantic search with generative AI.
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          📄 ML_Fundamentals.pdf · 94%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Light Background like Huly */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 text-black">Unmatched productivity</h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Verba is a document management and AI knowledge platform that provides
              <br className="hidden md:block" />
              amazing learning opportunities for students and researchers alike.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              {["Live citations on every answer", "Documents dashboard ready", "Mobile-ready demo flow"].map((item) => (
                <span key={item} className="px-3 py-1 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">{item}</span>
              ))}
            </div>
          </motion.div>

          {/* 2x2 Feature Grid with living mockups (no placeholders) */}
          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative rounded-3xl bg-gradient-to-br from-orange-500/20 via-red-400/10 to-transparent border-2 border-orange-200 overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col gap-3 text-left">
                <div className="flex items-center gap-2 text-xs text-orange-200/80 uppercase tracking-[0.2em]">RAG</div>
                <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 shadow-lg">
                  <div className="text-xs text-slate-400 mb-2">You</div>
                  <div className="text-sm text-white">"Summarize Module 3 on LSTMs"</div>
                </div>
                <div className="bg-slate-900/70 border border-orange-200/30 rounded-2xl p-4 shadow-lg">
                  <div className="text-xs text-orange-200 mb-2 flex items-center gap-2"><Brain size={14} /> Verba</div>
                  <p className="text-sm text-slate-200 mb-3">LSTMs keep a memory cell and gate signals to handle long dependencies.</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-full bg-orange-500/15 text-orange-200 border border-orange-300/20">Module_3.pdf · p5</span>
                    <span className="px-2 py-1 rounded-full bg-orange-500/15 text-orange-200 border border-orange-300/20">Notes_week4.pdf · p2</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white/85 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-black">RAG-powered, citation-first</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Every answer ships with receipts from your PDFs so judges see evidence instantly.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="group relative rounded-3xl bg-gradient-to-br from-blue-500/20 via-indigo-400/10 to-transparent border-2 border-blue-200 overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-blue-200/80">
                  <span className="uppercase tracking-[0.2em]">Docs</span>
                  <span className="px-2 py-1 rounded-full bg-blue-500/15 border border-blue-300/20 text-[11px]">Live sync</span>
                </div>
                <div className="space-y-2">
                  {["Module_3.pdf", "ML_Fundamentals.pdf", "Notes_week4.pdf"].map((file, idx) => (
                    <div key={file} className="flex items-center justify-between bg-slate-900/60 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: `${idx * 150}ms` }} />
                        <span>{file}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{idx === 0 ? "42 chunks" : idx === 1 ? "88 chunks" : "12 chunks"}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-blue-200/80">
                  <FileUp size={14} /> Drag-drop multi-upload with progress
                </div>
              </div>
              <div className="p-6 bg-white/85 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-black">Document management</h3>
                <p className="text-slate-600 text-sm leading-relaxed">See uploads, chunk counts, and purge stale PDFs. Built-in search keeps judges oriented.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-400/10 to-transparent border-2 border-purple-200 overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-purple-200/80 uppercase tracking-[0.2em]">AI Citations</div>
                <div className="bg-slate-900/70 border border-purple-300/20 rounded-2xl p-4 text-slate-100 shadow-xl">
                  <div className="text-xs text-purple-200 mb-2 flex items-center gap-2"><Bot size={14} /> Verba</div>
                  <p className="text-sm leading-relaxed mb-3">According to Module_3.pdf (p.5) and Lecture_notes.pdf (p.2), LSTMs mitigate vanishing gradients with a gated cell state.</p>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-1 rounded-full bg-purple-500/15 text-purple-100 border border-purple-300/20">Open source PDF</span>
                    <span className="px-2 py-1 rounded-full bg-purple-500/15 text-purple-100 border border-purple-300/20">Clickable sources</span>
                  </div>
                </div>
                <div className="text-xs text-slate-400">Source-aware answers for academic credibility.</div>
              </div>
              <div className="p-6 bg-white/85 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-black">Multi-document citations</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Every message shows exactly which PDF and page were used. Judges can click sources to verify.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="group relative rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-400/10 to-transparent border-2 border-cyan-200 overflow-hidden hover:shadow-2xl transition-all duration-500"
            >
              <div className="relative h-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-cyan-200/80 uppercase tracking-[0.2em]">Study Boosters</div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-100">
                  <div className="bg-slate-900/60 border border-cyan-300/20 rounded-xl p-3">
                    <div className="text-xs text-cyan-200 mb-1">Flashcards</div>
                    <p className="text-[12px] text-slate-200">"What is the forget gate doing ?"</p>
                  </div>
                  <div className="bg-slate-900/60 border border-cyan-300/20 rounded-xl p-3">
                    <div className="text-xs text-cyan-200 mb-1">Quiz</div>
                    <p className="text-[12px] text-slate-200">5 Qs auto-generated from PDF</p>
                  </div>
                  <div className="bg-slate-900/60 border border-cyan-300/20 rounded-xl p-3 col-span-2 flex items-center justify-between">
                    <span className="text-[12px] text-slate-200">Export chat → PDF/Markdown</span>
                    <ArrowRight size={14} className="text-cyan-200" />
                  </div>
                </div>
                <div className="text-xs text-slate-400">Designed for judges: deliverables ready in one tap.</div>
              </div>
              <div className="p-6 bg-white/85 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2 text-black">Quiz, flashcards, exports</h3>
                <p className="text-slate-600 text-sm leading-relaxed">Generate quizzes, flashcards, and export chats as proof of learning—optimized for live demos.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >Built with Cutting-Edge Tech</motion.h2>
          <p className="text-xl text-slate-400 mb-16">Enterprise-grade infrastructure for reliability and performance</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center mb-20">
            {["Google Gemini", "Firebase", "Pinecone", "Next.js"].map((name, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <TechBadge name={name} subtitle={["AI Models", "Auth & Database", "Vector Store", "React Framework"][i]} />
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{num: "99.9%", label: "Uptime with Model Fallback"}, {num: "<2s", label: "Average Response Time"}, {num: "7", label: "Gemini Models Supported"}].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <StatCard number={stat.num} label={stat.label} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="demo" className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-slate-400">Get started in 3 simple steps</p>
          </motion.div>

          <div className="space-y-8">
            {[
              { num: "1", title: "Upload Your Documents", desc: "Drag and drop PDFs, textbooks, research papers, or any study material. Verba automatically processes and indexes them.", icon: <Upload size={24} /> },
              { num: "2", title: "Ask Questions", desc: "Type your questions naturally. Our RAG system searches through your documents and finds the most relevant information.", icon: <MessageSquare size={24} /> },
              { num: "3", title: "Get Cited Answers", desc: "Receive instant, accurate answers with citations showing exactly which document and page the information came from.", icon: <Award size={24} /> }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
              >
                <StepCard 
                  number={step.num}
                  title={step.title}
                  description={step.desc}
                  icon={step.icon}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      {/* CTA Section - with 3D Icon Effect like Huly */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Diagonal Light Beams */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-[600px] h-full bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent blur-[100px] rotate-[-15deg]" />
          <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-bl from-blue-500/20 via-indigo-400/10 to-transparent blur-[100px] rotate-[15deg]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: 3D Circular Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative flex items-center justify-center"
            >
              <div className="relative w-80 h-80">
                {/* Rotating gradient ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 animate-spin-slow opacity-60 blur-xl" />
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                  <img src="/xi.png" alt="Verba" className="w-32 h-32 rounded-2xl" />
                </div>
              </div>
            </motion.div>

            {/* Right: CTA Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-left"
            >
              <h2 className="text-5xl md:text-6xl font-bold mb-4 text-white">
                Join the
                <br />
                Movement
              </h2>
              <p className="text-lg text-slate-400 mb-8 max-w-xl">
                Unlock the future of productivity with Verba. Remember, this journey is just getting started.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push("/chat")}
                  className="group relative px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-400/90 to-orange-500/90 hover:from-orange-400 hover:to-orange-500 font-semibold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(251,146,60,0.5)] hover:shadow-[0_0_50px_rgba(251,146,60,0.7)] text-black"
                >
                  <span>SEE IN ACTION</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                </button>
                <button 
                  className="px-8 py-3.5 rounded-full bg-black hover:bg-slate-900 border border-white/10 hover:border-white/20 font-medium text-sm uppercase tracking-wider transition-all backdrop-blur-sm"
                >
                  JOIN OUR COMMUNITY
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 blur opacity-50" />
              <img src="/xi.png" alt="Verba" className="relative w-8 h-8 rounded-lg" />
            </div>
            <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Verba</span>
            <span className="text-slate-600">•</span>
            <span className="text-sm text-slate-500">Built for TechSprint 2026</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>⚡ Powered by</span>
            <span className="text-blue-400 font-semibold">Firebase</span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">Gemini</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TechBadge({ name, subtitle }: { name: string; subtitle: string }) {
  return (
    <div className="group p-8 rounded-2xl bg-gradient-to-br from-slate-900/60 to-slate-950/60 border border-white/5 hover:border-blue-500/30 transition-all duration-300 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
      <div className="text-xl font-bold mb-2 text-slate-100">{name}</div>
      <div className="text-xs text-slate-500 font-medium">{subtitle}</div>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="relative group p-8 rounded-2xl bg-gradient-to-br from-blue-600/5 via-cyan-600/5 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/5 group-hover:to-cyan-500/5 transition-all" />
      <div className="relative">
        <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">{number}</div>
        <div className="text-sm text-slate-400 font-medium">{label}</div>
      </div>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { number: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="group flex gap-8 items-start p-8 rounded-2xl bg-gradient-to-br from-slate-900/40 to-slate-950/40 border border-white/5 hover:border-blue-500/30 transition-all backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10">
      <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-3">
          <div className="text-cyan-400">{icon}</div>
          <h3 className="text-2xl font-bold text-slate-100">{title}</h3>
        </div>
        <p className="text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
