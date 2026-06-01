import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Brain, Target, Zap, CheckCircle, FileText,
  MessageSquare, Star, ChevronDown, ChevronUp, Mail,
  BarChart3, Shield, Clock, ScanSearch, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Resume Analysis",
    desc: "Get a precision score out of 100 with detailed strengths, weaknesses, and an overall summary powered by Llama 3.3 70B.",
  },
  {
    icon: Eye,
    title: "Recruiter Attention Analysis",
    desc: "See what a recruiter would likely notice in the first 10 seconds — section visibility, skim timeline, and layout fixes (heuristic-based, not eye tracking).",
  },
  {
    icon: Target,
    title: "Why You Will Get Rejected",
    desc: "Evidence-backed rejection reasons from your resume and the job description — with severity, recruiter impact, and prioritized fixes.",
  },
  {
    icon: ScanSearch,
    title: "ATS Keyword Scanner",
    desc: "See exactly which keywords are missing from your resume that applicant tracking systems look for — and how to add them.",
  },
  {
    icon: Zap,
    title: "Smart Rewrite Suggestions",
    desc: "Get before/after rewrites for every weak bullet point. Not vague tips — actual improved text you can copy straight in.",
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    desc: "Generate a tailored, compelling cover letter based on your resume and the specific job description in seconds.",
  },
  {
    icon: MessageSquare,
    title: "Interview Prep Questions",
    desc: "Get a personalised list of likely interview questions with expert tips on how to answer each one confidently.",
  },
  {
    icon: BarChart3,
    title: "Progress Dashboard",
    desc: "Track all your analyses over time — see how your scores improve as you iterate on your resume.",
  },
];

const STEPS = [
  { step: "01", title: "Upload Your Resume", desc: "Drag and drop your PDF or paste your resume text. We extract all content automatically." },
  { step: "02", title: "Paste the Job Description", desc: "Copy the job listing you're applying for. The more detail you provide, the better the analysis." },
  { step: "03", title: "Get AI Feedback", desc: "Receive your score, strengths, weaknesses, rewrite suggestions, cover letter, and interview prep — in seconds." },
];

const TESTIMONIALS = [
  {
    name: "Sarah K.",
    role: "Software Engineer",
    company: "Hired at Google",
    text: "After two months of silence, I ran my resume through ResumeAI and improved my ATS score from 42 to 81. Got 3 callbacks that week.",
    stars: 5,
  },
  {
    name: "James T.",
    role: "Product Manager",
    company: "Hired at Stripe",
    text: "The rewrite suggestions were shockingly specific. It flagged exactly the vague language recruiters skip over and gave me better versions instantly.",
    stars: 5,
  },
  {
    name: "Priya M.",
    role: "Data Scientist",
    company: "Hired at Meta",
    text: "The interview prep questions were spot-on. Three of the questions I got generated appeared almost word-for-word in my actual interview.",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "What formats does my resume need to be in?",
    a: "We accept PDF and plain text (.txt) files, up to 10MB. For best results, use a clean single-column PDF without complex tables or graphics.",
  },
  {
    q: "How accurate is the AI scoring?",
    a: "Our scoring is based on ATS compatibility, keyword matching against the job description, and resume quality signals. It's directionally accurate — use it to identify weaknesses, not as a guarantee of recruiter scoring.",
  },
  {
    q: "Is my resume data stored?",
    a: "Yes, analysis results are saved to your dashboard so you can track improvement over time. Your resume text is stored securely and never shared with third parties.",
  },
  {
    q: "What's the difference between Free and Pro?",
    a: "Free gives you 3 analyses per day with ATS score and basic feedback. Pro gives you unlimited analyses, rewrite suggestions, cover letter generation, interview prep questions, and 30-day history.",
  },
  {
    q: "Can I cancel my Pro subscription?",
    a: "Yes, cancel any time from your billing page. You keep Pro access until the end of your billing period.",
  },
];

const STATS = [
  { value: "10,000+", label: "Resumes analyzed" },
  { value: "3×", label: "More callbacks on average" },
  { value: "30 sec", label: "Average analysis time" },
  { value: "94%", label: "User satisfaction rate" },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {q}
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground mesh-bg">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResumeAI</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <a href="#features"><Button variant="ghost" size="sm">Features</Button></a>
            <a href="#faq"><Button variant="ghost" size="sm">FAQ</Button></a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link href="/sign-up"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="pointer-events-none absolute inset-0 flex justify-center">
          <div className="h-64 w-[min(100%,36rem)] rounded-full bg-primary/20 blur-[100px]" />
        </div>
        <Badge variant="secondary" className="relative mb-6 text-xs font-medium px-3 py-1 gap-1.5 border-primary/20">
          <Shield className="w-3 h-3" /> Llama 3.3 · ATS-aware · Free to start
        </Badge>
        <h1 className="relative text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
          Your resume, scored against<br />
          <span className="text-gradient">the job you actually want</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your resume, paste the job description, and get an ATS score, tailored rewrite suggestions, a cover letter, and interview prep — all in under 30 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 text-base px-8">
              Analyze My Resume Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-base px-8">See Pricing</Button>
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">3 free analyses per day. No credit card required.</p>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/60 bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-primary mb-1">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need to get hired</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">One tool replaces the resume reviewer, cover letter writer, and interview coach — all personalised to the exact job you want.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-panel rounded-xl p-6 hover-lift hover:border-primary/25 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Get results in 3 steps</h2>
            <p className="text-muted-foreground">Sign up free — your first analysis takes under 30 seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-5">
                  <span className="text-primary font-bold text-sm">{step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample result preview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">See what you get</h2>
          <p className="text-muted-foreground">A real analysis result — score, strengths, weaknesses, and rewrite suggestions.</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-8 max-w-3xl mx-auto shadow-lg">
          <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
            <div className="relative flex items-center justify-center shrink-0">
              <svg width="88" height="88">
                <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(240 6% 18%)" strokeWidth="6" />
                <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(262 83% 58%)" strokeWidth="6"
                  strokeDasharray="170 226" strokeLinecap="round" transform="rotate(-90 44 44)" />
              </svg>
              <div className="absolute text-center">
                <div className="text-2xl font-extrabold text-primary">75</div>
                <div className="text-xs text-muted-foreground">/100</div>
              </div>
            </div>
            <div>
              <div className="font-semibold text-lg mb-1">Strong match</div>
              <div className="text-sm text-muted-foreground">4 missing ATS keywords detected</div>
              <Badge variant="secondary" className="mt-2 text-xs">Software Engineer · FAANG Role</Badge>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Strengths</div>
              {["Strong quantified impact metrics", "Relevant tech stack alignment", "Clear progression shown"].map(s => (
                <div key={s} className="flex gap-2 text-sm mb-2"><span className="text-chart-2 font-bold">+</span>{s}</div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Weaknesses</div>
              {["Missing system design keywords", "No leadership examples", "Objective statement too generic"].map(w => (
                <div key={w} className="flex gap-2 text-sm mb-2"><span className="text-destructive font-bold">−</span>{w}</div>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Sample Rewrite Suggestion</div>
            <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-2">
              <div className="font-medium">Weak action verb on key bullet</div>
              <div className="text-muted-foreground line-through text-xs">Helped with improving the deployment pipeline.</div>
              <div className="text-chart-2 text-xs">Reduced deployment time by 40% by re-architecting the CI/CD pipeline using GitHub Actions and Docker.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/60 bg-muted/20 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">People who got hired</h2>
            <p className="text-muted-foreground">Real results from real job seekers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, company, text, stars }) => (
              <div key={name} className="bg-card border border-card-border rounded-xl p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-chart-3 text-chart-3" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4 text-foreground">"{text}"</p>
                <div>
                  <div className="font-semibold text-sm">{name}</div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                  <Badge variant="secondary" className="mt-2 text-xs text-chart-2">{company}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple, honest pricing</h2>
          <p className="text-muted-foreground">Start free. Upgrade when you need more power.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card border border-card-border rounded-xl p-8">
            <div className="text-xl font-bold mb-1">Free</div>
            <div className="text-4xl font-extrabold mb-1">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <p className="text-xs text-muted-foreground mb-6">Always free, no card needed</p>
            <ul className="space-y-3 mb-8">
              {["3 resume analyses per day", "ATS compatibility score", "Basic strengths & weaknesses", "Score out of 100"].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <Button variant="outline" className="w-full">Get Started Free</Button>
            </Link>
          </div>
          <div className="bg-primary/5 border border-primary/30 rounded-xl p-8 relative">
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs">Most Popular</Badge>
            <div className="text-xl font-bold mb-1">Pro</div>
            <div className="text-4xl font-extrabold mb-1">$9<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
            <p className="text-xs text-muted-foreground mb-6">Cancel anytime</p>
            <ul className="space-y-3 mb-8">
              {[
                "Unlimited analyses",
                "Detailed AI feedback",
                "Before/after rewrite suggestions",
                "Cover letter generator",
                "Interview prep questions",
                "30-day analysis history",
                "Priority processing",
              ].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />{f}
                </li>
              ))}
            </ul>
            <Link href="/sign-up">
              <Button className="w-full">Upgrade to Pro</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 bg-muted/20 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map(item => <FaqItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get more interviews?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of job seekers who've improved their resumes with AI-powered feedback. Start free today.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="gap-2 text-base px-10">
              Analyze My Resume Free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10 px-6 text-muted-foreground text-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Brain className="w-4 h-4 text-primary" />
              ResumeAI
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
            </div>
            <ThemeToggle />
          </div>
          <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
            <span>© 2026 ResumeAI. All rights reserved.</span>
            <div className="flex gap-4">
              <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
