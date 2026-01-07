/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    const decodedFilename = decodeURIComponent(filename);
    
    // Get userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Sanitize filename same way as during upload
    const safeFilename = decodedFilename
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 120);

    console.log("PDF fetch request:");
    console.log("  Original filename:", decodedFilename);
    console.log("  Sanitized filename:", safeFilename);
    console.log("  User ID:", userId);

    // Fetch PDF from Cloudinary (resource_type: raw)
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: "Cloudinary env vars missing" }, { status: 500 });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const publicId = `pdfs/${userId}/${safeFilename}`;
    console.log("  Cloudinary public_id:", publicId);
    
    // Generate unsigned public URL (no signature required)
    const secureUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}`;
    
    console.log("  Cloudinary URL:", secureUrl);

    let res = await fetch(secureUrl);
    
    console.log("  Fetch status:", res.status);
    
    // Fallback: try original filename if sanitized version not found (backward compatibility)
    if (!res.ok && safeFilename !== decodedFilename) {
      console.log(`Sanitized lookup failed, trying original filename: ${decodedFilename}`);
      const fallbackPublicId = `pdfs/${userId}/${decodedFilename}`;
      const fallbackUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/raw/upload/${fallbackPublicId}`;
      console.log("  Fallback URL:", fallbackUrl);
      res = await fetch(fallbackUrl);
      console.log("  Fallback status:", res.status);
    }
    
    if (!res.ok) {
      console.error(`PDF not found in Cloudinary. Tried: ${publicId} and pdfs/${userId}/${decodedFilename}`);
      return NextResponse.json({ error: "PDF not found in Cloudinary. Re-upload the document." }, { status: 404 });
    }

    const pdfArrayBuffer = await res.arrayBuffer();

    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
      },
    });

  } catch (error: any) {
    console.error("PDF API error:", error);
    
    if (error?.http_code === 404 || error?.error?.http_code === 404) {
      return NextResponse.json({ 
        error: "PDF not found. It may not have been uploaded to storage."
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
