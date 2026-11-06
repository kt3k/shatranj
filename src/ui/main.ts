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
import {
  CLASS_INFO,
  type Classification,
  formatScore,
  summarize,
  whiteScore,
  winChance,
} from "../engine/analysis.ts";
import * as Review from "./review.ts";
import * as Library from "./library.ts";
import type { GameRecord } from "./library.ts";
import {
  decodeShare,
  encodeShare,
  parsePGN,
  type PgnFailure,
  type PgnGame,
  pgnResult,
  toPGN,
} from "../engine/record.ts";
import { reviewMoves } from "../engine/analysis.ts";
import { callHost, shareBase } from "./host.ts";
import {
  applyStatic,
  currentLang,
  detectLang,
  dictFor,
  intlLocale,
  isArabicScript,
  isRTL,
  type Lang,
  LANGS,
  ltr,
  num,
  percent,
  saveLang,
  setLang,
  t,
} from "./i18n.ts";
import { review } from "./review.ts";
import type { WorkerRequest, WorkerResponse } from "./worker.ts";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface Saved {
  moves: Move[];
  player: Color;
  level: number;
  flipped: boolean;
  colorChoice?: "white" | "black" | "random";
  gameId?: string;
  createdAt?: number;
}

const STORAGE_KEY = "shatranj:game";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const toArabicDigits = (n: number) =>
  String(n).replace(
    /\d/g,
    (d) => (currentLang() === "fa" ? PERSIAN_DIGITS : ARABIC_DIGITS)[Number(d)],
  );

/** Localised opponent name / title / description. */
const lname = (id: number) => t(`level.${id}.name`);
const ltitle = (id: number) => t(`level.${id}.title`);
const ldesc = (id: number) => t(`level.${id}.desc`);
/** Original Arabic name shown beside a translated one (not in ar/fa). */
const arabicAside = (arabic: string, extra = "") =>
  isArabicScript()
    ? ""
    : `<span class="font-arabic text-gold ${extra}" lang="ar">${arabic}</span>`;

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
  hintSan: "",
  colorChoice: "white" as "white" | "black" | "random",
  cursor: sq(4, 1),
  /** Ply being reviewed from the move list, or null when showing the live game. */
  viewPly: null as number | null,
  result: { over: false } as GameResult,
  requestId: 0,
  animateTo: -1,
  /** Identity of the live game in the library. */
  gameId: Library.newId(),
  createdAt: Date.now(),
  /** Set while a saved/shared game is open; the live game is stashed. */
  viewer: null as null | {
    record: GameRecord;
    saved: boolean;
    /** Opened from a share link in the address bar (no history entry). */
    fromHash: boolean;
    live: {
      moves: Move[];
      player: Color;
      level: number;
      flipped: boolean;
      review: Review.ReviewSnapshot;
    };
  },
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
  if (state.viewer) return; // the live game is stashed, nothing changed
  try {
    const s: Saved = {
      moves: state.moves,
      player: state.player,
      level: state.level,
      flipped: state.flipped,
      colorChoice: state.colorChoice,
      gameId: state.gameId,
      createdAt: state.createdAt,
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
  Review.syncWithGame(state.moves);
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
  worker.onerror = (e) => {
    // Recover instead of leaving the UI stuck in "thinking".
    console.error("AI worker failed:", e.message);
    e.preventDefault();
    worker.terminate();
    createWorker();
    const wasHint = pendingHint;
    state.thinking = false;
    pendingHint = false;
    state.requestId++;
    render();
    if (!wasHint) requestAIMove();
  };
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
    state.hintSan = state.pos.toSAN(move);
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
  if (state.viewer || state.result.over || state.pos.side === state.player) {
    return;
  }
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
  if (
    state.viewer || state.result.over || state.thinking ||
    state.pos.side !== state.player
  ) {
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
  const byAI = state.pos.side !== state.player;
  state.viewPly = null;
  replay([...state.moves, m]);
  const san = state.sans[state.sans.length - 1];
  announce(
    byAI
      ? t("sr.played", { name: lname(state.level), move: san })
      : t("sr.youPlayed", { move: san }),
  );
  state.selected = -1;
  state.targets = [];
  clearHint();
  state.animateTo = moveTo(m);
  save();
  persistLive();
  render();
  if (state.result.over) {
    setTimeout(showResult, 350);
  } else {
    requestAIMove();
  }
}

/** Polite screen-reader announcement. */
function announce(text: string) {
  const el = $("sr-live");
  el.textContent = "";
  // A fresh text node after a tick makes repeated messages announce too.
  setTimeout(() => (el.textContent = text), 50);
}

function clearHint() {
  state.hint = [];
  state.hintSan = "";
}

/** Reflects the current settings into the new-game dialog's inputs. */
function syncSetupInputs() {
  for (
    const input of document.querySelectorAll<HTMLInputElement>(
      'input[name="level"]',
    )
  ) input.checked = Number(input.value) === state.level;
  for (
    const input of document.querySelectorAll<HTMLInputElement>(
      'input[name="color"]',
    )
  ) input.checked = input.value === state.colorChoice;
}

function openNewGameDialog() {
  syncSetupInputs();
  openDialog($<HTMLDialogElement>("new-game-dialog"));
  // Focus the current choice rather than the first option.
  document.querySelector<HTMLInputElement>('input[name="level"]:checked')
    ?.focus({ preventScroll: true });
}

/** Starts a new game with the settings chosen in the new-game dialog. */
function startFromDialog() {
  const levelInput = document.querySelector<HTMLInputElement>(
    'input[name="level"]:checked',
  );
  state.level = levelInput ? Number(levelInput.value) : 3;
  const colorInput = document.querySelector<HTMLInputElement>(
    'input[name="color"]:checked',
  );
  const v = colorInput?.value;
  state.colorChoice = v === "black" || v === "random" ? v : "white";
  $<HTMLDialogElement>("new-game-dialog").close();
  newGame();
}

/** Starts a new game with the current settings. */
function newGame() {
  cancelThinking();
  retireLive();
  const choice = state.colorChoice;
  state.player = choice === "black"
    ? BLACK
    : choice === "random"
    ? (Math.random() < 0.5 ? WHITE : BLACK)
    : WHITE;
  state.flipped = state.player === BLACK;
  state.cursor = state.player === WHITE ? sq(4, 1) : sq(4, 6);
  state.selected = -1;
  state.targets = [];
  clearHint();
  state.viewPly = null;
  Review.clear();
  state.gameId = Library.newId();
  state.createdAt = Date.now();
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
  clearHint();
  state.viewPly = null;
  replay(moves);
  save();
  persistLive();
  render();
  requestAIMove();
}

const sideAfter = (plies: number): Color => (plies % 2 === 0 ? WHITE : BLACK);

// ---------------------------------------------------------------------------
// Board interaction
// ---------------------------------------------------------------------------

function canInteract() {
  return !state.viewer && state.viewPly === null && !state.result.over &&
    !state.thinking && state.pos.side === state.player;
}

// ---------------------------------------------------------------------------
// Reviewing past positions
// ---------------------------------------------------------------------------

let viewCache: { ply: number; key: string; pos: Position } | null = null;

/** The position after `ply` half-moves of the current game. */
function positionAt(ply: number): Position {
  if (ply >= state.moves.length) return state.pos;
  const key = state.moves.slice(0, ply).join(",");
  if (viewCache?.key !== key) {
    const pos = Position.initial();
    for (const m of state.moves.slice(0, ply)) pos.makeMove(m);
    viewCache = { ply, key, pos };
  }
  return viewCache.pos;
}

const currentPly = () => state.viewPly ?? state.moves.length;

/**
 * Ply shown on the board. Normally the reviewed ply, but "show better move"
 * steps back one ply to show the position the move was played from.
 */
function boardPly(): number {
  const p = currentPly();
  return review.showBest && p > 0 && Review.reviewOf(p - 1) ? p - 1 : p;
}

/** The position shown on the board: the live one, or a past one under review. */
function shownPosition(): Position {
  return positionAt(boardPly());
}

/** Shows the position after `ply` half-moves (clamped); the last ply means live. */
function viewAt(ply: number) {
  const total = state.moves.length;
  const p = Math.max(0, Math.min(total, ply));
  // After the game, stay in review mode on the final move so its review shows.
  const keep = p === total &&
    (!!state.viewer || (state.result.over && !!Review.reviewOf(p - 1)));
  state.viewPly = p === total && !keep ? null : p;
  clearHint();
  // For real errors, go straight to the better move.
  const r = state.viewPly !== null ? Review.reviewOf(state.viewPly - 1) : null;
  review.showBest = !!r &&
    (r.classification === "mistake" || r.classification === "blunder");
  state.selected = -1;
  state.targets = [];
  render();
}

/** On phones the move list sits below the board: bring the board back. */
const coarse = () => matchMedia("(pointer: coarse)").matches;

function revealBoard() {
  const header = document.querySelector("body > header")
    ?.getBoundingClientRect();
  const top =
    header && getComputedStyle(document.querySelector("body > header")!)
          .position === "sticky"
      ? header.bottom
      : 0;
  const r = boardEl.getBoundingClientRect();
  if (r.top >= top && r.bottom <= innerHeight) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  boardEl.closest(".board-col")?.scrollIntoView({
    block: "start",
    behavior: reduce ? "auto" : "smooth",
  });
}

function goLive() {
  if (state.viewer) {
    void closeViewer();
    return;
  }
  state.viewPly = null;
  review.showBest = false;
  render();
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

// Keyboard play: arrows move a cursor, Enter/Space picks up or places.
function onBoardKey(e: KeyboardEvent) {
  const dirs: Record<string, [number, number]> = {
    ArrowUp: [0, 1],
    ArrowDown: [0, -1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  if (e.key in dirs) {
    e.preventDefault();
    let [df, dr] = dirs[e.key];
    if (state.flipped) [df, dr] = [-df, -dr];
    const file = Math.min(7, Math.max(0, (state.cursor % 10) - 1 + df));
    const rank = Math.min(
      7,
      Math.max(0, Math.floor(state.cursor / 10) - 2 + dr),
    );
    state.cursor = sq(file, rank);
    boardEl.classList.add("kbd-nav");
    renderBoard();
    return;
  }
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    boardEl.classList.add("kbd-nav");
    onSquareClick(state.cursor);
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
  renderViewer();
  renderBoard();
  renderReviewStrip();
  renderStatus();
  renderMoves();
  renderPlayers();
}

function renderBoard() {
  const pos = shownPosition();
  const ply = boardPly();
  const last = ply > 0 ? state.moves[ply - 1] : -1;
  const frame = boardEl.closest<HTMLElement>(".board-frame");
  frame?.classList.toggle("reviewing", state.viewPly !== null);
  if (frame) frame.dataset.label = t("board.reviewing");
  const lastSquares = last === -1 ? [] : [moveFrom(last), moveTo(last)];
  const checkSq = pos.inCheck() ? pos.kingSq[pos.side === WHITE ? 0 : 1] : -1;
  const targetSquares = new Set(state.targets.map(moveTo));
  const interact = canInteract();
  const html: string[] = [];
  for (let row = 0; row < 8; row++) {
    html.push(`<div role="row" class="contents">`);
    for (let col = 0; col < 8; col++) {
      const file = state.flipped ? 7 - col : col;
      const rank = state.flipped ? row : 7 - row;
      const s = sq(file, rank);
      const pc = pos.board[s];
      const cls = ["square"];
      if ((file + rank) % 2 === 0) cls.push("sq-d");
      if (lastSquares.includes(s)) cls.push("last");
      if (s === state.selected) cls.push("selected");
      if (state.viewPly === null && state.hint.includes(s)) cls.push("hint");
      if (targetSquares.has(s)) {
        cls.push("target");
        if (pc !== EMPTY) cls.push("occupied");
      }
      if (s === checkSq) cls.push("check");
      if (s === state.cursor) cls.push("cursor");
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
      const squareName = `${"abcdefgh"[file]}${rank + 1}`;
      let label = pc === EMPTY ? squareName : t("square.piece", {
        square: squareName,
        side: t(pc > 0 ? "side.ivory.lower" : "side.ebony.lower"),
        piece: t(`piece.${Math.abs(pc)}.name`),
      });
      if (s === state.selected) label += `, ${t("sr.selected")}`;
      else if (targetSquares.has(s)) label += `, ${t("sr.target")}`;
      html.push(
        `<div class="${
          cls.join(" ")
        }" data-sq="${s}" id="sq-${s}" role="gridcell" aria-label="${label}"${
          s === state.selected ? ' aria-selected="true"' : ""
        }>${inner}</div>`,
      );
    }
    html.push(`</div>`);
  }
  boardEl.innerHTML = html.join("");
  boardEl.setAttribute("aria-activedescendant", `sq-${state.cursor}`);
  state.animateTo = -1;
  renderOverlay();
}

/** Centre of a square in the 800×800 overlay coordinate system. */
function squareCentre(s: number): [number, number] {
  const file = (s % 10) - 1;
  const rank = Math.floor(s / 10) - 2;
  const col = state.flipped ? 7 - file : file;
  const row = state.flipped ? rank : 7 - rank;
  return [col * 100 + 50, row * 100 + 50];
}

function arrowSVG(from: number, to: number, cls: string, head: string) {
  const [x1, y1] = squareCentre(from);
  const [x2, y2] = squareCentre(to);
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  // Start a little off the origin centre, stop before the arrow head.
  const sx = x1 + ux * 22, sy = y1 + uy * 22;
  const ex = x2 - ux * 30, ey = y2 - uy * 30;
  return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" class="${cls}"
    marker-end="url(#${head})"/>`;
}

const ARROW_DEFS = `
  <defs>
    <marker id="hint-head" viewBox="0 0 10 10" refX="3" refY="5"
      markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" class="hint-arrow-head"/>
    </marker>
    <marker id="played-head" viewBox="0 0 10 10" refX="3" refY="5"
      markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" class="played-arrow-head"/>
    </marker>
  </defs>`;

function renderOverlay() {
  const overlay = $("board-overlay");
  const parts: string[] = [];
  if (state.viewPly === null && state.hint.length === 2) {
    const [x1, y1] = squareCentre(state.hint[0]);
    parts.push(`<circle cx="${x1}" cy="${y1}" r="44" class="hint-ring"/>`);
    parts.push(
      arrowSVG(state.hint[0], state.hint[1], "hint-arrow", "hint-head"),
    );
  } else if (review.showBest) {
    const r = Review.reviewOf(currentPly() - 1);
    if (r) {
      parts.push(
        arrowSVG(
          moveFrom(r.played),
          moveTo(r.played),
          "played-arrow",
          "played-head",
        ),
      );
      if (r.best !== r.played) {
        parts.push(
          arrowSVG(moveFrom(r.best), moveTo(r.best), "hint-arrow", "hint-head"),
        );
      }
    }
  }
  overlay.innerHTML = parts.length ? ARROW_DEFS + parts.join("") : "";
}

function turnIcon(c: Color) {
  return `<span class="turn-icon to-move">${pieceSVG(c * SHAH)}</span>`;
}

function sideName(c: Color) {
  return t(c === WHITE ? "side.ivory" : "side.ebony");
}

/** Arabic seals shown in the result dialog (decorative, not translated). */
const SEALS: Record<string, string> = {
  checkmate: "شاه مات",
  stalemate: "شاه مات",
  "bare-king": "الملك وحيد",
  "draw-bare": "تعادل",
  repetition: "تعادل",
  "move-limit": "تعادل",
};
const reasonText = (reason: string) => t(`reason.${reason}`);

function renderStatus() {
  const level = LEVELS.find((l) => l.id === state.level)!;
  const icon = $("status-icon");
  const title = $("status-title");
  const detail = $("status-detail");
  const res = state.result;
  let extra = "";
  if (res.over && state.viewPly === null) {
    icon.innerHTML = res.winner === state.player
      ? `<svg class="size-6 text-gold" viewBox="0 0 100 100" fill="currentColor"><use href="#star8"/></svg>`
      : `<span class="turn-icon">${pieceSVG(state.player * SHAH)}</span>`;
    if (res.winner === 0) title.textContent = t("status.draw");
    else if (res.winner === state.player) {
      title.textContent = t("status.victory");
    } else title.textContent = t("status.defeat");
    detail.textContent = reasonText(res.reason);
  } else if (state.thinking && pendingHint) {
    icon.innerHTML =
      `<svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>`;
    title.textContent = t("status.hintThinking");
    detail.textContent = t("status.hintThinking.detail");
  } else if (state.thinking) {
    icon.innerHTML =
      `<svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>`;
    title.textContent = t("status.thinking", { name: lname(level.id) });
    detail.textContent = ldesc(level.id);
  } else if (state.viewPly !== null && Review.reviewOf(state.viewPly - 1)) {
    const ply = state.viewPly;
    const r = Review.reviewOf(ply - 1)!;
    const info = CLASS_INFO[r.classification];
    icon.innerHTML = classBadge(r.classification);
    const who = r.color === state.player
      ? t("review.byYou")
      : t("review.byThem", { name: lname(state.level) });
    title.textContent = `${
      ltr(moveLabel(ply - 1) + info.symbol.replace("★", ""))
    } · ${t(`class.${r.classification}`)}`;
    const sign = r.color === WHITE ? 1 : -1;
    const evalText = t("review.eval", {
      before: ltr(formatScore(sign * r.before)),
      after: ltr(formatScore(sign * r.after)),
    });
    const sep = t("punct.sep");
    if (r.classification === "best" || r.best === r.played) {
      detail.textContent = `${who}${sep}${evalText}${sep}${
        r.best === r.played ? t("review.agrees") : t("review.asGood")
      }`;
    } else {
      const bestSan = ltr(positionAt(ply - 1).toSAN(r.best));
      detail.textContent = `${who}${sep}${
        t("review.better", { move: bestSan })
      } ${evalText}`;
      extra =
        `<button type="button" class="btn" data-variant="outline" data-size="sm" id="show-best-btn" aria-pressed="${review.showBest}">${
          review.showBest
            ? t("review.backToPlayed")
            : t("review.showBest", { move: bestSan })
        }</button>`;
    }
  } else if (state.viewPly !== null) {
    const ply = state.viewPly;
    icon.innerHTML =
      `<svg class="size-5 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>`;
    title.textContent = ply === 0
      ? t("status.reviewStart")
      : t("status.reviewMove", { move: ltr(moveLabel(ply - 1)) });
    detail.textContent = matchMedia("(pointer: coarse)").matches
      ? ""
      : t(state.viewer ? "status.viewerHelp" : "status.reviewHelp");
  } else if (state.hintSan) {
    icon.innerHTML = turnIcon(state.player);
    title.textContent = t("status.hint", { move: ltr(state.hintSan) });
    detail.textContent = t("status.hint.detail");
  } else {
    icon.innerHTML = turnIcon(state.player);
    const inCheck = state.pos.inCheck();
    title.textContent = inCheck ? t("status.check") : t("status.yourMove");
    detail.textContent = inCheck
      ? t("status.check.detail")
      : state.selected !== -1
      ? t("status.selected")
      : t(
        state.player === WHITE ? "status.pickUp.ivory" : "status.pickUp.ebony",
      );
    if (state.moves.length < 2 && !inCheck) {
      extra = `<button type="button" class="newcomer-link" id="newcomer-btn">${
        t("status.newcomer")
      }</button>`;
    }
  }
  $("status-extra").innerHTML = extra;
  $("status-extra").hidden = extra === "";
  $<HTMLButtonElement>("undo-btn").disabled = state.moves.length === 0 ||
    state.viewPly !== null;
  $<HTMLButtonElement>("hint-btn").disabled = !canInteract();
  const newBtn = $("new-game-btn");
  $("new-game-label").textContent = res.over && !state.viewer
    ? t("btn.playAgain")
    : t("btn.newGame");
  if (res.over && !state.viewer) delete newBtn.dataset.variant;
  else newBtn.dataset.variant = "secondary";
}

function renderMoves() {
  const el = $("moves");
  const n = Math.ceil(state.sans.length / 2);
  $("move-count").textContent = n === 0 ? "" : t("moves.count", { n });
  if (state.sans.length === 0) {
    el.innerHTML =
      `<div class="col-span-3 text-muted-foreground py-2 text-center">${
        t("moves.empty")
      }</div>`;
    renderMoveNav();
    return;
  }
  const html: string[] = [];
  const shown = currentPly() - 1;
  for (let i = 0; i < state.sans.length; i += 2) {
    const n = i / 2 + 1;
    html.push(`<div class="num">${n}.</div>`);
    for (const j of [i, i + 1]) {
      if (j >= state.sans.length) {
        html.push(`<div></div>`);
        continue;
      }
      const cur = j === shown ? " current" : "";
      const r = Review.reviewOf(j);
      const mark =
        r && r.classification !== "good" && r.classification !== "best"
          ? `<span class="mv-mark">${
            CLASS_INFO[r.classification].symbol
          }</span>`
          : "";
      const cls = r ? ` cls-${r.classification}` : "";
      html.push(
        `<button type="button" class="mv${cur}${cls}" data-ply="${
          j + 1
        }" aria-label="${t("moves.aria", { move: moveLabel(j) })}${
          r ? ` (${t(`class.${r.classification}`)})` : ""
        }"${j === shown ? ' aria-current="step"' : ""} tabindex="${
          j === shown ? 0 : -1
        }">${state.sans[j]}${mark}</button>`,
      );
    }
  }
  const hadFocus = el.contains(document.activeElement);
  el.innerHTML = html.join("");
  const cur = el.querySelector<HTMLElement>(".mv.current");
  // Keep keyboard focus on the current move as the list re-renders.
  if (hadFocus) cur?.focus({ preventScroll: true });
  if (state.viewPly === null) el.scrollTop = el.scrollHeight;
  else if (cur) {
    // Scroll only the list (scrollIntoView would also scroll the page).
    const top = cur.offsetTop - el.offsetTop;
    if (
      top < el.scrollTop ||
      top + cur.offsetHeight > el.scrollTop + el.clientHeight
    ) {
      el.scrollTop = top - el.clientHeight / 2 + cur.offsetHeight / 2;
    }
  }
  renderMoveNav();
}

/** Compact move navigation under the board (phones). */
function renderReviewStrip() {
  const el = $("review-strip");
  if (state.viewPly === null || state.moves.length === 0) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const ply = state.viewPly;
  const r = ply > 0 ? Review.reviewOf(ply - 1) : undefined;
  const label = ply === 0 ? t("status.reviewStart") : ltr(
    moveLabel(ply - 1) +
      (r ? CLASS_INFO[r.classification].symbol.replace("★", "") : ""),
  );
  el.innerHTML = `
    <button type="button" class="btn" data-variant="outline" data-size="icon" data-step="-1" aria-label="${
    t("nav.prev")
  }" ${
    ply === 0 ? "disabled" : ""
  }><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button>
    <span class="flex-1 min-w-0 truncate text-center text-sm font-medium">${label}</span>
    <button type="button" class="btn" data-variant="outline" data-size="icon" data-step="1" aria-label="${
    t("nav.next")
  }" ${
    ply >= state.moves.length ? "disabled" : ""
  }><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button>
    ${
    // In the viewer the bar above the board already offers the way back.
    state.viewer
      ? ""
      : `<button type="button" class="btn" data-size="sm" data-live>${
        t("nav.live")
      }</button>`}`;
}

function renderMoveNav() {
  const ply = currentPly();
  const total = state.moves.length;
  $("moves-nav").style.display = total === 0 ? "none" : "";
  $<HTMLButtonElement>("nav-first").disabled = ply === 0;
  $<HTMLButtonElement>("nav-prev").disabled = ply === 0;
  $<HTMLButtonElement>("nav-next").disabled = ply >= total;
  $<HTMLButtonElement>("nav-last").disabled = ply >= total;
  $("nav-live").hidden = state.viewPly === null || !!state.viewer;
  const analyse = $<HTMLButtonElement>("analyse-btn");
  analyse.hidden = state.result.over || review.running || Review.hasReview() ||
    total < 2;
}

function moveLabel(i: number) {
  return `${Math.floor(i / 2) + 1}${i % 2 ? "…" : "."} ${state.sans[i]}`;
}

function classBadge(c: Classification) {
  const sym = CLASS_INFO[c].symbol || "✓";
  return `<span class="class-badge cls-${c}" aria-hidden="true">${sym}</span>`;
}

// ---------------------------------------------------------------------------
// Game review card
// ---------------------------------------------------------------------------

function startReview() {
  Review.start(state.moves, () => {
    if (Review.isComplete()) saveReviewToRecord();
    render();
  });
  render();
  // On phones the review card is below the board: show that it started.
  const card = $("review-card");
  if (card.getBoundingClientRect().top > innerHeight - 80) {
    card.scrollIntoView({ block: "start" });
  }
}

function saveReviewToRecord() {
  const snap = Review.snapshot();
  const data = { scores: snap.scores, best: snap.best };
  if (state.viewer) {
    state.viewer.record.review = data;
    if (state.viewer.saved) Library.putRecord(state.viewer.record);
  } else persistLive();
}

function renderReview() {
  const card = $("review-card");
  const show = state.result.over || review.running || Review.hasReview() ||
    !!state.viewer;
  card.hidden = !show;
  // The opponent card gives way to the review once there is one.
  $("opponent-card").hidden = !!state.viewer ||
    (show && (review.running || Review.hasReview()));
  if (!show) return;

  const total = state.moves.length;
  const done = Review.analysedCount();
  const needed = total + 1;
  const reviews = Review.reviews();

  let body = "";
  if (!Review.hasReview() && !review.running) {
    body = `
      <p class="text-sm text-muted-foreground text-pretty">${
      t("review.intro")
    }</p>
      <button type="button" class="btn w-full" id="review-start-btn" ${
      total < 2 ? "disabled" : ""
    }>${STAR_ICON} ${t("review.start")}</button>`;
  } else {
    const me = summarize(reviews, state.player);
    const them = summarize(reviews, -state.player as Color);
    const row = (c: Classification) =>
      `<div class="review-row cls-${c}"><span class="class-badge cls-${c}">${
        CLASS_INFO[c].symbol
      }</span><span>${
        t(`class.${c}.plural`)
      }</span><span class="tabular-nums">${
        num(me.counts[c])
      }</span><span class="tabular-nums">${num(them.counts[c])}</span></div>`;
    const progress = review.running
      ? `<div class="flex items-center gap-2 text-xs text-muted-foreground">
          <svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>
          <span class="flex-1">${
        t("review.analysing", { done: Math.min(done, needed), total: needed })
      }</span>
          <button type="button" class="btn" data-variant="ghost" data-size="xs" id="review-cancel-btn">${
        t("review.stop")
      }</button>
        </div>
        <div class="review-progress"><span style="width:${
        (100 * done / needed).toFixed(1)
      }%"></span></div>`
      : !Review.isComplete()
      ? `<button type="button" class="btn w-full" data-variant="outline" data-size="sm" id="review-start-btn">
          ${t("review.remaining", { n: needed - done })}</button>`
      : "";
    body = `
      ${evalGraph()}
      ${progress}
      <div class="review-table text-sm${
      Review.isComplete() ? "" : " opacity-60"
    }">
        <div class="review-row review-head"><span></span><span></span>
          <span class="truncate">${
      esc(columnLabel(state.player))
    }</span><span class="truncate">${
      esc(columnLabel(-state.player as Color))
    }</span></div>
        <div class="review-row review-acc"><span></span><span>${
      t("review.accuracy")
    }</span>
          <span>${
      Review.isComplete() && reviewsFor(state.player)
        ? percent(me.accuracy)
        : "–"
    }</span>
          <span>${
      Review.isComplete() && reviewsFor(-state.player as Color)
        ? percent(them.accuracy)
        : "–"
    }</span></div>
        ${row("blunder")}${row("mistake")}${row("inaccuracy")}${row("best")}
      </div>
      <p class="text-xs text-muted-foreground">${
      t(coarse() ? "review.footnote.touch" : "review.footnote")
    }</p>`;
  }
  card.innerHTML = `
    <header class="px-5">
      <h2 class="font-display text-lg">${t("review.title")}</h2>
    </header>
    <section class="px-5 flex flex-col gap-3">${body}</section>`;
}

const reviewsFor = (c: Color) => Review.reviews().some((r) => r.color === c);

const STAR_ICON =
  `<svg width="16" height="16" viewBox="0 0 100 100" fill="currentColor"><use href="#star8" /></svg>`;

/** White's winning chances over the game as an area chart. */
function evalGraph(): string {
  const W = 300, H = 72;
  const total = Math.max(1, state.moves.length);
  const pts: [number, number][] = [];
  for (let k = 0; k <= state.moves.length; k++) {
    const ws = whiteScore(review.scores, k);
    if (ws == null) break;
    pts.push([(k / total) * W, (1 - winChance(ws)) * H]);
  }
  if (pts.length === 0) return "";
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `M0,${H} L${line.replaceAll(" ", " L")} L${
    last[0].toFixed(1)
  },${H} Z`;
  const marks = Review.reviews()
    .filter((r) =>
      r.classification === "blunder" || r.classification === "mistake"
    )
    .map((r) => {
      const [x, y] = pts[r.ply + 1] ?? [0, 0];
      return `<circle cx="${x.toFixed(1)}" cy="${
        y.toFixed(1)
      }" r="3.2" class="graph-mark cls-${r.classification}"/>`;
    })
    .join("");
  const cx = (currentPly() / total) * W;
  return `
    <svg class="eval-graph" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
      role="img" aria-label="${t("review.graph")}" id="eval-graph" dir="ltr">
      <rect width="${W}" height="${H}" class="graph-bg"/>
      <path d="${area}" class="graph-area"/>
      <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" class="graph-mid"/>
      <polyline points="${line}" class="graph-line"/>
      <line x1="${cx.toFixed(1)}" y1="0" x2="${
    cx.toFixed(1)
  }" y2="${H}" class="graph-cursor"/>
      ${marks}
    </svg>`;
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
    const custom = recordName(color);
    const name = custom !== null
      ? `<span class="font-medium truncate">${esc(custom)}</span>`
      : isAI
      ? `<span class="font-medium">${lname(level.id)}</span>
         ${arabicAside(level.arabic, "max-sm:hidden")}
         <span class="badge shrink-0" data-variant="outline">${
        t("player.level", { n: level.id })
      }</span>
         ${
        state.thinking && !pendingHint
          ? `<span class="flex items-center gap-1 text-xs text-muted-foreground"><svg class="thinking-star" viewBox="0 0 100 100"><use href="#star8"/></svg>${
            t("player.thinking")
          }</span>`
          : ""
      }`
      : `<span class="font-medium">${t("player.you")}</span>`;
    return `
      <div class="flex items-center gap-2 min-w-0 flex-1">
        <span class="turn-icon${toMove ? " to-move" : ""}" title="${
      toMove ? t("player.toMove", { side: sideName(color) }) : sideName(color)
    }">${pieceSVG(color * SHAH)}</span>
        ${name}
      </div>
      <div class="captured flex items-center shrink-0">
        ${groupCaptured(taken)}
        ${
      adv > 0
        ? `<span class="ms-3 text-xs text-muted-foreground" dir="ltr">+${
          num(adv)
        }</span>`
        : ""
    }
      </div>`;
  };
  $("top-player").innerHTML = row(topColor);
  $("bottom-player").innerHTML = row(bottomColor);
  renderOpponent();
  renderReview();
}

/** Captured pieces as one icon per type with a count ("♟×3"). */
function groupCaptured(pieces: number[]): string {
  const counts = new Map<number, number>();
  for (const p of pieces) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts].map(([p, n]) =>
    `<span class="cap-group">${pieceSVG(p)}${
      n > 1 ? `<span class="cap-n" dir="ltr">×${num(n)}</span>` : ""
    }</span>`
  ).join("");
}

function renderOpponent() {
  const l = LEVELS.find((l) => l.id === state.level)!;
  $("opponent-card").innerHTML = `
    <header class="px-5">
      <span class="text-xs uppercase tracking-wider text-muted-foreground">${
    t("opponent.label")
  }</span>
    </header>
    <section class="px-5 flex items-start gap-3">
      <span class="star-badge size-11">${STAR_SVG}<span>${
    toArabicDigits(l.id)
  }</span></span>
      <div class="min-w-0">
        <div class="flex items-baseline gap-2 flex-wrap">
          <span class="font-display text-lg leading-tight">${lname(l.id)}</span>
          ${arabicAside(l.arabic)}
        </div>
        <div class="text-xs text-muted-foreground">${ltitle(l.id)} · ${
    t("opponent.levelOf", { n: l.id, total: LEVELS.length })
  }</div>
        <p class="text-sm mt-1.5 text-pretty">${ldesc(l.id)}</p>
      </div>
    </section>
    <footer class="px-5">
      <button type="button" class="btn w-full" data-variant="outline" data-size="sm" id="change-opponent-btn">${
    t("btn.changeOpponent")
  }</button>
    </footer>`;
}

function showResult() {
  const res = state.result;
  if (!res.over) return;
  $("result-seal").textContent = SEALS[res.reason];
  let title: string;
  if (res.winner === 0) title = t("result.draw");
  else if (res.winner === state.player) title = t("result.win");
  else title = t("result.lose", { name: lname(state.level) });
  $("result-title").textContent = title;
  $("result-detail").textContent = t("result.detail", {
    text: reasonText(res.reason),
    n: Math.ceil(state.sans.length / 2),
  });
  openDialog($<HTMLDialogElement>("result-dialog"));
}

function renderLevels() {
  const el = $("level-list");
  el.querySelectorAll(".level-option").forEach((n) => n.remove());
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
      <span class="flex flex-col min-w-0 flex-1">
        <span class="text-sm font-medium flex items-baseline gap-2 flex-wrap">
          ${lname(l.id)}
          ${arabicAside(l.arabic, "text-sm")}
        </span>
        <span class="text-xs text-muted-foreground"><span class="text-foreground/80">${
      ltitle(l.id)
    }</span><span class="level-desc"> · ${ldesc(l.id)}</span></span>
      </span>
      <span class="ms-auto flex gap-0.5 shrink-0" aria-label="${
      t("level.strength", { n: l.id, total: LEVELS.length })
    }">${
      Array.from(
        { length: 5 },
        (_, i) =>
          `<span class="size-1.5 rounded-full ${
            i < l.id ? "bg-gold" : "bg-border"
          }"></span>`,
      ).join("")
    }</span>
    </label>`).join(""),
  );
}

function renderRules() {
  const order = [SHAH, 2, 3, 4, 5, 1];
  $("rules-pieces").innerHTML = order.map((pt) => {
    const info = PIECE_INFO[pt];
    const meaning = t(`piece.${pt}.meaning`);
    return `
      <div class="flex items-center gap-3 rounded-lg border p-2">
        <div class="flex shrink-0 size-12 items-center justify-center rounded-md bg-[var(--sq-light)]">
          ${pieceSVG(pt)}
        </div>
        <div class="min-w-0">
          <div class="font-medium flex items-baseline gap-2 flex-wrap">
            ${t(`piece.${pt}.name`)}
            ${arabicAside(info.arabic)}
            <span class="text-xs text-muted-foreground">${
      [meaning, info.letter].filter(Boolean).join(" · ")
    }</span>
          </div>
          <div class="text-muted-foreground">${t(`piece.${pt}.move`)}</div>
        </div>
      </div>`;
  }).join("");
}

// ---------------------------------------------------------------------------
// Game library: auto-save, viewer, PGN and share links
// ---------------------------------------------------------------------------

/** Escapes text from outside (PGN tags, links) for use in HTML. */
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

/** Whose game a record is: the player's own, or someone else's. */
function isMine(rec: GameRecord): boolean {
  if (rec.owner) return rec.owner === "me";
  // Records saved before `owner` existed.
  if (rec.source === "played") return true;
  return rec.source === "imported" && rec.player !== undefined;
}

/** Name for one side of a record ("You", the opponent, or a PGN name). */
function sideLabel(rec: GameRecord, color: Color): string {
  if (rec.player !== undefined) {
    if (color !== rec.player) return lname(rec.level ?? 3);
    return isMine(rec) ? t("player.you") : sideName(color);
  }
  return (color === WHITE ? rec.white : rec.black) || sideName(color);
}

/** Player-bar name from an open record, or null for the usual rendering. */
function recordName(color: Color): string | null {
  const rec = state.viewer?.record;
  if (!rec) return null;
  // Keep the usual rendering (with the level badge) for the opponent and
  // for "You" in the player's own games.
  if (rec.player !== undefined && (color !== rec.player || isMine(rec))) {
    return null;
  }
  return sideLabel(rec, color);
}

/** Review-card column heading for a side. */
function columnLabel(color: Color): string {
  const rec = state.viewer?.record;
  if (rec) return sideLabel(rec, color);
  return color === state.player ? t("player.you") : lname(state.level);
}

function liveRecord(): GameRecord {
  const res = state.result;
  const complete = Review.isComplete() && Review.hasReview();
  const snap = Review.snapshot();
  return {
    id: state.gameId,
    createdAt: state.createdAt,
    updatedAt: Date.now(),
    moves: state.moves.slice(),
    source: "played",
    owner: "me",
    player: state.player,
    level: state.level,
    winner: res.over ? res.winner : null,
    reason: res.over ? res.reason : undefined,
    review: complete ? { scores: snap.scores, best: snap.best } : undefined,
  };
}

/** Upserts the live game into the library (from the second ply on). */
function persistLive() {
  if (state.viewer) return;
  if (state.moves.length < 2) {
    Library.deleteRecord(state.gameId);
    return;
  }
  Library.putRecord(liveRecord());
}

/** Before the live game is replaced: keep it, marked unfinished if it is. */
function retireLive() {
  if (state.moves.length < 2) return;
  Library.putRecord({ ...liveRecord(), abandoned: !state.result.over });
}

const clearHash = () => {
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }
};

/** Opens a record in the viewer, stashing the live game. */
function openRecord(rec: GameRecord, saved: boolean, fromHash = false) {
  cancelThinking();
  if (!fromHash) clearHash();
  if (!state.viewer) {
    if (!fromHash) pushEntry({ viewer: true });
    state.viewer = {
      record: rec,
      saved,
      fromHash,
      live: {
        moves: state.moves.slice(),
        player: state.player,
        level: state.level,
        flipped: state.flipped,
        review: Review.stash(),
      },
    };
  } else {
    keepViewerReview();
    state.viewer.record = rec;
    state.viewer.saved = saved;
  }
  state.player = rec.player ?? WHITE;
  state.level = rec.level ?? state.viewer.live.level;
  state.flipped = state.player === BLACK;
  Review.load(rec.review, rec.moves);
  clearHint();
  state.selected = -1;
  state.targets = [];
  replay(rec.moves);
  state.viewPly = rec.moves.length;
  render();
  revealBoard();
  // Move focus to the viewer bar and say what is shown.
  const bar = $("viewer-card");
  bar.focus({ preventScroll: true });
  announce(
    `${t(saved || isMine(rec) ? "viewer.title" : "viewer.shared")}: ${
      sideLabel(rec, WHITE)
    } – ${sideLabel(rec, BLACK)}`,
  );
}

/** Stores whatever review exists (even partial) into a saved record. */
function keepViewerReview() {
  const v = state.viewer;
  if (!v || Review.analysedCount() === 0) return;
  const snap = Review.snapshot();
  v.record.review = { scores: snap.scores, best: snap.best };
  if (v.saved) Library.putRecord(v.record);
}

/**
 * Leaves the viewer. Resolves to false if the player chose to stay.
 * `fromHistory`: called because Back was pressed (the entry is gone).
 */
async function closeViewer(fromHistory = false): Promise<boolean> {
  const v = state.viewer;
  if (!v) return true;
  // An unsaved shared game with a review would be lost: ask first.
  if (!v.saved && (Review.analysedCount() > 1 || review.running)) {
    const choice = await askChoice(
      t("viewer.discardConfirm"),
      t("viewer.leave"),
      t("viewer.saveAndLeave"),
    );
    if (choice === "") return false;
    if (choice === "alt") {
      keepViewerReview();
      v.record.updatedAt = Date.now();
      await Library.putRecord(v.record);
      v.saved = true;
      toast(t("viewer.saved"));
    }
  }
  if (state.viewer !== v) return true;
  if (!fromHistory) {
    historySettled.then(() => {
      if (history.state?.viewer) backQuietly();
    });
  }
  keepViewerReview();
  state.viewer = null;
  clearHash();
  state.player = v.live.player;
  state.level = v.live.level;
  state.flipped = v.live.flipped;
  Review.unstash(v.live.review);
  state.viewPly = null;
  replay(v.live.moves);
  render();
  requestAIMove();
  return true;
}

/** Makes an unfinished game of the player's own the live game again. */
async function continueRecord(rec: GameRecord) {
  if (!(await closeViewer())) return;
  cancelThinking();
  retireLive();
  state.gameId = rec.id;
  state.createdAt = rec.createdAt;
  state.player = rec.player ?? WHITE;
  state.level = rec.level ?? 3;
  state.colorChoice = state.player === WHITE ? "white" : "black";
  state.flipped = state.player === BLACK;
  state.viewPly = null;
  clearHint();
  Review.clear();
  replay(rec.moves);
  save();
  persistLive();
  render();
  requestAIMove();
}

const canContinue = (rec: GameRecord) =>
  isMine(rec) && rec.player !== undefined && rec.id !== state.gameId &&
  !recordResult(rec).over;

const ICON_LINK =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const ICON_DOWNLOAD =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/></svg>`;
const ICON_TRASH =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_BACK =
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;

const iconBtn = (act: string, label: string, icon: string) =>
  `<button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-act="${act}" aria-label="${label}" title="${label}">${icon}</button>`;

/** On landscape phones the board column is too narrow for the viewer bar:
 * put it at the top of the side panel there, above the board elsewhere. */
const landscapePhone = matchMedia(
  "(orientation: landscape) and (max-height: 520px)",
);
function placeViewerBar() {
  const card = $("viewer-card");
  const target = landscapePhone.matches
    ? document.querySelector<HTMLElement>(".side-panel")!
    : document.querySelector<HTMLElement>(".board-col")!;
  if (card.parentElement !== target) target.prepend(card);
}

function renderViewer() {
  placeViewerBar();
  const card = $("viewer-card");
  const v = state.viewer;
  card.hidden = !v;
  if (!v) return;
  const rec = v.record;
  const mine = isMine(rec);
  const meta = [
    formatDate(rec.createdAt, !rec.timeUnknown),
    resultLabel(rec),
    t("moves.count", { n: Math.ceil(rec.moves.length / 2) }),
  ].join(" · ");
  const noLiveGame = v.live.moves.length === 0;
  const primary = (act: string, label: string) =>
    `<button type="button" class="btn" data-size="sm" data-act="${act}">${label}</button>`;
  const outline = (act: string, label: string) =>
    `<button type="button" class="btn" data-variant="outline" data-size="sm" data-act="${act}">${label}</button>`;
  const back = `${ICON_BACK}<span>${
    t(noLiveGame ? "viewer.play" : "viewer.close")
  }</span>`;
  card.innerHTML = `
    <div class="viewer-info">
      <span class="viewer-line"><span class="viewer-kind">${
    t(mine || v.saved ? "viewer.title" : "viewer.shared")
  }</span>
      <span class="viewer-names">${esc(sideLabel(rec, WHITE))} – ${
    esc(sideLabel(rec, BLACK))
  }</span></span>
      <span class="viewer-meta">${meta}</span>
    </div>
    <div class="viewer-actions">
      ${
    v.saved
      ? (canContinue(rec)
        ? primary("continue", t("viewer.continue")) + outline("close", back)
        : primary("close", back))
      : primary("save", t("viewer.save")) + outline("close", back)
  }
      ${iconBtn("share", t("library.share"), ICON_LINK)}
      ${iconBtn("pgn", t("library.download"), ICON_DOWNLOAD)}
    </div>`;
}

function formatDate(ms: number, withTime = false) {
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { dateStyle: "medium", timeStyle: "short" }
    : { dateStyle: "medium" };
  const iso = new Date(ms).toISOString().slice(0, withTime ? 16 : 10)
    .replace("T", " ");
  // Coptic has no CLDR data: an ISO date beats an English one.
  if (currentLang() === "cop") return iso;
  try {
    return new Intl.DateTimeFormat(intlLocale(), opts).format(ms);
  } catch {
    return iso;
  }
}

/** Final result of a record's moves (memoised per record). */
const resultCache = new Map<string, { key: number; res: GameResult }>();
function recordResult(rec: GameRecord): GameResult {
  const hit = resultCache.get(rec.id);
  if (hit && hit.key === rec.moves.length) return hit.res;
  const pos = Position.initial();
  for (const m of rec.moves) pos.makeMove(m);
  const res = pos.result();
  resultCache.set(rec.id, { key: rec.moves.length, res });
  return res;
}

type Outcome = "win" | "loss" | "draw" | "unfinished" | "abandoned" | "other";

/** Outcome from the player's point of view; "other" for others' games. */
function outcome(rec: GameRecord): Outcome {
  if (!isMine(rec)) return "other";
  const res = recordResult(rec);
  if (!res.over) {
    return rec.id === state.gameId && !state.viewer
      ? "unfinished"
      : "abandoned";
  }
  if (res.winner === 0) return "draw";
  return res.winner === (rec.player ?? WHITE) ? "win" : "loss";
}

function resultLabel(rec: GameRecord) {
  const o = outcome(rec);
  if (o === "other") {
    const r = pgnResult(recordResult(rec));
    return r === "*" ? t("library.result.abandoned") : r;
  }
  return t(`library.result.${o}`);
}

function englishName(rec: GameRecord, color: Color) {
  const en = dictFor("en");
  if (rec.player === undefined) {
    return (color === WHITE ? rec.white : rec.black) ||
      (color === WHITE ? "Ivory" : "Ebony");
  }
  return rec.player === color
    ? "Player"
    : `${en[`level.${rec.level ?? 3}.name`]} (level ${rec.level ?? 3})`;
}

function recordPGN(rec: GameRecord) {
  const d = new Date(rec.createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  const tags: Record<string, string> = {
    Date: `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`,
    Time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    White: englishName(rec, WHITE),
    Black: englishName(rec, BLACK),
  };
  // Only the player's own games carry the tags that restore "You" on import.
  if (rec.player !== undefined && isMine(rec)) {
    tags.ShatranjPlayer = rec.player === WHITE ? "white" : "black";
    tags.ShatranjLevel = String(rec.level ?? 3);
  }
  return toPGN(rec.moves, tags);
}

function download(name: string, text: string) {
  // Inside an app the shell saves/shares the file natively: WebViews do not
  // handle `<a download>` with blob: URLs.
  const mimeType = "application/x-chess-pgn";
  if (callHost("files.save", { name, mimeType, text })) return;
  const blob = new Blob([text], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** "20261106-1430" in local time, for file names. */
const fileStamp = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${
    p(d.getHours())
  }${p(d.getMinutes())}`;
};

function shareURL(rec: GameRecord) {
  const params = new URLSearchParams({ g: encodeShare(rec.moves) });
  if (rec.player !== undefined) {
    params.set("p", rec.player === WHITE ? "w" : "b");
    params.set("l", String(rec.level ?? 3));
  } else {
    if (rec.white) params.set("w", rec.white.slice(0, 60));
    if (rec.black) params.set("b", rec.black.slice(0, 60));
  }
  params.set("d", Math.floor(rec.createdAt / 1000).toString(36));
  return `${shareBase()}#${params}`;
}

async function copyLink(rec: GameRecord) {
  const url = shareURL(rec);
  if (callHost("share.link", { url, title: t("library.share") })) {
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(t("library.copied"));
  } catch {
    // Clipboard blocked: show the link so it can be copied by hand.
    showLink(url);
  }
}

/** Shows a link in a dialog, selected, with a copy button. */
function showLink(url: string) {
  const dialog = $<HTMLDialogElement>("link-dialog");
  const input = $<HTMLInputElement>("link-dialog-url");
  input.value = url;
  openDialog(dialog);
  input.focus();
  input.select();
}

/**
 * In-page replacement for `confirm()` (embedded WebViews do not show it),
 * with an optional second action. Resolves to "ok", "alt" or "" (cancelled).
 */
function askChoice(
  message: string,
  okLabel: string,
  altLabel?: string,
): Promise<string> {
  const dialog = $<HTMLDialogElement>("confirm-dialog");
  $("confirm-dialog-text").textContent = message;
  $("confirm-dialog-ok").textContent = okLabel;
  const alt = $<HTMLButtonElement>("confirm-dialog-alt");
  alt.hidden = !altLabel;
  alt.textContent = altLabel ?? "";
  dialog.returnValue = "";
  // Not a history entry: closing it must not also pop the viewer's.
  openDialog(dialog, false);
  (altLabel ? alt : dialog.querySelector<HTMLElement>("[autofocus]"))?.focus();
  return new Promise((resolve) => {
    dialog.addEventListener("close", () => resolve(dialog.returnValue), {
      once: true,
    });
  });
}

function ask(message: string, okLabel: string): Promise<boolean> {
  return askChoice(message, okLabel).then((v) => v === "ok");
}

/**
 * Opens a modal dialog and, by default, adds a history entry for it, so the
 * browser's (or Android's) Back button closes the dialog instead of leaving
 * the page.
 */
function openDialog(d: HTMLDialogElement, withHistory = true) {
  if (d.open) return;
  d.showModal();
  if (!withHistory) return;
  pushEntry({ dialog: d.id });
  d.addEventListener("close", () => {
    historySettled.then(() => {
      if (history.state?.dialog === d.id) backQuietly();
    });
  }, { once: true });
}

// History entries the page adds itself (dialogs, the viewer) are popped by
// the page when they close. Those "quiet" backs must not be mistaken for the
// user pressing Back, and new entries must wait until they have happened.
let quietBacks = 0;
const settleQueue: (() => void)[] = [];
let historySettled: Promise<void> = Promise.resolve();

function backQuietly() {
  quietBacks++;
  historySettled = new Promise((resolve) => settleQueue.push(resolve));
  history.back();
}

function pushEntry(extra: Record<string, unknown>) {
  historySettled.then(() =>
    history.pushState(
      // A dialog's entry is never inherited by what is opened after it.
      { ...(history.state ?? {}), dialog: undefined, ...extra },
      "",
    )
  );
}

/** Closes a dialog and waits until its history entry has been removed. */
async function closeDialog(d: HTMLDialogElement) {
  d.close();
  // The close event (which schedules the quiet Back) fires asynchronously.
  await new Promise((r) => setTimeout(r, 0));
  await historySettled;
}

/** Back button: close the top dialog, or leave the viewer. */
async function onPopState() {
  if (quietBacks > 0) {
    quietBacks--;
    settleQueue.shift()?.();
    return;
  }
  const open = [...document.querySelectorAll<HTMLDialogElement>(
    "dialog[open]",
  )].pop();
  if (open && history.state?.dialog !== open.id) {
    open.close();
    return;
  }
  if (state.viewer && !history.state?.viewer && !state.viewer.fromHash) {
    if (!(await closeViewer(true))) pushEntry({ viewer: true });
  }
}

/** Delegated handlers that replace inline on* attributes (strict CSP). */
function wireDialogs() {
  document.addEventListener("click", (e) => {
    const el = e.target as HTMLElement;
    const closer = el.closest("[data-close]");
    if (closer) {
      closer.closest("dialog")?.close();
      return;
    }
    // A click on the backdrop (the dialog element itself) closes it, but
    // only if the press also started there (not a text-selection drag).
    if (
      el instanceof HTMLDialogElement &&
      el.hasAttribute("data-backdrop-close") &&
      el.dataset.backdropPress === "true"
    ) el.close();
  });
  document.addEventListener("pointerdown", (e) => {
    const el = e.target as HTMLElement;
    const d = el.closest("dialog");
    if (d) d.dataset.backdropPress = String(el === d);
  });
  document.addEventListener("focusin", (e) => {
    const el = e.target as HTMLInputElement;
    if (el.matches?.("[data-select-on-focus]")) el.select();
  });
  globalThis.addEventListener("popstate", onPopState);
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
/** A short notice. Uses the top layer so it shows above open dialogs. */
function toast(text: string) {
  if (!text) return;
  const el = $("toast");
  el.textContent = text;
  const pop = el as HTMLElement & {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  if (pop.showPopover) {
    // `hidden` would win over the popover (Tailwind's reset is !important).
    el.hidden = false;
    // Re-show so it is the topmost layer even above a dialog opened later.
    if (el.matches(":popover-open")) pop.hidePopover!();
    pop.showPopover();
  } else {
    el.hidden = false;
    document.querySelector("dialog[open]")?.appendChild(el);
  }
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (pop.hidePopover) {
      if (el.matches(":popover-open")) pop.hidePopover();
    } else el.hidden = true;
  }, 3200);
}

/** Opens a game from a share link in the URL hash, if any. */
async function openFromHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const code = h.get("g");
  if (!code) {
    // Back from a share link (or the hash was edited away): leave it.
    if (state.viewer?.fromHash) await closeViewer(true);
    return;
  }
  let moves: Move[];
  try {
    moves = decodeShare(code);
  } catch {
    clearHash();
    toast(t("share.invalid"));
    return;
  }
  // The same game already saved (e.g. saved, then the page reloaded): open
  // that record instead of offering to save a second copy.
  const dSec = parseInt(h.get("d") ?? "", 36);
  const existing = (await Library.listRecords()).find((r) =>
    r.moves.length === moves.length && r.moves.every((m, i) =>
      m === moves[i]
    ) &&
    (!Number.isFinite(dSec) || Math.floor(r.createdAt / 1000) === dSec)
  );
  if (existing) {
    openRecord(existing, true, true);
    return;
  }
  {
    const p = h.get("p");
    const lv = Number(h.get("l"));
    const d = parseInt(h.get("d") ?? "", 36);
    const when = Number.isFinite(d) && d > 0 ? d * 1000 : Date.now();
    const rec: GameRecord = {
      id: Library.newId(),
      createdAt: when,
      updatedAt: Date.now(),
      moves,
      source: "shared",
      owner: "other",
      ...(p === "w" || p === "b"
        ? {
          player: p === "w" ? WHITE : BLACK,
          level: LEVELS.some((l) => l.id === lv) ? lv : 3,
        }
        : { white: h.get("w") ?? undefined, black: h.get("b") ?? undefined }),
    };
    // The link stays in the address bar while the game is shown, so a
    // reload or a bookmark keeps it.
    openRecord(rec, false, true);
  }
}

// --- Library dialog -------------------------------------------------------

async function openLibrary() {
  openDialog($<HTMLDialogElement>("library-dialog"));
  $("library-warning").hidden = await Library.isPersistent();
  await renderLibrary();
}

let libraryCache: GameRecord[] = [];

async function renderLibrary() {
  libraryCache = (await Library.listRecords()).sort((a, b) =>
    b.createdAt - a.createdAt
  );
  const filter = document.querySelector<HTMLInputElement>(
    'input[name="lib-filter"]:checked',
  )?.value ?? "all";
  const items = libraryCache.filter((r) =>
    filter === "all" || outcome(r) === filter
  );
  $<HTMLButtonElement>("library-export-btn").disabled =
    libraryCache.length === 0;
  const list = $("library-list");
  if (items.length === 0) {
    list.innerHTML = `<li class="library-empty">${
      t(libraryCache.length ? "library.emptyFilter" : "library.empty")
    }</li>`;
    return;
  }
  list.innerHTML = items.map((rec) => {
    const o = outcome(rec);
    const mine = isMine(rec);
    const current = rec.id === state.gameId;
    let title: string;
    let accuracy = "";
    if (mine && rec.player !== undefined) {
      title = esc(t("library.vs", { name: lname(rec.level ?? 3) }));
      if (rec.review) {
        const rs = reviewMoves(rec.moves, rec.review.scores, rec.review.best);
        if (rs.length === rec.moves.length && rs.length > 0) {
          accuracy = `${t("review.accuracy")} ${
            percent(summarize(rs, rec.player).accuracy)
          }`;
        }
      }
    } else {
      title = `${esc(sideLabel(rec, WHITE))} – ${esc(sideLabel(rec, BLACK))}`;
    }
    const tag = current
      ? `<span class="lib-tag lib-tag-current">${
        t("library.tag.current")
      }</span>`
      : mine
      ? ""
      : `<span class="lib-tag">${
        t(
          rec.source === "shared"
            ? "library.tag.shared"
            : "library.tag.imported",
        )
      }</span>`;
    const side = rec.player ?? WHITE;
    return `
      <li class="library-item" data-id="${esc(rec.id)}">
        <span class="lib-result lib-${o}">${resultLabel(rec)}</span>
        <span class="lib-main">
          <span class="lib-title"><span class="turn-icon">${
      pieceSVG(side * SHAH)
    }</span><span class="truncate">${title}</span>${tag}</span>
          <span class="lib-meta">${
      [
        formatDate(rec.createdAt),
        t("moves.count", { n: Math.ceil(rec.moves.length / 2) }),
        accuracy,
      ].filter(Boolean).join(" · ")
    }</span>
        </span>
        <span class="lib-actions">
          <button type="button" class="btn" data-size="sm" data-act="open">${
      t("library.open")
    }</button>
          ${iconBtn("share", t("library.share"), ICON_LINK)}
          ${iconBtn("pgn", t("library.download"), ICON_DOWNLOAD)}
          ${
      // The live game keeps saving itself, so it cannot be deleted here.
      current ? "" : iconBtn("delete", t("library.delete"), ICON_TRASH)}
        </span>
      </li>`;
  }).join("");
}

async function onLibraryClick(e: Event) {
  const btn = (e.target as Element).closest<HTMLElement>("[data-act]");
  const item = btn?.closest<HTMLElement>(".library-item");
  if (!btn || !item) return;
  const rec = libraryCache.find((r) => r.id === item.dataset.id);
  if (!rec) return;
  switch (btn.dataset.act) {
    case "open":
      await closeDialog($<HTMLDialogElement>("library-dialog"));
      if (rec.id === state.gameId && !state.viewer) {
        // The live game itself: just review it in place.
        viewAt(state.moves.length);
      } else openRecord(rec, true);
      break;
    case "share":
      await copyLink(rec);
      break;
    case "pgn":
      download(`shatranj-${fileStamp(rec.createdAt)}.pgn`, recordPGN(rec));
      break;
    case "delete": {
      if (!(await ask(t("library.deleteConfirm"), t("library.delete")))) {
        return;
      }
      // Remember where focus should go once the row is gone.
      const next = (item.nextElementSibling ?? item.previousElementSibling) as
        | HTMLElement
        | null;
      const nextId = next?.dataset.id;
      await Library.deleteRecord(rec.id);
      if (state.viewer?.record.id === rec.id) state.viewer.saved = false;
      await renderLibrary();
      render();
      const target = nextId
        ? $("library-list").querySelector<HTMLElement>(
          `[data-id="${CSS.escape(nextId)}"] [data-act=open]`,
        )
        : null;
      (target ?? $("library-list")).focus();
      break;
    }
  }
}

/** Imports PGN text. Returns the failures (for an inline report). */
async function importPGN(
  text: string,
): Promise<{ imported: number; failures: PgnFailure[] }> {
  const { games, errors } = parsePGN(text);
  // Games exported from this site carry the player's side and level. They
  // may be a friend's export, so only treat them as "mine" when confirmed.
  const tagged = games.some((g) => g.tags.ShatranjPlayer);
  const mine = tagged &&
    (await askChoice(t("library.askMine"), t("library.askMineYes"))) === "ok";
  const { added, skipped } = await saveImported(games, mine);
  toast(
    [
      added ? t("library.imported", { n: added }) : "",
      skipped ? t("library.duplicates", { n: skipped }) : "",
      errors.length ? t("library.importFailed", { n: errors.length }) : "",
    ].filter(Boolean).join(" "),
  );
  await renderLibrary();
  return { imported: games.length, failures: errors };
}

/** Saves imported games, skipping ones already in the library. */
async function saveImported(games: PgnGame[], mine = false) {
  const now = Date.now();
  const dayOf = (ms: number) => new Date(ms).toDateString();
  const known = new Set(
    (await Library.listRecords()).map((r) =>
      `${r.moves.join(",")}|${dayOf(r.createdAt)}`
    ),
  );
  let i = 0, added = 0, skipped = 0;
  for (const g of games) {
    const tags = g.tags;
    const side = tags.ShatranjPlayer;
    const lv = Number(tags.ShatranjLevel);
    const date = (tags.Date ?? "").match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    const time = (tags.Time ?? "").match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    const when = date
      ? new Date(
        +date[1],
        +date[2] - 1,
        +date[3],
        time ? +time[1] : 12,
        time ? +time[2] : 0,
        time ? +(time[3] ?? 0) : 0,
      ).getTime()
      : now;
    const key = `${g.moves.join(",")}|${dayOf(when)}`;
    if (known.has(key)) {
      skipped++;
      continue;
    }
    known.add(key);
    added++;
    const sided = side === "white" || side === "black";
    const own = sided && mine;
    await Library.putRecord({
      timeUnknown: !(date && time),
      id: Library.newId(),
      // Newest first in the list; games with the same date keep file order.
      createdAt: when - i,
      updatedAt: now - i,
      moves: g.moves,
      source: "imported",
      owner: own ? "me" : "other",
      ...(sided
        ? {
          player: side === "white" ? WHITE : BLACK,
          level: LEVELS.some((l) => l.id === lv) ? lv : 3,
        }
        : { white: tags.White, black: tags.Black }),
    });
    i++;
  }
  return { added, skipped };
}

/** Inline report for a paste import that did not fully succeed. */
type FileFailure = PgnFailure & { file?: string };
let pendingPartials: FileFailure[] = [];
function showPasteReport(failures: FileFailure[], noGames: boolean) {
  const el = $("library-paste-report");
  pendingPartials = failures.filter((f) => f.moves.length > 0);
  if (!noGames && failures.length === 0) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  el.hidden = false;
  const lines = noGames && failures.length === 0
    ? [`<li>${t("library.noGames")}</li>`]
    : failures.slice(0, 8).map((f) =>
      `<li>${f.file ? `<strong>${esc(f.file)}</strong> — ` : ""}${
        esc(
          f.san
            ? t("library.badMove", {
              index: f.index,
              move: f.san,
              number: Math.ceil((f.ply ?? 1) / 2),
            })
            : f.index === 0
            ? t("library.noGames")
            : `${t("library.importFailed", { n: 1 })} (${f.index})`,
        )
      }</li>`
    );
  el.innerHTML = `<ul>${lines.join("")}</ul>${
    pendingPartials.length
      ? `<button type="button" class="btn" data-variant="outline" data-size="sm" id="library-partial-btn">${
        t("library.importPartial", { n: pendingPartials.length })
      }</button>`
      : ""
  }`;
  // On small screens the report can be below the fold: bring it into view.
  el.scrollIntoView({ block: "nearest" });
  el.focus({ preventScroll: true });
}

async function exportAll() {
  const all = await Library.listRecords();
  if (all.length === 0) return;
  download(
    `shatranj-records-${fileStamp(Date.now())}.pgn`,
    all.sort((a, b) => a.createdAt - b.createdAt).map(recordPGN).join("\n"),
  );
}

function wireLibrary() {
  $("library-btn").addEventListener("click", openLibrary);
  $("library-list").addEventListener("click", onLibraryClick);
  document.querySelector(".library-filter")!.addEventListener(
    "change",
    () => renderLibrary(),
  );
  const file = $<HTMLInputElement>("library-file");
  $("library-import-btn").addEventListener("click", () => file.click());
  file.addEventListener("change", async () => {
    // One report for all chosen files, naming the file of each problem.
    const failures: FileFailure[] = [];
    let any = false;
    for (const f of file.files ?? []) {
      const r = await importPGN(await f.text());
      if (r.imported > 0) any = true;
      if (r.imported === 0 && r.failures.length === 0) {
        failures.push({
          index: 0,
          tags: {},
          message: "",
          moves: [],
          file: f.name,
        });
      }
      for (const x of r.failures) failures.push({ ...x, file: f.name });
    }
    file.value = "";
    showPasteReport(failures, !any && failures.length === 0);
  });
  const paste = $("library-paste");
  const ta = $<HTMLTextAreaElement>("library-paste-text");
  $("library-paste-btn").addEventListener("click", () => {
    paste.hidden = false;
    ta.focus();
  });
  $("library-paste-cancel").addEventListener("click", () => {
    paste.hidden = true;
    showPasteReport([], false);
  });
  $("library-paste-submit").addEventListener("click", async () => {
    if (!ta.value.trim()) {
      showPasteReport([], true);
      return;
    }
    const { imported, failures } = await importPGN(ta.value);
    showPasteReport(failures, imported === 0);
    // Keep the text (and the panel) whenever something could not be read.
    if (imported > 0 && failures.length === 0) {
      ta.value = "";
      paste.hidden = true;
    }
  });
  $("library-paste-report").addEventListener("click", async (e) => {
    if (!(e.target as Element).closest("#library-partial-btn")) return;
    await saveImported(
      pendingPartials.map((f) => ({ tags: f.tags, moves: f.moves })),
    );
    toast(t("library.imported", { n: pendingPartials.length }));
    showPasteReport([], false);
    ta.value = "";
    paste.hidden = true;
    await renderLibrary();
  });
  $("library-export-btn").addEventListener("click", exportAll);
  $("viewer-card").addEventListener("click", async (e) => {
    const act = (e.target as Element).closest<HTMLElement>("[data-act]")
      ?.dataset.act;
    const v = state.viewer;
    if (!act || !v) return;
    if (act === "close") await closeViewer();
    else if (act === "continue") await continueRecord(v.record);
    else if (act === "save") {
      v.record.updatedAt = Date.now();
      keepViewerReview();
      await Library.putRecord(v.record);
      v.saved = true;
      toast(t("viewer.saved"));
      render();
    } else if (act === "share") await copyLink(v.record);
    else if (act === "pgn") {
      download(
        `shatranj-${fileStamp(v.record.createdAt)}.pgn`,
        recordPGN(v.record),
      );
    }
  });
  $("link-dialog-copy").addEventListener("click", async () => {
    const input = $<HTMLInputElement>("link-dialog-url");
    input.select();
    try {
      await navigator.clipboard.writeText(input.value);
    } catch {
      // Older WebViews: copying the selection still works.
      if (!document.execCommand("copy")) return;
    }
    $<HTMLDialogElement>("link-dialog").close();
    toast(t("library.copied"));
  });
  globalThis.addEventListener("hashchange", openFromHash);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/** Applies the UI language: direction, static text and dynamic parts. */
function applyLanguage(l: Lang) {
  setLang(l);
  const root = document.documentElement;
  root.lang = l;
  root.dir = isRTL() ? "rtl" : "ltr";
  document.title = t("meta.title");
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", t("meta.description"));
  applyStatic();
  // The secondary brand line is Arabic script unless the UI already is.
  const sec = $("brand-secondary");
  sec.lang = isArabicScript() ? "en" : "ar";
  sec.className = isArabicScript()
    ? "font-display text-base text-gold max-sm:hidden"
    : "font-arabic text-xl text-gold max-sm:hidden";
  $("brand-primary").classList.toggle("font-arabic", isArabicScript());
  $("brand-primary").classList.toggle("font-display", !isArabicScript());
  const sub = document.querySelector<HTMLElement>(
    '[data-i18n="rules.subtitle"]',
  );
  if (sub) sub.hidden = t("rules.subtitle") === "";
  $<HTMLSelectElement>("lang-select").value = l;
  const info = LANGS.find((x) => x.code === l)!;
  $("lang-current").innerHTML =
    `<span class="max-sm:hidden">${info.name}</span><span class="sm:hidden">${l.toUpperCase()}</span>`;
  renderLevels();
  syncSetupInputs();
  renderRules();
}

function init() {
  boardEl = $("board");
  createWorker();

  const select = $<HTMLSelectElement>("lang-select");
  select.innerHTML = LANGS.map((l) =>
    `<option value="${l.code}" lang="${l.code}">${l.name}</option>`
  ).join("");
  select.addEventListener("change", () => {
    const l = select.value as Lang;
    saveLang(l);
    applyLanguage(l);
    render();
    if ($<HTMLDialogElement>("library-dialog").open) renderLibrary();
  });
  applyLanguage(detectLang());

  const saved = load();
  if (saved) {
    state.player = saved.player === BLACK ? BLACK : WHITE;
    state.level = LEVELS.some((l) => l.id === saved.level) ? saved.level : 3;
    state.flipped = !!saved.flipped;
    state.colorChoice = saved.colorChoice ??
      (state.player === WHITE ? "white" : "black");
    if (saved.gameId) state.gameId = saved.gameId;
    if (saved.createdAt) state.createdAt = saved.createdAt;
    if (!replay(saved.moves)) replay([]);
  }
  Review.restore(state.moves);
  syncSetupInputs();

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

  $("new-game-btn").addEventListener("click", async () => {
    if (state.viewer) {
      if (await closeViewer()) openNewGameDialog();
    } else if (state.result.over) newGame();
    else openNewGameDialog();
  });
  wireLibrary();
  wireDialogs();
  landscapePhone.addEventListener("change", placeViewerBar);
  $("start-game-btn").addEventListener("click", startFromDialog);
  $("result-new-btn").addEventListener("click", async () => {
    await closeDialog($<HTMLDialogElement>("result-dialog"));
    newGame();
  });
  $("result-change-btn").addEventListener("click", async () => {
    await closeDialog($<HTMLDialogElement>("result-dialog"));
    openNewGameDialog();
  });
  $("moves").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-ply]");
    if (b) {
      viewAt(Number(b.dataset.ply));
      revealBoard();
    }
  });
  $("review-strip").addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("button");
    if (!b) return;
    if (b.dataset.live !== undefined) goLive();
    else viewAt(currentPly() + Number(b.dataset.step));
  });
  $("opponent-card").addEventListener("click", (e) => {
    if ((e.target as Element).closest("#change-opponent-btn")) {
      openNewGameDialog();
    }
  });
  $("nav-first").addEventListener("click", () => viewAt(0));
  $("nav-prev").addEventListener("click", () => viewAt(currentPly() - 1));
  $("nav-next").addEventListener("click", () => viewAt(currentPly() + 1));
  $("nav-last").addEventListener("click", () => viewAt(state.moves.length));
  $("nav-live").addEventListener("click", goLive);
  $("analyse-btn").addEventListener("click", startReview);
  $("result-review-btn").addEventListener("click", async () => {
    await closeDialog($<HTMLDialogElement>("result-dialog"));
    startReview();
  });
  $("review-card").addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t.closest("#review-start-btn")) startReview();
    else if (t.closest("#review-cancel-btn")) {
      Review.cancel();
      render();
    } else if (t.closest("#eval-graph")) {
      const svg = t.closest("#eval-graph")!.getBoundingClientRect();
      const x = ((e as MouseEvent).clientX - svg.left) / svg.width;
      viewAt(Math.round(x * state.moves.length));
      revealBoard();
    }
  });
  $("status-extra").addEventListener("click", (e) => {
    if ((e.target as Element).closest("#newcomer-btn")) {
      openDialog($<HTMLDialogElement>("rules-dialog"));
      return;
    }
    if ((e.target as Element).closest("#show-best-btn")) {
      review.showBest = !review.showBest;
      render();
    }
  });
  boardEl.addEventListener("keydown", onBoardKey);
  boardEl.addEventListener("blur", () => boardEl.classList.remove("kbd-nav"));
  // Show the cursor as soon as the board is reached with Tab.
  boardEl.addEventListener("focus", () => {
    if (boardEl.matches(":focus-visible")) {
      boardEl.classList.add("kbd-nav");
      renderBoard();
    }
  });
  boardEl.addEventListener(
    "pointerdown",
    () => boardEl.classList.remove("kbd-nav"),
  );
  $("undo-btn").addEventListener("click", undo);
  $("hint-btn").addEventListener("click", requestHint);
  $("flip-btn").addEventListener("click", () => {
    state.flipped = !state.flipped;
    save();
    render();
  });
  $("rules-btn").addEventListener(
    "click",
    () => openDialog($<HTMLDialogElement>("rules-dialog")),
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
      return;
    }
    if (
      e.key === "Escape" && state.viewer &&
      !document.querySelector("dialog[open]")
    ) {
      // Act on the next frame, or this same Esc would cancel the confirm.
      e.preventDefault();
      requestAnimationFrame(() => void closeViewer());
      return;
    }
    // Single-key shortcuts, unless typing or a dialog is open.
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector("dialog[open]")) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select")) return;
    // Step through the game (the board itself uses arrows for its cursor).
    if (t !== boardEl) {
      if (e.key === "ArrowLeft") return viewAt(currentPly() - 1);
      if (e.key === "ArrowRight") return viewAt(currentPly() + 1);
    }
    if (e.key === "Home") return viewAt(0);
    if (e.key === "End") return viewAt(state.moves.length);
    const key = e.key.toLowerCase();
    if (key === "u") undo();
    else if (key === "h") requestHint();
    else if (key === "f") $("flip-btn").click();
    else if (key === "n") $("new-game-btn").click();
  });

  render();
  requestAIMove();
  openFromHash();
}

init();
