/* Procedural Swedish crossword generator. Deterministic for a (level, seed) pair.
   All clues are curated; only placement, crossings and solution fields are generated. */
(() => {
  'use strict';
  const dictionary = window.RAETSEL_WORTBANK || [];
  const SOLUTIONS = [
    'RAETSELSPASS', 'GEISTESBLITZ', 'KNOBELSPASS', 'WORTAKROBAT',
    'ZEITVERTREIB', 'DENKSPORT', 'WORTSPIEL', 'KOPFNUSS',
    'WISSENSDURST', 'WORTSALAT', 'RATEMEISTER', 'KNIFFELSPASS',
    'GEDANKENBLITZ', 'RAETSELFREUDE', 'DENKAUFGABE', 'RAETSELFIEBER'
  ];
  function rngFor(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value + 0x6D2B79F5) | 0;
      let t = Math.imul(value ^ (value >>> 15), 1 | value);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function generator(level, seed, number = '02') {
    if (!['leicht', 'mittel', 'schwer'].includes(level)) throw Error('Unbekannter Schwierigkeitsgrad');
    const random = rngFor(seed);
    const size = level === 'schwer' ? 17 : 16;
    const key = (r, c) => r * size + c;
    const inBounds = (r, c) => r >= 0 && c >= 0 && r < size && c < size;
    const letters = new Map();  // cell index => { letter, dirs:Set }
    const clueCells = new Map(); // cell index => Set(direction)
    const protectedEnds = new Set(); // a word may not run into a different answer
    const placed = [];
    const used = new Set();
    const entries = dictionary.filter(w => w.answer.length >= 2 && w.answer.length <= 12 &&
      /^[A-Z]+$/.test(w.answer) && (level !== 'leicht' || !w.advanced));
    const byLetter = new Map();
    entries.forEach((word, index) => {
      for (let p = 0; p < word.answer.length; p++) {
        const letter = word.answer[p];
        if (!byLetter.has(letter)) byLetter.set(letter, []);
        byLetter.get(letter).push([index, p]);
      }
    });
    const directionVectors = { right: [0, 1], down: [1, 0] };
    function canPlace(word, row, col, direction) {
      const [dr, dc] = directionVectors[direction];
      const er = row + (word.answer.length - 1) * dr;
      const ec = col + (word.answer.length - 1) * dc;
      const cr = row - dr, cc = col - dc;
      const ar = er + dr, ac = ec + dc;
      if (!inBounds(row, col) || !inBounds(er, ec) || !inBounds(cr, cc)) return null;
      const clueIndex = key(cr, cc);
      if (letters.has(clueIndex) || clueCells.get(clueIndex)?.has(direction)) return null;
      if (inBounds(ar, ac) && letters.has(key(ar, ac))) return null;
      let crossed = 0, added = 0;
      for (let p = 0; p < word.answer.length; p++) {
        const r = row + p * dr, c = col + p * dc, cell = key(r, c);
        if (clueCells.has(cell) || protectedEnds.has(cell)) return null;
        const old = letters.get(cell);
        if (old) {
          if (old.letter !== word.answer[p] || old.dirs.has(direction)) return null;
          crossed++;
        } else {
          added++;
          // Adjacent unlinked letters would create fake answers.
          for (const sign of [-1, 1]) {
            const nr = r + sign * dc, nc = c + sign * dr;
            if (inBounds(nr, nc) && letters.has(key(nr, nc))) return null;
          }
        }
      }
      if (!added) return null;
      return { crossed, added, clueIndex, after: inBounds(ar, ac) ? key(ar, ac) : null };
    }
    function insert(word, row, col, direction, info) {
      const [dr, dc] = directionVectors[direction];
      const dirs = clueCells.get(info.clueIndex) || new Set();
      dirs.add(direction);
      clueCells.set(info.clueIndex, dirs);
      if (info.after !== null) protectedEnds.add(info.after);
      for (let p = 0; p < word.answer.length; p++) {
        const k = key(row + p * dr, col + p * dc);
        let cell = letters.get(k);
        if (!cell) { cell = { letter: word.answer[p], dirs: new Set() }; letters.set(k, cell); }
        cell.dirs.add(direction);
      }
      used.add(word.answer);
      placed.push({ answer: word.answer, clue: word.clue, row, col, direction,
        clueRow: row - dr, clueCol: col - dc });
    }
    function shuffle(items) {
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return items;
    }
    function chooseCandidate(candidates) {
      if (!candidates.length) return null;
      candidates.sort((a, b) => b.score - a.score);
      return candidates[Math.floor(random() * Math.min(6, candidates.length))];
    }
    const starters = entries.filter(w => w.answer.length >= 6 && w.answer.length <= 9 &&
      (level !== 'schwer' || w.advanced));
    const first = starters[Math.floor(random() * starters.length)] || entries[0];
    let start = null, row = 0, col = 0, direction = 'right';
    for (let attempt = 0; attempt < 80 && !start; attempt++) {
      direction = random() < .5 ? 'right' : 'down';
      row = Math.floor(size * (.23 + random() * .45));
      col = Math.floor(size * (.23 + random() * .45));
      start = canPlace(first, row, col, direction);
    }
    if (!start) throw Error('Kein Startwort möglich');
    insert(first, row, col, direction, start);
    const limit = level === 'schwer' ? 35 : 34;
    for (let turn = 0; turn < limit; turn++) {
      const candidates = [];
      const seenCandidates = new Set();
      // Try every intersection with an already positioned letter, but sample the
      // dictionary so this runs well on older iPhones too.
      const occupied = shuffle([...letters.entries()]);
      for (const [index, placedCell] of occupied) {
        const wordPositions = byLetter.get(placedCell.letter) || [];
        for (let tries = 0; tries < Math.min(wordPositions.length, 80); tries++) {
          const [wordIndex, offset] = wordPositions[(tries + Math.floor(random() * wordPositions.length)) % wordPositions.length];
          const word = entries[wordIndex];
          if (used.has(word.answer)) continue;
          if (level === 'schwer' && turn % 3 === 0 && !word.advanced && word.answer.length < 6) continue;
          if (level === 'leicht' && word.answer.length > 10) continue;
          const r = Math.floor(index / size), c = index % size;
          for (const dir of ['right', 'down']) {
            if (placedCell.dirs.has(dir)) continue;
            const rr = r - (dir === 'down' ? offset : 0);
            const cc = c - (dir === 'right' ? offset : 0);
            const id = wordIndex + ':' + rr + ':' + cc + ':' + dir;
            if (seenCandidates.has(id)) continue;
            seenCandidates.add(id);
            const info = canPlace(word, rr, cc, dir);
            if (!info || info.crossed === 0) continue;
            const proximity = Math.abs(rr - size / 2) + Math.abs(cc - size / 2);
            const vocabulary = word.advanced && level === 'schwer' ? 7 : 0;
            const score = info.crossed * 19 + info.added * 1.6 + vocabulary - proximity * .15 + random() * 16;
            candidates.push({ score, word, row: rr, col: cc, dir, info });
          }
        }
      }
      const selected = chooseCandidate(candidates);
      if (!selected) break;
      insert(selected.word, selected.row, selected.col, selected.dir, selected.info);
    }
    // Fill gaps with independent, valid little crossword questions as in magazines.
    const target = level === 'schwer' ? 41 : 40;
    for (let turn = 0; placed.length < target && turn < 24; turn++) {
      let best = [];
      const freeWords = shuffle(entries.filter(w => !used.has(w.answer) && w.answer.length >= 2 && w.answer.length <= 7));
      for (const word of freeWords.slice(0, 130)) {
        for (const dir of ['right', 'down']) {
          for (let i = 0; i < 55; i++) {
            const row = Math.floor(random() * size), col = Math.floor(random() * size);
            const info = canPlace(word, row, col, dir);
            if (!info || info.crossed !== 0) continue;
            let nearby = 0;
            const [dr, dc] = directionVectors[dir];
            for (let j = 0; j < word.answer.length; j++) {
              const r = row + dr * j, c = col + dc * j;
              for (const [dy, dx] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                if (inBounds(r + dy, c + dx) && clueCells.has(key(r+dy,c+dx))) nearby++;
              }
            }
            const score = word.answer.length * 1.8 + nearby * .5 + random() * 7;
            if (best.length < 14 || score > best[best.length - 1].score) {
              best.push({ score, word, row, col, dir, info });
              best.sort((a,b)=>b.score-a.score);
              if (best.length > 14) best.pop();
            }
          }
        }
      }
      const selected = chooseCandidate(best);
      if (!selected) break;
      insert(selected.word, selected.row, selected.col, selected.dir, selected.info);
    }
    const solutions = shuffle(SOLUTIONS.slice());
    let solution = null;
    for (const answer of solutions) {
      const available = new Map();
      for (const [index, cell] of letters) {
        if (!available.has(cell.letter)) available.set(cell.letter, []);
        available.get(cell.letter).push(index);
      }
      for (const positions of available.values()) shuffle(positions);
      const cells = [];
      for (const letter of answer) {
        const next = available.get(letter)?.pop();
        if (next === undefined) break;
        cells.push([Math.floor(next / size), next % size]);
      }
      if (cells.length === answer.length) { solution = { answer, cells }; break; }
    }
    if (!solution) throw Error('Für diese Zusammenstellung fehlt ein Lösungswort');
    return {
      id: 'generiert-' + level + '-' + (seed >>> 0).toString(36),
      level, number, size,
      title: 'Rätsel für zwischendurch',
      solution, entries: placed
    };
  }
  window.generiereSchwedenraetsel = generator;
})();