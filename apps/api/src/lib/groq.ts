import Groq from "groq-sdk";
import { logger } from "./logger";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert technical recruiter and resume coach with 15 years of experience at top tech companies. Analyze the provided resume against the job description.

Return ONLY a valid JSON object with this exact structure:
{
  "score": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "suggestions": [
    {
      "issue": "<what is wrong>",
      "before": "<example of current weak phrasing>",
      "after": "<improved version>"
    }
  ],
  "atsKeywords": ["<missing keyword 1>", "<missing keyword 2>"]
}

Be specific, actionable, and harsh but constructive.
Return ONLY the JSON. No markdown. No explanation.`;

export interface AnalysisResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: { issue: string; before: string; after: string }[];
  atsKeywords: string[];
}

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
    return JSON.parse(content) as AnalysisResult;
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

  return completion.choices[0]?.message?.content ?? "";
}

export async function generateInterviewQuestions(
  resumeText: string,
  jobDescription: string,
): Promise<{ question: string; tip: string; category: string }[]> {
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
  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}
