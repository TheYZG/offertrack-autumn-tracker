export const assessmentLinkTypeOptions = ['测评', '笔试', '面试'] as const;

export type AssessmentLinkType = (typeof assessmentLinkTypeOptions)[number];

export interface AssessmentLinkRecord {
  id: string;
  company: string;
  type: AssessmentLinkType;
  title: string;
  url: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
