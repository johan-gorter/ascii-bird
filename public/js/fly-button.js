import { bus, gameState, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from "./game.js";
import { PALETTE } from './theme.js';

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 50;
const PADDING = 20;
const BUTTON_X = VIEWPORT_WIDTH - BUTTON_WIDTH - PADDING;
const BUTTON_Y = VIEWPORT_HEIGHT - BUTTON_HEIGHT - PADDING;
const FONT_SIZE = 20;
const BUTTON_TEXT = "FLY";

let unpressedButtonCanvas;
let pressedButtonCanvas;          

/**
 * Draws a button state onto a given canvas context.
 * @param {CanvasRenderingContext2D} ctx The context to draw on.
 * @param {string} backgroundColor The background color of the button.
 * @param {string} textColor The text color.
 * @param {boolean} isPressed Whether the button is in pressed state.
 */
function drawButtonState(ctx, backgroundColor, textColor, isPressed = false) {
  // Apply brightness filter to entire button when pressed
  ctx.filter = isPressed ? 'brightness(0.8)' : 'none';
  
  // Draw button background with rounded corners
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(2, 2, BUTTON_WIDTH - 4, BUTTON_HEIGHT - 4);

  // Draw button border
  ctx.strokeStyle = PALETTE.buttonText;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, BUTTON_WIDTH - 2, BUTTON_HEIGHT - 2);

  // Draw button text with slight offset when pressed
  const offsetX = isPressed ? 1 : 0;
  const offsetY = isPressed ? 1 : 0;
  ctx.fillStyle = textColor;
  ctx.font = `${FONT_SIZE}px 'Press Start 2P'`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(BUTTON_TEXT, BUTTON_WIDTH / 2 + offsetX, BUTTON_HEIGHT / 2 + offsetY);

  // Reset filter at the end
  ctx.filter = 'none';
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
      drawButtonState(unpressedCtx, PALETTE.buttonBg, PALETTE.buttonText, false);

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
      // Create a slightly darkened version of buttonBg for pressed state
      const darkenedBg = PALETTE.buttonBg.replace(/rgb\((\d+),(\d+),(\d+)\)/, (match, r, g, b) => {
        const darkerR = Math.max(0, parseInt(r) - 30);
        const darkerG = Math.max(0, parseInt(g) - 30);
        const darkerB = Math.max(0, parseInt(b) - 30);
        return `rgb(${darkerR},${darkerG},${darkerB})`;
      }) || '#555555'; // fallback color if regex doesn't match
      
      drawButtonState(pressedCtx, darkenedBg, PALETTE.buttonText, true);
      console.log("Fly button canvases initialized");
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