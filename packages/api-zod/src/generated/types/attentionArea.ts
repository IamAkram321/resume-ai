export type AttentionLevel = "High" | "Medium" | "Low";

export interface AttentionArea {
  section: string;
  attentionScore: AttentionLevel;
  reason: string;
}
