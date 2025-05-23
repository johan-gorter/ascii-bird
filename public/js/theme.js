import { bus, VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from './game.js';

// The Theme is now set to a retro style, with a dark background and bright colors.
// This can be changed when requested.

export const PALETTE = {
  background: '#1A1A2E', // Dark_blueish-purple
  primaryText: '#E0E0E0', // Off-white for general text
  highlightText: '#FFFF00', // Bright yellow for "GAME OVER", scores
  accent1: '#00FFFF',     // Cyan
  accent2: '#FF00FF',     // Magenta
  scanline: 'rgba(0, 0, 0, 0.25)', // Subtle dark scanlines
  buttonBg: '#4A4A70',     // Muted purple for buttons
  buttonText: '#E0E0E0',   // Off-white for button text
  buttonHoverBg: '#6A6A90', // Lighter purple for button hover
};

export const FONT_FAMILY = "'Press Start 2P'"; // Use loaded pixel font

// Apply the background color
bus.on('drawBackground', (evt) => {
  evt.ctx.fillStyle = PALETTE.background;
  evt.ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
});

// Draw scanlines
bus.on('drawStaticUI', (evt) => {
  // Delay so we draw on top of everything else
  queueMicrotask(() => {
    const { ctx } = evt;

    // Scanlines
    ctx.strokeStyle = PALETTE.scanline;
    ctx.lineWidth = 1;
    for (let y = 0; y < VIEWPORT_HEIGHT; y += 3) { // Adjust spacing (3px) for effect
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5); // Use +0.5 for sharper lines
      ctx.lineTo(VIEWPORT_WIDTH, y + 0.5);
      ctx.stroke();
    }
  });
});
