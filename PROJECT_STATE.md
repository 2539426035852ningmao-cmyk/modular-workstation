# 项目状态快照（PROJECT_STATE）

更新：2026-10-20｜当前为 P0 桌面 Shell 收束与验收准备｜非实时数据

本文件是会话恢复入口，任务状态以实时 GitHub Issue / PR / Projects 为准。历史逐轮快照已保存在 Git 提交记录；当前统一入口为 [P0 整合与验收报告](docs/P0_ACCEPTANCE.md)。

## 当前阶段与唯一主任务

- S0 未完成；S1 原型及设计未整体验收；S2 未通过。P0 是本轮收束工作名，不是新增路线图阶段。
- 唯一主任务为 [#10 桌面 Shell 原型](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10)，技术清单已勾选，Issue 仍 Open，等待产品体验验收与正式合并审批。
- [#12 设计定调](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/12) 为设计记录与后续余项，仍 Open，不替代 #10。

## 本轮实时核对

- main 为 1236f6160485a78ec933ae3922c2dac2ea080bda，包含已合并 PR #11 的 Electron/React/TypeScript 原型；框架仍为候选。
- PR #13–#20 均 Open、未合并。当前实施分支 feat/s1-approved-theme-shell，对应 [PR #20](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/20)，base 为 PR #19 分支。
- 依赖链 #14 → #15 → #16 → #18 → #19 → #20；#13/#17 为独立交接。建议 #13 → 全链 → #17，最后有 DECISIONS 单文件冲突，已准备保留全部决策的建议结果；预检未移动 main 或真实合并。
- [#4 Gemini 审查](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/4) / [#5 CI](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/5) 仍 Open、未完成。GitHub Actions 运行及当前已查 head 检查均为 0，不能声明 CI 通过。
- Projects 页面标题为 Page not found，进一步浏览器连接超时；本轮未读出实时列值/工作流开关，未修改看板。历史自动化实测见 [OPERATIONS](docs/OPERATIONS.md)，不据此推定本轮状态。

## 当前能力与证据

- 已实现且实测：本地离线窗口、四页导航、中文/英文、系统双主题、基础键盘焦点、B 轻量首页、当前渲染隔离与原生窗口控制。
- 最新视觉：浅色 #F8F5EF / #0C3967，深色 #1C1D20 / #225487；面型为主、实色选中、轻边框、常规三卡一致、短文案无标点、横向左重右轻、圆角直角提示无箭杆。
- [偏好与方法](docs/DESIGN_PREFERENCES.md) 为长期设计记忆，界面修改前必须按 AGENTS 读取；[基础规范](docs/DESIGN_FOUNDATIONS.md) 与运行 Token 是实际来源。旧青绿/钴蓝静态稿为历史，不能覆盖当前方案。
- [PR #13 原文](docs/HANDOFF_S1_LOBEHUB_FIGMA.md) 与 [PR #17 的 13 项决策原文](docs/HANDOFF_WORKSTATION_DECISIONS_2026-10-20.md) 已完整纳入当前整合候选；原 PR 审批仍保留。13 项是未来产品约束，跨插件自动协作未定案，不代表功能实现。
- P0 重新运行 npm test：类型检查、生产构建、四项测试、96 个实际窗口案例通过；6 个状态样式探针不代表业务流程。
- 新 Windows x64 候选：仓库上两级 outputs/p0-shell-candidate-20261020/ModularWorkstation-win32-x64/ModularWorkstation.exe。包内生产内容一致，离线中英文双主题四页、最小化/最大化/恢复/关闭退出已实测；完整目录保留，旧包未覆盖。
- [运行/打包与回滚记录](docs/SHELL_THEME_IMPLEMENTATION.md)、[P0 报告](docs/P0_ACCEPTANCE.md) 提供实际截图、命令和 JSON 证据。本轮无生产代码或依赖变更，主要归并文档并扩充验证。

## 未完成与限制

- 无真实工作空间、布局持久化、标签分屏、文件业务、搜索、插件 SDK/安装、资源授权、任务中心、托盘、会话/草稿恢复、AI 或工作流。
- 文件素材/插件/恢复等高保真稿属于静态设计；普通/加载/警告/失败样式不能冒充业务能力。
- Gemini 独立审查、CI、Electron/Tauri 对照、系统高对比/读屏、多屏 DPI、Windows 10、性能、签名/安装升级及正式发布仍待执行。
- 本轮未合并 PR、关闭 Issue、将看板设为 Done 或发布 Release；快照没有自动实时同步。

## 唯一下一步

请产品负责人体验 P0 候选并审批整合方案。认可后依序合并、解决已记录的决策日志冲突，复验最终 main，再依据验收记录关闭 #10 并核对看板。随后建议依次恢复 #4、#5、#12/S1 余项，不同时开启多项主任务，不因 P0 宣布 S0/S1/S2 完成。

## 恢复阅读顺序

[AGENTS](AGENTS.md) → 本快照与实时 GitHub → [PRODUCT](docs/PRODUCT.md) / [ROADMAP](docs/ROADMAP.md) / [DECISIONS](docs/DECISIONS.md) / [QUALITY_GATES](docs/QUALITY_GATES.md) → [P0 报告](docs/P0_ACCEPTANCE.md) → 当前任务源码与证据。PR 未合并时必须读取实施分支。
