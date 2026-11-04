import { useMemo, useState } from "react";
import { useMediaQuery } from "../lib/media";
import FlipBook, { type Leaf } from "./FlipBook";
import SinglePageBook, { type BookPage } from "./SinglePageBook";

/** Phones, and tablets held upright, read one page at a time. */
const SINGLE_PAGE_QUERY = "(max-width: 767px), (orientation: portrait) and (max-width: 1100px)";

/**
 * Picks the two-page spread or the single-page book by screen size, and keeps the reader's
 * place (and magnifier level) when switching, e.g. when a tablet is rotated.
 */
export default function Book({ leaves }: { leaves: Leaf[] }) {
  const single = useMediaQuery(SINGLE_PAGE_QUERY);
  const [page, setPage] = useState(0); // position as a single-page index (0 = cover)
  const [zoom, setZoom] = useState(1);
  const total = leaves.length;

  // Reading order: cover, then each leaf's back (right page) followed by the next leaf's front (left page)
  const pages = useMemo<BookPage[]>(
    () =>
      leaves.flatMap((leaf, k) => [
        { node: leaf.front, label: k === 0 ? "الغلاف" : (leaves[k - 1].label ?? `صفحة ${2 * k}`) },
        { node: leaf.back, label: k === total - 1 ? "الغلاف الخلفي" : (leaf.label ?? `صفحة ${2 * k + 1}`) },
      ]),
    [leaves, total],
  );

  // Spread k shows pages 2k−1 (right) and 2k (left)
  const turnedFromPage = Math.ceil(page / 2);
  const pageFromTurned = (t: number) => (t === 0 ? 0 : t === total ? 2 * total - 1 : 2 * t - 1);

  return single ? (
    <SinglePageBook pages={pages} initialIndex={page} onChange={setPage} zoom={zoom} onZoom={setZoom} />
  ) : (
    <FlipBook
      leaves={leaves}
      initialTurned={turnedFromPage}
      onChange={(t) => setPage(pageFromTurned(t))}
      zoom={zoom}
      onZoom={setZoom}
    />
  );
}
