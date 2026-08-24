/* ===================== PAINT APP ===================== */
const PaintApp = (() => {
  const COLORS = [
    '#000000', '#7f7f7f', '#880015', '#ed1c24', '#ff7f27', '#fff200',
    '#22b14c', '#00a2e8', '#3f48cc', '#a349a4', '#ffffff', '#c3c3c3',
    '#b97a57', '#ffaec9', '#ffc90e', '#efe4b0', '#b5e61d', '#99d9ea',
    '#7092be', '#c8bfe7'
  ];

  function build(container) {
    container.innerHTML = `
      <div class="paint-app">
        <div class="paint-toolbar">
          <div class="paint-tool-group">
            <button class="paint-tool-btn active" data-tool="pencil">✏️ Pencil</button>
            <button class="paint-tool-btn" data-tool="eraser">🧽 Eraser</button>
          </div>
          <div class="paint-tool-group">
            <label>Size</label>
            <input type="range" min="1" max="30" value="4" class="brush-size">
          </div>
          <div class="paint-tool-group">
            <button class="paint-tool-btn clear-btn">🗑️ Clear</button>
            <button class="paint-tool-btn save-btn">💾 Save PNG</button>
          </div>
        </div>
        <div class="paint-canvas-wrap">
          <canvas class="paint-canvas" width="640" height="420"></canvas>
        </div>
        <div class="paint-palette">
          <div class="palette-current"></div>
          <div class="palette-swatches"></div>
        </div>
      </div>
    `;

    const canvas = container.querySelector('.paint-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let tool = 'pencil';
    let color = '#000000';
    let size = 4;
    let drawing = false;
    let lastX = 0, lastY = 0;

    const currentSwatch = container.querySelector('.palette-current');
    currentSwatch.style.background = color;

    const swatchWrap = container.querySelector('.palette-swatches');
    COLORS.forEach((c, i) => {
      const sw = document.createElement('div');
      sw.className = 'palette-swatch' + (i === 0 ? ' selected' : '');
      sw.style.background = c;
      sw.addEventListener('click', () => {
        SFX.click();
        color = c;
        currentSwatch.style.background = c;
        swatchWrap.querySelectorAll('.palette-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
      });
      swatchWrap.appendChild(sw);
    });

    container.querySelectorAll('.paint-tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.click();
        tool = btn.dataset.tool;
        container.querySelectorAll('.paint-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    container.querySelector('.brush-size').addEventListener('input', (e) => {
      size = Number(e.target.value);
    });

    container.querySelector('.clear-btn').addEventListener('click', () => {
      SFX.click();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    container.querySelector('.save-btn').addEventListener('click', () => {
      SFX.click();
      const link = document.createElement('a');
      link.download = `jb-paint-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });

    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
      };
    }

    canvas.addEventListener('pointerdown', (e) => {
      drawing = true;
      const p = pos(e);
      lastX = p.x; lastY = p.y;
      canvas.setPointerCapture(e.pointerId);
      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.fill();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const p = pos(e);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev =>
      canvas.addEventListener(ev, () => { drawing = false; })
    );
  }

  return { build };
})();