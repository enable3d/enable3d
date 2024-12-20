import loadAmmoModule from '@enable3d/common/dist/wasmLoader.js'

window.__loadPhysics = false
window.__ammoPath = ''

/** Discover a whole new dimension wrapping your Phaser game with enable3d */
export const enable3d = (ready: Function) => {
  window.setTimeout(() => {
    if (window.__loadPhysics) {
      loadAmmoModule(window.__ammoPath, () => {
        Ammo().then(() => {
          ready()
        })
      })
    } else {
      ready()
    }
  }, 50)
  return {
    withPhysics(path: string) {
      window.__loadPhysics = true
      window.__ammoPath = path
    }
  }
}

export default enable3d
