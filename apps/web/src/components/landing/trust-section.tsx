import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Eye, TrendingUp } from "lucide-react";
import { FadeInView } from "./fade-in-view";

const BEFORE_BULLETS = [
  "Helped with improving the deployment pipeline",
  "Worked on various backend tasks",
  "Used React and Node.js on projects",
];

const AFTER_BULLETS = [
  "Reduced deployment time by 40% by re-architecting CI/CD with GitHub Actions",
  "Built REST APIs serving 50k+ daily requests with 99.9% uptime",
  "Led migration to TypeScript across apps/api and apps/web monorepo",
];

const HEATMAP_SECTIONS = [
  { name: "Experience", attention: 92 },
  { name: "Projects", attention: 78 },
  { name: "Skills", attention: 45 },
  { name: "Education", attention: 30 },
];

export function TrustSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="py-24 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        <FadeInView className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Proof</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">See the difference instantly</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload resume → Improve resume → Get interviews. The product working in real time.
          </p>
        </FadeInView>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Before / After */}
          <FadeInView delay={0.1}>
            <div className="landing-glass rounded-2xl p-6 h-full border border-card-border/60">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="h-4 w-4 text-chart-2" />
                <h3 className="font-semibold">Before vs After</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <CompareColumn label="Before" score={62} bullets={BEFORE_BULLETS} variant="weak" />
                <CompareColumn label="After" score={91} bullets={AFTER_BULLETS} variant="strong" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span className="font-bold text-chart-2">+29</span> ATS score improvement
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </FadeInView>

          {/* Recruiter heatmap */}
          <FadeInView delay={0.2}>
            <div className="landing-glass rounded-2xl p-6 h-full border border-card-border/60">
              <div className="flex items-center gap-2 mb-5">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Recruiter Attention Heatmap</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Where recruiters spend time in the first 10 seconds
              </p>
              <div className="space-y-3">
                {HEATMAP_SECTIONS.map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground tabular-nums">{s.attention}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background:
                            s.attention >= 75
                              ? "linear-gradient(90deg, hsl(var(--chart-2)), hsl(var(--primary)))"
                              : s.attention >= 50
                                ? "linear-gradient(90deg, hsl(var(--chart-3)), hsl(var(--chart-5)))"
                                : "linear-gradient(90deg, hsl(var(--muted-foreground) / 0.4), hsl(var(--muted-foreground) / 0.2))",
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.attention}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: reduceMotion ? 0 : 0.8, delay: i * 0.1, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>

        {/* ATS Report preview */}
        <FadeInView delay={0.15}>
          <div className="landing-glass-glow rounded-2xl p-8 max-w-3xl mx-auto border border-primary/15">
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-border/60">
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="96" height="96" className="-rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" opacity={0.35} />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="226 251"
                    initial={{ strokeDasharray: "0 251" }}
                    whileInView={{ strokeDasharray: "226 251" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-3xl font-extrabold text-chart-2">91</div>
                  <div className="text-[10px] text-muted-foreground">/100</div>
                </div>
              </div>
              <div className="text-center sm:text-left">
                <div className="font-semibold text-lg mb-1">Strong match — Interview Ready</div>
                <div className="text-sm text-muted-foreground">3 keywords added · 2 bullets rewritten · Layout preserved</div>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {["System Design", "Kubernetes", "CI/CD"].map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-chart-2/10 border border-chart-2/25 px-2 py-0.5 text-[10px] font-medium text-chart-2"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Strengths</div>
                {["Quantified impact metrics", "Tech stack alignment", "ATS-friendly formatting"].map((s) => (
                  <div key={s} className="flex gap-2 text-sm mb-2">
                    <span className="text-chart-2 font-bold">+</span>
                    {s}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Optimized</div>
                {["Weak action verbs replaced", "Missing keywords integrated", "Section density preserved"].map((w) => (
                  <div key={w} className="flex gap-2 text-sm mb-2">
                    <span className="text-primary font-bold">✓</span>
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </FadeInView>
      </div>
    </section>
  );
}

function CompareColumn({
  label,
  score,
  bullets,
  variant,
}: {
  label: string;
  score: number;
  bullets: string[];
  variant: "weak" | "strong";
}) {
  return (
    <div
      className={`rounded-xl p-4 ${
        variant === "weak"
          ? "bg-muted/30 border border-border/60"
          : "bg-chart-2/5 border border-chart-2/20"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span
          className={`text-lg font-bold tabular-nums ${
            variant === "weak" ? "text-chart-3" : "text-chart-2"
          }`}
        >
          {score}
        </span>
      </div>
      <ul className="space-y-2">
        {bullets.map((b) => (
          <li
            key={b}
            className={`text-[11px] leading-relaxed ${
              variant === "weak" ? "text-muted-foreground line-through decoration-chart-3/40" : "text-foreground"
            }`}
          >
            • {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
