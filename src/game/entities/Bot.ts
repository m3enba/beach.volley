import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player';
import { Ball } from './Ball';
import { Team, SETTINGS } from '../../types';

// Exposed Tweakable Variables
export const BOT_SPEED = 14;
export const BOT_REACTION_DELAY = 0.1;

export class Bot extends Player {
  private targetPos = new THREE.Vector3();
  private timer = 0;

  constructor(scene: THREE.Scene, world: CANNON.World, material: CANNON.Material) {
    super(scene, world, material, Team.BOT, 0xff4444);
  }

  updateAI(dt: number, ball: Ball, player: Player) {
    this.timer += dt;
    if (this.timer < BOT_REACTION_DELAY) return;
    this.timer = 0;

    const ballPos = ball.body.position;
    const playerPos = player.body.position;

    // Only react if ball is on bot's side or coming towards it
    if (ballPos.z < 1) {
      // Intercept ball
      this.targetPos.set(ballPos.x, 0, ballPos.z - 0.5);
      
      const moveDir = new THREE.Vector3().subVectors(this.targetPos, new THREE.Vector3(this.body.position.x, 0, this.body.position.z));
      if (moveDir.length() > 0.3) {
        moveDir.normalize();
        this.move(moveDir);
      } else {
        this.move(new THREE.Vector3(0, 0, 0));
      }

      // Action logic
      const distToBall = ballPos.distanceTo(this.body.position);
      if (distToBall < 2.5) {
        if (ballPos.y > 3 && ballPos.y < 5) {
          this.jump();
        }
      }
    } else {
      // Net logic: Block if player is jumping near net
      if (playerPos.z < 3 && player.getIsJumping()) {
        this.targetPos.set(playerPos.x, 0, -0.5);
        const moveDir = new THREE.Vector3().subVectors(this.targetPos, new THREE.Vector3(this.body.position.x, 0, this.body.position.z));
        if (moveDir.length() > 0.5) {
          moveDir.normalize();
          this.move(moveDir);
        } else {
          this.block();
        }
      } else {
        // Return to base position
        this.targetPos.set(0, 0, -SETTINGS.courtLength / 4);
        const moveDir = new THREE.Vector3().subVectors(this.targetPos, new THREE.Vector3(this.body.position.x, 0, this.body.position.z));
        if (moveDir.length() > 0.5) {
          moveDir.normalize();
          this.move(moveDir);
        } else {
          this.move(new THREE.Vector3(0, 0, 0));
        }
      }
    }
  }

  // Override move to use BOT_SPEED
  move(dir: THREE.Vector3) {
    if (this.getIsBlocking()) {
      this.body.velocity.x = 0;
      this.body.velocity.z = 0;
      return;
    }
    
    const velocity = new CANNON.Vec3(dir.x * BOT_SPEED, this.body.velocity.y, dir.z * BOT_SPEED);
    this.body.velocity.x = velocity.x;
    this.body.velocity.z = velocity.z;

    if (dir.length() > 0.1) {
      const angle = Math.atan2(dir.x, dir.z);
      this.mesh.rotation.y = angle;
    }
  }
}
