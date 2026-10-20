# 项目状态快照（PROJECT_STATE）

更新：2026-10-20｜P0 已体验验收并整合 当前恢复 S0-03｜非实时数据

本文件是会话恢复入口，任务状态以实时 GitHub Issue / PR / Projects 为准。历史逐轮快照已保存在 Git 提交记录；当前统一入口为 [P0 整合与验收报告](docs/P0_ACCEPTANCE.md)。

## 当前阶段与唯一主任务

- S0 未完成；S1 原型及设计未整体验收；S2 未通过。P0 是本轮收束工作名，不是新增路线图阶段。
- 唯一主任务为 [#4 Codex 与 Gemini CLI 协作验证](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/4)；[#10](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10) 已经用户体验验收并按 completed 关闭。
- [#12 设计定调](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/12) 为设计记录与后续余项，仍 Open，不替代 #4。

## 本轮实际核对

- PR #13–#20 已按依赖顺序合并 验证基线 main 为 a6f609920a29d63c12ac5cfa8c5eb2991e19f357 详见 [实际整合记录](docs/P0_INTEGRATION_COMPLETED.md)
- #10 已关闭 并出现项目机器人状态变更事件 尚未读取最终看板列值
- #4 独立审查与 #5 CI 未完成 不声明 CI 通过
- 官方 Gemini CLI 0.64.0 已安装 浏览器 OAuth 授权成功 但服务端返回 UNSUPPORTED_CLIENT 当前个人账号层级不能使用此客户端 尚无真实审查输出

## 当前能力与证据

- 已实现且实测：本地离线窗口、四页导航、中文/英文、系统双主题、基础键盘焦点、B 轻量首页、当前渲染隔离与原生窗口控制。
- 最新视觉：浅色 #F8F5EF / #0C3967，深色 #1C1D20 / #225487；面型为主、实色选中、轻边框、常规三卡一致、短文案无标点、横向左重右轻、圆角直角提示无箭杆。
- [偏好与方法](docs/DESIGN_PREFERENCES.md) 为长期设计记忆，界面修改前必须按 AGENTS 读取；[基础规范](docs/DESIGN_FOUNDATIONS.md) 与运行 Token 是实际来源。旧青绿/钴蓝静态稿为历史，不能覆盖当前方案。
- [PR #13 原文](docs/HANDOFF_S1_LOBEHUB_FIGMA.md) 与 [PR #17 的 13 项决策原文](docs/HANDOFF_WORKSTATION_DECISIONS_2026-10-20.md) 已完整纳入 main；原 PR 已合并。13 项是未来产品约束，跨插件自动协作未定案，不代表功能实现。
- P0 重新运行 npm test：类型检查、生产构建、四项测试、96 个实际窗口案例通过；6 个状态样式探针不代表业务流程。
- 新 Windows x64 候选：仓库上两级 outputs/p0-main-verified-20261020/ModularWorkstation-win32-x64/ModularWorkstation.exe。包内生产内容一致，离线中英文双主题四页、最小化/最大化/恢复/关闭退出已实测；完整目录保留，旧包未覆盖。
- [运行/打包与回滚记录](docs/SHELL_THEME_IMPLEMENTATION.md)、[P0 报告](docs/P0_ACCEPTANCE.md) 提供实际截图、命令和 JSON 证据。本轮无生产代码或依赖变更，主要归并文档并扩充验证。

## 未完成与限制

- 无真实工作空间、布局持久化、标签分屏、文件业务、搜索、插件 SDK/安装、资源授权、任务中心、托盘、会话/草稿恢复、AI 或工作流。
- 文件素材/插件/恢复等高保真稿属于静态设计；普通/加载/警告/失败样式不能冒充业务能力。
- Gemini 独立审查、CI、Electron/Tauri 对照、系统高对比/读屏、多屏 DPI、Windows 10、性能、签名/安装升级及正式发布仍待执行。
- 本轮已合并设计链并关闭 #10 未发布 Release 未人工设置看板列；快照没有自动实时同步。

## 唯一下一步

先解决 #4 的官方客户端资格阻塞并取得真实独立审查。不得把浏览器授权成功等同于 CLI 可用或审查完成 不擅自开通付费 API。其后依次推进 #5、#12/S1 余项 不同时开启多个主任务。

## 恢复阅读顺序

[AGENTS](AGENTS.md) → 本快照与实时 GitHub → [PRODUCT](docs/PRODUCT.md) / [ROADMAP](docs/ROADMAP.md) / [DECISIONS](docs/DECISIONS.md) / [QUALITY_GATES](docs/QUALITY_GATES.md) → [P0 报告](docs/P0_ACCEPTANCE.md) → 当前任务源码与证据。PR 未合并时必须读取实施分支。
