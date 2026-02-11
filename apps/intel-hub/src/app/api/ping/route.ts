import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });

  try {
    // Server-side check (avoids browser CORS issues)
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Failed" }, { status: 200 });
  }
}
