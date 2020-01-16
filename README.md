<h1 align="center">
  <a href="https://github.com/yandeu/enable3d#readme"><img src="readme/enable3d-logo-square.png" alt="enable3d logo" width="300"></a>
  <br>
  3D extension for Phaser 3
  <br>
</h1>

<h4 align="center">
Written in TypeScript, uses three.js and ammo.js, brings the third dimension to your Phaser 3 game.</h4>

<p align="center">  
  <a href="https://www.npmjs.com/package/enable3d"><img src="https://img.shields.io/npm/v/enable3d?style=flat-square" alt="NPM version"></a>
  <a href="https://github.com/yandeu/enable3d/commits/master"><img src="https://img.shields.io/github/last-commit/yandeu/enable3d.svg?style=flat-square" alt="GitHub last commit"></a>
  <a href="https://github.com/prettier/prettier" alt="code style: prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#examples">Examples</a> •
  <a href="#get-started">Get Started</a> •
  <a href="#how-to-use-with-phaser">Use with Phaser</a> •
  <a href="#standalone-mode">Standalone Mode</a> •
  <a href="#phaser-starter-template">Phaser Starter Template</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#license">License</a>
</p>

## Key Features

- Convert coordinates between Phaser 2D and three.js 3D elements
- Constraints
- Collision and Overlap detection
- and more...

## Examples

Find some nice examples on [enable3d.io](https://enable3d.io/examples.html)

## Get Started

### npm

Install phaser and enable3d via npm:

```console
npm i phaser enable3d
```

### umd

Or download the UMD bundle in [/bundles](https://github.com/yandeu/enable3d/tree/master/bundles)
The bundle exports "ENABLE3D".

Starting with version 0.0.11, heavy modules are lazy loaded. Means you have to add all corresponding .js file to your project:

- enable3d.0.0.11.main.min.js
- enable3d.0.0.11.waterBase64.min.js
- and so on ...

By default lazy loaded modules are served from /lib/. To change the directory, you have to create a new bundle (npm run bundle) with a different _publicPath_ in [webpack.js](https://github.com/yandeu/enable3d/blob/master/packages/enable3d/webpack.js).

```ts
const { enable3d, Scene3d } = ENABLE3D
// now use enable3d and Scene3d in your project
```

## How to use with Phaser

```ts
// STEP 1: Add the libraries with "npm install phaser enable3d"
import Phaser from 'phaser'
import enable3d, { Scene3D, Canvas } from 'enable3d'

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
  scene: [MainScene],
  // STEP 3: Add a custom canvas
  // The default Phaser canvas is not compatible with three.js
  ...Canvas()
}

window.addEventListener('load', () => {
  // STEP 4: Wrap enable3d around your Phaser game.
  // (First copy all ammo file from 'node_modules/enable3d/lib/ammo' to your public folder.)
  enable3d(() => new Phaser.Game(config)).withPhysics('/js/ammo')
})

// STEP 5: Extend your Scene with Scene3D instead of Phaser.Scene
class MainScene extends Scene3D {
  constructor() {
    super({ key: 'MainScene' })
  }

  init() {
    // STEP 6: Request a worm whole to the third dimension.
    this.requestThirdDimension()
  }

  create() {
    // STEP 7: Drive through the hole into the third dimension.
    this.accessThirdDimension()

    // STEP 8: Journey through the third dimension at warp speed.
    this.third.warpSpeed()

    // STEP 9: Add your first 3d object.
    this.third.add.box()

    // STEP 10: Add another box with physics enabled.
    this.third.physics.add.box()

    // STEP 11: Have fun using the third dimension in your awesome Phaser game.
    this.third.haveSomeFun()
  }
}
```

## Standalone Mode

At the moment enable3d can only be used together with Phaser.

## Phaser Starter Template

Looking for a powerful Phaser Starter Template?

Try [phaser-project-template](https://github.com/yandeu/phaser-project-template) or [phaser-project-template-es6](https://github.com/yandeu/phaser-project-template-es6)

## Documentation

Why do you need a documentation if I've made such [great examples](https://enable3d.io/examples.html).

## License

The GNU General Public License v3.0 (GNU GPLv3) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
