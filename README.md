# OfferTrack 秋招进度管理

OfferTrack 是一个个人秋招投递管理工作台，将上级目录 `秋招.md` 中的 45 家企业、招聘入口和已有状态结构化后展示，并通过 D1 数据库存储后续新增和修改。

## 当前能力

- 总览统计与统一阶段分布
- 高优先级事项提示
- 投递表格、公司搜索与阶段筛选
- 看板视图
- 企业详情编辑与招聘官网跳转
- 新增投递并持久化保存
- 可切换的投递管理、待办日历、流程模板和设置页面
- 对缺失的岗位、城市、投递日期和进度明确标记为“待补充”

首次访问时会将 `lib/applications.ts` 中的 45 条初始数据写入空数据库。之后的新增与编辑均直接保存在数据库中。

## 本地运行

建议使用 Node.js 22.x；当前 Vinext 在 Windows Node.js 24 下可能在构建结束时触发底层退出断言。

```bash
npm install
npm run dev
```

默认地址为 `http://localhost:3000`。

## 检查

```bash
npm run lint
npm run build
```

数据库结构位于 `db/schema.ts`，迁移文件位于 `drizzle/`。修改结构后执行 `npm run db:generate`。
