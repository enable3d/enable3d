/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

/**
 * @author       Alex Bennett (https://github.com/timetocode)
 * @copyright    Copyright (c) 2014 Alex Bennett; Project Url: https://github.com/timetocode/node-game-loop
 * @license      {@link https://github.com/timetocode/node-game-loop/blob/master/LICENSE|MIT}
 */

const EventEmitter = require('events')

/**
 * A more precise clock than setTimeout(cb, ms).
 * But costs slightly more cpu.
 */
class ServerClock extends EventEmitter {
  /**
   * Length of a tick in milliseconds. The denominator is your desired framerate.
   * e.g. 1000 / 20 = 20 fps,  1000 / 60 = 60 fps
   */
  private tickLengthMs = 1000 / 60
  /** timestamp of each loop */
  private previousTick = Date.now()
  /** number of times ServerClock gets called */
  private actualTicks = 0
  /** store the delta value */
  private _delta = 0
  /** store the time from the start */
  private startTime: number
  /** store is the clock is running or not */
  private _isRunning = false

  constructor(ms: number = 60, autoStart: boolean = true) {
    super()
    if (autoStart) this.start(ms)
  }

  /**
   * Start the clock.
   * @param ms Interval in milliseconds. Default is 60 fps.
   */
  public start(ms = 60) {
    this.tickLengthMs = 1000 / ms
    this._isRunning = true
    this.startTime = Date.now()
    this.loop()
  }

  /** Stop the clock */
  public stop() {
    this._isRunning = false
  }

  /** Is clock running? */
  public isRunning() {
    return this._isRunning
  }

  /** Returns the last delta value. */
  public getDelta() {
    return this._delta
  }

  /** Keeps track of the total time that the clock has been running. */
  public getElapsedTime() {
    return Date.now() - this.startTime
  }

  /** Event listener for every new tick. */
  public onTick(cb: Function) {
    return this.on('tick', () => cb(this._delta))
  }

  private loop() {
    if (!this._isRunning) return

    var now = Date.now()

    this.actualTicks++
    if (this.previousTick + this.tickLengthMs <= now) {
      this._delta = (now - this.previousTick) / 1000

      this.previousTick = now

      this.emit('tick', this._delta)

      // console.log(
      //   'this._delta',
      //   this._delta,
      //   '(target: ' + this.tickLengthMs + ' ms)',
      //   'node ticks',
      //   this.actualTicks
      // )

      this.actualTicks = 0
    }

    if (Date.now() - this.previousTick < this.tickLengthMs - 16) {
      setTimeout(() => this.loop())
    } else {
      setImmediate(() => this.loop())
    }
  }
}

export { ServerClock }
