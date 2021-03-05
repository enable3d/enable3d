import { Project, Scene3D, PhysicsLoader, ExtendedMesh, FLAT, THREE } from 'enable3d'

import { NearestFilter, Camera, Scene } from 'three'
import { Texture, Vector2 } from 'three'
import { PlaneGeometry } from 'three'
import { MeshLambertMaterial } from 'three'
import { Mesh } from 'three'
import { DoubleSide } from 'three'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.physics()
  ball: FLAT.SimpleSprite

  async init() {}

  async preload() {
    // load atlas
    this.load.preload('ninja.png', '/assets/atlas/ninja-texture-atlas.png')
    this.load.preload('ninja.json', '/assets/atlas/ninja-texture-atlas.json')

    this.load.preload('hero', '/assets/adventurer-Sheet.png')
    this.load.preload('grass', '/assets/grass.jpg')

    await this.load.preload('button_one', '/assets/button_sprite_sheet.png')
  }

  addMatter() {
    this.matter.setBounds()

    const radius = 40

    // textures
    const texture = new FLAT.DrawTexture(radius * 2, radius * 2, ctx => {
      const circle = new Path2D()
      circle.arc(radius, radius, radius, 0, 2 * Math.PI)
      ctx.fillStyle = 'red'
      ctx.fill(circle)

      ctx.fillStyle = 'black'
      ctx.font = '24px Arial'
      ctx.fillText('Click!', 8, radius + 8)
    })

    this.ball = new FLAT.SimpleSprite(texture)
    this.ball.setDepth(2)
    this.ball.body = this.matter.add.circle(50, 500, radius)
    this.ball.body.restitution = 0.5
    this.matter.add.existing(this.ball)

    this.ball.setInteractive()
    this.ball.onInputDown = () => {
      this.ball.body.force.x = Math.random() * 0.4 - 0.2
      this.ball.body.force.y = -0.25
      // this.ballBody.torque = 1
    }
    this.ball.setPosition(100, 100)
    this.ui.scene.add(this.ball)
  }

  async create() {
    this.cache.add('myAtlas', await this.load.textureAtlas('ninja.png', 'ninja.json'))

    const { orbitControls } = await this.warpSpeed()
    FLAT.initEvents({ canvas: this.renderer.domElement, orbitControls })
    const size = this.renderer.getSize(new Vector2())
    FLAT.setSize(size.x, size.y)

    this.deconstructor.add(FLAT /* same effect as FLAT.destroy */, this.matter, orbitControls)

    setTimeout(() => {
      this.restart()
    }, 5000)

    this.renderer.autoClear = false // To allow render overlay on top of the 3d camera
    const width = window.innerWidth
    const height = window.innerHeight
    this.ui = {
      // {x: 0, y: 0} is bottomLeft
      camera: this.cameras.orthographicCamera({ left: 0, right: width, bottom: 0, top: height }),
      scene: new Scene()
    }

    this.addMatter()

    this.drawRectangle()

    await this.addText()

    this.addButtons()

    this.addNinja()
    this.addLittleNinja()

    this.addHero1()
    this.addHero2()

    this.addGrass()
  }

  drawRectangle() {
    const width = window.innerWidth
    const height = window.innerHeight

    const rect = new FLAT.DrawSprite(100, 100, ctx => {
      ctx.beginPath()
      ctx.strokeStyle = 'red'
      ctx.fillStyle = 'blue'
      ctx.lineWidth = 12
      ctx.rect(0, 0, 100, 100)
      ctx.fill()
      ctx.stroke()
    })
    rect.setInteractive()
    rect.onInputDown = () => {
      console.log('You clicked the rectangle')
    }
    rect.setPosition(60, height - 60)

    const rotate = () => {
      rect.setRotation(rect.getRotation() - 0.01)
      requestAnimationFrame(rotate)
    }

    requestAnimationFrame(rotate)

    this.ui.scene.add(rect)
  }

  async addText() {
    const texture = new FLAT.TextTexture('Texture')
    const sprite = new FLAT.TextSprite(texture)
    this.scene.add(sprite)

    // set position
    sprite.setPosition(0, 1)
    sprite.setDepth(1)
    sprite.setScale(0.01)
    // same as
    // sprite.position.set(-2, 2, 0.01)

    // write text (letter by letter)
    const newText = 'new Texture()'
    sprite.setText(newText)
    for (let i = 0; i < newText.length; i++) {
      setTimeout(() => {
        sprite.setText(newText.substring(0, i + 1))
      }, i * 250)
    }

    const c = texture.clone()

    // 3d plane
    const planeTexture = new FLAT.TextTexture('Texture on Plane')
    const { width, height } = planeTexture
    console.log(width, height)
    const bitmap = await createImageBitmap(planeTexture.image)

    const planeTextureBackground = new FLAT.DrawTexture(width, height, ctx => {
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(bitmap, 0, 0)
    })

    // const test = new SimpleSprite(planeTextureBackground, false)
    // test.position.set(0, 2, 5)
    // this.ui.scene.add(test)
    // return

    const geometry = new PlaneGeometry(width / 100, height / 100)
    const material = new MeshLambertMaterial({
      map: planeTextureBackground,
      transparent: false,
      side: DoubleSide
    })
    const plane = new Mesh(geometry, material)
    plane.position.set(-2, 2, 1.5)
    this.scene.add(plane)
    this.physics.add.existing(plane as any)

    // multiline 2 text
    const multiline2 = new FLAT.TextSprite(new FLAT.TextTexture('this is\na very\nlong\ntext', { fontSize: 32 }))
    multiline2.setPosition(multiline2.textureWidth / 2 + 10, 220)
    multiline2.setDepth(1)
    multiline2.setInteractive({ pixelPerfect: true })
    this.ui.scene.add(multiline2)
    // setTimeout(() => {
    //   multiline2.setText('this is\na very\nlong')
    // }, 1000)
    multiline2.onInputOver = () => {
      multiline2.setText(multiline2.getText())
    }
    multiline2.onInputOut = () => {
      multiline2.setText(multiline2.getText())
    }
    multiline2.onInputDown = () => {
      multiline2.setText(multiline2.getText())
    }
  }

  async addButtons() {
    // https://codepen.io/yandeu/pen/OdYdbp
    const width = window.innerWidth
    const height = window.innerHeight

    const texture = await this.load.texture('button_one')
    texture.name = 'btn1'

    const btn1 = new FLAT.Button(texture, { width: 193, height: 71 }, 2, 1, 0)
    btn1.setInteractive()
    btn1.setPosition(width - 100, height - 40)
    // btn1.setDepth(2)
    btn1.onInputOut = () => {
      console.log('Btn1: onInputOut')
    }
    btn1.onInputDown = () => {
      console.log('Btn1: onInputDown')
    }
    btn1.onInputOver = () => {
      console.log('Btn1: onInputOver')
    }
    this.ui.scene.add(btn1)
  }

  async addNinja() {
    // get from cache
    const atlas = this.cache.get('myAtlas') as any

    const ninja = new FLAT.TextureAtlas(atlas)
    ninja.setScale(0.01)
    ninja.position.set(1.5, 3, 5)

    let index = 0

    ninja.flipX(true)

    ninja.setFrame('Attack__000.png')
    setInterval(() => {
      ninja.setFrame(`Attack__00${index}.png`)
      index++
      if (index === 9) index = 0
    }, 1000 / 5)

    this.scene.add(ninja)
  }

  async addLittleNinja() {
    const atlas = await this.load.textureAtlas('ninja.png', 'ninja.json')

    const n1 = new FLAT.TextureAtlas(atlas, 'Run__004.png')
    n1.position.set(1.5, 5, 5)
    n1.setScale(0.003)
    n1.flipX(true)
    this.scene.add(n1)
    console.log('Current Frame: ', n1.frame.name)
  }

  async addHero2() {
    const texture = await this.load.texture('hero')

    const hero = new FLAT.SpriteSheet(texture, { width: 50, height: 37 })
    hero.position.set(0, 2, 5)
    hero.setScale(0.04)
    this.scene.add(hero)

    hero.anims.add('idle', { start: 0, end: 3, rate: 5 })
    hero.anims.add('jump', { timeline: [16, 17, 18, 19, 20, 21, 22, 23, 0], rate: 10, repeat: 1 })

    hero.anims.play('jump').onComplete(() => {
      hero.anims.play('idle')
    })

    const heroPlane = hero
    const geometry = new THREE.PlaneBufferGeometry(heroPlane.textureWidth / 100, heroPlane.textureHeight / 100)
    const material = new THREE.MeshLambertMaterial({
      map: heroPlane.texture,
      transparent: false,
      side: THREE.DoubleSide
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.position.set(0, 5, -1)
    this.scene.add(plane)
    // @ts-ignore
    this.physics.add.existing(plane)
  }

  async addHero1() {
    const texture = await this.load.texture('hero')

    // for pixel art use NearestFilter (also see https://stackoverflow.com/a/16709631)
    texture.magFilter = NearestFilter
    texture.minFilter = NearestFilter

    const hero = new FLAT.SpriteSheet(texture, { width: 50, height: 37 })

    hero.setScale(0.05)
    let frame = 1
    hero.setFrame(frame)
    hero.position.set(-1.5, 2, 5)
    this.scene.add(hero)

    setInterval(() => {
      frame++
      hero.setFrame(frame)
      hero.flipX(Math.random() > 0.5)
    }, 1000)
  }

  async addGrass() {
    const texture = await this.load.texture('grass')
    const grass = new FLAT.SimpleSprite(texture)
    grass.position.setY(2)
    grass.position.setZ(-5)
    grass.setScale(0.01)
    this.add.existing(grass)
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

  update() {
    // this.matter.update()
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
