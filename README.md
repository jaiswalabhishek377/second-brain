# 🎯 VERBA - COMPLETE PROJECT DOCUMENTATION

## 📋 Project Overview

**Verba** is an AI-powered **Second Brain** - a RAG (Retrieval Augmented Generation) system that allows students to upload PDFs, chat with their documents, and receive accurate answers with citations. Built for TechSprint 2026 hackathon.

**Tagline:** "Receipts-first AI for every study sprint"

---

## 🏗️ Architecture & Tech Stack

### **Frontend**
- **Framework:** Next.js 16.1.1 (App Router)
- **React:** 19.2.3
- **TypeScript:** Full type safety
- **Styling:** Tailwind CSS 4.0 with custom gradients
- **Animations:** Framer Motion 12.23.26
- **Icons:** Lucide React
- **Markdown Rendering:** react-markdown with syntax highlighting (react-syntax-highlighter)
- **PDF Viewing:** react-pdf (pdfjs-dist 5.4.530)
- **Document Export:** docx + file-saver

### **Backend & APIs**
- **API Routes:** Next.js API routes (TypeScript)
- **AI Model:** Google Gemini (multiple models with fallback)
  - gemini-2.0-flash-exp
  - gemini-2.0-flash
  - gemini-flash-latest
  - gemini-2.5-pro
  - gemini-pro-latest
- **Embeddings:** Google Generative AI Embeddings (text-embedding-004)
- **Vector Database:** Pinecone (768-dimensional vectors)
- **Authentication:** Firebase Auth (Google Sign-In)
- **Database:** Firestore (chat history, sessions)
- **Storage:** Cloudinary (PDF storage)
- **PDF Processing:** LangChain + pdf-parse

### **Key Libraries**
```json
{
  "@google/generative-ai": "^0.24.1",
  "@langchain/google-genai": "^2.1.3",
  "@langchain/pinecone": "^1.0.1",
  "@pinecone-database/pinecone": "^5.1.2",
  "firebase": "^12.7.0",
  "cloudinary": "^2.5.1",
  "langchain": "^1.2.3"
}
```

---

## 🎨 Pages & Routes

### **1. Landing Page** (`/` → `/landing/page.tsx`)
**Purpose:** Marketing page showcasing features

**Features:**
- Animated hero section with glassmorphism design
- Smoky mesh gradient backgrounds
- 4-feature grid with living mockups:
  1. RAG-powered citations
  2. Document management dashboard
  3. Multi-document citations
  4. Quiz/flashcard/export tools
- Tech stack badges (Gemini, Firebase, Pinecone, Next.js)
- Statistics (99.9% uptime, <2s response, 7 models)
- How it works (3 steps)
- 3D circular icon CTA section
- Fully responsive mobile design

**Visual Style:**
- Dark background (#050505)
- Aurora animations (blue/purple/pink gradients)
- Vertical glowing beams
- Spotlight effects
- Orange-to-blue gradient accents (matching 2024 trends)

---

### **2. Chat Page** (`/chat/page.tsx`)
**Purpose:** Main application - AI chat with RAG

#### **UI Components:**

##### **Sidebar** (Collapsible)
- Logo + "Verba" branding
- New Chat button
- Upload PDF button
- Documents button (routes to /documents)
- Recent chat history (last 10 sessions)
- Double-click to rename sessions
- Settings panel access

##### **Header**
- Menu toggle (mobile/sidebar collapsed)
- Verba logo + version badge
- Share chat button (generates shareable link)
- Export to Word button
- Delete session button
- User avatar + display name
- Logout button

##### **Chat Area**
- Welcome screen with:
  - Animated Verba logo
  - Gradient "Hello, I'm Verba" text
  - 3 suggestion chips
  - File upload component
- Message bubbles:
  - User messages (blue gradient, right-aligned)
  - AI messages (glassmorphism, left-aligned)
  - **Markdown support** (bold, lists, code blocks)
  - **Syntax highlighting** (vscDarkPlus theme)
  - Citation chips (clickable, show PDF + page + relevance)
- Auto-scroll to bottom
- Loading animation (3 orbit dots)

##### **Input Area**
- **Animated gradient border** (blue → yellow → orange)
- Sparkle icon
- Text input with multi-line support
- **+ Menu button** with dropdown:
  - Upload PDF
  - Upload Image
  - Generate Quiz
- Image preview (removable)
- PDF processing indicator
- Send button
- Powered by badge

##### **Document Scope Toggle** (Conditional)
- Shows when a document is loaded
- Toggle between:
  - **Single Document** (search current PDF only)
  - **All Documents** (search all uploaded PDFs)
- Displays current document name
- Database icon with color coding

##### **Settings Modal**
- Model selector (5 Gemini models)
- Clear context button
- Done button

##### **PDF Viewer** (Slide-in Panel)
- Opens on citation click
- 600px width, right-side panel
- PDF.js rendering with page navigation
- Shows filename, page number, preview text
- Zoom controls
- Close button
- Text layer enabled for searching

##### **Toasts** (Top-right)
- Success (green)
- Error (red)
- Info (slate)
- 4-second auto-dismiss
- Glassmorphism design

---

### **3. Documents Page** (`/documents/page.tsx`)
**Purpose:** Manage uploaded PDFs

**Features:**
- Header with "Back to Chat" button
- Search bar (filter documents by name)
- Grid layout (3 columns on desktop)
- Each document card shows:
  - PDF icon with blue gradient
  - Filename (truncated)
  - Upload date (formatted)
  - Chunk count
  - Delete button (with confirmation)
- Loading state (spinner)
- Empty state (with "Upload Your First PDF" CTA)
- Real-time updates after deletion
- Background: aurora animations + grid pattern

**Data Source:**
- Fetches from `/api/documents?userId={uid}`
- Queries Pinecone metadata (groups by filename)

---

### **4. Shared Chat Page** (`/shared/[shareId]/page.tsx`)
**Purpose:** View shared chat conversations (read-only)

**Features:**
- Fetches from Firestore `sharedChats` collection
- Shows:
  - Chat title
  - All messages (user + bot)
  - Citations (clickable)
  - View count (incremented on visit)
  - Created date
- "Try Verba" CTA button
- Error state for invalid/missing links
- Public access (no auth required)

---

## 🔌 API Routes

### **1. `/api/ingest` (POST)**
**Purpose:** Upload and embed PDFs into Pinecone

**Flow:**
1. Receive PDF file + userId
2. Convert to Blob
3. **Upload to Cloudinary** (raw file storage)
4. **Extract text** using LangChain's PDFLoader
5. **Chunk text** (RecursiveCharacterTextSplitter: 1000 chars, 200 overlap)
6. Generate unique `docId` (32-char hex)
7. Add metadata to each chunk:
   - `docId` (document identifier)
   - `filename` (sanitized)
   - `originalFilename`
   - `userId` (for isolation)
   - `uploadedAt` (timestamp)
8. **Generate embeddings** (Google text-embedding-004)
9. **Batch upload to Pinecone** (10 chunks/batch, 2s delay)
10. Return: `{ docId, chunks, characters, filename }`

**Key Features:**
- Multi-tenant isolation (userId filter)
- Rate limiting (batch processing)
- Error handling (quota checks)
- Embedding API test before processing

---

### **2. `/api/chat` (POST)**
**Purpose:** Generate AI responses with RAG

**Input:**
```typescript
{
  message: string,
  history: Array<{ role, parts }>,
  userId: string,
  sessionId?: string,
  model?: string, // preferred Gemini model
  imageData?: string, // base64 image
  docId?: string, // for single-doc scope
  searchAllDocs?: boolean // toggle
}
```

**Flow:**

1. **Rate limiting** (1 req/2s per IP)

2. **RAG Query** (if no image):
   - Build Pinecone filter:
     - `searchAllDocs=true` → `{ userId }`
     - `searchAllDocs=false` → `{ userId, docId }`
   - Query top 8 chunks (similarity search)
   - Filter by relevance threshold (0.45)
   - Sort by score + recency
   - Keep top 3 results
   - **Smart gating:** Only use RAG if max score > 0.41

3. **Build context:**
   ```
   📚 Relevant excerpts from your documents:
   [Source 1: filename.pdf · p5 | relevance 94%]
   <chunk content>
   ---
   [Source 2: ...]
   ```

4. **Gemini request:**
   - Try models with automatic fallback
   - If image: use multimodal vision
   - If text: use chat with history
   - System instruction includes RAG context

5. **Save to Firestore:**
   - Create/update session
   - Add message to `users/{uid}/sessions/{sid}/messages`
   - Store citations

6. **Return:**
   ```json
   {
     "reply": "AI response text",
     "citations": [
       { "filename", "page", "score", "preview" }
     ],
     "sessionId": "..."
   }
   ```

**Key Features:**
- **Document-scoped RAG** (Option A: single doc, Option B: all docs)
- **Smart RAG gating** (don't cite low-relevance)
- **Multi-model fallback** (5 Gemini models)
- **Multimodal vision** (image understanding)
- **Session persistence** (Firestore)
- **Citation transparency** (page + score)

---

### **3. `/api/documents` (GET, DELETE)**

#### **GET `/api/documents?userId={uid}`**
**Purpose:** List all user's uploaded PDFs

**Flow:**
1. Query Pinecone with dummy vector + userId filter
2. Fetch top 10,000 vectors (to get all user docs)
3. Group by `filename` (aggregate chunk counts)
4. Sort by `uploadedAt` (newest first)
5. Return: `{ documents: Array<{ filename, uploadedAt, chunks }> }`

#### **DELETE `/api/documents`**
**Purpose:** Delete a document from Pinecone

**Input:** `{ userId, filename }`

**Flow:**
1. Query all vector IDs matching userId + filename
2. Delete all vectors (batch deleteMany)
3. Return: `{ success, deleted: count }`

---

### **4. `/api/share` (POST)**
**Purpose:** Create shareable chat link

**Input:**
```json
{
  "sessionId": "...",
  "userId": "...",
  "title": "Chat Title",
  "messages": [...]
}
```

**Flow:**
1. Generate unique `shareId` (nanoid 10 chars)
2. Store in Firestore `sharedChats/{shareId}`
3. Return: `{ shareId, shareUrl }`

**URL format:** `https://verba.app/shared/{shareId}`

---

### **5. `/api/pdf/[filename]` (GET)**
**Purpose:** Serve PDF files for viewing

**Flow:**
1. Get filename from route params
2. Get userId from query string
3. Fetch from Cloudinary or Firebase Storage
4. Return PDF binary with proper headers

---

### **6. `/api/health` (GET)**
**Purpose:** System diagnostics

**Returns:**
```json
{
  "status": "ok",
  "timestamp": "...",
  "pinecone": "connected",
  "firebase": "initialized"
}
```

---

## 🎯 Core Features Implemented

### **1. RAG (Retrieval Augmented Generation)**
- ✅ PDF upload → text extraction → chunking → embedding
- ✅ Semantic search with Pinecone
- ✅ Context injection into Gemini prompts
- ✅ **Document-scoped search** (single doc vs all docs)
- ✅ **Smart RAG gating** (only cite when relevant >55%)
- ✅ **Relevance scoring** (show % in citations)
- ✅ **Multi-document support** (toggle between scopes)

### **2. Citations & Transparency**
- ✅ Every AI answer includes sources
- ✅ Citations show: filename + page number + relevance score
- ✅ Click citation → open PDF viewer at exact page
- ✅ Preview text (first 180 chars of chunk)
- ✅ Don't fabricate sources (RAG gating)

### **3. Multi-User Isolation**
- ✅ Firebase Authentication (Google Sign-In)
- ✅ User-scoped Pinecone queries (`userId` filter)
- ✅ User-scoped Firestore collections
- ✅ Each user only sees their own docs/chats

### **4. Session Management**
- ✅ Create new chat sessions
- ✅ Rename sessions (double-click)
- ✅ Delete sessions (with confirmation)
- ✅ Load session history (last 10)
- ✅ Auto-create session on first message
- ✅ Persist to Firestore

### **5. Document Management**
- ✅ Upload PDFs (with progress indicator)
- ✅ View all uploaded documents
- ✅ Search documents by name
- ✅ See upload date + chunk count
- ✅ Delete documents (remove from Pinecone)
- ✅ Document scope toggle (single vs all)

### **6. AI Model Switching**
- ✅ 5 Gemini models available
- ✅ Settings panel to change model
- ✅ Automatic fallback if model fails
- ✅ Models:
  - gemini-2.0-flash-exp
  - gemini-2.0-flash
  - gemini-flash-latest
  - gemini-2.5-pro
  - gemini-pro-latest

### **7. Multimodal Vision**
- ✅ Upload images (PNG, JPG, etc.)
- ✅ Base64 encoding
- ✅ Gemini vision API (image understanding)
- ✅ Ask questions about images
- ✅ Image preview in chat

### **8. Export & Sharing**
- ✅ **Export chat to Word** (.docx)
  - Formatted with headings
  - Includes citations
  - Timestamps
  - Custom filename
- ✅ **Share chat** (generate public link)
  - Shareable URL
  - Read-only view
  - View counter
  - Copy to clipboard

### **9. Quiz Generation**
- ✅ "Generate Quiz" button
- ✅ Auto-generates 5 MCQ questions from documents
- ✅ Includes correct answers
- ✅ Can be exported

### **10. PDF Viewer**
- ✅ In-app PDF rendering (react-pdf)
- ✅ Slide-in side panel (600px)
- ✅ Page navigation
- ✅ Zoom controls
- ✅ Highlight preview text
- ✅ Jump to specific page from citation

### **11. UI/UX Polish**
- ✅ **Markdown rendering** (bold, lists, code blocks)
- ✅ **Syntax highlighting** (VSCode Dark+ theme)
- ✅ **Glassmorphism** (backdrop blur, transparent layers)
- ✅ **Aurora animations** (floating gradient orbs)
- ✅ **Gradient borders** (animated border animation)
- ✅ **Auto-scroll** to latest message
- ✅ **Toast notifications** (success/error/info)
- ✅ **Loading animations** (orbit dots, spinners)
- ✅ **Responsive design** (mobile-optimized)
- ✅ **Touch-friendly** (44px tap targets)
- ✅ **Suggestion chips** (quick prompts)

### **12. Landing Page**
- ✅ Hero section with animated gradients
- ✅ Feature grid with mockups
- ✅ Tech stack showcase
- ✅ How it works section
- ✅ CTA section with 3D icon
- ✅ Footer
- ✅ Mobile responsive

---

## 🔒 Security & Data Isolation

### **Multi-Tenant Architecture**
1. **Firebase Auth:**
   - Google Sign-In only
   - User UID stored globally
   - Passed to all API requests

2. **Pinecone Isolation:**
   - Every vector has `userId` metadata
   - All queries include `{ userId: { $eq: uid } }` filter
   - Legacy docs without userId → fallback query

3. **Firestore Isolation:**
   - Path: `users/{userId}/sessions/{sessionId}/messages`
   - User can only access their own data
   - Firebase rules should enforce this

4. **Cloudinary Isolation:**
   - PDFs stored in: `pdfs/{userId}/{filename}`
   - Access via API route (can add auth check)

---

## 📊 Data Flow Examples

### **Example 1: Upload PDF**
```
User → FileUpload component
  → POST /api/ingest (FormData)
    → PDFLoader extracts text
    → Split into chunks (1000 chars)
    → Generate docId
    → Embed with Google (768-dim vectors)
    → Upload to Pinecone (batch)
    → Upload PDF to Cloudinary
  ← Response: { docId, chunks, filename }
→ Frontend stores docId + filename
→ Toast: "Embedded Module_3.pdf (42 chunks)"
```

### **Example 2: Ask Question (Single Doc)**
```
User types: "What is backpropagation?"
  → Chat component
    → POST /api/chat
      → Pinecone query: { userId, docId }
      → Get top 3 relevant chunks
      → Build context with citations
      → Send to Gemini with history
      → Gemini responds with answer
      → Save to Firestore
    ← Response: { reply, citations }
  → Render AI message with citation chips
  → Toast: "Cited 2 sources"
```

### **Example 3: View PDF Citation**
```
User clicks citation: "Module_3.pdf · p5"
  → openPDFViewer({ filename, page: 5, preview })
  → PDFViewer component opens
    → Fetch PDF from /api/pdf/Module_3.pdf?userId=...
    → PDFjs renders page 5
    → Highlight preview text (future enhancement)
  → User browses PDF
  → Close button → panel slides out
```

### **Example 4: Toggle Search Mode**
```
User uploads Module_3.pdf → docId saved
→ Toggle shows: "SINGLE DOCUMENT · Module_3.pdf"
→ searchAllDocs = false

User clicks toggle
→ Toggle shows: "ALL DOCUMENTS · Searching across all uploads"
→ searchAllDocs = true

Next question searches ALL user's PDFs
```

---

## 🎨 Design System

### **Color Palette**
- **Background:** #050505 (near-black)
- **Cards:** #0a0a0a (dark slate)
- **Borders:** white/5 to white/20 (subtle)
- **Primary:** Blue 400-600 (blue gradient)
- **Accent:** Cyan 400-500, Purple 400-600
- **Success:** Green 400-500
- **Error:** Red 400-500
- **Warning:** Yellow/Orange 400-500

### **Gradients**
- **Blue to Cyan:** Primary CTAs
- **Blue to Purple:** Secondary accents
- **Orange to Yellow:** New accent (2024 trend)
- **Aurora:** Blue/Purple/Pink (animated backgrounds)

### **Typography**
- **Headings:** Bold, gradient text-fill
- **Body:** Slate 200-400
- **Small text:** Slate 500 (uppercase, tracking-wider)

### **Spacing**
- **Container:** max-w-7xl (1280px)
- **Content:** max-w-3xl (768px)
- **Padding:** p-4 to p-8
- **Gaps:** gap-2 to gap-8

### **Animations**
```css
/* Aurora orbs */
@keyframes aurora-1 {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20%, 30%); }
}

/* Gradient border */
@keyframes gradient-border {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Orbit dots */
@keyframes orbit {
  0% { transform: rotate(0deg) translateX(16px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(16px) rotate(-360deg); }
}
```

---

## 📱 Responsive Design

### **Breakpoints**
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### **Mobile Optimizations**
- Collapsible sidebar (full overlay)
- Touch-friendly buttons (44px min)
- Compressed gradients (blur-[60px] vs blur-[120px])
- Stacked layouts (flex-col)
- Smaller text (text-sm)
- Hidden sparkle icon on small screens
- Hamburger menu instead of full nav

---

## 🚀 Performance Optimizations

### **1. Code Splitting**
- Dynamic import of PDFViewer (avoid SSR)
- Dynamic import of docx + file-saver (reduce bundle)

### **2. Lazy Loading**
- PDF pages load on demand
- Chat history limited to 10 sessions
- Message history sliced to last 8 for context

### **3. Caching**
- Pinecone vectors cached server-side
- Firebase auth persisted locally

### **4. Batching**
- Pinecone uploads batched (10 chunks, 2s delay)
- Rate limiting on API (1 req/2s)

### **5. Debouncing**
- Search input debounced (planned)

---


---

## 📈 Metrics & Analytics (Potential)

### **Usage Tracking**
- Questions asked per user
- Documents uploaded per user
- Average session length
- Most popular documents
- Citation click-through rate
- Export/share usage

### **Performance Tracking**
- API response times
- Embedding generation time
- Pinecone query latency
- Error rates
- Model fallback frequency

---

## 🏆 Hackathon Strengths

### **Technical Depth (9/10)**
- Production-ready RAG implementation
- Multi-tenant architecture
- 5-model fallback system
- Document-scoped search
- Multimodal vision

### **User Experience (9/10)**
- Beautiful UI with glassmorphism
- Smooth animations
- Mobile responsive
- Toast notifications
- PDF viewer integration

### **Innovation (3.5/10)** ⚠️
- Core idea not novel (ChatPDF exists)
- Execution is solid but not groundbreaking
- Missing unique differentiators

### **Google Technology (8.5/10)**
- Gemini AI (5 models)
- Firebase Auth + Firestore
- Google GenAI Embeddings
- Could add: Cloud Vision, Text-to-Speech, Cloud Storage

---

## 🎯 Competitive Analysis

### **Similar Products:**
1. **ChatPDF** (10M+ users) - Same core concept
2. **NotebookLM** (Google) - Free, better UX
3. **Claude.ai** - Built-in PDF chat
4. **ChatGPT Plus** - Multimodal with PDFs
5. **Humata AI** - Enterprise focus

### **Verba's Differentiators:**
- ✅ Document-scoped search toggle
- ✅ In-app PDF viewer with citations
- ✅ Multi-model switching (5 Gemini models)
- ✅ Export to Word
- ✅ Quiz generation
- ✅ Beautiful UI (better than most)
- ❌ Not free (requires API keys)
- ❌ No unique learning features

---

## 💡 Suggested Improvements for Winning

### **High Impact (4-5 hours):**
1. **PDF Highlighting** - Highlight exact citation text in PDF viewer
2. **Socratic AI Mode** - AI asks YOU questions to test understanding
3. **Knowledge Graph** - Visual map of concept connections

### **Medium Impact (2-3 hours):**
4. **Voice Input** - Speech-to-text for questions
5. **Spaced Repetition** - Auto-schedule review sessions
6. **Analytics Dashboard** - Study insights + charts

### **Quick Wins (1 hour):**
7. **Dark/Light Mode** toggle
8. **Better loading states** (skeleton screens)
9. **Onboarding tutorial** (first-time user flow)
10. **Study streaks** (gamification)

---

## 📦 Deployment

### **Environment Variables Required:**
```env
GEMINI_API_KEY=...
PINECONE_API_KEY=...
PINECONE_INDEX_NAME=secondbrain
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NEXT_PUBLIC_BASE_URL=https://verba.app
```

### **Deployment Platforms:**
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Render**

### **Database Setup:**
1. Create Pinecone index (768 dimensions)
2. Create Firebase project
3. Enable Google Sign-In
4. Create Cloudinary account

---

## 📊 Project Statistics

- **Total Files:** ~20 TypeScript/TSX files
- **Total Lines of Code:** ~5,000+ lines
- **API Routes:** 6 routes
- **Pages:** 4 pages
- **Components:** 3 custom components
- **Dependencies:** 30+ packages
- **Development Time:** ~2-3 weeks (estimated)
- **Tech Stack Complexity:** High
- **Production Ready:** 85%

---

## 🎓 Educational Value

### **What You Learned:**
1. **RAG Architecture** - Embedding, vector search, context injection
2. **Multi-tenancy** - User isolation, data scoping
3. **AI Model Integration** - Gemini, embeddings, multimodal
4. **Modern React** - Server/Client components, hooks, state management
5. **Next.js 14+** - App router, API routes, dynamic imports
6. **Firebase** - Auth, Firestore, real-time updates
7. **Vector Databases** - Pinecone queries, metadata filtering
8. **PDF Processing** - Text extraction, chunking, rendering
9. **UI/UX Design** - Glassmorphism, animations, responsive design
10. **TypeScript** - Type safety, interfaces, generics

---

**Built with ❤️ for TechSprint 2026**
