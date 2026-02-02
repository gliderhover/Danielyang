(() => {
  const dropdowns = document.querySelectorAll(".nav-dropdown");
  const closeAllDropdowns = () => {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("is-open");
      const toggle = dropdown.querySelector(".nav-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  };

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".nav-toggle");
    if (!toggle) {
      return;
    }
    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = dropdown.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown")) {
      closeAllDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllDropdowns();
      closeOverlay();
    }
  });

  const smoothScrollToHash = (hash) => {
    const target = document.querySelector(hash);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }
    const url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname && url.hash) {
      event.preventDefault();
      history.pushState(null, "", url.hash);
      smoothScrollToHash(url.hash);
      closeAllDropdowns();
    }
  });

  window.addEventListener("load", () => {
    if (window.location.hash) {
      setTimeout(() => smoothScrollToHash(window.location.hash), 0);
    }
  });

  const isHomepage = Boolean(document.getElementById("education"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const menuLinks = Array.from(document.querySelectorAll(".nav-menu a[href*='#']"));

  if (isHomepage && sections.length && menuLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          const id = entry.target.getAttribute("id");
          menuLinks.forEach((link) => {
            const match = link.getAttribute("href").endsWith(`#${id}`);
            link.classList.toggle("is-active", match);
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const overlay = document.getElementById("projectOverlay");
  const overlayDataTag = document.getElementById("overlay-data");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayBody = document.getElementById("overlayBody");
  const overlayLinks = document.getElementById("overlayLinks");
  const overlayArticles = document.getElementById("overlayArticles");
  let overlayData = null;
  let lastFocused = null;

  if (overlayDataTag) {
    try {
      overlayData = JSON.parse(overlayDataTag.textContent);
    } catch (error) {
      overlayData = null;
    }
  }

  function openOverlay(projectId) {
    if (!overlay || !overlayData || !overlayData.items || !overlayData.items[projectId]) {
      return;
    }
    const data = overlayData.items[projectId];
    overlayTitle.textContent = data.title || "";
    overlayBody.innerHTML = (data.details || [])
      .map((detail) => `<p>${detail}</p>`)
      .join("");
    overlayLinks.innerHTML = (data.links || [])
      .map(
        (link) =>
          `<a class="overlay-button" href="${link.url}" target="_blank" rel="noreferrer">${link.label}</a>`
      )
      .join("");
    overlayArticles.innerHTML = (data.articles || [])
      .map(
        (article) =>
          `<li><a href="${article.url}" target="_blank" rel="noreferrer">${article.label}</a></li>`
      )
      .join("");

    lastFocused = document.activeElement;
    overlay.classList.add("is-active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");
    const closeButton = overlay.querySelector(".overlay-close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeOverlay() {
    if (!overlay) {
      return;
    }
    overlay.classList.remove("is-active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overlay-open");
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function handleOverlayRoute() {
    if (!overlayData || !overlayData.items) {
      return;
    }
    const hash = window.location.hash.replace("#", "");
    if (hash && overlayData.items[hash]) {
      openOverlay(hash);
    } else {
      closeOverlay();
    }
  }

  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target.matches("[data-overlay-close='true']")) {
        const targetHash = overlay.getAttribute("data-close-target");
        if (targetHash) {
          window.location.hash = targetHash;
        } else {
          window.location.hash = "";
        }
      }
    });

    window.addEventListener("hashchange", handleOverlayRoute);
    window.addEventListener("load", handleOverlayRoute);
  }

  const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const xpItems = document.querySelectorAll(".xp");

  const closeOtherXp = (current) => {
    xpItems.forEach((item) => {
      if (item !== current) {
        item.removeAttribute("open");
      }
    });
  };

  const enableHoverOpen = () => {
    xpItems.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        if (!item.hasAttribute("open")) {
          item.setAttribute("open", "open");
        }
      });
      item.addEventListener("mouseleave", () => {
        item.removeAttribute("open");
      });
      item.addEventListener("toggle", () => {
        if (item.hasAttribute("open")) {
          closeOtherXp(item);
        }
      });
    });
  };

  if (supportsHover.matches) {
    enableHoverOpen();
  }
})();
