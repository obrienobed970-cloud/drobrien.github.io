"use client";

import { useEffect, useRef } from "react";

/**
 * Full-bleed canvas of slowly drifting, rotating molecules. Molecules are
 * pushed away from the pointer, and nearby atoms link to the pointer with
 * faint "bond" lines.
 */

type Atom = { x: number; y: number; el: "C" | "O" | "H" | "N" };
type Bond = [number, number, number?]; // [a, b, order]
type Template = { atoms: Atom[]; bonds: Bond[] };

const R = 1; // unit bond length
const hex = (i: number) => ({ x: Math.cos((Math.PI / 3) * i - Math.PI / 2) * R, y: Math.sin((Math.PI / 3) * i - Math.PI / 2) * R });

const TEMPLATES: Template[] = [
  // benzene
  {
    atoms: [0, 1, 2, 3, 4, 5].map((i) => ({ ...hex(i), el: "C" as const })),
    bonds: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5, 2], [5, 0]],
  },
  // water
  { atoms: [{ x: 0, y: 0, el: "O" }, { x: -0.8, y: 0.6, el: "H" }, { x: 0.8, y: 0.6, el: "H" }], bonds: [[0, 1], [0, 2]] },
  // carbon dioxide
  { atoms: [{ x: -1.1, y: 0, el: "O" }, { x: 0, y: 0, el: "C" }, { x: 1.1, y: 0, el: "O" }], bonds: [[0, 1, 2], [1, 2, 2]] },
  // methane
  {
    atoms: [{ x: 0, y: 0, el: "C" }, { x: 0, y: -1, el: "H" }, { x: 0.95, y: 0.35, el: "H" }, { x: -0.95, y: 0.35, el: "H" }, { x: 0, y: 0.9, el: "H" }],
    bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
  },
  // glycerol backbone (C3 with three OH)
  {
    atoms: [
      { x: -1.2, y: 0.4, el: "C" }, { x: 0, y: -0.3, el: "C" }, { x: 1.2, y: 0.4, el: "C" },
      { x: -2.3, y: -0.2, el: "O" }, { x: 0, y: -1.6, el: "O" }, { x: 2.3, y: -0.2, el: "O" },
    ],
    bonds: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5]],
  },
  // phenol
  {
    atoms: [...[0, 1, 2, 3, 4, 5].map((i) => ({ ...hex(i), el: "C" as const })), { x: 0, y: -2, el: "O" }],
    bonds: [[0, 1, 2], [1, 2], [2, 3, 2], [3, 4], [4, 5, 2], [5, 0], [0, 6]],
  },
  // ammonia
  { atoms: [{ x: 0, y: 0, el: "N" }, { x: -0.9, y: 0.5, el: "H" }, { x: 0.9, y: 0.5, el: "H" }, { x: 0, y: -1, el: "H" }], bonds: [[0, 1], [0, 2], [0, 3]] },
];

const COLORS: Record<Atom["el"], string> = { C: "#34d399", O: "#bef264", H: "#d1fae5", N: "#5eead4" };
const RADII: Record<Atom["el"], number> = { C: 0.26, O: 0.28, H: 0.16, N: 0.27 };

type Mol = { t: Template; x: number; y: number; vx: number; vy: number; a: number; va: number; s: number; z: number };

export default function MoleculeField({ density = 1, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true;
    let mols: Mol[] = [];
    const pointer = { x: -9999, y: -9999, active: false };

    function spawn(): Mol {
      const z = 0.35 + Math.random() * 0.65; // depth: smaller, slower and dimmer when far
      return {
        t: TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)],
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * z,
        vy: (Math.random() - 0.5) * 0.35 * z,
        a: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.004,
        s: (14 + Math.random() * 14) * z,
        z,
      };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(42, (w * h) / 26000) * density);
      while (mols.length < count) mols.push(spawn());
      mols.length = count;
      mols.sort((a, b) => a.z - b.z);
      if (reduced) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const near: { x: number; y: number; d: number }[] = [];

      for (const m of mols) {
        if (!reduced) {
          // pointer repulsion
          const dx = m.x - pointer.x, dy = m.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (pointer.active && d2 < 160 * 160) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / 160) * 0.6 * m.z;
            m.vx += (dx / d) * f;
            m.vy += (dy / d) * f;
            m.va += 0.0006 * Math.sign(dx);
          }
          m.vx *= 0.985;
          m.vy *= 0.985;
          // keep a gentle minimum drift
          const sp = Math.hypot(m.vx, m.vy);
          if (sp < 0.12 * m.z) { m.vx += (Math.random() - 0.5) * 0.03; m.vy += (Math.random() - 0.5) * 0.03; }
          m.va = Math.max(-0.01, Math.min(0.01, m.va * 0.995));
          m.x += m.vx;
          m.y += m.vy;
          m.a += m.va;
          const pad = m.s * 3;
          if (m.x < -pad) m.x = w + pad; else if (m.x > w + pad) m.x = -pad;
          if (m.y < -pad) m.y = h + pad; else if (m.y > h + pad) m.y = -pad;
        }

        const cos = Math.cos(m.a), sin = Math.sin(m.a);
        const pts = m.t.atoms.map((at) => ({
          x: m.x + (at.x * cos - at.y * sin) * m.s,
          y: m.y + (at.x * sin + at.y * cos) * m.s,
          el: at.el,
        }));

        ctx.globalAlpha = 0.25 + m.z * 0.55;
        ctx.strokeStyle = "rgba(167, 243, 208, 0.55)";
        ctx.lineWidth = 1.4 * m.z;
        for (const [i, j, order = 1] of m.t.bonds) {
          const a = pts[i], b = pts[j];
          if (order === 2) {
            const nx = -(b.y - a.y), ny = b.x - a.x;
            const len = Math.hypot(nx, ny) || 1;
            const o = 2.2 * m.z;
            for (const k of [-1, 1]) {
              ctx.beginPath();
              ctx.moveTo(a.x + (nx / len) * o * k, a.y + (ny / len) * o * k);
              ctx.lineTo(b.x + (nx / len) * o * k, b.y + (ny / len) * o * k);
              ctx.stroke();
            }
          } else {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        for (const p of pts) {
          const r = RADII[p.el] * m.s;
          ctx.beginPath();
          ctx.fillStyle = COLORS[p.el];
          ctx.shadowColor = COLORS[p.el];
          ctx.shadowBlur = 10 * m.z;
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          if (pointer.active) {
            const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
            if (d < 190) near.push({ x: p.x, y: p.y, d });
          }
        }
      }

      // pointer "bonds"
      ctx.globalAlpha = 1;
      for (const n of near) {
        ctx.strokeStyle = `rgba(190, 242, 100, ${0.35 * (1 - n.d / 190)})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    function loop() {
      if (visible && !document.hidden) draw();
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const host = canvas.parentElement!;
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    };
    const leave = () => { pointer.active = false; pointer.x = pointer.y = -9999; };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    if (!reduced) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [density]);

  return <canvas ref={ref} className={`molecule-field ${className}`} aria-hidden="true" />;
}
