import type { Robot, Sensors } from './robot'

export const loop = (sensors: Sensors, robot: Robot) => {
  const { rli } = sensors

  robot.motor.forward()

  if (rli < 0.8) {
    robot.motor.left()
  } else {
    robot.motor.right()
  }
}
