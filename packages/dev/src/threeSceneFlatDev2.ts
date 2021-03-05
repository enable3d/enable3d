import { Project, Scene3D, PhysicsLoader, ExtendedMesh, FLAT, THREE } from 'enable3d'
import * as Matter from 'matter-js'

// import { Tap } from '@enable3d/three-graphics/jsm/tap'
import { Keyboard } from '@enable3d/three-graphics/jsm/keyboard'

import { Camera, Scene } from 'three'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.physics()
  ball: FLAT.SimpleSprite

  atlas: FLAT.Atlas
  shapes: string

  async preload() {
    // physics (fruits) TextureAtlas + Shapes
    this.atlas = await this.load.textureAtlas('/assets/fruit/fruit-sprites.png', '/assets/fruit/fruit-sprites.json')
    this.shapes = (await this.load.file('/assets/fruit/fruit-shapes.json')) as string

    // load texture and add to cache (Experimental)
    await this.load.texture('button_one', '/assets/button_sprite_sheet.png')
  }

  async addMatter() {
    const width = window.innerWidth
    const height = window.innerHeight

    this.matter.setBounds()

    const file = this.shapes
    const bodies = this.matter.parsePhysics(file)

    for (const fruit in this.atlas.json.frames) {
      if (fruit === 'background') continue

      const f = new FLAT.TextureAtlas(this.atlas, fruit)
      f.setPixelRatio(1)
      f.setScale(0.75)
      this.ui.scene.add(f)

      let x = width / 2 + (Math.random() - 0.5) * Math.min(600, width)
      let y = 50 + Math.random() * 250

      if (fruit === 'ground') {
        x = f.frame.width / 2
        y = height - f.frame.height / 2
      }

      f.body = this.matter.addBodyFromFixtures(x, y, bodies[fruit])
      this.matter.add.existing(f)
      f.setBodyPosition(x, y)

      if (fruit === 'ground') {
        Matter.Body.setStatic(f.body, true)
      }
    }
  }

  async create() {
    this.warpSpeed()

    // check https://keycode.info/ (event.code)
    const keyboard = new Keyboard()

    // keyboard.watch.down(keyCode => {
    //   console.log('down', keyCode)
    // })

    // keyboard.watch.up(keyCode => {
    //   console.log('up', keyCode)
    // })

    keyboard.once.down('KeyE KeyR', keyCode => {
      console.log(`${keyCode} is down.`)
    })

    keyboard.on.down('KeyQ', keyCode => {
      console.log(`${keyCode} is down.`)
    })

    keyboard.on.down('KeyL KeyK Space', keyCode => {
      console.log(`${keyCode} is down.`)
    })

    keyboard.on.up('KeyL', () => {
      console.log('KeyL is up.')
    })

    setTimeout(() => {
      keyboard.destroy()
    }, 5000)

    // keyboard.once.up('KeyL', () => {
    //   console.log('LL UP ONCE')
    // })

    // setInterval(() => {
    //   console.log(keyboard.key('KeyW').isDown)
    // }, 1000)

    // const tap = new Tap(this.renderer.domElement)

    // tap.on.down(() => {
    //   console.log('w')
    // })
    // tap.on.up(() => {
    //   console.log('up')
    // })
    // tap.on.move(({ position }) => {})

    // tap.pointerLock.request().then(event => {
    //   console.log(event)

    //   setTimeout(() => {
    //     tap.pointerLock.exit().then(event => {
    //       console.log(event)
    //     })
    //   }, 2500)
    // })

    this.renderer.autoClear = false // To allow render overlay on top of the 3d camera
    const width = window.innerWidth
    const height = window.innerHeight
    this.ui = {
      // {x: 0, y: 0} is bottomLeft
      camera: this.cameras.orthographicCamera({ left: 0, right: width, bottom: 0, top: height }),
      scene: new Scene()
    }

    this.addMatter()
  }

  preRender() {
    this.renderer.clear()
  }

  postRender() {
    if (this.ui && this.ui.scene && this.ui.camera) {
      this.renderer.clearDepth()
      this.renderer.render(this.ui.scene, this.ui.camera)

      FLAT.updateEvents(this.ui.camera)
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
