import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { del, list } from "@vercel/blob";

export type StorageProvider = "local" | "r2" | "blob";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
};

let r2Client: S3Client | null = null;

function r2AccountId(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed.includes("://")) return trimmed;

  try {
    return new URL(trimmed).hostname.split(".")[0] || trimmed;
  } catch {
    return trimmed;
  }
}

export function getStorageProvider(): StorageProvider {
  const value = (process.env.CLIP_STORAGE ?? "local").trim().toLowerCase();
  if (value === "r2") return "r2";
  if (value === "blob" || value === "vercel") return "blob";
  return "local";
}

export function getR2Config(): R2Config {
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
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    publicBaseUrl: publicBaseUrl!.replace(/\/+$/, ""),
  };
}

export function getR2Client() {
  if (r2Client) return r2Client;

  const config = getR2Config();
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

export function r2PublicUrl(key: string) {
  const { publicBaseUrl } = getR2Config();
  const url = new URL(publicBaseUrl);
  const prefix = url.pathname.replace(/\/+$/, "");
  url.pathname = `${prefix}/${key}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function r2KeyFromUrl(value: string) {
  let base: URL;
  try {
    base = new URL(getR2Config().publicBaseUrl);
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

function isVercelBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.hostname === "blob.vercel-storage.com" ||
      url.hostname.endsWith(".blob.vercel-storage.com") ||
      url.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export function isManagedUploadUrl(value: string, userId: string) {
  const provider = getStorageProvider();
  if (provider === "r2") {
    return r2KeyFromUrl(value)?.startsWith(`uploads/${userId}/`) ?? false;
  }
  if (provider === "blob") return isVercelBlobUrl(value);
  return false;
}

async function deleteR2Keys(keys: string[]) {
  if (keys.length === 0) return;

  const { bucket } = getR2Config();
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

async function listR2Keys(prefix: string) {
  const { bucket } = getR2Config();
  const client = getR2Client();
  const keys: string[] = [];
  let continuationToken: string | undefined;

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

export async function deleteStoredUrls(urls: string[]) {
  const r2Keys = urls
    .map((url) => r2KeyFromUrl(url))
    .filter((key): key is string => Boolean(key));

  if (r2Keys.length > 0) {
    try {
      await deleteR2Keys([...new Set(r2Keys)]);
    } catch {
      // Fall through so legacy Vercel Blob objects can still be removed.
    }
  }

  const vercelUrls = urls.filter(isVercelBlobUrl);
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (vercelUrls.length > 0 && token) {
    try {
      await del(vercelUrls, { token });
    } catch {
      // Cleanup is best effort.
    }
  }
}

export async function deleteJobClipObjects(jobId: string) {
  if (getStorageProvider() === "r2") {
    try {
      const keys = await listR2Keys(`clips/${jobId}/`);
      await deleteR2Keys(keys);
    } catch {
      // Fall through so legacy Vercel Blob objects can still be removed.
    }
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    try {
      const { blobs } = await list({ prefix: `clips/${jobId}/`, token });
      if (blobs.length > 0) {
        await del(
          blobs.map((blob) => blob.url),
          { token }
        );
      }
    } catch {
      // Cleanup is best effort.
    }
  }
}
