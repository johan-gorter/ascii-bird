import { bus, gameState, helpers, VIEWPORT_WIDTH } from "./game.js";

const { charToCanvas } = helpers;

const BUTTON_SIZE = 40;
const PADDING = 10;
const BUTTON_X = VIEWPORT_WIDTH - BUTTON_SIZE - PADDING;
const BUTTON_Y = PADDING;

const pauseGlyph = "⏸️";
const playGlyph = "▶️";

let pauseButtonCanvas = charToCanvas(pauseGlyph, BUTTON_SIZE);
let playButtonCanvas = charToCanvas(playGlyph, BUTTON_SIZE);

bus.on("drawStaticUI", (evt) => {
  const { ctx } = evt;
  if (gameState.state === "paused") {
    ctx.drawImage(playButtonCanvas, BUTTON_X, BUTTON_Y);
  } else {
    ctx.drawImage(pauseButtonCanvas, BUTTON_X, BUTTON_Y);
  }
});

bus.on("inputChanged", (evt) => {
  const touches = evt.getTouchesInArea(
    BUTTON_X,
    BUTTON_Y,
    BUTTON_SIZE,
    BUTTON_SIZE
  );
  if (touches.length > 0) {
    if (gameState.state === "playing") {
      bus.emit({ type: "paused" });
    } else if (gameState.state === "paused") {
      bus.emit({ type: "unpaused" });
    }
  }
});

// Update button canvas if state changes by other means
bus.on("stateChanged", () => {
  // No specific action needed here for drawing as drawStaticUI handles it,
  // but good for potential future state-specific logic for the button itself.
});
