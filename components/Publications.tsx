"use client";

import { useMemo, useState } from "react";
import type { Publication } from "@/lib/db";
import { CopyButton } from "./Effects";

export default function Publications({ items }: { items: Publication[] }) {
  const [q, setQ] = useState("");
  const [year, setYear] = useState<number | "all">("all");
  const years = useMemo(() => Array.from(new Set(items.map((p) => p.year))).sort((a, b) => b - a), [items]);
  const shown = items.filter(
    (p) => (year === "all" || p.year === year) && `${p.citation} ${p.doi ?? ""} ${p.status}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input type="search" placeholder="Search publications…" aria-label="Search publications" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="Filter by year">
          {(["all", ...years] as const).map((y) => (
            <button key={y} className={year === y ? "chip active" : "chip"} onClick={() => setYear(y)}>
              {y === "all" ? "All" : y}
            </button>
          ))}
        </div>
      </div>
      <div className="papers" data-stagger>
        {shown.map((p, i) => {
          const href = p.doi ? `https://doi.org/${p.doi}` : p.url;
          return (
            <article className="paper spot" key={p._id} data-reveal>
              <div className="paper-index" aria-hidden="true">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <span className="tag">{p.status} · {p.year}</span>
                <p>{p.citation}</p>
                <div className="paper-actions">
                  {href && (
                    <a className="doi" href={href} target="_blank" rel="noopener noreferrer">
                      {p.doi ? `DOI: ${p.doi}` : "View publication"} <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  <CopyButton text={p.citation} label="Copy citation" />
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {shown.length === 0 && <p className="empty">No matching publications.</p>}
    </>
  );
}
