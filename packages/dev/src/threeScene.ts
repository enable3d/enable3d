import { Project, Scene3D, PhysicsLoader, ExtendedObject3D } from 'enable3d'
import { SpotLight, SpotLightHelper, PointLight, DirectionalLight } from '../../threeWrapper/dist'

const isTouchDevice = 'ontouchstart' in window

class MainScene extends Scene3D {
  async create() {
    this.warpSpeed()
    this.camera.position.set(2, 2, 4)

    this.load.gltf('/assets/box_man.glb').then(gltf => {
      const child = gltf.scene.children[0]

      const boxMan = new ExtendedObject3D()
      boxMan.add(child)
      this.scene.add(boxMan)

      let i = 0
      let anims = ['run', 'sprint', 'idle', 'driving', 'falling']

      // ad the box man's animation mixer to the animationMixers array (for auto updates)
      this.animationMixers.add(boxMan.animation.mixer)

      gltf.animations.forEach(animation => {
        if (animation.name) {
          // add a new animation to the box man
          boxMan.animation.add(animation.name, animation)
        }
      })

      // play the run animation
      // boxMan.animation.play('run')
      // old
      boxMan.setAction('idle')

      setInterval(() => {
        i++
        // play the run animation
        boxMan.animation.play(anims[i % 5], 500)
        console.log('current animation', boxMan.animation.current)
      }, 2500)
    })
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
