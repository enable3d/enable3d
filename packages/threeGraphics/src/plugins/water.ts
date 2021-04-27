import { Mesh, MeshStandardMaterial, PlaneBufferGeometry, Scene, Texture, Vector2, WebGLRenderer } from 'three'
// @ts-ignore
import { Water } from 'three/examples/jsm/objects/Water2'
import { Color } from '@enable3d/common/src/types'

// from this example:
// https://threejs.org/examples/?q=water#webgl_water
interface AddWaterConfig {
  width?: number
  height?: number
  x?: number
  y?: number
  z?: number
  color?: Color
  scale?: number
  flowX?: number
  flowY?: number
  normalMap0?: Texture
  normalMap1?: Texture
}

const addWater = (scene: Scene, renderer: WebGLRenderer, config: AddWaterConfig = {}) => {
  const {
    width = 20,
    height = 20,
    x = 0,
    y = 0,
    z = 0,
    color = '#ffffff',
    scale = 4,
    flowX = 1,
    flowY = 1,
    normalMap0 = undefined,
    normalMap1 = undefined
  } = config

  //ground
  const groundGeometry = new PlaneBufferGeometry(width, height)
  // #0077be (also known as Ocean Boat Blue)
  const groundMaterial = new MeshStandardMaterial({ color: 0x0077be, transparent: true, opacity: 0.8 })
  const ground = new Mesh(groundGeometry, groundMaterial)
  ground.position.set(x, y, z)
  ground.rotation.x = Math.PI * -0.5
  scene.add(ground)

  // water
  const waterGeometry = new PlaneBufferGeometry(width, height)
  const water = new Water(waterGeometry, {
    color: color,
    scale: scale,
    flowDirection: new Vector2(flowX, flowY),
    textureWidth: 1024,
    textureHeight: 1024,
    normalMap0: normalMap0,
    normalMap1: normalMap1,
    encoding: renderer.outputEncoding
  })
  water.position.set(x, y + 0.1, z)
  water.rotation.x = Math.PI * -0.5
  scene.add(water)

  return { ground, water }
}

export { addWater, AddWaterConfig }
