import { bus, gameState, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './game.js';
import { PALETTE, FONT_FAMILY } from './theme.js';

// Constants for "GAME OVER" text
const GAME_OVER_TEXT = "GAME OVER";
const FONT_SIZE_PX = 48;
const TEXT_COLOR = "white";
const INITIAL_Y_OFFSET_BELOW_SCREEN = 50; // How far below the screen the text starts
const TARGET_Y_POSITION = VIEWPORT_HEIGHT / 2;
const ANIMATION_PIXELS_PER_FRAME = 3; // Speed of the text scrolling up

let isGameOverSequenceActive = false;
let textCurrentY = VIEWPORT_HEIGHT + INITIAL_Y_OFFSET_BELOW_SCREEN;
let isAnimationComplete = false;

bus.on('stateChanged', () => {
  if (gameState.state === 'gameOver') {
    isGameOverSequenceActive = true;
    textCurrentY = VIEWPORT_HEIGHT + INITIAL_Y_OFFSET_BELOW_SCREEN; // Reset position for animation
    isAnimationComplete = false;
  } else {
    // If state changes from gameOver to something else (e.g., due to external reset), hide and reset
    isGameOverSequenceActive = false;
  }
});

bus.on('drawStaticUI', (evt) => {
  if (!isGameOverSequenceActive) {
    return;
  }

  const { ctx } = evt;

  // Animate text if not yet complete
  if (!isAnimationComplete) {
    if (textCurrentY > TARGET_Y_POSITION) {
      textCurrentY -= ANIMATION_PIXELS_PER_FRAME;
      if (textCurrentY <= TARGET_Y_POSITION) {
        textCurrentY = TARGET_Y_POSITION;
        isAnimationComplete = true;
      }
    } else {
      // Snap to position if somehow it started above or at the target
      textCurrentY = TARGET_Y_POSITION;
      isAnimationComplete = true;
    }
  }

  // Draw "GAME OVER" text
  ctx.font = `${FONT_SIZE_PX}px ${FONT_FAMILY}`;
  ctx.fillStyle = PALETTE.highlightText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(GAME_OVER_TEXT, VIEWPORT_WIDTH / 2, textCurrentY);
});

bus.on('inputChanged', (evt) => {
  if (isGameOverSequenceActive && isAnimationComplete) {
    const anyKeyPressed = evt.keysDown.size > 0;
    const anyTouch = evt.getTouchesInArea(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT).length > 0;
    const anyGamepadButtonPressed = evt.gamepad && evt.gamepad.buttons.some(button => button.pressed);

    if (anyKeyPressed || anyTouch || anyGamepadButtonPressed) {
      // Reset game state
      bus.emit({ type: 'reset' });

      // Deactivate game over sequence for this instance
      isGameOverSequenceActive = false;
      isAnimationComplete = false; // Reset for the next game over
    }
  }
});
