import type { AttentionArea } from "./attentionArea";
import type { AttentionRecommendation } from "./attentionRecommendation";
import type { AttentionTimelinePhase } from "./attentionTimelinePhase";
import type { HiddenStrength } from "./hiddenStrength";
import type { MissedOpportunity } from "./missedOpportunity";
import type { VisibilityScores } from "./visibilityScores";

export interface AttentionAnalysis {
  firstFocusAreas: AttentionArea[];
  ignoredAreas: AttentionArea[];
  visibilityScores: VisibilityScores;
  positiveSignals: string[];
  concerns: string[];
  timeline: AttentionTimelinePhase[];
  hiddenStrengths: HiddenStrength[];
  missedOpportunities: MissedOpportunity[];
  recommendations: AttentionRecommendation[];
}
