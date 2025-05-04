# Prompts

These are some of the prompts that were used to create "Ascii bird".

````md
Maak een flappy bird webapplicatie op de volgende manier:
- Het is een statische website
- Het maakt gebruik van ES6 javascript modules
- Het is extreem opgesplitst in modules
- De centrale module is game.js. Hierin zit de event-bus, gameState, helpers en gameObjects. 
- GameObjects zijn elementen die op dat moment getekend worden en mee geinteracteerd wordt. 
- In de gameState zit de positie van de vogel, snelheid, of de vliegknop is ingedrukt.
- Met de bus worden events rondgestuurd door de modules die weer door andere modules opgepikt kunnen worden. Voorbeelden zijn: init, prepareSegment, collisionDetected, gameOver, paused, scoreChanged, enzovoorts. De bus zorgt ervoor dat de game enorm opgesplitst kan worden in modules, zodat deze gemakkelijk onderhouden kunnen worden.
- Er zijn losse modules voor: bird, flybutton, gameloop, canvasrenderer. Elk stuk toekomstige functionaliteit krijgt zijn eigen module (obstakels, scoreboard, powerups, etc.) 
- De architectuur is geoptimaliseerd op leesbaarheid en niet op performance.
- GameObjects kunnen eenvoudige ascii tekens (emoji's) zijn.
- De applicatie heeft een event loop die 200 keer per seconde alle geregistreerde gameObjects een `gameTick` callback stuurt (als het spel niet gepauzeerd of gameover is). Hierin kunnen bijvoorbeeld natuurkundige berekeningen worden gedaan en gecontroleerd worden op botsingen.
- Ook is er een draw event die wordt bestuurd door requestAnimationFrame. De geregistreerde gameObjects wordt dan een `draw` callback gestuurd, waarmee ze zich op de meegegeven canvas kunnen tekenen.
- The canvas has 800x450 pixels and displays a world with infinitex450 pixels that scrolls horizontally from left the right
- Er is een bird module die de vogel sprite tekent en de zwaartekracht toepast de vliegversnelling als de flyButton is ingedrukt

This is a sample module:

```js
// big-coin.js
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
```
````