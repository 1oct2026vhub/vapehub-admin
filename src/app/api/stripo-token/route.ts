import { NextResponse } from "next/server";

const STRIPO_AUTH_URL = "https://plugins.stripo.email/api/v1/auth";

export async function GET() {
  const pluginId = (
    process.env.STRIPO_PLUGIN_ID ??
    process.env.NEXT_PUBLIC_EMAIL_PLUGIN_ID ??
    ""
  ).trim();
  const secretKey = (
    process.env.STRIPO_SECRET_KEY ??
    process.env.NEXT_PUBLIC_EMAIL_SECRET_KEY ??
    ""
  ).trim();

  if (!pluginId || !secretKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Missing Stripo credentials in environment variables.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(STRIPO_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        pluginId,
        secretKey,
        userId: "admin-user",
        role: "user",
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      return NextResponse.json(
        {
          success: false,
          message: "Failed to get Stripo token.",
          details: body,
        },
        { status: 500 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      pluginId,
      token: data?.token,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error while generating Stripo token.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
