import { useState, type ReactNode } from 'react'
import { small } from '../../book/styles'
import { L } from '../../book/ui'
import { COLORS } from '../../lib/colors'
import { BarChart, Btn, Row, Scene, Tabs, type Bar } from '../scene-kit'

type Id = '1' | '2' | '3'

const PROBLEMS: Record<Id, { text: ReactNode; steps: ReactNode[]; bars?: Bar[]; max?: number }> = {
  '1': {
    text: (
      <>
        يتحرك متزلج كتلته <L>52.0 kg</L> بسرعة <L>2.5 m/s</L>، ويتوقف خلال مسافة <L>24.0 m</L>. ما مقدار
        الشغل المبذول بفعل الاحتكاك مع الجليد لجعل المتزلج يتوقف؟ وما مقدار الشغل الذي يجب على المتزلج أن
        يبذله ليصل إلى سرعة <L>2.5 m/s</L> مرة أخرى؟
      </>
    ),
    steps: [
      <>
        المعطيات: <L>m = 52.0 kg</L> ، <L>vᵢ = 2.5 m/s</L> ، <L>v_f = 0</L>
      </>,
      <>
        <L>KEᵢ = ½ m vᵢ² = ½ (52.0)(2.5)² = 162.5 J</L>
      </>,
      <>
        <L>KE_f = 0 J</L> لأن المتزلج يتوقف.
      </>,
      <>
        <L>W = ΔKE = KE_f − KEᵢ = 0 − 162.5 = −1.6 × 10² J</L> (شغل الاحتكاك سالب)
      </>,
      <>
        ليعود إلى <L>2.5 m/s</L> يجب أن يبذل شغلًا موجبًا: <L>W = +1.6 × 10² J</L>
      </>,
    ],
    bars: [
      { label: 'KE قبل', value: 162.5, color: COLORS.ke, text: '162.5' },
      { label: 'W', value: -162.5, color: COLORS.workNeg, text: '−162.5' },
      { label: 'KE بعد', value: 0, color: COLORS.ke, text: '0' },
    ],
    max: 162.5,
  },
  '2': {
    text: (
      <>
        سيارة صغيرة كتلتها <L>875.0 kg</L> زادت سرعتها من <L>22.0 m/s</L> إلى <L>44.0 m/s</L> عندما تجاوزت
        سيارة أخرى، فما مقدارا طاقتي حركتها الابتدائية والنهائية؟ وما مقدار الشغل المبذول على السيارة لزيادة
        سرعتها؟
      </>
    ),
    steps: [
      <>
        المعطيات: <L>m = 875.0 kg</L> ، <L>vᵢ = 22.0 m/s</L> ، <L>v_f = 44.0 m/s</L>
      </>,
      <>
        <L>KEᵢ = ½ (875.0)(22.0)² = 211,750 J ≈ 2.12 × 10⁵ J</L>
      </>,
      <>
        <L>KE_f = ½ (875.0)(44.0)² = 847,000 J ≈ 8.47 × 10⁵ J</L>
      </>,
      <>
        <L>W = ΔKE = KE_f − KEᵢ = 635,250 J ≈ 6.35 × 10⁵ J</L>
      </>,
    ],
    bars: [
      { label: 'KE قبل', value: 211750, color: COLORS.ke, text: '211,750' },
      { label: 'W', value: 635250, color: COLORS.work, text: '635,250' },
      { label: 'KE بعد', value: 847000, color: COLORS.ke, text: '847,000' },
    ],
    max: 847000,
  },
  '3': {
    text: (
      <>
        ضرب مذنب كتلته <L>7.85 × 10¹¹ kg</L> الأرض بسرعة <L>25.0 km/s</L>. جد الطاقة الحركية للمذنب بوحدة
        الجول، وقارن بين الشغل المبذول من الأرض لإيقاف المذنب والمقدار <L>4.2 × 10¹⁵ J</L> والذي يمثل الطاقة
        الناتجة عن أكبر سلاح نووي على الأرض.
      </>
    ),
    steps: [
      <>
        المعطيات: <L>m = 7.85 × 10¹¹ kg</L> ، <L>v = 25.0 km/s = 2.50 × 10⁴ m/s</L>
      </>,
      <>
        <L>KE = ½ (7.85 × 10¹¹)(2.50 × 10⁴)² = 2.45 × 10²⁰ J</L>
      </>,
      <>
        الشغل الذي تبذله الأرض لإيقافه: <L>W = −2.45 × 10²⁰ J</L>
      </>,
      <>
        المقارنة: <L>(2.45 × 10²⁰) ÷ (4.2 × 10¹⁵) ≈ 5.8 × 10⁴</L> ، أي حوالي <b>58,000</b> ضعف طاقة أكبر سلاح
        نووي.
      </>,
    ],
  },
}

/** Page 134 «مسائل تدريبية» solved step by step. */
export default function PracticeProblems() {
  const [id, setId] = useState<Id>('2')
  const [shown, setShown] = useState(1)
  const pr = PROBLEMS[id]
  const done = shown >= pr.steps.length

  return (
    <Scene>
      <Tabs
        items={[
          { id: '1', label: 'مسألة 1' },
          { id: '2', label: 'مسألة 2' },
          { id: '3', label: 'مسألة 3' },
        ]}
        value={id}
        onChange={(v) => {
          setId(v)
          setShown(1)
        }}
      />
      <p className={`shrink-0 rounded-lg border border-rose-200 bg-white p-[1.6cqw] ${small}`}>{pr.text}</p>
      <ol className={`shrink-0 space-y-[0.8cqw] ${small}`}>
        {pr.steps.slice(0, shown).map((st, i) => (
          <li key={i} className="rounded-md bg-indigo-50 px-[1.6cqw] py-[0.5cqw]">
            <b className="text-indigo-700">{i + 1}. </b>
            {st}
          </li>
        ))}
      </ol>
      <Row>
        {!done ? (
          <Btn primary onClick={() => setShown((n) => n + 1)}>
            الخطوة التالية
          </Btn>
        ) : (
          <Btn onClick={() => setShown(1)}>إعادة الحل</Btn>
        )}
        <span className={`text-stone-500 ${small}`}>
          {shown} / {pr.steps.length}
        </span>
      </Row>
      {pr.bars && done ? (
        <BarChart bars={pr.bars} max={pr.max!} signs={['+', '=']} />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
    </Scene>
  )
}
