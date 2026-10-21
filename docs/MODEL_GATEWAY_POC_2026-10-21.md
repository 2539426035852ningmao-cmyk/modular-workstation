# 模型网关隔离评估归档

日期：2026-10-21。用户已要求结束本轮旁路评估，回到个人工作站主线。此记录不是 AI 功能排期、正式集成或默认网关选型。

## 已完成的核对

- 公开源码固定：CLIProxyAPI v8.0.36 / `20c9095cac089c6a8e40554debe4dd8a19d4c14f`；EasyCLIProxyAPI v0.3.47 / `aee871a369ad3494c213806da8f8ba8c840e79b8`。两个根 LICENSE 为 MIT，未复制其业务代码进工作站。
- 核对 Windows 发布记录、桌面旧 ZIP 哈希、现有程序版本差异和 Authenticode 状态。旧 ZIP 与官方 digest 一致；现有目录名、版本文本及程序已经不同步，不能用目录名确定运行版本，也没有据此断言软件恶意。
- 对公开 go.mod、Cargo.lock、bun.lock 中 870 个依赖版本执行 OSV 查询，全部取得响应；23 个依赖命中 48 个公告 ID，含别名重复、停止维护、平台专用及构建依赖。不等于 48 个独立可利用漏洞，未完成调用可达性验证。
- 重点阅读凭据文件保存、OAuth、管理 API、路由和更新代码；未完整逐行审计，未出具安全认证。

## 停止条件与未执行项目

[Google Antigravity 当前条款第 6 条](https://www.antigravity.google/terms)禁止以第三方工具通过个人 Antigravity OAuth 访问服务。本轮按用户事先规定的停止条件，未进入代理启动、真实账号调用或登录测试。未读取、复制、刷新账号凭据，未给代理提权。

[OpenAI 官方开源应用登录](https://developers.openai.com/siwc/quickstart)是另一条有明确 scope 的接入路径，不能一概判为违规。代理现有 SIWC 实现与旧 Codex 凭据路径并存，尚未完成端到端合规和功能验证。未据用户已登录两个账号推断它们已获准用于全部转发功能。

未安装新代理运行实例，未验证启动/停止、健康检查、模型接口、流式结果及 Windows 运行兼容性。没有修改工作站源码、依赖、系统权限或桌面原有安装，也没有合并 PoC PR。

## 生图问题的证据边界

通过应用内读取「创建使用环境」的近期记录及四张截图：Chatbox 对话中生图后回复空白，代理日志却标记相关请求成功，且出现图片模型记录。成功记录不证明返回有效图片，空白界面也不证明上游未生成。

代理源码已经存在 `/v1/images/generations` 与 `/v1/images/edits`。将来如重新批准排查，应分开核对客户端请求、代理转换、上游图片事件/数据及客户端展示能力；尚无原始响应，根因未确定。没有通过重复发起账号请求来验证猜测。

## 后续沿用与回滚

- 正式 API、OpenAI 官方登录和模型网关均保持未来候选，不是当前工作空间闭环的前置条件。
- 官方 API + [Bifrost](https://github.com/maximhq/bifrost) 可另行比较；后者也有管理面、日志和安全公告，不能跳过审核，更不必在少量接入时强行引入。
- 详细日志、公开源码和脱敏报告保留在本机仓库外 `outputs/model-gateway-poc-20261021`，不将账号截图和凭据提交 Git。
- 无新服务或账号授权需回滚；原有官方 Antigravity CLI 的 Gemini 审查继续有效，无须重新登录。归档文档可通过撤销本 PR 回滚。

## 原始来源

[CLIProxyAPI 固定源码](https://github.com/router-for-me/CLIProxyAPI/tree/20c9095cac089c6a8e40554debe4dd8a19d4c14f) / [Easy 固定源码](https://github.com/router-for-me/EasyCLIProxyAPI/tree/aee871a369ad3494c213806da8f8ba8c840e79b8) / [CLIProxyAPI 管理接口公告](https://github.com/advisories/GHSA-v2c6-3phc-2r62) / [compress 公告](https://github.com/advisories/GHSA-259r-337f-4rfw) / [TLS 验证公告](https://rustsec.org/advisories/RUSTSEC-2026-0382.html)。
