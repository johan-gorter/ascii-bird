/**
 * Allows modules to setup and load game assets.
 */
export interface InitEvent {
  type: "init";
  waitFor(promise: Promise<void>): void;
}

/**
 * Emitted when a new part of the game world needs to be created.
 */
export interface PrepareSegmentEvent {
  type: "prepareSegment";
  segmentStartX: number;
  segmentEndX: number;
  builder: SegmentBuilder;
}

/**
 * Emitted when the bird collided with an obstacle. Should be picked up by a gameplay module to subtract a life or emit game over.
 */
export interface CollisionDetectedEvent {
  type: "collisionDetected";
  collisionObject: GameObject;
}

/**
 * Emitted when the user interacts with the game. This can be a touch, a mouse click or a key press.
 */
export interface InputChangedEvent {
  type: "inputChanged";
  /** Returns the default Gamepad if connected */
  gamepad: Gamepad | null;
  /** Lists the keys on the keyboard being pressed. Uses `KeyboardEvent.code` */
  keysDown: Set<string>;
  /** Lists the touches on the area specified. Touches can be a finger or a mouse whith button1 pressed **/
  getTouchesInArea(x: number, y: number, width: number, height: number): {x: number, y: number}[];
}

export interface GameOverEvent {
  type: "gameOver";
}

export interface PausedEvent {
  type: "paused";
}

export interface UnpausedEvent {
  type: "unpaused";
}

export interface ScoreChangedEvent {
  type: "scoreChanged";
  score: number;
}

export interface ResetEvent {
  type: "reset";
}

/**
 * Is drawn every frame, before the game objects are drawn.
 */
export interface DrawBackgroundEvent {
  type: "drawBackground";
  ctx: CanvasRenderingContext2D;
  viewportX: number;
}

/**
 * Is drawn every frame, after the game objects are drawn, can be used to print static UI elements like buttons and scores.
 */
export interface DrawStaticUIEvent {
  type: "drawStaticUI";
  ctx: CanvasRenderingContext2D;
}

/** Union of every event your module can observe / emit. */
export type GameEvent =
  | InitEvent
  | PrepareSegmentEvent
  | CollisionDetectedEvent
  | InputChangedEvent
  | GameOverEvent
  | PausedEvent
  | UnpausedEvent
  | ScoreChangedEvent
  | ResetEvent
  | DrawBackgroundEvent
  | DrawStaticUIEvent;

/**
 * Event bus that allows modules to communicate with each other.
 */
export const bus: {
  on<T extends GameEvent['type']>(
    type: T,
    handler: (evt: Extract<GameEvent, { type: T }>) => void
  ): () => void;

  on<E extends GameEvent>(
    type: E["type"],
    handler: (evt: E) => void
  ): () => void;

  off<E extends GameEvent>(type: E["type"], handler: (evt: E) => void): void;

  emit<E extends GameEvent>(evt: E): void;
};


/**
 * Game object that can be added to the game world.
 * It can be a bird, a pipe, or any other object.
 */
export interface GameObject {
  /**
   * String value for identification and game logic.
   */
  type: string;

  /**
   * Signals that the game has progressed. Can be used to apply physics, detect collisions and update game state.
   * @param dt Delta time in milliseconds since the last tick.
   */
  gameTick?(dt: number): void;

  /**
   * Draws the game object on the canvas.
   * @param viewportX The x position of the viewport.
   */
  draw?(ctx: CanvasRenderingContext2D, viewportX: number): void;

  /**
   * The `autoRemoveAt` property indicates the viewportX at which the object should be automatically removed from the game.
   */
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
  /** x position in the game coordinate system */
  x: number;
  y: number;
  vy: number;
  hitMap: HitMap;
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

export const VIEWPORT_WIDTH = 800;
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
  canvasToHitMap(canvas: HTMLCanvasElement): HitMap;
  detectCollision(
    a: { x: number; y: number; hitMap: HitMap },
    b: { x: number; y: number; hitMap: HitMap }
  ): boolean;
}

export const helpers: Helpers;

/**
 * Produces a deterministic pseudo‑random number in the range [minInclusive, maxInclusive].
 */
export interface RNG {
  nextInt(minInclusive: number, maxInclusive: number): number;
}

export interface SegmentBuilder {
  rng: RNG;
  reserveSpace(x: number, y: number, width: number, height: number): boolean;
}

export const TICK_HZ = 200;
export const TICK_DT_MS;
