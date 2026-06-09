import { Badge } from "@/components/ui/badge";
import type { KeywordOptimization } from "@/lib/tailoring-types";

function KeywordGroup({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "secondary" | "default" | "outline";
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None identified</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((k) => (
            <Badge key={k} variant={variant} className="font-normal">
              {k}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function KeywordPanel({ keywords }: { keywords: KeywordOptimization }) {
  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <h3 className="font-semibold">Keyword optimization</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        How keywords from the job description appear in your tailored resume.
      </p>
      <div className="mt-5 space-y-5">
        <KeywordGroup title="Already present" items={keywords.present} variant="secondary" />
        <KeywordGroup title="Added in tailored version" items={keywords.added} variant="default" />
        <KeywordGroup title="Still missing (optional to add if truthful)" items={keywords.stillMissing} variant="outline" />
      </div>
    </div>
  );
}
