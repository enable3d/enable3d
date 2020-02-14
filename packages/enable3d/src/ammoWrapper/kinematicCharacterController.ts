/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

const getPlayerShape = () => {
  const compoundShape = new Ammo.btCompoundShape()

  const transform1 = new Ammo.btTransform()
  transform1.setIdentity()
  transform1.setOrigin(new Ammo.btVector3(0, 0, 0))
  compoundShape.addChildShape(transform1, new Ammo.btSphereShape(0.5))

  const transform2 = new Ammo.btTransform()
  transform2.setIdentity()
  transform2.setOrigin(new Ammo.btVector3(0, 0.5, 0))
  compoundShape.addChildShape(transform2, new Ammo.btCylinderShape(new Ammo.btVector3(0.5, 0.5, 0)))

  return compoundShape
}

// https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=7468
// https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=9358
// https://github.com/lo-th/Ammo.lab/blob/af8ee2562dd1b928722784319417944b55904399/src/gun/Character.js
// https://discourse.threejs.org/t/ammo-js-with-three-js/12530
class KinematicCharacterController {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld

  public addCharacter() {
    const shape = getPlayerShape()
    shape.setMargin(0.05)

    const ghostObject = new Ammo.btPairCachingGhostObject()
    const transform = new Ammo.btTransform()
    transform.setIdentity()
    transform.setOrigin(new Ammo.btVector3(-5, 2, 0))
    transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1))
    ghostObject.setWorldTransform(transform)
    ghostObject.setCollisionShape(shape)
    ghostObject.setCollisionFlags(ghostObject.getCollisionFlags() | 16) //CHARACTER_OBJECT

    ghostObject.setActivationState(4)
    ghostObject.activate(true)

    const controller = new Ammo.btKinematicCharacterController(ghostObject, shape.getChildShape(0), 0.35, 1)
    controller.setUseGhostSweepTest(true)

    // controller.setUpAxis(1)
    // controller.canJump( true);
    // controller.setMaxJumpHeight(1)
    // controller.setJumpSpeed(5)

    controller.setGravity(9.8 * 3) // default 9.8*3
    controller.setMaxSlope(Math.PI / 4) // default Math.PI /4

    // controller.setGravity(0)
    // it falls through the ground if I apply gravity
    // controller.setGravity(-this.physicsWorld.getGravity().y())

    // addCollisionObject(collisionObject: Ammo.btCollisionObject, collisionFilterGroup?: number | undefined, collisionFilterMask?: number | undefined): void
    this.physicsWorld.addCollisionObject(ghostObject)
    this.physicsWorld.addAction(controller)
    this.physicsWorld
      .getBroadphase()
      .getOverlappingPairCache()
      .setInternalGhostPairCallback(new Ammo.btGhostPairCallback())

    return controller
  }
}

export default KinematicCharacterController
