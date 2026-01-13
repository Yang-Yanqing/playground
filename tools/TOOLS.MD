你判断得对：一天试工几乎不可能让你把 5 个功能从零到一全部写完。更现实的情况是：

必写：数据接入 API（含最基本鉴权/错误码/分页或 job 查询之一）

加一项重点：外部源对接 / 清洗校验 / 去重幂等 / 状态机 其中 1–2 个

其余可能只是“问你怎么做”或让你补一段关键逻辑

下面我把这 5 个功能各自拆成 “可直接抽取的代码块”。你到时候按题目抽用即可。
技术栈：Node.js + JS + Express + PostgreSQL（pg）。代码默认你已有 pool（pg Pool）与 app（express）。

统一前置：pg pool + 基础中间件（一次性）

这段只需要在项目里放一次，后面 5 个块都能直接用。

const express = require("express");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


一句话解释：用 pg.Pool 做连接池，避免每次请求都新建连接，性能更稳。

1) 数据接入 API（Ingestion API：POST + GET + 分页）

抽这段基本就能应付 “写个 ingestion API + records 列表分页”。

// POST /api/records - 接入一条数据（最小可用版本）
app.post("/api/records", async (req, res) => {
  try {
    const { source, external_id, title, price_cents, url } = req.body || {};
    if (!source || !external_id || !title || !Number.isInteger(price_cents)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const q = `
      INSERT INTO records (source, external_id, title, price_cents, url)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *;
    `;
    const r = await pool.query(q, [source, external_id, title, price_cents, url || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create record" });
  }
});

// GET /api/records?page=1&pageSize=10&source=mock
app.get("/api/records", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 10), 1), 50);
    const source = req.query.source ? String(req.query.source) : null;

    const params = [];
    let where = "";
    if (source) {
      params.push(source);
      where = `WHERE source = $${params.length}`;
    }

    const countR = await pool.query(`SELECT COUNT(*)::int AS count FROM records ${where}`, params);
    const total = countR.rows[0].count;

    params.push(pageSize);
    params.push((page - 1) * pageSize);

    const listQ = `
      SELECT * FROM records
      ${where}
      ORDER BY ingested_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const listR = await pool.query(listQ, params);

    res.json({ page, pageSize, total, records: listR.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list records" });
  }
});


一句话解释：用分页 + 参数化 SQL，避免一次性返回大量数据并防 SQL 注入。

2) 外部数据源对接（Integration：fetch + retry/backoff + mapping）

抽这段就能回答 “外部源不稳定，你怎么拉数据”。

const axios = require("axios");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchWithRetry(url, { retries = 3, baseDelayMs = 200 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await axios.get(url, { timeout: 5000 });
      return resp.data;
    } catch (err) {
      lastErr = err;
      await sleep(baseDelayMs * Math.pow(2, attempt)); // exponential backoff
    }
  }
  throw lastErr;
}

// 外部数据 -> 内部结构（mapping）
function mapExternalToInternal(item, source = "external") {
  return {
    source,
    external_id: String(item.id || "").trim(),
    title: String(item.title || "").trim(),
    price_cents: Math.round(Number(item.price) * 100),
    url: item.url ? String(item.url).trim() : null,
  };
}


一句话解释：外部源会 503/超时，重试 + 指数退避是最低成本、最常见的稳健策略。

3) 数据清洗与验证（Validation & Cleaning：逐条校验 + 错误收集）

抽这段就能应付 “给你一堆脏 JSON/CSV，你怎么处理”。

function normalizeAndValidate(raw, source = "external") {
  const errors = [];

  const external_id = String(raw.id || raw.external_id || "").trim();
  const title = String(raw.title || "").trim();
  const priceNum = Number(String(raw.price || raw.price_cents || "").trim());

  if (!external_id) errors.push("external_id missing");
  if (!title) errors.push("title missing");
  if (!Number.isFinite(priceNum) || priceNum < 0) errors.push("price invalid");

  const record = {
    source,
    external_id,
    title,
    price_cents: raw.price_cents ? Number(raw.price_cents) : Math.round(priceNum * 100),
    url: raw.url ? String(raw.url).trim() : null,
  };

  return { ok: errors.length === 0, errors, record };
}

// 批处理：收集成功/失败
function validateBatch(items, source) {
  const valid = [];
  const invalid = [];

  for (const it of items) {
    const r = normalizeAndValidate(it, source);
    if (r.ok) valid.push(r.record);
    else invalid.push({ candidate: it.id || it.external_id, errors: r.errors });
  }
  return { valid, invalid };
}


一句话解释：真实采集里“脏数据是常态”，必须把坏数据隔离并返回原因，便于定位与修复。

4) 去重与幂等写入（Dedup + Idempotent：upsert + idempotency key）

抽这段就能应付 “重复写入怎么办 / 重复请求怎么办”。

// 4.1 Upsert：external_id UNIQUE -> ON CONFLICT
async function upsertRecord(rec) {
  const q = `
    INSERT INTO records (source, external_id, title, price_cents, url)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (external_id) DO UPDATE SET
      source = EXCLUDED.source,
      title = EXCLUDED.title,
      price_cents = EXCLUDED.price_cents,
      url = EXCLUDED.url,
      ingested_at = NOW()
    RETURNING *;
  `;
  const r = await pool.query(q, [rec.source, rec.external_id, rec.title, rec.price_cents, rec.url]);
  return r.rows[0];
}

// 4.2 幂等 endpoint：用 idempotency_key 确保同一请求不会重复创建 job
app.post("/api/ingest", async (req, res) => {
  const idemKey = String(req.headers["x-idempotency-key"] || "").trim();
  if (!idemKey) return res.status(400).json({ error: "Missing x-idempotency-key" });

  const exists = await pool.query("SELECT * FROM pipeline_jobs WHERE idempotency_key=$1", [idemKey]);
  if (exists.rowCount > 0) {
    return res.status(200).json({ job: exists.rows[0], idempotent: true });
  }

  // ...否则创建新 job（见第5块的状态机代码）
  res.status(201).json({ ok: true, idempotent: false });
});


一句话解释：

去重：DB 层 unique + upsert 最可靠；

幂等：idempotency key 让客户端重试不产生额外副作用。

5) 简化版状态机（Pipeline/Workflow State：PENDING→RUNNING→DONE/FAILED + retry）

抽这段就能应付 “写个 job 状态机/任务系统”。

const { v4: uuidv4 } = require("uuid");

// 创建 job
async function createJob({ source, idempotency_key, requested_limit }) {
  const id = uuidv4();
  const q = `
    INSERT INTO pipeline_jobs (id, source, status, idempotency_key, requested_limit)
    VALUES ($1,$2,'PENDING',$3,$4)
    RETURNING *;
  `;
  const r = await pool.query(q, [id, source, idempotency_key, requested_limit]);
  return r.rows[0];
}

// 更新 job 状态（可附带 error / retry_count）
async function setJob(jobId, status, patch = {}) {
  const fields = ["status=$2", "updated_at=NOW()"];
  const values = [jobId, status];
  let idx = 3;

  for (const [k, v] of Object.entries(patch)) {
    fields.push(`${k}=$${idx++}`);
    values.push(v);
  }
  const q = `UPDATE pipeline_jobs SET ${fields.join(", ")} WHERE id=$1 RETURNING *;`;
  const r = await pool.query(q, values);
  return r.rows[0];
}

// 一个“跑任务”的模板：失败记录 error + retry_count
async function runJob(jobId, fn) {
  await setJob(jobId, "RUNNING");
  try {
    await fn();
    await setJob(jobId, "DONE", { error: null });
  } catch (e) {
    const msg = e.message || "unknown error";
    const cur = await pool.query("SELECT retry_count FROM pipeline_jobs WHERE id=$1", [jobId]);
    const nextRetry = (cur.rows[0]?.retry_count || 0) + 1;
    await setJob(jobId, "FAILED", { retry_count: nextRetry, error: msg });
  }
}


一句话解释：把 ingestion 当成“可观测流程”，状态机让你能监控、重试、定位失败原因。

你试工当天怎么用（最现实的抽法）

让你写 API：直接抽 #1

让你对接外部源：抽 #2（fetchWithRetry + mapping）

让你写清洗校验：抽 #3

让你解决重复：抽 #4

让你做 job 系统：抽 #5