/**
 * gamelog.js — nhật ký gọn: mỗi sự kiện 1 dòng (mảng)
 * Dòng: [seq, type, seat, colorId, ...payload]
 */
(function (global) {
  'use strict';

  function digestState(state) {
    if (!state || !state.horses) return '';
    const parts = state.horses.map((h) =>
      [h.id, h.colorId, h.zone, h.pathIndex, h.homeIndex, Math.round(h.gx * 100), Math.round(h.gy * 100)].join(',')
    );
    parts.push('c' + state.current, 'd' + (state.dice || 0), 'w' + (state.winner == null ? '-' : state.winner), 'e' + (state.extraTurn ? 1 : 0));
    const s = parts.join('|');
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  // type codes ngắn
  var T = {
    GAME_START: 'S', TURN_START: 'T', DICE_ROLLED: 'D', LEGAL_MOVES: 'L',
    NO_LEGAL_MOVE: 'N', MOVE_CHOSEN: 'C', MOVE_APPLIED: 'A', GAME_WON: 'W'
  };
  var T_INV = {};
  Object.keys(T).forEach(function (k) { T_INV[T[k]] = k; });

  function GameLog() {
    this.lines = [];
    this.entries = []; // tương thích test cũ
    this._seq = 0;
  }

  GameLog.prototype.start = function () {
    this.lines = [];
    this.entries = [];
    this._seq = 0;
  };

  GameLog.prototype.push = function (type, seat, colorId, controller, data) {
    data = data || {};
    // LEGAL_MOVES bỏ qua — không tăng seq
    if (type === 'LEGAL_MOVES') return null;
    this._seq += 1;
    var row;
    switch (type) {
      case 'GAME_START':
        row = [this._seq, 'S', data.numPlayers, data.humanSeat, data.ruleMode || 'classic',
          (data.seats || []).map(function (s) { return (s.controller === 'bot' ? 'b' : 'h') + s.colorId; }).join('')];
        break;
      case 'TURN_START':
        row = [this._seq, 'T', seat, colorId, (data.reason || '')[0] || 'n'];
        break;
      case 'DICE_ROLLED':
        row = [this._seq, 'D', seat, colorId, data.dice];
        break;
      case 'NO_LEGAL_MOVE':
        row = [this._seq, 'N', seat, colorId, data.dice, data.next === 'reroll' ? 'r' : 'p'];
        break;
      case 'MOVE_CHOSEN':
        row = [this._seq, 'C', seat, colorId, data.moveKey || '', data.by === 'bot' ? 'b' : 'h', data.rule || ''];
        break;
      case 'MOVE_APPLIED':
        row = [this._seq, 'A', seat, colorId, data.type || '', data.horseId,
          data.toGx, data.toGy, data.pathIndex != null ? data.pathIndex : -1,
          data.steps || 0, data.kick == null ? -1 : data.kick,
          data.extraTurn ? 1 : 0, data.digest || ''];
        break;
      case 'GAME_WON':
        row = [this._seq, 'W', data.winner, data.colorId];
        break;
      default:
        row = [this._seq, type, seat, colorId, data];
    }
    this.lines.push(row);
    // mirror verbose-lite for selftest
    this.entries.push({
      seq: this._seq,
      t: this._seq * 10,
      type: T_INV[row[1]] || row[1],
      seat: seat == null ? null : seat,
      colorId: colorId == null ? null : colorId,
      controller: controller || null,
      data: data || {}
    });
    return row;
  };

  GameLog.prototype.toJSON = function () {
    // Compact + entries (test/replay)
    return {
      v: 2,
      version: 1,
      lines: this.lines.slice(),
      entries: this.entries.slice()
    };
  };

  GameLog.prototype.download = function (filename) {
    // File lưu nhẹ: chỉ lines
    const json = JSON.stringify({ v: 2, lines: this.lines.slice() });
    if (typeof document === 'undefined') return json;
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || ('canguav3d-save-' + Date.now() + '.json');
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
    return json;
  };

  GameLog.digestState = digestState;
  /** Replay nhẹ: kiểm tra có GAME_START và seq tăng */
  GameLog.replay = function (payload) {
    const entries = (payload && payload.entries) || [];
    if (!entries.length && payload && payload.lines) {
      return { ok: true, compact: true, moves: payload.lines.length };
    }
    if (!entries.length) return { ok: false, error: 'empty' };
    for (let i = 0; i < entries.length; i++) {
      if (entries[i].seq !== i + 1) return { ok: false, error: 'seq gap at ' + i };
    }
    return { ok: true, moves: entries.filter(function (e) { return e.type === 'MOVE_APPLIED'; }).length };
  };
  global.GameLog = GameLog;
  global.digestState = digestState;
})(typeof window !== 'undefined' ? window : globalThis);
