import type { LineType, ResumeLayout, ResumeLine } from "@resume-ai/api-zod/schemas/resume-layout";

export interface SpacingProfile {
  marginTop: number;
  marginBottom: number;
  lineGap: number;
  bulletIndent: number;
  afterName: number;
  afterContact: number;
  beforeSection: number;
  afterSectionRule: number;
  afterDateRow: number;
  afterProject: number;
  afterBullet: number;
  afterBody: number;
  afterSubtitle: number;
}

const DEFAULT_PROFILE: SpacingProfile = {
  marginTop: 36,
  marginBottom: 36,
  lineGap: 0,
  bulletIndent: 12,
  afterName: 2,
  afterContact: 6,
  beforeSection: 4,
  afterSectionRule: 2,
  afterDateRow: 1,
  afterProject: 1,
  afterBullet: 0,
  afterBody: 0,
  afterSubtitle: 0,
};

function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function isBulletStart(text: string): boolean {
  return /^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/.test(text);
}

/** Merge PDF wrap fragments into single logical lines (fixes bullet gaps + early wraps). */
export function mergeContinuationLines(lines: ResumeLine[], layout: ResumeLayout): ResumeLine[] {
  const out: ResumeLine[] = [];

  for (const line of lines) {
    const prev = out[out.length - 1];
    if (!prev) {
      out.push({ ...line, segments: [...line.segments] });
      continue;
    }

    const fontSize = prev.segments[0]?.fontSize ?? 10;
    const yGap = line.y - prev.y;
    const lineX = line.segments[0]?.x ?? layout.marginLeft;
    const prevX = prev.segments[0]?.x ?? layout.marginLeft;
    const tightGap = yGap > 0 && yGap <= fontSize * 2.2;
    const indented = lineX >= layout.marginLeft + 4;

    const mergeBulletWrap =
      prev.lineType === "bullet" &&
      tightGap &&
      !isBulletStart(line.fullText) &&
      (indented || line.lineType === "body");

    const mergeBodyWrap =
      (prev.lineType === "body" || prev.lineType === "subtitle") &&
      line.lineType === "body" &&
      tightGap &&
      Math.abs(lineX - prevX) < 12 &&
      !isBulletStart(line.fullText) &&
      !line.fullText.match(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i);

    const mergeSkillsWrap =
      prev.lineType === "body" &&
      line.lineType === "body" &&
      tightGap &&
      prev.fullText.includes(":") &&
      !isBulletStart(line.fullText);

    if (mergeBulletWrap || mergeBodyWrap || mergeSkillsWrap) {
      prev.fullText = `${prev.fullText} ${line.fullText.trim()}`.replace(/\s+/g, " ");
      prev.segments = [
        {
          ...prev.segments[0],
          text: prev.fullText,
        },
      ];
      continue;
    }

    out.push({ ...line, segments: [...line.segments] });
  }

  return out;
}

function gapBetween(prev: ResumeLine, next: ResumeLine): number {
  return Math.max(0, next.y - prev.y);
}

function collectGaps(lines: ResumeLine[], pred: (prev: ResumeLine, next: ResumeLine) => boolean): number[] {
  const gaps: number[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (pred(lines[i - 1], lines[i])) {
      gaps.push(gapBetween(lines[i - 1], lines[i]));
    }
  }
  return gaps;
}

/** Derive spacing rhythm from the uploaded resume Y positions. */
export function extractSpacingProfile(layout: ResumeLayout): SpacingProfile {
  const lines = [...layout.lines]
    .filter((l) => l.fullText.trim())
    .sort((a, b) => a.page - b.page || a.y - b.y);

  if (lines.length === 0) return { ...DEFAULT_PROFILE };

  const first = lines[0];
  const last = lines[lines.length - 1];
  const lastSize = last.segments[0]?.fontSize ?? 10;

  const profile: SpacingProfile = {
    ...DEFAULT_PROFILE,
    marginTop: Math.max(28, Math.round(first.y)),
    marginBottom: Math.max(28, Math.round(layout.pageHeight - last.y - lastSize - 4)),
    lineGap: 0,
    bulletIndent: 12,
  };

  const bulletLine = lines.find((l) => l.lineType === "bullet");
  if (bulletLine) {
    profile.bulletIndent = Math.max(8, Math.round(bulletLine.segments[0].x - layout.marginLeft));
  }

  const nameLine = lines.find((l) => l.lineType === "name");
  const contactLine = lines.find((l) => l.lineType === "contact");
  if (nameLine && contactLine) {
    profile.afterName = Math.min(4, Math.max(1, Math.round(gapBetween(nameLine, contactLine) - (nameLine.segments[0]?.fontSize ?? 14))));
  }

  const afterContactGaps = collectGaps(lines, (p, n) => p.lineType === "contact");
  profile.afterContact = Math.min(8, Math.max(2, Math.round(median(afterContactGaps) ?? 6)));

  const beforeSectionGaps = collectGaps(lines, (_p, n) => n.lineType === "section_header");
  profile.beforeSection = Math.min(6, Math.max(2, Math.round(median(beforeSectionGaps) ?? 4)));

  const bulletGaps = collectGaps(lines, (p, n) => p.lineType === "bullet" && n.lineType === "bullet");
  const bulletSize = bulletLine?.segments[0]?.fontSize ?? 10;
  profile.afterBullet = Math.min(2, Math.max(0, Math.round((median(bulletGaps) ?? 11) - bulletSize)));

  const bodyGaps = collectGaps(
    lines,
    (p, n) =>
      (p.lineType === "body" || p.lineType === "bullet") &&
      (n.lineType === "body" || n.lineType === "bullet"),
  );
  if (bodyGaps.length) profile.afterBody = Math.max(0, Math.round((median(bodyGaps) ?? 11) - 10));

  const dateGaps = collectGaps(lines, (p) => p.lineType === "date_row");
  profile.afterDateRow = Math.max(0, Math.round((median(dateGaps) ?? 12) - 10));

  const projectGaps = collectGaps(lines, (p) => p.lineType === "project");
  profile.afterProject = Math.max(0, Math.round((median(projectGaps) ?? 12) - 10));

  const subtitleGaps = collectGaps(lines, (p) => p.lineType === "subtitle");
  profile.afterSubtitle = Math.max(0, Math.round((median(subtitleGaps) ?? 11) - 10));

  profile.afterSectionRule = 2;

  return profile;
}

export function scaleSpacingProfile(profile: SpacingProfile, factor: number): SpacingProfile {
  const s = (n: number) => Math.max(0, Math.round(n * factor * 10) / 10);
  return {
    ...profile,
    marginTop: s(profile.marginTop),
    marginBottom: s(profile.marginBottom),
    lineGap: Math.max(0, s(profile.lineGap)),
    afterName: s(profile.afterName),
    afterContact: s(profile.afterContact),
    beforeSection: s(profile.beforeSection),
    afterSectionRule: s(profile.afterSectionRule),
    afterDateRow: s(profile.afterDateRow),
    afterProject: s(profile.afterProject),
    afterBullet: s(profile.afterBullet),
    afterBody: s(profile.afterBody),
    afterSubtitle: s(profile.afterSubtitle),
  };
}

function charWidth(fontSize: number): number {
  return fontSize * 0.45;
}

function estimateWrappedLines(text: string, width: number, fontSize: number): number {
  if (width <= 0) return 1;
  const words = text.split(/\s+/);
  let lines = 1;
  let current = 0;
  for (const word of words) {
    const w = word.length * charWidth(fontSize);
    if (current + w > width && current > 0) {
      lines++;
      current = w;
    } else {
      current += w + charWidth(fontSize);
    }
  }
  return lines;
}

function gapAfter(line: ResumeLine, profile: SpacingProfile): number {
  switch (line.lineType) {
    case "name":
      return profile.afterName;
    case "contact":
      return profile.afterContact;
    case "section_header":
      return profile.afterSectionRule;
    case "date_row":
      return profile.afterDateRow;
    case "project":
      return profile.afterProject;
    case "bullet":
      return profile.afterBullet;
    case "subtitle":
      return profile.afterSubtitle;
    default:
      return profile.afterBody;
  }
}

/** Estimate total document height for compaction targeting. */
export function estimateDocumentHeight(
  lines: ResumeLine[],
  layout: ResumeLayout,
  profile: SpacingProfile,
): number {
  const contentWidth = layout.pageWidth - layout.marginLeft - layout.marginRight;
  let y = profile.marginTop;
  let prevType: LineType | null = null;

  for (const line of lines) {
    if (!line.fullText.trim()) continue;
    const fontSize = line.segments[0]?.fontSize ?? 10;

    if (line.lineType === "section_header" && prevType !== null) {
      y += profile.beforeSection;
    }

    if (line.lineType === "bullet" || (line.lineType === "body" && line.fullText.length > 60)) {
      const indent = line.lineType === "bullet" ? Math.max(0, profile.bulletIndent - 10) : 0;
      const rows = estimateWrappedLines(line.fullText, contentWidth - indent, fontSize);
      y += rows * Math.max(fontSize * 0.9, fontSize + profile.lineGap) + gapAfter(line, profile);
    } else if (line.lineType === "section_header") {
      y += fontSize + 3 + profile.afterSectionRule;
    } else {
      y += fontSize + profile.lineGap + gapAfter(line, profile);
    }

    prevType = line.lineType;
  }

  return y + profile.marginBottom;
}

/** Shrink spacing until content fits one page (when original was single-page). */
export function compactToSinglePage(
  lines: ResumeLine[],
  layout: ResumeLayout,
  profile: SpacingProfile,
): SpacingProfile {
  const originalSinglePage =
    layout.lines.length > 0 &&
    layout.lines.every((l) => l.page === 1) &&
    layout.lines[layout.lines.length - 1].y < layout.pageHeight * 0.92;

  if (!originalSinglePage) return profile;

  const maxHeight = layout.pageHeight;
  let factor = 1;
  let scaled = profile;
  let height = estimateDocumentHeight(lines, layout, scaled);

  while (height > maxHeight && factor > 0.45) {
    factor -= 0.03;
    scaled = scaleSpacingProfile(profile, factor);
    height = estimateDocumentHeight(lines, layout, scaled);
  }

  if (height > maxHeight) {
    scaled = { ...scaled, lineGap: -1 };
    height = estimateDocumentHeight(lines, layout, scaled);
  }

  if (height > maxHeight) {
    const marginScale = Math.max(0.7, maxHeight / height);
    scaled = {
      ...scaled,
      marginTop: Math.max(24, Math.round(scaled.marginTop * marginScale)),
      marginBottom: Math.max(24, Math.round(scaled.marginBottom * marginScale)),
    };
  }

  return scaled;
}
