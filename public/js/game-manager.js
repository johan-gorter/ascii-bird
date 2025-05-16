// This module is responsible for pausing, game over on collision, and restarting the game.
import { bus, gameState } from "./game.js";

bus.on("paused", () => {
  if (gameState.state === "playing") {
    gameState.state = "paused";
    bus.emit({ type: "stateChanged" });
  }
});

bus.on("unpaused", () => {
  if (gameState.state === "paused") {
    gameState.state = "playing";
    bus.emit({ type: "stateChanged" });
  }
});

// Handling collisions - can be expanded
bus.on("collisionDetected", () => {
  if (gameState.state === "playing") {
    gameState.state = "gameOver";
    bus.emit({ type: "stateChanged" });
  }
});

