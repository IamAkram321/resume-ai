import { z } from "zod";

export const FontFamilySchema = z.enum([
  "helvetica",
  "helvetica-bold",
  "times",
  "times-bold",
  "courier",
  "unknown",
]);

export const LineTypeSchema = z.enum([
  "name",
  "contact",
  "section_header",
  "body",
  "bullet",
  "project",
  "date_row",
  "subtitle",
]);

export const LineAlignSchema = z.enum(["left", "center", "right", "mixed"]);

export const TextSegmentSchema = z.object({
  text: z.string(),
  x: z.number(),
  fontSize: z.number(),
  fontFamily: FontFamilySchema,
  color: z.string().optional(),
  url: z.string().optional(),
});

export const ResumeLineSchema = z.object({
  id: z.string(),
  y: z.number(),
  page: z.number().default(1),
  segments: z.array(TextSegmentSchema).min(1),
  lineType: LineTypeSchema,
  align: LineAlignSchema,
  fullText: z.string(),
});

export const ResumeLayoutSchema = z.object({
  version: z.literal(1),
  source: z.enum(["pdf", "text"]),
  pageWidth: z.number(),
  pageHeight: z.number(),
  marginLeft: z.number(),
  marginRight: z.number(),
  lines: z.array(ResumeLineSchema),
});

export type FontFamily = z.infer<typeof FontFamilySchema>;
export type LineType = z.infer<typeof LineTypeSchema>;
export type LineAlign = z.infer<typeof LineAlignSchema>;
export type TextSegment = z.infer<typeof TextSegmentSchema>;
export type ResumeLine = z.infer<typeof ResumeLineSchema>;
export type ResumeLayout = z.infer<typeof ResumeLayoutSchema>;
