import type { Dict } from "../i18n.ts";

export const ko: Dict = {
  "meta.title": "샤트란지 — 아바스 왕조 바그다드의 체스",
  "meta.description":
    "아바스 왕조 궁정에서 즐기던 중세 체스, 샤트란지를 컴퓨터와 두어 보세요. 알라딘부터 지니까지, 천일야화의 다섯 상대가 기다립니다.",
  "brand.primary": "샤트란지",
  "brand.secondary": "شطرنج",
  "header.tagline": "아바스 왕조 궁정의 놀이 · 9세기 바그다드",
  "header.rules": "규칙",
  "header.theme": "다크 모드 전환",
  "header.language": "언어",
  "board.aria":
    "샤트란지 판. 화살표 키로 커서를 움직이고 Enter로 기물을 들거나 놓으세요.",
  "square.piece": "{square} {side} {piece}",
  "board.reviewing": "복기 중",

  "side.ivory": "상아",
  "side.ebony": "흑단",
  "side.ivory.lower": "상아",
  "side.ebony.lower": "흑단",

  "btn.undo": "무르기",
  "btn.undo.title": "마지막 수 무르기 (U)",
  "btn.hint": "힌트",
  "btn.hint.title": "수 추천받기 (H)",
  "btn.flip": "뒤집기",
  "btn.flip.title": "판 뒤집기 (F)",
  "btn.newGame": "새 게임",
  "btn.playAgain": "한 판 더",
  "btn.cancel": "취소",
  "btn.begin": "시작",
  "btn.close": "닫기",
  "btn.returnToBoard": "판으로 돌아가기",
  "btn.viewBoard": "판 보기",
  "btn.changeOpponent": "상대 바꾸기",
  "btn.reviewGame": "게임 복기",

  "status.yourMove": "당신 차례예요",
  "status.newcomer": "샤트란지가 처음이신가요? 말의 움직임 보기",
  "status.check": "샤! 왕이 체크당했어요",
  "status.check.detail":
    "왕을 안전한 곳으로 옮기거나, 막거나, 공격하는 기물을 잡으세요.",
  "status.selected": "강조된 칸을 고르거나 다른 기물을 선택하세요.",
  "status.pickUp.ivory":
    "상아 기물 하나를 선택하세요 — 클릭하거나 드래그하세요.",
  "status.pickUp.ebony":
    "흑단 기물 하나를 선택하세요 — 클릭하거나 드래그하세요.",
  "status.thinking": "{name} 생각 중…",
  "status.hintThinking": "옛 지침서를 살펴보는 중…",
  "status.hintThinking.detail": "당신을 위한 좋은 수를 찾고 있어요.",
  "status.hint": "힌트: {move}",
  "status.hint.detail":
    "화살표가 추천 수예요. 그대로 두거나 직접 수를 고르세요.",
  "status.draw": "무승부",
  "status.victory": "승리!",
  "status.defeat": "패배",
  "status.reviewStart": "시작 국면을 보는 중",
  "status.reviewMove": "수 {move} 국면을 보는 중",
  "status.reviewHelp":
    "← → 키나 기보로 게임을 한 수씩 살펴보세요. End 키를 누르면 돌아가요.",

  "reason.checkmate": "샤 마트 — 왕이 꼼짝할 수 없어요.",
  "reason.stalemate": "스테일메이트 — 샤트란지에서는 움직일 수 없는 왕이 져요.",
  "reason.bare-king": "벌거숭이 왕 — 샤 혼자 판 위에 남았어요.",
  "reason.draw-bare": "양쪽 모두 왕만 남았어요. 무승부예요.",
  "reason.repetition": "같은 국면이 세 번 나왔어요. 무승부예요.",
  "reason.move-limit": "70수 동안 진전이 없었어요. 무승부예요.",

  "result.draw": "무승부",
  "result.win": "당신이 이겼어요",
  "result.lose": "{name} 승리",
  "result.detail.other": "{text} ({n}수)",

  "moves.title": "기보",
  "moves.count.other": "{n}수",
  "moves.empty": "아직 둔 수가 없어요.",
  "moves.aria": "{move} 이후 국면 보기",
  "nav.first": "첫 국면 (Home)",
  "nav.prev": "이전 수 (←)",
  "nav.next": "다음 수 (→)",
  "nav.last": "최근 수 (End)",
  "nav.review": "복기",
  "nav.review.title": "지금까지의 게임 분석하기",
  "nav.live": "게임으로 돌아가기",

  "player.you": "나",
  "player.level": "레벨 {n}",
  "player.thinking": "생각 중",
  "player.toMove": "{side} — 둘 차례",

  "opponent.label": "상대",
  "opponent.levelOf": "레벨 {n} / {total}",
  "level.strength": "강도 {n} / {total}",

  "newGame.title": "새 게임",
  "newGame.desc": "천일야화에서 상대를 고르세요.",
  "newGame.opponent": "상대",
  "newGame.playAs": "내 진영",
  "newGame.random": "무작위",
  "newGame.ivoryFirst": "상아가 먼저 둬요.",

  "rules.title": "샤트란지 규칙",
  "rules.subtitle": "قواعد الشطرنج",
  "rules.desc": "체스와 같은 8×8 판에서, 더 오래되고 순한 기물로 둬요.",
  "rules.list":
    `<li><strong>샤 마트</strong> <span class="font-arabic" lang="ar">(شاه مات)</span> — “왕이 꼼짝할 수 없다”: 체크메이트하면 이겨요. 체크메이트라는 말의 기원이에요.</li>
     <li><strong>스테일메이트도 승리</strong>예요. 상대가 둘 수 있는 수가 없게 만든 쪽이 이겨요.</li>
     <li><strong>벌거숭이 왕</strong>: 상대의 왕을 뺀 모든 기물을 잡으면 이겨요. 단, 상대가 바로 다음 수에 내 왕도 벌거숭이로 만들 수 있으면 무승부예요.</li>
     <li>캐슬링, 바이다크의 두 칸 전진, 앙파상은 없어요.</li>
     <li>마지막 줄에 도달한 바이다크는 피르잔이 돼요.</li>
     <li>같은 국면이 세 번 반복되거나, 양쪽이 각각 70수 동안 기물을 잡지도 바이다크를 움직이지도 않으면 무승부예요.</li>`,

  "footer.html":
    `샤트란지는 페르시아에서 바그다드로 전해져 아바스 왕조 칼리프의 궁정에서 꽃피었어요. 알아들리, 알라지, 앗술리 같은 명인들이 이 게임에 관한 최초의 지침서를 썼어요.<br/>
     <span class="font-arabic text-sm text-gold" lang="ar">مدينة السلام</span><span class="mx-1">·</span> 마디나트 앗살람, 평화의 도시`,

  "class.best": "최선의 수",
  "class.good": "좋은 수",
  "class.inaccuracy": "부정확한 수",
  "class.mistake": "실수",
  "class.blunder": "대실수",
  "class.best.plural": "최선의 수",
  "class.inaccuracy.plural": "부정확한 수",
  "class.mistake.plural": "실수",
  "class.blunder.plural": "대실수",

  "review.title": "게임 복기",
  "review.intro":
    "엔진이 게임을 한 수씩 검토해요. 대실수, 놓친 승리, 더 나았던 수를 알려 줘요.",
  "review.start": "이 게임 복기하기",
  "review.analysing": "분석 중… {done} / {total} 국면",
  "review.stop": "중지",
  "review.remaining.other": "남은 {n}개 국면 분석하기",
  "review.you": "나",
  "review.accuracy": "정확도",
  "review.footnote": "그래프나 수를 클릭하면 엔진의 평가를 볼 수 있어요.",
  "review.graph": "평가 그래프. 상아색 영역이 상아 쪽의 승산을 나타내요.",
  "review.byYou": "나의 수",
  "review.byThem": "{name}의 수",
  "review.eval": "상아 기준 평가 {before} → {after}",
  "review.agrees": "엔진도 같은 수를 골랐어요.",
  "review.asGood": "엔진이 고른 수만큼 좋은 수예요.",
  "review.better": "더 나은 수: {move}",
  "review.showBest": "판에 {move} 보기",
  "review.backToPlayed": "실제로 둔 수로 돌아가기",

  "level.1.name": "알라딘",
  "level.1.title": "거리의 소년",
  "level.1.desc":
    "도시 골목에서 자란 소년. 이제 막 기물 움직이는 법을 배웠어요.",
  "level.2.name": "마스루르",
  "level.2.title": "칼리프의 검객",
  "level.2.desc": "칼리프의 충직한 처형인. 대담하지만 판 위에서는 덤벙대요.",
  "level.3.name": "자파르",
  "level.3.title": "재상",
  "level.3.desc": "바르마크 가문의 영리한 재상. 탄탄하게 둬요.",
  "level.4.name": "하룬 알라시드",
  "level.4.title": "칼리프",
  "level.4.desc": "신도들의 지도자 그 사람. 샤트란지의 열렬한 후원자예요.",
  "level.5.name": "지니",
  "level.5.title": "램프의 정령",
  "level.5.desc":
    "연기 없는 불로 빚어진 존재. 비기기라도 하는 인간은 드물어요.",

  "piece.6.name": "샤",
  "piece.6.meaning": "왕",
  "piece.6.move": "어느 방향으로든 한 칸 움직여요.",
  "piece.2.name": "피르잔",
  "piece.2.meaning": "재상",
  "piece.2.move": "대각선으로 한 칸 움직여요. 퀸의 조상이에요.",
  "piece.3.name": "필",
  "piece.3.meaning": "코끼리",
  "piece.3.move":
    "대각선으로 정확히 두 칸 뛰어요. 사이에 있는 기물은 뛰어넘어요.",
  "piece.4.name": "파라스",
  "piece.4.meaning": "말",
  "piece.4.move": "현대 체스의 나이트처럼 움직여요.",
  "piece.5.name": "루흐",
  "piece.5.meaning": "전차",
  "piece.5.move": "룩처럼 가로세로로 몇 칸이든 움직여요.",
  "piece.1.name": "바이다크",
  "piece.1.meaning": "보병",
  "piece.1.move":
    "앞으로 한 칸 전진하고(두 칸은 안 돼요), 대각선 앞 한 칸의 기물을 잡아요. 피르잔으로 승격해요.",
};
