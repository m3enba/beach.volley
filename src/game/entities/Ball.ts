import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SETTINGS } from '../../types';

export class Ball {
  public mesh: THREE.Mesh;
  public body: CANNON.Body;

  constructor(scene: THREE.Scene, world: CANNON.World, material: CANNON.Material) {
    // Three.js Mesh
    const geometry = new THREE.SphereGeometry(SETTINGS.ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      roughness: 0.4,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, ballMaterial);
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // Cannon.js Body
    const shape = new CANNON.Sphere(SETTINGS.ballRadius);
    this.body = new CANNON.Body({
      mass: 0.4, // Standard volleyball mass is ~260-280g, but we scale for game feel
      shape: shape,
      material: material,
      linearDamping: 0.1,
      angularDamping: 0.1
    });
    world.addBody(this.body);
  }

  update() {
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);
  }

  reset(x: number, y: number, z: number) {
    this.body.position.set(x, y, z);
    this.body.velocity.set(0, 0, 0);
    this.body.angularVelocity.set(0, 0, 0);
  }

  applyImpulse(impulse: CANNON.Vec3) {
    this.body.applyImpulse(impulse, this.body.position);
  }
}
