(function initConfig(global) {
  const Flappy = global.Flappy || (global.Flappy = {});

  Flappy.CONFIG = {
    WIDTH: 360,
    HEIGHT: 640,
    TARGET_FPS: 60,
    MAX_DELTA: 1 / 30,
    GROUND_HEIGHT: 92,
    PLAYER: {
      X: 98,
      WIDTH: 34,
      HEIGHT: 24,
      START_Y: 300,
      GRAVITY: 1450,
      FLAP_IMPULSE: -430,
      MAX_FALL_SPEED: 900,
      MAX_RISE_SPEED: -520
    },
    PIPES: {
      WIDTH: 64,
      GAP_HEIGHT: 170,
      SPEED: 170,
      SPAWN_X: 360,
      SPAWN_INTERVAL: 1.35,
      MIN_GAP_Y: 160,
      MAX_GAP_Y: 430
    },
    INPUT: {
      COOLDOWN_MS: 90
    },
    COLORS: {
      SKY_TOP: "#7ec9f9",
      SKY_BOTTOM: "#d8f2ff",
      CLOUD: "rgba(255, 255, 255, 0.8)",
      PIPE: "#27b048",
      PIPE_SHADE: "#1c8b39",
      PIPE_CAP: "#2ed256",
      GROUND: "#d2a15f",
      GROUND_LINE: "#8e6537",
      BIRD: "#ffd43b",
      BIRD_WING: "#ffb703",
      BIRD_EYE: "#1d1d1d",
      TEXT_MAIN: "#ffffff",
      TEXT_SHADOW: "rgba(0, 0, 0, 0.5)",
      OVERLAY: "rgba(17, 25, 38, 0.42)"
    }
  };
})(window);
