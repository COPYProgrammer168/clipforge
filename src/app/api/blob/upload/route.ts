import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/plans";
import {
  getR2Client,
  getR2Config,
  getStorageProvider,
  r2PublicUrl,
} from "@/lib/storage";
import { getWorkspaceUserId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-m4v",
  "video/x-msvideo",
]);

const EXTENSION_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".avi": "video/x-msvideo",
};

function videoContentType(
  filename: string,
  contentType: string | undefined
) {
  const declared = (contentType ?? "").split(";")[0].trim().toLowerCase();
  if (VIDEO_TYPES.has(declared)) return declared;

  const extension = filename.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  return extension ? EXTENSION_TYPES[extension] : undefined;
}

function safeFilename(filename: string) {
  const base = filename
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-120);

  return base || "video";
}

export async function GET() {
  return Response.json({ provider: getStorageProvider() });
}

async function presignR2Upload(request: Request) {
  const body = (await request.json()) as {
    filename?: unknown;
    contentType?: unknown;
    size?: unknown;
  };

  const filename =
    typeof body.filename === "string" ? body.filename.trim() : "";
  const size = typeof body.size === "number" ? body.size : NaN;

  if (!filename || !Number.isFinite(size) || size <= 0) {
    return Response.json({ error: "A video file is required." }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: "That file is over 2 GB. Trim it or compress before uploading." },
      { status: 400 }
    );
  }

  const contentType = videoContentType(
    filename,
    typeof body.contentType === "string" ? body.contentType : undefined
  );
  if (!contentType) {
    return Response.json(
      { error: "Choose an MP4, MOV, WebM, MKV, M4V or AVI file." },
      { status: 400 }
    );
  }

  const userId = await getWorkspaceUserId();
  const key = `uploads/${userId}/${randomUUID()}-${safeFilename(filename)}`;
  const config = getR2Config();
  const uploadUrl = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 3600, signableHeaders: new Set(["content-type"]) }
  );

  return Response.json({
    provider: "r2",
    uploadUrl,
    publicUrl: r2PublicUrl(key),
    contentType,
  });
}

async function handleVercelUpload(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => {
      const userId = await getWorkspaceUserId();

      return {
        allowedContentTypes: [...VIDEO_TYPES],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId }),
      };
    },
    onUploadCompleted: async () => {
      // The client records the uploaded blob when it creates the job.
    },
  });
}

export async function POST(request: Request) {
  const provider = getStorageProvider();

  if (provider === "local") {
    return Response.json(
      {
        error:
          "Uploads are not configured. Add Cloudflare R2 storage or use a video link.",
      },
      { status: 400 }
    );
  }

  try {
    if (provider === "r2") {
      return await presignR2Upload(request);
    }

    return Response.json(await handleVercelUpload(request));
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Could not prepare upload.",
      },
      { status: 400 }
    );
  }
}
