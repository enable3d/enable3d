import * as Phaser from 'phaser'
import MainScene from './scenes/mainScene'
import PreloadScene from './scenes/preloadScene'
import { Canvas, ExtendedObject3D, enable3d } from '@enable3d/phaser-extension'

const startPhaserGame = () => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    transparent: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720
    },
    scene: [PreloadScene, MainScene],
    ...Canvas()
  }

  window.addEventListener('load', () => {
    enable3d(() => new Phaser.Game(config)).withPhysics('/lib')
  })
}

export default startPhaserGame
