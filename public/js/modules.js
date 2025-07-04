await Promise.all([
  // Core modules
  importWithErrorHandling("./bird.js"), // emits collisionDetected when bird hits ground or ceiling
  importWithErrorHandling("./game-manager.js"), // handles paused, unpaused and collisionDetected events, emits gameOver

  // UI modules
  importWithErrorHandling("./fly-button.js"), // handles inputChanged, changes gameState.flyButtonPressed. Draws a fly button at bottom-left corner 150px wide, 75 pixels high.
  importWithErrorHandling("./pause-button.js"), // emits paused and unpaused, draws a pause button at top-right corner 50px wide.
  importWithErrorHandling("./gameOver.js"), // handles stateChanged when gameState.state is gameOver
  importWithErrorHandling("./theme.js"), // Applies styling and provides a color palette, draws UI elements.
  
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
