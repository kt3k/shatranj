import type { Dict } from "../i18n.ts";

export const es: Dict = {
  "meta.title": "Shatranj — el ajedrez de la Bagdad abasí",
  "meta.description":
    "Juega al shatranj, el ajedrez medieval de la corte abasí, contra el ordenador. Cinco rivales de Las mil y una noches, de Aladino al Genio.",
  "brand.primary": "Shatranj",
  "brand.secondary": "شطرنج",
  "header.tagline": "El juego de la corte abasí · Bagdad, siglo IX",
  "header.rules": "Reglas",
  "header.theme": "Cambiar modo oscuro",
  "header.language": "Idioma",
  "board.aria":
    "Tablero de shatranj. Usa las flechas para mover el cursor y Enter para tomar o colocar una pieza.",
  "square.piece": "{square}: {piece} de {side}",
  "board.reviewing": "Revisando",

  "side.ivory": "Marfil",
  "side.ebony": "Ébano",
  "side.ivory.lower": "marfil",
  "side.ebony.lower": "ébano",

  "btn.undo": "Deshacer",
  "btn.undo.title": "Retira tu última jugada (U)",
  "btn.hint": "Pista",
  "btn.hint.title": "Sugiere una jugada (H)",
  "btn.flip": "Girar",
  "btn.flip.title": "Gira el tablero (F)",
  "btn.newGame": "Nueva partida",
  "btn.playAgain": "Jugar de nuevo",
  "btn.cancel": "Cancelar",
  "btn.begin": "Comenzar",
  "btn.close": "Cerrar diálogo",
  "btn.returnToBoard": "Volver al tablero",
  "btn.viewBoard": "Ver el tablero",
  "btn.changeOpponent": "Cambiar de rival",
  "btn.reviewGame": "Revisar partida",

  "status.yourMove": "Tu turno",
  "status.check": "¡Shāh! Tu rey está en jaque",
  "status.check.detail":
    "Pon a salvo a tu rey, interpón una pieza o captura al atacante.",
  "status.selected": "Elige una casilla resaltada o toma otra pieza.",
  "status.pickUp.ivory":
    "Toma una de tus piezas de marfil: haz clic o arrástrala.",
  "status.pickUp.ebony":
    "Toma una de tus piezas de ébano: haz clic o arrástrala.",
  "status.thinking": "{name} está pensando…",
  "status.hintThinking": "Consultando los tratados…",
  "status.hintThinking.detail": "Buscando una buena jugada para ti.",
  "status.hint": "Pista: {move}",
  "status.hint.detail":
    "La flecha muestra la jugada sugerida. Juégala o elige la tuya.",
  "status.draw": "Tablas",
  "status.victory": "¡Victoria!",
  "status.defeat": "Derrota",
  "status.reviewStart": "Revisando la posición inicial",
  "status.reviewMove": "Revisando la jugada {move}",
  "status.reviewHelp":
    "Usa ← → o la lista de jugadas para recorrer la partida. Pulsa End para volver.",

  "reason.checkmate": "Shāh māt: el rey está indefenso.",
  "reason.stalemate":
    "Rey ahogado: en el shatranj, el rey que no puede moverse pierde.",
  "reason.bare-king": "Rey despojado: el shāh queda solo en el campo.",
  "reason.draw-bare":
    "Ambos reyes quedaron despojados. La partida acaba en tablas.",
  "reason.repetition":
    "La misma posición se repitió tres veces. La partida acaba en tablas.",
  "reason.move-limit":
    "Pasaron setenta jugadas sin progreso. La partida acaba en tablas.",

  "result.draw": "Partida en tablas",
  "result.win": "Has vencido",
  "result.lose": "{name} se impone",
  "result.detail.one": "{text} ({n} jugada)",
  "result.detail.other": "{text} ({n} jugadas)",

  "moves.title": "Jugadas",
  "moves.count.one": "{n} jugada",
  "moves.count.other": "{n} jugadas",
  "moves.empty": "Aún no hay jugadas.",
  "moves.aria": "Ver la posición tras {move}",
  "nav.first": "Posición inicial (Home)",
  "nav.prev": "Jugada anterior (←)",
  "nav.next": "Jugada siguiente (→)",
  "nav.last": "Última jugada (End)",
  "nav.review": "Revisar",
  "nav.review.title": "Analiza la partida hasta ahora",
  "nav.live": "Volver a la partida",

  "player.you": "Tú",
  "player.level": "Nivel {n}",
  "player.thinking": "pensando",
  "player.toMove": "{side} — mueve",

  "opponent.label": "Tu rival",
  "opponent.levelOf": "Nivel {n} de {total}",
  "level.strength": "Fuerza {n} de {total}",

  "newGame.title": "Una nueva partida",
  "newGame.desc": "Elige a tu rival de Las mil y una noches.",
  "newGame.opponent": "Rival",
  "newGame.playAs": "Jugar con",
  "newGame.random": "Al azar",
  "newGame.ivoryFirst": "Marfil mueve primero.",

  "rules.title": "Las reglas del shatranj",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "Se juega en el mismo tablero de 8×8 que el ajedrez, con piezas más antiguas y mansas.",
  "rules.list":
    `<li><strong>Shāh māt</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — «el rey está indefenso»: el jaque mate gana.</li>
     <li><strong>El rey ahogado gana</strong> para quien deja al rival sin ninguna jugada legal.</li>
     <li><strong>Rey despojado</strong>: capturar todas las piezas del rival salvo el rey da la victoria, a menos que él pueda despojar a tu rey en la jugada siguiente, lo que deja tablas.</li>
     <li>No hay enroque, ni doble paso del peón (baidaq), ni captura al paso.</li>
     <li>El peón que alcanza la última fila se convierte en alferza (firzán).</li>
     <li>La triple repetición, o 70 jugadas de cada bando sin captura ni movimiento de peón, son tablas.</li>`,

  "footer.html":
    `El shatranj llegó a Bagdad desde Persia y floreció en la corte de los califas abasíes, donde maestros como al-ʿAdlī, ar-Rāzī y aṣ-Ṣūlī escribieron los primeros tratados sobre el juego.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> Madīnat as-Salām, la Ciudad de la Paz`,

  "class.best": "Mejor jugada",
  "class.good": "Buena",
  "class.inaccuracy": "Imprecisión",
  "class.mistake": "Error",
  "class.blunder": "Error grave",
  "class.best.plural": "Mejores jugadas",
  "class.inaccuracy.plural": "Imprecisiones",
  "class.mistake.plural": "Errores",
  "class.blunder.plural": "Errores graves",

  "review.title": "Revisión de la partida",
  "review.intro":
    "Deja que el motor repase la partida jugada a jugada: errores graves, victorias perdidas y las mejores jugadas que pudiste hacer.",
  "review.start": "Revisar esta partida",
  "review.analysing": "Analizando… {done} / {total} posiciones",
  "review.stop": "Detener",
  "review.remaining.one": "Analizar la posición restante",
  "review.remaining.other": "Analizar las {n} posiciones restantes",
  "review.you": "Tú",
  "review.accuracy": "Precisión",
  "review.footnote":
    "Haz clic en la gráfica o en una jugada para ver qué pensó el motor.",
  "review.graph":
    "Gráfica de evaluación. El área de marfil muestra las opciones de Marfil.",
  "review.byYou": "Tu jugada",
  "review.byThem": "Jugada de {name}",
  "review.eval": "Evaluación para Marfil {before} → {after}",
  "review.agrees": "El motor está de acuerdo.",
  "review.asGood": "Tan buena como la elección del motor.",
  "review.better": "Era mejor {move}.",
  "review.showBest": "Mostrar {move} en el tablero",
  "review.backToPlayed": "Volver a la jugada hecha",

  "level.1.name": "Aladino",
  "level.1.title": "El pilluelo",
  "level.1.desc":
    "Un muchacho de los callejones de la ciudad que acaba de aprender los movimientos.",
  "level.2.name": "Masrur",
  "level.2.title": "El portador de la espada",
  "level.2.desc":
    "El leal verdugo del califa. Audaz, pero descuidado ante el tablero.",
  "level.3.name": "Yafar",
  "level.3.title": "El visir",
  "level.3.desc": "El astuto visir de los barmácidas. Juega con solidez.",
  "level.4.name": "Harún al-Rashid",
  "level.4.title": "El califa",
  "level.4.desc":
    "El mismísimo Príncipe de los Creyentes, gran mecenas del shatranj.",
  "level.5.name": "Genio",
  "level.5.title": "El espíritu de la lámpara",
  "level.5.desc":
    "Un ser de fuego sin humo. Pocos mortales logran arrancarle tablas.",

  "piece.6.name": "Rey",
  "piece.6.meaning": "Shāh",
  "piece.6.move": "Una casilla en cualquier dirección.",
  "piece.2.name": "Alferza",
  "piece.2.meaning": "Firzán, el consejero",
  "piece.2.move": "Una casilla en diagonal. Antepasada de la dama.",
  "piece.3.name": "Alfil",
  "piece.3.meaning": "Fil, el elefante",
  "piece.3.move":
    "Salta exactamente dos casillas en diagonal, por encima de lo que haya entre medias.",
  "piece.4.name": "Caballo",
  "piece.4.meaning": "Faras",
  "piece.4.move": "Se mueve como el caballo moderno.",
  "piece.5.name": "Roque",
  "piece.5.meaning": "Rukh, el carro",
  "piece.5.move": "Cualquier distancia por fila o columna, como la torre.",
  "piece.1.name": "Peón",
  "piece.1.meaning": "Baidaq, el infante",
  "piece.1.move":
    "Una casilla hacia delante (nunca dos); captura una casilla en diagonal hacia delante. Se corona en alferza.",
};
