'use client';

import type { ReactNode, SyntheticEvent } from 'react';
import type { ApplicationRecord, CurrentStage } from '@/lib/applications';
import { stageOptions } from '@/lib/applications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function createBlankApplication(): ApplicationRecord {
  const now = new Date().toISOString();
  return {
    id: '',
    company: '',
    stage: '已投递',
    portalUrl: '',
    appliedAt: new Date().toISOString().slice(0, 10),
    createdAt: now,
    updatedAt: now,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
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
  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5">
        <Field label="企业名">
          <Input
            required
            value={value.company}
            onChange={(event) =>
              onChange({ ...value, company: event.target.value })
            }
            placeholder="例如：腾讯"
            className="h-11 text-base"
          />
        </Field>

        <Field label="当前阶段">
          <Select
            value={value.stage}
            onValueChange={(stage) =>
              stage && onChange({ ...value, stage: stage as CurrentStage })
            }
          >
            <SelectTrigger className="h-11 w-full text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="投递时间">
          <Input
            required
            type="date"
            value={value.appliedAt}
            onChange={(event) =>
              onChange({ ...value, appliedAt: event.target.value })
            }
            className="h-11 text-base"
          />
        </Field>

        <Field label="企业网站地址">
          <Input
            type="url"
            value={value.portalUrl}
            onChange={(event) =>
              onChange({ ...value, portalUrl: event.target.value })
            }
            placeholder="https://..."
            className="h-11 text-base"
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
