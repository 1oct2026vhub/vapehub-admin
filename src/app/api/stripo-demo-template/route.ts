import { NextResponse } from "next/server";

const TEMPLATES: Record<string, { html: string; css: string }> = {
  empty: {
    html: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Empty-Template/Empty-Template.html",
    css: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Empty-Template/Empty-Template.css",
  },
  "new-editor": {
    html: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/New-editor-template/New-editor-template.html",
    css: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/New-editor-template/New-editor-template.css",
  },
  /** Official Quick Start sample demo — ardas/stripo-plugin */
  trigger: {
    html: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.html",
    css: "https://raw.githubusercontent.com/ardas/stripo-plugin/master/Public-Templates/Basic-Templates/Trigger%20newsletter%20mockup/Trigger%20newsletter%20mockup.css",
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("template") || "empty";
  const urls = TEMPLATES[key] ?? TEMPLATES["empty"];

  try {
    const [htmlRes, cssRes] = await Promise.all([
      fetch(urls.html, { cache: "no-store" }),
      fetch(urls.css, { cache: "no-store" }),
    ]);

    if (!htmlRes.ok || !cssRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to download Stripo template." },
        { status: 502 },
      );
    }

    const [html, css] = await Promise.all([htmlRes.text(), cssRes.text()]);

    return NextResponse.json({ success: true, html, css, template: key });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error loading Stripo template.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
