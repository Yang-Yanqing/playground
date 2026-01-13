Internal Import Tool API（内部数据导入工具）

这是一个内部工具型 API（Internal Tooling API） 示例项目，用于模拟公司内部常见的“数据导入 / 任务管理 / 状态追踪 / 失败重试”场景。

项目不包含用户体系，不追求复杂 UI，重点在于：

数据导入流程是否清晰

是否支持重复导入（幂等）

是否能追踪状态和错误

是否便于内部运维和排查问题

非常适合 数据工程 / 平台工程 / 后端基础设施 类岗位的试工任务。

一、项目功能概览
已实现功能（核心）

创建导入任务（Import Job）

支持两种数据来源：

直接提交文本（rawText）

通过 URL 拉取文本（sourceUrl）

数据解析 + 基础清洗

导入任务状态管理：

PENDING

RUNNING

SUCCESS

FAILED

导入结果写入数据库

幂等性处理（相同内容不会重复导入）

错误记录与失败原因保存

支持失败任务 retry

可选 / 加分项

内部 API Key 校验

简单 HTML 页面查看导入任务状态（非必须）

二、技术栈说明

Node.js + Express：实现 API 服务

PostgreSQL：持久化导入任务和结果数据

pg：数据库访问

zod：请求参数校验

dotenv：环境变量管理

整体设计目标是：
👉 简单、清晰、一天内可完成，但结构专业

三、项目结构说明
internal-import-tool/
├─ server/
│  ├─ src/
│  │  ├─ index.js                # 服务入口，启动 Express
│  │  ├─ db.js                   # PostgreSQL 连接封装
│  │  ├─ schema.sql              # 数据库表结构定义
│  │  ├─ utils.js                # 通用工具函数（hash / 清洗）
│  │  ├─ routes.imports.js       # 导入任务相关 API 路由
│  │  └─ services/
│  │     └─ importRunner.js      # 导入任务执行核心逻辑
│  ├─ package.json               # 依赖与脚本
│  └─ .env.example               # 环境变量示例
│
└─ web/                           # （可选）简单内部查看页面
   └─ index.html

四、各文件职责说明（重点，面试可直接用）
1️⃣ schema.sql —— 数据库结构定义

用于定义导入任务（import_jobs）和导入结果（imported_records）。

核心设计点：

把“导入”当成一个Job

每个 Job 有完整生命周期和状态

使用 checksum 做幂等控制，避免重复导入

导入结果与 Job 通过外键关联

这是保证系统可复现、可维护的基础。

2️⃣ db.js —— 数据库访问封装

统一管理 PostgreSQL 连接，避免在各个文件中重复创建连接。

好处：

代码结构清晰

后期方便替换数据库或增加监控

路由和业务逻辑更干净

3️⃣ utils.js —— 通用工具函数

包含两个核心工具：

sha256()：生成 checksum，用于幂等性判断

cleanText()：基础数据清洗（trim + 去多余空格）

体现对数据一致性和稳定性的基本考虑。

4️⃣ importRunner.js —— 导入任务执行核心（最重要）

这是整个系统的业务核心，负责：

将 Job 状态从 PENDING → RUNNING

获取数据源（rawText 或 URL）

解析文本数据

校验数据合法性

使用事务写入导入结果

成功则标记 SUCCESS

出错则捕获错误并标记 FAILED

设计原则：

业务逻辑不写在路由里

状态更新与错误处理统一

防止“导一半成功、一半失败”的脏数据

5️⃣ routes.imports.js —— API 接口定义

定义了所有与导入任务相关的 HTTP 接口，包括：

创建导入任务

运行导入任务

查询任务状态

查看任务列表

查看错误日志

失败任务重试

同时包含一个可选的 API Key 校验中间件，模拟真实内部工具的安全机制。

6️⃣ index.js —— 服务入口

负责：

加载环境变量

初始化 Express

注册 JSON 解析

注册 /imports 路由

提供 /health 健康检查接口

启动 HTTP Server

这是整个应用的启动点。

7️⃣ web/index.html（可选）

一个极简 HTML 页面，用于内部快速查看导入任务列表。

目的不是 UI，而是：

快速验证 API 是否正常

模拟内部运营 / 数据同事的使用方式

五、如何本地启动项目（一步一步）
Step 1：准备 PostgreSQL（推荐 Docker）
docker run --name importpg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=import_tool \
  -p 5432:5432 \
  -d postgres:16

Step 2：配置环境变量
cd server
cp .env.example .env


如有需要，修改 .env 中的数据库地址或 API_KEY。

Step 3：安装依赖
npm install

Step 4：初始化数据库表
npm run db:init

Step 5：启动服务
npm run dev


启动成功后，服务地址为：

http://localhost:8080

六、API 使用示例（快速验证）
1️⃣ 创建导入任务
curl -X POST http://localhost:8080/imports \
  -H "Content-Type: application/json" \
  -H "x-api-key: devkey123" \
  -d '{"rawText":"apple, 12\nbanana, 8"}'

2️⃣ 运行导入任务
curl -X POST http://localhost:8080/imports/1/run \
  -H "x-api-key: devkey123"

3️⃣ 查询任务状态
curl http://localhost:8080/imports/1 \
  -H "x-api-key: devkey123"

七、设计思路总结（给面试官用）

这是一个典型内部工具 API

不追求复杂 UI，而是：

数据流程清晰

可追踪、可重试

可重复导入但不重复写数据

结构上区分：

路由层（HTTP）

业务层（import runner）

数据层（PostgreSQL）

可以非常自然地扩展到：

定时任务

批量数据导入

更复杂的数据校验规则