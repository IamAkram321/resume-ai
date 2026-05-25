import { customFetch } from "@resume-ai/api-client-react";

export interface InterviewQuestion {
  category: string;
  question: string;
  tip: string;
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
): Promise<string> {
  const data = await customFetch<{ coverLetter: string }>("/api/generate/cover-letter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });
  if (!data.coverLetter?.trim()) {
    throw new Error("Received an empty cover letter");
  }
  return data.coverLetter;
}

export async function generateInterviewPrep(
  resumeText: string,
  jobDescription: string,
): Promise<InterviewQuestion[]> {
  const data = await customFetch<{ questions: InterviewQuestion[] }>(
    "/api/generate/interview-prep",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, jobDescription }),
    },
  );
  if (!data.questions?.length) {
    throw new Error("No interview questions were generated");
  }
  return data.questions;
}
