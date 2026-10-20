# CI 与 PR 质量基线

日期：2026-10-21｜关联 Issue #5

## 复用选择

- 现有 `npm test` 已包含类型检查 生产构建及四组 Electron 测试 直接复用 不新增测试框架
- 现有 `package:win` 与 `scripts/verify-package.cjs` 直接复用 检查真实打包程序 不上传或发布安装包
- GitHub 官方 checkout/setup-node/upload-artifact 均为 MIT 许可 lychee/lychee-action 为 MIT 或 Apache-2.0 许可 仅作为开发工具 不复制到产品运行时
- Action 固定完整提交 SHA 并标记版本 Dependabot 每周提出升级 PR 不自动合并
- lychee 0.24.2 直接检查本地文档链接 不自行编写 Markdown 解析器 网络链接与锚点完整性不在本轮保证范围内

来源：[checkout](https://github.com/actions/checkout) / [setup-node](https://github.com/actions/setup-node) / [upload-artifact](https://github.com/actions/upload-artifact) / [lychee-action](https://github.com/lycheeverse/lychee-action) / [Playwright CI](https://playwright.dev/docs/ci)

先查看近期社交与社区反馈 再核对上游仓库和正式说明。社区关于 Windows 测试焦点与孤儿进程的反馈仅作为线索 采用现有 finally 关闭与单进程顺序测试 未增加常驻服务或额外桌面封装。

## 实际检查

工作流 `.github/workflows/quality.yml` 在 PR main 推送及手动触发时运行 不采用有写权限的 pull_request_target。

| 检查 | 内容 |
| --- | --- |
| Local documentation links | lychee 离线检查根目录 docs 与 PR 模板 Markdown 本地目标 |
| Windows desktop checks | Windows runner Node 24.18.0 npm ci npm test Windows 打包及包内一致性与实际窗口操作 |

使用只读 contents 权限 checkout 不保留凭据 禁用包管理器缓存 不提供仓库密钥 不发布 Release。测试前清理签入的历史验证文件 测试证据保存 14 天 在 Actions 运行页面下载。失败不能因产物存在而当作通过。

## 本机验证

- lychee 故意缺失目标时退出 2 修正目标后退出 0 证明可以发现断链
- 原 `npm ls @electron/asar --depth=0` 无直接依赖 补齐既有版本 4.3.1 后干净 npm ci 成功且直接依赖可解析
- npm test 类型检查 构建 四组测试通过 96 个窗口场景 6 个样式探针 远程请求与渲染错误均 0
- package:win 与 verify-package 实际通过 2 语言 2 主题 4 页离线导航 原生最小化最大化恢复关闭及隔离设置通过
- Node 24 对旧 Playwright 启动路径输出 DEP0190 警告 已记录 不伪装为零警告 后续工具升级须回归实际窗口
- 模板人工核对现有目标 范围 验收 风险字段和默认 Related to 引用 不另造测试 Issue

云端运行以 PR 检查记录为准 本机通过不等于 GitHub 已执行。

修正后的 [39455238916](https://github.com/2539426035852ningmao-cmyk/modular-workstation/actions/runs/39455238916) 两项检查真实通过 Windows 四组测试和打包程序验证均成功。[独立审查与裁决](reviews/S0_04_REVIEW_2026-10-21.md) 记录模型过时判断与实际证据的区别。

首次云端运行 [39454859987](https://github.com/2539426035852ningmao-cmyk/modular-workstation/actions/runs/39454859987) 文档检查通过 Windows 测试 3/4 失败。卡片常规底色断言实际读到悬停底色 rgb(238 235 229)；修正为先移开鼠标并断言卡片不在 hover 状态 再核对常规底色 不改变产品颜色或放宽断言。首次产物可能混有历史文件 后续工作流增加执行前清理。

## 分支与安全设置

2026-10-21 GitHub main 返回 protected=false 仓库 rulesets 返回空列表。连接器读取保护详情返回 403 因此不能完整读取或修改管理设置。此次仅评估 不擅自改变重要访问和分支权限。

建议在首次 CI 稳定后设置 main 必须经 PR 并要求上述两个检查 禁止强推与删除。单人仓库不强制另一位人类审批以避免无法合并 所有者仍保留最终产品验收。保护是否实际启用必须另行核实 不能把本建议写成已启用。

依赖更新通过 Dependabot PR 人工审查 lockfile 和升级说明。不自动运行 npm audit fix 不自动升级桌面框架。不将依赖更新配置视为漏洞扫描或密钥扫描已经启用 GitHub Secret scanning 和 Push protection 的状态本连接器尚未取得。

## 后续扩展与回滚

- 插件 SDK 阶段补授权拒绝 故障恢复 兼容与卸载测试
- 文件业务阶段补真实文件与失败回滚测试
- 发布前补 Windows 10 多屏 DPI 性能 签名 安装升级卸载与依赖许可报告
- 回滚本 PR 可移除新工作流和升级配置 恢复工具依赖声明 不改用户数据 不回退已验收视觉
