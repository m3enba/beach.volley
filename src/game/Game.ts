import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PhysicsWorld } from './PhysicsWorld';
import { Ball } from './entities/Ball';
import { Player } from './entities/Player';
import { Bot } from './entities/Bot';
import { Court } from './entities/Court';
import { GameState, Team, SETTINGS } from '../types';

// Constant Physics Impulses
const SERVE_IMPULSE = new CANNON.Vec3(0, 10, -18);
const SPIKE_IMPULSE = new CANNON.Vec3(0, -8, -25);
const BUMP_IMPULSE = new CANNON.Vec3(0, 12, -8);
const SET_IMPULSE = new CANNON.Vec3(0, 15, -2);

const BOT_SERVE_IMPULSE = new CANNON.Vec3(0, 10, 18);
const BOT_SPIKE_IMPULSE = new CANNON.Vec3(0, -8, 25);
const BOT_BUMP_IMPULSE = new CANNON.Vec3(0, 12, 8);

export class Game {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private physics: PhysicsWorld;
  
  private ball!: Ball;
  private player!: Player;
  private bot!: Bot;
  private court!: Court;

  private gameState: GameState = GameState.WAITING_FOR_SERVE;
  private servingTeam: Team = Team.PLAYER;
  private lastTouch: Team | null = null;
  private score = { player: 0, bot: 0 };
  private onScoreUpdate: (score: { player: number, bot: number }) => void;
  private onGameOver: (winner: Team) => void;

  private keys: { [key: string]: boolean } = {};
  private mouseClicked = false;

  constructor(
    container: HTMLElement, 
    onScoreUpdate: (score: { player: number, bot: number }) => void,
    onGameOver: (winner: Team) => void
  ) {
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;

    // Three.js Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    this.scene.add(sunLight);

    // Physics Setup
    this.physics = new PhysicsWorld();

    // Entities
    this.initEntities();

    // Controls
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    window.addEventListener('mousedown', () => this.mouseClicked = true);
    window.addEventListener('mouseup', () => this.mouseClicked = false);
    window.addEventListener('resize', () => this.onResize());

    this.resetBall();
    this.animate();
  }

  private initEntities() {
    this.court = new Court(this.scene, this.physics.world, this.physics.groundMaterial);
    this.ball = new Ball(this.scene, this.physics.world, this.physics.ballMaterial);
    this.player = new Player(this.scene, this.physics.world, this.physics.playerMaterial, Team.PLAYER, 0x4444ff);
    this.bot = new Bot(this.scene, this.physics.world, this.physics.playerMaterial);

    // Collision detection for scoring
    this.ball.body.addEventListener('collide', (e: any) => {
      if (this.gameState !== GameState.PLAYING) return;
      
      const target = e.body;
      const ground = this.physics.world.bodies.find(b => b.shapes[0] instanceof CANNON.Plane);

      if (target === ground) {
        // Ball hit ground
        const z = this.ball.body.position.z;
        const x = this.ball.body.position.x;
        
        const isOut = Math.abs(x) > SETTINGS.courtWidth / 2 || Math.abs(z) > SETTINGS.courtLength / 2;
        
        if (isOut) {
          // Out of bounds: Team that touched it last loses point
          if (this.lastTouch === Team.PLAYER) this.scorePoint(Team.BOT);
          else this.scorePoint(Team.PLAYER);
        } else {
          // In bounds: Team on whose side it landed loses point
          // Player side is z > 0, Bot side is z < 0
          if (z > 0) this.scorePoint(Team.BOT);
          else this.scorePoint(Team.PLAYER);
        }
      }
    });
  }

  private scorePoint(winner: Team) {
    if (winner === Team.PLAYER) this.score.player++;
    else this.score.bot++;
    
    this.onScoreUpdate(this.score);
    this.gameState = GameState.SCORING;
    this.servingTeam = winner;

    if (this.score.player >= 10 || this.score.bot >= 10) {
      this.onGameOver(this.score.player >= 10 ? Team.PLAYER : Team.BOT);
      this.gameState = GameState.GAME_OVER;
      return;
    }
    
    setTimeout(() => {
      this.resetBall();
    }, 2000);
  }

  private resetBall() {
    this.gameState = GameState.WAITING_FOR_SERVE;
    this.lastTouch = null;
    const serveZ = SETTINGS.courtLength / 2;
    
    if (this.servingTeam === Team.PLAYER) {
      this.player.body.position.set(0, SETTINGS.playerHeight / 2, serveZ);
      this.player.body.velocity.set(0, 0, 0);
      this.player.mesh.rotation.y = Math.PI;
      this.bot.body.position.set(0, SETTINGS.playerHeight / 2, -SETTINGS.courtLength / 4);
      this.ball.reset(0, 2, serveZ - 0.5);
    } else {
      this.bot.body.position.set(0, SETTINGS.playerHeight / 2, -serveZ);
      this.bot.body.velocity.set(0, 0, 0);
      this.bot.mesh.rotation.y = 0;
      this.player.body.position.set(0, SETTINGS.playerHeight / 2, SETTINGS.courtLength / 4);
      this.ball.reset(0, 2, -serveZ + 0.5);
      
      setTimeout(() => {
        if (this.gameState === GameState.WAITING_FOR_SERVE && this.servingTeam === Team.BOT) {
          this.ball.body.velocity.copy(BOT_SERVE_IMPULSE);
          this.gameState = GameState.PLAYING;
          this.lastTouch = Team.BOT;
          this.bot.registerHit();
        }
      }, 1500);
    }
  }

  private handlePlayerInput(dt: number) {
    if (this.gameState === GameState.GAME_OVER) return;

    const moveDir = new THREE.Vector3();
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.x += 1;

    if (moveDir.length() > 0) moveDir.normalize();
    this.player.move(moveDir);

    if (this.keys['Space']) this.player.jump();
    if (this.keys['KeyQ']) this.player.block();

    if (this.mouseClicked) {
      this.mouseClicked = false;
      this.performAction();
    }

    if (this.keys['KeyE']) {
      this.performSet();
    }
  }

  private performAction() {
    if (this.gameState === GameState.WAITING_FOR_SERVE && this.servingTeam === Team.PLAYER) {
      this.ball.body.velocity.copy(SERVE_IMPULSE);
      this.gameState = GameState.PLAYING;
      this.player.registerHit();
      this.lastTouch = Team.PLAYER;
      return;
    }

    if (this.gameState !== GameState.PLAYING) return;

    const dist = this.ball.body.position.distanceTo(this.player.body.position);
    if (dist < 2.5 && this.player.canHitBall()) {
      if (this.player.getIsJumping()) {
        this.ball.body.velocity.copy(SPIKE_IMPULSE);
      } else {
        this.ball.body.velocity.copy(BUMP_IMPULSE);
      }
      this.player.registerHit();
      this.lastTouch = Team.PLAYER;
    }
  }

  private performSet() {
    if (this.gameState !== GameState.PLAYING) return;
    const dist = this.ball.body.position.distanceTo(this.player.body.position);
    if (dist < 2.5 && this.player.canHitBall()) {
      this.ball.body.velocity.copy(SET_IMPULSE);
      this.player.registerHit();
      this.lastTouch = Team.PLAYER;
    }
  }

  private updateCamera() {
    const targetPos = this.player.mesh.position.clone();
    const cameraOffset = new THREE.Vector3(0, 6, 10);
    this.camera.position.lerp(targetPos.add(cameraOffset), 0.1);
    this.camera.lookAt(0, 1, -5);
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());

    const dt = 1 / 60;
    this.physics.update(dt);
    
    this.handlePlayerInput(dt);
    this.bot.updateAI(dt, this.ball, this.player);
    
    this.player.update(dt);
    this.bot.update(dt);

    if (this.gameState === GameState.WAITING_FOR_SERVE) {
      if (this.servingTeam === Team.PLAYER) {
        const handPos = this.player.getHandPosition();
        this.ball.body.position.set(handPos.x, handPos.y, handPos.z);
        this.ball.body.velocity.set(0, 0, 0);
      } else {
        this.ball.body.position.set(this.bot.body.position.x, this.bot.body.position.y + 0.5, this.bot.body.position.z + 0.5);
        this.ball.body.velocity.set(0, 0, 0);
      }
    }

    this.ball.update();
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);

    // Bot ball interaction
    const botDist = this.ball.body.position.distanceTo(this.bot.body.position);
    if (botDist < 2.5 && this.ball.body.position.z < 0 && this.bot.canHitBall()) {
      if (this.ball.body.position.y > 3.5) {
        this.ball.body.velocity.copy(BOT_SPIKE_IMPULSE);
      } else {
        this.ball.body.velocity.copy(BOT_BUMP_IMPULSE);
      }
      this.bot.registerHit();
      this.lastTouch = Team.BOT;
    }

    // Net check: if ball hits net and falls on same side
    const netZ = 0;
    if (Math.abs(this.ball.body.position.z) < 0.2 && this.ball.body.position.y < SETTINGS.netHeight) {
       // Ball hit net
       // We let physics handle the bounce, but we check if it falls on the same side
    }
  }
}
