import 'dotenv/config';
import express from 'express';
import pg from 'pg';

import cors from "cors";


const app = express();

// must be before routes
app.use(express.json());

// --- CORS (dev) ---
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
]);

// helpful for caches/proxies
app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  res.setHeader("Vary", "Origin");
  next();
});

// app.use(
//   cors({
//     origin: (origin, cb) => {
//       if (!origin) return cb(null, true); // curl/Postman or same-origin
//       if (ALLOWED_ORIGINS.has(origin)) return cb(null, true);
//       return cb(new Error("Not allowed by CORS"));
//     },
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: false,
//     optionsSuccessStatus: 204, // send 204 to preflight
//   })
// );
app.use(cors());

// handle bare OPTIONS for all routes
app.options("*", cors());


const { Client } = pg;

const PORT = Number(process.env.PORT || 5050);
const PG_URI = reqEnv('PG_URI');
const WX_URL = reqEnv('WX_URL');
const WX_PROJECT_ID = reqEnv('WX_PROJECT_ID');
const WX_MODEL_ID = process.env.WX_MODEL_ID || 'ibm/granite-3-8b-instruct';
const DEFAULT_LIMIT = Number(process.env.DEFAULT_LIMIT || 200);

// -------------------- Utilities --------------------
function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// Token cache (memory)
let tokenCache = { token: null, exp: 0 }; // exp = epoch seconds

async function getIamToken() {
  // Prefer explicit IAM_TOKEN for quick testing
  if (process.env.IAM_TOKEN?.trim()) return process.env.IAM_TOKEN.trim();

  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp - 60 > now) return tokenCache.token;

  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) throw new Error('Provide either IAM_TOKEN or IBM_CLOUD_API_KEY');

  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`IAM error: ${JSON.stringify(data)}`);

  tokenCache = { token: data.access_token, exp: data.expiration || now + 3600 };
  return tokenCache.token;
}

async function getCompactSchema() {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();
  try {
    const q = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE'
      ORDER BY table_name;
    `;
    const tables = (await client.query(q)).rows.map(r => r.table_name);

    if (tables.length === 0) return '/* no tables found */';

    const lines = [];
    for (const t of tables) {
      const cols = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1
        ORDER BY ordinal_position
      `, [t]);
      lines.push(`TABLE ${t}(${cols.rows.map(r => r.column_name).join(', ')})`);
    }
    return lines.join('\n');
  } finally {
    await client.end();
  }
}

async function llmChat(messages, params = {}) {
  const token = await getIamToken();
  const res = await fetch(`${WX_URL}/ml/v1/text/chat?version=2025-02-11`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model_id: WX_MODEL_ID,
      project_id: WX_PROJECT_ID,
      messages,
      parameters: { max_new_tokens: 220, temperature: 0.2, ...params }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`watsonx error: ${JSON.stringify(data)}`);

  // IBM responses can be in .results[0].generated_text or .choices[0].message.content
  return data?.results?.[0]?.generated_text || data?.choices?.[0]?.message?.content || '';
}

async function llmToSQL(question, schema) {
  const messages = [
    {
      role: 'system',
      content: [{
        type: 'text',
        text:
`You are a senior data engineer. Convert user questions into a single, valid, read-only PostgreSQL SELECT query.

Rules:
- Output ONLY SQL. No explanations. No comments.
- Use only tables/columns from this schema:
${schema}
- Output ONLY the SQL, no explanations, no comments.\n
- Use only columns from the provided schema.\n
- Prefer explicit JOINs and qualified columns (table.column) when relevant.\n
- Dates must use correct literals (DATE 'YYYY-MM-DD').\n
- Do NOT filter by trx_type_short .\n\n
- Always calculate expenses using the column name amount_chf .\n\n
- Only if the user asks about categorizing expenses: Categories available are 'Salary/Income', 'Groceries','Transport & Parking','Fuel','Food & Drinks'. If the question asks for such a category, identify the relevant category from this list. If unclear, ask the user to ask again while specifying one of the abovementioned categories.\n\n

- For months/quarters, always use full ranges:
  month:  trx_date >= DATE 'YYYY-MM-01' AND trx_date < DATE 'YYYY-(MM+1)-01'
  quarter: date_trunc('quarter', trx_date) with < next quarter
- 'IN' = inflow, 'OUT' = outflow via trx_type_short.`
      }]
    },
    { role: 'user', content: [{ type: 'text', text: question }] }
  ];
  return (await llmChat(messages, { max_new_tokens: 200 })).trim();
}

function widenSingleDayIfMonthQuestion(sql, question) {
  // If question mentions a month and SQL equals the 1st day, widen to month range
  const monthWords = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i;
  if (!monthWords.test(question)) return sql;

  const m = sql.match(/trx_date\s*=\s*DATE\s*'(\d{4})-(\d{2})-01'/i);
  if (!m) return sql;

  const year = m[1], mm = m[2];
  const nextMonth = String(((+mm) % 12) + 1).padStart(2, '0');
  const nextYear  = mm === '12' ? String(+year + 1) : year;
  const range = `trx_date >= DATE '${year}-${mm}-01' AND trx_date < DATE '${nextYear}-${nextMonth}-01'`;
  return sql.replace(/trx_date\s*=\s*DATE\s*'\d{4}-\d{2}-01'/i, range);
}

function enforceReadOnly(sql) {
  if (!sql) throw new Error('Empty SQL from LLM');
  let s = sql.trim();
  // extract fenced code if present
  const fence = s.match(/```sql([\s\S]*?)```/i) || s.match(/```([\s\S]*?)```/);
  if (fence) s = fence[1].trim();

  s = s.replace(/^;+|;+$/g, '').trim();
  if (!/^\s*select\b/i.test(s)) throw new Error('Generated SQL is not a SELECT');
  if (s.includes(';')) throw new Error('Multiple statements not allowed');
  const dangerous = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|analyze|copy|call)\b/i;
  if (dangerous.test(s)) throw new Error('Non read-only keyword detected');

  // Normalize possible inflow/outflow words
  s = s.replace(/\btrx_type_short\s*=\s*'outflow'\b/gi, "trx_type_short = 'OUT'")
       .replace(/\btrx_type_short\s*=\s*'inflow'\b/gi,   "trx_type_short = 'IN'");

  if (!/\blimit\s+\d+\b/i.test(s)) s += ` LIMIT ${DEFAULT_LIMIT}`;
  if (!s.endsWith(';')) s += ';';
  return s;
}

async function runQuery(sql) {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();
  try {
    const res = await client.query(sql);
    return res.rows || [];
  } finally {
    await client.end();
  }
}

async function summarizeAnswer(question, safeSql, rows) {
  const sample = JSON.stringify((rows || []).slice(0, 50));
  const messages = [
    {
      role: 'system',
      content: [{
        type: 'text',
        text:
`You turn SQL result rows into a concise summary for end users.

Guidelines:
- Be accurate and faithful to the numbers provided and only use numbers from the SQL output.
- Use CHF for money, with thousands separators (e.g., CHF 12,345.67).
- If the result is grouped (e.g., by category) and only if more than one group exists, present a short ranked list (max 5 items).
- If dates are in the SQL, mention the covered period explicitly.
- Keep it brief: 1–3 sentences plus an optional bullet list.
- If no rows, explain that the query returned no data for the requested period/filters.` 

      }]
    },
    {
      role: 'user',
      content: [{
        type: 'text',
        text:
`Question:
${question}

SQL:
${safeSql}

First rows (JSON):
${sample}

Write a short answer for a non-technical user.`
      }]
    }
  ];
  return (await llmChat(messages, { max_new_tokens: 220 })).trim();
}

// -------------------- Routes --------------------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/ask', async (req, res) => {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question) return res.status(400).json({ error: "Missing 'question'." });

    // 1) Schema
    const schema = await getCompactSchema();

    // 2) LLM → SQL
    const rawSql = await llmToSQL(question, schema);
    const widened = widenSingleDayIfMonthQuestion(rawSql, question);
    const safeSql = enforceReadOnly(widened);

    // 3) Execute
    const rows = await runQuery(safeSql);

    // 4) Summarize
    const summary = await summarizeAnswer(question, safeSql, rows);

    return res.json({ summary, sql: safeSql, rows });
  } catch (err) {
    const msg = err?.message || String(err);
    return res.status(400).json({ error: msg });
  }
});

// -------------------- Start --------------------
app.listen(PORT, () => {
  console.log(`✅ API listening on http://localhost:${PORT}`);
});
