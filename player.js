/* Shared radio player logic for Lex×Sam JA #367 */
(function () {
  const CDN = "https://cdn.jsdelivr.net/gh/furoku/lex-sam-ja-radio@main/";
  const CHAPTERS = [
    { id: "ch01", title: "第1章", src: CDN + "audio/ch01.mp3", sub: "0:00 – 12:00" },
    { id: "ch02", title: "第2章", src: CDN + "audio/ch02.mp3", sub: "12:00 – 24:00" },
    { id: "ch03", title: "第3章", src: CDN + "audio/ch03.mp3", sub: "24:00 – 36:00" },
    { id: "ch04", title: "第4章", src: CDN + "audio/ch04.mp3", sub: "36:00 – 48:00" },
    { id: "ch05", title: "第5章", src: CDN + "audio/ch05.mp3", sub: "48:00 – 1:00:00" },
    { id: "ch06", title: "第6章", src: CDN + "audio/ch06.mp3", sub: "1:00:00 – 1:12:00" },
    { id: "ch07", title: "第7章", src: CDN + "audio/ch07.mp3", sub: "1:12:00 – 1:24:00" },
    { id: "ch08", title: "第8章", src: CDN + "audio/ch08.mp3", sub: "1:24:00 – 1:36:00" },
    { id: "ch09", title: "第9章", src: CDN + "audio/ch09.mp3", sub: "1:36:00 – 1:48:00" },
    { id: "ch10", title: "第10章", src: CDN + "audio/ch10.mp3", sub: "1:48:00 – 2:00:00" },
    { id: "ch11", title: "第11章", src: CDN + "audio/ch11.mp3", sub: "2:00:00 – 2:12:00" },
    { id: "ch12", title: "第12章（終盤）", src: CDN + "audio/ch12.mp3", sub: "2:12:00 – 終了" },
  ];

  function $(id) { return document.getElementById(id); }
  function fmt(s) {
    if (!isFinite(s)) return "--:--";
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  }

  window.initLexRadio = function initLexRadio(opts = {}) {
    const audio = $("audio");
    const bar = $("bar");
    const seek = $("seek");
    const curEl = $("cur");
    const durEl = $("dur");
    const playBtn = $("play");
    const nowTitle = $("nowTitle");
    const nowMeta = $("nowMeta");
    const vinyl = $("vinyl");
    const eq = $("eq");
    const chaptersEl = $("chapters");
    const modeFull = $("modeFull");
    const modeCh = $("modeCh");
    if (!audio || !playBtn) return;

    let mode = "full";
    let index = 0;

    function updatePlayingUI() {
      const playing = !audio.paused && !audio.ended;
      if (opts.playLabels) {
        playBtn.textContent = playing ? opts.playLabels.pause : opts.playLabels.play;
      } else {
        playBtn.textContent = playing ? "❚❚" : "▶";
      }
      if (vinyl) vinyl.classList.toggle("spin", playing);
      if (eq) eq.classList.toggle("paused", !playing);
      document.body.classList.toggle("is-playing", playing);
    }

    function load(i, autoplay = false) {
      index = i;
      const ch = CHAPTERS[i];
      audio.src = ch.src;
      if (nowTitle) {
        nowTitle.textContent = mode === "full" ? `フル通し · ${ch.title}` : ch.title;
      }
      if (nowMeta) {
        nowMeta.textContent =
          mode === "full"
            ? `${ch.sub} · 連続再生 (${index + 1}/${CHAPTERS.length})`
            : ch.sub;
      }
      document.querySelectorAll(".ch").forEach((el, n) => {
        el.classList.toggle("active", n === i);
      });
      audio.load();
      if (autoplay) audio.play().catch(() => {});
      updatePlayingUI();
    }

    function renderChapters() {
      if (!chaptersEl) return;
      chaptersEl.innerHTML = "";
      CHAPTERS.forEach((ch, n) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ch" + (index === n ? " active" : "");
        btn.innerHTML = `
          <div class="ch-num">${String(n + 1).padStart(2, "0")}</div>
          <div class="ch-body">
            <div class="ch-title">${ch.title}</div>
            <div class="ch-sub">${ch.sub}</div>
          </div>
          <div class="ch-dur">~12m</div>`;
        btn.addEventListener("click", () => {
          mode = "chapters";
          if (modeCh) modeCh.classList.add("active");
          if (modeFull) modeFull.classList.remove("active");
          chaptersEl.hidden = false;
          load(n, true);
        });
        chaptersEl.appendChild(btn);
      });
    }

    playBtn.addEventListener("click", () => {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    const back = $("back15");
    const fwd = $("fwd15");
    const prev = $("prev");
    const next = $("next");
    if (back) back.addEventListener("click", () => { audio.currentTime = Math.max(0, audio.currentTime - 15); });
    if (fwd) fwd.addEventListener("click", () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 15); });
    if (prev) prev.addEventListener("click", () => {
      if (audio.currentTime > 3) { audio.currentTime = 0; return; }
      if (index <= 0) { audio.currentTime = 0; return; }
      load(index - 1, true);
    });
    if (next) next.addEventListener("click", () => {
      if (index >= CHAPTERS.length - 1) return;
      load(index + 1, true);
    });
    const speed = $("speed");
    const vol = $("vol");
    if (speed) speed.addEventListener("change", (e) => { audio.playbackRate = parseFloat(e.target.value); });
    if (vol) vol.addEventListener("input", (e) => { audio.volume = parseFloat(e.target.value); });

    if (seek) {
      seek.addEventListener("click", (e) => {
        const rect = seek.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        if (isFinite(audio.duration)) audio.currentTime = ratio * audio.duration;
      });
    }

    audio.addEventListener("timeupdate", () => {
      const d = audio.duration || 0;
      const c = audio.currentTime || 0;
      if (bar) bar.style.width = d ? `${(c / d) * 100}%` : "0%";
      if (curEl) curEl.textContent = fmt(c);
      if (durEl) durEl.textContent = fmt(d);
    });
    audio.addEventListener("loadedmetadata", () => { if (durEl) durEl.textContent = fmt(audio.duration); });
    audio.addEventListener("play", updatePlayingUI);
    audio.addEventListener("pause", updatePlayingUI);
    audio.addEventListener("ended", () => {
      if (index < CHAPTERS.length - 1) load(index + 1, true);
      else updatePlayingUI();
    });

    if (modeFull) {
      modeFull.addEventListener("click", () => {
        mode = "full";
        modeFull.classList.add("active");
        if (modeCh) modeCh.classList.remove("active");
        if (chaptersEl) chaptersEl.hidden = true;
        load(index, false);
      });
    }
    if (modeCh) {
      modeCh.addEventListener("click", () => {
        mode = "chapters";
        modeCh.classList.add("active");
        if (modeFull) modeFull.classList.remove("active");
        if (chaptersEl) chaptersEl.hidden = false;
      });
    }

    window.addEventListener("keydown", (e) => {
      if (e.target.matches("input, select, textarea, button")) return;
      if (e.code === "Space") { e.preventDefault(); playBtn.click(); }
      else if (e.code === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
      else if (e.code === "ArrowRight") audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
    });

    renderChapters();
    load(0, false);
    if (nowMeta && mode === "full") nowMeta.textContent = "通し再生 · 再生ボタンでスタート";
  };
})();
