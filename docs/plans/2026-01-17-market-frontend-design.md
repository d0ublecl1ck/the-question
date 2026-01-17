# Market Frontend Design

**Scope:** PRD Market page and Skill detail page alignment with list/table switch, search/filter, and entry points for rating/favorite/comment/report. Tech: React + Vite, Tailwind CSS, shadcn/ui first.

## UX Goals
- 快速发现技能（搜索 + 标签 + 排序 + 视图切换）
- 清晰转化路径（查看详情 → 收藏/评分/评论/举报）
- 信息密度可切换（列表卡片 / 表格）
- 视觉具“编辑型市场”质感，避免模板化

## Page Structure
### Market Page
1) 顶部工具条
- 搜索框（关键词）
- 标签筛选（多选）
- 排序（最新/评分/收藏）
- 视图切换 Tabs（列表 / 表格）

2) 官方精选区块
- 横向或双列卡片
- 展示官方/热门标签、评分与更新时间
- 入口到详情页

3) 通用列表区
- 列表视图：卡片（标题、描述、tags、评分、收藏、评论数、查看详情按钮）
- 表格视图：名称/标签/评分/收藏/更新/操作

### Skill Detail Page
- 头部：名称 + 描述 + tags
- 右侧操作栏：评分、收藏、举报
- 主体：SKILL.md 预览入口、评论区入口、版本信息入口

## Visual Direction
- 编辑型市场 + 技术目录混合风格
- 标题：具有识别度的展示字体；正文：清晰易读的无衬线
- 色彩：浅底 + 深墨文字 + 一种强调色（非紫）
- 背景：轻微渐变 + 细颗粒噪点
- 动效：轻量进入动画与 hover 提示，避免过度

## Components (shadcn/ui first)
- Input / Button / Badge / Tabs / Separator / Card / Table / Dialog / ScrollArea
- Radix UI 仅在 shadcn/ui 缺失时使用

## Data Flow (Front-end)
- MarketPage: `/api/v1/market/skills` 列表 + 过滤参数在前端切换
- DetailPage: `/api/v1/market/skills/{id}` 详情
- Comments: `/api/v1/market/comments/{skill_id}` + `/api/v1/comments/{comment_id}/replies` + `/api/v1/comments/{comment_id}/like`
- Favorite/Rating/Report: `/api/v1/market/favorites`、`/api/v1/market/ratings`、`/api/v1/reports`

## Error/Empty States
- 列表无结果：提示 + 重置筛选
- 详情 404：空态 + 返回列表
- 评论为空：引导首评
- 精选为空：隐藏区块

## Performance Notes
- 列表区使用 `content-visibility` 优化长列表
- 仅传递 UI 需要字段
- 视图切换与筛选使用轻量本地状态

## Testing
- 前端基础渲染与交互验证
- Chrome MCP 用于 UI 联调与空态验证
