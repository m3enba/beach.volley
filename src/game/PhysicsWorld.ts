import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  public world: CANNON.World;
  public ballMaterial: CANNON.Material;
  public groundMaterial: CANNON.Material;
  public playerMaterial: CANNON.Material;

  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // Materials
    this.ballMaterial = new CANNON.Material('ball');
    this.groundMaterial = new CANNON.Material('ground');
    this.playerMaterial = new CANNON.Material('player');

    // Contact Materials
    const ballGroundContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.groundMaterial,
      {
        friction: 0.4,
        restitution: 0.7
      }
    );
    this.world.addContactMaterial(ballGroundContact);

    const ballPlayerContact = new CANNON.ContactMaterial(
      this.ballMaterial,
      this.playerMaterial,
      {
        friction: 0.1,
        restitution: 0.8
      }
    );
    this.world.addContactMaterial(ballPlayerContact);
  }

  update(dt: number) {
    this.world.step(1 / 60, dt, 3);
  }
}
