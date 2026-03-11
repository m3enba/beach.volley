import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export enum GameState {
  WAITING_FOR_SERVE = 'WAITING_FOR_SERVE',
  PLAYING = 'PLAYING',
  SCORING = 'SCORING',
  GAME_OVER = 'GAME_OVER'
}

export enum Team {
  PLAYER = 'PLAYER',
  BOT = 'BOT'
}

export interface GameSettings {
  courtWidth: number;
  courtLength: number;
  netHeight: number;
  ballRadius: number;
  playerRadius: number;
  playerHeight: number;
}

export const SETTINGS: GameSettings = {
  courtWidth: 9,
  courtLength: 18,
  netHeight: 2.43,
  ballRadius: 0.25,
  playerRadius: 0.4,
  playerHeight: 2.0
};
