// https://discourse.threejs.org/t/procedural-prototype-grid-shader/60979
// https://jsfiddle.net/forerun/8mh3yr0f/16/

import * as THREE from 'three'

const defaultParameters = {
  size: 1024,
  repeat: 2,
  margin: 24,
  gap: 6,
  radius: 36,
  background: '#fff',
  textColor: '#fff',
  color1: '#444',
  color2: '#666',
  textScale: 1,
  topLeftText: 'Box Prototype',
  topRightText: '1x1 Meter',
  bottomLeftText: '',
  bottomRightText: '1024 x 1024',
  textureScale: new THREE.Vector2(1, 1)
}

export type Parameters = typeof defaultParameters

export function extendToGridPrototypeMaterial(material: THREE.Material, parameters: Partial<Parameters>) {
  // merge with default parameters
  const _parameters = { ...defaultParameters, ...parameters }

  material.onBeforeCompile = shader => {
    // -----------
    // -- Vertex
    // -----------
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      varying vec2 vGridUv;

      #include <common>
      `
    )

    shader.vertexShader = shader.vertexShader.replace(
      'void main() {',
      `
      vec2 computeGridUv() {
        vec3 pos = position;
        vec3 nor = abs(normal);
        vec3 scale = vec3(
					length(modelMatrix[0]), length(modelMatrix[1]), length(modelMatrix[2])
      	);

        float x = 0.0;
        float y = 0.0;

        if (nor.x >= nor.y && nor.x >= nor.z) {
          x = pos.z * scale.z * sign(-normal.x) + 0.5 * scale.z;
          y = pos.y * scale.y + 0.5 * scale.y;
        }

        if (nor.y >= nor.x && nor.y >= nor.z) {
          x = pos.x * scale.x + 0.5 * scale.x;
          y = pos.z * scale.z * sign(-normal.y) + 0.5 * scale.z;
        }

        if (nor.z >= nor.x && nor.z >= nor.y) {
          x = pos.x * scale.x * sign(normal.z) + 0.5 * scale.x;
          y = pos.y * scale.y + 0.5 * scale.y;
        }

        return vec2(x, y);
      }
      
      void main() {
      `
    )

    shader.vertexShader = shader.vertexShader.replace(
      '#include <fog_vertex>',
      `
      #include <fog_vertex>
    
    	vGridUv = computeGridUv();
      `
    )

    // ------------
    // -- Fragment
    // ------------
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      varying vec2 vGridUv;

      #include <common>\n
			`
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        vec4 sampledDiffuseColor = texture2D( map, vGridUv );
        #ifdef DECODE_VIDEO_TEXTURE
          sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );

        #endif
        diffuseColor *= sampledDiffuseColor;
      #endif
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <alphamap_fragment>',
      `
      #ifdef USE_ALPHAMAP
        diffuseColor.a *= texture2D( alphaMap, vGridUv ).g;
      #endif
      `
    )
  }

  // @ts-expect-error
  material.updateTexture = () => {
    return updateGridTexture(material, _parameters)
  }
  // @ts-expect-error
  material.updateTexture()
}

//------------
//--- Texture
//------------
function updateGridTexture(material: THREE.Material, parameters: Parameters) {
  const canvas = createGridCanvas(parameters)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.anisotropy = 16
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  // @ts-expect-error
  if (material.map) material.map.dispose()
  // @ts-expect-error
  material.map = texture
  material.needsUpdate = true

  const parametersA = { ...parameters, textureScale: parameters.textureScale.copy(parameters.textureScale) }

  const canvasA = createGridCanvas(parametersA)

  const alphaTexture = new THREE.CanvasTexture(canvasA)
  alphaTexture.colorSpace = THREE.SRGBColorSpace
  alphaTexture.magFilter = THREE.LinearFilter
  alphaTexture.minFilter = THREE.LinearMipmapLinearFilter
  alphaTexture.anisotropy = 16
  alphaTexture.wrapS = THREE.RepeatWrapping
  alphaTexture.wrapT = THREE.RepeatWrapping

  // @ts-expect-error
  if (material.alphaMap) material.alphaMap.dispose()
  // @ts-expect-error
  material.alphaMap = alphaTexture
  material.needsUpdate = true
}

function createGridCanvas(parameters: Parameters) {
  const {
    size,
    background,
    margin,
    repeat,
    gap,
    color1,
    color2,
    textColor,
    radius,
    textScale,
    topLeftText,
    topRightText,
    bottomLeftText,
    bottomRightText
  } = parameters

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

  canvas.width = size
  canvas.height = size

  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)

  const squareSize = (size - 2 * margin - (repeat - 1) * gap) / repeat

  for (let i = 0; i < repeat; i++) {
    for (let j = 0; j < repeat; j++) {
      const x = margin + j * (squareSize + gap)
      const y = margin + i * (squareSize + gap)

      ctx.fillStyle = (i + j) % 2 === 0 ? color1 : color2
      drawRoundRect(ctx, x, y, squareSize, squareSize, radius)
      ctx.fill()
    }
  }

  drawText()

  return canvas

  function drawText() {
    const fontSize = size * 0.04 * textScale
    ctx.font = `bold ${fontSize}px Arial`

    const marginX = (margin + size * 0.065) / 2
    const marginY = marginX * 1.9

    ctx.fillStyle = textColor

    if (topLeftText) {
      // topLeftText = topLeftText.toUpperCase()
      ctx.fillText(topLeftText, marginX, marginY)
      const lineY = marginY + fontSize / 2
      ctx.beginPath()
      ctx.moveTo(marginX, lineY)
      ctx.lineTo(marginX + ctx.measureText(topLeftText).width, lineY)
      ctx.strokeStyle = textColor
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()
    }

    ctx.font = `${fontSize * 1}px Arial`

    if (topRightText) {
      const topRightX = size - ctx.measureText(topRightText).width - marginX
      ctx.fillText(topRightText, topRightX, marginY)
    }

    const bottomY = size - margin - fontSize / 2
    if (bottomLeftText) ctx.fillText(bottomLeftText, marginX, bottomY)

    if (bottomRightText) {
      const bottomRightX = size - ctx.measureText(bottomRightText).width - marginX
      ctx.fillText(bottomRightText, bottomRightX, bottomY)
    }
  }

  function drawRoundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + width, y, x + width, y + height, radius)
    ctx.arcTo(x + width, y + height, x, y + height, radius)
    ctx.arcTo(x, y + height, x, y, radius)
    ctx.arcTo(x, y, x + width, y, radius)
    ctx.closePath()
  }
}

// function switchMaterial() {
//   const material = new THREE[mat.mat]()
//   extendToGridPrototypeMaterial(material, parameters)

//   box.material.dispose()
//   box.material = material
// }

// --- Alpha map
/* const alphaTexture = new THREE.CanvasTexture(getAlphaCanvas(1024, 0.5));
alphaTexture.colorSpace = THREE.SRGBColorSpace;
alphaTexture.magFilter = THREE.LinearFilter;
alphaTexture.minFilter = THREE.LinearMipmapLinearFilter;
alphaTexture.anisotropy = 16;
alphaTexture.wrapS = THREE.RepeatWrapping;
alphaTexture.wrapT = THREE.RepeatWrapping;
material.alphaMap = alphaTexture;
material.needsUpdate = true; */

function getAlphaCanvas(resolution: number, normalizedRadius: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  canvas.width = resolution
  canvas.height = resolution

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#000000'

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const radius = normalizedRadius * Math.min(centerX, centerY)

  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
  ctx.fill()
  ctx.closePath()

  return canvas
}
