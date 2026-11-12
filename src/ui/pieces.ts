import { ALFIL, BAIDAQ, FARAS, FERZ, RUKH, SHAH } from "../engine/position.ts";

/**
 * Abstract, aniconic piece shapes in the manner of early Islamic shatranj sets
 * (e.g. the carved pieces of 8th–10th century Mesopotamia), drawn as SVG.
 */
/*
 * Design rules (piece review):
 * - One height per rank of importance, so pieces read by silhouette alone:
 *   shāh 2 > faras 12 > firzān 14 > fīl 28 > rukh 32 > baidaq 35 (top y).
 * - Distinct outlines where shapes are related: the rukh is a straight,
 *   wide block with a deep V cleft; the fīl is a dome with two tusks
 *   sweeping up from its shoulders (ears on top read as a hare); the faras has an ear and a muzzle.
 * - The shāh carries a royal parasol (a wide canopy, an emblem of
 *   kingship at the Abbasid court; a ball coronet would read as a Western
 *   queen) and the firzān a faceted jewel, so they differ even at 20px.
 * - The two royal pieces (shāh, firzān) wear a coloured band; the others
 *   carry no ornament, which only added noise at small sizes.
 * - Pedestals scale with the piece instead of one plate for all.
 */
const BODY: Record<number, string> = {
  [SHAH]:
    `<path class="pc-body" d="M32 80 L33.5 47 Q33.5 31 50 27 Q66.5 31 66.5 47 L68 80 Z"/>
     <rect class="pc-band" x="28" y="45" width="44" height="8" rx="3.5"/>
     <rect class="pc-body" x="46" y="19" width="8" height="9" rx="1"/>
     <path class="pc-body" d="M31 21 Q33 9 50 7 Q67 9 69 21 Z"/>
     <circle class="pc-body" cx="50" cy="5" r="3"/>`,
  [FERZ]:
    `<path class="pc-body" d="M37 80 L38.5 55 Q39 42 50 38 Q61 42 61.5 55 L63 80 Z"/>
     <rect class="pc-band" x="34" y="53" width="32" height="6" rx="3"/>
     <path class="pc-body" d="M50 14 L58.5 26 L50 38 L41.5 26 Z"/>`,
  [ALFIL]:
    `<path class="pc-body" d="M34 80 L35 52 Q35 31 50 28 Q65 31 65 52 L66 80 Z"/>
     <path class="pc-body" d="M38.5 53 Q25 48 23.5 34 Q23.5 29.5 27.5 31.5 Q32 35 39.5 41 Z"/>
     <path class="pc-body" d="M61.5 53 Q75 48 76.5 34 Q76.5 29.5 72.5 31.5 Q68 35 60.5 41 Z"/>`,
  [FARAS]:
    `<path class="pc-body" d="M33 80 L35 57 Q35 46 41 41 L29 36 Q28 29 34 26 L46 20 L50 12 L55 20.5 Q66 27 66.5 42 Q67 50 65 57 L67 80 Z"/>
     <circle class="pc-eye" cx="45" cy="28" r="2.6"/>`,
  [RUKH]:
    `<path class="pc-body" d="M27 80 L28 32 L41 32 L50 47 L59 32 L72 32 L73 80 Z"/>`,
  [BAIDAQ]:
    `<path class="pc-body" d="M36.5 80 L38 63 Q38 51 50 48 Q62 51 62 63 L63.5 80 Z"/>
     <circle class="pc-body" cx="50" cy="41" r="6"/>`,
};

/** Pedestal width per piece (wider pieces stand on wider bases). */
const BASE: Record<number, number> = {
  [SHAH]: 54,
  [FERZ]: 50,
  [ALFIL]: 54,
  [FARAS]: 52,
  [RUKH]: 58,
  [BAIDAQ]: 46,
};

export function pieceSVG(piece: number): string {
  const type = Math.abs(piece);
  const color = piece > 0 ? "ivory" : "ebony";
  const w = BASE[type];
  return `<svg viewBox="0 0 100 100" class="piece piece-${color}" aria-hidden="true">${
    BODY[type]
  }<rect class="pc-body" x="${
    50 - w / 2
  }" y="79" width="${w}" height="10" rx="4"/></svg>`;
}

export const PIECE_INFO: Record<
  number,
  {
    name: string;
    arabic: string;
    english: string;
    letter: string;
    move: string;
  }
> = {
  [SHAH]: {
    name: "Shāh",
    arabic: "شاه",
    english: "King",
    letter: "K",
    move: "One square in any direction.",
  },
  [FERZ]: {
    name: "Firzān",
    arabic: "فرزان",
    english: "Counsellor",
    letter: "F",
    move: "One square diagonally. The ancestor of the queen.",
  },
  [ALFIL]: {
    name: "Fīl",
    arabic: "فيل",
    english: "Elephant",
    letter: "E",
    move:
      "Leaps exactly two squares diagonally, jumping over anything between.",
  },
  [FARAS]: {
    name: "Faras",
    arabic: "فرس",
    english: "Horse",
    letter: "N",
    move: "Moves like a modern knight.",
  },
  [RUKH]: {
    name: "Rukh",
    arabic: "رخ",
    english: "Chariot",
    letter: "R",
    move: "Any distance along a rank or file, like a rook.",
  },
  [BAIDAQ]: {
    name: "Baidaq",
    arabic: "بيدق",
    english: "Foot soldier",
    letter: "",
    move:
      "One square forward (never two), captures one square diagonally forward. Promotes to a firzān.",
  },
};
