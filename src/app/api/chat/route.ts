/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";

// Simple in-memory rate limiter (per server instance)
const lastRequestPerIp = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 2000; // 1 request every 2s per IP

// Initialize Gemini with your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // Basic rate limit: one request every 2s per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    const now = Date.now();
    const last = lastRequestPerIp.get(ip) || 0;
    if (now - last < RATE_LIMIT_WINDOW_MS) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 });
    }
    lastRequestPerIp.set(ip, now);

    // 1. Get the message from the frontend
    const { message, history, imageData, userId, sessionId, model: preferredModel, docId, searchAllDocs } = await req.json();

    console.log(`[Chat API] Received userId: ${userId}, docId: ${docId || 'all'}, searchAllDocs: ${searchAllDocs}, message: "${message.substring(0, 50)}..."`);

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 2. Query Pinecone for relevant context from uploaded PDFs
    let contextFromPDFs = "";
    let hasRAGContext = false;
    let citations: Array<{ filename: string; page?: number | null; score?: number; preview?: string }> = [];
    
    // SMART RAG: Only run when:
    // 1. No image (Google Vision handles images)
    // 2. User has uploaded a document (docId exists) OR explicitly enabled search all docs
    // 3. Pinecone is configured
    const shouldUseRAG = !imageData && (docId || searchAllDocs) && process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME;
    
    if (shouldUseRAG) {
      console.log(`[RAG] Enabled - docId: ${docId || 'none'}, searchAllDocs: ${searchAllDocs}`);
      try {
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY!,
        });
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

        const embeddings = new GoogleGenerativeAIEmbeddings({
          modelName: "text-embedding-004",
          apiKey: process.env.GEMINI_API_KEY,
        });

        // DOCUMENT-SCOPED SEARCH: Filter by docId (Option A) or all user docs (Option B)
        let results: any[] = [];
        
        if (userId) {
          // Build filter: docId (single doc) OR userId only (all docs)
          const filter: any = searchAllDocs 
            ? { userId: { $eq: userId } }  // Option B: Search all user documents
            : docId 
              ? { userId: { $eq: userId }, docId: { $eq: docId } }  // Option A: Single document scope
              : { userId: { $eq: userId } };  // Fallback: all user docs if no docId
          
          const filterDesc = searchAllDocs ? "all user docs" : docId ? `docId: ${docId}` : "userId only";
          console.log(`Querying Pinecone with filter: ${filterDesc}`);
          
          const vectorStoreFiltered = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex,
            filter,
          });
          results = await vectorStoreFiltered.similaritySearchWithScore(message, 8);
          console.log(`Found ${results.length} results with ${filterDesc}`);
        }
        
        // If no results with filter, try without filter (for legacy docs without userId)
        if (results.length === 0) {
          console.log(`No results with filter, trying WITHOUT filter (legacy docs)...`);
          const vectorStoreUnfiltered = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex,
          });
          results = await vectorStoreUnfiltered.similaritySearchWithScore(message, 8);
          console.log(`Found ${results.length} results WITHOUT filter`);
        }
        
        console.log(`Total results from Pinecone: ${results.length}`);
        if (results.length > 0) {
          console.log("Sample result:", {
            filename: results[0][0].metadata?.filename,
            score: results[0][1],
            uploadedAt: results[0][0].metadata?.uploadedAt,
            contentPreview: results[0][0].pageContent.substring(0, 100)
          });
        }
        
        if (results.length > 0) {
          // 1) Keep all results, prefer highest scores (no latest-only filter)
          const RELEVANCE_THRESHOLD = 0.45; // more permissive so we don't drop useful chunks
          const filtered = results.filter(([, score]) => score >= RELEVANCE_THRESHOLD);
          const usable = filtered.length > 0 ? filtered : results; // fallback to best results even if below threshold

          // 2) Sort by score desc, then by recency
          const sortedResults = usable.sort((a, b) => {
            const dateA = a[0].metadata?.uploadedAt || '';
            const dateB = b[0].metadata?.uploadedAt || '';
            if (dateA !== dateB) return dateB.localeCompare(dateA);
            return b[1] - a[1];
          });

          const topResults = sortedResults.slice(0, 3);

          const maxScore = Math.max(...topResults.map(([, score]) => score));
          const RAG_USE_THRESHOLD = 0.41; // require decent relevance to cite

          if (maxScore < RAG_USE_THRESHOLD) {
            console.log(`Skipping RAG context (max score ${maxScore.toFixed(2)} < ${RAG_USE_THRESHOLD})`);
            hasRAGContext = false;
            citations = [];
            contextFromPDFs = "";
          } else {
            // Build citations ONLY when threshold is passed
            citations = topResults.map(([doc, score]) => ({
              filename: (doc.metadata?.filename as string) || (doc.metadata?.source as string) || "Unknown file",
              page: (doc.metadata as any)?.loc?.pageNumber ?? (doc.metadata as any)?.pageNumber ?? null,
              score,
              preview: doc.pageContent.substring(0, 180)
            }));

            contextFromPDFs = "\n\n📚 Relevant excerpts from your documents:\n" + 
              topResults.map((result, i) => {
                const doc = result[0];
                const score = result[1];
                const filename = doc.metadata?.filename || doc.metadata?.source || 'Unknown file';
                const pageNumber = (doc.metadata as any)?.loc?.pageNumber ?? (doc.metadata as any)?.pageNumber;
                const pageLabel = pageNumber ? ` · p${pageNumber}` : "";
                return `[Source ${i + 1}: ${filename}${pageLabel} | relevance ${(score * 100).toFixed(0)}%]\n${doc.pageContent}`;
              }).join("\n\n---\n\n");
            hasRAGContext = true;
            const sourceFile = sortedResults[0][0].metadata?.filename || sortedResults[0][0].metadata?.source || "Unknown";
            console.log(`Context found from: ${sourceFile} (top ${topResults.length} used)`);
            console.log("Context length:", contextFromPDFs.length);
            console.log("hasRAGContext set to:", hasRAGContext);
          }
        }
      } catch (error) {
        console.log("RAG search failed:", error instanceof Error ? error.message : 'Unknown error');
        // Continue without context
      }
    } else {
      console.log(`[RAG] Skipped - imageData: ${!!imageData}, docId: ${docId || 'none'}, searchAllDocs: ${searchAllDocs}`);
    }

    // 3. Select the Gemini Model with automatic fallback
    const defaultModels = [
      "gemini-flash-latest",
      "gemini-flash-lite-latest",
      "gemini-2.0-flash-exp",
      "gemini-flash-latest",
      "gemini-2.0-flash",
      "gemini-2.5-pro",
      "gemini-pro-latest",
      "gemini-2.0-flash-lite-001",
    ];
    
    // Put user-selected model first, then fallback to defaults
    const modelNames = preferredModel 
      ? [preferredModel, ...defaultModels.filter(m => m !== preferredModel)]
      : defaultModels;

    // 4. Define the "System Personality" with RAG context
    console.log("Building prompt with hasRAGContext:", hasRAGContext);
    
    const systemInstruction = `
  You are Verba, an expert AI tutor.

  ${hasRAGContext ? `
  You are given excerpts from the user's uploaded PDFs. Prefer these excerpts when relevant.
  - If the excerpts clearly answer, use them and include a "Sources" section with PDF filename and page (if available).
  - If the excerpts are insufficient or unrelated, answer from your general knowledge AND say: "(No document matches found; answering generally.)"

  ${contextFromPDFs}
  ` : `
  You do not have document context right now. Answer from your general knowledge.
  Use relevant emojis to make answers engaging and friendly (e.g., 📚 for learning, 🔬 for science, 💡 for ideas).
  `}

  Style:
  - Be concise and structured.
  - If you cited PDFs, add a "Sources" section. If no sources, omit the section.
  - Do NOT fabricate sources.
  `;
    
    console.log("System instruction length:", systemInstruction.length);

    // 5. Try models until one works
    let text;
    // Prepare inline image if provided
    let imagePart: any = null;
    if (imageData) {
      const [meta, data] = (imageData as string).split(",");
      const mimeMatch = meta?.match(/data:(.*);base64/);
      const mimeType = mimeMatch?.[1] || "image/png";
      imagePart = { inlineData: { mimeType, data } };
    }
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        if (imagePart) {
          const result = await model.generateContent({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemInstruction}\n\nUser Question: ${message}\nIf the image is relevant, describe it and use it in your answer.` },
                  imagePart,
                ],
              },
            ],
          });
          text = result.response.text();
        } else {
          const chat = model.startChat({
            history: history || [],
          });

          const result = await chat.sendMessage(`${systemInstruction}\n\nUser Question: ${message}`);
          const response = await result.response;
          text = response.text();
        }
        
        console.log(`✓ Model ${modelName} succeeded`);
        break; // Success!
      } catch (error: any) {
        console.log(`✗ Model ${modelName} failed:`, error?.message || 'Unknown error');
        if (modelName === modelNames[modelNames.length - 1]) {
          // Last model also failed
          return NextResponse.json({ 
            error: "All AI models are currently unavailable due to quota limits. Please try again later." 
          }, { status: 503 });
        }
        // Try next model
      }
    }

    if (!text) {
      return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }

    // Citations are already sent separately, no need to append them to text

    // 7. Save chat history to Firebase (per-user if logged in) with session support
    try {
      let resolvedSessionId = sessionId as string | undefined;

      if (userId) {
        // Ensure a session exists (create if missing)
        const sessionRef = resolvedSessionId
          ? doc(db, `users/${userId}/sessions/${resolvedSessionId}`)
          : doc(collection(db, `users/${userId}/sessions`));

        // Create or update session metadata
        const sessionPayload: Record<string, any> = {
          title: (message as string).slice(0, 60) || "New Chat",
          updatedAt: serverTimestamp(),
        };
        if (!resolvedSessionId) {
          sessionPayload.createdAt = serverTimestamp();
        }

        await setDoc(sessionRef, sessionPayload, { merge: true });

        resolvedSessionId = sessionRef.id;

        const messagesCol = collection(db, `users/${userId}/sessions/${resolvedSessionId}/messages`);
        await addDoc(messagesCol, {
          userMessage: message,
          botMessage: text,
          citations: citations || [],
          timestamp: serverTimestamp(),
          hasContext: hasRAGContext,
        });

        return NextResponse.json({ reply: text, sessionId: resolvedSessionId, citations });
      }

      // Fallback for unauthenticated usage
      const targetCollection = collection(db, "chatHistory");
      await addDoc(targetCollection, {
        userMessage: message,
        aiResponse: text,
        timestamp: serverTimestamp(),
        hasContext: hasRAGContext,
        citations,
      });

      return NextResponse.json({ reply: text, citations });
    } catch (firebaseError) {
      console.log("Firebase save failed:", firebaseError);
      // Continue even if Firebase fails
    }

    return NextResponse.json({ reply: text, sessionId: sessionId, citations });

  } catch (error) {
    console.error("Error talking to Gemini:", error);
    return NextResponse.json({ error: "Brain freeze!" }, { status: 500 });
  }
}