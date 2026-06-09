import type { LineType, TextSegment } from "@resume-ai/api-zod/schemas/resume-layout";

const URL_IN_TEXT =
  /(https?:\/\/[^\s|]+|(?:github|linkedin|leetcode)\.com\/[^\s|]+|GitHub|LinkedIn|LeetCode|Live|[\w.+-]+@[\w.-]+\.\w+)/gi;

export function mapFont(family: TextSegment["fontFamily"]): string {
  switch (family) {
    case "helvetica-bold":
      return "Helvetica-Bold";
    case "times":
      return "Times-Roman";
    case "times-bold":
      return "Times-Bold";
    case "courier":
      return "Courier";
    default:
      return "Helvetica";
  }
}

export function isBoldSegment(seg: TextSegment): boolean {
  return seg.fontFamily.includes("bold");
}

export function linkColor(url?: string): string {
  return url ? "#1155cc" : "#1a1a1a";
}

export function buildProjectSegments(text: string, template?: TextSegment): TextSegment[] {
  const parts = text.split("|").map((p) => p.trim());
  const baseX = template?.x ?? 54;
  const fontSize = template?.fontSize ?? 10;
  const segments: TextSegment[] = [];
  let x = baseX;

  parts.forEach((part, i) => {
    const urlMatch = part.match(/(https?:\/\/[^\s]+|github\.com\/[^\s]+|linkedin\.com\/[^\s]+)/i);
    const isLinkLabel = /^(github|live|linkedin|leetcode)$/i.test(part);
    const url = urlMatch
      ? urlMatch[0].startsWith("http")
        ? urlMatch[0]
        : `https://${urlMatch[0]}`
      : isLinkLabel
        ? `https://${part.toLowerCase()}.com`
        : undefined;

    const suffix = i < parts.length - 1 ? " | " : "";
    const display = part + suffix;
    const bold = i <= 1;

    segments.push({
      text: display,
      x,
      fontSize,
      fontFamily: bold ? "helvetica-bold" : "helvetica",
      color: url || isLinkLabel ? "#1155cc" : "#1a1a1a",
      url,
    });
    x += display.length * (fontSize * 0.52);
  });

  return segments.length ? segments : [{ text, x: baseX, fontSize, fontFamily: "helvetica-bold" }];
}

export function buildContactSegments(text: string, template?: TextSegment): TextSegment[] {
  const fontSize = template?.fontSize ?? 9;
  const segments: TextSegment[] = [];
  const re = new RegExp(URL_IN_TEXT.source, "gi");
  let last = 0;
  let m: RegExpExecArray | null;
  let x = template?.x ?? 54;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      const plain = text.slice(last, m.index);
      segments.push({
        text: plain,
        x,
        fontSize,
        fontFamily: "helvetica",
        color: "#444444",
      });
      x += plain.length * (fontSize * 0.48);
    }
    const raw = m[0];
    const isEmail = raw.includes("@");
    const resolved = raw.match(/^https?:\/\//)
      ? raw
      : isEmail
        ? `mailto:${raw}`
        : raw.toLowerCase() === "github"
          ? "https://github.com"
          : raw.toLowerCase() === "linkedin"
            ? "https://linkedin.com"
            : raw.toLowerCase() === "leetcode"
              ? "https://leetcode.com"
              : `https://${raw}`;

    segments.push({
      text: raw,
      x,
      fontSize,
      fontFamily: "helvetica",
      color: "#1155cc",
      url: resolved,
    });
    x += raw.length * (fontSize * 0.48);
    last = m.index + raw.length;
  }

  if (last < text.length) {
    segments.push({
      text: text.slice(last),
      x,
      fontSize,
      fontFamily: "helvetica",
      color: "#444444",
    });
  }

  return segments.length
    ? segments
    : [{ text, x: template?.x ?? 54, fontSize, fontFamily: "helvetica", color: "#444444" }];
}

export function setLineContent(
  line: { fullText: string; segments: TextSegment[]; lineType: LineType },
  newText: string,
): void {
  const style = line.segments[0];
  const trimmed = newText.trim();
  if (!trimmed) return;

  line.fullText = trimmed;

  if (line.lineType === "project" || (trimmed.includes("|") && !trimmed.startsWith("•"))) {
    line.lineType = "project";
    line.segments = buildProjectSegments(trimmed, style);
    return;
  }

  if (line.lineType === "contact") {
    line.segments = buildContactSegments(trimmed, style);
    return;
  }

  if (line.lineType === "bullet") {
    const hadDash =
      /^-/.test(line.fullText.trim()) ||
      line.segments[0]?.text.trim().startsWith("-") ||
      line.segments.some((s) => s.text.trim() === "-");
    const body = trimmed.replace(/^[\s]*(?:[-•*●▪◦]|\d+[.)])\s+/, "");
    const prefix = hadDash || trimmed.startsWith("-") ? "- " : "• ";
    line.segments = [
      {
        text: `${prefix}${body}`,
        x: style?.x ?? 54,
        fontSize: style?.fontSize ?? 10,
        fontFamily: style?.fontFamily ?? "helvetica",
        color: style?.color ?? "#1a1a1a",
      },
    ];
    return;
  }

  if (line.lineType === "subtitle" || /^[A-Za-z][\w\s/&+-]*:\s*$/.test(trimmed)) {
    line.lineType = "subtitle";
    line.segments = [
      {
        text: trimmed.endsWith(":") ? trimmed : `${trimmed}:`,
        x: style?.x ?? 54,
        fontSize: style?.fontSize ?? 10,
        fontFamily: "helvetica-bold",
        color: "#1a1a1a",
      },
    ];
    return;
  }

  line.segments = [
    {
      text: trimmed,
      x: style?.x ?? 54,
      fontSize: style?.fontSize ?? 10,
      fontFamily: style?.fontFamily ?? "helvetica",
      color: style?.color,
      url: style?.url,
    },
  ];
}

export function pdfFontName(seg: TextSegment): string {
  return mapFont(seg.fontFamily);
}
