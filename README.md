# ResumeAI — AI-Powered Resume Analyzer & Career Coach

![ResumeAI](https://img.shields.io/badge/ResumeAI-Live%20Product-7c3aed?style=for-the-badge&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Status](https://img.shields.io/badge/status-production-green?style=flat-square)

> Get your resume reviewed by AI in under 10 seconds. Upload your resume, paste a job description, get a score, strengths, weaknesses, and specific rewrite suggestions — powered by LLaMA-3.

🔗 **Live Demo:** ([https://your-app.vercel.app](https://resume-ai-eta-three.vercel.app/))

---

## Project Structure

```
resume-ai/
├── apps/
│   ├── api/          # Express API (auth, billing, AI analysis)
│   └── web/          # React + Vite frontend
├── packages/
│   ├── db/           # Drizzle schema & database client
│   ├── api-zod/      # Shared Zod validators
│   ├── api-spec/     # OpenAPI specification
│   └── api-client-react/  # TanStack Query hooks for the API
├── tools/
│   └── ui-sandbox/   # Optional UI component playground
├── assets/           # Static assets (images, fonts)
└── scripts/          # Workspace utilities
```

---

## What Is This?

Most resume feedback tools give you generic advice like *"add more keywords."*

ResumeAI matches your resume against a specific job description and tells you:

- Exactly what score an ATS system would give you (0–100)
- Which strengths to highlight in your cover letter
- Which weaknesses are costing you interviews
- Specific before/after rewrites for weak bullet points
- Missing keywords the job description is looking for

**This is not a wrapper around ChatGPT.** It's a full-stack SaaS product with subscription billing, per-user rate limiting, analysis history, and a structured LLM pipeline that returns consistent, actionable JSON — not freeform text.

---

## Live Demo

🔗 ([https://your-app.vercel.app](https://resume-ai-eta-three.vercel.app/))

Test credentials:
```
Email:    demo@resumeai.com
Password: demo123456
```

Test Stripe payment: card `4242 4242 4242 4242` — any future expiry, any CVC.

---

## Key Features

| Feature | Details |
|---|---|
| 🤖 AI Resume Analysis | LLaMA-3 via Groq API — structured JSON output, not freeform text |
| 💳 Subscription Billing | Stripe — $9/month Pro tier, webhook-driven tier updates |
| 🔐 Authentication | Clerk — Google + GitHub OAuth, JWT sessions |
| ⚡ Rate Limiting | Redis TTL — free users capped at 3 analyses/day |
| 📊 Analysis History | PostgreSQL — dashboard with past analyses and scores |
| 🇮🇳 UPI Support | Stripe UPI — GPay, PhonePe, Paytm for Indian users |
| 📱 Fully Responsive | Mobile-first dark UI with Tailwind + shadcn/ui |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│             Next.js 14 (Vercel)                 │
│         App Router + API Routes                 │
└──────────┬──────────────────────┬───────────────┘
           │                      │
  ┌────────▼────────┐   ┌─────────▼─────────┐
  │   Clerk Auth    │   │    Groq API        │
  │  JWT + OAuth    │   │  LLaMA-3-70b       │
  └────────┬────────┘   └─────────┬──────────┘
           │                      │
  ┌────────▼──────────────────────▼──────────┐
  │          PostgreSQL (Neon)               │
  │      Users · Analyses · Billing         │
  └─────────────────┬────────────────────────┘
                    │
  ┌─────────────────▼────────────────────────┐
  │           Upstash Redis                  │
  │   Rate Limiting · Caching · TTL         │
  └─────────────────┬────────────────────────┘
                    │
  ┌─────────────────▼────────────────────────┐
  │               Stripe                     │
  │  Checkout · Webhooks · Customer Portal  │
  └──────────────────────────────────────────┘
```

### Key Engineering Decisions

**Why Groq over OpenAI?**
Groq's LPU inference hardware delivers ~10x faster response times at lower cost. For a synchronous flow where users wait on results, latency matters more than marginal quality differences.

**Why structured JSON output from the LLM?**
Freeform LLM text is unpredictable and hard to render consistently. The system prompt forces the model to return a strict JSON schema `{ score, summary, strengths[], weaknesses[], suggestions[], atsKeywords[] }`. A try/catch with one retry handles the rare malformed response.

**Why Redis TTL for rate limiting?**
Database-based rate limiting requires a write + read on every request. Redis `INCR` + `EXPIRE` is atomic, sub-millisecond, and self-cleaning — no cron jobs needed. Key format: `analyze:{userId}:{YYYY-MM-DD}` expires in 86,400 seconds.

**Why webhook-driven tier updates over polling?**
Stripe webhooks fire on payment completion. Polling would require hitting Stripe's API on every protected request. The webhook handler verifies the Stripe signature, checks for duplicate events (idempotency), then updates the user tier in PostgreSQL atomically.

---

## Tech Stack

**Frontend**
- [Next.js 14](https://nextjs.org/) — App Router, Server Components, API Routes
- [Tailwind CSS](https://tailwindcss.com/) — utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) — accessible component library

**Backend**
- Next.js API Routes — serverless functions
- [Prisma](https://www.prisma.io/) — type-safe ORM
- [PostgreSQL](https://neon.tech/) — primary database via Neon serverless
- [Upstash Redis](https://upstash.com/) — rate limiting and caching

**Auth & Payments**
- [Clerk](https://clerk.com/) — authentication, OAuth, user management
- [Stripe](https://stripe.com/) — subscription billing, webhooks, customer portal

**AI**
- [Groq](https://groq.com/) — LLM inference (LLaMA-3-70b-versatile)
- Structured JSON prompting — consistent, parseable output

---

## Database Schema

```prisma
model User {
  id                   String     @id @default(cuid())
  clerkId              String     @unique
  email                String     @unique
  name                 String?
  tier                 String     @default("free")
  stripeCustomerId     String?    @unique
  stripeSubscriptionId String?    @unique
  createdAt            DateTime   @default(now())
  analyses             Analysis[]
}

model Analysis {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  resumeText     String   @db.Text
  jobDescription String   @db.Text
  score          Int
  result         Json
  createdAt      DateTime @default(now())
}
```

---

## Rate Limiting Implementation

```javascript
async function checkRateLimit(userId) {
  const today = new Date().toISOString().split('T')[0]
  const key = `analyze:${userId}:${today}`

  const count = await redis.get(key)
  if (count && parseInt(count) >= 3) {
    return { allowed: false, remaining: 0 }
  }

  await redis.incr(key)
  await redis.expire(key, 86400)

  const newCount = count ? parseInt(count) + 1 : 1
  return { allowed: true, remaining: 3 - newCount }
}
```

Free users: **3 analyses/day** tracked per user per calendar day in Redis.
Pro users: **unlimited** — rate limit check skipped after tier verification.

---

## Stripe Webhook Idempotency

```javascript
// Prevents duplicate tier upgrades if Stripe retries the webhook
const existingUser = await prisma.user.findUnique({
  where: { stripeCustomerId: customerId }
})

if (existingUser?.tier === 'pro') {
  return NextResponse.json({ received: true }) // already upgraded, skip
}

await prisma.user.update({
  where: { stripeCustomerId: customerId },
  data: { tier: 'pro', stripeSubscriptionId: subscriptionId }
})
```

Stripe retries webhooks on network failures. Without idempotency, a user's tier update could apply multiple times or fail silently. This ensures exactly-once processing.

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) free tier)
- Redis instance ([Upstash](https://upstash.com) free tier)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/IamAkram321/resume-ai.git
cd resume-ai

# 2. Install dependencies (requires pnpm)
pnpm install

# 3. Configure environment variables
cp .env.example apps/api/.env
# Copy web vars from .env.example into apps/web/.env

# 4. Push database schema
pnpm --filter @resume-ai/db push

# 5. Start API + web in parallel
pnpm dev
```

Open [http://localhost:8081](http://localhost:8081) (web) — API runs on port 8080.

### Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_URL=postgresql://...

# AI
GROQ_API_KEY=gsk_...

# Redis
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analyze` | ✅ | Analyze resume against job description |
| `GET` | `/api/analyses` | ✅ | Fetch user's analysis history |
| `POST` | `/api/billing/create-checkout` | ✅ | Create Stripe checkout session |
| `POST` | `/api/billing/webhook` | Stripe sig | Handle Stripe payment events |
| `GET` | `/api/billing/portal` | ✅ | Generate Stripe customer portal URL |
| `POST` | `/api/webhooks/clerk` | Clerk sig | Sync new users to PostgreSQL |

---

## Deployment

Deployed on [Vercel](https://vercel.com) with zero configuration.

```bash
npm i -g vercel
vercel --prod
```

Add the same environment variables in your Vercel dashboard. Update Clerk and Stripe webhook URLs to your Vercel URL after first deploy.

---

## Roadmap

- [ ] PDF export of analysis results
- [ ] LinkedIn profile analyzer
- [ ] Cover letter generator based on analysis gaps
- [ ] Team plan for recruiters
- [ ] GPay / PhonePe UPI for Indian users

---

## What I Learned Building This

- Structured LLM outputs are critical for production AI apps — freeform text breaks UIs
- Webhook idempotency is non-negotiable for payment systems — Stripe retries on failures
- Redis TTL is the cleanest rate limiting pattern — atomic, self-cleaning, sub-millisecond
- Clerk webhooks for DB sync are tricky — `user.created` fires before OAuth redirect completes
- Next.js App Router requires careful separation of server vs client components

---

## Author

**MD Akram** — Civil engineering student turned self-taught software engineer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-akramshahjada-0077b5?style=flat-square&logo=linkedin)](https://linkedin.com/in/akramshahjada)
[![GitHub](https://img.shields.io/badge/GitHub-IamAkram321-181717?style=flat-square&logo=github)](https://github.com/IamAkram321)
[![Email](https://img.shields.io/badge/Email-akramshahjada786%40gmail.com-ea4335?style=flat-square&logo=gmail)](mailto:akramshahjada786@gmail.com)

---

*If this helped you, drop a ⭐ — it genuinely motivates further development.*
