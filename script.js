(() => {
  const ALBUM = {
    sunoProfile: "https://suno.com/@dandelionlive",
    tracks: [
      {
        id: "track-001",
        title: "REPLACE_ME",
        style: "REPLACE_ME",
        tags: ["REPLACE_ME", "REPLACE_ME"],
        sunoUrl: "https://suno.com/....",
        lyrics: "REPLACE_ME"
      }
    ],
    playlists: [
      {
        title: "REPLACE_ME",
        description: "REPLACE_ME",
        url: "https://suno.com/..."
      }
    ]
  };

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
      closeLyricsOverlay();
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

  const lyricsOverlay = document.getElementById("lyricsOverlay");
  const lyricsTitle = document.getElementById("lyricsTitle");
  const lyricsBody = document.getElementById("lyricsBody");
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

  function openLyricsOverlay(title, lyrics) {
    if (!lyricsOverlay) {
      return;
    }
    lyricsTitle.textContent = title || "";
    lyricsBody.textContent = lyrics || "";
    lyricsOverlay.classList.add("is-active");
    lyricsOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("overlay-open");
    const closeButton = lyricsOverlay.querySelector(".overlay-close");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function closeLyricsOverlay() {
    if (!lyricsOverlay) {
      return;
    }
    lyricsOverlay.classList.remove("is-active");
    lyricsOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overlay-open");
  }

  if (lyricsOverlay) {
    lyricsOverlay.addEventListener("click", (event) => {
      if (event.target.matches("[data-overlay-close='true']")) {
        const targetHash = lyricsOverlay.getAttribute("data-close-target");
        if (targetHash) {
          window.location.hash = targetHash;
        } else {
          window.location.hash = "";
        }
      }
    });
  }

  const albumGrid = document.getElementById("trackGrid");
  const playlistGrid = document.getElementById("playlistGrid");
  const trackSearch = document.getElementById("trackSearch");
  const tagFilter = document.getElementById("tagFilter");
  const sortFilter = document.getElementById("sortFilter");

  const renderAlbumPage = () => {
    if (!albumGrid) {
      return;
    }

    const tracksWithIndex = ALBUM.tracks.map((track, index) => ({
      ...track,
      _index: index
    }));

    const uniqueTags = new Set();
    tracksWithIndex.forEach((track) => {
      (track.tags || []).forEach((tag) => uniqueTags.add(tag));
    });

    if (tagFilter) {
      uniqueTags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
      });
    }

    const renderTracks = () => {
      const query = (trackSearch?.value || "").toLowerCase().trim();
      const selectedTag = tagFilter?.value || "all";
      const sortValue = sortFilter?.value || "az";

      let filtered = tracksWithIndex.filter((track) => {
        const haystack = [
          track.title,
          track.style,
          ...(track.tags || [])
        ]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        const matchesTag = selectedTag === "all" || (track.tags || []).includes(selectedTag);
        return matchesQuery && matchesTag;
      });

      if (sortValue === "newest") {
        filtered = filtered.sort((a, b) => {
          if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
          }
          return b._index - a._index;
        });
      } else {
        filtered = filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      }

      albumGrid.innerHTML = filtered
        .map((track) => {
          const tags = (track.tags || [])
            .map((tag) => `<span class="xp-tag">${tag}</span>`)
            .join("");
          return `
            <div class="card">
              <h3>${track.title}</h3>
              <p>${track.style}</p>
              <div class="xp-tags">${tags}</div>
              <div class="card-links">
                <a href="${track.sunoUrl}" target="_blank" rel="noreferrer">Play on Suno</a>
                <button class="link-button" type="button" data-lyrics="${track.id}">Lyrics</button>
                <button class="link-button" type="button" data-share="${track.id}">Share</button>
              </div>
            </div>
          `;
        })
        .join("");
    };

    renderTracks();

    trackSearch?.addEventListener("input", renderTracks);
    tagFilter?.addEventListener("change", renderTracks);
    sortFilter?.addEventListener("change", renderTracks);

    albumGrid.addEventListener("click", (event) => {
      const lyricsButton = event.target.closest("[data-lyrics]");
      const shareButton = event.target.closest("[data-share]");
      if (lyricsButton) {
        const trackId = lyricsButton.getAttribute("data-lyrics");
        const track = tracksWithIndex.find((item) => item.id === trackId);
        if (track) {
          openLyricsOverlay(track.title, track.lyrics);
        }
        return;
      }
      if (shareButton) {
        const trackId = shareButton.getAttribute("data-share");
        const track = tracksWithIndex.find((item) => item.id === trackId);
        if (track) {
          navigator.clipboard
            .writeText(track.sunoUrl)
            .then(() => showToast("Copied"))
            .catch(() => showToast("Copy failed"));
        }
      }
    });

    if (playlistGrid) {
      playlistGrid.innerHTML = ALBUM.playlists
        .map(
          (playlist) => `
          <div class="card">
            <h3>${playlist.title}</h3>
            <p>${playlist.description}</p>
            <div class="card-links">
              <a href="${playlist.url}" target="_blank" rel="noreferrer">View playlist</a>
            </div>
          </div>
        `
        )
        .join("");
    }
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
