import { useState } from 'react'
import { L } from '../../book/ui'
import { COLORS } from '../../lib/colors'
import { useClock, usePageVisible } from '../../lib/page'
import { Arrow, BarChart, Btn, Note, Row, Scene, Stage, Tabs } from '../scene-kit'

type Mode = 'throw' | 'catch' | 'money'
const PERIOD = 3.6
const PUSH = 2.2

function Baseball({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={17} fill="#fff" stroke="#44403c" strokeWidth={2} />
      <path d="M -9 -13 Q -3 0 -9 13" fill="none" stroke="#dc2626" strokeWidth={1.8} strokeDasharray="2 2" />
      <path d="M 9 -13 Q 3 0 9 13" fill="none" stroke="#dc2626" strokeWidth={1.8} strokeDasharray="2 2" />
    </g>
  )
}

/** Figures 5-1 and 5-2: work changes kinetic energy (throwing / catching a ball, and the money model). */
export default function WorkEnergyScene() {
  const [mode, setMode] = useState<Mode>('throw')
  const [spend, setSpend] = useState(false)
  const t = useClock(usePageVisible())
  const p = Math.min((t % PERIOD) / PUSH, 1)

  // Fraction of the distance d covered: speeding up when thrown, slowing down when caught.
  const s = mode === 'throw' ? p * p : 2 * p - p * p
  const keBefore = mode === 'throw' ? 0 : 100
  const work = mode === 'throw' ? 100 * s : -100 * s
  const keAfter = keBefore + work
  const ballX = 90 + 220 * s
  const speed = Math.sqrt(Math.max(keAfter, 0) / 100)

  const money = spend ? { before: 70, flow: -30 * p } : { before: 40, flow: 30 * p }

  return (
    <Scene>
      <Tabs
        items={[
          { id: 'throw', label: '(a) قذف الكرة' },
          { id: 'catch', label: '(b) التقاط الكرة' },
          { id: 'money', label: 'نموذج المال' },
        ]}
        value={mode}
        onChange={setMode}
      />

      <Stage viewBox="0 0 400 240">
        {mode !== 'money' ? (
          <>
            {/* hand */}
            <rect
              x={mode === 'throw' ? ballX - 52 : ballX + 18}
              y={98}
              width={34}
              height={44}
              rx={14}
              fill="#ffd2b0"
              stroke="#1b1f2a"
              strokeWidth={2}
            />
            <Baseball x={ballX} y={120} />
            {/* velocity */}
            {speed > 0.02 && (
              <Arrow x1={ballX} y1={78} x2={ballX + 15 + 70 * speed} y2={78} color="#dc2626" label="v" />
            )}
            {/* force */}
            {mode === 'throw' ? (
              <Arrow x1={ballX - 70} y1={170} x2={ballX - 15} y2={170} color="#059669" label="F" />
            ) : (
              <Arrow x1={ballX + 70} y1={170} x2={ballX + 15} y2={170} color="#059669" label="F" />
            )}
            {/* distance */}
            <line x1={90} x2={310} y1={205} y2={205} stroke="#44403c" strokeWidth={1.5} />
            <line x1={90} x2={90} y1={198} y2={212} stroke="#44403c" strokeWidth={1.5} />
            <line x1={310} x2={310} y1={198} y2={212} stroke="#44403c" strokeWidth={1.5} />
            <text x={200} y={228} textAnchor="middle" fontSize={16} fontStyle="italic" fill="#44403c">
              d
            </text>
            <text x={20} y={30} fontSize={16} fontWeight={700} fill={mode === 'throw' ? '#059669' : '#dc2626'} direction="ltr">
              {mode === 'throw' ? 'W > 0' : 'W < 0'}
            </text>
          </>
        ) : (
          <>
            <text x={200} y={70} textAnchor="middle" fontSize={20} fill="#44403c">
              {spend ? 'شراء قرص مدمج (CD)' : 'استلام الراتب'}
            </text>
            <text x={110} y={150} textAnchor="middle" fontSize={44}>
              💰
            </text>
            <text x={110} y={190} textAnchor="middle" fontSize={18} fontWeight={700} fill="#c2410c" direction="ltr">
              {`${money.before} ريال`}
            </text>
            <text x={200} y={150} textAnchor="middle" fontSize={30} fill={spend ? '#dc2626' : '#2563eb'} direction="ltr">
              {spend ? '−' : '+'}
            </text>
            <text x={290} y={150} textAnchor="middle" fontSize={44}>
              {spend ? '💿' : '💵'}
            </text>
            <text x={290} y={190} textAnchor="middle" fontSize={18} fontWeight={700} fill="#16a34a" direction="ltr">
              {`${Math.round(money.before + money.flow)} ريال`}
            </text>
          </>
        )}
      </Stage>

      {mode === 'money' ? (
        <>
          <Row>
            <Btn primary={!spend} onClick={() => setSpend(false)}>
              (a) كسب المال
            </Btn>
            <Btn primary={spend} onClick={() => setSpend(true)}>
              (b) إنفاق المال
            </Btn>
          </Row>
          <BarChart
            max={100}
            signs={['+', '=']}
            bars={[
              { label: 'المال قبل', value: money.before, color: '#fb923c' },
              { label: 'التدفق المالي', value: money.flow, color: '#60a5fa' },
              { label: 'المال بعد', value: money.before + money.flow, color: '#4ade80' },
            ]}
          />
          <Note>
            يعتبر المحاسب التدفق المالي <b>موجبًا</b> إذا دُفع المال لك، و<b>سالبًا</b> إذا أنفقته. والطاقة
            تشبه المال: إما أن يبذلها النظام أو تُبذل عليه.
          </Note>
        </>
      ) : (
        <>
          <BarChart
            max={100}
            signs={['+', '=']}
            bars={[
              { label: 'KE قبل', value: keBefore, color: COLORS.ke },
              { label: 'W', value: work, color: work >= 0 ? COLORS.work : COLORS.workNeg },
              { label: 'KE بعد', value: keAfter, color: COLORS.ke },
            ]}
          />
          <Note>
            {mode === 'throw' ? (
              <>
                <b className="text-emerald-700">الشغل موجب</b> لأن القوة في نفس اتجاه الحركة، فتزداد الطاقة
                الحركية: <L>KE بعد = KE قبل + W</L>
              </>
            ) : (
              <>
                <b className="text-rose-700">الشغل سالب</b> لأن القوة معاكسة لاتجاه الحركة، فتقل الطاقة الحركية
                حتى تصبح صفرًا عندما تتوقف الكرة.
              </>
            )}
          </Note>
        </>
      )}
    </Scene>
  )
}
