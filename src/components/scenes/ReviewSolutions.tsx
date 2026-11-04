import { useState } from 'react'
import { L } from '../../book/ui'
import { COLORS } from '../../lib/colors'
import { num } from '../../lib/format'
import { Arrow, BarChart, Btn, Chip, Note, Row, Scene, Slider, Stage, Tabs } from '../scene-kit'

type Q = 'q9' | 'q10' | 'q12'

function Q9() {
  const [st, setSt] = useState<'a' | 'b' | 'c'>('a')
  const bars = {
    a: [100, 0, 0],
    b: [0, 100, 0],
    c: [0, 0, 100],
  }[st]
  const springTop = st === 'a' ? 215 : 150
  const beadY = st === 'a' ? 205 : st === 'b' ? 135 : 40
  const zig = Array.from({ length: 9 }, (_, i) => {
    const y = 255 - ((i + 1) * (255 - springTop)) / 10
    return `${i % 2 ? 190 : 210},${y}`
  })
  return (
    <>
      <Stage viewBox="0 0 400 270">
        <rect x={182} y={150} width={36} height={110} fill="none" stroke="#334155" strokeWidth={3} />
        <polyline points={['200,255', ...zig, `200,${springTop}`].join(' ')} fill="none" stroke="#0ea5e9" strokeWidth={3} />
        <line x1={150} x2={260} y1={150} y2={150} stroke="#64748b" strokeDasharray="6 5" />
        <text x={265} y={154} fontSize={12} fill="#475569">
          مستوى الإسناد
        </text>
        <circle cx={200} cy={beadY} r={9} fill="#ef4444" stroke="#1b1f2a" strokeWidth={2} />
        {st === 'b' && <Arrow x1={200} y1={122} x2={200} y2={80} color="#dc2626" label="v" />}
        {st === 'c' && (
          <text x={215} y={44} fontSize={13} fill="#334155" direction="ltr">
            v = 0
          </text>
        )}
      </Stage>
      <Row>
        <Btn primary={st === 'a'} onClick={() => setSt('a')}>
          a. ضغط النابض
        </Btn>
        <Btn primary={st === 'b'} onClick={() => setSt('b')}>
          b. الانطلاق
        </Btn>
        <Btn primary={st === 'c'} onClick={() => setSt('c')}>
          c. أقصى ارتفاع
        </Btn>
      </Row>
      <BarChart
        max={100}
        bars={[
          { label: 'مرونية', value: bars[0], color: COLORS.el },
          { label: 'حركية', value: bars[1], color: COLORS.ke },
          { label: 'جاذبية', value: bars[2], color: COLORS.pe },
        ]}
      />
      <Note>
        {st === 'a' && 'دفع الطلقة داخل الماسورة يضغط النابض: الطاقة كلها طاقة وضع مرونية.'}
        {st === 'b' && 'يتمدد النابض فتتحول طاقة الوضع المرونية إلى طاقة حركية للطلقة.'}
        {st === 'c' && 'تتوقف الطلقة لحظيًّا عند أقصى ارتفاع: تحولت الطاقة الحركية إلى طاقة وضع جاذبية.'}
      </Note>
    </>
  )
}

function Q10() {
  const [h, setH] = useState(425)
  const y = (hh: number) => 250 - hh * 0.5
  return (
    <>
      <Stage viewBox="0 0 400 270">
        <line x1={0} x2={400} y1={250} y2={250} stroke="#65a30d" strokeWidth={4} />
        <rect x={60} y={228} width={36} height={18} rx={4} fill="#334155" />
        <line x1={78} x2={102} y1={232} y2={208} stroke="#334155" strokeWidth={8} strokeLinecap="round" />
        {[225, 425].map((hh) => (
          <g key={hh}>
            <line x1={140} x2={330} y1={y(hh)} y2={y(hh)} stroke="#94a3b8" strokeDasharray="5 5" />
            <text x={335} y={y(hh) + 4} fontSize={13} fill="#475569" direction="ltr">
              {hh} m
            </text>
          </g>
        ))}
        <circle cx={230} cy={y(h)} r={10} fill="#1f2937" />
      </Stage>
      <Slider label="الارتفاع" value={h} min={0} max={425} step={5} onChange={setH} shown={`${h} m`} />
      <Row>
        <Chip>
          <L>PE = (25.0)(9.80)({h}) = {num(25 * 9.8 * h)} J</L>
        </Chip>
      </Row>
      <BarChart
        max={104125}
        bars={[
          { label: 'PE (425 m)', value: 104125, color: COLORS.pe, text: '104,125' },
          { label: 'PE (225 m)', value: 55125, color: COLORS.pe, text: '55,125' },
          { label: 'ΔPE', value: -49000, color: COLORS.workNeg, text: '−49,000' },
        ]}
      />
      <Note>
        <L>PE = mgh = (25.0)(9.80)(425) = 1.04 × 10⁵ J</L> ، والتغير:{' '}
        <L>ΔPE = mg(h_f − hᵢ) = (25.0)(9.80)(225 − 425) = −4.90 × 10⁴ J</L>
      </Note>
    </>
  )
}

function Q12() {
  const [pt, setPt] = useState<'top' | 'low'>('top')
  const k = 2
  const yRef = 170
  const yTop = yRef - 45 * k
  const yLow = yRef + 40 * k
  return (
    <>
      <Stage viewBox="0 0 400 270">
        <polygon points={`20,${yRef} 120,${yRef} 190,${yTop} 230,${yTop} 300,${yLow} 390,${yLow} 390,268 20,268`} fill="#a8a29e" stroke="#57534e" strokeWidth={2} />
        <line x1={10} x2={390} y1={yRef} y2={yRef} stroke="#1d4ed8" strokeDasharray="7 5" />
        <text x={14} y={yRef - 6} fontSize={12} fill="#1d4ed8">
          سطح الطبقة الصخرية (مستوى الإسناد)
        </text>
        <text x={210} y={yTop - 10} textAnchor="middle" fontSize={13} fill="#334155" direction="ltr">
          +45.0 m
        </text>
        <text x={345} y={yLow - 10} textAnchor="middle" fontSize={13} fill="#334155" direction="ltr">
          −40.0 m
        </text>
        <circle cx={pt === 'top' ? 210 : 345} cy={(pt === 'top' ? yTop : yLow) - 12} r={11} fill="#f97316" stroke="#1b1f2a" strokeWidth={2} />
      </Stage>
      <Row>
        <Btn primary={pt === 'top'} onClick={() => setPt('top')}>
          أعلى ارتفاع
        </Btn>
        <Btn primary={pt === 'low'} onClick={() => setPt('low')}>
          أدنى نقطة
        </Btn>
      </Row>
      <BarChart
        max={39690}
        bars={[
          { label: 'PE القمة', value: pt === 'top' ? 39690 : 0, color: COLORS.pe, text: pt === 'top' ? '39,690' : '' },
          { label: 'PE الأدنى', value: pt === 'low' ? -35280 : 0, color: COLORS.workNeg, text: pt === 'low' ? '−35,280' : '' },
        ]}
        allowNeg
      />
      <Note>
        {pt === 'top' ? (
          <L>h = +45.0 m ⇒ PE = (90.0)(9.80)(45.0) = 3.97 × 10⁴ J</L>
        ) : (
          <L>h = 45.0 − 85.0 = −40.0 m ⇒ PE = (90.0)(9.80)(−40.0) = −3.53 × 10⁴ J</L>
        )}
      </Note>
    </>
  )
}

/** Worked answers with bar charts for review questions 9, 10 and 12. */
export default function ReviewSolutions() {
  const [q, setQ] = useState<Q>('q9')
  return (
    <Scene>
      <Tabs
        items={[
          { id: 'q9', label: 'سؤال 9' },
          { id: 'q10', label: 'سؤال 10' },
          { id: 'q12', label: 'سؤال 12' },
        ]}
        value={q}
        onChange={setQ}
      />
      {q === 'q9' && <Q9 />}
      {q === 'q10' && <Q10 />}
      {q === 'q12' && <Q12 />}
    </Scene>
  )
}
