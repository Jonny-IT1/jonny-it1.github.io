/* Terminal Toolkit — interactions, animations & effects */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll progress bar ---------- */
  var bar = document.querySelector(".progress");
  function onScroll() {
    if (bar) {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    var nav = document.querySelector(".nav");
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      document.body.classList.toggle("nav-open");
    });
  }

  /* ---------- Active nav link ---------- */
  (function markActive() {
    var file = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop();
      if (href === file) a.classList.add("active");
    });
  })();

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  document.querySelectorAll(".stagger").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, i) {
      child.classList.add("reveal");
      child.style.transitionDelay = Math.min(i * 90, 720) + "ms";
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
    document.querySelectorAll(".stagger .reveal").forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Animated counters ---------- */
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
  var counters = document.querySelectorAll("[data-counter]");
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

  /* ---------- Card spotlight (mouse glow) ---------- */
  document.querySelectorAll(".glass").forEach(function (card) {
    card.addEventListener("mousemove", function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((ev.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((ev.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- 3D tilt ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
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

  /* ---------- Copy buttons ---------- */
  function flash(btn) {
    var old = btn.textContent;
    btn.classList.add("done");
    btn.textContent = "copied";
    setTimeout(function () {
      btn.classList.remove("done");
      btn.textContent = old;
    }, 1400);
  }
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
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

  /* ---------- Hero particle network ---------- */
  (function particles() {
    var canvas = document.querySelector("canvas.net");
    if (!canvas || reduced) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [];
    var W = 0, H = 0;

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(Math.floor((W * H) / 16000), 80);
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

    function accent() {
      var c1 = getComputedStyle(document.body).getPropertyValue("--a1").trim() || "#22d3ee";
      return c1;
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      var col = accent();
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
          if (d2 < 14400) {
            var a = (1 - Math.sqrt(d2) / 120) * 0.22;
            ctx.strokeStyle = "rgba(120, 160, 255," + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(tick);
  })();

  /* ---------- Terminal typewriter ---------- */
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

  function addCmdLine(body, text, prompt, live) {
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
        if (s.c !== undefined) addCmdLine(body, s.c, s.p !== undefined ? s.p : "$", false);
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
        var prompt = s.p !== undefined ? s.p : "$";
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

  document.querySelectorAll("[data-term]").forEach(function (body) {
    typeTerm(body, body.getAttribute("data-term"));
  });

  /* ---------- Subtle parallax on hero visual ---------- */
  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    var visual = document.querySelector(".hero-visual");
    if (visual) {
      var hero = document.querySelector(".hero");
      hero.addEventListener("mousemove", function (ev) {
        var r = hero.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;
        var y = (ev.clientY - r.top) / r.height - 0.5;
        visual.style.transform =
          "translate(" + (x * 10).toFixed(1) + "px," + (y * 8).toFixed(1) + "px)";
      });
    }
  }
})();
