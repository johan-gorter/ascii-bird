// Tries to add one big coin on each segment at a random location
import { bus, gameState, WORLD_HEIGHT, helpers, gameObjects } from './game.js';

const { charToCanvas, canvasToHitMap, detectCollision } = helpers;
const { on, emit } = bus;

const RADIUS = 20;
const GLYPH = '💰';

const coinCanvas = charToCanvas(GLYPH, RADIUS * 2);
const coinHitMap = canvasToHitMap(coinCanvas);

on('prepareSegment', (evt) => {
  // Determine the position of the coin for this segment
  const x = evt.builder.rng.nextInt(evt.segmentStartX, evt.segmentEndX - RADIUS * 2);
  const y = evt.builder.rng.nextInt(RADIUS, WORLD_HEIGHT - RADIUS);

  // Reserve space: (x, y, width, height)
  if (evt.builder.reserveSpace(x, y, RADIUS * 2, RADIUS * 2)) {
    const bigCoinGameObject = {
      name: 'big-coin',

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
          emit('scoreChanged', { score: 1000 });
          gameObjects.remove(bigCoinGameObject);
        }
      },

      autoRemoveAt: x + RADIUS * 2
    };

    gameObjects.add(bigCoinGameObject);
  }
});