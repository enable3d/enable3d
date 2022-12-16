/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2021 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|LGPL-3.0}
 */

export const debugSettings = {
  colors: {
    dynamic: '#ff0000', // red
    static: '#90ee90', // lightgreen
    sensor: '#ffff00', // yellow
    sleeping: '#464646' // gray
  },
  lineWidth: 2,
  fill: false,
  opacity: 0.25
}

export const getDebugColors = (options: { isStatic?: boolean; isSensor?: boolean; isSleeping?: boolean } = {}) => {
  const { colors } = debugSettings

  if (options.isStatic) return colors.static
  if (options.isSensor) return colors.sensor
  if (options.isSleeping) return colors.sleeping
  return colors.dynamic
}

export const adjustDebugColor = (body: Matter.Body, depth = 0, _fill?: string, _stroke?: string) => {
  // get color
  const color = getDebugColors(body)

  const opacity = debugSettings.opacity
  const lineWidth = debugSettings.lineWidth
  const shouldFill = debugSettings.fill

  let fill = _fill ?? color + Math.round(255 * opacity).toString(16)
  if (!shouldFill) fill = _fill ?? 'transparent'
  if (body.isSleeping && !body.isStatic && !body.isSensor) fill = _fill ?? color //+ Math.round(255 * opacity).toString(16)

  const stroke = _stroke ?? color

  body.render.fillStyle = fill
  body.render.strokeStyle = stroke
  body.render.lineWidth = lineWidth

  if (depth >= 5) return

  body.parts.forEach(part => {
    adjustDebugColor(part, depth + 1, fill, stroke)
  })
}
