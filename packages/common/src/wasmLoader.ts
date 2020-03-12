// Inspired by https://github.com/playcanvas/engine/blob/master/examples/wasm-loader.js
const wasmSupported = (() => {
  try {
    if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
      if (module instanceof WebAssembly.Module) return new WebAssembly.Instance(module) instanceof WebAssembly.Instance
    }
  } catch (e) {}
  return false
})()

const loadScriptAsync = (url: string, doneCallback: any) => {
  var tag = document.createElement('script')
  tag.onload = () => {
    doneCallback()
  }
  tag.onerror = () => {
    throw new Error('failed to load ' + url)
  }
  tag.async = true
  tag.src = url
  document.head.appendChild(tag)
}

const loadAmmoModule = (path: string, doneCallback: any) => {
  // console.log(wasmSupported ? 'WebAssembly is supported' : 'WebAssembly is not supported')
  if (wasmSupported) loadScriptAsync(`${path}/ammo.wasm.js`, () => doneCallback())
  else loadScriptAsync(`${path}/ammo.js`, () => doneCallback())
}

export default loadAmmoModule
