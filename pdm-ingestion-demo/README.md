📦 Data Ingestion Demo

这是一个最小可用的数据采集 / 清洗 / 入库 / 查询工具（MVP），用于演示在一天时间内如何实现一个可重复导入、可去重、可追溯的数据 ingestion 流程。

项目重点不在爬虫技巧，而在于：

数据是否可重复导入（幂等）

是否正确处理重复数据

是否有基础的数据清洗

数据库 schema 是否合理

错误是否被控制，不影响整批导入

是否能提供查询接口验证结果

🎯 项目目标

实现一个端到端的数据处理流程：

从 CSV / JSON 文件导入数据

对原始数据做基础清洗与规范化

将数据存入 PostgreSQL

支持重复导入不产生重复数据

记录每一次导入的统计信息

提供 API 查询接口

提供一个最简单的前端界面用于验证流程

🧱 技术栈
后端

Node.js

Express

PostgreSQL

Docker（仅用于数据库，保证可复现）

pg（数据库连接）

multer（文件上传）

csv-parse（CSV 解析）

前端

React

Vite

原生 fetch（不引入多余依赖）

📁 项目结构说明
pdm-ingestion-demo/
├── backend/              # 后端服务
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── package.json
│   ├── db/
│   │   └── init.sql      # 数据库表结构初始化
│   └── src/
│       ├── server.js     # Express 主入口
│       ├── db.js         # PostgreSQL 连接池
│       └── ingest/
│           ├── clean.js      # 数据清洗逻辑
│           ├── parseCsv.js   # CSV 解析
│           └── parseJson.js  # JSON 解析
│
├── frontend/             # 前端界面
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       └── App.jsx       # 上传 + 列表展示
│
└── README.md

🚀 启动方式（非常重要）
1️⃣ 启动数据库（Docker）
cd backend
docker compose up -d


这一步会启动一个 PostgreSQL 容器，并自动执行 db/init.sql 初始化表结构。

2️⃣ 启动后端 API
cd backend
cp .env.example .env
npm install
npm run dev


验证后端是否正常：

curl http://localhost:5000/health


返回：

{ "ok": true }

3️⃣ 启动前端
cd frontend
npm install
npm run dev


浏览器访问：

http://localhost:5173

🧠 后端核心设计说明（面试重点）
数据表设计（db/init.sql）
items 表

用于存储清洗后的业务数据。

关键点：

(source, external_id) 唯一约束

保证同一来源的数据可重复导入（幂等）

raw 字段保留原始数据，方便未来扩展

UNIQUE (source, external_id)

ingest_runs 表

用于记录每一次导入的统计信息。

作用：

可追溯每一批数据导入

方便排错与审计

面试中可以解释为“数据治理意识”

数据清洗（clean.js）
cleanRow(input)


职责：

trim 字符串

统一价格格式（转为 cents）

校验必填字段

不合格数据直接跳过，不影响整体流程

设计原则：

清洗逻辑必须可解释、可预测、可复用

数据导入接口（POST /api/ingest）

流程：

接收 CSV / JSON 文件

解析为行数据

对每一行进行清洗

使用 INSERT ... ON CONFLICT DO UPDATE

统计插入 / 更新 / 跳过数量

记录 ingest run

返回导入结果

为什么用 UPSERT：

保证重复导入不会生成重复数据

数据源可以随时重跑

非常贴近真实生产场景

查询接口（GET /api/items）

支持：

分页

按 source 过滤

按更新时间排序

用途：

验证导入结果

为后续系统提供基础查询能力

🖥 前端说明

前端是极简验证 UI，目标不是美观，而是：

验证 ingestion 是否成功

快速展示导入结果

给面试官一个完整的端到端体验

功能

输入 source

上传 CSV / JSON 文件

显示导入统计结果

拉取并展示 items 列表

🧪 如何验证“可重复导入”

上传同一个文件

查看返回结果：

inserted_rows 第一次较多

第二次应主要是 updated_rows

数据库中不会出现重复记录

🔍 示例数据格式
CSV
external_id,name,price,currency
A001,Apple,1.20,EUR
A002,Banana,0.89,EUR

JSON
[
  { "external_id": "J001", "name": "Coffee", "price": 3.40, "currency": "EUR" }
]

🧩 设计取舍说明（试工非常加分）

❌ 没有做复杂校验框架（避免过度设计）

❌ 没有引入 ORM（pg + SQL 更直观）

✅ 数据库层保证幂等，比应用层更可靠

✅ 清洗与解析逻辑模块化，方便扩展

✅ 使用 Docker 保证环境一致性

✅ 总结

该项目在极短时间内实现了一个：

可运行

可复现

可解释

可扩展

的数据采集工具原型，重点体现的是数据工程思维而不是堆砌技术。