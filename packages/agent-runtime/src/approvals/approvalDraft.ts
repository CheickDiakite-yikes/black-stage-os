import type { ApprovalActionType, ApprovalRiskLevel } from "@blackstage/stage-core";

export type ApprovalDraft = {
  actionType: ApprovalActionType;
  title: string;
  summary: string;
  riskLevel: ApprovalRiskLevel;
};
