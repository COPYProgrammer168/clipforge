import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".srt": "text/plain; charset=utf-8",
  ".ass": "text/plain; charset=utf-8",
};

function clipsRoot() {
  return path.resolve(
    process.env.CLIPS_ROOT ?? path.join(process.cwd(), "public", "clips")
  );
}

function notFound() {
  return new NextResponse("Not found", { status: 404 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (
    !segments?.length ||
    segments.some(
      (segment) =>
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\")
    )
  ) {
    return notFound();
  }

  const root = clipsRoot();
  const filePath = path.resolve(root, ...segments);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return notFound();
  }

  let info;
  try {
    info = await stat(filePath);
  } catch {
    return notFound();
  }
  if (!info.isFile()) return notFound();

  const contentType =
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
    "application/octet-stream";

  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || (match[1] === "" && match[2] === "")) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }

    let start: number;
    let end: number;
    if (match[1] === "") {
      const suffix = Number(match[2]);
      start = Math.max(0, info.size - suffix);
      end = info.size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1;
    }

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start > end ||
      start >= info.size
    ) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${info.size}` },
      });
    }

    const stream = Readable.toWeb(
      createReadStream(filePath, { start, end })
    ) as ReadableStream;

    return new NextResponse(stream, {
      status: 206,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${info.size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath)
  ) as ReadableStream;

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(info.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
