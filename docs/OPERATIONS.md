# 项目日常运营与进度维护（OPERATIONS）
版本：2026-10-19｜适用：项目所有者、ChatGPT、Codex、Gemini

## 开始一次工作会话
1. 读取 [../README.md](../README.md)、[../PROJECT_STATE.md](../PROJECT_STATE.md)、[ROADMAP.md](ROADMAP.md)、[PRODUCT.md](PRODUCT.md)。
2. 点击快照中的唯一主 Issue，查其**实时状态、最近 PR 和关联依赖**。
3. 核对 [Projects 看板](https://github.com/users/2539426035852ningmao-cmyk/projects/2)。若 Issue 与快照不一致，以 GitHub 实际记录为准，先开修正任务或说明偏差。
4. 每次汇报固定显示：阶段 / 当前 Issue / 已完成证据 / 未解决阻塞 / 唯一下一步。

## 处理一个新需求
- 记录 Issue 及验收条件，评估阶段和依赖关系。
- 不擅自中断当前主任务；数据损坏、安全漏洞、构建阻塞等紧急情况可以插队，但须标注原因和恢复点。
- 产品边界或关键架构变化先补 [DECISIONS.md](DECISIONS.md) 并请求产品所有者审批。

## 正常任务交付
1. 指派一个主责任人，阅读 [AGENTS.md](../AGENTS.md)。
2. 以独立分支和 PR 实施任务，注明关联 Issue、测试证据与风险。
3. 对相关设计、代码、安全变化执行审查；必要时由 Gemini 独立复核。
4. 合并并不等于完成：核实合并、CI（若已搭建）以及用户确认的产品验收。
5. 更新 Issue 的清单及进度，推动 Projects 状态；仅在真实满足完成标准时关闭 Issue。
6. **完成或切换唯一主任务时**更新 PROJECT_STATE.md 与 ROADMAP.md 的当前指向，保证同一时间只有一个主任务。

## GitHub 自动化现状与后续
- 已验证：仓库文件写入、Issue/PR 创建与合并；尚未实现自动同步 PROJECT_STATE.md。
- GitHub Projects 条目字段编辑：目前连接的 GitHub 操作尚未提供已验证的写入功能，需要验证 Projects 原生工作流或由用户在网页内操作。
- 有条件再部署 GitHub Actions 的任务归档/链接检查，避免在尚无 CI 时声称“全部自动化”。
- 对 GitHub Projects 的任务统计应来自实时卡片，不应拿 Markdown 快照当成实时计数。

## 断点恢复测试（Issue #3）
- 使用只读的仓库和 GitHub 查询，**不引用历史聊天**，正确报告当前阶段、唯一主任务、阻塞、下一步。
- 再人为模拟一条任务从待办到 PR/合并/关闭，检查项目状态是否同步；若不支持自动化，明确手动操作点。
- 保留测试记录、链接与未通过项。

## 安全与审批
- 禁止共享 Google 登录 Cookie、API Key、GitHub token；第三方插件运行与云端 CI 须独立权限检查。
- 非破坏性文档维护可由获授权代理执行；架构变更、广泛权限、重要分支设置、公开发布等需用户明确批准。
- 无工具执行能力时明确说明，不能以计划代替已完成结果。
