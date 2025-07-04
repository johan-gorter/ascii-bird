import { bus, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_HEIGHT } from './game.js';
import { gameState } from './game.js'

export const PALETTE = {
  highlightText: '#FFFF00', // Bright yellow for scores, "GAME OVER", etc
  buttonBg: '#4A90E2',     // Blue for buttons, matches emoji buttons
  buttonText: '#E0E0E0',   // Off-white for button text
};

export const FONT_FAMILY = "'Press Start 2P'"; // Use loaded pixel font

let skyImage = null;
let grassImage = null;
let skyPattern = null;
let grassPattern = null;
const GRASS_HEIGHT = 20;

bus.on('init', (evt) => {
  // Load background images
  const loadSky = new Promise((resolve, reject) => {
    skyImage = new Image();
    skyImage.onload = () => {
      // Create pattern after image loads for better Firefox performance
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        skyPattern = tempCtx.createPattern(skyImage, 'repeat');
      }
      resolve(undefined);
    };
    skyImage.onerror = reject;
    skyImage.src = './svg/sky-background.svg';
  });

  const loadGrass = new Promise((resolve, reject) => {
    grassImage = new Image();
    grassImage.onload = () => {
      // Create pattern after image loads for better Firefox performance
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        grassPattern = tempCtx.createPattern(grassImage, 'repeat');
      }
      resolve(undefined);
    };
    grassImage.onerror = reject;
    grassImage.src = './svg/grass-foreground.svg';
  });

  evt.waitFor(Promise.all([loadSky, loadGrass]));
});

// Draw static sky background - optimized for Firefox
bus.on('drawBackground', (evt) => {
  if (skyImage) {
    // Use pattern filling for better performance in Firefox
    evt.ctx.save();
    if (skyPattern) {
      evt.ctx.fillStyle = skyPattern;
      evt.ctx.fillRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    } else {
      // Fallback to direct image drawing
      evt.ctx.drawImage(skyImage, 0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    }
    evt.ctx.restore();
  }
});

// Draw scrolling grass foreground - optimized for Firefox
bus.on('drawStaticUI', (evt) => {
  if (grassImage) {
    const { ctx } = evt;
    const grassY = WORLD_HEIGHT - GRASS_HEIGHT;
    const grassWidth = 100;
    
    // Calculate how much to offset the grass pattern for scrolling
    const scrollOffset = gameState.viewportX % grassWidth;
    
    ctx.save();
    
    if (grassPattern) {
      // Use pattern for better Firefox performance
      ctx.translate(-scrollOffset, grassY);
      ctx.fillStyle = grassPattern;
      ctx.fillRect(0, 0, VIEWPORT_WIDTH + grassWidth, GRASS_HEIGHT);
    } else {
      // Fallback to direct image drawing
      const tilesNeeded = Math.ceil((VIEWPORT_WIDTH + grassWidth) / grassWidth);
      
      for (let i = 0; i < tilesNeeded; i++) {
        const x = (i * grassWidth) - scrollOffset;
        ctx.drawImage(grassImage, x, grassY, grassWidth, GRASS_HEIGHT);
      }
    }
    
    ctx.restore();
  }
});
