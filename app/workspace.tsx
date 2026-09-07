'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  FileText,
  KanbanSquare,
  Layers3,
  LayoutDashboard,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  ApplicationForm,
  createBlankApplication,
  stageCategories,
} from './application-form';
import {
  applications as initialApplications,
  type ApplicationRecord,
  type StageCategory,
} from '@/lib/applications';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster, toast } from '@/components/ui/toast';

type ViewId = 'overview' | 'applications' | 'tasks' | 'templates' | 'settings';

const categoryMeta: Record<StageCategory, { color: string; bar: string }> = {
  简历筛选: {
    color: 'bg-sky-50 text-sky-700 ring-sky-200',
    bar: 'bg-sky-500',
  },
  '测评/笔试': {
    color: 'bg-amber-50 text-amber-700 ring-amber-200',
    bar: 'bg-amber-500',
  },
  面试中: {
    color: 'bg-violet-50 text-violet-700 ring-violet-200',
    bar: 'bg-violet-500',
  },
  Offer: {
    color: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    bar: 'bg-emerald-500',
  },
  已结束: {
    color: 'bg-rose-50 text-rose-700 ring-rose-200',
    bar: 'bg-rose-500',
  },
  待补充: {
    color: 'bg-slate-100 text-slate-600 ring-slate-200',
    bar: 'bg-slate-400',
  },
};

const viewCopy: Record<ViewId, { title: string; description: string }> = {
  overview: {
    title: '秋招作战总览',
    description: '先把每一个机会放到看得见的位置。',
  },
  applications: {
    title: '投递管理',
    description: '集中查看、筛选和更新所有企业投递。',
  },
  tasks: {
    title: '待办日历',
    description: '把需要处理的测评、笔试和面试集中排好。',
  },
  templates: {
    title: '流程模板',
    description: '查看常用招聘流程，新增投递时可作为参考。',
  },
  settings: {
    title: '工作台设置',
    description: '查看数据同步状态和当前版本能力。',
  },
};

const templateCards = [
  {
    name: '通用技术岗',
    description: '适合研发、测试、数据等常规技术岗位',
    stages: [
      '已投递',
      '简历初筛',
      '测评',
      '笔试',
      '一面',
      '二面',
      'HR 面',
      'Offer',
    ],
  },
  {
    name: 'AI / Agent 岗',
    description: '突出算法笔试、项目面与综合面',
    stages: [
      '已投递',
      '简历初筛',
      '在线测评',
      '算法笔试',
      '技术一面',
      '项目面',
      'HR 面',
      'Offer',
    ],
  },
  {
    name: '游戏研发岗',
    description: '适合客户端、服务端和游戏 AI 岗位',
    stages: [
      '已投递',
      '简历初筛',
      '笔试',
      '技术一面',
      '技术二面',
      '制作人面',
      'HR 面',
      'Offer',
    ],
  },
];

function CompanyMark({
  name,
  large = false,
}: {
  name: string;
  large?: boolean;
}) {
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
      className={`grid shrink-0 place-items-center rounded-2xl font-black ${large ? 'size-14 text-xl' : 'size-11 text-base'} ${palette[sum % palette.length]}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function StatusBadge({ item }: { item: ApplicationRecord }) {
  return (
    <Badge
      variant="outline"
      className={`${categoryMeta[item.stageCategory].color} h-7 px-2.5 text-sm ring-1 ring-inset`}
    >
      {item.stage}
    </Badge>
  );
}

function formatDate(value: string, withTime = false) {
  if (!value) return '待补充';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

function flowFor(record: ApplicationRecord) {
  const templates: Record<StageCategory, string[]> = {
    简历筛选: ['已投递', '简历初筛', '测评/笔试', '面试', 'Offer'],
    '测评/笔试': ['已投递', '简历初筛', '测评', '笔试', '面试', 'Offer'],
    面试中: ['已投递', '简历初筛', '测评/笔试', '一面', '二面', 'Offer'],
    Offer: ['已投递', '简历初筛', '测评/笔试', '面试', 'Offer'],
    已结束: ['已投递', '简历初筛', '流程结束'],
    待补充: ['已投递', '待补充', '测评/笔试', '面试', 'Offer'],
  };
  const flow = [...templates[record.stageCategory]];
  const currentGuess = flow.findIndex(
    (stage) =>
      stage === record.stage ||
      (record.stageCategory === '简历筛选' && stage === '简历初筛') ||
      (record.stageCategory === '测评/笔试' && stage === record.stage) ||
      (record.stageCategory === '面试中' && stage.includes(record.stage)),
  );
  if (currentGuess < 0)
    flow.splice(Math.max(1, flow.length - 1), 0, record.stage);
  return flow;
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
  const result = (await response.json()) as {
    application?: ApplicationRecord;
    error?: string;
  };
  if (!response.ok || !result.application) {
    throw new Error(result.error ?? '保存失败，请稍后重试');
  }
  return result.application;
}

function ApplicationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (record: ApplicationRecord) => void;
}) {
  const [draft, setDraft] = useState(createBlankApplication);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    try {
      setSubmitting(true);
      const created = await requestApplication('POST', draft);
      onCreated(created);
      setDraft(createBlankApplication());
      onOpenChange(false);
      toast.add({
        title: '投递已新增',
        description: `${created.company} 已加入工作台`,
        type: 'success',
      });
    } catch (error) {
      toast.add({
        title: '新增失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setDraft(createBlankApplication());
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">新增投递</DialogTitle>
          <DialogDescription>
            公司名称为必填项，其余信息可以稍后在详情中继续补充。
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          value={draft}
          onChange={setDraft}
          onSubmit={submit}
          onCancel={() => onOpenChange(false)}
          submitting={submitting}
          submitLabel="添加投递"
        />
      </DialogContent>
    </Dialog>
  );
}

function DetailSheet({
  selected,
  onClose,
  onUpdated,
}: {
  selected: ApplicationRecord | null;
  onClose: () => void;
  onUpdated: (record: ApplicationRecord) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ApplicationRecord | null>(selected);
  const [submitting, setSubmitting] = useState(false);

  if (!selected || !draft) {
    return null;
  }

  const flow = flowFor(selected);
  const currentIndex = Math.max(
    0,
    flow.findIndex(
      (stage) =>
        stage === selected.stage ||
        (selected.stageCategory === '简历筛选' && stage === '简历初筛') ||
        (selected.stageCategory === '待补充' && stage === '待补充') ||
        (selected.stageCategory === 'Offer' && stage === 'Offer') ||
        (selected.stageCategory === '已结束' && stage === '流程结束'),
    ),
  );

  const save = async () => {
    try {
      setSubmitting(true);
      const updated = await requestApplication('PUT', draft);
      onUpdated(updated);
      setEditing(false);
      toast.add({
        title: '修改已保存',
        description: `${updated.company} 的进度已更新`,
        type: 'success',
      });
    } catch (error) {
      toast.add({
        title: '保存失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[min(96vw,600px)] overflow-y-auto sm:max-w-[600px]">
        <SheetHeader className="border-b px-6 py-6">
          <div className="flex items-start gap-4 pr-10">
            <CompanyMark name={selected.company} large />
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-2xl font-black leading-tight">
                {selected.company}
              </SheetTitle>
              <SheetDescription className="mt-1 text-base">
                {selected.jobTitle || '岗位待补充'}
                {selected.city ? ` · ${selected.city}` : ''}
              </SheetDescription>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge item={selected} />
            <Badge variant="secondary" className="h-7 px-2.5 text-sm">
              {selected.stageStatus}
            </Badge>
            <Badge variant="outline" className="h-7 px-2.5 text-sm">
              {selected.priority}优先级
            </Badge>
            {!editing && (
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setEditing(true)}
              >
                <Pencil /> 编辑信息
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="px-6 pb-8">
          {editing ? (
            <ApplicationForm
              value={draft}
              onChange={setDraft}
              onSubmit={save}
              onCancel={() => {
                setDraft(selected);
                setEditing(false);
              }}
              submitting={submitting}
              submitLabel="保存修改"
            />
          ) : (
            <div className="space-y-7">
              <section>
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-base font-bold">招聘流程</h3>
                  <span className="text-sm text-muted-foreground">
                    可通过“编辑信息”更新
                  </span>
                </div>
                <div>
                  {flow.map((stage, index) => {
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                      <div
                        key={`${stage}-${index}`}
                        className="relative flex gap-3 pb-5 last:pb-0"
                      >
                        {index < flow.length - 1 && (
                          <span
                            className={`absolute left-[9px] top-5 h-full w-px ${isDone ? 'bg-emerald-400' : 'bg-border'}`}
                          />
                        )}
                        <span
                          className={`relative z-10 mt-0.5 size-[19px] rounded-full border-[5px] ${isCurrent ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgb(16_185_129/12%)]' : isDone ? 'border-emerald-400 bg-emerald-400' : 'border-slate-200 bg-white'}`}
                        />
                        <div>
                          <p
                            className={`text-base font-semibold ${isCurrent ? 'text-emerald-700' : !isDone ? 'text-muted-foreground' : ''}`}
                          >
                            {stage}
                          </p>
                          {isCurrent && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              当前状态：{selected.stageStatus}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-muted-foreground">
                  下一步动作
                </p>
                <p className="mt-2 text-lg font-bold">
                  {selected.nextAction || '暂未填写'}
                </p>
                {selected.deadlineAt && (
                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
                    <CalendarClock className="size-4" />
                    截止：{formatDate(selected.deadlineAt, true)}
                  </p>
                )}
              </section>

              <section className="space-y-4">
                <h3 className="text-base font-bold">投递信息</h3>
                <div className="grid grid-cols-[104px_1fr] gap-y-4 text-base">
                  <span className="text-muted-foreground">原始状态</span>
                  <span>{selected.sourceStatus ?? '原文件未填写'}</span>
                  <span className="text-muted-foreground">岗位</span>
                  <span>{selected.jobTitle || '待补充'}</span>
                  <span className="text-muted-foreground">城市</span>
                  <span>{selected.city || '待补充'}</span>
                  <span className="text-muted-foreground">投递日期</span>
                  <span>{formatDate(selected.appliedAt)}</span>
                  <span className="text-muted-foreground">备注</span>
                  <span className="whitespace-pre-wrap">
                    {selected.notes || '暂无备注'}
                  </span>
                </div>
              </section>

              {selected.portalUrl && (
                <a
                  href={selected.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({
                    className: 'h-11 w-full text-base',
                  })}
                >
                  打开招聘官网 <ArrowUpRight />
                </a>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DashboardView({
  records,
  onSelect,
}: {
  records: ApplicationRecord[];
  onSelect: (record: ApplicationRecord) => void;
}) {
  const counts = {
    total: records.length,
    screening: records.filter((item) => item.stageCategory === '简历筛选')
      .length,
    tests: records.filter((item) => item.stageCategory === '测评/笔试').length,
    interviews: records.filter((item) => item.stageCategory === '面试中')
      .length,
    missing: records.filter((item) => item.stageCategory === '待补充').length,
  };
  const attention = records.filter(
    (item) => item.priority === '高' || item.stageStatus === '待处理',
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: '全部投递',
            value: counts.total,
            note: '持续跟进中',
            icon: Building2,
            tone: 'text-slate-700 bg-slate-100',
          },
          {
            label: '简历筛选中',
            value: counts.screening,
            note: '等待企业反馈',
            icon: FileText,
            tone: 'text-sky-700 bg-sky-50',
          },
          {
            label: '测评 / 笔试',
            value: counts.tests,
            note: '注意截止时间',
            icon: ClipboardCheck,
            tone: 'text-amber-700 bg-amber-50',
          },
          {
            label: '面试阶段',
            value: counts.interviews,
            note: '重点跟进',
            icon: BriefcaseBusiness,
            tone: 'text-violet-700 bg-violet-50',
          },
          {
            label: '信息待补充',
            value: counts.missing,
            note: '继续完善记录',
            icon: CircleDot,
            tone: 'text-slate-600 bg-slate-100',
          },
        ].map(({ label, value, note, icon: Icon, tone }) => (
          <Card
            key={label}
            className="gap-3 border-0 py-4 shadow-[0_10px_30px_rgb(15_23_42/5%)]"
          >
            <CardHeader className="flex-row items-center justify-between px-4">
              <span className="text-sm font-semibold text-muted-foreground">
                {label}
              </span>
              <span
                className={`grid size-9 place-items-center rounded-xl ${tone}`}
              >
                <Icon className="size-[18px]" />
              </span>
            </CardHeader>
            <CardContent className="px-4">
              <p className="text-3xl font-black tabular-nums">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.65fr)]">
        <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg font-bold">阶段分布</CardTitle>
            <p className="text-sm text-muted-foreground">按统一阶段分类统计</p>
          </CardHeader>
          <CardContent className="space-y-5 pt-1">
            {stageCategories.map((category) => {
              const value = records.filter(
                (item) => item.stageCategory === category,
              ).length;
              return (
                <div
                  key={category}
                  className="grid grid-cols-[88px_1fr_30px] items-center gap-3"
                >
                  <span className="text-sm font-semibold">{category}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${categoryMeta[category].bar}`}
                      style={{
                        width: `${Math.max(4, records.length ? (value / records.length) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-bold tabular-nums">
                    {value}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-0 bg-slate-900 text-slate-50 shadow-[0_16px_40px_rgb(15_23_42/16%)]">
          <CardHeader className="border-b border-slate-700 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-white">
                需要我处理
              </CardTitle>
              <Badge className="bg-emerald-400 text-slate-950">
                {attention.length}
              </Badge>
            </div>
            <p className="text-sm text-slate-400">高优先级与待处理事项</p>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {attention.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="group flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-slate-800"
              >
                <CompanyMark name={item.company} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{item.company}</p>
                  <p className="truncate text-sm text-slate-400">
                    {item.nextAction || '查看并更新进度'}
                  </p>
                </div>
                <ChevronRight className="size-4 text-slate-500 group-hover:text-white" />
              </button>
            ))}
            {attention.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">
                当前没有高优先级事项
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ApplicationsView({
  records,
  onSelect,
}: {
  records: ApplicationRecord[];
  onSelect: (record: ApplicationRecord) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StageCategory | '全部'>('全部');
  const filtered = useMemo(
    () =>
      records.filter(
        (item) =>
          item.company.toLowerCase().includes(search.toLowerCase()) &&
          (filter === '全部' || item.stageCategory === filter),
      ),
    [records, search, filter],
  );

  return (
    <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
      <CardHeader className="gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-xl font-black">全部投递</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {filtered.length} 条记录
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索公司或岗位"
            className="h-10 w-full pl-9 sm:w-72"
          />
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <Tabs defaultValue="table">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
            <TabsList>
              <TabsTrigger value="table">
                <ListFilter />
                表格
              </TabsTrigger>
              <TabsTrigger value="kanban">
                <KanbanSquare />
                看板
              </TabsTrigger>
            </TabsList>
            <div className="scrollbar-thin flex max-w-full gap-1 overflow-x-auto">
              {(['全部', ...stageCategories] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={filter === value ? 'secondary' : 'ghost'}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
          <TabsContent value="table" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="min-w-[280px] pl-6 text-sm">
                    公司与岗位
                  </TableHead>
                  <TableHead>当前阶段</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="min-w-[190px]">下一步动作</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead className="pr-6 text-right">招聘入口</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="h-[76px] cursor-pointer"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-4">
                        <CompanyMark name={item.company} />
                        <div className="min-w-0">
                          <p className="truncate text-base font-black text-slate-900">
                            {item.company}
                          </p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {item.jobTitle || '岗位待补充'}
                            {item.city ? ` · ${item.city}` : ''}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge item={item} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm font-medium">
                        <span
                          className={`size-2 rounded-full ${item.stageStatus === '待处理' ? 'bg-amber-500' : item.stageStatus === '等待结果' ? 'bg-sky-500' : item.stageStatus === '未通过' ? 'bg-rose-500' : 'bg-slate-400'}`}
                        />
                        {item.stageStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.nextAction || '暂未填写'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          item.priority === '高'
                            ? 'font-bold text-rose-600'
                            : item.priority === '中'
                              ? 'font-semibold text-amber-700'
                              : 'text-muted-foreground'
                        }
                      >
                        {item.priority}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {item.portalUrl && (
                        <a
                          href={item.portalUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`打开${item.company}招聘官网`}
                          className={buttonVariants({
                            size: 'icon-sm',
                            variant: 'ghost',
                          })}
                        >
                          <ArrowUpRight />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="grid place-items-center py-16 text-sm text-muted-foreground">
                没有符合条件的投递记录
              </div>
            )}
          </TabsContent>
          <TabsContent
            value="kanban"
            className="mt-0 overflow-x-auto p-4 sm:p-6"
          >
            <div className="grid min-w-[1260px] grid-cols-6 gap-4">
              {stageCategories.map((category) => {
                const items = filtered.filter(
                  (item) => item.stageCategory === category,
                );
                return (
                  <section
                    key={category}
                    className="rounded-2xl bg-slate-50 p-3"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${categoryMeta[category].bar}`}
                        />
                        <h3 className="font-semibold">{category}</h3>
                      </div>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onSelect(item)}
                          className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <CompanyMark name={item.company} />
                            <div className="min-w-0">
                              <p className="truncate text-base font-bold">
                                {item.company}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {item.jobTitle || item.stage}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {item.stageStatus}
                            </span>
                            <span
                              className={`text-xs ${item.priority === '高' ? 'font-bold text-rose-600' : 'text-muted-foreground'}`}
                            >
                              {item.priority}优先级
                            </span>
                          </div>
                        </button>
                      ))}
                      {items.length === 0 && (
                        <div className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                          暂无记录
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function TasksView({
  records,
  onSelect,
}: {
  records: ApplicationRecord[];
  onSelect: (record: ApplicationRecord) => void;
}) {
  const actionItems = records.filter(
    (item) => item.stageStatus === '待处理' || item.priority === '高',
  );
  const scheduled = records
    .filter((item) => item.deadlineAt)
    .sort((a, b) => a.deadlineAt.localeCompare(b.deadlineAt));
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.7fr)]">
      <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-black">需要处理</CardTitle>
            <Badge>{actionItems.length} 项</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex w-full items-center gap-4 rounded-2xl border bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
                <Clock3 className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">
                  {item.nextAction || '更新投递进度'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.company} · {item.stage}
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline">{item.priority}优先级</Badge>
                {item.deadlineAt && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    {formatDate(item.deadlineAt, true)}
                  </p>
                )}
              </div>
            </button>
          ))}
          {actionItems.length === 0 && (
            <div className="grid place-items-center py-16 text-center">
              <CheckCircle2 className="mb-3 size-9 text-emerald-500" />
              <p className="font-semibold">目前没有紧急待办</p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-black">时间安排</CardTitle>
          <p className="text-sm text-muted-foreground">
            在投递详情里编辑截止时间后会显示在这里
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {scheduled.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="flex w-full gap-3 rounded-xl bg-slate-50 p-3 text-left"
            >
              <CalendarClock className="mt-0.5 size-5 text-emerald-600" />
              <div>
                <p className="font-bold">{formatDate(item.deadlineAt, true)}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.company} · {item.nextAction || item.stage}
                </p>
              </div>
            </button>
          ))}
          {scheduled.length === 0 && (
            <div className="grid place-items-center py-14 text-center">
              <CalendarDays className="mb-3 size-9 text-slate-300" />
              <p className="font-semibold">还没有设置截止时间</p>
              <p className="mt-1 text-sm text-muted-foreground">
                打开任意投递即可补充
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplatesView() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {templateCards.map((template, templateIndex) => (
        <Card
          key={template.name}
          className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]"
        >
          <CardHeader className="border-b">
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`grid size-11 place-items-center rounded-xl ${templateIndex === 0 ? 'bg-sky-50 text-sky-700' : templateIndex === 1 ? 'bg-violet-50 text-violet-700' : 'bg-emerald-50 text-emerald-700'}`}
              >
                <Layers3 className="size-5" />
              </span>
              {templateIndex === 0 && <Badge>默认</Badge>}
            </div>
            <CardTitle className="text-xl font-black">
              {template.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </CardHeader>
          <CardContent>
            <ol className="space-y-0">
              {template.stages.map((stage, index) => (
                <li
                  key={stage}
                  className="relative flex items-center gap-3 pb-4 last:pb-0"
                >
                  {index < template.stages.length - 1 && (
                    <span className="absolute left-[11px] top-6 h-full w-px bg-border" />
                  )}
                  <span className="relative z-10 grid size-6 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <span className="font-semibold">{stage}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SettingsView({ synced, count }: { synced: boolean; count: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
        <CardHeader>
          <CardTitle className="text-xl font-black">数据状态</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-semibold">持久化存储</span>
            <Badge className={synced ? 'bg-emerald-600' : ''}>
              {synced ? '已连接' : '正在连接'}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-semibold">投递记录</span>
            <strong>{count} 条</strong>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
        <CardHeader>
          <CardTitle className="text-xl font-black">当前能力</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            新增与编辑投递
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            状态、阶段、优先级与截止时间
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600" />
            表格、看板和待办联动
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function OfferTrackWorkspace() {
  const [records, setRecords] =
    useState<ApplicationRecord[]>(initialApplications);
  const [activeView, setActiveView] = useState<ViewId>('overview');
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/applications', { cache: 'no-store' })
      .then(async (response) => {
        const result = (await response.json()) as {
          applications?: ApplicationRecord[];
          error?: string;
        };
        if (!response.ok || !result.applications)
          throw new Error(result.error ?? '同步失败');
        if (!cancelled) {
          setRecords(result.applications);
          setSynced(true);
        }
      })
      .catch(() => {
        if (!cancelled) setSynced(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(
    () => ({
      missing: records.filter((item) => item.stageCategory === '待补充').length,
      known: records.filter((item) => item.stageCategory !== '待补充').length,
    }),
    [records],
  );

  const changeView = (view: ViewId) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreated = (record: ApplicationRecord) => {
    setRecords((current) => [record, ...current]);
    setActiveView('applications');
  };

  const handleUpdated = (record: ApplicationRecord) => {
    setRecords((current) =>
      current.map((item) => (item.id === record.id ? record : item)),
    );
    setSelected(record);
  };

  const navItems: Array<{
    id: ViewId;
    label: string;
    icon: typeof LayoutDashboard;
  }> = [
    { id: 'overview', label: '总览', icon: LayoutDashboard },
    { id: 'applications', label: '投递管理', icon: BriefcaseBusiness },
    { id: 'tasks', label: '待办日历', icon: CalendarDays },
    { id: 'templates', label: '流程模板', icon: ListFilter },
  ];
  const copy = viewCopy[activeView];

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: 'open_application_details',
          title: '打开企业投递详情',
          description: '按公司名称查找投递记录，并在工作台中打开该企业的详情。',
          inputSchema: {
            type: 'object',
            properties: { company: { type: 'string', minLength: 1 } },
            required: ['company'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input: unknown) {
            if (
              !input ||
              typeof input !== 'object' ||
              !('company' in input) ||
              typeof input.company !== 'string' ||
              !input.company.trim()
            )
              throw new Error('company 必须是非空字符串');
            const companyQuery = input.company.trim().toLowerCase();
            const match = records.find((item) =>
              item.company.toLowerCase().includes(companyQuery),
            );
            if (!match) throw new Error(`没有找到公司：${input.company}`);
            setSelected(match);
            return {
              company: match.company,
              stage: match.stage,
              status: match.stageStatus,
            };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, [records]);

  return (
    <Toaster>
      <main className="min-h-screen bg-background text-foreground">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary font-black text-sidebar-primary-foreground">
              O
            </span>
            <div>
              <p className="font-bold tracking-tight text-white">OfferTrack</p>
              <p className="text-xs text-slate-400">2027 秋招</p>
            </div>
          </div>
          <nav className="mt-9 space-y-1" aria-label="主导航">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => changeView(id)}
                aria-current={activeView === id ? 'page' : undefined}
                className={`flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-base font-semibold transition ${activeView === id ? 'bg-sidebar-accent text-white shadow-sm' : 'text-slate-400 hover:bg-sidebar-accent/60 hover:text-white'}`}
              >
                <Icon className="size-[19px]" />
                {label}
                {id === 'applications' && (
                  <span className="ml-auto rounded-md bg-slate-700 px-2 py-0.5 text-sm text-slate-200">
                    {records.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-4">
            <div className="rounded-2xl bg-slate-800/70 p-4 ring-1 ring-slate-700">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="size-4 text-emerald-400" />
                数据完整度
              </div>
              <Progress
                value={
                  records.length
                    ? Math.round((counts.known / records.length) * 100)
                    : 0
                }
                className="h-1.5"
              />
              <p className="mt-2 text-xs leading-5 text-slate-400">
                已有 {counts.known} 条进度，{counts.missing} 条待补充
              </p>
            </div>
            <button
              onClick={() => changeView('settings')}
              className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold ${activeView === 'settings' ? 'bg-sidebar-accent text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Settings className="size-[18px]" />
              设置
            </button>
          </div>
        </aside>

        <section className="min-h-screen lg:pl-[236px]">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b bg-white/92 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
            <div className="flex items-center gap-3 lg:hidden">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-900 font-black text-emerald-400">
                O
              </span>
              <span className="text-lg font-black">OfferTrack</span>
            </div>
            <div className="hidden items-center gap-2 text-sm font-medium text-muted-foreground lg:flex">
              <CircleDot
                className={`size-4 ${synced ? 'text-emerald-500' : 'text-amber-500'}`}
              />
              {synced ? '数据已同步' : '正在连接数据'}
            </div>
            <Button
              size="lg"
              className="h-11 rounded-xl px-4 text-base font-bold shadow-[0_8px_22px_rgb(5_150_105/22%)]"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-5" />
              新增投递
            </Button>
          </header>
          <nav
            className="scrollbar-thin flex gap-2 overflow-x-auto border-b bg-white px-4 py-3 lg:hidden"
            aria-label="移动端导航"
          >
            {navItems.map(({ id, label }) => (
              <Button
                key={id}
                size="sm"
                variant={activeView === id ? 'default' : 'ghost'}
                onClick={() => changeView(id)}
              >
                {label}
              </Button>
            ))}
          </nav>

          <div className="mx-auto max-w-[1600px] space-y-7 px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Autumn recruiting · 2027
                </p>
                <h1 className="text-3xl font-black tracking-tight sm:text-[2.1rem]">
                  {copy.title}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {copy.description}
                </p>
              </div>
              {activeView === 'overview' && (
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm text-muted-foreground ring-1 ring-border">
                  <Target className="size-4 text-emerald-600" />
                  <span>当前重点</span>
                  <strong className="text-foreground">
                    {
                      records.filter(
                        (item) =>
                          item.priority === '高' ||
                          item.stageStatus === '待处理',
                      ).length
                    }{' '}
                    项
                  </strong>
                </div>
              )}
            </div>

            {activeView === 'overview' && (
              <DashboardView records={records} onSelect={setSelected} />
            )}
            {activeView === 'applications' && (
              <ApplicationsView records={records} onSelect={setSelected} />
            )}
            {activeView === 'tasks' && (
              <TasksView records={records} onSelect={setSelected} />
            )}
            {activeView === 'templates' && <TemplatesView />}
            {activeView === 'settings' && (
              <SettingsView synced={synced} count={records.length} />
            )}
          </div>
        </section>

        <ApplicationDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={handleCreated}
        />
        <DetailSheet
          key={selected?.id ?? 'no-selection'}
          selected={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      </main>
    </Toaster>
  );
}
