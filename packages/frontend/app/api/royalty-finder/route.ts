import { NextResponse } from "next/server";

function isValidISRC(isrc: string) {
  return /^[A-Z]{2}-?[A-Z0-9]{3}-?\d{2}-?\d{5}$/.test(isrc);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isrc = (searchParams.get("isrc") ?? "").trim();

    if (!isrc || !isValidISRC(isrc)) {
      return NextResponse.json({ error: "Invalid or missing ISRC." }, { status: 400 });
    }

    let backendData = null;
    try {
      const fastApiRes = await fetch(
        `http://127.0.0.1:8000/catalog/audit?isrc=${encodeURIComponent(isrc)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      backendData = fastApiRes.ok ? await fastApiRes.json() : null;
    } catch {
      backendData = null;
    }

    return NextResponse.json({
      isrc,
      timestamp: new Date().toISOString(),
      sources: { backend: backendData },
      summary: { backendFound: !!backendData },
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: "Server error", details: String(err) }, { status: 500 });
  }
}
