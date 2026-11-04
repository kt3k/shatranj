import { ALFIL, BAIDAQ, FARAS, FERZ, RUKH, SHAH } from "../engine/position.ts";

/**
 * Abstract, aniconic piece shapes in the manner of early Islamic shatranj sets
 * (e.g. the carved pieces of 8th–10th century Mesopotamia), drawn as SVG.
 */
const BODY: Record<number, string> = {
  [SHAH]:
    `<path class="pc-body" d="M29 81 L32 46 Q32 24 50 20 Q68 24 68 46 L71 81 Z"/>
     <circle class="pc-body" cx="50" cy="14" r="6"/>
     <path class="pc-line" d="M33 52 H67 M34 60 H66"/>`,
  [FERZ]:
    `<path class="pc-body" d="M33 81 L36 54 Q36 36 50 32 Q64 36 64 54 L67 81 Z"/>
     <path class="pc-body" d="M50 17 L56 25 L50 32 L44 25 Z"/>
     <path class="pc-line" d="M37 60 H63"/>`,
  [ALFIL]:
    `<path class="pc-body" d="M31 81 L33 52 Q33 42 38 38 Q35 28 41 22 Q47 29 46 38 L54 38 Q53 29 59 22 Q65 28 62 38 Q67 42 67 52 L69 81 Z"/>
     <path class="pc-line" d="M36 58 H64"/>`,
  [FARAS]:
    `<path class="pc-body" d="M32 81 L34 54 Q34 40 42 34 L36 20 Q52 18 61 29 Q69 39 66 54 L68 81 Z"/>
     <circle class="pc-eye" cx="51" cy="33" r="3"/>
     <path class="pc-line" d="M36 60 H64"/>`,
  [RUKH]:
    `<path class="pc-body" d="M29 81 L32 46 Q31 32 34 24 L46 24 Q47 33 50 38 Q53 33 54 24 L66 24 Q69 32 68 46 L71 81 Z"/>
     <path class="pc-line" d="M33 52 H67"/>`,
  [BAIDAQ]:
    `<path class="pc-body" d="M36 81 L38 64 Q38 50 50 47 Q62 50 62 64 L64 81 Z"/>
     <circle class="pc-body" cx="50" cy="41" r="5"/>`,
};

const PEDESTAL =
  `<rect class="pc-body" x="22" y="79" width="56" height="10" rx="4"/>`;

export function pieceSVG(piece: number): string {
  const type = Math.abs(piece);
  const color = piece > 0 ? "ivory" : "ebony";
  return `<svg viewBox="0 0 100 100" class="piece piece-${color}" aria-hidden="true">${
    BODY[type]
  }${PEDESTAL}</svg>`;
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
