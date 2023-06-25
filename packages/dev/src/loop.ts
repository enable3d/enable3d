import type { Robot, Sensors } from './robot'

let move = true

export const loop = (sensors: Sensors, robot: Robot) => {
  const { rli } = sensors

  if (move == true) robot.motor.forward()

  if (rli < 0.8) {
    robot.motor.left()
  } else {
    robot.motor.right()
  }

  if (rli < 0.1 && move == true) {
    move = false
    setTimeout(() => {
      move = true
    }, 1000)
  }
}
