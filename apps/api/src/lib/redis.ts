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

  return { allowed: true, remaining: 3 - current, used: current };
}

/** Call only after a successful analysis to consume a free-tier slot. */
export async function incrementRateLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `analyze:${userId}:${today}`;
  await redis.incr(key);
  await redis.expire(key, 86400);
}

export async function getUsageCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const key = `analyze:${userId}:${today}`;
  const count = await redis.get<string>(key);
  return count ? parseInt(count) : 0;
}

const TAILOR_DAILY_LIMIT = 1;

export async function checkTailorRateLimit(
  userId: string,
): Promise<{ allowed: boolean; remaining: number; used: number; limit: number }> {
  const today = new Date().toISOString().split("T")[0];
  const key = `tailor:${userId}:${today}`;
  const count = await redis.get<string>(key);
  const current = count ? parseInt(count) : 0;

  if (current >= TAILOR_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, used: current, limit: TAILOR_DAILY_LIMIT };
  }

  return {
    allowed: true,
    remaining: TAILOR_DAILY_LIMIT - current,
    used: current,
    limit: TAILOR_DAILY_LIMIT,
  };
}

export async function incrementTailorRateLimit(userId: string): Promise<void> {
  const today = new Date().toISOString().split("T")[0];
  const key = `tailor:${userId}:${today}`;
  await redis.incr(key);
  await redis.expire(key, 86400);
}

export async function getTailorUsageCount(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const key = `tailor:${userId}:${today}`;
  const count = await redis.get<string>(key);
  return count ? parseInt(count) : 0;
}
