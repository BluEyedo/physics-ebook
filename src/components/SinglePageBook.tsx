import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { PageVisibleContext } from "../lib/page";
import BookControls from "./BookControls";
import TurnEdge from "./TurnEdge";
import ZoomLayer from "./ZoomLayer";

export type BookPage = { node: ReactNode; label: string };

const FLIP_MS = 800;
const SWIPE_PX = 50;

/**
 * One page at a time (phones / narrow portrait screens). Same right-to-left book:
 * the spine is on the right, and turning forward flips the page over to the right.
 * Turn with the page edges, the buttons, the arrow keys, or by swiping.
 */
export default function SinglePageBook({
  pages,
  initialIndex = 0,
  onChange,
  zoom,
  onZoom,
}: {
  pages: BookPage[];
  initialIndex?: number;
  onChange?: (index: number) => void;
  zoom: number;
  onZoom: (z: number) => void;
}) {
  const last = pages.length - 1;
  const [index, setIndex] = useState(initialIndex);
  const [moving, setMoving] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback(
    (dir: 1 | -1) => {
      const next = Math.min(last, Math.max(0, index + dir));
      if (next === index) return;
      // Forward: the current page flips away. Back: the previous page flips back in.
      setMoving(dir === 1 ? index : next);
      setIndex(next);
      onChange?.(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMoving(null), FLIP_MS);
    },
    [index, last, onChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Swipe: finger moves right → next page (the page turns to the right), left → previous.
  // Not while magnifying (dragging pans the magnifier) or when starting on a control such as a slider.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const onControl = (e.target as Element).closest("button, input, select, textarea, a");
    swipe.current = e.pointerType !== "mouse" && zoom === 1 && !onControl ? { x: e.clientX, y: e.clientY } : null;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx > 0 ? 1 : -1);
  };

  return (
    <div dir="rtl" className="flex flex-col items-center gap-2">
      <ZoomLayer zoom={zoom}>
        <div className="[perspective:2600px] px-2 py-2" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
          {/* Uses the full screen height on phones (taller than a desktop page) so less text needs scrolling */}
          <div className="relative h-[min(calc(100svh-110px),calc(94vw*1.9))] w-[min(94vw,calc((100svh-110px)*0.85))]">
            {/* Shadow under the page */}
            <div className="pointer-events-none absolute inset-[3%] translate-y-[3%] rounded-lg bg-black/35 blur-2xl" />

            {pages.map((page, i) => {
              const isTurned = i < index;
              const isMoving = moving === i;
              const visible = i === index || isMoving;
              return (
                <div
                  key={i}
                  className="absolute inset-0 origin-right [transform-style:preserve-3d]"
                  style={{
                    zIndex: isMoving ? pages.length + 1 : pages.length - i,
                    transform: `rotateY(${isTurned ? 180 : 0}deg)`,
                    transition: `transform ${FLIP_MS}ms cubic-bezier(.645,.045,.355,1)`,
                    // Turned pages are hidden once their flip has finished
                    visibility: isTurned && !isMoving ? "hidden" : "visible",
                  }}
                >
                  <div
                    inert={i !== index}
                    className="@container absolute inset-0 overflow-hidden rounded-lg [backface-visibility:hidden]"
                  >
                    <PageVisibleContext value={visible}>{page.node}</PageVisibleContext>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-black/20 to-transparent" />
                    <TurnEdge side="left" label="الصفحة التالية" onClick={() => go(1)} />
                    <TurnEdge side="right" label="الصفحة السابقة" onClick={() => go(-1)} />
                  </div>
                  {/* Back of the sheet, seen while it turns */}
                  <div className="absolute inset-0 rounded-lg bg-[#f1ebdc] [backface-visibility:hidden] [transform:rotateY(180deg)]" />
                </div>
              );
            })}
          </div>
        </div>
      </ZoomLayer>

      <BookControls
        label={pages[index].label}
        canPrev={index > 0}
        canNext={index < last}
        onPrev={() => go(-1)}
        onNext={() => go(1)}
        zoom={zoom}
        onZoom={onZoom}
      />
    </div>
  );
}
