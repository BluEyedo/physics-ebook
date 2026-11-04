import { useState } from 'react'
import { L } from '../../book/ui'
import { num, sci } from '../../lib/format'
import { useClock, usePageVisible } from '../../lib/page'
import { Btn, Chip, Note, Row, Scene, Slider, Stage, Tabs } from '../scene-kit'

const C2 = 9e16 // c² with c = 3.00 × 10⁸ m/s
const YEAR = 3.156e7

function massLabel(m: number) {
  if (m < 1e-3) return `${num(m * 1e6, 1)} mg`
  if (m < 1) return `${num(m * 1e3, 1)} g`
  return `${num(m, 2)} kg`
}

/** Page 140: rest energy E₀ = mc². */
export default function RestEnergyScene() {
  const [mode, setMode] = useState<'mass' | 'spring'>('mass')
  const [exp, setExp] = useState(-3) // mass = 10^exp kg
  const [stored, setStored] = useState(10) // J stored in a spring
  const t = useClock(usePageVisible())

  const m = 10 ** exp
  const e0 = m * C2
  const years = e0 / 100 / YEAR
  const dm = stored / C2
  const glow = 26 + (exp + 6) * 13
  const coils = 8
  const springLen = 150 - 100 * (Math.log10(stored) / 3)

  return (
    <Scene>
      <Tabs
        items={[
          { id: 'mass', label: 'من الكتلة إلى الطاقة' },
          { id: 'spring', label: 'نابض مضغوط' },
        ]}
        value={mode}
        onChange={setMode}
      />
      <Stage viewBox="0 0 400 240">
        {mode === 'mass' ? (
          <>
            <rect x={45} y={95} width={60} height={60} rx={8} fill="#64748b" stroke="#1b1f2a" strokeWidth={2} />
            <text x={75} y={131} textAnchor="middle" fontSize={20} fill="#fff" fontStyle="italic">
              m
            </text>
            <text x={75} y={180} textAnchor="middle" fontSize={14} fill="#334155" direction="ltr">
              {massLabel(m)}
            </text>
            <text x={170} y={118} textAnchor="middle" fontSize={16} fill="#334155" direction="ltr">
              E₀ = mc²
            </text>
            <line x1={130} x2={205} y1={128} y2={128} stroke="#334155" strokeWidth={2} />
            <polygon points="212,128 202,122 202,134" fill="#334155" />
            <g transform={`translate(295 125) rotate(${(t * 20) % 360})`}>
              {Array.from({ length: 12 }, (_, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={glow * 0.55}
                  x2={0}
                  y2={glow * 0.95}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  strokeLinecap="round"
                  transform={`rotate(${i * 30})`}
                />
              ))}
            </g>
            <circle cx={295} cy={125} r={glow * 0.5} fill="#fde047" opacity={0.9} />
            <circle cx={295} cy={125} r={glow * 0.3} fill="#fff7ae" />
          </>
        ) : (
          <>
            <line x1={40} x2={40} y1={80} y2={170} stroke="#334155" strokeWidth={6} />
            <polyline
              fill="none"
              stroke="#0ea5e9"
              strokeWidth={4}
              points={[
                `40,125`,
                ...Array.from({ length: coils * 2 }, (_, i) => `${40 + ((i + 1) * springLen) / (coils * 2 + 1)},${i % 2 ? 100 : 150}`),
                `${40 + springLen},125`,
              ].join(' ')}
            />
            <rect x={40 + springLen} y={95} width={50} height={60} rx={6} fill="#64748b" stroke="#1b1f2a" strokeWidth={2} />
            <polygon points={`${150 + springLen},125 ${110 + springLen},110 ${110 + springLen},140`} fill="#dc2626" />
            <text x={300} y={80} textAnchor="middle" fontSize={15} fill="#334155" direction="ltr">
              Δm = E / c²
            </text>
            <text x={300} y={110} textAnchor="middle" fontSize={15} fontWeight={700} fill="#0369a1" direction="ltr">
              {`${sci(dm)} kg`}
            </text>
          </>
        )}
      </Stage>

      {mode === 'mass' ? (
        <>
          <Row>
            <Btn primary={exp === -6} onClick={() => setExp(-6)}>
              1 mg
            </Btn>
            <Btn primary={exp === -3} onClick={() => setExp(-3)}>
              1 g
            </Btn>
            <Btn primary={exp === 0} onClick={() => setExp(0)}>
              1 kg
            </Btn>
          </Row>
          <Slider label="الكتلة" value={exp} min={-6} max={0} step={0.1} onChange={setExp} shown={massLabel(m)} />
          <Row>
            <Chip>
              <L>E₀ = {sci(e0)} J</L>
            </Chip>
          </Row>
          <Note>
            هذه الطاقة تكفي لإنارة مصباح قدرته <L>100 W</L> مدة <b>{years >= 1e6 ? sci(years, 1) : num(years, 1)}</b>{' '}
            سنة تقريبًا. (<L>c = 3.00 × 10⁸ m/s</L>)
          </Note>
        </>
      ) : (
        <>
          <Slider label="الطاقة المختزنة" value={stored} min={1} max={1000} step={1} onChange={setStored} shown={`${stored} J`} />
          <Note>
            ضغط النابض يُكسبه كتلة إضافية <L>Δm = {sci(dm)} kg</L> فقط، وهي صغيرة جدًّا يصعب الكشف عنها. أما في
            القوى النووية فتكون الطاقة المتحررة نتيجة تغيرات الكتلة كبيرة جدًّا.
          </Note>
        </>
      )}
    </Scene>
  )
}
