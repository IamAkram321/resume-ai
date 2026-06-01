export interface RejectionOpportunity {
  action: string;
  estimatedImpact: "High" | "Medium" | "Low";
  rationale?: string;
}
