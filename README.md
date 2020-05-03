<h1 align="center">
  <a href="https://github.com/enable3d/enable3d#readme"><img src="readme/enable3d-logo-square.png" alt="enable3d logo" width="300"></a>
  <br>
  Physics for three.js / 3D extension for Phaser 3 / Standalone 3D Framework
  <br>
</h1>

<h4 align="center">
Written in TypeScript, uses three.js and ammo.js, brings physics to your three.js project and the third dimension to your Phaser 3 game.</h4>

<p align="center">  
  <a href="https://www.npmjs.com/search?q=%40enable3d"><img src="https://img.shields.io/npm/v/@enable3d/phaser-extension?style=flat-square" alt="NPM version"></a>
  <a href="https://github.com/enable3d/enable3d/actions?query=workflow%3ACI"><img src="https://img.shields.io/github/workflow/status/yandeu/enable3d/CI/master?label=github%20build&logo=github&style=flat-square"></a>
  <a href="https://github.com/mrdoob/three.js/"><img src="https://img.shields.io/badge/three-r116-blue.svg?style=flat-square" alt="Three"></a>
  <a href="https://github.com/enable3d/enable3d/commits/master"><img src="https://img.shields.io/github/last-commit/yandeu/enable3d.svg?style=flat-square" alt="GitHub last commit"></a>
  <a href="https://github.com/prettier/prettier" alt="code style: prettier"><img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/built%20with-TypeScript-blue?style=flat-square"></a>
</p>

<p align="center">
  <a href="#about">About</a> •
  <a href="#documentation">Documentation</a> •
  <a href="#examples">Examples</a> •
  <a href="#starter-template">Starter Template</a> •
  <a href="#license">License</a>
</p>

## About

Initially I only wanted to make a 3d extension for Phaser 3. That is where the name enable3d is coming from. But now, this project can do much more. I have extracted the main project into 3 separate modules. So, you can now use enable3d as a **physics plugin for three.js**, as a **standalone 3d framework**, or as an **3d extension for Phaser**.

The structure looks like this:

```console
├─ @enable3d/phaser-extension      # 3d extension for Phaser
│   └─ @enable3d/three-graphics    # 3d framework on top of three.js
│       └─ @enable3d/ammo-physics  # Physics plugin for three.js
│
├─ @enable3d/common                # Some common codes
└─ @enable3d/three-wrapper         # Simple three.js wrapper
```

So, if you have an existing three.js project and want to add physics to it, you simply need to add `@enable3d/ammo-physics`.

If want to build a simple 3d scene, simple use `@enable3d/three-graphics` which wraps some three.js functionalities into a simple, phaser alike api.

If you want to make a game, and want to use all the cool features (DataManager, TweenManager, SceneManager, InputManager, Loaders, SoundManager and more) that Phaser provides, install `@enable3d/phaser-extension`.

## Documentation

Go to [enable3d.io/docs.html](https://enable3d.io/docs.html).

## Examples

Find some nice examples on [enable3d.io/examples.html](https://enable3d.io/examples.html).

## Starter Template for Phaser

Looking for a powerful Starter Template for Phaser?

Try [enable3d-project-template](https://github.com/enable3d/enable3d-project-template).

## License

The GNU General Public License v3.0 (GNU GPLv3) 2019 - [Yannick Deubel](https://github.com/yandeu). Please have a look at the [LICENSE](LICENSE) for more details.
