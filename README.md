# modular-workstation（模块化个人工作站）

> **状态：S0 项目治理阶段，尚无可运行应用。**  
> 免费开源、Windows 优先、本地优先、可扩展的个人工作站。项目名 `modular-workstation` 为开发代号，最终品牌尚待设计。

## 愿景
让普通用户轻松使用，让专业用户组合工作空间，让开发者与 AI 能按照统一插件规范快速扩展功能。工作站重点覆盖项目/素材管理、工具插件、统一 AI 模型接口与未来的自动化协作；所有默认核心能力须可离线使用。

## 从哪里开始？
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
先完成 S0 项目管理基线，再进行 S1 信息架构与 UI 设计系统；桌面框架与插件权限需通过技术原型，才能确认正式技术栈。阶段完成不以文档数量为依据，而以实测、审查和验收为依据。

## 开源许可
[Apache License 2.0](LICENSE)。正式发布前仍需审查第三方依赖与插件生态的许可兼容性。
