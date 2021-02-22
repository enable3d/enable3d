/**
 * @author       Yannick Deubel (https://github.com/yandeu)
 * @copyright    Copyright (c) 2020 Yannick Deubel; Project Url: https://github.com/enable3d/enable3d
 * @license      {@link https://github.com/enable3d/enable3d/blob/master/LICENSE|GNU GPLv3}
 */

import { Scene, Color, Mesh, Object3D, SphereBufferGeometry, MeshBasicMaterial } from 'three'
import { AmbientLight, DirectionalLight, HemisphereLight, PointLight, RectAreaLight, SpotLight } from 'three'
import { DirectionalLightHelper, SpotLightHelper } from 'three'

class PointLightHelper extends Object3D {
  private geo: SphereBufferGeometry
  private mat: MeshBasicMaterial
  private mesh: Mesh

  constructor(
    private scene: Scene,
    public light: PointLight,
    public size?: number | undefined,
    public color?: string | number | Color | undefined
  ) {
    super()
    this.geo = new SphereBufferGeometry(size || 0.2, 16, 8)
    this.mat = new MeshBasicMaterial({ color: color || light.color })
    this.mesh = new Mesh(this.geo, this.mat)

    this.add(this.mesh)
    light.add(this)
  }

  dispose() {
    this.mesh.geometry.dispose()
    if (!Array.isArray(this.mesh.material)) this.mesh.material.dispose()
    else this.mesh.material.forEach(m => m.dispose())
    this.remove(this.mesh)
  }

  update() {}
}

export default class Lights {
  constructor(private scene: Scene) {}

  public get helper() {
    return {
      directionalLightHelper: (
        light: DirectionalLight,
        size?: number | undefined,
        color?: string | number | Color | undefined
      ) => {
        const helper = new DirectionalLightHelper(light, size, color)
        this.scene.add(helper)
        return helper
      },
      spotLightHelper: (light: SpotLight, color?: string | number | Color | undefined) => {
        const helper = new SpotLightHelper(light, color)
        this.scene.add(helper)
        return helper
      },
      pointLightHelper: (light: PointLight, size?: number | undefined, color?: string | number | Color | undefined) =>
        new PointLightHelper(this.scene, light, size, color)
    }
  }

  public directionalLight(
    options: { color?: string | number | Color | undefined; intensity?: number | undefined } = {}
  ) {
    const { color = 0xffffff, intensity = 1 } = options
    const light = new DirectionalLight(color, intensity)
    light.castShadow = true
    this.scene.add(light)
    return light
  }

  public hemisphereLight(
    options: {
      skyColor?: string | number | Color | undefined
      groundColor?: string | number | Color | undefined
      intensity?: number | undefined
    } = {}
  ) {
    const { skyColor = 0xffffff, groundColor = 0xffffff, intensity = 1 } = options
    const light = new HemisphereLight(skyColor, groundColor, intensity)
    this.scene.add(light)
    return light
  }

  public ambientLight(options: { color?: string | number | Color | undefined; intensity?: number | undefined } = {}) {
    const { color = 0xffffff, intensity = 1 } = options
    const light = new AmbientLight(color, intensity)
    this.scene.add(light)
    return light
  }

  public pointLight(
    options: {
      color?: string | number | Color | undefined
      intensity?: number | undefined
      distance?: number | undefined
      decay?: number | undefined
    } = {}
  ) {
    const { color = 0xffffff, intensity = 1, distance = 0, decay = 1 } = options
    const light = new PointLight(color, intensity, distance, decay)
    light.castShadow = true
    this.scene.add(light)
    return light
  }

  public spotLight(
    options: {
      color?: string | number | Color | undefined
      intensity?: number | undefined
      distance?: number | undefined
      angle?: number | undefined
      penumbra?: number | undefined
      decay?: number | undefined
    } = {}
  ) {
    const { color = 0xffffff, intensity = 1, distance = 0, angle = Math.PI / 8, penumbra = 0, decay = 1 } = options
    const light = new SpotLight(color, intensity, distance, angle, penumbra, decay)
    light.castShadow = true
    this.scene.add(light)
    return light
  }

  public rectAreaLight(
    options: {
      color?: string | number | Color | undefined
      intensity?: number | undefined
      width?: number | undefined
      height?: number | undefined
    } = {}
  ) {
    const { color = 0xffffff, intensity = 1, width = 10, height = 10 } = options
    const light = new RectAreaLight(color, intensity, width, height)
    this.scene.add(light)
    return light
  }
}
