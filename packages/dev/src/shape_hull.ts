import { Vector3 } from 'three'

export const create_hull_shape = (vertices: Array<number>, localScale = new Vector3(1, 1, 1), MARGIN = 0.04) => {
  const btVertex = new Ammo.btVector3()

  const originalHull = new Ammo.btConvexHullShape()
  originalHull.setMargin(MARGIN)

  //this.add.existing(new Mesh(g, this.add.material({ lambert: { color: 'black' } })))

  for (let i = 0; i < vertices.length; i += 3) {
    btVertex.setValue(vertices[i + 0], vertices[i + 1], vertices[i + 2])
    originalHull.addPoint(btVertex)
  }

  originalHull.recalcLocalAabb()

  let collisionShape = originalHull

  if (originalHull.getNumVertices() >= 100) {
    //Bullet documentation says don't use convexHulls with 100 verts or more
    const shapeHull = new Ammo.btShapeHull(originalHull)
    shapeHull.buildHull(MARGIN)
    Ammo.destroy(originalHull)
    collisionShape = new Ammo.btConvexHullShape(Ammo.getPointer(shapeHull.getVertexPointer()), shapeHull.numVertices())
    Ammo.destroy(shapeHull) // btConvexHullShape makes a copy
  }

  const scale = new Ammo.btVector3(localScale.x, localScale.y, localScale.z)
  collisionShape.setLocalScaling(scale)
  Ammo.destroy(scale)

  // https://github.com/bulletphysics/bullet3/issues/1970
  collisionShape.initializePolyhedralFeatures(0)
  // this.physics.physicsWorld.getDispatchInfo().m_enableSatConvex = true

  Ammo.destroy(btVertex)

  return collisionShape
}
