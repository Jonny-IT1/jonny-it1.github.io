/* Terminal Toolkit — interactions, animations & effects (v2) */
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
    if (bar) bar.style.width = (max > 0 ? (sy / max) * 100 : 0) + "%";
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

  /* ================= 1b. WM bar clock ================= */
  (function clock() {
    var el = $("#clock");
    if (!el) return;
    var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function update() {
      var d = new Date();
      el.textContent = DAYS[d.getDay()] + " " + pad(d.getDate()) + " " +
        MONTHS[d.getMonth()] + "  " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    }
    update();
    setInterval(update, 10000);
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

  /* ================= 5. Animated counters ================= */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-counter")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var dur = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString("en-US") + suffix;
      if (t < 1) requestAnimationFrame(step);
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

  /* ================= 7. 3D tilt ================= */
  if (!reduced && finePointer) {
    $$("[data-tilt]").forEach(function (el) {
      var strength = 5;
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
    var accentCol = getComputedStyle(document.body).getPropertyValue("--a1").trim() || "#22d3ee";

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
            ctx.strokeStyle = "rgba(120, 160, 255," + a.toFixed(3) + ")";
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

  function typeTerm(body, key) {
    var steps = SCRIPTS[key];
    if (!steps) return;
    if (reduced) {
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

    function runStep(idx) {
      if (idx >= steps.length) {
        setTimeout(function () {
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
    runStep(0);
  }

  $$("[data-term]").forEach(function (body) {
    typeTerm(body, body.getAttribute("data-term"));
  });

  /* ================= 12. Subtle parallax on hero visual ================= */
  if (!reduced && finePointer) {
    var visual = $(".hero-visual");
    var hero = $(".hero");
    if (visual && hero) {
      hero.addEventListener("mousemove", function (ev) {
        var r = hero.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        visual.style.transform =
          "translate(" + (x * 10).toFixed(1) + "px," + (y * 8).toFixed(1) + "px)";
      });
      hero.addEventListener("mouseleave", function () {
        visual.style.transform = "";
      });
    }
  }
})();
