import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, Crown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TailoredResumeRecord } from "@/lib/tailoring-types";

export function VersionHistoryPanel({
  versions,
  activeId,
  isPro,
  onDelete,
}: {
  versions: TailoredResumeRecord[];
  activeId?: string;
  isPro: boolean;
  onDelete?: (id: string) => void;
}) {
  if (versions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-5 text-center text-sm text-muted-foreground">
        No saved tailored versions yet. Generate your first tailored resume above.
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="font-semibold">Version history</h3>
        {!isPro && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Crown className="h-3 w-3" />
            Pro: unlimited saves & labels
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                v.id === activeId
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 hover:bg-muted/20",
              )}
            >
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <Link href={`/tailor/${v.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{v.label ?? v.targetRole ?? "Tailored resume"}</p>
                <p className="text-xs text-muted-foreground">
                  ATS {v.atsBefore} → {v.atsAfter} · {format(new Date(v.createdAt), "MMM d, yyyy")}
                </p>
              </Link>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => onDelete(v.id)}
                  aria-label="Delete version"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
