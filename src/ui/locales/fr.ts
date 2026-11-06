import type { Dict } from "../i18n.ts";

export const fr: Dict = {
  "meta.title": "Shatranj — les échecs de la Bagdad abbasside",
  "meta.description":
    "Jouez au shatranj, les échecs médiévaux de la cour abbasside, contre l’ordinateur. Cinq adversaires tirés des Mille et Une Nuits, d’Aladdin au Djinn.",
  "brand.primary": "Shatranj",
  "brand.secondary": "شطرنج",
  "header.tagline": "Le jeu de la cour abbasside · Bagdad, IXᵉ siècle",
  "header.rules": "Règles",
  "header.theme": "Basculer le mode sombre",
  "header.language": "Langue",
  "board.aria":
    "Échiquier de shatranj. Utilisez les flèches pour déplacer le curseur et Entrée pour prendre ou poser une pièce.",
  "square.piece": "{square} : {piece} {side}",
  "board.reviewing": "Analyse en cours",
  "sr.played": "{name} a joué {move}",
  "sr.youPlayed": "Vous avez joué {move}",
  "punct.sep": ". ",
  "review.footnote.touch":
    "Touchez le graphique ou un coup pour voir l’avis du moteur.",
  "sr.selected": "sélectionné",
  "sr.target": "coup légal",

  "side.ivory": "Ivoire",
  "side.ebony": "Ébène",
  "side.ivory.lower": "d’ivoire",
  "side.ebony.lower": "d’ébène",

  "btn.undo": "Annuler",
  "btn.undo.title": "Reprendre votre dernier coup (U)",
  "btn.hint": "Indice",
  "btn.hint.title": "Suggérer un coup (H)",
  "btn.flip": "Retourner",
  "btn.flip.title": "Retourner l’échiquier (F)",
  "btn.newGame": "Nouvelle partie",
  "btn.playAgain": "Rejouer",
  "btn.cancel": "Annuler",
  "btn.begin": "Commencer",
  "btn.close": "Fermer la fenêtre",
  "btn.returnToBoard": "Revenir à l’échiquier",
  "btn.viewBoard": "Voir l’échiquier",
  "btn.changeOpponent": "Changer d’adversaire",
  "btn.reviewGame": "Analyser la partie",

  "status.yourMove": "À vous de jouer",
  "status.newcomer": "Nouveau au shatranj ? Voir la marche des pièces",
  "status.check": "Shāh ! Votre roi est en échec",
  "status.check.detail":
    "Mettez votre roi à l’abri, interposez une pièce ou prenez l’attaquant.",
  "status.selected":
    "Choisissez une case en surbrillance, ou prenez une autre pièce.",
  "status.pickUp.ivory":
    "Prenez l’une de vos pièces d’ivoire — cliquez ou faites-la glisser.",
  "status.pickUp.ebony":
    "Prenez l’une de vos pièces d’ébène — cliquez ou faites-la glisser.",
  "status.thinking": "{name} réfléchit…",
  "status.hintThinking": "Consultation des traités…",
  "status.hintThinking.detail": "Recherche d’un bon coup pour vous.",
  "status.hint": "Indice : {move}",
  "status.hint.detail":
    "La flèche montre le coup suggéré. Jouez-le, ou choisissez le vôtre.",
  "status.draw": "Partie nulle",
  "status.victory": "Victoire !",
  "status.defeat": "Défaite",
  "status.reviewStart": "Position initiale",
  "status.reviewMove": "Position après {move}",
  "status.reviewHelp":
    "Utilisez ← → ou la liste des coups pour parcourir la partie. Appuyez sur Fin (End) pour revenir.",

  "reason.checkmate": "Shāh māt — le roi est sans recours.",
  "reason.stalemate":
    "Pat — au shatranj, le roi qui ne peut plus bouger est vaincu.",
  "reason.bare-king": "Roi dépouillé — le shāh reste seul sur le champ.",
  "reason.draw-bare": "Les deux rois ont été dépouillés. La partie est nulle.",
  "reason.repetition":
    "La même position s’est présentée trois fois. La partie est nulle.",
  "reason.move-limit": "Soixante-dix coups sans progrès. La partie est nulle.",

  "result.draw": "Partie nulle",
  "result.win": "Vous êtes victorieux",
  "result.lose": "{name} l’emporte",
  "result.detail.one": "{text} ({n} coup)",
  "result.detail.other": "{text} ({n} coups)",

  "moves.title": "Coups",
  "moves.count.one": "{n} coup",
  "moves.count.other": "{n} coups",
  "moves.empty": "Aucun coup pour l’instant.",
  "moves.aria": "Afficher la position après {move}",
  "nav.first": "Position initiale (Home)",
  "nav.prev": "Coup précédent (←)",
  "nav.next": "Coup suivant (→)",
  "nav.last": "Dernier coup (End)",
  "nav.review": "Analyse",
  "nav.review.title": "Analyser la partie jusqu’ici",
  "nav.live": "Retour à la partie",

  "player.you": "Vous",
  "player.level": "Niveau {n}",
  "player.thinking": "réfléchit",
  "player.toMove": "{side} — au trait",

  "opponent.label": "Votre adversaire",
  "opponent.levelOf": "Niveau {n} sur {total}",
  "level.strength": "Force {n} sur {total}",

  "newGame.title": "Une nouvelle partie",
  "newGame.desc": "Choisissez votre adversaire parmi les Mille et Une Nuits.",
  "newGame.opponent": "Adversaire",
  "newGame.playAs": "Jouer les",
  "newGame.random": "Au hasard",
  "newGame.ivoryFirst": "L’Ivoire joue en premier.",

  "rules.title": "Les règles du shatranj",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "Il se joue sur le même échiquier de 8×8 que les échecs, avec des pièces plus anciennes et plus modestes.",
  "rules.list":
    `<li><strong>Shāh māt</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — « le roi est sans recours » : l’échec et mat l’emporte.</li>
     <li><strong>Le pat gagne</strong> pour le joueur qui laisse son adversaire sans coup légal.</li>
     <li><strong>Roi dépouillé</strong> : prendre toutes les pièces adverses sauf le roi l’emporte — à moins que l’adversaire ne dépouille aussitôt votre roi au coup suivant, ce qui donne la nulle.</li>
     <li>Il n’y a ni roque, ni double pas du baidaq, ni prise en passant.</li>
     <li>Un baidaq atteignant la dernière rangée devient firzān.</li>
     <li>La triple répétition, ou 70 coups de chaque camp sans prise ni coup de baidaq, donne la nulle.</li>`,

  "footer.html":
    `Le shatranj gagna Bagdad depuis la Perse et s’épanouit à la cour des califes abbassides, où des maîtres comme al-ʿAdlī, ar-Rāzī et aṣ-Ṣūlī écrivirent les premiers traités sur le jeu.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> Madīnat as-Salām, la Cité de la Paix`,

  "class.best": "Meilleur coup",
  "class.good": "Bon",
  "class.inaccuracy": "Imprécision",
  "class.mistake": "Erreur",
  "class.blunder": "Gaffe",
  "class.best.plural": "Meilleurs coups",
  "class.inaccuracy.plural": "Imprécisions",
  "class.mistake.plural": "Erreurs",
  "class.blunder.plural": "Gaffes",

  "review.title": "Analyse de la partie",
  "review.intro":
    "Laissez le moteur passer la partie en revue coup par coup : gaffes, gains manqués et meilleurs coups que vous auriez pu jouer.",
  "review.start": "Analyser cette partie",
  "review.analysing": "Analyse… {done} / {total} positions",
  "review.stop": "Arrêter",
  "review.remaining.one": "Analyser la position restante",
  "review.remaining.other": "Analyser les {n} positions restantes",
  "review.you": "Vous",
  "review.accuracy": "Précision",
  "review.footnote":
    "Cliquez sur le graphique ou sur un coup pour voir l’avis du moteur.",
  "review.graph":
    "Graphique d’évaluation. La zone ivoire montre les chances de l’Ivoire.",
  "review.byYou": "Votre coup",
  "review.byThem": "Coup de {name}",
  "review.eval": "Évaluation pour l’Ivoire {before} → {after}",
  "review.agrees": "Le moteur est d’accord.",
  "review.asGood": "Aussi bon que le choix du moteur.",
  "review.better": "Il valait mieux jouer {move}.",
  "review.showBest": "Montrer {move} sur l’échiquier",
  "review.backToPlayed": "Revenir au coup joué",

  "level.1.name": "Aladdin",
  "level.1.title": "Le gamin des rues",
  "level.1.desc":
    "Un garçon des ruelles de la ville qui vient d’apprendre la marche des pièces.",
  "level.2.name": "Masrour",
  "level.2.title": "Le porte-glaive",
  "level.2.desc":
    "Le fidèle exécuteur du calife. Hardi, mais imprudent devant l’échiquier.",
  "level.3.name": "Djafar",
  "level.3.title": "Le vizir",
  "level.3.desc": "L’habile vizir barmécide. Joue une partie solide.",
  "level.4.name": "Haroun al-Rachid",
  "level.4.title": "Le calife",
  "level.4.desc":
    "Le Commandeur des croyants en personne, fervent protecteur du shatranj.",
  "level.5.name": "Le Djinn",
  "level.5.title": "L’esprit de la lampe",
  "level.5.desc":
    "Un être de feu sans fumée. Rares sont les mortels qui lui arrachent la nulle.",

  "piece.6.name": "Shāh",
  "piece.6.meaning": "Roi",
  "piece.6.move": "Une case dans n’importe quelle direction.",
  "piece.2.name": "Firzān",
  "piece.2.meaning": "Conseiller, vizir",
  "piece.2.move":
    "Une case en diagonale. La « fierge » médiévale, ancêtre de la dame.",
  "piece.3.name": "Fīl",
  "piece.3.meaning": "Éléphant",
  "piece.3.move":
    "Saute exactement de deux cases en diagonale, par-dessus toute pièce intermédiaire. L’« aufin » des Français du Moyen Âge.",
  "piece.4.name": "Faras",
  "piece.4.meaning": "Cheval",
  "piece.4.move": "Se déplace comme le cavalier moderne.",
  "piece.5.name": "Rukh",
  "piece.5.meaning": "Char",
  "piece.5.move":
    "D’autant de cases que voulu sur une rangée ou une colonne, comme la tour.",
  "piece.1.name": "Baidaq",
  "piece.1.meaning": "Fantassin",
  "piece.1.move":
    "Avance d’une case (jamais deux), prend d’une case en diagonale vers l’avant. Se promeut en firzān.",

  "header.library": "Parties",
  "library.title": "Parties enregistrées",
  "library.desc":
    "Vos parties sont enregistrées automatiquement dans ce navigateur. Téléchargez-les en PGN pour en garder une copie ou les transférer sur un autre appareil.",
  "library.filter": "Afficher",
  "library.filter.all": "Toutes",
  "library.filter.win": "Victoires",
  "library.filter.loss": "Défaites",
  "library.filter.draw": "Nulles",
  "library.noStorage":
    "Ce navigateur ne conserve pas les données (navigation privée ?), les parties seront donc perdues à la fermeture de la page. Téléchargez-les en PGN.",
  "library.empty":
    "Aucune partie pour l’instant. Les parties que vous jouez sont enregistrées ici automatiquement.",
  "library.vs": "contre {name}",
  "library.result.win": "Gagnée",
  "library.result.loss": "Perdue",
  "library.result.draw": "Nulle",
  "library.result.unfinished": "En cours",
  "library.open": "Ouvrir",
  "library.share": "Copier le lien",
  "library.download": "Télécharger PGN",
  "library.delete": "Supprimer",
  "library.deleteConfirm":
    "Supprimer cette partie enregistrée ? Cette action est irréversible.",
  "library.copied": "Lien copié",
  "library.import": "Importer PGN",
  "library.paste": "Coller PGN",
  "library.paste.submit": "Importer",
  "library.exportAll": "Tout télécharger",
  "library.imported.one": "{n} partie importée.",
  "library.imported.other": "{n} parties importées.",
  "library.importFailed.one": "{n} partie n’a pas pu être lue.",
  "library.importFailed.other": "{n} parties n’ont pas pu être lues.",
  "viewer.title": "Partie enregistrée",
  "viewer.shared": "Partie partagée",
  "viewer.close": "Revenir à ma partie",
  "viewer.save": "Enregistrer dans mes parties",
  "viewer.saved": "Enregistrée dans vos parties",
  "share.invalid": "Impossible de lire ce lien de partie.",
  "library.tag.imported": "Importée",
  "library.tag.shared": "Partagée",
  "library.tag.current": "Partie actuelle",
  "library.result.abandoned": "Inachevée",
  "library.emptyFilter": "Aucune partie ne correspond à ce filtre.",
  "library.noGames":
    "Aucune partie trouvée dans ce texte. Collez une partie au format PGN, par ex. « 1. e3 e6 2. Nf3 … ».",
  "library.badMove":
    "Partie {index} : « {move} » au coup {number} n’est pas un coup légal au shatranj.",
  "library.importPartial.one":
    "Importer quand même les coups légaux de {n} partie",
  "library.importPartial.other":
    "Importer quand même les coups légaux de {n} parties",
  "viewer.continue": "Continuer cette partie",
  "viewer.play": "Jouer une partie",
  "viewer.discardConfirm":
    "Quitter cette partie partagée sans l’enregistrer ? Son analyse sera perdue.",
  "status.viewerHelp":
    "Utilisez ← → ou la liste des coups pour parcourir la partie.",
  "viewer.leave": "Quitter sans enregistrer",
  "viewer.saveAndLeave": "Enregistrer et quitter",
  "library.askMine":
    "Ces parties ont été exportées depuis ce site avec le camp du joueur. S’agit-il de vos propres parties ? Vos parties comptent dans vos victoires et vos défaites.",
  "library.askMineYes": "Oui, ce sont les miennes",
  "library.duplicates.one": "{n} partie était déjà enregistrée.",
  "library.duplicates.other": "{n} parties étaient déjà enregistrées.",
  "viewer.unsaved": "Non enregistrée",
  "viewer.discardConfirmMine":
    "Quitter cette partie sans l’enregistrer ? La partie et son analyse seront perdues.",
  "library.askMineNo": "Non, celles de quelqu’un d’autre",
};
