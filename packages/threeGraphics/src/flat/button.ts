/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

import { Texture } from 'three'
import { SpriteSheet, SpriteSheetFrameOptions } from './spriteSheet'

export class Button extends SpriteSheet {
  _onInputOver() {
    this.setFrame(this.overFrame)
  }
  _onInputOut() {
    this.setFrame(this.outFrame)
  }
  _onInputDown() {
    this.setFrame(this.downFrame)
  }

  constructor(
    texture: Texture,
    frameOptions: SpriteSheetFrameOptions,
    public overFrame: number,
    public outFrame: number,
    public downFrame: number
  ) {
    super(texture, frameOptions)
    this.setFrame(outFrame)
  }
}
