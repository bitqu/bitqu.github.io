// Shared: theme/accent persistence, tweaks, nav, header, footer, tickers
(function () {
  const STORAGE = 'bitqubic.settings.v1';

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (!raw) return { theme: 'dark', accent: 'lime', hero: 'swarm' };
      return Object.assign({ theme: 'dark', accent: 'lime', hero: 'swarm' }, JSON.parse(raw));
    } catch (e) { return { theme: 'dark', accent: 'lime', hero: 'swarm' }; }
  }

  function saveSettings(s) {
    try { localStorage.setItem(STORAGE, JSON.stringify(s)); } catch (e) {}
  }

  function applySettings(s) {
    document.documentElement.setAttribute('data-theme', s.theme);
    document.documentElement.setAttribute('data-accent', s.accent);
    document.documentElement.setAttribute('data-hero', s.hero);
  }

  const settings = loadSettings();
  applySettings(settings);
  window.BQ = { settings, saveSettings, applySettings };

  // Nav + Footer injection
  function currentPage() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p.toLowerCase();
  }
  const links = [
    { href: 'platform.html', label: 'Platform' },
    { href: 'simulations.html', label: 'Agentic Simulations' },
    { href: 'federated.html', label: 'Federated Learning' },
    { href: 'orchestration.html', label: 'Carbon Orchestration' },
  ];

  function renderNav() {
    const mount = document.getElementById('nav-mount');
    if (!mount) return;
    const cp = currentPage();
    mount.innerHTML = `
      <nav class="nav"><div class="wrap nav-inner">
        <a class="brand" href="index.html">
          <span class="brand-mark" aria-hidden="true"></span>
          <span class="brand-name">BitQubic</span>
        </a>
        <div class="nav-links">
          ${links.map(l => `<a href="${l.href}"${cp === l.href ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}
        </div>
        <div class="nav-cta">
          <a class="btn btn-ghost" href="contact.html">Contact</a>
          <a class="btn btn-primary" href="contact.html">Book a demo <span class="arr">→</span></a>
        </div>
      </div></nav>
    `;
  }

  function renderFooter() {
    const mount = document.getElementById('foot-mount');
    if (!mount) return;
    mount.innerHTML = `
      <footer class="foot"><div class="wrap">
        <div class="foot-grid">
          <div>
            <a class="brand" href="index.html" style="margin-bottom:18px">
              <span class="brand-mark"></span><span class="brand-name">BitQubic</span>
            </a>
            <p style="color:var(--fg-dim); font-size:14px; max-width:320px; margin:16px 0 0;">Distributed intelligence infrastructure. Built for institutions that treat AI as a system, not a feature.</p>
            <div style="display:flex; gap:10px; margin-top:20px;">
              <span class="chip"><span class="dot"></span>SOC 2 Type II</span>
              <span class="chip">ISO 27001</span>
            </div>
          </div>
          <div>
            <h5>Products</h5>
            <ul>
              <li><a href="simulations.html">Agentic simulations</a></li>
              <li><a href="federated.html">Federated learning</a></li>
              <li><a href="orchestration.html">Carbon orchestration</a></li>
              <li><a href="platform.html">Platform</a></li>
            </ul>
          </div>
          <div>
            <h5>Company</h5>
            <ul>
              <li><a href="customers.html">Customers</a></li>
              <li><a href="careers.html">Careers</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="#">Research</a></li>
            </ul>
          </div>
          <div>
            <h5>Resources</h5>
            <ul>
              <li><a href="#">Whitepapers</a></li>
              <li><a href="#">Benchmarks</a></li>
              <li><a href="#">Security</a></li>
              <li><a href="#">Status</a></li>
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
              <li><a href="#">DPA</a></li>
              <li><a href="#">Trust</a></li>
            </ul>
          </div>
        </div>
        <div class="foot-bottom">
          <span>© 2026 BitQubic Labs, Inc.</span>
          <span>Palo Alto · Zürich · Singapore</span>
        </div>
      </div></footer>
    `;
  }

  function renderTicker() {
    const mount = document.getElementById('ticker-mount');
    if (!mount) return;
    const items = [
      '<span><b>LIVE</b> 412 federated nodes training · 18 regions</span>',
      '<span><b>GRID</b> eu-north-1 · 38 gCO₂e/kWh · routing +12% load</span>',
      '<span><b>SIM</b> run #81,402 · 12,000 agents · 4.6× baseline</span>',
      '<span><b>PAPER</b> Chen et al. 2026 · FedAvg drift under async aggregation</span>',
      '<span><b>GRID</b> us-west-2 · 412 gCO₂e/kWh · deferring batch</span>',
      '<span><b>LIVE</b> 412 federated nodes training · 18 regions</span>',
      '<span><b>GRID</b> eu-north-1 · 38 gCO₂e/kWh · routing +12% load</span>',
      '<span><b>SIM</b> run #81,402 · 12,000 agents · 4.6× baseline</span>',
      '<span><b>PAPER</b> Chen et al. 2026 · FedAvg drift under async aggregation</span>',
      '<span><b>GRID</b> us-west-2 · 412 gCO₂e/kWh · deferring batch</span>',
    ];
    mount.innerHTML = `<div class="ticker"><div class="ticker-track">${items.join('')}</div></div>`;
  }

  function renderTweaks() {
    const mount = document.getElementById('tweaks-mount');
    if (!mount) return;
    const s = window.BQ.settings;
    const hasHero = document.body.dataset.hasHero === 'true';
    mount.innerHTML = `
      <div class="tweaks" id="tweaks-panel">
        <h6>Tweaks</h6>
        <div class="tweaks-row"><span>Theme</span>
          <div class="tweaks-btns">
            <button class="tw ${s.theme==='dark'?'on':''}" data-k="theme" data-v="dark">Dark</button>
            <button class="tw ${s.theme==='light'?'on':''}" data-k="theme" data-v="light">Light</button>
          </div>
        </div>
        <div class="tweaks-row"><span>Accent</span>
          <div class="tweaks-btns">
            <button class="tw-swatch ${s.accent==='lime'?'on':''}" data-k="accent" data-v="lime" style="background:#d8ff3e"></button>
            <button class="tw-swatch ${s.accent==='amber'?'on':''}" data-k="accent" data-v="amber" style="background:#ffb23e"></button>
            <button class="tw-swatch ${s.accent==='cyan'?'on':''}" data-k="accent" data-v="cyan" style="background:#7ff0e8"></button>
            <button class="tw-swatch ${s.accent==='violet'?'on':''}" data-k="accent" data-v="violet" style="background:#c9a8ff"></button>
          </div>
        </div>
        ${hasHero ? `
        <div class="tweaks-row"><span>Hero</span>
          <div class="tweaks-btns">
            <button class="tw ${s.hero==='swarm'?'on':''}" data-k="hero" data-v="swarm">Swarm</button>
            <button class="tw ${s.hero==='editorial'?'on':''}" data-k="hero" data-v="editorial">Editorial</button>
          </div>
        </div>` : ''}
      </div>
    `;
    mount.querySelectorAll('[data-k]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.k, v = btn.dataset.v;
        window.BQ.settings[k] = v;
        window.BQ.saveSettings(window.BQ.settings);
        window.BQ.applySettings(window.BQ.settings);
        renderTweaks();
        document.getElementById('tweaks-panel').classList.add('show');
        window.dispatchEvent(new CustomEvent('bq-settings-changed', { detail: window.BQ.settings }));
      });
    });
  }

  // Edit-mode protocol
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') {
      document.getElementById('tweaks-panel')?.classList.add('show');
    } else if (d.type === '__deactivate_edit_mode') {
      document.getElementById('tweaks-panel')?.classList.remove('show');
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    renderFooter();
    renderTicker();
    renderTweaks();
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
  });
})();
