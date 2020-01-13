export default class extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // from https://sketchfab.com/3d-models/hero-warrior-downloadable-828017e697e64547b552aa868f045714
    this.load.binary('hero', 'assets/hero.glb')
    // from https://opengameart.org/content/grass-001
    this.load.image('grass', 'assets/grass.jpg')

    // heightmap from https://medium.com/@travall/procedural-2d-island-generation-noise-functions-13976bddeaf9
    this.load.image('heightmap-island', 'assets/heightmap-island.png')

    // height map from http://danni-three.blogspot.com/2013/09/threejs-heightmaps.html
    this.load.image('heightmap-simple', 'assets/heightmap-simple.png')
  }

  create() {
    this.scene.start('MainScene')
  }
}
