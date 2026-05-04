// Cloud topology visualization. Grid-based environment with workload markers
// moving between cluster targets and leaving operational activity trails.
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

    const TARGET_COUNT = 4;
    let targets = [];
    function placeTargets() {
      targets = [];
      for (let i = 0; i < TARGET_COUNT; i++) {
        targets.push({
          c: Math.floor((0.15 + (i * 0.22) + rnd() * 0.1) * COLS) % COLS,
          r: Math.floor((0.2 + ((i % 2) * 0.5) + rnd() * 0.15) * ROWS) % ROWS,
          group: i,
        });
      }
    }
    placeTargets();

    const workloads = [];
    function spawn(workload) {
      const group = Math.floor(rnd() * 4);
      const side = rnd() < 0.5 ? 0 : COLS - 1;
      workload.c = side;
      workload.r = Math.floor(rnd() * ROWS);
      workload.group = group;
      workload.t = 0;
      workload.dir = { dc: side === 0 ? 1 : -1, dr: 0 };
      workload.life = 0;
      workload.maxLife = 120 + Math.floor(rnd() * 80);
    }
    for (let i = 0; i < N; i++) {
      const workload = { c: 0, r: 0, group: 0, dir: { dc: 1, dr: 0 }, t: 0, life: 0, maxLife: 100 };
      spawn(workload);
      workload.c = Math.floor(rnd() * COLS);
      workload.r = Math.floor(rnd() * ROWS);
      workloads.push(workload);
    }

    const trails = new Float32Array(COLS * ROWS * 4);
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

      for (let i = 0; i < workloads.length; i++) {
        const workload = workloads[i];
        const target = targets[workload.group];

        const dc = Math.sign(target.c - workload.c);
        const dr = Math.sign(target.r - workload.r);
        const bias = [0.6, 0.4, 0.5, 0.3][workload.group];
        let pickH = rnd() < bias;
        if (dc === 0) pickH = false;
        if (dr === 0) pickH = true;

        let ndc = 0, ndr = 0;
        if (pickH) ndc = dc; else ndr = dr;

        if (rnd() < 0.08) {
          if (pickH) ndr = rnd() < 0.5 ? -1 : 1;
          else ndc = rnd() < 0.5 ? -1 : 1;
          if (pickH) ndc = 0; else ndr = 0;
        }

        workload.dir = { dc: ndc, dr: ndr };
        workload.c = Math.max(0, Math.min(COLS - 1, workload.c + ndc));
        workload.r = Math.max(0, Math.min(ROWS - 1, workload.r + ndr));

        trails[trailIdx(workload.c, workload.r, workload.group)] = Math.min(1, trails[trailIdx(workload.c, workload.r, workload.group)] + 0.55);

        workload.life++;
        if (workload.c === target.c && workload.r === target.r) {
          for (let k = -1; k <= 1; k++) for (let l = -1; l <= 1; l++) {
            const cc = target.c + k, rr = target.r + l;
            if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS) {
              trails[trailIdx(cc, rr, workload.group)] = Math.min(1, trails[trailIdx(cc, rr, workload.group)] + 0.3);
            }
          }
          spawn(workload);
        } else if (workload.life > workload.maxLife) {
          spawn(workload);
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

      // Draw activity trails
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

      // Draw targets: small square brackets
      for (let i = 0; i < targets.length; i++) {
        const o = targets[i];
        const x = o.c * CELL, y = o.r * CELL;
        ctx.strokeStyle = colors[o.group];
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

      // Draw workloads as small squares
      for (let i = 0; i < workloads.length; i++) {
        const workload = workloads[i];
        const x = workload.c * CELL + CELL / 2;
        const y = workload.r * CELL + CELL / 2;
        const col = colors[workload.group];
        // direction tick
        ctx.strokeStyle = hexA(col, 0.7);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + workload.dir.dc * (CELL * 0.55), y + workload.dir.dr * (CELL * 0.55));
        ctx.stroke();
        // body
        ctx.fillStyle = hexA(col, 0.55);
        const sz = workload.group === 0 ? 3 : 2.5;
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
      if (t % 3000 === 0) placeTargets();
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

  window.BQTopology = { init };
})();
