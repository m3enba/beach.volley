import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { SETTINGS, Team } from '../../types';

// Exposed Tweakable Variables
export const PLAYER_SPEED = 15;
export const PLAYER_JUMP_FORCE = 8;
export const PLAYER_BLOCK_COOLDOWN = 0.5;

export class Player {
  public mesh: THREE.Group;
  public body: CANNON.Body;
  public team: Team;
  
  private isGrounded = true;
  private isBlocking = false;
  private blockTimer = 0;
  private hasTouchedBall = false;
  private touchCooldown = 0;

  // Limbs for animation/visuals
  private leftArm!: THREE.Mesh;
  private rightArm!: THREE.Mesh;
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;

  constructor(scene: THREE.Scene, world: CANNON.World, material: CANNON.Material, team: Team, color: number) {
    this.team = team;
    this.mesh = new THREE.Group();

    // Visuals
    const bodyMat = new THREE.MeshStandardMaterial({ color });
    
    // Torso
    const torsoGeom = new THREE.CapsuleGeometry(0.35, 0.8, 4, 8);
    const torsoMesh = new THREE.Mesh(torsoGeom, bodyMat);
    torsoMesh.castShadow = true;
    this.mesh.add(torsoMesh);

    // Head
    const headGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const headMesh = new THREE.Mesh(headGeom, bodyMat);
    headMesh.position.y = 0.9;
    this.mesh.add(headMesh);

    // Arms
    const limbGeom = new THREE.CapsuleGeometry(0.12, 0.5, 4, 8);
    this.leftArm = new THREE.Mesh(limbGeom, bodyMat);
    this.leftArm.position.set(-0.5, 0.4, 0);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Mesh(limbGeom, bodyMat);
    this.rightArm.position.set(0.5, 0.4, 0);
    this.mesh.add(this.rightArm);

    // Legs
    this.leftLeg = new THREE.Mesh(limbGeom, bodyMat);
    this.leftLeg.position.set(-0.2, -0.6, 0);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(limbGeom, bodyMat);
    this.rightLeg.position.set(0.2, -0.6, 0);
    this.mesh.add(this.rightLeg);

    scene.add(this.mesh);

    // Physics
    const shape = new CANNON.Cylinder(SETTINGS.playerRadius, SETTINGS.playerRadius, SETTINGS.playerHeight, 8);
    this.body = new CANNON.Body({
      mass: 80,
      shape: shape,
      material: material,
      fixedRotation: true,
      linearDamping: 0.9,
    });
    
    const startZ = team === Team.PLAYER ? SETTINGS.courtLength / 4 : -SETTINGS.courtLength / 4;
    this.body.position.set(0, SETTINGS.playerHeight / 2, startZ);
    world.addBody(this.body);

    this.body.addEventListener('collide', (e: any) => {
      if (e.contact.ni.y > 0.5) {
        this.isGrounded = true;
      }
    });
  }

  update(dt: number) {
    this.mesh.position.copy(this.body.position as any);
    this.mesh.quaternion.copy(this.body.quaternion as any);

    if (this.isBlocking) {
      this.blockTimer -= dt;
      if (this.blockTimer <= 0) {
        this.isBlocking = false;
      }
    }

    if (this.touchCooldown > 0) {
      this.touchCooldown -= dt;
      if (this.touchCooldown <= 0) {
        this.hasTouchedBall = false;
      }
    }

    // Simple limb animation
    const walkCycle = Math.sin(Date.now() * 0.012) * 0.6;
    const isMoving = Math.abs(this.body.velocity.x) > 0.5 || Math.abs(this.body.velocity.z) > 0.5;
    
    if (isMoving && this.isGrounded) {
      this.leftLeg.rotation.x = walkCycle;
      this.rightLeg.rotation.x = -walkCycle;
      this.leftArm.rotation.x = -walkCycle;
      this.rightArm.rotation.x = walkCycle;
    } else {
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, 0.1);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, 0.1);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, 0.1);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, 0.1);
    }

    if (this.isBlocking) {
      this.leftArm.rotation.x = -Math.PI / 2;
      this.rightArm.rotation.x = -Math.PI / 2;
    }

    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), 0);
  }

  move(dir: THREE.Vector3) {
    if (this.isBlocking) {
      this.body.velocity.x = 0;
      this.body.velocity.z = 0;
      return;
    }
    
    const velocity = new CANNON.Vec3(dir.x * PLAYER_SPEED, this.body.velocity.y, dir.z * PLAYER_SPEED);
    this.body.velocity.x = velocity.x;
    this.body.velocity.z = velocity.z;

    if (dir.length() > 0.1) {
      const angle = Math.atan2(dir.x, dir.z);
      this.mesh.rotation.y = angle;
    }
  }

  jump() {
    if (this.isGrounded && !this.isBlocking) {
      this.body.velocity.y = PLAYER_JUMP_FORCE;
      this.isGrounded = false;
    }
  }

  block() {
    if (this.isGrounded && !this.isBlocking) {
      this.isBlocking = true;
      this.blockTimer = PLAYER_BLOCK_COOLDOWN;
      this.body.velocity.set(0, 0, 0);
    }
  }

  canHitBall(): boolean {
    return !this.hasTouchedBall;
  }

  registerHit() {
    this.hasTouchedBall = true;
    this.touchCooldown = 0.5; // Cooldown to prevent spam
  }

  getIsJumping() {
    return !this.isGrounded;
  }

  getIsBlocking() {
    return this.isBlocking;
  }

  getHandPosition(): THREE.Vector3 {
    const pos = new THREE.Vector3();
    this.rightArm.getWorldPosition(pos);
    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    pos.add(direction.multiplyScalar(0.4));
    pos.y += 0.3;
    return pos;
  }
}
