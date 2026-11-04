import type { Dict } from "../i18n.ts";

export const de: Dict = {
  "meta.title": "Schatrandsch — das Schach des abbasidischen Bagdad",
  "meta.description":
    "Spiele Schatrandsch, das mittelalterliche Schach des abbasidischen Hofes, gegen den Computer. Fünf Gegner aus Tausendundeiner Nacht, von Aladin bis zum Dschinn.",
  "brand.primary": "Schatrandsch",
  "brand.secondary": "شطرنج",
  "header.tagline":
    "Das Spiel des abbasidischen Hofes · Bagdad, 9. Jahrhundert",
  "header.rules": "Regeln",
  "header.theme": "Dunkelmodus umschalten",
  "header.language": "Sprache",
  "board.aria":
    "Schatrandsch-Brett. Bewege den Cursor mit den Pfeiltasten; mit Enter nimmst du eine Figur auf oder setzt sie ab.",
  "square.piece": "{square}: {piece} ({side})",
  "board.reviewing": "Analyse",

  "side.ivory": "Elfenbein",
  "side.ebony": "Ebenholz",
  "side.ivory.lower": "Elfenbein",
  "side.ebony.lower": "Ebenholz",

  "btn.undo": "Zurück",
  "btn.undo.title": "Deinen letzten Zug zurücknehmen (U)",
  "btn.hint": "Tipp",
  "btn.hint.title": "Einen Zug vorschlagen (H)",
  "btn.flip": "Drehen",
  "btn.flip.title": "Brett drehen (F)",
  "btn.newGame": "Neue Partie",
  "btn.playAgain": "Noch einmal",
  "btn.cancel": "Abbrechen",
  "btn.begin": "Beginnen",
  "btn.close": "Dialog schließen",
  "btn.returnToBoard": "Zurück zum Brett",
  "btn.viewBoard": "Brett ansehen",
  "btn.changeOpponent": "Gegner wechseln",
  "btn.reviewGame": "Partie analysieren",

  "status.yourMove": "Du bist am Zug",
  "status.check": "Schah! Dein König steht im Schach",
  "status.check.detail":
    "Bring deinen König in Sicherheit, blocke den Angriff oder schlage den Angreifer.",
  "status.selected": "Wähle ein markiertes Feld oder nimm eine andere Figur.",
  "status.pickUp.ivory":
    "Nimm eine deiner Elfenbeinfiguren auf — klicken oder ziehen.",
  "status.pickUp.ebony":
    "Nimm eine deiner Ebenholzfiguren auf — klicken oder ziehen.",
  "status.thinking": "{name} denkt nach…",
  "status.hintThinking": "Die alten Lehrbücher werden befragt…",
  "status.hintThinking.detail": "Suche einen guten Zug für dich.",
  "status.hint": "Tipp: {move}",
  "status.hint.detail":
    "Der Pfeil zeigt den vorgeschlagenen Zug. Spiel ihn – oder wähle deinen eigenen.",
  "status.draw": "Remis",
  "status.victory": "Sieg!",
  "status.defeat": "Niederlage",
  "status.reviewStart": "Ausgangsstellung",
  "status.reviewMove": "Stellung nach {move}",
  "status.reviewHelp":
    "Mit ← → oder der Zugliste gehst du durch die Partie. Mit End kehrst du zurück.",

  "reason.checkmate": "Schah mat — der König ist hilflos.",
  "reason.stalemate":
    "Patt — im Schatrandsch verliert ein König, der nicht mehr ziehen kann.",
  "reason.bare-king": "Blanker König — der Schah steht allein auf dem Feld.",
  "reason.draw-bare":
    "Beiden Königen wurden alle Figuren genommen. Die Partie ist remis.",
  "reason.repetition":
    "Dieselbe Stellung kam dreimal vor. Die Partie ist remis.",
  "reason.move-limit":
    "Siebzig Züge vergingen ohne Fortschritt. Die Partie ist remis.",

  "result.draw": "Die Partie endet remis",
  "result.win": "Du hast gesiegt",
  "result.lose": "{name} siegt",
  "result.detail.one": "{text} ({n} Zug)",
  "result.detail.other": "{text} ({n} Züge)",

  "moves.title": "Züge",
  "moves.count.one": "{n} Zug",
  "moves.count.other": "{n} Züge",
  "moves.empty": "Noch keine Züge.",
  "moves.aria": "Stellung nach {move} zeigen",
  "nav.first": "Ausgangsstellung (Home)",
  "nav.prev": "Vorheriger Zug (←)",
  "nav.next": "Nächster Zug (→)",
  "nav.last": "Letzter Zug (End)",
  "nav.review": "Analyse",
  "nav.review.title": "Die bisherige Partie analysieren",
  "nav.live": "Zurück zur Partie",

  "player.you": "Du",
  "player.level": "Stufe {n}",
  "player.thinking": "denkt nach",
  "player.toMove": "{side} — am Zug",

  "opponent.label": "Dein Gegner",
  "opponent.levelOf": "Stufe {n} von {total}",
  "level.strength": "Stärke {n} von {total}",

  "newGame.title": "Eine neue Partie",
  "newGame.desc": "Wähle deinen Gegner aus Tausendundeiner Nacht.",
  "newGame.opponent": "Gegner",
  "newGame.playAs": "Spielen als",
  "newGame.random": "Zufällig",
  "newGame.ivoryFirst": "Elfenbein zieht zuerst.",

  "rules.title": "Die Regeln des Schatrandsch",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "Gespielt auf demselben 8×8-Brett wie Schach, mit älteren, sanfteren Figuren.",
  "rules.list":
    `<li><strong>Schah mat</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — „der König ist hilflos“: Schachmatt gewinnt.</li>
     <li><strong>Patt gewinnt</strong> für den Spieler, der dem Gegner keinen legalen Zug mehr lässt.</li>
     <li><strong>Blanker König</strong>: Wer dem Gegner alle Figuren außer dem König nimmt, gewinnt — es sei denn, dieser kann im nächsten Zug auch deinen König blank machen; dann ist es remis.</li>
     <li>Es gibt keine Rochade, keinen Doppelschritt des Baidaq und kein En passant.</li>
     <li>Ein Baidaq, der die letzte Reihe erreicht, wird zum Firzan.</li>
     <li>Dreifache Stellungswiederholung oder je 70 Züge ohne Schlagen oder Baidaq-Zug bedeuten remis.</li>`,

  "footer.html":
    `Schatrandsch gelangte aus Persien nach Bagdad und blühte am Hof der abbasidischen Kalifen auf, wo Meister wie al-ʿAdlī, ar-Rāzī und aṣ-Ṣūlī die ersten Lehrbücher über das Spiel verfassten.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> Madīnat as-Salām, die Stadt des Friedens`,

  "class.best": "Bester Zug",
  "class.good": "Gut",
  "class.inaccuracy": "Ungenauigkeit",
  "class.mistake": "Fehler",
  "class.blunder": "Grober Fehler",
  "class.best.plural": "Beste Züge",
  "class.inaccuracy.plural": "Ungenauigkeiten",
  "class.mistake.plural": "Fehler",
  "class.blunder.plural": "Grobe Fehler",

  "review.title": "Partieanalyse",
  "review.intro":
    "Lass die Engine die Partie Zug für Zug durchgehen: grobe Fehler, verpasste Gewinne und die besseren Züge, die du hättest spielen können.",
  "review.start": "Diese Partie analysieren",
  "review.analysing": "Analysiere… {done} / {total} Stellungen",
  "review.stop": "Stopp",
  "review.remaining.one": "Die verbleibende Stellung analysieren",
  "review.remaining.other": "Die verbleibenden {n} Stellungen analysieren",
  "review.you": "Du",
  "review.accuracy": "Genauigkeit",
  "review.footnote":
    "Klicke auf die Grafik oder einen Zug, um die Einschätzung der Engine zu sehen.",
  "review.graph":
    "Bewertungsgrafik. Die elfenbeinfarbene Fläche zeigt die Chancen von Elfenbein.",
  "review.byYou": "Dein Zug",
  "review.byThem": "Zug von {name}",
  "review.eval": "Bewertung für Elfenbein {before} → {after}",
  "review.agrees": "Die Engine stimmt zu.",
  "review.asGood": "So gut wie die Wahl der Engine.",
  "review.better": "Besser war {move}.",
  "review.showBest": "{move} auf dem Brett zeigen",
  "review.backToPlayed": "Zurück zum gespielten Zug",

  "level.1.name": "Aladin",
  "level.1.title": "Der Gassenjunge",
  "level.1.desc":
    "Ein Bursche aus den Gassen der Stadt, der gerade erst die Züge gelernt hat.",
  "level.2.name": "Masrur",
  "level.2.title": "Der Schwertträger",
  "level.2.desc":
    "Der treue Scharfrichter des Kalifen. Kühn, aber am Brett leichtsinnig.",
  "level.3.name": "Dschaʿfar",
  "level.3.title": "Der Wesir",
  "level.3.desc":
    "Der kluge Wesir aus dem Haus der Barmakiden. Spielt eine solide Partie.",
  "level.4.name": "Hārūn ar-Raschīd",
  "level.4.title": "Der Kalif",
  "level.4.desc":
    "Der Beherrscher der Gläubigen selbst, ein eifriger Förderer des Schatrandsch.",
  "level.5.name": "Dschinn",
  "level.5.title": "Der Geist der Lampe",
  "level.5.desc":
    "Ein Wesen aus rauchlosem Feuer. Kaum ein Sterblicher hält ein Remis.",

  "piece.6.name": "Schah",
  "piece.6.meaning": "König",
  "piece.6.move": "Ein Feld in jede Richtung.",
  "piece.2.name": "Firzan",
  "piece.2.meaning": "Ratgeber",
  "piece.2.move": "Ein Feld diagonal. Der Vorfahr der Dame.",
  "piece.3.name": "Fil",
  "piece.3.meaning": "Elefant",
  "piece.3.move":
    "Springt genau zwei Felder diagonal und überspringt dabei alles dazwischen.",
  "piece.4.name": "Faras",
  "piece.4.meaning": "Pferd",
  "piece.4.move": "Zieht wie der heutige Springer.",
  "piece.5.name": "Ruch",
  "piece.5.meaning": "Streitwagen",
  "piece.5.move": "Beliebig weit entlang einer Reihe oder Linie, wie ein Turm.",
  "piece.1.name": "Baidaq",
  "piece.1.meaning": "Fußsoldat",
  "piece.1.move":
    "Ein Feld vorwärts (nie zwei), schlägt ein Feld schräg nach vorn. Wird zum Firzan.",
};
