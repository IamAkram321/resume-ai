import { useState } from "react";
import { ChevronDown, GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TailoringChange } from "@/lib/tailoring-types";

const TYPE_LABELS: Record<TailoringChange["type"], string> = {
  keyword: "Keyword",
  bullet_improvement: "Bullet",
  section_reorder: "Section order",
  visibility: "Visibility",
  wording: "Wording",
};

function ChangeRow({ change, index }: { change: TailoringChange; index: number }) {
  const [open, setOpen] = useState(index < 3);

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center gap-3 bg-muted/20 px-4 py-3 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xs font-bold text-primary">#{index + 1}</span>
        <Badge variant="outline" className="text-[10px]">
          {TYPE_LABELS[change.type]}
        </Badge>
        <span className="flex-1 truncate text-sm font-medium">{change.section}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="grid gap-0 border-t border-border/50 md:grid-cols-2">
          <div className="border-b md:border-b-0 md:border-r border-border/50 bg-destructive/5 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase text-destructive/80">Original</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{change.original}</p>
          </div>
          <div className="bg-chart-2/5 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase text-chart-2">Tailored</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{change.optimized}</p>
          </div>
          <div className="md:col-span-2 border-t border-border/50 bg-muted/10 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Why: </span>
              {change.reason}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function DiffViewer({
  original,
  tailored,
  changes,
}: {
  original: string;
  tailored: string;
  changes: TailoringChange[];
}) {
  const [view, setView] = useState<"changes" | "side-by-side">("changes");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <GitCompare className="h-4 w-4 text-primary" />
          Original vs tailored
        </h3>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              view === "changes" && "bg-primary text-primary-foreground",
            )}
            onClick={() => setView("changes")}
          >
            Change log ({changes.length})
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              view === "side-by-side" && "bg-primary text-primary-foreground",
            )}
            onClick={() => setView("side-by-side")}
          >
            Side by side
          </button>
        </div>
      </div>

      {view === "changes" ? (
        <div className="space-y-3">
          {changes.map((c, i) => (
            <ChangeRow key={`${c.section}-${i}`} change={c} index={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-4">
            <p className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Original resume</p>
            <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-xl bg-muted/20 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {original}
            </div>
          </div>
          <div className="glass-panel rounded-2xl p-4 ring-1 ring-primary/20">
            <p className="mb-3 text-xs font-semibold uppercase text-primary">Tailored resume</p>
            <div className="max-h-[min(70vh,520px)] overflow-y-auto rounded-xl bg-primary/5 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {tailored}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
