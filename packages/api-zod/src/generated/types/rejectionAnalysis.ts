import type { RejectionOpportunity } from "./rejectionOpportunity";
import type { RejectionReason } from "./rejectionReason";

export interface RejectionAnalysis {
  overallRisk: "Low" | "Medium" | "High";
  reasons: RejectionReason[];
  opportunities: RejectionOpportunity[];
}
