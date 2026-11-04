import type { ReactNode } from 'react'

/** Row of figure/state buttons. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="flex shrink-0 gap-[1.2cqw]">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={`flex-1 rounded-xl border bg-white px-[1cqw] py-[0.9cqw] text-[length:max(2cqw,9px)] leading-tight transition ${
            value === it.id
              ? 'border-blue-600 text-blue-700 ring-1 ring-blue-600'
              : 'border-stone-300 text-stone-700 hover:border-stone-400'
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

/** The animation canvas: an SVG that scales to fill the space. */
export function Stage({ children, viewBox = '0 0 400 300' }: { children: ReactNode; viewBox?: string }) {
  return (
    <div className="relative min-h-0 flex-[1.4] overflow-hidden rounded-xl border border-stone-300 bg-gradient-to-b from-[#ffe3f1] to-[#d6ecff]">
      <svg viewBox={viewBox} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 rounded-lg bg-blue-50 p-[1.6cqw] text-[length:max(calc(2cqw*var(--fit,1)),9px)] leading-relaxed text-stone-700">
      {children}
    </div>
  )
}

export function Btn({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`shrink-0 rounded-full px-[2.5cqw] py-[0.7cqw] text-[length:max(1.9cqw,9px)] font-medium transition disabled:opacity-40 ${
        primary
          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
          : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100'
      }`}
    >
      {children}
    </button>
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  shown,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  shown: string
}) {
  return (
    <label className="flex shrink-0 items-center gap-[1.5cqw] text-[length:max(1.9cqw,9px)] text-stone-700">
      <span className="shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1 accent-indigo-600"
      />
      <span dir="ltr" className="w-[15cqw] shrink-0 text-left font-semibold tabular-nums">
        {shown}
      </span>
    </label>
  )
}

/** Small readout pill. */
export function Chip({ children, tone = 'stone' }: { children: ReactNode; tone?: 'stone' | 'red' | 'green' }) {
  const tones = {
    stone: 'border-stone-300 text-stone-700',
    red: 'border-rose-300 bg-rose-50 text-rose-700',
    green: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  }
  return (
    <span
      className={`rounded-full border bg-white px-[1.6cqw] py-[0.3cqw] text-[length:max(1.9cqw,9px)] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Row({ children }: { children: ReactNode }) {
  return <div className="flex shrink-0 flex-wrap items-center gap-[1.2cqw]">{children}</div>
}

/** Straight arrow from (x1,y1) to (x2,y2). */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 3,
  label,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width?: number
  label?: string
}) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  if (len < 2) return null
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const hs = 9
  const bx = x2 - ux * hs
  const by = y2 - uy * hs
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon
        points={`${x2},${y2} ${bx - uy * 6},${by + ux * 6} ${bx + uy * 6},${by - ux * 6}`}
        fill={color}
      />
      {label && (
        <text
          x={x2 + (Math.abs(uy) > 0.5 ? 10 : 0)}
          y={y2 + (Math.abs(uy) > 0.5 ? 4 : -8)}
          fontSize={14}
          fontWeight={700}
          fill={color}
          direction="ltr"
          textAnchor={Math.abs(uy) > 0.5 ? 'start' : 'middle'}
        >
          {label}
        </text>
      )}
    </g>
  )
}

export type Bar = { label: string; value: number; color: string; text?: string }

/** Energy bar chart (bars can go below the axis for negative values). */
export function BarChart({
  bars,
  max,
  signs,
  allowNeg = false,
}: {
  bars: Bar[]
  max: number
  signs?: string[]
  allowNeg?: boolean
}) {
  const neg = allowNeg || bars.some((b) => b.value < -1e-9)
  const slot = 100
  const W = bars.length * slot
  const H = 190
  const axis = neg ? 92 : 152
  const span = neg ? 70 : 128
  const k = span / max
  return (
    <div className="relative min-h-0 flex-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
        <line x1={6} x2={W - 6} y1={axis} y2={axis} stroke="#57534e" strokeWidth={1.5} />
        {bars.map((b, i) => {
          const h = Math.min(Math.abs(b.value) * k, span + 6)
          const x = i * slot + 24
          const y = b.value >= 0 ? axis - h : axis
          return (
            <g key={i}>
              <rect x={x} y={y} width={52} height={Math.max(h, 0.6)} rx={3} fill={b.color} />
              <text
                x={x + 26}
                y={b.value >= 0 ? y - 6 : axis - 6}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fill="#292524"
                direction="ltr"
              >
                {b.text ?? Math.round(b.value)}
              </text>
              <text x={x + 26} y={H - 4} textAnchor="middle" fontSize={14} fill="#57534e" direction="ltr">
                {b.label}
              </text>
            </g>
          )
        })}
        {signs?.map((s, i) => (
          <text key={i} x={(i + 1) * slot} y={axis - 24} textAnchor="middle" fontSize={24} fill="#44403c">
            {s}
          </text>
        ))}
      </svg>
    </div>
  )
}

/** Standard vertical layout for a scene. */
export function Scene({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col gap-[1.2cqw]">{children}</div>
}
