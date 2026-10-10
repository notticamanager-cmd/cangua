/**
 * advanced-bot.js — Bot V2.5: heuristic đa chiều + chọn skill khắc chế
 */
(function (global) {
  'use strict';

  function chooseMove(state, moves) {
    const Actions = global.Actions;
    if (!moves || !moves.length) return null;
    if (moves.length === 1) return moves[0];

    let best = null;
    let bestRank = 999;
    let bestKey = 'unknown';

    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      let key;
      try { key = Actions.classify(m, state); } catch (e) { key = 'unknown'; }
      if (m.type === 'swap') key = 'kick';
      if (m.warp || m.warpBonusSteps) key = 'fly';
      if (m.leap) key = 'move';
      if (m._comboExtra) key = 'move';

      const rank = Actions.rankOf(key);
      // Ưu tiên kick vào Thiết Giáp nếu có khiên? Không — tránh
      if (m.kickId != null) {
        const vic = state.horses.find((h) => h.id === m.kickId);
        if (vic && vic.skillId === 5 && (vic.shieldHp || 0) > 0) {
          // penalize attacking shield unless kamikaze
          const att = state.horses.find((h) => h.id === m.horseId);
          if (!att || att.skillId !== 9) {
            // lower priority
            if (rank + 2 < bestRank) { /* skip prefer */ }
            else continue;
          }
        }
      }

      if (rank < bestRank) {
        bestRank = rank; best = m; bestKey = key;
      } else if (rank === bestRank && best && m.horseId < best.horseId) {
        best = m; bestKey = key;
      }
    }
    if (!best) best = moves[0];
    const mk = Actions.moveKey(best);
    if (!moves.some((m) => Actions.moveKey(m) === mk)) best = moves[0];
    best._botRule = bestKey;
    return best;
  }

  function chooseSkill(state, horseId, rng) {
    const AS = global.AdvancedSkills;
    const horse = state.horses.find((h) => h.id === horseId);
    if (!horse) return 1;
    const colorId = horse.colorId;
    const rand = typeof rng === "function" ? rng : Math.random;

    // Chỉ chọn skill chưa có quân nào trong team đang dùng (canSelectSkill max=1)
    const available = AS.listSkills().filter((sk) =>
      AS.canSelectSkill(state, colorId, sk.id)
    );
    if (!available.length) {
      const all = AS.listSkills();
      return all[Math.floor(rand() * all.length)].id;
    }
    // Random đều giữa các skill còn trống — không ưu tiên thứ tự
    return available[Math.floor(rand() * available.length)].id;
  }

  function classify(move, state) {
    return global.Actions.classify(move, state);
  }

  global.AdvancedBot = { chooseMove, chooseSkill, classify };
})(typeof window !== 'undefined' ? window : globalThis);
