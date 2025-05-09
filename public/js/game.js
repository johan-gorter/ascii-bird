/**
 * @typedef {import('./game.d.ts').GameEvent} GameEvent
 * @typedef {import('./game.d.ts').GameObject} GameObject
 * @typedef {import('./game.d.ts').HitMap} HitMap
 * @typedef {import('./game.d.ts').BirdState} BirdState
 * @typedef {import('./game.d.ts').GameState} GameState
 * @typedef {import('./game.d.ts').Helpers} Helpers
 * @typedef {import('./game.d.ts').RNG} RNG
 * @typedef {import('./game.d.ts').SegmentBuilder} SegmentBuilder
 */

// --- Event Bus ---
/** @type {Map<string, Set<(evt: GameEvent) => void>>} */
const listeners = new Map();

export const bus = {
  /**
   * @template {GameEvent} E
   * @param {E['type']} type
   * @param {(evt: E) => void} handler
   */
  on(type, handler) {
    if (!listeners.has(type)) {
      listeners.set(type, new Set());
    }
    listeners.get(type).add(handler);
  },

  /**
   * @template {GameEvent} E
   * @param {E} evt
   */
  emit(evt) {
    listeners.get(evt.type)?.forEach((handler) => handler(evt));
  },
};

// --- Game Objects ---
/** @type {Set<GameObject>} */
const _gameObjects = new Set();

export const gameObjects = {
  /** @param {GameObject} obj */
  add(obj) {
    _gameObjects.add(obj);
  },
  /** @param {GameObject} obj */
  delete(obj) {
    _gameObjects.delete(obj);
  },
  [Symbol.iterator]() {
    return _gameObjects[Symbol.iterator]();
  },
};

/** @type {GameState} */
export const gameState = {
  viewportX: 0,
  score: 0,
  flyButtonPressed: false,
  paused: false,
  gameOver: false,
  bird: undefined,
};

// --- Constants ---
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 450;
export const WORLD_HEIGHT = VIEWPORT_HEIGHT;
export const TICK_HZ = 200;
export const TICK_DT_MS = 1000 / TICK_HZ;

// --- Helpers ---

/**
 * Creates a canvas with the character drawn on it.
 * @param {string} char The character (emoji) to draw.
 * @param {number} sizePx The desired size (width and height) in pixels.
 * @returns {HTMLCanvasElement}
 */
function charToCanvas(char, sizePx) {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx;
  canvas.height = sizePx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  ctx.font = `${sizePx}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, sizePx / 2, sizePx / 2);
  return canvas;
}

/**
 * Converts a canvas to a HitMap for collision detection.
 * @param {HTMLCanvasElement} canvas
 * @returns {HitMap}
 */
function canvasToHitMap(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2D context");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < imageData.data.length; i += 4) {
    // Check alpha channel (index 3)
    data[i / 4] = imageData.data[i + 3] > 128 ? 1 : 0;
  }
  return {
    width: canvas.width,
    height: canvas.height,
    data: data,
  };
}

/**
 * Basic AABB collision detection, followed by precise pixel-perfect detection.
 * @param {{ x: number; y: number; hitMap: HitMap }} a
 * @param {{ x: number; y: number; hitMap: HitMap }} b
 * @returns {boolean}
 */
function detectCollision(a, b) {
  // Check for overlap in x-axis
  const xOverlap = a.x < b.x + b.hitMap.width && a.x + a.hitMap.width > b.x;
  // Check for overlap in y-axis
  const yOverlap = a.y < b.y + b.hitMap.height && a.y + a.hitMap.height > b.y;

  if (!(xOverlap && yOverlap)) {
    return false; // No bounding box overlap, no collision
  }

  // Bounding boxes overlap, now check pixel-perfect collision
  const startX = Math.max(a.x, b.x);
  const endX = Math.min(a.x + a.hitMap.width, b.x + b.hitMap.width);
  const startY = Math.max(a.y, b.y);
  const endY = Math.min(a.y + a.hitMap.height, b.y + b.hitMap.height);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      // Calculate indices in the respective hitmap data arrays
      const indexA = (y - a.y) * a.hitMap.width + (x - a.x);
      const indexB = (y - b.y) * b.hitMap.width + (x - b.x);

      // Check if both pixels are 'solid' (non-transparent)
      if (a.hitMap.data[indexA] === 1 && b.hitMap.data[indexB] === 1) {
        return true; // Collision detected
      }
    }
  }

  return false; // No overlapping solid pixels found
}

/** @type {Helpers} */
export const helpers = {
  charToCanvas,
  canvasToHitMap,
  detectCollision,
};

const VIEWPORT_SPEED_PIXELS_PER_SECOND = 100; // Pixels the viewport scrolls per second
const SEGMENT_WIDTH = VIEWPORT_WIDTH; // How much of the world to generate at once

// --- Game Engine State ---
/** @type {number | null} */
let gameLoopIntervalId = null;
/** @type {number | null} */
let animationFrameId = null;
/** @type {HTMLCanvasElement | null} */
let canvas = null;
/** @type {CanvasRenderingContext2D | null} */
let ctx = null;
let worldGeneratedUpToX = 0;

/** Simple Pseudo-Random Number Generator */
class SimpleRNG {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }
  nextInt(min, max) {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    const rnd = this.seed / 233280;
    return Math.floor(min + rnd * (max - min + 1));
  }
}

/** Basic Segment Builder */
class BasicSegmentBuilder {
  /** @param {number} segmentStartX */
  constructor(segmentStartX) {
    this.rng = new SimpleRNG(segmentStartX); // Seed RNG with segment start for determinism
    /** @type {{x: number, y: number, width: number, height: number}[]} */
    this.reserved = [];
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {boolean}
   */
  reserveSpace(x, y, width, height) {
    const newRect = { x, y, width, height };
    // Check for overlap with already reserved spaces
    for (const existing of this.reserved) {
      const xOverlap =
        newRect.x < existing.x + existing.width &&
        newRect.x + newRect.width > existing.x;
      const yOverlap =
        newRect.y < existing.y + existing.height &&
        newRect.y + newRect.height > existing.y;
      if (xOverlap && yOverlap) {
        return false; // Overlap detected, cannot reserve
      }
    }
    this.reserved.push(newRect);
    return true;
  }
}

function gameTickLoop() {
  if (gameState.paused || gameState.gameOver) {
    return;
  }

  // Update viewport position
  const viewportDeltaX = (VIEWPORT_SPEED_PIXELS_PER_SECOND / 1000) * TICK_DT_MS;
  gameState.viewportX += viewportDeltaX;

  // Emit gameTick to all objects
  for (const obj of gameObjects) {
    obj.gameTick?.(TICK_DT_MS);
  }

  // Auto-remove objects that are off-screen
  for (const obj of gameObjects) {
    if (
      obj.autoRemoveAt !== undefined &&
      obj.autoRemoveAt < gameState.viewportX
    ) {
      gameObjects.delete(obj);
    }
  }

  // Generate new world segments if needed
  const viewportEndX = gameState.viewportX + VIEWPORT_WIDTH;
  if (viewportEndX > worldGeneratedUpToX - SEGMENT_WIDTH) {
    // Start generating next segment when viewport is one segment away from the end
    const segmentStartX = worldGeneratedUpToX;
    const segmentEndX = segmentStartX + SEGMENT_WIDTH;
    const builder = new BasicSegmentBuilder(segmentStartX);

    bus.emit({
      type: "prepareSegment",
      segmentStartX,
      segmentEndX,
      builder,
    });
    worldGeneratedUpToX = segmentEndX;
  }
}

function drawLoop() {
  if (!ctx || !canvas) return; // Should not happen if initialized

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background elements
  bus.emit({ type: "drawBackground", ctx, viewportX: gameState.viewportX });

  // Draw game objects
  for (const obj of gameObjects) {
    obj.draw?.(ctx, gameState.viewportX);
  }

  // Draw static UI elements (like score, buttons)
  bus.emit({ type: "drawStaticUI", ctx });

  // Request next frame
  animationFrameId = requestAnimationFrame(drawLoop);
}

/**
 * Initializes the game engine and starts the loops.
 * @param {HTMLCanvasElement} canvasElement
 */
export function initGame(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D rendering context");
  }
  canvas.width = VIEWPORT_WIDTH;
  canvas.height = VIEWPORT_HEIGHT;

  // Reset state before starting
  resetGame();
  gameState.paused = false; // Unpause after init

  // Start loops
  if (gameLoopIntervalId === null) {
    gameLoopIntervalId = setInterval(gameTickLoop, TICK_DT_MS);
  }
  if (animationFrameId === null) {
    animationFrameId = requestAnimationFrame(drawLoop);
  }

  console.log("Game initialized and loops started.");
}

export function pauseGame() {
  if (!gameState.paused) {
    gameState.paused = true;
    bus.emit({ type: "paused" });
    console.log("Game paused.");
  }
}

export function resumeGame() {
  if (gameState.paused && !gameState.gameOver) {
    gameState.paused = false;
    bus.emit({ type: "unpaused" });
    console.log("Game resumed.");
  }
}

export function resetGame() {
  console.log("Resetting game...");
  // Clear existing objects
  for (const obj of gameObjects) {
    gameObjects.delete(obj);
  }

  // Reset game state
  gameState.viewportX = 0;
  gameState.score = 0;
  gameState.flyButtonPressed = false;
  gameState.paused = true; // Start paused until explicitly resumed or started
  gameState.gameOver = false;
  // Bird state reset should be handled by the bird module listening to 'reset'

  worldGeneratedUpToX = 0; // Reset world generation

  // Emit reset event for modules to clean up and re-initialize
  bus.emit({ type: "reset" });

  // Ensure initial segment is generated immediately on next tick after resume
  const builder = new BasicSegmentBuilder(0);
  bus.emit({
    type: "prepareSegment",
    segmentStartX: 0,
    segmentEndX: SEGMENT_WIDTH,
    builder,
  });
  worldGeneratedUpToX = SEGMENT_WIDTH;

  console.log("Game reset complete.");
}

// Stop loops when game is over
bus.on("gameOver", () => {
  gameState.gameOver = true;
  gameState.paused = true; // Also pause on game over
  console.log("Game Over detected, stopping loops.");
  // Note: Loops aren't actually stopped here, but gameTickLoop won't run logic.
  // Consider explicitly clearing intervals/frames if needed, e.g., in resetGame or a dedicated stopGame function.
});
