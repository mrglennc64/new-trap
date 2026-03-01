import { NextRequest, NextResponse } from "next/server";

// Use local backend instead of external URL
const BACKEND_BASE = "http://127.0.0.1:8000";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const artist = searchParams.get('artist');
  
  if (!artist) {
    return NextResponse.json(
      { error: 'Artist parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Forward the request to your FastAPI backend
    const res = await fetch(`${BACKEND_BASE}/catalog/royalty-finder?artist=${encodeURIComponent(artist)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Royalty finder error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}

// Keep POST if needed
export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${BACKEND_BASE}/catalog/royalty-finder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
