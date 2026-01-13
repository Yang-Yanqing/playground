Internal Data Tool（pdm 试工版）

这是一个“内部工具型数据导入 / 状态查看 / 失败重试”的最小全栈 Demo，用来展示：

小而清晰的数据模型设计：source / import_run / record

幂等导入：同一 source 下 external_id 唯一，重复导入不会产生重复数据

状态与统计：导入任务统计（inserted / duplicate / failed），记录状态（PENDING / OK / FAILED）

运维能力：失败记录查询与 retry

技术栈：

Backend: Node.js + Express + PostgreSQL（pg）+ zod

Frontend: React + Vite

DB: PostgreSQL（推荐 Docker 启动）

1. 项目结构
pdm-data-tool/
  backend/
    package.json
    .env.example
    src/
      server.js
      db.js
      dbInit.js
      schema.sql
      routes/
        sources.js
        imports.js
        records.js
  frontend/
    package.json
    vite.config.js
    src/
      main.jsx
      App.jsx
      api.js
      pages/
        Imports.jsx
        ImportDetail.jsx

2. 快速启动
2.1 启动 PostgreSQL
方式 A：Docker（推荐）

在项目根目录创建 docker-compose.yml（如果已有可跳过）：

services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_USER: postgres
      POSTGRES_DB: pdm_tool
    ports:
      - "5432:5432"


启动：

docker compose up -d

方式 B：本机 PostgreSQL

创建数据库：

createdb pdm_tool

2.2 启动后端
cd backend
npm i
cp .env.example .env
node src/dbInit.js
npm run dev


后端默认地址：

http://localhost:4000


健康检查：

GET http://localhost:4000/health

2.3 启动前端
cd ../frontend
npm i
npm run dev


Vite 控制台会输出地址，一般为：

http://localhost:5173

3. 使用流程（演示建议）

打开前端首页（Imports 页面）

在 Source 区域点击 Create/Upsert Source

在 Create Import Run 区域粘贴 JSON 数组（页面默认提供示例）

点击 Run Import

跳转到 Import Run 详情页，查看：

导入统计：total / inserted / duplicates / failed

records 列表（最多 200 条）

若有 FAILED 记录，点击 Retry：

record 状态变为 PENDING

retry_count + 1

说明：此 demo 的 retry 仅执行“状态回退 + 重试次数累加”，不包含异步队列逻辑，符合“一天试工”场景的最小实现。

4. API 接口说明
4.1 Source（数据来源）

POST /sources
创建或 Upsert 一个 source（name 唯一）

请求：

{
  "name": "demo-source",
  "description": "optional"
}


响应：返回 source 对象。

GET /sources
获取 source 列表。

4.2 Import Run（导入任务）

POST /imports
创建一次导入任务，并逐条写入 records（幂等：同一 source 下 externalId 不重复）。

请求：

{
  "sourceId": 1,
  "records": [
    { "externalId": "a-1", "raw": { "name": "Alice" } },
    { "externalId": "a-2", "raw": { "name": "" } },
    { "externalId": "a-1", "raw": { "name": "Duplicate Alice" } }
  ]
}


规则：

校验：raw.name 必须为非空字符串，否则该条 status=FAILED

使用唯一索引避免重复：重复 externalId 会 DO NOTHING，计入 duplicates

响应示例：

{
  "importRunId": 12,
  "status": "DONE",
  "total": 3,
  "inserted": 2,
  "duplicates": 1,
  "failed": 1
}


GET /imports
获取最近 50 条导入任务（包含统计）。

GET /imports/:id
获取某次导入任务详情（含任务信息与最多 200 条记录）。

4.3 Records（失败记录与重试）

GET /records/failed
获取最近 200 条 FAILED 记录（按更新时间倒序）。

POST /records/:id/retry
对单条记录执行 retry：

status: FAILED → PENDING

retry_count: +1

清空 error_message

响应示例：

{
  "id": 55,
  "status": "PENDING",
  "retry_count": 2
}

5. 数据库设计说明（试工重点）
5.1 表概览

sources

数据来源抽象（例如 csv-upload / partner-api / internal-feed）

name 唯一，作为业务来源标识

import_runs

每次导入任务的运行记录（traceability / audit）

记录 total / inserted / duplicate / failed 等计数

status: RUNNING / DONE / FAILED（demo 默认 DONE）

records

具体导入数据记录（每条数据一行）

raw: 原始 JSON

normalized: 清洗后 JSON

status: PENDING / OK / FAILED

error_message, retry_count: 运维与重试字段

5.2 幂等导入（Idempotency）

唯一约束：

(source_id, external_id)


作用：

同一来源同一 external_id 的数据不会重复插入

支持重复导入、恢复与重试，不污染数据

6. 各文件用途
backend
文件	说明
package.json	后端依赖与脚本（dev / db:init）
.env.example	环境变量模板（PORT / DATABASE_URL）
src/schema.sql	建表脚本，包含唯一索引与常用索引
src/db.js	PostgreSQL 连接池统一出口
src/dbInit.js	一键初始化数据库 schema
src/server.js	Express 应用入口
src/routes/sources.js	Source 创建/查询 API
src/routes/imports.js	导入任务逻辑与统计更新
src/routes/records.js	失败查询与 retry API
frontend
文件	说明
package.json	前端依赖与脚本
src/api.js	封装 API 请求，统一 API_BASE
src/App.jsx	极简 hash 路由（避免引入 react-router）
src/pages/Imports.jsx	Source 创建 / 导入触发 / 列表展示
src/pages/ImportDetail.jsx	导入详情与 Retry 操作
7. 面试追问标准回答模板

为什么要 import_runs？
导入是一个运行过程，需要可追溯（时间、数量、成功/失败/重复统计）。

为什么 records 保存 raw + normalized？
raw 用于复盘、调试、重放；normalized 用于下游消费。两者分离是数据工程常见做法。

为什么唯一索引 (source_id, external_id)？
幂等导入的关键。重复导入不会产生重复数据，保证可重复性与稳定性。

retry 为什么只是 FAILED → PENDING？
retry 是运维动作，不应“自动修复”。重置状态 + 累加重试次数，让系统重新处理更合理。

8. 常见问题排查

后端连不上数据库：

检查 .env 中 DATABASE_URL 是否正确

确认 Docker 已启动：docker ps

检查 5432 端口是否被占用

表不存在：

确认执行过 node src/dbInit.js

前端跨域：

后端已启用 cors

确认 frontend/src/api.js 中 API_BASE 为 http://localhost:4000

9. 可选增强（扩展方向）

status 加 CHECK 约束或 ENUM（防止非法状态）

imports 支持分页与过滤（?status=FAILED / ?sourceId=）

异常导入时标记 import_run.status=FAILED + error_message

增加批量 reprocess PENDING 的端点