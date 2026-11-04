import { useState, type PointerEvent, type ReactNode } from "react";


/**
 * Magnifier: scales its content up and follows the pointer (or finger), so moving over
 * the page shows the magnified part under it. The outer box keeps its size and clips,
 * so the zoomed book stays inside its area and never makes the window scroll.
 */
export default function ZoomLayer({ zoom, children }: { zoom: number; children: ReactNode }) {
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const zoomed = zoom > 1;

  const follow = (e: PointerEvent<HTMLDivElement>) => {
    if (!zoomed) return;
    // Measured on the unscaled outer box, so the origin doesn't jitter while zoomed
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(100, Math.max(0, v));
    setOrigin({
      x: clamp(((e.clientX - r.left) / r.width) * 100),
      y: clamp(((e.clientY - r.top) / r.height) * 100),
    });
  };

  return (
    <div
      onPointerMove={follow}
      onPointerDown={follow}
      // Clip only while magnifying; at normal size the book's shadow must be free to spread out
      className={zoomed ? "cursor-zoom-in touch-none overflow-hidden" : ""}
    >
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: "transform 300ms ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
