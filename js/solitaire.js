/* ===================== SOLITAIRE (Klondike) ===================== */
const SolitaireApp = (() => {
  const SUITS = ['S', 'H', 'D', 'C'];
  const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const SUIT_COLOR = { S: 'black', H: 'red', D: 'red', C: 'black' };
  const FAN_OFFSET = 22;

  function rankLabel(rank) {
    if (rank === 1) return 'A';
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    return String(rank);
  }

  function createDeck() {
    const deck = [];
    SUITS.forEach(suit => {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({ suit, rank, faceUp: false });
      }
    });
    return deck;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function build(container) {
    let state;
    let celebration = null; // { raf, sprites, queue, canvas, ctx, spawnTimer, stopTimer }

    function newGame() {
      stopCelebration();
      const deck = shuffle(createDeck());
      const tableau = [[], [], [], [], [], [], []];
      for (let col = 0; col < 7; col++) {
        for (let i = 0; i <= col; i++) {
          const card = deck.pop();
          card.faceUp = i === col;
          tableau[col].push(card);
        }
      }
      deck.forEach(c => { c.faceUp = false; });
      state = {
        tableau,
        foundations: { S: [], H: [], D: [], C: [] },
        stock: deck,
        waste: []
      };
      render();
    }

    function canPlaceOnTableau(card, destArr) {
      if (!destArr.length) return card.rank === 13;
      const top = destArr[destArr.length - 1];
      return top.faceUp && top.rank === card.rank + 1 && SUIT_COLOR[top.suit] !== SUIT_COLOR[card.suit];
    }

    function canPlaceOnFoundation(card, destArr) {
      if (!destArr.length) return card.rank === 1;
      const top = destArr[destArr.length - 1];
      return top.suit === card.suit && top.rank === card.rank - 1;
    }

    function revealTop(col) {
      if (col.length && !col[col.length - 1].faceUp) col[col.length - 1].faceUp = true;
    }

    function checkWin() {
      const won = SUITS.every(s => state.foundations[s].length === 13);
      if (won && !state.over) {
        state.over = true;
        SFX.win();
        startCelebration();
      }
      return won;
    }

    function drawFromStock() {
      if (!state.stock.length) {
        if (!state.waste.length) return;
        state.stock = state.waste.reverse().map(c => ({ ...c, faceUp: false }));
        state.waste = [];
      } else {
        const c = state.stock.pop();
        c.faceUp = true;
        state.waste.push(c);
      }
      render();
    }

    function moveFromWasteToFoundation() {
      if (!state.waste.length) return false;
      const card = state.waste[state.waste.length - 1];
      if (!canPlaceOnFoundation(card, state.foundations[card.suit])) return false;
      state.waste.pop();
      state.foundations[card.suit].push(card);
      return true;
    }

    function moveFromTableauToFoundation(col) {
      const colArr = state.tableau[col];
      if (!colArr.length) return false;
      const card = colArr[colArr.length - 1];
      if (!card.faceUp || !canPlaceOnFoundation(card, state.foundations[card.suit])) return false;
      colArr.pop();
      state.foundations[card.suit].push(card);
      revealTop(colArr);
      return true;
    }

    function moveWasteToTableau(destCol) {
      if (!state.waste.length) return false;
      const card = state.waste[state.waste.length - 1];
      if (!canPlaceOnTableau(card, state.tableau[destCol])) return false;
      state.waste.pop();
      state.tableau[destCol].push(card);
      return true;
    }

    function moveTableauRunToTableau(srcCol, idx, destCol) {
      const srcArr = state.tableau[srcCol];
      const run = srcArr.slice(idx);
      if (!run.length || !run[0].faceUp || srcCol === destCol) return false;
      if (!canPlaceOnTableau(run[0], state.tableau[destCol])) return false;
      state.tableau[srcCol] = srcArr.slice(0, idx);
      state.tableau[destCol].push(...run);
      revealTop(state.tableau[srcCol]);
      return true;
    }

    function moveTableauCardToFoundationByIndex(col, idx) {
      if (idx !== state.tableau[col].length - 1) return false;
      return moveFromTableauToFoundation(col);
    }

    /* ---------- auto-complete ---------- */

    function isAutoCompleteAvailable() {
      if (!state || state.over) return false;
      for (let col = 0; col < 7; col++) {
        for (const card of state.tableau[col]) {
          if (!card.faceUp) return false;
        }
      }
      return true;
    }

    function autoComplete() {
      if (!isAutoCompleteAvailable()) return;
      SFX.click();
      let guard = 0;
      const step = () => {
        if (state.over || guard++ > 2000) { render(); return; }
        let moved = false;
        for (let col = 0; col < 7 && !moved; col++) moved = moveFromTableauToFoundation(col);
        if (!moved) moved = moveFromWasteToFoundation();
        if (!moved && state.stock.length) {
          const c = state.stock.pop();
          c.faceUp = true;
          state.waste.push(c);
          moved = true;
        } else if (!moved && state.waste.length) {
          state.stock = state.waste.reverse().map(cc => ({ ...cc, faceUp: false }));
          state.waste = [];
          moved = true;
        }
        render();
        if (moved && !checkWin()) {
          setTimeout(step, 45);
        }
      };
      step();
    }

    /* ---------- win celebration (classic bouncing-card cascade) ---------- */

    function stopCelebration() {
      if (!celebration) return;
      cancelAnimationFrame(celebration.raf);
      clearTimeout(celebration.spawnTimer);
      clearTimeout(celebration.stopTimer);
      celebration.canvas.remove();
      celebration = null;
      const badge = container.querySelector('.sol-win');
      if (badge) badge.classList.add('hidden');
    }

       function startCelebration() {
      // scoped to the board only (not .sol-app) so it never covers the toolbar —
      // otherwise the New Game / Auto Complete buttons sit right where the
      // dismiss-on-click canvas is, and your mouse is naturally still resting
      // there right after triggering the win, instantly wiping the celebration
      const boardEl = container.querySelector('.sol-board');
      const canvas = document.createElement('canvas');
      canvas.className = 'sol-celebration';
      const rect = boardEl.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      boardEl.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const allCards = [];
      SUITS.forEach(s => {
        for (let r = 1; r <= 13; r++) allCards.push({ suit: s, rank: r });
      });
      shuffle(allCards);

      celebration = {
        raf: null, spawnTimer: null, stopTimer: null,
        canvas, ctx, sprites: [], queue: allCards.slice()
      };

      const badge = container.querySelector('.sol-win');
      badge.classList.remove('hidden');

      // ignore dismiss-clicks for a moment so a stray click right as the game
      // is won (e.g. your mouse still sitting on the Auto Complete button)
      // doesn't instantly kill the celebration before you've even seen it
      const readyAt = Date.now() + 600;
      canvas.addEventListener('click', () => {
        if (Date.now() < readyAt) return;
        SFX.click();
        stopCelebration();
        newGame();
      });

      const CARD_W = 44, CARD_H = 62;
      const boardRect = boardEl.getBoundingClientRect();
      const foundationEls = [...container.querySelectorAll('.sol-foundation')];
      const spawnXPositions = foundationEls.length
        ? foundationEls.map(el => el.getBoundingClientRect().left - boardRect.left)
        : [canvas.width * 0.6, canvas.width * 0.7, canvas.width * 0.8, canvas.width * 0.9];

      function randSign() { return Math.random() < 0.5 ? -1 : 1; }

      function spawnCard() {
        if (!celebration) return;
        if (!celebration.queue.length) {
          celebration.queue = shuffle(allCards.slice());
        }
        const card = celebration.queue.pop();
        celebration.sprites.push({
          x: spawnXPositions[Math.floor(Math.random() * spawnXPositions.length)],
          y: -CARD_H,
          vx: randSign() * (0.6 + Math.random() * 1.2),
          vy: -(3 + Math.random() * 3),
          rank: card.rank,
          suit: card.suit,
          color: SUIT_COLOR[card.suit],
          bounces: 0
        });
        celebration.spawnTimer = setTimeout(spawnCard, 35);
      }
      spawnCard();

      function drawCard(s) {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.fillRect(s.x, s.y, CARD_W, CARD_H);
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, CARD_W, CARD_H);
        ctx.fillStyle = s.color === 'red' ? '#c0392b' : '#222';
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.textBaseline = 'top';
        ctx.fillText(rankLabel(s.rank), s.x + 3, s.y + 3);
        ctx.font = '16px sans-serif';
        ctx.fillText(SUIT_SYMBOL[s.suit], s.x + CARD_W / 2 - 8, s.y + CARD_H / 2 - 10);
      }

      function tick() {
        if (!celebration) return;
        const gravity = 0.3;
        const floor = canvas.height - CARD_H;
        const survivors = [];
        celebration.sprites.forEach(s => {
          s.vy += gravity;
          s.x += s.vx;
          s.y += s.vy;
          if (s.y >= floor) {
            s.y = floor;
            s.vy = -s.vy * 0.76;
            s.bounces++;
          }
          drawCard(s);
          const offscreen = s.x < -CARD_W - 10 || s.x > canvas.width + 10;
          const stuck = s.bounces > 60;
          if (!offscreen && !stuck) survivors.push(s);
        });
        celebration.sprites = survivors;
        celebration.raf = requestAnimationFrame(tick);
      }
      tick();

      celebration.stopTimer = setTimeout(() => {
        if (celebration) celebration.queue = [];
      }, 20000);
    }

    /* ---------- rendering ---------- */

    function cardFace(card) {
      const label = rankLabel(card.rank);
      const symbol = SUIT_SYMBOL[card.suit];
      return `
        <div class="sol-corner sol-corner-tl"><span>${label}</span><span>${symbol}</span></div>
        <div class="sol-center">${symbol}</div>
        <div class="sol-corner sol-corner-br"><span>${label}</span><span>${symbol}</span></div>
      `;
    }

    function makeCardEl(card, faceUpOverride) {
      const faceUp = faceUpOverride !== undefined ? faceUpOverride : card.faceUp;
      const el = document.createElement('div');
      el.className = 'sol-card' + (faceUp ? ' ' + SUIT_COLOR[card.suit] : ' face-down');
      if (faceUp) el.innerHTML = cardFace(card);
      return el;
    }

    function render() {
      const stockZone = container.querySelector('.sol-stock');
      stockZone.innerHTML = '';
      if (state.stock.length) {
        stockZone.appendChild(makeCardEl({ faceUp: false }, false));
      }
      stockZone.classList.toggle('recycle', !state.stock.length && state.waste.length > 0);

      const wasteZone = container.querySelector('.sol-waste');
      wasteZone.innerHTML = '';
      const wasteLen = state.waste.length;
      const wasteVisible = Math.min(3, wasteLen);
      for (let i = 0; i < wasteVisible; i++) {
        const idx = wasteLen - wasteVisible + i;
        const card = state.waste[idx];
        const el = makeCardEl(card, true);
        el.style.left = (i * 16) + 'px';
        el.style.zIndex = i;
        if (idx === wasteLen - 1) {
          attachDrag(el, { type: 'waste' });
        } else {
          el.style.cursor = 'default';
          el.style.pointerEvents = 'none';
        }
        wasteZone.appendChild(el);
      }

      SUITS.forEach(suit => {
        const zone = container.querySelector(`.sol-foundation[data-suit="${suit}"]`);
        zone.innerHTML = `<div class="sol-foundation-hint">${SUIT_SYMBOL[suit]}</div>`;
        const pile = state.foundations[suit];
        if (pile.length) zone.appendChild(makeCardEl(pile[pile.length - 1], true));
      });

      for (let col = 0; col < 7; col++) {
        const colZone = container.querySelector(`.sol-col[data-col="${col}"]`);
        colZone.innerHTML = '';
        const colArr = state.tableau[col];
        colZone.style.height = (82 + Math.max(0, colArr.length - 1) * FAN_OFFSET) + 'px';
        colArr.forEach((card, idx) => {
          const el = makeCardEl(card, card.faceUp);
          el.style.top = (idx * FAN_OFFSET) + 'px';
          el.style.zIndex = idx;
          if (card.faceUp) {
            attachDrag(el, { type: 'tableau', col, idx });
          }
          colZone.appendChild(el);
        });
      }

      container.querySelector('.sol-stock-count').textContent = state.stock.length + ' left';

      const autoBtn = container.querySelector('.sol-autocomplete');
      autoBtn.classList.toggle('hidden', !isAutoCompleteAvailable());
    }

    function attachDrag(el, source) {
      el.addEventListener('pointerdown', (e) => {
        const startX = e.clientX, startY = e.clientY;
        let dragging = false;
        let ghost = null;
        let ghostOriginX = 0, ghostOriginY = 0;
        let hiddenEls = [];

        function startGhost() {
          const rect = el.getBoundingClientRect();
          ghostOriginX = rect.left;
          ghostOriginY = rect.top;
          ghost = document.createElement('div');
          ghost.className = 'sol-drag-ghost';
          ghost.style.left = rect.left + 'px';
          ghost.style.top = rect.top + 'px';

          const run = source.type === 'tableau'
            ? state.tableau[source.col].slice(source.idx)
            : [state.waste[state.waste.length - 1]];

          run.forEach((card, i) => {
            const cEl = makeCardEl(card, true);
            cEl.style.top = (i * FAN_OFFSET) + 'px';
            cEl.style.left = '0px';
            ghost.appendChild(cEl);
          });
          document.body.appendChild(ghost);

          if (source.type === 'tableau') {
            const colEl = container.querySelector(`.sol-col[data-col="${source.col}"]`);
            hiddenEls = [...colEl.querySelectorAll('.sol-card')].slice(source.idx);
          } else {
            hiddenEls = [el];
          }
          hiddenEls.forEach(c => { c.style.visibility = 'hidden'; });
        }

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (!dragging && Math.abs(dx) + Math.abs(dy) > 5) {
            dragging = true;
            startGhost();
          }
          if (dragging && ghost) {
            ghost.style.left = (ghostOriginX + dx) + 'px';
            ghost.style.top = (ghostOriginY + dy) + 'px';
          }
        }

        function cleanup() {
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onCancel);
        }

        function onUp(ev) {
          cleanup();
          if (dragging && ghost) {
            ghost.style.pointerEvents = 'none';
            // hit-test from the center of the card graphic being dragged, not the
            // raw pointer — the pointer is usually offset from the card's center
            // (wherever it was grabbed), so testing the pointer itself made drops
            // that looked correct fail whenever the grab point was near an edge.
            const firstCardEl = ghost.firstElementChild;
            const rect = firstCardEl ? firstCardEl.getBoundingClientRect() : ghost.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dropEl = document.elementFromPoint(cx, cy);
            ghost.remove();
            ghost = null;
            handleDrop(dropEl, source);
            render();
          } else {
            // a plain click (no drag) on a card that's ready for its foundation
            // sends it straight there — no need to drag it up manually
            let moved = false;
            if (source.type === 'waste') moved = moveFromWasteToFoundation();
            else if (source.type === 'tableau') moved = moveTableauCardToFoundationByIndex(source.col, source.idx);
            if (moved) { SFX.click(); render(); checkWin(); }
          }
        }

        function onCancel() {
          cleanup();
          if (ghost) { ghost.remove(); ghost = null; }
          render();
        }

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onCancel);
      });
    }

    function handleDrop(dropEl, source) {
      if (!dropEl) return;
      const colTarget = dropEl.closest('.sol-col');
      const foundationTarget = dropEl.closest('.sol-foundation');

      let moved = false;
      if (colTarget) {
        const destCol = Number(colTarget.dataset.col);
        if (source.type === 'waste') moved = moveWasteToTableau(destCol);
        else if (source.type === 'tableau') moved = moveTableauRunToTableau(source.col, source.idx, destCol);
      } else if (foundationTarget) {
        if (source.type === 'waste') moved = moveFromWasteToFoundation();
        else if (source.type === 'tableau') moved = moveTableauCardToFoundationByIndex(source.col, source.idx);
      }
      if (moved) { SFX.click(); checkWin(); }
    }

    container.innerHTML = `
      <div class="sol-app">
        <div class="sol-toolbar">
          <button class="sol-new">🔄 New Game</button>
          <button class="sol-autocomplete hidden">⚡ Auto Complete</button>
          <div class="sol-stock-count"></div>
        </div>
        <div class="sol-board">
          <div class="sol-top-row">
            <div class="sol-stock" data-zone="stock"></div>
            <div class="sol-waste" data-zone="waste"></div>
            <div class="sol-spacer"></div>
            <div class="sol-foundation" data-zone="foundation" data-suit="S"></div>
            <div class="sol-foundation" data-zone="foundation" data-suit="H"></div>
            <div class="sol-foundation" data-zone="foundation" data-suit="D"></div>
            <div class="sol-foundation" data-zone="foundation" data-suit="C"></div>
          </div>
          <div class="sol-tableau">
            ${[0, 1, 2, 3, 4, 5, 6].map(i => `<div class="sol-col" data-zone="tableau" data-col="${i}"></div>`).join('')}
          </div>
        </div>
        <div class="sol-win hidden">
          <div>🎉 you win! click anywhere to play again</div>
          <button class="sol-again">Play Again</button>
        </div>
      </div>
    `;

    container.querySelector('.sol-stock').addEventListener('click', () => { SFX.click(); drawFromStock(); });
    container.querySelector('.sol-new').addEventListener('click', () => {
      SFX.click();
      newGame();
    });
    container.querySelector('.sol-autocomplete').addEventListener('click', autoComplete);
    container.querySelector('.sol-again').addEventListener('click', () => {
      SFX.click();
      stopCelebration();
      newGame();
    });

    newGame();
  }

  return { build };
})();