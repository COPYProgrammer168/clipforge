import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { MAX_UPLOAD_BYTES } from "@/lib/plans";
import { getWorkspaceUserId } from "@/lib/workspace";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const userId = await getWorkspaceUserId();

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-matroska",
          ],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
      onUploadCompleted: async () => {
        // The client records the uploaded blob when it creates the job.
      },
    });

    return Response.json(jsonResponse);
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
