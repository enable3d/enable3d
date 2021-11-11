import { ExtendedMesh, FLAT, PhysicsLoader, Project, Scene3D, THREE } from 'enable3d'
import * as Matter from 'matter-js'

// import { Tap } from '@yandeu/tap'
import { Keyboard } from '@yandeu/keyboard'

class MainScene extends Scene3D {
  ui: FLAT.FlatArea

  matter = new FLAT.physics()
  ball: FLAT.SimpleSprite

  atlas: FLAT.Atlas
  shapes: string

  async preload() {
    // physics (fruits) TextureAtlas + Shapes
    this.atlas = await this.load.textureAtlas('/assets/fruit/fruit-sprites.png', '/assets/fruit/fruit-sprites.json')
    this.shapes = (await this.load.file('/assets/fruit/fruit-shapes.json')) as string

    // load texture
    await this.load.texture('/assets/button_sprite_sheet.png')
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

    // setTimeout(() => {
    //   keyboard.destroy()
    // }, 5000)

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

    this.ui = FLAT.init(this.renderer)

    this.addMatter()
  }

  preRender() {
    FLAT.preRender(this.renderer)
  }

  postRender() {
    FLAT.postRender(this.renderer, this.ui)
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
