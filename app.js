/* Animated architecture diagrams */
(() => {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const diagrams = [];

  document.querySelectorAll("svg.flowchart").forEach(svg => {
    /* Prevent duplicate overlays if setup runs again. */
    if (svg.classList.contains("flow-enhanced")) return;

    const connectors = svg.querySelector(".connectors");
    if (!connectors) return;

    const signalLayer = document.createElementNS(svgNamespace, "g");
    signalLayer.classList.add("signal-layer");
    signalLayer.setAttribute("aria-hidden", "true");

    connectors.querySelectorAll("path").forEach((path, index) => {
      const signal = document.createElementNS(svgNamespace, "path");

      signal.setAttribute("d", path.getAttribute("d"));
      signal.classList.add("signal-trace");

      /* Negative delays start the signals at different positions. */
      signal.style.setProperty(
        "--signal-delay",
        `${index * -0.23}s`
      );

      signalLayer.appendChild(signal);
    });

    /*
      Insert above the original connectors but below the nodes.
      Existing arrowheads and labels remain intact.
    */
    connectors.after(signalLayer);

    const nodes = [...svg.children].filter(element => {
      return (
        element.tagName.toLowerCase() === "rect" ||
        element.classList.contains("decision-node")
      );
    });

    nodes.forEach((node, index) => {
      node.classList.add("animated-node");
      node.style.setProperty(
        "--node-delay",
        `${index * 0.38}s`
      );
    });

    svg.classList.add("flow-enhanced");
    diagrams.push(svg);
  });

  /* Animate the existing ingredient-to-product diagram. */
  document.querySelectorAll(".supply-flow").forEach(flow => {
    flow.querySelectorAll(".flow-node").forEach((node, index) => {
      node.style.setProperty(
        "--node-delay",
        `${index * 0.45}s`
      );
    });

    flow.querySelectorAll(".flow-arrow").forEach((arrow, index) => {
      arrow.style.setProperty(
        "--node-delay",
        `${index * 0.4}s`
      );
    });

    diagrams.push(flow);
  });

  /*
    Animate only visible diagrams.
    Removing the class pauses rather than resets the animation.
  */
  if ("IntersectionObserver" in window) {
    const diagramObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        entry.target.classList.toggle(
          "diagram-visible",
          entry.isIntersecting
        );
      });
    }, {
      threshold: 0.1
    });

    diagrams.forEach(diagram => {
      diagramObserver.observe(diagram);
    });
  } else {
    diagrams.forEach(diagram => {
      diagram.classList.add("diagram-visible");
    });
  }
})();

/* Page interactions: theme, motion, progress, stages, timing, demo, FAQ */
(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };

  /* Theme */
  const themeBtn = $("#theme-toggle");
  const themeMeta = $('meta[name="theme-color"]');
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(theme) {
    const dark = theme === "dark";
    root.dataset.theme = theme;
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#171c18" : "#f6f7f2");
    if (!themeBtn) return;
    themeBtn.setAttribute("aria-pressed", String(dark));
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    const label = themeBtn.querySelector("span");
    if (label) label.textContent = dark ? "Light mode" : "Dark mode";
  }
  applyTheme(store.get("sg-theme") || (systemDark.matches ? "dark" : "light"));
  themeBtn?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    store.set("sg-theme", next);
  });

  /* Motion */
  const motionBtn = $("#motion");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function setMotion(paused) {
    root.classList.toggle("motion-paused", paused);
    if (!motionBtn) return;
    motionBtn.setAttribute("aria-pressed", String(paused));
    motionBtn.textContent = paused ? "Play motion" : "Pause motion";
  }
  const savedMotion = store.get("sg-motion");
  setMotion(savedMotion ? savedMotion === "paused" : reduceMotion.matches);
  motionBtn?.addEventListener("click", () => {
    const paused = !root.classList.contains("motion-paused");
    setMotion(paused);
    store.set("sg-motion", paused ? "paused" : "playing");
  });

  /* Reading progress bar */
  const bar = $(".read-progress");
  let ticking = false;
  function updateProgress() {
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  /* Active nav link */
  const navLinks = $$("nav a[href^='#']");
  if ("IntersectionObserver" in window && navLinks.length) {
    const byId = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(l => l.removeAttribute("aria-current"));
        byId.get(entry.target.id)?.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) navObserver.observe(el); });
  }

  /* System stages */
  const stages = [
    { n: "01", tag: "THE SENSOR LAYER", title: "Observe the batch through different channels.",
      copy: "The proposal combines optical measurements and gas responses. Every observation belongs to a batch and timestamp.",
      note: "Hardware suitability must be tested for the selected food and operating environment.", symbol: "◎" },
    { n: "02", tag: "THE FUSION LAYER", title: "Join the channels into one batch record.",
      copy: "Optical and gas readings are combined with a timestamp and batch context. The project compares optical-only, gas-only and fused models instead of assuming fusion helps.",
      note: "Combining measurements does not automatically make them more reliable.", symbol: "⊕" },
    { n: "03", tag: "THE COMPARISON LAYER", title: "Compare against reference and recent batches.",
      copy: "A new record is compared with reference-like observations and recent batches. The output is an unusual-observation flag, not a diagnosis.",
      note: "Thresholds and models need validation on unseen batches.", symbol: "≋" },
    { n: "04", tag: "THE MEMORY LAYER", title: "Retrieve confirmed incidents that look related.",
      copy: "Similar confirmed cases are retrieved using sensor features and context such as source, product category and season. The matched records are shown to the reviewer.",
      note: "Similarity is an investigation lead, not evidence of cause.", symbol: "◈" },
    { n: "05", tag: "THE REVIEW LAYER", title: "Give a person the evidence, not just an alert.",
      copy: "A reviewer sees current observations, matched history and evidence quality. Confirmed incidents update the trusted case bank; unconfirmed alerts stay separate.",
      note: "Screening output supports the established QA workflow and never replaces it.", symbol: "✓" }
  ];
  const stageButtons = $$(".stage-nav button");
  function showStage(i) {
    const s = stages[i];
    if (!s) return;
    setText("stage-number", s.n);
    setText("stage-tag", s.tag);
    setText("stage-title", s.title);
    setText("stage-copy", s.copy);
    setText("stage-note", s.note);
    const symbol = $(".stage-symbol");
    if (symbol) symbol.textContent = s.symbol;
    stageButtons.forEach((b, idx) => b.setAttribute("aria-pressed", String(idx === i)));
  }
  stageButtons.forEach((b, i) => b.addEventListener("click", () => showStage(i)));

  /* Timing explorer */
  const slider = $("#target-seconds");
  if (slider) {
    const REF = 172800, BAR_X = 70, BAR_W = 540;
    const nf = new Intl.NumberFormat("en-US");
    const updateTiming = () => {
      const t = Number(slider.value);
      const gap = REF - t;
      const width = (t / REF) * BAR_W;
      setText("target-label", `${t} seconds`);
      setText("lead-time", `${Math.floor(gap / 3600)} h ${Math.floor((gap % 3600) / 60)} min`);
      setText("difference-text", `${((gap / REF) * 100).toFixed(2)}% shorter interval to a different, preliminary output.`);
      setText("table-target", `${t} s`);
      setText("table-gap", `${nf.format(gap)} s`);
      setText("target-chart-label", `${t} seconds / target`);
      $("#target-bar")?.setAttribute("width", width);
      $("#target-dot")?.setAttribute("cx", BAR_X + width);
      setText("budget-sensing", `${Math.round(t * 0.5)} s`);
      setText("budget-processing", `${Math.round(t * 0.3)} s`);
      setText("budget-output", `${Math.round(t * 0.2)} s`);
      slider.setAttribute("aria-valuetext", `${t} seconds`);
    };
    slider.addEventListener("input", updateTiming);
    updateTiming();
  }

  /* Batch desk demo */
  const scenario = $("#scenario");
  if (scenario) {
    const scenarios = {
      baseline: { name: "Batch A", state: "No demo flag", tone: "", current: "Reference-like", history: "No relevant case shown", quality: "Usable in this example",
        title: "Continue the normal QA workflow.",
        copy: "This example raises no screening flag. It does not certify the batch as safe or authorise release.",
        caseCopy: "No matching incident is included in this fictional scenario." },
      recurrence: { name: "Batch B", state: "Review: history match", tone: "review", current: "Close to a past pattern", history: "Similar confirmed case SG-014", quality: "Usable in this example",
        title: "Review the matched case before deciding.",
        copy: "The record resembles a seeded, fictional confirmed case that shares a source. This is an investigation lead, not a confirmed cause.",
        caseCopy: "SG-014 shares a source and a related feature pattern. The reviewer checks whether the wider context genuinely matches." },
      anomaly: { name: "Batch C", state: "Review: unusual reading", tone: "review", current: "Unusual against reference", history: "No relevant case shown", quality: "Usable in this example",
        title: "Investigate the unusual observations.",
        copy: "Current readings differ from the reference range. With no matching history, the flag rests on current observations alone and needs confirmatory testing.",
        caseCopy: "No matching incident is included, so the interface says history is unavailable rather than implying the batch is new or safe." },
      uncertain: { name: "Batch D", state: "Inconclusive", tone: "unknown", current: "Incomplete or noisy", history: "Not assessed", quality: "Insufficient in this example",
        title: "Reacquire or review the evidence.",
        copy: "The quality check found the evidence inadequate, so the system reports an inconclusive outcome instead of guessing.",
        caseCopy: "Historical matching is skipped when evidence quality is inadequate." }
    };
    const fields = { "batch-name": "name", "batch-state": "state", "current-reading": "current", "history-reading": "history",
      "quality-reading": "quality", "decision-title": "title", "decision-copy": "copy", "case-copy": "caseCopy" };
    const renderScenario = () => {
      const s = scenarios[scenario.value];
      if (!s) return;
      Object.entries(fields).forEach(([id, key]) => setText(id, s[key]));
      const badge = $("#batch-state");
      if (badge) { if (s.tone) badge.dataset.tone = s.tone; else delete badge.dataset.tone; }
    };
    scenario.addEventListener("change", renderScenario);
    renderScenario();
  }

  /* FAQ search */
  const faqSearch = $("#faq-search");
  if (faqSearch) {
    const items = $$(".faq-list details");
    const filterFaq = () => {
      const q = faqSearch.value.trim().toLowerCase();
      let shown = 0;
      items.forEach(d => {
        const match = !q || d.textContent.toLowerCase().includes(q);
        d.hidden = !match;
        if (match) shown++;
      });
      setText("faq-count", q ? `${shown} of ${items.length} answers` : `${items.length} answers`);
      const empty = $("#faq-empty");
      if (empty) empty.hidden = shown !== 0;
    };
    faqSearch.addEventListener("input", filterFaq);
  }

  /* Team photo fallback: show initials if an image is missing */
  $$(".profile-photo img").forEach(img => {
    const useInitials = () => {
      const initials = (img.alt || "").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
      img.replaceWith(document.createTextNode(initials));
    };
    if (img.complete && img.naturalWidth === 0) useInitials();
    else img.addEventListener("error", useInitials, { once: true });
  });
})();