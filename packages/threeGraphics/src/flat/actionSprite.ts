/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { SimpleSprite } from './simpleSprite'
import { Texture } from 'three'
import { EventEmitter } from 'eventemitter3'

interface Anims {
  key: string
  rate: number
  repeat: number
  timeline: number[]
}

export abstract class ActionSprite extends SimpleSprite {
  private _eventEmitter: any
  private _anims: Anims[] = []
  protected _flipX = false

  public currentFrame: number | string
  public currentIndex: number = 0
  public currentAnimation: string = ''
  public currentFrameWidth: number = 0
  public currentFrameHeight: number = 0

  public interval: number

  constructor(texture: Texture) {
    super(texture)
  }

  /** Set the frame you want to show. */
  abstract setFrame(frame: number | string): void
  /**
   * Set the offset of the Texture.
   * @param x A number from 0 to 1.
   * @param y A number from 0 to 1.
   */
  protected abstract offsetTexture(x: number, y: number): void
  /**
   *  Set the size of the Frame.
   * @param width A number from 0 to 1.
   * @param height A number from 0 to 1.
   */
  protected abstract sizeFrame(width: number, height: number): void

  /**
   * Scale the texture to the frame size.
   */
  protected abstract scaleFrame(): void

  public abstract flipX(flip: boolean): void

  getAnimationByKey(key: string) {
    return this._anims.filter(a => a.key === key)[0]
  }

  private _add(
    key: string,
    frameOptions: { start?: number; end?: number; rate?: number; repeat?: number; timeline?: number[] }
  ) {
    const { start, end, rate = 30, repeat = -1, timeline = [] } = frameOptions

    if (this.getAnimationByKey(key)) {
      console.warn(`The animation "${key}" does already exist!`)
      return
    }

    if (timeline.length === 0) {
      if (typeof end === 'undefined' || typeof start === 'undefined') {
        console.warn(`You need to provide "start" and "end or a "timeline"!`)
        return
      }

      for (let i = start; i <= end; i++) {
        timeline.push(i)
      }
    }

    this._anims.push({ key, timeline, rate, repeat })
  }

  private _stop() {
    if (this.interval) clearInterval(this.interval)
  }

  private _play(key: string) {
    this._stop()

    this.currentAnimation = key

    const animation = this.getAnimationByKey(key)
    if (!animation) console.warn(`Animation "${key}" does not exist!`)

    const { timeline, rate, repeat } = animation

    this.currentIndex = -1
    let loops = 0

    const playNextFrame = () => {
      this.currentIndex++

      if (this.currentIndex >= timeline.length) {
        this.currentIndex = 0
        loops++
      }

      this.currentFrame = timeline[this.currentIndex]

      const shouldStop = !(repeat === -1 || loops < repeat)

      if (shouldStop) {
        this._stop()
        this._events.emit('complete')
        return
      }

      this.setFrame(this.currentFrame)
    }

    playNextFrame()

    this.interval = window.setInterval(() => {
      playNextFrame()
    }, 1000 / rate)

    return { onComplete: (cb: Function) => this._events.once('complete', cb) }
  }

  protected get _events() {
    return {
      emit: (event: string) => {
        if (!this._eventEmitter) this._eventEmitter = new EventEmitter()
        this._eventEmitter.emit(event)
      },
      once: (event: string, callback: Function) => {
        if (!this._eventEmitter) this._eventEmitter = new EventEmitter()
        this._eventEmitter.once(event, callback)
      }
    }
  }

  get anims() {
    return {
      add: this._add.bind(this),
      play: this._play.bind(this),
      stop: this._stop.bind(this),
      setFrame: this.setFrame.bind(this),
      getFrame: () => this.currentFrame
    }
  }
}
