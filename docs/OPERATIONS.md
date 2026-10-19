# 项目日常运营与进度维护（OPERATIONS）
版本：2026-10-19｜适用：项目所有者、ChatGPT、Codex、Gemini

## 开始一次工作会话
1. 阅读 [README](../README.md)、[AGENTS](../AGENTS.md)、[PROJECT_STATE](../PROJECT_STATE.md)，再读 [PRODUCT](PRODUCT.md)、[ROADMAP](ROADMAP.md)、[DECISIONS](DECISIONS.md)、[QUALITY_GATES](QUALITY_GATES.md)。Gemini 还须读取 [GEMINI.md](../GEMINI.md)。
2. 打开快照中的唯一主 Issue，查询实时状态、验收清单、最近 PR 和依赖。
3. 核对 [Projects 看板](https://github.com/users/2539426035852ningmao-cmyk/projects/2)。若快照与实时记录冲突，以 Issue/PR/Projects 为准，并通过独立分支与 PR 修正快照。
4. 汇报：阶段 / 当前 Issue / 分支与 PR / 已完成证据 / 阻塞 / 唯一下一步。其他排队任务不自动变成并行主任务。

## 状态变更时机
| 事件 | 必须执行或核验 |
| --- | --- |
| 新建任务 | 使用 Issue 写清范围、依赖、验收；Auto-add 入板后应为 Todo，核对仓库和条目且不重复添加。 |
| 开始唯一主任务 | 将对应 Issue 的项目状态设为 In Progress；其他任务保留 Todo。 |
| PR 创建或更新 | 默认在 PR 正文写 `Related to #任务号`，在 Issue 中记录 PR 链接、验证和剩余风险。普通引用提供双向活动记录，但不等于 Development 中的关闭关联。 |
| PR 合并 | 核实合并 SHA、检查结果和 Issue 剩余验收项；合并本身不表示 Issue 或阶段已完成。 |
| Issue 验收完成 | 经约定审查与用户验收后关闭 Issue，核验 Item closed 将状态设为 Done。当前 Auto-close issue 也会在手动设为 Done 时关闭 Issue，因此验收前不得设为 Done。 |
| 任务阻塞 | 在主 Issue 记录原因、责任方和解除条件；当前三列看板没有专用阻塞状态，保留唯一主任务并在交接中显式报告。 |
| Issue 重新打开 | Item reopened 当前未启用；人工核对并设为 Todo，只有确认重新成为唯一主任务时设为 In Progress。 |
| 主任务切换或阶段里程碑变化 | 更新 PROJECT_STATE.md 和 ROADMAP.md 的当前指向；通过 PR 交付，附真实 Issue/PR/看板证据。未经验收不宣布进入下一阶段。 |

未通过验收的中间 PR 使用普通引用，避免 `Closes`、`Fixes`、`Resolves` 等自动关闭关键字，也不要建立会在合并时关闭 Issue 的 Development 关联。只有当该 PR 足以完成 Issue 且符合验收约定时才使用关闭关联；参见 [GitHub PR 关联说明](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)。

## GitHub Projects 原生工作流
以下为 2026-10-19 网页实查的配置快照，后续会话仍须复核实际开关。

| 工作流 | 已核实配置 | 验证范围 |
| --- | --- | --- |
| [Auto-add to project](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124516903) | On；仓库 modular-workstation；过滤器 `is:issue` | 本次编辑既有 #3 后自动入板，机器人事件可追踪。未创建测试 Issue。 |
| [Item added to project](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124481955) | On；新入板 Issue/PR → Todo | #3 自动入板及 #4/#5 手动关联后均设为 Todo。 |
| [Item closed](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124481941) | On；Issue/PR 关闭 → Done | #1 历史关闭及机器人移列记录已复核。 |
| [Auto-close issue](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124481946) | On；项目状态 Done → 关闭 Issue | 仅检查配置，本次未再次触发。Done 必须代表已满足验收。 |
| [Pull request linked to issue](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124481952) | On；关联时设为 In Progress | 仅检查配置；普通正文引用不等于此事件。 |
| [Pull request merged](https://github.com/users/2539426035852ningmao-cmyk/projects/2/workflows/124481944) | On；项目中的 PR 合并 → Done | 仅检查配置；该 PR 卡片状态不等于产品验收。 |

- Auto-add 只处理符合条件的新建或更新事件，不追溯添加全部历史任务。遗漏的历史 Issue 从 Issue 的 Projects 栏关联；先检查是否已存在，避免重复任务或草稿卡。
- `is:issue` 包含打开和关闭的 Issue，不自动加入 PR。PR 通过 Issue/PR 双向引用追踪；如确需 PR 卡片，再单独关联。
- Item closed 会处理关闭状态；统计“完成”时还须区分 completed、not_planned 等关闭原因，不能只数 Done 列。
- 原生工作流当前满足入板和状态维护需求，本次未增加 Actions、外部服务、令牌或权限。未来确需自动写快照时先提出技术方案，说明触发事件、权限、维护和回滚成本。
- 自动化定义见 [GitHub Auto-add 文档](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)和[内置工作流文档](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)。

## 快照与进度摘要核验
PROJECT_STATE.md 是人工维护的恢复快照，**没有自动实时同步**。开始会话、PR 合并、Issue 关闭、阻塞变化及主任务/阶段切换时，先查实时记录；出现实质偏差就通过 PR 更新快照。摘要附查询日期及真实链接，分别报告 Issue 状态、Projects 状态和 PR 合并状态；未知项写未核实，不从快照推算实时任务数。

## 2026-10-19 实际验收记录（S0-02）
- main 已读取九份指定治理文件；[PR #2](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/2) 与 [PR #6](https://github.com/2539426035852ningmao-cmyk/modular-workstation/pull/6) 均已合并，仓库仍只有治理文件和模板，尚无应用代码或 CI 工作流。
- Auto-add 从未保存的草稿配置改为仓库 modular-workstation + `is:issue`，点击 Save and turn on workflow；界面显示 On，工作流总启用数由 6 变为 7。
- #3 更新于 16:45:23（Asia/Hong_Kong），[机器人入板事件](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/3#event-33625907678)发生于 16:45:25，随后自动设为 Todo。人工于 16:46:00 将其设为 In Progress，未手动添加 #3。
- #1 的[关闭事件](https://github.com/2539426035852ningmao-cmyk/modular-workstation/issues/1#event-33624153131)为 16:22:25；16:22:28 的机器人状态变更及网页活动明确显示 Todo → Done。这是历史真实工作流复核，本次未重新打开/关闭 #1。
- #4、#5 分别从 Issue 的 Projects 栏手动关联；机器人将它们设为 Todo。看板复核 #1 Done / #3 In Progress / #4 Todo / #5 Todo，各一条，无重复。
- 新建 Issue 触发路径本次未单独测试；使用既有 #3 的真实进度更新验证了“更新 Issue”触发路径。
- 本会话从仓库恢复并复核了状态，但初始任务提示包含已知进度，**不能作为完全无旧聊天/状态提示的新会话恢复验收**。该项仍待单独执行。
- 文档更改通过独立分支和 PR 审查；本次未运行应用构建、单元测试、Gemini 或 CI，也未宣称 S0 全部通过。

## 安全与回滚
- 不共享 Cookie、API Key、GitHub token；不提交账户截图或凭据。
- 文档可通过 revert 对应 PR 提交回滚。若需停用新 Auto-add，在其页面关闭开关即可；不会自动移除已关联的任务。
- 非破坏性维护在授权范围内执行；架构、广泛权限、重要分支设置与发布按 AGENTS 和 QUALITY_GATES 审批。
