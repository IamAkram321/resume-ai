import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export function AiCursor() {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [nearCta, setNearCta] = useState(false);

  useEffect(() => {
    if (isMobile || reduceMotion) return;

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
      const target = (e.target as HTMLElement)?.closest?.("a, button, [data-magnetic]");
      setNearCta(!!target);
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [isMobile, reduceMotion]);

  if (isMobile || reduceMotion) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[200] hidden md:block"
        animate={{
          x: pos.x - 6,
          y: pos.y - 6,
          opacity: visible ? 1 : 0,
          scale: nearCta ? 1.35 : 1,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.4 }}
        aria-hidden
      >
        <div
          className="h-3 w-3 rounded-full border border-primary/50 bg-primary/20"
          style={{ boxShadow: nearCta ? "0 0 20px 4px hsl(var(--primary) / 0.35)" : "0 0 8px 2px hsl(var(--primary) / 0.2)" }}
        />
      </motion.div>
      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[199] hidden md:block"
        animate={{
          x: pos.x - 20,
          y: pos.y - 20,
          opacity: visible ? 0.35 : 0,
        }}
        transition={{ type: "spring", stiffness: 180, damping: 26, mass: 0.6 }}
        aria-hidden
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 blur-md" />
      </motion.div>
    </>
  );
}
