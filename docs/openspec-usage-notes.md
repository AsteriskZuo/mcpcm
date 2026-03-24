# OpenSpec 使用共识（mcpcm-server）

更新时间：2026-03-23

## 1. 文档目的

这份文档记录当前项目在正式开发前，关于 OpenSpec 的关键共识，作为后续设计与实施的参考基线。

## 2. 当前项目背景

- 项目：`mcpcm-server`
- 目标：构建 `mcpcm` 的后端，负责 MCP 配置数据的收集、存储与查询。
- 技术栈：`Python + FastAPI + uv + pytest + ruff`, 后续使用 docker 进行打包和部署
- 现状：项目处于启动阶段，主要在建立流程和规范。

## 3. `openspec/config.yaml` 是做什么的

`openspec/config.yaml` 是项目级 OpenSpec 配置文件，用来告诉 OpenSpec：

- 使用哪个 workflow schema（当前为 `spec-driven`）
- 项目上下文（`context`），供 AI 生成 proposal/specs/design/tasks 时参考
- 各类产物的附加规则（`rules`）

它不是“业务代码配置”，而是“规范生成与执行约束配置”。

## 4. `config.yaml` 的格式要求

当前版本下，核心字段为：

- `schema`: 必填，非空字符串。
- `context`: 可选，字符串（推荐 YAML 多行 `|`）。
- `rules`: 可选，映射结构，格式为 `artifact_id -> string[]`。

在 `spec-driven` 下，常用 artifact id：

- `proposal`
- `specs`
- `design`
- `tasks`

注意事项：

- `context` 总大小建议控制在 50KB 以内。
- `rules` 中如果写了未知 artifact id，不会按预期生效。
- `openspec config` 命令主要管理的是“全局配置”，不是这个项目文件本身。

## 5. 全局设计与 OpenSpec 的关系（关键共识）

结论：OpenSpec 可以支持“先全局、后拆分”，但默认不是树状父子项目管理器。

更准确的理解：

- OpenSpec 是 change-centric（以 change 为中心）
- “全局设计”通常也需要落地为一个 change（或少量 change）
- 后续再开多个子 change 逐步实现
- 默认不是强制的树状结构，不会自动做父子依赖编排

建议心智模型：

- 共享的 `openspec/specs` 作为长期基线
- 每个 change 以 delta 的方式增量更新
- 归档时同步 delta 回主 specs

不是简单链表，也不是严格队列：

- 可以并行多个 change
- 但依赖与冲突需要团队自己治理

## 6. 对本项目的推荐落地方式

先做 1 个“全局架构 change”（设计型，不急于实现代码）：

- 示例名：`define-mcpcm-backend-architecture`
- 目标：明确能力边界、数据模型、API 边界、错误模型、校验与安全基线、与 `mcpcm` 客户端兼容策略

再拆分实现型 change：

- `bootstrap-fastapi-foundation`
- `add-mcp-server-registration`
- `add-mcp-server-find-query`
- `add-mcp-payload-validation`

每个实现型 change 保持小步、可验证、可回滚。

## 7. 本轮讨论产出

- 已完成 `openspec/config.yaml` 的项目化配置（包含 context 与 rules）。
- 已确认本项目采用“全局基线 + 增量 change”方式推进。
- 后续如进入实现阶段，按：
  - explore（讨论）
  - propose（产出 proposal/design/specs/tasks）
  - apply（按 tasks 实现）
  - archive（归档并同步）

