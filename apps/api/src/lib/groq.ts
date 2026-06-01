import Groq from "groq-sdk";
import { logger } from "./logger";
import { parseLlmJson } from "./parseLlmJson";
import { parseAnalysisResultFromLlm, type AnalysisResult } from "@resume-ai/api-zod";

export type { AnalysisResult };

export interface InterviewQuestion {
  category: string;
  question: string;
  tip: string;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

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

Be specific, actionable, and constructive. Return ONLY the JSON. No markdown. No explanation outside the JSON.`;

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
): Promise<AnalysisResult> {
  const userMessage = `RESUME:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  async function attempt(): Promise<AnalysisResult> {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
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
    logger.warn({ err }, "First Groq parse attempt failed, retrying");
    return await attempt();
  }
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
    model: "llama-3.3-70b-versatile",
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
