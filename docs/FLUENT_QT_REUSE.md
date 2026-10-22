# Fluent-Qt 实际复用记录

2026-10-22 用户提供视频与源码并明确要求落地 作为 #32 外观设置的增补 不另开并行主任务

## 来源核实

- [用户视频](https://www.bilibili.com/video/BV1Yfnv6GEZ9) 浏览工具无法读取视频内容 没有声称完整观看 依据用户提供的章节说明与固定版本源码逐项核实
- 社区检索找到 Qt Forum 展示帖 但存在删除提示 不将宣传与零散反馈视为稳定性保证
- 实际下载源码到仓库外临时目录 固定 [v1.10.2](https://github.com/calvinhxx/Fluent-Qt/tree/v1.10.2) 对应提交 `4d8a600112a6c43bb7bd0c7cdb5b08185ad759ac` 没有安装或运行未知二进制
- 读取 LICENSE THIRD_PARTY_NOTICES SettingsPage Card Animation MotionPolicy 和该版本发布说明 自有源码 MIT 不覆盖 Qt 和第三方资产

## 已实施的适配

| 上游源码 | 当前落地 | 保留与调整 |
| --- | --- | --- |
| SettingsPage.cpp SettingsRow | 外观设置图标 主副文案 尾部主题操作 | React 与 CSS Grid 移植 保留左重右轻 既有主题和键盘焦点 |
| SettingsRow::setStacked | 窄容器控制区自动换到下一行 | 容器宽度 640px 为本项目三按钮与中英文适配值 上游为 520px |
| Animation.h Fast 150ms | 公共按钮 导航 模块卡阴影与亮度短反馈 | 不延迟选中填色 不做常驻动画 系统减少动态效果时禁用 |
| CommandPalette.h/.cpp | #34 顶部命令查找与已有页面导航 | 复用页面动作 按词全部匹配 上下与 Enter Escape 查询保留 关闭返回焦点后执行 HTML dialog 替代 Qt Popup |

这是真实源码结构和参数适配 不是安装 Fluent-Qt C++ 控件库 未复制整套组件或声称原样接入 原 Qt 类不能直接作为 React 组件使用

完整许可与移植清单见 [随程序分发的第三方声明](../THIRD_PARTY_NOTICES.md) 包验证检查该声明与源码一致

## 后续复用顺序

1. 设置与主题 #32 已体验验收 PR #33 合并后检查成功
2. 当前唯一任务 #34 已按此顺序移植 CommandPalette 的命令复用 键盘导航 焦点返回 仅复用现有页面动作 具体限制见 [命令契约](COMMANDS.md) 待本轮验收
3. 真实表单排期时参考 FormController 的编辑后失效结果抑制 单一错误反馈与定位首个错误
4. 有真实数据需求时再选择图表或成熟 Web 对应库 不先放模拟图表 不为展示组件引入整个 Qt 运行时
5. 浮层 Drawer 与 Dialog 按任务使用统一关闭顺序 焦点管理与减少动态效果 不照搬全套模糊或空间动画

每步先核对许可与实现匹配程度 复制时固定版本保留署名 不以复用为由替换当前 Electron 底座或已确认视觉

## 验证与回滚

`tests/fluent-adaptation.test.cjs` 在隐藏 Electron 内检查宽窄排列 无溢出 普通和减少动态效果
`tests/appearance-window.test.cjs` 验证真实主题保存 重启 错误 恢复并生成双语双主题截图
撤销本 PR 即可回到原有样式与跟随系统行为 不迁移工作空间 不安装后台服务 不改变依赖
