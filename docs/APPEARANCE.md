# S2-02 外观偏好契约

关联 [Issue #32](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/32) 独立分支 `feat/s2-appearance-preferences` 待所有者最终体验验收 不代表整个 S2 完成

## 实际能力

设置页提供跟随系统 浅色 深色 保存成功后由 Electron nativeTheme.themeSource 统一生效 CSS 沿用原 Token 原生窗口底色同步更新 首窗口创建前读取
固定 `app userData/appearance-v1.json` 结构 `{"version":1,"theme":"system"}` 只接受 system light dark 与固定字段 不接受任意路径
外观与工作空间分文件 主进程共用既有串行队列 受信主窗口与主框架来源检查 preload 只暴露三个白名单方法

## 失败与恢复

原子写入与 fsync 成功才更新内存和主题 写入失败保留旧值 退出提示按外观与空间分别记录 其他操作成功不能误清除
损坏记录不会自动覆盖 显式恢复先复制原字节到同目录唯一 preserved 文件 再原子替换默认值 新写入失败时原文件仍保留且仍可恢复
未支持版本只读 不提供恢复覆盖 控制区阻断并保留重试入口
备份用于诊断和人工恢复 不承诺应对任意外部修改 物理断电或第三方软件同时覆盖

## 不打断桌面的测试

本机测试使用 `--workstation-background` 和独立临时 userData 窗口隐藏且不可聚焦 不入任务栏 原生确认在该进程内默认取消 无需逐次请求测试许可
后台模式禁止无独立目录启动 第二实例带后台标志不会唤醒正常主窗口 隐藏测试关闭渲染节流以保证自动检查效率 普通启动保持原生节流
工具鼠标操作仅投递到隐藏渲染器 不控制系统鼠标 本机不执行可见最小化最大化 自动放到 GitHub Actions 的隔离 Windows runner 执行并区分证据
系统主题传播由原生手动模式和渲染媒体模拟分别验证 本机未修改 Windows 全局主题设置

## 复用与回滚

[Fluent-Qt 复用](FLUENT_QT_REUSE.md) 与 [完整 MIT 声明](../THIRD_PARTY_NOTICES.md)
没有新增依赖 没有 Qt 运行时 没有修改工作空间版本 无插件 文件 搜索或模型网关实现
撤销本 PR 后恢复原跟随系统行为 保留 appearance 文件与 preserved 备份 保留上一轮工作空间候选程序
