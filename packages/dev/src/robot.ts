import { ExtendedObject3D } from 'enable3d'
import { MathUtils, Vector3 } from 'three/src/Three'

export interface Sensors {
  rli: number
}

export class Robot {
  // in ticks
  private forward = 0
  private right = 0
  private left = 0

  constructor(private obj: ExtendedObject3D) {
    // turn 180deg
    // this.obj.rotateY(Math.PI / 2)
  }

  get dog() {
    return this.obj.children.find(o => o && o.name === 'dog')
  }

  get motor() {
    return {
      right: this.goRight.bind(this),
      left: this.goLeft.bind(this),
      forward: this.goForward.bind(this)
    }
  }

  public update() {
    // console.log('r1', this.right)
    const rotate = this.right - this.left

    if (this.forward === 0) {
      if (this.dog?.anims.current !== 'RobotDog@IdleStand') this.dog?.anims.play('RobotDog@IdleStand')
    } else {
      if (this.dog?.anims.current !== 'RobotDog@Walk') this.dog?.anims.play('RobotDog@Walk')
    }

    if (rotate > 0) this.obj.body.setAngularVelocityY(-0.5)
    else if (rotate < 0) this.obj.body.setAngularVelocityY(0.5)
    else this.obj.body.setAngularVelocityY(0)

    if (this.right > 0) this.right--
    if (this.left > 0) this.left--

    // forward
    if (this.forward > 0) {
      const speed = 0.8
      const rotation = this.obj.getWorldDirection(new Vector3().setFromEuler(this.obj.rotation))
      const theta = Math.atan2(rotation.x, rotation.z)

      const x = Math.sin(theta) * speed,
        y = this.obj.body.velocity.y,
        z = Math.cos(theta) * speed

      this.obj.body.setVelocity(x, y, z)

      this.forward--
    }
  }

  private goRight() {
    this.right = 1
  }
  private goLeft() {
    this.left = 1
  }
  private goForward() {
    this.forward = 1
  }
}
