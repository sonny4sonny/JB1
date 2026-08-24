/* ===================== MINESWEEPER ===================== */
const MinesweeperApp = (() => {
  const DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 }
  };

  function build(container) {
    let state;
    let currentDiff = 'beginner';

    function makeEmptyGrid(rows, cols) {
      const g = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push({ mine: false, revealed: false, flagged: false, adjacent: 0 });
        }
        g.push(row);
      }
      return g;
    }

    function newGame(diffKey) {
      currentDiff = diffKey || currentDiff;
      const d = DIFFICULTIES[currentDiff];
      if (state && state.timerId) clearInterval(state.timerId);
      state = {
        rows: d.rows, cols: d.cols, mines: d.mines,
        grid: makeEmptyGrid(d.rows, d.cols),
        started: false, over: false, won: false,
        flagsUsed: 0, timerId: null, seconds: 0
      };
      updateFace('🙂');
      renderBoard();
      updateCounters();
    }

    function placeMines(excludeR, excludeC) {
      const { rows, cols, mines, grid } = state;
      const excluded = new Set();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const rr = excludeR + dr, cc = excludeC + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) excluded.add(rr + ',' + cc);
        }
      }
      let placed = 0;
      while (placed < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (excluded.has(r + ',' + c) || grid[r][c].mine) continue;
        grid[r][c].mine = true;
        placed++;
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].mine) continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const rr = r + dr, cc = c + dc;
              if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && grid[rr][cc].mine) count++;
            }
          }
          grid[r][c].adjacent = count;
        }
      }
    }

    function startTimer() {
      state.timerId = setInterval(() => {
        state.seconds = Math.min(999, state.seconds + 1);
        updateCounters();
      }, 1000);
    }

    function stopTimer() {
      if (state.timerId) { clearInterval(state.timerId); state.timerId = null; }
    }

    function floodReveal(sr, sc) {
      const { rows, cols, grid } = state;
      const stack = [[sr, sc]];
      while (stack.length) {
        const [r, c] = stack.pop();
        const cell = grid[r][c];
        if (cell.revealed || cell.flagged) continue;
        cell.revealed = true;
        if (cell.mine) continue;
        if (cell.adjacent === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const rr = r + dr, cc = c + dc;
              if (rr >= 0 && rr < rows && cc >= 0 && cc < cols && !grid[rr][cc].revealed && !grid[rr][cc].flagged) {
                stack.push([rr, cc]);
              }
            }
          }
        }
      }
    }

    function revealCell(r, c) {
      if (state.over) return;
      const cell = state.grid[r][c];
      if (cell.revealed || cell.flagged) return;

      SFX.click();

      if (!state.started) {
        state.started = true;
        placeMines(r, c);
        startTimer();
      }

      floodReveal(r, c);

      if (state.grid[r][c].mine) {
        loseGame(r, c);
        return;
      }
      checkWin();
      renderBoard();
    }

    function toggleFlag(r, c) {
      if (state.over) return;
      const cell = state.grid[r][c];
      if (cell.revealed) return;
      SFX.click();
      cell.flagged = !cell.flagged;
      state.flagsUsed += cell.flagged ? 1 : -1;
      updateCounters();
      renderBoard();
    }

    function chord(r, c) {
      if (state.over) return;
      const cell = state.grid[r][c];
      if (!cell.revealed || cell.adjacent === 0) return;
      const { rows, cols, grid } = state;
      let flagCount = 0;
      const neighbors = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = r + dr, cc = c + dc;
          if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) {
            neighbors.push([rr, cc]);
            if (grid[rr][cc].flagged) flagCount++;
          }
        }
      }
      if (flagCount !== cell.adjacent) return;

      SFX.click();
      let hitMine = false, hitR = -1, hitC = -1;
      neighbors.forEach(([rr, cc]) => {
        const n = grid[rr][cc];
        if (n.revealed || n.flagged) return;
        floodReveal(rr, cc);
        if (n.mine) { hitMine = true; hitR = rr; hitC = cc; }
      });
      if (hitMine) { loseGame(hitR, hitC); return; }
      checkWin();
      renderBoard();
    }

    function loseGame(mineR, mineC) {
      state.over = true;
      state.won = false;
      stopTimer();
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          const cell = state.grid[r][c];
          if (cell.mine) cell.revealed = true;
          if (cell.flagged && !cell.mine) cell.wrongFlag = true;
        }
      }
      state.grid[mineR][mineC].exploded = true;
      updateFace('😵');
      renderBoard();
    }

    function checkWin() {
      const { rows, cols, grid, mines } = state;
      let revealedSafe = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].revealed && !grid[r][c].mine) revealedSafe++;
        }
      }
      if (revealedSafe === rows * cols - mines) {
        state.over = true;
        state.won = true;
        stopTimer();
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (grid[r][c].mine) grid[r][c].flagged = true;
          }
        }
        state.flagsUsed = mines;
        updateFace('😎');
        SFX.win();
        updateCounters();
      }
    }

    function updateFace(emoji) {
      const el = container.querySelector('.msw-face');
      if (el) el.textContent = emoji;
    }

    function formatCounter(n) {
      const neg = n < 0;
      const abs = Math.min(999, Math.abs(n));
      const str = String(abs).padStart(neg ? 2 : 3, '0');
      return (neg ? '-' : '') + str;
    }

    function updateCounters() {
      const mineLeft = Math.max(-99, Math.min(999, state.mines - state.flagsUsed));
      container.querySelector('.msw-mine-counter').textContent = formatCounter(mineLeft);
      container.querySelector('.msw-timer').textContent = formatCounter(state.seconds);
    }

    function cellContent(cell) {
      if (cell.wrongFlag) return '❌';
      if (cell.flagged) return '🚩';
      if (!cell.revealed) return '';
      if (cell.mine) return '💣';
      if (cell.adjacent === 0) return '';
      return String(cell.adjacent);
    }

    function cellClass(cell) {
      let cls = 'msw-cell';
      if (cell.revealed || cell.wrongFlag) {
        cls += ' revealed';
        if (cell.mine) {
          cls += ' mine';
          if (cell.exploded) cls += ' exploded';
        } else if (cell.wrongFlag) {
          cls += ' wrong-flag';
        } else if (cell.adjacent > 0) {
          cls += ' n' + cell.adjacent;
        }
      }
      return cls;
    }

    function renderBoard() {
      const board = container.querySelector('.msw-board');
      board.innerHTML = '';
      board.style.gridTemplateColumns = `repeat(${state.cols}, 24px)`;
      board.style.gridTemplateRows = `repeat(${state.rows}, 24px)`;
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          const cell = state.grid[r][c];
          const el = document.createElement('div');
          el.className = cellClass(cell);
          el.textContent = cellContent(cell);
          el.addEventListener('click', () => revealCell(r, c));
          el.addEventListener('dblclick', () => chord(r, c));
          el.addEventListener('contextmenu', (e) => { e.preventDefault(); toggleFlag(r, c); });
          el.addEventListener('mousedown', (e) => {
            if (state.over || e.button !== 0) return;
            if (!cell.flagged && !cell.revealed) updateFace('😮');
          });
          board.appendChild(el);
        }
      }
    }

    container.innerHTML = `
      <div class="msw-app">
        <div class="msw-toolbar">
          <button class="msw-diff-btn active" data-diff="beginner">Beginner</button>
          <button class="msw-diff-btn" data-diff="intermediate">Intermediate</button>
          <button class="msw-diff-btn" data-diff="expert">Expert</button>
        </div>
        <div class="msw-header">
          <div class="msw-mine-counter msw-counter">010</div>
          <button class="msw-face">🙂</button>
          <div class="msw-timer msw-counter">000</div>
        </div>
        <div class="msw-board-wrap">
          <div class="msw-board"></div>
        </div>
      </div>
    `;

    container.querySelectorAll('.msw-diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        SFX.click();
        container.querySelectorAll('.msw-diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        newGame(btn.dataset.diff);
      });
    });
    container.querySelector('.msw-face').addEventListener('click', () => {
      SFX.click();
      newGame(currentDiff);
    });
    container.addEventListener('contextmenu', (e) => e.preventDefault());
    container.addEventListener('mouseup', () => {
      if (state && !state.over) updateFace('🙂');
    });

    newGame('beginner');
  }

  return { build };
})();