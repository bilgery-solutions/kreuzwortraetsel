(function () {
  "use strict";

  const puzzles = window.CROSSWORD_PUZZLES || [];
  const STORAGE_PREFIX = "raetselstunde:v1:";
  const DIFFICULTY_KEY = "raetselstunde:auswahl";
  const labels = { leicht: "Leicht", mittel: "Mittel", schwer: "Schwer" };
  const $ = (id) => document.getElementById(id);
  const ui = {
    board: $("board"),
    title: $("puzzle-title"),
    description: $("puzzle-description"),
    edition: $("puzzle-edition"),
    difficulty: $("puzzle-difficulty"),
    percent: $("progress-percent"),
    count: $("progress-count"),
    bar: $("progress-bar"),
    fill: $("progress-fill"),
    across: $("across-clues"),
    down: $("down-clues"),
    activeLabel: $("active-clue-label"),
    activeText: $("active-clue-text"),
    message: $("message")
  };

  let state = null;
  let wasFocusedBeforePointer = false;

  function positionKey(row, col) {
    return row + ":" + col;
  }

  function cleanLetters(value) {
    return String(value || "")
      .toUpperCase()
      .replace(/Ä/g, "AE")
      .replace(/Ö/g, "OE")
      .replace(/Ü/g, "UE")
      .replace(/ẞ/g, "SS")
      .replace(/ß/g, "SS")
      .replace(/[^A-Z]/g, "");
  }

  function readStored(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? fallback : JSON.parse(saved);
    } catch (error) {
      return fallback;
    }
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // The puzzle remains playable if storage is unavailable.
    }
  }

  function buildModel(puzzle) {
    const cells = new Map();
    const words = puzzle.entries.map(function (entry, index) {
      const answer = cleanLetters(entry[0]);
      const direction = entry[4];
      if (!answer || (direction !== "across" && direction !== "down")) {
        throw new Error("Ungültiger Rätsel-Eintrag.");
      }
      const word = {
        id: String(index),
        answer: answer,
        clue: entry[1],
        row: entry[2],
        col: entry[3],
        direction: direction,
        keys: [],
        number: null
      };
      for (let offset = 0; offset < answer.length; offset++) {
        const row = word.row + (direction === "down" ? offset : 0);
        const col = word.col + (direction === "across" ? offset : 0);
        if (row < 0 || col < 0 || row >= puzzle.size || col >= puzzle.size) {
          throw new Error("Rätsel-Wort liegt außerhalb des Gitters.");
        }
        const key = positionKey(row, col);
        let cell = cells.get(key);
        if (!cell) {
          cell = { row: row, col: col, answer: answer[offset], wordIds: [], number: null };
          cells.set(key, cell);
        } else if (cell.answer !== answer[offset]) {
          throw new Error("Widersprüchliche Kreuzung bei " + key);
        }
        cell.wordIds.push(word.id);
        word.keys.push(key);
      }
      return word;
    });

    let nextNumber = 1;
    for (let row = 0; row < puzzle.size; row++) {
      for (let col = 0; col < puzzle.size; col++) {
        const cell = cells.get(positionKey(row, col));
        if (!cell) continue;
        const starts = words.filter(function (word) {
          return word.row === row && word.col === col;
        });
        if (starts.length) {
          cell.number = nextNumber;
          starts.forEach(function (word) { word.number = nextNumber; });
          nextNumber++;
        }
      }
    }
    const ordered = words.slice().sort(function (a, b) {
      return a.number - b.number || (a.direction === "across" ? -1 : 1);
    });
    return { puzzle: puzzle, cells: cells, words: words, ordered: ordered };
  }

  function getWord(id) {
    return state.model.words.find(function (word) { return word.id === id; });
  }

  function persist() {
    store(STORAGE_PREFIX + state.model.puzzle.id, {
      letters: state.letters,
      hints: Array.from(state.hints)
    });
  }

  function showMessage(text, kind) {
    ui.message.textContent = text;
    ui.message.className = "message" + (kind ? " " + kind : "");
  }

  function selectDifficulty(difficulty) {
    const puzzle = puzzles.find(function (item) {
      return item.difficulty === difficulty;
    });
    if (!puzzle) return;

    const model = buildModel(puzzle);
    const saved = readStored(STORAGE_PREFIX + puzzle.id, {});
    const letters = Object.create(null);
    const savedLetters = saved && saved.letters && typeof saved.letters === "object" ? saved.letters : {};
    model.cells.forEach(function (cell, key) {
      const value = cleanLetters(savedLetters[key]);
      if (value) letters[key] = value[0];
    });
    state = {
      model: model,
      letters: letters,
      hints: new Set(Array.isArray(saved.hints) ? saved.hints.filter(function (key) { return model.cells.has(key); }) : []),
      wrong: new Set(),
      nodes: new Map(),
      activeKey: null,
      activeWordId: null
    };

    store(DIFFICULTY_KEY, difficulty);
    document.querySelectorAll("[data-difficulty]").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.difficulty === difficulty));
    });

    ui.title.textContent = puzzle.title;
    ui.description.textContent = puzzle.description;
    ui.edition.textContent = "KREUZWORTRÄTSEL · NR. " + puzzle.number;
    ui.difficulty.textContent = labels[difficulty].toUpperCase();
    ui.board.style.setProperty("--cols", String(puzzle.size));
    ui.board.setAttribute("aria-label", "Kreuzworträtsel " + labels[difficulty] + ", " + puzzle.size + " mal " + puzzle.size + " Felder");

    renderBoard();
    renderClues();
    const firstWord = model.ordered.find(function (word) { return word.direction === "across"; }) || model.ordered[0];
    if (firstWord) activateWord(firstWord.id, 0, false);
    updateProgress();
    if (isComplete()) {
      showMessage("Geschafft! Sie haben dieses Rätsel vollständig gelöst.", "complete");
    } else {
      showMessage("Tipp: Tippen Sie ein markiertes Feld erneut an, um die Richtung zu wechseln.");
    }
  }

  function renderBoard() {
    ui.board.replaceChildren();
    const fragment = document.createDocumentFragment();
    const size = state.model.puzzle.size;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const key = positionKey(row, col);
        const cell = state.model.cells.get(key);
        const square = document.createElement("div");
        square.className = "square" + (cell ? "" : " block");
        if (cell) {
          if (cell.number !== null) {
            const number = document.createElement("span");
            number.className = "square-number";
            number.textContent = String(cell.number);
            number.setAttribute("aria-hidden", "true");
            square.appendChild(number);
          }
          const input = document.createElement("input");
          input.className = "letter-input";
          input.type = "text";
          input.inputMode = "text";
          input.maxLength = 2;
          input.autocomplete = "off";
          input.autocapitalize = "characters";
          input.spellcheck = false;
          input.setAttribute("autocorrect", "off");
          input.dataset.key = key;
          input.value = state.letters[key] || "";
          input.setAttribute("aria-label", "Zeile " + (row + 1) + ", Spalte " + (col + 1));
          square.appendChild(input);
          state.nodes.set(key, { square: square, input: input });
        } else {
          square.setAttribute("aria-hidden", "true");
        }
        fragment.appendChild(square);
      }
    }
    ui.board.appendChild(fragment);
    refreshCells();
  }

  function renderClues() {
    ui.across.replaceChildren();
    ui.down.replaceChildren();
    state.model.ordered.forEach(function (word) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "clue-item";
      item.dataset.wordId = word.id;
      item.setAttribute("aria-label", word.number + " " + (word.direction === "across" ? "waagerecht" : "senkrecht") + ": " + word.clue);
      const number = document.createElement("span");
      number.className = "clue-no";
      number.textContent = String(word.number) + ".";
      const content = document.createElement("span");
      content.className = "clue-copy";
      content.appendChild(document.createTextNode(word.clue + " "));
      const length = document.createElement("span");
      length.className = "clue-length";
      length.textContent = "(" + word.answer.length + ")";
      content.appendChild(length);
      item.appendChild(number);
      item.appendChild(content);
      (word.direction === "across" ? ui.across : ui.down).appendChild(item);
    });
    refreshClues();
  }

  function refreshCells() {
    if (!state) return;
    const activeWord = getWord(state.activeWordId);
    const selected = new Set(activeWord ? activeWord.keys : []);
    state.nodes.forEach(function (node, key) {
      node.square.classList.toggle("word-active", selected.has(key));
      node.square.classList.toggle("cell-active", state.activeKey === key);
      node.square.classList.toggle("wrong", state.wrong.has(key));
      node.square.classList.toggle("hinted", state.hints.has(key));
    });
  }

  function refreshClues() {
    if (!state) return;
    document.querySelectorAll(".clue-item").forEach(function (button) {
      const word = getWord(button.dataset.wordId);
      button.classList.toggle("selected", word.id === state.activeWordId);
      button.classList.toggle("solved", word.keys.every(function (key, index) {
        return state.letters[key] === word.answer[index];
      }));
      button.setAttribute("aria-pressed", String(word.id === state.activeWordId));
    });
    const activeWord = getWord(state.activeWordId);
    if (activeWord) {
      ui.activeLabel.textContent = (activeWord.direction === "across" ? "WAAGERECHT" : "SENKRECHT") + " · " + activeWord.number;
      ui.activeText.textContent = activeWord.clue + " (" + activeWord.answer.length + ")";
    }
  }

  function activateCell(key, toggle) {
    const cell = state.model.cells.get(key);
    if (!cell) return;
    const current = cell.wordIds.includes(state.activeWordId) ? state.activeWordId : null;
    let wordId = current;
    if (toggle && current && cell.wordIds.length > 1) {
      wordId = cell.wordIds.find(function (id) { return id !== current; });
    }
    if (!wordId) {
      const previousWord = getWord(state.activeWordId);
      const preferred = previousWord ? previousWord.direction : "across";
      wordId = cell.wordIds.find(function (id) { return getWord(id).direction === preferred; })
        || cell.wordIds.find(function (id) { return getWord(id).direction === "across"; })
        || cell.wordIds[0];
    }
    state.activeWordId = wordId;
    state.activeKey = key;
    refreshCells();
    refreshClues();
  }

  function focusCell(key) {
    activateCell(key, false);
    const node = state.nodes.get(key);
    if (node) {
      node.input.focus({ preventScroll: true });
      node.input.select();
    }
  }

  function activateWord(id, offset, focus) {
    const word = getWord(id);
    if (!word) return;
    const index = offset === undefined ? Math.max(0, word.keys.findIndex(function (key) {
      return !state.letters[key];
    })) : offset;
    const key = word.keys[Math.min(Math.max(index, 0), word.keys.length - 1)];
    state.activeWordId = word.id;
    state.activeKey = key;
    refreshCells();
    refreshClues();
    if (focus) focusCell(key);
  }

  function moveAlong(step) {
    const word = getWord(state.activeWordId);
    if (!word) return false;
    const index = word.keys.indexOf(state.activeKey);
    const next = index + step;
    if (next < 0 || next >= word.keys.length) return false;
    focusCell(word.keys[next]);
    return true;
  }

  function changeLetter(key, letter) {
    if (!state.model.cells.has(key)) return;
    if (letter) state.letters[key] = letter;
    else delete state.letters[key];
    state.wrong.delete(key);
    const node = state.nodes.get(key);
    if (node) node.input.value = letter;
    persist();
    updateProgress();
    refreshCells();
    refreshClues();
    if (isComplete()) {
      showMessage("Geschafft! Sie haben alle Begriffe richtig gelöst.", "complete");
    } else if (ui.message.classList.contains("complete")) {
      showMessage("");
    }
  }

  function isComplete() {
    if (!state) return false;
    for (const [key, cell] of state.model.cells) {
      if (state.letters[key] !== cell.answer) return false;
    }
    return true;
  }

  function updateProgress() {
    const total = state.model.cells.size;
    let filled = 0;
    state.model.cells.forEach(function (cell, key) {
      if (state.letters[key]) filled++;
    });
    const percent = Math.round((filled / total) * 100);
    ui.percent.textContent = percent + " %";
    ui.count.textContent = filled + " von " + total + " Feldern";
    ui.bar.setAttribute("aria-valuenow", String(percent));
    ui.fill.style.width = percent + "%";
  }

  function changeClue(step) {
    const ordered = state.model.ordered;
    if (!ordered.length) return;
    const index = ordered.findIndex(function (word) { return word.id === state.activeWordId; });
    const next = (index + step + ordered.length) % ordered.length;
    activateWord(ordered[next].id, undefined, true);
  }

  function moveWithArrow(key) {
    const current = state.model.cells.get(state.activeKey);
    if (!current) return;
    const delta = {
      ArrowLeft: [0, -1, "across"],
      ArrowRight: [0, 1, "across"],
      ArrowUp: [-1, 0, "down"],
      ArrowDown: [1, 0, "down"]
    }[key];
    if (!delta) return;
    let row = current.row + delta[0];
    let col = current.col + delta[1];
    const size = state.model.puzzle.size;
    while (row >= 0 && col >= 0 && row < size && col < size) {
      const nextKey = positionKey(row, col);
      const nextCell = state.model.cells.get(nextKey);
      if (nextCell) {
        const matching = nextCell.wordIds.find(function (id) {
          return getWord(id).direction === delta[2];
        });
        if (matching) {
          state.activeWordId = matching;
          focusCell(nextKey);
          return;
        }
      }
      row += delta[0];
      col += delta[1];
    }
  }

  ui.board.addEventListener("pointerdown", function (event) {
    const input = event.target.closest(".letter-input");
    wasFocusedBeforePointer = !!input && document.activeElement === input;
  });

  ui.board.addEventListener("focusin", function (event) {
    const input = event.target.closest(".letter-input");
    if (input && state && input.dataset.key !== state.activeKey) {
      activateCell(input.dataset.key, false);
    }
  });

  ui.board.addEventListener("click", function (event) {
    const input = event.target.closest(".letter-input");
    if (!input || !state) return;
    activateCell(input.dataset.key, wasFocusedBeforePointer);
    input.select();
    wasFocusedBeforePointer = false;
  });

  ui.board.addEventListener("input", function (event) {
    const input = event.target.closest(".letter-input");
    if (!input || !state) return;
    const key = input.dataset.key;
    const text = cleanLetters(input.value);
    if (!text) {
      changeLetter(key, "");
      return;
    }
    const letter = text[text.length - 1];
    changeLetter(key, letter);
    if (!isComplete()) moveAlong(1);
  });

  ui.board.addEventListener("keydown", function (event) {
    const input = event.target.closest(".letter-input");
    if (!input || !state) return;
    const key = input.dataset.key;
    if (event.key === "Backspace") {
      event.preventDefault();
      if (state.letters[key]) changeLetter(key, "");
      else if (moveAlong(-1)) changeLetter(state.activeKey, "");
    } else if (event.key === "Delete") {
      event.preventDefault();
      changeLetter(key, "");
    } else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault();
      moveWithArrow(event.key);
    } else if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      activateCell(key, true);
    } else if (event.key === "Enter") {
      event.preventDefault();
      changeClue(1);
    }
  });

  ui.board.addEventListener("paste", function (event) {
    const input = event.target.closest(".letter-input");
    if (!input || !state) return;
    const clipboard = event.clipboardData ? event.clipboardData.getData("text") : "";
    const text = cleanLetters(clipboard);
    if (!text) return;
    event.preventDefault();
    const word = getWord(state.activeWordId);
    if (!word) return;
    const start = word.keys.indexOf(input.dataset.key);
    for (let i = 0; i < text.length && start + i < word.keys.length; i++) {
      changeLetter(word.keys[start + i], text[i]);
    }
    focusCell(word.keys[Math.min(start + text.length, word.keys.length - 1)]);
  });

  [ui.across, ui.down].forEach(function (list) {
    list.addEventListener("click", function (event) {
      const button = event.target.closest(".clue-item");
      if (button && state) activateWord(button.dataset.wordId, undefined, true);
    });
  });

  document.querySelectorAll("[data-difficulty]").forEach(function (button) {
    button.addEventListener("click", function () {
      selectDifficulty(button.dataset.difficulty);
    });
  });

  $("previous-clue").addEventListener("click", function () { changeClue(-1); });
  $("next-clue").addEventListener("click", function () { changeClue(1); });

  $("check-button").addEventListener("click", function () {
    if (!state) return;
    state.wrong.clear();
    let filled = 0;
    state.model.cells.forEach(function (cell, key) {
      if (state.letters[key]) {
        filled++;
        if (state.letters[key] !== cell.answer) state.wrong.add(key);
      }
    });
    refreshCells();
    if (isComplete()) {
      showMessage("Perfekt! Alle Antworten sind richtig.", "complete");
    } else if (!filled) {
      showMessage("Tragen Sie zuerst ein paar Buchstaben ein.");
    } else if (state.wrong.size) {
      showMessage(state.wrong.size + (state.wrong.size === 1 ? " Buchstabe ist noch falsch. Er ist rot markiert." : " Buchstaben sind noch falsch. Sie sind rot markiert."), "error");
    } else {
      showMessage("Alle bisher eingetragenen Buchstaben sind richtig. Weiter so!");
    }
  });

  $("hint-button").addEventListener("click", function () {
    if (!state || !state.activeKey) return;
    const key = state.activeKey;
    state.hints.add(key);
    changeLetter(key, state.model.cells.get(key).answer);
    persist();
    if (!isComplete()) {
      showMessage("Der richtige Buchstabe wurde eingesetzt.");
      moveAlong(1);
    }
  });

  $("reset-button").addEventListener("click", function () {
    if (!state) return;
    if (!window.confirm("Möchten Sie dieses Rätsel wirklich zurücksetzen? Alle Einträge dieses Rätsels gehen verloren.")) return;
    const difficulty = state.model.puzzle.difficulty;
    try { localStorage.removeItem(STORAGE_PREFIX + state.model.puzzle.id); } catch (error) { /* no storage */ }
    selectDifficulty(difficulty);
    showMessage("Das Rätsel wurde zurückgesetzt.");
  });

  if (!puzzles.length) {
    showMessage("Keine Rätsel gefunden. Bitte prüfen Sie puzzles.js.", "error");
    return;
  }
  const lastDifficulty = readStored(DIFFICULTY_KEY, "leicht");
  selectDifficulty(labels[lastDifficulty] ? lastDifficulty : "leicht");
})();
