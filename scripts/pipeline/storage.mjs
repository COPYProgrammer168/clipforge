import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { del, list, put } from "@vercel/blob";

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".srt": "application/x-subrip",
};

let r2Client = null;

export function storageProvider() {
  const value = (process.env.CLIP_STORAGE ?? "local").trim().toLowerCase();
  if (value === "r2") return "r2";
  if (value === "blob" || value === "vercel") return "vercel";
  return "local";
}

export function usesBlobStorage() {
  return storageProvider() !== "local";
}

function blobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "CLIP_STORAGE=blob requires BLOB_READ_WRITE_TOKEN to be set."
    );
  }
  return token;
}

function r2AccountId(value) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed.includes("://")) return trimmed;

  try {
    return new URL(trimmed).hostname.split(".")[0] || trimmed;
  } catch {
    return trimmed;
  }
}

function r2Config() {
  const accountId = process.env.R2_ACCOUNT_ID
    ? r2AccountId(process.env.R2_ACCOUNT_ID)
    : undefined;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET?.trim();
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.trim();

  const missing = [
    ["R2_ACCOUNT_ID", accountId],
    ["R2_ACCESS_KEY_ID", accessKeyId],
    ["R2_SECRET_ACCESS_KEY", secretAccessKey],
    ["R2_BUCKET", bucket],
    ["R2_PUBLIC_BASE_URL", publicBaseUrl],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 is missing ${missing.join(", ")}. Set these variables or switch CLIP_STORAGE.`
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
  };
}

function getR2Client() {
  if (r2Client) return r2Client;

  const config = r2Config();
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

function r2PublicUrl(key) {
  const { publicBaseUrl } = r2Config();
  const url = new URL(publicBaseUrl);
  const prefix = url.pathname.replace(/\/+$/, "");
  url.pathname = `${prefix}/${key}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

function r2KeyFromUrl(value) {
  let base;
  try {
    base = new URL(r2Config().publicBaseUrl);
  } catch {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.origin !== base.origin) return null;

    const prefix = base.pathname.replace(/\/+$/, "");
    if (!url.pathname.startsWith(`${prefix}/`)) return null;

    const key = decodeURIComponent(url.pathname.slice(prefix.length + 1));
    return key || null;
  } catch {
    return null;
  }
}

async function listR2Keys(prefix) {
  const { bucket } = r2Config();
  const client = getR2Client();
  const keys = [];
  let continuationToken;

  do {
    const result = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const item of result.Contents ?? []) {
      if (item.Key) keys.push(item.Key);
    }
    continuationToken = result.IsTruncated
      ? result.NextContinuationToken
      : undefined;
  } while (continuationToken);

  return keys;
}

async function deleteR2Keys(keys) {
  if (keys.length === 0) return;

  const { bucket } = r2Config();
  const client = getR2Client();

  for (let start = 0; start < keys.length; start += 1000) {
    const batch = keys.slice(start, start + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
  }
}

function localUrls(jobId, rendered) {
  return {
    blobUrl: `/clips/${jobId}/${rendered.videoFile}`,
    thumbnailUrl: `/clips/${jobId}/${rendered.thumbnailFile}`,
    srtUrl: `/clips/${jobId}/${rendered.srtFile}`,
  };
}

async function publishToR2(jobId, outDir, rendered) {
  const { bucket } = r2Config();
  const client = getR2Client();
  const files = {
    blobUrl: rendered.videoFile,
    thumbnailUrl: rendered.thumbnailFile,
    srtUrl: rendered.srtFile,
  };
  const urls = {};

  for (const [key, file] of Object.entries(files)) {
    const body = await readFile(path.join(outDir, file));
    const objectKey = `clips/${jobId}/${file}`;
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    urls[key] = r2PublicUrl(objectKey);
  }

  return urls;
}

async function publishToVercel(jobId, outDir, rendered) {
  const token = blobToken();
  const files = {
    blobUrl: rendered.videoFile,
    thumbnailUrl: rendered.thumbnailFile,
    srtUrl: rendered.srtFile,
  };
  const urls = {};

  for (const [key, file] of Object.entries(files)) {
    const body = await readFile(path.join(outDir, file));
    const options = {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
    };
    const contentType = CONTENT_TYPES[path.extname(file).toLowerCase()];
    if (contentType) options.contentType = contentType;

    const blob = await put(`clips/${jobId}/${file}`, body, options);
    urls[key] = blob.url;
  }

  return urls;
}

export async function publishClipArtifacts({ jobId, outDir, rendered }) {
  const provider = storageProvider();
  if (provider === "local") {
    return localUrls(jobId, rendered);
  }
  if (provider === "r2") {
    return publishToR2(jobId, outDir, rendered);
  }
  return publishToVercel(jobId, outDir, rendered);
}

export async function deleteStoredUrl(url) {
  if (storageProvider() === "r2") {
    const key = r2KeyFromUrl(url);
    if (key) await deleteR2Keys([key]);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    await del([url], { token });
  }
}

export async function deleteJobBlobs(jobId) {
  if (storageProvider() === "r2") {
    const keys = await listR2Keys(`clips/${jobId}/`);
    await deleteR2Keys(keys);
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  const { blobs } = await list({
    prefix: `clips/${jobId}/`,
    token,
  });
  if (blobs.length > 0) {
    await del(
      blobs.map((blob) => blob.url),
      { token }
    );
  }
}
