await Promise.all([
  // Core modules
  importWithErrorHandling("./bird.js"), // emits collisionDetected when bird hits ground or ceiling
  importWithErrorHandling("./game-manager.js"), // handles paused, unpaused and collisionDetected events, emits gameOver

  // UI modules
  importWithErrorHandling("./fly-button.js"), // handles inputChanged, changes gameState.flyButtonPressed
  importWithErrorHandling("./pause-button.js"), // emits paused and unpaused
  importWithErrorHandling("./gameOver.js"), // handles stateChanged when gameState.state is gameOver

  // Obstacles

  // Power-ups
  importWithErrorHandling("./big-coin.js"),
]);

function importWithErrorHandling(modulePath) {
  return import(modulePath).catch((error) => {
    console.error(`Error importing module ${modulePath}:`, error);
    // Show must go on, start the game anyway
  });
}

export {};
