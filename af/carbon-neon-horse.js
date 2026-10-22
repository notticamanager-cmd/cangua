/**
 * carbon-neon-horse.js — Quân mã Neon 3D (demo8)
 * bodyMode: plastic | carbon | copper
 * API tương thích Horse3D
 */
(function (global) {
  'use strict';
  if (!global.THREE) return;

  var BODY_SCALE = 0.70;
  var BODY_DEPTH = 1.2;
  var BASE_PEDESTAL_TOP_Y = 1.05;
  var MID_BOTTOM_X = -0.05;
  var FIT_SCALE = 8 / 3.0;
  // Mặt trên bàn: board y=-0.42, height 0.75 → top = -0.045
  var BOARD_TOP_Y = -0.045;
  var GROUND_EPS = 0.012; // hơi nhấc khỏi mặt bàn, không chìm / không bay

  var _shared = null;

  function createCarbonTexture() {
    var size = 256, canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size, size);
    var fiber = 16;
    for (var y = 0; y < size; y += fiber) {
      for (var x = 0; x < size; x += fiber) {
        var isDark = ((Math.floor(x / fiber) + Math.floor(y / fiber)) % 2 === 0);
        ctx.fillStyle = isDark ? '#111' : '#3a3a3a';
        ctx.fillRect(x, y, fiber, fiber);
        ctx.strokeStyle = isDark ? '#1a1a1a' : '#555';
        ctx.lineWidth = 1.8;
        for (var i = 3; i < fiber; i += 5) {
          ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i, y + fiber); ctx.stroke();
        }
        ctx.strokeStyle = isDark ? '#181818' : '#4a4a4a';
        ctx.lineWidth = 1.5;
        for (var j = 3; j < fiber; j += 5) {
          ctx.beginPath(); ctx.moveTo(x, y + j); ctx.lineTo(x + fiber, y + j); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#c0c0c0'; ctx.lineWidth = 1.2;
    for (var k = -size; k < size * 2; k += 10) {
      ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k + size, size); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.4, 0.4);
    tex.anisotropy = 8;
    return tex;
  }

  function createHorseShape() {
    var s = new THREE.Shape();
    s.moveTo(-0.9, -0.2);
    s.bezierCurveTo(-1.3, 1.5, -1.4, 3.2, -0.9, 4.6);
    s.bezierCurveTo(-1.0, 5.4, -0.8, 6.2, -0.3, 6.6);
    s.lineTo(-0.1, 6.7);
    s.bezierCurveTo(0.0, 5.9, 0.3, 5.5, 0.7, 5.3);
    s.bezierCurveTo(1.3, 5.0, 2.3, 4.3, 2.7, 3.6);
    s.bezierCurveTo(2.8, 3.1, 2.3, 2.8, 1.8, 2.9);
    s.bezierCurveTo(1.4, 2.7, 1.0, 2.3, 0.8, 1.7);
    s.bezierCurveTo(0.6, 0.9, 0.7, 0.3, 0.8, -0.2);
    s.closePath();
    return s;
  }

  function getShared() {
    if (_shared) return _shared;
    var horseGeo = new THREE.ExtrudeGeometry(createHorseShape(), {
      steps: 2, depth: BODY_DEPTH, bevelEnabled: true,
      bevelThickness: 0.3, bevelSize: 0.25, bevelSegments: 6
    });
    _shared = {
      carbonTex: createCarbonTexture(),
      horseGeo: horseGeo,
      bot: new THREE.CylinderGeometry(1.35, 1.5, 0.3, 48),
      mid: new THREE.CylinderGeometry(1.15, 1.28, 0.25, 48),
      top: new THREE.CylinderGeometry(0.9, 1.12, 0.5, 48),
      belt: new THREE.TorusGeometry(1.2, 0.05, 16, 48),
      socket: new THREE.SphereGeometry(0.43, 24, 16),
      ball: new THREE.SphereGeometry(0.34, 24, 16),
      pupil: new THREE.SphereGeometry(0.145, 16, 12),
      iris: new THREE.RingGeometry(0.17, 0.265, 24),
      rivet: new THREE.SphereGeometry(0.07, 10, 8)
    };
    return _shared;
  }

  function newAcc() {
    return { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, hd: 0, nz: 0, ny: 0 };
  }

  function toColor(v) {
    if (v == null) return new THREE.Color(0xc00000);
    if (typeof v === 'string') return new THREE.Color(v);
    return new THREE.Color(v);
  }

  function makePlasticMat(hex) {
    return new THREE.MeshPhysicalMaterial({
      color: toColor(hex),
      roughness: 0.16,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06
    });
  }

  function makeCarbonMat(hex, tex) {
    var m = new THREE.MeshStandardMaterial({
      map: tex ? tex.clone() : null,
      color: toColor(hex),
      roughness: 0.42,
      metalness: 0.38
    });
    if (m.map) { m.map.repeat.set(0.4, 0.4); m.map.needsUpdate = true; }
    return m;
  }

  function makeCopperMat(hex) {
    return new THREE.MeshStandardMaterial({
      color: toColor(hex),
      roughness: 0.38,
      metalness: 0.82
    });
  }

  function makeNeonMat(hex) {
    return new THREE.MeshStandardMaterial({
      color: toColor(hex),
      emissive: toColor(hex),
      emissiveIntensity: 1.6,
      roughness: 0.12,
      metalness: 0.2
    });
  }

  /**
   * @param {object} o
   *  bodyMode: 'plastic'|'carbon'|'copper'
   *  bodyColor, neonColor, eyeColor
   *  size, heading (deg), position, penId
   */
  function createCarbonNeonHorse(o) {
    o = o || {};
    var sh = getShared();
    var bodyMode = o.bodyMode || 'carbon';
    if (bodyMode !== 'plastic' && bodyMode !== 'carbon' && bodyMode !== 'copper') bodyMode = 'carbon';

    var bodyHex = o.bodyColor != null ? o.bodyColor : (o.color != null ? o.color : 0xc00000);
    var neonHex = o.neonColor != null ? o.neonColor : 0x00d2ff;
    var eyeHex = o.eyeColor != null ? o.eyeColor : 0xff00b4;

    // Mặc định copper tint
    if (bodyMode === 'copper' && (o.bodyColor == null && o.color == null)) {
      bodyHex = 0xd68654;
    }

    var bodyMat;
    if (bodyMode === 'plastic') bodyMat = makePlasticMat(bodyHex);
    else if (bodyMode === 'copper') bodyMat = makeCopperMat(bodyHex);
    else bodyMat = makeCarbonMat(bodyHex, sh.carbonTex);

    var neonMat = makeNeonMat(neonHex);
    var eyeMat = makeNeonMat(eyeHex);
    var socketMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, color: 0x111111
    });

    var model = new THREE.Group();
    model.name = 'CarbonNeonModel';

    var baseMeshes = [];
    function addCyl(geo, y) {
      var m = new THREE.Mesh(geo, bodyMat);
      m.position.y = y - BASE_PEDESTAL_TOP_Y;
      m.castShadow = m.receiveShadow = true;
      model.add(m);
      baseMeshes.push(m);
      return m;
    }
    addCyl(sh.bot, 0.15);
    addCyl(sh.mid, 0.425);
    addCyl(sh.top, 0.8);

    var belt = new THREE.Mesh(sh.belt, neonMat);
    belt.rotation.x = Math.PI / 2;
    belt.position.y = 0.3 - BASE_PEDESTAL_TOP_Y;
    belt.castShadow = true;
    model.add(belt);

    // Đinh tán đế (chỉ hiện ở chế độ cơ khí)
    var rivetGroup = new THREE.Group();
    rivetGroup.name = 'Rivets';
    rivetGroup.visible = (bodyMode === 'copper');
    var rivetMat = new THREE.MeshStandardMaterial({ color: 0xc9784f, metalness: 0.75, roughness: 0.35 });
    var rows = [
      { y: -0.90, r: 1.42, n: 20 },
      { y: -0.55, r: 1.18, n: 16 },
      { y: -0.20, r: 0.95, n: 14 }
    ];
    rows.forEach(function (row) {
      for (var i = 0; i < row.n; i++) {
        var a = (i / row.n) * Math.PI * 2;
        var rv = new THREE.Mesh(sh.rivet, rivetMat);
        rv.position.set(Math.cos(a) * row.r, row.y, Math.sin(a) * row.r);
        rivetGroup.add(rv);
      }
    });
    model.add(rivetGroup);

    var bodyUpper = new THREE.Group();
    var head = new THREE.Mesh(sh.horseGeo, bodyMat);
    head.position.set(-MID_BOTTOM_X, 0.2, -BODY_DEPTH / 2);
    head.castShadow = head.receiveShadow = true;
    bodyUpper.add(head);

    function buildEye(side) {
      var g = new THREE.Group();
      g.position.set(0.48, 4.72, (BODY_DEPTH / 2 + 0.22) * side);
      g.rotation.y = side > 0 ? -0.08 : Math.PI + 0.08;
      g.scale.setScalar(1.25);
      var sx = side;
      function add(geo, mat, sc, pos) {
        var m = new THREE.Mesh(geo, mat);
        if (sc) m.scale.set(sc[0], sc[1], sc[2]);
        m.position.set(pos[0], pos[1], pos[2]);
        g.add(m);
        return m;
      }
      add(sh.socket, socketMat, [1, 0.82, 0.34], [0, 0, 0.10]);
      add(sh.ball, eyeMat, [1, 0.92, 0.55], [0, 0, 0.16]);
      add(sh.pupil, new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.15, metalness: 0.3 }),
        [1, 1.08, 0.45], [0.025 * sx, -0.005, 0.40]);
      add(sh.iris, eyeMat, [1, 0.92, 1], [0, 0, 0.39]);
      return g;
    }
    var eyeGroup = new THREE.Group();
    eyeGroup.add(buildEye(1), buildEye(-1));
    eyeGroup.position.set(-MID_BOTTOM_X, 0.2, 0);
    bodyUpper.add(eyeGroup);

    function tube(pts) {
      var curve = new THREE.CatmullRomCurve3(pts);
      var geo = new THREE.TubeGeometry(curve, 24, 0.025, 8, false);
      var m = new THREE.Mesh(geo, neonMat);
      m.castShadow = true;
      return m;
    }
    var maneR = [
      new THREE.Vector3(-0.2, 1.4, 0.22),
      new THREE.Vector3(-0.37, 2.2, 0.22),
      new THREE.Vector3(-0.23, 3.0, 0.22),
      new THREE.Vector3(0.1, 3.4, 0.22)
    ];
    var maneL = maneR.map(function (p) { return new THREE.Vector3(p.x, p.y, -p.z); });
    var neonGroup = new THREE.Group();
    neonGroup.add(tube(maneR), tube(maneL));
    bodyUpper.add(neonGroup);
    bodyUpper.scale.setScalar(BODY_SCALE);
    model.add(bodyUpper);

    // Fit scale + chân đúng y=0
    model.scale.setScalar(FIT_SCALE);
    var box = new THREE.Box3().setFromObject(model);
    model.position.x -= (box.min.x + box.max.x) / 2;
    model.position.z -= (box.min.z + box.max.z) / 2;
    model.position.y -= box.min.y;
    box.setFromObject(model);
    if (Math.abs(box.min.y) > 1e-5) model.position.y -= box.min.y;
    box.setFromObject(model);
    var hgt = Math.max(0.01, box.max.y - box.min.y);
    var baseD = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);

    var root = new THREE.Group();
    root.name = 'Horse3D';
    var pivot = new THREE.Group();
    pivot.name = 'Pivot';
    root.add(pivot);
    pivot.add(model);

    var neck = new THREE.Group();
    neck.name = 'Neck';
    model.add(neck);

    var dims = { height: hgt, centerY: hgt / 2, radius: baseD / 2, baseDiameter: baseD || 8 };
    // KHÔNG dùng pivot centerY offset làm lệch chân — giữ model chân tại y=0 trên root
    // (Horse3D cũ dùng pivot center cho animation tilt quanh tâm; vẫn đặt centerY nhưng
    //  model.position.y = 0 để chân sát gốc root)
    pivot.position.y = 0;
    // model đã có chân tại y=0

    var self = {
      root: root,
      pivot: pivot,
      neck: neck,
      color: typeof bodyHex === 'number' ? bodyHex : toColor(bodyHex).getHex(),
      bodyColor: bodyHex,
      neonColor: neonHex,
      eyeColor: eyeHex,
      bodyMode: bodyMode,
      materialType: bodyMode,
      accent: neonHex,
      size: 1,
      penId: o.penId != null ? o.penId : -1,
      gridX: 0, gridY: 0,
      evolved: false,
      logicId: -1,
      _slotIndex: 0,
      _bodyMeshes: [head].concat(baseMeshes),
      _tracks: [],
      _ev: {},
      _acc: newAcc(),
      _neonPhase: Math.random() * Math.PI * 2,
      _neonMat: neonMat,
      _eyeMat: eyeMat,
      _bodyMat: bodyMat,
      _rivetGroup: rivetGroup,
      _rivetMat: rivetMat,
      dims: dims,
      state: { pos: new THREE.Vector3(), heading: 0 },
      anchors: { base: new THREE.Object3D(), center: new THREE.Object3D() },
      // offset Y để chân đúng mặt bàn
      _groundY: BOARD_TOP_Y + GROUND_EPS,

      setColor: function (hex) { return this.setBodyColor(hex); },
      setBodyColor: function (hex) {
        this.bodyColor = hex;
        this.color = typeof hex === 'number' ? hex : toColor(hex).getHex();
        this._bodyMat.color.copy(toColor(hex));
        return this;
      },
      setNeonColor: function (hex) {
        this.neonColor = hex;
        this.accent = hex;
        var c = toColor(hex);
        this._neonMat.color.copy(c);
        this._neonMat.emissive.copy(c);
        return this;
      },
      setEyeColor: function (hex) {
        this.eyeColor = hex;
        var c = toColor(hex);
        this._eyeMat.color.copy(c);
        this._eyeMat.emissive.copy(c);
        return this;
      },
      setBodyMode: function (mode) {
        if (mode !== 'plastic' && mode !== 'carbon' && mode !== 'copper') return this;
        this.bodyMode = mode;
        this.materialType = mode;
        var old = this._bodyMat;
        if (mode === 'plastic') this._bodyMat = makePlasticMat(this.bodyColor);
        else if (mode === 'copper') this._bodyMat = makeCopperMat(this.bodyColor);
        else this._bodyMat = makeCarbonMat(this.bodyColor, sh.carbonTex);
        this._bodyMeshes.forEach(function (m) { m.material = self._bodyMat; });
        if (old && old.dispose) old.dispose();
        if (this._rivetGroup) this._rivetGroup.visible = (mode === 'copper');
        return this;
      },
      setMaterial: function (t) {
        if (t === 'plastic' || t === 'carbon' || t === 'copper') return this.setBodyMode(t);
        return this;
      },
      setAccent: function (a) { return this.setNeonColor(a); },
      setSize: function (s) {
        this.size = s || 1;
        this.root.scale.setScalar(this.size);
        return this;
      },
      setVisible: function (v) { this.root.visible = !!v; return this; },
      setHeading: function (deg) {
        this.state.heading = (typeof deg === 'number' ? deg : 0) * (Math.PI / 180);
        this._apply(this._acc);
        return this;
      },
      setPosition: function (x, y, z) {
        if (typeof x === 'object' && x) {
          y = x.y != null ? x.y : 0;
          z = x.z != null ? x.z : 0;
          x = x.x != null ? x.x : 0;
        }
        // y logic = 0 nghĩa là đứng trên mặt bàn
        var gy = (y == null || y === 0) ? this._groundY : y;
        this.state.pos.set(x || 0, gy, z || 0);
        this._apply(this._acc);
        return this;
      },
      faceTo: function (x, z) {
        if (typeof x === 'object') { z = x.z; x = x.x; }
        var dx = x - this.state.pos.x, dz = z - this.state.pos.z;
        if (Math.hypot(dx, dz) > 1e-6) this.state.heading = Math.atan2(-dz, dx);
        this._apply(this._acc);
        return this;
      },
      setEvolved: function () { this.evolved = false; return this; },
      configure: function (opts) {
        opts = opts || {};
        if (opts.bodyMode) this.setBodyMode(opts.bodyMode);
        if (opts.color != null) this.setColor(opts.color);
        if (opts.bodyColor != null) this.setBodyColor(opts.bodyColor);
        if (opts.neonColor != null) this.setNeonColor(opts.neonColor);
        if (opts.eyeColor != null) this.setEyeColor(opts.eyeColor);
        if (opts.bodyMode != null || opts.material != null) this.setBodyMode(opts.bodyMode || opts.material);
        if (opts.size != null) this.setSize(opts.size);
        if (opts.heading != null) this.setHeading(opts.heading);
        if (opts.position) this.setPosition(opts.position);
        return this;
      },
      addTo: function (parent) { parent.add(this.root); return this; },
      removeFrom: function () { this.root.removeFromParent(); return this; },
      getBasePosition: function (out) {
        out = out || new THREE.Vector3();
        this.root.updateMatrixWorld(true);
        return this.anchors.base.getWorldPosition(out);
      },
      getCenterPosition: function (out) {
        out = out || new THREE.Vector3();
        this.root.updateMatrixWorld(true);
        return this.anchors.center.getWorldPosition(out);
      },
      getDimensions: function () {
        var s = this.size;
        return {
          baseDiameter: this.dims.baseDiameter * s,
          height: this.dims.height * s,
          centerHeight: this.dims.centerY * s,
          radius: this.dims.radius * s
        };
      },
      get headingDeg() { return this.state.heading / (Math.PI / 180); },
      get busy() { return this._tracks.some(function (t) { return !t.loop; }); },

      play: function (name, opts) {
        opts = opts || {};
        var def = (self._actionsRef && self._actionsRef[name])
          || (global.__HorseACTIONS && global.__HorseACTIONS[name]);
        if (!def) return Promise.reject(new Error('CarbonNeonHorse: missing action "' + name + '"'));
        var h = this;
        return new Promise(function (resolve) {
          var tr = def(h, opts);
          tr.name = name; tr.o = opts; tr.t0 = -(opts.delay || 0); tr.resolve = resolve;
          tr.dur = tr.dur != null ? tr.dur : (opts.duration != null ? opts.duration : 1);
          var EASE = global.HorseEASE || {
            linear: function (t) { return t; },
            out: function (t) { return 1 - Math.pow(1 - t, 3); },
            inOut: function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
          };
          tr.ease = (EASE[opts.ease]) || (typeof opts.ease === 'function' ? opts.ease : (tr.ease || EASE.inOut));
          tr.loop = opts.loop != null ? opts.loop : (tr.loop || false);
          h._tracks.push(tr);
          h._emit('start', { action: name });
        });
      },
      stop: function (name) {
        this._tracks = this._tracks.filter(function (tr) {
          if (name && tr.name !== name) return true;
          tr.resolve(false);
          return false;
        });
        return this;
      },
      update: function (dt) {
        dt = Math.min(Math.max(dt, 0), 0.1);
        var acc = this._acc = newAcc();
        var tracks = this._tracks.slice();
        for (var i = 0; i < tracks.length; i++) {
          var tr = tracks[i];
          tr.t0 += dt;
          if (tr.t0 < 0) continue;
          var t = tr.t0 / tr.dur;
          if (tr.loop) t %= 1;
          if (t >= 1 && !tr.loop) {
            var idx = this._tracks.indexOf(tr);
            if (idx >= 0) this._tracks.splice(idx, 1);
            if (tr.end) tr.end(this);
            tr.resolve(true);
            this._emit('end', { action: tr.name });
            if (tr.landed) this._emit('land', { action: tr.name, position: this.state.pos.clone() });
          } else {
            tr.step(t, acc, tr.ease(t), this);
          }
        }
        this._apply(acc);
        this._neonPhase += dt * 3.0;
        var wave = 0.55 + 0.45 * Math.sin(this._neonPhase);
        var pulse = 0.9 + 0.1 * Math.sin(this._neonPhase * 1.6);
        this._neonMat.emissiveIntensity = (1.2 + wave * 2.0) * pulse;
        this._eyeMat.emissiveIntensity = 1.0 + 0.35 * Math.sin(this._neonPhase * 2.1);
        if (typeof requestRender === 'function') requestRender();
      },
      _apply: function (acc) {
        var s = this.state;
        this.root.position.set(s.pos.x + acc.x, s.pos.y + acc.y, s.pos.z + acc.z);
        this.root.rotation.y = s.heading + acc.hd;
        this.pivot.rotation.set(acc.rx, acc.ry, acc.rz);
        this.neck.rotation.set(0, acc.ny, acc.nz);
      },
      on: function (evt, fn) {
        if (!this._ev[evt]) this._ev[evt] = new Set();
        this._ev[evt].add(fn);
        var ev = this._ev[evt];
        return function () { ev.delete(fn); };
      },
      off: function (evt, fn) { if (this._ev[evt]) this._ev[evt].delete(fn); return this; },
      _emit: function (evt, data) {
        if (!this._ev[evt]) return;
        var h = this;
        this._ev[evt].forEach(function (f) { f(data, h); });
      }
    };

    root.userData.horse3d = self;
    self.anchors.base.name = 'ANCHOR_BASE';
    self.anchors.center.name = 'ANCHOR_CENTER';
    self.anchors.center.position.y = dims.centerY;
    root.add(self.anchors.base);
    root.add(self.anchors.center);

    self.configure({
      size: o.size,
      heading: o.heading,
      position: o.position,
      bodyMode: bodyMode,
      bodyColor: bodyHex,
      neonColor: neonHex,
      eyeColor: eyeHex
    });
    return self;
  }

  global.createCarbonNeonHorse = createCarbonNeonHorse;
  global.BOARD_TOP_Y = BOARD_TOP_Y;
  global.HORSE_GROUND_Y = BOARD_TOP_Y + GROUND_EPS;
})(typeof window !== 'undefined' ? window : self);
