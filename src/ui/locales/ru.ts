import type { Dict } from "../i18n.ts";

export const ru: Dict = {
  "meta.title": "Шатрандж — шахматы Багдада Аббасидов",
  "meta.description":
    "Сыграйте с компьютером в шатрандж — средневековые шахматы двора Аббасидов. Пять соперников из «Тысячи и одной ночи», от Аладдина до Джинна.",
  "brand.primary": "Шатрандж",
  "brand.secondary": "شطرنج",
  "header.tagline": "Игра двора Аббасидов · Багдад, IX век",
  "header.rules": "Правила",
  "header.theme": "Тёмная тема",
  "header.language": "Язык",
  "board.aria":
    "Доска шатранджа. Перемещайте курсор стрелками; Enter — взять или поставить фигуру.",
  "square.piece": "{square}: {piece} {side}",
  "board.reviewing": "Разбор",
  "sr.played": "{name}: ход {move}",
  "sr.youPlayed": "Ваш ход: {move}",
  "punct.sep": ". ",
  "review.footnote.touch":
    "Нажмите на график или ход, чтобы увидеть оценку движка.",
  "sr.selected": "выбрано",
  "sr.target": "возможный ход",

  "side.ivory": "Слоновая кость",
  "side.ebony": "Эбен",
  "side.ivory.lower": "из слоновой кости",
  "side.ebony.lower": "из эбена",

  "btn.undo": "Отменить",
  "btn.undo.title": "Взять назад последний ход (U)",
  "btn.hint": "Подсказка",
  "btn.hint.title": "Предложить ход (H)",
  "btn.flip": "Перевернуть",
  "btn.flip.title": "Перевернуть доску (F)",
  "btn.newGame": "Новая партия",
  "btn.playAgain": "Сыграть ещё",
  "btn.cancel": "Отмена",
  "btn.begin": "Начать",
  "btn.close": "Закрыть окно",
  "btn.returnToBoard": "Вернуться к доске",
  "btn.viewBoard": "Посмотреть доску",
  "btn.changeOpponent": "Сменить соперника",
  "btn.reviewGame": "Разобрать партию",

  "status.yourMove": "Ваш ход",
  "status.newcomer": "Впервые в шатрандже? Как ходят фигуры",
  "status.check": "Шах! Вашему королю шах",
  "status.check.detail":
    "Уведите короля из-под удара, закройтесь или возьмите нападающую фигуру.",
  "status.selected": "Выберите подсвеченное поле или другую фигуру.",
  "status.pickUp.ivory":
    "Возьмите одну из своих фигур из слоновой кости — щелчком или перетаскиванием.",
  "status.pickUp.ebony":
    "Возьмите одну из своих фигур из эбена — щелчком или перетаскиванием.",
  "status.thinking": "{name} размышляет…",
  "status.hintThinking": "Сверяемся с трактатами…",
  "status.hintThinking.detail": "Ищем для вас хороший ход.",
  "status.hint": "Подсказка: {move}",
  "status.hint.detail":
    "Стрелка показывает предложенный ход. Сыграйте его или выберите свой.",
  "status.draw": "Ничья",
  "status.victory": "Победа!",
  "status.defeat": "Поражение",
  "status.reviewStart": "Разбор: начальная позиция",
  "status.reviewMove": "Разбор хода {move}",
  "status.reviewHelp":
    "Листайте партию клавишами ← → или по списку ходов. End — вернуться.",

  "reason.checkmate": "Шах мат — король беспомощен.",
  "reason.stalemate":
    "Пат — в шатрандже король, которому некуда ходить, проигрывает.",
  "reason.bare-king": "Голый король — шах остался на поле один.",
  "reason.draw-bare": "Оба короля остались голыми. Ничья.",
  "reason.repetition": "Одна и та же позиция повторилась трижды. Ничья.",
  "reason.move-limit": "Семьдесят ходов прошли без продвижения. Ничья.",

  "result.draw": "Ничья",
  "result.win": "Вы победили",
  "result.lose": "Побеждает {name}",
  "result.detail.one": "{text} ({n} ход)",
  "result.detail.few": "{text} ({n} хода)",
  "result.detail.many": "{text} ({n} ходов)",
  "result.detail.other": "{text} ({n} хода)",

  "moves.title": "Ходы",
  "moves.count.one": "{n} ход",
  "moves.count.few": "{n} хода",
  "moves.count.many": "{n} ходов",
  "moves.count.other": "{n} хода",
  "moves.empty": "Ходов пока нет.",
  "moves.aria": "Показать позицию после {move}",
  "nav.first": "Начальная позиция (Home)",
  "nav.prev": "Предыдущий ход (←)",
  "nav.next": "Следующий ход (→)",
  "nav.last": "Последний ход (End)",
  "nav.review": "Разбор",
  "nav.review.title": "Проанализировать сыгранное",
  "nav.live": "К партии",

  "player.you": "Вы",
  "player.level": "Уровень {n}",
  "player.thinking": "думает",
  "player.toMove": "{side} — ход",

  "opponent.label": "Ваш соперник",
  "opponent.levelOf": "Уровень {n} из {total}",
  "level.strength": "Сила: {n} из {total}",

  "newGame.title": "Новая партия",
  "newGame.desc": "Выберите соперника из «Тысячи и одной ночи».",
  "newGame.opponent": "Соперник",
  "newGame.playAs": "Играть за",
  "newGame.random": "Случайно",
  "newGame.ivoryFirst": "Слоновая кость ходит первой.",

  "rules.title": "Правила шатранджа",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "Играется на той же доске 8×8, что и шахматы, но более старыми и скромными фигурами.",
  "rules.list":
    `<li><strong>Шах мат</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — «король беспомощен»: мат приносит победу.</li>
     <li><strong>Пат — победа</strong> того, кто оставил соперника без допустимого хода.</li>
     <li><strong>Голый король</strong>: тот, кто взял все фигуры соперника, кроме короля, побеждает — если только соперник следующим же ходом не оголит и вашего короля; тогда ничья.</li>
     <li>Нет рокировки, нет двойного шага байдака и нет взятия на проходе.</li>
     <li>Байдак, дошедший до последней горизонтали, становится ферзём.</li>
     <li>Троекратное повторение или 70 ходов с каждой стороны без взятий и ходов байдаком — ничья.</li>`,

  "footer.html":
    `Шатрандж пришёл в Багдад из Персии и расцвёл при дворе халифов Аббасидов, где такие мастера, как аль-Адли, ар-Рази и ас-Сули, написали первые трактаты об этой игре.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> Мадинат ас-Салам, Город мира`,

  "class.best": "Лучший ход",
  "class.good": "Хороший",
  "class.inaccuracy": "Неточность",
  "class.mistake": "Ошибка",
  "class.blunder": "Зевок",
  "class.best.plural": "Лучшие ходы",
  "class.inaccuracy.plural": "Неточности",
  "class.mistake.plural": "Ошибки",
  "class.blunder.plural": "Зевки",

  "review.title": "Разбор партии",
  "review.intro":
    "Пусть движок пройдёт партию ход за ходом: зевки, упущенные победы и ходы, которые были бы сильнее.",
  "review.start": "Разобрать партию",
  "review.analysing": "Анализ… позиций: {done} / {total}",
  "review.stop": "Стоп",
  "review.remaining.one": "Проанализировать оставшуюся {n} позицию",
  "review.remaining.few": "Проанализировать оставшиеся {n} позиции",
  "review.remaining.many": "Проанализировать оставшиеся {n} позиций",
  "review.remaining.other": "Проанализировать оставшиеся {n} позиции",
  "review.you": "Вы",
  "review.accuracy": "Точность",
  "review.footnote":
    "Щёлкните по графику или ходу, чтобы увидеть оценку движка.",
  "review.graph": "График оценки. Светлая область — шансы Слоновой кости.",
  "review.byYou": "Ваш ход",
  "review.byThem": "Ход: {name}",
  "review.eval": "Оценка за Слоновую кость: {before} → {after}",
  "review.agrees": "Движок согласен.",
  "review.asGood": "Не хуже выбора движка.",
  "review.better": "Сильнее было {move}.",
  "review.showBest": "Показать {move} на доске",
  "review.backToPlayed": "Вернуться к сыгранному ходу",

  "level.1.name": "Аладдин",
  "level.1.title": "Уличный мальчишка",
  "level.1.desc":
    "Паренёк из городских переулков, который только что выучил ходы.",
  "level.2.name": "Масрур",
  "level.2.title": "Меченосец",
  "level.2.desc": "Верный палач халифа. Смел, но за доской беспечен.",
  "level.3.name": "Джафар",
  "level.3.title": "Визирь",
  "level.3.desc": "Мудрый визирь из рода Бармакидов. Играет добротно.",
  "level.4.name": "Харун ар-Рашид",
  "level.4.title": "Халиф",
  "level.4.desc": "Сам повелитель правоверных, большой покровитель шатранджа.",
  "level.5.name": "Джинн",
  "level.5.title": "Дух лампы",
  "level.5.desc":
    "Создание из бездымного огня. Немногим смертным удаётся свести с ним вничью.",

  "piece.6.name": "Шах",
  "piece.6.meaning": "Король",
  "piece.6.move": "На одно поле в любом направлении.",
  "piece.2.name": "Ферзь",
  "piece.2.meaning": "Советник",
  "piece.2.move":
    "На одно поле по диагонали. Предок современного ферзя, сохранившего старое имя.",
  "piece.3.name": "Фил",
  "piece.3.meaning": "Слон",
  "piece.3.move":
    "Прыгает ровно на два поля по диагонали, перескакивая через любые фигуры. Отсюда и наш «слон».",
  "piece.4.name": "Фарас",
  "piece.4.meaning": "Конь",
  "piece.4.move": "Ходит как современный конь.",
  "piece.5.name": "Рух",
  "piece.5.meaning": "Колесница",
  "piece.5.move":
    "На любое расстояние по горизонтали или вертикали, как ладья.",
  "piece.1.name": "Байдак",
  "piece.1.meaning": "Пехотинец",
  "piece.1.move":
    "На одно поле вперёд (никогда на два), бьёт на одно поле наискосок вперёд. Превращается в ферзя.",

  "header.library": "Партии",
  "library.title": "Сохранённые партии",
  "library.desc":
    "Ваши партии автоматически сохраняются в этом браузере. Скачайте их в формате PGN, чтобы сохранить резервную копию или перенести на другое устройство.",
  "library.filter": "Показать",
  "library.filter.all": "Все",
  "library.filter.win": "Победы",
  "library.filter.loss": "Поражения",
  "library.filter.draw": "Ничьи",
  "library.noStorage":
    "Этот браузер не сохраняет данные (приватный режим?), поэтому партии пропадут, когда вы закроете страницу. Скачайте их в формате PGN.",
  "library.empty":
    "Партий пока нет. Сыгранные вами партии сохраняются здесь автоматически.",
  "library.vs": "против {name}",
  "library.result.win": "Победа",
  "library.result.loss": "Поражение",
  "library.result.draw": "Ничья",
  "library.result.unfinished": "Идёт",
  "library.open": "Открыть",
  "library.share": "Копировать ссылку",
  "library.download": "Скачать PGN",
  "library.delete": "Удалить",
  "library.deleteConfirm": "Удалить эту партию? Это действие нельзя отменить.",
  "library.copied": "Ссылка скопирована",
  "library.import": "Импорт PGN",
  "library.paste": "Вставить PGN",
  "library.paste.submit": "Импортировать",
  "library.exportAll": "Скачать все",
  "library.imported.one": "Импортирована {n} партия.",
  "library.imported.few": "Импортировано {n} партии.",
  "library.imported.many": "Импортировано {n} партий.",
  "library.imported.other": "Импортировано {n} партии.",
  "library.importFailed.one": "Не удалось прочитать {n} партию.",
  "library.importFailed.few": "Не удалось прочитать {n} партии.",
  "library.importFailed.many": "Не удалось прочитать {n} партий.",
  "library.importFailed.other": "Не удалось прочитать {n} партии.",
  "viewer.title": "Сохранённая партия",
  "viewer.shared": "Общая партия",
  "viewer.close": "Вернуться к своей партии",
  "viewer.save": "Сохранить в мои партии",
  "viewer.saved": "Сохранено в ваших партиях",
  "share.invalid": "Не удалось прочитать ссылку на партию.",
  "library.tag.imported": "Импортирована",
  "library.tag.shared": "Общая",
  "library.tag.current": "Текущая партия",
  "library.result.abandoned": "Не окончена",
  "library.emptyFilter": "Нет партий, подходящих под этот фильтр.",
  "library.noGames":
    "В этом тексте не найдено партий. Вставьте партию в формате PGN, например «1. e3 e6 2. Nf3 …».",
  "library.badMove":
    "Партия {index}: «{move}» на ходу {number} — недопустимый ход в шатрандже.",
  "library.importPartial.one":
    "Всё равно импортировать допустимые ходы {n} партии",
  "library.importPartial.few":
    "Всё равно импортировать допустимые ходы {n} партий",
  "library.importPartial.many":
    "Всё равно импортировать допустимые ходы {n} партий",
  "library.importPartial.other":
    "Всё равно импортировать допустимые ходы {n} партии",
  "viewer.continue": "Продолжить эту партию",
  "viewer.play": "Сыграть партию",
  "viewer.discardConfirm":
    "Покинуть эту общую партию, не сохранив её? Разбор будет потерян.",
  "status.viewerHelp": "Листайте партию клавишами ← → или по списку ходов.",
};
