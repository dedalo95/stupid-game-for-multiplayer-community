export interface Comment {
  x: number;
  y: number;
  text: string;
  speed: number;
  sliced: boolean;
  isGolden?: boolean;
}

export interface Round {
  number: number;
  commentsCount: number;
  speed: number;
  interval: number;
}

export interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  text: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export interface PowerUp {
  x: number;
  y: number;
  speed: number;
  sliced: boolean;
  scale: number;
  rotation: number;
}