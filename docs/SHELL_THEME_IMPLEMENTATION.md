# 已确认深浅主题 · 四页 Shell 实施记录

日期：2026-10-20。主任务 [#10](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/10)，设计依据 [#12](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/12)。用户在侧边讨论最终确认深色方案，并明确要求统一更新现有工作站。本轮为该新增授权的可逆视觉实施，不关闭任务、不宣布阶段通过。

交付：[实施 PR #20](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/20)，首个实施提交 `016a333`。PR 已创建待审，尚未合并。

## 分支与依赖

实施分支 `feat/s1-approved-theme-shell`，基于 `docs/s1-d2-light-comparison`（PR #19，归档提交 `268c1d1`）。使用独立 PR，以 #19 分支为 base，避免把整条设计 PR 链混入实施差异；先处理设计前置 PR，再按既有流程审查本 PR。不直接合并或推送 main。

## 设计依据与实际映射

- [浅色原样稿](design/workstation-ivory-home-tactile.html)：背景 `#F8F5EF` / 深蓝 `#0C3967`。
- [深色原样稿](design/workstation-dark-charcoal-deeper.html)：中性炭灰 `#1C1D20` / 统一深蓝 `#225487`。`#2866A5` 已被否定，不可恢复。
- 两份 HTML/PNG 均保留原样作为已确认方向证据，不将其演示文件、任务、账号或数量迁入应用。
- 共用 Token 和组件样式覆盖首页、工作区/文件素材入口、插件与设置的导航、上下文侧栏、顶栏、卡片、空态、禁用操作；全宽状态栏随后按截图反馈移除。
- 图标采用自绘面型 SVG 与镂空结构；搜索表面轻微内凹，选中入口/主按钮/强调卡片轻微凸起，普通面板更淡。边框继续保持轻且不影响文字清晰度。

当前只有四页 Shell 与导航。文件素材入口指向工作区的真实空态，没有新增文件浏览器、标签页、安装流程、权限系统或任务中心。设置只展示“跟随系统”的真实情况；不引入偏好保存。首页“查看工作区”和模块卡片能切换页面，新建/安装禁用并说明原因。

## 真实运行截图

截图来自构建后的 Electron 窗口；文件名尺寸为 CSS viewport，PNG 像素尺寸随本机显示缩放变化。

| 页面 | 深色 | 浅色 |
| --- | --- | --- |
| 首页 | [运行图](design/previews/runtime/dark-home-1440.png) | [运行图](design/previews/runtime/light-home-1440.png) |
| 工作区 | [运行图](design/previews/runtime/dark-workspace-1440.png) | [运行图](design/previews/runtime/light-workspace-1440.png) |
| 插件 | [运行图](design/previews/runtime/dark-plugins-1440.png) | [运行图](design/previews/runtime/light-plugins-1440.png) |
| 设置 | [运行图](design/previews/runtime/dark-settings-1440.png) | [运行图](design/previews/runtime/light-settings-1440.png) |

[深色 200% 窄窗口](design/previews/runtime/dark-home-400.png) / [浅色 200% 窄窗口](design/previews/runtime/light-home-400.png)。

## 最新截图修订：精简外框与常规卡片

- 删除默认 File/Edit/View/Window 菜单，移除重复品牌/技术原型横栏和全宽底部状态栏；保留原生系统标题栏，不新增无边框窗口风险。
- 首页三张卡片不预选，常规浅色统一白卡、深色统一中性深色卡；左上图标块统一为对应主题深蓝底与纯白图形。
- 点击仍导航，未来深蓝选择卡面仅保留样式，不声称当前已有卡片选择功能。
- 新增 `tests/home-feedback.test.cjs`，旧版真实失败（菜单仍存在），修订后通过；检查菜单移除且 Alt 不唤回、冗余栏不存在、三卡未选中与图标配色、未来选中样式探针、跳转回首页后无残留选中。
- `npm test` 三项测试均通过，96 个运行窗口案例和全部深浅截图重新执行/导出。新便携包的菜单/卡片及原有构建身份、隔离、四页导航与关闭退出均已核对。

## 已执行验证

1. 先写主题回归断言，在旧运行版本上真实失败（旧背景 `#171E20` 与确认值不符），再实施修复。
2. `npm test`：类型检查、Vite 生产构建、原窗口/导航/隔离/离线/缩放回归、新主题测试均通过。原安全检查未删除，仅更新已批准色值与限定导航选择器。
3. [真实窗口报告](design/previews/runtime/validation.json)：2 种语言 × 2 种主题 × 4 页 × 6 组尺寸/缩放，共 **96 个案例**；1440×960、1120×760、800×540，以及 125%/150%/200% 缩放。无水平溢出和可见文本裁切，检查的文本最低对比 **4.5769:1**；发现英文窄 Rail 标签溢出后已修复。选中区域统一蓝、键盘焦点、主按钮 hover/pressed、减少动态效果、真实导航及禁用样式检查通过。观测到的远程请求、渲染异常均为 0。
4. loading / warning / error 共 6 个双主题**样式探针**通过；警告为 `#C93B3B` 与白色前景。探针临时创建样式测试元素，不代表异步业务、真实错误或任务恢复已实现。
5. 人工查看实际深浅首页、工作区以及窄图，保留明确未实现说明，没有引入示例业务记录。
6. 已打包独立 Windows x64 便携候选，未覆盖旧 portable。`node scripts/verify-package.cjs <候选目录>` 检查 app.asar 中主进程/构建资源逐字节一致；包内 manifest 的名称、版本、入口和生产依赖匹配（打包器会移除开发字段，不按 package.json 原始字节判等）。
7. [便携包报告](design/previews/runtime/package-validation.json)：实际启动包内 EXE，确认名称、版本、app.asar 身份、双主题四页导航、窗口关闭后退出。nodeIntegration=false、contextIsolation=true、sandbox=true、webSecurity=true；渲染进程无 require/process 全局。报告包含 EXE、archive 和关键资源 SHA256。

复现：`npm test`；按 `docs/PROTOTYPE.md` 的便携打包方式输出到新目录，再运行 `node scripts/verify-package.cjs <新目录/ModularWorkstation-win32-x64>`。测试会重新导出当前实际运行截图和验证报告。

## 交付与后续

本机候选：工作目录上两级 `outputs/theme-candidate-20261020-home-refinement/ModularWorkstation-win32-x64/ModularWorkstation.exe`。整个目录需保留；尚非正式安装包，没有发布到 GitHub Release，也未完成签名/升级测试。

应用代码修改：`src/tokens.css`、`src/styles.css`、`src/App.tsx`、`src/Icons.tsx`、`src/i18n.ts`，以及主进程启动底色与默认菜单移除。依赖与锁文件没有变动，没有扩大渲染权限或接入插件。

待完成：独立审查、最终产品体验验收；系统高对比/读屏、多显示器 DPI 与正式发布检查。旧 D2 静态稿保留历史证据，并未全部重新生成；后续规范以最新偏好和实际 Token 为准。#4/#5 与 Electron/Tauri 对照仍待推进，本轮不代替它们。

回滚：撤销本实施 PR 的提交，重新构建即可恢复此前 Shell；设计前置 PR 和原样证据仍在，用户文件与业务数据不受影响。旧便携包未被覆盖。
