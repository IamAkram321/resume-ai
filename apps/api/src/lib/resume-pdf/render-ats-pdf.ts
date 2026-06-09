import PDFDocument from "pdfkit";
import type { ParsedResume, ResumePdfOptions } from "./types";

type PdfDoc = InstanceType<typeof PDFDocument>;

const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = 612 - MARGIN * 2;

const FONT = {
  name: 18,
  contact: 9.5,
  role: 10,
  section: 11,
  body: 10,
};

const COLORS = {
  text: "#1a1a1a",
  muted: "#444444",
  rule: "#cccccc",
};

function isBulletLine(line: string): boolean {
  return /^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/, "").trim();
}

function ensureSpace(doc: PdfDoc, needed: number): void {
  if (doc.y + needed > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
  }
}

function drawSectionRule(doc: PdfDoc): void {
  const y = doc.y + 2;
  doc
    .strokeColor(COLORS.rule)
    .lineWidth(0.5)
    .moveTo(MARGIN, y)
    .lineTo(612 - MARGIN, y)
    .stroke();
  doc.y = y + 8;
}

function renderHeader(doc: PdfDoc, headerLines: string[], targetRole?: string | null): void {
  if (headerLines.length === 0 && !targetRole) return;

  const name = headerLines[0] ?? "Resume";
  const contactLines = headerLines.slice(1);

  doc
    .font("Helvetica-Bold")
    .fontSize(FONT.name)
    .fillColor(COLORS.text)
    .text(name, { width: CONTENT_WIDTH, align: "center" });

  if (targetRole) {
    doc
      .font("Helvetica")
      .fontSize(FONT.role)
      .fillColor(COLORS.muted)
      .text(targetRole, { width: CONTENT_WIDTH, align: "center" });
  }

  if (contactLines.length > 0) {
    doc
      .font("Helvetica")
      .fontSize(FONT.contact)
      .fillColor(COLORS.muted)
      .text(contactLines.join("  |  "), { width: CONTENT_WIDTH, align: "center" });
  }

  doc.moveDown(0.6);
}

function renderSection(doc: PdfDoc, title: string, lines: string[]): void {
  if (lines.length === 0 && !title) return;

  ensureSpace(doc, title ? 32 : 16);

  if (title) {
    doc
      .font("Helvetica-Bold")
      .fontSize(FONT.section)
      .fillColor(COLORS.text)
      .text(title.toUpperCase(), { width: CONTENT_WIDTH });

    drawSectionRule(doc);
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    ensureSpace(doc, 14);

    const text = isBulletLine(trimmed) ? `•  ${stripBullet(trimmed)}` : trimmed;

    doc
      .font("Helvetica")
      .fontSize(FONT.body)
      .fillColor(COLORS.text)
      .text(text, {
        width: CONTENT_WIDTH,
        indent: isBulletLine(trimmed) ? 8 : 0,
        lineGap: 1.5,
      });
  }

  doc.moveDown(0.3);
}

/** Render parsed resume text into an ATS-friendly single-column PDF. */
export function renderAtsPdf(parsed: ParsedResume, options: ResumePdfOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: options.title ?? "Tailored Resume",
        Author: "ResumeAI",
        Creator: "ResumeAI",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderHeader(doc, parsed.headerLines, options.targetRole);

    for (const section of parsed.sections) {
      renderSection(doc, section.title, section.lines);
    }

    doc.end();
  });
}
