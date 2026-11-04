import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { L } from '../../book/ui'
import { num } from '../../lib/format'
import { usePageVisible, usePhase } from '../../lib/page'
import { createToonWorld } from '../../lib/toon3d'
import { Btn, Chip, Note, Row, Scene, Slider } from '../scene-kit'

const G = 9.8
const UNITS_PER_M = 0.72
const RIGHT = new THREE.Vector3(1, 0, 0) // screen-right direction for the front camera
const MAX_H = 3 // m, top of the height slider

/** 3D juggler (figure 5-5) in the same toon style as the diver. Driven by `update(phase, H, m)`. */
function createGravityWorld(stage: HTMLDivElement) {
  // Front camera, slightly raised so the 3D shapes still read. It is aimed once the hand positions are known.
  const w = createToonWorld(stage, { frustum: 1.5, offset: [0, 1.2, 10] })
  const { scene, part, toon } = w

  // Floor
  // const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.06, 40), toon(0xbfe3b4))
  // floor.position.y = -2.0
  // scene.add(floor)

  // Ball player in a white thobe facing the camera: right hand out to the side, left arm relaxed
  const person = w.buildPerson({ top: 0xffffff, bottom: 0xffffff, hair: 0x3f2d20 })
  person.root.position.set(-0.25, -1.2, 0)
  person.arms[0].rotation.z = -0.2
  person.arms[1].rotation.x = -0.3
  person.arms[1].rotation.z = 1.2
  scene.add(person.root)
  scene.updateMatrixWorld(true)
  const rightHand = person.hands[1].getWorldPosition(new THREE.Vector3())
  const base = rightHand.clone().add(new THREE.Vector3(0, 0.1, 0)) // ball resting on the hand (h = 0)

  // Centre the frame on the juggler and halfway up the ball's highest path
  w.aim([person.root.position.x, base.y + (MAX_H * UNITS_PER_M) / 2, 0])

  // Reference level (h = 0): a horizontal line at hand height, centred on the body
  const REF_HALF = 1.1
  const refLine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, REF_HALF * 2, 8),
    new THREE.MeshBasicMaterial({ color: 0x2563eb }),
  )
  refLine.rotation.z = Math.PI / 2
  // Pushed forward (z) so it passes in front of the torso instead of through it
  refLine.position.set(person.root.position.x, base.y, Math.max(base.z, 0.35))
  scene.add(refLine)

  // The ball (right hand, thrown straight up)
  const ball = part(scene, new THREE.SphereGeometry(1, 24, 18), toon(0xfacc15))

  // Arrows: gravity (red, always down) and displacement (blue, up or down)
  const fg = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 0.55, 0xdc2626, 0.16, 0.11)
  const disp = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 0.45, 0x2563eb, 0.16, 0.11)
  scene.add(fg, disp)

  // Height marker (dashed line from the reference level to the ball)
  const hGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)])
  const hLine = new THREE.Line(hGeo, new THREE.LineDashedMaterial({ color: 0x334155, dashSize: 0.07, gapSize: 0.05 }))
  scene.add(hLine)

  // HTML labels positioned over the canvas
  const overlay = document.createElement('div')
  overlay.style.cssText = 'position:absolute;inset:0;pointer-events:none;font-weight:700;font-size:13px'
  stage.appendChild(overlay)
  const label = (text: string, color: string) => {
    const el = document.createElement('span')
    el.textContent = text
    el.style.cssText = `position:absolute;transform:translate(-50%,-50%);color:${color};white-space:nowrap;direction:ltr`
    overlay.appendChild(el)
    return el
  }
  const fgLabel = label('Fg', '#dc2626')
  const dLabel = label('d', '#2563eb')
  const hLabel = label('h', '#334155')
  const place = (el: HTMLElement, p: THREE.Vector3, visible = true) => {
    const s = w.project(p)
    el.style.left = `${s.x}px`
    el.style.top = `${s.y}px`
    el.style.display = visible ? '' : 'none'
  }

  function update(phase: number, H: number, m: number) {
    const h = H * 4 * phase * (1 - phase)
    const up = phase < 0.5
    const r = 0.09 + 0.05 * m
    const pos = base.clone().add(new THREE.Vector3(0, r + h * UNITS_PER_M, 0))
    ball.position.copy(pos)
    ball.scale.setScalar(r)

    // Fg on the left of the ball, d on the right
    fg.position.copy(pos.clone().addScaledVector(RIGHT, -0.32).add(new THREE.Vector3(0, 0.25, 0)))
    const showD = h > 0.05
    disp.visible = showD
    disp.setDirection(new THREE.Vector3(0, up ? 1 : -1, 0))
    disp.position.copy(pos.clone().addScaledVector(RIGHT, 0.32).add(new THREE.Vector3(0, up ? -0.22 : 0.22, 0)))

    // Height line runs straight up from the reference level to the centre of the ball
    const hLen = Math.max(pos.y - base.y, 0.001)
    hLine.position.copy(base)
    hLine.scale.set(1, hLen, 1)
    hLine.computeLineDistances()
    hLine.visible = showD

    w.sparkles.rotation.y = (performance.now() / 1000) * 0.1
    w.render()

    place(fgLabel, fg.position.clone().add(new THREE.Vector3(0, -0.7, 0)).addScaledVector(RIGHT, -0.14))
    place(dLabel, disp.position.clone().add(new THREE.Vector3(0, up ? 0.58 : -0.58, 0)).addScaledVector(RIGHT, 0.14), showD)
    place(hLabel, hLine.position.clone().add(new THREE.Vector3(0, hLen / 2, 0)).addScaledVector(RIGHT, 0.12), showD)
  }

  return {
    update,
    dispose() {
      overlay.remove()
      w.dispose()
    },
  }
}

/** Figure 5-5: a ball thrown up — gravity does negative work going up, positive work coming down. */
export default function GravityScene() {
  const { phase, playing, toggle, seek } = usePhase(2.6, usePageVisible())
  const [m, setM] = useState(0.5)
  const [H, setH] = useState(2)
  const stageRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<ReturnType<typeof createGravityWorld> | null>(null)

  useEffect(() => {
    const world = createGravityWorld(stageRef.current!)
    worldRef.current = world
    return () => {
      world.dispose()
      worldRef.current = null
    }
  }, [])

  useEffect(() => {
    worldRef.current?.update(phase, H, m)
  }, [phase, H, m])

  const h = H * 4 * phase * (1 - phase)
  const up = phase < 0.5
  const pe = m * G * h

  return (
    <Scene>
      <div
        ref={stageRef}
        aria-label="نموذج ثلاثي الأبعاد لكرة يقذفها لاعب إلى أعلى"
        className="relative min-h-0 flex-[1.6] overflow-hidden rounded-xl border border-stone-300 bg-gradient-to-b from-[#ffd9ec] to-[#cfeaff]"
      />
      <Row>
        <Chip>
          <L>h = {h.toFixed(2)} m</L>
        </Chip>
        <Chip>
          <L>PE = mgh = {num(pe, 2)} J</L>
        </Chip>
        <Chip tone={up ? 'red' : 'green'}>
          <L>{up ? 'Wg = −mgh' : 'Wg = +mgh'}</L> {up ? 'سالب' : 'موجب'}
        </Chip>
      </Row>
      <Slider label="الكتلة m" value={m} min={0.1} max={2} step={0.1} onChange={setM} shown={`${m.toFixed(1)} kg`} />
      <Slider label="أقصى ارتفاع" value={H} min={0.5} max={3} step={0.1} onChange={setH} shown={`${H.toFixed(1)} m`} />
      <Slider
        label="موضع الكرة"
        value={phase}
        min={0}
        max={0.999}
        step={0.005}
        onChange={seek}
        shown={up ? 'صعود' : 'سقوط'}
      />
      <Row>
        <Btn onClick={toggle}>{playing ? 'إيقاف مؤقت' : 'تشغيل'}</Btn>
      </Row>
      <Note>
        {up ? (
          <>
            في أثناء <b>الصعود</b>: الإزاحة إلى أعلى وقوة الجاذبية إلى أسفل، فيكون شغل الجاذبية <b>سالبًا</b>{' '}
            <L>Wg = −mgh</L> فتقل سرعة الكرة وتزداد طاقة وضعها.
          </>
        ) : (
          <>
            في أثناء <b>السقوط</b>: القوة والإزاحة في الاتجاه نفسه، فيكون شغل الجاذبية <b>موجبًا</b>{' '}
            <L>Wg = mgh</L> فتزداد سرعة الكرة وتستعيد طاقتها الحركية.
          </>
        )}
      </Note>
    </Scene>
  )
}
