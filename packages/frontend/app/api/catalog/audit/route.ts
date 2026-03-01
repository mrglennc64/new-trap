import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND_BASE = process.env.BACKEND_BASE_URL || "https://traproyaltiespro.com";

export async function GET() {
  const res = await fetch(`${BACKEND_BASE}/catalog/audit`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
