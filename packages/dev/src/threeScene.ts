import { ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { REVISION } from 'three'
import { FlatArea } from '../../threeGraphics/jsm/flat'

const isTouchDevice = 'ontouchstart' in window

const w = window.innerWidth,
  h = window.innerHeight
var myRenderTarget = new THREE.WebGLRenderTarget(150, 150)

class MainScene extends Scene3D {
  ui!: FlatArea
  miniMap!: THREE.OrthographicCamera

  preRender() {
    this.renderer.setViewport(0, 0, w, h)
    FLAT.preRender(this.renderer)
  }

  postRender() {
    FLAT.postRender(this.renderer, this.ui)

    // var previousRT = this.renderer.getRenderTarget()
    // const imgData = this.renderer.domElement.toDataURL();

    this.renderer.setViewport(0, 0, 150, 150)
    this.renderer.render(this.scene, this.miniMap)

    if (Math.random() > 0.8) {
      const pixels = new Uint8Array(150 * 150 * 4)
      this.renderer.setRenderTarget(myRenderTarget)
      this.renderer.setViewport(0, 0, 150, 150)
      this.renderer.render(this.scene, this.miniMap)
      this.renderer.setRenderTarget(null)
      this.renderer.readRenderTargetPixels(myRenderTarget, 0, 0, 150, 150, pixels) // rgba

      // Reflected Light Intensity (RLI)
      // 0% = very dark
      // 100% = very light

      let brightness = 0
      // https://jsfiddle.net/g48rvsyL/
      for (let i = 0; i < 150 * 150 * 4; i += 4) {
        const r = pixels[i + 0],
          g = pixels[i + 1],
          b = pixels[i + 2]

        // https://stackoverflow.com/a/596243
        brightness += 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      brightness /= 150 * 150
      brightness /= 255

      console.log(brightness)
      // process.exit(0)
    }
  }

  async create() {
    this.ui = FLAT.init(this.renderer)

    const size = new THREE.Vector2()
    this.renderer.getSize(size)

    const frustumSize = 1
    const aspect = w / h

    this.miniMap = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2
    )

    this.miniMap.position.set(0, 2, 0)
    this.miniMap.lookAt(0, 0, 0)
    // this.camera.add(this.miniMap)
    this.scene.add(this.miniMap)
    // this.renderer.setScissor(0.5, 0.5, 1, 1)

    const texture = new FLAT.TextTexture('hello')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    console.log('REVISION', THREE.REVISION)
    console.log('REVISION', REVISION)

    this.warpSpeed()
    this.camera.position.set(2, 2, 4)

    this.load.gltf('/assets/box_man.glb').then(gltf => {
      const child = gltf.scene.children[0]

      const boxMan = new ExtendedObject3D()
      boxMan.add(child)
      this.scene.add(boxMan)

      let i = 0
      const anims = ['run', 'sprint', 'jump_running', 'idle', 'driving', 'falling']

      // ad the box man's animation mixer to the animationMixers array (for auto updates)
      this.animationMixers.add(boxMan.animation.mixer)

      gltf.animations.forEach(animation => {
        if (animation.name) {
          // add a new animation to the box man
          boxMan.animation.add(animation.name, animation)
        }
      })

      // play the run animation
      boxMan.animation.play('idle')

      const nextAnimation = (time: number) => {
        setTimeout(() => {
          i++
          const next = anims[i % 5]
          boxMan.animation.play(next, 200, next === 'jump_running' ? false : true)
          console.log('current animation', boxMan.animation.current)
          nextAnimation(next === 'jump_running' ? 650 : 2500)
        }, time)
      }

      nextAnimation(2500)
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
