import { Matrix4, Vector3 } from 'three'

export const create_gimpact_shape = (
  vertices: Array<number>,
  indices: Array<number>,
  localScale = new Vector3(1, 1, 1),
  MARGIN = 0.01
) => {
  const bta = new Ammo.btVector3()
  const btb = new Ammo.btVector3()
  const btc = new Ammo.btVector3()
  const triMesh = new Ammo.btTriangleMesh(true, false)

  const va = new Vector3()
  const vb = new Vector3()
  const vc = new Vector3()
  const matrix = new Matrix4()

  const faces = indices

  for (let j = 0; j < faces.length; j += 3) {
    const ai = faces[j] * 3
    const bi = faces[j + 1] * 3
    const ci = faces[j + 2] * 3
    va.set(vertices[ai], vertices[ai + 1], vertices[ai + 2]).applyMatrix4(matrix)
    vb.set(vertices[bi], vertices[bi + 1], vertices[bi + 2]).applyMatrix4(matrix)
    vc.set(vertices[ci], vertices[ci + 1], vertices[ci + 2]).applyMatrix4(matrix)
    bta.setValue(va.x, va.y, va.z)
    btb.setValue(vb.x, vb.y, vb.z)
    btc.setValue(vc.x, vc.y, vc.z)
    triMesh.addTriangle(bta, btb, btc, false)
  }
  let collisionShape
  collisionShape = new Ammo.btGImpactMeshShape(triMesh)

  const _localScale = new Ammo.btVector3(localScale.x, localScale.y, localScale.z)
  collisionShape.setLocalScaling(_localScale)
  collisionShape.setMargin(MARGIN)
  collisionShape.updateBound()

  Ammo.destroy(bta)
  Ammo.destroy(btb)
  Ammo.destroy(btc)
  Ammo.destroy(_localScale)

  return collisionShape
}
