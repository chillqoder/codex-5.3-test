(function () {
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function prefersReducedMotion() {
    return reducedMotionQuery.matches;
  }

  function initRevealAnimations() {
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    if (!revealItems.length) {
      return;
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealItems.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((node) => observer.observe(node));
  }

  function initHeroCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || prefersReducedMotion()) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let width = 0;
    let height = 0;
    let particles = [];
    let rafId = 0;

    const particleCount = 34;

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = new Array(particleCount).fill(0).map(() => ({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.28, 0.28),
        vy: random(-0.22, 0.22),
        size: random(1.4, 3.2),
      }));
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist > 120) {
            continue;
          }

          const alpha = 1 - dist / 120;
          ctx.strokeStyle = `rgba(126, 231, 198, ${alpha * 0.18})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x <= 0 || particle.x >= width) {
          particle.vx *= -1;
        }
        if (particle.y <= 0 || particle.y >= height) {
          particle.vy *= -1;
        }

        ctx.fillStyle = "rgba(45, 212, 191, 0.8)";
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      drawConnections();
      rafId = window.requestAnimationFrame(animate);
    }

    resize();
    animate();

    window.addEventListener("resize", resize);
    window.addEventListener("beforeunload", () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    });
  }

  function initOptionalLottie(selector) {
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length || prefersReducedMotion()) {
      return;
    }

    const scriptUrl = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";
    let scriptPromise;

    function loadScript() {
      if (window.lottie) {
        return Promise.resolve(window.lottie);
      }

      if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = scriptUrl;
          script.async = true;
          script.onload = () => resolve(window.lottie);
          script.onerror = () => reject(new Error("Не удалось загрузить lottie-web"));
          document.head.appendChild(script);
        });
      }

      return scriptPromise;
    }

    if (!("IntersectionObserver" in window)) {
      loadScript()
        .then((lottie) => {
          elements.forEach((node) => {
            lottie.loadAnimation({
              container: node,
              renderer: "svg",
              loop: true,
              autoplay: true,
              path: node.getAttribute("data-lottie-src"),
            });
          });
        })
        .catch(() => {});
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const node = entry.target;
        loadScript()
          .then((lottie) => {
            lottie.loadAnimation({
              container: node,
              renderer: "svg",
              loop: true,
              autoplay: true,
              path: node.getAttribute("data-lottie-src"),
            });
          })
          .catch(() => {});

        obs.unobserve(node);
      });
    });

    elements.forEach((node) => observer.observe(node));
  }

  window.MVPBotAnimations = {
    initRevealAnimations,
    initHeroCanvas,
    initOptionalLottie,
    prefersReducedMotion,
  };
})();
