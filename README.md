# OfferTrack 秋招进度管理

OfferTrack 是一个个人秋招投递管理工作台。本次交付先完成静态数据版本，将上级目录 `秋招.md` 中的 45 家企业、招聘入口和已有状态结构化后展示。

## 当前能力

- 总览统计与统一阶段分布
- 高优先级事项提示
- 投递表格、公司搜索与阶段筛选
- 看板视图
- 企业详情抽屉与招聘官网跳转
- 对缺失的岗位、城市、投递日期和进度明确标记为“待补充”

当前“新增投递”处于禁用状态，数据仍来自 `lib/applications.ts`。后续接入数据库时，再开放投递 CRUD、流程编辑、待办和历史时间线。

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
