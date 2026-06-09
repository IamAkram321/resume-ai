import PDFDocument from "pdfkit";
import type { ResumeLayout, ResumeLine, TextSegment } from "@resume-ai/api-zod/schemas/resume-layout";
import type { ResumePdfOptions } from "./types";
import { isBoldSegment, linkColor, pdfFontName } from "./segment-utils";
import {
  compactToSinglePage,
  extractSpacingProfile,
  mergeContinuationLines,
  type SpacingProfile,
} from "./layout-rhythm";

type PdfDoc = InstanceType<typeof PDFDocument>;

interface FlowContext {
  marginLeft: number;
  marginRight: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  profile: SpacingProfile;
}

function ctxFromLayout(layout: ResumeLayout, profile: SpacingProfile): FlowContext {
  const marginLeft = layout.marginLeft ?? 48;
  const marginRight = layout.marginRight ?? 48;
  return {
    marginLeft,
    marginRight,
    pageWidth: layout.pageWidth,
    pageHeight: layout.pageHeight,
    contentWidth: layout.pageWidth - marginLeft - marginRight,
    profile,
  };
}

function drawLinkRect(doc: PdfDoc, x: number, y: number, w: number, h: number, url: string): void {
  doc.link(x, y, w, h, url);
}

function primaryFont(line: ResumeLine, bold = false): string {
  const seg = line.segments[0];
  if (!seg) return bold ? "Helvetica-Bold" : "Helvetica";
  if (bold && !isBoldSegment(seg)) {
    const family = seg.fontFamily;
    if (family === "times") return "Times-Bold";
    if (family === "helvetica") return "Helvetica-Bold";
  }
  return pdfFontName(seg);
}

function bodyFont(line: ResumeLine): string {
  return primaryFont(line, isBoldSegment(line.segments[0]));
}

function usesDashBullet(line: ResumeLine): boolean {
  return (
    /^-/.test(line.fullText.trim()) ||
    line.segments[0]?.text.trim().startsWith("-") ||
    line.segments.some((s) => s.text.trim() === "-")
  );
}

function bulletText(line: ResumeLine): string {
  const body = line.fullText.replace(/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/, "").trim();
  if (usesDashBullet(line)) return `- ${body}`;
  return `• ${body}`;
}

function measureSegmentsWidth(doc: PdfDoc, segments: TextSegment[]): number {
  let w = 0;
  for (const seg of segments) {
    doc.font(pdfFontName(seg)).fontSize(seg.fontSize);
    w += doc.widthOfString(seg.text);
  }
  return w;
}

function advanceAfterBlock(doc: PdfDoc, yStart: number, blockHeight: number, extra: number): void {
  doc.y = yStart + blockHeight + extra;
}

function renderContactRow(doc: PdfDoc, ctx: FlowContext, line: ResumeLine): void {
  const y = doc.y;
  const fontSize = line.segments[0]?.fontSize ?? 9;
  const sep = " | ";

  if (line.segments.length > 1) {
    const totalW = measureSegmentsWidth(doc, line.segments);
    let x = ctx.marginLeft + (ctx.contentWidth - totalW) / 2;
    for (const seg of line.segments) {
      doc.font(pdfFontName(seg)).fontSize(seg.fontSize).fillColor(linkColor(seg.url));
      doc.text(seg.text, x, y, { lineBreak: false });
      const w = doc.widthOfString(seg.text);
      if (seg.url) drawLinkRect(doc, x, y, w, seg.fontSize + 1, seg.url);
      x += w;
    }
  } else {
    const text = line.fullText;
    const parts = text.split(/\s*\|\s*/);
    let totalW = 0;
    const sized: { text: string; url?: string }[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const suffix = i < parts.length - 1 ? sep : "";
      const display = part + suffix;
      const isLink = /github|linkedin|leetcode|@|\.com/i.test(part);
      sized.push({
        text: display,
        url: isLink
          ? part.includes("@")
            ? `mailto:${part}`
            : part.match(/^https?:\/\//)
              ? part
              : `https://${part.toLowerCase()}`
          : undefined,
      });
      doc.font(primaryFont(line)).fontSize(fontSize);
      totalW += doc.widthOfString(display);
    }

    let x = ctx.marginLeft + (ctx.contentWidth - totalW) / 2;
    for (const item of sized) {
      doc.font(primaryFont(line)).fontSize(fontSize).fillColor(linkColor(item.url));
      doc.text(item.text, x, y, { lineBreak: false });
      const w = doc.widthOfString(item.text);
      if (item.url) drawLinkRect(doc, x, y, w, fontSize + 1, item.url);
      x += w;
    }
  }

  advanceAfterBlock(doc, y, fontSize, ctx.profile.afterContact);
}

function renderDateRow(doc: PdfDoc, ctx: FlowContext, line: ResumeLine): void {
  const y = doc.y;
  const fontSize = line.segments[0]?.fontSize ?? 10;

  const dateMatch = line.fullText.match(
    /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\d{4})|\b\d{4}\s*[-–—]\s*(?:Present|\d{4})\b/i,
  );
  const date = dateMatch?.[0] ?? "";
  const left = date ? line.fullText.replace(date, "").replace(/\s+/g, " ").trim() : line.fullText;

  doc.font(primaryFont(line, true)).fontSize(fontSize).fillColor("#1a1a1a");
  doc.text(left, ctx.marginLeft, y, { width: ctx.contentWidth - 100, lineBreak: false });

  if (date) {
    doc.font(primaryFont(line)).fontSize(fontSize);
    doc.text(date.trim(), ctx.marginLeft, y, { width: ctx.contentWidth, align: "right", lineBreak: false });
  }

  advanceAfterBlock(doc, y, fontSize, ctx.profile.afterDateRow);
}

function renderProjectRow(doc: PdfDoc, ctx: FlowContext, line: ResumeLine): void {
  const y = doc.y;
  const fontSize = line.segments[0]?.fontSize ?? 10;

  const linkTail = line.fullText.match(/\|\s*(GitHub(?:\s*\|\s*Live)?)\s*$/i);
  const rightLinks = linkTail?.[1] ?? "";
  const leftText = rightLinks
    ? line.fullText.replace(/\|\s*GitHub(?:\s*\|\s*Live)?\s*$/i, "").trim()
    : line.fullText;

  if (rightLinks) {
    doc.font(primaryFont(line, true)).fontSize(fontSize).fillColor("#1a1a1a");
    doc.text(leftText, ctx.marginLeft, y, { width: ctx.contentWidth - 90, lineBreak: false });

    const parts = rightLinks.split(/\s*\|\s*/);
    let linkStr = "";
    for (let i = 0; i < parts.length; i++) {
      linkStr += parts[i] + (i < parts.length - 1 ? " | " : "");
    }
    doc.font(primaryFont(line)).fontSize(fontSize).fillColor("#1155cc");
    const linkW = doc.widthOfString(linkStr);
    const linkX = ctx.marginLeft + ctx.contentWidth - linkW;
    doc.text(linkStr, linkX, y, { lineBreak: false });

    let cx = linkX;
    for (const part of parts) {
      const suffix = parts.indexOf(part) < parts.length - 1 ? " | " : "";
      const display = part + suffix;
      const w = doc.widthOfString(display);
      drawLinkRect(doc, cx, y, w, fontSize + 1, `https://${part.toLowerCase()}.com`);
      cx += w;
    }
  } else if (line.fullText.includes("|")) {
    const parts = line.fullText.split("|").map((p) => p.trim());
    let x = ctx.marginLeft;
    parts.forEach((part, i) => {
      const isLink = /^(github|live)$/i.test(part);
      const suffix = i < parts.length - 1 ? " | " : "";
      const display = part + suffix;
      doc
        .font(i <= 1 ? primaryFont(line, true) : primaryFont(line))
        .fontSize(fontSize)
        .fillColor(isLink ? "#1155cc" : "#1a1a1a");
      doc.text(display, x, y, { lineBreak: false });
      const w = doc.widthOfString(display);
      if (isLink) drawLinkRect(doc, x, y, w, fontSize + 1, `https://${part.toLowerCase()}.com`);
      x += w;
    });
  } else {
    doc.font(primaryFont(line, true)).fontSize(fontSize).text(line.fullText, ctx.marginLeft, y, { lineBreak: false });
  }

  advanceAfterBlock(doc, y, fontSize, ctx.profile.afterProject);
}

function renderSectionHeader(doc: PdfDoc, ctx: FlowContext, line: ResumeLine): void {
  doc.y += ctx.profile.beforeSection;

  const y = doc.y;
  const fontSize = line.segments[0]?.fontSize ?? 11;
  const title = line.fullText.replace(/:$/, "").toUpperCase();

  doc.font(primaryFont(line, true)).fontSize(fontSize).fillColor("#1a1a1a");
  doc.text(title, ctx.marginLeft, y, { width: ctx.contentWidth, lineBreak: false });

  const ruleY = y + fontSize + 1;
  doc
    .strokeColor("#000000")
    .lineWidth(0.5)
    .moveTo(ctx.marginLeft, ruleY)
    .lineTo(ctx.pageWidth - ctx.marginRight, ruleY)
    .stroke();

  doc.y = ruleY + ctx.profile.afterSectionRule;
}

function renderWrapped(
  doc: PdfDoc,
  ctx: FlowContext,
  text: string,
  fontSize: number,
  fontName: string,
  indent: number,
  extraGap: number,
): void {
  const y = doc.y;
  doc
    .font(fontName)
    .fontSize(fontSize)
    .fillColor("#1a1a1a")
    .text(text, ctx.marginLeft + indent, y, {
      width: ctx.contentWidth - indent,
      lineGap: ctx.profile.lineGap,
      paragraphGap: 0,
    });
  doc.y += extraGap;
}

function renderLineFlow(doc: PdfDoc, ctx: FlowContext, line: ResumeLine, isFirstInDoc: boolean): void {
  const primary = line.segments[0];
  const fontSize = primary?.fontSize ?? 10;

  switch (line.lineType) {
    case "name": {
      const y = doc.y;
      doc.font(primaryFont(line, true)).fontSize(fontSize).fillColor("#1a1a1a");
      doc.text(line.fullText, ctx.marginLeft, y, { width: ctx.contentWidth, align: "center", lineBreak: false });
      advanceAfterBlock(doc, y, fontSize, ctx.profile.afterName);
      break;
    }

    case "contact":
      renderContactRow(doc, ctx, line);
      break;

    case "section_header":
      if (!isFirstInDoc) renderSectionHeader(doc, ctx, line);
      else {
        const y = doc.y;
        const title = line.fullText.replace(/:$/, "").toUpperCase();
        doc.font(primaryFont(line, true)).fontSize(fontSize).text(title, ctx.marginLeft, y, { lineBreak: false });
        const ruleY = y + fontSize + 1;
        doc.strokeColor("#000000").lineWidth(0.5).moveTo(ctx.marginLeft, ruleY).lineTo(ctx.pageWidth - ctx.marginRight, ruleY).stroke();
        doc.y = ruleY + ctx.profile.afterSectionRule;
      }
      break;

    case "date_row":
      renderDateRow(doc, ctx, line);
      break;

    case "project":
      renderProjectRow(doc, ctx, line);
      break;

    case "subtitle":
      renderWrapped(doc, ctx, line.fullText, fontSize, primaryFont(line, true), 0, ctx.profile.afterSubtitle);
      break;

    case "bullet":
      renderWrapped(
        doc,
        ctx,
        bulletText(line),
        fontSize,
        bodyFont(line),
        Math.max(0, ctx.profile.bulletIndent - 10),
        ctx.profile.afterBullet,
      );
      break;

    default:
      if (line.fullText.endsWith(":") && (isBoldSegment(primary) || /^[A-Za-z][\w\s/&+-]*:/.test(line.fullText))) {
        renderWrapped(doc, ctx, line.fullText, fontSize, primaryFont(line, true), 0, ctx.profile.afterSubtitle);
      } else if (line.fullText.includes("|") && !line.fullText.startsWith("-") && !line.fullText.startsWith("•")) {
        renderProjectRow(doc, ctx, line);
      } else if (line.fullText.length > 55) {
        renderWrapped(doc, ctx, line.fullText, fontSize, bodyFont(line), 0, ctx.profile.afterBody);
      } else {
        const y = doc.y;
        doc.font(bodyFont(line)).fontSize(fontSize);
        doc.text(line.fullText, ctx.marginLeft, y, { lineBreak: false });
        advanceAfterBlock(doc, y, fontSize, ctx.profile.afterBody);
      }
  }
}

function dedupeLines(lines: ResumeLine[]): ResumeLine[] {
  const seen = new Set<string>();
  const out: ResumeLine[] = [];
  for (const line of lines) {
    const key = `${line.lineType}::${line.fullText.trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

/** Flow-based renderer with original rhythm + single-page compaction. */
export function renderStructuredPdf(
  layout: ResumeLayout,
  options: ResumePdfOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const sorted = [...layout.lines].sort((a, b) => a.page - b.page || a.y - b.y);
    const lines = dedupeLines(mergeContinuationLines(sorted, layout));

    let profile = extractSpacingProfile(layout);
    profile = compactToSinglePage(lines, layout, profile);

    const ctx = ctxFromLayout(layout, profile);

    const doc = new PDFDocument({
      size: [ctx.pageWidth, ctx.pageHeight],
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
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

    doc.y = profile.marginTop;

    let first = true;
    for (const line of lines) {
      if (!line.fullText.trim()) continue;
      renderLineFlow(doc, ctx, line, first);
      first = false;

      if (doc.y > ctx.pageHeight - profile.marginBottom) break;
    }

    if (lines.length === 0) {
      doc.font("Helvetica").fontSize(10).text("Resume content unavailable.", ctx.marginLeft, profile.marginTop);
    }

    doc.end();
  });
}
