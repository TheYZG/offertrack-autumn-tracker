'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import type {
  ApplicationRecord,
  StageCategory,
  StageStatus,
} from '@/lib/applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const stageCategories: StageCategory[] = [
  '简历筛选',
  '测评/笔试',
  '面试中',
  'Offer',
  '已结束',
  '待补充',
];

export const stageStatuses: StageStatus[] = [
  '未开始',
  '待处理',
  '进行中',
  '等待结果',
  '已通过',
  '未通过',
  '已跳过',
];

export function createBlankApplication(): ApplicationRecord {
  const now = new Date().toISOString();
  return {
    id: '',
    company: '',
    jobTitle: '',
    city: '',
    portalUrl: '',
    appliedAt: new Date().toISOString().slice(0, 10),
    deadlineAt: '',
    sourceStatus: null,
    stage: '已投递',
    stageCategory: '简历筛选',
    stageStatus: '等待结果',
    nextAction: '关注招聘进度',
    priority: '中',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`space-y-2 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function ApplicationForm({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
}: {
  value: ApplicationRecord;
  onChange: (value: ApplicationRecord) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const update = <Key extends keyof ApplicationRecord>(
    key: Key,
    fieldValue: ApplicationRecord[Key],
  ) => onChange({ ...value, [key]: fieldValue });

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="公司名称">
          <Input
            required
            value={value.company}
            onChange={(event) => update('company', event.target.value)}
            placeholder="例如：腾讯"
            className="h-10"
          />
        </Field>
        <Field label="岗位名称">
          <Input
            value={value.jobTitle}
            onChange={(event) => update('jobTitle', event.target.value)}
            placeholder="例如：AI Agent 工程师"
            className="h-10"
          />
        </Field>
        <Field label="城市">
          <Input
            value={value.city}
            onChange={(event) => update('city', event.target.value)}
            placeholder="例如：深圳"
            className="h-10"
          />
        </Field>
        <Field label="投递日期">
          <Input
            type="date"
            value={value.appliedAt}
            onChange={(event) => update('appliedAt', event.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="阶段分类">
          <Select
            value={value.stageCategory}
            onValueChange={(next) =>
              next && update('stageCategory', next as StageCategory)
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="具体阶段">
          <Input
            required
            value={value.stage}
            onChange={(event) => update('stage', event.target.value)}
            placeholder="例如：一面"
            className="h-10"
          />
        </Field>
        <Field label="阶段状态">
          <Select
            value={value.stageStatus}
            onValueChange={(next) =>
              next && update('stageStatus', next as StageStatus)
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="优先级">
          <Select
            value={value.priority}
            onValueChange={(next) =>
              next && update('priority', next as ApplicationRecord['priority'])
            }
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['高', '中', '低'] as const).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="下一步动作" wide>
          <Input
            value={value.nextAction}
            onChange={(event) => update('nextAction', event.target.value)}
            placeholder="例如：准备一面并等待通知"
            className="h-10"
          />
        </Field>
        <Field label="截止时间" wide>
          <Input
            type="datetime-local"
            value={value.deadlineAt}
            onChange={(event) => update('deadlineAt', event.target.value)}
            className="h-10"
          />
        </Field>
        <Field label="招聘官网" wide>
          <Input
            type="url"
            value={value.portalUrl}
            onChange={(event) => update('portalUrl', event.target.value)}
            placeholder="https://..."
            className="h-10"
          />
        </Field>
        <Field label="备注" wide>
          <Textarea
            value={value.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="记录岗位信息、面试准备或跟进情况"
            className="min-h-24"
          />
        </Field>
      </div>
      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" className="min-w-28" disabled={submitting}>
          {submitting ? '保存中…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
