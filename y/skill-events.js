/**
 * skill-events.js — Thư viện sự kiện kỹ năng V2.5
 * Chỉ phát giải thích khi có hành động bất thường quan sát được.
 * Không giải thích khi gán skill / xuất chuồng bí mật.
 */
(function (global) {
  'use strict';

  const EVENTS = {
    EV_SM_TLM_PLUS1: {
      skillId: 1, tier: 'S', title: 'THẦN TỐC +1',
      line: 'Thiên Lý Mã của phe {A} được cộng thêm 1 bước cho mỗi nước đi trên đường đua.',
      lineShort: '+1 bước', color: '#f59e0b', reveals: ['actor'], repeat: 'collapse'
    },
    EV_TLM_BOUNTY: {
      skillId: 1, tier: 'S', title: 'TIỀN THƯỞNG',
      line: 'Phe {A} hạ gục Thiên Lý Mã của phe {B} nên được thưởng thêm 1 lượt xúc.',
      lineShort: '+1 lượt thưởng', color: '#fbbf24', reveals: ['actor', 'victim'], repeat: 'full'
    },
    EV_PM_LEAP: {
      skillId: 2, tier: 'M', title: 'PHI MÃ VƯỢT ĐẦU',
      line: 'Phi Mã của phe {A} nhảy qua quân phe {C} đang chắn đường: kỹ năng cho phép vượt đúng 1 quân.',
      lineShort: 'Nhảy qua quân chắn', color: '#e2e8f0', reveals: ['actor'], repeat: 'full'
    },
    EV_WR_WARP: {
      skillId: 3, tier: 'M', title: 'LƯỚT GÓC +{n}',
      line: 'Warp Rider của phe {A} dừng đúng ô góc hoặc cửa chuồng nên lướt thêm {n} bước.',
      lineShort: '+{n} lướt góc', color: '#06b6d4', reveals: ['actor'], repeat: 'collapse'
    },
    EV_SM_WR_SHORT6: {
      skillId: 3, tier: 'S', title: 'XÚC 6 CHỈ ĐI 5',
      line: 'Warp Rider của phe {A} đi chậm hơn ở nước xúc 6: chỉ được đi 5 bước.',
      lineShort: '6 → 5', color: '#06b6d4', reveals: ['actor'], repeat: 'collapse'
    },
    EV_CR_COMBO: {
      skillId: 4, tier: 'M', title: 'COMBO ROLL',
      line: 'Combo Rider của phe {A} đi với số {dice} (chẵn) nên được tung xúc xắc thêm 1 lần; ở lượt thêm này nó không được đá.',
      lineShort: 'Tung thêm · không đá', color: '#a855f7', reveals: ['actor'], repeat: 'collapse'
    },
    EV_TG_REFLECT: {
      skillId: 5, tier: 'L', title: 'KHIÊN PHẢN ĐÒN',
      line: 'Khiên của Thiết Giáp phe {B} chặn đòn đá của phe {A}: quân phe {A} bị dội lùi 1 ô so với chỗ xuất phát, Thiết Giáp không về chuồng. Khiên còn {shield}.',
      lineShort: 'Khiên phản', color: '#eab308', reveals: ['actor', 'victim'], repeat: 'full'
    },
    EV_SM_TG_SHORT6: {
      skillId: 5, tier: 'S', title: 'GIÁP NẶNG',
      line: 'Thiết Giáp của phe {A} mang giáp nặng nên xúc 6 chỉ đi được 5 bước.',
      lineShort: '6 → 5', color: '#eab308', reveals: ['actor'], repeat: 'collapse'
    },
    EV_PH_FALL: {
      skillId: 6, tier: 'S', title: 'NGỌN LỬA CHƯA TẮT',
      line: 'Phượng Hoàng của phe {A} bị đá về chuồng, nhưng ngọn lửa trong chuồng vẫn cháy.',
      lineShort: 'Lửa chưa tắt', color: '#f97316', reveals: ['victim'], repeat: 'full'
    },
    EV_PH_FINAL_FALL: {
      skillId: 6, tier: 'S', title: 'NGỌN LỬA TẮT',
      line: 'Phượng Hoàng của phe {A} bị đá về chuồng và đã dùng hết 2 lần hồi sinh: kỹ năng mất khi về chuồng.',
      lineShort: 'Lửa tắt', color: '#f97316', reveals: ['victim'], repeat: 'full'
    },
    EV_PH_REVIVE: {
      skillId: 6, tier: 'L', title: 'NIẾT BÀN TRÙNG SINH',
      line: 'Phượng Hoàng của phe {A} hồi sinh: xuất chuồng với số {dice} mà không cần xúc 6, và không nhận lượt thưởng.',
      lineShort: 'Hồi sinh xuất chuồng', color: '#f97316', reveals: ['actor'], repeat: 'full'
    },
    EV_GH_OVERLAP: {
      skillId: 7, tier: 'M', title: 'ẢO ẢNH LỘ DIỆN',
      line: 'Quân phe {A} vô tình rơi trúng ô của Ảo Ảnh Mã phe {B}: tàng hình chỉ chống bị nhắm đá, trùng ô vẫn bị đá về chuồng.',
      lineShort: 'Ghost lộ', color: '#9333ea', reveals: ['ghost'], repeat: 'full'
    },
    EV_SM_GK_ZONE: {
      skillId: 8, tier: 'M', title: 'BỊ PHONG TỎA',
      line: 'Quân phe {A} đi vào vùng phong tỏa quanh cửa chuồng của Gatekeeper phe {B}: bị trừ tối đa 2 bước.',
      lineShort: '-2 phong tỏa', color: '#ca8a04', reveals: ['gatekeeper'], repeat: 'collapse'
    },
    EV_SM_GK_AHEAD: {
      skillId: 8, tier: 'S', title: 'BỊ CẢN BƯỚC',
      line: 'Gatekeeper của phe {A} còn đang trên đường đua mà phía trước 6 ô có quân địch: bị chậm 1 bước.',
      lineShort: '-1 bị cản', color: '#ca8a04', reveals: ['actor'], repeat: 'collapse'
    },
    EV_OB_BLAST: {
      skillId: 9, tier: 'L', title: 'CẢM TỬ ĐỒNG QUY',
      line: 'Ôm Bom của phe {A} lao vào quân phe {B} và phát nổ: cả hai cùng bị văng về chuồng.',
      lineShort: 'Đồng quy', color: '#dc2626', reveals: ['actor', 'victim'], repeat: 'full'
    },
    EV_OB_SHIELD: {
      skillId: 9, tier: 'L', title: 'BOM NỔ VÀO KHIÊN',
      line: 'Ôm Bom của phe {A} đâm vào khiên của Thiết Giáp phe {B}: khiên mất 1 tầng (còn {shield}), chỉ Ôm Bom bị văng về chuồng.',
      lineShort: 'Bom vào khiên', color: '#dc2626', reveals: ['actor', 'victim'], repeat: 'full'
    },
    EV_TR_MINE: {
      skillId: 10, tier: 'L', title: 'TRÚNG ĐỊA LÔI',
      line: 'Quân phe {A} đáp trúng mìn do Trapper phe {B} chôn: bị hất lùi {n} bước.',
      lineShort: 'Địa lôi -{n}', color: '#fbbf24', reveals: ['actor', 'trapper'], repeat: 'collapse'
    },
    EV_VP_SURGE: {
      skillId: 11, tier: 'L', title: 'HÚT HUYẾT',
      line: 'Huyết Mã của phe {A} hút máu quân phe {B} vừa bị đá và lao thêm {n} bước.',
      lineShort: '+{n} hút huyết', color: '#b91c1c', reveals: ['actor', 'victim'], repeat: 'full'
    },
    EV_SM_VP_STARVE: {
      skillId: 11, tier: 'S', title: 'ĐÓI MÁU',
      line: 'Huyết Mã của phe {A} đã 4 nước đi chưa đá được quân nào: đói máu nên mỗi lần đi yếu hơn 1 bước, cho đến khi đá được quân.',
      lineShort: '-1 đói máu', color: '#b91c1c', reveals: ['actor'], repeat: 'collapse'
    },
    EV_TS_SWAP: {
      skillId: 12, tier: 'L', title: 'HOÁN VỊ CÀN KHÔN',
      line: 'Trickster của phe {A} xúc 1 và đổi chỗ với quân phe {B} trong tầm 6 ô: hai quân tráo vị trí tức thì. Hồi chiêu 3 lượt.',
      lineShort: 'Hoán vị', color: '#8b5cf6', reveals: ['actor'], repeat: 'full'
    },
    EV_GN_CLASH: {
      skillId: null, tier: 'S', title: 'KỸ NĂNG BỘC LỘ',
      line: 'Cuộc đối đầu làm lộ kỹ năng: {skillA} (phe {A}) và {skillB} (phe {B}).',
      lineShort: 'Bộc lộ', color: '#fbbf24', reveals: ['actor', 'victim'], repeat: 'full'
    }
  };

  function factionName(state, colorId) {
    const BD = global.BoardData;
    if (BD && BD.COLORS[colorId]) return BD.COLORS[colorId].name;
    return String(colorId);
  }

  function skillName(id) {
    const AS = global.AdvancedSkills;
    if (AS && AS.getSkill(id)) return AS.getSkill(id).name;
    return '???';
  }

  function fill(template, vars) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, function (_, k) {
      return vars[k] != null ? String(vars[k]) : '';
    });
  }

  /**
   * Từ move + pendingFeatFX → danh sách sự kiện cần giải thích (không gồm gán skill / exit thường).
   */
  function detectEvents(state, move, feat) {
    feat = feat || {};
    const list = [];
    if (!move) return list;
    const horse = state.horses.find(function (h) { return h.id === move.horseId; });
    if (!horse) return list;
    const A = factionName(state, horse.colorId);
    const dice = state.dice || 0;
    const steps = move.steps || 0;

    // Không giải thích exit thường (skill vẫn bí mật)
    // Chỉ EV_PH_REVIVE khi phoenixFree
    if (move.type === 'exit' && move.phoenixFree) {
      list.push({
        code: 'EV_PH_REVIVE',
        vars: { A: A, dice: dice, revives: horse.revivesLeft != null ? horse.revivesLeft : 0 }
      });
      return list;
    }
    if (move.type === 'exit') return list;

    // Shield reflect
    if (feat.shieldReflected || move._reflected) {
      const vic = move.kickId != null ? state.horses.find(function (h) { return h.id === move.kickId; }) : null;
      list.push({
        code: feat.kamikazeExploded ? 'EV_OB_SHIELD' : 'EV_TG_REFLECT',
        vars: {
          A: A,
          B: vic ? factionName(state, vic.colorId) : '?',
          shield: feat.remainingShield != null ? feat.remainingShield : '?',
          dice: dice
        }
      });
      return list;
    }

    // Kamikaze
    if (move._kamikaze || feat.kamikazeExploded) {
      const vic = move.kickId != null ? state.horses.find(function (h) { return h.id === move.kickId; }) : null;
      list.push({
        code: 'EV_OB_BLAST',
        vars: { A: A, B: vic ? factionName(state, vic.colorId) : '?' }
      });
      return list;
    }

    // Mine
    if (move._mineHit || feat.mineTriggered) {
      list.push({
        code: 'EV_TR_MINE',
        vars: { A: A, B: '?', n: horse.skillId === 1 ? 5 : 4 }
      });
    }

    // Leap
    if (move.leap) {
      list.push({
        code: 'EV_PM_LEAP',
        vars: { A: A, C: '?' }
      });
    }

    // Warp
    if (move.warpBonusSteps || feat.warpBonus) {
      const n = move.warpBonusSteps || 2;
      list.push({
        code: 'EV_WR_WARP',
        vars: { A: A, n: n }
      });
    }

    // Swap
    if (move.type === 'swap') {
      const other = move.swapWithId != null ? state.horses.find(function (h) { return h.id === move.swapWithId; }) : null;
      list.push({
        code: 'EV_TS_SWAP',
        vars: { A: A, B: other ? factionName(state, other.colorId) : '?' }
      });
    }

    // Vampire surge
    if (feat.vampireSurge || move._vampireBonus) {
      const vic = move.kickId != null ? state.horses.find(function (h) { return h.id === move.kickId; }) : null;
      list.push({
        code: 'EV_VP_SURGE',
        vars: { A: A, B: vic ? factionName(state, vic.colorId) : '?', n: 3 }
      });
    }

    // Bounty
    if (feat.bountyAwarded) {
      list.push({
        code: 'EV_TLM_BOUNTY',
        vars: { A: A, B: '?' }
      });
    }

    // Combo
    if (move._comboExtra) {
      list.push({
        code: 'EV_CR_COMBO',
        vars: { A: A, dice: dice }
      });
    }

    // Thiên Lý +1 (steps > dice on track move/kick)
    if (horse.skillId === 1 && horse.zone === 'track' &&
        (move.type === 'move' || move.type === 'kick' || move.type === 'kick_rear') &&
        steps > dice) {
      list.push({
        code: 'EV_SM_TLM_PLUS1',
        vars: { A: A, dice: dice, steps: steps }
      });
    }

    // Short 6: Warp or Thiết Giáp
    if (dice === 6 && (move.type === 'move' || move.type === 'kick' || move.type === 'kick_rear')) {
      if (horse.skillId === 3 && steps <= 5) {
        list.push({ code: 'EV_SM_WR_SHORT6', vars: { A: A, dice: dice, steps: steps } });
      }
      if (horse.skillId === 5 && steps <= 5) {
        list.push({ code: 'EV_SM_TG_SHORT6', vars: { A: A, dice: dice, steps: steps } });
      }
    }

    // Vampire starve
    if (horse.skillId === 11 && (horse.starvationCounter || 0) >= 4 &&
        (move.type === 'move' || move.type === 'kick' || move.type === 'kick_rear')) {
      list.push({ code: 'EV_SM_VP_STARVE', vars: { A: A, dice: dice, steps: steps } });
    }

    // Ghost overlap
    if (move._ghostRevealed != null) {
      const g = state.horses.find(function (h) { return h.id === move._ghostRevealed; });
      list.push({
        code: 'EV_GH_OVERLAP',
        vars: { A: A, B: g ? factionName(state, g.colorId) : '?' }
      });
    }

    // Generic clash reveal when kick without other skill events
    if (move.kickId != null && list.length === 0) {
      const vic = state.horses.find(function (h) { return h.id === move.kickId; });
      if (vic && (horse.skillId || vic.skillId)) {
        list.push({
          code: 'EV_GN_CLASH',
          vars: {
            A: A,
            B: factionName(state, vic.colorId),
            skillA: horse.skillId ? skillName(horse.skillId) : '—',
            skillB: vic.skillId ? skillName(vic.skillId) : '—'
          }
        });
      }
    }

    return list;
  }

  function formatEvent(code, vars) {
    const ev = EVENTS[code];
    if (!ev) return null;
    return {
      code: code,
      title: fill(ev.title, vars || {}),
      line: fill(ev.line, vars || {}),
      lineShort: fill(ev.lineShort || '', vars || {}),
      color: ev.color,
      tier: ev.tier,
      reveals: ev.reveals || []
    };
  }

  /**
   * API chính: trả về mảng {title, line, color} để UI hiển thị sau hành động.
   */
  function explainAfterMove(state, move, feat) {
    const detected = detectEvents(state, move, feat);
    return detected.map(function (d) {
      return formatEvent(d.code, d.vars);
    }).filter(Boolean);
  }

  global.SkillEvents = {
    EVENTS,
    detectEvents,
    formatEvent,
    explainAfterMove,
    factionName,
    skillName
  };
})(typeof window !== 'undefined' ? window : globalThis);
