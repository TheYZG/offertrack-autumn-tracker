'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { ExternalLink, Link2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  assessmentLinkTypeOptions,
  type AssessmentLinkRecord,
  type AssessmentLinkType,
} from '@/lib/assessment-links';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';

type LinkFilter = '全部' | AssessmentLinkType;

function createBlankLink(company = ''): AssessmentLinkRecord {
  const now = new Date().toISOString();
  return {
    id: '',
    company,
    type: '测评',
    title: '',
    url: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

async function requestLink(method: 'POST' | 'PUT', link: AssessmentLinkRecord) {
  const response = await fetch('/api/assessment-links', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(link),
  });
  const payload = (await response.json()) as {
    link?: AssessmentLinkRecord;
    error?: string;
  };
  if (!response.ok || !payload.link) {
    throw new Error(payload.error ?? '保存链接失败');
  }
  return payload.link;
}

function linkTypeClass(type: AssessmentLinkType) {
  return type === '测评'
    ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-violet-50 text-violet-700 ring-violet-200';
}

export function AssessmentLinks({
  companyOptionsByType,
}: {
  companyOptionsByType: Record<AssessmentLinkType, string[]>;
}) {
  const [links, setLinks] = useState<AssessmentLinkRecord[]>([]);
  const [filter, setFilter] = useState<LinkFilter>('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AssessmentLinkRecord | null>(null);
  const [draft, setDraft] = useState(createBlankLink);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/assessment-links', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          links?: AssessmentLinkRecord[];
          error?: string;
        };
        if (!response.ok || !payload.links) {
          throw new Error(payload.error ?? '加载链接失败');
        }
        setLinks(payload.links);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        toast.add({
          title: error instanceof Error ? error.message : '加载链接失败',
          type: 'error',
        });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const visibleLinks = useMemo(
    () =>
      filter === '全部' ? links : links.filter((link) => link.type === filter),
    [filter, links],
  );
  const companies = useMemo(
    () =>
      Array.from(
        new Set(companyOptionsByType[draft.type].filter(Boolean)),
      ).sort(),
    [companyOptionsByType, draft.type],
  );

  const openCreate = () => {
    setEditing(null);
    setDraft(createBlankLink());
    setDialogOpen(true);
  };

  const openEdit = (link: AssessmentLinkRecord) => {
    setEditing(link);
    setDraft(link);
    setDialogOpen(true);
  };

  const save = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await requestLink(editing ? 'PUT' : 'POST', draft);
      setLinks((current) =>
        editing
          ? current.map((link) => (link.id === saved.id ? saved : link))
          : [saved, ...current],
      );
      setDialogOpen(false);
      toast.add({
        title: editing ? '链接已更新' : '链接已添加',
        type: 'success',
      });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '保存链接失败',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (link: AssessmentLinkRecord) => {
    if (!window.confirm(`确定删除“${link.title}”吗？`)) return;
    try {
      const response = await fetch('/api/assessment-links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: link.id }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? '删除链接失败');
      setLinks((current) => current.filter((item) => item.id !== link.id));
      toast.add({ title: '链接已删除', type: 'success' });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '删除链接失败',
        type: 'error',
      });
    }
  };

  return (
    <>
      <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <Link2 className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-black sm:text-2xl">测评面试管理</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  集中保存收到的测评、面试链接，打开即用
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-600">
                {links.length}
              </span>
            </div>
          </div>
          <Button
            type="button"
            className="shrink-0 font-bold"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            新增链接
          </Button>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {(['全部', ...assessmentLinkTypeOptions] as const).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={filter === item ? 'default' : 'outline'}
              className="shrink-0 rounded-full"
              onClick={() => setFilter(item)}
            >
              {item}
              <span className="opacity-70">
                {item === '全部'
                  ? links.length
                  : links.filter((link) => link.type === item).length}
              </span>
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            正在加载链接…
          </p>
        ) : visibleLinks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed py-10 text-center">
            <p className="font-bold">还没有保存的链接</p>
            <p className="mt-1 text-sm text-muted-foreground">
              把邮件或短信里的测评、面试网址集中放在这里
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visibleLinks.map((link) => (
              <article
                key={link.id}
                className="rounded-2xl border p-4 transition-colors hover:border-slate-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${linkTypeClass(link.type)}`}
                      >
                        {link.type}
                      </span>
                      <span className="truncate text-sm font-semibold text-slate-500">
                        {link.company}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`编辑${link.title}`}
                      onClick={() => openEdit(link)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`删除${link.title}`}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => void remove(link)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex min-w-0 items-center gap-2 text-sm font-bold text-emerald-700 hover:underline"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="size-4 shrink-0" />
                </a>
                {link.notes && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {link.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editing ? '编辑链接' : '新增测评/面试链接'}
            </DialogTitle>
            <DialogDescription>
              保存后可以直接从卡片打开网址。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label htmlFor="assessment-company" className="space-y-2">
                <span className="text-sm font-bold text-slate-700">企业</span>
                <select
                  id="assessment-company"
                  required
                  value={draft.company}
                  onChange={(event) =>
                    setDraft({ ...draft, company: event.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    选择企业
                  </option>
                  {companies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="assessment-type" className="space-y-2">
                <span className="text-sm font-bold text-slate-700">类型</span>
                <select
                  id="assessment-type"
                  value={draft.type}
                  onChange={(event) => {
                    const type = event.target.value as AssessmentLinkType;
                    setDraft({
                      ...draft,
                      type,
                      company: companyOptionsByType[type].includes(
                        draft.company,
                      )
                        ? draft.company
                        : '',
                    });
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {assessmentLinkTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label htmlFor="assessment-url" className="space-y-2">
              <span className="text-sm font-bold text-slate-700">网址</span>
              <Input
                id="assessment-url"
                required
                type="text"
                inputMode="url"
                value={draft.url}
                onChange={(event) =>
                  setDraft({ ...draft, url: event.target.value })
                }
                placeholder="https://..."
              />
            </label>
            <label htmlFor="assessment-notes" className="space-y-2">
              <span className="text-sm font-bold text-slate-700">
                备注（可选）
              </span>
              <Textarea
                id="assessment-notes"
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
                placeholder="记录截止时间、注意事项等"
                rows={3}
              />
            </label>
            <div className="flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? '保存中…' : '保存链接'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
