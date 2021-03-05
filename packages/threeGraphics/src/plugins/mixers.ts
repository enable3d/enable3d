import { AnimationMixer, Object3D } from 'three'

export interface GetMixers {
  create: (root: Object3D) => AnimationMixer
  add: (animationMixer: AnimationMixer) => number
  get: () => AnimationMixer[]
  update: (delta: number) => void
}

class Mixers {
  private _mixers: AnimationMixer[] = []

  /**
   * Create an Animation Mixer and ads it to the mixers array
   */
  private animationMixer(root: Object3D) {
    const mixer = new AnimationMixer(root)
    this.mixers.add(mixer)
    return mixer
  }

  get mixers(): GetMixers {
    return {
      create: (root: Object3D) => this.animationMixer(root),
      add: (animationMixer: AnimationMixer) => this._mixers.push(animationMixer),
      get: () => this._mixers,
      update: (delta: number) => this._mixers?.forEach(mixer => mixer.update(delta / 1000))
    }
  }
}

export default Mixers
