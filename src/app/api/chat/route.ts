import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // 2. Select the Gemini Model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    // 3. Define the "System Personality" (Your Tutor Persona)
    const systemInstruction = `
      You are X-ai, an expert AI tutor. 
      - Explain things clearly and simply.
      - Use emojis and bullet points.
      - If you don't know something, admit it.
    `;

    // 4. Start the Chat
    const chat = model.startChat({
      history: history || [], // Keeps memory of previous messages
    });

    // 5. Send the message combined with your instruction
    const result = await chat.sendMessage(`${systemInstruction}\n\nUser Question: ${message}`);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });

  } catch (error) {
    console.error("Error talking to Gemini:", error);
    return NextResponse.json({ error: "Brain freeze!" }, { status: 500 });
  }
}