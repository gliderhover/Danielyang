(() => {
  "use strict";

  const CONFIG = window.ASK_DANIEL_CONFIG || {};
  const ENDPOINT = (CONFIG.endpoint || "").trim();
  const KNOWLEDGE_URL = "./knowledge/profile.md";

  /* ---------------- copy ---------------- */
  const TEXT = {
    en: {
      headline: "What do you want to know about me?",
      lede: "I'm an AI version of Daniel Yang, built from his résumé and projects. Ask out loud or type.",
      classic: "Classic site",
      soundOn: "Voice on",
      soundOff: "Voice off",
      soundTitle: "Read answers aloud",
      styleLegend: "Answer style",
      inputLabel: "Your question",
      placeholder: "Type a question…",
      ask: "Ask",
      micStart: "Ask by voice",
      micStop: "Stop listening",
      listening: "Listening… tap the mic again when you're done.",
      thinking: "Thinking…",
      speaking: "Speaking. Tap the mic to interrupt.",
      replay: "Play again",
      noMic: "Voice input works in Chrome, Edge and Safari. You can type your question here.",
      micBlocked: "Microphone access is blocked. Allow it in your browser's site settings, or type your question.",
      noSpeech: "I didn't catch that. Tap the mic and try again.",
      offlineNote: "The live AI isn't connected, so here's the closest part of my profile:",
      nothingFound: "I don't have that detail here. You can email me at daniel.yang.zy349@yale.edu.",
      styles: { disciplined: "Disciplined", humorous: "Humorous", passionate: "Passionate", casual: "Casual" },
      starters: [
        "Tell me about yourself",
        "Why should we hire you?",
        "Walk me through a deal you worked on",
        "What AI agents have you built?",
        "What are you building on the side?",
      ],
      speechLang: "en-US",
    },
    zh: {
      headline: "你想了解我什么？",
      lede: "我是 Daniel Yang 的 AI 分身，根据他的简历和项目打造。直接说出来，或者打字提问。",
      classic: "经典版网站",
      soundOn: "语音开",
      soundOff: "语音关",
      soundTitle: "朗读回答",
      styleLegend: "回答风格",
      inputLabel: "你的问题",
      placeholder: "输入你的问题……",
      ask: "提问",
      micStart: "语音提问",
      micStop: "停止聆听",
      listening: "正在聆听……说完后再点一下麦克风。",
      thinking: "思考中……",
      speaking: "正在朗读，点麦克风可打断。",
      replay: "再听一遍",
      noMic: "语音输入支持 Chrome、Edge 和 Safari。你也可以在这里打字提问。",
      micBlocked: "麦克风权限被阻止。请在浏览器的网站设置中允许，或直接打字提问。",
      noSpeech: "没听清，请点麦克风再试一次。",
      offlineNote: "AI 暂未连接，以下是我资料中最相关的部分：",
      nothingFound: "这里没有这方面的信息，可以发邮件给我：daniel.yang.zy349@yale.edu。",
      styles: { disciplined: "严谨", humorous: "幽默", passionate: "热情", casual: "随意" },
      starters: ["请先做个自我介绍", "我们为什么要录用你？", "讲讲你参与过的一笔交易", "你做过哪些 AI 智能体？", "你业余在做什么项目？"],
      speechLang: "zh-CN",
    },
  };

  /* ---------------- state ---------------- */
  const state = {
    lang: "en",
    style: "disciplined",
    voiceOn: true,
    history: [], // {role, content}
    busy: false,
    listening: false,
    energy: 0, // drives the skyline
    mode: "idle", // idle | listening | thinking | speaking
  };

  const prefs = (() => {
    try {
      return JSON.parse(localStorage.getItem("ask-daniel") || "{}");
    } catch {
      return {};
    }
  })();
  if (prefs.lang && TEXT[prefs.lang]) state.lang = prefs.lang;
  if (prefs.style && TEXT.en.styles[prefs.style]) state.style = prefs.style;
  if (typeof prefs.voiceOn === "boolean") state.voiceOn = prefs.voiceOn;
  const savePrefs = () => {
    try {
      localStorage.setItem("ask-daniel", JSON.stringify({ lang: state.lang, style: state.style, voiceOn: state.voiceOn }));
    } catch {
      /* storage unavailable; preferences just won't persist */
    }
  };

  /* ---------------- elements ---------------- */
  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const transcript = $("transcript");
  const starters = $("starters");
  const stylesEl = $("styles");
  const form = $("composer");
  const input = $("question");
  const askBtn = $("ask");
  const micBtn = $("mic");
  const soundBtn = $("sound");
  const statusEl = $("status");
  const t = () => TEXT[state.lang];

  const setStatus = (msg, isError = false) => {
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", !!isError);
  };

  /* ---------------- rendering ---------------- */
  function renderChrome() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      if (key === "soundOn") return;
      if (t()[key]) el.textContent = t()[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t()[el.dataset.i18nPlaceholder]));
    document.querySelectorAll("[data-i18n-title]").forEach((el) => (el.title = t()[el.dataset.i18nTitle]));
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));

    soundBtn.setAttribute("aria-pressed", String(state.voiceOn));
    soundBtn.querySelector("span").textContent = state.voiceOn ? t().soundOn : t().soundOff;
    micBtn.setAttribute("aria-label", state.listening ? t().micStop : t().micStart);

    stylesEl.innerHTML = "";
    Object.entries(t().styles).forEach(([key, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      b.setAttribute("aria-pressed", String(key === state.style));
      b.addEventListener("click", () => {
        state.style = key;
        savePrefs();
        renderChrome();
      });
      stylesEl.appendChild(b);
    });

    starters.innerHTML = "";
    t().starters.forEach((q) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", () => ask(q));
      starters.appendChild(b);
    });
  }

  function addTurn(question) {
    stage.classList.add("has-conversation");
    const li = document.createElement("li");
    li.className = "turn";
    const q = document.createElement("p");
    q.className = "turn-q";
    q.textContent = question;
    const tag = document.createElement("span");
    tag.className = "style-tag";
    tag.textContent = t().styles[state.style];
    q.appendChild(tag);
    const a = document.createElement("p");
    a.className = "turn-a is-thinking";
    li.append(q, a);
    transcript.appendChild(li);
    li.scrollIntoView({ behavior: "smooth", block: "start" });
    return { li, a };
  }

  function addReplay(li, text) {
    if (!("speechSynthesis" in window)) return;
    const wrap = document.createElement("div");
    wrap.className = "turn-actions";
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t().replay;
    b.addEventListener("click", () => {
      speech.cancel();
      speech.enqueue(text, true);
    });
    wrap.appendChild(b);
    li.appendChild(wrap);
  }

  /* ---------------- speech output ---------------- */
  const speech = (() => {
    const synth = window.speechSynthesis;
    let queue = [];
    let speaking = false;
    let voice = null;

    const preferred = {
      en: [/Andrew.*Natural/i, /Guy.*Natural/i, /Brian.*Natural/i, /Christopher.*Natural/i, /^Daniel/i, /Google US English/i, /Aaron/i, /Alex/i, /English.*Male/i],
      zh: [/Yunxi/i, /Yunyang/i, /Yunjian/i, /Xiaoxiao/i, /Google 普通话/i, /Tingting/i, /Li-mu/i, /zh-CN/i],
    };

    function pickVoice() {
      if (!synth) return null;
      const voices = synth.getVoices();
      const langPrefix = state.lang === "zh" ? "zh" : "en";
      const pool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
      for (const re of preferred[state.lang]) {
        const hit = pool.find((v) => re.test(v.name) || re.test(v.lang));
        if (hit) return hit;
      }
      return pool[0] || null;
    }
    if (synth) synth.addEventListener?.("voiceschanged", () => (voice = pickVoice()));

    function next() {
      if (!queue.length) {
        speaking = false;
        if (state.mode === "speaking") setMode("idle");
        return;
      }
      speaking = true;
      setMode("speaking");
      const text = queue.shift();
      const u = new SpeechSynthesisUtterance(text);
      voice = pickVoice();
      if (voice) u.voice = voice;
      u.lang = t().speechLang;
      u.rate = 1.02;
      u.onboundary = () => (state.energy = Math.min(1, state.energy + 0.55));
      u.onstart = () => (state.energy = Math.min(1, state.energy + 0.6));
      u.onend = next;
      u.onerror = next;
      synth.speak(u);
    }

    return {
      enqueue(text, force = false) {
        if (!synth || (!state.voiceOn && !force)) return;
        const clean = text.replace(/\s+/g, " ").trim();
        if (!clean) return;
        queue.push(clean);
        if (!speaking) next();
      },
      cancel() {
        queue = [];
        speaking = false;
        if (synth) synth.cancel();
        if (state.mode === "speaking") setMode("idle");
      },
      get active() {
        return speaking;
      },
    };
  })();

  // Splits streamed text into speakable sentences.
  function sentenceSplitter(onSentence) {
    let buf = "";
    // English sentences end at punctuation followed by a space; Chinese ones end at 。！？
    const re = /^([\s\S]*?(?:[.!?…]+["'”’)]?(?=\s)|[。！？]+[”」]?))\s*/;
    return {
      push(chunk) {
        buf += chunk;
        let m;
        while ((m = buf.match(re))) {
          onSentence(m[1]);
          buf = buf.slice(m[0].length);
        }
      },
      flush() {
        if (buf.trim()) onSentence(buf);
        buf = "";
      },
    };
  }

  /* ---------------- speech input ---------------- */
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let finalText = "";

  if (!Recognition) {
    micBtn.hidden = true;
  }

  function startListening() {
    if (!Recognition) return setStatus(t().noMic);
    speech.cancel();
    finalText = "";
    recognizer = new Recognition();
    recognizer.lang = t().speechLang;
    recognizer.interimResults = true;
    recognizer.continuous = false;
    recognizer.maxAlternatives = 1;

    recognizer.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      input.value = (finalText + interim).trim();
      state.energy = Math.min(1, state.energy + 0.5);
    };
    recognizer.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setStatus(t().micBlocked, true);
      else if (e.error === "no-speech") setStatus(t().noSpeech);
    };
    recognizer.onend = () => {
      state.listening = false;
      micBtn.classList.remove("is-listening");
      micBtn.setAttribute("aria-label", t().micStart);
      if (state.mode === "listening") setMode("idle");
      const q = (finalText || input.value).trim();
      if (q) ask(q);
      else if (statusEl.textContent === t().listening) setStatus("");
    };

    try {
      recognizer.start();
      state.listening = true;
      micBtn.classList.add("is-listening");
      micBtn.setAttribute("aria-label", t().micStop);
      setMode("listening");
      setStatus(t().listening);
    } catch {
      setStatus(t().noMic);
    }
  }

  function stopListening() {
    if (recognizer) recognizer.stop();
  }

  micBtn.addEventListener("click", () => {
    if (state.listening) stopListening();
    else startListening();
  });

  /* ---------------- answering ---------------- */
  async function ask(raw) {
    const question = (raw || "").trim().slice(0, 600);
    if (!question || state.busy) return;
    speech.cancel();
    state.busy = true;
    askBtn.disabled = true;
    input.value = "";
    setStatus(t().thinking);
    setMode("thinking");

    const { li, a } = addTurn(question);
    state.history.push({ role: "user", content: question });

    let answer = "";
    const splitter = sentenceSplitter((s) => speech.enqueue(s));
    const write = (chunk) => {
      answer += chunk;
      a.textContent = answer;
      splitter.push(chunk);
    };

    try {
      if (!ENDPOINT) throw new Error("offline");
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: state.history, style: state.style, lang: state.lang }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        write(decoder.decode(value, { stream: true }));
      }
      if (!answer.trim()) throw new Error("empty");
    } catch (err) {
      if (!answer) {
        const local = await offlineAnswer(question);
        const note = document.createElement("span");
        note.className = "note";
        note.textContent = t().offlineNote;
        a.textContent = "";
        a.appendChild(note);
        const body = document.createTextNode("");
        a.appendChild(body);
        answer = local;
        body.textContent = local;
        splitter.push(local);
        if (ENDPOINT) console.warn("Ask Daniel endpoint failed:", err);
      }
    }

    splitter.flush();
    a.classList.remove("is-thinking");
    state.history.push({ role: "assistant", content: answer });
    addReplay(li, answer);
    state.busy = false;
    askBtn.disabled = false;
    if (state.mode === "thinking") setMode(speech.active ? "speaking" : "idle");
    setStatus(speech.active ? t().speaking : "");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (state.listening) stopListening();
    else ask(input.value);
  });

  /* ---------------- offline fallback ---------------- */
  let sectionsPromise = null;
  const STOP = new Set(
    "a an and are about at be can could did do does for from have how i in is it me my of on or so tell that the this to was what when where which who why with you your yours".split(" ")
  );
  const tokens = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9&一-鿿\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP.has(w))
      .map((w) => w.replace(/(ing|ed|es|s)$/, ""));

  const ALIASES = {
    career: "work experience role",
    job: "work experience role",
    "m&a": "acquisition diligence stantec",
    acquisition: "acquisition diligence stantec",
    ai: "agent openai",
    agent: "ai agents openai",
    side: "venture",
    startup: "venture",
    music: "suno track",
    song: "suno track",
    school: "education",
    study: "education",
    contact: "email",
    职业: "work experience role",
    经历: "work experience",
    并购: "acquisition diligence stantec",
    智能体: "ai agents",
    音乐: "music suno",
    项目: "venture ai agents",
    学校: "education",
    教育: "education",
    联系: "email contact",
  };

  function loadSections() {
    if (!sectionsPromise) {
      sectionsPromise = fetch(KNOWLEDGE_URL)
        .then((r) => (r.ok ? r.text() : ""))
        .then((md) => {
          const out = [];
          let cur = null;
          md.split("\n").forEach((line) => {
            const h = line.match(/^#{2,3}\s+(.*)/);
            if (h) {
              cur = { title: h[1], lines: [] };
              out.push(cur);
            } else if (cur && line.trim().startsWith("-")) {
              cur.lines.push(line.replace(/^\s*-\s*/, "").trim());
            }
          });
          return out.filter((s) => s.lines.length);
        })
        .catch(() => []);
    }
    return sectionsPromise;
  }

  async function offlineAnswer(question) {
    const sections = await loadSections();
    let q = question.toLowerCase();
    Object.entries(ALIASES).forEach(([k, v]) => {
      const hit = /[一-鿿]/.test(k)
        ? q.includes(k)
        : new RegExp(`(^|[^a-z])${k.replace(/[&]/g, "\\$&")}s?([^a-z]|$)`).test(q);
      if (hit) q += " " + v;
    });
    const qt = new Set(tokens(q));
    let best = null;
    let bestScore = 0;
    sections.forEach((s) => {
      const titleT = tokens(s.title);
      const bodyT = tokens(s.lines.join(" "));
      let score = 0;
      qt.forEach((w) => {
        if (titleT.includes(w)) score += 3;
        score += bodyT.filter((b) => b === w).length > 0 ? 1 : 0;
      });
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    });
    if (!best) best = sections.find((s) => /who i am/i.test(s.title));
    if (!best || bestScore === 0) {
      return best ? best.lines.slice(0, 3).join(" ") : t().nothingFound;
    }
    const lead = /—/.test(best.title) ? best.title.replace(/\s*\(.*\)\s*$/, "") + ". " : "";
    return (
      lead +
      best.lines
        .slice(0, 3)
        .map((l) => (/[.!?]$/.test(l) ? l : l + "."))
        .join(" ")
    );
  }

  /* ---------------- skyline ---------------- */
  const canvas = $("skyline");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let buildings = [];
  let dpr = 1;

  function seeded(seed) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  function layoutSkyline() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const rand = seeded(349);
    buildings = [];
    let x = -6;
    while (x < w + 10) {
      const bw = 16 + Math.floor(rand() * 40);
      const gap = rand() < 0.25 ? 4 + Math.floor(rand() * 12) : 0;
      buildings.push({
        x,
        w: bw,
        base: 0.18 + rand() * 0.6,
        roof: rand() < 0.18 ? "gable" : rand() < 0.3 ? "setback" : rand() < 0.15 ? "spire" : "flat",
        windows: rand() < 0.55,
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 1.4,
      });
      x += bw + gap;
    }
  }

  // keep the transcript clear of the fixed dock, whatever its height
  const dock = document.querySelector(".dock");
  const syncDock = () => document.documentElement.style.setProperty("--dock-h", dock.offsetHeight + "px");
  if ("ResizeObserver" in window) new ResizeObserver(syncDock).observe(dock);
  syncDock();

  function setMode(mode) {
    state.mode = mode;
  }

  function strokeColor() {
    const css = getComputedStyle(document.documentElement);
    if (state.mode === "listening") return css.getPropertyValue("--redline").trim();
    if (state.mode === "speaking" || state.mode === "thinking") return css.getPropertyValue("--draft").trim();
    return css.getPropertyValue("--pencil").trim();
  }

  let last = performance.now();
  function draw(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // energy decays; thinking keeps a slow sweep going
    state.energy = Math.max(0, state.energy - dt * 1.6);
    const time = now / 1000;
    const still = reduceMotion.matches;

    ctx.lineWidth = 1.25;
    ctx.strokeStyle = strokeColor();
    ctx.lineJoin = "miter";

    buildings.forEach((b, i) => {
      let lift = 0;
      if (!still) {
        if (state.mode === "thinking") {
          lift = 0.18 * Math.max(0, Math.sin(time * 3 - i * 0.35));
        } else if (state.mode !== "idle") {
          lift = state.energy * (0.25 + 0.35 * Math.abs(Math.sin(time * b.speed * 4 + b.phase)));
        }
      }
      const bh = Math.min(h - 6, (b.base + lift) * (h - 10));
      const top = h - bh;
      const x = b.x + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, h);
      if (b.roof === "gable") {
        ctx.lineTo(x, top + 8);
        ctx.lineTo(x + b.w / 2, top);
        ctx.lineTo(x + b.w, top + 8);
      } else if (b.roof === "setback") {
        const inset = Math.min(8, b.w / 4);
        ctx.lineTo(x, top + 10);
        ctx.lineTo(x + inset, top + 10);
        ctx.lineTo(x + inset, top);
        ctx.lineTo(x + b.w - inset, top);
        ctx.lineTo(x + b.w - inset, top + 10);
        ctx.lineTo(x + b.w, top + 10);
      } else if (b.roof === "spire") {
        ctx.lineTo(x, top);
        ctx.lineTo(x + b.w / 2 - 1, top);
        ctx.moveTo(x + b.w / 2, top);
        ctx.lineTo(x + b.w / 2, Math.max(2, top - 12));
        ctx.moveTo(x + b.w / 2 + 1, top);
        ctx.lineTo(x + b.w, top);
      } else {
        ctx.lineTo(x, top);
        ctx.lineTo(x + b.w, top);
      }
      ctx.lineTo(x + b.w, h);
      ctx.stroke();

      if (b.windows && bh > 24 && b.w > 20) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        for (let y = top + 14; y < h - 6; y += 9) {
          ctx.moveTo(x + 5, y + 0.5);
          ctx.lineTo(x + b.w - 5, y + 0.5);
        }
        ctx.stroke();
        ctx.restore();
      }
    });

    requestAnimationFrame(draw);
  }

  /* ---------------- controls ---------------- */
  document.querySelectorAll(".lang button").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.lang === b.dataset.lang) return;
      speech.cancel();
      state.lang = b.dataset.lang;
      savePrefs();
      renderChrome();
    })
  );

  soundBtn.addEventListener("click", () => {
    state.voiceOn = !state.voiceOn;
    if (!state.voiceOn) speech.cancel();
    savePrefs();
    renderChrome();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      speech.cancel();
      if (state.listening) stopListening();
      setStatus("");
    }
  });

  if (!Recognition) setStatus(t().noMic);
  renderChrome();
  layoutSkyline();
  window.addEventListener("resize", layoutSkyline);
  requestAnimationFrame(draw);
  loadSections();
})();
