export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // from https://sketchfab.com/3d-models/hero-warrior-downloadable-828017e697e64547b552aa868f045714
    this.load.binary('hero', 'assets/hero.glb')
    // from https://opengameart.org/content/grass-001
    this.load.image('grass', 'assets/grass.jpg')
  }

  create() {
    this.scene.start('MainScene')
  }
}
