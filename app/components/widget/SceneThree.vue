<script setup lang="ts">
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const props = defineProps<{ accent1: string, accent2: string, background: string }>()

const container = useTemplateRef<HTMLDivElement>('container')
let dispose = () => {}

onMounted(() => {
  const el = container.value!
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(props.background)

  const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
  camera.position.z = 30

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(1)
  renderer.setSize(innerWidth, innerHeight)
  el.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.2))
  const light1 = new THREE.PointLight(props.accent1, 50, 100)
  light1.position.set(10, 10, 10)
  const light2 = new THREE.PointLight(props.accent2, 50, 100)
  light2.position.set(-10, -10, 10)
  scene.add(light1, light2)

  const grid = new THREE.GridHelper(200, 50, 0x444444, 0x222222)
  grid.rotation.x = Math.PI / 2
  grid.position.z = -20
  scene.add(grid)

  const sphere = new THREE.SphereGeometry(0.7, 16, 16)
  const pyramid = new THREE.TetrahedronGeometry(1)
  const materials = [props.accent1, props.accent2].map(color => new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.1
  }))

  const shapes = Array.from({ length: 70 }, (_, i) => {
    const isSphere = Math.random() > 0.5
    const mesh = new THREE.Mesh(isSphere ? sphere : pyramid, materials[i % 2]!)
    mesh.position.set((Math.random() - 0.5) * 70, (Math.random() - 0.5) * 50, (Math.random() - 0.5) * 30)
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0)
    mesh.scale.setScalar(Math.random() * 2 + 0.5)
    mesh.userData = { spin: (Math.random() - 0.5) * 0.03, float: (Math.random() - 0.5) * 0.015 }
    scene.add(mesh)
    return mesh
  })

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), 1.5, 0.4, 0.85))

  const onResize = () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    composer.setSize(innerWidth, innerHeight)
  }
  addEventListener('resize', onResize)

  let frame = 0
  const render = () => {
    frame = requestAnimationFrame(render)
    if (document.hidden) return
    const time = performance.now() * 0.001
    const pulse = Math.cos(time * Math.PI) ** 10
    shapes.forEach((shape, i) => {
      shape.rotation.x += shape.userData.spin
      shape.rotation.y += shape.userData.spin
      shape.position.y += Math.sin(time + i) * shape.userData.float
    })
    materials[0]!.emissiveIntensity = 0.5 + pulse * 2.5
    camera.position.x = Math.sin(time * 0.2) * 5
    camera.position.y = Math.cos(time * 0.2) * 2
    camera.lookAt(0, 0, 0)
    composer.render()
  }
  render()

  dispose = () => {
    cancelAnimationFrame(frame)
    removeEventListener('resize', onResize)
    composer.dispose()
    renderer.dispose()
    sphere.dispose()
    pyramid.dispose()
    materials.forEach(m => m.dispose())
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => dispose())
</script>

<template>
  <div ref="container" class="absolute inset-0" />
</template>
