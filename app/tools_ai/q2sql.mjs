// q2sql.mjs
import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

// ---------- Config ----------
const WX_URL        = process.env.WX_URL || 'https://eu-de.ml.cloud.ibm.com';
const WX_PROJECT_ID = reqEnv('WX_PROJECT_ID');
const WX_MODEL_ID   = process.env.WX_MODEL_ID || 'ibm/granite-3-8b-instruct';
const PG_URI        = reqEnv('PG_URI');
const DEFAULT_LIMIT = Number(process.env.DEFAULT_LIMIT || 200);

// ---------- Helpers ----------
function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// Prefer a provided token (fast manual tests); otherwise exchange API key.
async function getIamToken() {
  if (process.env.IAM_TOKEN?.trim()) return process.env.IAM_TOKEN.trim();
  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) throw new Error('Provide IAM_TOKEN or IBM_CLOUD_API_KEY');
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: apiKey
    })
  });
  if (!res.ok) throw new Error(`IAM token error: ${await res.text()}`);
  const j = await res.json();
  return j.access_token;
}

// Build compact schema for prompt (only the transactions table; expand if needed)
async function getCompactSchema() {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();
  try {
    const q = `
      SELECT column_name,
             data_type
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='transactions'
      ORDER BY ordinal_position;
    `;
    const { rows } = await client.query(q);
    if (!rows.length) return 'TABLE transactions(/* no columns found */)';
    const cols = rows.map(r => `${r.column_name}`).join(', ');
    return `TABLE transactions(${cols})`;
  } finally {
    await client.end();
  }
}

// Call watsonx.ai chat → get SQL only
async function llmToSQL(question, schema) {
  const token = await getIamToken();
  const payload = {
    model_id: WX_MODEL_ID,
    project_id: WX_PROJECT_ID,
    messages: [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text:
              `You are a senior data engineer. Convert user questions into a single, valid, read-only PostgreSQL SELECT query.\n` +
              `Rules:\n` +
              `- Output ONLY the SQL, no explanations, no comments.\n` +
              `- Use only columns from the provided schema.\n` +
              `- Prefer explicit JOINs and qualified columns (table.column) when relevant.\n` +
              `- Dates must use correct literals (DATE 'YYYY-MM-DD').\n` +
              `- Do not filter by trx_type_short .\n\n` +
              `- Always calculate expenses using the column name amount_chf .\n\n` +
                `- Only if the user asks about categorizing expenses: Categories available are 'Salary/Income', 'Groceries','Transport & Parking','Fuel','Food & Drinks'. If the question asks for such a category, identify the relevant category from this list. If unclear, ask the user to ask again while specifying one of the abovementioned categories.\n\n` +

              `Schema:\n${schema}`
          }
        ]
      },
      { role: 'user', content: [{ type: 'text', text: question }] }
    ],
    parameters: { max_new_tokens: 200, temperature: 0.2 }
  };

  const res = await fetch(`${WX_URL}/ml/v1/text/chat?version=2025-02-11`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  // IBM responses can be in data.results[0].generated_text or choices[0].message.content
  let sql = data?.results?.[0]?.generated_text
         || data?.choices?.[0]?.message?.content
         || '';
  sql = (sql || '').trim();

  // Some models return extra prose; try to extract SQL block if present
  const fence = sql.match(/```sql([\s\S]*?)```/i) || sql.match(/```([\s\S]*?)```/);
  if (fence) sql = fence[1].trim();

  return sql;
}

// Enforce read-only + add LIMIT if missing
function enforceReadOnly(sql) {
  if (!sql) throw new Error('Empty SQL from LLM');
  let s = sql.trim();

  // remove leading/trailing fences or stray semicolons
  s = s.replace(/^;+|;+$/g, '').trim();

  // must be a single SELECT
  if (!/^\s*select\b/i.test(s)) throw new Error('Generated SQL is not a SELECT');
  if (s.includes(';')) throw new Error('Multiple statements not allowed');

  const dangerous = /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|analyze|copy|call)\b/i;
  if (dangerous.test(s)) throw new Error('Non read-only keyword detected');

  // normalize common direction values (model sometimes outputs lowercase/variants)
  s = s.replace(/\btrx_type_short\s*=\s*'outflow'\b/gi, "trx_type_short = 'OUT'")
       .replace(/\btrx_type_short\s*=\s*'inflow'\b/gi,   "trx_type_short = 'IN'");

  // add LIMIT if not present and it's a SELECT that could explode
  if (!/\blimit\s+\d+\b/i.test(s)) s = `${s} LIMIT ${DEFAULT_LIMIT}`;

  // final semicolon
  return s.endsWith(';') ? s : s + ';';
}

// Execute and print results
async function runQuery(sql) {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();
  try {
    const res = await client.query(sql);
    // Print a nice table (falls back if huge)
    const rows = res.rows || [];
    if (rows.length === 0) {
      console.log('\n📭 No rows returned.');
    } else {
      // show up to first 200 rows in console
      const max = Math.min(rows.length, 200);
      console.log(`\n📊 Rows (${max}${rows.length > max ? ` of ${rows.length}` : ''}):`);
      console.table(rows.slice(0, max));
    }
  } finally {
    await client.end();
  }
}

async function summarizeAnswer({ question, sql, rows }) {
  const token = await getIamToken(); // same function you already have

  // Keep payload small: cap rows & stringify
  const MAX_ROWS_FOR_SUMMARY = 50;
  const sample = Array.isArray(rows) ? rows.slice(0, MAX_ROWS_FOR_SUMMARY) : [];
  const sampleJson = JSON.stringify(sample);

  const messages = [
    {
      role: 'system',
      content: [
        { type: 'text', text:
`You turn SQL query results into concise, helpful, non-technical language for end users.

Guidelines:
- Be accurate and faithful to the numbers provided and only use numbers from the SQL output.
- Use CHF for money, with thousands separators (e.g., CHF 12,345.67).
- If the result is grouped (e.g., by category) and only if more than one group exists, present a short ranked list (max 5 items).
- If dates are in the SQL, mention the covered period explicitly.
- Keep it brief: 1–3 sentences plus an optional bullet list.
- If no rows, explain that the query returned no data for the requested period/filters.` }
      ]
    },
    {
      role: 'user',
      content: [
        { type: 'text', text:
`Question:
${question}

SQL (for context):
${sql}

First ${Math.min(MAX_ROWS_FOR_SUMMARY, sample.length)} rows of results (JSON):
${sampleJson}

Please write a short answer for a non-technical user.` }
      ]
    }
  ];

  const res = await fetch(`${WX_URL}/ml/v1/text/chat?version=2025-02-11`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model_id: WX_MODEL_ID,
      project_id: WX_PROJECT_ID,
      messages,
      parameters: { max_new_tokens: 220, temperature: 0.2 }
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  // Support both response shapes IBM may return
  return data?.results?.[0]?.generated_text
      || data?.choices?.[0]?.message?.content
      || '';
}


// ---------- Main ----------
const question = process.argv.slice(2).join(' ') || 'Total CHF outflows in 2025';
const schema = await getCompactSchema();

console.log('🔧 Using schema:\n' + schema);
console.log('\n❓ Question:\n' + question);

const rawSql = await llmToSQL(question, schema).catch(e => { throw new Error('LLM error: ' + e.message); });
const safeSql = enforceReadOnly(rawSql);

console.log('\n📝 Generated SQL:\n' + safeSql);

// Execute and capture rows
const client = new Client({ connectionString: PG_URI });
await client.connect();
let rows = [];
try {
  const result = await client.query(safeSql);
  rows = result.rows || [];
} finally {
  await client.end();
}

// Print raw rows (optional)
if (rows.length === 0) {
  console.log('\n📭 No rows returned.');
} else {
  console.log(`\n📊 Rows (${Math.min(rows.length, 200)}${rows.length > 200 ? ` of ${rows.length}` : ''}):`);
  console.table(rows.slice(0, 200));
}

// Ask LLM for the human summary
const summary = await summarizeAnswer({ question, sql: safeSql, rows });
console.log('\n🗣️ Summary:\n' + summary);
