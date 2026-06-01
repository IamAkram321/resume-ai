import { CheckCircle, Crown, Loader2, ExternalLink, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetMe, useCreateCheckout, useCreatePortalSession } from "@resume-ai/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";

export default function Billing() {
  const { toast } = useToast();
  const { data: me } = useGetMe();
  const isPro = me?.tier === "pro";

  const checkout = useCreateCheckout({
    mutation: {
      onSuccess: (data) => {
        window.location.href = data.url;
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({
          title: "Checkout failed",
          description: err?.data?.error ?? "Please try again.",
          variant: "destructive",
        });
      },
    },
  });

  const portal = useCreatePortalSession({
    mutation: {
      onSuccess: (data) => {
        window.location.href = data.url;
      },
      onError: (err: { data?: { error?: string } }) => {
        toast({
          title: "Portal error",
          description: err?.data?.error ?? "Could not open billing portal.",
          variant: "destructive",
        });
      },
    },
  });

  const proFeatures = [
    "Unlimited resume analyses",
    "ATS score + rewrite suggestions",
    "AI cover letter generator",
    "Personalized interview prep",
    "30-day analysis history",
  ];

  const freeFeatures = [
    "3 analyses per day",
    "ATS compatibility score",
    "Strengths & gap analysis",
  ];

  return (
    <AppShell title="Billing" description="Manage your plan and subscription." isPro={isPro}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="glass-panel rounded-2xl p-6" data-testid="current-plan">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Current plan</h2>
            <Badge variant={isPro ? "default" : "secondary"} className="gap-1">
              {isPro && <Crown className="h-3 w-3" />}
              {isPro ? "Pro" : "Free"}
            </Badge>
          </div>
          <ul className="space-y-2">
            {(isPro ? proFeatures : freeFeatures).map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 shrink-0 text-chart-2" />
                {f}
              </li>
            ))}
          </ul>
          {isPro && (
            <Button
              variant="outline"
              className="mt-4 gap-2"
              disabled={portal.isPending}
              onClick={() => portal.mutate()}
              data-testid="btn-manage-subscription"
            >
              {portal.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Manage subscription
            </Button>
          )}
        </div>

        {!isPro && (
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6">
            <div className="mb-2 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Upgrade to Pro</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Unlock cover letters, interview prep, and unlimited analyses.
            </p>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Cover letters
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Interview prep
              </span>
            </div>
            <div className="mb-4 text-3xl font-extrabold">
              $9<span className="text-lg font-normal text-muted-foreground">/month</span>
            </div>
            <Button
              className="gap-2 glow-ring"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate()}
              data-testid="btn-upgrade"
            >
              {checkout.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crown className="h-4 w-4" />
              )}
              {checkout.isPending ? "Redirecting…" : "Upgrade to Pro"}
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
