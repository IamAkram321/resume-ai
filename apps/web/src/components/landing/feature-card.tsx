import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  index?: number;
}

export function FeatureCard({ icon: Icon, title, desc, index = 0 }: FeatureCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        "group relative rounded-xl p-6 landing-glass landing-feature-card",
        "border border-card-border/60 transition-colors duration-300",
      )}
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduceMotion ? undefined : { y: -4 }}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-chart-5/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none landing-feature-glow" />

      <motion.div
        className="relative w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:border-primary/40 transition-colors"
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
      >
        <Icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
      </motion.div>

      <h3 className="relative font-semibold text-base mb-2 group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>
      <p className="relative text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
