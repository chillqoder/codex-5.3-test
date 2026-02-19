(function initUI(global) {
  const Flappy = global.Flappy;

  class UI {
    constructor(config) {
      this.config = config;
    }

    render(ctx, state, score, bestScore) {
      this.drawScore(ctx, score);

      if (state === "START") {
        this.drawStart(ctx);
        return;
      }

      if (state === "GAME_OVER") {
        this.drawGameOver(ctx, score, bestScore);
      }
    }

    drawScore(ctx, score) {
      const colors = this.config.COLORS;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = "700 34px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillStyle = colors.TEXT_SHADOW;
      ctx.fillText("Счёт: " + score, this.config.WIDTH / 2 + 2, 22 + 2);
      ctx.fillStyle = colors.TEXT_MAIN;
      ctx.fillText("Счёт: " + score, this.config.WIDTH / 2, 22);
      ctx.restore();
    }

    drawStart(ctx) {
      const colors = this.config.COLORS;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = colors.OVERLAY;
      ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);

      ctx.fillStyle = colors.TEXT_MAIN;
      ctx.font = "700 38px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Flappy Bird", this.config.WIDTH / 2, this.config.HEIGHT / 2 - 70);

      ctx.font = "700 24px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Нажмите чтобы начать", this.config.WIDTH / 2, this.config.HEIGHT / 2 - 16);

      ctx.font = "600 18px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Пробел / Клик / Касание", this.config.WIDTH / 2, this.config.HEIGHT / 2 + 22);

      ctx.restore();
    }

    drawGameOver(ctx, score, bestScore) {
      const colors = this.config.COLORS;
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillStyle = colors.OVERLAY;
      ctx.fillRect(0, 0, this.config.WIDTH, this.config.HEIGHT);

      ctx.fillStyle = colors.TEXT_MAIN;
      ctx.font = "700 40px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Игра окончена", this.config.WIDTH / 2, this.config.HEIGHT / 2 - 72);

      ctx.font = "700 24px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Счёт: " + score, this.config.WIDTH / 2, this.config.HEIGHT / 2 - 18);
      ctx.fillText("Рекорд: " + bestScore, this.config.WIDTH / 2, this.config.HEIGHT / 2 + 18);

      ctx.font = "600 19px 'Trebuchet MS', Arial, sans-serif";
      ctx.fillText("Рестарт: нажмите", this.config.WIDTH / 2, this.config.HEIGHT / 2 + 66);

      ctx.restore();
    }
  }

  Flappy.UI = UI;
})(window);
