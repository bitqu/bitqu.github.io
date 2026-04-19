// Agentic simulation visualization — reads as "heterogeneous agents making decisions
// in a scenario world." Grid-based environment with cohort-tagged agents that pick
// directions at decision points, leaving decision-trail evidence. Directly maps to
// the business: deterministic replay, branching, heterogeneous populations.
(function () {
  function init(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let W = 0, H = 0;
    const CELL = opts.cell || 16;
    let COLS = 0, ROWS = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      COLS = Math.max(8, Math.floor(W / CELL));
      ROWS = Math.max(6, Math.floor(H / CELL));
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const N = opts.count || 30;

    // Seeded RNG for deterministic feel
    let seed = 0xB170;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };

    // Objectives: fixed cells agents try to reach (one per cohort)
    const OBJ_COUNT = 4;
    let objectives = [];
    function placeObjectives() {
      objectives = [];
      for (let i = 0; i < OBJ_COUNT; i++) {
        objectives.push({
          c: Math.floor((0.15 + (i * 0.22) + rnd() * 0.1) * COLS) % COLS,
          r: Math.floor((0.2 + ((i % 2) * 0.5) + rnd() * 0.15) * ROWS) % ROWS,
          cohort: i,
        });
      }
    }
    placeObjectives();

    const agents = [];
    function spawn(a) {
      // Spawn on a left/right edge, assign cohort
      const cohort = Math.floor(rnd() * 4);
      const side = rnd() < 0.5 ? 0 : COLS - 1;
      a.c = side;
      a.r = Math.floor(rnd() * ROWS);
      a.cohort = cohort;
      a.t = 0;               // step counter
      a.nextDecide = 0;
      a.dir = { dc: side === 0 ? 1 : -1, dr: 0 };
      a.life = 0;
      a.maxLife = 120 + Math.floor(rnd() * 80);
    }
    for (let i = 0; i < N; i++) {
      const a = { c: 0, r: 0, cohort: 0, dir: { dc: 1, dr: 0 }, t: 0, nextDecide: 0, life: 0, maxLife: 100 };
      spawn(a);
      a.c = Math.floor(rnd() * COLS);
      a.r = Math.floor(rnd() * ROWS);
      agents.push(a);
    }

    // Trail grid: accumulates decision evidence per cohort
    const trails = new Float32Array(COLS * ROWS * 4); // 4 cohorts
    function trailIdx(c, r, k) { return ((r * COLS) + c) * 4 + k; }

    const getColors = () => {
      const s = getComputedStyle(document.documentElement);
      return [
        s.getPropertyValue('--accent').trim() || '#d8ff3e',
        s.getPropertyValue('--fg').trim() || '#e8e7e3',
        s.getPropertyValue('--fg-dim').trim() || '#a8a7a1',
        '#ff7a3a',
      ];
    };

    let t = 0;
    let raf = 0;
    let running = true;
    let stepAccum = 0;

    function step() {
      // Decay trails
      for (let i = 0; i < trails.length; i++) trails[i] *= 0.975;

      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const obj = objectives[a.cohort];

        // Decide: greedy step toward objective with small stochastic branching
        const dc = Math.sign(obj.c - a.c);
        const dr = Math.sign(obj.r - a.r);
        // Heterogeneity: cohorts weigh horizontal vs vertical differently
        const bias = [0.6, 0.4, 0.5, 0.3][a.cohort];
        let pickH = rnd() < bias;
        if (dc === 0) pickH = false;
        if (dr === 0) pickH = true;

        let ndc = 0, ndr = 0;
        if (pickH) ndc = dc; else ndr = dr;

        // Occasional exploration (the "counterfactual branch" visual)
        if (rnd() < 0.08) {
          if (pickH) ndr = rnd() < 0.5 ? -1 : 1;
          else ndc = rnd() < 0.5 ? -1 : 1;
          if (pickH) ndc = 0; else ndr = 0;
        }

        a.dir = { dc: ndc, dr: ndr };
        a.c = Math.max(0, Math.min(COLS - 1, a.c + ndc));
        a.r = Math.max(0, Math.min(ROWS - 1, a.r + ndr));

        // Deposit trail
        trails[trailIdx(a.c, a.r, a.cohort)] = Math.min(1, trails[trailIdx(a.c, a.r, a.cohort)] + 0.55);

        a.life++;
        // Arrived? → commit stronger trail at objective and respawn
        if (a.c === obj.c && a.r === obj.r) {
          for (let k = -1; k <= 1; k++) for (let l = -1; l <= 1; l++) {
            const cc = obj.c + k, rr = obj.r + l;
            if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) {
              trails[trailIdx(cc, rr, a.cohort)] = Math.min(1, trails[trailIdx(cc, rr, a.cohort)] + 0.3);
            }
          }
          spawn(a);
        } else if (a.life > a.maxLife) {
          spawn(a);
        }
      }
    }

    function draw() {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim() || '#111';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const colors = getColors();

      // Subtle grid
      ctx.strokeStyle = hexA(colors[2], 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= COLS; c++) {
        ctx.moveTo(c * CELL + 0.5, 0);
        ctx.lineTo(c * CELL + 0.5, ROWS * CELL);
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.moveTo(0, r * CELL + 0.5);
        ctx.lineTo(COLS * CELL, r * CELL + 0.5);
      }
      ctx.stroke();

      // Draw trails (decision evidence)
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          for (let k = 0; k < 4; k++) {
            const v = trails[trailIdx(c, r, k)];
            if (v > 0.04) {
              ctx.fillStyle = hexA(colors[k], v * (k === 0 ? 0.35 : 0.18));
              ctx.fillRect(c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4);
            }
          }
        }
      }

      // Draw objectives: small square brackets
      for (let i = 0; i < objectives.length; i++) {
        const o = objectives[i];
        const x = o.c * CELL, y = o.r * CELL;
        ctx.strokeStyle = colors[o.cohort];
        ctx.lineWidth = 1.5;
        const s = CELL;
        ctx.beginPath();
        // corner brackets
        ctx.moveTo(x - 2, y + 4); ctx.lineTo(x - 2, y - 2); ctx.lineTo(x + 4, y - 2);
        ctx.moveTo(x + s + 2, y - 2); ctx.lineTo(x + s + 2, y + 4);
        ctx.moveTo(x + s + 2, y + s - 4); ctx.lineTo(x + s + 2, y + s + 2); ctx.lineTo(x + s - 4, y + s + 2);
        ctx.moveTo(x - 2, y + s - 4); ctx.lineTo(x - 2, y + s + 2); ctx.lineTo(x + 4, y + s + 2);
        ctx.stroke();
      }

      // Draw agents as small squares (not circles → not organic)
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        const x = a.c * CELL + CELL / 2;
        const y = a.r * CELL + CELL / 2;
        const col = colors[a.cohort];
        // direction tick
        ctx.strokeStyle = hexA(col, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + a.dir.dc * (CELL * 0.55), y + a.dir.dr * (CELL * 0.55));
        ctx.stroke();
        // body
          ctx.fillStyle = hexA(col, 0.55);
        const sz = a.cohort === 0 ? 3 : 2.5;
        ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
      }
    }

    let lastStep = 0;
    function tick(now) {
      if (!running) { raf = requestAnimationFrame(tick); return; }
      t += 1;
      // Step logic ~2Hz for calm motion
      if (!lastStep) lastStep = now || 0;
      if ((now || 0) - lastStep > 2000) { step(); lastStep = now || 0; }
      draw();
      if (t % 3000 === 0) placeObjectives();
      raf = requestAnimationFrame(tick);
    }

    function hexA(hex, a) {
      hex = (hex || '').trim();
      if (hex.startsWith('#')) {
        let h = hex.slice(1);
        if (h.length === 3) h = h.split('').map(c => c + c).join('');
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        return `rgba(${r},${g},${b},${a})`;
      }
      return `rgba(232,231,227,${a})`;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { running = e.isIntersecting; });
    });
    io.observe(canvas);

    tick();

    return { destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); } };
  }

  window.BQSwarm = { init };
})();
