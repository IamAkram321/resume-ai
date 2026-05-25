import { eq } from "drizzle-orm";
import { db, usersTable } from "@resume-ai/db";
import { randomUUID } from "crypto";

export async function getOrCreateUser(clerkUserId: string) {
  let [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId));

  if (!user) {
    [user] = await db
      .insert(usersTable)
      .values({
        id: randomUUID(),
        clerkId: clerkUserId,
        email: `${clerkUserId}@unknown.com`,
        tier: "free",
      })
      .returning();
  }
  return user;
}
