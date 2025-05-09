This project is called "ASCII BIRD". It is a simple static website using modern technologies.
It shows a canvas where users can play a "flappy bird" kind of game.

- We use ES2022 Javascript modules
- The code is extremely split up into modules
- All modules depend on game.js, described by [this typescript definition](../public/js/game.d.ts)
- There is a central event bus that modules use to communicate.
- The architecture is optimized for readability and maintainability, not performance.
- The world is infinitely long and 450 pixels high.
- The viewport/canvas is 800 pixels wide and 450 pixels high. The gameState.viewportX tells what part of the world is currently visible.
- All modules can register to prepareSegment events to add game objects to the game.
- When the game is running (not paused or game over), all registered game objects receive gameTick callbacks. Here they can apply physics, collect detections and do logic.
- On requestAnimationFrame, all registered game objects receive draw callbacks. Here they can draw themselves on the canvas.
- Game objects can be created from simple ASCII characters like 🐦, ✈️, 🚁, 🏢, 🛰️, 🪚, ⚙️, ⏸️

Example code for a big coin that shows up in every segment:

```javascript
// Tries to add one big coin on each segment at a random location
import { bus, gameState, WORLD_HEIGHT, helpers, gameObjects } from './game.js';

const { charToCanvas, canvasToHitMap, detectCollision } = helpers;

const RADIUS = 20;
const GLYPH = '💰';

const coinCanvas = charToCanvas(GLYPH, RADIUS * 2);
const coinHitMap = canvasToHitMap(coinCanvas);

bus.on('prepareSegment', (evt) => {
  // Determine the position of the coin for this segment
  const x = evt.builder.rng.nextInt(evt.segmentStartX, evt.segmentEndX - RADIUS * 2);
  const y = evt.builder.rng.nextInt(RADIUS, WORLD_HEIGHT - RADIUS);

  // Reserve space: (x, y, width, height)
  if (evt.builder.reserveSpace(x, y, RADIUS * 2, RADIUS * 2)) {
    const bigCoinGameObject = {
      type: 'big-coin',

      /**
       * @param {CanvasRenderingContext2D} ctx
       * @param {number} viewportX
       */
      draw(ctx, viewportX) {
        ctx.drawImage(coinCanvas, x - viewportX, y);
      },

      gameTick() {
        if (
          detectCollision(
            { x, y, hitMap: coinHitMap },
            gameState.bird
          )
        ) {
          bus.emit({ type: 'scoreChanged', score: 1000 });
          gameObjects.delete(bigCoinGameObject);
        }
      },

      autoRemoveAt: x + RADIUS * 2
    };

    gameObjects.add(bigCoinGameObject);
  }
});
```