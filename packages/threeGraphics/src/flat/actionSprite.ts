/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { SimpleSprite } from './simpleSprite'
import { Texture } from 'three'
import { Events } from '@yandeu/events'

interface Frame {
  name: string
  index: number
  width: number
  height: number
}

interface Anims {
  name: string
  rate: number
  repeat: number
  timeline: number[]
}

export abstract class ActionSprite extends SimpleSprite {
  private _eventEmitter: any
  private _anims: Anims[] = []
  protected _flipX = false

  protected _frame: Frame = {
    name: '',
    index: -1,
    width: -1,
    height: -1
  }

  public get frame(): Frame {
    return {
      name: this._frame.name,
      index: this._frame.index,
      width: (this._frame.width * this._internalScale.x * 1) / this._pixelRatio,
      height: (this._frame.height * this._internalScale.y * 1) / this._pixelRatio
    }
  }

  private _currentIndex: number = 0
  private _currentAnimationName: string = ''

  get anims() {
    return {
      add: this._add.bind(this),
      get: this.getAnimationByName.bind(this),
      play: this._play.bind(this),
      stop: this._stop.bind(this),
      getName: () => this._currentAnimationName,
      name: this._currentAnimationName
    }
  }

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

  getAnimationByName(name: string) {
    return this._anims.filter(a => a.name === name)[0]
  }

  private _add(
    name: string,
    frameOptions: { start?: number; end?: number; rate?: number; repeat?: number; timeline?: number[] }
  ) {
    const { start, end, rate = 30, repeat = -1, timeline = [] } = frameOptions

    if (this.getAnimationByName(name)) {
      console.warn(`The animation "${name}" does already exist!`)
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

    this._anims.push({ name, timeline, rate, repeat })
  }

  private _stop() {
    if (this.interval) clearInterval(this.interval)
  }

  private _play(name: string) {
    this._stop()

    this._currentAnimationName = name

    const animation = this.getAnimationByName(name)
    if (!animation) console.warn(`Animation "${name}" does not exist!`)

    const { timeline, rate, repeat } = animation

    this._currentIndex = -1
    let loops = 0

    const playNextFrame = () => {
      this._currentIndex++

      if (this._currentIndex >= timeline.length) {
        this._currentIndex = 0
        loops++
      }

      this._currentIndex = timeline[this._currentIndex]

      const shouldStop = !(repeat === -1 || loops < repeat)

      if (shouldStop) {
        this._stop()
        this._events.emit('complete')
        return
      }

      this.setFrame(this._currentIndex)
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
        if (!this._eventEmitter) this._eventEmitter = new Events()
        this._eventEmitter.emit(event)
      },
      once: (event: string, callback: Function) => {
        if (!this._eventEmitter) this._eventEmitter = new Events()
        this._eventEmitter.once(event, callback)
      }
    }
  }
}
