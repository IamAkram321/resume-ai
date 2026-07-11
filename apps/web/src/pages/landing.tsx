import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowRight, Brain, Target, Zap, CheckCircle, FileText,
  MessageSquare, Star, ChevronDown, ChevronUp, Mail,
  BarChart3, Shield, ScanSearch, Eye, Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingBackground } from "@/components/landing/landing-background";
import { ResumeHeroVisual } from "@/components/landing/resume-hero-visual";
import { FeatureCard } from "@/components/landing/feature-card";
import { ScrollJourney } from "@/components/landing/scroll-journey";
import { TrustSection } from "@/components/landing/trust-section";
import { FadeInView } from "@/components/landing/fade-in-view";
import { CountUp } from "@/components/landing/count-up";
import { MagneticButton } from "@/components/landing/magnetic-button";

const FEATURES = [
  {
    icon: Wand2,
    title: "One-Click Resume Tailoring",
    desc: "Tailor your full resume for any role in one click — side-by-side diff, keyword report, and recruiter impact. Never invents experience.",
  },
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
  { step: "03", title: "Get AI Feedback", desc: "Receive your score, strengths, weaknesses, and recruiter intelligence — in seconds." },
  { step: "04", title: "Tailor & Apply", desc: "One-click tailor your resume, compare original vs optimized, and download an ATS-friendly PDF." },
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
    a: "Free gives you 1 use per feature per day — analysis, tailoring, cover letters, and interview prep. Nothing is locked. Pro removes all daily limits for unlimited access.",
  },
  {
    q: "Can I cancel my Pro subscription?",
    a: "Yes, cancel any time from your billing page. You keep Pro access until the end of your billing period.",
  },
];

const STATS = [
  { value: 10000, suffix: "+", label: "Resumes analyzed" },
  { value: 3, suffix: "×", label: "More callbacks on average" },
  { value: 30, suffix: " sec", label: "Average analysis time" },
  { value: 94, suffix: "%", label: "User satisfaction rate" },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing-glass rounded-xl overflow-hidden border border-card-border/60">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {q}
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/60 bg-muted/10">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <LandingBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center border border-border shadow-sm">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">ResumeAI</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <Link href="/pricing"><Button variant="ghost" size="sm">Pricing</Button></Link>
            <a href="#features"><Button variant="ghost" size="sm">Features</Button></a>
            <a href="#journey"><Button variant="ghost" size="sm">How it works</Button></a>
            <a href="#faq"><Button variant="ghost" size="sm">FAQ</Button></a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <MagneticButton data-magnetic>
              <Link href="/sign-up">
                <Button size="sm" className="landing-cta-glow" data-magnetic>Get started</Button>
              </Link>
            </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Hero — split layout with animated visual */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6 text-xs font-medium px-3 py-1 gap-1.5 border-primary/25 bg-primary/5">
                <Shield className="w-3 h-3" /> Llama 3.3 · ATS-aware · Free to start
              </Badge>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Resume
              <span className="text-muted-foreground/60"> → </span>
              AI Analysis
              <span className="text-muted-foreground/60"> → </span>
              <span className="text-gradient">Interview Ready</span>
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Upload your resume, paste the job description, and watch AI scan, score, and optimize — ATS keywords, recruiter attention, and tailored rewrites in under 30 seconds.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <MagneticButton data-magnetic>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 text-base px-8 landing-cta-glow w-full sm:w-auto" data-magnetic>
                    Analyze My Resume Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </MagneticButton>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-base px-8 w-full sm:w-auto">
                  See Pricing
                </Button>
              </Link>
            </motion.div>
            <motion.p
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Try every feature free — 1 use per day. No credit card required.
            </motion.p>
          </div>

          <ResumeHeroVisual />
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm py-10">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(({ value, suffix, label }, i) => (
            <FadeInView key={label} delay={i * 0.08}>
              <div className="text-3xl font-extrabold text-primary mb-1 tabular-nums">
                <CountUp value={value} suffix={suffix} />
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* Scroll journey storytelling */}
      <div id="journey">
        <ScrollJourney />
      </div>

      {/* Trust / proof */}
      <TrustSection />

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <FadeInView className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Capabilities</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need to get hired</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            One tool replaces the resume reviewer, cover letter writer, and interview coach — all personalised to the exact job you want.
          </p>
        </FadeInView>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* How it works — compact */}
      <section className="border-t border-border/40 bg-muted/10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <FadeInView className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Get results in 4 steps</h2>
            <p className="text-muted-foreground">Sign up free — your first analysis takes under 30 seconds.</p>
          </FadeInView>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {STEPS.map(({ step, title, desc }, i) => (
              <FadeInView key={step} delay={i * 0.1} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-5 landing-glass">
                  <span className="text-primary font-bold text-sm">{step}</span>
                </div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-border/40 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <FadeInView className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">People who got hired</h2>
            <p className="text-muted-foreground">Real results from real job seekers.</p>
          </FadeInView>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeInView key={t.name} delay={i * 0.1}>
                <div className="landing-glass rounded-xl p-6 h-full border border-card-border/60 hover:border-primary/20 transition-colors duration-300">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-chart-3 text-chart-3" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 text-foreground">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                    <Badge variant="secondary" className="mt-2 text-xs">{t.company}</Badge>
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <FadeInView className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Simple, honest pricing</h2>
          <p className="text-muted-foreground">Start free. Upgrade when you need more power.</p>
        </FadeInView>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <FadeInView delay={0.1}>
            <div className="landing-glass rounded-xl p-8 h-full border border-card-border/60">
              <div className="text-xl font-bold mb-1">Free</div>
              <div className="text-4xl font-extrabold mb-1">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mb-6">Always free, no card needed</p>
              <ul className="space-y-3 mb-8">
                {["1 free use per feature per day", "Resume analysis + ATS score", "One-click tailoring", "Cover letters & interview prep"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up">
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </Link>
            </div>
          </FadeInView>
          <FadeInView delay={0.2}>
            <div className="landing-glass-glow rounded-xl p-8 relative h-full">
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs">Most Popular</Badge>
              <div className="text-xl font-bold mb-1">Pro</div>
              <div className="text-4xl font-extrabold mb-1">$9<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
              <p className="text-xs text-muted-foreground mb-6">Cancel anytime</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited analyses",
                  "Unlimited tailoring",
                  "Unlimited cover letters",
                  "Unlimited interview prep",
                  "Export & PDF download",
                  "Extended history",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-chart-2 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <MagneticButton className="w-full" data-magnetic>
                <Link href="/sign-up" className="block w-full">
                  <Button className="w-full landing-cta-glow" data-magnetic>Upgrade to Pro</Button>
                </Link>
              </MagneticButton>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/40 bg-muted/10 py-24">
        <div className="max-w-3xl mx-auto px-6">
          <FadeInView className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Frequently asked questions</h2>
          </FadeInView>
          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <FadeInView key={item.q} delay={i * 0.05}>
                <FaqItem {...item} />
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <FadeInView>
          <div className="landing-glass rounded-2xl p-12 text-center relative overflow-hidden">
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get more interviews?</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join thousands of job seekers who&apos;ve improved their resumes with AI-powered feedback. Start free today.
              </p>
              <MagneticButton data-magnetic>
                <Link href="/sign-up">
                  <Button size="lg" className="gap-2 text-base px-10 landing-cta-glow" data-magnetic>
                    Analyze My Resume Free <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </MagneticButton>
            </div>
          </div>
        </FadeInView>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-6 text-muted-foreground text-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Brain className="w-4 h-4 text-primary" />
              ResumeAI
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#journey" className="hover:text-foreground transition-colors">How it works</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign up</Link>
            </div>
            <ThemeToggle />
          </div>
          <div className="border-t border-border/40 pt-6 flex flex-col md:flex-row items-center justify-between gap-2">
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
