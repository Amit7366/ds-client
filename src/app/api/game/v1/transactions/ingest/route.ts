import { NextRequest, NextResponse } from 'next/server';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5001';

export async function POST(req: NextRequest) {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SERVER_URL}/api/game/v1/transactions/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Upstream API unavailable' },
      { status: 502 },
    );
  }

  const responseBody = await upstream.text();
  return new NextResponse(responseBody, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/json',
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Method not allowed. Use POST /api/game/v1/transactions/ingest',
    },
    { status: 405 },
  );
}
