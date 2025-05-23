import { bus, gameState, VIEWPORT_HEIGHT } from "./game.js";
import { PALETTE } from './theme.js';

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 50;
const BUTTON_X = 20;
const BUTTON_Y = VIEWPORT_HEIGHT - BUTTON_HEIGHT - 20;
const FONT_SIZE = 20;
const BUTTON_TEXT = "FLY";

let unpressedButtonCanvas;
let pressedButtonCanvas;

/**
 * Draws a button state onto a given canvas context.
 * @param {CanvasRenderingContext2D} ctx The context to draw on.
 * @param {string} backgroundColor The background color of the button.
 * @param {string} textColor The text color.
 */
function drawButtonState(ctx, backgroundColor, textColor) {
  // Draw square rectangle for button background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT);

  // Draw button text
  ctx.fillStyle = textColor;
  ctx.font = `${FONT_SIZE}px 'Press Start 2P'`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(BUTTON_TEXT, BUTTON_WIDTH / 2, BUTTON_HEIGHT / 2);
}

bus.on('init', (evt) => { // Added evt parameter
  console.log("Initializing fly button...");

  const initPromise = new Promise((resolve, reject) => {
    try {
      // Create offscreen canvas for the unpressed button state
      unpressedButtonCanvas = document.createElement("canvas");
      unpressedButtonCanvas.width = BUTTON_WIDTH;
      unpressedButtonCanvas.height = BUTTON_HEIGHT;
      const unpressedCtx = unpressedButtonCanvas.getContext("2d");
      if (!unpressedCtx) {
        const errorMsg = "Could not obtain 2D context for unpressed fly button";
        console.error(errorMsg);
        reject(new Error(errorMsg)); // Reject the promise on error
        return;
      }
      drawButtonState(unpressedCtx, PALETTE.buttonBg, PALETTE.buttonText);

      // Create offscreen canvas for the pressed button state
      pressedButtonCanvas = document.createElement("canvas");
      pressedButtonCanvas.width = BUTTON_WIDTH;
      pressedButtonCanvas.height = BUTTON_HEIGHT;
      const pressedCtx = pressedButtonCanvas.getContext("2d");
      if (!pressedCtx) {
        const errorMsg = "Could not obtain 2D context for pressed fly button";
        console.error(errorMsg);
        reject(new Error(errorMsg)); // Reject the promise on error
        return;
      }
      drawButtonState(pressedCtx, PALETTE.buttonHoverBg, PALETTE.buttonText);
      resolve(undefined); // Resolve the promise when drawing is done
    } catch (error) {
      console.error("Error during fly button canvas initialization:", error);
      reject(error); // Reject on any other error
    }
  });

  evt.waitFor(initPromise); // Use the waitFor method from the InitEvent
});

bus.on("drawStaticUI", (evt) => {
  const { ctx } = evt;

  // If canvases are not ready (e.g. font loading failed or init not complete), don't draw
  if (!unpressedButtonCanvas || !pressedButtonCanvas) {
    return;
  }

  if (gameState.flyButtonPressed) {
    ctx.drawImage(pressedButtonCanvas, BUTTON_X, BUTTON_Y);
  } else {
    ctx.drawImage(unpressedButtonCanvas, BUTTON_X, BUTTON_Y);
  }
});

bus.on("inputChanged", (evt) => {
  const spacePressed = evt.keysDown.has("Space");
  const gamepadButtonPressed = evt.gamepad?.buttons[0]?.pressed ?? false;
  const touchesInButtonArea = evt.getTouchesInArea(BUTTON_X, BUTTON_Y, BUTTON_WIDTH, BUTTON_HEIGHT);
  const mouseOrTouchPressed = touchesInButtonArea.length > 0;

  gameState.flyButtonPressed = gameState.state === "playing" && (spacePressed || gamepadButtonPressed || mouseOrTouchPressed);
});