"use client";

import { useEffect, useRef, useState } from "react";

/** Global page effects: scroll progress, reveal-on-scroll, card spotlight + tilt, magnetic buttons. */
export function PageEffects() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const d = document.documentElement;
      const p = d.scrollTop / Math.max(1, d.scrollHeight - d.clientHeight);
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      document.body.classList.toggle("scrolled", d.scrollTop > 40);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Reveal elements as they enter the viewport; children of [data-stagger] get incremental delays.
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    const observe = () =>
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.in)").forEach((el) => {
        const parent = el.parentElement?.closest("[data-stagger]");
        if (parent) el.style.setProperty("--d", `${Array.from(parent.querySelectorAll("[data-reveal]")).indexOf(el) * 70}ms`);
        io.observe(el);
      });
    observe();
    // Lists re-render on search, so watch for new nodes.
    const mo = new MutationObserver(observe);
    mo.observe(document.body, { childList: true, subtree: true });

    // Spotlight + tilt on cards, magnetic pull on buttons.
    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const card = target.closest<HTMLElement>(".spot");
      if (card) {
        const r = card.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        card.style.setProperty("--mx", `${x}px`);
        card.style.setProperty("--my", `${y}px`);
        if (!reduced && card.classList.contains("tilt")) {
          card.style.setProperty("--rx", `${((y / r.height) - 0.5) * -6}deg`);
          card.style.setProperty("--ry", `${((x / r.width) - 0.5) * 6}deg`);
        }
      }
      const mag = target.closest<HTMLElement>(".magnetic");
      if (mag && !reduced) {
        const r = mag.getBoundingClientRect();
        mag.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      }
    };
    const onOut = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const card = t.closest<HTMLElement>(".tilt");
      if (card && !card.contains(e.relatedTarget as Node)) {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      }
      const mag = t.closest<HTMLElement>(".magnetic");
      if (mag && !mag.contains(e.relatedTarget as Node)) mag.style.transform = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerout", onOut);

    return () => {
      removeEventListener("scroll", onScroll);
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onOut);
    };
  }, []);

  return <div ref={bar} className="progress" aria-hidden="true" />;
}

/** Types and erases a rotating list of phrases. */
export function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState(words[0]);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0, n = words[0].length, deleting = true, timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const word = words[i];
      n += deleting ? -1 : 1;
      setText(word.slice(0, n));
      let delay = deleting ? 35 : 70;
      if (!deleting && n === word.length) { deleting = true; delay = 2200; }
      else if (deleting && n === 0) { deleting = false; i = (i + 1) % words.length; delay = 300; }
      timer = setTimeout(tick, delay);
    };
    timer = setTimeout(tick, 2400);
    return () => clearTimeout(timer);
  }, [words]);
  return (
    <span className="typewriter" aria-label={words.join(", ")}>
      <span aria-hidden="true">{text}</span>
      <span className="caret" aria-hidden="true" />
    </span>
  );
}

/** Counts up to `to` when scrolled into view. */
export function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{v}{suffix}</span>;
}

export function CopyButton({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`copy ${done ? "done" : ""} ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}
