"use client";

import { useEffect, useRef } from "react";

/**
 * A rotating ball-and-stick model of coniferyl alcohol, the main lignin
 * monomer. Auto-rotates; drag (or swipe) to spin it yourself.
 */

type El = "C" | "O" | "H";
// [element, x, y, z] in Ångström-ish units
const ATOMS: [El, number, number, number][] = [
  ["C", 0, 1.4, 0], ["C", 1.21, 0.7, 0], ["C", 1.21, -0.7, 0], ["C", 0, -1.4, 0], ["C", -1.21, -0.7, 0], ["C", -1.21, 0.7, 0], // 0-5 ring
  ["C", 0, 2.9, 0], ["C", 1.3, 3.65, 0], ["C", 1.3, 5.15, 0], ["O", 2.6, 5.9, 0], // 6-9 propenol chain
  ["O", 2.51, -1.45, 0], ["C", 2.51, -2.95, 0], // 10-11 methoxy
  ["O", 0, -2.9, 0], // 12 phenolic OH
  ["H", 2.15, 1.25, 0], ["H", -2.15, -1.25, 0], ["H", -2.15, 1.25, 0], // 13-15 ring H
  ["H", -0.95, 3.45, 0], ["H", 2.25, 3.1, 0], // 16-17 vinyl H
  ["H", 0.75, 5.5, 0.9], ["H", 0.75, 5.5, -0.9], ["H", 3.35, 5.35, 0], // 18-20
  ["H", 3.55, -3.3, 0], ["H", 2.0, -3.35, 0.9], ["H", 2.0, -3.35, -0.9], // 21-23 methyl H
  ["H", -0.85, -3.4, 0], // 24 OH
];
const BONDS: [number, number, number][] = [
  [0, 1, 2], [1, 2, 1], [2, 3, 2], [3, 4, 1], [4, 5, 2], [5, 0, 1],
  [0, 6, 1], [6, 7, 2], [7, 8, 1], [8, 9, 1],
  [2, 10, 1], [10, 11, 1], [3, 12, 1],
  [1, 13, 1], [4, 14, 1], [5, 15, 1], [6, 16, 1], [7, 17, 1],
  [8, 18, 1], [8, 19, 1], [9, 20, 1], [11, 21, 1], [11, 22, 1], [11, 23, 1], [12, 24, 1],
];
const STYLE: Record<El, { r: number; c: [string, string] }> = {
  C: { r: 0.42, c: ["#6ee7b7", "#047857"] },
  O: { r: 0.46, c: ["#ecfccb", "#65a30d"] },
  H: { r: 0.26, c: ["#ffffff", "#a7f3d0"] },
};

// centre the model
const cx = ATOMS.reduce((s, a) => s + a[1], 0) / ATOMS.length;
const cy = ATOMS.reduce((s, a) => s + a[2], 0) / ATOMS.length;
const MODEL = ATOMS.map(([el, x, y, z]) => ({ el, x: x - cx, y: -(y - cy), z }));

export default function Molecule3D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let size = 0, raf = 0;
    let rx = -0.35, ry = 0.6, vx = 0, vy = reduced ? 0 : 0.008;
    let dragging = false, lx = 0, ly = 0, t = 0;

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      size = canvas.getBoundingClientRect().width;
      canvas.width = canvas.height = size * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const scale = size / 11.5;
      const cosY = Math.cos(ry), sinY = Math.sin(ry), cosX = Math.cos(rx), sinX = Math.sin(rx);
      const P = MODEL.map((a) => {
        const x1 = a.x * cosY + a.z * sinY;
        const z1 = -a.x * sinY + a.z * cosY;
        const y2 = a.y * cosX - z1 * sinX;
        const z2 = a.y * sinX + z1 * cosX;
        const persp = 9 / (9 + z2);
        return { el: a.el, x: size / 2 + x1 * scale * persp, y: size / 2 + y2 * scale * persp, z: z2, p: persp };
      });

      // draw bonds and atoms back-to-front so overlaps look right
      type Item = { z: number; draw: () => void };
      const items: Item[] = [];
      for (const [i, j, order] of BONDS) {
        const a = P[i], b = P[j];
        items.push({
          z: (a.z + b.z) / 2 + 0.01,
          draw: () => {
            const nx = -(b.y - a.y), ny = b.x - a.x;
            const len = Math.hypot(nx, ny) || 1;
            const offs = order === 2 ? [-3.2, 3.2] : [0];
            const depth = Math.max(0.35, Math.min(1, 0.75 - a.z * 0.08));
            ctx.strokeStyle = `rgba(209, 250, 229, ${depth})`;
            ctx.lineWidth = (order === 2 ? 2.4 : 4) * a.p;
            ctx.lineCap = "round";
            for (const o of offs) {
              ctx.beginPath();
              ctx.moveTo(a.x + (nx / len) * o, a.y + (ny / len) * o);
              ctx.lineTo(b.x + (nx / len) * o, b.y + (ny / len) * o);
              ctx.stroke();
            }
          },
        });
      }
      for (const a of P) {
        items.push({
          z: a.z,
          draw: () => {
            const s = STYLE[a.el];
            const r = s.r * scale * a.p;
            const g = ctx.createRadialGradient(a.x - r * 0.35, a.y - r * 0.4, r * 0.1, a.x, a.y, r);
            g.addColorStop(0, s.c[0]);
            g.addColorStop(1, s.c[1]);
            ctx.fillStyle = g;
            ctx.shadowColor = s.c[0];
            ctx.shadowBlur = 18 * a.p;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          },
        });
      }
      items.sort((a, b) => b.z - a.z).forEach((i) => i.draw());
    }

    function loop() {
      t += 1;
      if (!dragging) {
        vy += (0.008 - vy) * 0.02; // ease back to idle spin
        vx *= 0.95;
        rx += (-0.35 + Math.sin(t / 240) * 0.25 - rx) * 0.01;
      }
      ry += vy;
      rx += vx;
      draw();
      raf = requestAnimationFrame(loop);
    }

    const down = (e: PointerEvent) => {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      vy = (e.clientX - lx) * 0.01;
      vx = (e.clientY - ly) * 0.01;
      ry += vy;
      rx += vx;
      lx = e.clientX;
      ly = e.clientY;
      if (reduced) draw();
    };
    const up = () => (dragging = false);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (!reduced) raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <figure className="molecule3d">
      <div className="orbit-ring" aria-hidden="true" />
      <div className="orbit-ring two" aria-hidden="true" />
      <canvas ref={ref} role="img" aria-label="Rotating 3D model of coniferyl alcohol, a lignin monomer. Drag to rotate." />
      <figcaption>
        <strong>Coniferyl alcohol</strong> · C₁₀H₁₂O₃ · lignin monomer
        <span>drag to rotate</span>
      </figcaption>
    </figure>
  );
}
