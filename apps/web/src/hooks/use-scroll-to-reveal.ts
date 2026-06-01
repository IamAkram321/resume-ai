import { useCallback, useEffect, useRef, useState } from "react";
import { scrollToRevealElement } from "@/lib/scroll-to-reveal";

/**
 * Pairs a section ref with scroll + highlight after async content appears.
 * Call `queueReveal()` after setting state that mounts the target section.
 */
export function useScrollToReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [revealToken, setRevealToken] = useState(0);

  const queueReveal = useCallback(() => {
    setRevealToken((n) => n + 1);
  }, []);

  useEffect(() => {
    if (revealToken === 0) return;
    scrollToRevealElement(ref.current);
  }, [revealToken]);

  return { ref, queueReveal };
}
