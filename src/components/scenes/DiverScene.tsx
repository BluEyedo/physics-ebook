import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { usePageVisible, usePhase } from '../../lib/page'
import { createToonWorld } from '../../lib/toon3d'
import { Btn, Note, Scene } from '../scene-kit'

const DURATION = 4.25
const LOOP_DURATION = DURATION + 0.45
const TAKEOFF = 1.2
const WATER_ENTRY = 3.08
const WATER_Y = -1.08
const BOARD_X = -2.2
const BOARD_Y = 0.1
const BOARD_TOP = 0.06
const BOARD_STANCE = 1.5
const ENTRY_X = 1.15
const LEG_LENGTH = 0.34
const FOOT_HEIGHT = 0.067
const ARM_LENGTH = 0.57
const SHOULDER_Y = 0.75
const ARM_SPREAD = 0.19
const CAMERA_OFFSET: [number, number, number] = [1.8, 2.3, 10]
const BODY_TURN = 0.38
const FLIP_AXIS = new THREE.Vector3(0.36, 0, -0.93).normalize()

const DIVE_NOTES = {
  push: 'عند دفع الغطّاس اللوح إلى الأسفل يُخزَّن الشغل في اللوح، ثم يندفع الغطّاس إلى الأعلى بطاقة حركية خطية، ويدور قليلاً بطاقة دورانية.',
  tuck: 'الغطّاس يدور حول مركز كتلته، فله طاقة حركية دورانية، وطاقة حركية خطية بسبب حركة مركز الكتلة.',
  entry: 'عندما يدخل الماء ممدوداً بقامة مفردة يتحرك في خط مستقيم، فتظهر طاقة حركية خطية فقط.',
}

const { clamp, lerp, smoothstep } = THREE.MathUtils

function buildDiver({ toon, part }: ReturnType<typeof createToonWorld>) {
  const root = new THREE.Group()
  const facing = new THREE.Group()
  facing.rotation.y = Math.atan2(CAMERA_OFFSET[0], CAMERA_OFFSET[2]) - BODY_TURN
  const flip = new THREE.Group()
  const torso = new THREE.Group()
  root.add(facing)
  facing.add(flip)
  flip.add(torso)

  const skin = toon(0xffd2b0)
  const shorts = toon(0x4a63c9)
  const hair = toon(0x4b3a8f)
  const face = new THREE.MeshBasicMaterial({ color: 0x252037 })
  part(torso, new THREE.CapsuleGeometry(0.17, 0.45, 8, 16), skin, [0, 0.43, 0])
  part(flip, new THREE.CylinderGeometry(0.17, 0.17, 0.22, 16), shorts, [0, 0.065, 0])

  const head = new THREE.Group()
  head.position.y = 0.99
  head.rotation.y = BODY_TURN
  part(head, new THREE.SphereGeometry(0.19, 24, 18), skin)
  part(head, new THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.35), hair, [0, 0.03, 0])
  part(head, new THREE.SphereGeometry(0.12, 16, 12), hair, [0.06, 0.13, 0.12], [1.2, 0.7, 0.5])
  part(head, new THREE.SphereGeometry(0.04, 12, 10), face, [-0.072, -0.018, 0.173], [0.72, 1.15, 0.5])
  part(head, new THREE.SphereGeometry(0.04, 12, 10), face, [0.072, -0.018, 0.173], [0.72, 1.15, 0.5])
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 16, Math.PI * 0.75), face)
  smile.position.set(0, -0.058, 0.17)
  smile.rotation.z = Math.PI * 1.125
  head.add(smile)
  torso.add(head)

  const limbs = [-1, 1].map((side) => {
    const arm = new THREE.Group()
    arm.position.set(side * 0.19, SHOULDER_Y, 0)
    part(arm, new THREE.SphereGeometry(0.072, 12, 10), skin)
    part(arm, new THREE.CapsuleGeometry(0.06, ARM_LENGTH - 0.12, 6, 12), skin, [0, -ARM_LENGTH / 2, 0])
    torso.add(arm)

    const hip = new THREE.Group()
    hip.position.x = side * 0.105
    hip.rotation.order = 'YXZ'
    part(hip, new THREE.CapsuleGeometry(0.082, LEG_LENGTH - 0.06, 6, 12), skin, [0, -LEG_LENGTH / 2, 0])
    flip.add(hip)

    const knee = new THREE.Group()
    knee.position.y = -LEG_LENGTH
    part(knee, new THREE.CapsuleGeometry(0.071, LEG_LENGTH - 0.06, 6, 12), skin, [0, -LEG_LENGTH / 2, 0])
    hip.add(knee)

    const ankle = new THREE.Group()
    ankle.position.y = -LEG_LENGTH
    part(ankle, new THREE.SphereGeometry(0.09, 14, 10), skin, [0, 0, 0.055], [0.82, 0.72, 1.45])
    knee.add(ankle)

    return { side, arm, hip, knee, ankle }
  })

  // Hide submerged parts at the waterline, including the diver's ink outline.
  const surface = new THREE.Plane(new THREE.Vector3(0, 1, 0), -WATER_Y)
  for (const material of [skin, shorts, hair, face]) material.clippingPlanes = [surface]
  let clippedOutline: THREE.MeshBasicMaterial | undefined
  root.traverse((object) => {
    if (
      object instanceof THREE.Mesh &&
      object.material instanceof THREE.MeshBasicMaterial &&
      object.material.side === THREE.BackSide
    ) {
      clippedOutline ??= object.material.clone()
      clippedOutline.clippingPlanes = [surface]
      object.material = clippedOutline
    }
  })

  function pose(crouch: number, tuck: number, reach: number, point = 0) {
    const groundedBend = 0.98 * crouch
    const tuckHip = Math.PI / 2
    const hipPitch = -lerp(groundedBend, tuckHip, tuck)
    const kneePitch = lerp(groundedBend * 2, tuckHip + 0.28, tuck)
    torso.rotation.x = lerp(0.48 * crouch, 0.85, tuck)
    head.rotation.x = -0.75 * torso.rotation.x
    for (const { side, arm, hip, knee, ankle } of limbs) {
      arm.rotation.x = lerp(0.52 * crouch - Math.PI * reach, -0.24, tuck)
      arm.rotation.z = side * lerp(ARM_SPREAD, 0.24, tuck)
      hip.rotation.x = hipPitch
      hip.rotation.y = side * lerp(0.26 * crouch, 0.12, tuck)
      knee.rotation.x = kneePitch
      ankle.rotation.x = -hipPitch - kneePitch + 0.95 * point
    }

    return LEG_LENGTH * (Math.cos(hipPitch) + Math.cos(hipPitch + kneePitch)) + FOOT_HEIGHT
  }

  return { root, flip, pose }
}

function createDiverScene(stage: HTMLDivElement) {
  const world = createToonWorld(stage, {
    frustum: 2.57,
    minHalfWidth: 2.77,
    target: [0.05, 0.71, 0.1],
    offset: CAMERA_OFFSET,
  })
  const { scene, renderer, toon, part, sparkles } = world
  renderer.localClippingEnabled = true

  const board = new THREE.Group()
  board.position.set(BOARD_X, BOARD_Y, 0)
  const wood = toon(0xd9a066)
  part(board, new THREE.BoxGeometry(1.75, BOARD_TOP * 2, 0.58), wood, [0.875, 0, 0])
  part(scene, new THREE.CylinderGeometry(0.13, 0.22, 0.91, 8), wood, [BOARD_X + 0.12, BOARD_Y - 0.49, 0])

  const poolWidth = 2.83
  const poolDepth = 2.25
  const poolX = 1.07
  const poolZ = 0.08
  part(scene, new THREE.BoxGeometry(poolWidth, 0.31, poolDepth), toon(0x338ec9), [poolX, WATER_Y - 0.16, poolZ])
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(poolWidth, poolDepth),
    toon(0x7cd7ff, { transparent: true, opacity: 0.78 }),
  )
  water.rotation.x = -Math.PI / 2
  water.position.set(poolX, WATER_Y, poolZ)

  const splash = new THREE.Group()
  splash.position.set(ENTRY_X, WATER_Y, 0)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.88, 1, 48),
    new THREE.MeshBasicMaterial({ color: 0xe4faff, transparent: true, depthWrite: false }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.013
  splash.add(ring)
  const sprayMaterial = new THREE.MeshBasicMaterial({ color: 0xc7f0ff, transparent: true, depthWrite: false })
  const dropletGeometry = new THREE.SphereGeometry(0.04, 9, 6)
  const droplets = Array.from({ length: 12 }, (_, i) => {
    const mesh = new THREE.Mesh(dropletGeometry, sprayMaterial)
    splash.add(mesh)
    return { mesh, angle: i * 2.4, speed: 0.72 + (i % 4) * 0.16 }
  })

  const { root, flip, pose } = buildDiver(world)
  scene.add(board, water, root, splash)
  const boardPosition = new THREE.Vector3()

  function renderAt(time: number) {
    const load = smoothstep(time, 0.12, 0.86)
    const release = clamp((time - 0.86) / (TAKEOFF - 0.86), 0, 1)
    const sinceTakeoff = Math.max(0, time - TAKEOFF)
    board.rotation.z = -0.17 * load * (1 - release ** 2)
      + 0.08 * Math.sin(13 * sinceTakeoff) * Math.exp(-5.5 * sinceTakeoff)

    if (time <= TAKEOFF) {
      const crouch = load * (1 - smoothstep(time, 0.86, TAKEOFF))
      const reach = smoothstep(time, 0.89, TAKEOFF)
      const standingHeight = pose(crouch, 0, reach)
      // Use the rotating board's local surface to keep the diver planted during compression.
      boardPosition.set(BOARD_STANCE, BOARD_TOP + standingHeight, 0)
      root.position.copy(board.localToWorld(boardPosition))
      root.rotation.z = board.rotation.z
      flip.quaternion.identity()
    } else {
      const flight = clamp((time - TAKEOFF) / (WATER_ENTRY - TAKEOFF), 0, 1)
      const tuck = smoothstep(flight, 0.1, 0.34) * (1 - smoothstep(flight, 0.66, 0.9))
      const submerge = Math.max(0, time - WATER_ENTRY)
      pose(0, tuck, 1, smoothstep(flight, 0.82, 1))
      root.rotation.z = 0
      flip.quaternion.setFromAxisAngle(FLIP_AXIS, 3 * Math.PI * smoothstep(flight, 0.06, 0.93))

      const launchY = BOARD_Y + BOARD_TOP + 2 * LEG_LENGTH + FOOT_HEIGHT
      const entryY = WATER_Y + SHOULDER_Y + ARM_LENGTH * Math.cos(ARM_SPREAD)
      root.position.set(
        lerp(BOARD_X + BOARD_STANCE, ENTRY_X, flight) + 0.18 * (1 - Math.exp(-4 * submerge)),
        lerp(launchY, entryY, flight) + 6.65 * flight * (1 - flight) - 3.7 * submerge,
        0,
      )
    }

    const splashAge = time - WATER_ENTRY
    const ripple = clamp(splashAge / 0.92, 0, 1)
    splash.visible = splashAge >= 0 && ripple < 1
    ring.scale.setScalar(0.09 + 0.71 * ripple)
    ring.material.opacity = 0.9 * (1 - ripple)
    sprayMaterial.opacity = 1 - smoothstep(splashAge, 0.24, 0.53)
    for (const { mesh, angle, speed } of droplets) {
      const radius = 0.08 + splashAge * speed
      const height = splashAge * (1.9 * speed - 3.7 * splashAge)
      mesh.visible = height > 0
      mesh.position.set(radius * Math.cos(angle), height, radius * Math.sin(angle))
    }

    sparkles.rotation.y = time * 0.1
    world.render()
  }

  return { renderAt, dispose: world.dispose }
}

/** Figure 5-3: one continuous, scrubbable dive. */
export default function DiverScene() {
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createDiverScene> | null>(null)
  const { phase, playing, toggle, seek } = usePhase(LOOP_DURATION, usePageVisible())
  const time = Math.min(phase * LOOP_DURATION, DURATION)
  const notePhase = time < TAKEOFF ? 'push' : time < WATER_ENTRY ? 'tuck' : 'entry'

  useLayoutEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const dive = createDiverScene(stage)
    sceneRef.current = dive
    return () => {
      sceneRef.current = null
      dive.dispose()
    }
  }, [])

  useLayoutEffect(() => {
    sceneRef.current?.renderAt(time)
  }, [time])

  return (
    <Scene>
      <div className="flex shrink-0 items-center gap-3">
        <Btn onClick={toggle} label={playing ? 'إيقاف مؤقت' : 'تشغيل'}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d={playing ? 'M6 5h4v14H6zM14 5h4v14h-4z' : 'M8 5v14l11-7z'} />
          </svg>
        </Btn>
        <input
          type="range"
          aria-label="زمن حركة الغطّاس"
          dir="ltr"
          className="min-w-0 flex-1 accent-indigo-600"
          min={0}
          max={DURATION}
          step={0.01}
          value={time}
          onChange={(event) => seek(Number(event.target.value) / LOOP_DURATION)}
        />
      </div>
      <div
        ref={stageRef}
        aria-label="نموذج ثلاثي الأبعاد للغطّاس"
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-stone-300 bg-gradient-to-b from-[#ffd9ec] to-[#cfeaff]"
      />
      <Note>
        <div className="grid text-[length:max(2cqw,12px)]">
          {Object.entries(DIVE_NOTES).map(([key, text]) => (
            <p key={key} className={`col-start-1 row-start-1 ${key === notePhase ? '' : 'invisible'}`}>
              {text}
            </p>
          ))}
        </div>
      </Note>
    </Scene>
  )
}
