import type { ParsedResume, ResumeSection } from "./types";

/** Known ATS section headers — extend as new formats are supported. */
const KNOWN_SECTIONS = new Set([
  "summary",
  "professional summary",
  "profile",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "employment history",
  "education",
  "skills",
  "technical skills",
  "core competencies",
  "core skills",
  "projects",
  "certifications",
  "certificates",
  "awards",
  "achievements",
  "languages",
  "interests",
  "volunteer",
  "volunteer experience",
  "publications",
  "references",
  "contact",
]);

const BULLET_PREFIX = /^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/;

function normalizeSectionTitle(line: string): string {
  return line.replace(/:$/, "").trim();
}

function isKnownSection(line: string): boolean {
  const normalized = normalizeSectionTitle(line).toLowerCase();
  return KNOWN_SECTIONS.has(normalized);
}

function looksLikeSectionHeader(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 45) return false;
  if (BULLET_PREFIX.test(trimmed)) return false;
  if (trimmed.includes("@")) return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^\d{4}\s*[-–—]/.test(trimmed)) return false;

  if (isKnownSection(trimmed)) return true;

  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length < 3) return false;

  const upperRatio = (trimmed.match(/[A-Z]/g)?.length ?? 0) / letters.length;
  return trimmed === trimmed.toUpperCase() && upperRatio > 0.7;
}

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim().length > 0);
}

/**
 * Parse plain-text resume into header + ordered sections.
 * Preserves section ordering from the tailored output.
 */
export function parseResumeText(text: string): ParsedResume {
  const rawLines = splitLines(text);
  if (rawLines.length === 0) {
    return { headerLines: [], sections: [] };
  }

  const headerLines: string[] = [];
  const sections: ResumeSection[] = [];
  let current: ResumeSection | null = null;
  let seenSection = false;

  for (const line of rawLines) {
    const trimmed = line.trim();

    if (looksLikeSectionHeader(trimmed)) {
      if (current) sections.push(current);
      current = { title: normalizeSectionTitle(trimmed), lines: [] };
      seenSection = true;
      continue;
    }

    if (!seenSection) {
      headerLines.push(trimmed);
    } else if (current) {
      current.lines.push(trimmed);
    } else {
      headerLines.push(trimmed);
    }
  }

  if (current) sections.push(current);

  if (sections.length === 0) {
    return {
      headerLines: [],
      sections: [{ title: "", lines: rawLines.map((l) => l.trim()) }],
    };
  }

  return { headerLines, sections };
}
