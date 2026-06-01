/** Extra space below the sticky app header so section titles stay visible. */
const SCROLL_OFFSET_FALLBACK_PX = 88;

function getStickyHeaderOffset(): number {
  const header = document.querySelector("header.sticky");
  if (!header) return SCROLL_OFFSET_FALLBACK_PX;
  return header.getBoundingClientRect().height + 16;
}

/**
 * Smooth-scrolls to an element and briefly highlights it after layout.
 * Uses double rAF so scroll runs after React has painted new content.
 */
export function scrollToRevealElement(
  element: HTMLElement | null,
  options?: { highlightDurationMs?: number },
): void {
  if (!element) return;

  const duration = options?.highlightDurationMs ?? 1600;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const offset = getStickyHeaderOffset();
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  });

  element.classList.add("pro-result-highlight");
  window.setTimeout(() => {
    element.classList.remove("pro-result-highlight");
  }, duration);
}
