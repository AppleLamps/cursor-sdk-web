import { assemblePreviewDocument, fetchSiteFiles } from "@/lib/github";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await context.params;

  if (!sessionId?.trim()) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const files = await fetchSiteFiles(sessionId);

    if (!files) {
      return NextResponse.json({ error: "Site not found yet" }, { status: 404 });
    }

    return NextResponse.json({
      ...files,
      previewHtml: assemblePreviewDocument(files),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch site" },
      { status: 500 },
    );
  }
}
