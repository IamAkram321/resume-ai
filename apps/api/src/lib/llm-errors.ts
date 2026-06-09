/** Map Groq / LLM failures to HTTP responses with clear user-facing messages. */

export function isGroqRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { status?: number; error?: { error?: { code?: string } } };
  return e.status === 429 || e.error?.error?.code === "rate_limit_exceeded";
}

function parseRetryMinutes(err: unknown): number | undefined {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err !== null && "message" in err
        ? String((err as { message: unknown }).message)
        : "";
  const match = message.match(/try again in (\d+)m/i);
  if (match) return Math.max(1, parseInt(match[1], 10));
  const secMatch = message.match(/try again in (\d+(?:\.\d+)?)s/i);
  if (secMatch) return Math.max(1, Math.ceil(parseFloat(secMatch[1]) / 60));
  return undefined;
}

export function mapLlmErrorToResponse(
  err: unknown,
  fallbackMessage: string,
): { status: number; body: { error: string; code?: string; retryAfterMinutes?: number } } {
  if (isGroqRateLimitError(err)) {
    const retryAfterMinutes = parseRetryMinutes(err) ?? 30;
    return {
      status: 429,
      body: {
        error: `Daily AI token limit reached on your Groq account (free tier is ~100k tokens/day). Try again in about ${retryAfterMinutes} minutes, or upgrade at console.groq.com/settings/billing.`,
        code: "ai_rate_limit",
        retryAfterMinutes,
      },
    };
  }

  return {
    status: 502,
    body: { error: fallbackMessage, code: "ai_error" },
  };
}
