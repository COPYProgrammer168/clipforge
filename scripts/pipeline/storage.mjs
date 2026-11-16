import { readFile } from "node:fs/promises";
import path from "node:path";
import { del, list, put } from "@vercel/blob";

const CONTENT_TYPES = {
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".srt": "application/x-subrip",
};

export function usesBlobStorage() {
  return (process.env.CLIP_STORAGE ?? "local").trim().toLowerCase() === "blob";
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

function localUrls(jobId, rendered) {
  return {
    blobUrl: `/clips/${jobId}/${rendered.videoFile}`,
    thumbnailUrl: `/clips/${jobId}/${rendered.thumbnailFile}`,
    srtUrl: `/clips/${jobId}/${rendered.srtFile}`,
  };
}

export async function publishClipArtifacts({ jobId, outDir, rendered }) {
  if (!usesBlobStorage()) {
    return localUrls(jobId, rendered);
  }

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

export async function deleteJobBlobs(jobId) {
  if (!usesBlobStorage()) return;

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
