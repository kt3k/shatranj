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
const pedestal = (type: number, y = 79, h = 10) =>
  `<rect class="pc-body" x="${50 - BASE[type] / 2}" y="${y}" width="${
    BASE[type]
  }" height="${h}" rx="4"/>`;

/*
 * Western chess silhouettes (drawn for this site): for players who know
 * chess. The firzān gets a small coronet, the fīl a mitre (the bishop
 * descends from it), the shāh a domed crown with an orb.
 */
const WESTERN: Record<number, string> = {
  [SHAH]: `<path class="pc-body" d="M33 80 Q36 60 41 49 L59 49 Q64 60 67 80 Z"/>
     <rect class="pc-body" x="36" y="44" width="28" height="6" rx="2.5"/>
     <path class="pc-body" d="M37 45 Q33 31 40 26 Q50 21 60 26 Q67 31 63 45 Z"/>
     <rect class="pc-body" x="47" y="11" width="6" height="12" rx="1"/>
     <circle class="pc-body" cx="50" cy="10" r="5.5"/>`,
  [FERZ]: `<path class="pc-body" d="M35 80 Q38 63 43 52 L57 52 Q62 63 65 80 Z"/>
     <rect class="pc-body" x="38" y="47" width="24" height="6" rx="2.5"/>
     <path class="pc-body" d="M38 48 L34 28 L43 38 L50 24 L57 38 L66 28 L62 48 Z"/>
     <circle class="pc-body" cx="34" cy="26" r="3.5"/>
     <circle class="pc-body" cx="50" cy="21" r="3.5"/>
     <circle class="pc-body" cx="66" cy="26" r="3.5"/>`,
  [ALFIL]:
    `<path class="pc-body" d="M37 80 Q39 67 44 59 L56 59 Q61 67 63 80 Z"/>
     <rect class="pc-body" x="39" y="54" width="22" height="6" rx="2.5"/>
     <path class="pc-body" d="M50 20 Q64 31 61 44 Q58 53 50 55 Q42 53 39 44 Q36 31 50 20 Z"/>
     <path class="pc-cut" d="M54.5 30 L45.5 41"/>
     <circle class="pc-body" cx="50" cy="16" r="4"/>`,
  [FARAS]:
    `<path class="pc-body" d="M33 80 Q32 64 42 54 Q35 54 30 52 Q26 46 31 40 Q38 31 45 22 L47 13 L53 20 Q69 25 68 47 Q67 64 66 80 Z"/>
     <circle class="pc-eye" cx="47" cy="30" r="2.6"/>`,
  [RUKH]: `<path class="pc-body" d="M34 80 L36 46 L64 46 L66 80 Z"/>
     <path class="pc-body" d="M31 47 V28 H39 V34 H46 V28 H54 V34 H61 V28 H69 V47 Z"/>`,
  [BAIDAQ]:
    `<path class="pc-body" d="M37 80 Q39 65 45 57 L55 57 Q61 65 63 80 Z"/>
     <rect class="pc-body" x="40" y="52" width="20" height="6" rx="2.5"/>
     <circle class="pc-body" cx="50" cy="43" r="9"/>`,
};

/*
 * Arabian Nights shadow puppets: figures cut from card, with punched
 * holes (even-odd), on a ground strip. Figurative, unlike the default.
 */
const ring = (cx: number, cy: number, r: number, h: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z` +
  `M${cx - h} ${cy}a${h} ${h} 0 1 1 ${2 * h} 0a${h} ${h} 0 1 1 ${-2 * h} 0Z`;
const NIGHTS: Record<number, string> = {
  [SHAH]:
    `<path class="pc-body" fill-rule="evenodd" d="M29 83 L37 50 Q41 44 50 44 Q59 44 63 50 L71 83 Z M44 62 h12 v5 h-12 Z"/>
     <circle class="pc-body" cx="50" cy="35" r="8"/>
     <path class="pc-body" d="M40 30 L40 16 L45 23 L50 12 L55 23 L60 16 L60 30 Z"/>
     <path class="pc-body" d="M31 12 Q33 3 50 1.5 Q67 3 69 12 Z"/>`,
  [FERZ]:
    `<path class="pc-body" d="M32 83 L38 51 Q41 45 48 45 Q55 45 58 51 L63 83 Z"/>
     <circle class="pc-body" cx="48" cy="37" r="7.5"/>
     <path class="pc-body" fill-rule="evenodd" d="M37 34 Q37 21 48 20 Q59 21 59 33 Q54 29 48 29 Q42 29 37 34 Z M46 24 h4 v3 h-4 Z"/>
     <path class="pc-body" d="M50 21 Q53 11 60 9 Q56 15 54 22 Z"/>
     <rect class="pc-body" x="66" y="26" width="4" height="57" rx="1.5"/>
     <circle class="pc-body" cx="68" cy="24" r="4"/>`,
  [ALFIL]:
    `<path class="pc-body" fill-rule="evenodd" d="M30 74 Q25 50 45 46 Q68 42 76 57 Q80 66 75 74 Z ${
      ring(40, 58, 7, 3).replace(/Z$/, "")
    }Z"/>
     <path class="pc-body" d="M31 70 h10 v13 h-10 Z M64 70 h10 v13 h-10 Z"/>
     <circle class="pc-body" cx="28" cy="54" r="11"/>
     <path class="pc-body" d="M19 56 Q13 68 17 80 L23 80 Q20 68 25 58 Z"/>
     <path class="pc-body" d="M24 62 Q15 65 11 58 Q18 62 25 59 Z"/>
     <path class="pc-body" d="M45 47 L45 37 Q57 24 69 37 L69 45 Z"/>
     <circle class="pc-body" cx="57" cy="25" r="3"/>`,
  [FARAS]:
    `<path class="pc-body" fill-rule="evenodd" d="M32 83 Q31 66 40 56 Q33 56 27 53 Q23 47 28 40 Q36 30 44 21 L46 11 L52 19 Q70 23 70 46 Q70 66 68 83 Z M46 28 a3 3 0 1 0 0.1 0 Z"/>
     <path class="pc-body" d="M53 20 L60 24 L57 28 L64 31 L60 35 L67 39 L62 42 L68 47 L66 49 Z"/>`,
  [RUKH]: `<path class="pc-body" d="M28 58 L28 38 L76 38 L76 58 Z"/>
     <path class="pc-body" d="M28 39 Q52 18 76 39 Z"/>
     <path class="pc-body" fill-rule="evenodd" d="${ring(44, 66, 16, 5)}"/>
     <path class="pc-body" d="M71 38 V10 h3 V38 Z M74 11 L86 15 L74 20 Z"/>`,
  [BAIDAQ]:
    `<path class="pc-body" d="M37 83 L39 54 Q40 47 45 47 Q50 47 51 54 L53 83 Z"/>
     <circle class="pc-body" cx="45" cy="40" r="7"/>
     <path class="pc-body" d="M37 38 Q39 28 45 24 Q51 28 53 38 Z"/>
     <path class="pc-body" fill-rule="evenodd" d="${ring(52, 62, 11, 4)}"/>
     <path class="pc-body" d="M62 82 V18 h3 V82 Z M63.5 8 L68 19 L59 19 Z"/>`,
};

/** Kufic names on medallions, read like the characters of xiangqi. */
const NAMES: Record<number, [string, number]> = {
  [SHAH]: ["شاه", 0],
  [FERZ]: ["فرزان", 50],
  [ALFIL]: ["فيل", 0],
  [FARAS]: ["فرس", 0],
  [RUKH]: ["رخ", 0],
  [BAIDAQ]: ["بيدق", 46],
};
const royal = (type: number) => type === SHAH || type === FERZ;
function calligraphy(type: number): string {
  const [word, fit] = NAMES[type];
  return `<circle class="pc-body" cx="50" cy="52" r="40"/>
     <circle class="pc-ring${
    royal(type) ? " pc-ring-royal" : ""
  }" cx="50" cy="52" r="34"/>
     <text class="pc-text pc-kufic" x="50" y="62" text-anchor="middle"${
    fit ? ` textLength="${fit}" lengthAdjust="spacingAndGlyphs"` : ""
  }>${word}</text>`;
}

/** Letters of the move notation (K F E N R; the baidaq has none). */
const LETTER: Record<number, string> = {
  [SHAH]: "K",
  [FERZ]: "F",
  [ALFIL]: "E",
  [FARAS]: "N",
  [RUKH]: "R",
  [BAIDAQ]: "",
};
function minimal(type: number): string {
  const letter = LETTER[type];
  return `<circle class="pc-body" cx="50" cy="52" r="41"/>
     ${royal(type) ? `<circle class="pc-ring" cx="50" cy="52" r="34"/>` : ""}
     ${
    letter
      ? `<text class="pc-text pc-letter" x="50" y="68" text-anchor="middle">${letter}</text>`
      : `<circle class="pc-dot" cx="50" cy="52" r="11"/>`
  }`;
}

/** The selectable piece designs; the first is the default. */
export const PIECE_SETS = [
  "classic",
  "crystal",
  "calligraphy",
  "nights",
  "western",
  "minimal",
] as const;
export type PieceSet = typeof PIECE_SETS[number];

let current: PieceSet = "classic";
export const pieceSet = () => current;
export function setPieceSet(set: string) {
  current = (PIECE_SETS as readonly string[]).includes(set)
    ? set as PieceSet
    : "classic";
}

function body(type: number, set: PieceSet): string {
  switch (set) {
    case "classic":
    case "crystal": // the default shapes, cut from rock crystal
      return BODY[type] + pedestal(type);
    case "western":
      return WESTERN[type] + pedestal(type);
    case "nights":
      return NIGHTS[type] +
        `<rect class="pc-body" x="18" y="83" width="64" height="5" rx="2.5"/>`;
    case "calligraphy":
      return calligraphy(type);
    case "minimal":
      return minimal(type);
  }
}

export function pieceSVG(piece: number, set: PieceSet = current): string {
  const type = Math.abs(piece);
  const color = piece > 0 ? "ivory" : "ebony";
  return `<svg viewBox="0 0 100 100" class="piece piece-${color} set-${set}" aria-hidden="true">${
    body(type, set)
  }</svg>`;
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
