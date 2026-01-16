# Skill Chatbot PRD（MVP）

## 1. 目标与用户

**产品目标**
- 将 Skill 技术与传统 chatbot 结合，扩展大模型对话能力边界。
- 构建 Skill 市场与社区生态，支持发现、收藏、复用与迭代。
- MVP 以“流程跑通”为唯一成功标准，不以量化指标为先。

**核心用户**
- AI 爱好者/重度使用者。

**痛点与机会**
- 重复对话与提示词难以积累、复用。
- 个人偏好与常用流程难以长期沉淀。

**核心价值闭环**
- 对话中识别可复用流程 → 轻提示 → 一键使用 → 自动注入 Skill → 气泡显示 Skill tag → 下次复用更高效。

> 备注：对模型侧会话会注入完整 SKILL.md 原文；前端仅展示 tag，不展示原文内容。

## 2. MVP 范围与边界

**包含**
- 聊天与技能调用
- 技能市场（仅官方预置）
- 个人技能库（收藏、标签）
- 技能版本树（文本 diff）
- 长期记忆/偏好（可编辑、云端同步）
- 评论、举报、通知（站内）
- 技能导入/导出（仅 SKILL.md）
- 技能编辑（直接编辑 + AI 协助编辑）

**不包含**
- 用户发布技能（后置）
- 个性化推荐/统计报表（后置）
- 结构化字段级 diff（后置）
- 外部工具/插件执行类 Skill（后置）

## 3. Skill 标准结构（官方格式）

**文件结构**
- 单文件 `SKILL.md`。

**Frontmatter（YAML）**
- 必填：`name`, `description`
- 其他信息写入 `metadata`：`tags`, `visibility`, `version`, `variables`

**正文（Markdown）**
- `## Instructions`
- `## Examples`

**约束**
- name 必须小写 + 数字 + 连字符
- description 必须包含“做什么 + 何时用”

## 4. 核心用户流程（MVP）

**技能使用**
- 工具栏“技能”按钮打开选择弹框。
- 输入框内输入 `$` 触发快捷选择，支持上下键与回车确认。
- 选择后：对模型侧注入完整 SKILL.md 原文；气泡仅显示 Skill tag。

**自动匹配与提示**
- 使用语义向量检索进行匹配。
- 轻提示（不打断）。
- 同一会话对同一 Skill 拒绝后不再提示。

**技能创建（MVP）**
- 当识别重复对话，提示创建 Skill。
- 系统生成内部“Skill 创建 Markdown 模板”，传递给 AI。
- AI 返回完整 `SKILL.md`。
- 创建完成进入个人技能库。

**技能编辑（MVP）**
- 支持直接编辑 `SKILL.md`。
- 支持 AI 协助编辑：传递当前 SKILL.md + 用户意见 + 规范，生成草稿。
- 用户预览确认后保存为新版本。
- 编辑官方技能：先复制到个人库，再编辑。

## 5. 技能市场与个人技能库

**市场（官方预置）**
- 列表/详情/搜索/筛选。
- 搜索覆盖：name/description/tags/instructions/examples。
- 搜索模式：关键词 + 语义结合。
- 筛选维度：标签、热门/评分、最近更新。
- 互动：收藏、评分、评论、回复、点赞。
- 举报：详情页 + 评论区入口；去重用户举报 ≥ 3 触发下架。

**个人技能库**
- 收藏列表 + 标签管理。
- 导入/导出：仅 `SKILL.md`。
- 版本树：保留旧版本并新增新版本；展示版本号/时间/作者；文本 diff。
- 变更说明：不强制填写。

## 6. 长期记忆与账号

**长期记忆**
- 内容：语气/风格偏好、常用技能偏好、个人背景。
- 生成：自动生成 + 设置页可编辑。
- 同步：登录后云端同步。

**账号**
- 邮箱/密码登录（必需）。

## 7. 数据模型（MVP）

- User
- MemoryProfile
- Skill
- SkillVersion（保留完整 SKILL.md 原文）
- SkillMarketEntry
- SkillFavorite
- SkillTag
- Comment / Reply / Like
- Report
- Notification
- ChatSession / ChatMessage
- SkillSuggestionEvent

## 8. API 合约范围（MVP）

**认证与用户**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /me
- PATCH /me
- GET /me/memory
- PATCH /me/memory

**技能与版本**
- POST /skills
- GET /skills/:id
- GET /skills/:id/versions
- GET /skills/:id/versions/:vid
- POST /skills/:id/versions
- POST /skills/:id/import
- GET /skills/:id/export

**技能市场**
- GET /market/skills
- GET /market/skills/:id
- POST /market/skills/:id/favorite
- POST /market/skills/:id/rating
- GET /market/skills/:id/comments
- POST /market/skills/:id/comments

**评论与举报**
- POST /comments/:id/replies
- POST /comments/:id/like
- POST /reports

**聊天与事件**
- POST /chat/sessions
- GET /chat/sessions
- GET /chat/sessions/:id
- POST /chat/sessions/:id/messages
- POST /skill-suggestions

**搜索**
- GET /search/skills

## 9. 非功能性要求

- 技能内容不做压缩或删减；模型侧必须完整注入。
- 搜索需支持关键词 + 向量混合检索。
- 会话内拒绝提示抑制（仅对该技能）。
- 账号密码需加盐哈希存储。
- 举报阈值按去重用户计数（默认 3）。

## 10. 里程碑（建议）

- M1：账号体系 + 聊天基础流
- M2：技能市场（列表/详情/搜索/筛选）
- M3：个人技能库（收藏、标签）+ 导入/导出
- M4：自动匹配与提示 + 事件记录
- M5：版本树 + 文本 diff
- M6：评论/举报/通知中心
- M7：长期记忆与设置
- M8：Skill 编辑（直接编辑 + AI 协助编辑）

## 11. 风险与开放问题

**风险**
- 上下文成本增加导致响应延迟。
- 语义匹配误判造成打扰。
- 版本树/差异比对的复杂度。
- 内容安全与举报处理成本。
- AI 编辑结果偏离规范。

**开放问题**
- AI 编辑的校验标准与回退策略。
- 向量检索模型与成本方案。
- 官方技能初始内容规模与主题覆盖。
