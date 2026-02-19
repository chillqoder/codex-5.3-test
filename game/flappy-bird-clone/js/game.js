(function initGame(global) {
  const Flappy = global.Flappy;
  const CONFIG = Flappy.CONFIG;
  const Player = Flappy.Player;
  const PipeManager = Flappy.PipeManager;
  const checkPipeCollisions = Flappy.checkPipeCollisions;
  const UI = Flappy.UI;
  const InputManager = Flappy.InputManager;

  class Game {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");

      this.state = "START";
      this.player = new Player(CONFIG.PLAYER);
      this.pipes = new PipeManager(CONFIG.PIPES);
      this.ui = new UI(CONFIG);
      this.input = new InputManager(canvas, CONFIG.INPUT);

      this.score = 0;
      this.bestScore = 0;

      this.lastFrameTime = 0;
      this.rafId = null;

      this.loop = this.loop.bind(this);
    }

    start() {
      this.bestScore = this.loadBestScore();
      this.input.attach();
      this.rafId = requestAnimationFrame(this.loop);
    }

    loadBestScore() {
      try {
        const saved = window.localStorage.getItem("flappy-best-score");
        const parsed = Number.parseInt(saved, 10);
        return Number.isFinite(parsed) ? parsed : 0;
      } catch (error) {
        return 0;
      }
    }

    saveBestScore() {
      try {
        window.localStorage.setItem("flappy-best-score", String(this.bestScore));
      } catch (error) {
        /* Ignore storage failures in restricted environments. */
      }
    }

    loop(timestamp) {
      if (!this.lastFrameTime) {
        this.lastFrameTime = timestamp;
      }

      const rawDelta = (timestamp - this.lastFrameTime) / 1000;
      const deltaTime = Math.min(rawDelta, CONFIG.MAX_DELTA);
      this.lastFrameTime = timestamp;

      this.processInput();
      this.update(deltaTime);
      this.render();

      this.rafId = requestAnimationFrame(this.loop);
    }

    processInput() {
      if (!this.input.consumeAction()) {
        return;
      }

      if (this.state === "START") {
        this.beginRound();
        this.player.flap();
        return;
      }

      if (this.state === "PLAYING") {
        this.player.flap();
        return;
      }

      if (this.state === "GAME_OVER") {
        this.beginRound();
        this.player.flap();
      }
    }

    beginRound() {
      this.state = "PLAYING";
      this.score = 0;
      this.player.reset();
      this.pipes.reset();
      this.pipes.primeSpawn(0.55);
    }

    update(deltaTime) {
      if (this.state !== "PLAYING") {
        return;
      }

      this.player.update(deltaTime);
      this.pipes.update(deltaTime);

      const passedCount = this.pipes.collectPassedCount(this.player.x);
      if (passedCount > 0) {
        this.score += passedCount;
      }

      const playerBounds = this.player.getBounds();
      const collidesWithPipe = checkPipeCollisions(
        playerBounds,
        this.pipes.getPipes(),
        CONFIG.PIPES,
        CONFIG.HEIGHT,
        CONFIG.GROUND_HEIGHT
      );

      if (collidesWithPipe || this.hitsGround(playerBounds)) {
        this.triggerGameOver();
      }
    }

    hitsGround(playerBounds) {
      return playerBounds.y + playerBounds.height >= CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
    }

    triggerGameOver() {
      this.state = "GAME_OVER";

      if (this.score > this.bestScore) {
        this.bestScore = this.score;
        this.saveBestScore();
      }
    }

    render() {
      this.drawSky();
      this.drawPipes();
      this.drawGround();
      this.drawPlayer();
      this.ui.render(this.ctx, this.state, this.score, this.bestScore);
    }

    drawSky() {
      const ctx = this.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.HEIGHT);
      gradient.addColorStop(0, CONFIG.COLORS.SKY_TOP);
      gradient.addColorStop(1, CONFIG.COLORS.SKY_BOTTOM);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, CONFIG.WIDTH, CONFIG.HEIGHT);

      ctx.fillStyle = CONFIG.COLORS.CLOUD;
      ctx.beginPath();
      ctx.ellipse(70, 125, 35, 18, 0, 0, Math.PI * 2);
      ctx.ellipse(96, 120, 28, 16, 0, 0, Math.PI * 2);
      ctx.ellipse(122, 128, 32, 17, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(250, 205, 36, 19, 0, 0, Math.PI * 2);
      ctx.ellipse(276, 198, 26, 15, 0, 0, Math.PI * 2);
      ctx.ellipse(299, 206, 29, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    drawPipes() {
      const ctx = this.ctx;
      const pipes = this.pipes.getPipes();
      const capHeight = 18;
      const playableHeight = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;
      const halfGap = CONFIG.PIPES.GAP_HEIGHT / 2;

      for (let i = 0; i < pipes.length; i += 1) {
        const pipe = pipes[i];
        const topHeight = pipe.gapY - halfGap;
        const bottomY = pipe.gapY + halfGap;
        const bottomHeight = playableHeight - bottomY;

        ctx.fillStyle = CONFIG.COLORS.PIPE;
        ctx.fillRect(pipe.x, 0, CONFIG.PIPES.WIDTH, topHeight);
        ctx.fillRect(pipe.x, bottomY, CONFIG.PIPES.WIDTH, bottomHeight);

        ctx.fillStyle = CONFIG.COLORS.PIPE_SHADE;
        ctx.fillRect(pipe.x + CONFIG.PIPES.WIDTH - 10, 0, 10, topHeight);
        ctx.fillRect(pipe.x + CONFIG.PIPES.WIDTH - 10, bottomY, 10, bottomHeight);

        ctx.fillStyle = CONFIG.COLORS.PIPE_CAP;
        ctx.fillRect(pipe.x - 4, topHeight - capHeight, CONFIG.PIPES.WIDTH + 8, capHeight);
        ctx.fillRect(pipe.x - 4, bottomY, CONFIG.PIPES.WIDTH + 8, capHeight);
      }
    }

    drawGround() {
      const ctx = this.ctx;
      const groundY = CONFIG.HEIGHT - CONFIG.GROUND_HEIGHT;

      ctx.fillStyle = CONFIG.COLORS.GROUND;
      ctx.fillRect(0, groundY, CONFIG.WIDTH, CONFIG.GROUND_HEIGHT);

      ctx.fillStyle = CONFIG.COLORS.GROUND_LINE;
      ctx.fillRect(0, groundY, CONFIG.WIDTH, 6);

      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      for (let x = 0; x < CONFIG.WIDTH; x += 26) {
        ctx.fillRect(x, groundY + 22, 14, 6);
      }
    }

    drawPlayer() {
      const ctx = this.ctx;
      const p = this.player;
      const centerX = p.x + p.width / 2;
      const centerY = p.y + p.height / 2;

      const tilt = Math.max(-0.45, Math.min(0.9, p.velocityY / 700));

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(tilt);

      ctx.fillStyle = CONFIG.COLORS.BIRD;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CONFIG.COLORS.BIRD_WING;
      ctx.beginPath();
      ctx.ellipse(-3, 2, p.width / 4, p.height / 4, 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff6f00";
      ctx.beginPath();
      ctx.moveTo(p.width / 2 - 1, -1);
      ctx.lineTo(p.width / 2 + 10, 2);
      ctx.lineTo(p.width / 2 - 1, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(7, -5, 4.8, 4.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CONFIG.COLORS.BIRD_EYE;
      ctx.beginPath();
      ctx.ellipse(8, -5, 2, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  Flappy.Game = Game;
})(window);
