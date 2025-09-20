"use client";
import React, { useEffect, useRef, useState } from "react";
import { SidebarInset, SidebarProvider } from "../Shadcn/ui/sidebar";
import { AppSidebar } from "../Shadcn/app-sidebar";
import { SiteHeader } from "../Shadcn/site-header";

type Msg = {
  role: "user" | "assistant";
  text: string;
  sql?: string;
  rows?: Record<string, any>[];
  suggestions?: string[];

};

// const ASK_ENDPOINT = "http://localhost:5050/api/ask";
const ASK_ENDPOINT = "/api/ask";

export default function SqlChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // async function send() {
  //   const question = input.trim();
  //   if (!question || busy) return;
  //   setBusy(true);
  //   setMessages((m) => [...m, { role: "user", text: question }]);
  //   setInput("");

  //   try {
  //     const r = await fetch(ASK_ENDPOINT, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ question }),
  //     });
  //     const j: any = await r.json();
  //     if (!r.ok) throw new Error(j.error || "Request failed");

  //     const answer: Msg = {
  //       role: "assistant",
  //       text: j.summary ?? "No summary returned.",
  //       // Remove sql and rows if you don't want to show them
  //     };
  //     setMessages((m) => [...m, answer]);
  //   } catch (e: any) {
  //     setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${e.message || String(e)}` }]);
  //   } finally {
  //     setBusy(false);
  //   }
  // }
  async function sendText(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: question }]);

    try {
      const r = await fetch(ASK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const j: any = await r.json();
      if (!r.ok) throw new Error(j.error || "Request failed");

      const answer: Msg = {
        role: "assistant",
        text: j.summary ?? "No summary returned.",
        suggestions: Array.isArray(j.suggestions) ? j.suggestions : undefined, // NEW
        // sql: j.sql, rows: j.rows // keep hidden or show if you want
      };
      setMessages((m) => [...m, answer]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", text: `⚠️ ${e.message || String(e)}` }]);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    const question = input.trim();
    setInput("");
    await sendText(question);
  }


  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 42)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
          <div className="flex flex-col border rounded-xl shadow-lg w-full max-w-3xl h-[90vh] bg-white">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-indigo-600 text-white rounded-t-xl">
              <h1 className="text-lg font-semibold">Watsonx Personal Finance Assistant</h1>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} onSuggestClick={(q) => sendText(q)} />
              ))}
              {busy && <TypingIndicator />}
            </div>

            {/* Composer */}
            <div className="p-3 border-t bg-gray-50 rounded-b-xl">
              <div className="flex gap-2">
                <textarea
                  className="flex-1 resize-none rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Ask a question about your transactions…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                />
                <button
                  onClick={send}
                  disabled={busy || !input.trim()}
                  className="shrink-0 h-[42px] px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// function Bubble({ msg }: { msg: Msg }) {
//   const isUser = msg.role === "user";
//   return (
//     <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
//       <div
//         className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${
//           isUser ? "bg-indigo-600 text-white" : "bg-gray-100"
//         }`}
//       >
//         <p className="whitespace-pre-wrap">{msg.text}</p>
//         {/* Remove SQL and rows display */}
//       </div>
//     </div>
//   );
// }
function Bubble({ msg, onSuggestClick }: { msg: Msg; onSuggestClick?: (q: string) => void }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed ${isUser ? "bg-indigo-600 text-white" : "bg-gray-100"
          }`}
      >
        <p className="whitespace-pre-wrap">{msg.text}</p>

        {/* NEW: suggestion buttons for assistant messages */}
        {!isUser && msg.suggestions?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {msg.suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestClick?.(s)}
                className="rounded-full border border-indigo-300 bg-white px-3 py-1 text-xs hover:bg-indigo-50"
                title="Ask this next"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SqlCollapse({ sql }: { sql: string }) {
  return (
    <details className="bg-white rounded-lg border p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-gray-700">
        Show SQL
      </summary>
      <pre className="mt-2 whitespace-pre-wrap">{sql}</pre>
    </details>
  );
}

function RowsTable({ rows }: { rows: Record<string, any>[] }) {
  const cols = Object.keys(rows[0] || {});
  return (
    <div className="border rounded-lg overflow-auto">
      <table className="min-w-[400px] w-full text-xs">
        <thead className="bg-gray-200 sticky top-0">
          <tr>
            {cols.map((c) => (
              <th key={c} className="text-left font-semibold px-3 py-2 border-b">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 border-b align-top">
                  {String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 50 && (
        <div className="p-2 text-[11px] text-gray-500">
          Showing first 50 of {rows.length} rows.
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]" />
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
      </div>
      Thinking…
    </div>
  );
}
