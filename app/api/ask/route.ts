import { NextResponse } from "next/server";
import pg from "pg";

const { Client } = pg;

const PG_URI = reqEnv("PG_URI");
const WX_URL = reqEnv("WX_URL");
const WX_PROJECT_ID = reqEnv("WX_PROJECT_ID");
const WX_MODEL_ID = process.env.WX_MODEL_ID || "ibm/granite-3-8b-instruct";
const DEFAULT_LIMIT = Number(process.env.DEFAULT_LIMIT || 200);

// -------------------- Utilities --------------------
function reqEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

// Token cache for IBM IAM
let tokenCache = { token: null as string | null, exp: 0 };

async function getIamToken() {
  if (process.env.IAM_TOKEN?.trim()) return process.env.IAM_TOKEN.trim();

  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp - 60 > now) return tokenCache.token;

  const apiKey = process.env.IBM_CLOUD_API_KEY;
  if (!apiKey) throw new Error("Provide either IAM_TOKEN or IBM_CLOUD_API_KEY");

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });
  const data = (await res.json()) as any;

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
    const tables = (await client.query(q)).rows.map((r) => r.table_name);

    if (tables.length === 0) return "/* no tables found */";

    const lines: string[] = [];
    for (const t of tables) {
      const cols = await client.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=$1
        ORDER BY ordinal_position
      `,
        [t]
      );
      lines.push(`TABLE ${t}(${cols.rows.map((r) => r.column_name).join(", ")})`);
    }
    return lines.join("\n");
  } finally {
    await client.end();
  }
}

async function llmChat(messages: any, params: any = {}) {
  const token = await getIamToken();
  const res = await fetch(`${WX_URL}/ml/v1/text/chat?version=2025-02-11`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: WX_MODEL_ID,
      project_id: WX_PROJECT_ID,
      messages,
      parameters: { max_new_tokens: 220, temperature: 0.2, ...params },
    }),
  });
  const data = (await res.json()) as any;

  if (!res.ok) throw new Error(`watsonx error: ${JSON.stringify(data)}`);

  return (
    data?.results?.[0]?.generated_text ||
    data?.choices?.[0]?.message?.content ||
    ""
  );
}

async function llmToSQL(question: string, schema: string) {
  const messages = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: `You are a senior data engineer. Convert user questions into a single, valid, read-only PostgreSQL SELECT query.

Rules:
- Output ONLY SQL. No explanations. No comments.
- Use only tables/columns from this schema:
${schema}
- Prefer explicit JOINs and qualified columns when relevant.
- Use DATE 'YYYY-MM-DD' for dates.
- Always use amount_chf for expenses.
- Categories available: 'Salary/Income','Groceries','Transport & Parking','Fuel','Food & Drinks'.`,
        },
      ],
    },
    { role: "user", content: [{ type: "text", text: question }] },
  ];
  return (await llmChat(messages, { max_new_tokens: 200 })).trim();
}

// function enforceReadOnly(sql: string) {
//   if (!sql) throw new Error("Empty SQL from LLM");
//   let s = sql.trim();

//   const fence =
//   s.match(/```sql([\s\S]*?)```/i) || s.match(/```([\s\S]*?)```/);

//   s = fence?.[1]?.trim() ?? s;



//   if (!/^\s*select\b/i.test(s)) throw new Error("Generated SQL is not a SELECT");
//   if (s.includes(";")) throw new Error("Multiple statements not allowed");
//   const dangerous =
//     /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|analyze|copy|call)\b/i;
//   if (dangerous.test(s)) throw new Error("Non read-only keyword detected");

//   if (!/\blimit\s+\d+\b/i.test(s)) s += ` LIMIT ${DEFAULT_LIMIT}`;
//   if (!s.endsWith(";")) s += ";";
//   return s;
// }
function enforceReadOnly(sql: string) {
  if (!sql) throw new Error("Empty SQL from LLM");
  let s = sql.trim();

  const fence =
    s.match(/```sql([\s\S]*?)```/i) || s.match(/```([\s\S]*?)```/);

  s = fence?.[1]?.trim() ?? s;

  // must start with SELECT
  if (!/^\s*select\b/i.test(s)) throw new Error("Generated SQL is not a SELECT");

  // allow one trailing semicolon but forbid multiple
  s = s.replace(/;$/, "").trim();
  if (s.includes(";")) throw new Error("Multiple statements not allowed");

  // block dangerous keywords
  const dangerous =
    /\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|vacuum|analyze|copy|call)\b/i;
  if (dangerous.test(s)) throw new Error("Non read-only keyword detected");

  // enforce limit
  if (!/\blimit\s+\d+\b/i.test(s)) s += ` LIMIT ${DEFAULT_LIMIT}`;

  // always end with semicolon
  s += ";";

  return s;
}


async function runQuery(sql: string) {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();
  try {
    const res = await client.query(sql);
    return res.rows || [];
  } finally {
    await client.end();
  }
}

async function summarizeAnswer(question: string, safeSql: string, rows: any[]) {
  const sample = JSON.stringify((rows || []).slice(0, 50));
  const messages = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: `You turn SQL result rows into a concise summary for end users.

Guidelines:
- Be accurate and only use numbers from the SQL output.
- Use CHF for money, with thousands separators (CHF 12,345.67).
- If grouped (by category), present a short ranked list (max 5).
- Mention the covered period if dates are included.
- Keep it short: 1–3 sentences + optional bullets.
- If no rows, explain that no data was returned.`,
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Question:
${question}

SQL:
${safeSql}

First rows (JSON):
${sample}

Write a short answer for a non-technical user.`,
        },
      ],
    },
  ];
  return (await llmChat(messages, { max_new_tokens: 220 })).trim();
}

// -------------------- Route --------------------
export async function POST(req: Request) {
  try {
    const body: any = await req.json();
    const question = String(body?.question || "").trim();

    if (!question) {
      return NextResponse.json(
        { error: "Missing 'question'." },
        { status: 400 }
      );
    }

    const schema = await getCompactSchema();
    const rawSql = await llmToSQL(question, schema);
    const safeSql = enforceReadOnly(rawSql);
    const rows = await runQuery(safeSql);

    const summary = await summarizeAnswer(question, safeSql, rows);

    return NextResponse.json({ summary, sql: safeSql, rows });
  } catch (err: any) {
    console.error("/api/ask error:", err);
    return NextResponse.json(
      { error: err.message || String(err) },
      { status: 500 }
    );
  }
}