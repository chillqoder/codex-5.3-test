(function initPipes(global) {
  const Flappy = global.Flappy;

  class PipeManager {
    constructor(config) {
      this.config = config;
      this.pipes = [];
      this.spawnTimer = 0;
      this.idCounter = 0;
    }

    reset() {
      this.pipes.length = 0;
      this.spawnTimer = 0;
      this.idCounter = 0;
    }

    primeSpawn(ratio) {
      this.spawnTimer = this.config.SPAWN_INTERVAL * ratio;
    }

    update(deltaTime) {
      this.spawnTimer += deltaTime;

      while (this.spawnTimer >= this.config.SPAWN_INTERVAL) {
        this.spawnTimer -= this.config.SPAWN_INTERVAL;
        this.spawnPipe();
      }

      const speed = this.config.SPEED;
      for (let i = 0; i < this.pipes.length; i += 1) {
        this.pipes[i].x -= speed * deltaTime;
      }

      while (this.pipes.length > 0 && this.pipes[0].x + this.config.WIDTH < 0) {
        this.pipes.shift();
      }
    }

    spawnPipe() {
      const range = this.config.MAX_GAP_Y - this.config.MIN_GAP_Y;
      const gapY = this.config.MIN_GAP_Y + Math.random() * range;

      this.pipes.push({
        id: this.idCounter,
        x: this.config.SPAWN_X,
        gapY,
        passed: false
      });

      this.idCounter += 1;
    }

    collectPassedCount(playerX) {
      let passedCount = 0;

      for (let i = 0; i < this.pipes.length; i += 1) {
        const pipe = this.pipes[i];
        if (!pipe.passed && pipe.x + this.config.WIDTH < playerX) {
          pipe.passed = true;
          passedCount += 1;
        }
      }

      return passedCount;
    }

    getPipes() {
      return this.pipes;
    }
  }

  Flappy.PipeManager = PipeManager;
})(window);
