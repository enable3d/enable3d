class PointerDrag {
  private _isRunning = false
  private _position = { x: 0, y: 0 }
  private _delta = { x: 0, y: 0 }
  private _onMoveCallback: any = () => {}
  private _isPointerDown = false

  constructor(private _element: HTMLElement, autoStart = true) {
    if (autoStart) this.start()
  }

  public get isTouchDevice(): boolean {
    return 'ontouchstart' in window
  }

  public get isPointerDown(): boolean {
    return this._isPointerDown
  }

  public start(): void {
    if (this._isRunning) return
    this._isRunning = true

    if (this.isTouchDevice) {
      this._element.addEventListener('touchstart', e => this.onTouchStart(e))
      this._element.addEventListener('touchend', e => this.onTouchEnd(e))
      this._element.addEventListener('touchmove', e => this.onTouchMove(e))
    } else {
      this._element.addEventListener('mousedown', e => this.onPointerDown(e))
      this._element.addEventListener('mouseup', e => this.onPointerUp(e))
      this._element.addEventListener('mouseleave', e => this.onPointerLeave(e))
      this._element.addEventListener('mouseover', e => this.onPointerOver(e))
      this._element.addEventListener('mousemove', e => this.onPointerMove(e))
    }
  }

  public stop(): void {
    if (this.isTouchDevice) {
      this._element.removeEventListener('touchstart', e => this.onTouchStart(e))
      this._element.removeEventListener('touchend', e => this.onTouchEnd(e))
      this._element.removeEventListener('touchmove', e => this.onTouchMove(e))
    } else {
      this._element.removeEventListener('mousedown', e => this.onPointerDown(e))
      this._element.removeEventListener('mouseleave', e => this.onPointerLeave(e))
      this._element.removeEventListener('mouseup', e => this.onPointerUp(e))
      this._element.removeEventListener('mouseover', e => this.onPointerOver(e))
      this._element.removeEventListener('mousemove', e => this.onPointerMove(e))
    }

    this._isRunning = false
  }

  public removeListeners(): void {
    this.stop()
  }

  public onMove(onMoveCallback: (delta: { x: number; y: number }) => void) {
    this._onMoveCallback = onMoveCallback
  }

  private onPointerDown(_e: MouseEvent): void {
    this._isPointerDown = true
  }

  private onPointerUp(_e: MouseEvent): void {
    this._isPointerDown = false
  }

  private onPointerLeave(_e: MouseEvent): void {
    this._isPointerDown = false
  }

  private onPointerMove(e: MouseEvent): void {
    const clientX = e.movementX
    const clientY = e.movementY

    this._delta = { x: clientX, y: clientY }
    this._onMoveCallback(this._delta)
  }

  private onPointerOver(_e: MouseEvent): void {}

  private onTouchStart(e: TouchEvent): void {
    const clientX = e.touches[0].clientX
    const clientY = e.touches[0].clientY

    this._position = { x: clientX, y: clientY }
  }

  private onTouchEnd(_e: TouchEvent): void {
    this._position = { x: 0, y: 0 }
    this._delta = { x: 0, y: 0 }

    this._onMoveCallback(this._delta)
  }

  private onTouchMove(e: TouchEvent): void {
    const clientX = e.touches[0].clientX
    const clientY = e.touches[0].clientY

    this._delta = { x: clientX - this._position.x, y: clientY - this._position.y }
    this._onMoveCallback(this._delta)

    this._position = { x: clientX, y: clientY }
  }
}

export { PointerDrag }
