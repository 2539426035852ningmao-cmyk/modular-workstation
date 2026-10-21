# Windows 框架隔离实验配方

实验资料，不是工作站产品目录。结论及边界见 [对照报告](../../S1_FRAMEWORK_COMPARISON.md)。禁止把本实验视为生产插件安全实现。

## 复用与来源

- [create-tauri-app](https://github.com/tauri-apps/create-tauri-app) npm 4.7.5（帮助文本自报 4.8.0），[Tauri](https://github.com/tauri-apps/tauri) 2.12.3，CLI 2.12.3：MIT OR Apache-2.0，保留本目录 MIT 许可。
- 当前 React/CSS/图标/国际化与 dist 原样复用，没有第二套前端。
- compare.cjs 使用工作站已安装的 Playwright，不安装另一套测试框架。benchmark.ps1 使用 Windows/.NET 进程信息，统计创建时间有效的进程树。

## 已执行目录

仓库外 outputs/s1-framework-comparison/tauri-candidate。Rust 与 Cargo 的 HOME 指向 outputs/s1-framework-tools，不改全局 PATH。需要已有 MSVC Build Tools、Windows SDK 和 WebView2。

## 重建方法

由开发代理在新的隔离目录执行，不覆盖已有用户数据：

1. 用固定版本 create-tauri-app 4.7.5 创建 vanilla / npm / Tauri 2 模板，identifier 为 org.modularworkstation.frameworkcomparison；保留模板自带 icons。
2. 将本目录 src-tauri 配方覆盖到新模板。模板 greet/opener 已移除；权限列表为空，不注册业务命令。
3. 在工作站按已存在的流程 build，将完整 dist 复制为新候选根目录下的 dist；逐文件核对 SHA256。
4. 在隔离环境设置 CARGO_HOME/RUSTUP_HOME，将 cargo/bin 仅加入该进程 PATH；进入 src-tauri 执行 `cargo build --release --locked`。Cargo.lock 必须保持当前提交版本，工具链为 Rust 1.99.1。
5. 本次安装器使用 CLI 2.12.3 的 bundle 命令，选择 nsis、currentUser、webviewInstallMode=skip、无签名且不修改已测 EXE。它不会附带 WebView2，仅用于已具备运行时的测试机器。正式发布不能照搬 skip。
6. 把 compare.cjs、benchmark.ps1 放在候选的同级实验目录，满足下列路径布局后运行。先跑功能检查，再跑五轮原生测量，不与编译并行。脚本只结束其启动的根进程，不批量结束外部软件。

默认脚本路径沿用本次实际布局：实验目录 ../../work/modular-workstation 为仓库，../../work/portable/ModularWorkstation-win32-x64 为现有 Electron 候选，实验目录下 tauri-candidate 为新模板。换目录复现时应先改路径，不能对错误目录执行清理。

功能检查：`node compare.cjs`；原生测量：`pwsh -NoProfile -File benchmark.ps1`。后者需要 PowerShell 7 的 ProcessStartInfo.Environment 支持。原始 JSON 在脚本所在目录输出；不要以一次异常或缺样本结果计算中位数。

本次发现并修复 PID 复用导致的误统计。脚本用创建时间校验父子关系；旧统计未作为结论。功能检查只在自己启动的 WebView2 上启用 loopback 调试入口；原生测量去掉该参数。结束后确认候选及其调试入口已经退出。

## 不在本实验保证内

正式安装、升级、卸载、代码签名、第三方插件安装/恶意代码隔离、全部系统出站审计、完整 DPI 等像素对齐与断电恢复。原生基准采用根进程终止来清理，不将它算作用户退出协调或未保存保护测试。

实验配方归入 docs/experiments，复用现有 Windows 打包流程对 docs 的排除规则，不把 Rust 源码、锁文件与测试脚本带入产品包。
