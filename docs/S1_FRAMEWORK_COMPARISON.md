# S1 Windows 框架实际对照

日期：2026-10-21｜[#24](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/24)｜正式框架尚待所有者确认。

## 建议

**下一步沿用现有 Electron + React + TypeScript，制作真实工作空间与布局保存恢复闭环；Tauri 保留备选。** 依据是现有实现、CI、测试和打包可直接复用，迁移现在并非完成用户路径的必要条件。此建议不是批准，不把原型当成完整插件安全隔离完成。

## 实验范围与复用

- 工作站基线 main `74001ba8c10b094368f10101b8c7f23af2c050a3`。当前文档链另有归档 PR #28；产品源码和依赖未修改。
- Electron 44.9.0 / React 19.3.1，复用已核验的 Windows x64 便携候选及现有 Playwright 1.56.1。
- Tauri 2.12.3；Rust 1.99.1、Windows MSVC，工具链与实验在仓库外 outputs，未改全局 PATH。
- 使用官方 create-tauri-app npm 4.7.5 的最小入口，移除 greet 业务命令和 opener 插件，capabilities.permissions 为空，关闭全局 Tauri API。生成器自身帮助文本显示 4.8.0，与 npm 包号不同，按实际记录保留，不据此虚构 npm 版本。
- 将当前 `dist` 原样复制给 Tauri，3 个前端文件 SHA256 全部一致；没有另写首页或更换组件库。当前页面及布局限制同样保留。
- create-tauri-app / Tauri / CLI 为 MIT OR Apache-2.0，保留 [MIT 文本](../experiments/windows-framework-comparison/CREATE_TAURI_APP_LICENSE_MIT)；Electron 与 Playwright 沿用已有依赖。未声称全部传递依赖已完成许可或安全认证。

## 实际功能检查

两个候选分别执行 2 语言 × 2 主题 × 4 页，共各 16 个导航组合；每语言离线重载，主题变量、当前页标记、四个入口通过。渲染器 require/process 均 undefined，检查连接后的页面错误和非本地 HTTP 请求记录均为 0。

Tauri 尝试调用未授权 `plugin:fs|read_text_file`，实际返回 `not allowed by ACL`。Electron 没有注册 preload/业务 IPC，页面没有直接 Node 入口。**这验证当前桥接边界，不等于已实现安全插件 SDK**；没有载入恶意第三方插件，也没有证明两框架原生扩展代码受 OS 沙盒限制。

Tauri 配置 CSP 为 null，但复用前端 index.html 中实际存在的 CSP；没有移除该策略。当前未增加 native navigation 白名单等未来专业页面所需防线，不能把最小模板直接视为产品安全架构。

渲染验证使用 WebView2 临时调试入口，实际确认只监听 loopback；结束后停止候选。调试只在实验进程环境启用，性能测量另起不带调试参数的进程。不把连接后零页面请求扩展为操作系统或 WebView2 的完整出站审计。

## 五轮测量

机器：Windows 11 家庭中文版 build 22631，Ryzen 7 5800H，约 13.9 GiB RAM；已有 WebView2 155.0.4283.62。交替启动两个候选各 5 次，检测到主窗口后等待 3 秒，统计主进程和按创建时间校验的子进程。

| 指标 | Electron | Tauri |
| --- | ---: | ---: |
| 主窗口被系统检测到的耗时中位数 | 572.6 ms | 104.4 ms |
| 该耗时范围 | 552.5–645.3 ms | 102.7–116.2 ms |
| 进程树 Working Set 中位数 | 358.3 MiB | 400.1 MiB |
| 进程树 Private Bytes 中位数 | 213.2 MiB | 226.5 MiB |
| 应用分发产物 | 便携目录 394986354 bytes | EXE 4260864 bytes |
| 本次生成的 NSIS 安装器 | 未新增制作 | 1403202 bytes |

### 必须保留的口径限制

- 主窗口出现不等于页面完全可操作。Electron 当前主动等 ready-to-show，Tauri 窗口构造时机不同，不能据上表宣称实际交互启动快五倍。
- Working Set 汇总可能重复计算共享页，不是物理内存独占总量；Private Bytes 也不是纯物理驻留内存。计入 WebView2 子进程，不只报 Tauri 主进程的几十 MiB。
- Tauri 使用系统既有 WebView2，运行时安装体积不在 EXE/安装器数字内；Electron 已包含 Chromium。不能把两类数字称为完整离线安装包的等价比较。
- 没有重启、清理系统缓存或做大样本随机测试。两个框架窗口配置均为 1120×760，但内外尺寸及 DPI 未完全等像素对齐，数据仅描述这台机器的当前 Shell，不代表所有机器或未来业务。
- 初始 PID-only 统计曾错误计入其他软件进程，旧内存样本已弃用。当前脚本要求子进程创建时间不早于父进程，并已重新执行完整矩阵和五轮测量。清理仅结束测试创建的根进程，不用未经时间校验的进程树批量清理。

## 打包、发布与维护

- Tauri release 首次原生编译实际耗时 4m35s；使用 CLI 2.12.3 成功构建 Windows x64 NSIS，工具下载日志有哈希验证。安装模式 currentUser、WebView2 安装模式 skip，没有安装或执行该安装器。
- Tauri EXE SHA256：`a51a9e49aa7daf7295b4e70c0b0828ba6017bef9c8e23d4d9b41c35f1d698ad5`。尚未签名、发布或验证升级/卸载。skip 只适用于已具备 WebView2 的实验机；正式分发需另选离线/引导运行时方案并核验。[Windows 官方说明](https://v2.tauri.app/distribute/windows-installer/)
- Electron 现有 `package:win`、包内内容核验和 PR/main CI 已真实通过，继续沿用。未来仍需签名、安装升级、依赖更新与安全策略，不因本轮推荐而省略。
- Electron 的主进程 JavaScript 权限较大，未来必须只暴露窄接口并验证调用方、参数、资源引用和授权。Tauri ACL 也是应用原生接口权限系统，不自动等于动态 JS/原生第三方插件隔离。[Capabilities 说明](https://v2.tauri.app/security/capabilities/)
- 后续普通插件 UI 应位于受控容器，主题与 Shell 归主程序管理；不把任意插件加载进 Electron 主进程或 Tauri 原生进程。SDK 和故障/安全隔离在 S3 单独验证。

## 验证证据与复现

[功能矩阵](reviews/s1-framework-20261021/comparison-results.json) / [五轮原始数据](reviews/s1-framework-20261021/native-benchmark.json) / [中位数摘要](reviews/s1-framework-20261021/benchmark-summary.json) / [前端逐文件一致性](reviews/s1-framework-20261021/frontend-identity.json) / [隔离实验配方和脚本](../experiments/windows-framework-comparison/README.md)。

完整编译、打包日志和两张运行截图保留在仓库外 outputs/s1-framework-comparison。Node 24 与当前 Playwright 组合有 DEP0190 警告，未将其写成零警告。

已取得真实独立 Gemini 审查并记录分歧，见 [原始报告及裁决](reviews/S1_FRAMEWORK_REVIEW_2026-10-21.md)。Codex 建议沿用 Electron 推进下一闭环，Gemini 倾向继续双底座研究；未伪造一致意见，最终由所有者确认。

## 下一步及回滚

本轮没有迁移工作站或引入新产品依赖。所有者确认 Electron 后，修订 ADR-005/007 的状态及范围，单独建立唯一 S2 实施任务：创建/打开命名本地工作空间、基础标签与布局、保存并在重启后恢复；文件业务与完整插件系统不提前实现。

本实验可通过撤销实验 PR 回滚，临时候选停用后不影响工作站；原 Electron 候选完整保留。框架确认前不关闭 #24，不把 #12 的所有专业设计或整个 S1/S2 自动验收。
