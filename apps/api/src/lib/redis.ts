import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function checkRateLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number; used: number }> {
  const today = new Date().toISOString().split("T")[0];
  const key = `analyze:${userId}:${today}`;

  const count = await redis.get<string>(key);
  const current = count ? parseInt(count) : 0;

  if (current >= 3) {
    return { allowed: false, remaining: 0, used: current };
  }

  await redis.incr(key);
  await redis.expire(key, 86400);

  const newCount = current + 1;
  return { allowed: true, remaining: 3 - newCount, used: newCount };
}

export async function getUsageCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const key = `analyze:${userId}:${today}`;
  const count = await redis.get<string>(key);
  return count ? parseInt(count) : 0;
}
