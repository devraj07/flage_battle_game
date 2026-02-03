export type GamePhase = 'LOBBY' | 'PLAYING' | 'GAME_OVER';

export interface Player {
  id: string;
  name: string;
  code: string; // ISO 2-letter code
  color: string;
  image?: HTMLImageElement;
}

export interface GameConfig {
  arenaRadius: number;
}

// Canvas Entity Types
export interface FlagEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  rotation: number;
  rotationSpeed: number;
  player: Player;
  isDead: boolean;
  scale: number; // For pop-in animation
  hp: number;
  maxHp: number;
  lastHitTime: number; // To prevent double-hits in same frame
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}