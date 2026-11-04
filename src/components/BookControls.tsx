import { ZOOM_LEVELS } from "../lib/zoom";

/** Previous / next buttons, the current page label and the magnifier, under the book. */
export default function BookControls({
  label,
  canPrev,
  canNext,
  onPrev,
  onNext,
  zoom,
  onZoom,
}: {
  label: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  zoom: number;
  onZoom: (z: number) => void;
}) {
  const i = ZOOM_LEVELS.indexOf(zoom);
  const zoomBtn =
    "grid size-9 place-items-center rounded-full text-lg leading-none transition hover:bg-stone-100 disabled:opacity-30";

  return (
    <div className="flex max-w-[96vw] items-center justify-center gap-1.5 text-stone-800 sm:gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="السابق"
        className="shrink-0 rounded-full border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-stone-100 disabled:opacity-40 sm:px-5 sm:text-base"
      >
        →<span className="hidden sm:inline"> السابق</span>
      </button>
      <span className="min-w-0 flex-1 truncate text-center text-xs text-stone-600 tabular-nums sm:min-w-56 sm:flex-none sm:text-sm">
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="التالي"
        className="shrink-0 rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 sm:px-5 sm:text-base"
      >
        <span className="hidden sm:inline">التالي </span>←
      </button>

      {/* Magnifier */}
      <div
        className="flex shrink-0 items-center rounded-full border border-stone-300 bg-white px-0.5 shadow-sm"
        title="المكبّر: كبّر الصفحة ثم حرّك المؤشر أو إصبعك فوقها"
      >
        <button
          type="button"
          aria-label="تصغير"
          onClick={() => onZoom(ZOOM_LEVELS[Math.max(0, i - 1)])}
          disabled={i <= 0}
          className={zoomBtn}
        >
          −
        </button>
        <button
          type="button"
          aria-label="المكبّر: إعادة الحجم الطبيعي"
          onClick={() => onZoom(zoom > 1 ? 1 : ZOOM_LEVELS[1])}
          className={`flex h-9 items-center gap-1 rounded-full px-2 text-sm transition hover:bg-stone-100 ${zoom > 1 ? "font-semibold text-indigo-700" : "text-stone-700"}`}
        >
          <span aria-hidden>🔍</span>
          <span dir="ltr" className="tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
        </button>
        <button
          type="button"
          aria-label="تكبير"
          onClick={() => onZoom(ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, i + 1)])}
          disabled={i >= ZOOM_LEVELS.length - 1}
          className={zoomBtn}
        >
          +
        </button>
      </div>
    </div>
  );
}
