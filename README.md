<h1 align="center">
  <a href="https://github.com/enable3d/enable3d#readme"><img src="readme/enable3d-logo-square.png" alt="enable3d logo" width="300"></a>
  <br>
  3D for Web, Mobile and PC
  <br>
</h1>

<h4 align="center">
Written in TypeScript, uses three.js and ammo.js, brings physics to your three.js project and the third dimension to your Phaser 3 game.</h4>

<p align="center">  
  <a href="https://www.npmjs.com/search?q=enable3d"><img src="https://img.shields.io/npm/v/@enable3d/phaser-extension?style=flat-square" alt="NPM version"></a>
  <a href="https://github.com/enable3d/enable3d/actions?query=workflow%3ACI"><img src="https://img.shields.io/github/workflow/status/yandeu/enable3d/CI/master?label=build&logo=github&style=flat-square"></a>
  <a href="https://github.com/enable3d/enable3d/actions?query=workflow%3ACodeQL"><img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/enable3d/enable3d/CodeQL?label=CodeQL&logo=github&style=flat-square"></a>
  <a href="https://github.com/mrdoob/three.js/"><img src="https://img.shields.io/badge/three-r133.1-blue.svg?style=flat-square" alt="Three"></a>
  <a href="https://github.com/enable3d/enable3d/commits/master"><img src="https://img.shields.io/github/last-commit/yandeu/enable3d.svg?style=flat-square" alt="GitHub last commit"></a>
  <a href="https://github.com/prettier/prettier" alt="code style: prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="#website">Website</a> •
  <a href="#packages">Packages</a> •
  <a href="#license">License</a>
</p>

## Website

Visit the [enable3d website](https://enable3d.io) for documentation and examples.

## Dependencies

Enable3d now depends on the dependencies below.  
They are all listed as [peerDependencies](https://docs.npmjs.com/cli/v7/configuring-npm/package-json#peerdependencies).

```json
{
  "@types/matter-js": "0.17.6",
  "@types/three": "~0.136.0",
  "matter-js": "0.17.1",
  "phaser": "^3.55.2",
  "poly-decomp": "^0.3.0",
  "three": "~0.136.0"
}
```

## Useful Packages

Some useful packages are now available on npm:

| Package                                                      | Description                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| [`audio`](https://www.npmjs.com/package/@yandeu/audio)       | 🎵 Audio library for the Web Audio API.                                   |
| [`keyboard`](https://www.npmjs.com/package/@yandeu/keyboard) | ⌨️ Handling of keyboard events.                                           |
| [`tap`](https://www.npmjs.com/package/@yandeu/tap)           | 🖱️ Handling of user interactions such as mouse, touch and pointer events. |

## Packages

This project is split into many separate npm packages. To better understand the structure and relationships between the packages, see the diagram.

![creately-diagram](/readme/creately-diagram.png)

- **enable3d** A standalone 3D Framework on top of three-graphics.
- **@enable3d/phaser-extension** Allows to integrate the three-graphics package into your Phaser 3 Games.
- **@enable3d/ammo-physics** The core Physics package. Wraps ammo.js physics.
- **@enable3d/ammo-on-nodejs** Enables you to run ammo.js on your node.js server.
- **@enable3d/three-graphics** The core 3D Objects package. A beautiful API for many three.js elements.
- **@enable3d/three-wrapper** Wraps the three.js library and some of its examples in one package.
- **@enable3d/common** Some common code used by almost every package.

## Development Server

Are you used to use `Live Server`? Check out `Five Server` instead!

- [Five Server on npm](https://www.npmjs.com/package/five-server)
- [Five Server for VSCode](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server)

## Multiplayer Game

<a href="http://geckos.io">
  <img src="https://raw.githubusercontent.com/geckosio/geckos.io/master/readme/logo-256.png" alt="geckos.io logo" width="128">
</a>

Want to make a Real-Time Multiplayer Game? Check out [geckos.io](http://geckos.io).

## License

The GNU General Public License v3.0 (GNU GPLv3) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
