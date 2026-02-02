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

  let activeModal = null;

  const openModal = (modal) => {
    if (!modal) {
      return;
    }
    activeModal = modal;
    modal.classList.add("is-active");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");
    const closeButton = modal.querySelector(".modal-close");
    if (closeButton) {
      closeButton.focus();
    }
  };

  const closeModal = () => {
    if (!activeModal) {
      return;
    }
    activeModal.classList.remove("is-active");
    activeModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overlay-open");
    activeModal = null;
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAllDropdowns();
      closeOverlay();
      closeModal();
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

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-modal-target]");
    if (trigger) {
      event.preventDefault();
      const modalId = trigger.getAttribute("data-modal-target");
      const modal = document.getElementById(modalId);
      openModal(modal);
      return;
    }

    if (event.target.matches("[data-modal-close='true']")) {
      closeModal();
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

  const toast = document.getElementById("toast");

  const showToast = (message) => {
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toast._timer);
    toast._timer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1600);
  };

  const englishGrid = document.getElementById("englishGrid");
  const chineseGrid = document.getElementById("chineseGrid");
  const trackSearch = document.getElementById("trackSearch");
  const sortFilter = document.getElementById("sortFilter");

  const renderAlbumPage = () => {
    if (!englishGrid || !chineseGrid) {
      return;
    }

    fetch("./data/tracks.json")
      .then((response) => response.json())
      .then((tracks) => {
        const renderTracks = () => {
          const query = (trackSearch?.value || "").toLowerCase().trim();
          const sortValue = sortFilter?.value || "az";

          const filtered = tracks.filter((track) => {
            const haystack = [track.title, track.style, ...(track.tags || [])]
              .join(" ")
              .toLowerCase();
            return !query || haystack.includes(query);
          });

          const sorted = [...filtered].sort((a, b) => {
            const comparison = (a.title || "").localeCompare(b.title || "");
            return sortValue === "za" ? -comparison : comparison;
          });

          const renderGrid = (list, target) => {
            target.innerHTML = list
              .map((track) => {
                const styleLine = track.style ? `<p>${track.style}</p>` : "";
                const tags = (track.tags || [])
                  .map((tag) => `<span class="xp-tag">${tag}</span>`)
                  .join("");
                const tagsRow = tags ? `<div class="xp-tags track-tags">${tags}</div>` : "";
                return `
                  <div class="card">
                    <h3>${track.title}</h3>
                    ${styleLine}
                    ${tagsRow}
                    <div class="card-links">
                      <a href="${track.sunoUrl}" target="_blank" rel="noreferrer">Play</a>
                      <button class="link-button" type="button" data-copy="${track.sunoUrl}">Copy link</button>
                    </div>
                  </div>
                `;
              })
              .join("");
          };

          renderGrid(sorted.filter((track) => track.language === "en"), englishGrid);
          renderGrid(sorted.filter((track) => track.language === "zh"), chineseGrid);
        };

        renderTracks();
        trackSearch?.addEventListener("input", renderTracks);
        sortFilter?.addEventListener("change", renderTracks);

        document.addEventListener("click", (event) => {
          const copyButton = event.target.closest("[data-copy]");
          if (!copyButton) {
            return;
          }
          const url = copyButton.getAttribute("data-copy");
          if (!url) {
            return;
          }
          navigator.clipboard
            .writeText(url)
            .then(() => showToast("Copied"))
            .catch(() => showToast("Copy failed"));
        });
      })
      .catch(() => {
        englishGrid.innerHTML = "<p>Unable to load tracks.</p>";
        chineseGrid.innerHTML = "<p>Unable to load tracks.</p>";
      });
  };

  renderAlbumPage();

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
