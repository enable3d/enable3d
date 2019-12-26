<h1 align="center">
  <br>
  <a href="https://github.com/yandeu/enable3d#readme"><img src="readme/enable3d-logo.png" alt="header" width="400" alt="enable3d logo"></a>
  <br>
  <br>
  3D extension for Phaser 3
  <br>
</h1>

<h4 align="center">
Written in TypeScript, uses three.js and ammo.js, brings the third dimension to your Phaser 3 game.</h4>

<p align="center">
  <a href="https://david-dm.org/yandeu/enable3d" title="dependencies status">
    <img src="https://david-dm.org/yandeu/enable3d/status.svg?style=flat-square"/>
  </a>
  <a href="https://opensource.org/licenses/GPL-3.0" title="License: GNU GPLv3" >
    <img src="https://img.shields.io/github/license/yandeu/enable3d?style=flat-square">
  </a>
  <img src="https://img.shields.io/github/package-json/v/yandeu/enable3d.svg?style=flat-square" alt="GitHub package.json version">
  <img src="https://img.shields.io/github/last-commit/yandeu/enable3d.svg?style=flat-square" alt="GitHub last commit">
  <a href="https://github.com/prettier/prettier" alt="code style: prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="#get-started">Get Started</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#license">License</a>
</p>

## Key Feature

- Convert coordinates between Phaser 2D and three.js 3D elements
- Constraints
- Collision and Overlap detection
- and more...

## Get Started

Install phaser and enable3d via npm:

```console
npm i phaser enable3d
```

## How to use

```ts
// STEP 1: Add the libraries with "npm install phaser enable3d"
import Phaser from 'phaser'
import enable3d, { Scene3D } from 'enable3d'

const config = {
  // STEP 2: Set type to Phaser.WEBGL
  type: Phaser.WEBGL,
  backgroundColor: '#ffffff',
  scale: {
    parent: 'phaser-game',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
  },
  scene: [MainScene]
}

window.addEventListener('load', () => {
  // STEP 3: Wrap enable3d around your Phaser game.
  // (First copy all ammo file from 'node_modules/enable3d/lib/ammo' to your public folder.)
  enable3d(() => new Phaser.Game(config)).withPhysics('/js/ammo')
})

// STEP 4: Extend your Scene with Scene3D instead of Phaser.Scene
class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    // STEP 5: Request a worm whole to the third dimension.
    this.requestThirdDimension()
  }

  create() {
    // STEP 6: Drive through the hole into the third dimension.
    this.accessThirdDimension()

    // STEP 7: Journey through the third dimension at warp speed.
    this.third.warpSpeed()

    // STEP 8: Add your first 3d object.
    this.third.add.box()

    // STEP 9: Add another box with physics enabled.
    this.third.physics.add.box()

    // STEP 10: Have fun using the third dimension in your awesome Phaser game.
    this.third.haveSomeFun()
  }
}
```

## License

The GNU General Public License v3.0 (GNU GPLv3) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
