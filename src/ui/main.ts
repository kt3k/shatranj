import {
  BLACK,
  type Color,
  EMPTY,
  type GameResult,
  type Move,
  moveFrom,
  moveTo,
  Position,
  SHAH,
  sq,
  WHITE,
} from "../engine/position.ts";
import { LEVELS, VALUE } from "../engine/search.ts";
import { PIECE_INFO, pieceSVG } from "./pieces.ts";
import type { WorkerRequest, WorkerResponse } from "./worker.ts";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface Saved {
  moves: Move[];
  player: Color;
  level: number;
  flipped: boolean;
}

const STORAGE_KEY = "shatranj:game";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

const state = {
  moves: [] as Move[],
  sans: [] as string[],
  captured: [] as number[],
  pos: Position.initial(),
  player: WHITE as Color,
  level: 3,
  flipped: false,
  selected: -1,
  targets: [] as Move[],
  thinking: false,
  hint: [] as number[],
  result: { over: false } as GameResult,
  requestId: 0,
  animateTo: -1,
};

function load(): Saved | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (!Array.isArray(s.moves)) return null;
    return s;
  } catch {
    return null;
  }
}

function save() {
  try {
    const s: Saved = {
      moves: state.moves,
      player: state.player,
      level: state.level,
      flipped: state.flipped,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage may be unavailable; the game still works
  }
}

/** Rebuilds position, SAN list and captured pieces from the move list. */
function replay(moves: Move[]): boolean {
  const pos = Position.initial();
  const sans: string[] = [];
  const captured: number[] = [];
  for (const m of moves) {
    if (!pos.legalMoves().includes(m)) return false;
    sans.push(pos.toSAN(m));
    const victim = pos.board[moveTo(m)];
    if (victim !== EMPTY) captured.push(victim);
    pos.makeMove(m);
  }
  state.moves = moves.slice();
  state.sans = sans;
  state.captured = captured;
  state.pos = pos;
  state.result = pos.result();
  return true;
}

// ---------------------------------------------------------------------------
// AI worker
// ---------------------------------------------------------------------------

let worker: Worker;
function createWorker() {
  worker = new Worker(new URL("./worker.js", import.meta.url), {
    type: "module",
  });
  worker.onmessage = onWorkerMessage;
}

let pendingHint = false;
let thinkStart = 0;

function onWorkerMessage(e: MessageEvent<WorkerResponse>) {
  const { id, move } = e.data;
  if (id !== state.requestId) return;
  if (pendingHint) {
    pendingHint = false;
    state.thinking = false;
    state.hint = [moveFrom(move), moveTo(move)];
    render();
    return;
  }
  // Give the opponent a moment of visible contemplation.
  const elapsed = performance.now() - thinkStart;
  const delay = Math.max(0, 450 - elapsed);
  setTimeout(() => {
    if (id !== state.requestId) return;
    state.thinking = false;
    applyMove(move);
  }, delay);
}

function cancelThinking() {
  if (state.thinking) {
    worker.terminate();
    createWorker();
    state.thinking = false;
    pendingHint = false;
  }
  state.requestId++;
}

function requestAIMove() {
  if (state.result.over || state.pos.side === state.player) return;
  state.thinking = true;
  thinkStart = performance.now();
  const req: WorkerRequest = {
    id: ++state.requestId,
    moves: state.moves,
    level: state.level,
  };
  worker.postMessage(req);
  render();
}

function requestHint() {
  if (state.result.over || state.thinking || state.pos.side !== state.player) {
    return;
  }
  pendingHint = true;
  state.thinking = true;
  const req: WorkerRequest = {
    id: ++state.requestId,
    moves: state.moves,
    level: 5,
    hint: true,
  };
  worker.postMessage(req);
  render();
}

// ---------------------------------------------------------------------------
// Game actions
// ---------------------------------------------------------------------------

function applyMove(m: Move) {
  replay([...state.moves, m]);
  state.selected = -1;
  state.targets = [];
  state.hint = [];
  state.animateTo = moveTo(m);
  save();
  render();
  if (state.result.over) {
    setTimeout(showResult, 350);
  } else {
    requestAIMove();
  }
}

function newGame() {
  cancelThinking();
  const levelInput = document.querySelector<HTMLInputElement>(
    'input[name="level"]:checked',
  );
  state.level = levelInput ? Number(levelInput.value) : 3;
  const colorInput = document.querySelector<HTMLInputElement>(
    'input[name="color"]:checked',
  );
  const choice = colorInput?.value ?? "white";
  state.player = choice === "black"
    ? BLACK
    : choice === "random"
    ? (Math.random() < 0.5 ? WHITE : BLACK)
    : WHITE;
  state.flipped = state.player === BLACK;
  state.selected = -1;
  state.targets = [];
  state.hint = [];
  replay([]);
  save();
  render();
  requestAIMove();
}

function undo() {
  cancelThinking();
  const moves = state.moves.slice();
  if (moves.length === 0) return;
  // Remove moves until it is the player's turn again (at least one move).
  do {
    moves.pop();
  } while (
    moves.length > 0 && sideAfter(moves.length) !== state.player
  );
  state.selected = -1;
  state.targets = [];
  state.hint = [];
  replay(moves);
  save();
  render();
  requestAIMove();
}

const sideAfter = (plies: number): Color => (plies % 2 === 0 ? WHITE : BLACK);

// ---------------------------------------------------------------------------
// Board interaction
// ---------------------------------------------------------------------------

function canInteract() {
  return !state.result.over && !state.thinking &&
    state.pos.side === state.player;
}

function isOwnPiece(s: number) {
  const pc = state.pos.board[s];
  return pc !== EMPTY && (pc > 0 ? WHITE : BLACK) === state.player;
}

function select(s: number) {
  state.selected = s;
  state.targets = state.pos.legalMoves().filter((m) => moveFrom(m) === s);
}

function tryMove(from: number, to: number): boolean {
  const m = state.pos.legalMoves().find((mv) =>
    moveFrom(mv) === from && moveTo(mv) === to
  );
  if (m === undefined) return false;
  applyMove(m);
  return true;
}

function onSquareClick(s: number) {
  if (!canInteract()) return;
  if (state.selected !== -1 && state.selected !== s) {
    if (tryMove(state.selected, s)) return;
  }
  if (isOwnPiece(s)) {
    if (state.selected === s) {
      state.selected = -1;
      state.targets = [];
    } else select(s);
  } else {
    state.selected = -1;
    state.targets = [];
  }
  render();
}

// Drag & drop with pointer events (works for mouse, pen and touch).
let drag: {
  from: number;
  ghost: HTMLElement;
  startX: number;
  startY: number;
  moved: boolean;
  wasSelected: boolean;
} | null = null;

function squareFromPoint(x: number, y: number): number {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>(".square");
  return el ? Number(el.dataset.sq) : -1;
}

function onPointerDown(e: PointerEvent) {
  const el = (e.target as HTMLElement).closest<HTMLElement>(".square");
  if (!el || e.button !== 0) return;
  const s = Number(el.dataset.sq);
  if (!canInteract()) return;
  if (!isOwnPiece(s)) {
    onSquareClick(s);
    return;
  }
  e.preventDefault();
  const wasSelected = state.selected === s;
  if (state.selected !== s) {
    select(s);
    render();
  }
  const rect = el.getBoundingClientRect();
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.style.width = `${rect.width}px`;
  ghost.style.height = `${rect.height}px`;
  ghost.innerHTML = pieceSVG(state.pos.board[s]);
  ghost.style.display = "none";
  document.body.appendChild(ghost);
  drag = {
    from: s,
    ghost,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
    wasSelected,
  };
  try {
    boardEl.setPointerCapture(e.pointerId);
  } catch {
    // not critical: move/up listeners are global
  }
}

function onPointerMove(e: PointerEvent) {
  if (!drag) return;
  if (
    !drag.moved &&
    Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 5
  ) {
    drag.moved = true;
    drag.ghost.style.display = "block";
    boardEl.querySelector(`[data-sq="${drag.from}"]`)?.classList.add(
      "drag-origin",
    );
  }
  if (drag.moved) {
    drag.ghost.style.left = `${e.clientX}px`;
    drag.ghost.style.top = `${e.clientY}px`;
  }
}

function onPointerUp(e: PointerEvent) {
  if (!drag) return;
  const d = drag;
  drag = null;
  d.ghost.remove();
  boardEl.querySelector(".drag-origin")?.classList.remove("drag-origin");
  if (d.moved) {
    const to = squareFromPoint(e.clientX, e.clientY);
    if (to !== -1 && to !== d.from && tryMove(d.from, to)) return;
    render();
  } else if (d.wasSelected) {
    // A plain click on the already-selected piece deselects it.
    state.selected = -1;
    state.targets = [];
    render();
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

let boardEl: HTMLElement;

const STAR_SVG = `<svg viewBox="0 0 100 100"><use href="#star8"/></svg>`;

function render() {
  renderBoard();
  renderStatus();
  renderMoves();
  renderPlayers();
}

function renderBoard() {
  const pos = state.pos;
  const last = state.moves.length > 0
    ? state.moves[state.moves.length - 1]
    : -1;
  const lastSquares = last === -1 ? [] : [moveFrom(last), moveTo(last)];
  const checkSq = pos.inCheck() ? pos.kingSq[pos.side === WHITE ? 0 : 1] : -1;
  const targetSquares = new Set(state.targets.map(moveTo));
  const interact = canInteract();
  const html: string[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const file = state.flipped ? 7 - col : col;
      const rank = state.flipped ? row : 7 - row;
      const s = sq(file, rank);
      const pc = pos.board[s];
      const cls = ["square"];
      if ((file + rank) % 2 === 0) cls.push("sq-d");
      if (lastSquares.includes(s)) cls.push("last");
      if (s === state.selected) cls.push("selected");
      if (state.hint.includes(s)) cls.push("hint");
      if (targetSquares.has(s)) {
        cls.push("target");
        if (pc !== EMPTY) cls.push("occupied");
      }
      if (s === checkSq) cls.push("check");
      if (interact && (isOwnPiece(s) || targetSquares.has(s))) {
        cls.push("clickable");
      }
      let inner = "";
      if (col === 0) {
        inner += `<span class="coord rank">${rank + 1}</span>`;
      }
      if (row === 7) {
        inner += `<span class="coord file">${"abcdefgh"[file]}</span>`;
      }
      if (pc !== EMPTY) {
        let svg = pieceSVG(pc);
        if (s === state.animateTo) {
          svg = svg.replace('class="piece ', 'class="piece piece-anim ');
        }
        inner += svg;
      }
      const label = `${"abcdefgh"[file]}${rank + 1}${
        pc !== EMPTY
          ? ` ${pc > 0 ? "ivory" : "ebony"} ${
            PIECE_INFO[Math.abs(pc)].english.toLowerCase()
          }`
          : ""
      }`;
      html.push(
        `<div class="${
          cls.join(" ")
        }" data-sq="${s}" role="gridcell" aria-label="${label}">${inner}</div>`,
      );
    }
  }
  boardEl.innerHTML = html.join("");
  state.animateTo = -1;
}

function sideName(c: Color) {
  return c === WHITE ? "Ivory" : "Ebony";
}

const REASONS: Record<string, { seal: string; text: string }> = {
  checkmate: { seal: "شاه مات", text: "Shāh māt — the king is helpless." },
  stalemate: {
    seal: "شاه مات",
    text: "Stalemate — in shatranj, a king with no move is defeated.",
  },
  "bare-king": {
    seal: "الملك وحيد",
    text: "Bare king — the shāh stands alone on the field.",
  },
  "draw-bare": {
    seal: "تعادل",
    text: "Both kings were stripped bare. The game is drawn.",
  },
  repetition: {
    seal: "تعادل",
    text: "The same position arose three times. The game is drawn.",
  },
  "move-limit": {
    seal: "تعادل",
    text: "Seventy moves passed without progress. The game is drawn.",
  },
};

function renderStatus() {
  const level = LEVELS.find((l) => l.id === state.level)!;
  const icon = $("status-icon");
  const title = $("status-title");
  const detail = $("status-detail");
  const res = state.result;
  if (res.over) {
    icon.innerHTML = "";
    if (res.winner === 0) title.textContent = "Drawn game";
    else if (res.winner === state.player) title.textContent = "Victory!";
    else title.textContent = "Defeat";
    detail.textContent = REASONS[res.reason].text;
  } else if (state.thinking && pendingHint) {
    icon.innerHTML =
      `<svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>`;
    title.textContent = "Consulting the treatises…";
    detail.textContent = "Searching for a good move for you.";
  } else if (state.thinking) {
    icon.innerHTML =
      `<svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>`;
    title.textContent = `${level.name} is thinking…`;
    detail.textContent = level.description;
  } else {
    icon.innerHTML = "";
    const inCheck = state.pos.inCheck();
    title.textContent = inCheck ? "Shāh! Your king is in check" : "Your move";
    detail.textContent = `You play the ${
      sideName(state.player).toLowerCase()
    } pieces against ${level.name}, ${level.title.toLowerCase()}.`;
  }
  $<HTMLButtonElement>("undo-btn").disabled = state.moves.length === 0;
  $<HTMLButtonElement>("hint-btn").disabled = !canInteract();
}

function renderMoves() {
  const el = $("moves");
  if (state.sans.length === 0) {
    el.innerHTML =
      `<div class="col-span-3 text-muted-foreground py-2 text-center">No moves yet.</div>`;
    return;
  }
  const html: string[] = [];
  for (let i = 0; i < state.sans.length; i += 2) {
    const n = i / 2 + 1;
    html.push(`<div class="num">${n}.</div>`);
    for (const j of [i, i + 1]) {
      const cur = j === state.sans.length - 1 ? " current" : "";
      html.push(`<div class="mv${cur}">${state.sans[j] ?? ""}</div>`);
    }
  }
  el.innerHTML = html.join("");
  el.scrollTop = el.scrollHeight;
}

function materialOf(pieces: number[]) {
  return pieces.reduce((s, p) => s + VALUE[Math.abs(p)], 0);
}

function renderPlayers() {
  const ai = -state.player as Color;
  const level = LEVELS.find((l) => l.id === state.level)!;
  const bottomColor = state.flipped ? BLACK : WHITE;
  const topColor = -bottomColor as Color;
  const byWhite = state.captured.filter((p) => p < 0); // taken by White
  const byBlack = state.captured.filter((p) => p > 0);
  const diff = Math.round((materialOf(byWhite) - materialOf(byBlack)) / 100);

  const row = (color: Color) => {
    const isAI = color === ai;
    const taken = (color === WHITE ? byWhite : byBlack)
      .slice()
      .sort((a, b) => VALUE[Math.abs(b)] - VALUE[Math.abs(a)]);
    const adv = color === WHITE ? diff : -diff;
    const toMove = !state.result.over && state.pos.side === color;
    const name = isAI
      ? `<span class="font-medium">${level.name}</span>
         <span class="font-arabic text-gold" lang="ar">${level.arabic}</span>
         <span class="badge" data-variant="outline">Level ${level.id}</span>`
      : `<span class="font-medium">You</span>`;
    return `
      <div class="flex items-center gap-2 min-w-0">
        <span class="size-3 rounded-full ring-1 ring-border ${
      color === WHITE ? "bg-[var(--ivory-fill)]" : "bg-[var(--ebony-fill)]"
    } ${
      toMove ? "outline-2 outline-offset-2 outline-[var(--gold)]" : ""
    }"></span>
        ${name}
      </div>
      <div class="captured flex items-center min-w-0 overflow-hidden">
        ${taken.map((p) => pieceSVG(p)).join("")}
        ${
      adv > 0
        ? `<span class="ml-3 text-xs text-muted-foreground">+${adv}</span>`
        : ""
    }
      </div>`;
  };
  $("top-player").innerHTML = row(topColor);
  $("bottom-player").innerHTML = row(bottomColor);
}

function showResult() {
  const res = state.result;
  if (!res.over) return;
  const r = REASONS[res.reason];
  $("result-seal").textContent = r.seal;
  let title: string;
  if (res.winner === 0) title = "A drawn game";
  else if (res.winner === state.player) title = "You are victorious";
  else title = `${LEVELS.find((l) => l.id === state.level)!.name} prevails`;
  $("result-title").textContent = title;
  $("result-detail").textContent = `${r.text} (${state.sans.length} plies)`;
  $<HTMLDialogElement>("result-dialog").showModal();
}

function renderLevels() {
  const el = $("level-list");
  el.insertAdjacentHTML(
    "beforeend",
    LEVELS.map((l) => `
    <label class="level-option">
      <input type="radio" name="level" value="${l.id}" ${
      l.id === state.level ? "checked" : ""
    } />
      <span class="star-badge">${STAR_SVG}<span>${
      toArabicDigits(l.id)
    }</span></span>
      <span class="flex flex-col min-w-0">
        <span class="text-sm font-medium flex items-baseline gap-2">
          ${l.name}
          <span class="font-arabic text-gold text-sm" lang="ar">${l.arabic}</span>
        </span>
        <span class="text-xs text-muted-foreground truncate">${l.title}</span>
      </span>
    </label>`).join(""),
  );
  // Changing the level mid-game applies to the opponent's next move.
  el.addEventListener("change", (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === "level") {
      state.level = Number(t.value);
      save();
      render();
    }
  });
}

function renderRules() {
  const order = [SHAH, 2, 3, 4, 5, 1];
  $("rules-pieces").innerHTML = order.map((t) => {
    const info = PIECE_INFO[t];
    return `
      <div class="flex items-center gap-3 rounded-lg border p-2">
        <div class="flex shrink-0 size-12 items-center justify-center rounded-md bg-[var(--sq-light)]">
          ${pieceSVG(t)}
        </div>
        <div class="min-w-0">
          <div class="font-medium flex items-baseline gap-2">
            ${info.name}
            <span class="font-arabic text-gold" lang="ar">${info.arabic}</span>
            <span class="text-xs text-muted-foreground">${info.english}${
      info.letter ? ` · ${info.letter}` : ""
    }</span>
          </div>
          <div class="text-muted-foreground">${info.move}</div>
        </div>
      </div>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

function init() {
  boardEl = $("board");
  createWorker();

  const saved = load();
  if (saved) {
    state.player = saved.player === BLACK ? BLACK : WHITE;
    state.level = LEVELS.some((l) => l.id === saved.level) ? saved.level : 3;
    state.flipped = !!saved.flipped;
    if (!replay(saved.moves)) replay([]);
  }
  const colorInput = document.querySelector<HTMLInputElement>(
    `input[name="color"][value="${
      state.player === WHITE ? "white" : "black"
    }"]`,
  );
  if (colorInput) colorInput.checked = true;

  renderLevels();
  renderRules();

  boardEl.addEventListener("pointerdown", onPointerDown);
  globalThis.addEventListener("pointermove", onPointerMove);
  globalThis.addEventListener("pointerup", onPointerUp);
  globalThis.addEventListener("pointercancel", () => {
    if (drag) {
      drag.ghost.remove();
      drag = null;
      render();
    }
  });

  $("new-game-btn").addEventListener("click", newGame);
  $("result-new-btn").addEventListener("click", () => {
    $<HTMLDialogElement>("result-dialog").close();
    newGame();
  });
  $("undo-btn").addEventListener("click", undo);
  $("hint-btn").addEventListener("click", requestHint);
  $("flip-btn").addEventListener("click", () => {
    state.flipped = !state.flipped;
    save();
    render();
  });
  $("rules-btn").addEventListener(
    "click",
    () => $<HTMLDialogElement>("rules-dialog").showModal(),
  );
  $("theme-btn").addEventListener("click", () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("shatranj:theme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.selected !== -1) {
      state.selected = -1;
      state.targets = [];
      render();
    }
  });

  render();
  requestAIMove();
}

init();
