import { Link } from "wouter";
import { CheckCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCheckout } from "@resume-ai/api-client-react";
import { useToast } from "@/hooks/use-toast";

export default function Pricing() {
  const { toast } = useToast();
  const checkout = useCreateCheckout({
    mutation: {
      onSuccess: (data) => {
        window.location.href = data.url;
      },
      onError: () => {
        toast({ title: "Error", description: "Could not start checkout. Please sign in first.", variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border/50 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResumeAI</span>
          </div>
        </Link>
        <div className="flex gap-3">
          <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Simple, honest pricing</h1>
          <p className="text-muted-foreground text-lg">Start free. Upgrade to Pro when you need more power.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-card border border-card-border rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-2">Free</h2>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-muted-foreground mb-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              {[
                "3 resume analyses per day",
                "ATS compatibility score",
                "Basic strengths & weaknesses",
                "Score out of 100",
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full" data-testid="free-plan-cta">Get Started Free</Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-primary/5 border-2 border-primary/40 rounded-2xl p-8 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4">
              Most Popular
            </Badge>
            <h2 className="text-xl font-bold mb-2">Pro</h2>
            <div className="flex items-end gap-1 mb-6">
              <span className="text-5xl font-extrabold">$9</span>
              <span className="text-muted-foreground mb-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm">
              {[
                "Unlimited analyses",
                "Detailed AI feedback",
                "Before/after rewrite suggestions",
                "Missing ATS keywords",
                "30-day analysis history",
                "Priority processing",
              ].map(f => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              data-testid="pro-plan-cta"
              disabled={checkout.isPending}
              onClick={() => checkout.mutate({})}
            >
              {checkout.isPending ? "Redirecting..." : "Upgrade to Pro"}
            </Button>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8">
          All plans include ATS scoring. Cancel anytime. Questions?{" "}
          <a href="mailto:akramshahjada786@gmail.com" className="text-primary hover:underline">Contact us</a>
        </p>
      </div>
    </div>
  );
}
