// RecurringPaymentsCard.tsx
"use client";

import React, { useMemo, useState } from "react";

type Payment = { date: string; amount: number };
type RecurringItem = {
  title: string;          // e.g., "To FRATELLI, ST. GALLEN"
  amount: number;         // e.g., 15.8
  currency: string;       // e.g., "CHF"
  payments: Payment[];    // list of occurrences
};

export default function RecurringPaymentsCard({
  items,
  heading = "Recurring Payments",
}: {
  items: [RecurringItem, RecurringItem]; // exactly 2
  heading?: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function formatMoney(a: number, ccy: string) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: ccy,
        maximumFractionDigits: 2,
      }).format(a);
    } catch {
      return `${ccy} ${a.toFixed(2)}`;
    }
  }

  const halves = useMemo(
    () =>
      items.map((it) => ({
        label: it.title,
        amountLabel: formatMoney(it.amount, it.currency),
      })),
    [items]
  );

  return (
    <>
      <div className="w-full max-w-md rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 text-sm font-semibold">
          {heading}
        </div>
        <div className="grid grid-cols-2 divide-x">
          {halves.map((h, i) => (
            <button
              key={i}
              onClick={() => setOpenIdx(i)}
              className="p-4 text-left hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Show recurring list"
            >
              <div className="text-[11px] uppercase tracking-wide text-gray-500">
                Recurring
              </div>
              <div className="mt-1 text-sm font-medium line-clamp-2">
                {h.label}
              </div>
              <div className="mt-2 text-sm text-gray-700">{h.amountLabel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Simple modal */}
      {openIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpenIdx(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="text-sm font-semibold">
                {items[openIdx].title}
              </div>
              <button
                onClick={() => setOpenIdx(null)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ul className="max-h-80 overflow-auto divide-y text-sm">
              {items[openIdx].payments.map((p, idx) => (
                <li key={idx} className="flex items-center justify-between px-4 py-2">
                  <span className="text-gray-700">
                    {new Date(p.date).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {formatMoney(p.amount, items[openIdx].currency)}
                  </span>
                </li>
              ))}
              {items[openIdx].payments.length === 0 && (
                <li className="px-4 py-6 text-center text-gray-500">
                  No occurrences found.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
