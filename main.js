(() => {
  'use strict';

  const puzzles = window.SCHWEDENRAETSEL || [];
  const STORAGE_PREFIX = 'schwedenraetsel:v2:';
  const LAST_LEVEL = 'schwedenraetsel:v2:level';
  const HISTORY_KEY = 'schwedenraetsel:v3:history';
  const CURRENT_KEY = 'schwedenraetsel:v3:current';
  const COUNTERS_KEY = 'schwedenraetsel:v3:counters';
  const PUZZLE_KEY = 'schwedenraetsel:v3:puzzle:';
  const HISTORY_LIMIT = 15;
  const history = [];
  const savedHistory = (() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
    catch (_) { return []; }
  })();
  const currentByLevel = (() => {
    try { return JSON.parse(localStorage.getItem(CURRENT_KEY)) || {}; }
    catch (_) { return {}; }
  })();
  const levelNames = { leicht: 'LEICHT', mittel: 'MITTEL', schwer: 'SCHWER' };
  const byId = (id) => document.getElementById(id);
  const ui = {
    grid: byId('grid'), scroll: byId('gridScroll'), menu: byId('menuPanel'), menuButton: byId('menuButton'),
    issue: byId('issueIndicator'), number: byId('issueNumber'), title: byId('puzzleTitle'), count: byId('filledCount'),
    hint: byId('activeHint'), hintArrow: byId('hintArrow'), hintDirection: byId('hintDirection'), hintCopy: byId('hintCopy'),
    solution: byId('solutionGrid'), zoom: byId('zoomValue'), zoomOut: byId('zoomOut'), zoomIn: byId('zoomIn'),
    status: byId('statusMessage'), complete: byId('completeMark'), scrollTip: byId('scrollTip')
  };

  let game = null;
  let zoomStep = 0;
  let pointerWasActive = false;

  const posKey = (row, col) => `${row}:${col}`;
  const sanitize = (text) => String(text || '')
    .toLocaleUpperCase('de-DE').replace(/Ä/g, 'AE').replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE').replace(/ẞ/g, 'SS').replace(/[^A-Z]/g, '');

  function load(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch (_) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* offline remains functional */ }
  }
  function clear(key) {
    try { localStorage.removeItem(key); } catch (_) { /* ignore */ }
  }

  function modelFor(puzzle) {
    const cells = new Map();
    const clues = new Map();
    const entries = [];
    for (let id = 0; id < puzzle.entries.length; id++) {
      const item = puzzle.entries[id];
      const answer = sanitize(item.answer);
      const dr = item.direction === 'down' ? 1 : 0;
      const dc = item.direction === 'right' ? 1 : 0;
      if (!dr && !dc) throw Error('Unbekannte Schreibrichtung');
      if (item.clueRow !== item.row - dr || item.clueCol !== item.col - dc) throw Error('Hinweisposition ungültig');
      if (item.clueRow < 0 || item.clueCol < 0) throw Error('Hinweis außerhalb des Rasters');
      const clueKey = posKey(item.clueRow, item.clueCol);
      if (!clues.has(clueKey)) clues.set(clueKey, []);
      if (clues.get(clueKey).some((existing) => existing.direction === item.direction)) throw Error('Doppelter Hinweis');
      const word = { ...item, id, answer, keys: [], clueKey };
      clues.get(clueKey).push(word);
      for (let offset = 0; offset < answer.length; offset++) {
        const row = item.row + dr * offset;
        const col = item.col + dc * offset;
        if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) throw Error('Wort außerhalb des Rasters');
        const key = posKey(row, col);
        if (!cells.has(key)) cells.set(key, { row, col, answer: answer[offset], words: [] });
        const cell = cells.get(key);
        if (cell.answer !== answer[offset]) throw Error('Ungültige Buchstabenkreuzung bei ' + key);
        if (cell.words.some((existing) => existing.direction === item.direction)) throw Error('Wörter überlagern sich');
        cell.words.push(word);
        word.keys.push(key);
      }
      entries.push(word);
    }
    for (const key of clues.keys()) {
      if (cells.has(key)) throw Error('Hinweis überdeckt ein Antwortfeld');
    }
    const solution = puzzle.solution.cells.map(([row, col], index) => {
      const key = posKey(row, col);
      if (!cells.has(key)) throw Error('Lösungsfeld außerhalb des Rätsels');
      if (cells.get(key).answer !== puzzle.solution.answer[index]) throw Error('Lösungsbuchstabe stimmt nicht');
      return key;
    });
    if (new Set(solution).size !== solution.length) throw Error('Lösungsfeld doppelt');
    const solutionNumbers = new Map(solution.map((key, index) => [key, index + 1]));
    entries.sort((a, b) => a.clueRow - b.clueRow || a.clueCol - b.clueCol || (a.direction === 'right' ? -1 : 1));
    return { puzzle, cells, clues, entries, solution, solutionNumbers };
  }

  function showStatus(message, type = '') {
    ui.status.textContent = message;
    ui.status.className = 'status-message' + (type ? ' ' + type : '');
  }

  function getWord(id) {
    return game && game.model.entries.find((word) => word.id === id);
  }

  function persist() {
    if (!game) return;
    save(STORAGE_PREFIX + game.model.puzzle.id, { letters: game.letters, revealed: [...game.revealed] });
  }

  function setLevel(level) {
    const puzzle = puzzles.find((item) => item.id === currentByLevel[level]) ||
      puzzles.find((item) => item.level === level);
    if (!puzzle) return;
    setPuzzle(puzzle);
  }

  function setPuzzle(puzzle) {
    const level = puzzle.level;
    currentByLevel[level] = puzzle.id;
    save(CURRENT_KEY, currentByLevel);
    const model = modelFor(puzzle);
    const stored = load(STORAGE_PREFIX + puzzle.id, {});
    const oldLetters = stored && stored.letters && typeof stored.letters === 'object' ? stored.letters : {};
    const letters = {};
    model.cells.forEach((cell, key) => {
      const value = sanitize(oldLetters[key]);
      if (value) letters[key] = value[0];
    });
    const revealed = new Set(Array.isArray(stored.revealed) ? stored.revealed.filter((key) => model.cells.has(key)) : []);
    game = { model, letters, revealed, wrong: new Set(), nodes: new Map(), clueNodes: new Map(), activeKey: null, activeId: null };
    save(LAST_LEVEL, level);
    zoomStep = 0;
    ui.title.textContent = puzzle.title;
    ui.number.textContent = puzzle.number;
    ui.issue.textContent = `NR. ${puzzle.number} · ${levelNames[level]}`;
    ui.complete.textContent = 'VIEL FREUDE BEIM RÄTSELN';
    ui.complete.classList.remove('solved');
    ui.hintArrow.textContent = '→';
    ui.hintDirection.textContent = 'HINWEIS';
    ui.hintCopy.textContent = 'Ein Hinweisfeld oder ein weißes Kästchen antippen.';
    ui.grid.style.setProperty('--cols', String(puzzle.size));
    ui.grid.setAttribute('aria-label', `${puzzle.size} mal ${puzzle.size} Felder, Schwedenrätsel ${levelNames[level]}`);
    document.querySelectorAll('[data-level]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.level === level)));
    drawGrid();
    drawSolution();
    updateCount();
    resizeCells();
    ui.scroll.scrollLeft = 0;
    showStatus('');
    if (completed()) markComplete();
    renderHistory();
  }

  function renderHistory() {
    const list = byId('historyList');
    if (!list || !game) return;
    const level = game.model.puzzle.level;
    const options = [
      ...history.filter((entry) => entry.level === level).slice().reverse().map((entry) =>
        puzzles.find((puzzle) => puzzle.id === entry.id)).filter(Boolean),
      ...puzzles.filter((item) => item.level === level && !item.id.startsWith('generiert-'))
    ];
    const fragment = document.createDocumentFragment();
    options.forEach((puzzle) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'history-button';
      button.textContent = `Nr. ${puzzle.number} · ${puzzle.title}`;
      button.setAttribute('aria-current', String(puzzle.id === game.model.puzzle.id));
      button.addEventListener('click', () => { setPuzzle(puzzle); showMenu(false); });
      fragment.append(button);
    });
    list.replaceChildren(fragment);
  }

  function startNewGame() {
    if (!game || typeof window.generiereSchwedenraetsel !== 'function') return;
    const level = game.model.puzzle.level;
    const counters = load(COUNTERS_KEY, {}) || {};
    const lastNumber = Math.max(1, Number(counters[level]) || 1);
    let puzzle = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      let seed;
      if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        const random = new Uint32Array(1);
        window.crypto.getRandomValues(random);
        seed = random[0];
      } else {
        seed = Math.floor(Math.random() * 4294967296) >>> 0;
      }
      const id = 'generiert-' + level + '-' + seed.toString(36);
      if (puzzles.some((item) => item.id === id)) continue;
      try {
        puzzle = window.generiereSchwedenraetsel(level, seed, String(lastNumber + 1).padStart(2, '0'));
        modelFor(puzzle); // Refuse contradictory or invalid generated puzzles.
        break;
      } catch (error) { console.warn('Rätsel neu berechnen:', error); }
    }
    if (!puzzle) {
      showStatus('Ein neues Rätsel konnte nicht erstellt werden. Bitte erneut versuchen.', 'error');
      return;
    }
    save(PUZZLE_KEY + puzzle.id, puzzle); // Preserve the layout even after app updates.
    puzzles.push(puzzle);
    history.push({ id: puzzle.id, level });
    const sameLevel = history.filter((entry) => entry.level === level);
    if (sameLevel.length > HISTORY_LIMIT) {
      const oldest = sameLevel[0];
      const index = history.findIndex((item) => item.id === oldest.id);
      if (index >= 0) history.splice(index, 1);
      // Discard oldest archived data to keep browser storage bounded.
      clear(PUZZLE_KEY + oldest.id);
      clear(STORAGE_PREFIX + oldest.id);
      const indexInPuzzles = puzzles.findIndex((item) => item.id === oldest.id);
      if (indexInPuzzles >= 0) puzzles.splice(indexInPuzzles, 1);
    }
    save(HISTORY_KEY, history);
    counters[level] = lastNumber + 1;
    save(COUNTERS_KEY, counters);
    setPuzzle(puzzle);
    showMenu(false);
    showStatus('Ein neues Rätsel ist bereit. Viel Spaß!');
  }

  function drawGrid() {
    const fragment = document.createDocumentFragment();
    const { puzzle, cells, clues, solutionNumbers } = game.model;
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        const key = posKey(row, col);
        const square = document.createElement('div');
        square.className = 'tile';
        if (cells.has(key)) {
          const cell = cells.get(key);
          square.classList.add('letter');
          if (solutionNumbers.has(key)) {
            const label = document.createElement('span');
            label.className = 'solution-index';
            label.textContent = String(solutionNumbers.get(key));
            label.setAttribute('aria-hidden', 'true');
            square.append(label);
          }
          const input = document.createElement('input');
          input.type = 'text';
          input.inputMode = 'text';
          input.maxLength = 2;
          input.className = 'letter-input';
          input.dataset.key = key;
          input.value = game.letters[key] || '';
          input.autocomplete = 'off';
          input.autocapitalize = 'characters';
          input.spellcheck = false;
          input.setAttribute('autocorrect', 'off');
          input.setAttribute('enterkeyhint', 'next');
          input.setAttribute('aria-label', `Buchstabe, Zeile ${row + 1}, Spalte ${col + 1}`);
          square.append(input);
          game.nodes.set(key, { square, input });
        } else if (clues.has(key)) {
          const words = clues.get(key);
          square.classList.add('clue');
          if (words.length > 1) square.classList.add('dual');
          words.sort((a, b) => (a.direction === 'right' ? -1 : 1));
          words.forEach((word) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'clue-target';
            button.dataset.wordId = String(word.id);
            button.title = `${word.clue} (${word.answer.length})`;
            button.setAttribute('aria-label', `${word.clue}, ${word.direction === 'right' ? 'waagerecht' : 'senkrecht'}, ${word.answer.length} Buchstaben`);
            const copy = document.createElement('span');
            copy.className = 'clue-copy';
            copy.lang = 'de';
            copy.textContent = word.clue;
            const arrow = document.createElement('span');
            arrow.className = 'clue-direction';
            arrow.textContent = word.direction === 'right' ? '→' : '↓';
            arrow.setAttribute('aria-hidden', 'true');
            button.append(copy, arrow);
            square.append(button);
          });
          game.clueNodes.set(key, square);
        } else {
          square.classList.add('void');
          square.setAttribute('aria-hidden', 'true');
        }
        fragment.append(square);
      }
    }
    ui.grid.replaceChildren(fragment);
    refreshSelection();
  }

  function drawSolution() {
    const fragment = document.createDocumentFragment();
    game.model.solution.forEach((key, index) => {
      const tile = document.createElement('button');
      tile.className = 'solution-tile';
      tile.type = 'button';
      tile.dataset.key = key;
      tile.title = `Lösungsfeld ${index + 1}: zum zugehörigen Kästchen springen`;
      tile.setAttribute('aria-label', `Lösungsfeld ${index + 1}, zum Buchstaben springen`);
      const number = document.createElement('span');
      number.textContent = String(index + 1);
      const letter = document.createElement('strong');
      letter.textContent = game.letters[key] || '';
      tile.append(number, letter);
      fragment.append(tile);
    });
    ui.solution.replaceChildren(fragment);
  }

  function refreshSolution() {
    const tiles = ui.solution.querySelectorAll('.solution-tile');
    tiles.forEach((tile) => {
      tile.querySelector('strong').textContent = game.letters[tile.dataset.key] || '';
    });
  }

  function refreshSelection() {
    if (!game) return;
    const word = getWord(game.activeId);
    const wordKeys = new Set(word ? word.keys : []);
    game.nodes.forEach((node, key) => {
      node.square.classList.toggle('in-word', wordKeys.has(key));
      node.square.classList.toggle('active', key === game.activeKey);
      node.square.classList.toggle('wrong', game.wrong.has(key));
      node.square.classList.toggle('given', game.revealed.has(key));
    });
    game.clueNodes.forEach((node, key) => node.classList.toggle('selected-clue', !!word && key === word.clueKey));
    if (word) {
      ui.hintArrow.textContent = word.direction === 'right' ? '→' : '↓';
      ui.hintDirection.textContent = word.direction === 'right' ? 'WAAGERECHT · ' + word.answer.length + ' BUCHSTABEN' : 'SENKRECHT · ' + word.answer.length + ' BUCHSTABEN';
      ui.hintCopy.textContent = word.clue;
    }
  }

  function focusCell(key) {
    const node = game.nodes.get(key);
    if (!node) return;
    node.input.focus({ preventScroll: true });
    node.input.select();
    // Move only the puzzle pane on small screens, not the entire page.
    const view = ui.scroll.getBoundingClientRect();
    const target = node.square.getBoundingClientRect();
    if (target.left < view.left + 6) ui.scroll.scrollLeft -= view.left + 10 - target.left;
    if (target.right > view.right - 6) ui.scroll.scrollLeft += target.right - view.right + 10;
  }

  function activateEntry(id, optionalKey, focus) {
    const word = getWord(id);
    if (!word) return;
    game.activeId = word.id;
    game.activeKey = optionalKey || word.keys.find((key) => !game.letters[key]) || word.keys[0];
    refreshSelection();
    if (focus) focusCell(game.activeKey);
  }

  function selectKey(key, toggle, focus = false) {
    const cell = game.model.cells.get(key);
    if (!cell) return;
    const current = cell.words.find((word) => word.id === game.activeId);
    let choice = current;
    if (toggle && current && cell.words.length > 1) {
      choice = cell.words.find((word) => word.id !== current.id);
    }
    if (!choice) {
      const previous = getWord(game.activeId);
      choice = cell.words.find((word) => word.direction === (previous?.direction || 'right')) || cell.words[0];
    }
    activateEntry(choice.id, key, focus);
  }

  function move(step) {
    const word = getWord(game.activeId);
    if (!word) return;
    const index = word.keys.indexOf(game.activeKey);
    if (index + step >= 0 && index + step < word.keys.length) {
      selectKey(word.keys[index + step], false, true);
    }
  }

  function nextEntry() {
    if (!game) return;
    const entries = game.model.entries;
    const index = entries.findIndex((w) => w.id === game.activeId);
    const next = entries[(index + 1) % entries.length];
    if (next) activateEntry(next.id, null, true);
  }

  function setLetter(key, letter) {
    if (!game.model.cells.has(key)) return;
    if (letter) game.letters[key] = letter;
    else delete game.letters[key];
    game.wrong.delete(key);
    const node = game.nodes.get(key);
    if (node) node.input.value = letter;
    persist();
    refreshSelection();
    refreshSolution();
    updateCount();
    if (completed()) markComplete();
    else {
      ui.complete.textContent = 'VIEL FREUDE BEIM RÄTSELN';
      ui.complete.classList.remove('solved');
      if (ui.status.classList.contains('success')) showStatus('');
    }
  }

  function completed() {
    if (!game) return false;
    for (const [key, cell] of game.model.cells) {
      if (game.letters[key] !== cell.answer) return false;
    }
    return true;
  }
  function markComplete() {
    ui.complete.textContent = 'RÄTSEL GELÖST ✓';
    ui.complete.classList.add('solved');
    showStatus('Geschafft! Alle Begriffe und das Lösungswort sind richtig.', 'success');
  }
  function updateCount() {
    const total = game.model.cells.size;
    const count = [...game.model.cells.keys()].filter((key) => !!game.letters[key]).length;
    ui.count.textContent = `${count} / ${total}`;
  }

  function resizeCells() {
    if (!game) return;
    const size = game.model.puzzle.size;
    const width = ui.scroll.clientWidth;
    const base = width < 600 ? 46 : Math.max(38, Math.min(53, Math.floor((width - 3) / size)));
    const pixels = Math.round(base * (1 + zoomStep * .2));
    ui.grid.style.setProperty('--cell', `${pixels}px`);
    ui.zoom.textContent = `${Math.round((1 + zoomStep * .2) * 100)} %`;
    ui.zoomOut.disabled = zoomStep <= -1;
    ui.zoomIn.disabled = zoomStep >= 3;
    ui.scrollTip.textContent = pixels * size > width + 3 ? 'Raster seitlich verschieben, um alle Felder zu sehen.' : 'Hinweis anklicken oder in ein weißes Feld tippen.';
  }

  ui.scroll.addEventListener('pointerdown', (event) => {
    const input = event.target.closest('.letter-input');
    pointerWasActive = !!input && !!game && game.activeKey === input.dataset.key;
  });
  ui.scroll.addEventListener('focusin', (event) => {
    const input = event.target.closest('.letter-input');
    if (input && game && input.dataset.key !== game.activeKey) selectKey(input.dataset.key, false);
  });
  ui.scroll.addEventListener('click', (event) => {
    if (!game) return;
    const clue = event.target.closest('.clue-target');
    if (clue) {
      activateEntry(Number(clue.dataset.wordId), null, true);
      pointerWasActive = false;
      return;
    }
    const input = event.target.closest('.letter-input');
    if (input) {
      selectKey(input.dataset.key, pointerWasActive);
      input.select();
    }
    pointerWasActive = false;
  });
  ui.scroll.addEventListener('input', (event) => {
    const input = event.target.closest('.letter-input');
    if (!input || !game || event.isComposing) return;
    const key = input.dataset.key;
    const value = sanitize(input.value);
    if (value) {
      // A single German umlaut expands into two squares (Ä → AE, etc.).
      if (/^[ÄÖÜäöüßẞ]$/.test(input.value)) {
        const word = getWord(game.activeId);
        const start = word ? word.keys.indexOf(key) : -1;
        if (start >= 0) {
          for (let i = 0; i < value.length && start + i < word.keys.length; i++) {
            setLetter(word.keys[start + i], value[i]);
          }
          const end = Math.min(start + value.length, word.keys.length - 1);
          if (!completed()) selectKey(word.keys[end], false, true);
        }
      } else {
        setLetter(key, value[value.length - 1]);
        if (!completed()) move(1);
      }
    } else setLetter(key, '');
  });
  ui.scroll.addEventListener('keydown', (event) => {
    const input = event.target.closest('.letter-input');
    if (!input || !game) return;
    const key = input.dataset.key;
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (game.letters[key]) setLetter(key, '');
      else {
        move(-1);
        if (game.activeKey !== key) setLetter(game.activeKey, '');
      }
    } else if (event.key === 'Delete') {
      event.preventDefault(); setLetter(key, '');
    } else if (event.key === 'Tab') {
      // Let normal accessible keyboard navigation work.
    } else if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault(); selectKey(key, true);
    } else if (event.key === 'Enter') {
      event.preventDefault(); nextEntry();
    } else if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const direction = event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? 'right' : 'down';
      const cell = game.model.cells.get(key);
      const current = cell.words.find((word) => word.direction === direction);
      if (current) {
        activateEntry(current.id, key, false);
        move(event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1);
      }
    }
  });
  ui.scroll.addEventListener('paste', (event) => {
    const input = event.target.closest('.letter-input');
    if (!input || !game) return;
    const text = sanitize(event.clipboardData?.getData('text') || '');
    if (!text) return;
    event.preventDefault();
    const word = getWord(game.activeId);
    if (!word) return;
    const start = word.keys.indexOf(input.dataset.key);
    for (let i = 0; i < text.length && start + i < word.keys.length; i++) setLetter(word.keys[start + i], text[i]);
    selectKey(word.keys[Math.min(start + text.length, word.keys.length - 1)], false, true);
  });
  ui.solution.addEventListener('click', (event) => {
    const tile = event.target.closest('.solution-tile');
    if (tile && game) selectKey(tile.dataset.key, false, true);
  });
  byId('nextWord').addEventListener('click', nextEntry);
  byId('newGameButton').addEventListener('click', startNewGame);

  function showMenu(open) {
    ui.menu.hidden = !open;
    ui.menuButton.setAttribute('aria-expanded', String(open));
  }
  ui.menuButton.addEventListener('click', () => showMenu(ui.menu.hidden));
  document.addEventListener('click', (event) => {
    if (!ui.menu.hidden && !ui.menu.contains(event.target) && !ui.menuButton.contains(event.target)) showMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') showMenu(false);
  });
  document.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => {
    setLevel(button.dataset.level);
    showMenu(false);
  }));
  byId('checkButton').addEventListener('click', () => {
    showMenu(false);
    if (!game) return;
    game.wrong.clear();
    let filled = 0;
    game.model.cells.forEach((cell, key) => {
      if (game.letters[key]) {
        filled++;
        if (game.letters[key] !== cell.answer) game.wrong.add(key);
      }
    });
    refreshSelection();
    if (completed()) markComplete();
    else if (!filled) showStatus('Trage zuerst Buchstaben in das Raster ein.');
    else if (game.wrong.size) showStatus(`${game.wrong.size} ${game.wrong.size === 1 ? 'Buchstabe ist' : 'Buchstaben sind'} noch nicht richtig und rot markiert.`, 'error');
    else showStatus('Alle bisher eingetragenen Buchstaben sind richtig.');
  });
  byId('revealButton').addEventListener('click', () => {
    showMenu(false);
    if (!game) return;
    if (game.activeKey === null) {
      const first = game.model.entries[0];
      activateEntry(first.id, first.keys[0], false);
    }
    const key = game.activeKey;
    game.revealed.add(key);
    setLetter(key, game.model.cells.get(key).answer);
    persist();
    if (!completed()) {
      showStatus('Ein Buchstabe wurde aufgedeckt.');
      move(1);
    }
  });
  byId('resetButton').addEventListener('click', () => {
    showMenu(false);
    if (!game || !window.confirm('Dieses Rätsel wirklich leeren? Der bisherige Spielstand geht verloren.')) return;
    const puzzle = game.model.puzzle;
    clear(STORAGE_PREFIX + puzzle.id);
    setPuzzle(puzzle);
    showStatus('Dieses Rätsel wurde zurückgesetzt.');
  });
  ui.zoomOut.addEventListener('click', () => { if (zoomStep > -1) { zoomStep--; resizeCells(); } });
  ui.zoomIn.addEventListener('click', () => { if (zoomStep < 3) { zoomStep++; resizeCells(); } });
  window.addEventListener('resize', resizeCells);

  try {
    if (!puzzles.length) throw Error('Es sind keine Rätsel vorhanden.');
    for (const puzzle of puzzles) modelFor(puzzle); // Check all bundled puzzles at startup.
    if (Array.isArray(savedHistory)) {
      for (const entry of savedHistory.slice(-HISTORY_LIMIT * 3)) {
        if (!entry || typeof entry.id !== 'string' || !['leicht', 'mittel', 'schwer'].includes(entry.level)) continue;
        const puzzle = load(PUZZLE_KEY + entry.id);
        if (!puzzle || puzzle.id !== entry.id || puzzle.level !== entry.level) continue;
        try {
          modelFor(puzzle);
          puzzles.push(puzzle);
          history.push({ id: entry.id, level: entry.level });
        } catch (error) { console.warn('Gespeichertes Rätsel übersprungen:', error); }
      }
    }
    const previous = load(LAST_LEVEL, 'leicht');
    setLevel(levelNames[previous] ? previous : 'leicht');
  } catch (error) {
    console.error('Rätsel konnte nicht geladen werden:', error);
    showStatus('Das Rätsel konnte nicht geladen werden. Bitte lade die Seite neu.', 'error');
  }
})();