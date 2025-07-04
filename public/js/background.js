import { bus, gameState, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, WORLD_HEIGHT } from './game.js';

let skyImage = null;
let grassImage = null;
const GRASS_HEIGHT = 20;

// Load background images
bus.on('init', (evt) => {
  const loadSky = new Promise((resolve, reject) => {
    skyImage = new Image();
    skyImage.onload = resolve;
    skyImage.onerror = reject;
    skyImage.src = './svg/sky-background.svg';
  });

  const loadGrass = new Promise((resolve, reject) => {
    grassImage = new Image();
    grassImage.onload = resolve;
    grassImage.onerror = reject;
    grassImage.src = './svg/grass-foreground.svg';
  });

  evt.waitFor(Promise.all([loadSky, loadGrass]));
});

// Draw static sky background
bus.on('drawBackground', (evt) => {
  if (skyImage) {
    evt.ctx.drawImage(skyImage, 0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  }
});

// Draw scrolling grass foreground
bus.on('drawStaticUI', (evt) => {
  if (grassImage) {
    const { ctx } = evt;
    const grassY = WORLD_HEIGHT - GRASS_HEIGHT;
    const grassWidth = grassImage.width;
    
    // Calculate how much to offset the grass pattern for scrolling
    const scrollOffset = gameState.viewportX % grassWidth;
    
    // Draw grass tiles across the viewport width
    const tilesNeeded = Math.ceil((VIEWPORT_WIDTH + grassWidth) / grassWidth);
    
    for (let i = 0; i < tilesNeeded; i++) {
      const x = (i * grassWidth) - scrollOffset;
      ctx.drawImage(grassImage, x, grassY, grassWidth, GRASS_HEIGHT);
    }
  }
});
