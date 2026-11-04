import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { PageVisibleContext } from "../lib/page";
import BookControls from "./BookControls";
import TurnEdge from "./TurnEdge";
import ZoomLayer from "./ZoomLayer";

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

/** Two-page spread (desktop / landscape). */
export default function FlipBook({
  leaves,
  initialTurned = 0,
  onChange,
  zoom,
  onZoom,
}: {
  leaves: Leaf[];
  initialTurned?: number;
  /** Called with the number of turned leaves whenever the reader turns a page. */
  onChange?: (turned: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
}) {
  const total = leaves.length;
  const [turned, setTurned] = useState(initialTurned);
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
      onChange?.(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMoving(null), FLIP_MS);
    },
    [turned, total, onChange],
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
    if (zoom > 1) return; // no tilt while magnifying
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 0.9,
      y: ((e.clientY - r.top) / r.height - 0.5) * 0.9,
    });
  };
  const t = zoom > 1 ? { x: 0, y: 0 } : tilt;

  // Closed book: only the left half (cover) is visible, so shift it to stay centred.
  const shift = turned === 0 ? "25%" : turned === total ? "-25%" : "0%";

  return (
    <div dir="rtl" className="flex flex-col items-center gap-2">
      <ZoomLayer zoom={zoom}>
        <div
          className="[perspective:4200px] px-2 py-3"
          onMouseMove={onMouseMove}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div
            className="relative aspect-[3/2] w-[min(96vw,1500px,calc((100svh-110px)*1.5))] transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(${shift}) rotateX(${14 - t.y * 6}deg) rotateY(${t.x * 8}deg)`,
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
                    <PageVisibleContext value={frontVisible}>{leaf.front}</PageVisibleContext>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/25 to-transparent" />
                    <TurnEdge side="left" label="الصفحة التالية" onClick={() => go(1)} />
                  </div>

                  {/* Back (right-hand page, pre-rotated so it reads correctly once turned) */}
                  <div
                    inert={!isTurned}
                    className={`@container absolute inset-0 overflow-hidden rounded-r-lg [backface-visibility:hidden] [transform:rotateY(180deg)] ${isTurned ? "" : "pointer-events-none"}`}
                  >
                    <PageVisibleContext value={backVisible}>{leaf.back}</PageVisibleContext>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/25 to-transparent" />
                    <TurnEdge side="right" label="الصفحة السابقة" onClick={() => go(-1)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ZoomLayer>

      <BookControls
        label={
          turned === 0
            ? "الغلاف"
            : turned === total
              ? "الغلاف الخلفي"
              : (leaves[turned - 1].label ?? `الصفحتان ${turned * 2 - 1}–${turned * 2}`)
        }
        canPrev={turned > 0}
        canNext={turned < total}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        zoom={zoom}
        onZoom={onZoom}
      />
    </div>
  );
}
