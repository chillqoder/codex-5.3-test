(function initInput(global) {
  const Flappy = global.Flappy;

  class InputManager {
    constructor(element, inputConfig) {
      this.element = element;
      this.cooldownMs = inputConfig.COOLDOWN_MS;
      this.pendingAction = false;
      this.lastInputTime = -Infinity;
      this.isAttached = false;

      this.onPointerDown = this.onPointerDown.bind(this);
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
    }

    attach() {
      if (this.isAttached) {
        return;
      }

      this.element.addEventListener("pointerdown", this.onPointerDown);
      this.element.addEventListener("touchstart", this.onTouchStart, { passive: false });
      window.addEventListener("keydown", this.onKeyDown);

      this.isAttached = true;
    }

    detach() {
      if (!this.isAttached) {
        return;
      }

      this.element.removeEventListener("pointerdown", this.onPointerDown);
      this.element.removeEventListener("touchstart", this.onTouchStart);
      window.removeEventListener("keydown", this.onKeyDown);

      this.isAttached = false;
    }

    onPointerDown(event) {
      event.preventDefault();
      this.queueAction();
    }

    onTouchStart(event) {
      event.preventDefault();
      this.queueAction();
    }

    onKeyDown(event) {
      if (event.code !== "Space" || event.repeat) {
        return;
      }

      event.preventDefault();
      this.queueAction();
    }

    queueAction() {
      const now = performance.now();
      if (now - this.lastInputTime < this.cooldownMs) {
        return;
      }

      this.lastInputTime = now;
      this.pendingAction = true;
    }

    consumeAction() {
      if (!this.pendingAction) {
        return false;
      }

      this.pendingAction = false;
      return true;
    }
  }

  Flappy.InputManager = InputManager;
})(window);
