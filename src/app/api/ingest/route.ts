/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/ingest/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;
    const userId = data.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file found" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // 1. Convert File to Blob for PDFLoader
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "application/pdf" });

    // Sanitize filename for storage (Cloudinary public IDs dislike some chars)
    const safeFilename = file.name
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 120);

    // 1.5. Upload PDF to Cloudinary (resource_type: raw)
    let cloudinaryUrl = null;
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("Cloudinary env vars missing - skipping PDF storage");
        throw new Error("Cloudinary env vars missing");
      }

      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const publicId = `pdfs/${userId}/${safeFilename}`;

      const uploadResult = await cloudinary.uploader.upload(`data:application/pdf;base64,${base64}`, {
        resource_type: "raw",
        public_id: publicId,
        overwrite: true,
        folder: "",
      });

      cloudinaryUrl = uploadResult.secure_url;
      console.log(`Uploaded PDF to Cloudinary: ${publicId} (${uploadResult.bytes} bytes)`);
    } catch (storageError: any) {
      console.error("Cloudinary upload failed:", storageError?.message || storageError);
      // Continue anyway - text embedding is more important
    }
    
    // 2. Load and Parse PDF using LangChain's PDFLoader
    const loader = new PDFLoader(blob);
    const rawDocs = await loader.load();
    
    if (!rawDocs || rawDocs.length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }
    
    // Combine all page texts
    const rawText = rawDocs.map(doc => doc.pageContent).join("\n");

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "PDF appears to be empty" }, { status: 400 });
    }

    console.log(`Extracted ${rawText.length} characters from PDF`);

    // 3. Chunk the text (Split into smaller pieces so AI can digest it)
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const docs = await splitter.createDocuments([rawText]);
    
    // Add metadata to EACH document after splitting
    const timestamp = new Date().toISOString();
    const filename = safeFilename;
    const originalFilename = file.name;
    // Generate unique docId for this document (Option A: single doc scope)
    const docId = `doc_${randomBytes(16).toString("hex")}`;
    console.log(`Adding metadata: docId="${docId}", filename="${filename}" (original="${originalFilename}"), userId="${userId}", timestamp="${timestamp}"`);
    
    docs.forEach(doc => {
      doc.metadata = {
        ...doc.metadata, // Keep existing metadata like line numbers
        docId, // CRITICAL: scope to specific document
        filename,
        originalFilename,
        userId, // CRITICAL: isolate by user
        uploadedAt: timestamp,
        source: "user_upload"
      };
    });

    console.log(`Split into ${docs.length} chunks with metadata`);

    if (docs.length === 0) {
      return NextResponse.json({ error: "Failed to chunk document" }, { status: 400 });
    }

    // 4. Initialize Pinecone and Gemini Embeddings
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const baseEmbeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "models/gemini-embedding-001",
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Wrapper to truncate embeddings to 768 dimensions (Pinecone index size)
    const embeddings = {
      embedDocuments: async (texts: string[]) => {
        const fullEmbeddings = await baseEmbeddings.embedDocuments(texts);
        return fullEmbeddings.map(emb => emb.slice(0, 768));
      },
      embedQuery: async (text: string) => {
        const fullEmbedding = await baseEmbeddings.embedQuery(text);
        return fullEmbedding.slice(0, 768);
      },
    };

    // Test if embeddings API is working before processing all chunks
    console.log("Testing embedding API...");
    try {
      const testEmbed = await embeddings.embedQuery("test");
      if (!testEmbed || testEmbed.length === 0) {
        return NextResponse.json({ 
          error: "Embedding API returned empty vector. Please check your API quota." 
        }, { status: 503 });
      }
      console.log(`✓ Embedding API working (dimension: ${testEmbed.length}) - truncated to match Pinecone index`);
    } catch (embedError: any) {
      console.error("Embedding API test failed:", embedError?.message);
      return NextResponse.json({ 
        error: embedError?.status === 429 
          ? "Embedding API quota exceeded. Please wait or upgrade your plan."
          : "Embedding API is unavailable. Please check your API key and quota."
      }, { status: 503 });
    }

    console.log("Starting to embed and upload to Pinecone...");

    // 5. Save to Pinecone with manual batching to avoid rate limits
    const batchSize = 10; // Small batch size for free tier
    const totalBatches = Math.ceil(docs.length / batchSize);
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${currentBatch}/${totalBatches} (${batch.length} chunks)...`);
      
      await PineconeStore.fromDocuments(batch, embeddings, {
        pineconeIndex,
      });
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < docs.length) {
        console.log("Waiting 2s before next batch...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log("Successfully uploaded to Pinecone!");

    return NextResponse.json({ 
      success: true, 
      message: "File embedded successfully!",
      chunks: docs.length,
      characters: rawText.length,
      docId, // Return docId so frontend can scope queries to this document
      filename: originalFilename
    });

  } catch (error) {
    console.error("Ingestion Error:", error);
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}