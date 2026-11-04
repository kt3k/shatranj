/**
 * UI translations. Keys are shared by all languages; anything missing falls
 * back to English. Plural forms use `key.one` / `key.other` etc. as chosen by
 * Intl.PluralRules. Move notation (e4, Nf3…) is never translated.
 */

export type Lang = "en" | "ja" | "ar" | "fa";

export const LANGS: { code: Lang; name: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "ja", name: "日本語", dir: "ltr" },
  { code: "ar", name: "العربية", dir: "rtl" },
  { code: "fa", name: "فارسی", dir: "rtl" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "meta.title": "Shatranj — the chess of Abbasid Baghdad",
  "meta.description":
    "Play shatranj, the medieval chess of the Abbasid court, against the computer. Five opponents from the Arabian Nights, from Aladdin to the Jinn.",
  "brand.primary": "Shatranj",
  "brand.secondary": "شطرنج",
  "header.tagline": "The game of the Abbasid court · Baghdad, 9th century",
  "header.rules": "Rules",
  "header.theme": "Toggle dark mode",
  "header.language": "Language",
  "board.aria":
    "Shatranj board. Use arrow keys to move the cursor and Enter to pick up or place a piece.",
  "square.piece": "{square} {side} {piece}",
  "board.reviewing": "Reviewing",

  "side.ivory": "Ivory",
  "side.ebony": "Ebony",
  "side.ivory.lower": "ivory",
  "side.ebony.lower": "ebony",

  "btn.undo": "Undo",
  "btn.undo.title": "Take back your last move (U)",
  "btn.hint": "Hint",
  "btn.hint.title": "Suggest a move (H)",
  "btn.flip": "Flip",
  "btn.flip.title": "Flip the board (F)",
  "btn.newGame": "New game",
  "btn.playAgain": "Play again",
  "btn.cancel": "Cancel",
  "btn.begin": "Begin",
  "btn.close": "Close dialog",
  "btn.returnToBoard": "Return to the board",
  "btn.viewBoard": "View the board",
  "btn.changeOpponent": "Change opponent",
  "btn.reviewGame": "Review game",

  "status.yourMove": "Your move",
  "status.check": "Shāh! Your king is in check",
  "status.check.detail":
    "Move your king to safety, block, or capture the attacker.",
  "status.selected": "Choose a highlighted square, or pick another piece.",
  "status.pickUp.ivory": "Pick up one of your ivory pieces — click or drag.",
  "status.pickUp.ebony": "Pick up one of your ebony pieces — click or drag.",
  "status.thinking": "{name} is thinking…",
  "status.hintThinking": "Consulting the treatises…",
  "status.hintThinking.detail": "Searching for a good move for you.",
  "status.hint": "Hint: {move}",
  "status.hint.detail":
    "The arrow shows the suggested move. Play it, or choose your own.",
  "status.draw": "Drawn game",
  "status.victory": "Victory!",
  "status.defeat": "Defeat",
  "status.reviewStart": "Reviewing the starting position",
  "status.reviewMove": "Reviewing move {move}",
  "status.reviewHelp":
    "Use ← → or the move list to step through the game. Press End to return.",

  "reason.checkmate": "Shāh māt — the king is helpless.",
  "reason.stalemate":
    "Stalemate — in shatranj, a king with no move is defeated.",
  "reason.bare-king": "Bare king — the shāh stands alone on the field.",
  "reason.draw-bare": "Both kings were stripped bare. The game is drawn.",
  "reason.repetition":
    "The same position arose three times. The game is drawn.",
  "reason.move-limit":
    "Seventy moves passed without progress. The game is drawn.",

  "result.draw": "A drawn game",
  "result.win": "You are victorious",
  "result.lose": "{name} prevails",
  "result.detail.one": "{text} ({n} move)",
  "result.detail.other": "{text} ({n} moves)",

  "moves.title": "Moves",
  "moves.count.one": "{n} move",
  "moves.count.other": "{n} moves",
  "moves.empty": "No moves yet.",
  "moves.aria": "Show position after {move}",
  "nav.first": "First position (Home)",
  "nav.prev": "Previous move (←)",
  "nav.next": "Next move (→)",
  "nav.last": "Latest move (End)",
  "nav.review": "Review",
  "nav.review.title": "Analyse the game so far",
  "nav.live": "Back to game",

  "player.you": "You",
  "player.level": "Level {n}",
  "player.thinking": "thinking",
  "player.toMove": "{side} — to move",

  "opponent.label": "Your opponent",
  "opponent.levelOf": "Level {n} of {total}",
  "level.strength": "Strength {n} of {total}",

  "newGame.title": "A new game",
  "newGame.desc": "Choose your opponent from the Arabian Nights.",
  "newGame.opponent": "Opponent",
  "newGame.playAs": "Play as",
  "newGame.random": "Random",
  "newGame.ivoryFirst": "Ivory moves first.",

  "rules.title": "The rules of shatranj",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "Played on the same 8×8 board as chess, with older, gentler pieces.",
  "rules.list":
    `<li><strong>Shāh māt</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — “the king is helpless”: checkmate wins.</li>
     <li><strong>Stalemate wins</strong> for the player who leaves the opponent without a legal move.</li>
     <li><strong>Bare king</strong>: capturing all of the opponent’s pieces except the king wins — unless they can bare your king straight back on the next move, which makes a draw.</li>
     <li>There is no castling, no double step for the baidaq, and no en passant.</li>
     <li>A baidaq reaching the last rank becomes a firzān.</li>
     <li>Threefold repetition, or 70 moves each without a capture or baidaq move, is a draw.</li>`,

  "footer.html":
    `Shatranj reached Baghdad from Persia and flourished at the court of the Abbasid caliphs, where masters such as al-ʿAdlī, ar-Rāzī and aṣ-Ṣūlī wrote the first treatises on the game.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> Madīnat as-Salām, the City of Peace`,

  "class.best": "Best move",
  "class.good": "Good",
  "class.inaccuracy": "Inaccuracy",
  "class.mistake": "Mistake",
  "class.blunder": "Blunder",
  "class.best.plural": "Best moves",
  "class.inaccuracy.plural": "Inaccuracies",
  "class.mistake.plural": "Mistakes",
  "class.blunder.plural": "Blunders",

  "review.title": "Game review",
  "review.intro":
    "Let the engine go over the game move by move: blunders, missed wins and the better moves you could have played.",
  "review.start": "Review this game",
  "review.analysing": "Analysing… {done} / {total} positions",
  "review.stop": "Stop",
  "review.remaining.one": "Analyse the remaining position",
  "review.remaining.other": "Analyse the remaining {n} positions",
  "review.you": "You",
  "review.accuracy": "Accuracy",
  "review.footnote":
    "Click the graph or a move to see what the engine thought.",
  "review.graph": "Evaluation graph. The ivory area shows Ivory's chances.",
  "review.byYou": "Your move",
  "review.byThem": "{name}'s move",
  "review.eval": "Evaluation for Ivory {before} → {after}",
  "review.agrees": "The engine agrees.",
  "review.asGood": "As good as the engine's choice.",
  "review.better": "Better was {move}.",
  "review.showBest": "Show {move} on the board",
  "review.backToPlayed": "Back to the move played",

  "level.1.name": "Aladdin",
  "level.1.title": "The Street Urchin",
  "level.1.desc":
    "A lad from the alleys of the city who just learned the moves.",
  "level.2.name": "Masrūr",
  "level.2.title": "The Sword-bearer",
  "level.2.desc":
    "The caliph's loyal executioner. Bold, but careless at the board.",
  "level.3.name": "Jaʿfar",
  "level.3.title": "The Vizier",
  "level.3.desc": "The clever vizier of the Barmakids. Plays a sound game.",
  "level.4.name": "Hārūn al-Rashīd",
  "level.4.title": "The Caliph",
  "level.4.desc":
    "The Commander of the Faithful himself, a keen patron of shatranj.",
  "level.5.name": "Jinn",
  "level.5.title": "The Spirit of the Lamp",
  "level.5.desc": "A being of smokeless fire. Few mortals can hold a draw.",

  "piece.6.name": "Shāh",
  "piece.6.meaning": "King",
  "piece.6.move": "One square in any direction.",
  "piece.2.name": "Firzān",
  "piece.2.meaning": "Counsellor",
  "piece.2.move": "One square diagonally. The ancestor of the queen.",
  "piece.3.name": "Fīl",
  "piece.3.meaning": "Elephant",
  "piece.3.move":
    "Leaps exactly two squares diagonally, jumping over anything between.",
  "piece.4.name": "Faras",
  "piece.4.meaning": "Horse",
  "piece.4.move": "Moves like a modern knight.",
  "piece.5.name": "Rukh",
  "piece.5.meaning": "Chariot",
  "piece.5.move": "Any distance along a rank or file, like a rook.",
  "piece.1.name": "Baidaq",
  "piece.1.meaning": "Foot soldier",
  "piece.1.move":
    "One square forward (never two), captures one square diagonally forward. Promotes to a firzān.",
};

const ja: Dict = {
  "meta.title": "シャトランジ — アッバース朝バグダードのチェス",
  "meta.description":
    "アッバース朝の宮廷で愛された中世のチェス「シャトランジ」をコンピューターと対戦。千夜一夜物語の5人の相手、アラジンからジンまで。",
  "brand.primary": "シャトランジ",
  "brand.secondary": "شطرنج",
  "header.tagline": "アッバース朝宮廷の遊戯 · 9世紀バグダード",
  "header.rules": "ルール",
  "header.theme": "ダークモード切替",
  "header.language": "言語",
  "board.aria":
    "シャトランジの盤。矢印キーでカーソルを動かし、Enter で駒を持ち上げる・置く。",
  "square.piece": "{square} {side}の{piece}",
  "board.reviewing": "振り返り中",

  "side.ivory": "象牙",
  "side.ebony": "黒檀",
  "side.ivory.lower": "象牙",
  "side.ebony.lower": "黒檀",

  "btn.undo": "待った",
  "btn.undo.title": "直前の自分の手を取り消す (U)",
  "btn.hint": "ヒント",
  "btn.hint.title": "手を提案する (H)",
  "btn.flip": "反転",
  "btn.flip.title": "盤を反転する (F)",
  "btn.newGame": "新しい対局",
  "btn.playAgain": "もう一局",
  "btn.cancel": "キャンセル",
  "btn.begin": "開始",
  "btn.close": "閉じる",
  "btn.returnToBoard": "盤に戻る",
  "btn.viewBoard": "盤面を見る",
  "btn.changeOpponent": "相手を変える",
  "btn.reviewGame": "対局を振り返る",

  "status.yourMove": "あなたの番です",
  "status.check": "シャー！王手です",
  "status.check.detail":
    "王を逃がすか、間に駒を入れるか、王手をかけている駒を取ってください。",
  "status.selected": "ハイライトされたマスを選ぶか、別の駒を選んでください。",
  "status.pickUp.ivory": "象牙の駒を選んでください（クリックまたはドラッグ）。",
  "status.pickUp.ebony": "黒檀の駒を選んでください（クリックまたはドラッグ）。",
  "status.thinking": "{name}が考えています…",
  "status.hintThinking": "古の指南書をひもといています…",
  "status.hintThinking.detail": "あなたのための良い手を探しています。",
  "status.hint": "ヒント: {move}",
  "status.hint.detail":
    "矢印が提案された手です。指してもいいし、自分の手を選んでもかまいません。",
  "status.draw": "引き分け",
  "status.victory": "勝利！",
  "status.defeat": "敗北",
  "status.reviewStart": "初期局面を表示中",
  "status.reviewMove": "{move} の局面を表示中",
  "status.reviewHelp":
    "← → キーか棋譜で手順をたどれます。End キーで現在の局面に戻ります。",

  "reason.checkmate": "シャー・マート — 王は手詰まり（詰み）。",
  "reason.stalemate":
    "ステイルメイト — シャトランジでは、動けなくなった王は負けです。",
  "reason.bare-king": "裸の王 — シャーは盤上にただ一人。",
  "reason.draw-bare": "両者とも王だけになりました。引き分けです。",
  "reason.repetition": "同じ局面が3回現れました。引き分けです。",
  "reason.move-limit": "70手のあいだ進展がありませんでした。引き分けです。",

  "result.draw": "引き分け",
  "result.win": "あなたの勝利です",
  "result.lose": "{name}の勝ち",
  "result.detail.other": "{text}（{n}手）",

  "moves.title": "棋譜",
  "moves.count.other": "{n}手",
  "moves.empty": "まだ指されていません。",
  "moves.aria": "{move} の後の局面を表示",
  "nav.first": "初期局面 (Home)",
  "nav.prev": "前の手 (←)",
  "nav.next": "次の手 (→)",
  "nav.last": "最新の手 (End)",
  "nav.review": "振り返り",
  "nav.review.title": "ここまでの対局を解析する",
  "nav.live": "対局に戻る",

  "player.you": "あなた",
  "player.level": "レベル {n}",
  "player.thinking": "思考中",
  "player.toMove": "{side} — 手番",

  "opponent.label": "対戦相手",
  "opponent.levelOf": "レベル {n} / {total}",
  "level.strength": "強さ {n} / {total}",

  "newGame.title": "新しい対局",
  "newGame.desc": "千夜一夜物語の中から対戦相手を選んでください。",
  "newGame.opponent": "対戦相手",
  "newGame.playAs": "あなたの駒",
  "newGame.random": "ランダム",
  "newGame.ivoryFirst": "象牙が先手です。",

  "rules.title": "シャトランジのルール",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc":
    "チェスと同じ 8×8 の盤で、より古く、穏やかな駒を使って指します。",
  "rules.list":
    `<li><strong>シャー・マート</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> —「王は手詰まり」。詰ませれば勝ち。チェックメイトの語源です。</li>
     <li><strong>ステイルメイトも勝ち</strong>。相手を合法手のない状態にした側の勝ちです。</li>
     <li><strong>裸の王</strong>：相手の王以外の駒をすべて取れば勝ち。ただし、相手が次の一手でこちらも裸の王にできる場合は引き分けです。</li>
     <li>キャスリング、バイダクの2マス前進、アンパッサンはありません。</li>
     <li>最奥の段に達したバイダクはフィルザーンに成ります。</li>
     <li>同一局面の3回出現、または双方70手のあいだ駒取りもバイダクの前進もない場合は引き分けです。</li>`,

  "footer.html":
    `シャトランジはペルシアからバグダードに伝わり、アッバース朝カリフの宮廷で花開きました。アドリー、ラーズィー、スーリーといった名手が、この遊戯について最初の指南書を著しています。<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> マディーナ・アッサラーム — 平安の都`,

  "class.best": "最善手",
  "class.good": "好手",
  "class.inaccuracy": "疑問手",
  "class.mistake": "悪手",
  "class.blunder": "大悪手",
  "class.best.plural": "最善手",
  "class.inaccuracy.plural": "疑問手",
  "class.mistake.plural": "悪手",
  "class.blunder.plural": "大悪手",

  "review.title": "対局の振り返り",
  "review.intro":
    "エンジンが一手ずつ検討します。大悪手、見逃した勝ち筋、より良かった手がわかります。",
  "review.start": "この対局を振り返る",
  "review.analysing": "解析中… {done} / {total} 局面",
  "review.stop": "停止",
  "review.remaining.other": "残り {n} 局面を解析する",
  "review.you": "あなた",
  "review.accuracy": "正確さ",
  "review.footnote":
    "グラフや棋譜の手をクリックすると、エンジンの評価が見られます。",
  "review.graph": "形勢グラフ。象牙色の領域が象牙側の勝ちやすさを表します。",
  "review.byYou": "あなたの手",
  "review.byThem": "{name}の手",
  "review.eval": "評価値（象牙側から） {before} → {after}",
  "review.agrees": "エンジンも同じ手を選びました。",
  "review.asGood": "エンジンの手と同等に良い手です。",
  "review.better": "{move} の方が良い手でした。",
  "review.showBest": "{move} を盤上に表示",
  "review.backToPlayed": "実際の手に戻る",

  "level.1.name": "アラジン",
  "level.1.title": "路地の少年",
  "level.1.desc": "都の路地裏育ち。駒の動かし方を覚えたばかり。",
  "level.2.name": "マスルール",
  "level.2.title": "カリフの剣持ち",
  "level.2.desc": "カリフに忠実な処刑人。大胆だが、盤上では詰めが甘い。",
  "level.3.name": "ジャアファル",
  "level.3.title": "宰相",
  "level.3.desc": "バルマク家出身の切れ者の宰相。堅実な指し回し。",
  "level.4.name": "ハールーン・アッラシード",
  "level.4.title": "カリフ",
  "level.4.desc": "信徒の長その人。シャトランジの熱心な庇護者。",
  "level.5.name": "ジン",
  "level.5.title": "ランプの精",
  "level.5.desc":
    "煙なき火から生まれた存在。引き分けに持ち込める人間すらまれ。",

  "piece.6.name": "シャー",
  "piece.6.meaning": "王",
  "piece.6.move": "どの方向にも1マス動けます。",
  "piece.2.name": "フィルザーン",
  "piece.2.meaning": "参謀",
  "piece.2.move": "斜めに1マス動きます。クイーンの祖先です。",
  "piece.3.name": "フィール",
  "piece.3.meaning": "象",
  "piece.3.move": "斜めにちょうど2マス跳びます。間にある駒は飛び越せます。",
  "piece.4.name": "ファラス",
  "piece.4.meaning": "馬",
  "piece.4.move": "チェスのナイトと同じ動きです。",
  "piece.5.name": "ルフ",
  "piece.5.meaning": "戦車",
  "piece.5.move": "縦横に何マスでも動けます（ルークと同じ）。",
  "piece.1.name": "バイダク",
  "piece.1.meaning": "歩兵",
  "piece.1.move":
    "前に1マス進み（2マス進むことはできません）、斜め前の駒を取ります。最奥の段でフィルザーンに成ります。",
};

const ar: Dict = {
  "meta.title": "الشطرنج — لعبة بغداد العباسية",
  "meta.description":
    "العب الشطرنج القديم، لعبة البلاط العباسي، ضد الحاسوب. خمسة خصوم من ألف ليلة وليلة، من علاء الدين إلى الجنّي.",
  "brand.primary": "شطرنج",
  "brand.secondary": "Shatranj",
  "header.tagline": "لعبة البلاط العباسي · بغداد، القرن التاسع",
  "header.rules": "القواعد",
  "header.theme": "تبديل الوضع الداكن",
  "header.language": "اللغة",
  "board.aria":
    "رقعة الشطرنج. استخدم مفاتيح الأسهم لتحريك المؤشر، و Enter لرفع القطعة أو وضعها.",
  "square.piece": "{square} {piece} {side}",
  "board.reviewing": "مراجعة",

  "side.ivory": "العاج",
  "side.ebony": "الأبنوس",
  "side.ivory.lower": "العاجية",
  "side.ebony.lower": "الأبنوسية",

  "btn.undo": "تراجع",
  "btn.undo.title": "استرجع نقلتك الأخيرة (U)",
  "btn.hint": "تلميح",
  "btn.hint.title": "اقترح نقلة (H)",
  "btn.flip": "اقلب",
  "btn.flip.title": "اقلب الرقعة (F)",
  "btn.newGame": "دور جديد",
  "btn.playAgain": "العب مجددًا",
  "btn.cancel": "إلغاء",
  "btn.begin": "ابدأ",
  "btn.close": "إغلاق",
  "btn.returnToBoard": "العودة إلى الرقعة",
  "btn.viewBoard": "عرض الرقعة",
  "btn.changeOpponent": "غيّر الخصم",
  "btn.reviewGame": "راجع الدور",

  "status.yourMove": "دورك",
  "status.check": "شاه! ملكك مهدَّد",
  "status.check.detail":
    "انقل ملكك إلى مأمن، أو اعترض الهجوم، أو اقتنص القطعة المهاجِمة.",
  "status.selected": "اختر خانة مضيئة، أو اختر قطعة أخرى.",
  "status.pickUp.ivory": "اختر إحدى قطعك العاجية — بالنقر أو السحب.",
  "status.pickUp.ebony": "اختر إحدى قطعك الأبنوسية — بالنقر أو السحب.",
  "status.thinking": "{name} يفكّر…",
  "status.hintThinking": "نستشير كتب المنصوبات…",
  "status.hintThinking.detail": "نبحث لك عن نقلة جيدة.",
  "status.hint": "تلميح: {move}",
  "status.hint.detail": "يشير السهم إلى النقلة المقترحة. العبها أو اختر نقلتك.",
  "status.draw": "تعادل",
  "status.victory": "نصر!",
  "status.defeat": "هزيمة",
  "status.reviewStart": "مراجعة وضع البداية",
  "status.reviewMove": "مراجعة النقلة {move}",
  "status.reviewHelp":
    "استخدم ← → أو قائمة النقلات للتنقل في الدور. اضغط End للعودة.",

  "reason.checkmate": "شاه مات — الملك لا حيلة له.",
  "reason.stalemate":
    "الملك المحصور — في الشطرنج القديم يُهزم الملك الذي لا نقلة له.",
  "reason.bare-king": "الملك المجرَّد — بقي الشاه وحيدًا في الميدان.",
  "reason.draw-bare": "جُرِّد الملكان كلاهما. الدور تعادل.",
  "reason.repetition": "تكرر الوضع نفسه ثلاث مرات. الدور تعادل.",
  "reason.move-limit": "مضت سبعون نقلة بلا تقدّم. الدور تعادل.",

  "result.draw": "انتهى الدور بالتعادل",
  "result.win": "لقد انتصرت",
  "result.lose": "فاز {name}",
  "result.detail.other": "{text} ({n} نقلة)",

  "moves.title": "النقلات",
  "moves.count.other": "{n} نقلة",
  "moves.empty": "لا نقلات بعد.",
  "moves.aria": "اعرض الوضع بعد {move}",
  "nav.first": "وضع البداية (Home)",
  "nav.prev": "النقلة السابقة (←)",
  "nav.next": "النقلة التالية (→)",
  "nav.last": "آخر نقلة (End)",
  "nav.review": "مراجعة",
  "nav.review.title": "حلّل الدور حتى الآن",
  "nav.live": "العودة إلى الدور",

  "player.you": "أنت",
  "player.level": "المستوى {n}",
  "player.thinking": "يفكّر",
  "player.toMove": "{side} — الدور له",

  "opponent.label": "خصمك",
  "opponent.levelOf": "المستوى {n} من {total}",
  "level.strength": "القوة {n} من {total}",

  "newGame.title": "دور جديد",
  "newGame.desc": "اختر خصمك من حكايات ألف ليلة وليلة.",
  "newGame.opponent": "الخصم",
  "newGame.playAs": "العب بـ",
  "newGame.random": "عشوائي",
  "newGame.ivoryFirst": "العاج يبدأ أولًا.",

  "rules.title": "قواعد الشطرنج",
  "rules.subtitle": "",
  "rules.desc": "تُلعب على رقعة ٨×٨ كالشطرنج الحديث، بقطع أقدم وأهدأ.",
  "rules.list":
    `<li><strong>شاه مات</strong> — «الملك لا حيلة له»: من يُميت الشاه يفوز.</li>
     <li><strong>حصر الملك فوز</strong> للاعب الذي يترك خصمه بلا نقلة مشروعة.</li>
     <li><strong>الملك المجرَّد</strong>: من يأسر جميع قطع خصمه عدا الملك يفوز — إلا إذا استطاع الخصم أن يجرّد ملكك في النقلة التالية، فيكون الدور تعادلًا.</li>
     <li>لا تبييت، ولا خطوتين للبيدق، ولا أخذ بالمرور.</li>
     <li>البيدق الذي يبلغ الصف الأخير يصير فرزانًا.</li>
     <li>تكرار الوضع ثلاث مرات، أو سبعون نقلة لكلٍّ بلا أسر ولا تقدّم بيدق، يعني التعادل.</li>`,

  "footer.html":
    `وصل الشطرنج إلى بغداد من فارس وازدهر في بلاط الخلفاء العباسيين، حيث ألّف أساتذة مثل العدلي والرازي والصولي أولى الكتب في هذه اللعبة.<br/>
     <span class="font-arabic text-sm text-gold">مدينة السلام</span>`,

  "class.best": "أفضل نقلة",
  "class.good": "جيدة",
  "class.inaccuracy": "غير دقيقة",
  "class.mistake": "خطأ",
  "class.blunder": "خطأ فادح",
  "class.best.plural": "أفضل النقلات",
  "class.inaccuracy.plural": "نقلات غير دقيقة",
  "class.mistake.plural": "أخطاء",
  "class.blunder.plural": "أخطاء فادحة",

  "review.title": "مراجعة الدور",
  "review.intro":
    "دع المحرّك يراجع الدور نقلةً نقلة: الأخطاء الفادحة، والانتصارات الضائعة، والنقلات الأفضل التي كان يمكنك لعبها.",
  "review.start": "راجع هذا الدور",
  "review.analysing": "جارٍ التحليل… {done} / {total} وضعًا",
  "review.stop": "إيقاف",
  "review.remaining.other": "حلّل الأوضاع المتبقية ({n})",
  "review.you": "أنت",
  "review.accuracy": "الدقة",
  "review.footnote": "انقر على المنحنى أو على نقلة لترى رأي المحرّك.",
  "review.graph": "منحنى التقييم. تمثل المنطقة العاجية فرص العاج.",
  "review.byYou": "نقلتك",
  "review.byThem": "نقلة {name}",
  "review.eval": "التقييم لصالح العاج {before} ← {after}",
  "review.agrees": "المحرّك يوافقك.",
  "review.asGood": "جيدة كاختيار المحرّك.",
  "review.better": "الأفضل كان {move}.",
  "review.showBest": "اعرض {move} على الرقعة",
  "review.backToPlayed": "العودة إلى النقلة الملعوبة",

  "level.1.name": "علاء الدين",
  "level.1.title": "فتى الأزقّة",
  "level.1.desc": "فتى من أزقّة المدينة تعلّم النقلات للتو.",
  "level.2.name": "مسرور",
  "level.2.title": "سيّاف الخليفة",
  "level.2.desc": "سيّاف الخليفة الوفي. جسور، لكنه متهوّر على الرقعة.",
  "level.3.name": "جعفر",
  "level.3.title": "الوزير",
  "level.3.desc": "الوزير البرمكي الداهية. يلعب لعبًا متينًا.",
  "level.4.name": "هارون الرشيد",
  "level.4.title": "الخليفة",
  "level.4.desc": "أمير المؤمنين نفسه، راعي الشطرنج الشغوف.",
  "level.5.name": "الجنّي",
  "level.5.title": "مارد المصباح",
  "level.5.desc": "مخلوق من مارجٍ من نار. قليلٌ من البشر من يدرك معه التعادل.",

  "piece.6.name": "الشاه",
  "piece.6.meaning": "الملك",
  "piece.6.move": "خانة واحدة في أي اتجاه.",
  "piece.2.name": "الفرزان",
  "piece.2.meaning": "الوزير",
  "piece.2.move": "خانة واحدة قُطريًا. وهو جدّ الملكة الحديثة.",
  "piece.3.name": "الفيل",
  "piece.3.meaning": "",
  "piece.3.move": "يقفز خانتين قُطريًا بالضبط، متخطيًا ما بينهما.",
  "piece.4.name": "الفرس",
  "piece.4.meaning": "",
  "piece.4.move": "يتحرك كالحصان في الشطرنج الحديث.",
  "piece.5.name": "الرخ",
  "piece.5.meaning": "",
  "piece.5.move": "أي عدد من الخانات أفقيًا أو عموديًا.",
  "piece.1.name": "البيدق",
  "piece.1.meaning": "الجندي",
  "piece.1.move":
    "خانة واحدة إلى الأمام (لا خانتين أبدًا)، ويأسر خانة قُطرية إلى الأمام. يُرقّى إلى فرزان.",
};

const fa: Dict = {
  "meta.title": "شطرنج — بازی بغداد عباسی",
  "meta.description":
    "شطرنج کهن، بازی دربار عباسی، را با رایانه بازی کنید. پنج حریف از هزار و یک شب، از علاءالدین تا جن.",
  "brand.primary": "شطرنج",
  "brand.secondary": "Shatranj",
  "header.tagline": "بازی دربار عباسی · بغداد، سدهٔ سوم هجری",
  "header.rules": "قواعد",
  "header.theme": "تغییر حالت تیره",
  "header.language": "زبان",
  "board.aria":
    "صفحهٔ شطرنج. با کلیدهای جهت‌نما مکان‌نما را جابه‌جا کنید و با Enter مهره را بردارید یا بگذارید.",
  "square.piece": "{square} {piece} {side}",
  "board.reviewing": "بازبینی",

  "side.ivory": "عاج",
  "side.ebony": "آبنوس",
  "side.ivory.lower": "عاجی",
  "side.ebony.lower": "آبنوسی",

  "btn.undo": "برگردان",
  "btn.undo.title": "حرکت آخرتان را پس بگیرید (U)",
  "btn.hint": "راهنما",
  "btn.hint.title": "یک حرکت پیشنهاد بده (H)",
  "btn.flip": "چرخاندن",
  "btn.flip.title": "صفحه را بچرخان (F)",
  "btn.newGame": "بازی تازه",
  "btn.playAgain": "دوباره بازی کن",
  "btn.cancel": "انصراف",
  "btn.begin": "آغاز",
  "btn.close": "بستن",
  "btn.returnToBoard": "بازگشت به صفحه",
  "btn.viewBoard": "دیدن صفحه",
  "btn.changeOpponent": "تغییر حریف",
  "btn.reviewGame": "بازبینی بازی",

  "status.yourMove": "نوبت شماست",
  "status.check": "کیش! شاه شما در خطر است",
  "status.check.detail":
    "شاه را به جای امن ببرید، راه را ببندید یا مهرهٔ مهاجم را بزنید.",
  "status.selected":
    "یکی از خانه‌های روشن را انتخاب کنید، یا مهرهٔ دیگری بردارید.",
  "status.pickUp.ivory":
    "یکی از مهره‌های عاجی خود را بردارید — با کلیک یا کشیدن.",
  "status.pickUp.ebony":
    "یکی از مهره‌های آبنوسی خود را بردارید — با کلیک یا کشیدن.",
  "status.thinking": "{name} در حال فکر کردن است…",
  "status.hintThinking": "در کتاب‌های منصوبات جست‌وجو می‌کنیم…",
  "status.hintThinking.detail": "دنبال حرکتی خوب برای شما هستیم.",
  "status.hint": "راهنما: {move}",
  "status.hint.detail":
    "پیکان حرکت پیشنهادی را نشان می‌دهد. آن را بازی کنید یا حرکت خودتان را برگزینید.",
  "status.draw": "مساوی",
  "status.victory": "پیروزی!",
  "status.defeat": "شکست",
  "status.reviewStart": "بازبینی وضعیت آغازین",
  "status.reviewMove": "بازبینی حرکت {move}",
  "status.reviewHelp":
    "با ← → یا فهرست حرکت‌ها در بازی جابه‌جا شوید. برای بازگشت End را بزنید.",

  "reason.checkmate": "شاه مات — شاه درمانده است.",
  "reason.stalemate": "پات — در شطرنج کهن، شاهی که حرکتی ندارد شکست خورده است.",
  "reason.bare-king": "شاه تنها — شاه یکه و تنها در میدان مانده است.",
  "reason.draw-bare": "هر دو شاه تنها ماندند. بازی مساوی است.",
  "reason.repetition": "یک وضعیت سه بار تکرار شد. بازی مساوی است.",
  "reason.move-limit": "هفتاد حرکت بی‌پیشرفت گذشت. بازی مساوی است.",

  "result.draw": "بازی مساوی شد",
  "result.win": "شما پیروز شدید",
  "result.lose": "{name} پیروز شد",
  "result.detail.other": "{text} ({n} حرکت)",

  "moves.title": "حرکت‌ها",
  "moves.count.other": "{n} حرکت",
  "moves.empty": "هنوز حرکتی انجام نشده است.",
  "moves.aria": "نمایش وضعیت پس از {move}",
  "nav.first": "وضعیت آغازین (Home)",
  "nav.prev": "حرکت قبلی (←)",
  "nav.next": "حرکت بعدی (→)",
  "nav.last": "آخرین حرکت (End)",
  "nav.review": "بازبینی",
  "nav.review.title": "بازی را تا اینجا تحلیل کن",
  "nav.live": "بازگشت به بازی",

  "player.you": "شما",
  "player.level": "سطح {n}",
  "player.thinking": "در حال فکر",
  "player.toMove": "{side} — نوبت حرکت",

  "opponent.label": "حریف شما",
  "opponent.levelOf": "سطح {n} از {total}",
  "level.strength": "قدرت {n} از {total}",

  "newGame.title": "بازی تازه",
  "newGame.desc": "حریف خود را از قصه‌های هزار و یک شب برگزینید.",
  "newGame.opponent": "حریف",
  "newGame.playAs": "بازی با",
  "newGame.random": "تصادفی",
  "newGame.ivoryFirst": "عاج نخست حرکت می‌کند.",

  "rules.title": "قواعد شطرنج کهن",
  "rules.subtitle": "",
  "rules.desc":
    "روی همان صفحهٔ ۸×۸ شطرنج امروزی، با مهره‌هایی کهن‌تر و آرام‌تر بازی می‌شود.",
  "rules.list":
    `<li><strong>شاه مات</strong> — «شاه درمانده است»: مات کردن یعنی پیروزی.</li>
     <li><strong>پات هم پیروزی است</strong> برای بازیکنی که حریف را بی هیچ حرکت مجازی رها کند.</li>
     <li><strong>شاه تنها</strong>: زدن همهٔ مهره‌های حریف جز شاه یعنی پیروزی — مگر آنکه حریف بتواند در حرکت بعد شاه شما را هم تنها کند؛ در این صورت بازی مساوی است.</li>
     <li>قلعه، حرکت دوخانه‌ای پیاده و آن‌پاسان وجود ندارد.</li>
     <li>پیاده‌ای که به ردیف آخر برسد فرزین می‌شود.</li>
     <li>تکرار سه‌بارهٔ یک وضعیت، یا هفتاد حرکت برای هر طرف بدون زدن مهره یا پیشروی پیاده، یعنی مساوی.</li>`,

  "footer.html":
    `شطرنج از ایران به بغداد رسید و در دربار خلفای عباسی شکوفا شد؛ استادانی چون عدلی، رازی و صولی نخستین کتاب‌ها را دربارهٔ این بازی نوشتند.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> شهر صلح`,

  "class.best": "بهترین حرکت",
  "class.good": "خوب",
  "class.inaccuracy": "نادقیق",
  "class.mistake": "اشتباه",
  "class.blunder": "اشتباه فاحش",
  "class.best.plural": "بهترین حرکت‌ها",
  "class.inaccuracy.plural": "حرکت‌های نادقیق",
  "class.mistake.plural": "اشتباه‌ها",
  "class.blunder.plural": "اشتباه‌های فاحش",

  "review.title": "بازبینی بازی",
  "review.intro":
    "بگذارید موتور بازی را حرکت به حرکت مرور کند: اشتباه‌های فاحش، بردهای از دست رفته و حرکت‌های بهتری که می‌توانستید بازی کنید.",
  "review.start": "این بازی را بازبینی کن",
  "review.analysing": "در حال تحلیل… {done} / {total} وضعیت",
  "review.stop": "توقف",
  "review.remaining.other": "تحلیل {n} وضعیت باقی‌مانده",
  "review.you": "شما",
  "review.accuracy": "دقت",
  "review.footnote": "روی نمودار یا یک حرکت کلیک کنید تا نظر موتور را ببینید.",
  "review.graph": "نمودار ارزیابی. ناحیهٔ عاجی شانس عاج را نشان می‌دهد.",
  "review.byYou": "حرکت شما",
  "review.byThem": "حرکت {name}",
  "review.eval": "ارزیابی به سود عاج {before} ← {after}",
  "review.agrees": "موتور هم همین را بازی می‌کرد.",
  "review.asGood": "به خوبیِ انتخاب موتور.",
  "review.better": "بهتر بود {move} بازی شود.",
  "review.showBest": "نمایش {move} روی صفحه",
  "review.backToPlayed": "بازگشت به حرکت انجام‌شده",

  "level.1.name": "علاءالدین",
  "level.1.title": "پسرک کوچه‌ها",
  "level.1.desc": "پسرکی از کوچه‌های شهر که تازه حرکت مهره‌ها را آموخته است.",
  "level.2.name": "مسرور",
  "level.2.title": "شمشیردار خلیفه",
  "level.2.desc": "جلاد وفادار خلیفه. بی‌باک، اما روی صفحه بی‌احتیاط.",
  "level.3.name": "جعفر",
  "level.3.title": "وزیر",
  "level.3.desc": "وزیر زیرک برمکی. بازی‌اش استوار است.",
  "level.4.name": "هارون‌الرشید",
  "level.4.title": "خلیفه",
  "level.4.desc": "خودِ امیرالمؤمنین، حامی پرشور شطرنج.",
  "level.5.name": "جن",
  "level.5.title": "جن چراغ",
  "level.5.desc": "آفریده‌ای از آتش بی‌دود. کمتر آدمی‌زادی با او مساوی می‌کند.",

  "piece.6.name": "شاه",
  "piece.6.meaning": "",
  "piece.6.move": "یک خانه در هر جهت.",
  "piece.2.name": "فرزین",
  "piece.2.meaning": "وزیر",
  "piece.2.move": "یک خانه به‌طور مورب. نیای وزیر امروزی است.",
  "piece.3.name": "پیل",
  "piece.3.meaning": "فیل",
  "piece.3.move": "دقیقاً دو خانه مورب می‌جهد و از روی هر مهره‌ای می‌پرد.",
  "piece.4.name": "اسب",
  "piece.4.meaning": "",
  "piece.4.move": "مانند اسب شطرنج امروزی حرکت می‌کند.",
  "piece.5.name": "رخ",
  "piece.5.meaning": "",
  "piece.5.move": "هر تعداد خانه در امتداد ردیف یا ستون.",
  "piece.1.name": "پیاده",
  "piece.1.meaning": "سرباز",
  "piece.1.move":
    "یک خانه به جلو (هرگز دو خانه)، و یک خانهٔ مورب به جلو می‌زند. به فرزین ارتقا می‌یابد.",
};

const DICTS: Record<Lang, Dict> = { en, ja, ar, fa };

const LOCALES: Record<Lang, string> = {
  en: "en",
  ja: "ja",
  ar: "ar-u-nu-arab",
  fa: "fa-u-nu-arabext",
};

let lang: Lang = "en";
let plural = new Intl.PluralRules("en");
let numFmt = new Intl.NumberFormat("en");

export const currentLang = () => lang;
export const isRTL = () => LANGS.find((l) => l.code === lang)!.dir === "rtl";
/** Whether the UI language is written in Arabic script. */
export const isArabicScript = () => lang === "ar" || lang === "fa";

export function setLang(l: Lang) {
  lang = l;
  plural = new Intl.PluralRules(LOCALES[l]);
  numFmt = new Intl.NumberFormat(LOCALES[l]);
}

/** Localised digits. */
export const num = (n: number) => numFmt.format(n);

export function percent(n: number) {
  return new Intl.NumberFormat(LOCALES[lang], {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

function lookup(key: string): string | undefined {
  return DICTS[lang][key] ?? en[key];
}

/** Translates `key`, substituting `{param}` placeholders. */
export function t(key: string, params: Record<string, string | number> = {}) {
  let s: string | undefined;
  if (typeof params.n === "number") {
    const form = plural.select(params.n);
    s = DICTS[lang][`${key}.${form}`] ?? DICTS[lang][`${key}.other`] ??
      en[`${key}.${new Intl.PluralRules("en").select(params.n)}`] ??
      en[`${key}.other`];
  }
  s ??= lookup(key) ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    if (v === undefined) return `{${k}}`;
    return typeof v === "number" ? num(v) : v;
  });
}

/** True if a translation exists and is non-empty in the current language. */
export function has(key: string) {
  return !!DICTS[lang][key] || (DICTS[lang][key] === undefined && !!en[key]);
}

/** Wraps left-to-right text (move notation) so it reads correctly in RTL. */
export const ltr = (s: string) => `⁦${s}⁩`;

export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem("shatranj:lang");
    if (saved && saved in DICTS) return saved as Lang;
  } catch {
    // ignore
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.slice(0, 2).toLowerCase();
    if (code in DICTS) return code as Lang;
  }
  return "en";
}

export function saveLang(l: Lang) {
  try {
    localStorage.setItem("shatranj:lang", l);
  } catch {
    // ignore
  }
}

/** Applies translations to static markup carrying data-i18n* attributes. */
export function applyStatic(root: ParentNode = document) {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n!);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-html]")) {
    el.innerHTML = t(el.dataset.i18nHtml!);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-aria]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nAria!));
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    el.title = t(el.dataset.i18nTitle!);
  }
}

export const allKeys = () => Object.keys(en);
export const dictFor = (l: Lang) => DICTS[l];
