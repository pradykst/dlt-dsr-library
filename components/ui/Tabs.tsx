"use client";

import { clsx } from "clsx";

export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (value: string) => void }) {
  return (
    <div className="inline-flex border border-line bg-white p-1">
      {tabs.map((tab) => (
        <button key={tab} onClick={() => onChange(tab)} className={clsx("px-3 py-1.5 text-sm transition", active === tab ? "bg-ink text-white" : "text-muted hover:bg-paper hover:text-ink")}>
          {tab}
        </button>
      ))}
    </div>
  );
}
