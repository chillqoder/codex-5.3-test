(function initMain(global) {
  const Flappy = global.Flappy;
  const CONFIG = Flappy.CONFIG;
  const Game = Flappy.Game;

  const canvas = document.getElementById("game-canvas");
  if (!canvas) {
    return;
  }

  let game;

  try {
    game = new Game(canvas);
  } catch (error) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#1f2c3a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 20px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Ошибка запуска игры", canvas.width / 2, canvas.height / 2);
    }
    return;
  }

  function resizeCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scale = Math.min(viewportWidth / CONFIG.WIDTH, viewportHeight / CONFIG.HEIGHT);

    canvas.style.width = Math.floor(CONFIG.WIDTH * scale) + "px";
    canvas.style.height = Math.floor(CONFIG.HEIGHT * scale) + "px";
  }

  window.addEventListener("resize", resizeCanvas, { passive: true });
  window.addEventListener("orientationchange", resizeCanvas, { passive: true });

  resizeCanvas();
  game.start();
})(window);
