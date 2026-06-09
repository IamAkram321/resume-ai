import Groq from "groq-sdk";
import { logger } from "./logger";
import { isGroqRateLimitError } from "./llm-errors";
import { parseLlmJson } from "./parseLlmJson";
import { parseAnalysisResultFromLlm, type AnalysisResult } from "@resume-ai/api-zod/schemas/analysis-result";
import {
  parseTailoringMetadataFromLlm,
  type TailoringResult,
} from "@resume-ai/api-zod/schemas/tailoring-result";
import type { StoredAnalysisResult } from "@resume-ai/api-zod/schemas/analysis-result";

export type { AnalysisResult, TailoringResult };

export interface InterviewQuestion {
  category: string;
  question: string;
  tip: string;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

function shouldRetryLlm(err: unknown): boolean {
  return !isGroqRateLimitError(err);
}

const SYSTEM_PROMPT = `You are an expert technical recruiter and hiring manager with 15 years of experience at top tech companies. Analyze the provided resume against the job description.

Return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": [
    {
      "issue": "<what is wrong>",
      "before": "<quote or paraphrase from resume>",
      "after": "<improved version>"
    }
  ],
  "atsKeywords": ["<missing keyword from job description not found in resume>"],
  "rejectionAnalysis": {
    "overallRisk": "Low" | "Medium" | "High",
    "reasons": [
      {
        "title": "<short reason title>",
        "severity": "High" | "Medium" | "Low",
        "category": "Keyword Match" | "Experience Match" | "Project Quality" | "Technical Depth" | "Impact Metrics" | "Resume Structure" | "Role Alignment",
        "evidence": "<specific quotes or facts from resume AND/OR job description that support this reason — never invent details>",
        "explanation": "<why this matters for this specific role>",
        "impact": "<how recruiters or ATS may interpret this gap>",
        "recommendation": "<concrete action the candidate should take>"
      }
    ],
    "opportunities": [
      {
        "action": "<specific improvement tied to a weakness above>",
        "estimatedImpact": "High" | "Medium" | "Low",
        "rationale": "<brief why this would help, referencing evidence>"
      }
    ]
  },
  "attentionAnalysis": {
    "firstFocusAreas": [
      { "section": "<resume section name>", "attentionScore": "High" | "Medium" | "Low", "reason": "<why a recruiter skimming 10-15 seconds would likely notice this — cite position, headers, density, keywords>" }
    ],
    "ignoredAreas": [
      { "section": "<section name>", "attentionScore": "Low", "reason": "<why likely skipped or deprioritized>" }
    ],
    "visibilityScores": {
      "experienceVisibility": "High" | "Medium" | "Low",
      "projectVisibility": "High" | "Medium" | "Low",
      "skillsVisibility": "High" | "Medium" | "Low",
      "achievementVisibility": "High" | "Medium" | "Low",
      "leadershipVisibility": "High" | "Medium" | "Low",
      "educationVisibility": "High" | "Medium" | "Low"
    },
    "positiveSignals": ["<what creates a strong first impression>"],
    "concerns": ["<what may hurt discoverability or impression>"],
    "timeline": [
      { "timeRange": "Seconds 1-2", "recruiterNotices": "<what they scan first>", "sectionsEvaluated": ["<section>"] }
    ],
    "hiddenStrengths": [{ "insight": "<buried strength that should be surfaced earlier>" }],
    "missedOpportunities": [{ "insight": "<relevant experience/keyword under-emphasized for this role>" }],
    "recommendations": [
      { "action": "<layout or content change>", "expectedEffect": "<how it improves recruiter scanning>" }
    ]
  }
}

REJECTION ANALYSIS RULES (critical):
- Provide 3-6 reasons, each backed by explicit evidence from the resume text or job description.
- NEVER invent technologies, employers, metrics, or requirements not present in the inputs.
- NEVER use arbitrary percentages or numeric rejection probabilities.
- Set overallRisk from the pattern of severities: multiple High → usually High risk; mixed → Medium; mostly Low → Low.
- Each reason MUST use exactly one category from the allowed list.
- opportunities must prioritize the highest-severity gaps; estimatedImpact is qualitative (High/Medium/Low), not a percentage.
- Cross-reference atsKeywords, experience years, missing skills, weak verbs, and role requirements.

ATTENTION ANALYSIS RULES (critical):
- Simulate a 10-15 second recruiter skim using resume structure heuristics ONLY (section order, headings, density, keyword placement, role relevance). This is NOT eye tracking.
- NEVER claim webcam analysis, neuroscience, heatmaps from real eyes, or numeric attention percentages.
- Infer layout from how the resume text is ordered (top vs bottom, section headers, bullet density).
- firstFocusAreas: 2-5 sections recruiters likely see first; ignoredAreas: 0-4 sections likely skipped.
- visibilityScores: qualitative High/Medium/Low for each dimension based on prominence and relevance to the job.
- timeline: 3-4 phases covering roughly seconds 1-10 of a skim; be realistic and specific to this resume.
- hiddenStrengths and missedOpportunities: only when supported by resume content; never invent sections.
- recommendations: 2-5 practical layout/content changes with expectedEffect (no fake metrics).

Be specific, actionable, and constructive. Return ONLY the JSON. No markdown. No explanation outside the JSON.`;

const TAILOR_RESUME_TEXT_PROMPT = `You are an expert resume optimization specialist. Rewrite the candidate's resume for the specific job description.

Output ONLY the full tailored resume as plain text.
Do NOT use JSON, markdown code fences, or commentary before/after the resume.

STRUCTURE PRESERVATION RULES (CRITICAL):
- Keep the candidate's name EXACTLY as written — same spelling, casing, and position.
- Keep ALL contact info unchanged: email, phone, GitHub, LinkedIn, LeetCode, portfolio URLs.
- Keep ALL section headers in the SAME order with the SAME titles (e.g. EXPERIENCE, PROJECTS, SKILLS).
- Keep project line format: "Project Name | Tech Stack | GitHub | Live" — only improve wording inside segments, never remove links or pipes.
- Keep date ranges in the same position and format (e.g. "Jan 2025 – Mar 2025").
- Do NOT flatten the layout into generic paragraphs.
- Do NOT remove hyperlinks or URL text.

CONTENT RULES:
- ONLY modify bullet points, descriptions, keywords, and achievement phrasing.
- NEVER invent experience, companies, technologies, projects, certifications, or metrics.
- ONLY rewrite, reorder, emphasize, and strengthen content from the original resume.

Use prior analysis context when provided to prioritize role-relevant content and keywords.`;

const TAILOR_METADATA_PROMPT = `You are an expert resume optimization specialist. Compare the ORIGINAL and TAILORED resumes for a specific job.

Return ONLY a valid JSON object with this exact structure (do NOT include tailoredResume — it is provided separately):
{
  "targetRole": "<inferred role title from job description>",
  "metrics": {
    "atsBefore": <number 0-100>,
    "atsAfter": <number 0-100>,
    "recruiterAlignmentBefore": "Low" | "Medium" | "High",
    "recruiterAlignmentAfter": "Low" | "Medium" | "High",
    "roleMatchBefore": "Low" | "Medium" | "High",
    "roleMatchAfter": "Low" | "Medium" | "High"
  },
  "topImprovements": ["<improvement 1>", "<improvement 2>", ...],
  "changes": [
    {
      "type": "keyword" | "bullet_improvement" | "section_reorder" | "visibility" | "wording",
      "section": "<section name>",
      "original": "<exact or close quote from original resume>",
      "optimized": "<improved version>",
      "reason": "<why this change helps for this role>"
    }
  ],
  "keywordOptimization": {
    "present": ["<keywords already in original>"],
    "added": ["<keywords added in the tailored version>"],
    "stillMissing": ["<relevant job keywords not yet in tailored resume>"]
  },
  "recruiterImpact": {
    "beforeSummary": "<1-2 sentences on recruiter impression before>",
    "afterSummary": "<1-2 sentences on recruiter impression after>",
    "recruiterVisibilityImproved": true | false,
    "technicalAlignmentImproved": true | false,
    "atsCompatibilityImproved": true | false,
    "applicationCompetitivenessImproved": true | false
  }
}

CRITICAL HONESTY RULES — NEVER violate:
- NEVER invent experience, internships, companies, technologies, projects, certifications, degrees, or metrics.
- ONLY rewrite, reorder, emphasize, and strengthen content that exists in the original resume.
- If a metric is not in the original, do not add numbers unless rephrasing existing facts.
- "added" keywords must actually appear in tailoredResume text.
- changes must map to real before/after pairs from the resume.
- atsBefore should reflect the provided analysis score when given; atsAfter must be realistic (typically +3 to +15, never above 98).
- Provide 5-20 meaningful changes covering bullets, keywords, and section order.
- Compare the ORIGINAL and TAILORED resume texts supplied in the user message.

Use the prior ATS analysis when provided. Return ONLY JSON. No markdown.`;

function buildAnalysisContext(analysis: StoredAnalysisResult | null | undefined): string {
  if (!analysis) return "";
  const parts: string[] = [
    `ATS score: ${analysis.score}`,
    `Summary: ${analysis.summary}`,
    `Missing ATS keywords: ${analysis.atsKeywords.join(", ") || "none listed"}`,
    `Top weaknesses: ${analysis.weaknesses.slice(0, 5).join("; ")}`,
  ];
  if (analysis.rejectionAnalysis) {
    parts.push(
      `Rejection risk: ${analysis.rejectionAnalysis.overallRisk}`,
      `Key gaps: ${analysis.rejectionAnalysis.reasons.slice(0, 3).map((r) => r.title).join("; ")}`,
    );
  }
  if (analysis.attentionAnalysis) {
    parts.push(
      `Attention — surface first: ${analysis.attentionAnalysis.firstFocusAreas.map((a) => a.section).join(", ")}`,
      `Buried strengths: ${analysis.attentionAnalysis.hiddenStrengths.map((h) => h.insight).join("; ") || "n/a"}`,
    );
  }
  return `\n\nPRIOR ANALYSIS CONTEXT:\n${parts.join("\n")}`;
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
): Promise<AnalysisResult> {
  const userMessage = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  async function attempt(): Promise<AnalysisResult> {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content ?? "";
    return parseAnalysisResultFromLlm(parseLlmJson(content));
  }

  try {
    return await attempt();
  } catch (err) {
    if (!shouldRetryLlm(err)) throw err;
    logger.warn({ err }, "Analysis failed, retrying once");
    return await attempt();
  }
}

async function generateTailoredResumeText(
  resumeText: string,
  jobDescription: string,
  analysis?: StoredAnalysisResult | null,
): Promise<string> {
  const context = buildAnalysisContext(analysis);
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: TAILOR_RESUME_TEXT_PROMPT },
      {
        role: "user",
        content: `ORIGINAL RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}${context}`,
      },
    ],
    temperature: 0.35,
    max_tokens: 4096,
  });

  const text = (completion.choices[0]?.message?.content ?? "").trim();
  if (text.length < 100) {
    throw new Error("Tailored resume text was empty or too short");
  }
  return text;
}

async function generateTailoringMetadata(
  resumeText: string,
  tailoredResume: string,
  jobDescription: string,
  analysis?: StoredAnalysisResult | null,
): Promise<Omit<TailoringResult, "tailoredResume">> {
  const context = buildAnalysisContext(analysis);
  const userMessage = `ORIGINAL RESUME:\n${resumeText}\n\nTAILORED RESUME:\n${tailoredResume}\n\nJOB DESCRIPTION:\n${jobDescription}${context}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: TAILOR_METADATA_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = completion.choices[0]?.message?.content ?? "";
  const parsed = parseTailoringMetadataFromLlm(parseLlmJson(content));

  const metrics =
    analysis?.score != null && parsed.metrics.atsBefore !== analysis.score
      ? { ...parsed.metrics, atsBefore: analysis.score }
      : parsed.metrics;

  return { ...parsed, metrics };
}

export async function generateTailoredResume(
  resumeText: string,
  jobDescription: string,
  analysis?: StoredAnalysisResult | null,
): Promise<TailoringResult> {
  async function attempt(): Promise<TailoringResult> {
    const tailoredResume = await generateTailoredResumeText(
      resumeText,
      jobDescription,
      analysis,
    );
    const metadata = await generateTailoringMetadata(
      resumeText,
      tailoredResume,
      jobDescription,
      analysis,
    );
    return { ...metadata, tailoredResume };
  }

  try {
    return await attempt();
  } catch (err) {
    if (!shouldRetryLlm(err)) throw err;
    logger.warn({ err }, "Tailoring failed, retrying once");
    return await attempt();
  }
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert career coach. Write a compelling, personalized cover letter based on the candidate's resume and the job description. The letter should:
- Be 3-4 paragraphs, professional but personable
- Open with a strong hook referencing the specific role
- Highlight 2-3 most relevant experiences/skills from the resume
- Show genuine enthusiasm for the company and role
- Close with a confident call to action
Write ONLY the cover letter text. No subject line, no date, no address headers. Start directly with "Dear Hiring Manager," or a more specific salutation if company is mentioned.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
    temperature: 0.6,
  });

  const text = (completion.choices[0]?.message?.content ?? "").trim();
  if (!text || text.length < 100) {
    throw new Error("Cover letter generation returned empty or insufficient content");
  }
  return text;
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescription: string,
): Promise<InterviewQuestion[]> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: `You are an expert technical interviewer. Generate 8 likely interview questions for a candidate based on their resume and the job description.
Return ONLY a valid JSON array with this structure:
[
  { "category": "Behavioral|Technical|Situational|Role-Specific", "question": "...", "tip": "What the interviewer is really looking for and how to answer well" }
]
Include a mix of behavioral, technical, and role-specific questions. No markdown. No explanation. Return ONLY the JSON array.`,
      },
      {
        role: "user",
        content: `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`,
      },
    ],
    temperature: 0.4,
  });

  const content = completion.choices[0]?.message?.content ?? "[]";
  const questions = parseLlmJson<InterviewQuestion[]>(content);

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Interview prep generation returned no questions");
  }

  for (const q of questions) {
    if (!q.question?.trim() || !q.tip?.trim()) {
      throw new Error("Invalid interview question structure from model");
    }
  }

  return questions;
}
