import * as THREE from 'three'

type Vec3 = [number, number, number]

/**
 * Shared anime/toon 3D look used by the 3D figures: orthographic camera (isometric by default),
 * 3-step toon shading, ink outlines (inverted hull), soft sparkles.
 */
export function createToonWorld(
  stage: HTMLElement,
  {
    frustum = 2.4,
    minHalfWidth = 0,
    target = [0, 0.2, 0] as Vec3,
    /** Camera position relative to the target: [6,6,6] = isometric corner, [0,1,10] = front view. */
    offset = [6, 6, 6] as Vec3,
  } = {},
) {
  const scene = new THREE.Scene()

  const camera = new THREE.OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.1, 100)
  /** Point the camera at a new target (keeps the same viewing angle). */
  function aim(t: Vec3) {
    const look = new THREE.Vector3(...t)
    camera.position.set(...offset).add(look)
    camera.lookAt(look)
  }
  aim(target)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' })
  stage.appendChild(renderer.domElement)

  const ramp = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat)
  ramp.minFilter = THREE.NearestFilter
  ramp.magFilter = THREE.NearestFilter
  ramp.needsUpdate = true

  const toon = (color: number, extra: THREE.MeshToonMaterialParameters = {}) =>
    new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...extra })
  const inkMat = new THREE.MeshBasicMaterial({ color: 0x1b1f2a, side: THREE.BackSide })
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x14161f })

  /** Adds a mesh with an ink outline. */
  function part(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, pos: Vec3 = [0, 0, 0], scale?: Vec3) {
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(...pos)
    if (scale) mesh.scale.set(...scale)
    const outline = new THREE.Mesh(geo, inkMat)
    outline.scale.setScalar(1.06)
    mesh.add(outline)
    parent.add(mesh)
    return mesh
  }

  /** Chibi person (same proportions as the diver). Arms/legs are pivots you can rotate. */
  function buildPerson({ top, bottom, hair }: { top: number; bottom: number; hair: number }) {
    const skin = toon(0xffd2b0)
    const topMat = toon(top)
    const bottomMat = toon(bottom)
    const hairMat = toon(hair)
    const root = new THREE.Group()
    part(root, new THREE.CapsuleGeometry(0.16, 0.45, 8, 16), topMat, [0, 0.45, 0])
    part(root, new THREE.CylinderGeometry(0.18, 0.2, 0.5, 16), bottomMat, [0, -0.08, 0])

    const head = new THREE.Group()
    head.position.y = 1.02
    part(head, new THREE.SphereGeometry(0.19, 24, 18), skin)
    part(head, new THREE.SphereGeometry(0.2, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2.2), hairMat, [0, 0.03, 0])
    for (const s of [-1, 1]) {
      part(head, new THREE.SphereGeometry(0.045, 12, 10), eyeMat, [s * 0.07, -0.02, 0.165], [0.8, 1.4, 0.5])
    }
    root.add(head)

    const arms: THREE.Group[] = []
    const hands: THREE.Object3D[] = []
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.25, 0.78, 0)
      part(pivot, new THREE.CapsuleGeometry(0.06, 0.45, 6, 12), skin, [0, -0.3, 0])
      const hand = new THREE.Object3D()
      hand.position.set(0, -0.6, 0)
      pivot.add(hand)
      root.add(pivot)
      arms.push(pivot)
      hands.push(hand)
    }
    const legs: THREE.Group[] = []
    for (const side of [-1, 1]) {
      const pivot = new THREE.Group()
      pivot.position.set(side * 0.09, 0.02, 0)
      part(pivot, new THREE.CapsuleGeometry(0.085, 0.6, 6, 12), skin, [0, -0.4, 0])
      root.add(pivot)
      legs.push(pivot)
    }
    return { root, arms, legs, hands }
  }

  // Lights and sparkles
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.1))
  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 6, 4)
  scene.add(key)

  const sparkCount = 40
  const sparkPos = new Float32Array(sparkCount * 3)
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3] = (Math.random() - 0.5) * 5
    sparkPos[i * 3 + 1] = Math.random() * 3 - 1.2
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 2
  }
  const sparkGeo = new THREE.BufferGeometry()
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3))
  const sparkles = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({ color: 0xfff3a0, size: 0.09, transparent: true, opacity: 0.9 }),
  )
  scene.add(sparkles)

  function resize() {
    const w = stage.clientWidth
    const h = stage.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    const aspect = w / h
    const halfHeight = Math.max(frustum, minHalfWidth / aspect)
    camera.left = -halfHeight * aspect
    camera.right = halfHeight * aspect
    camera.top = halfHeight
    camera.bottom = -halfHeight
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(() => {
    resize()
    render()
  })
  observer.observe(stage)
  resize()

  function render() {
    renderer.render(scene, camera)
  }

  /** Screen position (CSS px inside the stage) of a 3D point. */
  function project(p: THREE.Vector3) {
    const v = p.clone().project(camera)
    return { x: ((v.x + 1) / 2) * stage.clientWidth, y: ((1 - v.y) / 2) * stage.clientHeight }
  }

  function dispose() {
    observer.disconnect()
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.Line) {
        obj.geometry.dispose()
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach((m) => m.dispose())
      }
    })
    ramp.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }

  return { scene, camera, renderer, toon, part, buildPerson, sparkles, aim, render, project, dispose }
}
