import { Link } from "wouter";
import { Brain, CheckCircle, Crown, FileText, BarChart3, LogOut, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetMe, useCreateCheckout, useCreatePortalSession } from "@resume-ai/api-client-react";
import { useUser, useClerk } from "@clerk/react";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Billing() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { toast } = useToast();

  const { data: me } = useGetMe();
  const isPro = me?.tier === "pro";

  const checkout = useCreateCheckout({
    mutation: {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: (err: any) => {
        const msg = err?.data?.error ?? err?.message ?? "Checkout failed. Please try again.";
        toast({ title: "Checkout failed", description: msg, variant: "destructive" });
      },
    },
  });

  const portal = useCreatePortalSession({
    mutation: {
      onSuccess: (data) => { window.location.href = data.url; },
      onError: (err: any) => {
        const msg = err?.data?.error ?? err?.message ?? "Could not open billing portal.";
        toast({ title: "Portal error", description: msg, variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-60 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed top-0 left-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResumeAI</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link href="/dashboard">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors cursor-pointer" data-testid="nav-dashboard">
              <BarChart3 className="w-4 h-4" />Dashboard
            </div>
          </Link>
          <Link href="/analyze">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground text-sm transition-colors cursor-pointer" data-testid="nav-analyze">
              <FileText className="w-4 h-4" />Analyze Resume
            </div>
          </Link>
          <Link href="/billing">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-foreground text-sm font-medium cursor-pointer" data-testid="nav-billing">
              <Crown className="w-4 h-4" />Billing
            </div>
          </Link>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.firstName?.[0] ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.firstName ?? "User"}</div>
              <Badge variant="secondary" className="text-xs mt-0.5">{isPro ? "Pro" : "Free"}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => signOut({ redirectUrl: basePath || "/" })} data-testid="btn-signout">
            <LogOut className="w-4 h-4" />Sign out
          </Button>
        </div>
      </aside>

      <main className="ml-60 flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your subscription and billing</p>
          </div>

          {/* Current plan */}
          <div className="bg-card border border-card-border rounded-xl p-6 mb-6" data-testid="current-plan">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Current Plan</h2>
              <Badge variant={isPro ? "default" : "secondary"} className="gap-1">
                {isPro && <Crown className="w-3 h-3" />}
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>

            {isPro ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />Unlimited analyses
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />Detailed AI feedback with rewrite suggestions
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />30-day analysis history
                </div>
                <div className="pt-2">
                  <Button variant="outline" className="gap-2" disabled={portal.isPending} onClick={() => portal.mutate({})} data-testid="btn-manage-subscription">
                    {portal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    Manage Subscription
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />3 analyses per day
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />ATS score
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-chart-2" />Basic feedback
                </div>
              </div>
            )}
          </div>

          {/* Upgrade (free users) */}
          {!isPro && (
            <div className="bg-primary/5 border border-primary/30 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Upgrade to Pro</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Get unlimited analyses, detailed feedback with rewrite suggestions, and 30-day history for just $9/month.
              </p>
              <div className="text-3xl font-extrabold mb-4">
                $9<span className="text-lg font-normal text-muted-foreground">/month</span>
              </div>
              <Button className="gap-2" disabled={checkout.isPending} onClick={() => checkout.mutate({})} data-testid="btn-upgrade">
                {checkout.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                {checkout.isPending ? "Redirecting..." : "Upgrade to Pro"}
              </Button>
              <p className="text-xs text-muted-foreground mt-3">Secure payment via Stripe. Cancel anytime.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
