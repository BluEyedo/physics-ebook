/**
 * Clickable strip along a page's outer edge that turns the page.
 * A faint shadow is always visible so readers know the edge is clickable;
 * on hover it deepens, the corner lifts and an arrow appears.
 */
export default function TurnEdge({
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
