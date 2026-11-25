"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["about", "Overview"],
  ["research", "Research"],
  ["publications", "Publications"],
  ["digest", "Digest"],
  ["experience", "CV"],
  ["contact", "Contact"],
] as const;

export default function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <header className="site-header">
      <nav>
        <a className="brand" href="#home" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32"><path d="M16 3 27 9.5v13L16 29 5 22.5v-13Z" /><circle cx="16" cy="16" r="4" /></svg>
          </span>
          <span>O’Brien Z. Obed<span className="brand-phd">, PhD</span></span>
        </a>
        <button className={`menu-btn ${open ? "open" : ""}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={active === id ? "active" : ""} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
