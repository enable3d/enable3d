/// <reference types="../../common/src/typesAmmo.d.ts" />
import { ExtendedObject3D, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import { MeshStandardMaterial, REVISION } from 'three'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  ui!: FLAT.FlatArea

  preRender() {
    FLAT.preRender(this.renderer)
  }

  postRender() {
    FLAT.postRender(this.renderer, this.ui)
  }

  async create() {
    this.ui = FLAT.init(this.renderer)

    this.physics.debug?.enable()

    const size = new THREE.Vector2()
    this.renderer.getSize(size)

    const texture = new FLAT.TextTexture('hello')
    const text = new FLAT.TextSprite(texture)
    text.setPosition(size.x / 2, size.y - text.textureHeight)
    this.ui.scene.add(text)

    console.log('REVISION', THREE.REVISION)
    console.log('REVISION', REVISION)

    const { lights, orbitControls } = await this.warpSpeed()

    if (lights?.directionalLight) {
      this.lights.helper.directionalLightHelper(lights.directionalLight)
    }

    this.camera.position.set(2, 2, 4)
    this.camera.lookAt(0, 1, 0)
    orbitControls?.target.set(0, 1, 0)

    this.load.gltf('/assets/box_man.glb').then(gltf => {
      const child = gltf.scene

      child.traverse(c => {
        let child = c as unknown as THREE.Mesh
        if (child.isMesh) {
          child.castShadow = child.receiveShadow = true
          // https://discourse.threejs.org/t/cant-export-material-from-blender-gltf/12258
          ;(child.material as MeshStandardMaterial).metalness = 0
          ;(child.material as MeshStandardMaterial).roughness = 1
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
