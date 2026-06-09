import type { TailoringChange } from "@resume-ai/api-zod/schemas/tailoring-result";
import type { ResumeLayout } from "@resume-ai/api-zod/schemas/resume-layout";
import { applyTailoringToLayout } from "./apply-tailoring";
import { parseResumeText } from "./parse-resume";
import { renderAtsPdf } from "./render-ats-pdf";
import { renderStructuredPdf } from "./render-structured-pdf";
import type { ResumePdfOptions } from "./types";

export type { ParsedResume, ResumeSection, ResumePdfOptions } from "./types";
export { parseResumeText } from "./parse-resume";
export { applyTailoringToLayout } from "./apply-tailoring";

export interface GeneratePdfInput {
  tailoredResumeText: string;
  layout?: ResumeLayout | null;
  changes?: TailoringChange[];
  options?: ResumePdfOptions;
}

/**
 * Generate tailored resume PDF.
 * Uses stored layout + tailoring changes when available; falls back to template.
 */
export async function generateTailoredResumePdf(
  tailoredResumeText: string,
  options: ResumePdfOptions & {
    layout?: ResumeLayout | null;
    changes?: TailoringChange[];
  } = {},
): Promise<Buffer> {
  const { layout, changes, ...pdfOptions } = options;

  if (layout?.lines?.length) {
    const updated = applyTailoringToLayout(layout, tailoredResumeText, changes);
    return renderStructuredPdf(updated, pdfOptions);
  }

  const parsed = parseResumeText(tailoredResumeText);
  return renderAtsPdf(parsed, pdfOptions);
}

export function buildPdfFilename(label?: string | null, targetRole?: string | null): string {
  const base = (label ?? targetRole ?? "tailored-resume")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .toLowerCase();
  return `${base || "tailored-resume"}.pdf`;
}
