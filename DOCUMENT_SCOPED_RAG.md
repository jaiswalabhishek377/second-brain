# Document-Scoped RAG Architecture

## Overview
Your app now implements **document-scoped RAG** with optional global search. This means:
- **Default (Option A)**: Answers come from the current document only
- **Optional (Option B)**: Toggle to search across all your documents

## How It Works

### 1. Upload Time
When you upload a PDF (e.g., `React_Notes.pdf`):
```typescript
// Generated in /api/ingest
docId: "doc_a1b2c3d4e5f6..." // Unique ID for this document
```

Every chunk saved to Pinecone includes:
```json
{
  "text": "React components are...",
  "metadata": {
    "userId": "user_123",
    "docId": "doc_a1b2c3d4...",  // <- Key for scoping
    "filename": "React_Notes.pdf",
    "uploadedAt": "2026-01-05T..."
  }
}
```

### 2. Query Time (Default Mode)
When you ask "How do components work?":
- Filter: `WHERE userId = 'user_123' AND docId = 'doc_a1b2c3d4'`
- Result: AI answers **only** from React_Notes.pdf
- Other PDFs are ignored

### 3. Global Search (Optional)
Click the toggle switch to enable "Search All Documents":
- Filter: `WHERE userId = 'user_123'` (no docId filter)
- Result: AI searches **everything** you've uploaded

## UI Features

### Document Scope Indicator
When a document is loaded, you'll see:
```
🗄️ Searching current document only [Toggle Switch]
```

Toggle it ON to see:
```
🗄️ Searching all your documents [Toggle Switch]
```

### Visual States
- **Toggle OFF** (default): Answers from current document only
- **Toggle ON**: Answers from all your documents
- **No document loaded**: Toggle is hidden

## Technical Implementation

### Backend Changes
1. **`/api/ingest`**: Generates unique `docId` for each upload
2. **`/api/chat`**: Accepts `docId` and `searchAllDocs` parameters
3. **Pinecone filtering**: 
   - Single doc: `{ userId, docId }`
   - All docs: `{ userId }` only

### Frontend Changes
1. **State tracking**: `currentDocId` and `searchAllDocs`
2. **Upload callback**: Captures `docId` from upload response
3. **Chat submission**: Passes `docId` and `searchAllDocs` to API
4. **UI toggle**: Clean switch to enable/disable global search

## Benefits

### For Users
- **Focused answers**: Get precise answers from specific documents
- **Privacy**: Shared notebooks only show their content
- **Flexibility**: Optionally search everything when needed

### For Development
- **Scalable**: Ready for notebook sharing feature
- **Clean architecture**: Easy to extend with more filters
- **Backward compatible**: Existing docs still work

## Example Usage

### Scenario 1: Study Session
1. Upload `Math_Chapter_5.pdf`
2. Ask: "What is the Pythagorean theorem?"
3. ✅ Answer comes **only** from Chapter 5
4. Your other math PDFs are ignored

### Scenario 2: Research Mode
1. Keep Math_Chapter_5.pdf loaded
2. Toggle ON "Search All Documents"
3. Ask: "Compare theorems across all chapters"
4. ✅ Answer uses **all your math PDFs**

### Scenario 3: Sharing (Future)
1. Share "React Notes" notebook with friend
2. Friend asks: "How do hooks work?"
3. ✅ Answer comes **only from React Notes**
4. Your private notes are never accessed

## Migration Notes

### Existing Documents
- Old PDFs without `docId` still work
- They respond to queries when "Search All Documents" is ON
- Re-upload to get document scoping

### New Documents
- All new uploads get unique `docId`
- Automatically scope to single document by default
- Toggle available immediately after upload

## Future Enhancements
- [ ] Save toggle preference per session
- [ ] Show which documents were used in answer
- [ ] Filter by document type or date
- [ ] Notebook-level scoping for shared content
