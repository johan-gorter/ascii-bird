// Fighter plane that flies towards the player from the right side
import { bus, gameState, WORLD_HEIGHT, VIEWPORT_WIDTH, helpers, gameObjects } from './game.js';

const { canvasToHitMap, detectCollision } = helpers;
const { on, emit } = bus;

const PLANE_WIDTH = 120;
const PLANE_HEIGHT = 80;
const SPEED = 120; // pixels per second, moving left

// Function to create canvas from SVG
function svgToCanvas(svgPath, width, height) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  const img = new Image();
  img.src = svgPath;
  
  return new Promise((resolve) => {
    img.onload = () => {
      // Create a temporary canvas to process the image
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = width;
      tempCanvas.height = height;
      
      if (!tempCtx) {
        throw new Error('Could not get temp canvas context');
      }
      
      // Draw the original image to temp canvas
      tempCtx.drawImage(img, 0, 0, width, height);
      
      // Get image data to process pixels
      const imageData = tempCtx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      // Make black pixels transparent (black background removal)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If pixel is close to black, make it transparent
        if (r < 50 && g < 50 && b < 50) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      // Put the processed image data back
      tempCtx.putImageData(imageData, 0, 0);
      
      // Clear main canvas with transparent background
      ctx.clearRect(0, 0, width, height);
      
      // Flip the processed image horizontally so the plane faces left
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(tempCanvas, -width, 0, width, height);
      ctx.restore();
      
      resolve(canvas);
    };
  });
}

// Initialize the plane canvas and hitmap
let planeCanvas = null;
let planeHitMap = null;

// Load the SVG asset
svgToCanvas('/assets/game-icons/skoll/airplane.svg', PLANE_WIDTH, PLANE_HEIGHT).then(canvas => {
  planeCanvas = canvas;
  planeHitMap = canvasToHitMap(canvas);
});

on('prepareSegment', (evt) => {
  // Only create fighter planes if the assets are loaded
  if (!planeCanvas || !planeHitMap) {
    return;
  }
  // Add a fighter plane occasionally (30% chance per segment)
  if (evt.builder.rng.nextInt(1, 100) <= 30) {
    // Start the plane from the right side of the segment
    const startX = evt.segmentEndX + VIEWPORT_WIDTH / 2;
    const y = evt.builder.rng.nextInt(PLANE_HEIGHT, WORLD_HEIGHT - PLANE_HEIGHT);
    
    // No need to reserve space since it's moving and coming from outside the segment
    const fighterPlaneGameObject = {
      type: 'fighter-plane',
      
      // Current position of the plane
      currentX: startX,
      
      /**
       * @param {CanvasRenderingContext2D} ctx
       * @param {number} viewportX
       */
      draw(ctx, viewportX) {
        // Only draw if the plane is visible on screen
        if (this.currentX >= viewportX - PLANE_WIDTH && this.currentX <= viewportX + VIEWPORT_WIDTH) {
          ctx.drawImage(planeCanvas, this.currentX - viewportX, y);
        }
      },
        /**
       * @param {number} dt Delta time in milliseconds
       */
      gameTick(dt) {
        // Move the plane to the left
        this.currentX -= (SPEED * dt) / 1000;
        
        // Check collision with bird
        if (
          detectCollision(
            { x: this.currentX, y, hitMap: planeHitMap },
            gameState.bird
          )
        ) {
          emit({ type: 'collisionDetected', collisionObject: this });
        }
        
        // Remove self when it goes far off the left side of the screen
        if (this.currentX + PLANE_WIDTH < gameState.viewportX - VIEWPORT_WIDTH) {
          gameObjects.delete(this);
        }
      }
    };
    
    gameObjects.add(fighterPlaneGameObject);
  }
});
