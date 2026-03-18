import { NextRequest, NextResponse } from 'next/server';

const BEE_AUTH_URL = 'https://auth.getbee.io/loginV2';

/**
 * Beefree SDK authentication proxy.
 * Uses server-side env vars so client_secret is never exposed to the browser.
 * Set BEE_CLIENT_ID and BEE_CLIENT_SECRET in .env.local (recommended),
 * or NEXT_PUBLIC_EMAIL_CLIENT_ID and BEE_CLIENT_SECRET / EMAIL_CLIENT_SECRET.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const uid = typeof body?.uid === 'string' ? body.uid : 'demo-user';

    const clientId =
      process.env.BEE_CLIENT_ID || process.env.NEXT_PUBLIC_EMAIL_CLIENT_ID;
    const clientSecret =
      process.env.BEE_CLIENT_SECRET ||
      process.env.EMAIL_CLIENT_SECRET ||
      process.env.NEXT_PUBLIC_EMAIL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error: 'Missing Beefree credentials',
          hint: 'Set BEE_CLIENT_ID and BEE_CLIENT_SECRET in .env.local',
        },
        { status: 500 }
      );
    }

    const response = await fetch(BEE_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        uid,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Beefree auth error:', response.status, text);
      return NextResponse.json(
        { error: 'Beefree authentication failed', details: text },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Bee-auth route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
