/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    // Query all vectors for this user
    const queryResponse = await index.query({
      vector: new Array(768).fill(0), // dummy vector
      filter: { userId: { $eq: userId } },
      topK: 10000,
      includeMetadata: true,
    });

    // Group by filename
    const fileMap = new Map<string, { uploadedAt: string; chunks: number }>();
    
    queryResponse.matches?.forEach((match: any) => {
      const meta = match.metadata;
      if (meta?.filename) {
        const existing = fileMap.get(meta.filename);
        if (!existing || meta.uploadedAt > existing.uploadedAt) {
          fileMap.set(meta.filename, {
            uploadedAt: meta.uploadedAt,
            chunks: existing ? existing.chunks + 1 : 1,
          });
        } else {
          fileMap.set(meta.filename, {
            ...existing,
            chunks: existing.chunks + 1,
          });
        }
      }
    });

    const documents = Array.from(fileMap.entries()).map(([filename, data]) => ({
      filename,
      userId,
      uploadedAt: data.uploadedAt,
      chunks: data.chunks,
    }));

    documents.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Documents list error:", error);
    return NextResponse.json({ error: "Failed to list documents" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId, filename } = await req.json();

    if (!userId || !filename) {
      return NextResponse.json({ error: "userId and filename required" }, { status: 400 });
    }

    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    // Find all vector IDs for this file
    const queryResponse = await index.query({
      vector: new Array(768).fill(0),
      filter: { userId: { $eq: userId }, filename: { $eq: filename } },
      topK: 10000,
      includeMetadata: false,
    });

    const idsToDelete = queryResponse.matches?.map((m: any) => m.id) || [];

    if (idsToDelete.length > 0) {
      await index.deleteMany(idsToDelete);
      console.log(`Deleted ${idsToDelete.length} vectors for ${filename}`);
    }

    return NextResponse.json({ success: true, deleted: idsToDelete.length });
  } catch (error) {
    console.error("Document delete error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
