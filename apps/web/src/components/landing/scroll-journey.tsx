import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Brain, CheckCircle2, FileUp, MessageSquare, ScanSearch, Sparkles, Target, Wand2,
} from "lucide-react";
import { FadeInView } from "./fade-in-view";

const JOURNEY_STEPS = [
  {
    id: "upload",
    step: 1,
    title: "Resume Uploaded",
    desc: "Your PDF is parsed — structure, fonts, and layout preserved for tailoring.",
    icon: FileUp,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/25",
  },
  {
    id: "analysis",
    step: 2,
    title: "AI Analysis Begins",
    desc: "Llama 3.3 scores your resume against the job description in under 30 seconds.",
    icon: Brain,
    color: "text-chart-5",
    bg: "bg-chart-5/10 border-chart-5/25",
  },
  {
    id: "ats",
    step: 3,
    title: "ATS Issues Found",
    desc: "Missing keywords, formatting risks, and compatibility gaps are flagged with evidence.",
    icon: ScanSearch,
    color: "text-chart-3",
    bg: "bg-chart-3/10 border-chart-3/25",
  },
  {
    id: "keywords",
    step: 4,
    title: "Keyword Gaps Highlighted",
    desc: "See exactly which terms recruiters and ATS systems expect — and where to add them.",
    icon: Target,
    color: "text-chart-3",
    bg: "bg-chart-3/10 border-chart-3/25",
  },
  {
    id: "tailor",
    step: 5,
    title: "Resume Tailored",
    desc: "One-click optimization rewrites weak bullets while preserving your real experience.",
    icon: Wand2,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/25",
  },
  {
    id: "interview",
    step: 6,
    title: "Interview Prep Generated",
    desc: "Personalized questions and answer strategies based on your resume and the role.",
    icon: MessageSquare,
    color: "text-chart-5",
    bg: "bg-chart-5/10 border-chart-5/25",
  },
  {
    id: "ready",
    step: 7,
    title: "Interview Ready",
    desc: "ATS-optimized PDF, improved score, and confidence to apply.",
    icon: CheckCircle2,
    color: "text-chart-2",
    bg: "bg-chart-2/10 border-chart-2/25",
  },
];

export function ScrollJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const lineScale = useTransform(scrollYProgress, [0.1, 0.85], [0, 1]);

  return (
    <section ref={containerRef} className="relative py-24 overflow-hidden">
      <div className="max-w-4xl mx-auto px-6">
        <FadeInView className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">The Journey</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Watch your resume transform</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Scroll through the complete ResumeAI pipeline — from upload to interview-ready.
          </p>
        </FadeInView>

        <div className="relative">
          {/* Progress line */}
          <div className="absolute left-[23px] md:left-1/2 md:-translate-x-px top-0 bottom-0 w-px bg-border/60">
            <motion.div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-chart-5 to-chart-2 origin-top"
              style={{ scaleY: reduceMotion ? 1 : lineScale, height: "100%" }}
            />
          </div>

          <div className="space-y-12">
            {JOURNEY_STEPS.map((step, i) => (
              <JourneyStep key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyStep({
  step,
  index,
}: {
  step: (typeof JOURNEY_STEPS)[number];
  index: number;
}) {
  const isEven = index % 2 === 0;
  const Icon = step.icon;

  return (
    <FadeInView
      delay={index * 0.05}
      direction={isEven ? "left" : "right"}
      className={`relative flex items-start gap-6 md:gap-0 ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      }`}
    >
      {/* Node */}
      <div className="relative z-10 flex-shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2">
        <motion.div
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${step.bg} backdrop-blur-sm`}
          whileInView={{ scale: [0.8, 1.05, 1] }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Icon className={`w-5 h-5 ${step.color}`} />
        </motion.div>
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground tabular-nums">
          {String(step.step).padStart(2, "0")}
        </span>
      </div>

      {/* Card */}
      <div
        className={`flex-1 md:w-[calc(50%-40px)] ${
          isEven ? "md:pr-16 md:text-right" : "md:pl-16 md:ml-auto"
        }`}
      >
        <motion.div
          className="landing-glass rounded-xl p-5 border border-card-border/60"
          whileInView={{ opacity: [0.6, 1], y: [12, 0] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`flex items-center gap-2 mb-2 ${isEven ? "md:justify-end" : ""}`}>
            {step.id === "ready" && <Sparkles className="h-3.5 w-3.5 text-chart-2" />}
            <h3 className="font-semibold text-base">{step.title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        </motion.div>
      </div>
    </FadeInView>
  );
}
