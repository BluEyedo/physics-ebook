import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { usePageVisible } from '../../lib/page'

type Fig = 'a' | 'b' | 'c'

const FIGS: { id: Fig; label: string; note: string }[] = [
  {
    id: 'a',
    label: '(a) يدفع اللوح',
    note: 'عند دفع الغطّاس اللوح إلى الأسفل يُخزَّن الشغل في اللوح، ثم يندفع الغطّاس إلى الأعلى بطاقة حركية خطية، ويدور قليلاً بطاقة دورانية.',
  },
  {
    id: 'b',
    label: '(b) يدور في الهواء',
    note: 'الغطّاس يدور حول مركز كتلته، فله طاقة حركية دورانية، وطاقة حركية خطية بسبب حركة مركز الكتلة.',
  },
  {
    id: 'c',
    label: '(c) يدخل الماء',
    note: 'عندما يدخل الماء ممدوداً بقامة مفردة يتحرك في خط مستقيم، فتظهر طاقة حركية خطية فقط.',
  },
]

/** Builds the three.js scene and returns a function to switch figures plus a cleanup. */
function createDiverScene(stage: HTMLDivElement) {
  const scene = new THREE.Scene()

  // Isometric camera: orthographic, looking down the (1,1,1) diagonal
  const FRUSTUM = 2.4
  const camera = new THREE.OrthographicCamera(-FRUSTUM, FRUSTUM, FRUSTUM, -FRUSTUM, 0.1, 100)
  const target = new THREE.Vector3(0, 0.2, 0)
  camera.position.set(6, 6, 6).add(target)
  camera.lookAt(target)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  stage.appendChild(renderer.domElement)

  // Anime look: toon ramp + ink outlines + soft sparkles
  const ramp = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat)
  ramp.minFilter = THREE.NearestFilter
  ramp.magFilter = THREE.NearestFilter
  ramp.needsUpdate = true

  const toon = (color: number) => new THREE.MeshToonMaterial({ color, gradientMap: ramp })
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x1b1f2a, side: THREE.BackSide })
  const skin = toon(0xffd2b0)
  const shorts = toon(0x4a63c9)
  const wood = toon(0xd9a066)
  const hair = toon(0x4b3a8f)
  const eye = new THREE.MeshBasicMaterial({ color: 0x14161f })
  const water = new THREE.MeshToonMaterial({
    color: 0x3fb8ff,
    gradientMap: ramp,
    transparent: true,
    opacity: 0.6,
  })

  // Add a mesh with an ink outline (inverted hull)
  function part(
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    pos: [number, number, number] = [0, 0, 0],
    scale?: [number, number, number],
  ) {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...pos)
    if (scale) mesh.scale.set(...scale)
    const outline = new THREE.Mesh(geo, inkMat)
    outline.scale.setScalar(1.06)
    mesh.add(outline)
    parent.add(mesh)
    return mesh
  }

  // Chibi-proportioned diver built from volumetric parts
  function buildDiver() {
    const root = new THREE.Group()
    part(root, new THREE.CapsuleGeometry(0.15, 0.45, 8, 16), skin, [0, 0.45, 0])
    part(root, new THREE.CylinderGeometry(0.17, 0.15, 0.25, 16), shorts, [0, 0.05, 0])

    const head = new THREE.Group()
    head.position.y = 1.02
    part(head, new THREE.SphereGeometry(0.19, 24, 18), skin)
    part(head, new THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.2), hair, [0, 0.03, 0])
    part(head, new THREE.SphereGeometry(0.12, 16, 12), hair, [0.06, 0.13, 0.12], [1.2, 0.7, 0.5])
    for (const s of [-1, 1]) {
      part(head, new THREE.SphereGeometry(0.045, 12, 10), eye, [s * 0.07, -0.02, 0.165], [0.8, 1.4, 0.5])
    }
    root.add(head)

    const arms: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.24, 0.78, 0)
      part(pivot, new THREE.CapsuleGeometry(0.06, 0.45, 6, 12), skin, [0, -0.3, 0])
      root.add(pivot)
      arms.push(pivot)
    }

    const legs: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.09, 0.02, 0)
      part(pivot, new THREE.CapsuleGeometry(0.085, 0.6, 6, 12), skin, [0, -0.4, 0])
      root.add(pivot)
      legs.push(pivot)
    }

    function setPose(overhead: boolean) {
      arms.forEach((p, i) => {
        p.rotation.z = overhead ? (i === 0 ? 0.15 : -0.15) + Math.PI : i === 0 ? 0.25 : -0.25
      })
      legs.forEach((p, i) => {
        p.rotation.z = i === 0 ? 0.05 : -0.05
      })
    }
    setPose(false)
    return { root, setPose }
  }

  // Diving board: a fulcrum at its left end
  const boardPivot = new THREE.Group()
  boardPivot.position.set(-0.8, -0.9, 0)
  part(boardPivot, new THREE.BoxGeometry(1.6, 0.06, 0.35), wood, [0.8, 0, 0])
  part(boardPivot, new THREE.ConeGeometry(0.12, 0.45, 4), wood, [0, -0.23, 0])

  const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), water)
  waterMesh.rotation.x = -Math.PI / 2
  waterMesh.position.y = -0.6

  // Sparkles in the air
  const sparkCount = 40
  const sparkPos = new Float32Array(sparkCount * 3)
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * 5
    sparkPos[i * 3 + 1] = Math.random() * 3 - 0.8
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 2
  }
  const sparkGeo = new THREE.BufferGeometry()
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0xfff3a0, size: 0.09, transparent: true, opacity: 0.9 }),
  )
  scene.add(sparkles)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 6, 4)
  scene.add(key)

  const diverA = buildDiver()
  const diverB = buildDiver()
  const diverC = buildDiver()

  let fig: Fig = 'a'
  let t = 0
  const clock = new THREE.Clock()

  function setFig(name: Fig) {
    fig = name
    scene.remove(boardPivot, waterMesh, diverA.root, diverB.root, diverC.root)
    if (name === 'a') {
      scene.add(boardPivot)
      boardPivot.add(diverA.root)
      diverA.root.position.set(1.2, 0.68, 0)
      diverA.setPose(false)
    } else if (name === 'b') {
      scene.add(diverB.root)
      diverB.setPose(true)
    } else {
      scene.add(waterMesh, diverC.root)
      diverC.setPose(true)
    }
    t = 0
  }

  function resize() {
    const w = stage.clientWidth
    const h = stage.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    const aspect = w / h
    camera.left = -FRUSTUM * aspect
    camera.right = FRUSTUM * aspect
    camera.top = FRUSTUM
    camera.bottom = -FRUSTUM
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(stage)
  resize()

  let frame = 0
  function animate() {
    const dt = clock.getDelta()
    t += dt

    if (fig === 'a') {
      // push down (0→1 s), spring back up (1→1.5 s), leap and turn (1.5→3 s)
      const p = t % 3
      const press = p < 1 ? p : p < 2 ? 2 - p : 0
      boardPivot.rotation.z = -press * 0.18
      diverA.root.rotation.z = 0
      if (p >= 1.5) {
        const k = (p - 1.5) / 1.5
        diverA.root.position.y = 0.68 + Math.sin(k * Math.PI) * 1.6
        diverA.root.rotation.z = -k * Math.PI * 0.9
      } else {
        diverA.root.position.y = 0.68 - press * 0.05
      }
    } else if (fig === 'b') {
      // a somersault about the centre of mass (the root's origin)
      diverB.root.rotation.z = -t * 2.2
    } else {
      // straight body falling into the water
      const p = (t % 2.2) / 2.2
      diverC.root.position.y = 1.5 - p * 2.4
    }

    sparkles.rotation.y += dt * 0.1
    renderer.render(scene, camera)
    frame = requestAnimationFrame(animate)
  }

  // Only animate while the page is showing.
  function setActive(active: boolean) {
    if (active && !frame) {
      clock.getDelta()
      frame = requestAnimationFrame(animate)
    } else if (!active && frame) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  }

  setFig(fig)
  animate()

  return {
    setFig,
    setActive,
    dispose() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) obj.geometry.dispose()
      })
      for (const m of [inkMat, skin, shorts, wood, hair, eye, water]) m.dispose()
      ramp.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

/** Figure 5-3: interactive 3D diver (board push, somersault, water entry). */
export default function DiverScene() {
  const stageRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ReturnType<typeof createDiverScene> | null>(null)
  const [fig, setFig] = useState<Fig>('a')
  const visible = usePageVisible()

  useEffect(() => {
    const s = createDiverScene(stageRef.current!)
    sceneRef.current = s
    return () => {
      s.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setActive(visible)
  }, [visible])

  const choose = (id: Fig) => {
    setFig(id)
    sceneRef.current?.setFig(id)
  }

  return (
    <div className="flex h-full flex-col gap-[1.2cqw]">
      <div className="grid grid-cols-3 gap-[1.5cqw]">
        {FIGS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => choose(f.id)}
            className={`rounded-xl border bg-white px-[1cqw] py-[1cqw] text-[length:max(2cqw,9px)] transition ${
              fig === f.id
                ? 'border-blue-600 text-blue-700 ring-1 ring-blue-600'
                : 'border-stone-300 text-stone-700 hover:border-stone-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        ref={stageRef}
        aria-label="نموذج ثلاثي الأبعاد للغطّاس"
        className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-stone-300 bg-gradient-to-b from-[#ffd9ec] to-[#cfeaff]"
      />

      <p className="rounded-lg bg-blue-50 p-[1.6cqw] text-[length:max(calc(2cqw*var(--fit,1)),9px)] leading-relaxed text-stone-700">
        {FIGS.find((f) => f.id === fig)!.note}
      </p>
    </div>
  )
}
