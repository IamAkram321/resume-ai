import { motion, useReducedMotion } from "framer-motion";

const FLOATING_KEYWORDS = [
  "React", "TypeScript", "Leadership", "AWS", "CI/CD", "System Design",
  "Python", "Kubernetes", "Agile", "SQL", "API", "Docker",
];

export function LandingBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {/* Animated mesh */}
      <motion.div
        className="absolute inset-0 landing-mesh"
        animate={reduceMotion ? undefined : { opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Slow spotlight */}
      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full bg-primary/8 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: ["-10%", "15%", "-5%"], y: ["-5%", "10%", "0%"] }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        style={{ left: "30%", top: "10%" }}
      />
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full bg-chart-5/10 blur-[100px]"
        animate={
          reduceMotion
            ? undefined
            : { x: ["10%", "-8%", "5%"], y: ["5%", "-10%", "8%"] }
        }
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
        style={{ right: "5%", top: "40%" }}
      />

      {/* Scan lines */}
      <div className="absolute inset-0 landing-scan-lines opacity-[0.04]" />

      {/* Document pattern */}
      <div className="absolute inset-0 landing-doc-pattern opacity-[0.03]" />

      {/* Floating ATS keywords */}
      {!reduceMotion &&
        FLOATING_KEYWORDS.map((word, i) => (
          <motion.span
            key={word}
            className="absolute rounded-full border border-primary/10 bg-card/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground/60 backdrop-blur-sm"
            style={{
              left: `${8 + (i * 7.3) % 82}%`,
              top: `${12 + (i * 11.7) % 75}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.25, 0.55, 0.25],
            }}
            transition={{
              duration: 8 + (i % 4) * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          >
            {word}
          </motion.span>
        ))}
    </div>
  );
}
