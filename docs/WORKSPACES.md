# 本地工作空间闭环

关联 [#30](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/30) 实施分支 `feat/s2-local-workspaces` 未合并能力须读取 PR 分支

## 体验路径

1. 打开工作区 输入名称 点击创建空间
2. 打开文件与素材标签 切换标准或专注布局
3. 等待已保存到本机 关闭软件 再打开
4. 自动恢复上次空间 标签与布局 创建第二空间后各自独立记忆
5. 恢复默认布局保留所有空间名称与标识 不涉及用户源文件

概览与资源页是实际内置标签 文件关联尚未开放 不伪装文件列表或插件业务
暂不提供重命名 删除空间 任意分屏 面板拖拽及多窗口

## 保存与错误

- 固定文件为 Electron `app.getPath('userData')/workspaces-v1.json` 常规 Windows 用户目录位于 `%APPDATA%/modular-workstation` 便携包可使用产品名称目录 以实际 app 路径为准 不在应用安装目录写入
- 原生启动参数 `--user-data-dir=<独立目录>` 可隔离测试 Renderer 不能选择目录
- 版本 1 最多 100 个空间 名称 1 至 60 个 UTF16 单元 禁止控制字符 标识由主进程生成
- 每空间保存内置标签白名单 `overview/resources` 当前标签及 `standard/focus` 预设 上次空间标识单独保存
- 没有文件路径 凭据 业务内容 网络请求或需要自动重放的任务
- 主进程串行更改 校验完整结构 采用原子文件替换及文件 fsync 确认完成才显示已保存 不使用延迟防抖保存
- 写入失败保持旧状态与旧文件 名称输入仍保留 支持重试 退出前有未保存提醒
- 损坏内容不自动清空 重新读取失败后可显式确认保留原记录并重建 原字节保存在同目录 `workspaces-v1.preserved-<随机标识>.json`
- 未支持的版本只报错 不提供破坏性降级重置 权限错误保持阻断
- 原子替换不是历史版本备份 也不承诺任意物理断电或磁盘硬件故障下零损失 重要记录需正常备份

## 权限与生命周期

保持 sandbox contextIsolation webSecurity 开启 nodeIntegration 关闭 原有严格 CSP 不放宽 无远程请求
preload 只提供 load change recover 不提供通用 invoke 读写文件 Shell 或 Token 接口
主进程校验 IPC 窗口 身份 主 frame 及精确本地 URL 命令类型 字段 名称 ID 标签和布局白名单
单实例避免同一配置目录多个主进程同时写入 窗口关闭等待已排队保存结束
本次不实现崩溃识别 安全启动 第三方插件会话恢复或未保存业务草稿

## 复用与来源

先查当前仓库 原来只有 Shell 无存储入口 继续复用全部已有主题 导航 图标和回归测试
社交与社区旧反馈仅作为线索 没有把旧 Windows 故障讨论当作当前结论 实际 Windows 写入和重启是核验证据

- [npm/write-file-atomic](https://github.com/npm/write-file-atomic) 7.0.0 ISC 原生 Node 兼容条件 `^20.17.0 || >=22.9.0` 通过锁文件固定 发布包自带许可证
- 使用其串行原子替换与 fsync 不引入整套通用配置数据库或在 renderer 暴露 electron-store 的通用键值能力
- [Electron 安全检查](https://www.electronjs.org/docs/latest/tutorial/security) 核对受限 contextBridge 和 IPC 来源验证
- 未复制其他项目业务代码 现有应用依赖许可仍由发布前关卡完整审查

## 验证与回滚

`npm test` 包含旧 Shell 矩阵和新增存储与跨进程恢复测试 所有测试使用临时用户目录 不改真实用户数据
`npm run package:win` 后使用 `node scripts/verify-package.cjs ../portable/ModularWorkstation-win32-x64` 验证实际包
运行截图在 `docs/design/previews/runtime/workspace-live-*` 正式测试记录与独立审查见本轮审查文档

撤销本轮 PR 恢复旧 Shell 会忽略新存储文件 不删除用户文件 保留旧便携包供回退
旧版本若不能理解未来版本必须保持只读 不直接手改版本号 本次没有自动升级或迁移程序
