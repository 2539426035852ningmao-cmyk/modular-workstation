# modular-workstation（模块化个人工作站）

> **状态：S0 治理仍有待办；已增加可运行的 S1 桌面 Shell 技术原型，尚非正式产品版本。**
> 免费开源、Windows 优先、本地优先、可扩展的个人工作站。项目名 `modular-workstation` 为开发代号，最终品牌尚待设计。

## 愿景
让普通用户轻松使用，让专业用户组合工作空间，让开发者与 AI 能按照统一插件规范快速扩展功能。工作站重点覆盖项目/素材管理、工具插件、统一 AI 模型接口与未来的自动化协作；所有默认核心能力须可离线使用。

## 从哪里开始？
- **[P0 整合与验收报告](docs/P0_ACCEPTANCE.md)** — 历史预检与验收证据；[最新实际整合记录](docs/P0_INTEGRATION_COMPLETED.md)包含已合并 PR、#10 关闭和 #4 阻塞。
- **[已确认主题的实际 Shell 实施](docs/SHELL_THEME_IMPLEMENTATION.md)** — 四页深浅主题、面型图标和实体层次的运行截图、验证与便携候选；业务仍按计划实施。
- **[运行桌面原型](docs/PROTOTYPE.md)** — Windows 上安装、启动、验证与已知限制。
- **[桌面界面基础规范](docs/DESIGN_FOUNDATIONS.md)** — 首版 Shell 实际使用的主题、字体、间距、状态与缩放规则。
- **[钴蓝深浅设计审阅](docs/DESIGN_REVIEW_D2_LIGHT.md)** — 三类页面候选稿与深浅对照入口；历史候选稿；最新实际 Shell 见上方实施记录，业务操作尚未实现。
- **[页面状态与恢复审阅](docs/DESIGN_REVIEW_D2_STATES.md)** — 14 个情境的深浅状态稿及统一图标候选；审阅切换可操作，业务功能未实现。
- **[实色选中与面型图标修订](docs/DESIGN_REVIEW_D2_SOLID.md)** — 根据用户反馈增强选择状态，主稿与状态稿保持一致。
- **[当前项目进度快照](PROJECT_STATE.md)** — 当前阶段、主任务、阻塞与下一步；以 GitHub 看板实际状态为准。
- **[可视化开发看板](https://github.com/users/2539426035852ningmao-cmyk/projects/2)** — 实时任务和优先级。
- **[首条开发任务 S0-01](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/1)** — 建立长期治理与总控。
- **[产品需求基线](docs/PRODUCT.md)** — 已确认需求、首批场景及非目标。
- **[S0–S6 开发路线图](docs/ROADMAP.md)** — 阶段交付与进入下一阶段的标准。
- **[设计与架构决策](docs/DECISIONS.md)** — 重大选择的理由与风险。
- **[质量关卡与任务验收](docs/QUALITY_GATES.md)** — 什么情况下算真正完成。

## AI 开发者入口
- [AGENTS.md](AGENTS.md)：所有 AI 编程工具与开发贡献者首先读取的共同约束。
- [GEMINI.md](GEMINI.md)：Gemini CLI 的独立审查入口。
- 日常开发由 Codex 为主、Gemini 独立审查、ChatGPT 组织产品与任务协作；**产品所有者负责最终决策与验收**。

## 当前优先级
桌面窗口与基础导航已获用户体验验收并整合，见 [Issue #10](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10)。首页初始视觉基线已选择“B：轻量模块”。这是 Electron 候选技术原型；当前唯一主任务是 #4 Gemini 独立审查，CI 排队，S1 的完整设计验收及 Electron/Tauri 对照仍待执行。阶段完成不以文档数量为依据，而以实测、审查和验收为依据。

## 开源许可
[Apache License 2.0](LICENSE)。正式发布前仍需审查第三方依赖与插件生态的许可兼容性。
