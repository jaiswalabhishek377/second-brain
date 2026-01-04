// src/lib/pinecone.ts
import { Pinecone } from "@pinecone-database/pinecone";

// Initialize the client (it automatically reads process.env.PINECONE_API_KEY)
export const pinecone = new Pinecone();

export const indexName = "secondbrain";