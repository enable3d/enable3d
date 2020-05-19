const HaveSomeFun = (numberOfElements: number = 20, physics: any) => {
  if (!window.__loadPhysics) {
    console.log('There is not much fun without physics enabled!')
    return
  }

  // adding some boxes (with physics)
  for (let i = 0; i < numberOfElements; i++) {
    const materials = ['standard', 'basic', 'normal', 'phong', 'line', 'points']
    const Between = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)
    const RandomPick = (array: Array<string>) => array[Math.floor(Math.random() * array.length)]

    if (Math.random() > 0.5) {
      physics.add
        .box(
          {
            x: Between(-10, 10),
            y: Between(10, 20),
            z: Between(-10, 10),
            width: Between(1, 2) / 10,
            height: Between(1, 2) / 10,
            depth: Between(1, 2) / 10,
            mass: 1
          },
          { [RandomPick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
        )
        .body.setRestitution(Math.floor(Math.random() * 10) / 20)
    } else {
      physics.add
        .sphere(
          {
            x: Between(-10, 10),
            y: Between(10, 20),
            z: Between(-10, 10),
            radius: Between(1, 2) / 10,
            mass: 1
          },
          { [RandomPick(materials)]: { color: Math.floor(Math.random() * 0xffffff) } }
        )
        .body.setRestitution(Math.floor(Math.random() * 10) / 20)
    }
  }
}

export default HaveSomeFun
