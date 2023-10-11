import { ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { REVISION } from 'three'
import { FlatArea } from '../../threeGraphics/jsm/flat'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  ui!: FlatArea

  preRender() {
    FLAT.preRender(this.renderer)
  }

  postRender() {
    FLAT.postRender(this.renderer, this.ui)
  }

  async create() {
    this.ui = FLAT.init(this.renderer)

    const size = new THREE.Vector2()
    this.renderer.getSize(size)

    const texture = new FLAT.TextTexture('hello')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    console.log('REVISION', THREE.REVISION)
    console.log('REVISION', REVISION)

    const { lights } = await this.warpSpeed()
    this.lights.helper.directionalLightHelper(lights?.directionalLight)

    this.camera.position.set(2, 2, 4)

    this.load.gltf('/assets/box_man.glb').then(gltf => {
      const child = gltf.scene

      child.traverse(child => {
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true
          // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
          child.material.metalness = 0
          child.material.roughness = 1
        }
      })

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
