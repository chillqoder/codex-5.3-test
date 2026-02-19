(function initCollision(global) {
  const Flappy = global.Flappy;

  function overlaps(aX, aY, aW, aH, bX, bY, bW, bH) {
    return aX < bX + bW && aX + aW > bX && aY < bY + bH && aY + aH > bY;
  }

  function checkPipeCollisions(playerBounds, pipes, pipeConfig, worldHeight, groundHeight) {
    const gapHalf = pipeConfig.GAP_HEIGHT / 2;
    const playableHeight = worldHeight - groundHeight;

    for (let i = 0; i < pipes.length; i += 1) {
      const pipe = pipes[i];
      const x = pipe.x;

      const topHeight = pipe.gapY - gapHalf;
      const bottomY = pipe.gapY + gapHalf;
      const bottomHeight = playableHeight - bottomY;

      const hitsTop = overlaps(
        playerBounds.x,
        playerBounds.y,
        playerBounds.width,
        playerBounds.height,
        x,
        0,
        pipeConfig.WIDTH,
        topHeight
      );

      if (hitsTop) {
        return true;
      }

      const hitsBottom = overlaps(
        playerBounds.x,
        playerBounds.y,
        playerBounds.width,
        playerBounds.height,
        x,
        bottomY,
        pipeConfig.WIDTH,
        bottomHeight
      );

      if (hitsBottom) {
        return true;
      }
    }

    return false;
  }

  Flappy.checkPipeCollisions = checkPipeCollisions;
})(window);
