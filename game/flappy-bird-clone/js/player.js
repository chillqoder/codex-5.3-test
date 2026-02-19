(function initPlayer(global) {
  const Flappy = global.Flappy;

  class Player {
    constructor(config) {
      this.config = config;
      this.x = config.X;
      this.y = config.START_Y;
      this.width = config.WIDTH;
      this.height = config.HEIGHT;
      this.velocityY = 0;
    }

    reset() {
      this.y = this.config.START_Y;
      this.velocityY = 0;
    }

    flap() {
      this.velocityY = this.config.FLAP_IMPULSE;
    }

    update(deltaTime) {
      this.velocityY += this.config.GRAVITY * deltaTime;

      if (this.velocityY > this.config.MAX_FALL_SPEED) {
        this.velocityY = this.config.MAX_FALL_SPEED;
      }
      if (this.velocityY < this.config.MAX_RISE_SPEED) {
        this.velocityY = this.config.MAX_RISE_SPEED;
      }

      this.y += this.velocityY * deltaTime;

      if (this.y < 0) {
        this.y = 0;
        this.velocityY = 0;
      }
    }

    getBounds() {
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      };
    }
  }

  Flappy.Player = Player;
})(window);
