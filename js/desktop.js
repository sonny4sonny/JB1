/* ===================== DESKTOP / APPS ===================== */
(() => {
  const PROJECTS = [
    { id: 'p1', title: 'Project_01', gradient: ['#ff7e5f', '#feb47b'], caption: "first thing " },
    { id: 'p2', title: 'Project_02', gradient: ['#6a82fb', '#fc5c7d'], caption: 'second slot' },
    { id: 'p3', title: 'Project_03', gradient: ['#43cea2', '#185a9d'], caption: "not sure yet" },
    { id: 'p4', title: 'Project_04', gradient: ['#f7971e', '#ffd200'], caption: "older piece" },
    { id: 'p5', title: 'Project_05', gradient: ['#ee0979', '#ff6a00'], caption: 'another old one' },
    { id: 'p6', title: 'Project_06', gradient: ['#8e2de2', '#4a00e0'], caption: "can't fully remember why i made this one" },
    { id: 'p7', title: 'Project_07', gradient: ['#11998e', '#38ef7d'], caption: "or this one" },
    { id: 'p8', title: 'Project_08', gradient: ['#fc4a1a', '#f7b733'], caption: 'this is for the 2am starter' }
  ];

  const FOLDERS = {
    oldwork: { title: 'Old_Work', indices: [3, 4, 5] },
    wip: { title: 'WIP', indices: [6, 7] }
  };

  let viewerIndex = 0;

  function artBox(gradient, label, big) {
    const div = document.createElement('div');
    div.className = 'placeholder-art';
    div.style.background = `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`;
    div.style.fontSize = big ? '18px' : '12px';
    div.textContent = label;
    return div;
  }

  function renderViewer(body) {
    const proj = PROJECTS[viewerIndex];
    body.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'viewer-wrap';

    const box = artBox(proj.gradient, proj.title, true);
    box.style.width = '100%';
    box.style.height = '220px';
    box.style.cursor = 'zoom-in';
    box.addEventListener('click', () => openFullscreen(viewerIndex));
    wrap.appendChild(box);

    const caption = document.createElement('div');
    caption.className = 'viewer-caption';
    caption.textContent = proj.caption;
    wrap.appendChild(caption);

    const nav = document.createElement('div');
    nav.className = 'viewer-nav';
    nav.innerHTML = `<button data-act="prev">&larr; Prev</button><span>${viewerIndex + 1} / ${PROJECTS.length}</span><button data-act="next">Next &rarr;</button><button data-act="full">&#10021; Fullscreen</button>`;
    nav.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.click();
        if (btn.dataset.act === 'prev') openViewer((viewerIndex - 1 + PROJECTS.length) % PROJECTS.length);
        else if (btn.dataset.act === 'next') openViewer((viewerIndex + 1) % PROJECTS.length);
        else openFullscreen(viewerIndex);
      });
    });
    wrap.appendChild(nav);
    body.appendChild(wrap);
  }

  function openViewer(index) {
    viewerIndex = index;
    const proj = PROJECTS[index];
    const el = WM.open({
      id: 'viewer',
      title: proj.title + '.jpg',
      icon: '🖼️',
      width: 460,
      height: 400,
      onOpen: renderViewer
    });
    WM.setTitle('viewer', proj.title + '.jpg');
    renderViewer(el.querySelector('.win-body'));
  }

  function openFullscreen(index) {
    closeFullscreen();
    const proj = PROJECTS[index];
    const overlay = document.createElement('div');
    overlay.className = 'fullscreen-overlay';
    overlay.id = 'fullscreen-overlay';

    const art = artBox(proj.gradient, proj.title, true);
    art.classList.add('fs-art');
    art.style.fontSize = '26px';

    const caption = document.createElement('div');
    caption.className = 'fs-caption';
    caption.textContent = proj.caption;

    const hint = document.createElement('div');
    hint.className = 'fs-hint';
    hint.textContent = 'click anywhere (or press Esc) to close';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'fs-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); SFX.click(); closeFullscreen(); });

    overlay.appendChild(closeBtn);
    overlay.appendChild(art);
    overlay.appendChild(caption);
    overlay.appendChild(hint);
    overlay.addEventListener('click', () => { SFX.click(); closeFullscreen(); });
    document.body.appendChild(overlay);

    document.addEventListener('keydown', escCloseHandler);
  }

  function escCloseHandler(e) {
    if (e.key === 'Escape') closeFullscreen();
  }

  function closeFullscreen() {
    const existing = document.getElementById('fullscreen-overlay');
    if (existing) existing.remove();
    document.removeEventListener('keydown', escCloseHandler);
  }

  function renderThumbGrid(container, indices) {
    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'gallery-grid';
    indices.forEach(i => {
      const proj = PROJECTS[i];
      const thumb = document.createElement('div');
      thumb.className = 'gallery-thumb';
      const box = artBox(proj.gradient, '', false);
      box.classList.add('thumb-box');
      thumb.appendChild(box);
      const name = document.createElement('div');
      name.textContent = proj.title + '.jpg';
      thumb.appendChild(name);
      thumb.addEventListener('click', () => { SFX.click(); openViewer(i); });
      wrap.appendChild(thumb);
    });
    container.appendChild(wrap);
  }

  function openGallery() {
    WM.open({
      id: 'gallery',
      title: 'Gallery',
      icon: '📁',
      width: 440,
      height: 360,
      noPad: true,
      onOpen: (body) => renderThumbGrid(body, PROJECTS.map((_, i) => i))
    });
  }

  function openFolder(key) {
    const folder = FOLDERS[key];
    WM.open({
      id: 'folder-' + key,
      title: folder.title,
      icon: '📁',
      width: 360,
      height: 300,
      noPad: true,
      onOpen: (body) => renderThumbGrid(body, folder.indices)
    });
  }

  function openReadme() {
    const text = `yo.

portfolio

what's actually here right now:
  - Project_01 / 02 / 03  -> newer stuff
  - Old_Work (folder)      -> older pieces
  - WIP (folder)           -> unfinished things
  - Gallery                -> everything in one place
  - paint.exe              -> a working little paint app, go crazy style
  - My Computer, Recycle Bin -> what are you trying to delete?

click into any image and hit fullscreen if you want a closer look.


— JB`;
    WM.open({
      id: 'readme',
      title: 'README.txt - Notepad',
      icon: '📝',
      width: 440,
      height: 380,
      content: `<pre>${text}</pre>`
    });
  }

  function openContact() {
    const html = `
      <div class="list-rows">
        <div class="list-row"><span class="row-icon">✉️</span><div><div class="row-name">jack.battye54@gmail.com</div><div class="row-sub"></div></div></div>
        <div class="list-row"><span class="row-icon">📸</span><div><div class="row-name">@dontquitwithoutsaving</div><div class="row-sub"></div></div></div>
        <div class="list-row"><span class="row-icon">🎵</span><div><div class="row-name">soundcloud</div><div class="row-sub"></div></div></div>
        <div class="list-row"><span class="row-icon">💬</span><div><div class="row-name">sumn else</div><div class="row-sub"></div></div></div>
      </div>`;
    WM.open({ id: 'contact', title: 'contact_jb.bat', icon: '📟', width: 340, height: 260, content: html });
  }

  function openMyComputer() {
    const html = `
      <div class="list-rows">
        <div class="list-row"><span class="row-icon">💾</span><div><div class="row-name">JB_WORK (C:)</div><div class="row-sub">finished stuff</div></div></div>
        <div class="list-row"><span class="row-icon">💾</span><div><div class="row-name">IDEAS (D:)</div><div class="row-sub">half-finished stuff</div></div></div>
        <div class="list-row"><span class="row-icon">💾</span><div><div class="row-name">NOT_MINE (E:)</div><div class="row-sub">92% full</div></div></div>
        <div class="list-row"><span class="row-icon">💿</span><div><div class="row-name">PORTFOLIO_OS (F:)</div><div class="row-sub">you are here</div></div></div>
      </div>`;
    WM.open({ id: 'mycomputer', title: 'My Computer', icon: '💻', width: 340, height: 260, content: html });
  }

  function openRecycleBin() {
    const html = `
      <div class="list-rows">
        <div class="list-row"><span class="row-icon">🗑️</span><div><div class="row-name">sumn</div><div class="row-sub">deleted</div></div></div>
        <div class="list-row"><span class="row-icon">🗑️</span><div><div class="row-name">old_portfolio_2019.psd</div><div class="row-sub">we don't talk about this</div></div></div>
        <div class="list-row"><span class="row-icon">🗑️</span><div><div class="row-name">excuses.txt</div><div class="row-sub">0 bytes</div></div></div>
      </div>`;
    WM.open({ id: 'recyclebin', title: 'Recycle Bin', icon: '🗑️', width: 340, height: 240, content: html });
  }

  function openDontClick() {
    WM.open({
      id: 'dontclick',
      title: 'Warning',
      icon: '⚠️',
      width: 300,
      height: 160,
      content: `<div style="text-align:center;padding-top:10px;">
          <div style="font-size:34px;">😅</div>
          <p>told you not to click it.</p>
          <p style="font-size:11px;color:#777;">gotcha</p>
        </div>`
    });
  }


  function openPaint() {
    WM.open({
      id: 'paint',
      title: 'paint.exe',
      icon: '🎨',
      width: 700,
      height: 520,
      noPad: true,
      onOpen: (body) => PaintApp.build(body)
    });
  }

  const APPS = {
    project1: () => openViewer(0),
    project2: () => openViewer(1),
    project3: () => openViewer(2),
    oldwork: () => openFolder('oldwork'),
    wip: () => openFolder('wip'),
    gallery: openGallery,
    readme: openReadme,
    contact: openContact,
    mycomputer: openMyComputer,
    recyclebin: openRecycleBin,
    dontclick: openDontClick,
    paint: openPaint
  };

  const ICONS = [
    { id: 'project1', label: 'Project_01.jpg', glyph: '🖼️' },
    { id: 'project2', label: 'Project_02.jpg', glyph: '🖼️' },
    { id: 'project3', label: 'Project_03.jpg', glyph: '🖼️' },
    { id: 'oldwork', label: 'Old_Work', glyph: '📁' },
    { id: 'wip', label: 'WIP', glyph: '📁' },
    { id: 'gallery', label: 'Gallery', glyph: '🗂️' },
    { id: 'readme', label: 'README.txt', glyph: '📝' },
    { id: 'paint', label: 'paint.exe', glyph: '🎨' },
    { id: 'contact', label: 'contact_jb.bat', glyph: '📟' },
    { id: 'mycomputer', label: 'My Computer', glyph: '💻' },
    { id: 'recyclebin', label: 'Recycle Bin', glyph: '🗑️' },
    { id: 'dontclick', label: "dont_click.exe", glyph: '💀' },
  ];

    const ICON_STEP_X = 100;
  const ICON_STEP_Y = 100;
  const ICON_PAD = 16;
  const ICON_W = 84;
  const ICON_H = 88;
  const POSITIONS_KEY = 'jbPortfolioIconPositions';

  function loadPositions() {
    try {
      return JSON.parse(localStorage.getItem(POSITIONS_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function savePosition(id, x, y) {
    const positions = loadPositions();
    positions[id] = { x, y };
    try { localStorage.setItem(POSITIONS_KEY, JSON.stringify(positions)); } catch (e) { /* storage unavailable */ }
  }

  function defaultPosition(index, layer) {
    const rowsPerCol = Math.max(1, Math.floor(layer.clientHeight / ICON_STEP_Y));
    const col = Math.floor(index / rowsPerCol);
    const row = index % rowsPerCol;
    return { x: ICON_PAD + col * ICON_STEP_X, y: ICON_PAD + row * ICON_STEP_Y };
  }

  function renderIcons() {
    const layer = document.getElementById('icon-layer');
    const saved = loadPositions();

    ICONS.forEach((icon, index) => {
      const el = document.createElement('button');
      el.className = 'desktop-icon';
      el.innerHTML = `<span class="glyph">${icon.glyph}</span><span class="label">${icon.label}</span>`;

      const pos = saved[icon.id] || defaultPosition(index, layer);
      el.style.left = pos.x + 'px';
      el.style.top = pos.y + 'px';

      let dragging = false;
      let moved = false;
      let startX = 0, startY = 0, origX = 0, origY = 0;

      el.addEventListener('pointerdown', (e) => {
        dragging = true;
        moved = false;
        startX = e.clientX; startY = e.clientY;
        origX = parseFloat(el.style.left) || 0;
        origY = parseFloat(el.style.top) || 0;
        el.setPointerCapture(e.pointerId);
        el.style.zIndex = 2;
      });

      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        if (!moved) return;
        let nx = origX + dx;
        let ny = origY + dy;
        nx = Math.max(0, Math.min(nx, layer.clientWidth - ICON_W));
        ny = Math.max(0, Math.min(ny, layer.clientHeight - ICON_H));
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
      });

      ['pointerup', 'pointercancel'].forEach(ev => {
        el.addEventListener(ev, () => {
          dragging = false;
          el.style.zIndex = '';
          if (moved) savePosition(icon.id, parseFloat(el.style.left), parseFloat(el.style.top));
        });
      });

      el.addEventListener('click', () => {
        if (moved) { moved = false; return; }
        SFX.click();
        layer.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
        el.classList.add('selected');
        APPS[icon.id] && APPS[icon.id]();
      });

      layer.appendChild(el);
    });
  }

  function initStartMenu() {
    const startBtn = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      SFX.click();
      startMenu.classList.toggle('hidden');
    });
    startMenu.querySelectorAll('.start-item[data-app]').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.click();
        startMenu.classList.add('hidden');
        APPS[btn.dataset.app] && APPS[btn.dataset.app]();
      });
    });
    document.getElementById('shutdown-btn').addEventListener('click', () => {
      SFX.click();
      startMenu.classList.add('hidden');
      WM.open({
        id: 'shutdown',
        title: 'Shut Down',
        icon: '⏻',
        width: 300,
        height: 140,
        content: `<div style="text-align:center;padding-top:14px;">
            <p>bruh this is a website, not an OS.</p>
            <p style="font-size:11px;color:#777;"></p>
          </div>`
      });
    });
    document.addEventListener('click', () => startMenu.classList.add('hidden'));
    startMenu.addEventListener('click', (e) => e.stopPropagation());
  }

  function initClock() {
    const clock = document.getElementById('clock');
    function tick() {
      const now = new Date();
      let h = now.getHours();
      const m = String(now.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      clock.textContent = `${h}:${m} ${ampm}`;
    }
    tick();
    setInterval(tick, 1000 * 15);
  }

  function initDesktopDeselect() {
    document.getElementById('desktop').addEventListener('click', (e) => {
      if (e.target.closest('.desktop-icon')) return;
      document.querySelectorAll('.desktop-icon.selected').forEach(i => i.classList.remove('selected'));
    });
  }

  window.DesktopInit = function () {
    renderIcons();
    initStartMenu();
    initClock();
    initDesktopDeselect();
  };
})();