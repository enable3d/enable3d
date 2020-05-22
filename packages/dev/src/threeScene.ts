import { Project, Scene3D, PhysicsLoader } from 'enable3d'
import { SpotLight, SpotLightHelper, PointLight, DirectionalLight } from '../../threeWrapper/dist'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  spot: SpotLight
  spotHelper: SpotLightHelper
  point: PointLight
  directional: DirectionalLight

  async create() {
    this.warpSpeed('-sky', '-light', '-grid')

    this.add.box({ y: 2 })

    this.spot = this.lights.spotLight({ color: 0x7f00ff, angle: Math.PI / 8 })
    this.spotHelper = this.lights.helper.spotLightHelper(this.spot)

    this.point = this.lights.pointLight({ color: 0x00ff7f, intensity: 2 })
    this.point.position.set(0, 5, 0)
    this.lights.helper.pointLightHelper(this.point)

    this.directional = this.lights.directionalLight({ color: 0xff7f00 })
    this.directional.position.set(5, 5, 5)
    this.lights.helper.directionalLightHelper(this.directional)
  }

  update(time: number, delta: number) {
    this.spot.position.set(Math.sin(time) * 2 - 5, 10, 2)
    this.spot.target.position.set(2, 0, Math.sin(time) * 5)
    this.spot.target.updateMatrixWorld()
    this.spotHelper.update()

    this.point.position.set(Math.cos(time * 2), Math.sin(time * 3) * 3 + 3.1, Math.cos(time * 1.5))
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
