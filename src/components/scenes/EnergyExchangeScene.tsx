import { useState } from 'react'
import { L } from '../../book/ui'
import { COLORS } from '../../lib/colors'
import { usePageVisible, usePhase } from '../../lib/page'
import { Arrow, BarChart, Btn, Note, Scene, Stage, Tabs } from '../scene-kit'

const Y_LOW = 235
const Y_TOP = 70
const REFERENCES = [
  { id: 'a', label: 'الإسناد عند اليد', lineY: 19 },
  { id: 'b', label: 'الإسناد عند القمة', lineY: 5 },
] as const

/** Figure 5-6: KE ⇄ PE while a ball flies, with the reference level at the hand (a) or at the top (b). */
export default function EnergyExchangeScene() {
  const { phase, playing, toggle, seek } = usePhase(3.2, usePageVisible())
  const [ref, setRef] = useState<'a' | 'b'>('a')

  const hn = 4 * phase * (1 - phase)
  const ke = 100 * (1 - hn)
  const pe = ref === 'a' ? 100 * hn : 100 * hn - 100
  const total = ke + pe
  const x = 70 + 260 * phase
  const y = Y_LOW - (Y_LOW - Y_TOP) * hn
  const vy = 1 - 2 * phase // +1 up … −1 down
  const refY = ref === 'a' ? Y_LOW : Y_TOP

  const path = Array.from({ length: 41 }, (_, i) => {
    const ph = i / 40
    const yy = Y_LOW - (Y_LOW - Y_TOP) * 4 * ph * (1 - ph)
    return `${i === 0 ? 'M' : 'L'} ${70 + 260 * ph} ${yy}`
  }).join(' ')

  return (
    <Scene>
      <Tabs
        items={REFERENCES.map(({ id, label, lineY }) => ({
          id,
          label,
          icon: (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
              <path d="M4 19Q12-9 20 19" />
              <path d={`M2 ${lineY}h20`} strokeDasharray="2 2" />
            </svg>
          ),
        }))}
        value={ref}
        onChange={setRef}
      />
      <Stage viewBox="0 0 400 270">
        {[157, 243].map((cx) => (
          <line key={cx} x1={cx} x2={cx} y1={30} y2={262} stroke="#cbd5e1" />
        ))}
        {[
          { label: 'البداية', x: 105 },
          { label: 'الوسط', x: 200 },
          { label: 'النهاية', x: 295 },
        ].map(({ label, x }) => (
          <text key={label} x={x} y={22} textAnchor="middle" fontSize={14} fill="#475569">
            {label}
          </text>
        ))}
        <path d={path} fill="none" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
        <line x1={20} x2={390} y1={refY} y2={refY} stroke="#334155" strokeDasharray="7 5" strokeWidth={1.5} />
        <text x={385} y={refY - 8} direction="rtl" textAnchor="start" fontSize={13} fill="#334155">
          مستوى الإسناد
        </text>
        <circle cx={x} cy={y} r={14} fill="#f59e0b" stroke="#1b1f2a" strokeWidth={2} />
        {Math.abs(vy) > 0.08 && (
          <Arrow x1={x} y1={y + (vy > 0 ? -18 : 18)} x2={x} y2={y + (vy > 0 ? -18 - 40 * vy : 18 - 40 * vy)} color="#dc2626" />
        )}
      </Stage>
      <BarChart
        max={100}
        allowNeg={ref === 'b'}
        showValues={false}
        bars={[
          { label: 'KE', value: ke, color: COLORS.ke },
          { label: 'PE', value: pe, color: COLORS.pe },
          { label: 'المجموع', value: total, color: COLORS.total },
        ]}
      />
      <div className="flex shrink-0 items-center gap-3">
        <Btn onClick={toggle} label={playing ? 'إيقاف مؤقت' : 'تشغيل'}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d={playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M8 5v14l11-7z'} />
          </svg>
        </Btn>
        <input
          type="range"
          aria-label="موضع الكرة"
          dir="ltr"
          className="min-w-0 flex-1 accent-indigo-600"
          value={phase}
          min={0}
          max={0.999}
          step={0.005}
          onChange={(event) => seek(Number(event.target.value))}
        />
      </div>
      <Note>
        <span className="text-[length:max(2cqw,12px)]">
          {ref === 'a' ? (
            <>
              تتحول الطاقة الحركية إلى طاقة وضع في أثناء الصعود، ثم تعود طاقةً حركية في أثناء السقوط، ويبقى{' '}
              <L>KE + PE = 100 J</L> ثابتًا لأنه لم يُبذل شغل من قوة خارجية.
            </>
          ) : (
            <>
              عند أخذ مستوى الإسناد عند القمة تصبح طاقة الوضع سالبة أسفله، ويصبح المجموع <L>0 J</L>؛ قيمة المجموع
              تختلف باختلاف مستوى الإسناد لكنها تبقى <b>ثابتة</b> طوال التحليق.
            </>
          )}
        </span>
      </Note>
    </Scene>
  )
}
