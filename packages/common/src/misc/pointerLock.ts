class PointerLock {
  private _isRunning: boolean = false

  constructor(private _element: HTMLElement, autoLock = true) {
    if (autoLock) this.request()
  }

  public isLocked() {
    return !!document.pointerLockElement
  }

  public exit() {
    this._isRunning = false
    document.exitPointerLock()
    this.removeListeners()
  }

  public removeListeners() {
    document.removeEventListener('pointerlockchange', () => this.pointerLockChangeHandler())
    this._element.removeEventListener('pointerdown', () => this.pointerDownHandlerHandler())
  }

  private pointerLockChangeHandler() {
    if (!this._isRunning) return
    this._request()
  }

  private pointerDownHandlerHandler() {
    if (!this._isRunning) return
    this._element.requestPointerLock()
  }

  private request() {
    this._isRunning = true
    this._request()
  }

  public _request() {
    // listen to pointer lock change events
    document.addEventListener('pointerlockchange', () => this.pointerLockChangeHandler(), {
      once: true
    })

    // return if pointer is already locked
    if (!!document.pointerLockElement) return

    // listen for pointerdown event
    this._element.addEventListener('pointerdown', () => this.pointerDownHandlerHandler(), { once: true })
  }
}

export { PointerLock }
