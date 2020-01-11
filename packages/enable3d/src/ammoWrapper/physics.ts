/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2019 Yannick Deubel; Project Url: https://github.com/yandeu/enable3d
 * @license      {@link https://github.com/yandeu/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import EventEmitter = require('eventemitter3')
import { ExtendedObject3D } from '../types'
import ThreeGraphics from '../threeWrapper'
import { Scene3D } from '..'
import DebugDrawer from './debugDrawer'

export default class Physics extends EventEmitter {
  public tmpTrans: Ammo.btTransform
  public physicsWorld: Ammo.btDiscreteDynamicsWorld
  protected dispatcher: Ammo.btCollisionDispatcher
  protected rigidBodies: ExtendedObject3D[] = []
  protected objectsAmmo: { [ptr: number]: any } = {}
  protected earlierDetectedCollisions: { combinedName: string; collision: boolean }[] = []
  protected debugDrawer: DebugDrawer

  constructor(protected phaser3D: ThreeGraphics, protected scene: Scene3D) {
    super()
  }

  protected setup() {
    // setup ammo physics
    this.setupPhysicsWorld()

    this.debugDrawer = new DebugDrawer(this.phaser3D.scene, this.physicsWorld, {})

    /**
     * TODO add ghost object
     */
    // const ghost = new Ammo.btGhostObject()
    // ghost.setCollisionShape(new Ammo.btSphereShape(10))
    // ghost.setWorldTransform(new Ammo.btTransform(new Ammo.btQuaternion(0, 0, 0, 1), new Ammo.btVector3(0, 15, 0)))
    // ghost.setCollisionFlags(4)
    // this.physicsWorld.addCollisionObject(ghost)

    // run the phaser update method
    if (!this.phaser3D.isXrEnabled)
      this.scene.events.on('update', (_time: number, delta: number) => {
        this.update(delta)
        this.updateDebugger()
      })
  }

  public updateDebugger() {
    if (this.debugDrawer && this.debugDrawer.enabled) this.debugDrawer.update()
  }

  protected setupPhysicsWorld() {
    var gravityConstant = -20

    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration()
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration)
    const broadphase = new Ammo.btDbvtBroadphase()
    const solver = new Ammo.btSequentialImpulseConstraintSolver()
    this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration)
    this.physicsWorld.setGravity(new Ammo.btVector3(0, gravityConstant, 0))

    this.dispatcher = dispatcher
    this.tmpTrans = new Ammo.btTransform()
  }

  public update(delta: number) {
    const deltaTime = delta / 1000

    // Step world
    this.physicsWorld.stepSimulation(deltaTime)

    // Collision
    const detectedCollisions: { combinedName: string; collision: boolean }[] = []
    const num = this.dispatcher.getNumManifolds()
    for (let i = 0; i < num; i++) {
      const manifold = this.dispatcher.getManifoldByIndexInternal(i)
      // gets all contact points (edges)
      const num_contacts = manifold.getNumContacts()
      if (num_contacts === 0) {
        continue
      }

      for (let j = 0; j < num_contacts; j++) {
        // const flag0 = manifold.getBody0().getCollisionFlags()
        // const flag1 = manifold.getBody1().getCollisionFlags()
        const key = Object.keys(manifold.getBody0())[0]

        // @ts-ignore
        const ptr0 = manifold.getBody0()[key]
        // @ts-ignore
        const ptr1 = manifold.getBody1()[key]
        // @ts-ignore
        const obj0 = ptr0 in this.objectsAmmo ? this.objectsAmmo[ptr0] : manifold.getBody0()
        // @ts-ignore
        const obj1 = ptr0 in this.objectsAmmo ? this.objectsAmmo[ptr1] : manifold.getBody1()

        // check if a collision between these object has already been processed
        const combinedName = `${obj0.name}__${obj1.name}`

        // console.log(combinedName)
        if (detectedCollisions.find(el => el.combinedName === combinedName)) {
          continue
        }

        let event
        if (this.earlierDetectedCollisions.find(el => el.combinedName === combinedName)) {
          event = 'colliding'
        } else {
          event = 'start'
        }
        detectedCollisions.push({ combinedName, collision: true })

        // const a = manifold.getContactPoint(num_contacts).getPositionWorldOnA()
        // const b = manifold.getContactPoint(num_contacts).getPositionWorldOnB()
        // console.log(a.x(), a.y(), a.z())
        // console.log(b.x(), b.y(), b.z())

        // console.log(pt)
        // console.log(pt.getAppliedImpulse())

        this.emit('collision', { bodies: [obj0, obj1], event })

        // https://stackoverflow.com/questions/31991267/bullet-physicsammo-js-in-asm-js-how-to-get-collision-impact-force
        // console.log('COLLISION DETECTED!')
        // HERE: how to get impact force details?
        // const pt = manifold.getContactPoint(j)
        // pt.getAppliedImpulse() is not working
      }
    }
    // Check which collision ended
    this.earlierDetectedCollisions.forEach(el => {
      const { combinedName } = el
      if (!detectedCollisions.find(el => el.combinedName === combinedName)) {
        const split = combinedName.split('__')
        // console.log(split[0], split[1])
        const obj0 = this.rigidBodies.find(obj => obj.name === split[0])
        const obj1 = this.rigidBodies.find(obj => obj.name === split[1])
        // console.log(obj0, obj1)
        if (obj0 && obj1) this.emit('collision', { bodies: [obj0, obj1], event: 'end' })
      }
    })
    // Update earlierDetectedCollisions
    this.earlierDetectedCollisions = [...detectedCollisions]

    // Update rigid bodies
    for (let i = 0; i < this.rigidBodies.length; i++) {
      let objThree = this.rigidBodies[i]
      // console.log(objThree)
      let objAmmo = objThree.body.ammo
      let ms = objAmmo.getMotionState()
      if (ms) {
        ms.getWorldTransform(this.tmpTrans)
        let p = this.tmpTrans.getOrigin()
        let q = this.tmpTrans.getRotation()
        // body offset
        let o = objThree.body.offset
        objThree.position.set(p.x() + o.x, p.y() + o.y, p.z() + o.z)
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w())
      }
    }
  }
}
