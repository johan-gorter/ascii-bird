import { bus, gameState, WORLD_HEIGHT, helpers, gameObjects } from "./game.js";

/**
 * @typedef {import('./game.d.ts').GameObject} GameObject
 */

const BIRD_SIZE = 40;
const GRAVITY = 0.0002; // pixels per millisecond^2
const FLY_UPWARD_FORCE = 0.0006; // pixels per millisecond^2

const INITIAL_SPEED_X = 0.2; // pixels per millisecond
const INITIAL_BIRD_X = 50;
const VIEWPORT_BIRD_X = 50;
const INITIAL_BIRD_Y = WORLD_HEIGHT / 2 - BIRD_SIZE / 2;

const birdCanvas = helpers.charToCanvas("🐦", BIRD_SIZE);

// Flip the bird canvas horizontally
const flippedBirdCanvas = document.createElement('canvas');
flippedBirdCanvas.width = birdCanvas.width;
flippedBirdCanvas.height = birdCanvas.height;
const ctx = flippedBirdCanvas.getContext('2d');
if (ctx) {
  ctx.translate(birdCanvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(birdCanvas, 0, 0);
}

const birdHitMap = helpers.canvasToHitMap(flippedBirdCanvas);

let x = INITIAL_BIRD_X;
let y = INITIAL_BIRD_Y;
let speedx = INITIAL_SPEED_X;
let speedy = 0;

function updateGameState() {
  gameState.bird.x = Math.floor(x);
  gameState.bird.y = Math.floor(y);
  gameState.viewportX = gameState.bird.x - VIEWPORT_BIRD_X;
}

/** @type {GameObject} */
let gameObject = {
  type: "bird",
  draw(ctx, viewportX) {
    ctx.drawImage(flippedBirdCanvas, x - viewportX, y);
  },
  gameTick(dt) {
    // apply physics to the bird
    speedy += GRAVITY * dt;
    if (gameState.flyButtonPressed) {
      speedy -= FLY_UPWARD_FORCE * dt;
    }

    x += speedx * dt;
    y += speedy * dt;

    // detect collision with ground and ceiling
    if (y + BIRD_SIZE > WORLD_HEIGHT) {
      bus.emit({type: "collisionDetected"})
    } else if (y < 0) {
      bus.emit({type: "collisionDetected"})
    }

    // change the position of the viewport and bird by whole pixels
    updateGameState();
  },
};

bus.on("init", () => {
  gameState.bird = { x: INITIAL_BIRD_X, y: INITIAL_BIRD_Y, hitMap: birdHitMap };
  gameObjects.add(gameObject);
  updateGameState();
});

bus.on("reset", () => {
  x = INITIAL_BIRD_X;
  y = INITIAL_BIRD_Y;
  speedx = INITIAL_SPEED_X;
  speedy = 0;
  updateGameState();
});

gameState.bird = { x: INITIAL_BIRD_X, y: INITIAL_BIRD_Y, hitMap: birdHitMap };
