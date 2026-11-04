import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import * as THREE from 'three'
import { COLORS } from '../../lib/colors'
import { createValueStore, useClock, usePageVisible, usePhase } from '../../lib/page'
import { createToonWorld } from '../../lib/toon3d'
import { BarChart, Btn, Note, Row, Scene, Slider, Stage, Tabs } from '../scene-kit'

/** Figure 5-7: pull the bow string (elastic PE), release it (KE of the arrow). */
function Bow() {
  const t = useClock(usePageVisible())
  const [pull, setPull] = useState(0.7)
  const [releasedAt, setReleasedAt] = useState<number | null>(null)

  const k = releasedAt === null ? 0 : Math.min((t - releasedAt) / 1.4, 1)
  const snap = Math.min(k / 0.12, 1)
  const energy = 100 * pull * pull
  const curPull = releasedAt === null ? pull : pull * (1 - snap)
  const elastic = releasedAt === null ? energy : energy * (1 - snap) ** 2
  const kinetic = energy - elastic
  const flight = releasedAt === null ? 0 : Math.max(0, k - 0.12) / 0.88

  const nockX = 175 - 85 * curPull
  const tail = releasedAt !== null && snap >= 1 ? 175 + flight * 420 : nockX
  const tipY = 6 * curPull

  return (
    <>
      <Stage>
        {/* bow limbs and grip */}
        <path d={`M 190 ${48 + tipY} Q 268 150 190 ${252 - tipY}`} fill="none" stroke="#7c2d12" strokeWidth={7} strokeLinecap="round" />
        <rect x={218} y={135} width={14} height={30} rx={5} fill="#292524" />
        {/* string */}
        <path d={`M 190 ${48 + tipY} L ${nockX} 150 L 190 ${252 - tipY}`} fill="none" stroke="#334155" strokeWidth={2} />
        {/* arrow */}
        <g>
          <line x1={tail} x2={tail + 150} y1={150} y2={150} stroke="#44403c" strokeWidth={4} />
          <polygon points={`${tail + 165},150 ${tail + 147},142 ${tail + 147},158`} fill="#475569" />
          <polygon points={`${tail},150 ${tail + 16},140 ${tail + 22},150 ${tail + 16},160`} fill="#dc2626" />
        </g>
        {releasedAt === null && pull > 0 && (
          <text x={nockX - 6} y={190} textAnchor="middle" fontSize={13} fill="#be185d">
            شدّ
          </text>
        )}
      </Stage>
      <BarChart
        max={100}
        bars={[
          { label: 'مرونية', value: elastic, color: COLORS.el },
          { label: 'حركية', value: kinetic, color: COLORS.ke },
        ]}
      />
      <Slider
        label="شدّ الوتر"
        value={pull}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => {
          setPull(v)
          setReleasedAt(null)
        }}
        shown={`${Math.round(pull * 100)}%`}
      />
      <Row>
        <Btn primary disabled={releasedAt !== null || pull === 0} onClick={() => setReleasedAt(t)}>
          أفلت السهم
        </Btn>
        <Btn disabled={releasedAt === null} onClick={() => setReleasedAt(null)}>
          إعادة
        </Btn>
      </Row>
      <Note>
        عند شدّ الوتر يُبذل شغل على القوس فتُختزن فيه <b>طاقة وضع مرونية</b> تزداد كلما زاد الشدّ. وعند إفلات
        الوتر تتحول هذه الطاقة إلى <b>طاقة حركية</b> للسهم.
      </Note>
    </>
  )
}

// ── Pole vault in 3D (same toon style as the diver) ──

const GROUND = -1.45
const PLANT = new THREE.Vector3(0, GROUND, 0) // where the pole hits the box (moved back from the bar)
const TAKEOFF_DIST = 3.0 // the vaulter leaves the ground this far before the plant box
const RUN_START_X = -4.3

// Timeline (fractions of one loop)
const RUN_END = 0.35 // running → plant
const BEND_END = 0.55 // pole bends → starts straightening
const VAULT_END = 0.8 // pole straight, vaulter at the top → lets go
const OVER_END = 0.89 // floats over the bar → falls to the mat
const RUN_ARM = -2.4 // arms raised: the pole is carried high
const VAULTER_SCALE = 0.55 // keeps a real-looking ratio: the bar is about 2.5× the vaulter's height
const HOP = 0.2 // take-off jump just before the plant, so the feet leave the ground

export type Energies = { ke: number; el: number; pe: number }

/** Caption for each stage of the jump (the bar values are measured from the 3D scene). */
function stageText(phase: number) {
  if (phase < RUN_END) return 'الركض: الطاقة كلها طاقة حركية.'
  if (phase < BEND_END) return 'ثني الزانة: تتحول الطاقة الحركية للاعب إلى طاقة وضع مرونية.'
  if (phase < VAULT_END) return 'استقامة الزانة: تتحول طاقة الوضع المرونية إلى طاقة وضع جاذبية وطاقة حركية.'
  if (phase < OVER_END) return 'أعلى نقطة: معظم الطاقة طاقة وضع جاذبية (ارتفاع قرابة 6 m).'
  return 'الهبوط: تتحول طاقة الوضع الجاذبية إلى طاقة حركية.'
}

const ease = (x: number) => x * x * (3 - 2 * x)
const lerp = THREE.MathUtils.lerp

function createVaultWorld(stage: HTMLDivElement, onMeasure: (e: Energies) => void) {
  // Side-on view from slightly to the right and above, so the bar's depth still shows
  const w = createToonWorld(stage, { frustum: 2.8, offset: [3, 1.8, 10], target: [-0.4, GROUND + 2.6, 0] })
  const { scene, part, toon } = w

  // Runway, landing mat and plant box
  const runway = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.06, 1.2), toon(0xd97757))
  runway.position.set(-2.4, GROUND - 0.03, 0)
  scene.add(runway)
  const MAT = { x0: 0.9, x1: 3.0, top: GROUND + 0.25 }
  const landing = new THREE.Mesh(new THREE.BoxGeometry(MAT.x1 - MAT.x0, 0.25, 1.8), toon(0x60a5fa))
  landing.position.set((MAT.x0 + MAT.x1) / 2, GROUND + 0.125, 0)
  scene.add(landing)
  part(scene, new THREE.BoxGeometry(0.22, 0.05, 0.22), toon(0x44403c), [PLANT.x, GROUND + 0.02, 0])

  // Vaulter: the rig sits at the gripping hand; the body hangs from it and swings with rotation.z
  const rig = new THREE.Group()
  const facing = new THREE.Group()
  facing.rotation.y = Math.PI / 2 // face the run direction (+x)
  rig.add(facing)
  const person = w.buildPerson({ top: 0xf97316, bottom: 0x1e3a8a, hair: 0x3f2d20 })
  facing.add(person.root)
  rig.scale.setScalar(VAULTER_SCALE)
  scene.add(rig)
  // Everything except the arms: used for collision checks (the gripping arm may touch the pole)
  const bodyParts = person.root.children.filter((c) => !person.arms.includes(c as THREE.Group))

  // Pole, rebuilt every frame as a (possibly bent) tube in the z = 0 plane
  const pole = new THREE.Mesh(new THREE.BufferGeometry(), toon(0x0ea5e9))
  scene.add(pole)

  // The hand nearest the camera grips the pole, so the body stays BEHIND the pole (z < 0)
  const GRIP_HAND = person.hands[0]
  const POLE_GAP = 0.25 // extra depth between the pole and the body
  const POLE_CLEAR = -0.08 // body parts must stay behind this z
  const setArms = (a: number) => person.arms.forEach((p) => (p.rotation.x = a))
  // Only the vaulter's own matrices are updated (cheap), not the whole scene
  const handInFacing = () => {
    rig.updateMatrixWorld(true)
    return facing.worldToLocal(GRIP_HAND.getWorldPosition(new THREE.Vector3()))
  }
  const bodyBox = () => {
    rig.updateMatrixWorld(true)
    const box = new THREE.Box3()
    bodyParts.forEach((p) => box.expandByObject(p))
    return box
  }
  /** Floor height under a body box: the mat top where the body is over the mat, else the runway. */
  const floorUnder = (box: THREE.Box3) => (box.max.x > MAT.x0 && box.min.x < MAT.x1 ? MAT.top : GROUND)

  /** Places the body so the gripping hand is at `grip`, rotated by `tilt`. */
  function placeBody(grip: THREE.Vector3, tilt: number) {
    person.root.position.set(0, 0, 0)
    rig.position.set(0, 0, 0)
    rig.rotation.z = 0
    person.root.position.sub(handInFacing())
    person.root.position.x += POLE_GAP // facing-local +x is world −z: push the body back from the pole
    rig.position.copy(grip)
    rig.rotation.z = tilt
  }

  // Geometry of the jump
  // Measure (not guess) how high the gripping hand is above the feet in the running pose,
  // so the feet touch the runway exactly when the jump starts
  setArms(RUN_ARM)
  placeBody(new THREE.Vector3(0, 0, 0), 0)
  const runGripY = GROUND + 0.025 - bodyBox().min.y
  const takeoffY = runGripY + HOP
  const RUN_END_X = PLANT.x - TAKEOFF_DIST
  const poleLen = Math.hypot(PLANT.x - RUN_END_X, PLANT.y - takeoffY)
  const theta0 = Math.atan2(takeoffY - PLANT.y, RUN_END_X - PLANT.x)
  const thetaTop = THREE.MathUtils.degToRad(80) // the pole swings a little past upright, toward the bar
  const TOP = new THREE.Vector3(PLANT.x + poleLen * Math.cos(thetaTop), PLANT.y + poleLen * Math.sin(thetaTop), 0)

  // Uprights and crossbar (≈ 6 m): past the pole and below the hands' highest point, so the body clears it
  const BAR_X = TOP.x + 0.6 // far enough that the swinging legs pass under it while on the pole
  const BAR_Y = TOP.y - 0.35
  for (const z of [-0.8, 0.8]) {
    part(
      scene,
      new THREE.CylinderGeometry(0.035, 0.035, BAR_Y - GROUND + 0.15, 10),
      toon(0x64748b),
      [BAR_X, (BAR_Y + GROUND) / 2 + 0.07, z],
    )
  }
  const bar = part(scene, new THREE.CylinderGeometry(0.022, 0.022, 1.6, 10), toon(0xdc2626), [BAR_X, BAR_Y, 0])
  bar.rotation.x = Math.PI / 2

  // Where the release and landing go
  const OVER = new THREE.Vector3(BAR_X + 0.4, TOP.y + 0.15, 0) // just past the bar, still above it
  // The body lies to the left of the hands when landing, so the hands go far enough past the bar
  // that the whole body is clear of it before dropping.
  const PAST = new THREE.Vector3(BAR_X + 1.35, BAR_Y + 0.3, 0)
  const LAND = new THREE.Vector3(PAST.x, MAT.top + 0.2, 0)
  const DROP = OVER_END + 0.055 // phase when the body is past the bar and starts to drop

  // Label for the bar height
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-weight:700;font-size:13px'
  stage.appendChild(overlay)
  const barLabel = document.createElement('span')
  barLabel.textContent = '≈ 6 m'
  barLabel.style.cssText = 'position:absolute;transform:translate(-50%,-50%);color:#475569;direction:ltr'
  overlay.appendChild(barLabel)

  /** Poses the vaulter for this moment of the jump (with collision guards). */
  function pose(phase: number) {
    const grip = new THREE.Vector3()
    let tilt = 0
    let arm = RUN_ARM
    let bend = 0
    let held = true // is the pole still in the hands?

    if (phase < RUN_END) {
      // Running up with the pole; the leg swing ends at zero so take-off doesn't jump
      const k = phase / RUN_END
      const hop = ease(THREE.MathUtils.clamp((k - 0.8) / 0.2, 0, 1)) // last steps: jump off the ground
      grip.set(lerp(RUN_START_X, RUN_END_X, k), runGripY + HOP * hop, 0)
      const swing = Math.sin(k * Math.PI * 8) * 0.7
      person.legs[0].rotation.x = swing
      person.legs[1].rotation.x = -swing
    } else if (phase < VAULT_END) {
      // Plant, bend, swing up
      const u = (phase - RUN_END) / (VAULT_END - RUN_END)
      bend = Math.sin(Math.PI * u)
      const th = theta0 + (thetaTop - theta0) * ease(u)
      const R = poleLen * (1 - 0.28 * bend)
      grip.set(PLANT.x + R * Math.cos(th), PLANT.y + R * Math.sin(th), 0)
      arm = lerp(RUN_ARM, -Math.PI, ease(Math.min(u / 0.4, 1))) // arms go overhead
      tilt = Math.PI * 0.9 * Math.pow(ease(u), 1.6) // swing the feet up, mostly once the pole is high
      person.legs.forEach((l) => (l.rotation.x = -0.2 * bend))
    } else if (phase < OVER_END) {
      // Let go and float over the bar
      held = false
      const k = ease((phase - VAULT_END) / (OVER_END - VAULT_END))
      grip.set(lerp(TOP.x, OVER.x, k), lerp(TOP.y, OVER.y, k) + 0.2 * Math.sin(Math.PI * k), 0)
      arm = -Math.PI
      tilt = Math.PI * lerp(0.9, 1.2, k)
      person.legs.forEach((l) => (l.rotation.x = 0))
    } else {
      // Move fully past the bar while still high, then drop onto the mat, ending on the back
      held = false
      arm = -Math.PI
      person.legs.forEach((l) => (l.rotation.x = 0))
      if (phase < DROP) {
        const g = ease((phase - OVER_END) / (DROP - OVER_END))
        grip.set(lerp(OVER.x, PAST.x, g), lerp(OVER.y, PAST.y, g), 0)
        tilt = Math.PI * lerp(1.2, 1.45, g)
      } else {
        const g = ease((phase - DROP) / (1 - DROP))
        grip.set(PAST.x, lerp(PAST.y, LAND.y, g), 0)
        tilt = Math.PI * lerp(1.45, 1.5, g)
      }
    }

    setArms(arm)
    placeBody(grip, tilt)

    // ── Collision guards (all continuous, so nothing jumps) ──
    // 1) Floor: if the body would dip into the runway or mat, find the smallest extra
    //    swing (tilt) that lifts it clear, by bisection.
    const clearance = () => {
      const b = bodyBox()
      return b.min.y - (floorUnder(b) + 0.02)
    }
    if (phase >= RUN_END && held && clearance() < 0) {
      const base = tilt
      let lo = base
      let hi = base
      for (let i = 1; i <= 40; i++) {
        hi = base + i * 0.03
        placeBody(grip, hi)
        if (clearance() >= 0) break
        lo = hi
      }
      for (let i = 0; i < 6; i++) {
        const mid = (lo + hi) / 2
        placeBody(grip, mid)
        if (clearance() >= 0) hi = mid
        else lo = mid
      }
      tilt = hi
      placeBody(grip, tilt)
    }
    const c = clearance()
    if (c < 0) rig.position.y -= c // last resort: lift by exactly the overlap

    // 2) Pole: keep every body part behind the pole's plane
    const front = bodyBox().max.z
    if (front > POLE_CLEAR) rig.position.z -= front - POLE_CLEAR

    // 3) Bar: once the pole is released and the body passes over the bar, lift by exactly any overlap
    //    (normally never needed). While still on the pole the body is below the bar, so it is not checked.
    const box = bodyBox()
    if (!held && box.max.x > BAR_X - 0.05 && box.min.x < BAR_X + 0.05 && box.min.y < BAR_Y + 0.06) {
      rig.position.y += BAR_Y + 0.06 - box.min.y
    }
    return { grip, held, bend }
  }

  // ── Energy measured from the scene ──
  // Gravitational PE follows the height of the hips (≈ centre of mass) above their height while running;
  // elastic PE follows how much the pole is bent; KE is what is left of the total (energy is conserved).
  const hips = () => {
    rig.updateMatrixWorld(true)
    return person.root.getWorldPosition(new THREE.Vector3()).y
  }
  pose(0)
  const hipsRun = hips()
  let hipsTop = hipsRun
  for (let p = RUN_END; p < OVER_END; p += 0.01) {
    pose(p)
    hipsTop = Math.max(hipsTop, hips())
  }
  const PE_TOP = 90 // at the highest point, as in the textbook
  const EL_MAX = 62 // when the pole is bent the most (leaves some KE: the vaulter is still swinging)

  function update(phase: number) {
    const { grip, held, bend } = pose(phase)

    const pe = THREE.MathUtils.clamp((PE_TOP * (hips() - hipsRun)) / (hipsTop - hipsRun), 0, 100)
    const el = held && phase >= RUN_END ? Math.min(EL_MAX * bend * bend, 100 - pe) : 0
    onMeasure({ ke: Math.max(100 - pe - el, 0), el, pe })

    // Pole: straight while running, bent while vaulting, left standing once released
    let curve: THREE.Curve<THREE.Vector3>
    if (phase < RUN_END) {
      // Carried pole points from the hands toward the plant box, reaching it exactly at take-off
      const tip = new THREE.Vector3(grip.x + (PLANT.x - RUN_END_X), lerp(GROUND + 0.35, PLANT.y, (grip.x - RUN_START_X) / (RUN_END_X - RUN_START_X)), 0)
      const dir = tip.clone().sub(grip).normalize()
      curve = new THREE.LineCurve3(grip.clone().addScaledVector(dir, -0.15), tip)
    } else if (!held) {
      curve = new THREE.LineCurve3(PLANT.clone(), TOP.clone())
    } else {
      const mid = PLANT.clone().lerp(grip, 0.5)
      const d = grip.clone().sub(PLANT)
      const n = new THREE.Vector3(-d.y, d.x, 0).normalize()
      if (n.y < 0) n.negate()
      curve = new THREE.QuadraticBezierCurve3(PLANT.clone(), mid.addScaledVector(n, 0.75 * bend), grip.clone())
    }
    const old = pole.geometry
    pole.geometry = new THREE.TubeGeometry(curve, 20, 0.035, 8, false)
    old.dispose()

    w.render()
    const s = w.project(new THREE.Vector3(BAR_X, BAR_Y + 0.15, 0.8))
    barLabel.style.left = `${s.x + 22}px`
    barLabel.style.top = `${s.y}px`
  }

  return {
    update,
    dispose() {
      overlay.remove()
      w.dispose()
    },
  }
}

/** Figure 5-8: pole vault — KE → elastic PE → gravitational PE. */
function Vault() {
  const { phase, playing, toggle, seek } = usePhase(5, usePageVisible())
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<ReturnType<typeof createVaultWorld> | null>(null)
  const [store] = useState(() => createValueStore<Energies>({ ke: 100, el: 0, pe: 0 }))
  const { ke, el, pe } = useSyncExternalStore(store.subscribe, store.get)
  const text = stageText(phase)

  useEffect(() => {
    const world = createVaultWorld(stageRef.current!, store.set)
    worldRef.current = world
    return () => {
      world.dispose()
      worldRef.current = null
    }
  }, [store])

  useEffect(() => {
    worldRef.current?.update(phase)
  }, [phase])

  return (
    <>
      <div
        ref={stageRef}
        aria-label="نموذج ثلاثي الأبعاد للقفز بالزانة"
        className="relative min-h-0 flex-[1.4] overflow-hidden rounded-xl border border-stone-300 bg-gradient-to-b from-[#ffd9ec] to-[#cfeaff]"
      />
      <BarChart
        max={100}
        bars={[
          { label: 'حركية', value: ke, color: COLORS.ke },
          { label: 'مرونية', value: el, color: COLORS.el },
          { label: 'جاذبية', value: pe, color: COLORS.pe },
        ]}
      />
      <Row>
        <Btn onClick={toggle}>{playing ? 'إيقاف مؤقت' : 'تشغيل'}</Btn>
      </Row>
      <Slider
        label="مرحلة القفزة"
        value={phase}
        min={0}
        max={0.999}
        step={0.005}
        onChange={seek}
        shown={`${Math.round(phase * 100)}%`}
      />
      <Note>{text}</Note>
    </>
  )
}

export default function ElasticScene() {
  const [mode, setMode] = useState<'bow' | 'vault'>('bow')
  return (
    <Scene>
      <Tabs
        items={[
          { id: 'bow', label: 'القوس والسهم (5-7)' },
          { id: 'vault', label: 'القفز بالزانة (5-8)' },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === 'bow' ? <Bow /> : <Vault />}
    </Scene>
  )
}
