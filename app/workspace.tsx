'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  ListFilter,
  Search,
  Settings,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  applications,
  type ApplicationRecord,
  type StageCategory,
} from '@/lib/applications';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  待补充: {
    color: 'bg-slate-100 text-slate-600 ring-slate-200',
    bar: 'bg-slate-400',
  },
};

const navItems = [
  { label: '总览', icon: LayoutDashboard, active: true },
  { label: '投递管理', icon: BriefcaseBusiness },
  { label: '待办日历', icon: CalendarDays },
  { label: '流程模板', icon: ListFilter },
];

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
      className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${palette[sum % palette.length]}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function StatusBadge({ item }: { item: ApplicationRecord }) {
  return (
    <Badge
      variant="outline"
      className={`${categoryMeta[item.stageCategory].color} h-6 ring-1 ring-inset`}
    >
      {item.stage}
    </Badge>
  );
}

function DetailSheet({
  selected,
  onClose,
}: {
  selected: ApplicationRecord | null;
  onClose: () => void;
}) {
  const flow =
    selected?.stageCategory === '面试中'
      ? ['已投递', '简历初筛', '等待约面', '一面', '二面', 'Offer']
      : selected?.stageCategory === '测评/笔试'
        ? ['已投递', '简历初筛', selected.stage, '面试', 'Offer']
        : ['已投递', selected?.stage ?? '待补充', '测评/笔试', '面试', 'Offer'];
  const currentIndex = selected ? Math.max(0, flow.indexOf(selected.stage)) : 0;

  return (
    <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[min(92vw,520px)] overflow-y-auto sm:max-w-[520px]">
        {selected && (
          <>
            <SheetHeader className="border-b px-6 py-5">
              <div className="mb-3 flex items-center gap-3">
                <CompanyMark name={selected.company} />
                <div>
                  <SheetTitle className="text-xl font-bold">
                    {selected.company}
                  </SheetTitle>
                  <SheetDescription>岗位与投递日期待补充</SheetDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge item={selected} />
                <Badge variant="secondary">{selected.stageStatus}</Badge>
                <Badge variant="outline">{selected.priority}优先级</Badge>
              </div>
            </SheetHeader>

            <div className="space-y-7 px-6 pb-8">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">招聘流程</h3>
                  <span className="text-xs text-muted-foreground">
                    按现有信息推定
                  </span>
                </div>
                <div>
                  {flow.map((stage, index) => {
                    const isDone = index < currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <div
                        key={stage}
                        className="relative flex gap-3 pb-5 last:pb-0"
                      >
                        {index < flow.length - 1 && (
                          <span
                            className={`absolute left-[9px] top-5 h-full w-px ${isDone ? 'bg-emerald-400' : 'bg-border'}`}
                          />
                        )}
                        <span
                          className={`relative z-10 mt-0.5 size-[19px] rounded-full border-[5px] ${
                            isCurrent
                              ? 'border-emerald-500 bg-white shadow-[0_0_0_4px_rgb(16_185_129/12%)]'
                              : isDone
                                ? 'border-emerald-400 bg-emerald-400'
                                : 'border-slate-200 bg-white'
                          }`}
                        />
                        <div>
                          <p
                            className={`font-medium ${
                              isCurrent
                                ? 'text-emerald-700'
                                : !isDone
                                  ? 'text-muted-foreground'
                                  : ''
                            }`}
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

              <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">
                  下一步动作
                </p>
                <p className="mt-2 text-base font-semibold">
                  {selected.nextAction}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold">原始记录</h3>
                <div className="grid grid-cols-[96px_1fr] gap-y-3 text-sm">
                  <span className="text-muted-foreground">记录状态</span>
                  <span>{selected.sourceStatus ?? '原文件未填写'}</span>
                  <span className="text-muted-foreground">岗位</span>
                  <span>待补充</span>
                  <span className="text-muted-foreground">城市</span>
                  <span>待补充</span>
                  <span className="text-muted-foreground">投递日期</span>
                  <span>待补充</span>
                </div>
              </section>

              <a
                href={selected.portalUrl}
                target="_blank"
                rel="noreferrer"
                className={buttonVariants({
                  className: 'h-10 w-full',
                })}
              >
                打开招聘官网 <ArrowUpRight />
              </a>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function OfferTrackWorkspace() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StageCategory | '全部'>('全部');
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  const filtered = useMemo(
    () =>
      applications.filter(
        (item) =>
          item.company.toLowerCase().includes(search.toLowerCase()) &&
          (filter === '全部' || item.stageCategory === filter),
      ),
    [search, filter],
  );

  const counts = useMemo(
    () => ({
      total: applications.length,
      screening: applications.filter(
        (item) => item.stageCategory === '简历筛选',
      ).length,
      tests: applications.filter((item) => item.stageCategory === '测评/笔试')
        .length,
      interviews: applications.filter((item) => item.stageCategory === '面试中')
        .length,
      missing: applications.filter((item) => item.stageCategory === '待补充')
        .length,
    }),
    [],
  );

  const categories: StageCategory[] = [
    '简历筛选',
    '测评/笔试',
    '面试中',
    '待补充',
  ];
  const attention = applications.filter((item) => item.priority === '高');

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
          annotations: {
            readOnlyHint: true,
            untrustedContentHint: false,
          },
          execute(input: unknown) {
            if (
              !input ||
              typeof input !== 'object' ||
              !('company' in input) ||
              typeof input.company !== 'string' ||
              input.company.trim().length === 0
            ) {
              throw new Error('company 必须是非空字符串');
            }
            const query = input.company.trim().toLowerCase();
            const match = applications.find((item) =>
              item.company.toLowerCase().includes(query),
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
  }, []);

  return (
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
          {navItems.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition ${
                active
                  ? 'bg-sidebar-accent text-white shadow-sm'
                  : 'text-slate-400 hover:bg-sidebar-accent/60 hover:text-white'
              }`}
            >
              <Icon className="size-[18px]" />
              {label}
              {label === '投递管理' && (
                <span className="ml-auto rounded-md bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                  45
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
              value={Math.round(
                ((counts.total - counts.missing) / counts.total) * 100,
              )}
              className="h-1.5"
            />
            <p className="mt-2 text-xs leading-5 text-slate-400">
              已有 {counts.total - counts.missing} 条进度，{counts.missing}{' '}
              条待补充
            </p>
          </div>
          <button className="flex h-10 items-center gap-3 px-3 text-sm text-slate-400 hover:text-white">
            <Settings className="size-[18px]" />
            设置
          </button>
        </div>
      </aside>

      <section className="min-h-screen lg:pl-[236px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-slate-900 font-black text-emerald-400">
              O
            </span>
            <span className="font-bold">OfferTrack</span>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
            <CircleDot className="size-4 text-emerald-500" />
            静态数据已同步
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              最后更新：今天
            </span>
            <Button disabled title="静态数据版本暂不支持新增">
              <span className="text-lg leading-none">＋</span>
              新增投递
            </Button>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-7 px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Autumn recruiting · 2027
              </p>
              <h1 className="text-3xl font-black tracking-tight sm:text-[2.1rem]">
                秋招作战总览
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                先把每一个机会放到看得见的位置。
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-muted-foreground ring-1 ring-border">
              <Target className="size-4 text-emerald-600" />
              <span>当前重点</span>
              <strong className="text-foreground">{attention.length} 项</strong>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              {
                label: '全部投递',
                value: counts.total,
                note: '来源：秋招.md',
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
                note: '1 项需要处理',
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
                note: '原文件未写状态',
                icon: CircleDot,
                tone: 'text-slate-600 bg-slate-100',
              },
            ].map(({ label, value, note, icon: Icon, tone }) => (
              <Card
                key={label}
                className="gap-3 border-0 py-4 shadow-[0_10px_30px_rgb(15_23_42/5%)]"
              >
                <CardHeader className="flex-row items-center justify-between px-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    {label}
                  </span>
                  <span
                    className={`grid size-8 place-items-center rounded-lg ${tone}`}
                  >
                    <Icon className="size-4" />
                  </span>
                </CardHeader>
                <CardContent className="px-4">
                  <p className="text-3xl font-black tabular-nums">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,.65fr)]">
            <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-lg font-bold">阶段分布</CardTitle>
                <p className="text-sm text-muted-foreground">
                  按统一阶段分类统计，保留企业原始状态
                </p>
              </CardHeader>
              <CardContent className="space-y-5 pt-1">
                {categories.map((category) => {
                  const value = applications.filter(
                    (item) => item.stageCategory === category,
                  ).length;
                  return (
                    <div
                      key={category}
                      className="grid grid-cols-[88px_1fr_30px] items-center gap-3"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${categoryMeta[category].bar}`}
                          style={{
                            width: `${Math.max(6, (value / counts.total) * 100)}%`,
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
                <p className="text-sm text-slate-400">
                  优先处理，不要错过关键节点
                </p>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {attention.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group flex w-full items-center gap-3 rounded-xl px-1 py-3 text-left hover:bg-slate-800"
                  >
                    <CompanyMark name={item.company} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white">{item.company}</p>
                      <p className="truncate text-sm text-slate-400">
                        {item.nextAction}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-[0_10px_34px_rgb(15_23_42/5%)]">
            <CardHeader className="gap-4 border-b pb-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-lg font-bold">投递管理</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  共 {filtered.length} 条记录
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="搜索公司"
                    className="h-9 w-full pl-9 sm:w-56"
                  />
                </div>
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
                    {(['全部', ...categories] as const).map((value) => (
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
                        <TableHead className="pl-6">公司</TableHead>
                        <TableHead>当前阶段</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="min-w-[180px]">
                          下一步动作
                        </TableHead>
                        <TableHead>优先级</TableHead>
                        <TableHead className="pr-6 text-right">
                          招聘入口
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => (
                        <TableRow
                          key={item.id}
                          onClick={() => setSelected(item)}
                          className="cursor-pointer"
                        >
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-3">
                              <CompanyMark name={item.company} />
                              <div>
                                <p className="font-semibold">{item.company}</p>
                                <p className="text-xs text-muted-foreground">
                                  岗位待补充
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge item={item} />
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <span
                                className={`size-1.5 rounded-full ${
                                  item.stageStatus === '待处理'
                                    ? 'bg-amber-500'
                                    : item.stageStatus === '等待结果'
                                      ? 'bg-sky-500'
                                      : 'bg-slate-400'
                                }`}
                              />
                              {item.stageStatus}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {item.nextAction}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                item.priority === '高'
                                  ? 'font-semibold text-rose-600'
                                  : item.priority === '中'
                                    ? 'text-amber-700'
                                    : 'text-muted-foreground'
                              }
                            >
                              {item.priority}
                            </span>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
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
                  <div className="grid min-w-[980px] grid-cols-4 gap-4">
                    {categories.map((category) => {
                      const items = filtered.filter(
                        (item) => item.stageCategory === category,
                      );
                      return (
                        <section
                          key={category}
                          className="rounded-2xl bg-slate-50 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between px-1">
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
                                onClick={() => setSelected(item)}
                                className="w-full rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
                              >
                                <div className="flex items-center gap-2">
                                  <CompanyMark name={item.company} />
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold">
                                      {item.company}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.stage}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {item.stageStatus}
                                  </span>
                                  <span
                                    className={`text-xs ${
                                      item.priority === '高'
                                        ? 'font-semibold text-rose-600'
                                        : 'text-muted-foreground'
                                    }`}
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

          <p className="pb-3 text-center text-xs text-muted-foreground">
            此版本使用静态初始数据 · 岗位、城市、日期等信息等待后续补全
          </p>
        </div>
      </section>

      <DetailSheet selected={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
