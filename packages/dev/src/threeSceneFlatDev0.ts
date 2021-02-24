import { Project, Scene3D, PhysicsLoader, FLAT } from 'enable3d'
import { Camera, FlatShading, Scene } from 'three'

class MainScene extends Scene3D {
  ui: {
    camera: Camera
    scene: Scene
  }

  matter = new FLAT.physics()
  ball: FLAT.SimpleSprite

  preload() {
    // ;<a href="https://www.vecteezy.com/free-vector/cartoon">Cartoon Vectors by Vecteezy</a>
    //www.vecteezy.com/vector-art/540965-cartoon-buttons-set-game-vector-illustration
    // https://www.vecteezy.com/members/znnadesign-gmail-com
    // OPPONA
    this.load.preload('one', 'assets/start-button/start-button@1.png')
    this.load.preload('two', 'assets/start-button/start-button@2.png')
    this.load.preload('three', 'assets/start-button/start-button@3.png')
  }

  async create() {
    document.body.style.backgroundImage = 'linear-gradient(#4782fe, #79b7fe)'

    const maxPixelRatio = 3
    this.setPixelRatio(Math.min(maxPixelRatio, window.devicePixelRatio))

    this.renderer.autoClear = false // To allow render overlay on top of the 3d camera
    const width = window.innerWidth
    const height = window.innerHeight
    this.ui = {
      // {x: 0, y: 0} is bottomLeft
      camera: this.cameras.orthographicCamera({ left: 0, right: width, bottom: 0, top: height }),
      scene: new Scene()
    }

    console.log(this.renderer.domElement)
    FLAT.init({ canvas: this.renderer.domElement })

    console.log('get', FLAT.getParent())

    const setConfig = (...sprites: FLAT.SimpleSprite[]) => {
      sprites.forEach((sprite, index) => {
        const dpi = index + 1
        const x = width / 2
        const y = height / 2 + (index - 1) * -150

        const text = new FLAT.TextSprite(new FLAT.TextTexture(`DPI@${dpi}`, { fontSize: 24 * dpi, fillStyle: 'black' }))
        text.setPosition(x, y + 60)
        // text.texture.minFilter = NearestFilter
        text.setPixelRatio(dpi)
        this.ui.scene.add(text)

        sprite.setPixelRatio(dpi)
        sprite.setPosition(x, y)
      })
    }

    const one = new FLAT.SimpleSprite(await this.load.texture('one'))
    const two = new FLAT.SimpleSprite(await this.load.texture('two'))
    const three = new FLAT.SimpleSprite(await this.load.texture('three'))

    setConfig(one, two, three)

    this.ui.scene.add(one, two, three)
  }

  preRender() {
    this.renderer.clear()
  }

  postRender() {
    if (this.ui && this.ui.scene && this.ui.camera) {
      this.renderer.clearDepth()
      this.renderer.render(this.ui.scene, this.ui.camera)

      FLAT.render(this.ui.camera)
    }
  }
}

const startProject = () => {
  PhysicsLoader('/lib', () => new Project({ scenes: [MainScene] }))
}

export default startProject
