import * as pdfjs from "pdfjs-dist";
import type { ResumeLayout } from "@resume-ai/api-zod/schemas/resume-layout";
import { buildLayoutFromText } from "./resume-layout-from-text";
import { extractLayoutFromPdf } from "./resume-layout-extractor";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => ("str" in item ? item.str : "")).join(" ") + "\n";
  }
  return text;
}

export async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf") {
    return extractTextFromPdf(file);
  }
  return file.text();
}

/** Extract plain text + structured layout for format-preserving PDF export. */
export async function extractResume(file: File): Promise<{ text: string; layout: ResumeLayout }> {
  if (file.type === "application/pdf") {
    const [text, layout] = await Promise.all([
      extractTextFromPdf(file),
      extractLayoutFromPdf(file),
    ]);
    return { text, layout };
  }
  const text = await file.text();
  return { text, layout: buildLayoutFromText(text) };
}

export { buildLayoutFromText } from "./resume-layout-from-text";
export { extractLayoutFromPdf } from "./resume-layout-extractor";
