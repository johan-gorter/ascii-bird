export interface InitEvent             { type: 'init'; }

export interface PrepareSegmentEvent   {
  type: 'prepareSegment';
  segmentStartX: number;
  segmentEndX: number;
  builder: SegmentBuilder;
}

export interface CollisionDetectedEvent{ type: 'collisionDetected'; }

export interface GameOverEvent         { type: 'gameOver'; }

export interface PausedEvent           { type: 'paused'; }

export interface UnpausedEvent         { type: 'unpaused'; }

export interface ScoreChangedEvent     { type: 'scoreChanged'; score: number; }

export interface ResetEvent            { type: 'reset'; }

/** Union of every event your module can observe / emit. */
export type GameEvent =
  | InitEvent
  | PrepareSegmentEvent
  | CollisionDetectedEvent
  | GameOverEvent
  | PausedEvent
  | UnpausedEvent
  | ScoreChangedEvent
  | ResetEvent;

/**
 * Event bus that allows modules to communicate with each other.
 */
export const bus: {
  on<E extends GameEvent>(
    type: E['type'],
    handler: (evt: E) => void
  ): () => void;

  off<E extends GameEvent>(
    type: E['type'],
    handler: (evt: E) => void
  ): void;

  emit<E extends GameEvent>(evt: E): void;
};

/* -------------------------------------------------------------
   3.  Game‑objects registry
----------------------------------------------------------------*/
export interface GameObject {
  /**
   * Just for debugging.
   */
  name: string;
  gameTick?(dt: number): void;
  draw?(ctx: CanvasRenderingContext2D, viewportX: number): void;
  autoRemoveAt?: number;
}

/**
 * All objects that currently interact in the game, exposing just a subset of the underlying Set.
 */
export interface GameObjectSet extends Iterable<GameObject> {
  add(obj: GameObject): void;
  delete(obj: GameObject): void;
  [Symbol.iterator](): IterableIterator<GameObject>;
}

export const gameObjects: GameObjectSet;

export interface BirdState {
  x: number;
  y: number;
  vy: number;
  hitMap: boolean[][];
}

export interface GameState {
  viewportX: number;
  score: number;
  flyButtonPressed: boolean;
  paused: boolean;
  gameOver: boolean;
  bird: BirdState;
}

export const gameState: GameState;

export const VIEWPORT_WIDTH  = 800;
export const VIEWPORT_HEIGHT = 450;
export const WORLD_HEIGHT; // = VIEWPORT_HEIGHT;

/**
 * Memory‑efficient bitmap used during collision detection.
 * The underlying buffer is a flat, row‑major Uint8Array where
 * 1 means “solid” and 0 means “empty”.
 */
export interface HitMap {
  readonly width: number;
  readonly height: number;
  /** Row‑major buffer of length `width * height`. */
  readonly data: Uint8Array;
}

export interface Helpers {
  charToCanvas(char: string, sizePx: number): HTMLCanvasElement;
  canvasToHitMap(canvas: HTMLCanvasElement): boolean[][];
  detectCollision(
    a: { x: number; y: number; hitMap: HitMap },
    b: { x: number; y: number; hitMap: HitMap }
  ): boolean;
}

export const helpers: Helpers;

export interface RNG {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export interface SegmentBuilder {
  rng: RNG;
  reserveSpace(x: number, y: number, w: number, h: number): boolean;
}

export const TICK_HZ = 200;
export const TICK_DT_MS;