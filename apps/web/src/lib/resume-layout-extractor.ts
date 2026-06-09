import * as pdfjs from "pdfjs-dist";
import type {
  FontFamily,
  LineAlign,
  LineType,
  ResumeLayout,
  ResumeLine,
  TextSegment,
} from "@resume-ai/api-zod/schemas/resume-layout";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href;

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

interface RawRun {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: FontFamily;
  page: number;
  url?: string;
}

interface LinkRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  url: string;
  page: number;
}

let lineCounter = 0;
function nextId(): string {
  lineCounter += 1;
  return `line_${lineCounter}`;
}

function normalizeFont(fontName: string): FontFamily {
  const f = fontName.toLowerCase();
  if (f.includes("bold") && f.includes("times")) return "times-bold";
  if (f.includes("times")) return "times";
  if (f.includes("courier")) return "courier";
  if (f.includes("bold")) return "helvetica-bold";
  if (f.includes("helv") || f.includes("arial") || f.includes("sans")) return "helvetica";
  return "unknown";
}

function fontSizeFromTransform(transform: number[]): number {
  return Math.max(6, Math.round(Math.hypot(transform[0], transform[1]) * 10) / 10);
}

function pdfYToTop(y: number, pageHeight: number): number {
  return pageHeight - y;
}

function overlapsLink(runX: number, runY: number, runW: number, link: LinkRect, pageHeight: number): boolean {
  const topY = pdfYToTop(runY, pageHeight);
  const linkTop = pdfYToTop(link.y2, pageHeight);
  const linkBottom = pdfYToTop(link.y1, pageHeight);
  return (
    runX + runW > link.x1 &&
    runX < link.x2 &&
    topY > linkTop - 4 &&
    topY < linkBottom + 12
  );
}

function findUrl(x: number, y: number, width: number, links: LinkRect[], page: number, pageHeight: number): string | undefined {
  for (const link of links) {
    if (link.page !== page) continue;
    if (overlapsLink(x, y, width, link, pageHeight)) return link.url;
  }
  return undefined;
}

const KNOWN_SECTIONS = new Set([
  "summary", "experience", "work experience", "education", "skills", "projects",
  "certifications", "achievements", "technical skills", "professional experience",
  "achievements & leadership", "achievements and leadership",
]);

function inferLineType(fullText: string, segments: TextSegment[], y: number, pageWidth: number): LineType {
  const t = fullText.trim();
  const upper = t.toUpperCase();

  if (KNOWN_SECTIONS.has(t.toLowerCase()) || (upper === t && t.length < 45 && !t.includes("@") && !t.includes("|"))) {
    return "section_header";
  }
  if (segments.some((s) => s.fontFamily.includes("bold")) && segments[0]?.fontSize >= 14 && y < 100) {
    return "name";
  }
  if ((/github|linkedin|leetcode|@|\.com/i.test(t) || segments.some((s) => s.url)) && y < 130) {
    return "contact";
  }
  if (/^[A-Za-z][\w\s/&+-]*:\s*$/.test(t) || (t.endsWith(":") && segments[0]?.fontFamily.includes("bold"))) {
    return "subtitle";
  }
  if (t.includes("|") && !/^[\s]*[-•*]/.test(t)) return "project";
  if (
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(t) &&
    (segments.some((s) => s.x > pageWidth * 0.55) || /\d{4}\s*[-–—]/.test(t))
  ) {
    return "date_row";
  }
  if (/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/.test(t)) return "bullet";
  return "body";
}

function inferAlign(segments: TextSegment[], pageWidth: number, lineType: LineType): LineAlign {
  if (lineType === "name" || lineType === "contact") return "center";
  if (segments.length === 0) return "left";
  const minX = Math.min(...segments.map((s) => s.x));
  const maxX = Math.max(...segments.map((s) => s.x + s.text.length * s.fontSize * 0.5));
  const center = pageWidth / 2;
  if (maxX - minX < pageWidth * 0.55 && minX > center - 100 && maxX < center + 100) return "center";
  if (lineType === "date_row" || segments.some((s) => s.x > pageWidth * 0.6)) return "mixed";
  if (minX > pageWidth * 0.65) return "right";
  return "left";
}

function joinRuns(runs: RawRun[]): string {
  if (runs.length === 0) return "";
  let text = runs[0].text;
  for (let i = 1; i < runs.length; i++) {
    const prev = runs[i - 1];
    const curr = runs[i];
    const gap = curr.x - (prev.x + prev.text.length * prev.fontSize * 0.45);
    text += gap > prev.fontSize * 0.6 ? " " : "";
    text += curr.text;
  }
  return text.trim();
}

function groupRunsIntoLines(runs: RawRun[], pageWidth: number, pageHeight: number): ResumeLine[] {
  const sorted = [...runs].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const rows: RawRun[][] = [];

  for (const run of sorted) {
    const lastRow = rows[rows.length - 1];
    if (!lastRow) {
      rows.push([run]);
      continue;
    }
    const ref = lastRow[0];
    const threshold = Math.max(ref.fontSize * 0.75, 5);
    if (run.page === ref.page && Math.abs(run.y - ref.y) <= threshold) {
      lastRow.push(run);
    } else {
      rows.push([run]);
    }
  }

  const lines: ResumeLine[] = [];
  for (const rowRuns of rows) {
    rowRuns.sort((a, b) => a.x - b.x);
    const segments: TextSegment[] = rowRuns.map((r) => ({
      text: r.text,
      x: r.x,
      fontSize: r.fontSize,
      fontFamily: r.fontFamily,
      color: r.url ? "#1155cc" : "#1a1a1a",
      url: r.url,
    }));

    const fullText = joinRuns(rowRuns);
    if (!fullText) continue;

    const y = rowRuns[0].y;
    const lineType = inferLineType(fullText, segments, y, pageWidth);
    const align = inferAlign(segments, pageWidth, lineType);

    lines.push({
      id: nextId(),
      y,
      page: rowRuns[0].page,
      segments,
      lineType,
      align,
      fullText,
    });
  }

  return lines;
}

/** Extract structured layout with positions, fonts, and hyperlinks from a PDF. */
export async function extractLayoutFromPdf(file: File): Promise<ResumeLayout> {
  lineCounter = 0;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const runs: RawRun[] = [];
  const links: LinkRect[] = [];
  let pageWidth = PAGE_WIDTH;
  let pageHeight = PAGE_HEIGHT;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    pageWidth = viewport.width;
    pageHeight = viewport.height;

    const annotations = await page.getAnnotations();
    for (const annot of annotations) {
      if (annot.subtype === "Link" && annot.url && annot.rect) {
        const [x1, y1, x2, y2] = annot.rect as number[];
        links.push({ x1, y1, x2, y2, url: annot.url as string, page: pageNum });
      }
    }

    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item) || !item.str?.trim()) continue;
      const transform = item.transform as number[];
      const x = transform[4];
      const pdfY = transform[5];
      const y = pdfYToTop(pdfY, pageHeight);
      const fontSize = fontSizeFromTransform(transform);
      const width = item.width ?? item.str.length * fontSize * 0.5;
      const url = findUrl(x, pdfY, width, links, pageNum, pageHeight);

      runs.push({
        text: item.str,
        x,
        y,
        fontSize,
        fontFamily: normalizeFont((item as { fontName?: string }).fontName ?? ""),
        page: pageNum,
        url,
      });
    }
  }

  const marginLeft = runs.length ? Math.min(...runs.map((r) => r.x)) : 54;
  const marginRight = runs.length
    ? pageWidth - Math.max(...runs.map((r) => r.x + r.text.length * r.fontSize * 0.5))
    : 54;

  let lines = groupRunsIntoLines(runs, pageWidth, pageHeight);

  if (lines.length > 0 && lines[0].lineType !== "name") {
    const first = lines[0];
    if (first.segments[0]?.fontSize >= 13 || first.fullText.length < 40) {
      first.lineType = "name";
      first.align = "center";
    }
  }

  // Merge accidental duplicate consecutive lines from PDF extraction
  lines = lines.filter((line, i, arr) => {
    if (i === 0) return true;
    const prev = arr[i - 1];
    return !(prev.fullText === line.fullText && Math.abs(prev.y - line.y) < 8);
  });

  return {
    version: 1,
    source: "pdf",
    pageWidth,
    pageHeight,
    marginLeft: Math.max(36, marginLeft),
    marginRight: Math.max(36, marginRight),
    lines,
  };
}
