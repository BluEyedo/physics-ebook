import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { PageVisibleContext } from "../lib/page";

/**
 * One sheet of paper. The book opens right-to-left (Arabic):
 * unturned leaves stack on the left half and turn over the spine to the right.
 */
export type Leaf = {
  /** Shown on the left side before the leaf is turned. */
  front: ReactNode;
  /** Shown on the right side after the leaf is turned. */
  back: ReactNode;
  /** Name shown under the book for the spread this leaf's back opens. */
  label?: string;
};

const FLIP_MS = 900;

/**
 * Clickable strip along a page's outer edge that turns the page.
 * A faint shadow is always visible so readers know the edge is clickable;
 * on hover it deepens, the corner lifts and an arrow appears.
 */
function TurnEdge({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const isLeft = side === "left";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`group absolute inset-y-0 z-10 w-[9%] cursor-pointer outline-none ${isLeft ? "left-0" : "right-0"}`}
    >
      {/* Edge shadow: faint at rest, deeper on hover/focus */}
      <span
        className={`absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          isLeft
            ? "bg-gradient-to-r from-black/30 via-black/10 to-transparent"
            : "bg-gradient-to-l from-black/30 via-black/10 to-transparent"
        }`}
      />
      {/* Lifted corner at the bottom of the edge */}
      <span
        className={`absolute bottom-0 size-0 transition-all duration-300 group-hover:size-10 group-focus-visible:size-10 ${
          isLeft
            ? "left-0 rounded-tr-lg bg-gradient-to-tr from-stone-300 via-stone-100 to-white shadow-[3px_-3px_8px_rgba(0,0,0,0.25)]"
            : "right-0 rounded-tl-lg bg-gradient-to-tl from-stone-300 via-stone-100 to-white shadow-[-3px_-3px_8px_rgba(0,0,0,0.25)]"
        }`}
      />
      {/* Arrow */}
      <span
        className={`absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-lg leading-none text-white opacity-0 shadow transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          isLeft ? "left-1 group-hover:left-2" : "right-1 group-hover:right-2"
        }`}
      >
        {isLeft ? "‹" : "›"}
      </span>
    </button>
  );
}

export default function FlipBook({ leaves }: { leaves: Leaf[] }) {
  const total = leaves.length;
  const [turned, setTurned] = useState(0);
  const [moving, setMoving] = useState<number | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const timer = useRef<number | undefined>(undefined);

  const go = useCallback(
    (dir: 1 | -1) => {
      const next = Math.min(total, Math.max(0, turned + dir));
      if (next === turned) return;
      // The leaf that is moving stays on top while it animates.
      setMoving(dir === 1 ? turned : next);
      setTurned(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMoving(null), FLIP_MS);
    },
    [turned, total],
  );

  useEffect(() => {
    // Right-to-left book: the left arrow moves forward.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 0.9,
      y: ((e.clientY - r.top) / r.height - 0.5) * 0.9,
    });
  };

  // Closed book: only the left half (cover) is visible, so shift it to stay centred.
  const shift = turned === 0 ? "25%" : turned === total ? "-25%" : "0%";

  return (
    <div dir="rtl" className="flex flex-col items-center gap-2">
      <div
        className="[perspective:4200px] px-2 py-3"
        onMouseMove={onMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div
          className="relative aspect-[3/2] w-[min(96vw,1500px,calc((100svh-110px)*1.5))] transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${shift}) rotateX(${14 - tilt.y * 6}deg) rotateY(${tilt.x * 8}deg)`,
            perspective: "4200px",
          }}
        >
          {/* Shadow on the "table" under the open pages */}
          <div
            className="pointer-events-none absolute inset-y-[4%] rounded-lg bg-black/40 blur-2xl transition-all duration-700"
            style={{
              right: turned === 0 ? "50%" : "2%",
              left: turned === total ? "50%" : "2%",
              transform: "translateY(6%)",
            }}
          />

          {leaves.map((leaf, i) => {
            const isTurned = i < turned;
            const z = moving === i ? total + 1 : isTurned ? i + 1 : total - i;
            // Which sides are on screen (animations pause on hidden pages).
            const frontVisible = i === turned || moving === i;
            const backVisible = i === turned - 1 || moving === i;
            return (
              <div
                key={i}
                className="absolute left-0 top-0 h-full w-1/2 origin-right [transform-style:preserve-3d]"
                style={{
                  zIndex: z,
                  transform: `rotateY(${isTurned ? 180 : 0}deg)`,
                  transition: `transform ${FLIP_MS}ms cubic-bezier(.645,.045,.355,1)`,
                }}
              >
                {/* Front (left-hand page) — spine on its right edge */}
                {/* inert: the hidden side of a page must not catch clicks or focus */}
                <div
                  inert={isTurned}
                  className={`@container absolute inset-0 overflow-hidden rounded-l-lg [backface-visibility:hidden] ${isTurned ? "pointer-events-none" : ""}`}
                >
                  <PageVisibleContext value={frontVisible}>
                    {leaf.front}
                  </PageVisibleContext>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/25 to-transparent" />
                  <TurnEdge
                    side="left"
                    label="الصفحة التالية"
                    onClick={() => go(1)}
                  />
                </div>

                {/* Back (right-hand page, pre-rotated so it reads correctly once turned) */}
                <div
                  inert={!isTurned}
                  className={`@container absolute inset-0 overflow-hidden rounded-r-lg [backface-visibility:hidden] [transform:rotateY(180deg)] ${isTurned ? "" : "pointer-events-none"}`}
                >
                  <PageVisibleContext value={backVisible}>
                    {leaf.back}
                  </PageVisibleContext>
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/25 to-transparent" />
                  <TurnEdge
                    side="right"
                    label="الصفحة السابقة"
                    onClick={() => go(-1)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-stone-800">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={turned === 0}
          className="rounded-full border border-stone-300 bg-white px-5 py-2 font-medium text-stone-800 shadow-sm transition hover:bg-stone-100 disabled:opacity-40"
        >
          → السابق
        </button>
        <span className="min-w-56 text-center text-sm text-stone-600 tabular-nums">
          {turned === 0
            ? "الغلاف"
            : turned === total
              ? "الغلاف الخلفي"
              : (leaves[turned - 1].label ??
                `الصفحتان ${turned * 2 - 1}–${turned * 2}`)}
        </span>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={turned === total}
          className="rounded-full bg-indigo-600 px-5 py-2 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
        >
          التالي ←
        </button>
      </div>
    </div>
  );
}
