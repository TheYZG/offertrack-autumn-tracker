'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CircleDot,
  LogOut,
  Plus,
  Search,
  UserRound,
} from 'lucide-react';
import { ApplicationForm, createBlankApplication } from './application-form';
import { AssessmentLinks } from './assessment-links';
import type { AssessmentLinkType } from '@/lib/assessment-links';
import {
  stageOptions,
  type ApplicationRecord,
  type CurrentStage,
} from '@/lib/applications';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Toaster, toast } from '@/components/ui/toast';

type StageFilter = '流程中' | '待更新' | CurrentStage;
const pageSize = 10;

const stageStyle: Record<CurrentStage, string> = {
  简历筛选: 'bg-sky-50 text-sky-700 ring-sky-200',
  测评: 'bg-amber-50 text-amber-700 ring-amber-200',
  笔试: 'bg-orange-50 text-orange-700 ring-orange-200',
  面试: 'bg-violet-50 text-violet-700 ring-violet-200',
  Offer: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  已结束: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function CompanyMark({ name }: { name: string }) {
  const palette = [
    'bg-emerald-100 text-emerald-800',
    'bg-sky-100 text-sky-800',
    'bg-amber-100 text-amber-800',
    'bg-violet-100 text-violet-800',
  ];
  const sum = Array.from(name).reduce(
    (value, character) => value + character.charCodeAt(0),
    0,
  );

  return (
    <span
      className={`grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-black ${palette[sum % palette.length]}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function InlineCompanyName({
  record,
  saving,
  onSave,
}: {
  record: ApplicationRecord;
  saving: boolean;
  onSave: (company: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record.company);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelling = useRef(false);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const finishEditing = () => {
    if (cancelling.current) {
      cancelling.current = false;
      return;
    }

    const company = draft.trim();
    setEditing(false);
    if (!company || company === record.company) {
      setDraft(record.company);
      return;
    }
    onSave(company);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        disabled={saving}
        aria-label={`修改 ${record.company} 的企业名`}
        className="h-10 max-w-56 text-base font-black sm:text-lg"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            cancelling.current = true;
            setDraft(record.company);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      title="点击修改企业名"
      className="max-w-56 truncate rounded-md px-1 py-2 text-left text-base font-black hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 sm:text-lg"
      onClick={(event) => {
        event.stopPropagation();
        setDraft(record.company);
        setEditing(true);
      }}
    >
      {record.company}
    </button>
  );
}

function InlineStageSelect({
  record,
  saving,
  onChange,
}: {
  record: ApplicationRecord;
  saving: boolean;
  onChange: (stage: CurrentStage) => void;
}) {
  return (
    <div title="点击修改当前阶段">
      <Select
        value={record.stage}
        disabled={saving}
        onValueChange={(stage) => {
          if (stage && stage !== record.stage) onChange(stage as CurrentStage);
        }}
      >
        <SelectTrigger
          aria-label={`修改 ${record.company} 的当前阶段`}
          className={`${stageStyle[record.stage]} h-9 min-w-28 border-0 px-3 text-sm font-bold ring-1 ring-inset`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent data-row-action>
          {stageOptions.map((stage) => (
            <SelectItem key={stage} value={stage}>
              {stage}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InlineWebsite({
  record,
  saving,
  onSave,
}: {
  record: ApplicationRecord;
  saving: boolean;
  onSave: (portalUrl: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(record.portalUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelling = useRef(false);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const finishEditing = () => {
    if (cancelling.current) {
      cancelling.current = false;
      return;
    }

    const value = draft.trim();
    const portalUrl = value && !/^https?:\/\//i.test(value) ? `https://${value}` : value;
    setEditing(false);
    if (portalUrl === record.portalUrl) {
      setDraft(record.portalUrl);
      return;
    }
    onSave(portalUrl);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="url"
        value={draft}
        disabled={saving}
        data-row-action
        aria-label={`修改 ${record.company} 的企业网站地址`}
        placeholder="https://..."
        className="h-10 min-w-52 text-base"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={finishEditing}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            cancelling.current = true;
            setDraft(record.portalUrl);
            setEditing(false);
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      data-row-action
      title="点击修改企业网站地址"
      className="inline-flex max-w-[260px] rounded-md px-1 py-2 text-left font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      onClick={(event) => {
        event.stopPropagation();
        setDraft(record.portalUrl);
        setEditing(true);
      }}
    >
      <span className="truncate">{websiteLabel(record.portalUrl)}</span>
    </button>
  );
}

function websiteLabel(url: string) {
  if (!url) return '未填写';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function compareApplications(a: ApplicationRecord, b: ApplicationRecord) {
  const dateComparison = a.appliedAt.localeCompare(b.appliedAt);
  if (dateComparison !== 0) return dateComparison;

  const initialId = /^app-(\d+)$/;
  const aInitialOrder = Number(a.id.match(initialId)?.[1] ?? 1000000);
  const bInitialOrder = Number(b.id.match(initialId)?.[1] ?? 1000000);
  if (aInitialOrder !== bInitialOrder) return aInitialOrder - bInitialOrder;
  return a.createdAt.localeCompare(b.createdAt);
}

function sortApplications(records: ApplicationRecord[]) {
  return [...records].sort(compareApplications);
}

function localDateStamp() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function normalizeWebsite(url: string) {
  return url.trim().replace(/\/$/, '').toLowerCase();
}

function findDuplicate(draft: ApplicationRecord, records: ApplicationRecord[]) {
  const company = draft.company.trim().toLowerCase();
  const website = normalizeWebsite(draft.portalUrl);
  return records.find(
    (record) =>
      record.company.trim().toLowerCase() === company ||
      (website && normalizeWebsite(record.portalUrl) === website),
  );
}

async function requestApplication(
  method: 'POST' | 'PUT',
  application: ApplicationRecord,
) {
  const response = await fetch('/api/applications', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  });
  const payload = (await response.json()) as {
    application?: ApplicationRecord;
    error?: string;
  };
  if (!response.ok || !payload.application) {
    throw new Error(payload.error ?? '保存失败，请稍后重试');
  }
  return payload.application;
}

async function markApplicationChecked(id: string, checkedAt: string) {
  const response = await fetch('/api/applications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, checkedAt }),
  });
  const payload = (await response.json()) as {
    id?: string;
    checkedAt?: string;
    error?: string;
  };
  if (!response.ok || !payload.id) {
    throw new Error(payload.error ?? '更新检查状态失败');
  }
}

function AddApplicationDialog({
  open,
  onOpenChange,
  onCreated,
  existingRecords,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (record: ApplicationRecord) => void;
  existingRecords: ApplicationRecord[];
}) {
  const [draft, setDraft] = useState(createBlankApplication);
  const [submitting, setSubmitting] = useState(false);
  const [duplicate, setDuplicate] = useState<ApplicationRecord | null>(null);

  const setOpen = (next: boolean) => {
    if (!next) {
      setDraft(createBlankApplication());
      setDuplicate(null);
    }
    onOpenChange(next);
  };

  const save = async () => {
    setSubmitting(true);
    try {
      const saved = await requestApplication('POST', draft);
      onCreated(saved);
      setOpen(false);
      toast.add({ title: `已新增 ${saved.company}`, type: 'success' });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '新增失败',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async () => {
    const match = findDuplicate(draft, existingRecords);
    if (match) {
      setDuplicate(match);
      return;
    }
    await save();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">新增企业</DialogTitle>
            <DialogDescription>只填写四项必要信息。</DialogDescription>
          </DialogHeader>
          <ApplicationForm
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            onCancel={() => setOpen(false)}
            submitting={submitting}
            submitLabel="新增企业"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(duplicate)}
        onOpenChange={(next) => !next && setDuplicate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>可能重复添加</AlertDialogTitle>
            <AlertDialogDescription>
              “{duplicate?.company}”已经在企业列表中。你仍然要添加这条记录吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回修改</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDuplicate(null);
                void save();
              }}
            >
              仍然添加
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function OfferTrackWorkspace({
  username,
  onLogout,
}: {
  username: string;
  onLogout: () => void;
}) {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('流程中');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const today = localDateStamp();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/applications', { signal: controller.signal })
      .then(async (response) => {
        const payload = (await response.json()) as {
          applications?: ApplicationRecord[];
          error?: string;
        };
        if (!response.ok || !payload.applications) {
          throw new Error(payload.error ?? '加载失败');
        }
        setRecords(sortApplications(payload.applications));
        setLoadError('');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        setLoadError('暂时无法同步，当前显示已有数据');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return records.filter(
      (record) =>
        ((filter === '流程中' && record.stage !== '已结束') ||
          (filter === '待更新' &&
            record.stage !== '已结束' &&
            record.checkedAt !== today) ||
          record.stage === filter) &&
        (!keyword || record.company.toLowerCase().includes(keyword)),
    );
  }, [filter, query, records, today]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  const markCompanyChecked = async (record: ApplicationRecord) => {
    if (record.stage === '已结束' || record.checkedAt === today) return;
    setRecords((current) =>
      current.map((item) =>
        item.id === record.id ? { ...item, checkedAt: today } : item,
      ),
    );
    try {
      await markApplicationChecked(record.id, today);
    } catch (error) {
      setRecords((current) =>
        current.map((item) =>
          item.id === record.id
            ? { ...item, checkedAt: record.checkedAt }
            : item,
        ),
      );
      toast.add({
        title: error instanceof Error ? error.message : '更新检查状态失败',
        type: 'error',
      });
    }
  };

  const openCompanyWebsite = (record: ApplicationRecord) => {
    if (!record.portalUrl) return;
    window.open(record.portalUrl, '_blank', 'noopener,noreferrer');
    void markCompanyChecked(record);
  };

  const updateRecord = (record: ApplicationRecord) => {
    setRecords((current) =>
      sortApplications(
        current.map((item) => (item.id === record.id ? record : item)),
      ),
    );
  };

  const saveInlineChange = async (
    record: ApplicationRecord,
    changes: Partial<Pick<ApplicationRecord, 'company' | 'stage' | 'portalUrl'>>,
    successTitle: string,
  ) => {
    setSavingId(record.id);
    try {
      const saved = await requestApplication('PUT', { ...record, ...changes });
      updateRecord(saved);
      toast.add({ title: successTitle, type: 'success' });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '保存失败',
        type: 'error',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Toaster>
      <main className="min-h-screen bg-background lg:grid lg:grid-cols-[250px_1fr]">
        <aside className="hidden min-h-screen border-r border-slate-800 bg-[#0d2034] px-5 py-7 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-400 text-xl font-black text-slate-950">
              O
            </div>
            <div>
              <p className="text-xl font-black">OfferTrack</p>
              <p className="text-sm text-slate-400">2027 秋招</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
            <div className="flex items-center gap-3">
              <Building2 className="size-5 text-emerald-300" />
              <span className="font-bold">企业列表</span>
              <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-sm font-bold">
                {records.length}
              </span>
            </div>
          </div>

          <div className="mt-auto space-y-3 px-2 pb-2">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-3 text-sm">
              <UserRound className="size-4 text-emerald-300" />
              <span className="min-w-0 truncate font-bold text-white">
                {username}
              </span>
            </div>
            <p className="text-sm leading-6 text-slate-400">
              只记录企业、阶段、投递时间和官网
            </p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
            <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2 lg:hidden">
                  <CircleDot className="size-5 text-emerald-600" />
                  <span className="font-black">OfferTrack</span>
                </div>
                <h1 className="truncate text-2xl font-black sm:text-3xl">
                  秋招企业管理
                </h1>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`退出账号 ${username}`}
                  title="退出登录"
                  onClick={onLogout}
                >
                  <LogOut className="size-5" />
                </Button>
                <Button
                  size="lg"
                  className="h-12 shrink-0 rounded-xl px-4 text-base font-black shadow-sm sm:px-5"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="size-5" />
                  新增企业
                </Button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-10">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-black">共 {records.length} 家企业</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loading ? '正在同步…' : loadError || '企业信息已同步保存'}
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索企业"
                  className="h-11 bg-white pl-10 text-base"
                />
              </div>
            </div>

            <div className="scrollbar-thin mb-5 flex gap-2 overflow-x-auto pb-2">
              {(['流程中', '待更新', ...stageOptions] as const).map((stage) => {
                const count = records.filter((record) => {
                  if (stage === '流程中') return record.stage !== '已结束';
                  if (stage === '待更新') {
                    return (
                      record.stage !== '已结束' && record.checkedAt !== today
                    );
                  }
                  return record.stage === stage;
                }).length;
                return (
                  <Button
                    key={stage}
                    type="button"
                    variant={filter === stage ? 'default' : 'outline'}
                    className="shrink-0 rounded-full"
                    onClick={() => {
                      setFilter(stage);
                      setPage(1);
                    }}
                  >
                    {stage}
                    <span className="opacity-70">{count}</span>
                  </Button>
                );
              })}
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                    <TableHead className="min-w-[240px] px-5">企业名</TableHead>
                    <TableHead className="min-w-[130px]">当前阶段</TableHead>
                    <TableHead className="min-w-[130px]">投递时间</TableHead>
                    <TableHead className="min-w-[220px]">
                      企业网站地址
                    </TableHead>
                    <TableHead className="w-24 text-center">结束</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      role={record.portalUrl ? 'link' : undefined}
                      tabIndex={record.portalUrl ? 0 : undefined}
                      className={`h-[76px] ${record.portalUrl ? 'cursor-pointer' : ''}`}
                      onClick={(event) => {
                        const target = event.target;
                        if (
                          target instanceof Element &&
                          target.closest('button, a, input, [data-row-action]')
                        ) {
                          return;
                        }
                        openCompanyWebsite(record);
                      }}
                      onKeyDown={(event) => {
                        if (
                          event.target === event.currentTarget &&
                          record.portalUrl &&
                          (event.key === 'Enter' || event.key === ' ')
                        ) {
                          event.preventDefault();
                          openCompanyWebsite(record);
                        }
                      }}
                    >
                      <TableCell className="px-5">
                        <div className="flex items-center gap-4">
                          <CompanyMark name={record.company} />
                          <InlineCompanyName
                            record={record}
                            saving={savingId === record.id}
                            onSave={(company) =>
                              void saveInlineChange(
                                record,
                                { company },
                                `企业名已改为 ${company}`,
                              )
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <InlineStageSelect
                          record={record}
                          saving={savingId === record.id}
                          onChange={(stage) =>
                            void saveInlineChange(
                              record,
                              { stage },
                              `${record.company} 已更新为“${stage}”`,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600">
                        {record.appliedAt}
                      </TableCell>
                      <TableCell>
                        <InlineWebsite
                          record={record}
                          saving={savingId === record.id}
                          onSave={(portalUrl) =>
                            void saveInlineChange(
                              record,
                              { portalUrl },
                              `${record.company} 的网站地址已更新`,
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={
                            record.stage === '已结束' || savingId === record.id
                          }
                          aria-label={`将 ${record.company} 标记为已结束`}
                          className="border-rose-200 font-bold text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                          onClick={(event) => {
                            event.stopPropagation();
                            void saveInlineChange(
                              record,
                              { stage: '已结束' },
                              `${record.company} 已移至“已结束”`,
                            );
                          }}
                        >
                          {record.stage === '已结束' ? '已结束' : '一键结束'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-36 text-center">
                        <p className="font-bold">没有符合条件的企业</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          换一个阶段或搜索词试试
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredRecords.length > 0 && (
              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  第 {(currentPage - 1) * pageSize + 1}–
                  {Math.min(currentPage * pageSize, filteredRecords.length)}{' '}
                  条， 共 {filteredRecords.length} 条
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        text="上一页"
                        aria-disabled={currentPage === 1}
                        className={
                          currentPage === 1
                            ? 'pointer-events-none opacity-40'
                            : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage - 1);
                        }}
                      />
                    </PaginationItem>
                    {Array.from({ length: pageCount }, (_, index) => {
                      const pageNumber = index + 1;
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNumber}
                            onClick={(event) => {
                              event.preventDefault();
                              goToPage(pageNumber);
                            }}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        text="下一页"
                        aria-disabled={currentPage === pageCount}
                        className={
                          currentPage === pageCount
                            ? 'pointer-events-none opacity-40'
                            : undefined
                        }
                        onClick={(event) => {
                          event.preventDefault();
                          goToPage(currentPage + 1);
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            <AssessmentLinks
              companyOptionsByType={
                (['测评', '笔试', '面试'] as AssessmentLinkType[]).reduce(
                  (options, type) => {
                    options[type] = Array.from(
                      new Set(
                        records
                          .filter((record) => record.stage === type)
                          .map((record) => record.company),
                      ),
                    );
                    return options;
                  },
                  {
                    测评: [],
                    笔试: [],
                    面试: [],
                  } as Record<AssessmentLinkType, string[]>,
                )
              }
            />
          </div>
        </section>

        <AddApplicationDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          existingRecords={records}
          onCreated={(record) =>
            setRecords((current) => sortApplications([...current, record]))
          }
        />
      </main>
    </Toaster>
  );
}
