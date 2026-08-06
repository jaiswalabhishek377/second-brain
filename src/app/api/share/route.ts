/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const { sessionId, userId, title, messages } = await req.json();

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "sessionId and userId required" }, { status: 400 });
    }

    // Generate a unique shareable ID
    const shareId = nanoid(10);

    // Store in Firestore
    await setDoc(doc(db, "sharedChats", shareId), {
      shareId,
      sessionId,
      userId,
      title: title || "Untitled Chat",
      messages: messages || [],
      createdAt: serverTimestamp(),
      views: 0,
    });

    const origin = req.headers.get("origin") || (req.headers.get("referer") ? new URL(req.headers.get("referer")!).origin : null) || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${origin}/shared/${shareId}`;

    return NextResponse.json({ shareId, shareUrl });

  } catch (error) {
    console.error("Share creation error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
