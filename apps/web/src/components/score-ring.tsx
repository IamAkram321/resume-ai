import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 75) return "hsl(var(--chart-2))";
  if (score >= 50) return "hsl(var(--chart-3))";
  return "hsl(var(--destructive))";
}

function scoreLabel(score: number): string {
  if (score >= 75) return "Strong match";
  if (score >= 50) return "Moderate match";
  return "Needs work";
}

interface ScoreRingProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizes = {
  sm: { dim: 88, r: 36, stroke: 6, text: "text-2xl" },
  md: { dim: 120, r: 50, stroke: 8, text: "text-4xl" },
  lg: { dim: 152, r: 64, stroke: 9, text: "text-5xl" },
};

export function ScoreRing({ score, size = "md", className, showLabel = false }: ScoreRingProps) {
  const { dim, r, stroke, text } = sizes[size];
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  const c = dim / 2;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90" aria-hidden>
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            opacity={0.35}
          />
          <circle
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-[stroke-dasharray] duration-700 ease-out"
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          aria-label={`Score ${score} out of 100`}
        >
          <span className={cn("font-bold tabular-nums leading-none", text)} style={{ color }}>
            {score}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-foreground">{scoreLabel(score)}</span>
      )}
    </div>
  );
}

export { scoreLabel, scoreColor };
