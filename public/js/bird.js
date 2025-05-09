import { bus, gameState, WORLD_HEIGHT, helpers, gameObjects } from "./game.js";

/**
 * @typedef {import('./game.d.ts').GameObject} GameObject
 */

const BIRD_SIZE = 40;
const GRAVITY = 0.5; // pixels per millisecond^2
const FLY_UPWARD_FORCE = 1.5; // pixels per millisecond^2

const INITIAL_SPEED_X = 1; // pixels per millisecond
const INITIAL_BIRD_X = 50;
const VIEWPORT_BIRD_X = 50;
const INITIAL_BIRD_Y = WORLD_HEIGHT / 2 - BIRD_SIZE / 2;

const birdCanvas = helpers.charToCanvas("🐦", BIRD_SIZE);
const birdHitMap = helpers.canvasToHitMap(birdCanvas);

let x = INITIAL_BIRD_X;
let y = INITIAL_BIRD_Y;
let speedx = INITIAL_SPEED_X;
let speedy = 0;

/** @type {GameObject} */
let gameObject = {
  type: "bird",
  draw(ctx, viewportX) {
    ctx.drawImage(birdCanvas, x - viewportX, y);
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
    gameState.bird.x = Math.floor(x);
    gameState.bird.y = Math.floor(y);
    gameState.viewportX = gameState.bird.x - VIEWPORT_BIRD_X;
  },
};

gameObjects.add(gameObject);

gameState.bird = { x: INITIAL_BIRD_X, y: INITIAL_BIRD_Y, hitMap: birdHitMap };
