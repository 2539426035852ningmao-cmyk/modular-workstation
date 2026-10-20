# P0 桌面工作站整合与验收报告

核对日期：2026-10-20。唯一主任务仍为 [#10](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10)，本轮是 Shell 收束，不是新增开发阶段。P0 技术核验已执行，产品验收与正式合并待审批。

## 1 当前状态与推荐候选

- GitHub main 为 `1236f6160485a78ec933ae3922c2dac2ea080bda`，已包含 PR #11 的可运行原型。
- PR #13–#20 均 Open、未合并；#10/#12/#4/#5 均 Open。设计链与 main 无新远端变化，PR #20 在本轮继续补充文档和验证脚本。
- 推荐体验本轮 `outputs/p0-shell-candidate-20261020/ModularWorkstation-win32-x64/ModularWorkstation.exe`，路径相对于本项目工作目录（仓库上两级）。整个目录一起保留，双击 EXE 即可，无需安装开发工具或登录。
- 候选生产代码与 `289095c` 的视觉修订一致，后续为文档/核验脚本更新；包内主进程、dist 与当前工作副本逐字节核对，身份和 SHA256 见 [便携报告](design/previews/runtime/package-validation.json)。软件版本仍为 `0.1.0-prototype`，用候选目录和 SHA256 区分，不冒充正式 Release。
- Projects 浏览器页面标题为 Page not found，进一步连接超时；本轮未读出实时列值或工作流开关，未修改看板。不能用历史快照代替当前列状态。Issue/PR 状态由 GitHub API 实查。

## 2 PR 收束与安全顺序

链接格式为仓库 Pull Request；每项都仍需所有者正式合并审批。

| PR | 真实差异与依赖 | 审计建议 |
| --- | --- | --- |
| [#13](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/13) | 1 个原始视觉交接文档，base main | 技术可合并，需审批；原文按历史时点理解 |
| [#14](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/14) | D1 文档，base main | 可作为提案归档合并，需审批；不代表全部候选参数获批 |
| [#15](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/15) | 首页设计、颜色小样与静态检查，依赖 #14 | 可归档，需审批；旧钴蓝方案已被替代 |
| [#16](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/16) | 文件素材静态稿与导出脚本，依赖 #15 | 可归档，需审批；不包含文件业务 |
| [#17](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/17) | 13 项产品决策及 DECISIONS 索引，base main | 单独可合并；与整条设计链有决策日志冲突，须用本轮统一版本处理后审批 |
| [#18](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/18) | 插件中心静态稿与检查，依赖 #16 | 可归档，需审批；不包含插件运行时 |
| [#19](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/19) | 深浅/状态静态稿、设计偏好、文档与导出工具，依赖 #18 | 可归档，需审批；旧稿不是运行规范，无应用代码变化 |
| [#20](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/20) | 实际 src/Electron、运行测试、打包核验与最新规范，依赖 #19 | 技术候选已验证，待审查与用户体验验收及合并审批 |

建议顺序：**#13 → #14 → #15 → #16 → #18 → #19 → #20 → #17**。先完整归档设计链，再处理独立决策索引。采用保留祖先关系的 merge commit；不要在链中随意 squash/rebase。前置项获批合并后，核对再将下一 PR base 改为 main；本轮未改任何 base 或分支历史。

当前每个 PR 的 GitHub mergeable 均为 true，仅代表相对它自己的目标分支，不代表所有 PR 组合无冲突。已用 Git 对象模拟上述整条顺序：前七步干净，最后 #17 在 `docs/DECISIONS.md` 冲突；仅模拟用当前统一版本替换该文件后继续，原始交接文件逐字节一致。没有移动 main、创建真实合并提交到分支或关闭 PR。

证据：[合并预检 JSON](p0/integration-preflight.json)。复现：先 fetch，执行 `node scripts/audit-pr-integration.cjs`。脚本仅创建临时 Git 对象与报告，不移动 refs；任何新增冲突会报错。批准实际合并时仍需重新运行预检，不能复用过时结论。

冲突解决准备：PR #20 中的 DECISIONS 是建议完整结果，保留 ADR-001–010、将重复的映射条目改为 ADR-011，并完整包含 #17 的决策索引。不能选整文件 ours/theirs 丢弃另一侧成果。回滚本轮补充提交即可恢复原文；各原分支和旧候选保持。

## 3 规范归并结果

有效性顺序：最新用户明确反馈 → [偏好与方法](DESIGN_PREFERENCES.md) → [实际基础规范](DESIGN_FOUNDATIONS.md) 与运行 Token。旧 D1/D2/交接稿保留原始用途和证据，不覆盖新方向。

| 内容 | 当前效力 |
| --- | --- |
| B 轻量模块首页、LobeHub 氛围与 Figma 专业结构 | 方向确认，继续保留 |
| 初始青绿 | 配色已替代，ADR-008 仅保留 B 布局及历史 |
| 钴蓝 #2563EB 与早期浅色候选 | 已被最新主题替代，ADR-010 标为 Superseded |
| 浅色 #F8F5EF / #0C3967，深色 #1C1D20 / #225487 | 当前有效运行基线，ADR-011；不等于全产品最终验收 |
| 面型为主、实色选中、轻边框、常规卡一致、短文案、左重右轻、圆角直角提示 | 当前偏好与检查依据 |
| Morphicons、组件库切换、分屏具体参数、Electron/Tauri、自动协作方案 | 候选或未决，不升级为批准 |

PR #13/#17 两份原文已逐字节纳入本轮整合候选，便于离线恢复，并保留原 PR 身份、提交和审批。13 项 D01–D13 涵盖 Shell 边界、受约束分屏、布局、正常/异常恢复、未保存保护、故障隔离、资源监控、任务中心、后台退出、中断恢复、资源交换、授权生命周期；全文作为未来约束，当前全部不能宣称实现。对应差距继续见 [兼容性分析](DESIGN_SYNC_2026-10-20.md)。

## 4 代码审查与实际能力

已人工逐项审阅 electron/main.cjs、src/main.tsx、App、i18n、Icons、styles、tokens、index.html、package scripts 和现有测试。本轮未发现需要改动生产代码的阻断问题；这是 Codex 自审，不冒充 Gemini 独立审查。

| 检查面 | 结果与边界 |
| --- | --- |
| Electron 安全 | nodeIntegration=false、contextIsolation/sandbox/webSecurity=true；无 preload/IPC 权限桥；拒绝新窗口和页面导航；CSP 禁远程连接。仅适用于当前本地 Shell，不证明插件沙盒安全 |
| 页面和导航 | useState 管理四页；四个原生按钮有 aria-current，首页三个模块和主按钮真实导航。当前规模无需引入路由或拆出平行组件体系 |
| 主题和样式 | 单一 tokens.css 双主题，公共控件复用；仅主进程启动底色必须与 Token 同步维护。未来 data-selected 仅样式，无真实选择状态 |
| i18n 和可访问性 | 中文/英文短语；启动同步 html lang；装饰 SVG 隐藏读屏输出，跳转主内容与可见焦点存在。读屏人工审查尚未完成 |
| 尺寸和缩放 | 已验证现有 96 案例，窄窗口折叠上下文侧栏；这是响应式隐藏，不是可保存面板布局；Electron zoom 不等同真实多屏 DPI |
| 可用与占位 | 搜索是明确未开放的非输入表面；创建/安装按钮 disabled；设置只读跟随系统，不暗示偏好已保存 |
| 维护性与回归 | 无新增运行依赖；未发现重复运行组件或需要重构的死逻辑。若干未使用 i18n/Token 保留项不影响运行，暂不为清理扩大差异；共享视觉回归由现有测试覆盖 |

**已实现且实测**：本地启动、四页导航、B 首页、系统双主题、中英文、键盘基础操作、离线运行、当前渲染隔离与 Windows 原生窗口控制。

**已实现待最终验收**：本轮四页视觉、字号与层次、实际使用感受；等待用户体验确认与正式审查。

**仅静态设计**：文件素材网格/树/属性、插件来源权限界面、加载/失败/恢复情境；样式探针也不代表业务流程。

**尚未开发**：真实工作空间、布局持久化、标签分屏、文件管理/搜索、安装与插件 SDK、资源权限、任务中心、托盘后台、会话/草稿恢复、AI 服务、工作流。

## 5 本轮真实验证

在 Windows 本机执行，未用静态设计测试替代软件检查：

| 命令或核验 | 本轮结果 |
| --- | --- |
| `npm test` | tsc 类型检查、Vite 正式构建、4 项真实 Electron 测试全部通过 |
| 主题运行报告 | 2 语言 × 2 主题 × 4 页 × 6 尺寸/缩放 = 96 案例；无被检查的溢出/裁切；最低文字对比 4.5769:1；远程请求/渲染错误 0 |
| 状态样式探针 | 6 个，仅验证 loading/warning/error 共用样式 |
| `npx --no-install electron-packager . ModularWorkstation --platform=win32 --arch=x64 --out=../../outputs/p0-shell-candidate-20261020 --prune=true --ignore=^/\.git --ignore=^/tests --ignore=^/docs` | 新目录打包完成，旧候选未覆盖 |
| `node scripts/verify-package.cjs ../../outputs/p0-shell-candidate-20261020/ModularWorkstation-win32-x64` | EXE 实际启动；构建身份一致；离线双语言双主题四页导航共 16 次；原生最小化/恢复/最大化/还原、关闭退出通过；隔离设置通过；远程请求/渲染错误 0 |
| `node scripts/audit-pr-integration.cjs` | 依赖组合预检完成；#17 单文件冲突及建议解决结果记录 |
| 文档检查 | 11 个 ADR 编号唯一、两份交接原文保留、200 个本地链接通过；自有改动的 diff 空白检查通过。原始交接文件继承 6 处 Markdown 双空格换行，完整 diff --check 会报 trailing whitespace；为保留原文未改动，检查排除这两份原文并明确记录 |

证据：[运行报告](design/previews/runtime/validation.json)、[实际截图](SHELL_THEME_IMPLEMENTATION.md#真实运行截图)、[包报告](design/previews/runtime/package-validation.json)、[预检报告](p0/integration-preflight.json)。完整目录启动说明见 [PROTOTYPE](PROTOTYPE.md)。

剩余限制：无 Gemini 独立审查；GitHub Actions 运行数及当前 head check-runs 均为 0，无 CI 通过证据；系统高对比、读屏、多屏 DPI、Windows 10、正式安装/升级/签名与性能基准未完成。测试工具出现 Node DEP0190 警告，测试成功退出；未因此擅自升级工具链。未发布 Release，候选无签名，不称稳定版。

## 6 产品负责人最少验收项目

1. 双击完整候选目录里的 EXE，确认无需登录可打开；最小化、最大化、还原、关闭正常。
2. 切换首页/工作区/插件/设置；点击三张首页卡片和查看工作区，内容与导航一致；创建/安装明确不可用。
3. 查看首页卡片一致、图标深蓝底白图形、轻边框、短文案、左重右轻、无尾部箭杆；切换 Windows 深浅主题后仍认可。
4. 用 Tab/Enter 导航，缩窄窗口和放大显示，确认常用入口及文字可用。

语言与离线已自动实测，不要求用户安装工具或手动改分支。认可本候选后，分别确认：#10 产品体验验收，以及上述 PR 整合/冲突解决方案的正式合并授权。两者不是同一个结论。

## 7 唯一下一步与阶段边界

当前唯一下一步是**验收本 P0 候选并审批整合方案**。未获审批不合并、不关闭 #10、不把看板设为 Done（可能触发自动关闭）。

获批后按已复核顺序整合，重跑最终 main 的构建/运行与包核验；确认用户验收记录和证据完整后再关闭 #10、核对看板。随后建议恢复 #4 为唯一任务，完成真实 Gemini 独立审查；再推进 #5 最小 CI/PR 质量流程；S1 余项继续 #12 的完整状态流、可访问性及 Electron/Tauri 对照。它们均未因 P0 自动完成，S0/S1/S2 不宣布通过。

回滚：本轮无生产代码变动，可撤销本轮文档/验证脚本提交；原 main、PR 分支、静态证据和旧便携目录均保留。真实合并一律等待明确审批，届时逐项保留可追踪记录。
