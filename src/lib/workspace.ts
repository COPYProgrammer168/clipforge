import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const WORKSPACE_EMAIL = "studio@clipforge.local";
export const WORKSPACE_NAME = "ClipForge Studio";
export const WORKSPACE_PLAN = "business";

export async function getWorkspaceUserId() {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, WORKSPACE_EMAIL),
    columns: { id: true },
  });

  if (existing) return existing.id;

  const [created] = await db
    .insert(users)
    .values({
      name: WORKSPACE_NAME,
      email: WORKSPACE_EMAIL,
      plan: WORKSPACE_PLAN,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (created) return created.id;

  const raced = await db.query.users.findFirst({
    where: eq(users.email, WORKSPACE_EMAIL),
    columns: { id: true },
  });

  if (!raced) {
    throw new Error("Could not initialize the studio workspace.");
  }

  return raced.id;
}
