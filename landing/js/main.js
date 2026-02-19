(function () {
  function initMobileNav() {
    const header = document.querySelector(".site-header");
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("site-nav");
    if (!header || !toggle || !nav) {
      return;
    }

    function closeNav() {
      header.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("click", (event) => {
      if (!header.classList.contains("nav-open")) {
        return;
      }
      if (!header.contains(event.target)) {
        closeNav();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeNav();
      }
    });
  }

  function initFaq() {
    const items = Array.from(document.querySelectorAll(".faq-item"));
    if (!items.length) {
      return;
    }

    items.forEach((item) => {
      const button = item.querySelector(".faq-question");
      if (!button) {
        return;
      }

      button.addEventListener("click", () => {
        const open = item.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(open));
      });
    });
  }

  function initSmoothAnchorFocus() {
    const links = Array.from(document.querySelectorAll('a[href^="#"]'));
    links.forEach((link) => {
      link.addEventListener("click", () => {
        const targetId = link.getAttribute("href");
        if (!targetId || targetId === "#") {
          return;
        }

        const target = document.querySelector(targetId);
        if (!target) {
          return;
        }

        window.setTimeout(() => {
          if (!target.hasAttribute("tabindex")) {
            target.setAttribute("tabindex", "-1");
          }
          target.focus({ preventScroll: true });
        }, 180);
      });
    });
  }

  function initApp() {
    initMobileNav();
    initFaq();
    initSmoothAnchorFocus();

    if (window.MVPBotUtils) {
      window.MVPBotUtils.renderTokenCalculation("[data-token-calc]", 990);
    }

    if (window.MVPBotAnimations) {
      window.MVPBotAnimations.initRevealAnimations();
      window.MVPBotAnimations.initHeroCanvas("hero-canvas");
      window.MVPBotAnimations.initOptionalLottie("[data-lottie-src]");
    }

    if (window.MVPBotForms) {
      window.MVPBotForms.initLeadForm("lead-form", "success-modal");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
