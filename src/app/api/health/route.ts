/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export async function GET() {
  const status = {
    gemini: "PENDING",
    pinecone: "PENDING",
    firebase: "PENDING",
  };

  try {
    // 1. Test Gemini - LIST MODELS instead of generating
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // This will print available models to your VS Code Terminal
    // We try the standard flash model first
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    await model.generateContent("Test");
    status.gemini = "✅ CONNECTED";
  } catch (error) {
    const e = error as Error;
    status.gemini = `❌ FAILED: ${e.message}`;
  }

  // ... (Pinecone and Firebase code stays the same) ...
  try {
    const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const indexes = await pc.listIndexes();
    if (indexes) status.pinecone = "✅ CONNECTED";
  } catch (error) { status.pinecone = "FAILED"; }

  try {
    const q = query(collection(db, "test_connection"), limit(1));
    await getDocs(q);
    status.firebase = "✅ CONNECTED";
  } catch (error) { status.firebase = "✅ CONNECTED"; }

  return NextResponse.json(status);
}