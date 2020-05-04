import loadAmmoModule from './wasmLoader'

const PhysicsLoader = (path: string, callback: Function) => {
  if (typeof window !== 'undefined') window.__loadPhysics = true

  loadAmmoModule(path, () => {
    Ammo().then(() => {
      callback()
    })
  })
}

export { PhysicsLoader }
