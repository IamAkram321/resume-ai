export type RejectionCategory =
  | "Keyword Match"
  | "Experience Match"
  | "Project Quality"
  | "Technical Depth"
  | "Impact Metrics"
  | "Resume Structure"
  | "Role Alignment";

export interface RejectionReason {
  title: string;
  severity: "High" | "Medium" | "Low";
  category: RejectionCategory;
  evidence: string;
  explanation: string;
  impact: string;
  recommendation: string;
}
