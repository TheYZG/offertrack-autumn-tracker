export const stageOptions = [
  '简历筛选',
  '测评',
  '笔试',
  '面试',
  'Offer',
  '已结束',
] as const;

export type CurrentStage = (typeof stageOptions)[number];

export interface ApplicationRecord {
  id: string;
  company: string;
  portalUrl: string;
  stage: CurrentStage;
  appliedAt: string;
  checkedAt: string;
  createdAt: string;
  updatedAt: string;
}
