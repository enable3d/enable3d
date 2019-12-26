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
  <img src="https://img.shields.io/npm/v/enable3d?style=flat-square" alt="NPM version">
  <img src="https://img.shields.io/github/last-commit/yandeu/enable3d.svg?style=flat-square" alt="GitHub last commit">
  <a href="https://github.com/prettier/prettier" alt="code style: prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="#get-started">Get Started</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#how-to-use">How To Use</a> •
  <a href="#documentation">Documentation</a> •
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

## Documentation

### Object Factory

#### Adding objects

```ts
// Make the sphere object.
const sphere = this.third.make.sphere()
// Add the sphere to the scene.
this.third.add.existing(sphere)
// Add physics to the sphere.
this.third.physics.add.existing(sphere)

// The three lines above do the same thing as this:
this.third.physics.add.sphere()
```

#### Object types

For now you can use the following objects: Sphere, Box, Ground (which is a extended box).

```ts
// Adds a simple box.
this.third.add.box()
// Adds a simple sphere.
this.third.add.sphere()
// Width and height are required for the ground object.
this.third.add.ground({ width: 10, height: 10 })
```

#### Object Configuration and Material

Each geometry receives 2 objects. The first for the configuration of the shape, the second for its material.

```ts
this.third.add.box({ x: 10, y: 10, z: -25, width: 2 }, { standard: { color: 0xff00ff, metalness: 0.7 } })

this.third.add.sphere({ radius: 2 }, { phong: { color: 0xff00ff, wireframe: true } })
```

#### Object with textures

```ts
const grass = this.third.getTexture('grass')
this.third.physics.add.ground({ width: 50, height: 50, y: -5 }, { phong: { map: grass } })
```

### Collisions

```ts
const ground = this.third.physics.add.ground({ name: 'ground', width: 10, height: 10 })
const redBall = this.third.physics.add.sphere({ y: 10 }, { standard: { color: 0xff0000 } })
const blueBall = this.third.physics.add.sphere({ y: 15 }, { standard: { color: 0x0000ff } })
const greenBall = this.third.physics.add.sphere({ y: 20 }, { standard: { color: 0x00ff00 } })

// Check collision between the red and the blue ball.
this.third.physics.add.collider(redBall, blueBall, () => {
  console.log('redBall and blueBall are colliding')
})

// Detect all collisions of the green ball.
greenBall.body.on.collision(otherObject => {
  if (otherObject.name === 'ground') console.log('The green ball collides with the ground')
  else console.log('The green ball collides with another ball')
})
```

## License

The GNU General Public License v3.0 (GNU GPLv3) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
