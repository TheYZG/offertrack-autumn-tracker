'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CircleDot,
  CircleOff,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ApplicationForm, createBlankApplication } from './application-form';
import {
  applications as initialApplications,
  stageOptions,
  type ApplicationRecord,
  type CurrentStage,
} from '@/lib/applications';
import { Badge } from '@/components/ui/badge';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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

function StageBadge({ stage }: { stage: CurrentStage }) {
  return (
    <Badge
      variant="outline"
      className={`${stageStyle[stage]} h-8 px-3 text-sm font-bold ring-1 ring-inset`}
    >
      {stage}
    </Badge>
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

async function deleteApplication(id: string) {
  const response = await fetch('/api/applications', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const payload = (await response.json()) as {
    deletedId?: string;
    error?: string;
  };
  if (!response.ok || !payload.deletedId) {
    throw new Error(payload.error ?? '删除失败，请稍后重试');
  }
  return payload.deletedId;
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

function EditApplicationSheet({
  record,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  record: ApplicationRecord;
  onOpenChange: (open: boolean) => void;
  onUpdated: (record: ApplicationRecord) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState(record);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveRecord = async (
    nextDraft: ApplicationRecord,
    successTitle: string,
  ) => {
    setSubmitting(true);
    try {
      const saved = await requestApplication('PUT', nextDraft);
      onUpdated(saved);
      onOpenChange(false);
      toast.add({ title: successTitle, type: 'success' });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '保存失败',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submit = () => saveRecord(draft, `已保存 ${draft.company}`);

  const markAsEnded = () =>
    saveRecord(
      { ...draft, stage: '已结束' },
      `${draft.company} 已移至“已结束”`,
    );

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const deletedId = await deleteApplication(record.id);
      setDeleteOpen(false);
      onDeleted(deletedId);
      onOpenChange(false);
      toast.add({ title: `已删除 ${record.company}`, type: 'success' });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : '删除失败',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b pb-5">
            <div className="flex items-center gap-4">
              <CompanyMark name={record.company} />
              <div className="min-w-0">
                <SheetTitle className="truncate text-2xl font-black">
                  {record.company}
                </SheetTitle>
                <SheetDescription>编辑企业信息</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="space-y-6 px-4 py-6">
            {draft.stage !== '已结束' && (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                disabled={submitting || deleting}
                onClick={() => void markAsEnded()}
              >
                <CircleOff className="size-4" />
                一键标记为已结束
              </Button>
            )}
            <ApplicationForm
              value={draft}
              onChange={setDraft}
              onSubmit={submit}
              onCancel={() => onOpenChange(false)}
              submitting={submitting || deleting}
              submitLabel="保存修改"
            />
            <div className="border-t pt-5">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:bg-rose-50 hover:text-rose-700"
                disabled={submitting || deleting}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                删除这家企业
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除“{record.company}”？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后这条企业记录无法恢复。如果只是被挂，建议标记为“已结束”。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? '删除中…' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function OfferTrackWorkspace() {
  const [records, setRecords] = useState(initialApplications);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StageFilter>('流程中');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
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
    setSelected(null);
  };

  const removeRecord = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
    setSelected(null);
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

          <div className="mt-auto px-2 pb-2 text-sm leading-6 text-slate-400">
            只记录企业、阶段、投递时间和官网
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
              <Button
                size="lg"
                className="h-12 shrink-0 rounded-xl px-5 text-base font-black shadow-sm"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="size-5" />
                新增企业
              </Button>
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
                    <TableHead className="w-20 text-center">编辑</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRecords.map((record) => (
                    <TableRow
                      key={record.id}
                      role={record.portalUrl ? 'link' : undefined}
                      tabIndex={record.portalUrl ? 0 : undefined}
                      className={`h-[76px] ${record.portalUrl ? 'cursor-pointer' : ''}`}
                      onClick={() => openCompanyWebsite(record)}
                      onKeyDown={(event) => {
                        if (
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
                          <span className="text-base font-black sm:text-lg">
                            {record.company}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StageBadge stage={record.stage} />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-600">
                        {record.appliedAt}
                      </TableCell>
                      <TableCell>
                        {record.portalUrl ? (
                          <a
                            href={record.portalUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => {
                              event.stopPropagation();
                              void markCompanyChecked(record);
                            }}
                            className="inline-flex max-w-[260px] items-center gap-2 font-semibold text-emerald-700 hover:underline"
                          >
                            <span className="truncate">
                              {websiteLabel(record.portalUrl)}
                            </span>
                            <ArrowUpRight className="size-4 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">未填写</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`编辑 ${record.company}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelected(record);
                          }}
                        >
                          <Pencil className="size-4" />
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

        {selected && (
          <EditApplicationSheet
            key={selected.id}
            record={selected}
            onOpenChange={(open) => !open && setSelected(null)}
            onUpdated={updateRecord}
            onDeleted={removeRecord}
          />
        )}
      </main>
    </Toaster>
  );
}
