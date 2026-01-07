# 🧪 Testing Checklist - Verba

## ✅ Tests to Run

### 1. User Authentication
- [ ] Go to http://localhost:3000
- [ ] Click "Get Started" or go to /chat
- [ ] Sign in with Google
- [ ] Verify you see user avatar + name in header

### 2. File Upload & User Isolation
- [ ] Upload a PDF (test with a small PDF file)
- [ ] Check terminal logs for:
  ```
  Adding metadata: filename="test.pdf", userId="xyz123", timestamp="..."
  Successfully uploaded to Pinecone!
  ```
- [ ] Sign out and sign in with different Google account
- [ ] Verify second user CANNOT see first user's PDF in search results

### 3. Chat with RAG
- [ ] Ask: "What is this PDF about?"
- [ ] Check terminal logs for:
  ```
  [Chat API] Received userId: xyz123...
  Found X results WITH userId filter
  Total results from Pinecone: X
  ```
- [ ] Verify answer includes citation chips with:
  - Filename
  - Page number (if available)
  - Relevance score (e.g., "94%")

### 4. Documents Page
- [ ] Navigate to http://localhost:3000/documents
- [ ] Verify you see your uploaded PDFs
- [ ] Check each card shows:
  - Filename
  - Upload date
  - Chunk count
- [ ] Try search box
- [ ] Click delete button on a PDF
- [ ] Confirm it's removed from list
- [ ] Go back to chat and verify deleted PDF not in search results

### 5. Settings Modal
- [ ] Click Settings button in sidebar
- [ ] Change model to "Gemini 2.5 Pro"
- [ ] Click "Done"
- [ ] Ask a question
- [ ] Check terminal logs show: "Trying model: gemini-2.5-pro"
- [ ] Open Settings again
- [ ] Click "Clear Current Context"
- [ ] Verify chat messages cleared

### 6. Session Management
- [ ] Create a new chat (ask a question)
- [ ] Check sidebar shows session titled with first message
- [ ] Double-click session title
- [ ] Rename to "Test Session"
- [ ] Press Enter
- [ ] Verify toast: "Session renamed"
- [ ] Refresh page
- [ ] Verify renamed session persists

### 7. Mobile Responsive
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select iPhone or small screen
- [ ] Verify:
  - Input field readable
  - Buttons are tappable (44px min)
  - Sidebar menu works
  - Gradients less intense

### 8. Toast Notifications
- [ ] Upload PDF → see "Embedded [filename] (X chunks)" toast
- [ ] Upload fails → see error toast
- [ ] Delete session → see "Session deleted" toast
- [ ] Rename session → see "Session renamed" toast
- [ ] Get cited answer → see "Cited X sources" toast

### 9. General Questions (No PDF)
- [ ] Ask: "What is photosynthesis?"
- [ ] Verify answer has NO citation chips
- [ ] Check terminal shows:
  ```
  Found 0 results from Pinecone
  Building prompt with hasRAGContext: false
  ```

### 10. Legacy PDF Support (if you have old uploads)
- [ ] If you have PDFs uploaded BEFORE userId was added
- [ ] Ask a question about them
- [ ] Check terminal shows:
  ```
  Found 0 results WITH userId filter
  No results with filter, trying WITHOUT filter (legacy docs)...
  Found X results WITHOUT filter
  ```

## 🐛 Known Issues to Check

1. **Issue:** "Found 0 results from Pinecone"
   - **Fix:** Re-upload PDFs or check fallback to no-filter search
   - **Expected:** Should fallback and find legacy docs

2. **Issue:** Citations not showing
   - **Check:** Relevance threshold (needs >55% to show sources)
   - **Expected:** Low-relevance = general answer, no fake citations

3. **Issue:** Different users see each other's PDFs
   - **Fix:** Each PDF must have userId in metadata
   - **Expected:** Complete isolation per user

## 📊 Success Criteria

- ✅ Build completes without errors
- ✅ Dev server starts on http://localhost:3000
- ✅ Auth flow works (Google sign-in)
- ✅ PDF upload shows success toast
- ✅ Chat answers include citations when relevant
- ✅ Documents page shows correct PDFs per user
- ✅ Settings modal changes model
- ✅ Session rename persists
- ✅ Mobile view looks good
- ✅ No user can see other users' data

## 🎯 Current Status

**Build:** ✅ Passing
**TypeScript:** ✅ No errors
**Linter:** ⚠️ Minor CSS suggestions (non-breaking)

**Last Build:** 2026-01-05
**Routes Working:** 10/10
