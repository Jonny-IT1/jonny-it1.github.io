/* Terminal Toolkit — interactions, animations & effects (v3) */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ================= 1. Scroll: progress, nav, orb parallax, top-btn ================= */
  var bar = $(".progress");
  var nav = $(".nav");
  var orbs = $$(".bg .orb");
  var topBtn = $(".top-btn");
  var ticking = false;

  function onScrollFrame() {
    ticking = false;
    var sy = window.scrollY || window.pageYOffset;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.transform = "scaleX(" + (max > 0 ? sy / max : 0) + ")";
    if (nav) nav.classList.toggle("scrolled", sy > 12);
    if (topBtn) topBtn.classList.toggle("show", sy > 640);
    if (!reduced) {
      orbs.forEach(function (o) {
        var f = parseFloat(o.getAttribute("data-speed") || "0.06");
        o.style.setProperty("--oy", (sy * f).toFixed(1) + "px");
      });
    }
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
    },
    { passive: true }
  );
  onScrollFrame();

  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ================= 1b. WM bar clock (3 Formate, Klick schaltet um) ================= */
  (function clock() {
    var el = $("#clock");
    if (!el) return;
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    var fmt = 0;
    var NAMES = [
      "Clock format: shell style.",
      "Clock format: HH:MM:SS.",
      "Clock format: raw unix time."
    ];
    function update() {
      var d = new Date();
      if (fmt === 0) {
        el.textContent = DAYS[d.getDay()] + " " + pad(d.getDate()) + " " +
          MONTHS[d.getMonth()] + "  " + pad(d.getHours()) + ":" + pad(d.getMinutes());
      } else if (fmt === 1) {
        el.textContent = pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
      } else {
        el.textContent = String(Math.floor(d.getTime() / 1000));
      }
    }
    el.classList.add("ee-clickable");
    el.setAttribute("title", "click to change format");
    el.addEventListener("click", function () {
      fmt = (fmt + 1) % 3;
      update();
      if (!found.clock) eggToast("clock", NAMES[fmt]);
      else toast(NAMES[fmt]);
    });
    update();
    setInterval(update, 1000);
  })();

  /* ================= 2. Mobile nav ================= */
  var toggle = $(".nav-toggle");
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-links a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
    document.addEventListener("click", function (e) {
      if (document.body.classList.contains("nav-open") &&
          !e.target.closest(".nav-links") &&
          !e.target.closest(".nav-toggle")) {
        closeNav();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) closeNav();
    });
  }

  /* ================= 3. Active nav link ================= */
  (function markActive() {
    var file = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href === file) a.classList.add("active");
    });
  })();

  /* ================= 4. Scroll reveal ================= */
  var revealEls = $$(".reveal");
  document.querySelectorAll(".stagger").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add("reveal");
      child.style.transitionDelay = Math.min(i * 90, 720) + "ms";
      revealEls.push(child);
    });
  });
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================= 5. Animated counters (scramble/decrypt) ================= */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-counter")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var digits = String(Math.round(target));
    var GLYPHS = "0123456789";
    var dur = 1100;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var resolved = Math.floor(eased * digits.length);
      var out = "";
      for (var i = 0; i < digits.length; i++) {
        out += i < resolved
          ? digits.charAt(i)
          : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = prefix + out + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = prefix + digits + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-counter]");
  if ("IntersectionObserver" in window && !reduced) {
    var cio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            animateCounter(e.target);
            cio.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent =
        (c.getAttribute("data-prefix") || "") +
        (parseFloat(c.getAttribute("data-counter")) || 0).toLocaleString("en-US") +
        (c.getAttribute("data-suffix") || "");
    });
  }

  /* ================= 6. Card spotlight (mouse glow) ================= */
  if (finePointer) {
    $$(".glass").forEach(function (card) {
      card.addEventListener("mousemove", function (ev) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ================= 7. Wobbly windows (spring physics) ================= */
  if (!reduced && finePointer) {
    $$("[data-wobble]").forEach(function (win) {
      var hero = win.closest(".hero");
      if (!hero) return;
      var tx = 0, ty = 0;   /* target offset */
      var px = 0, py = 0;   /* current offset */
      var vx = 0, vy = 0;   /* velocity */
      var raf = null;
      var K = 0.14;         /* spring stiffness */
      var D = 0.70;         /* damping: < 1 => overshoot wobble */

      function loop() {
        vx = (vx + (tx - px) * K) * D;
        vy = (vy + (ty - py) * K) * D;
        px += vx;
        py += vy;
        var rot = Math.max(-8, Math.min(8, vx * 1.05));
        win.style.transform =
          "translate(" + px.toFixed(2) + "px," + py.toFixed(2) + "px) rotate(" +
          rot.toFixed(2) + "deg)";
        var moving = Math.abs(px - tx) > 0.05 || Math.abs(py - ty) > 0.05 ||
                     Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02;
        if (moving) {
          raf = requestAnimationFrame(loop);
        } else {
          raf = null;
          win.classList.remove("is-wobble");
          win.style.transform = "";
        }
      }
      function kick() {
        win.classList.add("is-wobble");
        if (raf === null) raf = requestAnimationFrame(loop);
      }
      hero.addEventListener("mousemove", function (ev) {
        var r = hero.getBoundingClientRect();
        tx = ((ev.clientX - r.left) / r.width - 0.5) * 26;
        ty = ((ev.clientY - r.top) / r.height - 0.5) * 20;
        kick();
      });
      hero.addEventListener("mouseleave", function () {
        tx = 0;
        ty = 0;
        kick();
      });
    });
  }

  /* ================= 7b. 3D tilt on project cards (subtle) ================= */
  if (!reduced && finePointer) {
    $$("[data-tilt]").forEach(function (el) {
      var strength = 3;
      el.style.transformStyle = "preserve-3d";
      el.addEventListener("mousemove", function (ev) {
        var r = el.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          "perspective(900px) rotateX(" + (-y * strength).toFixed(2) + "deg) rotateY(" +
          (x * strength).toFixed(2) + "deg) translateY(-5px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ================= 8. Copy buttons ================= */
  function flash(btn) {
    var old = btn.textContent;
    btn.classList.add("done");
    btn.textContent = "copied";
    setTimeout(function () {
      btn.classList.remove("done");
      btn.textContent = old;
    }, 1400);
  }
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy") || "";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(
          function () { flash(btn); },
          function () { flash(btn); }
        );
      } else {
        var ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta);
        flash(btn);
      }
    });
  });

  /* ================= 9. Cursor glow follower (desktop) ================= */
  (function cursorGlow() {
    var glow = $(".cursor-glow");
    if (!glow || reduced || !finePointer) return;
    var tx = innerWidth / 2, ty = innerHeight / 3;
    var cx = tx, cy = ty;
    var running = false;

    document.addEventListener("mousemove", function (ev) {
      tx = ev.clientX;
      ty = ev.clientY;
      document.body.classList.add("cursor-on");
      if (!running) { running = true; requestAnimationFrame(loop); }
    });

    function loop() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      glow.style.left = cx.toFixed(1) + "px";
      glow.style.top = cy.toFixed(1) + "px";
      if (Math.abs(tx - cx) > 0.4 || Math.abs(ty - cy) > 0.4) {
        requestAnimationFrame(loop);
      } else {
        running = false;
      }
    }
  })();

  /* ================= 10. Hero particle network ================= */
  (function particles() {
    var canvas = $("canvas.net");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [];
    var W = 0, H = 0;
    var rafId = null;
    var inView = true;
    var accentCol = getComputedStyle(document.body).getPropertyValue("--a1").trim() || "#fabd2f";

    function hexToRgb(h) {
      h = h.replace("#", "");
      if (h.length === 3) {
        h = h.split("").map(function (c) { return c + c; }).join("");
      }
      var n = parseInt(h, 16);
      return isNaN(n) ? [120, 160, 255] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    var accentRgb = hexToRgb(accentCol);

    function isMobile() { return window.innerWidth < 720; }

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var max = isMobile() ? 36 : 80;
      var count = Math.min(Math.floor((W * H) / (isMobile() ? 24000 : 16000)), max);
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.6 + 0.6
        });
      }
    }

    function tick() {
      rafId = null;
      ctx.clearRect(0, 0, W, H);
      var linkDist = isMobile() ? 100 : 120;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d2 = dx * dx + dy * dy;
          var lim = linkDist * linkDist;
          if (d2 < lim) {
            var a = (1 - Math.sqrt(d2) / linkDist) * 0.22;
            ctx.strokeStyle = "rgba(" + accentRgb[0] + "," + accentRgb[1] + "," + accentRgb[2] + "," + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = accentCol;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (!reduced && inView && !document.hidden) {
        rafId = requestAnimationFrame(tick);
      }
    }

    function start() {
      if (rafId === null && !document.hidden && inView) {
        rafId = requestAnimationFrame(tick);
      }
    }

    if (reduced) {
      resize();
      tick();
      window.addEventListener("resize", function () {
        resize();
        tick();
      });
      return;
    }

    resize();
    start();
    window.addEventListener("resize", function () {
      resize();
      start();
    });
    document.addEventListener("visibilitychange", start);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            inView = e.isIntersecting;
            if (inView) start();
          });
        },
        { threshold: 0.02 }
      ).observe(canvas);
    }
  })();

  /* ================= 11. Terminal typewriter ================= */
  var SCRIPTS = {
    home: [
      { c: "contextcraft stats ." },
      { o: [{ t: "scanning 214 files ... done", cls: "dim" }] },
      { o: [{ t: "214 files  |  182,430 tokens  |  budget 100,000", cls: "hl" }] },
      { o: [{ t: "signatures-only mode: 24,180 tokens  (87% saved)", cls: "ok" }] },
      { c: "contextcraft pack . -s --copy" },
      { o: [{ t: "packed -> clipboard  [markdown]  24,180 tokens", cls: "ok" }] },
      { c: "termiagent" },
      { o: [{ t: "connected: ollama/qwen2.5-coder  (100% local)", cls: "dim" }] },
      { c: "> why do the tests in tests/ fail?", p: "" },
      { o: [
        { t: "view_file tests/test_engine.py", cls: "warn" },
        { t: "run_shell_command pytest -q", cls: "warn" },
        { t: "2 failures found - applying fix ...", cls: "dim" },
        { t: "tests/test_engine.py edited - 14 passed", cls: "ok" }
      ] }
    ],
    cc: [
      { c: "contextcraft stats ." },
      { o: [
        { t: "scanning 214 files ... done", cls: "dim" },
        { t: "214 files  |  182,430 tokens", cls: "hl" },
        { t: "top: engine.py 31,204 | cli.py 18,882 | ui.py 12,406", cls: "dim" }
      ] },
      { c: "contextcraft pack . --git-diff -o changes.md" },
      { o: [{ t: "packed 7 changed files -> changes.md", cls: "ok" }] },
      { c: "contextcraft ui ." },
      { o: [{ t: "dashboard -> http://localhost:8000", cls: "ok" }] }
    ],
    ta: [
      { c: "termiagent" },
      { o: [{ t: "connected: gemini/gemini-2.0-flash", cls: "dim" }] },
      { c: "> find the bug in parser.py and fix it", p: "" },
      { o: [
        { t: "view_file src/parser.py", cls: "warn" },
        { t: "search_codebase 'def parse('", cls: "warn" },
        { t: "edit_file src/parser.py  (lines 42-48)", cls: "warn" },
        { t: "run_shell_command pytest -q ... 12 passed", cls: "ok" }
      ] },
      { c: "/model ollama/llama3.3", p: "" },
      { o: [{ t: "model switched: ollama/llama3.3  (offline)", cls: "ok" }] }
    ]
  };

  function addCmdLine(body, text, prompt) {
    var ln = document.createElement("div");
    ln.className = "ln";
    var p = document.createElement("span");
    p.className = "p";
    p.textContent = prompt + " ";
    var t = document.createElement("span");
    t.textContent = text;
    ln.appendChild(p);
    ln.appendChild(t);
    body.appendChild(ln);
  }

  function addOutLine(body, text, cls) {
    var ln = document.createElement("div");
    ln.className = "ln" + (cls ? " " + cls : "");
    ln.textContent = text;
    body.appendChild(ln);
  }

  var BOOT = [
    "[    0.000000] spatial-shell: entering stage ...",
    "[    0.041262] ui-theme: loaded (auto)",
    "[    0.102388] frost-blur: pipelines connected",
    "[    0.175445] wobbly-windows: springs armed",
    "[    0.210977] easter-eggs: 9 loaded (shhh)",
    "[    0.250912] ready."
  ];

  var termGen = new WeakMap();

  function typeTerm(body, key, opts) {
    opts = opts || {};
    var gen = (termGen.get(body) || 0) + 1;
    termGen.set(body, gen);
    function alive() { return termGen.get(body) === gen; }
    var steps = opts.steps || SCRIPTS[key];
    if (!steps) return;
    if (reduced) {
      BOOT.forEach(function (b) { addOutLine(body, b, "dim"); });
      steps.forEach(function (s) {
        if (s.c !== undefined) addCmdLine(body, s.c, s.p !== undefined ? s.p : "❯");
        if (s.o) s.o.forEach(function (l) { addOutLine(body, l.t, l.cls); });
      });
      return;
    }

    var caret = document.createElement("span");
    caret.className = "caret";

    function addLine(cls) {
      var ln = document.createElement("div");
      ln.className = "ln" + (cls ? " " + cls : "");
      body.appendChild(ln);
      body.scrollTop = body.scrollHeight;
      return ln;
    }

    function runBoot(idx, done) {
      if (idx >= BOOT.length) {
        setTimeout(function () { if (alive()) done(); }, 350);
        return;
      }
      var ln = addLine("dim");
      ln.textContent = BOOT[idx];
      setTimeout(function () { if (alive()) runBoot(idx + 1, done); }, 95);
    }

    function runStep(idx) {
      if (!alive()) return;
      if (idx >= steps.length) {
        if (opts.once) {
          setTimeout(function () {
            if (!alive()) return;
            body.innerHTML = "";
            typeTerm(body, key);
          }, 5200);
          return;
        }
        setTimeout(function () {
          if (!alive()) return;
          body.innerHTML = "";
          runStep(0);
        }, 6000);
        return;
      }
      var s = steps[idx];
      if (s.c !== undefined) {
        var prompt = s.p !== undefined ? s.p : "❯";
        var ln = addLine();
        var p = document.createElement("span");
        p.className = "p";
        p.textContent = prompt + (prompt ? " " : "");
        ln.appendChild(p);
        var t = document.createElement("span");
        ln.appendChild(t);
        ln.appendChild(caret);
        var i = 0;
        (function typeChar() {
          if (!alive()) return;
          if (i <= s.c.length) {
            t.textContent = s.c.slice(0, i);
            i++;
            setTimeout(typeChar, 22 + Math.random() * 38);
          } else {
            setTimeout(function () { runStep(idx + 1); }, 420);
          }
        })();
      } else if (s.o) {
        var j = 0;
        (function nextOut() {
          if (!alive()) return;
          if (j < s.o.length) {
            var l = s.o[j];
            var ln2 = addLine(l.cls);
            ln2.textContent = l.t;
            j++;
            setTimeout(nextOut, 150);
          } else {
            setTimeout(function () { runStep(idx + 1); }, 520);
          }
        })();
      }
    }
    runBoot(0, function () { runStep(0); });
  }

  $$("[data-term]").forEach(function (body) {
    typeTerm(body, body.getAttribute("data-term"));
  });

  /* ================= 12. Motion pack v3 (mouse parallax + magnetic buttons) ================= */
  if (!reduced && finePointer) {
    /* Orbs folgen der Maus auf der x-Achse, y bleibt beim Scroll-Parallax */
    document.addEventListener("mousemove", function (ev) {
      var nx = ev.clientX / window.innerWidth - 0.5;
      orbs.forEach(function (o, i) {
        var f = (i + 1) * 16;
        o.style.setProperty("--ox", (nx * f).toFixed(1) + "px");
      });
    }, { passive: true });

    /* Magnetische Buttons: CTA und Top-Button ziehen zur Maus */
    $$(".btn-primary, .top-btn").forEach(function (b) {
      b.addEventListener("mousemove", function (ev) {
        var r = b.getBoundingClientRect();
        var mx = (ev.clientX - r.left - r.width / 2) / r.width;
        var my = (ev.clientY - r.top - r.height / 2) / r.height;
        b.style.translate = (mx * 9).toFixed(1) + "px " + (my * 7).toFixed(1) + "px";
      });
      b.addEventListener("mouseleave", function () { b.style.translate = ""; });
    });
  }

  /* ================= 13. Theme toggle (dark/light, persisted) ================= */
  (function themeToggle() {
    var KEY = "tt-theme";
    var root = document.documentElement;
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    var prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (prefersLight ? "light" : "dark");
    root.setAttribute("data-theme", theme);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle color theme");
    btn.innerHTML =
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.4 14.2A8.3 8.3 0 0 1 9.8 3.6a8.3 8.3 0 1 0 10.6 10.6z"/></svg>';
    var host = document.querySelector(".wm-right") || document.querySelector(".nav");
    if (host) host.insertBefore(btn, host.firstChild);

    btn.addEventListener("click", function () {
      theme = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", theme);
      try { localStorage.setItem(KEY, theme); } catch (e) {}
    });
  })();


  /* ================= 14. Easter egg pack (11.11.2026) =================
     Neun Eier: Terminal schliessen/wiederherstellen, Konami-Party,
     getippte Woerter (wobble, matrix, boost), Doppelklick-Geheimskript,
     Uhr-Formate, Footer-Konfetti, Titel-Glitch. Zaehler pro Session. */

  var found = {};
  try { found = JSON.parse(sessionStorage.getItem("tt-eggs") || "{}") || {}; } catch (e) {}
  var EGG_TOTAL = 9;
  var toastEl = null;
  var toastTimer = null;

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "ee-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.remove("out");
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
      toastEl.classList.add("out");
    }, 2800);
  }

  function eggToast(name, msg) {
    if (!found[name]) {
      found[name] = true;
      try { sessionStorage.setItem("tt-eggs", JSON.stringify(found)); } catch (e) {}
    }
    toast("[" + pad2(Object.keys(found).length) + "/" + pad2(EGG_TOTAL) + "] " + msg);
  }

  var CF_COLORS = ["#0A84FF", "#5E5CE6", "#30D158", "#FF9F0A", "#64D2FF"];
  function confetti(x, y, n) {
    if (reduced) return;
    n = n || 26;
    for (var i = 0; i < n; i++) {
      var p = document.createElement("span");
      p.className = "ee-cf";
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = CF_COLORS[i % CF_COLORS.length];
      p.style.setProperty("--tx", (Math.random() * 240 - 120).toFixed(0) + "px");
      p.style.setProperty("--ty", (Math.random() * -160 - 20).toFixed(0) + "px");
      p.style.setProperty("--rot", (Math.random() * 540 - 270).toFixed(0) + "deg");
      p.style.animationDuration = (0.7 + Math.random() * 0.5).toFixed(2) + "s";
      p.addEventListener("animationend", function (ev) { ev.target.remove(); });
      document.body.appendChild(p);
    }
  }

  function centerOf(el) {
    var r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }

  function ripple(el, ev) {
    if (reduced) return;
    var r = el.getBoundingClientRect();
    var d = Math.max(r.width, r.height) * 2;
    var s = document.createElement("span");
    s.className = "ee-ripple";
    s.style.width = s.style.height = d + "px";
    s.style.left = (ev.clientX - r.left - d / 2) + "px";
    s.style.top = (ev.clientY - r.top - d / 2) + "px";
    el.appendChild(s);
    setTimeout(function () { s.remove(); }, 650);
  }
  $$(".btn, .cmd-pill, .top-btn, .csd-close").forEach(function (b) {
    b.classList.add("ee-ripple-host");
    b.addEventListener("click", function (ev) { ripple(b, ev); });
  });

  /* Egg 1: Terminal per X schliessen (Genie-Animation), Chip stellt wieder her */
  $$(".term").forEach(function (term) {
    var closeBtn = $(".csd-close", term);
    var tbody = $("[data-term]", term);
    var tkey = tbody ? tbody.getAttribute("data-term") : null;
    var restore = document.createElement("button");
    restore.type = "button";
    restore.className = "term-restore";
    restore.setAttribute("aria-label", "Reopen terminal");
    restore.innerHTML =
      "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 19V5M5 12l7-7 7 7\"/></svg>" +
      " Reopen terminal";
    term.parentNode.insertBefore(restore, term.nextSibling);
    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        term.classList.add("is-closed");
        restore.classList.add("show");
        var c = centerOf(term);
        confetti(c[0], c[1], 18);
        eggToast("termclose", "Terminal closed. Reopen it whenever you miss it.");
      });
    }
    restore.addEventListener("click", function () {
      term.classList.remove("is-closed");
      term.classList.add("is-reopening");
      setTimeout(function () { term.classList.remove("is-reopening"); }, 700);
      restore.classList.remove("show");
      if (tbody && tkey) {
        tbody.innerHTML = "";
        typeTerm(tbody, tkey);
      }
    });
  });

  /* Egg 2: Geheimskript per Doppelklick aufs Terminal */
  var EGG_STEPS = [
    { c: "termiagent --secret" },
    { o: [{ t: "agent: oh. you found the hidden flag.", cls: "ok" }] },
    { o: [{ t: "agent: allocating 100% vibes ... done", cls: "dim" }] },
    { c: "contextcraft pack ./easter-eggs --copy" },
    { o: [{ t: "packed 9 hidden eggs -> clipboard  [sugar]", cls: "hl" }] },
    { o: [{ t: "resuming normal operations ...", cls: "dim" }] }
  ];
  $$(".term").forEach(function (term) {
    var tbody = $("[data-term]", term);
    if (!tbody) return;
    var tkey = tbody.getAttribute("data-term");
    term.addEventListener("dblclick", function () {
      tbody.innerHTML = "";
      typeTerm(tbody, tkey, { steps: EGG_STEPS, once: true });
      eggToast("secret", "Secret agent mode unlocked in the terminal.");
    });
  });

  /* Egg 3-6: Tastaturpuffer (Woerter + Konami) */
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var kbuf = [];
  var wbuf = "";

  function nudgeWobble() {
    if (reduced) return;
    $$("[data-wobble]").forEach(function (w) {
      w.classList.remove("ee-shake");
      void w.offsetWidth;
      w.classList.add("ee-shake");
      setTimeout(function () { w.classList.remove("ee-shake"); }, 650);
    });
  }

  var matrixT = null;
  function matrixMode() {
    $$(".term").forEach(function (t) { t.classList.add("ee-matrix"); });
    eggToast("matrix", "Phosphor mode: 6 seconds of pure legacy.");
    clearTimeout(matrixT);
    matrixT = setTimeout(function () {
      $$(".term").forEach(function (t) { t.classList.remove("ee-matrix"); });
    }, 6000);
  }

  function logoBoost() {
    var logo = $(".brand .logo");
    if (logo) {
      logo.classList.remove("ee-spin");
      void logo.offsetWidth;
      logo.classList.add("ee-spin");
      setTimeout(function () { logo.classList.remove("ee-spin"); }, 850);
    }
    var brand = $(".brand");
    if (brand) {
      var c = centerOf(brand);
      confetti(c[0], c[1], 22);
    }
    eggToast("boost", "Core boost: logo overclocked.");
  }

  document.addEventListener("keydown", function (ev) {
    var t = ev.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    if (ev.key.length === 1) {
      wbuf = (wbuf + ev.key.toLowerCase()).slice(-12);
      if (/wobble$/.test(wbuf)) { nudgeWobble(); eggToast("wobble", "Springs released: every window gets a nudge."); wbuf = ""; }
      else if (/matrix$/.test(wbuf)) { matrixMode(); wbuf = ""; }
      else if (/boost$/.test(wbuf)) { logoBoost(); wbuf = ""; }
    } else if (ev.key === "Escape") {
      wbuf = "";
    } else {
      wbuf = "";
    }
    kbuf.push(ev.key.length === 1 ? ev.key.toLowerCase() : ev.key);
    if (kbuf.length > KONAMI.length) kbuf.shift();
    if (kbuf.join(",") === KONAMI.join(",")) {
      document.body.classList.toggle("ee-party");
      var party = document.body.classList.contains("ee-party");
      if (party) confetti(innerWidth / 2, innerHeight / 2, 60);
      eggToast("konami", party
        ? "Party mode: on. Same code to calm it down."
        : "Party mode: off. The orbs needed a break.");
    }
  });

  /* Egg 7: Footer-Segment zaehlt feierlich mit */
  var fseg = $(".fseg-accent");
  if (fseg) {
    fseg.classList.add("ee-clickable");
    fseg.addEventListener("click", function () {
      var c = centerOf(fseg);
      confetti(c[0], c[1], 24);
      eggToast("footer", "Pipeline deployed. Purely ceremonial.");
    });
  }

  /* Egg 8: Fuenf Klicks auf den Hero-Titel erzeugen einen Glitch */
  var htitle = $(".hero-title");
  if (htitle) {
    var gc = 0;
    var gt = 0;
    htitle.classList.add("ee-clickable");
    htitle.addEventListener("click", function () {
      var now = Date.now();
      gc = now - gt < 2500 ? gc + 1 : 1;
      gt = now;
      if (gc >= 5) {
        gc = 0;
        htitle.classList.remove("ee-glitch");
        void htitle.offsetWidth;
        htitle.classList.add("ee-glitch");
        setTimeout(function () { htitle.classList.remove("ee-glitch"); }, 950);
        eggToast("glitch", "Signal glitch: the fabric hiccuped.");
      }
    });
  }

})();
