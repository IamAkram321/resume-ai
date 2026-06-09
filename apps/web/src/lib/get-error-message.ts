/** Extract a user-visible message from API / fetch errors. */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) {
    const msg = err.message;
    const colon = msg.indexOf(": ");
    if (colon > 0 && msg.startsWith("HTTP ")) {
      return msg.slice(colon + 2).trim();
    }
    return msg;
  }

  if (err && typeof err === "object") {
    const data = (err as { data?: { error?: string } }).data;
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return fallback;
}
