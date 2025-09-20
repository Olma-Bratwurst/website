// components/MultiMonthBudgetPlanner.tsx
"use client";
import React, { useMemo, useState } from "react";

type Row = { item: string; date: string; amount: number };
type MonthKey = string; // e.g., "2025-08"

export default function BudgetPlannerWidget({
  currency = "CHF",
}: {
  currency?: string;
}) {
  const now = new Date();
  const year = now.getFullYear();
  

  // Months Aug–Nov of current year
  const monthDefs = [
    { label: "August",    key: ymKey(year, 7) },
    { label: "September", key: ymKey(year, 8) },
    { label: "October",   key: ymKey(year, 9) },
    { label: "November",  key: ymKey(year, 10) },
  ];

  // Mock data per month
  const [dataByMonth, setDataByMonth] = useState<Record<MonthKey, Row[]>>({
    [ymKey(year, 7)]: [
      { item: "Coffee",   date: isoForDay(year, 7, 3),  amount: 14.2 },
      { item: "Groceries",date: isoForDay(year, 7, 12), amount: 180.0 },
      { item: "Gym",      date: isoForDay(year, 7, 22), amount: 59.0 },
    ],
    [ymKey(year, 8)]: [
      { item: "Rent",     date: isoForDay(year, 8, 1),  amount: 1800.0 },
      { item: "Books",    date: isoForDay(year, 8, 7),  amount: 85.5 },
    ],
    [ymKey(year, 9)]: [
      { item: "Birthday", date: isoForDay(year, 9, 14), amount: 120.0 },
      { item: "Fuel",     date: isoForDay(year, 9, 18), amount: 65.75 },
      { item: "Dining",   date: isoForDay(year, 9, 25), amount: 48.9 },
    ],
    [ymKey(year, 10)]: [
      { item: "Travel",   date: isoForDay(year, 10, 10), amount: 350.0 },
    ],
  });

  // Selected month (default to current if within Aug–Nov, else September)
  const defaultKey =
    monthDefs.find((m) => m.key === ymKey(year, now.getMonth()))?.key ??
    ymKey(year, 8);
  const [activeKey, setActiveKey] = useState<MonthKey>(defaultKey);

  // Add-row inputs
  const [newItem, setNewItem] = useState("");
  const [newDate, setNewDate] = useState(isoForDay(year, keyToMonth(activeKey), 15));
  const [newAmount, setNewAmount] = useState("");

  // Search within selected month
  const [query, setQuery] = useState("");

  const activeRows = dataByMonth[activeKey] ?? [];
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeRows;
    return activeRows.filter((r) => r.item.toLowerCase().includes(q));
  }, [activeRows, query]);

  const monthLabel = monthDefs.find((m) => m.key === activeKey)?.label ?? "";
  const wantToSpendOn = useMemo(() => {
    const names = activeRows.map((r) => r.item).filter(Boolean);
    return names.length ? names.join(", ") : "—";
  }, [activeRows]);

  const totalForMonth = useMemo(
    () => formatMoney(sum(activeRows.map((r) => r.amount)), currency),
    [activeRows, currency]
  );
  const filteredTotal = useMemo(
    () => formatMoney(sum(filteredRows.map((r) => r.amount)), currency),
    [filteredRows, currency]
  );

  function addRow() {
    const amt = Number(newAmount);
    if (!newItem.trim()) return;
    if (!newDate) return;
    if (!Number.isFinite(amt) || amt <= 0) return;

    const m = keyToMonth(activeKey);
    // Force date into selected month (for nice UX)
    const safeDate = clampDateToMonth(newDate, year, m);

    setDataByMonth((prev) => ({
      ...prev,
      [activeKey]: [...(prev[activeKey] ?? []), { item: newItem.trim(), date: safeDate, amount: round2(amt) }],
    }));

    setNewItem("");
    setNewAmount("");
    // keep date as-is for quicker consecutive adds
  }

  function removeRow(idx: number) {
    setDataByMonth((prev) => ({
      ...prev,
      [activeKey]: (prev[activeKey] ?? []).filter((_, i) => i !== idx),
    }));
  }

  function switchMonth(key: MonthKey) {
    setActiveKey(key);
    setQuery("");
    setNewDate(isoForDay(year, keyToMonth(key), 15));
  }

  return (
    <div className="w-full rounded-xl border bg-white shadow-lg ">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 rounded-t-xl w-full">
        <h2 className="text-sm font-semibold text-gray-800">
          In the month of {monthLabel} {year}, I want to spend on:
          {/* <span className="font-normal text-gray-700">{wantToSpendOn}</span> */}
        </h2>
      </div>

      {/* Month tabs */}
      <div className="w-full px-4 pt-3">
        <div className="flex gap-2 flex-wrap w-full">
          {monthDefs.map((m) => (
            <button
              key={m.key}
              onClick={() => switchMonth(m.key)}
              className={
                "rounded-lg px-3 py-1.5 text-sm border " +
                (m.key === activeKey
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 hover:bg-gray-50")
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items in this month…"
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="p-4">
        <div className="overflow-auto rounded-lg border">
          <table className="min-w-[500px]  text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left font-semibold px-3 py-2 border-b w-1/2">Item</th>
                <th className="text-left font-semibold px-3 py-2 border-b w-1/4">Date</th>
                <th className="text-right font-semibold px-3 py-2 border-b w-1/4">Amount</th>
                <th className="px-2 py-2 border-b w-[44px]" />
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  <td className="px-3 py-2 border-b">{r.item}</td>
                  <td className="px-3 py-2 border-b">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 border-b text-right tabular-nums">
                    {formatMoney(r.amount, currency)}
                  </td>
                  <td className="px-2 py-2 border-b text-right">
                    <button
                      className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => removeRow(indexInActiveRows(activeRows, filteredRows, i))}
                      aria-label={`Remove ${r.item}`}
                      title="Remove"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}

              {/* add-row inputs */}
              <tr className="bg-white">
                <td className="px-3 py-2 border-t">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="e.g., Groceries"
                    className="w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2 border-t">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-3 py-2 border-t">
                  <input
                    inputMode="decimal"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-md border px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </td>
                <td className="px-2 py-2 border-t text-right">
                  <button
                    onClick={addRow}
                    className="rounded-md bg-indigo-600 text-white text-xs font-medium px-3 py-2 hover:bg-indigo-700 disabled:opacity-50"
                    disabled={!newItem.trim() || !newDate || !newAmount || Number(newAmount) <= 0}
                  >
                    Add
                  </button>
                </td>
              </tr>
            </tbody>

            {/* footer totals */}
            <tfoot>
              <tr>
                <td className="px-3 py-2 text-right font-semibold" colSpan={2}>
                  Total (month)
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totalForMonth}
                </td>
                <td />
              </tr>
              {query.trim() && (
                <tr>
                  <td className="px-3 py-2 text-right font-semibold" colSpan={2}>
                    Total (filtered)
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {filteredTotal}
                  </td>
                  <td />
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Demo only: data is in-memory and won’t persist after refresh.
        </p>
      </div>
    </div>
  );
}

/* ---------------- helpers ---------------- */
function formatMoney(a: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(a);
  } catch {
    return `${currency} ${a.toFixed(2)}`;
  }
}
function sum(nums: number[]) {
  return nums.reduce((acc, n) => acc + (Number.isFinite(n) ? n : 0), 0);
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function ymKey(year: number, monthIndex: number): MonthKey {
  // monthIndex: 0=Jan ... 11=Dec
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}
function keyToMonth(key: MonthKey): number {
  return Number(key.slice(5, 7)) - 1;
}
function isoForDay(year: number, monthIndex: number, day: number) {
  const d = new Date(year, monthIndex, day);
  return d.toISOString().slice(0, 10);
}
function clampDateToMonth(iso: string, year: number, monthIndex: number) {
  // Keep day from user input, but clamp to the selected month/year
  const input = new Date(iso);
  const day = input.getDate();
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(1, day), lastDay);
  return isoForDay(year, monthIndex, safeDay);
}
function indexInActiveRows(all: Row[], filtered: Row[], filteredIdx: number) {
  // Map filtered index back to index in the full active array (for removal)
  const target = filtered[filteredIdx];
  // Find by identity match on first occurrence
  const idx = all.findIndex((r) => r === target);
  return idx >= 0 ? idx : filteredIdx; // fallback
}
