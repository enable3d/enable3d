import { Water } from '@enable3d/three-wrapper/src/examples'
import {
  PlaneBufferGeometry,
  Scene,
  Vector2,
  Mesh,
  MeshStandardMaterial,
  TextureLoader
} from '@enable3d/three-wrapper/src/index'

// from this example:
// https://threejs.org/examples/?q=water#webgl_water

const addWater = async (config: any = {}, scene: Scene) => {
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
    normalMap0,
    normalMap1
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
    normalMap1: normalMap1
  })
  water.position.set(x, y + 0.1, z)
  water.rotation.x = Math.PI * -0.5
  scene.add(water)
}

export { addWater }
