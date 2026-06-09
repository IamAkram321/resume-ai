import type { LineAlign, LineType, ResumeLayout, ResumeLine, TextSegment } from "@resume-ai/api-zod/schemas/resume-layout";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 54;
const MARGIN_RIGHT = 54;

const KNOWN_SECTIONS = new Set([
  "summary", "experience", "work experience", "education", "skills", "projects",
  "certifications", "achievements", "technical skills",
]);

const URL_RE = /(https?:\/\/[^\s|]+|(?:github|linkedin|leetcode)\.com\/[^\s|]+)/gi;
const EMAIL_RE = /[\w.+-]+@[\w.-]+\.\w+/;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const DATE_RANGE_RE =
  /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})/i;

let lineCounter = 0;
function nextId(): string {
  lineCounter += 1;
  return `line_${lineCounter}`;
}

function isSectionHeader(line: string): boolean {
  const t = line.replace(/:$/, "").trim();
  return KNOWN_SECTIONS.has(t.toLowerCase()) || (t === t.toUpperCase() && t.length < 40 && /[A-Z]/.test(t));
}

function isBullet(line: string): boolean {
  return /^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/, "").trim();
}

function isContactLine(line: string): boolean {
  return (
    EMAIL_RE.test(line) ||
    PHONE_RE.test(line) ||
    /github|linkedin|leetcode|portfolio/i.test(line)
  );
}

function isProjectLine(line: string): boolean {
  return line.includes("|") && !isContactLine(line);
}

function hasDateAtEnd(line: string): boolean {
  return DATE_RANGE_RE.test(line);
}

function makeSegment(
  text: string,
  x: number,
  fontSize: number,
  bold: boolean,
  url?: string,
): TextSegment {
  return {
    text,
    x,
    fontSize,
    fontFamily: bold ? "helvetica-bold" : "helvetica",
    color: url ? "#1155cc" : "#1a1a1a",
    url,
  };
}

function makeLine(
  y: number,
  fullText: string,
  lineType: LineType,
  align: LineAlign,
  segments: TextSegment[],
  page = 1,
): ResumeLine {
  return { id: nextId(), y, page, segments, lineType, align, fullText };
}

function buildContactSegments(raw: string, y: number): TextSegment[] {
  const segments: TextSegment[] = [];
  let x = MARGIN_LEFT;
  const re = new RegExp(URL_RE.source, "gi");
  let last = 0;
  let m: RegExpExecArray | null;
  const parts: { text: string; url?: string }[] = [];

  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) parts.push({ text: raw.slice(last, m.index) });
    const url = m[0].startsWith("http") ? m[0] : `https://${m[0]}`;
    parts.push({ text: m[0], url });
    last = m.index + m[0].length;
  }
  if (last < raw.length) parts.push({ text: raw.slice(last) });

  if (parts.length === 0) {
    return [makeSegment(raw, MARGIN_LEFT, 9, false)];
  }

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const suffix = i < parts.length - 1 ? " | " : "";
    segments.push(makeSegment(p.text + suffix, x, 9, false, p.url));
    x += (p.text + suffix).length * 4.2;
  }
  return segments;
}

function buildProjectSegments(raw: string): TextSegment[] {
  const parts = raw.split("|").map((p) => p.trim());
  const segments: TextSegment[] = [];
  let x = MARGIN_LEFT;

  parts.forEach((part, i) => {
    const urlMatch = part.match(/(https?:\/\/[^\s]+|github\.com\/[^\s]+|linkedin\.com\/[^\s]+)/i);
    const url = urlMatch ? (urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`) : undefined;
    const suffix = i < parts.length - 1 ? " | " : "";
    segments.push(makeSegment(part + suffix, x, 10, i === 0, url));
    x += (part + suffix).length * 5.2;
  });

  return segments;
}

/** Build a high-fidelity layout from pasted plain text (fallback when no PDF). */
export function buildLayoutFromText(text: string): ResumeLayout {
  lineCounter = 0;
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const lines: ResumeLine[] = [];
  let y = 54;
  let seenSection = false;
  let lineIndex = 0;

  for (const raw of rawLines) {
    if (!seenSection && lineIndex === 0) {
      lines.push(
        makeLine(y, raw, "name", "center", [makeSegment(raw, MARGIN_LEFT, 20, true)]),
      );
      y += 28;
      lineIndex++;
      continue;
    }

    if (!seenSection && isContactLine(raw)) {
      lines.push(makeLine(y, raw, "contact", "center", buildContactSegments(raw, y)));
      y += 16;
      lineIndex++;
      continue;
    }

    if (isSectionHeader(raw)) {
      seenSection = true;
      const title = raw.replace(/:$/, "").toUpperCase();
      lines.push(
        makeLine(y, raw, "section_header", "left", [makeSegment(title, MARGIN_LEFT, 11, true)]),
      );
      y += 18;
      lineIndex++;
      continue;
    }

    seenSection = true;

    if (isProjectLine(raw)) {
      lines.push(makeLine(y, raw, "project", "left", buildProjectSegments(raw)));
      y += 14;
    } else if (hasDateAtEnd(raw)) {
      const match = raw.match(DATE_RANGE_RE);
      const date = match?.[0] ?? "";
      const title = raw.replace(DATE_RANGE_RE, "").trim();
      const dateWidth = date.length * 5.5;
      lines.push(
        makeLine(y, raw, "date_row", "mixed", [
          makeSegment(title, MARGIN_LEFT, 10, true),
          makeSegment(date, PAGE_WIDTH - MARGIN_RIGHT - dateWidth, 10, false),
        ]),
      );
      y += 14;
    } else if (isBullet(raw)) {
      const body = stripBullet(raw);
      const prefix = /^[\s]*-\s+/.test(raw) ? "- " : "• ";
      lines.push(
        makeLine(y, `${prefix}${body}`, "bullet", "left", [makeSegment(`${prefix}${body}`, MARGIN_LEFT + 8, 10, false)]),
      );
      y += 13;
    } else {
      lines.push(makeLine(y, raw, "body", "left", [makeSegment(raw, MARGIN_LEFT, 10, false)]));
      y += 13;
    }

    lineIndex++;
  }

  return {
    version: 1,
    source: "text",
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
    marginLeft: MARGIN_LEFT,
    marginRight: MARGIN_RIGHT,
    lines,
  };
}
