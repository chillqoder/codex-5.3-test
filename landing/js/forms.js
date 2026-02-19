(function () {
  // Замените endpoint на ваш Formspree URL или другой API-адрес для приема заявок.
  const FALLBACK_ENDPOINT = "https://formspree.io/f/your-form-id";

  function getFocusableElements(root) {
    return Array.from(
      root.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => !el.hasAttribute("hidden"));
  }

  function createModalController(modal) {
    if (!modal) {
      return {
        open() {},
        close() {},
      };
    }

    let previousFocus = null;

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    }

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(modal);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function openModal() {
      previousFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";

      const focusable = getFocusableElements(modal);
      if (focusable.length) {
        focusable[0].focus();
      }

      document.addEventListener("keydown", onKeyDown);
    }

    modal.querySelectorAll("[data-close-modal]").forEach((node) => {
      node.addEventListener("click", closeModal);
    });

    return {
      open: openModal,
      close: closeModal,
    };
  }

  function extractFormData(form) {
    const nameField = form.elements.namedItem("name");
    const emailField = form.elements.namedItem("email");
    const ideaField = form.elements.namedItem("idea");
    const consentField = form.elements.namedItem("consent");

    return {
      name: (nameField && typeof nameField.value === "string" ? nameField.value : "").trim(),
      email: (emailField && typeof emailField.value === "string" ? emailField.value : "").trim(),
      idea: (ideaField && typeof ideaField.value === "string" ? ideaField.value : "").trim(),
      consent: Boolean(consentField && "checked" in consentField ? consentField.checked : false),
    };
  }

  function validatePayload(payload) {
    const errors = {};

    if (payload.name.length < 2) {
      errors.name = "Введите имя (минимум 2 символа).";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(payload.email)) {
      errors.email = "Введите корректный Email.";
    }

    if (payload.idea.length < 10) {
      errors.idea = "Добавьте краткое описание идеи (минимум 10 символов).";
    }

    if (!payload.consent) {
      errors.consent = "Необходимо подтвердить согласие.";
    }

    return errors;
  }

  function clearErrors(form) {
    form.querySelectorAll("[data-error-for]").forEach((node) => {
      node.textContent = "";
    });
  }

  function showErrors(form, errors) {
    Object.keys(errors).forEach((field) => {
      const node = form.querySelector(`[data-error-for="${field}"]`);
      if (node) {
        node.textContent = errors[field];
      }
    });
  }

  async function submitLead(endpoint, payload) {
    const isPlaceholderEndpoint =
      !endpoint || endpoint === FALLBACK_ENDPOINT || endpoint.includes("your-form-id");

    if (isPlaceholderEndpoint) {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
      return { mocked: true };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json().catch(() => ({}));
  }

  function initLeadForm(formId, modalId) {
    const form = document.getElementById(formId);
    if (!form) {
      return;
    }

    const statusNode = form.querySelector("#form-status");
    const submitButton = form.querySelector('button[type="submit"]');
    const endpoint = (form.getAttribute("data-endpoint") || FALLBACK_ENDPOINT).trim();
    const modalController = createModalController(document.getElementById(modalId));

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      clearErrors(form);
      if (statusNode) {
        statusNode.textContent = "";
      }

      const payload = extractFormData(form);
      const errors = validatePayload(payload);

      if (Object.keys(errors).length > 0) {
        showErrors(form, errors);
        if (statusNode) {
          statusNode.textContent = "Проверьте поля формы и попробуйте снова.";
        }
        return;
      }

      if (submitButton) {
        submitButton.disabled = true;
      }
      if (statusNode) {
        statusNode.textContent = "Отправляем заявку...";
      }

      try {
        await submitLead(endpoint, payload);
        form.reset();
        if (statusNode) {
          statusNode.textContent = "";
        }
        modalController.open();
      } catch (_error) {
        if (statusNode) {
          statusNode.textContent = "Не удалось отправить форму. Попробуйте позже.";
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  }

  window.MVPBotForms = {
    initLeadForm,
  };
})();
