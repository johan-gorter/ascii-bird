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
  state: "playing",
  bird: undefined,
};

// --- Constants ---
export const VIEWPORT_WIDTH = 800;
export const VIEWPORT_HEIGHT = 450;
export const WORLD_HEIGHT = VIEWPORT_HEIGHT;
export const TICK_HZ = 200;
export const TICK_DT_MS = 1000 / TICK_HZ;

/**
 * Checks if a font is loaded and ready.
 * @param {string} font The font string (e.g., "20px 'Press Start 2P'").
 * @param {Document} documentRef Reference to the document object.
 * @returns {Promise<void>} A promise that resolves when the font is loaded.
 */
function ensureFontLoaded(font, documentRef) {
  return new Promise((resolve, reject) => {
    function check() {
      if (documentRef.fonts.check(font)) {
        resolve();
      } else {
        // Font not ready yet, try again on the next frame
        requestAnimationFrame(check);
      }
    }
    // Start the check
    requestAnimationFrame(check);
  });
}

// --- Helpers ---

/**
 * Creates a canvas with the character drawn on it.
 * @param {string} char The character (emoji) to draw.
 * @param {number} sizePx The desired size (width and height) in pixels.
 * @returns {HTMLCanvasElement}
 */
function charToCanvas(char, sizePx) {
  const canvas = document.createElement("canvas");
  canvas.width = sizePx + 4;
  canvas.height = sizePx + 4;
  const ctx = canvas.getContext("2d", {
    alpha: true,
    willReadFrequently: false, // We rarely read from these canvases
    desynchronized: true // Allow async operations
  });
  if (!ctx) throw new Error("Could not get 2D context");
  
  // Force Firefox to use GPU acceleration by triggering compositing
  ctx.globalCompositeOperation = 'source-over';
  
  ctx.font = `${sizePx}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, sizePx / 2 + 2, sizePx / 2 + 2);
  
  // Force a composite operation to ensure GPU path
  ctx.globalCompositeOperation = 'source-over';
  
  return canvas;
}

/**
 * Converts a canvas to a HitMap for collision detection.
 * @param {HTMLCanvasElement} canvas
 * @returns {HitMap}
 */
function canvasToHitMap(canvas) {
  const ctx = canvas.getContext("2d", { 
    willReadFrequently: true,
    alpha: false, // Optimization hint for Firefox
    desynchronized: true // Allow async rendering
  });
  if (!ctx) throw new Error("Could not get 2D context");
  
  // Force a sync to ensure canvas is ready
  ctx.getImageData(0, 0, 1, 1);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = new Uint8Array(canvas.width * canvas.height);
  
  // Cache array length to avoid repeated property access
  const pixelData = imageData.data;
  const length = pixelData.length;
  
  // Optimized loop for Firefox with batched processing
  for (let i = 0, j = 0; i < length; i += 4, j++) {
    // Check alpha channel (index 3) - unrolled for better performance
    data[j] = pixelData[i + 3] > 128 ? 1 : 0;
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

  // Cache frequently accessed properties
  const aData = a.hitMap.data;
  const bData = b.hitMap.data;
  const aWidth = a.hitMap.width;
  const bWidth = b.hitMap.width;
  const aX = a.x;
  const aY = a.y;
  const bX = b.x;
  const bY = b.y;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      // Calculate indices in the respective hitmap data arrays
      const indexA = (y - aY) * aWidth + (x - aX);
      const indexB = (y - bY) * bWidth + (x - bX);

      // Check if both pixels are 'solid' (non-transparent)
      if (aData[indexA] === 1 && bData[indexB] === 1) {
        return true; // Collision detected - early exit
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

const SEGMENT_WIDTH = 3000; // How much of the world to generate at once

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

// Cache frequently used objects to reduce GC pressure
const cachedEvents = {
  drawBackground: { type: "drawBackground", ctx: null, viewportX: 0 },
  drawStaticUI: { type: "drawStaticUI", ctx: null }
};

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

/**
 * gameTicks are only called when the game is not paused.
 * This means the world stops when the game is paused.
 */
function gameTick() {
  // Generate new world segments if needed
  const viewportEndX = gameState.viewportX + VIEWPORT_WIDTH;
  if (viewportEndX > worldGeneratedUpToX - 100) {
    // Start generating next segment when viewport is one 100px away from the end
    const segmentStartX = worldGeneratedUpToX;
    const segmentEndX = segmentStartX + SEGMENT_WIDTH;
    console.log(
      `Generating new segment from ${segmentStartX} to ${segmentEndX}, viewportX: ${gameState.viewportX}`
    );
    const builder = new BasicSegmentBuilder(segmentStartX);

    bus.emit({
      type: "prepareSegment",
      segmentStartX,
      segmentEndX,
      builder,
    });
    worldGeneratedUpToX = segmentEndX;
  }

  // Emit gameTick to all objects
  for (const obj of gameObjects) {
    obj.gameTick?.(TICK_DT_MS);
  }

  // Auto-remove objects that are now off-screen
  for (const obj of gameObjects) {
    if (
      obj.autoRemoveAt !== undefined &&
      obj.autoRemoveAt < gameState.viewportX
    ) {
      gameObjects.delete(obj);
    }
  }
}

/**
 * The loop that keeps updating the canvas every animation frame.
 * This never stops. Throttling is assumed to be done by the browser.
 */
function drawLoop() {
  if (!ctx || !canvas) return; // Should not happen if initialized

  // Firefox optimization: Batch canvas operations
  ctx.save();
  
  // Clear canvas with fillRect instead of clearRect for better Firefox performance
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#87CEEB'; // Sky blue background
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background elements using cached event object
  cachedEvents.drawBackground.ctx = ctx;
  cachedEvents.drawBackground.viewportX = gameState.viewportX;
  bus.emit(cachedEvents.drawBackground);

  // Draw game objects
  for (const obj of gameObjects) {
    obj.draw?.(ctx, gameState.viewportX);
  }

  // Draw static UI elements using cached event object
  cachedEvents.drawStaticUI.ctx = ctx;
  bus.emit(cachedEvents.drawStaticUI);

  ctx.restore();

  // Request next frame
  animationFrameId = requestAnimationFrame(drawLoop);
}

/**
 * Initializes the game engine and starts the loops.
 * @param {HTMLCanvasElement} canvasElement
 * @param {Window} window
 */
export async function initGame(canvasElement, window) {
  canvas = canvasElement;
  ctx = canvas.getContext("2d", {
    alpha: false, // Disable alpha channel for better performance
    desynchronized: true, // Allow desynchronized rendering for smoother performance
    willReadFrequently: false // We don't read from main canvas frequently
  });
  if (!ctx) {
    throw new Error("Could not get 2D rendering context");
  }
  canvas.width = VIEWPORT_WIDTH;
  canvas.height = VIEWPORT_HEIGHT;

  // Firefox-specific optimizations
  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for pixel art
  }
  
  // Force Firefox to use GPU acceleration
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 1, 1);

  // Ensure required fonts are loaded before proceeding
  try {
    // Assuming 'Press Start 2P' is a common font, adjust if more are needed or specific sizes.
    // The size here is just for the check, modules should specify their own sizes when using the font.
    await ensureFontLoaded("10px 'Press Start 2P'", window.document);
    console.log("'Press Start 2P' font loaded.");
  } catch (error) {
    console.error("Error ensuring font loaded:", error);
    // continue anyway
  }

  // Emit init event and allow modules to perform async setup
  const initPromises = [];
  bus.emit({
    type: "init",
    waitFor: (promise) => {
      initPromises.push(promise);
    },
  });

  await Promise.all(initPromises)
    .then(() => {
      console.log("All init promises resolved.");
      gameTick(); // The first tick should generate the first segment
      gameLoopIntervalId = setInterval(gameTick, TICK_DT_MS);
    })
    .catch((error) => {
      console.error("Error during init:", error);
      alert("Initialization error: " + error.message);
    });

  animationFrameId = requestAnimationFrame(drawLoop);

  console.log("Game initialized and loops started.");

  bus.on("stateChanged", (evt) => {
    if (
      (gameState.state === "playing" || gameState.state === "demoing") &&
      gameLoopIntervalId === null
    ) {
      // Start the game loop if it's not already running
      gameLoopIntervalId = setInterval(gameTick, TICK_DT_MS);
      console.log("Game loop started due to state change.");
    } else if (
      !(gameState.state === "playing" || gameState.state === "demoing") &&
      gameLoopIntervalId !== null
    ) {
      // Stop the game loop if it's running and state is not playing/demoing
      clearInterval(gameLoopIntervalId);
      gameLoopIntervalId = null;
      console.log("Game loop stopped due to state change.");
    }
  });

  bus.on("reset", () => {
    // Reset game state and world
    gameState.viewportX = 0;
    gameState.flyButtonPressed = false;
    gameState.state = "playing";
    // Clear all game objects
    for (const obj of Array.from(gameObjects)) {
      if (obj.type !== "bird") {
        // Only remove objects that are not the bird
        gameObjects.delete(obj);
      }
    }
    // Reset world generation
    worldGeneratedUpToX = 0;
    // Generate the first segment again
    gameTick();
    // Notify modules that state changed (and starts the gameloop again)
    bus.emit({ type: "stateChanged" });
  });

  setupInputHandling(canvas, window); // Note: also fires first inputChanged event

  window.dev = {bus, gameState}; // For debugging purposes
}

/**
 * Setup input handling for the game.
 * @param {HTMLCanvasElement} canvas
 * @param {Window} window
 */
function setupInputHandling(canvas, window) {
  // --- Input Handling Setup ---
  const keysDown = new Set(); // Stores KeyboardEvent.code for pressed keys
  const currentTouches = new Map(); // identifier -> {x, y}, stores active finger and mouse touches

  // Helper to get canvas-relative coordinates for mouse events
  function getMousePosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  // Helper to get canvas-relative coordinates for touch events
  function getTouchPosition(touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function emitInputChanged() {
    const gamepad = navigator.getGamepads
      ? navigator.getGamepads()[0] || null
      : null;

    bus.emit({
      type: "inputChanged",
      gamepad: gamepad,
      keysDown: new Set(keysDown), // Pass a copy to prevent external modification
      getTouchesInArea(rectX, rectY, rectWidth, rectHeight) {
        const touchesInArea = [];
        // Iterate over a copy of values if modification during iteration is a concern
        for (const touch of currentTouches.values()) {
          if (
            touch.x >= rectX &&
            touch.x <= rectX + rectWidth &&
            touch.y >= rectY &&
            touch.y <= rectY + rectHeight
          ) {
            touchesInArea.push({ x: touch.x, y: touch.y });
          }
        }
        return touchesInArea;
      },
    });
  }

  // Keyboard event listeners on window
  window.addEventListener("keydown", (event) => {
    if (event.repeat) return; // Optional: ignore auto-repeated keydown events if not desired
    keysDown.add(event.code);
    emitInputChanged();
  });

  window.addEventListener("keyup", (event) => {
    keysDown.delete(event.code);
    emitInputChanged();
  });

  // Touch event listeners on canvas
  canvas.addEventListener(
    "touchstart",
    (event) => {
      event.preventDefault();
      for (const touch of event.changedTouches) {
        currentTouches.set(touch.identifier, getTouchPosition(touch));
      }
      emitInputChanged();
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (event) => {
      event.preventDefault();
      for (const touch of event.changedTouches) {
        if (currentTouches.has(touch.identifier)) {
          currentTouches.set(touch.identifier, getTouchPosition(touch));
        }
      }
      emitInputChanged();
    },
    { passive: false }
  );

  const handleTouchEndOrCancel = (event) => {
    event.preventDefault();
    for (const touch of event.changedTouches) {
      currentTouches.delete(touch.identifier);
    }
    emitInputChanged();
  };
  canvas.addEventListener("touchend", handleTouchEndOrCancel, {
    passive: false,
  });
  canvas.addEventListener("touchcancel", handleTouchEndOrCancel, {
    passive: false,
  });

  // Mouse event listeners on canvas (simulating a touch with button 1 / primary button)
  let isMouseButton1Down = false;
  const MOUSE_TOUCH_ID = "mouse_button1";

  canvas.addEventListener("mousedown", (event) => {
    if (event.button === 0) {
      // Primary button (usually left, considered "button 1" conceptually)
      isMouseButton1Down = true;
      currentTouches.set(MOUSE_TOUCH_ID, getMousePosition(event));
      emitInputChanged();
    }
  });

  canvas.addEventListener("mousemove", (event) => {
    if (isMouseButton1Down) {
      currentTouches.set(MOUSE_TOUCH_ID, getMousePosition(event));
      emitInputChanged();
    }
  });

  const handleMouseUpOrLeave = (event) => {
    // For mouseup, only act if it's the primary button
    if (event.type === "mouseup" && event.button !== 0) {
      return;
    }
    if (isMouseButton1Down) {
      isMouseButton1Down = false;
      currentTouches.delete(MOUSE_TOUCH_ID);
      emitInputChanged();
    }
  };
  canvas.addEventListener("mouseup", handleMouseUpOrLeave);
  canvas.addEventListener("mouseleave", handleMouseUpOrLeave); // Clear if mouse leaves canvas while pressed

  // Gamepad connection/disconnection events to trigger an inputChanged event
  window.addEventListener("gamepadconnected", () => {
    emitInputChanged();
  });
  window.addEventListener("gamepaddisconnected", () => {
    emitInputChanged();
  });

  // Emit an initial input state.
  emitInputChanged();
}
