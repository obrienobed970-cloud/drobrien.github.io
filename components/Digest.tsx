"use client";

import { useState } from "react";
import type { DigestPost } from "@/lib/db";

export default function Digest({ items }: { items: DigestPost[] }) {
  const [q, setQ] = useState("");
  const shown = items.filter((p) => `${p.title} ${p.topic} ${p.notes}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="toolbar">
        <label className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <input type="search" placeholder="Search reading recommendations…" aria-label="Search reading recommendations" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      <div className="grid" data-stagger>
        {shown.map((p) => (
          <article className="tile digest spot tilt" key={p._id} data-reveal>
            <span className="tag">{p.topic} · {new Date(p.date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            <h3>{p.title}</h3>
            <p>{p.notes}</p>
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="arrow-link">
              Read original paper <span aria-hidden="true">→</span>
            </a>
          </article>
        ))}
      </div>
      {shown.length === 0 && <p className="empty">{items.length ? "No matching articles." : "New reading recommendations are coming soon."}</p>}
    </>
  );
}
