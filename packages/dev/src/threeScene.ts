import { DrawSprite, DrawTexture } from '@enable3d/three-graphics/jsm/flat'
import { ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { Scene, Sprite } from 'three'

const isTouchDevice = 'ontouchstart' in window

const w = window.innerWidth,
  h = window.innerHeight
var myRenderTarget = new THREE.WebGLRenderTarget(150, 150)

class MainScene extends Scene3D {
  miniMap!: THREE.OrthographicCamera
  ui = new Scene()

  preRender() {
    this.renderer.autoClear = false
    this.renderer.clear()
    this.renderer.setViewport(0, 0, w, h)
  }

  postRender() {
    this.renderer.clearDepth()
    if (this.miniMap) {
      this.renderer.setViewport(0, 0, 150, 150)
      this.renderer.render(this.scene, this.miniMap)
      this.renderer.render(this.ui, this.miniMap)
      this.renderer.clearDepth()
    }

    // if (Math.random() > 0.8) {
    //   const pixels = new Uint8Array(150 * 150 * 4)
    //   this.renderer.setRenderTarget(myRenderTarget)
    //   this.renderer.setViewport(0, 0, 150, 150)
    //   this.renderer.render(this.scene, this.miniMap)
    //   this.renderer.setRenderTarget(null)
    //   this.renderer.readRenderTargetPixels(myRenderTarget, 0, 0, 150, 150, pixels) // rgba

    //   // Reflected Light Intensity (RLI)
    //   // 0% = very dark
    //   // 100% = very light

    //   let brightness = 0
    //   // https://jsfiddle.net/g48rvsyL/
    //   for (let i = 0; i < 150 * 150 * 4; i += 4) {
    //     const r = pixels[i + 0],
    //       g = pixels[i + 1],
    //       b = pixels[i + 2]

    //     // https://stackoverflow.com/a/596243
    //     brightness += 0.2126 * r + 0.7152 * g + 0.0722 * b
    //   }
    //   brightness /= 150 * 150
    //   brightness /= 255

    //   console.log(brightness)
    //   // process.exit(0)
    // }
  }

  async create() {
    await this.warpSpeed('-ground')
    this.physics.add.ground({ width: 50, height: 50, y: -1 })

    const frustumSize = 1
    const aspect = 1
    console.log(aspect)

    this.miniMap = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -1,
      (frustumSize * aspect) / 1,
      frustumSize / 1,
      frustumSize / -1
    )

    this.miniMap.position.set(0, 2, 0)
    this.miniMap.lookAt(0, 0, 0)
    // this.camera.add(this.miniMap)
    this.scene.add(this.miniMap)
    // this.renderer.setScissor(0.5, 0.5, 1, 1)

    const drawRectangle = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      // ctx.fillStyle = 'blue'
      ctx.lineWidth = 2
      ctx.rect(2, 2, 146, 146)
      // ctx.fill()
      ctx.stroke()
    }

    const sprite1 = new DrawSprite(150, 150, drawRectangle)
    sprite1.setScale(0.013333)
    // sprite1.position.setY(10)
    //
    this.ui.add(sprite1)
    // this.camera.add(sprite1)

    this.camera.position.set(2, 2, 2)
    this.camera.lookAt(0, 0, 0)

    this.physics.add.box({ y: 5 }, { phong: { color: 'red' } })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
