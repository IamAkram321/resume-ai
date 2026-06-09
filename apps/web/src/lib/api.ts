import { customFetch } from "@resume-ai/api-client-react";
import type { TailoredResumeRecord, TailorUsage } from "@/lib/tailoring-types";

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

export async function getTailorUsage(): Promise<TailorUsage> {
  return customFetch<TailorUsage>("/api/tailored-resumes/usage");
}

export async function listTailoredResumes(): Promise<TailoredResumeRecord[]> {
  return customFetch<TailoredResumeRecord[]>("/api/tailored-resumes");
}

export async function getTailoredResume(id: string): Promise<TailoredResumeRecord> {
  return customFetch<TailoredResumeRecord>(`/api/tailored-resumes/${id}`);
}

export async function createTailoredResume(body: {
  analysisId?: string;
  resumeText?: string;
  jobDescription?: string;
  label?: string;
}): Promise<TailoredResumeRecord> {
  return customFetch<TailoredResumeRecord>("/api/tailored-resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function updateTailoredResumeLabel(
  id: string,
  label: string,
): Promise<TailoredResumeRecord> {
  return customFetch<TailoredResumeRecord>(`/api/tailored-resumes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
}

export async function deleteTailoredResume(id: string): Promise<void> {
  await customFetch<void>(`/api/tailored-resumes/${id}`, { method: "DELETE" });
}

export function downloadResumeText(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
