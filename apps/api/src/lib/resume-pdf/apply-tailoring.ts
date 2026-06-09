import type { TailoringChange } from "@resume-ai/api-zod/schemas/tailoring-result";
import type { LineType, ResumeLayout, ResumeLine } from "@resume-ai/api-zod/schemas/resume-layout";
import { parseResumeText } from "./parse-resume";
import { setLineContent } from "./segment-utils";

const PROTECTED_TYPES = new Set<LineType>(["name", "contact", "section_header"]);

export { mapFont } from "./segment-utils";

function replaceInLine(line: ResumeLine, original: string, optimized: string): boolean {
  if (!line.fullText.includes(original)) return false;
  setLineContent(line, line.fullText.replace(original, optimized));
  return true;
}

function groupLinesBySection(lines: ResumeLine[]): Array<{ title: string; lines: ResumeLine[] }> {
  const groups: Array<{ title: string; lines: ResumeLine[] }> = [];
  let current: { title: string; lines: ResumeLine[] } | null = null;

  for (const line of lines) {
    if (line.lineType === "section_header") {
      if (current) groups.push(current);
      current = { title: line.fullText, lines: [] };
      continue;
    }
    if (!current) {
      current = { title: "__header__", lines: [] };
    }
    current.lines.push(line);
  }
  if (current) groups.push(current);

  return groups;
}

function normalizeSectionTitle(title: string): string {
  return title.replace(/:$/, "").trim().toLowerCase();
}

function inferLineTypeFromText(text: string, template: LineType): LineType {
  const t = text.trim();
  if (template === "project" || (t.includes("|") && !t.startsWith("•"))) return "project";
  if (/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/.test(t)) return "bullet";
  if (/^[A-Za-z][\w\s/&+-]*:\s*$/.test(t)) return "subtitle";
  if (
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(t) &&
    /\d{4}/.test(t)
  ) {
    return "date_row";
  }
  return template === "bullet" ? "bullet" : "body";
}

/**
 * Apply tailored content onto the original layout — structure and styling preserved.
 * Name, contact, and section headers are never modified.
 */
export function applyTailoringToLayout(
  layout: ResumeLayout,
  tailoredText: string,
  changes?: TailoringChange[],
): ResumeLayout {
  const result: ResumeLayout = structuredClone(layout);

  if (changes?.length) {
    for (const change of changes) {
      for (const line of result.lines) {
        if (PROTECTED_TYPES.has(line.lineType)) continue;
        replaceInLine(line, change.original, change.optimized);
      }
    }
  }

  const tailored = parseResumeText(tailoredText);
  const layoutGroups = groupLinesBySection(result.lines);

  for (const group of layoutGroups) {
    if (group.title === "__header__") continue;

    const tailoredSection = tailored.sections.find(
      (s) => normalizeSectionTitle(s.title) === normalizeSectionTitle(group.title),
    );
    if (!tailoredSection?.lines.length) continue;

    const editable = group.lines.filter((l) => !PROTECTED_TYPES.has(l.lineType));
    const templateLine = editable[editable.length - 1] ?? group.lines[group.lines.length - 1];
    const extraLines: ResumeLine[] = [];

    for (let i = 0; i < tailoredSection.lines.length; i++) {
      const newText = tailoredSection.lines[i];
      if (i < editable.length) {
        const line = editable[i];
        line.lineType = inferLineTypeFromText(newText, line.lineType);
        setLineContent(line, newText);
        continue;
      }

      const clone: ResumeLine = structuredClone(templateLine);
      clone.id = `${templateLine.id}_tail_${i}`;
      clone.y = templateLine.y + (i - editable.length + 1) * 12;
      clone.lineType = inferLineTypeFromText(newText, templateLine.lineType);
      setLineContent(clone, newText);
      extraLines.push(clone);
    }

    if (extraLines.length) {
      const anchorId = group.lines[group.lines.length - 1]?.id;
      const insertAt = anchorId ? result.lines.findIndex((l) => l.id === anchorId) : -1;
      if (insertAt >= 0) {
        result.lines.splice(insertAt + 1, 0, ...extraLines);
      } else {
        result.lines.push(...extraLines);
      }
    }
  }

  return result;
}
