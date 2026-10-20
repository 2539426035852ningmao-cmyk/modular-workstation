# 双 AI 独立审查流程

关联 #4｜2026-10-20｜本机已执行的流程见 [审查与裁决记录](reviews/S0_03_REVIEW_2026-10-20.md)

## 分工与输入

1. 协调者先读 AGENTS 与 PROJECT_STATE 并查实时 Issue/PR 固定同一 Git 提交
2. Codex 先保存自己的实施思路和待查风险 不先把答案交给第二模型
3. 从固定提交提供共享规范和本轮必要源文件 保留文件名与原行号 清楚列出未提供文件
4. 第二模型独立输出严重度 证据 最小复现 建议和未验证范围 不修改同一分支 不代替用户审批
5. Codex 逐条实测或核对 记录采纳 降级 撤回及争议 不要求模型互相认同
6. 通过独立分支与 PR 归档 然后按质量关卡请所有者验收 通过后才关闭任务并更新唯一下一步

## 当前 Google 客户端

个人账号包括 AI Pro/Ultra 的旧 Gemini CLI 已于 2026-06-18 停止服务 Google 官方后继为 Antigravity CLI。旧认证教程仍有个人登录描述 应结合近期反馈 相关仓库 迁移公告及实际响应核验。

本机实际验证：Antigravity CLI 1.4.3 Google 签名有效 个人 OAuth 登录后识别 Google AI Pro 默认 Gemini 3.8 Flash (High) 返回 REVIEW_READY 和真实审查。客户端名称与模型名称分别记录 不以客户端更新改变项目产品路线或应用框架。

- [官方迁移公告](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)
- [迁移指南](https://antigravity.google/docs/cli/gcli-migration/)
- [认证入口](https://antigravity.google/docs/install?tab=cli)
- [只读与批量输入](https://antigravity.google/docs/cli/headless/)
- [额度及点数](https://antigravity.google/docs/plans)

只使用官方安装来源 核对完整性和签名 不提取凭据。浏览器授权由用户亲自完成 授权码只填官方终端。账号不同于网页右上角当前显示账号 必须用 CLI 的账户状态核对 不将旧客户端 free-tier 错误当成会员失效证据。

## 本机可复现批量审查

客户端位于仓库上两级 outputs/antigravity-cli-tools/agy.exe。登录一次后使用缓存的官方会话 不把 token 放入环境脚本或 PR。

1. 用固定提交构造带行号的纯文本源码快照 存为仓库外的审查输入
2. 用 JSON 序列化成单行消息 event=user 和 message.content 字段 通过标准输入发送
3. 执行客户端时使用 --mode=plan --input-format=stream-json --output-format=stream-json 将输出流和诊断分别存文件
4. 本次不需要文件工具或 shell 权限 内容已直接提供 不使用 --dangerously-skip-permissions
5. 仅从 event=result 提取最终状态 必须 status=SUCCESS 且 response 非空 同时审查 denied_actions 与 stderr
6. 记录基线 客户端版本 真实模型 输入摘要 运行耗时及限制 审核无凭据/私人信息后才归档

本次首次两轮 headless 请求权限被拒绝 退出码为 0 且顶层 status=SUCCESS 但内容为空 因而未算通过。权限失败不能靠全开权限规避；改为直接提供公开快照解决输入问题。

## 费用及权限

用户 Pro 订阅与 Gemini API 是不同入口。本次未创建 API Key 未开通 Cloud 计费。Use AI Credits 在客户端设置页实查为 off 限额耗尽后停止 不自动消耗额外点数。新版本设置字段可能变化 必须在实际客户端复核 不只检查手写配置文件。

安装时跳过全局 PATH 和别名更新 应用依赖不变。临时权限配置在尝试后恢复 没有留下通配写入或命令允许项。默认不加载额外插件 MCP 或自动任务。

## 回滚与恢复

文档变更可 revert 对应 PR。外部 CLI 的文件保留不影响应用 需要停用时不再调用即可 不删除旧凭据或撤销账号授权来试错。恢复时先读取本流程 再核对新版本及实时状态 不复用旧授权码。
