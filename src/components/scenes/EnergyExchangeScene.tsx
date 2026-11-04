import { useState } from 'react'
import { L } from '../../book/ui'
import { COLORS } from '../../lib/colors'
import { usePageVisible, usePhase } from '../../lib/page'
import { Arrow, BarChart, Btn, Note, Row, Scene, Slider, Stage, Tabs } from '../scene-kit'

const Y_LOW = 235
const Y_TOP = 70

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
        items={[
          { id: 'a', label: '(a) الإسناد عند اليد' },
          { id: 'b', label: '(b) الإسناد عند القمة' },
        ]}
        value={ref}
        onChange={setRef}
      />
      <Stage viewBox="0 0 400 270">
        {[157, 243].map((cx) => (
          <line key={cx} x1={cx} x2={cx} y1={30} y2={262} stroke="#cbd5e1" />
        ))}
        {[
          ['بداية', 105],
          ['وسط', 200],
          ['نهاية', 295],
        ].map(([label, cx]) => (
          <text key={label} x={cx} y={22} textAnchor="middle" fontSize={14} fill="#475569">
            {label}
          </text>
        ))}
        <path d={path} fill="none" stroke="#dc2626" strokeWidth={2} strokeDasharray="5 5" opacity={0.6} />
        <line x1={20} x2={390} y1={refY} y2={refY} stroke="#334155" strokeDasharray="7 5" strokeWidth={1.5} />
        <text x={385} y={refY - 8} textAnchor="end" fontSize={13} fill="#334155">
          مستوى الإسناد
        </text>
        {ref === 'b' && (
          <>
            <text x={22} y={Y_TOP - 6} fontSize={13} fill="#334155" direction="ltr">
              h = 0
            </text>
            <text x={22} y={Y_LOW + 5} fontSize={13} fill="#334155" direction="ltr">
              −h
            </text>
          </>
        )}
        <circle cx={x} cy={y} r={14} fill="#f59e0b" stroke="#1b1f2a" strokeWidth={2} />
        {Math.abs(vy) > 0.08 && (
          <Arrow x1={x} y1={y + (vy > 0 ? -18 : 18)} x2={x} y2={y + (vy > 0 ? -18 - 40 * vy : 18 - 40 * vy)} color="#dc2626" />
        )}
      </Stage>
      <BarChart
        max={100}
        allowNeg={ref === 'b'}
        bars={[
          { label: 'KE', value: ke, color: COLORS.ke },
          { label: 'PE', value: pe, color: COLORS.pe },
          { label: 'المجموع', value: total, color: COLORS.total },
        ]}
      />
      <Row>
        <Btn onClick={toggle}>{playing ? 'إيقاف مؤقت' : 'تشغيل'}</Btn>
      </Row>
      <Slider
        label="موضع الكرة"
        value={phase}
        min={0}
        max={0.999}
        step={0.005}
        onChange={seek}
        shown={phase < 0.5 ? 'صعود' : 'هبوط'}
      />
      <Note>
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
      </Note>
    </Scene>
  )
}
