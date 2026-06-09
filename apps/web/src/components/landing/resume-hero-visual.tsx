import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, Eye, ScanSearch, Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const SCORE_STEPS = [62, 71, 83, 91];
const MISSING_KEYWORDS = ["System Design", "Kubernetes", "CI/CD"];
const PHASE_DURATION = 2800;

type Phase =
  | "appear"
  | "scan"
  | "keywords"
  | "score"
  | "improve"
  | "heatmap"
  | "ready";

const PHASES: Phase[] = ["appear", "scan", "keywords", "score", "improve", "heatmap", "ready"];

const RESUME_SECTIONS = [
  { label: "Experience", strength: 72, heat: 0.9 },
  { label: "Projects", strength: 85, heat: 0.75 },
  { label: "Skills", strength: 58, heat: 0.5 },
  { label: "Education", strength: 90, heat: 0.35 },
];

function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: py * -6, ry: px * 8 });
  }, []);

  const onLeave = useCallback(() => setTilt({ rx: 0, ry: 0 }), []);

  return { ref, tilt, onMove, onLeave };
}

export function ResumeHeroVisual() {
  const reduceMotion = useReducedMotion();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [scoreIndex, setScoreIndex] = useState(0);
  const phase = PHASES[phaseIndex];
  const score = SCORE_STEPS[scoreIndex];
  const { ref, tilt, onMove, onLeave } = useTilt();

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      setPhaseIndex((i) => {
        const next = (i + 1) % PHASES.length;
        if (next === 0) setScoreIndex(0);
        return next;
      });
    }, PHASE_DURATION);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || phase !== "score") return;
    const timers = SCORE_STEPS.slice(1).map((_, i) =>
      setTimeout(() => setScoreIndex(i + 1), (i + 1) * 650),
    );
    return () => timers.forEach(clearTimeout);
  }, [phase, reduceMotion]);

  const showScan = phase === "scan" || phase === "keywords";
  const showKeywords = phase === "keywords" || phase === "score" || phase === "improve" || phase === "heatmap" || phase === "ready";
  const showImprove = phase === "improve" || phase === "heatmap" || phase === "ready";
  const showHeatmap = phase === "heatmap" || phase === "ready";
  const showReady = phase === "ready";

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0 lg:ml-auto perspective-[1200px]">
      {/* Floating metrics panel */}
      <motion.div
        className="absolute -left-4 top-8 z-20 hidden sm:block"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        <div className="landing-glass rounded-xl p-3 shadow-lg min-w-[140px]">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Live Analysis</div>
          <div className="space-y-2">
            <MetricRow label="ATS Score" value={score} color="text-chart-2" />
            <MetricRow label="Match" value={Math.min(98, score + 4)} suffix="%" color="text-primary" />
            <MetricRow label="Attention" value={Math.min(95, score - 3)} suffix="%" color="text-chart-5" />
          </div>
        </div>
      </motion.div>

      {/* Main resume card */}
      <motion.div
        ref={ref}
        className="relative"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="landing-glass-glow rounded-2xl p-1 shadow-2xl">
          <div className="relative overflow-hidden rounded-[14px] bg-card border border-card-border/80">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-chart-3/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-chart-2/60" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">resume.pdf</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <ScanSearch className="h-3 w-3 text-primary" />
                AI Scanning
              </div>
            </div>

            <div className="relative p-5 min-h-[340px]">
              {/* Resume content mock */}
              <div className="text-center mb-4">
                <div className="h-3 w-32 bg-foreground/80 rounded mx-auto mb-2" />
                <div className="h-2 w-48 bg-muted-foreground/30 rounded mx-auto" />
              </div>

              {["EDUCATION", "EXPERIENCE", "PROJECTS"].map((section, si) => (
                <div key={section} className="mb-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold tracking-widest text-foreground/70">{section}</span>
                    {showImprove && si === 1 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-0.5 text-[8px] text-chart-3 font-medium"
                      >
                        <AlertCircle className="h-2.5 w-2.5" /> Needs improvement
                      </motion.span>
                    )}
                  </div>
                  <div className="h-2 w-3/4 bg-foreground/15 rounded mb-1.5" />
                  <div className="space-y-1 pl-2">
                    {[0.95, 0.8, 0.65].map((w, bi) => (
                      <div
                        key={bi}
                        className={cn(
                          "h-1.5 rounded transition-colors duration-500",
                          showKeywords && si === 1 && bi === 0
                            ? "bg-chart-3/50 ring-1 ring-chart-3/40"
                            : "bg-muted-foreground/20",
                        )}
                        style={{ width: `${w * 100}%` }}
                      />
                    ))}
                  </div>
                  {showHeatmap && (
                    <motion.div
                      className="absolute inset-0 rounded pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        background: `linear-gradient(90deg, hsl(var(--primary) / ${RESUME_SECTIONS[si]?.heat ?? 0.3 * 0.15}) 0%, transparent 70%)`,
                      }}
                    />
                  )}
                </div>
              ))}

              {/* Missing keywords */}
              <AnimatePresence>
                {showKeywords && (
                  <motion.div
                    className="absolute bottom-4 left-4 right-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                  >
                    <div className="rounded-lg border border-chart-3/30 bg-chart-3/5 px-3 py-2">
                      <div className="text-[9px] font-semibold text-chart-3 mb-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Missing ATS Keywords
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {MISSING_KEYWORDS.map((kw, i) => (
                          <motion.span
                            key={kw}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.15 }}
                            className="rounded px-1.5 py-0.5 text-[8px] font-medium bg-chart-3/15 text-chart-3 border border-chart-3/25"
                          >
                            {kw}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan beam */}
              <AnimatePresence>
                {showScan && !reduceMotion && (
                  <motion.div
                    className="absolute left-0 right-0 h-[2px] z-10 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent, hsl(var(--primary)), hsl(var(--chart-5)), transparent)",
                      boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.4)",
                    }}
                    initial={{ top: "8%" }}
                    animate={{ top: ["8%", "88%", "8%"] }}
                    transition={{ duration: 2.2, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>

              {/* Scan overlay tint */}
              {showScan && (
                <div className="absolute inset-0 bg-primary/[0.03] pointer-events-none" />
              )}
            </div>

            {/* Score footer */}
            <div className="border-t border-border/60 px-4 py-3 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-3">
                <ScoreRingMini score={score} />
                <div>
                  <div className="text-[10px] text-muted-foreground">ATS Compatibility</div>
                  <motion.div
                    key={score}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm font-bold text-chart-2 tabular-nums"
                  >
                    {score}/100
                  </motion.div>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {showReady ? (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 rounded-full bg-chart-2/15 border border-chart-2/30 px-2.5 py-1"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                    <span className="text-[10px] font-semibold text-chart-2">Interview Ready</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Eye className="h-3 w-3" />
                    </motion.span>
                    Analyzing…
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Suggestions floating card */}
      <motion.div
        className="absolute -right-2 bottom-12 z-20 hidden sm:block"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <div className="landing-glass rounded-xl p-3 shadow-lg max-w-[160px]">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary mb-2">
            <Sparkles className="h-3 w-3" />
            Tailoring
          </div>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Rewrite weak bullets with quantified impact metrics
          </p>
          {showImprove && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              className="mt-2 h-1 rounded-full bg-chart-2/60"
            />
          )}
        </div>
      </motion.div>

      {/* Phase indicator dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={cn(
              "h-1 rounded-full transition-all duration-500",
              i === phaseIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/25",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  suffix = "",
  color,
}: {
  label: string;
  value: number;
  suffix?: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-bold tabular-nums", color)}>
        {value}
        {suffix}
      </span>
    </div>
  );
}

function ScoreRingMini({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? "hsl(var(--chart-2))" : score >= 50 ? "hsl(var(--chart-3))" : "hsl(var(--destructive))";

  return (
    <svg width="40" height="40" className="-rotate-90" aria-hidden>
      <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity={0.35} />
      <motion.circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ strokeDasharray: `${dash} ${circ}` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </svg>
  );
}
