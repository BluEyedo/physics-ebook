import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { body, small } from './styles'

/**
 * A paper page. Text shrinks a little (via --fit) until it fits without scrolling;
 * if it still can't fit at the minimum readable size, the page scrolls with a styled scrollbar.
 */
export function Paper({
  children,
  number,
  figure = false,
}: {
  children: ReactNode
  number?: number
  figure?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => {
      let f = 1
      el.style.setProperty('--fit', '1')
      while (el.scrollHeight > el.clientHeight + 1 && f > 0.62) {
        f -= 0.03
        el.style.setProperty('--fit', f.toFixed(2))
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    const mo = new MutationObserver(fit)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    document.fonts?.ready.then(fit)
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [])

  return (
    <div className="flex h-full flex-col bg-[#fdfaf2] px-[6%] pt-[5%] pb-[2.5%] text-stone-800">
      <div
        ref={ref}
        className={`page-scroll min-h-0 flex-1 overflow-y-auto ${figure ? 'flex flex-col' : ''}`}
      >
        {children}
      </div>
      {number !== undefined && (
        <div className="pt-[1.5%] text-center text-[length:max(1.9cqw,9px)] text-stone-400">{number}</div>
      )}
    </div>
  )
}

/** A page with a figure caption on top and an interactive scene filling the rest. */
export function FigurePage({
  number,
  caption,
  children,
}: {
  number?: number
  caption: ReactNode
  children: ReactNode
}) {
  return (
    <Paper number={number} figure>
      <div className={`mb-[1.5cqw] shrink-0 text-stone-600 ${small}`}>{caption}</div>
      <div className="min-h-[40cqw] flex-1">{children}</div>
    </Paper>
  )
}

/** Keeps Latin text, numbers and formulas left-to-right inside Arabic sentences. */
export function L({ children }: { children: ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>
}

export function Term({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-yellow-200/80 px-0.5 text-inherit">{children}</mark>
}

/** Red lead-in words that start a paragraph, as in the textbook. */
export function Lead({ children }: { children: ReactNode }) {
  return <b className="text-rose-600">{children} </b>
}

/** Figure reference such as «الشكل 5-3a». */
export function Fig({ n }: { n: string }) {
  return (
    <b>
      الشكل <L>{n}</L>
    </b>
  )
}

const HEADING_COLORS = {
  rose: 'border-rose-400 text-rose-600',
  indigo: 'border-indigo-400 text-indigo-700',
  emerald: 'border-emerald-500 text-emerald-700',
  amber: 'border-amber-500 text-amber-700',
  sky: 'border-sky-500 text-sky-700',
} as const

export function Heading({
  title,
  en,
  color = 'rose',
}: {
  title: string
  en?: string
  color?: keyof typeof HEADING_COLORS
}) {
  return (
    <h2
      className={`mb-[2cqw] flex items-baseline justify-between gap-2 border-b-2 pb-[0.5cqw] text-[4.4cqw] font-bold ${HEADING_COLORS[color]}`}
    >
      {title}
      {en && (
        <span className="text-[0.62em] font-semibold text-stone-500" dir="ltr">
          {en}
        </span>
      )}
    </h2>
  )
}

/** Highlighted law box like the textbook's yellow boxes. */
export function LawBox({ name, formula, children }: { name: string; formula: string; children: ReactNode }) {
  return (
    <div className={`my-[1.6cqw] rounded-lg border border-amber-200 bg-amber-50 px-[2.5cqw] py-[1.5cqw] ${body}`}>
      <div className="flex items-center justify-between gap-2">
        <b className="text-amber-800">{name}</b>
        <span dir="ltr" className="rounded border border-amber-300 bg-white px-[1.5cqw] font-semibold">
          {formula}
        </span>
      </div>
      <p className="mt-[0.8cqw]">{children}</p>
    </div>
  )
}

/** Question with a reveal button. */
export function QA({ q, children }: { q: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-[2cqw]">
      <p className="font-bold text-indigo-800">س: {q}</p>
      {open ? (
        <div className="mt-[1cqw] text-emerald-800">ج: {children}</div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-[1.2cqw] rounded-full bg-indigo-600 px-[2.5cqw] py-[0.6cqw] text-[length:max(1.9cqw,10px)] text-white hover:bg-indigo-700"
        >
          اكشف الإجابة
        </button>
      )}
    </div>
  )
}
