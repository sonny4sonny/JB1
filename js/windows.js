/* ===================== WINDOW MANAGER ===================== */
const WM = (() => {
  const layer = document.getElementById('windows-layer');
  const taskbarItems = document.getElementById('taskbar-items');
  let zTop = 10;
  const openWins = new Map(); // id -> { el, taskbarBtn }
  let cascadeOffset = 0;

  function focus(id) {
    const win = openWins.get(id);
    if (!win) return;
    zTop += 1;
    win.el.style.zIndex = zTop;
    [...taskbarItems.children].forEach(b => b.classList.remove('active'));
    win.taskbarBtn.classList.add('active');
  }

  function close(id) {
    const win = openWins.get(id);
    if (!win) return;
    if (win.onClose) win.onClose();
    win.el.remove();
    win.taskbarBtn.remove();
    openWins.delete(id);
  }

  function toggleMinimize(id) {
    const win = openWins.get(id);
    if (!win) return;
    SFX.click();
    win.el.classList.toggle('minimized');
    if (!win.el.classList.contains('minimized')) focus(id);
  }

  function makeDraggable(win, handle) {
    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.win-btn')) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      const rect = win.getBoundingClientRect();
      const parentRect = layer.getBoundingClientRect();
      startLeft = rect.left - parentRect.left;
      startTop = rect.top - parentRect.top;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let newLeft = startLeft + dx;
      let newTop = Math.max(0, startTop + dy);
      win.style.left = newLeft + 'px';
      win.style.top = newTop + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(ev =>
      handle.addEventListener(ev, () => { dragging = false; })
    );
  }

   function makeResizable(win, handle) {
    let resizing = false, startX = 0, startY = 0, startW = 0, startH = 0;
    handle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      const rect = win.getBoundingClientRect();
      startW = rect.width; startH = rect.height;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener('pointermove', (e) => {
      if (!resizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const maxW = window.innerWidth - 20;
      const maxH = window.innerHeight - 60;
      const newW = Math.min(maxW, startW + dx);
      const newH = Math.min(maxH, startH + dy);
      win.style.width = newW + 'px';
      win.style.height = newH + 'px';
    });
    ['pointerup', 'pointercancel'].forEach(ev =>
      handle.addEventListener(ev, () => { resizing = false; })
    );
  }

  function open({ id, title, icon = '🗔', width = 420, height = 320, x, y, content, onOpen, onClose, noPad = false, resizable = false }) {
    if (openWins.has(id)) {
      const win = openWins.get(id);
      win.el.classList.remove('minimized');
      focus(id);
      return win.el;
    }

    cascadeOffset = (cascadeOffset + 1) % 8;
    const left = x !== undefined ? x : 60 + cascadeOffset * 26;
    const top = y !== undefined ? y : 40 + cascadeOffset * 22;

    const el = document.createElement('div');
    el.className = 'win';
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    el.style.width = width + 'px';
    el.style.height = height + 'px';
    el.innerHTML = `
      <div class="win-titlebar">
        <span class="win-icon">${icon}</span>
        <span class="win-title">${title}</span>
        <div class="win-controls">
          <button class="win-btn minimize" title="Minimize">_</button>
          <button class="win-btn close" title="Close">✕</button>
        </div>
      </div>
      <div class="win-body ${noPad ? 'no-pad' : ''}"></div>
      ${resizable ? '<div class="win-resize-handle"></div>' : ''}
    `;
    const body = el.querySelector('.win-body');
    if (typeof content === 'string') body.innerHTML = content;
    else if (content instanceof Node) body.appendChild(content);

    layer.appendChild(el);

    const titlebar = el.querySelector('.win-titlebar');
    makeDraggable(el, titlebar);
    el.addEventListener('pointerdown', () => focus(id));

    if (resizable) {
      makeResizable(el, el.querySelector('.win-resize-handle'));
    }

    const taskbarBtn = document.createElement('button');
    taskbarBtn.className = 'taskbar-task';
    taskbarBtn.innerHTML = `<span>${icon}</span><span>${title}</span>`;
    taskbarBtn.addEventListener('click', () => toggleMinimize(id));
    taskbarItems.appendChild(taskbarBtn);

    el.querySelector('.win-btn.close').addEventListener('click', (e) => {
      e.stopPropagation();
      SFX.click();
      close(id);
    });
    el.querySelector('.win-btn.minimize').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMinimize(id);
    });

    openWins.set(id, { el, taskbarBtn, onClose });
    focus(id);
    if (onOpen) onOpen(body);
    return el;
  }

  function setTitle(id, title) {
    const win = openWins.get(id);
    if (!win) return;
    win.el.querySelector('.win-title').textContent = title;
    win.taskbarBtn.querySelector('span:last-child').textContent = title;
  }

  return { open, close, focus, toggleMinimize, setTitle };
})();