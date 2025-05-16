import { bus, gameState, VIEWPORT_HEIGHT } from "./game.js";

const BUTTON_WIDTH = 150;
const BUTTON_HEIGHT = 50;
const BUTTON_X = 20;
const BUTTON_Y = VIEWPORT_HEIGHT - BUTTON_HEIGHT - 20;
const BORDER_RADIUS = 10;
const FONT_SIZE = 30;
const BUTTON_TEXT = "FLY";

/**
 * Draws a button state onto a given canvas context.
 * @param {CanvasRenderingContext2D} ctx The context to draw on.
 * @param {string} backgroundColor The background color of the button.
 * @param {string} textColor The text color.
 */
function drawButtonState(ctx, backgroundColor, textColor) {
  // Draw rounded rectangle for button background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.moveTo(BORDER_RADIUS, 0);
  ctx.lineTo(BUTTON_WIDTH - BORDER_RADIUS, 0);
  ctx.quadraticCurveTo(BUTTON_WIDTH, 0, BUTTON_WIDTH, BORDER_RADIUS);
  ctx.lineTo(BUTTON_WIDTH, BUTTON_HEIGHT - BORDER_RADIUS);
  ctx.quadraticCurveTo(BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_WIDTH - BORDER_RADIUS, BUTTON_HEIGHT);
  ctx.lineTo(BORDER_RADIUS, BUTTON_HEIGHT);
  ctx.quadraticCurveTo(0, BUTTON_HEIGHT, 0, BUTTON_HEIGHT - BORDER_RADIUS);
  ctx.lineTo(0, BORDER_RADIUS);
  ctx.quadraticCurveTo(0, 0, BORDER_RADIUS, 0);
  ctx.closePath();
  ctx.fill();

  // Draw button text
  ctx.fillStyle = textColor;
  ctx.font = `${FONT_SIZE}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(BUTTON_TEXT, BUTTON_WIDTH / 2, BUTTON_HEIGHT / 2);
}

// Create offscreen canvas for the unpressed button state
const unpressedButtonCanvas = document.createElement("canvas");
unpressedButtonCanvas.width = BUTTON_WIDTH;
unpressedButtonCanvas.height = BUTTON_HEIGHT;
const unpressedCtx = unpressedButtonCanvas.getContext("2d");
if (!unpressedCtx) throw new Error("Could not obtain 2D context");
drawButtonState(unpressedCtx, "grey", "white");

// Create offscreen canvas for the pressed button state
const pressedButtonCanvas = document.createElement("canvas");
const pressedCtx = pressedButtonCanvas.getContext("2d");
if (!pressedCtx) throw new Error("Could not obtain 2D context");
pressedButtonCanvas.width = BUTTON_WIDTH;
pressedButtonCanvas.height = BUTTON_HEIGHT;
drawButtonState(pressedCtx, "darkgrey", "lightgrey");

bus.on("drawStaticUI", (evt) => {
  const { ctx } = evt;

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