/* Offline Motion Prompt reference. Upstream MIT notices are retained below. */
(() => {
'use strict';
const packs={},factories={};
const MotionPrompt={pack(id,setup){factories[id]=setup;}};
/* Motion Prompt · pack "motion" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('motion', function () {
  // @kit
  // モーショングラフィックスの演出の名前 24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // カードの中だけ共通パレット（濃紺の地＋青・コーラル・黄・ミント）。
  const CW = 539, CH = 208;
  const CYC = 4.7;                          // 各カードは4.7秒周期（ループの継ぎ目なし）
  const C = {
    navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
    blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6'
  };
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);   // 0→行き過ぎ→1
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function bez(x1, y1, x2, y2) {
    const cx_ = 3 * x1, bx = 3 * (x2 - x1) - cx_, ax = 1 - cx_ - bx;
    const cy_ = 3 * y1, by = 3 * (y2 - y1) - cy_, ay = 1 - cy_ - by;
    const sx = t => ((ax * t + bx) * t + cx_) * t, sy = t => ((ay * t + by) * t + cy_) * t;
    return x => { if (x <= 0) return 0; if (x >= 1) return 1; let lo = 0, hi = 1, t = x; for (let i = 0; i < 40; i++) { if (sx(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } return sy(t); };
  }
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  const G0 = mkCanvas(CW, CH), GK0 = G0.getContext('2d', { willReadFrequently: true });
  const G1 = mkCanvas(CW, CH), GK1 = G1.getContext('2d', { willReadFrequently: true });
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  // ぬるっとつながる形（描く→ぼかす→しきい値）。paint(ctx) で色を塗った結果のキャンバスを返す
  function goo(draw, blur, paint) {
    GK0.setTransform(1, 0, 0, 1, 0, 0); GK0.clearRect(0, 0, CW, CH); GK0.fillStyle = '#fff'; draw(GK0);
    GK1.setTransform(1, 0, 0, 1, 0, 0); GK1.globalCompositeOperation = 'source-over'; GK1.clearRect(0, 0, CW, CH);
    GK1.filter = `blur(${blur}px)`; GK1.drawImage(G0, 0, 0); GK1.filter = 'none';
    const im = GK1.getImageData(0, 0, CW, CH), d = im.data;
    for (let i = 3; i < d.length; i += 4) { const a = d[i]; d[i] = a < 112 ? 0 : a > 144 ? 255 : (a - 112) * 8; }
    GK1.putImageData(im, 0, 0);
    GK1.globalCompositeOperation = 'source-atop'; paint(GK1); GK1.globalCompositeOperation = 'source-over';
    return G1;
  }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; let x = -tot / 2; return [...s].map((ch, i) => { const o = { ch, x: x + (ws[i] - ls) / 2, w: ws[i] - ls }; x += ws[i]; return o; }); }
  const CELLS = [];

  // @element 01
  // 01 ポップイン（アプリのアイコンがポンと弾んで現れ、通知バッジが遅れてポン）
  CELLS[0] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, X = w / 2, Y = h / 2 + 4, S = 116;
    const col = n % 2 ? C.blue : C.coral;
    const out = backIn(P(lu, 1.86, 2.12), 2.2);
    const sc = spring(lu - 0.28, 15, 6.5) * (1 - out);
    const rot = (1 - spring(lu - 0.28, 11, 6)) * -0.35;
    // 床の影
    k.fillStyle = 'rgba(0,0,0,.28)'; k.beginPath(); k.ellipse(X, Y + 78, 62 * clamp(sc), 8 * clamp(sc), 0, 0, 7); k.fill();
    if (sc > 0.002) {
      k.save(); k.translate(X, Y); k.rotate(rot); k.scale(sc, sc);
      k.fillStyle = col; rr(k, -S / 2, -S / 2, S, S, 30); k.fill();
      k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, -S / 2, -S / 2, S, S / 2, [30, 30, 0, 0]); k.fill();
      k.fillStyle = '#fff';
      if (n % 2) { k.save(); k.translate(0, 2); heartPath(k, 30); k.fill(); k.restore(); }
      else { star(k, 0, 2, 36, 0, 0.48); k.lineJoin = 'round'; k.strokeStyle = '#fff'; k.lineWidth = 6; k.stroke(); k.fill(); }
      k.restore();
      // 通知バッジ
      const bs = spring(lu - 0.62, 17, 7) * (1 - out);
      if (bs > 0.002) { k.save(); k.translate(X + 52 * sc, Y - 52 * sc); k.scale(bs, bs); k.fillStyle = C.yel; k.beginPath(); k.arc(0, 0, 25, 0, 7); k.fill(); k.strokeStyle = C.navy; k.lineWidth = 5; k.stroke(); txt(k, '1', 0, 2, `800 30px ${DISP}`, C.navy, 'center', 'middle'); k.restore(); }
    }
  };

  // @element 02
  // 02 スタガー（グラフの棒が、少しずつ時間をずらして順に立ち上がる）
  CELLS[1] = (k, w, h, u) => {
    stage(k);
    const N = 7, BW = 44, G = 20, x0 = (w - (N * BW + (N - 1) * G)) / 2, base = h - 30;
    const HS = [52, 84, 68, 112, 92, 136, 158];
    k.fillStyle = C.navy3; rr(k, x0 - 18, base, N * BW + (N - 1) * G + 36, 5, 2.5); k.fill();
    const lu = mod(u, CYC / 2);
    for (let i = 0; i < N; i++) {
      const t0 = 0.15 + i * 0.12, g = backOut(P(lu, t0, t0 + 0.5), 2.6) * (1 - eIn(P(lu, 1.78 + i * 0.045, 2.04 + i * 0.045)));
      if (g <= 0.001) continue;
      const hh = HS[i] * g, x = x0 + i * (BW + G);
      k.fillStyle = PAL[i % 4]; rr(k, x, base - hh, BW, hh, [12, 12, 3, 3]); k.fill();
      // 棒の上の点（さらに遅れて出る）
      const d = spring(lu - t0 - 0.34, 16, 7) * (1 - eIn(P(lu, 1.7 + i * 0.045, 1.9 + i * 0.045)));
      if (d > 0.01) { k.fillStyle = '#fff'; k.beginPath(); k.arc(x + BW / 2, base - hh - 16, 6.5 * d, 0, 7); k.fill(); }
    }
  };

  // @element 03
  // 03 バースト（「いいね」のハートが点くと同時に、まわりに線と粒が弾ける）
  CELLS[2] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), X = w / 2, Y = h / 2 + 2, t0 = 0.5, tt = lu - t0;
    const ant = eIOs(P(lu, 0.3, t0)), off = P(lu, 1.92, 2.2);
    const sc = tt < 0 ? 1 - 0.3 * ant : 0.7 + 0.3 * spring(tt, 16, 6.5) + 0.0;
    if (tt > 0 && tt < 0.75) {
      const q = eOut5(tt / 0.6 > 1 ? 1 : tt / 0.6), fade = 1 - P(tt, 0.3, 0.72);
      // 輪
      k.strokeStyle = C.yel; k.lineWidth = Math.max(0.1, 16 * (1 - q)); k.beginPath(); k.arc(X, Y, 44 + 46 * q, 0, 7); if (q < 0.98) k.stroke();
      // 放射の線
      k.lineCap = 'round';
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2 - Math.PI / 2, r1 = 64 + 66 * q, len = 36 * (1 - P(tt, 0.22, 0.7));
        if (len > 0.5) { k.strokeStyle = i % 2 ? C.mint : C.yel; k.lineWidth = 9; k.beginPath(); k.moveTo(X + Math.cos(a) * (r1 - len), Y + Math.sin(a) * (r1 - len) * 0.82); k.lineTo(X + Math.cos(a) * r1, Y + Math.sin(a) * r1 * 0.82); k.stroke(); }
        const a2 = a + Math.PI / 10, r2 = 58 + 92 * q;
        k.fillStyle = i % 2 ? C.coral : C.blue; k.globalAlpha = fade; k.beginPath(); k.arc(X + Math.cos(a2) * r2 * 1.45, Y + Math.sin(a2) * r2 * 0.78, 8 * (1 - q * 0.4), 0, 7); k.fill(); k.globalAlpha = 1;
      }
    }
    k.save(); k.translate(X, Y - 2); k.scale(sc, sc);
    heartPath(k, 46); k.lineJoin = 'round'; k.lineWidth = 7; k.strokeStyle = C.navy3; k.stroke();
    const fa = tt < 0 ? 0 : 1 - off;
    if (fa > 0) { k.globalAlpha = fa; k.fillStyle = C.coral; k.strokeStyle = C.coral; k.fill(); k.stroke(); k.globalAlpha = 1; }
    k.restore();
  };

  // @element 04
  // 04 ラインドロー（グラフの線が、描かれるように伸びる。消えるときは後ろから追いかける）
  function smoothPath(pts, n = 16) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } } out.push(pts[pts.length - 1]); return out; }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  function trim(k, pts, cum, f0, f1) { if (f1 - f0 <= 0.0005) return; const L = cum[cum.length - 1], a = L * f0, b = L * f1; k.beginPath(); const s = ptAt(pts, cum, f0); k.moveTo(s[0], s[1]); for (let i = 1; i < pts.length - 1; i++) if (cum[i] > a && cum[i] < b) k.lineTo(pts[i][0], pts[i][1]); const e = ptAt(pts, cum, f1); k.lineTo(e[0], e[1]); k.stroke(); }
  const LD = (() => { const a = smoothPath([[84, 158], [150, 126], [212, 146], [284, 86], [346, 108], [410, 60], [468, 34]]); const ax = [[70, 26], [70, 178], [486, 178]]; return { a, ac: pathLen(a), ax, axc: pathLen(ax) }; })();
  CELLS[3] = (k, w, h, u) => {
    stage(k);
    k.lineCap = 'round'; k.lineJoin = 'round';
    const er = eIO(P(u, 3.85, 4.55));
    // 軸
    k.strokeStyle = C.navy3; k.lineWidth = 6; trim(k, LD.ax, LD.axc, er, eIO(P(u, 0.08, 0.7)));
    // 線
    const f1 = eIO(P(u, 0.4, 1.95)), f0 = eIO(P(u, 3.65, 4.45));
    k.strokeStyle = C.mint; k.lineWidth = 11; trim(k, LD.a, LD.ac, f0, f1);
    // 矢じり
    const ah = backOut(P(u, 1.9, 2.2), 2.5) * (1 - P(u, 4.3, 4.45));
    if (ah > 0.01) { const e = ptAt(LD.a, LD.ac, 1); k.save(); k.translate(e[0], e[1]); k.rotate(e[2]); k.beginPath(); k.moveTo(-26 * ah, -20 * ah); k.lineTo(4, 0); k.lineTo(-26 * ah, 20 * ah); k.stroke(); k.restore(); }
    // 描いている先端
    if (f1 > 0 && f1 < 1) { const e = ptAt(LD.a, LD.ac, f1); k.fillStyle = C.yel; k.beginPath(); k.arc(e[0], e[1], 12, 0, 7); k.fill(); k.fillStyle = '#fff'; k.beginPath(); k.arc(e[0], e[1], 5, 0, 7); k.fill(); }
    // 山の点に丸が描かれる
    const cf = eIO(P(u, 2.2, 2.8)), cb = eIO(P(u, 3.5, 4.0));
    if (cf > cb) { k.strokeStyle = C.coral; k.lineWidth = 7; k.beginPath(); k.arc(284, 86, 26, -Math.PI / 2 + cb * Math.PI * 2, -Math.PI / 2 + cf * Math.PI * 2); k.stroke(); }
  };

  // @element 05
  // 05 マスクリビール（見えない枠＝線の向こうから、見出しがせり上がる）
  CELLS[4] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), X = w / 2, LY = 124;
    const lg = eIO(P(lu, 0.1, 0.5)) * (1 - eIO(P(lu, 2.05, 2.3)));
    // 上の段：線の下から上へ
    const up = (1 - eOut5(P(lu, 0.35, 1.0))) * 120 + backIn(P(lu, 1.7, 2.05), 1.2) * -150;
    k.save(); k.beginPath(); k.rect(0, 8, w, LY - 8 - 5); k.clip();
    txt(k, 'Hello!', X, LY - 14 + up, `800 98px ${DISP}`, '#fff', 'center', 'alphabetic', '1px');
    k.restore();
    // 下の段：線の上から下へ
    const dn = (1 - eOut5(P(lu, 0.55, 1.15))) * -60 + eIn(P(lu, 1.75, 2.05)) * 70;
    k.save(); k.beginPath(); k.rect(0, LY + 5, w, 52); k.clip();
    txt(k, 'はじめまして', X, LY + 44 + dn, `700 32px ${JP}`, C.yel, 'center', 'alphabetic', '6px');
    k.restore();
    if (lg > 0.005) { k.fillStyle = C.coral; rr(k, X - 190 * lg, LY - 3, 380 * lg, 6, 3); k.fill(); }
  };

  // @element 06
  // 06 タイプライター（入力欄に1文字ずつ打たれ、打ち終わると送信ボタンが点く）
  CELLS[5] = (k, w, h, u) => {
    stage(k);
    const S = 'ねこの動画つくって', N = [...S].length, t0 = 0.3, dt = 0.24, done = t0 + N * dt;
    const BX = 34, BY = 58, BW = w - 68, BH = 92;
    const sendT = done + 0.55, clr = P(u, sendT + 0.12, sendT + 0.4);
    k.fillStyle = '#fff'; rr(k, BX, BY, BW, BH, 30); k.fill();
    const f = `600 36px ${JP}`; k.font = f;
    let n = clamp(Math.floor((u - t0) / dt) + 1, 0, N); if (u < t0) n = 0;
    let x = BX + 32; const y = BY + BH / 2 + 2;
    k.save(); rr(k, BX, BY, BW - 86, BH, 30); k.clip();
    [...S].slice(0, n).forEach((ch, i) => {
      const age = u - (t0 + i * dt), pop = 1 + 0.35 * Math.exp(-age * 16), cw = k.measureText(ch).width;
      k.save(); k.translate(x + cw / 2, y - clr * 70); k.scale(pop, pop); k.globalAlpha = 1 - clr;
      txt(k, ch, 0, 0, f, C.navy, 'center', 'middle'); k.restore(); k.font = f; x += cw + 1;
    });
    k.restore();
    if (clr > 0.5) x = BX + 32;
    // カーソル（打っている間は点灯。待ちの間は0.94秒周期でゆっくり明滅）
    const typing = u >= t0 - 0.05 && u < done + 0.1, blink = typing ? 1 : (mod(u, 0.94) < 0.5 ? 1 : 0);
    if (blink) { k.fillStyle = C.coral; rr(k, x + 4, y - 23, 5, 44, 2.5); k.fill(); }
    // 送信ボタン
    const on = spring(u - done - 0.12, 15, 6.5) * (1 - P(u, sendT + 0.5, sendT + 0.8)), press = 1 - 0.2 * Math.sin(Math.PI * P(u, sendT - 0.05, sendT + 0.2));
    const bx = BX + BW - 48, by = BY + BH / 2;
    k.fillStyle = '#DDE3F3'; k.beginPath(); k.arc(bx, by, 30, 0, 7); k.fill();
    if (on > 0.01) { k.fillStyle = C.blue; k.beginPath(); k.arc(bx, by, 30 * Math.min(on, 1.25) * press, 0, 7); k.fill(); }
    k.strokeStyle = '#fff'; k.lineWidth = 6; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(bx, by + 12); k.lineTo(bx, by - 12); k.moveTo(bx - 11, by - 2); k.lineTo(bx, by - 13); k.lineTo(bx + 11, by - 2); k.stroke();
  };

  // @element 07
  // 07 カウントアップ（数字が勢いよく増えて、最後にピタッと決まる）
  CELLS[6] = (k, w, h, u) => {
    stage(k);
    const TARGET = 2480, a = P(u, 0.1, 0.4) * (1 - P(u, 4.0, 4.4));
    const p = P(u, 0.45, 2.9), v = Math.round(TARGET * (1 - Math.pow(1 - p, 4)));
    const s = v.toLocaleString('en-US'), f = `800 104px ${DISP}`;
    k.font = f; const dw = k.measureText('0').width + 2, cw = k.measureText(',').width;
    const full = TARGET.toLocaleString('en-US'); let tot = 0; for (const ch of full) tot += ch === ',' ? cw : dw;
    const land = u - 2.9, pop = 1 + (land > 0 ? 0.07 * Math.exp(-7 * land) * Math.cos(15 * land) : 0);
    const X = w / 2 + 42, Y = 96;
    k.save(); k.globalAlpha = a; k.translate(X, Y); k.scale(pop, pop);
    let x = tot / 2;   // 右そろえ
    const speed = p < 1 ? Math.pow(1 - p, 3) : 0;
    for (const ch of [...s].reverse()) {
      const cwid = ch === ',' ? cw : dw; x -= cwid;
      txt(k, ch, x + cwid / 2, 0, f, land > 0 ? C.yel : '#fff', 'center', 'middle');
    }
    k.restore();
    // 上向きの矢印チップ
    const ar = spring(u - 0.35, 14, 7) * (1 - P(u, 4.0, 4.3)), bob = speed * 6 * Math.sin(u * 30);
    if (ar > 0.01) { k.save(); k.translate(X - tot / 2 - 58, Y - 2 + bob); k.scale(ar, ar); k.fillStyle = C.mint; k.beginPath(); k.arc(0, 0, 34, 0, 7); k.fill(); k.strokeStyle = C.navy; k.lineWidth = 8; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(0, 15); k.lineTo(0, -14); k.moveTo(-13, -1); k.lineTo(0, -15); k.lineTo(13, -1); k.stroke(); k.restore(); }
    // 下のバー
    const bw = 330, bx = w / 2 - bw / 2, by = 168;
    k.globalAlpha = a; k.fillStyle = C.navy3; rr(k, bx, by, bw, 12, 6); k.fill();
    const g = k.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.mint);
    k.fillStyle = g; rr(k, bx, by, Math.max(12, bw * (v / TARGET)), 12, 6); k.fill(); k.globalAlpha = 1;
  };

  // @element 08
  // 08 キネティックタイポグラフィ（言葉の意味に合わせて文字が動く：のびる／はねる／まわる／ドン！）
  CELLS[7] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, n = Math.min(3, Math.floor(u / T)), lu = u - n * T, X = w / 2, Y = h / 2 + 6;
    const out = P(lu, T - 0.2, T - 0.02), oa = 1 - out, oy = -46 * eIn(out);
    const f = `800 88px ${JP}`;
    k.save(); k.translate(X, Y + oy); k.globalAlpha = oa;
    if (n === 0) {
      const sp = spring(lu - 0.05, 12, 4.2), sx = 0.3 + 0.7 * sp, sy = 1 / Math.sqrt(Math.max(0.75, sx));
      k.globalAlpha = oa * P(lu, 0.03, 0.12); k.scale(sx, sy); txt(k, 'のびる', 0, 0, f, C.blue, 'center', 'middle', '4px');
    } else if (n === 1) {
      chars(k, 'はねる', f, 6).forEach((c, i) => {
        const tt = lu - 0.06 - i * 0.1; if (tt < 0) return;
        const y = -78 * Math.abs(Math.sin(Math.PI * tt / 0.4)) * Math.exp(-2.6 * tt), near = Math.abs(Math.sin(Math.PI * tt / 0.4)) < 0.25 ? 1 : 0;
        const sq = 1 - 0.16 * near * Math.exp(-2.6 * tt), a = P(tt, 0, 0.08);
        k.save(); k.globalAlpha = oa * a; k.translate(c.x, y + 44); k.scale(2 - sq, sq); txt(k, c.ch, 0, -44, f, C.yel, 'center', 'middle'); k.restore();
      });
    } else if (n === 2) {
      chars(k, 'まわる', f, 6).forEach((c, i) => {
        const tt = lu - 0.05 - i * 0.12; if (tt < 0) return;
        const q = backOut(P(tt, 0, 0.62), 1.3), sc = eOut(P(tt, 0, 0.25));
        k.save(); k.translate(c.x, 0); k.rotate((1 - q) * -Math.PI * 2); k.scale(sc, sc); txt(k, c.ch, 0, 0, f, C.mint, 'center', 'middle'); k.restore();
      });
    } else {
      const hit = 0.2, tt = lu - hit, sc = tt < 0 ? lerp(3.4, 1, eIn(P(lu, 0.02, hit))) : 1;
      const dx = tt > 0 ? 10 * Math.exp(-9 * tt) * Math.sin(38 * tt) : 0, sy = tt > 0 ? 1 - 0.2 * Math.exp(-11 * tt) : 1;
      k.globalAlpha = oa * P(lu, 0.02, 0.1);
      if (tt > 0 && tt < 0.4) { const q = eOut(tt / 0.4); k.strokeStyle = C.yel; k.lineWidth = 7 * (1 - q); k.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2, r0 = 120 + 50 * q, r1 = r0 + 26; k.beginPath(); k.moveTo(Math.cos(a) * r0 * 1.35, Math.sin(a) * r0 * 0.5); k.lineTo(Math.cos(a) * r1 * 1.35, Math.sin(a) * r1 * 0.5); if (q < 0.97) k.stroke(); } }
      k.translate(dx, 44); k.scale(sc * (2 - sy), sc * sy); k.transform(1, 0, -0.14, 1, 0, 0); txt(k, 'ドン!', 0, -44, `800 100px ${JP}`, C.coral, 'center', 'middle');
    }
    k.restore();
  };

  // @element 09
  // 09 イージング（同じ距離・同じ時間。上は一定の速さ、下は緩急あり）
  const EZ = bez(.86, 0, .14, 1);
  const EZT = [0.2, 1.75, 2.55, 4.1];
  const ezPos = u => { if (u < EZT[0]) return 0; if (u < EZT[1]) return P(u, EZT[0], EZT[1]); if (u < EZT[2]) return 1; if (u < EZT[3]) return 1 - P(u, EZT[2], EZT[3]); return 0; };
  const ezE = u => { if (u < EZT[0]) return 0; if (u < EZT[1]) return EZ(P(u, EZT[0], EZT[1])); if (u < EZT[2]) return 1; if (u < EZT[3]) return 1 - EZ(P(u, EZT[2], EZT[3])); return 0; };
  CELLS[8] = (k, w, h, u) => {
    stage(k);
    const x0 = 162, x1 = 478, D = x1 - x0, y1 = 58, y2 = 150, S = 62;
    const lin = ezPos(u), mv = (u >= EZT[0] && u < EZT[1]) ? 1 : (u >= EZT[2] && u < EZT[3]) ? -1 : 0, pp = mv === 1 ? P(u, EZT[0], EZT[1]) : mv === -1 ? P(u, EZT[2], EZT[3]) : 0;
    const ez = mv === 1 ? EZ(pp) : mv === -1 ? 1 - EZ(pp) : lin;
    const vel = mv ? (EZ(Math.min(1, pp + 0.01)) - EZ(Math.max(0, pp - 0.01))) / 0.02 : 0, vn = clamp(vel / 3.6);
    // ラベル
    txt(k, '一定', 24, y1 + 1, `700 34px ${JP}`, C.dim, 'left', 'middle');
    txt(k, '緩急', 24, y2 + 1, `700 34px ${JP}`, C.yel, 'left', 'middle');
    // レール＋0.1秒ごとの位置
    [[y1, x => x, '#34489A'], [y2, EZ, '#34489A']].forEach(([y, f, col]) => {
      k.strokeStyle = C.navy2; k.lineWidth = 6; k.lineCap = 'round'; k.beginPath(); k.moveTo(x0, y); k.lineTo(x1, y); k.stroke();
      k.fillStyle = col; for (let i = 0; i <= 11; i++) { k.beginPath(); k.arc(x0 + f(i / 11) * D, y, 5, 0, 7); k.fill(); }
    });
    // 上：一定（形も色も動かない）
    k.fillStyle = '#6677AD'; rr(k, x0 + lin * D - S / 2, y1 - S / 2, S, S, 16); k.fill();
    // 下：緩急あり（速いところで伸び、尾を引く）
    const X = x0 + ez * D;
    if (vn > 0.05) {
      k.lineCap = 'round';
      [[-20, C.yel, 1], [0, C.coral, 1.25], [20, C.yel, 0.8]].forEach(([dy, col, m]) => { k.strokeStyle = col; k.globalAlpha = 0.9 * vn; k.lineWidth = 10; k.beginPath(); k.moveTo(X - mv * (S / 2), y2 + dy); k.lineTo(X - mv * (S / 2 + 150 * vn * m), y2 + dy); k.stroke(); });
      k.globalAlpha = 1;
    }
    // 残像（少し前の位置を薄く重ねる）
    for (let g = 4; g >= 1; g--) { const gx = x0 + ezE(u - g * 0.035) * D; if (Math.abs(gx - X) > 3) { k.globalAlpha = 0.16 * (5 - g) / 4 + 0.06; k.fillStyle = C.coral; rr(k, gx - S / 2, y2 - S / 2, S, S, 16); k.fill(); } } k.globalAlpha = 1;
    const sx = 1 + 0.5 * vn, sy = 1 - 0.2 * vn;
    k.save(); k.translate(X, y2); k.scale(sx, sy); k.fillStyle = C.coral; rr(k, -S / 2, -S / 2, S, S, 16); k.fill(); k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.arc(S / 2 - 18, -S / 2 + 18, 6, 0, 7); k.fill(); k.restore();
  };

  // @element 10
  // 10 オーバーシュート（メーターの針が、目標を行き過ぎてから戻って止まる）
  CELLS[9] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h - 26, R = 128, TG = 0.7;
    let v;
    if (u < 0.25) v = 0; else if (u < 3.7) { const t = u - 0.25; v = TG * (1 - Math.exp(-4.6 * t) * Math.cos(10.5 * t)); } else { const t = u - 3.7; v = TG * Math.exp(-7.5 * t) * Math.cos(8.5 * t); }
    const ang = x => Math.PI + x * Math.PI;
    k.lineCap = 'round';
    k.strokeStyle = C.navy2; k.lineWidth = 26; k.beginPath(); k.arc(X, Y, R, ang(0), ang(1)); k.stroke();
    if (v > 0.005) { const g = k.createLinearGradient(X - R, 0, X + R, 0); g.addColorStop(0, C.blue); g.addColorStop(1, C.mint); k.strokeStyle = g; k.beginPath(); k.arc(X, Y, R, ang(0), ang(v)); k.stroke(); }
    // 行き過ぎた分（目標より先）はコーラルで見せる
    if (v > TG + 0.004) { k.strokeStyle = C.coral; k.lineCap = 'butt'; k.beginPath(); k.arc(X, Y, R, ang(TG), ang(v)); k.stroke(); k.lineCap = 'round'; }
    // 目標の印
    const ta = ang(TG);
    k.strokeStyle = C.yel; k.lineWidth = 7; k.beginPath(); k.moveTo(X + Math.cos(ta) * (R - 22), Y + Math.sin(ta) * (R - 22)); k.lineTo(X + Math.cos(ta) * (R + 30), Y + Math.sin(ta) * (R + 30)); k.stroke();
    k.fillStyle = C.yel; k.beginPath(); k.arc(X + Math.cos(ta) * (R + 38), Y + Math.sin(ta) * (R + 38), 8, 0, 7); k.fill();
    // 針
    const a = ang(v);
    k.strokeStyle = '#fff'; k.lineWidth = 9; k.beginPath(); k.moveTo(X, Y); k.lineTo(X + Math.cos(a) * (R - 26), Y + Math.sin(a) * (R - 26)); k.stroke();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(X, Y, 17, 0, 7); k.fill(); k.fillStyle = C.coral; k.beginPath(); k.arc(X, Y, 8, 0, 7); k.fill();
  };

  // @element 11
  // 11 スクワッシュ＆ストレッチ（弾むキャラクターが、着地でつぶれ、飛ぶときに伸びる）
  CELLS[10] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, q = mod(u, T) / T, c = 0.1, floor = h - 28, R = 37, Hgt = 92;
    const X = w / 2 + 150 * Math.sin(u / CYC * Math.PI * 2);
    let sy, yb, grounded = false;
    if (q < c || q > 1 - c) { const d = (q < c ? q : 1 - q) / c; sy = lerp(0.52, 1.28, d * d); yb = floor; grounded = true; }
    else { const qq = (q - c) / (1 - 2 * c), sp = Math.abs(2 * qq - 1); yb = floor - Hgt * (1 - sp * sp); sy = 1 + 0.28 * Math.pow(sp, 3); }
    const sx = 1 / sy, hg = (floor - yb) / Hgt;
    k.fillStyle = C.navy3; rr(k, 40, floor, w - 80, 5, 2.5); k.fill();
    k.fillStyle = 'rgba(0,0,0,.32)'; k.beginPath(); k.ellipse(X, floor + 9, R * 1.2 * (1 - hg * 0.55) * Math.max(1, sx), 6 * (1 - hg * 0.5), 0, 0, 7); k.fill();
    // 着地の小さなしぶき
    const dq = q < 0.5 ? q : q - 1; if (Math.abs(dq) < 0.16 && dq > -0.02) { const t = (dq + 0.02) / 0.18; k.strokeStyle = C.yel; k.lineWidth = 5 * (1 - t); k.lineCap = 'round';[-1, 1].forEach(s => { k.beginPath(); k.moveTo(X + s * (50 + 28 * t), floor - 6 - 10 * t); k.lineTo(X + s * (62 + 40 * t), floor - 12 - 20 * t); if (t < 0.97) k.stroke(); }); }
    k.save(); k.translate(X, yb); k.scale(sx, sy);
    k.fillStyle = C.coral; k.beginPath(); k.arc(0, -R, R, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.ellipse(-12, -R - 4, 7, 9.5, 0, 0, 7); k.ellipse(12, -R - 4, 7, 9.5, 0, 0, 7); k.fill();
    k.fillStyle = C.navy; k.beginPath(); k.arc(-10.5, -R - 3, 3.8, 0, 7); k.arc(13.5, -R - 3, 3.8, 0, 7); k.fill();
    k.restore();
  };

  // @element 12
  // 12 モーフィング（● → ■ → ★ → ♥ と、形と色がなめらかに変わる）
  const MN = 240;
  const SHAPES = (() => {
    const R = 64, mk = fn => { const a = []; for (let i = 0; i < MN; i++) a.push(fn(i / MN)); return a; };
    const circle = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; return [Math.cos(a) * R, Math.sin(a) * R]; });
    const sq = mk(t => { const a = t * Math.PI * 2 - Math.PI / 2; let r = R * 0.88 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); r = Math.min(r, R * 1.13); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const st = mk(t => { const seg = 1 / 10, j = Math.floor(t / seg), f = (t - j * seg) / seg, ro = R * 1.2, ri = R * 0.56; const a0 = j * Math.PI / 5 - Math.PI / 2, a1 = (j + 1) * Math.PI / 5 - Math.PI / 2, r0 = j % 2 ? ri : ro, r1 = j % 2 ? ro : ri; return [lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, f), lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, f)]; });
    const hp = mk(t => { const a = t * Math.PI * 2, s = R / 15.5; return [16 * Math.pow(Math.sin(a), 3) * s, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s - 4]; });
    return [circle, sq, st, hp];
  })();
  const MCOL = [C.blue, C.coral, C.yel, C.mint];
  CELLS[11] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, i = Math.min(3, Math.floor(u / T)), lu = u - i * T;
    const pr = P(lu, T - 0.62, T - 0.04), p = backOut(pr, 1.6), pc = eIOs(pr);
    const A = SHAPES[i], B = SHAPES[(i + 1) % 4], X = w / 2, Y = h / 2 + 3;
    // 次の形の予告（左右の小さな点）
    for (let j = 0; j < 4; j++) { const on = j === i ? 1 - pc : j === (i + 1) % 4 ? pc : 0; k.fillStyle = mix(C.navy3, MCOL[j], on); k.beginPath(); k.arc(X - 39 + j * 26, h - 16, 5 + 2 * on, 0, 7); k.fill(); }
    const pulse = 1 + 0.07 * Math.sin(Math.PI * pr);
    k.save(); k.translate(X, Y - 8); k.scale(pulse, pulse);
    k.fillStyle = mix(MCOL[i], MCOL[(i + 1) % 4], pc); k.beginPath();
    for (let j = 0; j < MN; j++) { const x = lerp(A[j][0], B[j][0], p), y = lerp(A[j][1], B[j][1], p); j ? k.lineTo(x, y) : k.moveTo(x, y); }
    k.closePath(); k.lineJoin = 'round'; k.strokeStyle = k.fillStyle; k.lineWidth = 8; k.stroke(); k.fill(); k.restore();
  };

  // @element 13
  // 13 リキッドモーション（しずくが伸びて、ちぎれて、ぬるっと1つにまとまる）
  const LQ = bez(.7, 0, .2, 1);
  const lqPos = uu => { const u = mod(uu, CYC); let p; if (u < 0.35) p = 0; else if (u < 1.45) p = LQ(P(u, 0.35, 1.45)); else if (u < 2.7) p = 1; else if (u < 3.8) p = 1 - LQ(P(u, 2.7, 3.8)); else p = 0; const mvp = (u >= 0.35 && u < 1.45) ? P(u, 0.35, 1.45) : (u >= 2.7 && u < 3.8) ? P(u, 2.7, 3.8) : 0; return [lerp(120, 420, p), 104 - 34 * Math.sin(Math.PI * mvp)]; };
  CELLS[12] = (k, w, h, u) => {
    stage(k);
    const blobs = [];
    for (let i = 0; i < 8; i++) { const [x, y] = lqPos(u - i * 0.065); blobs.push([x, y + (i ? 6 * Math.sin(u * 2.67 + i) : 0), lerp(44, 15, i / 7)]); }
    // 止まっている間、まわりで小さなしずくが出入りする
    for (let j = 0; j < 3; j++) { const [x, y] = lqPos(u - 0.1), a = j * 2.2 + 0.6, d = 34 + 30 * (0.5 - 0.5 * Math.cos(u / CYC * Math.PI * 4 + j * 2.1)); blobs.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 15 - j * 2]); }
    const L = goo(g => { for (const b of blobs) { g.beginPath(); g.arc(b[0], b[1], b[2], 0, 7); g.fill(); } }, 9, g => { const gr = g.createLinearGradient(60, 30, 480, 180); gr.addColorStop(0, C.mint); gr.addColorStop(0.55, C.blue); gr.addColorStop(1, '#7C5CFF'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    k.drawImage(L, 0, 0);
    const [hx, hy] = lqPos(u); k.fillStyle = 'rgba(255,255,255,.75)'; k.beginPath(); k.ellipse(hx - 14, hy - 17, 10, 6, -0.6, 0, 7); k.fill();
  };

  // @element 14
  // 14 モーショントレイル（動いた跡に、残像が尾を引く）
  CELLS[13] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h / 2 + 2, A = 196, B = 62, th = u / CYC * Math.PI * 2;
    const pt = a => [X + A * Math.sin(a), Y + B * Math.sin(2 * a)];
    const N = 15;
    for (let i = N; i >= 1; i--) {
      const [x, y] = pt(th - i * 0.105), f = i / N;
      k.globalAlpha = 0.9 * (1 - f) + 0.05; k.fillStyle = f < 0.5 ? mix(C.coral, C.yel, f * 2) : mix(C.yel, C.blue, (f - 0.5) * 2);
      k.beginPath(); k.arc(x, y, lerp(22, 6, f), 0, 7); k.fill();
    }
    k.globalAlpha = 1; const [x, y] = pt(th);
    k.fillStyle = C.coral; k.beginPath(); k.arc(x, y, 25, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x, y, 11, 0, 7); k.fill();
  };

  // @element 15
  // 15 パーティクル（粒が次々と噴き出して、飛び散って落ちる）
  const PARTS = (() => { const R = rand(15), a = []; for (let i = 0; i < 84; i++) { const n = R() < 0.5 ? 2 : 3; a.push({ T: CYC / n, ph: R() * CYC, vx: (R() - 0.5) * 2 * 190, vy: -(250 + R() * 150), sz: 5 + R() * 6, col: PAL[i % 4], kind: i % 3, spin: (R() - 0.5) * 9 }); } return a; })();
  CELLS[14] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h - 20, G = 470;
    for (const p of PARTS) {
      const t = mod(u + p.ph, p.T), life = Math.min(p.T, 1.5); if (t > life) continue;
      const x = X + p.vx * t, y = Y + p.vy * t + 0.5 * G * t * t, a = Math.min(1, t / 0.06) * (1 - smooth(P(t, life * 0.7, life))), sc = lerp(1.15, 0.7, t / life);
      k.globalAlpha = a; k.fillStyle = p.col; k.save(); k.translate(x, y); k.rotate(t * p.spin); k.scale(sc, sc);
      if (p.kind === 0) { k.beginPath(); k.arc(0, 0, p.sz, 0, 7); k.fill(); }
      else if (p.kind === 1) { k.fillRect(-p.sz, -p.sz, p.sz * 2, p.sz * 2); }
      else { k.beginPath(); k.moveTo(0, -p.sz * 1.3); k.lineTo(p.sz * 1.2, p.sz); k.lineTo(-p.sz * 1.2, p.sz); k.closePath(); k.fill(); }
      k.restore();
    }
    k.globalAlpha = 1;
    k.fillStyle = C.navy3; rr(k, X - 70, h - 12, 140, 30, 10); k.fill();
    k.fillStyle = '#fff'; rr(k, X - 30, h - 22, 60, 30, 10); k.fill();
  };

  // @element 16
  // 16 パララックス（手前ほど大きく、奥ほど小さく動いて、奥行きが出る）
  const PLX = (() => {
    const R = rand(16), ridge = (base, amp, step, seed) => { const r = rand(seed), pts = []; for (let x = -220; x <= CW + 220; x += step) pts.push([x, base - amp * (0.35 + 0.65 * r())], [x + step / 2, base + amp * 0.1 * r()]); return pts; };
    const stars = []; for (let i = 0; i < 16; i++) stars.push([R() * (CW + 80) - 40, 12 + R() * 80, 1.5 + R() * 2]);
    const trees = []; for (let i = 0; i < 9; i++) trees.push([-160 + i * 108 + R() * 30, 34 + R() * 24, i % 3]);
    return { far: ridge(150, 78, 120, 3), mid: ridge(172, 74, 92, 8), stars, trees };
  })();
  CELLS[15] = (k, w, h, u) => {
    const pan = 108 * Math.sin(u / CYC * Math.PI * 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0F1A3D'); g.addColorStop(1, '#27408F'); k.fillStyle = g; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff'; for (const s of PLX.stars) { k.globalAlpha = 0.8; k.beginPath(); k.arc(s[0] - pan * 0.05, s[1], s[2], 0, 7); k.fill(); } k.globalAlpha = 1;
    // 月（いちばん奥・ほぼ動かない）
    k.fillStyle = C.yel; k.beginPath(); k.arc(390 - pan * 0.1, 56, 30, 0, 7); k.fill();
    const poly = (pts, m, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(-260, h + 10); pts.forEach(p => k.lineTo(p[0] - pan * m, p[1])); k.lineTo(w + 260, h + 10); k.closePath(); k.fill(); };
    poly(PLX.far, 0.28, '#31499C');
    poly(PLX.mid, 0.6, C.blue);
    // 手前の丘と木
    k.fillStyle = C.mint; k.beginPath(); k.moveTo(-300, h + 10); for (let x = -300; x <= w + 300; x += 20) k.lineTo(x - pan * 1.25, 176 + 12 * Math.sin(x * 0.012)); k.lineTo(w + 300, h + 10); k.closePath(); k.fill();
    for (const t of PLX.trees) { const x = t[0] - pan * 1.25, by = 180 + 12 * Math.sin(t[0] * 0.012), hh = t[1] * 1.45; k.fillStyle = C.navy; k.fillRect(x - 4, by - 16, 8, 22); k.fillStyle = t[2] === 0 ? C.coral : '#12A57B'; k.beginPath(); k.moveTo(x, by - hh); k.lineTo(x + 20, by - 12); k.lineTo(x - 20, by - 12); k.closePath(); k.fill(); }
    // いちばん手前（ボケた葉影のように大きく速く動く）
    k.fillStyle = '#0A1230';[[-40, 60], [300, 44], [620, 66]].forEach(([x, r]) => { k.beginPath(); k.arc(x - pan * 2.1, h + 18, r, 0, 7); k.fill(); });
  };

  // @shared
  // 画面A＝昼（クリーム・コーラルの太陽）／画面B＝夜（濃紺・黄色の月）。A→B→A で1周期
  const SUN = [112, 104], MOON = [CW - 112, 104];
  function scrA(k, w, h) {
    k.fillStyle = C.cream; k.fillRect(0, 0, w, h);
    k.fillStyle = '#FFD9A8'; k.beginPath(); k.arc(SUN[0], SUN[1], 66, 0, 7); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.arc(SUN[0], SUN[1], 44, 0, 7); k.fill();
    txt(k, 'DAY', 214, h / 2 + 4, `800 96px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.fillStyle = '#fff'; rr(k, 400, 34, 96, 26, 13); k.fill(); rr(k, 430, 20, 50, 26, 13); k.fill();
  }
  function scrB(k, w, h) {
    k.fillStyle = '#16255A'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff';[[40, 30, 3], [150, 170, 2.5], [250, 24, 2.5], [330, 180, 3], [500, 30, 2.5], [20, 150, 2], [300, 100, 0]].forEach(s => { k.beginPath(); k.arc(s[0], s[1], s[2], 0, 7); k.fill(); });
    k.fillStyle = C.yel; k.beginPath(); k.arc(MOON[0], MOON[1], 46, 0, 7); k.fill();
    k.fillStyle = '#16255A'; k.beginPath(); k.arc(MOON[0] + 22, MOON[1] - 14, 38, 0, 7); k.fill();
    txt(k, 'NIGHT', 40, h / 2 + 4, `800 88px ${DISP}`, '#fff', 'left', 'middle', '1px');
  }
  const SCR = [scrA, scrB];
  const SEG3 = CYC / 2;
  function abCell(trans) { return (k, w, h, u) => { const sgi = Math.min(1, Math.floor(u / SEG3)), uu = u - sgi * SEG3; trans(k, w, h, uu, sgi, 1 - sgi); }; }
  const TA = 0.5, TB = 1.5;

  // @element 17
  // 17 マスクトランジション（丸や星の形の「窓」が広がり、その中に次の画面が見える）
  CELLS[16] = abCell((k, w, h, u, a, b) => {
    const p = eIO(P(u, TA - 0.05, TB + 0.1));
    SCR[a](k, w, h);
    if (p > 0) {
      const c = a === 0 ? SUN : MOON, shape = () => { if (a === 0) { k.beginPath(); k.arc(c[0], c[1], lerp(0, 470, p), 0, 7); } else star(k, c[0], c[1], lerp(0, 1150, p), p * 1.2, 0.5); };
      k.save(); shape(); k.clip(); SCR[b](k, w, h); k.restore();
      if (p < 1) { k.strokeStyle = '#fff'; k.lineWidth = 7; k.lineJoin = 'round'; shape(); k.stroke(); }
    }
  });

  // @element 18
  // 18 シェイプトランジション（色のついた帯が画面を覆い隠し、抜けると次の画面になっている）
  CELLS[17] = abCell((k, w, h, u, a, b) => {
    const p1 = P(u, TA - 0.12, TA + 0.5), p2 = P(u, TA + 0.62, TA + 1.25), N = 4, sk = 80;
    SCR[p1 >= 1 ? b : a](k, w, h);
    const cols = [C.blue, C.coral, C.yel, C.mint];
    for (let i = 0; i < N; i++) {
      const d = i * 0.14, e1 = eIO(clamp((p1 - d) / (1 - 0.42))), e2 = eIO(clamp((p2 - d) / (1 - 0.42)));
      if (e1 <= 0 || e2 >= 1) continue;
      const bh = h / N + 1, y = i * h / N, span = w + sk + 20, dir = a === 0 ? 1 : -1;
      let xa = -sk - 10 + e2 * span, xb = -sk - 10 + e1 * span;
      k.save(); if (dir < 0) { k.translate(w, 0); k.scale(-1, 1); }
      k.fillStyle = cols[i]; k.beginPath(); k.moveTo(xa + sk, y); k.lineTo(xb + sk, y); k.lineTo(xb, y + bh); k.lineTo(xa, y + bh); k.closePath(); k.fill(); k.restore();
    }
  });

  // @element 19
  // 19 リキッドトランジション（ペンキのような液体が上から垂れて流れ込み、次の画面になる）
  const DRIPS = [0, 1].map(s => { const R = rand(190 + s * 7), a = []; for (let i = 0; i < 7; i++) a.push({ x: 36 + i * 78 + (R() - 0.5) * 30, len: 30 + R() * 80, wd: 15 + R() * 12, ph: R() * 6 }); return a; });
  function liquidShape(g, w, h, p, set, u) {
    const base = lerp(-110, h + 130, p), amp = Math.sin(Math.PI * clamp(p * 1.1));
    g.beginPath(); g.moveTo(-20, -40);
    for (let x = -20; x <= w + 20; x += 10) g.lineTo(x, base + amp * (13 * Math.sin(x * 0.021 + u * 3 + set) + 8 * Math.sin(x * 0.05 + u * 4.3)));
    g.lineTo(w + 20, -40); g.closePath(); g.fill();
    for (const d of DRIPS[set]) { const L = d.len * (0.25 + amp * 0.9), y0 = base - 20; g.beginPath(); g.roundRect(d.x - d.wd, y0, d.wd * 2, L + 20, d.wd); g.fill(); g.beginPath(); g.arc(d.x, y0 + L + 18, d.wd * 1.25, 0, 7); g.fill(); }
  }
  CELLS[18] = abCell((k, w, h, u, a, b) => {
    const p1 = eIOs(P(u, TA - 0.15, TB)), p2 = eIOs(P(u, TA + 0.2, TB + 0.3));
    SCR[a](k, w, h);
    if (p1 > 0 && p2 < 1) k.drawImage(goo(g => liquidShape(g, w, h, p1, 0, u), 7, g => { g.fillStyle = a === 0 ? C.blue : C.coral; g.fillRect(0, 0, w, h); }), 0, 0);
    if (p2 >= 1) SCR[b](k, w, h);
    else if (p2 > 0) k.drawImage(goo(g => liquidShape(g, w, h, p2, 1, u + 1), 7, g => SCR[b](g, w, h)), 0, 0);
  });

  // @element 20
  // 20 ズームスルー（文字の「O」の穴へ突っ込んで、その先の画面へ抜ける）
  function ring(k, x, y, col) { k.strokeStyle = col; k.lineWidth = 21; k.beginPath(); k.arc(x, y, 35, 0, 7); k.stroke(); }
  const ZP = [{ x: 228, y: 106, r: 24.5 }, { x: 300, y: 106, r: 24.5 }];
  function scrX(k, w, h) { k.fillStyle = C.yel; k.fillRect(0, 0, w, h); const f = `800 118px ${DISP}`; txt(k, 'Z', 128, 110, f, C.navy, 'center', 'middle'); ring(k, 228, 106, C.navy); ring(k, 324, 106, C.navy); txt(k, 'M', 432, 110, f, C.navy, 'center', 'middle'); }
  function scrY(k, w, h) { k.fillStyle = C.blue; k.fillRect(0, 0, w, h); const f = `800 118px ${DISP}`; txt(k, 'G', 208, 110, f, '#fff', 'center', 'middle'); ring(k, 300, 106, '#fff'); txt(k, '!', 372, 110, f, C.yel, 'center', 'middle'); }
  const SCZ = [scrX, scrY], ZBG = [C.yel, C.blue];
  CELLS[19] = abCell((k, w, h, u, a, b) => {
    const po = ZP[a], Smax = Math.hypot(Math.max(po.x, w - po.x), Math.max(po.y, h - po.y)) / po.r * 1.08;
    const p = eIn(P(u, TA - 0.25, TB - 0.3)) * 0.8 + eOut(P(u, TB - 0.3, TB + 0.15)) * 0.2;
    if (p >= 1) return SCZ[b](k, w, h);
    const s = Math.pow(Smax, p), Z = (kk, sc) => { kk.translate(po.x, po.y); kk.scale(sc, sc); kk.translate(-po.x, -po.y); };
    k.save(); Z(k, s); SCZ[a](k, w, h);
    k.save(); k.beginPath(); k.arc(po.x, po.y, po.r, 0, 7); k.clip(); k.fillStyle = ZBG[b]; k.fillRect(0, 0, w, h); Z(k, 1 / Smax); SCZ[b](k, w, h); k.restore();
    k.restore();
  });

  // @element 21
  // 21 フリップ（カードが軸で回って裏返り、裏の面が出る）
  const FW = 300, FH = 156, FC = mkCanvas(FW, FH), FK = FC.getContext('2d');
  function flipFace(i) {
    FK.setTransform(1, 0, 0, 1, 0, 0); FK.clearRect(0, 0, FW, FH);
    FK.fillStyle = i ? C.yel : C.blue; rr(FK, 0, 0, FW, FH, 22); FK.fill();
    FK.strokeStyle = i ? 'rgba(15,26,61,.18)' : 'rgba(255,255,255,.3)'; FK.lineWidth = 4; rr(FK, 12, 12, FW - 24, FH - 24, 13); FK.stroke();
    txt(FK, i ? 'A' : 'Q', 92, FH / 2 + 4, `800 112px ${DISP}`, i ? C.navy : '#fff', 'center', 'middle');
    FK.fillStyle = i ? C.navy : '#fff'; FK.globalAlpha = i ? 0.85 : 0.9; rr(FK, 164, 50, 100, 14, 7); FK.fill(); FK.globalAlpha = i ? 0.4 : 0.5; rr(FK, 164, 76, 76, 12, 6); FK.fill(); rr(FK, 164, 98, 90, 12, 6); FK.fill(); FK.globalAlpha = 1;
  }
  CELLS[20] = abCell((k, w, h, u, a, b) => {
    stage(k);
    const pr = P(u, TA - 0.05, TB), th = Math.PI * backOut(pr, 1.5), c = Math.cos(th), s = Math.sin(th), front = c >= 0;
    flipFace(front ? a : b);
    const X = w / 2, Y = h / 2 - 2, lift = Math.sin(Math.PI * pr), sc = 1 + 0.08 * lift, ww = FW * Math.abs(c) * sc, per = 0.2 * s * (front ? 1 : -1);
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, h - 13, Math.max(8, ww / 2 * 0.9), 6, 0, 0, 7); k.fill();
    const STEP = 2;
    for (let sx = 0; sx < FW; sx += STEP) { const f = sx / FW, dx = X - ww / 2 + f * ww, hh = FH * sc * (1 + per * (f - 0.5) * 2); k.drawImage(FC, sx, 0, STEP, FH, dx, Y - hh / 2 - 6 * lift, ww / FW * STEP + 0.6, hh); }
    if (Math.abs(s) > 0.02) { k.fillStyle = `rgba(8,14,40,${0.34 * Math.abs(s)})`; k.beginPath(); const hl = FH * sc * (1 - per), hr = FH * sc * (1 + per), yy = Y - 6 * lift; k.moveTo(X - ww / 2, yy - hl / 2); k.lineTo(X + ww / 2, yy - hr / 2); k.lineTo(X + ww / 2, yy + hr / 2); k.lineTo(X - ww / 2, yy + hl / 2); k.closePath(); k.fill(); }
  });

  // @element 22
  // 22 ライトスイープ（ロゴの表面を、光の帯が斜めに横切る）
  CELLS[21] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 2, lu = mod(u, T), p = eIOs(P(lu, 0.45, 1.5));
    const BW = 400, BH = 112, X = w / 2 - BW / 2, Y = h / 2 - BH / 2;
    k.fillStyle = 'rgba(0,0,0,.3)'; rr(k, X + 3, Y + 9, BW, BH, 28); k.fill();
    const g = k.createLinearGradient(X, Y, X + BW, Y + BH); g.addColorStop(0, '#2B62E0'); g.addColorStop(1, '#4E8BFF'); k.fillStyle = g; rr(k, X, Y, BW, BH, 28); k.fill();
    k.fillStyle = C.yel; star(k, X + 64, Y + BH / 2, 30, 0, 0.5); k.lineJoin = 'round'; k.strokeStyle = C.yel; k.lineWidth = 5; k.stroke(); k.fill();
    txt(k, 'PREMIUM', X + 112, Y + BH / 2 + 3, `800 50px ${DISP}`, '#fff', 'left', 'middle', '3px');
    if (p > 0 && p < 1) {
      k.save(); rr(k, X, Y, BW, BH, 28); k.clip();
      k.translate(lerp(X - 130, X + BW + 130, p), Y + BH / 2); k.rotate(0.42);
      const gr = k.createLinearGradient(-58, 0, 58, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.72)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      k.fillStyle = gr; k.fillRect(-58, -160, 116, 320); k.fillStyle = 'rgba(255,255,255,.5)'; k.fillRect(78, -160, 12, 320);
      k.restore();
    }
    // 抜けぎわのきらめき
    const tt = lu - 1.38; if (tt > 0 && tt < 0.6) { const q = tt / 0.6, sc = Math.sin(Math.PI * q) * (1 + 0.2 * (1 - q)); k.save(); k.translate(X + BW - 8, Y + 6); k.rotate(q * 0.9); k.fillStyle = '#fff'; star(k, 0, 0, 30 * sc, 0, 0.22, 4); k.fill(); k.restore(); }
  };

  // @element 23
  // 23 グリッチ（文字が横にずれ、色がずれ、帯が走る。明るさの点滅はさせない）
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const GL = (() => { const R = rand(231), st = []; for (let s = 0; s < 12; s++) { const sl = [], n = 2 + Math.floor(R() * 3); for (let i = 0; i < n; i++) sl.push({ y: Math.floor(40 + R() * 110), h: 10 + Math.floor(R() * 26), dx: Math.round((R() < .5 ? -1 : 1) * (18 + R() * 46)) }); const bars = []; for (let i = 0; i < 3; i++) bars.push({ x: 30 + R() * 420, y: 30 + R() * 150, w: 30 + R() * 90, h: 5 + R() * 7, c: i }); st.push({ sl, bars, rgb: 7 + Math.round(R() * 9) }); } return st; })();
  const GLC = mkCanvas(CW, CH), GK = GLC.getContext('2d'), GLT = mkCanvas(CW, CH), GT = GLT.getContext('2d');
  CELLS[22] = (k, w, h, u) => {
    const content = kk => { txt(kk, 'GLITCH', w / 2, h / 2 + 4, `800 104px ${DISP}`, '#fff', 'center', 'middle', '2px'); };
    const step = 0.14; let si = -1;
    if (u >= 0.55 && u < 0.55 + step * 5) si = Math.floor((u - 0.55) / step);
    else if (u >= 2.9 && u < 2.9 + step * 6) si = 5 + Math.floor((u - 2.9) / step);
    stage(k);
    if (si < 0) { content(k); return; }
    const S = GL[si];
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.clearRect(0, 0, w, h); content(TK);
    const tint = col => { GT.setTransform(1, 0, 0, 1, 0, 0); GT.globalCompositeOperation = 'source-over'; GT.clearRect(0, 0, w, h); GT.drawImage(TMP, 0, 0); GT.globalCompositeOperation = 'source-in'; GT.fillStyle = col; GT.fillRect(0, 0, w, h); GT.globalCompositeOperation = 'source-over'; return GLT; };
    GK.setTransform(1, 0, 0, 1, 0, 0); GK.fillStyle = C.navy; GK.fillRect(0, 0, w, h);
    GK.drawImage(tint(C.coral), -S.rgb, 2); GK.drawImage(tint('#22D3EE'), S.rgb, -2); GK.drawImage(TMP, 0, 0);
    k.drawImage(GLC, 0, 0);
    for (const sl of S.sl) { k.fillStyle = C.navy; k.fillRect(0, sl.y, w, sl.h); k.drawImage(GLC, 0, sl.y, w, sl.h, sl.dx, sl.y, w, sl.h); }
    for (const b of S.bars) { k.fillStyle = [C.coral, '#22D3EE', C.yel][b.c]; k.fillRect(b.x, b.y, b.w, b.h); }
  };

  // @element 24
  // 24 インパクトシェイク（重い見出しの板がドンと落ち、その衝撃で画面ごと揺れる）
  CELLS[23] = (k, w, h, u) => {
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T;
    const floor = h - 30, SW = 250, SH = 100, tI = 0.62, tau = lu - tI;
    let y = lu < 0.3 ? -SH - 20 : lu < tI ? lerp(-SH - 20, floor - SH, eIn(P(lu, 0.3, tI))) : floor - SH;
    y -= 300 * backIn(P(lu, 1.85, 2.2), 1.6);
    let dx = 0, dy = 0, rot = 0;
    if (tau > 0 && tau < 1.1) { const e = Math.exp(-5 * tau), ph = 2 * Math.PI * 5 * tau; dx = 15 * e * Math.sin(ph); dy = 11 * e * Math.cos(ph * 1.3); rot = 0.02 * e * Math.sin(ph + 0.6); }
    k.fillStyle = C.navy; k.fillRect(0, 0, w, h);
    k.save(); k.translate(w / 2 + dx, h / 2 + dy); k.rotate(rot); k.translate(-w / 2, -h / 2);
    k.fillStyle = C.navy; k.fillRect(-40, -40, w + 80, h + 80);
    // 背景の小物（衝撃で少し跳ねる）
    [[34, 62, 86, C.navy2, 0.06], [104, 46, 54, C.navy3, 0.03], [w - 150, 50, 66, C.navy3, 0.03], [w - 90, 62, 104, C.navy2, 0.06]].forEach(([x, bw, bh, col, dl]) => { const t = tau - dl, hop = t > 0 && t < 0.5 ? -24 * Math.sin(Math.PI * t / 0.5) * (1 - t) : 0; k.fillStyle = col; rr(k, x, floor - bh + hop, bw, bh, [10, 10, 0, 0]); k.fill(); k.fillStyle = C.blue; k.globalAlpha = 0.55; rr(k, x + 10, floor - bh + 12 + hop, bw - 20, 8, 4); k.fill(); k.globalAlpha = 1; });
    k.fillStyle = C.navy3; k.fillRect(-40, floor, w + 80, 5);
    // 衝撃の線とほこり
    if (tau > 0 && tau < 0.55) {
      const q = eOut(tau / 0.55); k.strokeStyle = '#fff'; k.lineCap = 'round'; k.lineWidth = 7 * (1 - q);
      for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, j = Math.floor(i / 2), a = -0.12 - j * 0.34, r0 = 140 + 46 * q, r1 = r0 + 32; k.beginPath(); k.moveTo(w / 2 + s * Math.cos(a) * r0, floor - 4 + Math.sin(a) * r0); k.lineTo(w / 2 + s * Math.cos(a) * r1, floor - 4 + Math.sin(a) * r1); if (q < 0.97) k.stroke(); }
      k.fillStyle = C.dim; k.globalAlpha = 0.8 * (1 - q); for (let i = 0; i < 6; i++) { const s = i % 2 ? 1 : -1, d = 130 + q * (50 + i * 14); k.beginPath(); k.arc(w / 2 + s * d, floor - 8 - q * (6 + i * 4), 9 + q * 8 - i, 0, 7); k.fill(); } k.globalAlpha = 1;
    }
    const sq = tau > 0 && tau < 0.3 ? 1 - 0.22 * Math.sin(tau / 0.3 * Math.PI) : (lu < tI && lu > 0.3 ? 1.12 : 1);
    k.save(); k.translate(w / 2, y + SH); k.scale(2 - sq, sq);
    k.fillStyle = n ? C.coral : C.yel; rr(k, -SW / 2, -SH, SW, SH, 18); k.fill();
    k.fillStyle = 'rgba(15,26,61,.14)'; rr(k, -SW / 2, -16, SW, 16, [0, 0, 18, 18]); k.fill();
    txt(k, n ? 'SALE' : 'NEW!', 0, -SH / 2 + 4, `800 74px ${DISP}`, n ? '#fff' : C.navy, 'center', 'middle', '2px');
    k.restore();
    k.restore();
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});

/* Motion Prompt · pack "camera" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('camera', function () {
  // @kit
  // カメラワーク＆切り替え 24（カード 539x208）。各コマは時間 u の純関数。
  // 1つの動きは CYC=4.7秒。切り替え（19〜21）は A→B の次に B→A と戻るので、パックの周期は CYC×2=9.4秒。
  const CW = 539, CH = 208, FPS = 30;
  const HOLD = 9.4, CYC = HOLD / 2;
  const C = {
    bg: '#F4F3F0', card: '#FFFFFF', border: '#E3E1DC', ink: '#1E1E21', sub: '#8E8E93', faint: '#C9C9CC',
    blue: '#2F6BEB', blueM: '#9DB8F6', blueL: '#C9D8FB', blueXL: '#E4ECFE', blueBg: '#F1F5FF',
    grid: '#ECECEC', g1: '#F1F0EE', g2: '#E2E1DE', g3: '#CFCECB', g4: '#A9A8A5'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const EN = '"Helvetica Neue", "SF Pro Display", system-ui, sans-serif';
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const mod = (a, n) => ((a % n) + n) % n;
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }

  // ============================== 3D SCENE ==============================
  // 世界座標: Y上・カメラは +Z を向く（yaw=0）。単位はメートル。焦点距離 f はピクセル。
  const F0 = 330;  // = 24mm 表示
  const mm = f => Math.round(f / F0 * 24) + 'mm';
  function cam(o) { return Object.assign({ x: 0, y: 1.5, z: 0, yaw: 0, pitch: 0, roll: 0, f: F0 }, o); }
  function proj(c, X, Y, Z) {
    const dx = X - c.x, dy = Y - c.y, dz = Z - c.z;
    const cy = Math.cos(c.yaw), sy = Math.sin(c.yaw);
    const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
    const cp = Math.cos(c.pitch), sp = Math.sin(c.pitch);
    const y2 = dy * cp - z1 * sp, z2 = dy * sp + z1 * cp;
    return { x: c.f * x1 / z2, y: -c.f * y2 / z2, z: z2, s: c.f / z2, cx: x1, cy: y2 };
  }
  function camZ(c, X, Y, Z) { return proj(c, X, Y, Z).z; }
  const NEAR = 0.25;
  function seg(ctx, c, a, b) {   // 3D line with near clipping
    let za = camZ(c, ...a), zb = camZ(c, ...b);
    if (za < NEAR && zb < NEAR) return;
    if (za < NEAR) { const t = (NEAR - za) / (zb - za); a = a.map((v, i) => lerp(v, b[i], t)); }
    else if (zb < NEAR) { const t = (NEAR - zb) / (za - zb); b = b.map((v, i) => lerp(v, a[i], t)); }
    const p = proj(c, ...a), q = proj(c, ...b);
    ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
  }
  function poly(ctx, c, pts) { ctx.beginPath(); pts.forEach((p, i) => { const q = proj(c, ...p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); }); ctx.closePath(); }

  // sprite = local drawing (meters, y up) anchored at a world point, always facing camera (billboard)
  function sprite(ctx, c, X, Y, Z, fn) {
    const p = proj(c, X, Y, Z); if (p.z < NEAR) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(p.s, -p.s); fn(ctx, p.s); ctx.restore();
  }
  function person(ctx, s, o = {}) {
    const col = o.col || C.blue, walk = o.walk || 0, face = o.face;
    ctx.fillStyle = col;
    const sw = Math.sin(walk) * 0.42;
    // legs
    [[-0.08, sw], [0.08, -sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 0.86); ctx.rotate(a); rr(ctx, -0.075, -0.86, 0.15, 0.88, 0.07); ctx.fill(); ctx.restore(); });
    // arms
    [[-0.25, -sw], [0.25, sw]].forEach(([x, a]) => { ctx.save(); ctx.translate(x, 1.38); ctx.rotate(a * (o.armUp ? 0 : 1) + (o.armUp ? (x < 0 ? -2.6 : 2.6) : 0)); rr(ctx, -0.06, -0.58, 0.12, 0.6, 0.06); ctx.fill(); ctx.restore(); });
    rr(ctx, -0.23, 0.82, 0.46, 0.64, 0.12); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 1.63, 0.16, 0, 7); ctx.fill();
    if (face !== undefined && Math.cos(face) > 0) {   // 顔の向き（オービット用）
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.sin(face) * -0.09, 1.65, 0.035, 0, 7); ctx.fill();
    }
  }
  function tree(ctx, s, h = 4, col = C.g2) {
    ctx.fillStyle = C.g3; ctx.fillRect(-0.09 * h / 4, 0, 0.18 * h / 4, h * 0.55);
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, h * 0.68, h * 0.3, 0, 7); ctx.fill();
  }
  function building(ctx, s, w, h, col = C.g1) {
    ctx.fillStyle = col; ctx.fillRect(-w / 2, 0, w, h);
    ctx.strokeStyle = C.g3; ctx.lineWidth = 1.4 / s; ctx.strokeRect(-w / 2, 0, w, h);
    ctx.fillStyle = C.g2;
    for (let y = h - 1.6; y > 1; y -= 1.8) for (let x = -w / 2 + 0.6; x < w / 2 - 0.7; x += 1.3) ctx.fillRect(x, y, 0.6, 0.8);
  }
  function post(ctx, s, h = 1.2) { ctx.fillStyle = C.g4; ctx.fillRect(-0.07, 0, 0.14, h); ctx.fillRect(-0.12, h - 0.06, 0.24, 0.1); }

  // scene presets
  const MTN_FAR = [[-420, 0], [-300, 22], [-230, 8], [-150, 30], [-80, 12], [-20, 34], [50, 14], [120, 28], [190, 6], [260, 26], [340, 10], [420, 0]];
  const MTN_NEAR = [[-260, 0], [-190, 12], [-140, 4], [-70, 18], [-20, 6], [30, 15], [95, 3], [160, 16], [230, 5], [300, 0]];
  const BLD = [[-17, 4, 9], [-12, 3.2, 13], [-8, 2.6, 7], [11, 3.4, 11], [15.5, 4, 8], [20, 3, 15], [-24, 3.5, 10], [26, 4, 7]];
  const CITY = [[-9, 3.4, 12], [-5.5, 3, 18], [-2, 3.6, 9], [1.8, 3, 22], [5.4, 3.6, 14], [9, 3, 10], [-13, 3.4, 15], [12.8, 3.6, 19]];

  function world(ctx, w, h, c, o = {}) {
    ctx.save();
    ctx.translate(w / 2, h / 2); ctx.rotate(c.roll || 0);
    const blurBg = o.blurBg || 0, blurFg = o.blurFg || 0;
    const setBlur = b => { ctx.filter = b > 0.05 ? `blur(${b.toFixed(2)}px)` : 'none'; };
    // sky tint
    if (o.sky) { ctx.fillStyle = o.sky; ctx.fillRect(-w * 2, -h * 3, w * 4, h * 6); }
    setBlur(blurBg);
    // sun / moon
    const sun = o.sun === undefined ? [30, 30, 170] : o.sun;
    if (sun) { const p = proj(c, ...sun); if (p.z > NEAR) { ctx.fillStyle = o.sunCol || C.blueL; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(0, 5.5 * p.s * (o.sunScale || 1)), 0, 7); ctx.fill(); } }
    if (o.clouds) o.clouds.forEach(([X, Y, Z, r]) => { const p = proj(c, X, Y, Z); if (p.z < NEAR) return; ctx.fillStyle = C.g1; ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 2.2 * p.s, r * p.s, 0, 0, 7); ctx.ellipse(p.x + r * 1.2 * p.s, p.y + r * .2 * p.s, r * 1.4 * p.s, r * .8 * p.s, 0, 0, 7); ctx.fill(); });
    // mountains (far planes)
    if (o.mountains !== false) {
      const off = o.mtnZ || 0;
      ctx.fillStyle = C.blueXL; poly(ctx, c, [...MTN_FAR.map(([x, y]) => [x, y, 175 + off])]); ctx.fill();
      ctx.fillStyle = C.blueL; poly(ctx, c, [...MTN_NEAR.map(([x, y]) => [x, y, 120 + off])]); ctx.fill();
    }
    // ground + grid
    if (o.grid !== false) {
      ctx.save(); setBlur(blurBg * 0.6);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1.3; ctx.beginPath();
      const z0 = Math.floor(c.z / 2) * 2, xs = o.gridX || 40;
      for (let z = z0 + 2; z <= z0 + 90; z += (z - z0 < 30 ? 2 : 6)) seg(ctx, c, [-xs + c.x, 0, z], [xs + c.x, 0, z]);
      for (let x = Math.floor(c.x / 2) * 2 - xs; x <= c.x + xs; x += 2) seg(ctx, c, [x, 0, z0 + 0.5], [x, 0, z0 + 90]);
      ctx.stroke();
      // horizon
      ctx.strokeStyle = C.g2; ctx.lineWidth = 1.5; ctx.beginPath(); seg(ctx, c, [c.x - 400, 0, c.z + 300], [c.x + 400, 0, c.z + 300]); ctx.stroke();
      ctx.restore();
    }
    // sprites sorted by depth
    const list = [];
    const add = (X, Y, Z, fn, fg) => list.push({ z: camZ(c, X, Y, Z), X, Y, Z, fn, fg });
    if (o.buildings !== false) (o.city ? CITY.map(([x, bw, bh]) => [x, bw, bh, 30]) : BLD.map(([x, bw, bh]) => [x, bw, bh, 48])).forEach(([x, bw, bh, z]) => add(x, 0, z, (k, s) => building(k, s, bw, bh)));
    if (o.trees !== false) [[-7, 22], [6.5, 19], [9.5, 24], [-11, 26], [3, 30]].forEach(([x, z]) => add(x, 0, z, (k, s) => tree(k, s, 4)));
    if (o.tower) add(o.tower[0], 0, o.tower[1], (k, s) => { building(k, s, 6, 9.5, C.g1); k.fillStyle = C.g4; k.fillRect(-0.08, 9.5, 0.16, 2.2); k.fillStyle = C.blue; k.beginPath(); k.arc(0, 11.8, 0.3, 0, 7); k.fill(); });
    if (o.ring) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(o.ring[0] + Math.sin(a) * o.ring[2], 0, o.ring[1] + Math.cos(a) * o.ring[2], (k, s) => tree(k, s, 3.2, i % 3 ? C.g2 : C.blueXL)); }
    if (o.extra) o.extra.forEach(e => add(e[0], e[1], e[2], e[3], e[4]));
    if (o.person) { const pp = o.person; add(pp.x || 0, pp.y || 0, pp.z === undefined ? 8 : pp.z, (k, s) => person(k, s, pp), pp.fg); }
    if (o.fg) o.fg.forEach(([X, Z, kind]) => add(X, 0, Z, (k, s) => kind === 'rock' ? (k.fillStyle = C.g3, k.beginPath(), k.ellipse(0, 0.1, 0.55, 0.38, 0, 0, 7), k.fill()) : post(k, s), true));
    list.sort((a, b) => b.z - a.z);
    for (const it of list) { setBlur(it.fg ? blurFg : blurBg); sprite(ctx, c, it.X, it.Y, it.Z, it.fn); }
    ctx.filter = 'none';
    if (o.after) o.after(ctx, c);
    ctx.restore();
  }

  // ============================== VIEWFINDER CARD ==============================
  const CARD = mkCanvas(CW, CH), CK = CARD.getContext('2d');
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  const TMP2 = mkCanvas(CW, CH), TK2 = TMP2.getContext('2d');
  function clear(k, w = CW, h = CH) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.filter = 'none'; k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h); }
  // draw fnA then blend fnB on top with alpha a (into k)
  function blend(k, fnA, fnB, a) {
    if (a <= 0.001) return fnA(k);
    if (a >= 0.999) return fnB(k);
    fnA(k);
    clear(TK2); fnB(TK2); k.save(); k.globalAlpha = a; k.drawImage(TMP2, 0, 0); k.restore();
  }
  // motion blur: average n renders of fn(k, s) with s spread over [s0, s1]
  function mblur(k, fn, s0, s1, n) {
    if (Math.abs(s1 - s0) < 1e-4 || n < 2) return fn(k, s0);
    const acc = mkCanvasCached(), ak = acc.getContext('2d');
    for (let i = 0; i < n; i++) {
      clear(TK); fn(TK, lerp(s0, s1, (i + .5) / n));
      ak.globalAlpha = 1 / (i + 1); ak.drawImage(TMP, 0, 0);
    }
    ak.globalAlpha = 1; k.save(); k.drawImage(acc, 0, 0); k.restore();
  }
  let _acc; function mkCanvasCached() { if (!_acc) _acc = mkCanvas(CW, CH); const k = _acc.getContext('2d'); k.globalAlpha = 1; k.fillStyle = '#fff'; k.fillRect(0, 0, CW, CH); return _acc; }

  function viewfinder(k, w, h, t, hud, hudCol) {
    k.save();
    const m = 13, L = 20;
    k.strokeStyle = '#8F8F94'; k.lineWidth = 2.6; k.lineCap = 'round';
    k.beginPath();
    [[m, m, 1, 1], [w - m, m, -1, 1], [m, h - m, 1, -1], [w - m, h - m, -1, -1]].forEach(([x, y, sx, sy]) => { k.moveTo(x, y + sy * L); k.lineTo(x, y); k.lineTo(x + sx * L, y); });
    k.stroke();
    // center mark
    k.strokeStyle = 'rgba(143,143,148,.55)'; k.lineWidth = 1.6; k.beginPath(); k.moveTo(w / 2 - 7, h / 2); k.lineTo(w / 2 + 7, h / 2); k.moveTo(w / 2, h / 2 - 7); k.lineTo(w / 2, h / 2 + 7); k.stroke();
    // REC (なめらかな明滅・9.4秒で9回＝ループの継ぎ目なし)
    const a = 0.55 + 0.45 * Math.cos(t * Math.PI * 2 * 9 / HOLD);
    k.fillStyle = C.blue; k.globalAlpha = a; k.beginPath(); k.arc(m + 16, m + 17, 5, 0, 7); k.fill(); k.globalAlpha = 1;
    txt(k, 'REC', m + 27, m + 17, `600 14px ${MONO}`, '#7D7D82', 'left', 'middle');
    if (hud) {
      const f = `600 15px ${MONO}`, ww = tw(k, hud, f);
      k.fillStyle = 'rgba(255,255,255,.82)'; rr(k, w - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
      txt(k, hud, w - m - 14, m + 18, f, hudCol || '#6E6E73', 'right', 'middle');
    }
    k.restore();
  }

  // ============================== CELLS ==============================
  // each: (k, w, h, u) where u = time within the cycle (0..CYC), cyc = cycle index; returns HUD string
  const RESET = 0.5;  // 末尾のクロスフェードで開始状態へ戻す
  function camCell(stateAt, hudAt, t0 = 0.5, t1 = 3.4) {
    return (k, w, h, u) => {
      const p = eIO(P(u, t0, t1));
      const r = P(u, CYC - RESET, CYC);
      blend(k, kk => stateAt(kk, w, h, p, u), kk => stateAt(kk, w, h, 0, u - CYC), eIOs(r));
      return hudAt(r > 0.5 ? 0 : p, u);
    };
  }
  // 1コマぶんの枠: 白地 → 中身 → ファインダー（四隅・REC・右上の数値）。u はパック周期 0..CYC×2
  function shot(fn, vh) {
    return (k, w, h, u) => {
      const uu = mod(u, CYC), cyc = Math.floor(u / CYC);
      k.fillStyle = '#FFFFFF'; k.fillRect(0, 0, w, h);
      k.save(); const hud = fn(k, w, h, uu, cyc); k.restore();
      k.globalAlpha = 1; k.filter = 'none';
      viewfinder(k, w, vh || h, u, hud);
    };
  }
  const CELLS = [];

  // @element 01
  // 01 パン: 回転なので全ての層が同じだけ横に流れる
  CELLS[0] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ yaw: lerp(-0.32, 0.32, p) }), { person: { x: 0, z: 8 } }),
    p => `${Math.round(lerp(-0.32, 0.32, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 02
  // 02 ティルト
  CELLS[1] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ pitch: lerp(-0.06, 0.36, p), y: 1.4 }), { person: { z: 7 }, tower: [0, 26], buildings: false, sun: [7, 13, 40], sunScale: 0.4 }),
    p => `${Math.round(lerp(-0.06, 0.36, p) * 57.3)}°`.replace(/^(\d)/, '+$1')));

  // @element 03
  // 03 ドリーイン: カメラ位置が前へ（手前は大きく、奥はほぼそのまま）
  CELLS[2] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ z: lerp(0, 5.8, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0)));

  // @element 04
  // 04 ズームイン: 位置は固定・焦点距離だけ伸びる（全体が同じ比率で拡大）
  CELLS[3] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ f: F0 * Math.pow(8 / 2.2, p) }), { person: { z: 8 }, fg: [[-1.5, 3.6], [1.6, 4.8, 'rock']] }),
    p => mm(F0 * Math.pow(8 / 2.2, p))));

  // @element 05
  // 05 トラッキング: 人物と並んで横移動（手前ほど速く流れる）
  CELLS[4] = shot((k, w, h, u) => {
    const x = (u - CYC / 2) * 1.7;
    const fgp = []; for (let i = -12; i <= 12; i++) fgp.push([i * 1.6, 4]);
    world(k, w, h, cam({ x, y: 1.3 }), { person: { x, z: 7.5, walk: u * 7 }, fg: fgp });
    return '→ 1.7m/s';
  });

  // @element 06
  // 06 オービット: 被写体を中心に円を描いて回り込む
  CELLS[5] = shot(camCell((k, w, h, p) => {
    const a = lerp(-0.95, 0.95, p), R = 6, P0 = [0, 0, 9];
    const c = cam({ x: P0[0] + Math.sin(a) * R, z: P0[2] - Math.cos(a) * R, yaw: -a, y: 1.7, pitch: -0.07 });
    world(k, w, h, c, {
      person: { z: 9, face: a }, ring: [0, 9, 10], buildings: true, trees: false,
      after: (kk, cc) => { kk.strokeStyle = C.blueM; kk.lineWidth = 2; kk.setLineDash([5, 5]); kk.beginPath(); for (let i = 0; i <= 48; i++) { const b = i / 48 * Math.PI * 2; const q = proj(cc, Math.sin(b) * 1.3, 0, 9 + Math.cos(b) * 1.3); i ? kk.lineTo(q.x, q.y) : kk.moveTo(q.x, q.y); } kk.stroke(); kk.setLineDash([]); }
    });
  }, p => `${Math.round(lerp(-0.95, 0.95, p) * 57.3)}°`.replace(/^(\d)/, '+$1'), 0.5, 3.6));

  // @element 07
  // 07 クレーンアップ: カメラが上昇し、見下ろしになる
  CELLS[6] = shot(camCell((k, w, h, p) => {
    const y = lerp(1.4, 9, p), z = lerp(0, 1.5, p);
    world(k, w, h, cam({ y, z, pitch: -0.86 * Math.atan2(y - 1.0, 8 - z) }), { person: { z: 8 } });
  }, p => `↑ ${lerp(1.4, 9, p).toFixed(1)}m`));

  // @element 08
  // 08 ドリーズーム: 人物の大きさは一定、背景だけ伸び縮み
  CELLS[7] = shot(camCell((k, w, h, p) => {
    const d = lerp(3.2, 8, p), f = F0 * d / 8 * 1.0;
    const c = cam({ z: 8 - d, f, y: 1.3 });
    world(k, w, h, c, {
      person: { z: 8 }, trees: true,
      after: (kk, cc) => { const top = proj(cc, 0, 1.8, 8).y, bot = proj(cc, 0, 0, 8).y; kk.strokeStyle = C.blue; kk.lineWidth = 1.6; kk.setLineDash([6, 5]); kk.beginPath(); kk.moveTo(-80, top); kk.lineTo(80, top); kk.moveTo(-80, bot); kk.lineTo(80, bot); kk.stroke(); kk.setLineDash([]); }
    });
  }, p => mm(F0 * lerp(3.2, 8, p) / 8)));

  // @element 09
  // 09 ラックフォーカス
  CELLS[8] = shot(camCell((k, w, h, p) => {
    world(k, w, h, cam({ y: 1.1 }), {
      person: { x: 0.9, z: 9 }, blurFg: 7 * p, blurBg: 6 * (1 - p),
      extra: [[-0.75, 0, 2.0, (kk, s) => { kk.fillStyle = C.g3; kk.fillRect(-0.025, 0, 0.05, 0.75); kk.fillStyle = C.blueM; for (let i = 0; i < 6; i++) { kk.beginPath(); kk.ellipse(Math.cos(i) * 0.09, 0.8 + Math.sin(i) * 0.09, 0.08, 0.05, i, 0, 7); kk.fill(); } kk.fillStyle = C.blue; kk.beginPath(); kk.arc(0, 0.8, 0.05, 0, 7); kk.fill(); }, true]],
      after: (kk, cc) => {   // ピント位置の枠
        const a = proj(cc, -0.75, 0.8, 2.0), b = proj(cc, 0.9, 0.9, 9);
        const x = lerp(a.x, b.x, p), y = lerp(a.y, b.y, p), r = lerp(46, 30, p);
        kk.strokeStyle = C.blue; kk.lineWidth = 2; kk.beginPath();
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { kk.moveTo(x + sx * r, y + sy * r - sy * 9); kk.lineTo(x + sx * r, y + sy * r); kk.lineTo(x + sx * r - sx * 9, y + sy * r); });
        kk.stroke();
      }
    });
  }, p => `◎ ${lerp(2, 9, p).toFixed(0)}m`, 1.0, 2.6));

  // @element 10
  // 10 手持ち
  CELLS[9] = shot((k, w, h, u) => {
    const T = u * 2 * Math.PI / CYC;   // 周期をサイクルに合わせて継ぎ目なし
    const n = (a, b, c2) => Math.sin(T * a + b) * c2;
    const yaw = n(3, 0, .016) + n(7, 1, .008) + n(13, 2, .004), pitch = n(4, 2, .012) + n(9, .5, .006) + n(17, 1.2, .003), roll = n(5, 1, .02) + n(11, 3, .008);
    world(k, w, h, cam({ yaw, pitch, roll, y: 1.5 + n(6, 0, .03) }), { person: { z: 6.5 } });
    return 'HANDHELD';
  });

  // @element 11
  // 11 FPV
  CELLS[10] = shot((k, w, h, u) => {
    const sp = 14, z = u * sp, T = u * 2 * Math.PI / CYC;
    const c = cam({ z, y: 1.4 + 0.5 * Math.sin(T * 2), roll: 0.22 * Math.sin(T * 2 + 0.6), yaw: 0.05 * Math.sin(T * 2), x: 0.6 * Math.sin(T * 2 - 0.4), pitch: -0.05 });
    const ex = [];
    const L = 8, base = Math.floor(z / L) * L;
    for (let i = 0; i < 12; i++) { const zz = base + i * L; ex.push([-3.6, 0, zz, (kk, s) => tree(kk, s, 4.2)]); ex.push([3.6, 0, zz + L / 2, (kk, s) => tree(kk, s, 4.2, C.blueXL)]); }
    world(k, w, h, c, {
      buildings: false, trees: false, extra: ex, gridX: 20,
      after: (kk) => {   // スピード線
        kk.strokeStyle = 'rgba(150,150,155,.45)'; kk.lineWidth = 2;
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3, ph = mod(u * 2.2 + i * 0.37, 1); const r0 = 120 + ph * 160; kk.beginPath(); kk.moveTo(Math.cos(a) * r0 * 1.9, Math.sin(a) * r0 * 0.8); kk.lineTo(Math.cos(a) * (r0 + 40) * 1.9, Math.sin(a) * (r0 + 40) * 0.8); kk.stroke(); }
      }
    });
    return `${Math.round(sp * 3.6)}km/h`;
  });

  // @element 12
  // 12 ダッチアングル
  CELLS[11] = shot(camCell((k, w, h, p) => world(k, w, h, cam({ roll: lerp(0, 0.36, p) }), { person: { z: 7 } }), p => `∠ ${Math.round(lerp(0, 0.36, p) * 57.3)}°`, 0.6, 2.2));

  // @shared
  // 跳躍の高さと、舞い落ちる葉（13・14・16 で使う）
  function jumpY(q) { return q <= 0 || q >= 1 ? 0 : 4 * q * (1 - q) * 1.1; }
  function leaves(u, speed) { const ex = []; for (let i = 0; i < 9; i++) { const ph = mod(u * speed / 4.7 + i / 9, 1); ex.push([-3 + i * 0.75 + Math.sin(i * 3) * 0.3, 3.4 - ph * 3.4, 6 + (i % 3), (kk) => { kk.fillStyle = i % 2 ? C.blueM : C.g3; kk.save(); kk.rotate(ph * 6 + i); kk.beginPath(); kk.ellipse(0, 0, 0.09, 0.045, 0, 0, 7); kk.fill(); kk.restore(); }]); } return ex; }

  // @element 13
  // 13 スローモーション
  CELLS[12] = shot((k, w, h, u) => {
    const q = P(u, 0.5, 4.3);
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(u, 1) });
    return '120fps ×0.25';
  });

  // @element 14
  // 14 スピードランプ: 速い→遅い（グラフで速さを表示）
  function rampTime(u) {   // 再生速度 v(u): 2.4 → 0.25（u 1.2〜1.9 で切替）
    const v = x => lerp(2.4, 0.25, eIOs(P(x, 1.2, 1.9)));
    let s = 0; const N = 60; for (let i = 0; i < N; i++) { const x = u * (i + .5) / N; s += v(x) * u / N; } return { s, v: v(u) };
  }
  CELLS[13] = shot((k, w, h, u) => {
    const uu = Math.min(u, CYC - RESET);
    const draw = (kk, uu) => {
      const { s, v } = rampTime(uu);
      const x = -6 + s * 2.0, q = P(x, -1.5, 2.5);
      world(kk, w, h, cam({ y: 1.3 }), {
        person: { x, z: 8, walk: s * 9, y: jumpY(q) * 0.9, armUp: q > 0 && q < 1 },
        after: (k2) => {   // 速度グラフ
          const gx = -w / 2 + 26, gy = h / 2 - 22, gw = 120, gh = 40;
          k2.fillStyle = 'rgba(255,255,255,.85)'; rr(k2, gx - 8, gy - gh - 10, gw + 16, gh + 18, 6); k2.fill();
          k2.strokeStyle = C.faint; k2.lineWidth = 1.5; k2.beginPath(); k2.moveTo(gx, gy); k2.lineTo(gx + gw, gy); k2.stroke();
          k2.strokeStyle = C.blue; k2.lineWidth = 2.5; k2.beginPath();
          for (let i = 0; i <= 40; i++) { const xx = i / 40 * (CYC - RESET), vv = rampTime(xx).v; const X = gx + i / 40 * gw, Y = gy - vv / 2.4 * gh; i ? k2.lineTo(X, Y) : k2.moveTo(X, Y); }
          k2.stroke();
          const X = gx + uu / (CYC - RESET) * gw, Y = gy - v / 2.4 * gh; k2.fillStyle = C.blue; k2.beginPath(); k2.arc(X, Y, 5, 0, 7); k2.fill();
        }
      });
      return v;
    };
    const r = P(u, CYC - RESET, CYC); let v;
    blend(k, kk => { v = draw(kk, uu); }, kk => draw(kk, 0), eIOs(r));
    return `×${(r > .5 ? 2.4 : v).toFixed(1)}`;
  });

  // @element 15
  // 15 タイムラプス: 太陽が動き、雲と人が早送り
  CELLS[14] = shot(camCell((k, w, h, p, u) => {
    const a = lerp(-1.25, 1.25, p);
    const clouds = [[-20 + mod(p * 140 + 0, 80) - 10, 18, 90, 2.2], [-50 + mod(p * 140 + 40, 80), 24, 120, 3], [-10 + mod(p * 140 + 20, 80) - 30, 13, 70, 1.6]];
    const ex = [];
    for (let i = 0; i < 7; i++) { const ph = mod(p * 6 + i / 7, 1), dir = i % 2 ? 1 : -1; ex.push([dir * lerp(-9, 9, ph), 0, 10 + i * 1.3, (kk) => { kk.fillStyle = i % 3 ? C.g4 : C.blueM; kk.fillRect(-0.12, 0, 0.24, 0.9); kk.beginPath(); kk.arc(0, 1.05, 0.13, 0, 7); kk.fill(); }]); }
    world(k, w, h, cam({ y: 1.6, pitch: 0.08 }), {
      sun: [Math.sin(a) * 120, Math.cos(a) * 60 - 8, 170], sunCol: C.blueM, clouds, extra: ex,
      after: (kk, cc) => {   // 建物の影
        kk.fillStyle = 'rgba(160,160,165,.22)';
        BLD.slice(0, 6).forEach(([x, bw, bh]) => { const L = bh * 0.9; const q1 = proj(cc, x - bw / 2, 0, 48), q2 = proj(cc, x + bw / 2, 0, 48), q3 = proj(cc, x + bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1), q4 = proj(cc, x - bw / 2 - Math.sin(a) * L, 0, 48 - Math.cos(a) * L * 0.4 - 1); kk.beginPath(); kk.moveTo(q1.x, q1.y); kk.lineTo(q2.x, q2.y); kk.lineTo(q3.x, q3.y); kk.lineTo(q4.x, q4.y); kk.fill(); });
      }
    });
  }, p => { const m = Math.round(lerp(6 * 60, 18 * 60, p) / 10) * 10; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }, 0.4, 4.1));

  // @element 16
  // 16 フリーズフレーム
  CELLS[15] = shot((k, w, h, u) => {
    // 跳躍の頂点で 1.4 秒止める
    const tj = u < 1.6 ? u : u < 3.0 ? 1.6 : u - 1.4;   // 実時間→映像時間
    const q = P(tj, 0.6, 2.6);
    const frozen = u >= 1.6 && u < 3.0;
    world(k, w, h, cam({ y: 1.3 }), { person: { z: 7, y: jumpY(q), armUp: q > 0 && q < 1 }, extra: leaves(tj, 1.5) });
    if (frozen) {
      const a = Math.min(1, (u - 1.6) / 0.12, (3.0 - u) / 0.12);
      k.save(); k.globalAlpha = a; k.strokeStyle = C.blue; k.lineWidth = 5; k.strokeRect(2.5, 2.5, w - 5, h - 5);
      k.fillStyle = 'rgba(255,255,255,.88)'; rr(k, w / 2 - 34, h - 58, 68, 40, 8); k.fill();
      k.fillStyle = C.blue; k.fillRect(w / 2 - 12, h - 49, 8, 22); k.fillRect(w / 2 + 4, h - 49, 8, 22); k.restore();
    }
    return frozen ? 'FREEZE' : '';
  });

  // @shared
  // ---- 切り替え: 奇数サイクルは B→A に戻る（リセット不要）
  const sceneA = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.4 }, extra.cam)), Object.assign({ person: { x: -0.6, z: 7 } }, extra));
  const CAR = [1.2, 0, 9, (kk) => { kk.fillStyle = C.blue; rr(kk, -1.9, 0.35, 3.8, 0.75, 0.25); kk.fill(); rr(kk, -1.1, 0.95, 2.1, 0.62, 0.28); kk.fill(); kk.fillStyle = '#fff'; kk.fillRect(-0.85, 1.08, 0.8, 0.36); kk.fillRect(0.12, 1.08, 0.7, 0.36); kk.fillStyle = C.ink; [-1.15, 1.15].forEach(x => { kk.beginPath(); kk.arc(x, 0.34, 0.34, 0, 7); kk.fill(); }); }];
  const SB = { city: true, mountains: false, trees: false, sun: [-26, 40, 150], extra: [CAR] };
  const sceneB = (k, w, h, extra = {}) => world(k, w, h, cam(Object.assign({ y: 1.6, pitch: 0.1 }, extra.cam)), Object.assign({}, SB, extra));
  function abCell(trans, hudFn) {
    return (k, w, h, u, cyc) => {
      const S = cyc % 2 === 0 ? [sceneA, sceneB] : [sceneB, sceneA];
      trans(k, w, h, u, S[0], S[1], cyc);
      return hudFn ? hudFn(u, cyc) : (cyc % 2 === 0 ? 'A → B' : 'B → A');
    };
  }

  // @element 17
  // 17 ジャンプカット（同じ画角で人物の位置と時刻だけ飛ぶ）
  CELLS[16] = shot((k, w, h, u) => {
    const shots = [[-2.2, 0], [1.4, 1], [-0.4, 0], [2.4, 1], [0.6, 0]];
    const times = ['10:02', '10:17', '10:41', '11:06', '11:30'];
    const i = Math.min(4, Math.floor(u / (CYC / 5)));
    const [x, arm] = shots[i];
    world(k, w, h, cam({ y: 1.4 }), { person: { x, z: 7, armUp: !!arm } });
    return times[i];
  });

  // @element 18
  // 18 マッチカット（投げたボール → 同じ位置・大きさの太陽）
  CELLS[17] = shot((k, w, h, u) => {
    const cut = 2.3;
    const BX = 120, BY = -46, BR = 17;
    if (u < cut) {
      const q = eOut(P(u, 0.5, cut));
      world(k, w, h, cam({ y: 1.4 }), {
        person: { x: -1.2, z: 7, armUp: q > 0.05 }, sun: null,
        after: (kk, cc) => { const s = proj(cc, -1.2, 2.3, 7); const x = lerp(s.x, BX, q), y = lerp(s.y, BY, q) - Math.sin(q * Math.PI) * 30, r = lerp(5, BR, q); kk.fillStyle = C.blue; kk.beginPath(); kk.arc(x, y, r, 0, 7); kk.fill(); }
      });
    } else {
      const q = P(u, cut, CYC);
      world(k, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: null, trees: true,
        after: (kk) => { kk.fillStyle = C.blue; kk.beginPath(); kk.arc(BX, BY + q * 14, BR, 0, 7); kk.fill(); }
      });
    }
    // 形がそろっていることを示す点線の円
    const g = Math.max(0, 1 - Math.abs(u - cut) / 0.7);
    if (g > 0) { k.save(); k.translate(w / 2, h / 2); k.globalAlpha = g; k.strokeStyle = C.blue; k.lineWidth = 2; k.setLineDash([5, 4]); k.beginPath(); k.arc(BX, BY + (u > cut ? P(u, cut, CYC) * 14 : 0), BR + 9, 0, 7); k.stroke(); k.restore(); }
    return u < cut ? 'SHOT 1' : 'SHOT 2';
  });

  // @element 19
  // 19 ホイップパン（ブレで次の場面へ）
  CELLS[18] = shot(abCell((k, w, h, u, A, B) => {
    const t0 = 1.7, t1 = 2.5;
    const at = (kk, s) => {   // s: 0..1 の進み。前半 A を右へ振り、後半 B が左から止まる
      if (s < .5) world(kk, w, h, cam({ y: 1.4, yaw: eIOs(s * 2) * 0.45 }), A === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
      else world(kk, w, h, cam({ y: 1.4, yaw: -(1 - eIOs((s - .5) * 2)) * 0.45 }), B === sceneA ? { person: { x: -0.6, z: 7 } } : SB);
    };
    if (u < t0) return A(k, w, h);
    if (u > t1) return B(k, w, h);
    const s = P(u, t0, t1), ds = 1 / FPS / (t1 - t0);
    mblur(k, at, clamp(s - ds * 1.6), clamp(s + ds * 1.6), 9);
  }));

  // @element 20
  // 20 クロスディゾルブ
  CELLS[19] = shot(abCell((k, w, h, u, A, B) => blend(k, kk => A(kk, w, h), kk => B(kk, w, h), eIOs(P(u, 1.5, 3.0)))));

  // @element 21
  // 21 ワイプ
  CELLS[20] = shot(abCell((k, w, h, u, A, B) => {
    const p = eIO(P(u, 1.7, 2.8)), ex = p * (w + 8) - 4;
    A(k, w, h);
    if (p > 0) { k.save(); k.beginPath(); k.rect(0, 0, ex, h); k.clip(); k.fillStyle = '#fff'; k.fillRect(0, 0, w, h); B(k, w, h); k.restore(); }
    if (p > 0 && p < 1) { k.fillStyle = C.blue; k.fillRect(ex - 2, 0, 4, h); }
  }));

  // @element 22
  // 22 スマッシュカット（静かな場面 → 急に激しい場面）
  function meter(k, w, h, lv) {   // 音量メーター（左下）
    const x = 24, y = h - 22, n = 8;
    for (let i = 0; i < n; i++) { k.fillStyle = (i + 0.5) / n < lv ? C.blue : C.g2; k.fillRect(x + i * 9, y - 6 - i * 2.2, 6, 6 + i * 2.2); }
  }
  CELLS[21] = shot((k, w, h, u) => {
    const cut = 2.4, r = P(u, CYC - RESET, CYC);
    const quiet = (kk, uu) => {
      world(kk, w, h, cam({ y: 1.2 }), {
        buildings: false, sun: [24, 26, 170], sunCol: C.blueXL, extra: [[0.4, 0, 7, (k2) => { k2.fillStyle = C.blue; rr(k2, -0.8, 0, 1.6, 0.34, 0.15); k2.fill(); k2.beginPath(); k2.arc(-0.95, 0.24, 0.17, 0, 7); k2.fill(); }]],
        after: (k2, cc) => { const p0 = proj(cc, -0.6, 1.0, 7); for (let i = 0; i < 3; i++) { const ph = mod(uu * 0.35 + i / 3, 1); k2.globalAlpha = Math.sin(ph * Math.PI) * 0.8; txt(k2, 'z', p0.x - 10 - ph * 20 - i * 4, p0.y - ph * 50, `600 ${16 + i * 4}px ${EN}`, C.sub, 'center', 'middle'); } k2.globalAlpha = 1; }
      });
      meter(kk, w, h, 0.08 + 0.04 * Math.sin(uu * 5));
    };
    const loud = (kk, uu) => {
      const T = uu * 40;
      const c = cam({ y: 1.25, f: F0 * 2.6, roll: -0.12 + Math.sin(T) * 0.03, yaw: Math.sin(T * 1.3) * 0.006 });
      world(kk, w, h, c, {
        buildings: false, trees: false, mountains: false, grid: true, sun: null,
        person: { x: 0, z: 7, armUp: true, walk: 0.6 },
        after: (k2) => { k2.strokeStyle = C.blue; k2.lineWidth = 3.5; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.1; const r0 = 92 + (i % 3) * 14; k2.beginPath(); k2.moveTo(Math.cos(a) * r0 * 1.7, Math.sin(a) * r0); k2.lineTo(Math.cos(a) * 500, Math.sin(a) * 300); k2.stroke(); } }
      });
      meter(kk, w, h, 0.85 + 0.15 * Math.sin(uu * 31));
    };
    if (u < cut) quiet(k, u);
    else blend(k, kk => loud(kk, u), kk => quiet(kk, 0), eIOs(r));
    return u < cut || r > .5 ? '♪ 静か' : '♪ 大音量';
  });

  // @shared
  // 23/24 J・L カット: 上が映像、下に映像と音のタイムライン
  function splitCell(lead) {   // lead>0: 音が先（J） / lead<0: 音が後（L）
    return (k, w, h, u, cyc) => {
      const vh = 134;
      const p = clamp((u - 0.4) / 3.6);       // 再生ヘッド
      const r = P(u, CYC - RESET, CYC);
      const X0 = 70, X1 = w - 22, cutV = 0.55, cutA = cutV - lead;
      const draw = (kk, p) => {
        // 映像
        kk.save(); kk.beginPath(); kk.rect(0, 0, w, vh); kk.clip();
        (p < cutV ? sceneA : sceneB)(kk, w, vh, { cam: { pitch: p < cutV ? -0.13 : -0.06 } });
        // 今流れている音
        const aB = p >= cutA, lab = aB ? '♪ Bの音' : '♪ Aの音', f = `700 15px ${JP}`;
        const bw = tw(kk, lab, f) + 22;
        kk.fillStyle = aB ? C.blue : '#8E8E93'; rr(kk, w - 42 - bw, vh - 40, bw, 26, 13); kk.fill();
        txt(kk, lab, w - 42 - bw / 2, vh - 26.5, f, '#fff', 'center', 'middle');
        const sl = p < cutV ? 'A' : 'B';
        kk.fillStyle = 'rgba(255,255,255,.9)'; rr(kk, 42, vh - 40, 70, 26, 13); kk.fill();
        txt(kk, '映像' + sl, 77, vh - 26.5, `700 15px ${JP}`, C.ink, 'center', 'middle');
        kk.restore();
        kk.strokeStyle = C.border; kk.lineWidth = 1.5; kk.beginPath(); kk.moveTo(0, vh + .5); kk.lineTo(w, vh + .5); kk.stroke();
        // タイムライン
        const tracks = [['映像', vh + 14, cutV], ['音', vh + 44, cutA]];
        const xAt = q => lerp(X0, X1, q);
        tracks.forEach(([name, y, cut]) => {
          txt(kk, name, 18, y + 11, `600 15px ${JP}`, C.sub, 'left', 'middle');
          kk.fillStyle = C.g2; rr(kk, X0, y, xAt(cut) - X0 - 2, 22, 5); kk.fill();
          kk.fillStyle = C.blueL; rr(kk, xAt(cut) + 2, y, X1 - xAt(cut) - 2, 22, 5); kk.fill();
          txt(kk, 'A', X0 + 10, y + 11.5, `700 14px ${EN}`, C.g4, 'left', 'middle');
          txt(kk, 'B', xAt(cut) + 12, y + 11.5, `700 14px ${EN}`, C.blue, 'left', 'middle');
          if (name === '音') {   // 波形
            kk.strokeStyle = 'rgba(255,255,255,.95)'; kk.lineWidth = 1.6; kk.beginPath();
            for (let x = X0 + 26; x < X1 - 6; x += 5) { if (x < X0 + 24 || (x > xAt(cut) - 4 && x < xAt(cut) + 26)) continue; const a = 3 + 5 * Math.abs(Math.sin(x * 0.37) * Math.cos(x * 0.11)); kk.moveTo(x, y + 11 - a); kk.lineTo(x, y + 11 + a); }
            kk.stroke();
          }
        });
        // ずれている区間を強調
        const a1 = xAt(Math.min(cutA, cutV)), a2 = xAt(Math.max(cutA, cutV));
        kk.fillStyle = 'rgba(47,107,235,.12)'; kk.fillRect(a1, vh + 8, a2 - a1, 64);
        kk.strokeStyle = C.blue; kk.lineWidth = 1.5; kk.setLineDash([4, 3]); kk.beginPath(); kk.moveTo(a1, vh + 8); kk.lineTo(a1, vh + 72); kk.moveTo(a2, vh + 8); kk.lineTo(a2, vh + 72); kk.stroke(); kk.setLineDash([]);
        // 再生ヘッド
        const hx = xAt(p); kk.fillStyle = C.ink; kk.fillRect(hx - 1.5, vh + 6, 3, 68); kk.beginPath(); kk.moveTo(hx - 6, vh + 4); kk.lineTo(hx + 6, vh + 4); kk.lineTo(hx, vh + 11); kk.fill();
      };
      blend(k, kk => draw(kk, p), kk => draw(kk, 0), eIOs(r));
      return null;
    };
  }

  // @element 23
  // 23 Jカット: 音が先に次の場面（B）へ切り替わり、映像が後から追う
  CELLS[22] = shot(splitCell(0.2), 134);

  // @element 24
  // 24 Lカット: 映像が先に次の場面（B）へ切り替わり、前の場面（A）の音が残る
  CELLS[23] = shot(splitCell(-0.2), 134);

  // @end
  return { width: CW, height: CH, cycle: CYC * 2, cells: CELLS, fonts: [] };
});

/* Motion Prompt · pack "ui" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('ui', function () {
  // @kit
  // UIパーツの名前 24（カード 542x191 = 元動画のカード窓 542x222 から窓の上枠 31px を除いた中身）。
  // 各コマは時間 u の純関数。1周期 CYC=4.5秒。カーソル（指）の動きがきっかけで部品が動く。
  const CW = 542, CH = 191, CYC = 4.5;

  // パックの色（地・文字・差し色）
  const C = {
    bg: '#f5f3f1', card: '#ffffff', border: '#dcdbdb', dot: '#dddddd', url: '#eeeeeb', sep: '#ecebe9',
    line: '#e6e4e3', line2: '#d6d4d2', block: '#f0efed', ink: '#111111', en: '#7b7975', hint: '#868482',
    blue: '#1f5ae8', lb: '#eef3fe', mb: '#cad9f9', sb: '#a3bef7', scroll: '#c9c7c5', dark: '#26282c'
  };
  const JP = '"Hiragino Sans","Hiragino Kaku Gothic ProN",sans-serif';
  const NUMF = 'system-ui,-apple-system,"Helvetica Neue",sans-serif';

  // 描画の補助関数は元のまま X（2D コンテキスト）に描く。ui() が毎回 X を渡された k に向け、白地を敷いてから描く
  let X = null;
  const ui = draw => (k, w, h, u) => { X = k; k.fillStyle = C.card; k.fillRect(0, 0, w, h); draw(w, h, u); };

  // ---------- helpers ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const eo = x => 1 - Math.pow(1 - x, 3);
  const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, k) => a + (b - a) * k;
  function rr(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
  function fillRR(x, y, w, h, r, c) { rr(x, y, w, h, r); X.fillStyle = c; X.fill(); }
  function strokeRR(x, y, w, h, r, c, lw = 1.5) { rr(x, y, w, h, r); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function bar(x, y, w, c = C.line, h = 9) { fillRR(x, y, w, h, h / 2, c); }
  function text(s, x, y, size, color, weight = 500, align = 'left', font = JP) { X.font = `${weight} ${size}px ${font}`; X.fillStyle = color; X.textAlign = align; X.textBaseline = 'middle'; X.fillText(s, x, y); }
  function tw(s, size, weight = 500, font = JP) { X.font = `${weight} ${size}px ${font}`; return X.measureText(s).width; }
  function circle(x, y, r, c) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.fillStyle = c; X.fill(); }
  function ring(x, y, r, c, lw = 2) { X.beginPath(); X.arc(x, y, r, 0, Math.PI * 2); X.strokeStyle = c; X.lineWidth = lw; X.stroke(); }
  function shadowed(fn, blur = 18, oy = 6, a = .14) { X.save(); X.shadowColor = `rgba(20,24,40,${a})`; X.shadowBlur = blur; X.shadowOffsetY = oy; fn(); X.restore(); }
  function chevron(x, y, s, rot, c, lw = 2.2) { X.save(); X.translate(x, y); X.rotate(rot); X.beginPath(); X.moveTo(-s, -s / 2); X.lineTo(0, s / 2); X.lineTo(s, -s / 2); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); X.restore(); }
  function check(x, y, s, c, lw = 2.6) { X.beginPath(); X.moveTo(x - s, y); X.lineTo(x - s * .3, y + s * .7); X.lineTo(x + s, y - s * .7); X.strokeStyle = c; X.lineWidth = lw; X.lineCap = 'round'; X.lineJoin = 'round'; X.stroke(); }
  function mountains(x, y, w, h, tint = 0) {
    X.save(); rr(x, y, w, h, 8); X.clip();
    X.fillStyle = tint ? '#e3ebfd' : C.lb; X.fillRect(x, y, w, h);
    X.fillStyle = C.mb; X.beginPath(); X.moveTo(x, y + h); X.lineTo(x + w * .28, y + h * .42); X.lineTo(x + w * .5, y + h * .72); X.lineTo(x + w * .72, y + h * .35); X.lineTo(x + w, y + h * .8); X.lineTo(x + w, y + h); X.fill();
    X.fillStyle = C.sb; X.beginPath(); X.moveTo(x + w * .3, y + h); X.lineTo(x + w * .55, y + h * .62); X.lineTo(x + w * .8, y + h); X.fill();
    circle(x + w * .82, y + h * .26, Math.min(w, h) * .09, C.mb);
    X.restore();
  }
  // カーソル（矢印）。keys=[[t,x,y],...]、clicks=[t,...]
  function track(keys, t) {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) { const a = keys[i - 1], b = keys[i]; if (t <= b[0]) { const k = eio((t - a[0]) / (b[0] - a[0] || 1)); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; } }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  function ripple(x, y, clicks, t) {
    for (const c of clicks) { const k = (t - c) / .45; if (k >= 0 && k <= 1) { ring(x, y, 7 + 22 * eo(k), `rgba(31,90,232,${.75 * (1 - k)})`, 3); } }
  }
  function pointer(keys, clicks, t) {
    const [x, y] = track(keys, t);
    ripple(x, y, clicks, t);
    const pressed = clicks.some(c => t >= c - .07 && t < c + .1);
    X.save(); X.translate(x, y); const s = pressed ? 1.0 : 1.18; X.scale(s, s);
    X.beginPath(); X.moveTo(0, 0); X.lineTo(0, 22); X.lineTo(5.5, 17); X.lineTo(9.5, 26); X.lineTo(13, 24.5); X.lineTo(9, 15.8); X.lineTo(16, 15.8); X.closePath();
    X.lineJoin = 'round'; X.strokeStyle = '#fff'; X.lineWidth = 3; X.stroke(); X.fillStyle = '#111'; X.fill();
    X.restore();
  }
  function finger(keys, downs, t, visible) {
    if (!visible) return; const [x, y] = track(keys, t);
    ripple(x, y, downs, t);
    circle(x, y, 17, 'rgba(17,17,17,.24)'); ring(x, y, 17, 'rgba(255,255,255,.95)', 2.5);
  }
  // よく使う背景のワイヤーフレーム
  function pageLines(x, y, w) { bar(x, y, w * .45, C.line2, 11); bar(x, y + 24, w, C.line); bar(x, y + 42, w * .78, C.line); }
  const CELLS = [];

  // @element 01
  // 01 モーダル（Modal dialog）
  CELLS[0] = ui((w, h, t) => {
    pageLines(24, 18, 494);
    fillRR(24, 92, 120, 36, 8, C.blue); text('開く', 84, 110, 16, '#fff', 600, 'center');
    fillRR(170, 92, 348, 36, 8, C.block); fillRR(24, 142, 494, 38, 8, C.block);
    const a = eo(seg(t, 1.0, 1.32)) * (1 - eio(seg(t, 3.3, 3.58)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.42 * a})`; X.fillRect(0, 0, w, h);
      X.save(); X.globalAlpha = a; X.translate(271, 97); const s = .9 + .1 * a; X.scale(s, s);
      shadowed(() => fillRR(-140, -70, 280, 140, 12, '#fff'), 24, 8, .25);
      bar(-116, -48, 120, C.ink, 11); bar(-116, -20, 232); bar(-116, -2, 180);
      fillRR(28, 26, 88, 30, 7, C.blue);
      X.strokeStyle = '#9a9896'; X.lineWidth = 2.2; X.lineCap = 'round'; X.beginPath(); X.moveTo(110, -54); X.lineTo(120, -44); X.moveTo(120, -54); X.lineTo(110, -44); X.stroke();
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 86, 114], [1.5, 86, 114], [3.0, 389, 50], [3.5, 389, 50], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 02
  // 02 ドロワー（Drawer (Off-canvas)）
  CELLS[1] = ui((w, h, t) => {
    strokeRR(24, 14, 110, 34, 8, C.line2, 1.5); text('メニュー', 79, 31, 15, '#555', 600, 'center');
    bar(160, 26, 140, C.line2, 11); pageLines(24, 70, 494); fillRR(24, 138, 494, 42, 8, C.block);
    const a = eo(seg(t, 1.0, 1.38)) * (1 - eio(seg(t, 3.3, 3.65)));
    if (a > 0) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const pw = 210, px = -pw + pw * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(px, 0, pw, h); }, 22, 0, .25);
      circle(px + 34, 32, 14, C.mb); bar(px + 58, 27, 100, C.line2, 10);
      for (let i = 0; i < 4; i++) { const y = 62 + i * 32; if (i === 0) fillRR(px + 12, y - 2, pw - 24, 28, 6, C.lb); fillRR(px + 22, y + 5, 14, 14, 3, i === 0 ? C.blue : C.line2); bar(px + 46, y + 7, 90 + (i % 2) * 30, i === 0 ? C.sb : C.line); }
    }
    pointer([[.3, w + 30, h + 30], [.95, 70, 34], [1.6, 70, 34], [3.0, 420, 120], [3.6, 420, 120], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 03
  // 03 ボトムシート（Bottom sheet）
  CELLS[2] = ui((w, h, t) => {
    pageLines(24, 16, 494); fillRR(24, 76, 239, 54, 8, C.block); fillRR(279, 76, 239, 54, 8, C.block);
    fillRR(186, 144, 170, 36, 18, C.blue); text('詳細を見る', 271, 162, 15, '#fff', 600, 'center');
    const open = eo(seg(t, 1.05, 1.45));
    const drag = eio(seg(t, 3.0, 3.6));
    const a = open * (1 - drag);
    if (open > 0 && a > 0.001) {
      X.fillStyle = `rgba(18,20,28,${.36 * a})`; X.fillRect(0, 0, w, h);
      const sh = 136, sy = h - sh * a;
      shadowed(() => { rr(0, sy, w, sh + 20, 18); X.fillStyle = '#fff'; X.fill(); }, 22, -4, .2);
      fillRR(w / 2 - 26, sy + 10, 52, 6, 3, C.line2);
      bar(28, sy + 30, 160, C.ink, 11);
      for (let i = 0; i < 2; i++) { const y = sy + 56 + i * 36; fillRR(28, y, 26, 26, 6, i ? C.mb : C.blue); bar(66, y + 4, 220, C.line); bar(66, y + 17, 140, C.line, 7); }
    }
    const sy = h - 136 * a;
    finger([[.3, 271, 162], [1.6, 271, 162], [2.75, w / 2, h - 136 + 13], [3.0, w / 2, h - 136 + 13], [3.6, w / 2, h + 10]], [1.0, 3.0], t, (t > .6 && t < 1.6) || (t > 2.75 && t < 3.6));
  });

  // @element 04
  // 04 アコーディオン（Accordion）
  CELLS[3] = ui((w, h, t) => {
    const ex = eio(seg(t, 1.0, 1.35)) * (1 - eio(seg(t, 3.3, 3.62)));
    let y = 12; const H0 = 34, EX = 58;
    for (let i = 0; i < 3; i++) {
      const extra = i === 0 ? EX * ex : 0;
      strokeRR(24, y, 494, H0 + extra, 8, i === 0 && ex > .05 ? C.sb : C.line2, 1.5);
      bar(42, y + 12, [180, 220, 150][i], i === 0 && ex > .05 ? C.blue : C.line2, 10);
      chevron(494, y + 17, 6, i === 0 ? Math.PI * ex : 0, i === 0 && ex > .05 ? C.blue : '#9a9896');
      if (i === 0 && ex > 0) { X.save(); rr(24, y, 494, H0 + extra, 8); X.clip(); X.globalAlpha = ex; bar(42, y + H0 + 6, 420); bar(42, y + H0 + 24, 320); X.restore(); }
      y += H0 + extra + 6;
    }
    pointer([[.3, w + 30, h + 30], [.95, 300, 31], [1.6, 300, 31], [3.0, 300, 31], [3.55, 300, 31], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 05
  // 05 ドロップダウン（Dropdown menu）
  CELLS[4] = ui((w, h, t) => {
    bar(24, 14, 90, C.line2, 10);
    const open = eo(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.3, 2.45)));
    const chosen = seg(t, 2.32, 2.42) * (1 - seg(t, 3.9, 4.08));
    const ph = (1 - seg(t, 2.2, 2.3)) + seg(t, 4.1, 4.3); // プレースホルダーは先に消し、名前が消えてから戻す（重ねない）
    strokeRR(24, 34, 260, 38, 8, open > .1 || (chosen > 0 && t < 2.9) ? C.blue : C.line2, open > .1 ? 2 : 1.5);
    if (ph > 0) { X.globalAlpha = clamp(ph); text('選択してください', 40, 53, 15, '#9a9896', 500); X.globalAlpha = 1; }
    if (chosen > 0) { X.globalAlpha = chosen; text('名古屋', 40, 53, 16, C.ink, 600); X.globalAlpha = 1; }
    chevron(262, 52, 5, Math.PI * open, '#777');
    fillRR(310, 34, 208, 70, 8, C.block); bar(310, 120, 208); bar(310, 138, 160); bar(24, 150, 200); bar(24, 168, 150);
    if (open > 0) {
      X.save(); X.globalAlpha = open; const oy = 78 - 6 * (1 - open);
      shadowed(() => fillRR(24, oy, 260, 112, 8, '#fff'), 18, 6, .18); strokeRR(24, oy, 260, 112, 8, C.border, 1);
      const hi = seg(t, 1.55, 1.75) > 0 ? (t < 1.95 ? 1 : 2) : -1;
      ['東京', '大阪', '名古屋', '福岡'].forEach((s, i) => { const yy = oy + 4 + i * 26; if (i === hi + (hi === 1 ? 0 : 0) && hi >= 0) fillRR(28, yy, 252, 26, 5, C.lb); text(s, 40, yy + 13, 15, i === hi ? C.blue : '#444', i === hi ? 600 : 500); });
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 200, 56], [1.25, 200, 56], [1.6, 170, 121], [2.0, 170, 147], [2.45, 170, 147], [3.2, 170, 147], [4.2, w + 30, h + 30]], [1.0, 2.3], t);
  });

  // @element 06
  // 06 ツールチップ（Tooltip）
  CELLS[5] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    bar(24, 116, 150, C.line2, 11); ring(196, 121, 13, C.blue, 2.2); text('?', 196, 122, 16, C.blue, 700, 'center', NUMF);
    fillRR(24, 146, 494, 34, 8, C.block);
    const a = eo(seg(t, 1.15, 1.35)) * (1 - seg(t, 3.25, 3.45));
    if (a > 0) {
      X.save(); X.globalAlpha = a; const yy = 64 + 6 * (1 - a);
      fillRR(196 - 92, yy, 184, 36, 8, C.dark);
      X.beginPath(); X.moveTo(196 - 8, yy + 36); X.lineTo(196, yy + 44); X.lineTo(196 + 8, yy + 36); X.fillStyle = C.dark; X.fill();
      text('小さな説明が出る', 196, yy + 18, 15, '#fff', 600, 'center'); X.restore();
    }
    // 乗せるだけ（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.05, 200, 126], [3.15, 200, 126], [4.1, w + 30, h + 30]], [], t);
  });

  // @element 07
  // 07 ポップオーバー（Popover）
  CELLS[6] = ui((w, h, t) => {
    pageLines(24, 16, 494);
    strokeRR(24, 112, 108, 36, 8, C.blue, 2); text('詳細', 78, 130, 15, C.blue, 600, 'center');
    fillRR(24, 160, 494, 22, 6, C.block);
    const a = eo(seg(t, 1.0, 1.28)) * (1 - eio(seg(t, 3.3, 3.5)));
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.translate(6 * (1 - a), 0);
      const px = 156, py = 62, pw = 300, ph = 120;
      shadowed(() => { fillRR(px, py, pw, ph, 10, '#fff'); }, 22, 6, .2); strokeRR(px, py, pw, ph, 10, C.border, 1);
      X.beginPath(); X.moveTo(px + 1, 122); X.lineTo(px - 10, 130); X.lineTo(px + 1, 138); X.fillStyle = '#fff'; X.fill();
      X.beginPath(); X.moveTo(px, 122); X.lineTo(px - 10, 130); X.lineTo(px, 138); X.strokeStyle = C.border; X.lineWidth = 1; X.stroke();
      bar(px + 18, py + 18, 130, C.ink, 11); bar(px + 18, py + 42, 250); bar(px + 18, py + 60, 200);
      strokeRR(px + 130, py + 82, 70, 26, 6, C.line2, 1.5); fillRR(px + 210, py + 82, 72, 26, 6, C.blue); text('OK', px + 246, py + 95, 14, '#fff', 700, 'center', NUMF);
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.95, 84, 134], [1.6, 84, 134], [3.0, 402, 157], [3.5, 402, 157], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 08
  // 08 トースト（Toast notification）
  CELLS[7] = ui((w, h, t) => {
    bar(24, 16, 90, C.line2, 10); strokeRR(24, 34, 300, 34, 7, C.line2, 1.5); bar(24, 82, 90, C.line2, 10); strokeRR(24, 100, 300, 34, 7, C.line2, 1.5);
    fillRR(24, 146, 110, 36, 8, C.blue); text('保存', 79, 164, 16, '#fff', 600, 'center');
    const tin = eo(seg(t, 1.05, 1.4)), tout = eio(seg(t, 3.2, 3.55));
    if (tin > 0 && tout < 1) {
      const tw0 = 214, th = 52, tx = w - 18 - tw0 + (1 - tin) * 240 + tout * 240, ty = h - 16 - th;
      shadowed(() => fillRR(tx, ty, tw0, th, 10, C.dark), 18, 6, .25);
      circle(tx + 26, ty + 24, 11, C.blue); check(tx + 26, ty + 24, 5, '#fff', 2.4);
      text('保存しました', tx + 46, ty + 24, 15, '#fff', 600);
      const life = 1 - seg(t, 1.4, 3.2); fillRR(tx + 10, ty + th - 7, (tw0 - 20) * life, 3, 1.5, C.sb);
    }
    pointer([[.3, -30, h + 30], [.95, 84, 168], [1.5, 84, 168], [2.2, -40, h + 40]], [1.0], t);
  });

  // @element 09
  // 09 タブ（Tabs）
  CELLS[8] = ui((w, h, t) => {
    const labs = ['概要', '料金', 'レビュー'], xs = [24, 114, 204], ws = [70, 70, 100];
    const c1 = eio(seg(t, 1.0, 1.25)), c2 = eio(seg(t, 2.2, 2.45)), c3 = eio(seg(t, 3.4, 3.65));
    const pos = c1 + c2 - 2 * c3; // 0 -> 1 -> 2 -> 0
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    const ux = lerp(xs[fi], xs[gi], fr), uw = lerp(ws[fi], ws[gi], fr);
    const act = t < 1.1 ? 0 : t < 2.3 ? 1 : t < 3.5 ? 2 : 0;
    labs.forEach((s, i) => text(s, xs[i] + ws[i] / 2, 28, 17, i === act ? C.blue : '#8a8886', i === act ? 700 : 500, 'center'));
    X.fillStyle = C.line; X.fillRect(0, 50, w, 2); fillRR(ux, 48, uw, 4, 2, C.blue);
    // 中身（切替時にクロスフェード）
    const tabAlpha = [
      1 - seg(t, 1.0, 1.2) + seg(t, 3.45, 3.65),
      seg(t, 1.1, 1.3) - seg(t, 2.2, 2.4),
      seg(t, 2.3, 2.5) - seg(t, 3.4, 3.6)];
    tabAlpha.forEach((a, i) => {
      a = clamp(a); if (a <= 0) return; X.save(); X.globalAlpha = a; X.translate(0, 8 * (1 - a));
      if (i === 0) { bar(24, 70, 220, C.line2, 11); bar(24, 94, 494); bar(24, 112, 400); fillRR(24, 134, 494, 46, 8, C.block); }
      if (i === 1) { for (let k = 0; k < 3; k++) { const x = 24 + k * 168; fillRR(x, 68, 158, 112, 10, k === 1 ? C.lb : '#f6f5f3'); strokeRR(x, 68, 158, 112, 10, k === 1 ? C.sb : C.line, 1.5); bar(x + 16, 84, 60, k === 1 ? C.blue : C.line2, 10); text(['¥0', '¥980', '¥1,980'][k], x + 16, 118, 22, k === 1 ? C.blue : '#555', 700, 'left', NUMF); bar(x + 16, 148, 110); } }
      if (i === 2) { for (let k = 0; k < 3; k++) { const y = 70 + k * 38; circle(40, y + 14, 14, k === 0 ? C.mb : C.line); bar(64, y + 4, 120, C.line2, 10); bar(64, y + 20, 360); } }
      X.restore();
    });
    pointer([[.3, w + 30, h + 30], [.95, 152, 34], [1.6, 152, 34], [2.15, 256, 34], [2.8, 256, 34], [3.35, 62, 34], [3.7, 62, 34], [4.25, w + 30, h + 30]], [1.0, 2.2, 3.4], t);
  });

  // @element 10
  // 10 カルーセル（Carousel）
  CELLS[9] = ui((w, h, t) => {
    const p = eio(seg(t, 1.0, 1.4)) + eio(seg(t, 2.1, 2.5)) + eio(seg(t, 3.2, 3.6));
    const sw = 330, gap = 18, cx = w / 2;
    X.save(); X.beginPath(); X.rect(0, 0, w, 160); X.clip();
    for (let j = Math.floor(p) - 2; j <= Math.floor(p) + 2; j++) {
      const x = cx - sw / 2 + (j - p) * (sw + gap), idx = ((j % 3) + 3) % 3;
      if (idx === 0) mountains(x, 14, sw, 138);
      if (idx === 1) { fillRR(x, 14, sw, 138, 8, '#e3ebfd'); circle(x + 90, 83, 34, C.mb); circle(x + 165, 83, 34, C.sb); circle(x + 240, 83, 34, C.mb); }
      if (idx === 2) { fillRR(x, 14, sw, 138, 8, C.lb); for (let k = 0; k < 5; k++) { const bh = [40, 70, 55, 95, 80][k]; fillRR(x + 60 + k * 46, 132 - bh, 30, bh, 4, k === 3 ? C.blue : C.mb); } }
    }
    X.restore();
    [[30, 83, Math.PI / 2], [w - 30, 83, -Math.PI / 2]].forEach(([x, y, r]) => { shadowed(() => circle(x, y, 18, '#fff'), 10, 3, .2); chevron(x, y, 5, r, '#555'); });
    const act = Math.round(p) % 3;
    for (let k = 0; k < 3; k++) { const on = k === act; fillRR(w / 2 - 30 + k * 22 - (on ? 4 : 0), 172, on ? 16 : 8, 8, 4, on ? C.blue : C.line2); }
    pointer([[.3, w + 30, h + 30], [.95, w - 28, 88], [3.4, w - 28, 88], [4.2, w + 30, h + 30]], [1.0, 2.1, 3.2], t);
  });

  // @element 11
  // 11 トグルスイッチ（Toggle switch）
  CELLS[10] = ui((w, h, t) => {
    const st = [eo(seg(t, 1.0, 1.2)) * (1 - eo(seg(t, 3.0, 3.2))), eo(seg(t, 1.8, 2.0)) * (1 - eo(seg(t, 3.6, 3.8))), 0];
    for (let i = 0; i < 3; i++) {
      const y = 14 + i * 60; bar(24, y + 10, [170, 140, 190][i], C.line2, 11); bar(24, y + 30, [260, 220, 240][i], C.line, 8);
      if (i < 2) { X.fillStyle = C.line; X.fillRect(24, y + 52, 494, 1.5); }
      const k = st[i], tx = 450, ty = y + 10;
      fillRR(tx, ty, 64, 34, 17, k > .5 ? C.blue : '#d9d7d5'); if (k > 0 && k < 1) { X.globalAlpha = k; fillRR(tx, ty, 64, 34, 17, C.blue); X.globalAlpha = 1; }
      shadowed(() => circle(tx + 17 + 30 * k, ty + 17, 13, '#fff'), 4, 1, .25);
    }
    pointer([[.3, w + 30, h + 30], [.95, 486, 30], [1.35, 486, 30], [1.75, 486, 90], [2.5, 486, 90], [2.95, 486, 30], [3.25, 486, 30], [3.55, 486, 90], [3.85, 486, 90], [4.3, w + 30, h + 30]], [1.0, 1.8, 3.0, 3.6], t);
  });

  // @element 12
  // 12 セグメントコントロール（Segmented control）
  CELLS[11] = ui((w, h, t) => {
    const pos = eio(seg(t, 1.0, 1.25)) + eio(seg(t, 2.1, 2.35)) - 2 * eio(seg(t, 3.3, 3.55));
    const sx = 121, sy = 12, sw = 300, sh = 40, cw = sw / 3;
    fillRR(sx, sy, sw, sh, 10, '#efedeb');
    shadowed(() => fillRR(sx + 4 + pos * cw, sy + 4, cw - 8, sh - 8, 8, C.blue), 6, 2, .2);
    ['日', '週', '月'].forEach((s, i) => { const near = 1 - clamp(Math.abs(pos - i)); text(s, sx + cw * i + cw / 2, sy + sh / 2 + 1, 17, near > .5 ? '#fff' : '#6d6b69', 700, 'center'); });
    const sets = [[30, 55, 40, 70, 50, 85, 60], [60, 40, 90, 75, 100, 55, 80], [95, 70, 110, 60, 85, 115, 100]];
    const fi = Math.floor(pos), fr = pos - fi, gi = Math.min(2, fi + 1);
    X.fillStyle = C.line; X.fillRect(60, 182, 422, 1.5);
    for (let k = 0; k < 7; k++) { const bh = lerp(sets[fi][k], sets[gi][k], eio(fr)); fillRR(72 + k * 58, 180 - bh, 34, bh, 5, k === 5 ? C.blue : C.mb); }
    pointer([[.3, w + 30, h + 30], [.95, 276, 36], [1.6, 276, 36], [2.05, 376, 36], [2.8, 376, 36], [3.25, 176, 36], [3.7, 176, 36], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 13
  // 13 チップ（Filter chips）
  CELLS[12] = ui((w, h, t) => {
    const chips = ['すべて', '新着', '人気', '無料']; let x = 24; const pos = [];
    const on = [0, eo(seg(t, 0.95, 1.1)) * (1 - eo(seg(t, 3.0, 3.15))), 0, eo(seg(t, 1.75, 1.9)) * (1 - eo(seg(t, 3.6, 3.75)))];
    chips.forEach((s, i) => {
      const k = on[i], cw0 = tw(s, 15, 600) + 32 + (k > 0 ? 18 * k : 0);
      fillRR(x, 12, cw0, 34, 17, k > .5 ? C.lb : '#fff'); strokeRR(x, 12, cw0, 34, 17, k > .5 ? C.blue : C.line2, 1.5);
      if (k > 0) { X.globalAlpha = k; check(x + 18, 29, 5, C.blue, 2.4); X.globalAlpha = 1; }
      text(s, x + 16 + 18 * k, 30, 15, k > .5 ? C.blue : '#555', 600);
      pos.push(x + cw0 / 2); x += cw0 + 10;
    });
    // 一覧：条件に合わないカードが消える
    const vis = [1, 1 - Math.max(on[1], on[3]), 1 - on[3], 1];
    for (let i = 0; i < 4; i++) {
      const cx = 24 + (i % 2) * 252, cy = 60 + Math.floor(i / 2) * 64, a = clamp(.12 + .88 * vis[i]);
      X.save(); X.globalAlpha = a; strokeRR(cx, cy, 242, 54, 8, C.line2, 1.5); fillRR(cx + 10, cy + 10, 34, 34, 6, i === 0 ? C.mb : C.line); bar(cx + 54, cy + 14, 120, C.line2, 10); bar(cx + 54, cy + 32, 150, C.line, 7); X.restore();
    }
    const p1 = pos[1] || 120, p3 = pos[3] || 300;
    pointer([[.3, w + 30, h + 30], [.9, 130, 32], [1.3, 130, 32], [1.7, 300, 32], [2.5, 300, 32], [2.95, 130, 32], [3.2, 130, 32], [3.55, 296, 32], [3.85, 296, 32], [4.3, w + 30, h + 30]], [0.95, 1.75, 3.0, 3.6], t);
  });

  // @element 14
  // 14 レンジスライダー（Range slider）
  CELLS[13] = ui((w, h, t) => {
    // つまみ2つで範囲を選ぶ：下限 ¥1,000→¥3,000、上限 ¥10,000→¥8,000、のち元へ戻す
    const LO = tt => .1 + .2 * eio(seg(tt, 1.0, 1.6)) - .2 * eio(seg(tt, 3.55, 3.9));
    const HI = tt => 1.0 - .2 * eio(seg(tt, 2.1, 2.6)) + .2 * eio(seg(tt, 2.95, 3.3));
    const x0 = 54, x1 = 488, ty = 120, X_ = v => lerp(x0, x1, v);
    const lo = LO(t), hi = HI(t), lx = X_(lo), hx = X_(hi);
    const yen = v => '¥' + (Math.round(v * 100) * 100).toLocaleString('en-US');
    text('価格', 24, 26, 16, '#555', 700);
    text(yen(lo) + ' 〜 ' + yen(hi), w - 24, 26, 17, C.blue, 700, 'right', NUMF);
    fillRR(x0, ty - 4, x1 - x0, 8, 4, '#e3e1df'); fillRR(lx, ty - 4, hx - lx, 8, 4, C.blue);
    const loAct = (t > 1.0 && t < 1.7) || (t > 3.55 && t < 3.95), hiAct = t > 2.1 && t < 3.3;
    [[lx, lo, loAct], [hx, hi, hiAct]].forEach(([kx, v, act]) => {
      if (act) circle(kx, ty, 24, 'rgba(31,90,232,.14)');
      shadowed(() => circle(kx, ty, act ? 15 : 13, '#fff'), 6, 2, .25); ring(kx, ty, act ? 15 : 13, C.blue, 3);
      const val = yen(v), bw = tw(val, 15, 700, NUMF) + 18, bx = clamp(kx - bw / 2, 4, w - 4 - bw);
      fillRR(bx, ty - 60, bw, 28, 7, act ? C.blue : C.lb);
      X.beginPath(); X.moveTo(kx - 6, ty - 32); X.lineTo(kx, ty - 26); X.lineTo(kx + 6, ty - 32); X.fillStyle = act ? C.blue : C.lb; X.fill();
      text(val, bx + bw / 2, ty - 46, 15, act ? '#fff' : C.blue, 700, 'center', NUMF);
    });
    text('¥0', x0, 154, 14, '#9a9896', 500, 'center', NUMF); text('¥10,000', x1 - 10, 154, 14, '#9a9896', 500, 'center', NUMF);
    bar(24, 174, 220, C.line, 8);
    const off = [w + 30, h + 30], L = tt => [X_(LO(tt)), ty + 4], Hh = tt => [X_(HI(tt)), ty + 4];
    const mv = (a, b, ta, tb) => track([[ta, a[0], a[1]], [tb, b[0], b[1]]], t);
    let pos;
    if (t < 1.0) pos = mv(off, L(1.0), .3, .95);
    else if (t < 1.7) pos = L(t);
    else if (t < 2.1) pos = mv(L(1.7), Hh(2.1), 1.7, 2.05);
    else if (t < 3.3) pos = Hh(t);
    else if (t < 3.55) pos = mv(Hh(3.3), L(3.55), 3.3, 3.52);
    else if (t < 3.95) pos = L(t);
    else pos = mv(L(3.95), off, 3.95, 4.3);
    pointer([[0, pos[0], pos[1]]], [1.0, 2.1, 2.95, 3.55], t);
  });

  // @element 15
  // 15 ステッパー（Stepper (+/−)）
  CELLS[14] = ui((w, h, t) => {
    bar(171, 24, 90, C.line2, 10);
    const plus = [.9, 1.35, 1.8], minus = [2.8, 3.25, 3.7];
    let n = 1; plus.forEach(c => { if (t >= c) n++; }); minus.forEach(c => { if (t >= c) n--; });
    const last = [...plus, ...minus].filter(c => t >= c).pop();
    const pop = last !== undefined ? 1 - seg(t, last, last + .25) : 0;
    const bx = 171, by = 52, bw = 200, bh = 60;
    strokeRR(bx, by, bw, bh, 12, C.line2, 1.8);
    const pressP = plus.some(c => t >= c - .05 && t < c + .15), pressM = minus.some(c => t >= c - .05 && t < c + .15);
    if (pressM) fillRR(bx + 2, by + 2, 58, bh - 4, 10, C.lb); if (pressP) fillRR(bx + bw - 60, by + 2, 58, bh - 4, 10, C.lb);
    X.fillStyle = C.line2; X.fillRect(bx + 60, by + 10, 1.5, bh - 20); X.fillRect(bx + bw - 61, by + 10, 1.5, bh - 20);
    text('−', bx + 30, by + bh / 2, 30, '#555', 500, 'center', NUMF); text('+', bx + bw - 30, by + bh / 2, 30, C.blue, 500, 'center', NUMF);
    X.save(); X.translate(bx + bw / 2, by + bh / 2 + 1); X.scale(1 + .18 * pop, 1 + .18 * pop); text(String(n), 0, 0, 30, pop > .05 ? C.blue : C.ink, 700, 'center', NUMF); X.restore();
    bar(171, 136, 200, C.line); bar(171, 154, 140, C.line);
    pointer([[.3, w + 30, h + 30], [.85, 342, 86], [2.3, 342, 86], [2.75, 202, 86], [3.75, 202, 86], [4.3, w + 30, h + 30]], [...plus, ...minus], t);
  });

  // @element 16
  // 16 ページネーション（Pagination）
  CELLS[15] = ui((w, h, t) => {
    const page = t < 1.05 ? 0 : t < 2.15 ? 1 : t < 3.35 ? 2 : 0;
    const fade = Math.min(...[1.05, 2.15, 3.35].map(c => Math.abs(t - c) < .2 ? Math.abs(t - c) / .2 : 1));
    X.save(); X.globalAlpha = fade;
    for (let k = 0; k < 3; k++) { const y = 10 + k * 40; fillRR(24, y, 52, 32, 6, (k + page) % 3 === 0 ? C.mb : C.line); bar(90, y + 4, [200, 160, 240, 180][(k + page) % 4], C.line2, 10); bar(90, y + 20, [320, 280, 360][(k + 2 * page) % 3], C.line, 7); }
    X.restore();
    const items = ['‹', '1', '2', '3', '4', '5', '›'], d = 36, g = 8, total = items.length * d + (items.length - 1) * g, x0 = (w - total) / 2;
    const pos = eio(seg(t, 1.0, 1.2)) + eio(seg(t, 2.1, 2.3)) - 2 * eio(seg(t, 3.3, 3.5));
    circle(x0 + (1 + pos) * (d + g) + d / 2, 160, d / 2, C.blue);
    items.forEach((s, i) => { const cx = x0 + i * (d + g) + d / 2; const on = i >= 1 && i <= 5 && Math.abs(pos - (i - 1)) < .5; text(s, cx, 161, i === 0 || i === 6 ? 22 : 16, on ? '#fff' : '#666', 700, 'center', NUMF); });
    const px = i => x0 + i * (d + g) + d / 2 + 4;
    pointer([[.3, w + 30, h + 30], [.95, px(2), 166], [1.6, px(2), 166], [2.05, px(3), 166], [2.8, px(3), 166], [3.25, px(1), 166], [3.65, px(1), 166], [4.25, w + 30, h + 30]], [1.0, 2.1, 3.3], t);
  });

  // @element 17
  // 17 ハンバーガーメニュー（Hamburger menu）
  CELLS[16] = ui((w, h, t) => {
    const a = eio(seg(t, 1.0, 1.3)) * (1 - eio(seg(t, 3.3, 3.6)));
    pageLines(24, 66, 494); fillRR(24, 134, 494, 46, 8, C.block);
    if (a > 0) {
      X.save(); X.beginPath(); X.rect(0, 44, w, h); X.clip();
      const mh = 140, my = 44 - mh + mh * a;
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, my, w, mh); }, 16, 6, .16);
      for (let k = 0; k < 4; k++) { const y = my + 14 + k * 32; bar(24, y + 6, [110, 150, 90, 130][k], k === 0 ? C.blue : C.line2, 11); if (k < 3) { X.fillStyle = C.line; X.fillRect(24, y + 26, w - 48, 1); } }
      X.restore();
    }
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 44); X.fillStyle = C.line; X.fillRect(0, 44, w, 1.5);
    fillRR(24, 15, 76, 16, 4, C.mb);
    // 三本線 → ×
    const hx = w - 42, hy = 22; X.save(); X.translate(hx, hy); X.strokeStyle = a > .02 ? C.blue : '#333'; X.lineWidth = 3; X.lineCap = 'round';
    X.save(); X.translate(0, -8 * (1 - a)); X.rotate(Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.globalAlpha = 1 - a; X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.globalAlpha = 1;
    X.save(); X.translate(0, 8 * (1 - a)); X.rotate(-Math.PI / 4 * a); X.beginPath(); X.moveTo(-12, 0); X.lineTo(12, 0); X.stroke(); X.restore();
    X.restore();
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 26], [3.5, w - 38, 26], [4.2, w + 30, h + 30]], [1.0, 3.3], t);
  });

  // @element 18
  // 18 パンくずリスト（Breadcrumbs）
  CELLS[17] = ui((w, h, t) => {
    const up = eio(seg(t, 1.0, 1.25)) * (1 - eio(seg(t, 2.7, 2.95))); // 1=「講座」の階層にいる
    let x = 24; const y = 24;
    text('ホーム', x, y, 17, C.blue, 600); x += tw('ホーム', 17, 600) + 10; text('›', x, y, 17, '#aaa', 500); x += 18;
    const kx = x, kw = tw('講座', 17, 700);
    const hoverK = t > .9 && t < 1.2;
    text('講座', x, y, 17, up > .5 ? C.ink : C.blue, up > .5 ? 700 : 600); if (hoverK) { X.fillStyle = C.blue; X.fillRect(x, y + 12, kw, 2); }
    x += kw + 10;
    X.globalAlpha = 1 - up; text('›', x, y, 17, '#aaa', 500); text('Web制作', x + 18, y, 17, C.ink, 700); X.globalAlpha = 1;
    X.fillStyle = C.line; X.fillRect(24, 46, 494, 1.5);
    // 中身：詳細ページ ⇄ 一覧ページ
    if (up < 1) { X.save(); X.globalAlpha = 1 - up; bar(24, 64, 200, C.ink, 13); bar(24, 92, 494); bar(24, 110, 420); fillRR(24, 132, 494, 48, 8, C.block); X.restore(); }
    if (up > 0) { X.save(); X.globalAlpha = up; for (let k = 0; k < 3; k++) { const cx = 24 + k * 168, hov = k === 0 && t > 2.45 && t < 2.8; strokeRR(cx, 62, 158, 118, 8, hov ? C.blue : C.line2, hov ? 2 : 1.5); mountains(cx + 10, 72, 138, 58, k % 2); bar(cx + 10, 142, 90, k === 0 ? C.sb : C.line2, 10); bar(cx + 10, 160, 120, C.line, 7); } X.restore(); }
    pointer([[.3, w + 30, h + 30], [.95, kx + kw / 2, 30], [1.6, kx + kw / 2, 30], [2.4, 104, 120], [3.1, 104, 120], [3.9, w + 30, h + 30]], [1.0, 2.7], t);
  });

  // @element 19
  // 19 メガメニュー（Mega menu）
  CELLS[18] = ui((w, h, t) => {
    const a = eo(seg(t, 1.05, 1.3)) * (1 - eio(seg(t, 3.15, 3.4)));
    pageLines(24, 62, 494); fillRR(24, 130, 494, 50, 8, C.block);
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 42); X.fillStyle = C.line; X.fillRect(0, 42, w, 1.5);
    fillRR(24, 14, 70, 16, 4, C.mb);
    const nav = [['製品', 190], ['料金', 262], ['サポート', 334]];
    nav.forEach(([s, x], i) => { const on = i === 0 && a > .3; text(s, x, 22, 16, on ? C.blue : '#555', on ? 700 : 600); if (on) fillRR(x, 36, tw(s, 16, 700), 3, 1.5, C.blue); chevron(x + tw(s, 16, 700) + 10, 22, 3.5, 0, on ? C.blue : '#999', 1.8); });
    if (a > 0) {
      X.save(); X.globalAlpha = a; X.beginPath(); X.rect(0, 43, w, h); X.clip(); const py = 43 - 12 * (1 - a);
      shadowed(() => { X.fillStyle = '#fff'; X.fillRect(0, py, w, 146); }, 18, 8, .16);
      for (let c = 0; c < 3; c++) { const cx = 24 + c * 130; bar(cx, py + 16, 80, C.blue, 10); for (let k = 0; k < 3; k++) { const hov = c === 1 && k === 1 && t > 1.75 && t < 2.9; if (hov) fillRR(cx - 6, py + 34 + k * 26, 112, 22, 5, C.lb); bar(cx, py + 40 + k * 26, [90, 70, 100][(k + c) % 3], hov ? C.sb : C.line2, 9); } }
      mountains(414, py + 14, 104, 112);
      X.restore();
    }
    // 乗せるだけで開く（クリックしない）
    pointer([[.3, w + 30, h + 30], [1.0, 205, 26], [1.4, 205, 26], [1.8, 196, 98], [2.9, 196, 98], [3.2, 300, 200], [3.9, w + 30, h + 30]], [], t);
  });

  // @element 20
  // 20 ステップインジケーター（Step indicator）
  CELLS[19] = ui((w, h, t) => {
    const clicks = [.9, 1.7, 2.5]; let step = 0; clicks.forEach(c => { if (t >= c) step++; });
    const reset = seg(t, 3.75, 4.05), back = seg(t, 4.05, 4.3);
    const showStep = reset >= 1 ? 0 : step;
    const xs = [80, 207, 334, 461], labs = ['入力', '確認', '支払い', '完了'];
    const prog = clicks.reduce((s, c) => s + eio(seg(t, c, c + .3)), 0);
    X.save(); X.globalAlpha = reset < 1 ? 1 - reset : back;
    const pr = reset >= 1 ? 0 : prog;
    fillRR(xs[0], 33, xs[3] - xs[0], 4, 2, '#e3e1df'); fillRR(xs[0], 33, (xs[1] - xs[0]) * pr, 4, 2, C.blue);
    xs.forEach((x, i) => {
      const done = i < showStep || (showStep === 3 && i === 3), cur = i === showStep && showStep < 3;
      circle(x, 35, 17, done || cur ? C.blue : '#fff'); if (!(done || cur)) ring(x, 35, 16, C.line2, 2);
      if (done) check(x, 35, 7, '#fff', 2.6); else text(String(i + 1), x, 36, 16, cur ? '#fff' : '#9a9896', 700, 'center', NUMF);
      text(labs[i], x, 70, 14, done || cur ? C.blue : '#9a9896', 600, 'center');
    });
    X.restore();
    strokeRR(24, 96, 494, 30, 7, C.line2, 1.5); bar(36, 106, 160, C.line); bar(24, 148, 200, C.line);
    fillRR(w - 24 - 110, 142, 110, 38, 8, C.blue); text('次へ', w - 24 - 55, 161, 16, '#fff', 600, 'center');
    pointer([[.3, w + 30, h + 30], [.85, w - 74, 166], [2.6, w - 74, 166], [3.3, w + 30, h + 30]], clicks, t);
  });

  // @element 21
  // 21 スケルトン（Skeleton screen）
  CELLS[20] = ui((w, h, t) => {
    const sk = seg(t, 1.05, 1.2) * (1 - seg(t, 3.0, 3.3));
    ring(w - 40, 26, 14, C.line2, 1.8); X.beginPath(); X.arc(w - 40, 26, 7, -Math.PI * .1, Math.PI * 1.4); X.strokeStyle = '#666'; X.lineWidth = 2.2; X.stroke();
    bar(24, 20, 160, C.line2, 12);
    for (let k = 0; k < 2; k++) {
      const y = 56 + k * 66;
      X.save(); X.globalAlpha = 1 - sk; mountains(24, y, 96, 56, k); bar(136, y + 6, 200, C.ink, 11); bar(136, y + 26, 340); bar(136, y + 42, 260); X.restore();
      if (sk > 0) {
        X.save(); X.globalAlpha = sk; const g = '#e9e7e5';
        fillRR(24, y, 96, 56, 8, g); fillRR(136, y + 4, 200, 14, 7, g); fillRR(136, y + 26, 340, 10, 5, g); fillRR(136, y + 42, 260, 10, 5, g);
        // 光が横に流れる
        const sx = -200 + ((t - 1.1) % 0.9) / 0.9 * (w + 400);
        X.globalCompositeOperation = 'source-atop';
        const gr = X.createLinearGradient(sx - 80, 0, sx + 80, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        X.fillStyle = gr; X.fillRect(0, y - 2, w, 64);
        X.restore();
      }
    }
    pointer([[.3, w + 30, h + 30], [.95, w - 38, 30], [1.4, w - 38, 30], [2.1, w + 30, h + 30]], [1.0], t);
  });

  // @element 22
  // 22 スピナー（Spinner）
  CELLS[21] = ui((w, h, t) => {
    const load = seg(t, 1.05, 1.2) * (1 - seg(t, 2.95, 3.05));
    const done = seg(t, 2.95, 3.15) * (1 - seg(t, 3.75, 4.0));
    pageLines(24, 18, 494); strokeRR(24, 90, 494, 34, 7, C.line2, 1.5);
    fillRR(w / 2 - 60, 140, 120, 40, 8, C.blue); text('送信', w / 2, 160, 16, '#fff', 600, 'center');
    const ov = Math.max(load, done);
    if (ov > 0) {
      X.fillStyle = `rgba(255,255,255,${.78 * ov})`; X.fillRect(0, 0, w, h);
      if (load > 0) { X.save(); X.globalAlpha = load; ring(w / 2, 92, 26, '#e3e8f5', 6); X.beginPath(); const a0 = t * Math.PI * 2 * 1.3; X.arc(w / 2, 92, 26, a0, a0 + Math.PI * 1.35); X.strokeStyle = C.blue; X.lineWidth = 6; X.lineCap = 'round'; X.stroke(); X.restore(); }
      if (done > 0) { X.save(); X.globalAlpha = done; const s = .7 + .3 * eo(seg(t, 2.95, 3.2)); X.translate(w / 2, 92); X.scale(s, s); circle(0, 0, 28, C.blue); check(0, 0, 11, '#fff', 4); X.restore(); }
    }
    pointer([[.3, w + 30, h + 30], [.95, w / 2 + 6, 166], [1.5, w / 2 + 6, 166], [2.2, w + 30, h + 30]], [1.0], t);
  });

  // @element 23
  // 23 バッジ（Badge）
  CELLS[22] = ui((w, h, t) => {
    X.fillStyle = '#fff'; X.fillRect(0, 0, w, 54); X.fillStyle = C.line; X.fillRect(0, 54, w, 1.5);
    fillRR(24, 19, 76, 16, 4, C.mb);
    // ベル
    const bx = w - 60, by = 27; X.save(); X.translate(bx, by);
    X.beginPath(); X.moveTo(-12, 8); X.quadraticCurveTo(-11, -12, 0, -13); X.quadraticCurveTo(11, -12, 12, 8); X.lineTo(15, 11); X.lineTo(-15, 11); X.closePath();
    X.strokeStyle = '#333'; X.lineWidth = 2.4; X.lineJoin = 'round'; X.stroke(); X.beginPath(); X.arc(0, 14, 4, 0, Math.PI); X.stroke(); X.restore();
    const arr = [.7, 1.3, 1.9]; let n = 0; arr.forEach(c => { if (t >= c) n++; });
    const clear = eio(seg(t, 3.0, 3.25));
    if (n > 0 && clear < 1) {
      const last = arr.filter(c => t >= c).pop(), pop = 1 - seg(t, last, last + .3);
      const s = (n === 1 ? eo(seg(t, .7, .9)) : 1) * (1 + .3 * pop) * (1 - clear);
      // 届いた合図の波紋
      const k = seg(t, last, last + .5); if (k > 0 && k < 1) ring(bx + 12, by - 12, 12 + 16 * k, `rgba(31,90,232,${.5 * (1 - k)})`, 2.5);
      X.save(); X.translate(bx + 12, by - 12); X.scale(s, s); circle(0, 0, 12, C.blue); ring(0, 0, 12, '#fff', 2.5); text(String(n), 0, 1, 14, '#fff', 800, 'center', NUMF); X.restore();
    }
    bar(24, 76, 220, C.line2, 12); bar(24, 102, 494); bar(24, 120, 400); fillRR(24, 140, 494, 40, 8, C.block);
    pointer([[.3, w + 30, h + 30], [2.3, w + 30, h + 30], [2.95, bx + 2, by + 4], [3.4, bx + 2, by + 4], [4.1, w + 30, h + 30]], [3.0], t);
  });

  // @element 24
  // 24 エンプティステート（Empty state）
  CELLS[23] = ui((w, h, t) => {
    const r1 = eio(seg(t, 0.95, 1.25)), r2 = eio(seg(t, 1.65, 1.95));
    const back = eo(seg(t, 3.35, 3.7));
    const empty = seg(t, 1.95, 2.3) * (1 - seg(t, 3.25, 3.45));
    bar(24, 14, 130, C.line2, 11);
    const rows = [[r1, 0], [r2, 1]];
    rows.forEach(([g, i]) => {
      const gone = back > 0 ? 1 - back : g; if (gone >= 1) return;
      const y = 40 + i * 58 - (i === 1 ? 58 * (back > 0 ? 0 : r1) : 0);
      X.save(); X.globalAlpha = 1 - gone; X.translate(-60 * gone, 0);
      strokeRR(24, y, 494, 48, 8, C.line2, 1.5); ring(48, y + 24, 9, C.line2, 2); bar(70, y + 12, 200, C.line2, 10); bar(70, y + 28, 140, C.line, 7);
      // ゴミ箱
      X.strokeStyle = '#888'; X.lineWidth = 2; X.lineJoin = 'round'; X.strokeRect(476, y + 18, 16, 18); X.beginPath(); X.moveTo(472, y + 17); X.lineTo(496, y + 17); X.moveTo(480, y + 13); X.lineTo(488, y + 13); X.stroke();
      X.restore();
    });
    if (empty > 0) {
      X.save(); X.globalAlpha = empty; const cy = 70 + 8 * (1 - empty);
      X.strokeStyle = C.blue; X.lineWidth = 2.6; X.lineJoin = 'round';
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 18, cy - 22); X.lineTo(w / 2 + 18, cy - 22); X.lineTo(w / 2 + 26, cy - 4); X.lineTo(w / 2 + 26, cy + 16); X.lineTo(w / 2 - 26, cy + 16); X.closePath(); X.stroke();
      X.beginPath(); X.moveTo(w / 2 - 26, cy - 4); X.lineTo(w / 2 - 9, cy - 4); X.lineTo(w / 2 - 6, cy + 3); X.lineTo(w / 2 + 6, cy + 3); X.lineTo(w / 2 + 9, cy - 4); X.lineTo(w / 2 + 26, cy - 4); X.stroke();
      text('まだ何もありません', w / 2, cy + 40, 16, '#555', 600, 'center');
      fillRR(w / 2 - 56, cy + 62, 112, 34, 8, C.blue); text('追加する', w / 2, cy + 79, 15, '#fff', 600, 'center');
      X.restore();
    }
    pointer([[.3, w + 30, h + 30], [.9, 486, 67], [1.25, 486, 67], [1.6, 486, 67], [2.4, 486, 67], [3.2, w / 2 + 4, 156], [3.5, w / 2 + 4, 156], [4.2, w + 30, h + 30]], [0.95, 1.65, 3.3], t);
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});

/* Motion Prompt · pack "lp" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('lp', function () {
  // @kit
  // LP・Webサイトの演出の名前 24（各カード 539x208・4.8秒周期。各コマは時間 u の純関数）
  // カードの中にブラウザの窓を1つ描き、その中の簡略化したページで演出を見せる。
  // きっかけ（スクロールバー・カーソル・クリック）も一緒に描く。色は 地・文字・差し色（朱）＋写真用の青。
  const CW = 539, CH = 208;
  const CYC = 4.8;                                   // 各カードは4.8秒周期（ループの継ぎ目なし）
  const C = {
    desk: '#E7EAF0', win: '#FFFFFF', bar: '#F3F5F8', rule: '#E2E6ED', ink: '#1C2333', sub: '#7D879B',
    faint: '#DCE1EA', soft: '#F3F5F9', skel: '#E4E8EF', acc: '#FF5A2C', accL: '#FFE5DB', blue: '#3B64E8', blueL: '#E1E8FF'
  };
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif';
  const EN = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;   // easeInOut（3乗）
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;      // easeInOut（2乗）
  const eOut = x => 1 - Math.pow(1 - x, 3);                                      // easeOut（3乗）
  const eIn = x => x * x * x;
  const mod = (a, n) => ((a % n) + n) % n;
  // GSAP の elastic.out(1, 0.3) と同じ式
  const eEl = x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x - 0.075) * 2 * Math.PI / 0.3) + 1;
  function rr(k, x, y, w, h, r) { k.beginPath(); k.roundRect(x, y, w, h, r); }
  function txt(k, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    k.font = font; k.fillStyle = col; k.textAlign = align; k.textBaseline = base; k.letterSpacing = ls; k.fillText(s, x, y); k.letterSpacing = '0px';
  }
  // キーフレーム [[秒, 値], …] を easeInOut（3乗）でつなぐ。u は周期で折り返す
  function steps(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const [t0, a] = keys[i - 1], [t1, b] = keys[i]; return lerp(a, b, eIO((u - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  }
  // カーソルの通り道 [[秒, x, y], …]（easeInOut 3乗でつなぐ）
  function path(keys, u) {
    u = mod(u, CYC);
    if (u <= keys[0][0]) return [keys[0][1], keys[0][2]];
    for (let i = 1; i < keys.length; i++) if (u < keys[i][0]) { const a = keys[i - 1], b = keys[i], f = eIO((u - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], f), lerp(a[2], b[2], f)]; }
    const l = keys[keys.length - 1]; return [l[1], l[2]];
  }
  // on(t) が最後に切り替わった時刻から dur 秒の遷移（CSS の transition と同じ考え方）。過去へさかのぼって調べる
  function trans(on, u, dur, ease = eOut) {
    const s = on(u);
    for (let i = 0, t = u; i < 600; i++, t -= 1 / 120) if (on(t - 1 / 120) !== s) { const q = ease(P(u, t, t + dur)); return s ? q : 1 - q; }
    return s ? 1 : 0;
  }
  // ブラウザの窓。中のページは V（511x168）の座標で描く
  const WIN = { x: 14, y: 8, w: 511, h: 192, r: 10, bar: 24 };
  const VW = WIN.w, VH = WIN.h - WIN.bar;
  function frame(k, url = 'example.com') {
    k.fillStyle = C.desk; k.fillRect(0, 0, CW, CH);
    k.save(); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 16; k.shadowOffsetY = 4;
    k.fillStyle = C.win; rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.fill(); k.restore();
    k.save(); rr(k, WIN.x, WIN.y, WIN.w, WIN.h, WIN.r); k.clip();
    k.fillStyle = C.bar; k.fillRect(WIN.x, WIN.y, WIN.w, WIN.bar); k.fillStyle = C.rule; k.fillRect(WIN.x, WIN.y + WIN.bar - 1, WIN.w, 1); k.restore();
    for (let i = 0; i < 3; i++) { k.fillStyle = '#CDD3DD'; k.beginPath(); k.arc(WIN.x + 15 + i * 12, WIN.y + 12, 3.6, 0, 7); k.fill(); }
    k.fillStyle = '#E6E9EF'; rr(k, WIN.x + WIN.w / 2 - 110, WIN.y + 5, 220, 14, 7); k.fill();
    txt(k, url, WIN.x + WIN.w / 2, WIN.y + 12.5, `500 9.5px ${EN}`, C.sub, 'center', 'middle');
  }
  function view(k, fn) {
    k.save(); rr(k, WIN.x, WIN.y + WIN.bar, VW, VH, [0, 0, WIN.r, WIN.r]); k.clip(); k.translate(WIN.x, WIN.y + WIN.bar);
    k.fillStyle = '#fff'; k.fillRect(0, 0, VW, VH); fn(); k.restore();
  }
  // スクロールバー（つまみだけ。pos 0〜1、ratio＝見えている割合）
  function sbar(k, pos, ratio = 0.42) { const th = (VH - 8) * ratio; k.fillStyle = 'rgba(28,35,51,.38)'; rr(k, VW - 9, 4 + (VH - 8 - th) * clamp(pos), 5, th, 2.5); k.fill(); }
  // 文字の代わりの棒（n 行。最後の行は短い）
  function bars(k, x, y, w, n, col = C.faint, hh = 6, gap = 11, last = 0.62) {
    k.fillStyle = col; for (let i = 0; i < n; i++) { rr(k, x, y + i * gap, i === n - 1 && n > 1 ? w * last : w, hh, hh / 2); k.fill(); }
  }
  // 写真の代わりの絵（空・太陽・山）。v で色ちがい、z で中身だけ拡大（枠は固定）
  const PICS = [
    { sky: ['#A9C0FF', '#E4EBFF'], sun: '#FF5A2C', sx: .74, sy: .32, m1: '#7D9AF4', m2: '#4B6BDB' },
    { sky: ['#FFC7B2', '#FFEDE5'], sun: '#FFFFFF', sx: .28, sy: .34, m1: '#F4977A', m2: '#DD5F3B' },
    { sky: ['#3A4884', '#7484CC'], sun: '#FFE5DB', sx: .6, sy: .3, m1: '#2B3770', m2: '#1C2349' }
  ];
  const M1 = [[0, .62], [.22, .4], [.42, .56], [.66, .3], [.86, .5], [1, .42]], M2 = [[0, .8], [.28, .6], [.5, .76], [.76, .58], [1, .74]];
  function mount(k, w, h, pts, col, flip) { k.fillStyle = col; k.beginPath(); k.moveTo(flip ? w : 0, h + 1); pts.forEach(([a, b]) => k.lineTo((flip ? 1 - a : a) * w, b * h)); k.lineTo(flip ? 0 : w, h + 1); k.closePath(); k.fill(); }
  function pic(k, x, y, w, h, v = 0, r = 6, z = 1) {
    const p = PICS[v % PICS.length];
    k.save(); rr(k, x, y, w, h, r); k.clip();
    k.translate(x + w / 2, y + h / 2); k.scale(z, z); k.translate(-w / 2, -h / 2);
    const g = k.createLinearGradient(0, 0, 0, h); g.addColorStop(0, p.sky[0]); g.addColorStop(1, p.sky[1]); k.fillStyle = g; k.fillRect(-1, -1, w + 2, h + 2);
    k.fillStyle = p.sun; k.beginPath(); k.arc(w * p.sx, h * p.sy, Math.min(w, h) * 0.13, 0, 7); k.fill();
    mount(k, w, h, M1, p.m1, v % 2); mount(k, w, h, M2, p.m2, (v + 1) % 2);
    k.restore();
  }
  function btn(k, x, y, w, h, label, col = C.acc, tcol = '#fff', fs = 12) {
    k.fillStyle = col; rr(k, x, y, w, h, h / 2); k.fill(); txt(k, label, x + w / 2, y + h / 2 + 0.5, `700 ${fs}px ${JP}`, tcol, 'center', 'middle');
  }
  function logo(k, x, y, col = C.ink) { k.fillStyle = C.acc; rr(k, x, y - 7, 14, 14, 4); k.fill(); txt(k, 'SAMPLE', x + 20, y + 0.5, `800 12px ${EN}`, col, 'left', 'middle', '1px'); }
  // ページのヘッダー（高さ34）
  const NAVX = [300, 346, 392];
  function header(k, y, active = -1) {
    k.fillStyle = '#fff'; k.fillRect(0, y, VW, 34); k.fillStyle = C.rule; k.fillRect(0, y + 33, VW, 1);
    logo(k, 18, y + 17);
    ['特長', '料金', 'FAQ'].forEach((s, i) => txt(k, s, NAVX[i], y + 17.5, `600 12px ${JP}`, active === i ? C.acc : C.ink, 'left', 'middle'));
    btn(k, 428, y + 7, 70, 20, '無料で試す', C.acc, '#fff', 10.5);
  }
  // マウスのカーソル（矢印）。press で少し縮む
  function cursor(k, x, y, press = 0) {
    const s = 1.2 * (1 - 0.12 * press);
    k.save(); k.translate(x, y); k.scale(s, s); k.beginPath();
    [[0, 0], [0, 16.5], [4.2, 12.6], [7, 19], [9.8, 17.8], [7.1, 11.6], [12.6, 11.6]].forEach(([a, b], i) => i ? k.lineTo(a, b) : k.moveTo(a, b));
    k.closePath(); k.lineJoin = 'round'; k.lineWidth = 1.6; k.strokeStyle = '#fff'; k.fillStyle = C.ink; k.fill(); k.stroke(); k.restore();
  }
  // クリックした所に出る小さな輪（0.35秒）と、押している間の縮み
  function click(k, x, y, u, times) {
    let press = 0;
    for (const tc of times) {
      const d = mod(u - tc + 0.1, CYC) - 0.1;
      if (d > -0.1 && d < 0.12) press = Math.max(press, 1 - Math.abs(d - 0.01) / 0.11);
      if (d >= 0 && d < 0.35) { const q = d / 0.35; k.strokeStyle = `rgba(28,35,51,${0.45 * (1 - q)})`; k.lineWidth = 2; k.beginPath(); k.arc(x, y, 5 + 13 * eOut(q), 0, 7); k.stroke(); }
    }
    cursor(k, x, y, clamp(press));
  }
  // 回る読み込み表示（0.8秒で1回転）
  function spinner(k, x, y, r, u, col = C.acc) {
    const a = u / 0.8 * Math.PI * 2;
    k.lineCap = 'round'; k.lineWidth = r * 0.28; k.strokeStyle = C.faint; k.beginPath(); k.arc(x, y, r, 0, 7); k.stroke();
    k.strokeStyle = col; k.beginPath(); k.arc(x, y, r, a, a + Math.PI * 0.6); k.stroke(); k.lineCap = 'butt';
  }
  // ページ上の top にある要素が、判定線 line より上に入った時刻（画面の下へ出たらリセット）。過去 CYC 秒をさかのぼる
  function enteredAt(sy, top, line, u) {
    const dt = 1 / 120, y = t => top - sy(t);
    if (y(u) >= VH) return null;
    for (let t = u; t > u - CYC; t -= dt) {
      const a = y(t), b = y(t - dt);
      if (a >= VH) return null;
      if (a < line && b >= line) return t - dt + dt * (b - line) / (b - a);
    }
    return y(u) < line ? -1e9 : null;
  }
  const CELLS = [];

  // @element 01
  // 01 パララックススクロール（スクロールすると、空・山・見出しが違う速さで動く）
  CELLS[0] = (k, w, h, u) => {
    frame(k);
    const s = steps([[0.3, 0], [1.9, 1], [2.9, 1], [4.3, 0]], u), y = s * 120;
    view(k, () => {
      const g = k.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#9DB6FB'); g.addColorStop(1, '#E6ECFF');
      k.save(); k.translate(0, -y * 0.15);                         // 空と太陽: 0.15倍
      k.fillStyle = g; k.fillRect(0, 0, VW, 260); k.fillStyle = C.acc; k.beginPath(); k.arc(392, 54, 25, 0, 7); k.fill(); k.restore();
      k.save(); k.translate(0, -y * 0.4); mount(k, VW, 190, M1, '#7D9AF4', 0); k.restore();   // 遠い山: 0.4倍
      k.save(); k.translate(0, -y * 0.7); mount(k, VW, 205, M2, '#4B6BDB', 1); k.restore();   // 近い山: 0.7倍
      k.save(); k.translate(0, -y);                                // 見出し・ボタン・次のセクション: 1倍
      txt(k, '山へ、行こう。', 34, 64, `800 28px ${JP}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 34, 78, 160, 2, 'rgba(255,255,255,.85)');
      btn(k, 34, 106, 92, 26, '予約する');
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200);
      txt(k, '人気のコース', 34, VH + 34, `800 16px ${JP}`, C.ink);
      for (let i = 0; i < 3; i++) { pic(k, 34 + i * 152, VH + 50, 136, 58, i, 6); bars(k, 34 + i * 152, VH + 116, 110, 1, C.faint); }
      k.restore();
      sbar(k, s * 0.35, 0.4);
    });
  };

  // @element 02
  // 02 スクロールでフェードイン（画面に入った要素が、下から浮かび上がって現れる）
  CELLS[1] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 95], [1.5, 95], [2.1, 200], [3.2, 200], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.85, DUR = 0.7, RISE = 28;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '暮らしを、軽く。', 34, 52, `800 24px ${JP}`, C.ink); bars(k, 34, 68, 190, 3); btn(k, 34, 108, 96, 26, '詳しく見る');
      pic(k, 286, 18, 196, 110, 0, 8);
      const items = [
        [172, () => txt(k, '選ばれる3つの理由', VW / 2, 172 + 20, `800 18px ${JP}`, C.ink, 'center')],
        [206, () => { for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = C.soft; rr(k, x, 206, 136, 106, 8); k.fill(); pic(k, x + 8, 214, 120, 56, i, 5); bars(k, x + 10, 280, 112, 2, '#CBD2DE'); } }],
        [334, () => bars(k, 110, 334, 290, 3, C.faint, 7, 13)]
      ];
      for (const [top, draw] of items) {
        const t0 = enteredAt(SY, top, LINE, u); if (t0 === null) continue;
        const q = eOut(P(u, t0, t0 + DUR));
        k.save(); k.globalAlpha = q; k.translate(0, RISE * (1 - q)); draw(); k.restore();
      }
      k.restore();
      sbar(k, y / 200, 0.5);
    });
  };

  // @element 03
  // 03 追従ヘッダー（スクロールすると、ヘッダーが画面の上で止まってついてくる）
  CELLS[2] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.4, 0], [1.3, 110], [1.9, 110], [2.8, 250], [3.4, 250], [4.4, 0]], u);
    const STRIP = 22;
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 70, 214, 112, 0, 8);
      txt(k, '新しい毎日を、', 262, 104, `800 22px ${JP}`, C.ink); bars(k, 262, 120, 210, 3); btn(k, 262, 160, 100, 26, '詳しく見る');
      k.fillStyle = C.soft; k.fillRect(0, 212, VW, 240);
      txt(k, '特長', VW / 2, 246, `800 18px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 34 + i * 152; k.fillStyle = '#fff'; rr(k, x, 262, 136, 120, 8); k.fill(); pic(k, x + 8, 270, 120, 58, i, 5); bars(k, x + 10, 340, 110, 3, C.faint, 6, 11); }
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, STRIP);
      txt(k, '期間限定キャンペーン実施中', VW / 2, STRIP / 2 + 0.5, `600 11px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const hy = Math.max(STRIP - y, 0), sh = clamp((y - STRIP) / 24);
      if (sh > 0) { const g = k.createLinearGradient(0, hy + 34, 0, hy + 46); g.addColorStop(0, `rgba(28,35,51,${0.16 * sh})`); g.addColorStop(1, 'rgba(28,35,51,0)'); k.fillStyle = g; k.fillRect(0, hy + 34, VW, 12); }
      header(k, hy);
      sbar(k, y / 250, 0.42);
    });
  };

  // @element 04
  // 04 ピン留め（セクションが画面に止まったまま、中身だけがスクロールで進む）
  CELLS[3] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 500], [3.5, 500], [4.5, 0]], u);
    const PIN0 = 110, PD = 300;
    const top = y < PIN0 ? PIN0 - y : y < PIN0 + PD ? 0 : PIN0 + PD - y, p = clamp((y - PIN0) / PD);
    // 中身は 1/3・2/3 の所で次のステップへ（前後 ±0.07 の範囲で easeInOut）
    const f = eIO(P(p, 1 / 3 - 0.07, 1 / 3 + 0.07)) + eIO(P(p, 2 / 3 - 0.07, 2 / 3 + 0.07));
    view(k, () => {
      txt(k, '3ステップで完成', 34, 56 - y, `800 22px ${JP}`, C.ink); bars(k, 34, 72 - y, 240, 2);
      k.save(); k.translate(0, top);
      k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
      // 左: STEP の番号（スクロール量に合わせて回る）
      txt(k, 'STEP', 34, 40, `700 12px ${EN}`, 'rgba(255,255,255,.6)', 'left', 'alphabetic', '2px');
      k.save(); k.beginPath(); k.rect(30, 46, 120, 52); k.clip();
      for (let i = 0; i < 3; i++) txt(k, '0' + (i + 1), 32, 90 + (i - f) * 52, `800 46px ${EN}`, '#fff');
      k.restore();
      bars(k, 34, 110, 150, 3, 'rgba(255,255,255,.28)');
      // 進み具合の線
      k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, 232, 22, 4, 124, 2); k.fill();
      k.fillStyle = C.acc; rr(k, 232, 22, 4, 124 * p, 2); k.fill();
      // 右: 写真が順に入れ替わる
      k.save(); rr(k, 256, 22, 226, 124, 8); k.clip();
      for (let i = 0; i < 3; i++) pic(k, 256, 22 + (i - f) * 124, 226, 124, i, 0);
      k.restore();
      k.fillStyle = '#fff'; k.fillRect(0, VH, VW, 200); bars(k, 34, VH + 30, 300, 3);
      k.restore();
      sbar(k, y / 500, 0.3);
    });
  };

  // @element 05
  // 05 横スクロール（縦にスクロールすると、カードの列が横へ流れる）
  CELLS[4] = (k, w, h, u) => {
    frame(k);
    const y = steps([[0.3, 0], [3.0, 420], [3.5, 420], [4.5, 0]], u);
    const PIN0 = 40, PD = 380, N = 4, PWD = 200, GAP = 20;
    const top = y < PIN0 ? PIN0 - y : 0, p = clamp((y - PIN0) / PD);
    const travel = 34 * 2 + N * PWD + (N - 1) * GAP - VW;
    view(k, () => {
      txt(k, 'WORKS', 34, 30 - y, `800 20px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
      k.save(); k.translate(0, top);
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH + 40);
      for (let i = 0; i < N; i++) {
        const x = 34 + i * (PWD + GAP) - p * travel;
        pic(k, x, 18, PWD, 112, i % 3, 8);
        txt(k, '0' + (i + 1), x + 14, 118, `800 22px ${EN}`, '#fff');
        bars(k, x, 140, 120, 1, '#CBD2DE');
      }
      k.restore();
      sbar(k, y / 420, 0.36);
    });
  };

  // @element 06
  // 06 スクロールスナップ（少しスクロールすると、次のセクションの頭までピタッと送られる）
  CELLS[5] = (k, w, h, u) => {
    frame(k);
    const T = CYC / 2, lu = mod(u, T), dir = u < T ? 1 : -1, from = u < T ? 0 : VH, DRIFT = 34;
    const y = from + dir * (DRIFT * eOut(P(lu, 0.45, 0.85)) + (VH - DRIFT) * eOut(P(lu, 0.9, 1.5)));
    view(k, () => {
      k.save(); k.translate(0, -y);
      for (let i = 0; i < 2; i++) {
        const y0 = i * VH, dark = i === 1;
        k.fillStyle = dark ? C.ink : C.blueL; k.fillRect(0, y0, VW, VH);
        txt(k, '0' + (i + 1), 34, y0 + 70, `800 46px ${EN}`, C.acc);
        txt(k, dark ? '使ってみる' : '知ってもらう', 34, y0 + 102, `800 18px ${JP}`, dark ? '#fff' : C.ink);
        bars(k, 34, y0 + 118, 170, 2, dark ? 'rgba(255,255,255,.3)' : '#C3CDEA');
        pic(k, 262, y0 + 24, 220, 120, dark ? 2 : 0, 8);
      }
      k.restore();
      sbar(k, y / VH, 0.5);
    });
  };

  // @element 07
  // 07 スクロールプログレスバー（読み進めた分だけ、画面上の線が伸びる）
  CELLS[6] = (k, w, h, u) => {
    frame(k);
    const MAX = 430;
    const y = steps([[0.3, 0], [0.75, 110], [1.15, 110], [1.6, 220], [2.0, 220], [2.45, 330], [2.85, 330], [3.3, MAX], [3.75, MAX], [4.55, 0]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'はじめてのWebデザイン', 70, 44, `800 20px ${JP}`, C.ink); bars(k, 70, 56, 120, 1, C.faint, 5);
      pic(k, 70, 74, 371, 112, 0, 8);
      for (let b = 0; b < 4; b++) { const y0 = 204 + b * 82; k.fillStyle = C.ink; rr(k, 70, y0, 140, 9, 4.5); k.fill(); bars(k, 70, y0 + 22, 371, 4, C.faint, 6, 12); }
      k.restore();
      k.fillStyle = C.faint; k.fillRect(0, 0, VW, 6);
      k.fillStyle = C.acc; k.fillRect(0, 0, VW * (y / MAX), 6);
      sbar(k, y / MAX, 0.3);
    });
  };

  // @element 08
  // 08 マーカーアニメーション（大事な言葉が画面に入ると、蛍光ペンの線が左から引かれる）
  CELLS[7] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.0, 90], [1.6, 90], [2.2, 180], [3.3, 180], [4.4, 0]], t), y = SY(u);
    const LINE = VH * 0.8, DUR = 0.8, MARK = '#FFE36B', F = `800 20px ${JP}`;
    const rows = [[190, ['毎日のごはんが', 'たった10分で', '作れる。']], [290, ['はじめてでも', '失敗しないレシピ', 'だけ。']]];
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, '忙しい人のための', 70, 50, `700 14px ${JP}`, C.sub); txt(k, '台所の新しい相棒', 70, 80, `800 24px ${JP}`, C.ink);
      bars(k, 70, 96, 330, 4, C.faint, 6, 12, 0.8);
      for (const [base, parts] of rows) {
        k.font = F; const ws = parts.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0)) / 2;
        const t0 = enteredAt(SY, base - 20, LINE, u), q = t0 === null ? 0 : eOut(P(u, t0, t0 + DUR));
        if (q > 0) { k.fillStyle = MARK; k.fillRect(x + ws[0], base - 8, ws[1] * q, 11); }
        parts.forEach((s, i) => { txt(k, s, x, base, F, i === 1 ? C.ink : '#4A5368'); x += ws[i]; });
        bars(k, 110, base + 22, 291, 2, C.faint, 6, 12, 0.7);
      }
      k.restore();
      sbar(k, y / 180, 0.5);
    });
  };

  // @element 09
  // 09 ホバーで浮き上がる（カーソルが乗ったカードが、影をつけて少し持ち上がる）
  CELLS[8] = (k, w, h, u) => {
    frame(k);
    const CX = [26, 192, 358], CY = 18, CWD = 146, CHT = 128, LIFT = 10;
    const cur = t => path([[0, 70, 160], [0.45, 96, 78], [1.4, 110, 86], [1.62, 262, 80], [2.5, 276, 88], [2.72, 428, 80], [3.6, 440, 88], [4.0, 470, 160], [4.8, 70, 160]], t);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      for (let i = 0; i < 3; i++) {
        const inside = t => { const [x, y] = cur(t); return x > CX[i] && x < CX[i] + CWD && y > CY && y < CY + CHT; };
        const q = trans(inside, u, 0.3), x = CX[i], y = CY - LIFT * q;
        k.save(); k.shadowColor = `rgba(28,35,51,${0.08 + 0.14 * q})`; k.shadowBlur = 6 + 16 * q; k.shadowOffsetY = 2 + 10 * q;
        k.fillStyle = '#fff'; rr(k, x, y, CWD, CHT, 10); k.fill(); k.restore();
        pic(k, x + 8, y + 8, CWD - 16, 66, i, 6);
        txt(k, ['山の宿', '海の宿', '星の宿'][i], x + 12, y + 96, `800 13px ${JP}`, C.ink); bars(k, x + 12, y + 106, 100, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 10
  // 10 ホバーで画像ズーム（枠はそのままで、中の写真だけがゆっくり拡大する）
  CELLS[9] = (k, w, h, u) => {
    frame(k);
    const FX = [22, 267], FY = 16, FW = 222, FH = 118, ZOOM = 0.15;
    const cur = t => path([[0, 60, 160], [0.5, 120, 70], [1.8, 140, 84], [2.2, 370, 70], [3.4, 390, 84], [3.9, 470, 160], [4.8, 60, 160]], t);
    view(k, () => {
      for (let i = 0; i < 2; i++) {
        const inside = t => { const [x, y] = cur(t); return x > FX[i] && x < FX[i] + FW && y > FY && y < FY + FH; };
        const q = trans(inside, u, 0.5);
        pic(k, FX[i], FY, FW, FH, i, 8, 1 + ZOOM * q);
        txt(k, ['夏の山小屋', '海辺のカフェ'][i], FX[i], FY + FH + 20, `800 13px ${JP}`, C.ink); bars(k, FX[i], FY + FH + 28, 150, 1);
      }
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 11
  // 11 マウスストーカー（カーソルのあとを、丸が少し遅れて追いかける）
  CELLS[10] = (k, w, h, u) => {
    frame(k);
    const cur = t => [255 + 175 * Math.sin(2 * Math.PI * t / CYC), 86 + 46 * Math.sin(4 * Math.PI * t / CYC)];
    // 毎フレーム（60fps）残りの距離の 12% ずつ近づく
    let t = u - 2, [fx, fy] = cur(t);
    for (let i = 0; i < 120; i++) { t += 1 / 60; const [tx, ty] = cur(t); fx += (tx - fx) * 0.12; fy += (ty - fy) * 0.12; }
    view(k, () => {
      txt(k, 'CREATIVE STUDIO', VW / 2, 74, `800 34px ${EN}`, C.ink, 'center', 'alphabetic', '3px');
      bars(k, VW / 2 - 120, 96, 240, 2, C.faint, 6, 12, 0.7);
      btn(k, VW / 2 - 50, 128, 100, 24, '作品を見る', C.ink);
      k.fillStyle = C.acc; k.globalAlpha = 0.88; k.beginPath(); k.arc(fx, fy, 17, 0, 7); k.fill(); k.globalAlpha = 1;
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 12
  // 12 マグネティックボタン（カーソルが近づくと、ボタンが吸い寄せられ、離れるとぷるんと戻る）
  CELLS[11] = (k, w, h, u) => {
    frame(k);
    const BX = VW / 2, BY = 84, R = 110, PULL = 0.35;
    const cur = t => path([[0, -20, 130], [0.9, 170, 104], [1.5, 300, 62], [2.1, 318, 110], [2.7, 205, 66], [3.1, 250, 92], [3.6, 545, 120], [4.8, 545, 120]], t);
    const inside = t => { const [x, y] = cur(t); return Math.hypot(x - BX, y - BY) < R; };
    // 範囲に入った時刻から 60fps で目標（カーソルとの差 × 0.35）へ毎フレーム 18% ずつ近づく
    const pull = t => {
      let t0 = t; for (let i = 0; i < 600 && inside(t0 - 1 / 120); i++) t0 -= 1 / 120;
      let ox = 0, oy = 0; for (let s = t0; s <= t; s += 1 / 60) { const [x, y] = cur(s); ox += ((x - BX) * PULL - ox) * 0.18; oy += ((y - BY) * PULL - oy) * 0.18; }
      return [ox, oy];
    };
    let ox = 0, oy = 0;
    if (inside(u)) [ox, oy] = pull(u);
    else {
      let t1 = u; for (let i = 0; i < 600 && !inside(t1); i++) t1 -= 1 / 120;
      if (inside(t1)) { const [lx, ly] = pull(t1), e = 1 - eEl(P(u, t1, t1 + 1.1)); ox = lx * e; oy = ly * e; }
    }
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(BX + ox, BY + oy);
      k.shadowColor = 'rgba(255,90,44,.35)'; k.shadowBlur = 16; k.shadowOffsetY = 6;
      k.fillStyle = C.acc; rr(k, -84, -26, 168, 52, 26); k.fill(); k.shadowColor = 'transparent';
      txt(k, 'お問い合わせ', 0, 1, `800 16px ${JP}`, '#fff', 'center', 'middle');
      k.restore();
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 13
  // 13 リップルエフェクト（押した場所から、ボタンの中に波紋が広がる）
  CELLS[12] = (k, w, h, u) => {
    frame(k);
    const B = { x: 115, y: 78, w: 280, h: 56 }, TAPS = [[0.7, 165, 110], [2.9, 345, 100]], DUR = 0.6;
    const [cx, cy] = path([[0, 430, 160], [0.55, 165, 110], [1.6, 165, 110], [2.7, 345, 100], [3.6, 345, 100], [4.4, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, 'お申し込み', VW / 2, 38, `800 18px ${JP}`, C.ink, 'center'); bars(k, VW / 2 - 110, 50, 220, 1, C.faint, 6, 11, 1);
      k.save(); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 8; k.shadowOffsetY = 3; k.fillStyle = C.acc; rr(k, B.x, B.y, B.w, B.h, 10); k.fill(); k.restore();
      k.save(); rr(k, B.x, B.y, B.w, B.h, 10); k.clip();
      for (const [tc, px, py] of TAPS) {
        const d = u - tc; if (d < 0 || d > 0.8) continue;
        const Rm = Math.max(Math.hypot(px - B.x, py - B.y), Math.hypot(px - B.x - B.w, py - B.y), Math.hypot(px - B.x, py - B.y - B.h), Math.hypot(px - B.x - B.w, py - B.y - B.h));
        k.fillStyle = `rgba(255,255,255,${0.4 * (1 - P(d, 0.3, 0.8))})`; k.beginPath(); k.arc(px, py, Rm * eOut(P(d, 0, DUR)), 0, 7); k.fill();
      }
      k.restore();
      txt(k, '送信する', VW / 2, B.y + B.h / 2 + 1, `800 17px ${JP}`, '#fff', 'center', 'middle');
      click(k, cx, cy, u, TAPS.map(a => a[0]));
    });
  };

  // @element 14
  // 14 下線アニメーション（リンクにカーソルを乗せると下線が左から伸び、離れると右へ抜ける）
  CELLS[13] = (k, w, h, u) => {
    frame(k);
    const LINKS = ['サービス', '実績', '会社概要'], F = `800 20px ${JP}`, GAP = 56, LY = 84, DUR = 0.3;
    const cur = t => path([[0, 120, 150], [0.45, 170, 80], [1.3, 186, 84], [1.55, 268, 80], [2.4, 282, 84], [2.65, 372, 80], [3.5, 390, 84], [3.95, 430, 150], [4.8, 120, 150]], t);
    view(k, () => {
      logo(k, 22, 28); bars(k, 90, 132, 331, 2, C.faint, 6, 12, 0.6);
      k.font = F; const ws = LINKS.map(s => k.measureText(s).width); let x = (VW - ws.reduce((a, b) => a + b, 0) - GAP * (LINKS.length - 1)) / 2;
      LINKS.forEach((s, i) => {
        const x0 = x, x1 = x + ws[i], inside = t => { const [a, b] = cur(t); return a > x0 - 6 && a < x1 + 6 && b > LY - 22 && b < LY + 14; };
        txt(k, s, x0, LY, F, C.ink);
        // 最後に乗った・離れた時刻から 0.3秒（乗る: 左端から伸びる / 離れる: 左端から縮んで右へ抜ける）
        const on = inside(u); let tc = null; for (let j = 0, t = u; j < 600; j++, t -= 1 / 120) if (inside(t - 1 / 120) !== on) { tc = t; break; }
        if (tc !== null) {
          const q = eOut(P(u, tc, tc + DUR)), a = on ? 0 : q, b = on ? q : 1;
          if (b > a) { k.fillStyle = C.acc; k.fillRect(x0 + ws[i] * a, LY + 8, ws[i] * (b - a), 3); }
        }
        x += ws[i] + GAP;
      });
      const [cx, cy] = cur(u); cursor(k, cx, cy);
    });
  };

  // @element 15
  // 15 ビフォーアフタースライダー（真ん中の線をドラッグすると、加工前と加工後の写真の境目が動く）
  CELLS[14] = (k, w, h, u) => {
    frame(k);
    const F = { x: 76, y: 14, w: 359, h: 140 };
    const pos = steps([[0.75, 0.5], [1.55, 0.2], [2.65, 0.82], [3.55, 0.5]], u), hx = F.x + F.w * pos, hy = F.y + F.h / 2;
    const drag = u > 0.68 && u < 3.62;
    const [cx, cy] = u < 0.7 ? path([[0, 430, 160], [0.62, hx, hy + 4]], u) : drag ? [hx, hy + 4] : path([[3.6, hx, hy + 4], [4.3, 430, 160], [4.8, 430, 160]], u);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 後（色あり）
      k.save(); k.beginPath(); k.rect(F.x, F.y, hx - F.x, F.h); k.clip();
      pic(k, F.x, F.y, F.w, F.h, 1, 10);                      // 前（色を抜いて暗く）
      k.globalCompositeOperation = 'saturation'; k.fillStyle = '#888'; k.fillRect(F.x, F.y, F.w, F.h);
      k.globalCompositeOperation = 'source-over'; k.fillStyle = 'rgba(28,35,51,.18)'; k.fillRect(F.x, F.y, F.w, F.h);
      k.restore();
      const tag = (s, x, al) => { k.font = `800 11px ${EN}`; const tw = k.measureText(s).width + 16; const bx = al ? x - tw : x; k.fillStyle = 'rgba(28,35,51,.55)'; rr(k, bx, F.y + 10, tw, 20, 10); k.fill(); txt(k, s, bx + tw / 2, F.y + 20.5, `800 11px ${EN}`, '#fff', 'center', 'middle', '1px'); };
      k.save(); rr(k, F.x, F.y, F.w, F.h, 10); k.clip(); tag('BEFORE', F.x + 10, false); tag('AFTER', F.x + F.w - 10, true); k.restore();
      k.fillStyle = '#fff'; k.fillRect(hx - 1.5, F.y, 3, F.h);
      k.save(); k.shadowColor = 'rgba(28,35,51,.3)'; k.shadowBlur = 8; k.shadowOffsetY = 2; k.fillStyle = '#fff'; k.beginPath(); k.arc(hx, hy, 17, 0, 7); k.fill(); k.restore();
      k.fillStyle = C.ink; k.beginPath(); k.moveTo(hx - 4, hy - 6); k.lineTo(hx - 11, hy); k.lineTo(hx - 4, hy + 6); k.closePath(); k.moveTo(hx + 4, hy - 6); k.lineTo(hx + 11, hy); k.lineTo(hx + 4, hy + 6); k.closePath(); k.fill();
      cursor(k, cx, cy, drag ? 1 : 0);
    });
  };

  // @element 16
  // 16 離脱防止ポップアップ（カーソルがタブや閉じるボタンの方へ出ていくと、引き止める小窓が出る）
  CELLS[15] = (k, w, h, u) => {
    frame(k);
    const OX = WIN.x, OY = WIN.y + WIN.bar;               // カーソルは窓の外（タブ・アドレスバー）まで出るので、カードの座標で描く
    const [cx, cy] = path([[0, 440, 150], [0.7, 300, 120], [1.25, 360, -18], [1.9, 372, -20], [2.6, 366, 38], [3.3, 366, 38], [4.4, 440, 150], [4.8, 440, 150]], u);
    const CLOSE = 2.9;
    let TRIG = 0.7; while (TRIG < 1.3 && path([[0.7, 300, 120], [1.25, 360, -18]], TRIG)[1] >= 0) TRIG += 1 / 240;   // 表示域の上端（y = 0）を越えた時刻（約1.07秒）
    const m = eOut(P(u, TRIG + 0.05, TRIG + 0.45)) * (1 - P(u, CLOSE + 0.03, CLOSE + 0.25));
    const D = { x: 125.5, y: 18, w: 260, h: 132 };
    view(k, () => {
      header(k, 0);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, 'はじめての方へ', 264, 82, `800 19px ${JP}`, C.ink); bars(k, 264, 96, 210, 3); btn(k, 264, 132, 100, 24, '申し込む');
      if (m > 0) {
        k.fillStyle = `rgba(28,35,51,${0.5 * m})`; k.fillRect(0, 0, VW, VH);
        k.save(); k.globalAlpha = m; k.translate(D.x + D.w / 2, D.y + D.h / 2); const s = 0.9 + 0.1 * m; k.scale(s, s); k.translate(-D.w / 2, -D.h / 2);
        k.fillStyle = '#fff'; rr(k, 0, 0, D.w, D.h, 12); k.fill();
        txt(k, 'ちょっと待って！', D.w / 2, 34, `800 17px ${JP}`, C.ink, 'center');
        txt(k, '今なら初回 10%OFF', D.w / 2, 60, `800 15px ${JP}`, C.acc, 'center');
        btn(k, D.w / 2 - 75, 80, 150, 30, 'クーポンを受け取る', C.acc, '#fff', 12);
        k.strokeStyle = C.sub; k.lineWidth = 2; k.lineCap = 'round'; k.beginPath(); k.moveTo(D.w - 26, 14); k.lineTo(D.w - 14, 26); k.moveTo(D.w - 14, 14); k.lineTo(D.w - 26, 26); k.stroke();
        k.restore();
      }
    });
    // カーソルの × のクリック（窓の中）と、窓の外への移動
    k.save(); k.beginPath(); k.rect(0, 0, CW, CH); k.clip(); k.translate(OX, OY); click(k, cx, cy, u, [CLOSE]); k.restore();
  };

  // @element 17
  // 17 ローディング画面（数字が100%まで進むと、幕が上がってページが現れる）
  CELLS[16] = (k, w, h, u) => {
    frame(k);
    const n = Math.round(100 * eOut(P(u, 0.25, 2.1)));
    const cy = u < 4.25 ? -VH * eIO(P(u, 2.3, 2.85)) : -VH * (1 - eIO(P(u, 4.25, 4.75)));
    const show = eOut(P(u, 2.35, 2.95));
    view(k, () => {
      header(k, 0);
      k.save(); k.globalAlpha = show; k.translate(0, 14 * (1 - show));
      txt(k, 'ようこそ。', 34, 82, `800 26px ${JP}`, C.ink); bars(k, 34, 98, 200, 3); btn(k, 34, 136, 96, 24, '始める');
      pic(k, 270, 46, 214, 112, 0, 8); k.restore();
      if (cy > -VH) {
        k.save(); k.translate(0, cy); k.fillStyle = C.ink; k.fillRect(0, 0, VW, VH);
        logo(k, VW / 2 - 40, 56, '#fff');
        txt(k, (u >= 4.25 ? 0 : n) + '%', VW / 2, 98, `800 28px ${EN}`, '#fff', 'center', 'middle');
        k.fillStyle = 'rgba(255,255,255,.15)'; rr(k, VW / 2 - 90, 122, 180, 4, 2); k.fill();
        k.fillStyle = C.acc; rr(k, VW / 2 - 90, 122, 180 * (u >= 4.25 ? 0 : n / 100), 4, 2); k.fill();
        k.restore();
      }
    });
  };

  // @element 18
  // 18 遅延読み込み（画面に入った画像だけ、その時点で読み込まれて表示される）
  CELLS[17] = (k, w, h, u) => {
    frame(k);
    const SY = t => steps([[0.35, 0], [1.1, 110], [1.7, 110], [2.5, 225], [3.5, 225], [4.5, 0]], t), y = SY(u);
    const COLX = [15, 180, 345], IW = 151, IH = 92, ROWS = [12, 168, 276], WAIT = 0.45, FADE = 0.35;
    view(k, () => {
      k.save(); k.translate(0, -y);
      txt(k, 'ギャラリー', 15, 140, `800 18px ${JP}`, C.ink); bars(k, 120, 128, 200, 1);
      ROWS.forEach((top, r) => COLX.forEach((x, c) => {
        const t0 = r === 0 ? -1e9 : enteredAt(SY, top, VH, u), age = t0 === null ? -1 : u - t0 - c * 0.12;
        k.fillStyle = C.skel; rr(k, x, top, IW, IH, 6); k.fill();
        if (age < WAIT + FADE) {   // まだの画像: 灰色の枠と画像の印
          k.save(); k.translate(x + IW / 2, top + IH / 2); k.strokeStyle = '#B9C1CF'; k.lineWidth = 2; k.lineJoin = 'round';
          if (age >= 0 && age < WAIT) spinner(k, 0, 0, 11, u, C.blue);
          else { rr(k, -15, -11, 30, 22, 3); k.stroke(); k.beginPath(); k.moveTo(-11, 7); k.lineTo(-3, -1); k.lineTo(3, 5); k.lineTo(7, 1); k.lineTo(11, 6); k.stroke(); }
          k.restore();
        }
        if (age >= WAIT) { k.save(); k.globalAlpha = eOut(P(age, WAIT, WAIT + FADE)); pic(k, x, top, IW, IH, (r + c) % 3, 6); k.restore(); }
      }));
      k.restore();
      sbar(k, y / 225, 0.45);
    });
  };

  // @element 19
  // 19 無限スクロール（いちばん下まで来ると読み込み表示が出て、続きが足される）
  CELLS[18] = (k, w, h, u) => {
    frame(k);
    // 1周期で 3件（156px）ぶん進む。周期の終わりは始まりと同じ見た目（内容は3件ごとにくり返す）
    const PITCH = 52, BATCH = 3, L0 = 6, TL = 2.6;
    const y = steps([[0.25, 38], [0.85, 116], [1.15, 116], [1.75, 194], [4.8, 194]], u);
    const n = u < TL ? L0 : L0 + BATCH, end = 10 + n * PITCH;
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      k.save(); k.translate(0, -y);
      for (let i = 0; i < n; i++) {
        const top = 10 + i * PITCH, v = i % 3, fresh = i >= L0 ? eOut(P(u, TL, TL + 0.35)) : 1;
        if (top - y > VH || top + 44 - y < 0) continue;
        k.save(); k.globalAlpha = fresh; k.translate(0, 10 * (1 - fresh));
        k.fillStyle = '#fff'; rr(k, 90, top, 331, 44, 8); k.fill(); pic(k, 98, top + 6, 48, 32, v, 5);
        bars(k, 158, top + 12, [180, 140, 200][v], 1, C.ink, 7); bars(k, 158, top + 26, [120, 150, 100][v], 1, C.faint, 6);
        k.restore();
      }
      spinner(k, VW / 2, end + 18, 10, u);
      k.restore();
    });
  };

  // @element 20
  // 20 ページ遷移アニメーション（リンクを押すと、色の幕が横切って次のページに切り替わる）
  CELLS[19] = (k, w, h, u) => {
    frame(k, u >= 1.3 && u < 3.5 ? 'example.com/works/02' : 'example.com/works');
    const CLK = [0.8, 3.0];
    const cover = t0 => eIO(P(u, t0, t0 + 0.4)), uncover = t0 => eIO(P(u, t0, t0 + 0.45));
    // 幕の左端: 入る −VW→0、出る 0→VW
    const xs = u < 1.4 ? -VW * (1 - cover(0.9)) : u < 3.1 ? VW * uncover(1.4) : u < 3.6 ? -VW * (1 - cover(3.1)) : VW * uncover(3.6);
    const pageB = u >= 1.3 && u < 3.5;
    const [cx, cy] = path([[0, 420, 150], [0.65, 255, 100], [2.6, 255, 100], [2.85, 46, 50], [3.3, 46, 50], [4.6, 420, 150], [4.8, 420, 150]], u);
    view(k, () => {
      header(k, 0);
      if (!pageB) {
        txt(k, 'WORKS', 34, 62, `800 18px ${EN}`, C.ink, 'left', 'alphabetic', '2px');
        for (let i = 0; i < 3; i++) { const x = 34 + i * 152; pic(k, x, 74, 136, 60, i, 6); bars(k, x, 142, 100, 1, C.ink, 7); }
      } else {
        txt(k, '← 一覧へ', 34, 55, `700 12px ${JP}`, C.sub, 'left', 'middle');
        pic(k, 34, 68, 240, 90, 1, 8);
        txt(k, 'Project 02', 296, 96, `800 22px ${EN}`, C.ink); bars(k, 296, 110, 180, 3);
      }
      if (xs > -VW && xs < VW) { k.fillStyle = C.acc; k.fillRect(xs, 0, VW, VH); logo(k, xs + VW / 2 - 40, VH / 2, '#fff'); }
      click(k, cx, cy, u, CLK);
    });
  };

  // @element 21
  // 21 スムーススクロール（メニューを押すと、ページがなめらかに目的の場所まで動く）
  CELLS[20] = (k, w, h, u) => {
    frame(k);
    const TO = 296;   // 「料金」セクションの頭（330）− ヘッダーの高さ（34）
    const y = TO * eIO(P(u, 0.95, 2.0)) * (1 - eIO(P(u, 3.15, 4.2)));
    const [cx, cy] = path([[0, 380, 132], [0.75, 360, 18], [1.0, 360, 18], [2.9, 478, 140], [3.25, 478, 140], [4.8, 380, 132]], u);
    view(k, () => {
      k.save(); k.translate(0, -y);
      pic(k, 24, 46, 222, 110, 0, 8); txt(k, 'ちょうどいい道具を。', 264, 84, `800 19px ${JP}`, C.ink); bars(k, 264, 98, 210, 3);
      k.fillStyle = C.soft; k.fillRect(0, 170, VW, 160);
      txt(k, '特長', VW / 2, 206, `800 17px ${JP}`, C.ink, 'center');
      for (let i = 0; i < 3; i++) { const x = 100 + i * 155; k.fillStyle = C.blueL; k.beginPath(); k.arc(x, 252, 24, 0, 7); k.fill(); bars(k, x - 46, 288, 92, 2); }
      txt(k, '料金', VW / 2, 370, `800 17px ${JP}`, C.ink, 'center');
      ['¥0', '¥980', '¥2,980'].forEach((s, i) => {
        const x = 50 + i * 143, hi = i === 1; k.fillStyle = '#fff'; rr(k, x, 388, 125, 96, 8); k.fill();
        k.lineWidth = hi ? 2.5 : 1.5; k.strokeStyle = hi ? C.acc : C.faint; k.stroke();
        txt(k, s, x + 62.5, 428, `800 20px ${EN}`, hi ? C.acc : C.ink, 'center'); bars(k, x + 22, 444, 81, 2);
      });
      k.restore();
      header(k, 0, y > 250 ? 1 : -1);
      const tb = clamp((y - 60) / 40);   // ページトップへ戻るボタン
      if (tb > 0) { k.globalAlpha = tb; k.fillStyle = C.ink; k.beginPath(); k.arc(478, 140, 15, 0, 7); k.fill(); k.strokeStyle = '#fff'; k.lineWidth = 2.4; k.lineCap = 'round'; k.lineJoin = 'round'; k.beginPath(); k.moveTo(472, 143); k.lineTo(478, 136.5); k.lineTo(484, 143); k.stroke(); k.globalAlpha = 1; }
      sbar(k, y / TO * 0.7, 0.36);
      click(k, cx, cy, u, [0.9, 3.1]);
    });
  };

  // @element 22
  // 22 マーキー（文字の帯が、途切れずに横へ流れ続ける）
  CELLS[21] = (k, w, h, u) => {
    frame(k);
    const WORDS = ['WEB DESIGN', 'BRANDING', 'MOTION', 'UI/UX'], F = `800 30px ${EN}`, GAPW = 64;
    view(k, () => {
      bars(k, 34, 20, 180, 1, C.ink, 10); bars(k, 34, 38, 300, 1);
      k.fillStyle = C.ink; k.fillRect(0, 58, VW, 58);
      k.font = F; k.letterSpacing = '1px'; const ws = WORDS.map(s => k.measureText(s).width); k.letterSpacing = '0px';
      const unit = ws.reduce((a, b) => a + b + GAPW, 0);
      let x = -mod(u / CYC, 1) * unit;                 // 1周期で1組ぶん左へ
      for (let rep = 0; x < VW; rep++) WORDS.forEach((s, i) => {
        txt(k, s, x, 88, F, '#fff', 'left', 'middle', '1px');
        k.fillStyle = C.acc; k.beginPath(); k.arc(x + ws[i] + GAPW / 2, 88, 6, 0, 7); k.fill();
        x += ws[i] + GAPW;
      });
      for (let i = 0; i < 3; i++) { k.fillStyle = C.soft; rr(k, 34 + i * 152, 130, 136, 30, 6); k.fill(); bars(k, 46 + i * 152, 142, 90, 1, C.faint); }
    });
  };

  // @element 23
  // 23 グラデーションアニメーション（背景のグラデーションの色が、ゆっくり流れるように動き続ける）
  CELLS[22] = (k, w, h, u) => {
    frame(k);
    const a = 2 * Math.PI * u / CYC;                        // 4.8秒で1周
    const BLOBS = [[C.acc, 150, 60, 230, 70, 30, 0], ['#FFB08F', 380, 40, 210, 60, 40, 2.1], [C.blue, 330, 150, 240, 80, 30, 4.2], ['#9DB6FB', 90, 170, 200, 50, 35, 1.0]];
    view(k, () => {
      k.fillStyle = '#FFF1EB'; k.fillRect(0, 0, VW, VH);
      for (const [col, x0, y0, r, ax, ay, ph] of BLOBS) {
        const x = x0 + ax * Math.cos(a + ph), y = y0 + ay * Math.sin(a + ph);
        const g = k.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(255,255,255,0)');
        k.globalAlpha = 0.85; k.fillStyle = g; k.fillRect(0, 0, VW, VH); k.globalAlpha = 1;
      }
      txt(k, 'Hello, Future.', 40, 82, `800 34px ${EN}`, '#fff', 'left', 'alphabetic', '1px');
      bars(k, 40, 100, 200, 2, 'rgba(255,255,255,.8)', 6, 12, 0.6);
      btn(k, 40, 128, 104, 26, 'はじめる', '#fff', C.ink);
    });
  };

  // @element 24
  // 24 ふわふわアニメーション（画面の飾りが、ゆっくり上下に浮き沈みし続ける）
  CELLS[23] = (k, w, h, u) => {
    frame(k);
    const bob = (T, A, ph) => -A * Math.sin(2 * Math.PI * u / T + ph);   // 上下（easeInOut に近いサイン波）
    const y1 = bob(2.4, 8, 0), y2 = bob(1.6, 6, 1.2), y3 = bob(2.4, 6, 2.4);
    view(k, () => {
      k.fillStyle = C.soft; k.fillRect(0, 0, VW, VH);
      txt(k, 'アプリで、', 34, 62, `800 24px ${JP}`, C.ink); txt(k, 'もっと身軽に。', 34, 94, `800 24px ${JP}`, C.ink);
      bars(k, 34, 108, 170, 2); btn(k, 34, 134, 112, 24, 'ダウンロード');
      // 影（上がるほど小さく薄く）
      const sh = 1 + y1 / 40;
      k.fillStyle = `rgba(28,35,51,${0.16 * sh})`; k.beginPath(); k.ellipse(352, 160, 54 * sh, 6 * sh, 0, 0, 7); k.fill();
      // スマホ
      k.save(); k.translate(0, y1);
      k.fillStyle = C.ink; rr(k, 306, 18, 92, 132, 16); k.fill(); k.fillStyle = '#fff'; rr(k, 312, 24, 80, 120, 11); k.fill();
      pic(k, 318, 32, 68, 52, 0, 6); bars(k, 318, 92, 68, 3, C.faint, 5, 10);
      k.restore();
      // 飾り（ハートの丸と星のチップ）
      k.save(); k.translate(0, y2); k.shadowColor = 'rgba(28,35,51,.18)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = C.acc; k.beginPath(); k.arc(268, 54, 20, 0, 7); k.fill(); k.shadowColor = 'transparent';
      k.fillStyle = '#fff'; k.beginPath(); k.moveTo(268, 62); k.bezierCurveTo(254, 53, 260, 41, 268, 48); k.bezierCurveTo(276, 41, 282, 53, 268, 62); k.fill(); k.restore();
      k.save(); k.translate(0, y3); k.shadowColor = 'rgba(28,35,51,.16)'; k.shadowBlur = 10; k.shadowOffsetY = 4;
      k.fillStyle = '#fff'; rr(k, 410, 92, 76, 30, 15); k.fill(); k.shadowColor = 'transparent';
      txt(k, '★ 4.8', 448, 108, `800 13px ${EN}`, C.acc, 'center', 'middle'); k.restore();
    });
  };
  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});

/* Motion Prompt · pack "photo" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('photo', function () {
  // @kit
  // 写真の表現・光と画風 24（カード 539x208、1周 5秒）。各コマは時間 u の純関数。
  // 絵は平らな図形だけで描く。場面は3つを全コマで使い回す: ①光＝地平線の前の胸像 ②レンズ＝街角 ③仕上げ＝胸像と風景。
  // 人物は顔・髪のない丸い頭のピクト。光はアンバー1色の面、影は一段濃い平らな面で表す。
  // 色が主役の効果（モノクロ・デュオトーンなど）は、同じ場面の色の割り当て（パレット）を差し替えて見せる。
  // 多くの見本は「効果なし → あり → なし」を env(u) で切り替える（0.4〜1.4秒で入り、4.0秒まで保ち、4.8秒までに戻る）。
  const CW = 539, CH = 208, CYC = 5;
  const TAU = Math.PI * 2;
  const MONO = '"SF Mono", ui-monospace, Menlo, monospace';

  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // 効果の量: 0（なし）→ 1（あり）→ 0。イージングは3次のイーズインアウト
  const IN0 = 0.4, IN1 = 1.4, OUT0 = 4.0, OUT1 = 4.8;
  const env = u => eIO(P(u, IN0, IN1)) * (1 - eIO(P(u, OUT0, OUT1)));
  // 固定シードの乱数（mulberry32）
  function rng(seed) { let s = seed >>> 0; return () => { s = s + 0x6D2B79F5 >>> 0; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // 1回だけ作って使い回す物（中身は固定なので毎回同じ）
  const MEMO = {};
  const once = (name, fn) => MEMO[name] || (MEMO[name] = fn());

  // ---------- 色 ----------
  const HEX = {};
  const hx = s => HEX[s] || (HEX[s] = [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)));
  const toHex = c => '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  const mixc = (a, b, t) => t <= 0 ? a : t >= 1 ? b : toHex(hx(a).map((v, i) => lerp(v, hx(b)[i], t)));
  const lum = s => { const c = hx(s); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  // パレット同士を t で混ぜる（効果の入り・戻りはこれで色を移す）
  const pal = (a, b, t) => { if (t <= 0) return a; if (t >= 1) return b; const o = {}; for (const key in a) o[key] = mixc(a[key], b[key], t); return o; };
  const mapPal = (a, f) => { const o = {}; for (const key in a) o[key] = f(a[key]); return o; };

  // 基本の場面の色: 明るいニュートラル（camera パックと同じ灰色の段）＋人物の青みグレー＋光のアンバー
  const BASE = {
    sky: '#FAF9F7', sky2: '#FAF9F7', far: '#EAEDF1', mid: '#DEE3EA', ground: '#F1F0EE', ground2: '#E2E1DE', mark: '#FAF9F7', cast: '#E2E1DE',
    bld: '#F1F0EE', edge: '#CFCECB', win: '#E2E1DE', winOff: '#E2E1DE', tree: '#E2E1DE', trunk: '#CFCECB', post: '#A9A8A5', bulb: '#CFCECB',
    person: '#4D5A75', shade: '#33405A', lit: '#FFC75A', car: '#8D97AA', glass: '#EEF1F5', tire: '#3E4452',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 周りの明かりを落とした場面（ライティングの見本で、光の当たる所だけを見せる）
  const DIM = {
    sky: '#E7E5E1', sky2: '#E7E5E1', far: '#DADCDF', mid: '#CFD2D7', ground: '#DDDBD7', ground2: '#D0CECA', mark: '#E7E5E1', cast: '#D0CECA',
    bld: '#DDDBD7', edge: '#C0BEBA', win: '#D0CECA', winOff: '#D0CECA', tree: '#D0CECA', trunk: '#C0BEBA', post: '#9D9B97', bulb: '#C0BEBA',
    person: '#4D5A75', shade: '#2C3750', lit: '#FFC75A', car: '#7E889B', glass: '#DDE1E7', tire: '#353B48',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 夜（ブルーアワー・長時間露光）。窓と街灯はアンバーに灯る
  const NIGHT = {
    sky: '#2C3B5E', sky2: '#4A6191', far: '#34466D', mid: '#2C3C60', ground: '#283452', ground2: '#222C47', mark: '#3A4A70', cast: '#1F2840',
    bld: '#34446B', edge: '#283657', win: '#FFC75A', winOff: '#2A3859', tree: '#2F3F64', trunk: '#253252', post: '#1E2843', bulb: '#FFC75A',
    person: '#1C2439', shade: '#141B2D', lit: '#FFC75A', car: '#222C47', glass: '#3A4A70', tire: '#141B2D',
    sun: '#F5A524', glow: '#FFE3A3'
  };
  // 暗い場面（リムライト・ローキー）
  const DARK = {
    sky: '#2B2D33', sky2: '#2B2D33', far: '#313339', mid: '#36383E', ground: '#24252A', ground2: '#202125', mark: '#2B2D33', cast: '#1D1E22',
    bld: '#2F3137', edge: '#27292E', win: '#34363C', winOff: '#34363C', tree: '#323439', trunk: '#2A2C31', post: '#3B3D43', bulb: '#3B3D43',
    person: '#1F2128', shade: '#18191E', lit: '#FFC75A', car: '#303238', glass: '#3B3D43', tire: '#18191E',
    sun: '#F5A524', glow: '#FFE3A3'
  };

  // ---------- 図形 ----------
  // 図形を描く道具。M（点の写像）を渡すと、輪郭を細かく刻んでから写す（魚眼用）。M がなければそのまま描く
  function arcPts(x, y, r, n = 40) { const o = []; for (let i = 0; i < n; i++) { const a = i / n * TAU; o.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return o; }
  function rrPts(x, y, w, h, r) {
    const R = (Array.isArray(r) ? r : [r, r, r, r]).map(v => Math.min(v, w / 2, h / 2)), o = [];
    const corner = (cx, cy, rad, a0) => { if (rad <= 0) { o.push([cx, cy]); return; } for (let i = 0; i <= 6; i++) { const a = a0 + i / 6 * Math.PI / 2; o.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]); } };
    corner(x + w - R[1], y + R[1], R[1], -Math.PI / 2);
    corner(x + w - R[2], y + h - R[2], R[2], 0);
    corner(x + R[3], y + h - R[3], R[3], Math.PI / 2);
    corner(x + R[0], y + R[0], R[0], Math.PI);
    return o;
  }
  function pen(k, M) {
    const cut = (pts, closed) => {
      const o = [], n = pts.length;
      for (let i = 0; i < (closed ? n : n - 1); i++) {
        const a = pts[i], b = pts[(i + 1) % n], m = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 6));
        for (let j = 0; j < m; j++) o.push([lerp(a[0], b[0], j / m), lerp(a[1], b[1], j / m)]);
      }
      if (!closed) o.push(pts[n - 1]);
      return o.map(q => M(q[0], q[1]));
    };
    const path = (pts, closed) => { const q = M ? cut(pts, closed) : pts; k.beginPath(); q.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); if (closed) k.closePath(); };
    const D = {
      k,
      poly(pts, col) { path(pts, true); k.fillStyle = col; k.fill(); },
      rect(x, y, w, h, col) { if (!M) { k.fillStyle = col; k.fillRect(x, y, w, h); } else D.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], col); },
      rr(x, y, w, h, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.roundRect(x, y, w, h, r); k.fill(); } else D.poly(rrPts(x, y, w, h, r), col); },
      circ(x, y, r, col) { if (!M) { k.fillStyle = col; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill(); } else D.poly(arcPts(x, y, r), col); },
      line(pts, lw, col, dash) { path(pts, false); k.strokeStyle = col; k.lineWidth = lw; k.lineCap = 'round'; k.lineJoin = 'round'; if (dash) k.setLineDash(dash); k.stroke(); if (dash) k.setLineDash([]); },
      frame(x, y, w, h, lw, col) { path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); k.strokeStyle = col; k.lineWidth = lw; k.stroke(); }
    };
    return D;
  }

  // 小物（3つの場面で共通）: 建物・木・街灯・太陽・車
  function building(D, x, base, w, h, p, seed = 0) {
    D.rect(x, base - h, w, h, p.bld); D.frame(x, base - h, w, h, 1.4, p.edge);
    let n = seed;
    for (let y = base - h + 8; y < base - 12; y += 13) for (let xx = x + 7; xx < x + w - 9; xx += 11) { n++; D.rect(xx, y, 5, 7, (n * 7 + seed) % 3 === 0 ? p.win : p.winOff); }
  }
  function tree(D, x, base, r, p) { D.rect(x - r * 0.15, base - r * 1.4, r * 0.3, r * 1.4, p.trunk); D.circ(x, base - r * 1.6, r, p.tree); }
  function lamp(D, x, base, h, p) { D.rect(x - 1.6, base - h, 3.2, h, p.post); D.rect(x - 1.6, base - h, 10, 3, p.post); D.circ(x + 9, base - h + 5, 4, p.bulb); }
  // 太陽: 平らな2段の光の輪＋円
  function sun(D, x, y, r, p, a = 1) {
    const k = D.k; k.save();
    k.globalAlpha = 0.35 * a; D.circ(x, y, r * 2.6, p.glow);
    k.globalAlpha = 0.6 * a; D.circ(x, y, r * 1.7, p.glow);
    k.globalAlpha = a; D.circ(x, y, r, p.sun);
    k.restore();
  }
  function car(D, x, p, o = {}) {   // x = 車の中心、道の奥の車線を走る
    D.rr(x - 22, 128, 42, 13, [6, 6, 0, 0], p.car);
    D.rr(x - 18, 131, 16, 8, 2, p.glass); D.rr(x + 1, 131, 15, 8, 2, p.glass);
    D.rr(x - 35, 140, 70, 15, 5, p.car);
    D.rr(x + 30, 143, 5, 4, 1.5, o.head || p.glass); D.rr(x - 35, 143, 4, 4, 1.5, o.tail || p.edge);
    D.circ(x - 21, 156, 6, p.tire); D.circ(x + 21, 156, 6, p.tire);
    D.circ(x - 21, 156, 2.2, p.glass); D.circ(x + 21, 156, 2.2, p.glass);
  }

  // 人のピクト（全身）。camera パックと同じ組み方（頭・胴・腕・脚の角丸）。x = 足元の中心、feet = 足元の y、s = 身長(px)
  function figure(D, x, feet, s, col) {
    const m = s / 1.79, X = v => x + v * m, Y = v => feet - v * m;
    D.rr(X(-0.155), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col); D.rr(X(0.005), Y(0.88), 0.15 * m, 0.88 * m, 0.07 * m, col);
    D.rr(X(-0.31), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col); D.rr(X(0.19), Y(1.40), 0.12 * m, 0.6 * m, 0.06 * m, col);
    D.rr(X(-0.23), Y(1.46), 0.46 * m, 0.64 * m, 0.12 * m, col);
    D.circ(x, Y(1.63), 0.16 * m, col);
  }
  // 胸から上のピクト（同じ組み方を頭の半径 R で切り出す）。cx,cy = 頭の中心
  function bustPath(k, cx, cy, R) {
    k.beginPath(); k.arc(cx, cy, R, 0, TAU);
    k.roundRect(cx - 1.4375 * R, cy + 1.0625 * R, 2.875 * R, CH, 0.75 * R);
    k.roundRect(cx - 1.9375 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
    k.roundRect(cx + 1.1875 * R, cy + 1.4375 * R, 0.75 * R, CH, 0.375 * R);
  }
  // 胸像を色 col で塗り、paint(k) で光と影の面を胸像の形の中だけに塗る
  function bust(k, cx, cy, R, col, paint) {
    k.save(); bustPath(k, cx, cy, R); k.fillStyle = col; k.fill();
    if (paint) { k.clip(); paint(k); }
    k.restore();
  }
  // 頭の影の面: 光が横から角度 az（0 = 正面、90° = 真横）で当たるとき、明暗の境は x = cx ± cos(az)·√(R²−dy²)。side = +1 で右側が影
  function headShade(k, cx, cy, R, az, side, col) {
    const c = Math.cos(az), n = 28; k.beginPath();
    for (let i = 0; i <= n; i++) { const y = cy - R + 2 * R * i / n; k.lineTo(cx + side * c * Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), y); }
    k.lineTo(cx + side * (R + 4), cy + R); k.lineTo(cx + side * (R + 4), cy - R); k.closePath(); k.fillStyle = col; k.fill();
  }

  // ---------- 3つの場面 ----------
  // ① 光: 地平線（y150）の前の胸像。左に建物2棟、右に街灯と木
  const PX = 270, PY = 78, PR = 29, HZ = 150;
  function stagePortrait(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 92, CW, HZ - 92, p.sky2);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    D.poly([[0, HZ], [0, 134], [70, 124], [150, 136], [230, 126], [330, 134], [420, 122], [539, 132], [539, HZ]], p.far);
    building(D, 34, HZ, 38, 50, p, 1); building(D, 76, HZ, 30, 32, p, 2);
    D.rect(0, HZ, CW, CH - HZ, p.ground);
    if (o.cast) { const L = o.cast; D.poly([[402, HZ], [405, HZ], [405 + L, HZ + 9], [402 + L, HZ + 9]], p.cast); D.poly([[452, HZ], [460, HZ], [460 + L * 0.9, HZ + 16], [452 + L * 0.9, HZ + 16]], p.cast); }
    lamp(D, 404, HZ, 58, p); tree(D, 456, HZ, 17, p);
    if (o.after) o.after(D);
  }
  // ② レンズ: 街角。奥に建物の列・木・街灯、手前に道と歩道、人物は左手前
  const BLD = [[-8, 52, 66], [48, 40, 90], [92, 54, 58], [150, 44, 78], [208, 32, 52], [296, 52, 84], [352, 48, 60], [404, 42, 98], [470, 40, 70], [514, 40, 88]];
  const TREES = [[136, 17], [262, 17], [384, 15]], LAMPS = [114, 292, 494], ROAD = 132, WALK = 162;
  const FIG = [176, 200, 124];   // 人物: 足元の x・y、身長
  function stageStreet(k, p, o = {}) {
    const D = pen(k, o.M);
    D.rect(-40, -40, CW + 80, CH + 80, p.sky);
    if (o.sun) sun(D, o.sun[0], o.sun[1], o.sun[2], p, o.sun[3]);
    BLD.forEach(([x, w, h], i) => building(D, x, ROAD, w, h, p, i));
    TREES.forEach(([x, r]) => tree(D, x, ROAD, r, p));
    LAMPS.forEach(x => lamp(D, x, ROAD, 58, p));
    D.rect(-40, ROAD, CW + 80, WALK - ROAD, p.ground2);
    D.line([[-40, 147], [CW + 40, 147]], 2, p.mark, [14, 12]);
    if (o.car !== undefined && o.car !== false) car(D, o.car, p, o.carLights || {});
    D.rect(-40, WALK, CW + 80, CH - WALK + 40, p.ground); D.line([[-40, WALK], [CW + 40, WALK]], 1.4, p.edge);
    if (o.person !== false) figure(D, FIG[0], FIG[1], FIG[2], p.person);
    D.circ(18, 206, 17, p.tree); D.circ(42, 210, 11, p.tree); D.circ(516, 204, 19, p.tree); D.circ(494, 211, 11, p.tree);
    if (o.after) o.after(D);
  }
  // ③ 仕上げ: 左に胸像、右に丘と家と木と太陽。日は右から当たり、胸像の右の縁が光る
  const QX = 140, QY = 82, QR = 28;
  function stageLand(k, p, o = {}) {
    const D = pen(k);
    D.rect(0, 0, CW, CH, p.sky); D.rect(0, 100, CW, 60, p.sky2);
    if (o.sunOn !== false) sun(D, 432, 54, 15, p);
    if (o.land !== false) {
      D.poly([[150, 162], [150, 130], [210, 116], [262, 124], [318, 100], [372, 114], [430, 104], [490, 120], [539, 110], [539, 162]], p.far);
      building(D, 346, 134, 30, 24, p, 3);
      D.poly([[150, 162], [150, 146], [226, 136], [300, 144], [368, 130], [440, 140], [500, 132], [539, 136], [539, 162]], p.mid);
      D.rect(0, 160, CW, CH - 160, p.ground);
      tree(D, 486, 162, 19, p); tree(D, 452, 162, 12, p);
    } else D.rect(0, 160, CW, CH - 160, p.ground);
    if (o.person !== false) bust(k, QX, QY, QR, p.person, kk => { headShade(kk, QX, QY, QR, 0.86, 1, p.lit); kk.fillStyle = p.lit; kk.fillRect(QX + 1.55 * QR, QY + QR, QR, CH); });
    if (o.after) o.after(D);
  }

  // ---------- 表示 ----------
  // 右上の数値（camera パックと同じ控えめな札）
  function hud(k, s) {
    k.save(); k.globalAlpha = 1;
    const m = 13, f = `600 15px ${MONO}`; k.font = f; const ww = k.measureText(s).width;
    k.fillStyle = 'rgba(255,255,255,.82)'; k.beginPath(); k.roundRect(CW - m - 14 - ww - 10, m + 6, ww + 20, 23, 6); k.fill();
    k.fillStyle = '#6E6E73'; k.textAlign = 'right'; k.textBaseline = 'middle'; k.fillText(s, CW - m - 14, m + 18);
    k.restore();
  }
  // 右下の、真上から見た配置図: 頭（下がカメラ側）と光の位置。lights = [[角度, 明るさ0..1]]、角度は 0 = カメラ側、+90° = 画面の左
  function plan(k, lights) {
    const w = 66, h = 66, x = CW - 13 - w, y = CH - 13 - h, cx = x + w / 2, cy = y + h / 2 - 3;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#CFCECB'; k.beginPath(); k.roundRect(cx - 6, y + h - 10, 12, 6, 2); k.fill();
    k.fillStyle = '#A9A8A5'; k.beginPath(); k.arc(cx, cy, 8, 0, TAU); k.fill();
    k.beginPath(); k.moveTo(cx - 3.5, cy + 7); k.lineTo(cx + 3.5, cy + 7); k.lineTo(cx, cy + 12); k.fill();
    for (const [az, a] of lights) {
      const lx = cx - Math.sin(az) * 22, ly = cy + Math.cos(az) * 22;
      k.globalAlpha = a;
      k.strokeStyle = '#F5A524'; k.lineWidth = 1.4; k.setLineDash([2.5, 2.5]); k.beginPath(); k.moveTo(lx, ly); k.lineTo(lerp(lx, cx, 0.55), lerp(ly, cy, 0.55)); k.stroke(); k.setLineDash([]);
      k.fillStyle = '#F5A524'; k.beginPath(); k.arc(lx, ly, 4.5, 0, TAU); k.fill();
    }
    k.restore();
  }
  // 作業用のオフスクリーン（名前ごとに1枚・使う前に空にする）
  const LAYERS = {};
  function layer(name) {
    const c = LAYERS[name] || (LAYERS[name] = (() => { const e = document.createElement('canvas'); e.width = CW; e.height = CH; return e; })());
    const kk = c.getContext('2d'); kk.globalAlpha = 1; kk.filter = 'none'; kk.globalCompositeOperation = 'source-over'; kk.clearRect(0, 0, CW, CH);
    return [c, kk];
  }
  const cell = fn => (k, w, h, u) => { k.save(); fn(k, u); k.restore(); };

  // 胴の光と影（胴は円柱とみなし、左右に分けて塗る）。W = 胴の外側までの半幅
  const torsoW = R => 1.9375 * R;
  function torso(k, cx, cy, R, x0, x1, col) { k.fillStyle = col; k.fillRect(x0, cy + R, x1 - x0, CH); }
  // 時刻の表示（分 → hh:mm）
  const clock = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
  // 右下の小さなヒストグラム（明るさの分布）。c = 山の中心 0..1、s = 山の幅
  function histo(k, c, s) {
    const w = 96, h = 46, x = CW - 13 - w, y = CH - 13 - h, n = 20;
    k.save();
    k.fillStyle = 'rgba(255,255,255,.9)'; k.beginPath(); k.roundRect(x, y, w, h, 8); k.fill();
    k.strokeStyle = '#E3E1DC'; k.lineWidth = 1.2; k.stroke();
    k.fillStyle = '#A9A8A5';
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, v = Math.exp(-((t - c) ** 2) / (2 * s * s)) * 0.92 + 0.06; const bh = v * (h - 16); k.fillRect(x + 8 + i * (w - 16) / n, y + h - 8 - bh, (w - 16) / n - 1.2, bh); }
    k.restore();
  }

  const CELLS = [];

  // @element 01
  // 逆光: 太陽が画面の外から頭の真後ろへ回り込み、輪郭が光って人物は暗くなる
  CELLS[0] = cell((k, u) => {
    const a = env(u);
    const BACK = Object.assign({}, BASE, { sky: '#FFF4DC', sky2: '#FFEBC4', far: '#F6E2BE', ground: '#F7EAD3', bld: '#F7E9D2', winOff: '#EEDCBF', win: '#EEDCBF', tree: '#EEDCBF', edge: '#E3CFAE', post: '#CDB894', trunk: '#E3CFAE', bulb: '#E3CFAE' });
    stagePortrait(k, pal(BASE, BACK, a), { sun: [lerp(40, PX, a), lerp(-40, PY - 22, a), 20, 1] });
    // 輪郭の光: 胸像の形を太い線でなぞってから中を塗り、縁だけを残す
    k.save(); k.globalAlpha = a; bustPath(k, PX, PY, PR); k.strokeStyle = BASE.lit; k.lineWidth = 7; k.lineJoin = 'round'; k.stroke(); k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, BASE.shade, a));
    // かすみ: 全体に光の色を薄く重ねる
    k.save(); k.globalAlpha = 0.22 * a; k.fillStyle = BASE.glow; k.fillRect(0, 0, CW, CH); k.restore();
  });

  // @element 02
  // リムライト: 周りが暗くなり、斜め後ろ左右の2灯で頭と肩の輪郭だけが細く光る
  CELLS[1] = cell((k, u) => {
    const a = env(u);
    stagePortrait(k, pal(BASE, DARK, a));
    k.save(); k.globalAlpha = a; k.fillStyle = BASE.lit;
    for (const dx of [-3.5, 3.5]) { k.save(); k.translate(dx, -2.5); bustPath(k, PX, PY, PR); k.fill(); k.restore(); }
    k.restore();
    bust(k, PX, PY, PR, mixc(BASE.person, DARK.person, a));
    plan(k, [[Math.PI * 0.75, a], [-Math.PI * 0.75, a]]);
    hud(k, '±135°');
  });

  // @element 03
  // シルエット: 露出を明るい空に合わせると、人物も建物も木も黒い形だけになる
  CELLS[2] = cell((k, u) => {
    const a = env(u), INK = '#2A2D36';
    const SILH = mapPal(BASE, () => INK);
    Object.assign(SILH, { sky: '#FFEDC4', sky2: '#FFCF73', far: '#4A4546', sun: BASE.sun, glow: BASE.glow });
    stagePortrait(k, pal(BASE, SILH, a), { sun: [404, lerp(60, 128, a), 20, a] });
    bust(k, PX, PY, PR, mixc(BASE.person, '#22252D', a));
    hud(k, `${(-2 * a).toFixed(1).replace('-0.0', '±0.0')} EV`);
  });

  // @element 04
  // スプリットライティング: 光が真横（90°）へ回り、顔の右半分が影に沈む
  CELLS[3] = cell((k, u) => {
    const a = env(u), az = lerp(0.35, Math.PI / 2, a);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a), W = torsoW(PR);
    bust(k, PX, PY, PR, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, PR, 0, TAU); kk.fill();
      headShade(kk, PX, PY, PR, az, 1, sh);
      torso(kk, PX, PY, PR, PX - W, PX - Math.cos(az) * 0.4 * W - 0.4 * W, lit);
      torso(kk, PX, PY, PR, PX + Math.cos(az) * W, PX + W, sh);
    });
    plan(k, [[az, a]]);
    hud(k, `${Math.round(az * 180 / Math.PI)}° · ↑0°`);
  });

  // @element 05
  // レンブラントライティング: 斜め45°・上からの光。影側の頬に三角形の光が残る
  CELLS[4] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      kk.fillStyle = sh; kk.fillRect(PX + 0.04 * R, PY - R - 2, R * 2, R * 2 + 4);       // 鼻筋から右は影
      kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.clip();
      kk.fillStyle = lit; kk.beginPath();                                                   // 影側の頬に残る光の三角形
      kk.moveTo(PX + 0.24 * R, PY - 0.12 * R); kk.lineTo(PX + 0.7 * R, PY - 0.12 * R); kk.lineTo(PX + 0.24 * R, PY + 0.5 * R); kk.closePath(); kk.fill();
    });
    bust(k, PX, PY, R, 'rgba(0,0,0,0)', kk => {
      kk.fillStyle = 'rgba(0,0,0,0)';
      torso(kk, PX, PY, R, PX - W, PX - 0.45 * W, lit);
      torso(kk, PX, PY, R, PX + 0.3 * W, PX + W, sh);
    });
    plan(k, [[Math.PI / 4, a]]);
    hud(k, '45° · ↑45°');
  });

  // @element 06
  // バタフライライティング: 顔の正面・高い位置からの光。顔は左右対称に明るく、あごの下にだけ小さな影
  CELLS[5] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    stagePortrait(k, pal(BASE, DIM, a));
    const lit = mixc(BASE.person, BASE.lit, a), sh = mixc(BASE.person, BASE.shade, a);
    bust(k, PX, PY, R, BASE.person, kk => {
      torso(kk, PX, PY, R, PX - 0.8 * W, PX + 0.8 * W, lit);
      kk.fillStyle = sh; kk.beginPath(); kk.ellipse(PX, PY + R * 1.06, R * 0.72, R * 0.38, 0, 0, TAU); kk.fill();    // あごの下の影（左右対称）
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
    });
    plan(k, [[0, a]]);
    hud(k, '0° · ↑45°');
  });

  // @element 07
  // ゴールデンアワー: 太陽が地平線近くまで下り、全体が橙に染まって影が長く伸びる
  CELLS[6] = cell((k, u) => {
    const a = env(u), R = PR, W = torsoW(R);
    const GOLD = {
      sky: '#FFE8BC', sky2: '#FFCF80', far: '#F2C58C', mid: '#E8B27A', ground: '#F6DDB0', ground2: '#ECC892', mark: '#F6DDB0', cast: '#DDAA6E',
      bld: '#F7DCAE', edge: '#D9AE76', win: '#ECC892', winOff: '#ECC892', tree: '#E9C08A', trunk: '#C9965E', post: '#B98A58', bulb: '#C9965E',
      person: '#5C5470', shade: '#3E3650', lit: '#FFB547', car: '#A08E8E', glass: '#F6DDB0', tire: '#3E3650', sun: '#F59A24', glow: '#FFD48A'
    };
    const p = pal(BASE, GOLD, a);
    stagePortrait(k, p, { sun: [lerp(110, 96, a), lerp(-30, 136, a), 18, 1], cast: lerp(0, 150, a) });
    const lit = mixc(p.person, GOLD.lit, a), sh = mixc(p.person, GOLD.shade, a);
    bust(k, PX, PY, R, p.person, kk => {
      kk.fillStyle = lit; kk.beginPath(); kk.arc(PX, PY, R, 0, TAU); kk.fill();
      headShade(kk, PX, PY, R, 1.15, 1, sh);
      torso(kk, PX, PY, R, PX - W, PX - 0.5 * W, lit);
      torso(kk, PX, PY, R, PX + 0.4 * W, PX + W, sh);
    });
    hud(k, clock(lerp(720, 1060, a)));
  });

  // @element 08
  // ブルーアワー: 日が沈んだ後、空が深い青になり、窓と街灯の暖かい光が灯る
  CELLS[7] = cell((k, u) => {
    const a = env(u);
    const p = pal(BASE, NIGHT, a);
    stagePortrait(k, p, {
      sun: [120, lerp(40, 190, P(a, 0, 0.7)), 18, 1 - P(a, 0.4, 0.8)],
      after: D => { const k2 = D.k; k2.save(); k2.globalAlpha = 0.35 * a; D.circ(413, HZ - 53, 13, BASE.glow); k2.globalAlpha = 0.6 * a; D.circ(413, HZ - 53, 8, BASE.glow); k2.restore(); D.circ(413, HZ - 53, 4, p.bulb); }
    });
    bust(k, PX, PY, PR, p.person);
    hud(k, clock(lerp(720, 1115, a)));
  });

  // @element 09
  // ボケ: 絞りを開けると、人物はくっきりのまま、背景の灯りが大きな丸になってにじむ
  CELLS[8] = cell((k, u) => {
    const a = env(u), p = pal(BASE, DIM, a);
    const [B, kb] = layer('bokeh'); stageStreet(kb, p, { person: false });
    const [Bb, kbb] = layer('bokeh-b'); kbb.filter = `blur(${(6 * a).toFixed(2)}px)`; kbb.drawImage(B, 0, 0); kbb.filter = 'none';
    k.drawImage(B, 0, 0); k.drawImage(Bb, 0, 0);
    // 灯り: 街灯3つと、窓や遠くの灯り12個（横に45pxおき・高さと大きさは固定シード）。絞りを開くほど丸が大きく薄くなる
    const pts = once('bokeh-pts', () => {
      const o = LAMPS.map(x => [x + 9, ROAD - 53, 1.25, 0]), r = rng(9);
      for (let i = 0; i < 12; i++) o.push([22 + i * 45 + r() * 20, 44 + r() * 70, 0.6 + r() * 0.6, 1]);
      return o;
    });
    k.save();
    for (const [x, y, s, w] of pts) {
      const r = (2.4 + 15 * a) * s;
      k.globalAlpha = lerp(1, 0.55, a); k.fillStyle = w ? BASE.glow : BASE.lit; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
      k.globalAlpha = 0.7 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.2; k.stroke();
    }
    k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    const stops = ['f/16', 'f/11', 'f/8', 'f/5.6', 'f/4', 'f/2.8', 'f/2', 'f/1.4'];
    hud(k, stops[Math.round(a * 7)]);
  });

  // @element 10
  // ティルトシフト: 上下の帯がぼけて中央の帯だけピントが合い、街と小さな人と車が模型のように見える
  CELLS[9] = cell((k, u) => {
    const a = env(u), carX = lerp(-60, 600, u / CYC);
    const minis = D => { [[196, 26], [322, 26], [340, 23], [452, 25]].forEach(([x, h]) => figure(D, x, 172, h, BASE.person)); };
    const [S, ks] = layer('tilt'); stageStreet(ks, BASE, { car: carX, person: false, after: minis });
    const [B1, k1] = layer('tilt-1'); k1.filter = `blur(${(3 * a).toFixed(2)}px)`; k1.drawImage(S, 0, 0); k1.filter = 'none';
    const [B2, k2] = layer('tilt-2'); k2.filter = `blur(${(7 * a).toFixed(2)}px)`; k2.drawImage(S, 0, 0); k2.filter = 'none';
    k.drawImage(S, 0, 0);
    const band = (img, y0, y1) => { k.save(); k.beginPath(); k.rect(0, y0, CW, y1 - y0); k.clip(); k.drawImage(img, 0, 0); k.restore(); };
    band(B2, 0, 42); band(B1, 42, 66); band(B1, 176, 190); band(B2, 190, CH);
    // ピントの帯の目印（写真アプリの線）
    k.save(); k.globalAlpha = 0.75 * a; k.strokeStyle = '#8E8E93'; k.lineWidth = 1.4; k.setLineDash([6, 5]);
    k.beginPath(); k.moveTo(0, 66); k.lineTo(CW, 66); k.moveTo(0, 176); k.lineTo(CW, 176); k.stroke(); k.setLineDash([]);
    k.restore();
  });

  // @element 11
  // 長時間露光: シャッターを開け続けると、夜道の車は消え、ライトだけが光の線になる
  CELLS[10] = cell((k, u) => {
    const a = env(u), x = lerp(-60, 600, u / CYC);
    const p = pal(BASE, NIGHT, a);
    stageStreet(k, p, {
      car: false, person: false,
      after: D => {
        const kk = D.k;
        // 車の通った跡: 尾灯（赤）と前照灯（白〜アンバー）の線。車の後ろに伸びる
        kk.save(); kk.globalAlpha = a; kk.lineCap = 'round';
        const x0 = -60, x1 = Math.min(x, CW + 40);
        const ln = (ya, yb, c1, c2, w1, w2) => { kk.strokeStyle = c1; kk.lineWidth = w1; kk.beginPath(); kk.moveTo(x0, ya); kk.lineTo(x1, ya); kk.stroke(); kk.strokeStyle = c2; kk.lineWidth = w2; kk.beginPath(); kk.moveTo(x0, yb); kk.lineTo(x1, yb); kk.stroke(); };
        ln(145, 149, '#FF5B4D', '#FF8A6E', 2.6, 1.4);
        // 反対車線の車たちの跡（画面いっぱい）
        for (const [y, c, lw] of [[135, '#FFE9B8', 2.6], [138.5, BASE.lit, 1.6], [141.5, '#FFE9B8', 1.2]]) { kk.strokeStyle = c; kk.lineWidth = lw; kk.beginPath(); kk.moveTo(-10, y); kk.lineTo(CW + 10, y); kk.stroke(); }
        kk.restore();
      }
    });
    // 車の本体は露光が長いほど薄く写る
    k.save(); k.globalAlpha = 1 - 0.9 * a; const D = pen(k);
    car(D, x, p, { head: BASE.lit, tail: '#FF5B4D' }); k.restore();
    figure(pen(k), FIG[0], FIG[1], FIG[2], p.person);
    hud(k, a > 0.5 ? '8″' : '1/250');
  });

  // @element 12
  // 流し撮り: 走る車を追ってカメラを振ると、車はくっきり、背景だけ横に流れる
  CELLS[11] = cell((k, u) => {
    const a = env(u);
    const drive = lerp(-80, 620, u / CYC), x = lerp(drive, 270 + 10 * Math.sin(u / CYC * TAU), a);
    const S = 46 * a, n = S < 0.5 ? 1 : 12;
    for (let i = 0; i < n; i++) {   // 背景を横にずらして重ね、平均をとる（流れ）
      k.save(); k.globalAlpha = 1 / (i + 1); k.translate(n > 1 ? lerp(-S / 2, S / 2, i / (n - 1)) : 0, 0); stageStreet(k, BASE, { car: false, person: false }); k.restore();
    }
    const D = pen(k); car(D, x, BASE, { head: BASE.lit });
    // 車輪の回転（1周に12回転＝継ぎ目なし）
    k.save(); k.strokeStyle = BASE.tire; k.lineWidth = 1.6;
    for (const wx of [x - 21, x + 21]) { const t = u / CYC * TAU * 12; k.beginPath(); k.moveTo(wx - Math.cos(t) * 5, 156 - Math.sin(t) * 5); k.lineTo(wx + Math.cos(t) * 5, 156 + Math.sin(t) * 5); k.stroke(); }
    k.restore();
    hud(k, a > 0.5 ? '1/15' : '1/1000');
  });

  // @element 13
  // レンズフレア: 建物の陰から太陽が出ると、画面の中心をはさんで反対側へ光の玉が並ぶ
  CELLS[12] = cell((k, u) => {
    const a = env(u), sx = lerp(428, 474, a), sy = lerp(74, 30, a);
    stageStreet(k, BASE, { sun: [sx, sy, 13, 1] });
    const cx = CW / 2, cy = CH / 2, dx = cx - sx, dy = cy - sy;
    k.save();
    // 太陽の光の筋
    k.globalAlpha = 0.75 * a; k.strokeStyle = BASE.lit; k.lineWidth = 1.6; k.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const t = i / 8 * TAU + 0.2, L = i % 2 ? 26 : 44; k.beginPath(); k.moveTo(sx + Math.cos(t) * 17, sy + Math.sin(t) * 17); k.lineTo(sx + Math.cos(t) * L, sy + Math.sin(t) * L); k.stroke(); }
    // 光の玉: 太陽から中心を通る線の上（t = 0.45〜2.0）
    const G = [[0.45, 7, 'c', 0.6], [0.8, 13, 'h', 0.55], [1.15, 5, 'c', 0.7], [1.45, 22, 'h', 0.4], [1.75, 9, 'c', 0.55], [2.0, 30, 'r', 0.55]];
    for (const [t, r, kind, al] of G) {
      const x = sx + dx * t, y = sy + dy * t;
      k.globalAlpha = al * a;
      if (kind === 'r') { k.strokeStyle = BASE.lit; k.lineWidth = 3; k.beginPath(); k.arc(x, y, r, 0, TAU); k.stroke(); continue; }
      k.fillStyle = kind === 'h' ? BASE.glow : BASE.lit; k.beginPath();
      if (kind === 'h') for (let i = 0; i < 6; i++) { const t2 = i / 6 * TAU; k.lineTo(x + Math.cos(t2) * r, y + Math.sin(t2) * r); } else k.arc(x, y, r, 0, TAU);
      k.closePath(); k.fill();
    }
    k.restore();
  });

  // @element 14
  // 魚眼レンズ: 中心がふくらみ、建物の縦の線が外側へ丸く曲がる
  CELLS[13] = cell((k, u) => {
    const a = env(u), kk = 1.25 * a, cx = CW / 2, cy = CH / 2, R2 = cx * cx + cy * cy;
    const M = kk < 0.002 ? null : (x, y) => { const dx = x - cx, dy = y - cy, g = (1 + kk) / (1 + kk * (dx * dx + dy * dy) / R2); return [cx + dx * g, cy + dy * g]; };
    stageStreet(k, BASE, { M });
    hud(k, `${Math.round(lerp(24, 8, a))}mm`);
  });

  // @element 15
  // 色収差: 赤・緑・青を少しずつ違う大きさで重ね、画面の端ほど縁に赤と青のずれが出る
  CELLS[14] = cell((k, u) => {
    const a = env(u), s = 0.02 * a, cx = CW / 2, cy = CH / 2;
    if (s < 0.0005) { stageStreet(k, BASE); return; }
    const [S, ks] = layer('ca'); stageStreet(ks, BASE);
    k.fillStyle = '#000000'; k.fillRect(0, 0, CW, CH);
    for (const [col, sc] of [['#FF0000', 1 + 2 * s], ['#00FF00', 1 + s], ['#0000FF', 1]]) {
      const [L, kl] = layer('ca-' + col); kl.drawImage(S, 0, 0); kl.globalCompositeOperation = 'multiply'; kl.fillStyle = col; kl.fillRect(0, 0, CW, CH); kl.globalCompositeOperation = 'source-over';
      k.save(); k.globalCompositeOperation = 'lighter'; k.translate(cx, cy); k.scale(sc, sc); k.translate(-cx, -cy); k.drawImage(L, 0, 0); k.restore();
    }
  });

  // @element 16
  // 周辺減光（ビネット）: 四隅だけがなだらかに暗くなり、中央の人物に目が集まる
  CELLS[15] = cell((k, u) => {
    const a = env(u);
    stageStreet(k, BASE);
    // 楕円の放射グラデーション: 半径の45%までは素通し、外へ向かって 0 → 70% の濃さ
    k.save(); k.translate(CW / 2, CH / 2); k.scale(1, CH / CW * 1.35);
    const g = k.createRadialGradient(0, 0, CW * 0.45 * 0.62, 0, 0, CW * 0.62);
    g.addColorStop(0, 'rgba(32,35,43,0)'); g.addColorStop(1, `rgba(32,35,43,${(0.7 * a).toFixed(3)})`);
    k.fillStyle = g; k.fillRect(-CW, -CW, CW * 2, CW * 2); k.restore();
  });

  // @element 17
  // ハイキー: 明るい色だけになり、影はごく薄く、明るさの山が右端へ寄る
  CELLS[16] = cell((k, u) => {
    const a = env(u);
    const HIGH = {
      sky: '#FFFFFF', sky2: '#FFFFFF', far: '#F5F6F8', mid: '#EEF0F3', ground: '#FBFBFA', ground2: '#F3F3F1', mark: '#FFFFFF', cast: '#F3F3F1',
      bld: '#FBFBFA', edge: '#E9E9E7', win: '#F2F2F0', winOff: '#F2F2F0', tree: '#F0F0EE', trunk: '#E5E5E3', post: '#DADAD8', bulb: '#E5E5E3',
      person: '#B9C0CE', shade: '#A6AEBF', lit: '#FFE6AE', car: '#E4E7EC', glass: '#FFFFFF', tire: '#C5CAD3', sun: '#FFD889', glow: '#FFF3D8'
    };
    stageLand(k, pal(BASE, HIGH, a));
    histo(k, lerp(0.56, 0.85, a), lerp(0.2, 0.09, a));
  });

  // @element 18
  // ローキー: 画面の大半が暗く沈み、横からの光が当たる縁だけが浮かぶ
  CELLS[17] = cell((k, u) => {
    const a = env(u);
    const LOW = Object.assign({}, DARK, { sun: DARK.sky, glow: DARK.sky, person: '#25272E', lit: '#FFB547' });
    stageLand(k, pal(BASE, LOW, a));
    histo(k, lerp(0.56, 0.14, a), lerp(0.2, 0.08, a));
  });

  // @element 19
  // モノクロ: 色を抜き、明るさだけで見せる（コントラストを少し強める）
  CELLS[18] = cell((k, u) => {
    const a = env(u);
    const GRAY = mapPal(BASE, c => { const g = clamp((lum(c) - 140) * 1.25 + 140, 0, 255); return toHex([g, g, g]); });
    stageLand(k, pal(BASE, GRAY, a));
  });

  // @element 20
  // デュオトーン: 暗い所を藍、明るい所をピンクの2色だけに置き換える
  CELLS[19] = cell((k, u) => {
    const a = env(u);
    const DUO = mapPal(BASE, c => mixc('#1F2A5C', '#FF9FB2', Math.pow(clamp((lum(c) - 70) / (250 - 70)), 2.4)));
    stageLand(k, pal(BASE, DUO, a));
  });

  // @element 21
  // ティール＆オレンジ: 空と影を青緑、日の当たる肌と太陽を橙に寄せる
  CELLS[20] = cell((k, u) => {
    const a = env(u);
    const TO = {
      sky: '#CFE6E3', sky2: '#B7DAD6', far: '#8CC1BE', mid: '#62A2A1', ground: '#3F8083', ground2: '#2F6A6E', mark: '#CFE6E3', cast: '#2F6A6E',
      bld: '#A8D1CE', edge: '#4E8E8F', win: '#62A2A1', winOff: '#62A2A1', tree: '#2F6A6E', trunk: '#1F5357', post: '#1F5357', bulb: '#1F5357',
      person: '#1D4E53', shade: '#143F43', lit: '#FF9248', car: '#2F6A6E', glass: '#CFE6E3', tire: '#143F43', sun: '#FF8236', glow: '#FFC48C'
    };
    stageLand(k, pal(BASE, TO, a));
  });

  // @element 22
  // フィルムグレイン: 細かい粒子が全体に乗り、全体が少し暖かい色に寄る
  CELLS[21] = cell((k, u) => {
    const a = env(u);
    const FILM = mapPal(BASE, c => mixc(c, '#F2DDBE', 0.16));
    const p = pal(BASE, FILM, a);
    const G = once('grain', () => { const r = rng(22), o = []; for (let i = 0; i < 2600; i++) o.push([r() * CW, r() * CH, 0.8 + r() * 0.9, r() < 0.55 ? 0 : 1, 0.16 + r() * 0.22]); return o; });
    const grain = kk => { kk.save(); for (const [x, y, s, d, al] of G) { kk.globalAlpha = al * a; kk.fillStyle = d ? '#FFFFFF' : '#3A3530'; kk.fillRect(x, y, s, s); } kk.restore(); };
    stageLand(k, p); grain(k);
  });

  // @element 23
  // ライトリーク: 右端から、フィルムに光がもれたような赤と橙のにじみが帯になって入る
  CELLS[22] = cell((k, u) => {
    const a = env(u), w = Math.sin(u / CYC * TAU);
    stageLand(k, BASE);
    k.save();
    // 縦長の楕円を右端の外に中心を置いて重ねる（外ほど淡い黄、端ほど赤）
    const band = (rx, col, al) => { k.globalAlpha = al * a; k.fillStyle = col; k.beginPath(); k.ellipse(CW + 30 + 6 * w, CH / 2, rx * a, CH * 1.1, 0, 0, TAU); k.fill(); };
    band(250, '#FFD089', 0.35); band(170, '#FF9A3D', 0.4); band(95, '#FF5A3A', 0.45); band(45, '#FF3B30', 0.5);
    k.restore();
  });

  // @element 24
  // 二重露光: 背景が白く飛び、胸像の形の中にだけ丘と家と木と太陽が写り込む
  CELLS[23] = cell((k, u) => {
    const a = env(u);
    const DX = Object.assign({}, BASE, { sky: '#D3DBE6', sky2: '#D3DBE6', far: '#9AA8BD', mid: '#76869F', ground: '#55647E', bld: '#E8ECF2', edge: '#55647E', win: '#9AA8BD', winOff: '#9AA8BD', tree: '#3F4C66', trunk: '#3F4C66' });
    const draw = kk => {
      kk.fillStyle = '#FFFFFF'; kk.fillRect(0, 0, CW, CH);
      kk.save(); bustPath(kk, QX, QY, QR); kk.clip();
      // 風景を0.7倍にして、太陽が頭の右上、丘の稜線が首のあたりに来るように置く
      kk.translate(QX, QY); kk.scale(0.7, 0.7); kk.translate(-415, -77);
      kk.fillStyle = DX.sky; kk.fillRect(0, -200, CW * 2, CH * 3);
      stageLand(kk, DX, { person: false });
      kk.fillStyle = DX.ground; kk.fillRect(-CW, 200, CW * 3, CH * 3);
      kk.restore();
    };
    if (a >= 0.999) { draw(k); return; }   // 効果が入りきったら直接描く（拡大表示でも輪郭がくっきり）
    stageLand(k, BASE);
    if (a < 0.002) return;
    const [L, kl] = layer('dx'); draw(kl);   // 入り・戻りの途中は、別の面に描いて重ねる
    k.save(); k.globalAlpha = a; k.drawImage(L, 0, 0); k.restore();
  });

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});

/* Motion Prompt · pack "motion2" · MIT License (c) 2026 Shohei Ohtaki · https://github.com/showheyohtaki/motion-prompt */
MotionPrompt.pack('motion2', function () {
  // @kit
  // モーショングラフィックスの演出の名前 第2弾 24（各カード 539x208・4.7秒周期。各コマは時間 u の純関数）
  // カードの中だけ共通パレット（濃紺の地＋青・コーラル・黄・ミント）。第1弾（motion）と同じ見た目。
  const CW = 539, CH = 208;
  const CYC = 4.7;                          // 各カードは4.7秒周期（ループの継ぎ目なし）
  const C = {
    navy: '#0F1A3D', navy2: '#1B2A5E', navy3: '#2A3D80', dim: '#7F90C4',
    blue: '#3B7BFF', coral: '#FF6B5C', yel: '#FFC83D', mint: '#2EDBA8', white: '#FFFFFF', cream: '#FFF1D6'
  };
  const PAL = [C.blue, C.coral, C.yel, C.mint];
  const JP = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif';
  const DISP = '"Avenir Next", "Helvetica Neue", system-ui, sans-serif';
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const eIO = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eIOs = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eOut5 = x => 1 - Math.pow(1 - x, 5);
  const eIn = x => x * x * x;
  const smooth = x => x * x * (3 - 2 * x);
  const mod = (a, n) => ((a % n) + n) % n;
  const backOut = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
  const backIn = (x, s = 1.70158) => (s + 1) * x * x * x - s * x * x;
  const spring = (t, w = 14, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(w * t);   // 0→行き過ぎ→1
  function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function txt(ctx, s, x, y, font, col, align = 'left', base = 'alphabetic', ls = '0px') {
    ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align; ctx.textBaseline = base; ctx.letterSpacing = ls; ctx.fillText(s, x, y); ctx.letterSpacing = '0px';
  }
  function tw(ctx, s, font, ls = '0px') { ctx.font = font; ctx.letterSpacing = ls; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
  function rand(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return `rgb(${Math.round(lerp(A[0], B[0], t))},${Math.round(lerp(A[1], B[1], t))},${Math.round(lerp(A[2], B[2], t))})`; }
  function star(k, x, y, R, rot = 0, inner = 0.5, n = 5) { k.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? R * inner : R, a = rot - Math.PI / 2 + i * Math.PI / n; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? k.lineTo(px, py) : k.moveTo(px, py); } k.closePath(); }
  function heartPath(k, s) { k.beginPath(); k.moveTo(0, s * 0.92); k.bezierCurveTo(-s * 1.75, -s * 0.12, -s * 0.85, -s * 1.2, 0, -s * 0.42); k.bezierCurveTo(s * 0.85, -s * 1.2, s * 1.75, -s * 0.12, 0, s * 0.92); k.closePath(); }
  // 整数→0..1 の決まった乱数（コマ番号ごとの揺れ・入れ替わりに使う。描画時の Math.random は使わない）
  // 浮動小数の誤差で周期の終わり（4.6999…）と始まり（0）が別のコマ扱いになるのを防ぐ
  const snapU = u => mod(Math.round(u * 1e6) / 1e6, CYC);
  function H01(n) { n = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  const TMP = mkCanvas(CW, CH), TK = TMP.getContext('2d');
  function stage(k, col = C.navy) { k.fillStyle = col; k.fillRect(0, 0, CW, CH); }
  function chars(k, s, font, ls = 0) { k.font = font; const ws = [...s].map(ch => k.measureText(ch).width + ls); const tot = ws.reduce((a, b) => a + b, 0) - ls; let x = -tot / 2; return [...s].map((ch, i) => { const o = { ch, x: x + (ws[i] - ls) / 2, w: ws[i] - ls }; x += ws[i]; return o; }); }
  function pathLen(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
  function ptAt(pts, cum, f) { const L = cum[cum.length - 1] * clamp(f); let i = 1; while (i < cum.length - 1 && cum[i] < L) i++; const t = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
  const CELLS = [];

  // @element 01
  // 01 アンティシペーション（進む向きと逆へ少し引いて、つぶれて溜めてから、勢いよく飛び出す）
  CELLS[0] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const XL = 108, XR = w - 108, xs = dir > 0 ? XL : XR, xe = dir > 0 ? XR : XL, floor = h - 30, S = 86, BACK = 44;
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    const wind = eIOs(P(lu, 0.2, 0.95)), go = P(lu, 0.95, 1.38);
    let x, sx = 1, sy = 1, rot = 0;
    if (go <= 0) { x = xs - dir * BACK * wind; sx = 1 + 0.22 * wind; sy = 1 - 0.24 * wind; rot = -dir * 0.18 * wind; }
    else {
      x = lerp(xs - dir * BACK, xe, backOut(go, 1.1));
      const st = go < 0.6 ? Math.sin(Math.PI * go / 0.6) : 0;
      sx = 1 + 0.55 * st; sy = 1 - 0.28 * st; rot = dir * 0.08 * st;
      const land = lu - 1.38; if (land > 0) { const wob = 0.13 * Math.exp(-7 * land) * Math.sin(17 * land); sy = 1 - wob; sx = 1 + wob; }
    }
    // 飛び出した地点の土けむり
    if (go > 0 && go < 0.7) { const q = go / 0.7; k.fillStyle = C.dim; k.globalAlpha = 0.8 * (1 - q); for (let i = 0; i < 3; i++) { k.beginPath(); k.arc(xs - dir * (BACK + 30 + i * 22 + q * 30), floor - 8 - i * 6 - q * 10, 7 + q * 12 - i * 2, 0, 7); k.fill(); } k.globalAlpha = 1; }
    // 影
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, S * 0.62 * sx, 6, 0, 0, 7); k.fill();
    // スピード線
    if (go > 0.02 && go < 0.8) { const a = 1 - go / 0.8; k.strokeStyle = C.yel; k.lineCap = 'round'; k.lineWidth = 8; k.globalAlpha = a;[0.28, 0.55, 0.8].forEach((f, i) => { const y = floor - S * sy * f, x0 = x - dir * (S * sx / 2 + 12), L = 120 * a + 20; k.beginPath(); k.moveTo(x0, y); k.lineTo(x0 - dir * L * (i === 1 ? 1 : 0.7), y); k.stroke(); }); k.globalAlpha = 1; }
    k.save(); k.translate(x, floor); k.rotate(rot); k.scale(sx, sy);
    k.fillStyle = C.coral; rr(k, -S / 2, -S, S, S, 24); k.fill();
    k.fillStyle = 'rgba(255,255,255,.16)'; rr(k, -S / 2, -S, S, S / 2, [24, 24, 0, 0]); k.fill();
    k.strokeStyle = '#fff'; k.lineWidth = 10; k.lineCap = 'round'; k.lineJoin = 'round';
    k.beginPath(); k.moveTo(-dir * 12, -S / 2 - 20); k.lineTo(dir * 12, -S / 2); k.lineTo(-dir * 12, -S / 2 + 20); k.stroke();
    k.restore();
  };

  // @element 02
  // 02 フォロースルー（体が止まった後も、旗としっぽだけが遅れて揺れて収まる）
  const FTAB = (() => {
    const T = CYC / 2, dt = 1 / 600, N = Math.ceil(T / dt) + 2, D = CW - 2 * 118;
    const pos = lu => { const q = P(lu, 0.15, 0.85), c = 1 / 0.85; return (q < 0.3 ? q * q / 0.6 : 0.15 + (q - 0.3)) * c; };
    const A = new Float32Array(N), B = new Float32Array(N);
    let a = 0, va = 0, b = 0, vb = 0, xp = 0, vp = 0;
    for (let i = 0; i < N; i++) {
      const lu = i * dt, x = pos(lu) * D, v = (x - xp) / dt, acc = i ? (v - vp) / dt : 0; xp = x; vp = v;
      va += (-121 * a - 5.5 * va - acc * 0.0175) * dt; a += va * dt;
      vb += (-56 * b - 2.8 * vb - acc * 0.012) * dt; b += vb * dt;
      const fade = 1 - smooth(P(lu, T - 0.3, T)); A[i] = a * fade; B[i] = b * fade;
    }
    return { A, B, pos, D };
  })();
  CELLS[1] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, dir = n % 2 ? -1 : 1;
    const i = Math.min(FTAB.A.length - 1, Math.round(lu * 600)), q = FTAB.pos(lu);
    const xs = dir > 0 ? 118 : w - 118, x = xs + dir * q * FTAB.D;
    const floor = h - 26, R = 38, cy = floor - R, a = dir * FTAB.A[i];
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(x, floor + 8, R * 1.1, 6, 0, 0, 7); k.fill();
    // 滑っている間のスピード線
    const moving = lu > 0.2 && lu < 0.85;
    if (moving) { k.strokeStyle = C.dim; k.lineCap = 'round'; k.lineWidth = 6; k.globalAlpha = 0.7;[[-18, 70], [6, 100], [26, 56]].forEach(([dy, L]) => { const x0 = x - dir * (R + 30); k.beginPath(); k.moveTo(x0, cy + dy); k.lineTo(x0 - dir * L, cy + dy); k.stroke(); }); k.globalAlpha = 1; }
    // しっぽ（体の後ろ）
    let px = x - dir * (R - 8), py = cy + 10; const pts = [[px, py]];
    for (let j = 1; j <= 7; j++) {
      const ij = Math.max(0, i - j * 22), d = FTAB.B[ij] * (0.55 + j * 0.16), ang0 = Math.PI + 0.25 + d;
      const ang = dir > 0 ? ang0 : Math.PI - ang0; px += Math.cos(ang) * 14; py += Math.sin(ang) * 14; pts.push([px, py]);
    }
    k.lineCap = 'round'; k.lineJoin = 'round'; k.strokeStyle = C.coral;
    for (let j = 1; j < pts.length; j++) { k.lineWidth = lerp(14, 6, j / pts.length); k.beginPath(); k.moveTo(pts[j - 1][0], pts[j - 1][1]); k.lineTo(pts[j][0], pts[j][1]); k.stroke(); }
    k.fillStyle = C.coral; k.beginPath(); k.arc(px, py, 9, 0, 7); k.fill();
    // 体
    k.fillStyle = C.mint; k.beginPath(); k.arc(x, cy, R, 0, 7); k.fill();
    k.fillStyle = 'rgba(255,255,255,.18)'; k.beginPath(); k.arc(x - 10, cy - 12, R * 0.55, 0, 7); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + dir * 16, cy - 6, 9, 0, 7); k.fill();
    k.fillStyle = C.navy; k.beginPath(); k.arc(x + dir * 19, cy - 6, 4.5, 0, 7); k.fill();
    // アンテナの旗
    const L = 58, top = cy - R + 4;
    k.save(); k.translate(x, top); k.rotate(a);
    k.strokeStyle = '#fff'; k.lineWidth = 5; k.beginPath(); k.moveTo(0, 0); k.lineTo(0, -L); k.stroke();
    k.rotate(a * 0.6);
    k.fillStyle = C.yel; k.beginPath(); k.moveTo(0, -L); k.quadraticCurveTo(-dir * 22, -L + 4 + 8 * a * dir, -dir * 44, -L + 12); k.lineTo(0, -L + 28); k.closePath(); k.fill();
    k.restore();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(x + Math.sin(a) * L, top - Math.cos(a) * L, 6, 0, 7); k.fill();
  };

  // @element 03
  // 03 バウンス（ボールが落ちて、だんだん低く弾みながら止まる）
  const BNC = (() => { const g = 1900, e = 0.56, d = 190, t0 = Math.sqrt(2 * d / g), v0 = g * t0; const segs = []; let t = t0, v = v0 * e; while (v > 35) { segs.push({ t, v }); t += 2 * v / g; v *= e; } const imp = [{ t: t0, v: v0 }]; segs.forEach((s, i) => { if (i) imp.push({ t: s.t, v: segs[i - 1].v }); }); return { g, d, t0, segs, imp, end: t }; })();
  function bounceH(t) { const B = BNC; if (t < B.t0) return B.d - 0.5 * B.g * Math.max(0, t) * Math.max(0, t) * (t < 0 ? 0 : 1); for (const s of B.segs) { const tau = t - s.t; if (tau >= 0 && tau < 2 * s.v / B.g) return s.v * tau - 0.5 * B.g * tau * tau; } return 0; }
  CELLS[2] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, t = lu - 0.1;
    const floor = h - 26, R = 26, rest = floor - R, x = lerp(150, 390, eOut(P(lu, 0.1, 1.8)));
    const hg = t < 0 ? BNC.d : bounceH(t), out = 1 - backIn(P(lu, 1.95, 2.25), 2);
    k.fillStyle = C.navy3; rr(k, 26, floor, w - 52, 5, 2.5); k.fill();
    // 着地の印
    let sq = 0;
    for (const im of BNC.imp) {
      const dtI = t - im.t;
      if (Math.abs(dtI) < 0.045) sq = Math.max(sq, clamp(im.v / 850) * 0.4 * (1 - Math.abs(dtI) / 0.045));
      if (dtI > 0 && dtI < 0.3 && im.v > 200) { const q = dtI / 0.3, ix = lerp(150, 390, eOut(P(im.t + 0.1, 0.1, 1.8))); k.strokeStyle = '#fff'; k.globalAlpha = 1 - q; k.lineWidth = 5; k.lineCap = 'round';[-1, 1].forEach(s => { k.beginPath(); k.moveTo(ix + s * (34 + 14 * q), floor - 6 - 8 * q); k.lineTo(ix + s * (48 + 22 * q), floor - 16 - 14 * q); k.stroke(); }); k.globalAlpha = 1; }
    }
    const sh = clamp(1 - hg / BNC.d);
    k.fillStyle = 'rgba(0,0,0,.32)'; k.beginPath(); k.ellipse(x, floor + 7, R * (0.4 + 0.8 * sh) * out, 5 * (0.4 + 0.6 * sh) * out, 0, 0, 7); k.fill();
    if (out > 0.01) {
      k.save(); k.translate(x, rest - hg + R); k.scale((1 + sq) * out, (1 - sq) * out);
      k.fillStyle = n ? C.coral : C.yel; k.beginPath(); k.arc(0, -R, R, 0, 7); k.fill();
      k.fillStyle = 'rgba(255,255,255,.7)'; k.beginPath(); k.ellipse(-9, -R - 9, 8, 5, -0.6, 0, 7); k.fill();
      k.restore();
    }
  };

  // @element 04
  // 04 ウィグル（ベルが、小刻みに不規則に揺れ続ける。1回の衝撃ではなく、ずっと続く細かい揺れ）
  const WGF = 2 * Math.PI / CYC;
  const wsum = (u, arr) => arr.reduce((s, [kk, am, ph]) => s + am * Math.sin(WGF * kk * u + ph), 0);
  CELLS[3] = (k, w, h, u) => {
    stage(k);
    const rot = wsum(u, [[23, 0.085, 0.3], [31, 0.065, 1.9], [43, 0.05, 4.2], [59, 0.035, 2.6]]);
    const dx = wsum(u, [[29, 4, 0.7], [47, 3, 3.1], [61, 2, 5.0]]), dy = wsum(u, [[37, 2.4, 2.2], [53, 1.8, 0.4]]);
    const X = w / 2 + dx, Y = 34 + dy;
    // 両わきの振動の線（揺れているあいだ、ずっと出ている）
    k.strokeStyle = '#fff'; k.lineCap = 'round'; k.lineWidth = 6;
    [[86, 0.85], [110, 0.5]].forEach(([r, al], j) => { const fl = 0.55 + 0.45 * Math.abs(Math.sin(WGF * (41 + j * 12) * u)); k.globalAlpha = al * fl;[0, Math.PI].forEach(base => { k.beginPath(); k.arc(w / 2, 104, r, base - 0.42, base + 0.42); k.stroke(); }); });
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.rotate(rot);
    // 舌（ベルと逆にふれる）
    k.fillStyle = C.coral; k.beginPath(); k.arc(-rot * 70, 128, 13, 0, 7); k.fill();
    k.fillStyle = C.yel;
    k.beginPath(); k.arc(0, 8, 10, 0, 7); k.fill();
    k.beginPath(); k.moveTo(-50, 112); k.quadraticCurveTo(-42, 100, -42, 76); k.bezierCurveTo(-42, 36, -22, 18, 0, 18); k.bezierCurveTo(22, 18, 42, 36, 42, 76); k.quadraticCurveTo(42, 100, 50, 112); k.closePath(); k.fill();
    rr(k, -60, 106, 120, 16, 8); k.fill();
    k.fillStyle = 'rgba(255,255,255,.35)'; rr(k, -28, 40, 12, 50, 6); k.fill();
    k.restore();
  };

  // @element 05
  // 05 パルス（ハートが鼓動のように、ドクン・ドクンと大きさを脈打たせる）
  CELLS[4] = (k, w, h, u) => {
    stage(k);
    const T = CYC / 4, lu = mod(u, T), X = w / 2, Y = h / 2 + 10;
    const g = (c, s) => Math.exp(-Math.pow((lu - c) / s, 2));
    const b = 0.26 * g(0.2, 0.065) + 0.15 * g(0.44, 0.07) + 0.26 * Math.exp(-Math.pow((lu - T - 0.2) / 0.065, 2));
    for (const [t0, s] of [[0.16, 1], [0.4, 0.6]]) {
      const q = P(lu, t0, t0 + 0.8); if (q <= 0 || q >= 1) continue;
      k.save(); k.translate(X, Y); const sc = 1.2 + 1.2 * eOut(q); k.scale(sc, sc); heartPath(k, 44);
      k.strokeStyle = C.coral; k.globalAlpha = (1 - q) * 0.75 * s; k.lineWidth = (7 * (1 - q) + 1.5) / sc; k.stroke(); k.restore();
    }
    k.globalAlpha = 1;
    k.save(); k.translate(X, Y); k.scale(1 + b, 1 + b); heartPath(k, 44); k.fillStyle = C.coral; k.fill();
    k.fillStyle = 'rgba(255,255,255,.75)'; k.beginPath(); k.ellipse(-30, -28, 9, 6, -0.7, 0, 7); k.fill(); k.restore();
  };

  // @element 06
  // 06 モーションパス（点線の道に沿って、紙飛行機が向きを変えながら進む）
  const MPX = th => 270 + 112 * th - 150 * Math.sin(th), MPY = th => 106 - 74 * Math.cos(th);
  const MP = (() => { const pts = []; for (let i = 0; i <= 400; i++) { const th = -Math.PI + 2 * Math.PI * i / 400; pts.push([MPX(th), MPY(th)]); } return pts; })();
  CELLS[5] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([2, 15]); k.lineCap = 'round'; k.strokeStyle = C.dim; k.lineWidth = 6; k.beginPath(); MP.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.stroke(); k.restore();
    const th = -Math.PI + 2 * Math.PI * (u / CYC);
    // 通ったあとの線
    k.lineCap = 'round';
    for (let j = 0; j < 24; j++) { const a = th - j * 0.03, b = th - (j + 1) * 0.03; k.strokeStyle = C.mint; k.globalAlpha = 0.9 * (1 - j / 24); k.lineWidth = 7 * (1 - j / 30); k.beginPath(); k.moveTo(MPX(a), MPY(a)); k.lineTo(MPX(b), MPY(b)); k.stroke(); }
    k.globalAlpha = 1;
    const x = MPX(th), y = MPY(th), ang = Math.atan2(74 * Math.sin(th), 112 - 150 * Math.cos(th));
    k.save(); k.translate(x, y); k.rotate(ang);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, -22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#C9D6FF'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-22, 22); k.lineTo(-12, 0); k.closePath(); k.fill();
    k.fillStyle = '#9FB3F0'; k.beginPath(); k.moveTo(32, 0); k.lineTo(-12, 0); k.lineTo(-6, 9); k.closePath(); k.fill();
    k.restore();
  };

  // @element 07
  // 07 ピンポンループ（端まで行ったら、同じ道を逆再生のように戻ってくる。往復をくり返す）
  CELLS[6] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const q = u / CYC, fwd = q < 0.5, g = fwd ? 2 * q : 2 - 2 * q, X0 = 92, X1 = w - 92, base = 136, S = 48;
    const pos = gg => [lerp(X0, X1, gg), base - 62 * Math.abs(Math.sin(3 * Math.PI * gg))];
    k.save(); k.setLineDash([2, 12]); k.lineCap = 'round'; k.strokeStyle = C.navy3; k.lineWidth = 5; k.beginPath();
    for (let i = 0; i <= 150; i++) { const [px, py] = pos(i / 150); i ? k.lineTo(px, py - S / 2) : k.moveTo(px, py - S / 2); } k.stroke(); k.restore();
    k.fillStyle = C.navy3; rr(k, X0 - 40, base + 2, X1 - X0 + 80, 5, 2.5); k.fill();
    // 両端の折り返し点
    [X0, X1].forEach(xx => { k.fillStyle = C.navy3; rr(k, xx - 4, base - 70, 8, 72, 4); k.fill(); });
    // 残像
    for (let j = 4; j >= 1; j--) { const qq = mod(u - j * 0.045, CYC) / CYC, gg = qq < 0.5 ? 2 * qq : 2 - 2 * qq, [gx, gy] = pos(gg); k.globalAlpha = 0.1 * (5 - j); k.fillStyle = C.mint; k.save(); k.translate(gx, gy - S / 2); k.rotate(gg * Math.PI * 2); rr(k, -S / 2, -S / 2, S, S, 13); k.fill(); k.restore(); }
    k.globalAlpha = 1;
    const [x, y] = pos(g);
    k.save(); k.translate(x, y - S / 2); k.rotate(g * Math.PI * 2);
    k.fillStyle = C.mint; rr(k, -S / 2, -S / 2, S, S, 13); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(S / 2 - 13, -S / 2 + 13, 6.5, 0, 7); k.fill();
    k.restore();
    // 再生バー
    const ty = 184, tx0 = 196, tx1 = w - 34;
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, 22, ty - 20, 158, 40, 20); k.fill();
    txt(k, fwd ? '▶ 再生' : '◀ 逆再生', 101, ty + 1, `800 25px ${JP}`, '#fff', 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, tx0, ty - 5, tx1 - tx0, 10, 5); k.fill();
    k.fillStyle = fwd ? C.blue : C.coral; rr(k, tx0, ty - 5, Math.max(10, (tx1 - tx0) * g), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(tx0 + (tx1 - tx0) * g, ty, 12, 0, 7); k.fill();
  };

  // @element 08
  // 08 ストップモーション風（1秒8コマのカクカクした動き。コマごとに位置が少しずつぶれる）
  CELLS[7] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    k.fillStyle = '#0A1230'; k.fillRect(0, 0, w, 26); k.fillRect(0, h - 26, w, 26);
    k.fillStyle = C.navy3; for (let x = 12; x < w; x += 34) { rr(k, x, 8, 18, 11, 3); k.fill(); rr(k, x, h - 19, 18, 11, 3); k.fill(); }
    const NS = 38, st = CYC / NS, fi = Math.floor(u / st), floor = h - 44;
    const pose = f => { const t = f / NS, j = i => H01(f * 7919 + i * 131 + 77) - 0.5; return { x: lerp(-44, w + 44, t) + j(1) * 10, y: floor - 36 - 54 * Math.abs(Math.sin(t * Math.PI * 3)) + j(2) * 9, r: t * Math.PI * 4 + j(3) * 0.3, s: 1 + j(4) * 0.1 }; };
    const draw = (p, a) => {
      k.globalAlpha = a;
      k.save(); k.translate(p.x + 5, p.y + 6); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = 'rgba(0,0,0,.35)'; star(k, 0, 0, 38, 0, 0.5); k.fill(); k.restore();
      k.save(); k.translate(p.x, p.y); k.rotate(p.r); k.scale(p.s, p.s); k.fillStyle = C.yel; star(k, 0, 0, 38, 0, 0.5); k.fill();
      k.fillStyle = C.coral; k.beginPath(); k.arc(0, 2, 9, 0, 7); k.fill(); k.restore();
      k.globalAlpha = 1;
    };
    draw(pose(mod(fi - 2, NS)), 0.12); draw(pose(mod(fi - 1, NS)), 0.28);
    const p = pose(fi);
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(p.x, floor + 6, 30, 5, 0, 0, 7); k.fill();
    draw(p, 1);
    // 1秒あたりのコマ数
    txt(k, '8コマ/秒', w - 16, 50, `800 24px ${JP}`, C.dim, 'right', 'middle');
  };


  // @element 09
  // 09 テキストスクランブル（ランダムな文字が入れ替わり続け、左から順に正しい単語に決まる）
  const SCR_GL = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&@?';
  CELLS[8] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const T = CYC / 2, n = Math.floor(u / T), lu = u - n * T, word = n ? 'WORLD' : 'HELLO', N = 5;
    const f = `700 92px Menlo, "SF Mono", monospace`; k.font = f;
    const cw = k.measureText('M').width + 16, x0 = w / 2 - cw * (N - 1) / 2, Y = h / 2 - 8;
    const step = Math.floor(u / (CYC / 76));
    for (let i = 0; i < N; i++) {
      const tl = 0.45 + i * 0.18, tu = 1.85 + (N - 1 - i) * 0.08, locked = lu >= tl && lu < tu;
      let ch, col, sc = 1;
      if (locked) { ch = word[i]; const age = lu - tl; col = age < 0.22 ? C.yel : '#fff'; sc = 1 + 0.2 * Math.exp(-age * 14); }
      else { ch = SCR_GL[Math.floor(H01(step * 131 + i * 977 + n * 31) * SCR_GL.length)]; col = C.mint; }
      k.save(); k.translate(x0 + i * cw, Y); k.scale(sc, sc); k.globalAlpha = locked ? 1 : 0.75; txt(k, ch, 0, 0, f, col, 'center', 'middle'); k.restore();
      const next = !locked && lu < tl && (i === 0 || lu >= 0.45 + (i - 1) * 0.18);
      k.fillStyle = locked ? C.blue : next ? C.yel : C.navy3; rr(k, x0 + i * cw - cw / 2 + 8, Y + 58, cw - 16, 8, 4); k.fill();
    }
  };

  // @element 10
  // 10 ウェーブテキスト（1文字ずつ、波のように順に上下する）
  CELLS[9] = (k, w, h, u) => {
    stage(k);
    const f = `800 70px ${DISP}`, cs = chars(k, 'WAVE TEXT', f, 4), Y = h / 2 + 2, ph = 2 * Math.PI * 3 * u / CYC;
    cs.forEach((c, i) => {
      if (c.ch === ' ') return;
      const s = Math.sin(ph - i * 0.62), y = -28 * s;
      k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(w / 2 + c.x, Y + 62, c.w * (0.42 - 0.12 * s), 4, 0, 0, 7); k.fill();
      k.save(); k.translate(w / 2 + c.x, Y + y); k.scale(1, 1 + 0.06 * s); txt(k, c.ch, 0, 0, f, mix('#FFFFFF', C.yel, clamp(s)), 'center', 'middle'); k.restore();
    });
  };

  // @element 11
  // 11 テキストオンパス（文字列が、波打つ線に沿って流れていく）
  const TOP = (() => { const pts = []; for (let x = -70; x <= CW + 70; x += 4) pts.push([x, 118 + 42 * Math.sin(x * 2 * Math.PI / 330 + 0.6)]); return { pts, cum: pathLen(pts) }; })();
  CELLS[10] = (k, w, h, u) => {
    stage(k);
    k.save(); k.setLineDash([14, 10]); k.strokeStyle = C.navy3; k.lineWidth = 5; k.lineCap = 'round'; k.beginPath(); TOP.pts.forEach((p, i) => i ? k.lineTo(p[0], p[1] + 6) : k.moveTo(p[0], p[1] + 6)); k.stroke(); k.restore();
    const f = `800 42px ${DISP}`, S = 'ALONG THE LINE • '; k.font = f;
    const ws = [...S].map(ch => k.measureText(ch).width + 2), run = ws.reduce((a, b) => a + b, 0), L = TOP.cum[TOP.cum.length - 1], shift = (u / CYC) * run;
    for (let r = -2; r * run + shift < L; r++) {
      let s = r * run + shift;
      [...S].forEach((ch, j) => {
        const c = s + ws[j] / 2; s += ws[j];
        if (c < 0 || c > L || ch === ' ') return;
        const p = ptAt(TOP.pts, TOP.cum, c / L);
        k.save(); k.translate(p[0], p[1]); k.rotate(p[2]); txt(k, ch, 0, 0, f, ch === '•' ? C.yel : '#fff', 'center', 'alphabetic'); k.restore();
      });
    }
  };

  // @element 12
  // 12 可変フォントアニメーション（同じ単語の太さが、細→極太→細となめらかに変わる）
  CELLS[11] = (k, w, h, u) => {
    stage(k);
    const v = 0.5 - 0.5 * Math.cos(2 * Math.PI * 2 * u / CYC), wt = Math.round(100 + 800 * v);
    txt(k, 'MOTION', w / 2, 80, `${wt} 112px system-ui`, '#fff', 'center', 'middle', '2px');
    const x0 = 112, x1 = w - 112, y = 180, kx = x0 + (x1 - x0) * v;
    txt(k, '細', x0 - 34, y + 1, `300 30px ${JP}`, C.dim, 'center', 'middle');
    txt(k, '太', x1 + 34, y + 1, `900 30px ${JP}`, C.dim, 'center', 'middle');
    k.fillStyle = C.navy3; rr(k, x0, y - 5, x1 - x0, 10, 5); k.fill();
    k.fillStyle = C.blue; rr(k, x0, y - 5, Math.max(10, kx - x0), 10, 5); k.fill();
    k.fillStyle = C.yel; k.beginPath(); k.arc(kx, y, 14, 0, 7); k.fill();
    txt(k, String(wt), kx, y - 30, `800 24px ${DISP}`, C.yel, 'center', 'middle');
  };

  // @element 13
  // 13 テキストマスク（太い文字の形にくり抜いて、その中だけに動く景色が見える）
  const G0 = mkCanvas(CW, CH), GK0 = G0.getContext('2d', { willReadFrequently: true });
  function seaPattern(g, w, h, u) {
    g.fillStyle = C.coral; g.fillRect(0, 0, w, h);
    g.fillStyle = C.yel; g.beginPath(); g.arc(w * 0.6, 116 + 6 * Math.sin(2 * Math.PI * u / CYC), 60, 0, 7); g.fill();
    g.fillStyle = C.blue; g.fillRect(0, 116, w, h - 116);
    const off = (u / CYC) * 240; g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round';
    for (let j = 0; j < 4; j++) { const y = 128 + j * 22, d = j % 2 ? -1 : 1; g.beginPath(); for (let x = -20; x <= w + 20; x += 6) { const yy = y + 5 * Math.sin((x + off * d + j * 40) * 2 * Math.PI / 120); x === -20 ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.stroke(); }
    const bx = mod(u / CYC * (w + 160), w + 160) - 80;
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(bx, 46); g.lineTo(bx, 100); g.lineTo(bx + 40, 100); g.closePath(); g.fill();
    g.fillStyle = C.navy; g.beginPath(); g.moveTo(bx - 42, 104); g.lineTo(bx + 52, 104); g.lineTo(bx + 38, 122); g.lineTo(bx - 30, 122); g.closePath(); g.fill();
    g.fillStyle = '#fff';[[60, 40], [320, 30], [470, 56]].forEach(([x, y]) => { const xx = mod(x + u / CYC * 60, w + 80) - 40; g.beginPath(); g.ellipse(xx, y, 30, 11, 0, 0, 7); g.fill(); });
  }
  CELLS[12] = (k, w, h, u) => {
    stage(k);
    let fs = 172; while (fs > 90 && tw(k, 'OCEAN', `900 ${fs}px system-ui`, '2px') > 500) fs -= 2;
    const font = `900 ${fs}px system-ui`, Y = h / 2 + 6;
    const open = smooth(P(u, 3.45, 3.85)) * (1 - smooth(P(u, 4.25, 4.65)));
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h);
    txt(TK, 'OCEAN', w / 2, Y, font, '#fff', 'center', 'middle', '2px');
    GK0.setTransform(1, 0, 0, 1, 0, 0); GK0.globalCompositeOperation = 'source-over'; GK0.clearRect(0, 0, w, h); seaPattern(GK0, w, h, u);
    TK.globalCompositeOperation = 'source-in'; TK.drawImage(G0, 0, 0); TK.globalCompositeOperation = 'source-over';
    k.globalAlpha = 0.12 + 0.88 * open; seaPattern(k, w, h, u); k.globalAlpha = 1;
    k.drawImage(TMP, 0, 0);
    k.font = font; k.textAlign = 'center'; k.textBaseline = 'middle'; k.letterSpacing = '2px'; k.lineJoin = 'round';
    k.strokeStyle = '#fff'; k.lineWidth = 4; k.strokeText('OCEAN', w / 2, Y); k.letterSpacing = '0px';
  };

  // @element 14
  // 14 リピーター（1つの図形が複製されて円に並び、少しずつずれながら回る）
  CELLS[13] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const N = 12, X = w / 2, Y = h / 2, R = 58, spin = 2 * Math.PI * u / CYC;
    const cnt = 1 + (N - 1) * (eIOs(P(u, 0.35, 1.7)) - eIOs(P(u, 3.6, 4.45)));
    for (let i = N - 1; i >= 0; i--) {
      const vis = i === 0 ? 1 : clamp(cnt - i); if (vis <= 0) continue;
      const ang = spin + (i === 0 ? 0 : (i - 1 + eOut(vis))) * 2 * Math.PI / N;
      const pul = (1 + 0.22 * Math.sin(2 * Math.PI * 2 * u / CYC - i * 0.55)) * (0.55 + 0.45 * vis);
      k.save(); k.translate(X + Math.cos(ang) * R, Y + Math.sin(ang) * R); k.rotate(ang + Math.PI / 2); k.scale(pul, pul);
      k.fillStyle = PAL[i % 4]; rr(k, -12, -30, 24, 60, 12); k.fill();
      if (i === 0) { k.strokeStyle = '#fff'; k.lineWidth = 4; rr(k, -12, -30, 24, 60, 12); k.stroke(); }
      k.restore();
    }
    txt(k, '×' + Math.round(cnt), w - 34, 46, `800 40px ${DISP}`, C.yel, 'right', 'middle');
  };

  // @element 15
  // 15 カレイドスコープ（万華鏡のように、8分割の対称な模様が回りながら広がる）
  const KAL = (() => { const R = rand(1515), a = []; for (let i = 0; i < 13; i++) a.push({ r0: R() * 300, th: 0.06 + R() * 0.66, kind: i % 3, col: PAL[i % 4], sz: 0.7 + R() * 0.7, ph: R() * 6 }); return a; })();
  CELLS[14] = (k, w, h, u) => {
    stage(k);
    const X = w / 2, Y = h / 2, RM = 300, rot = (Math.PI / 2) * u / CYC, W8 = Math.PI / 4;
    for (let s = 0; s < 8; s++) {
      k.save(); k.translate(X, Y);
      if (s % 2) { k.rotate(rot + (s + 1) * W8); k.scale(1, -1); } else k.rotate(rot + s * W8);
      k.beginPath(); k.moveTo(0, 0); k.arc(0, 0, RM + 60, -0.006, W8 + 0.006); k.closePath(); k.clip();
      for (const it of KAL) {
        const r = mod(it.r0 + (u / CYC) * RM, RM), th = it.th + 0.08 * Math.sin(2 * Math.PI * u / CYC + it.ph), sz = (5 + r * 0.1) * it.sz;
        const a = smooth(P(r, 0, 30)) * (1 - smooth(P(r, RM - 70, RM))); if (a <= 0) continue;
        k.globalAlpha = a; k.fillStyle = it.col; k.save(); k.translate(Math.cos(th) * r, Math.sin(th) * r); k.rotate(r * 0.02);
        if (it.kind === 0) { k.beginPath(); k.arc(0, 0, sz, 0, 7); k.fill(); }
        else if (it.kind === 1) { k.beginPath(); k.moveTo(0, -sz * 1.2); k.lineTo(sz * 0.8, 0); k.lineTo(0, sz * 1.2); k.lineTo(-sz * 0.8, 0); k.closePath(); k.fill(); }
        else { k.beginPath(); k.moveTo(0, -sz); k.lineTo(sz * 0.95, sz * 0.7); k.lineTo(-sz * 0.95, sz * 0.7); k.closePath(); k.fill(); }
        k.restore();
      }
      k.globalAlpha = 1; k.restore();
    }
    k.fillStyle = '#fff'; star(k, X, Y, 20 + 4 * Math.sin(2 * Math.PI * 2 * u / CYC), rot, 0.5, 8); k.fill();
  };

  // @element 16
  // 16 ラインボイル（手描き風の線の絵が、数コマごとに小刻みに揺らぐ。絵は動かない）
  function densify(pts, closed, step) { const out = [], n = pts.length, m = closed ? n : n - 1; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), c = Math.max(1, Math.round(d / step)); for (let j = 0; j < c; j++) out.push([lerp(a[0], b[0], j / c), lerp(a[1], b[1], j / c)]); } if (!closed) out.push(pts[n - 1]); return out; }
  const LB = (() => {
    const st = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 30 : 70, a = -Math.PI / 2 + i * Math.PI / 5; st.push([150 + Math.cos(a) * r, 112 + Math.sin(a) * r]); }
    const CIR = [[318, 132, 26], [354, 104, 36], [408, 94, 42], [456, 122, 30]], O = [388, 130], cl = [];
    for (let i = 0; i < 96; i++) {
      const a = i / 96 * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a); let tm = 0;
      const tx = dx > 0 ? (470 - O[0]) / dx : dx < 0 ? (310 - O[0]) / dx : 1e9, ty = dy > 0 ? (150 - O[1]) / dy : dy < 0 ? (118 - O[1]) / dy : 1e9; tm = Math.min(tx, ty);
      for (const [ccx, ccy, r] of CIR) { const ox = O[0] - ccx, oy = O[1] - ccy, b = ox * dx + oy * dy, c2 = ox * ox + oy * oy - r * r, D = b * b - c2; if (D >= 0) { const t = -b + Math.sqrt(D); if (t > tm) tm = t; } }
      cl.push([O[0] + dx * tm, O[1] + dy * tm]);
    }
    return [
      { pts: densify(st, true, 13), col: C.yel, closed: true, w: 8 },
      { pts: cl, col: '#fff', closed: true, w: 8 },
      { pts: densify([[248, 44], [266, 62]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[254, 104], [280, 104]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[60, 34], [74, 52]], false, 6), col: C.mint, closed: false, w: 7 },
      { pts: densify([[318, 178], [460, 178]], false, 10), col: C.dim, closed: false, w: 6 },
    ];
  })();
  CELLS[15] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const fi = Math.floor(u / (CYC / 47));
    k.lineCap = 'round'; k.lineJoin = 'round';
    LB.forEach((sh, si) => {
      const q = sh.pts.map((p, j) => [p[0] + (H01(fi * 7919 + j * 131 + si * 17) - 0.5) * 7, p[1] + (H01(fi * 6007 + j * 97 + si * 29 + 5) - 0.5) * 7]);
      k.strokeStyle = sh.col; k.lineWidth = sh.w; k.beginPath();
      const n = q.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      if (sh.closed) { const m0 = mid(q[n - 1], q[0]); k.moveTo(m0[0], m0[1]); for (let j = 0; j < n; j++) { const m = mid(q[j], q[(j + 1) % n]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.closePath(); }
      else { k.moveTo(q[0][0], q[0][1]); for (let j = 1; j < n - 1; j++) { const m = mid(q[j], q[j + 1]); k.quadraticCurveTo(q[j][0], q[j][1], m[0], m[1]); } k.lineTo(q[n - 1][0], q[n - 1][1]); }
      k.stroke();
    });
  };

  // @shared
  // 場面（昼・夜・海・山・街・野原）。同じ絵柄がそろわないよう、カードごとに組み合わせを変える
  const SUN = [112, 104], MOON = [CW - 112, 104];
  function scrA(k, w, h) {
    k.fillStyle = C.cream; k.fillRect(0, 0, w, h);
    k.fillStyle = '#FFD9A8'; k.beginPath(); k.arc(SUN[0], SUN[1], 66, 0, 7); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.arc(SUN[0], SUN[1], 44, 0, 7); k.fill();
    txt(k, 'DAY', 214, h / 2 + 4, `800 96px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.fillStyle = '#fff'; rr(k, 400, 34, 96, 26, 13); k.fill(); rr(k, 430, 20, 50, 26, 13); k.fill();
  }
  function scrB(k, w, h) {
    k.fillStyle = '#16255A'; k.fillRect(0, 0, w, h);
    k.fillStyle = '#fff';[[40, 30, 3], [150, 170, 2.5], [250, 24, 2.5], [330, 180, 3], [500, 30, 2.5], [20, 150, 2]].forEach(s => { k.beginPath(); k.arc(s[0], s[1], s[2], 0, 7); k.fill(); });
    k.fillStyle = C.yel; k.beginPath(); k.arc(MOON[0], MOON[1], 46, 0, 7); k.fill();
    k.fillStyle = '#16255A'; k.beginPath(); k.arc(MOON[0] + 22, MOON[1] - 14, 38, 0, 7); k.fill();
    txt(k, 'NIGHT', 40, h / 2 + 4, `800 88px ${DISP}`, '#fff', 'left', 'middle', '1px');
  }
  function clipX(k, x0, x1, h) { k.beginPath(); k.rect(x0, 0, x1 - x0, h); k.clip(); }
  function pnSea(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#CFE0FF'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c + 120, 54, 30, 0, 7); k.fill();
    k.fillStyle = C.blue; k.fillRect(x0, 126, x1 - x0, h - 126);
    const off = (t / CYC) * 200; k.strokeStyle = '#fff'; k.lineWidth = 6; k.lineCap = 'round';
    for (let j = 0; j < 3; j++) { const y = 146 + j * 22; k.beginPath(); for (let x = x0 - 10; x <= x1 + 10; x += 6) { const yy = y + 4 * Math.sin((x + off * (j % 2 ? -1 : 1) + j * 30) * 2 * Math.PI / 100); x === x0 - 10 ? k.moveTo(x, yy) : k.lineTo(x, yy); } k.stroke(); }
    const bx = c + 26 * Math.sin(2 * Math.PI * t / CYC) + (label ? 110 : 0), by = 124 + 3 * Math.sin(2 * Math.PI * 3 * t / CYC);
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(bx, by - 62); k.lineTo(bx, by - 8); k.lineTo(bx + 42, by - 8); k.closePath(); k.fill();
    k.fillStyle = C.coral; k.beginPath(); k.moveTo(bx - 40, by - 4); k.lineTo(bx + 50, by - 4); k.lineTo(bx + 36, by + 14); k.lineTo(bx - 28, by + 14); k.closePath(); k.fill();
    if (label) txt(k, 'SEA', x0 + 30, 82, `800 76px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  function pnMtn(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#FFE1DA'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = C.yel; k.beginPath(); k.arc(c - 30, 112, 34, 0, 7); k.fill();
    const tri = (a, px, py, b, col) => { k.fillStyle = col; k.beginPath(); k.moveTo(a, h); k.lineTo(px, py); k.lineTo(b, h); k.closePath(); k.fill(); };
    const snow = (a, px, py, b, f) => { const L = lerp(px, a, f), R = lerp(px, b, f), y = lerp(py, h, f); k.fillStyle = '#fff'; k.beginPath(); k.moveTo(px, py); k.lineTo(R, y); k.lineTo(lerp(px, R, 0.5), y + 10); k.lineTo(px, y - 2); k.lineTo(lerp(L, px, 0.5), y + 10); k.lineTo(L, y); k.closePath(); k.fill(); };
    tri(c - 330, c - 230, 104, c - 110, C.mint);
    tri(c - 110, c + 50, 30, c + 210, C.navy3); snow(c - 110, c + 50, 30, c + 210, 0.22);
    tri(c + 80, c + 190, 86, c + 330, C.blue); snow(c + 80, c + 190, 86, c + 330, 0.2);
    k.fillStyle = C.mint; k.fillRect(x0, h - 20, x1 - x0, 20);
    if (label) txt(k, 'MOUNTAIN', x0 + 26, 54, `800 44px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.restore();
  }
  const BLD = [[-250, 70, 116, 0], [-175, 62, 150, 1], [-108, 80, 96, 0], [-22, 64, 172, 1], [48, 92, 122, 0], [146, 58, 150, 1], [210, 80, 108, 0]];
  function pnCity(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = C.navy2; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff'; k.beginPath(); k.arc(c + 150, 46, 22, 0, 7); k.fill();
    const stp = Math.floor(t / (CYC / 8));
    BLD.forEach(([dx, bw, bh, ci], bi) => {
      const bx = c + dx, by = h - bh; k.fillStyle = ci ? C.blue : C.navy3; k.fillRect(bx, by, bw, bh);
      let wi = 0; for (let y = by + 14; y < h - 16; y += 22) for (let x = bx + 10; x < bx + bw - 14; x += 18) { const on = H01(bi * 97 + wi * 13 + stp * 7) > 0.35; wi++; k.fillStyle = on ? C.yel : 'rgba(15,26,61,.45)'; k.fillRect(x, y, 9, 11); }
    });
    if (label) { k.fillStyle = 'rgba(15,26,61,.55)'; rr(k, x0 + 18, 28, 196, 70, 14); k.fill(); txt(k, 'CITY', x0 + 34, 64, `800 66px ${DISP}`, '#fff', 'left', 'middle', '2px'); }
    k.restore();
  }
  function pnField(k, x0, x1, h, t, label) {
    const c = (x0 + x1) / 2; k.save(); clipX(k, x0, x1, h);
    k.fillStyle = '#DDF6EC'; k.fillRect(x0, 0, x1 - x0, h);
    k.fillStyle = '#fff';[[-150, 40], [60, 30], [210, 52]].forEach(([dx, y]) => { const xx = c + dx + 14 * Math.sin(2 * Math.PI * t / CYC + dx); k.beginPath(); k.ellipse(xx, y, 34, 12, 0, 0, 7); k.ellipse(xx + 14, y - 8, 18, 12, 0, 0, 7); k.fill(); });
    k.fillStyle = C.mint; k.beginPath(); k.moveTo(x0, h); k.lineTo(x0, 150); for (let x = x0; x <= x1; x += 10) k.lineTo(x, 150 + 8 * Math.sin((x - c) * 0.02)); k.lineTo(x1, h); k.closePath(); k.fill();
    const mx = c + (label ? 120 : 0), my = 72;
    k.fillStyle = '#fff'; k.beginPath(); k.moveTo(mx - 10, my); k.lineTo(mx + 10, my); k.lineTo(mx + 18, 160); k.lineTo(mx - 18, 160); k.closePath(); k.fill();
    const ang = 2 * Math.PI * 2 * t / CYC + 0.3; k.fillStyle = C.coral;
    for (let i = 0; i < 4; i++) { k.save(); k.translate(mx, my); k.rotate(ang + i * Math.PI / 2); k.beginPath(); k.moveTo(0, -3); k.lineTo(58, -10); k.lineTo(58, 8); k.lineTo(0, 3); k.closePath(); k.fill(); k.restore(); }
    k.fillStyle = C.yel; k.beginPath(); k.arc(mx, my, 8, 0, 7); k.fill();
    [[-200, 176, 0], [-120, 186, 1], [-40, 172, 0], [40, 184, 1], [180, 178, 0], [230, 190, 1]].forEach(([dx, y, ci]) => { k.fillStyle = ci ? C.yel : C.coral; k.beginPath(); k.arc(c + dx, y, 7, 0, 7); k.fill(); });
    if (label) txt(k, 'FIELD', x0 + 28, 70, `800 70px ${DISP}`, C.navy, 'left', 'middle', '2px');
    k.restore();
  }
  const scSea = (k, w, h) => pnSea(k, 0, w, h, 0, true), scMtn = (k, w, h) => pnMtn(k, 0, w, h, 0, true);
  const scCity = (k, w, h) => pnCity(k, 0, w, h, 0, true), scField = (k, w, h) => pnField(k, 0, w, h, 0, true);
  const SEG3 = CYC / 2;
  function abCell(trans) { return (k, w, h, u) => { u = snapU(u); const sgi = Math.min(1, Math.floor(u / SEG3)), uu = u - sgi * SEG3; trans(k, w, h, uu, sgi, 1 - sgi); }; }
  const TA = 0.5, TB = 1.5;
  // 破片や紙の形（多角形）のパス。ページめくり（20）とガラス割れ（22）で使う
  function polyPath(k, pts) { k.beginPath(); pts.forEach((p, i) => i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1])); k.closePath(); }

  // @element 17
  // 17 プッシュ（次の画面が横から入ってきて、前の画面を一緒に押し出す）
  const SC17 = [scSea, scMtn];
  CELLS[16] = abCell((k, w, h, u, a, b) => {
    const p = eIO(P(u, TA - 0.05, TB + 0.1)), dir = a === 0 ? -1 : 1;
    if (p <= 0) return SC17[a](k, w, h);
    if (p >= 1) return SC17[b](k, w, h);
    k.save(); k.translate(dir * p * w, 0); SC17[a](k, w, h); k.restore();
    k.save(); k.translate(dir * (p - 1) * w, 0); SC17[b](k, w, h); k.restore();
    const ex = dir < 0 ? w * (1 - p) : w * p;
    k.fillStyle = C.navy; k.fillRect(ex - 3, 0, 6, h);
  });

  // @element 18
  // 18 ブラインド（細い帯ごとのすき間がだんだん広がって、次の画面が開く）
  CELLS[17] = abCell((k, w, h, u, a, b) => {
    const p = eIOs(P(u, TA - 0.1, TB + 0.15)), N = 7, sh = h / N, S = [scrA, scrB];
    S[a](k, w, h);
    if (p <= 0) return;
    k.save(); k.beginPath(); for (let i = 0; i < N; i++) k.rect(0, i * sh, w, sh * p + (p > 0.999 ? 1 : 0)); k.clip(); S[b](k, w, h); k.restore();
  });

  // @element 19
  // 19 キューブ（立方体が回るように、前の面が奥へ倒れて次の面が現れる）
  const CFW = 250, CFH = 146, CF = [mkCanvas(CFW, CFH), mkCanvas(CFW, CFH)];
  function cubeFace(i) {
    const g = CF[i].getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CFW, CFH);
    g.fillStyle = i ? C.mint : C.coral; g.fillRect(0, 0, CFW, CFH);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 4; g.strokeRect(12, 12, CFW - 24, CFH - 24);
    txt(g, i ? 'B' : 'A', 78, CFH / 2 + 4, `800 104px ${DISP}`, i ? C.navy : '#fff', 'center', 'middle');
    g.fillStyle = i ? C.navy : '#fff'; g.globalAlpha = 0.8; rr(g, 140, 46, 78, 14, 7); g.fill(); g.globalAlpha = 0.45; rr(g, 140, 72, 60, 12, 6); g.fill(); rr(g, 140, 94, 70, 12, 6); g.fill(); g.globalAlpha = 1;
    return CF[i];
  }
  CELLS[18] = abCell((k, w, h, u, a, b) => {
    stage(k);
    const phi = (Math.PI / 2) * eIO(P(u, TA - 0.05, TB + 0.1)), c = Math.cos(phi), s = Math.sin(phi), HW = CFW / 2, D = 820, X = w / 2, Y = h / 2 - 4;
    const rot = (x, z) => [x * c - z * s, x * s + z * c];
    const FL = rot(-HW, HW), FR = rot(HW, HW), BR = rot(HW, -HW);
    const pj = p => { const f = D / (D - (p[1] - HW)); return [X + p[0] * f, f]; };
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, h - 16, HW * (c + s) * 0.95, 7, 0, 0, 7); k.fill();
    const face = (img, P0, P1, shade) => {
      const A0 = pj(P0), A1 = pj(P1); if (A1[0] - A0[0] < 1) return;
      const STEP = 2;
      for (let sx = 0; sx < CFW; sx += STEP) {
        const t0 = sx / CFW, t1 = Math.min(1, (sx + STEP) / CFW);
        const q0 = pj([lerp(P0[0], P1[0], t0), lerp(P0[1], P1[1], t0)]), q1 = pj([lerp(P0[0], P1[0], t1), lerp(P0[1], P1[1], t1)]);
        const hh = CFH * q0[1]; k.drawImage(img, sx, 0, STEP, CFH, q0[0], Y - hh / 2, q1[0] - q0[0] + 0.7, hh);
      }
      if (shade > 0.01) { k.fillStyle = `rgba(8,14,40,${shade})`; k.beginPath(); k.moveTo(A0[0], Y - CFH * A0[1] / 2); k.lineTo(A1[0], Y - CFH * A1[1] / 2); k.lineTo(A1[0], Y + CFH * A1[1] / 2); k.lineTo(A0[0], Y + CFH * A0[1] / 2); k.closePath(); k.fill(); }
    };
    face(cubeFace(a), FL, FR, 0.55 * s);
    face(cubeFace(b), FR, BR, 0.55 * c);
  });

  // @element 20
  // 20 ページめくり（角から紙がめくれて裏返り、下から次のページが現れる）
  function paper(k, w, h, i) {
    k.fillStyle = i ? C.cream : '#FFFFFF'; k.fillRect(0, 0, w, h);
    txt(k, i ? 'PAGE 2' : 'PAGE 1', 30, 58, `800 46px ${DISP}`, C.navy, 'left', 'middle', '1px');
    k.fillStyle = i ? '#EBD9B4' : '#D7DCEA';[[96, 230], [122, 250], [148, 200], [174, 236]].forEach(([y, ww]) => { rr(k, 30, y, ww, 12, 6); k.fill(); });
    k.fillStyle = i ? C.mint : C.coral; rr(k, 310, 26, 200, 156, 14); k.fill();
    k.fillStyle = '#fff'; k.beginPath(); k.arc(462, 66, 18, 0, 7); k.fill();
    k.beginPath(); k.moveTo(326, 168); k.lineTo(390, 92); k.lineTo(440, 150); k.lineTo(462, 126); k.lineTo(496, 168); k.closePath(); k.fill();
  }
  function clipHalf(poly, d, s0, keepLess) { const out = [], f = p => (p[0] - CW) * d[0] + (p[1] - CH) * d[1] - s0; for (let i = 0; i < poly.length; i++) { const A = poly[i], B = poly[(i + 1) % poly.length], fa = f(A), fb = f(B), ia = keepLess ? fa <= 0 : fa >= 0, ib = keepLess ? fb <= 0 : fb >= 0; if (ia) out.push(A); if (ia !== ib) { const t = fa / (fa - fb); out.push([lerp(A[0], B[0], t), lerp(A[1], B[1], t)]); } } return out; }
  CELLS[19] = abCell((k, w, h, u, a, b) => {
    const dl = Math.hypot(1, 0.42), d = [-1 / dl, -0.42 / dl], sM = 600 * eIOs(P(u, TA - 0.15, TB + 0.25));
    paper(k, w, h, b);
    if (sM >= 599) return;
    const rect = [[0, 0], [w, 0], [w, h], [0, h]], rest = clipHalf(rect, d, sM, false), corner = clipHalf(rect, d, sM, true);
    if (rest.length > 2) { k.save(); polyPath(k, rest); k.clip(); paper(k, w, h, a); k.restore(); }
    if (corner.length > 2 && sM > 0.5) {
      // 折り目の影（下のページ側）
      k.save(); polyPath(k, corner); k.clip();
      const mx = w + d[0] * sM, my = h + d[1] * sM, gr = k.createLinearGradient(mx, my, mx - d[0] * 50, my - d[1] * 50);
      gr.addColorStop(0, 'rgba(15,26,61,.35)'); gr.addColorStop(1, 'rgba(15,26,61,0)'); k.fillStyle = gr; k.fillRect(0, 0, w, h); k.restore();
      const flap = corner.map(p => { const s = (p[0] - w) * d[0] + (p[1] - h) * d[1], m = 2 * (sM - s); return [p[0] + m * d[0], p[1] + m * d[1]]; });
      k.save(); k.shadowColor = 'rgba(0,0,0,.35)'; k.shadowBlur = 14; k.shadowOffsetX = 4; k.shadowOffsetY = 4;
      polyPath(k, flap); k.fillStyle = a ? '#EADBB8' : '#E3E6EF'; k.fill(); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.8)'; k.lineWidth = 2; polyPath(k, flap); k.stroke();
    }
  });

  // @element 21
  // 21 ピクセレート（画面がだんだん粗いモザイクになり、いちばん粗いところで切り替わって細かく戻る）
  const SMC = mkCanvas(CW, CH), SMK = SMC.getContext('2d');
  const BLV = [1, 2, 3, 4, 6, 8, 11, 15, 20, 27, 36];
  CELLS[20] = abCell((k, w, h, u, a, b) => {
    const S = [scField, scCity], p = P(u, TA - 0.3, TB + 0.4), tri = 1 - Math.abs(2 * p - 1), bs = BLV[Math.round(tri * (BLV.length - 1))];
    const scr = p < 0.5 ? a : b;
    if (bs <= 1) return S[scr](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[scr](TK, w, h);
    const sw = Math.ceil(w / bs), sh = Math.ceil(h / bs);
    SMK.setTransform(1, 0, 0, 1, 0, 0); SMK.clearRect(0, 0, CW, CH); SMK.imageSmoothingEnabled = true; SMK.imageSmoothingQuality = 'high'; SMK.drawImage(TMP, 0, 0, sw, sh);
    k.imageSmoothingEnabled = false; k.drawImage(SMC, 0, 0, sw, sh, 0, 0, sw * bs, sh * bs); k.imageSmoothingEnabled = true;
  });

  // @element 22
  // 22 ガラス割れ（画面がガラスのようにひび割れ、破片が飛び散って次の画面が現れる）
  const SHARDS = (() => {
    const R = rand(2222), I = [304, 92], NA = 13, RAD = [0, 40, 98, 175, 360], V = [];
    const angs = []; for (let i = 0; i < NA; i++) angs.push((i + (R() - 0.5) * 0.6) / NA * Math.PI * 2);
    for (let r = 0; r < RAD.length; r++) { V.push([]); for (let i = 0; i < NA; i++) { const rr_ = r ? RAD[r] * (0.85 + R() * 0.3) : 0, a = angs[i] + (r ? (R() - 0.5) * 0.12 : 0); V[r].push([I[0] + Math.cos(a) * rr_, I[1] + Math.sin(a) * rr_]); } }
    const sh = [];
    for (let r = 0; r < RAD.length - 1; r++) for (let i = 0; i < NA; i++) {
      const j = (i + 1) % NA, poly = r ? [V[r][i], V[r][j], V[r + 1][j], V[r + 1][i]] : [I, V[1][j], V[1][i]];
      const cxp = poly.reduce((s, p) => s + p[0], 0) / poly.length, cyp = poly.reduce((s, p) => s + p[1], 0) / poly.length;
      const dx = cxp - I[0], dy = cyp - I[1], dd = Math.hypot(dx, dy) || 1, sp = 220 + R() * 260;
      sh.push({ poly, c: [cxp, cyp], vx: dx / dd * sp, vy: dy / dd * sp * 0.7 - 120 * R(), spin: (R() - 0.5) * 8, dl: r * 0.035 + R() * 0.03 });
    }
    return { I, V, RAD, NA, sh };
  })();
  CELLS[21] = abCell((k, w, h, u, a, b) => {
    const S = [scMtn, scrA], crack = eOut(P(u, TA - 0.2, TA + 0.15)) * 420, tb = TA + 0.32;
    if (u < tb) {
      S[a](k, w, h);
      if (crack > 0) {
        const { I, V, RAD, NA } = SHARDS; k.strokeStyle = '#fff'; k.lineWidth = 3; k.lineCap = 'round'; k.lineJoin = 'round'; k.globalAlpha = 0.95;
        for (let i = 0; i < NA; i++) { k.beginPath(); k.moveTo(I[0], I[1]); for (let r = 1; r < RAD.length; r++) { if (RAD[r] * 0.85 > crack) break; k.lineTo(V[r][i][0], V[r][i][1]); } k.stroke(); }
        for (let r = 1; r < RAD.length - 1; r++) { if (RAD[r] * 1.4 > crack) break; k.beginPath(); for (let i = 0; i <= NA; i++) { const p = V[r][i % NA]; i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]); } k.stroke(); }
        k.globalAlpha = 1;
        const fl = 1 - P(u, TA - 0.2, TA + 0.1); if (fl > 0) { k.fillStyle = '#fff'; star(k, I[0], I[1], 26 * fl + 6, 0.3, 0.3, 6); k.fill(); }
      }
      return;
    }
    S[b](k, w, h);
    TK.setTransform(1, 0, 0, 1, 0, 0); TK.globalCompositeOperation = 'source-over'; TK.clearRect(0, 0, w, h); S[a](TK, w, h);
    for (const s of SHARDS.sh) {
      const t = u - tb - s.dl; let al = 1, x = 0, y = 0, rt = 0, sc = 1;
      if (t > 0) { x = s.vx * t; y = s.vy * t + 0.5 * 1300 * t * t; rt = s.spin * t; sc = 1 - 0.35 * Math.min(1, t); al = 1 - P(t, 0.55, 1.0); }
      if (al <= 0) continue;
      k.save(); k.globalAlpha = al; k.translate(s.c[0] + x, s.c[1] + y); k.rotate(rt); k.scale(sc, sc); k.translate(-s.c[0], -s.c[1]);
      polyPath(k, s.poly); k.save(); k.clip(); k.drawImage(TMP, 0, 0); k.restore();
      k.strokeStyle = 'rgba(255,255,255,.85)'; k.lineWidth = 2.5; polyPath(k, s.poly); k.stroke();
      k.restore();
    }
  });

  // @element 23
  // 23 分解図（スマホの部品が層ごとにばらけて中の構造を見せ、また組み上がる）
  const XL = [
    { name: '背面', o: [-27, -50, 54, 100, 10], side: '#B8483D', draw: g => { g.fillStyle = C.coral; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy; g.beginPath(); g.arc(-12, -34, 7, 0, 7); g.fill(); g.beginPath(); g.arc(2, -34, 5, 0, 7); g.fill(); } },
    { name: '電池', o: [-21, -40, 42, 68, 6], side: '#17946F', draw: g => { g.fillStyle = C.mint; rr(g, -21, -40, 42, 68, 6); g.fill(); g.fillStyle = '#fff'; g.fillRect(-3, -18, 6, 20); g.fillRect(-10, -11, 20, 6); } },
    { name: '基板', o: [-25, -48, 50, 96, 6], side: '#2550B5', draw: g => { g.fillStyle = C.blue; rr(g, -25, -48, 50, 96, 6); g.fill(); g.fillStyle = C.yel; g.fillRect(-16, -38, 16, 14); g.fillRect(4, -30, 12, 10); g.fillRect(-14, 8, 26, 14); g.fillStyle = C.mint; g.fillRect(-18, -14, 34, 3); g.fillRect(-4, 26, 3, 16); } },
    { name: '画面', o: [-27, -50, 54, 100, 10], side: '#AEB8D4', draw: g => { g.fillStyle = '#fff'; rr(g, -27, -50, 54, 100, 10); g.fill(); g.fillStyle = C.navy2; rr(g, -22, -44, 44, 88, 6); g.fill(); for (let i = 0; i < 6; i++) { g.fillStyle = PAL[i % 4]; rr(g, -16 + (i % 2) * 18, -36 + Math.floor(i / 2) * 18, 13, 13, 3); g.fill(); } } },
  ];
  const ISO = (px, py) => [(px - py) * 0.866, (px + py) * 0.5];
  CELLS[22] = (k, w, h, u) => {
    u = snapU(u);
    stage(k);
    const X = 200, Y = 156, SP = 30, SC = 0.85;
    const ex = i => backOut(P(u, 0.45 + i * 0.08, 1.2 + i * 0.08), 1.3) * (1 - eIO(P(u, 3.25 + (3 - i) * 0.07, 3.95 + (3 - i) * 0.07)));
    const E = XL.map((_, i) => ex(i)), zs = E.map((e, i) => i * 7 + e * i * SP + 3 * Math.sin(2 * Math.PI * 2 * u / CYC + i) * clamp(e));
    k.fillStyle = 'rgba(0,0,0,.3)'; k.beginPath(); k.ellipse(X, Y + 40, 64, 13, 0, 0, 7); k.fill();
    // 縦の補助線（ばらけたときだけ）
    const e3 = clamp(E[3]); if (e3 > 0.03) { k.save(); k.setLineDash([4, 7]); k.strokeStyle = C.dim; k.lineWidth = 2; k.globalAlpha = e3;[[-27, -50], [27, 50], [-27, 50]].forEach(([px, py]) => { const [ix, iy] = ISO(px * SC, py * SC); k.beginPath(); k.moveTo(X + ix, Y + iy - zs[0]); k.lineTo(X + ix, Y + iy - zs[3]); k.stroke(); }); k.restore(); }
    XL.forEach((L, i) => {
      const z = zs[i];
      for (let dz = 6; dz >= 1; dz--) { k.save(); k.translate(X, Y - z + dz); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); k.fillStyle = L.side; rr(k, ...L.o); k.fill(); k.restore(); }
      k.save(); k.translate(X, Y - z); k.scale(SC, SC); k.transform(0.866, 0.5, -0.866, 0.5, 0, 0); L.draw(k); k.restore();
      // ラベル
      const a = clamp(E[i]); if (a > 0.03) {
        const [rx, ry] = ISO((L.o[0] + L.o[2]) * SC, L.o[1] * SC), sx = X + rx + 6, sy = Y + ry - z + 4, lx = 352, ly = Y + 8 - z - i * 2;
        k.globalAlpha = a; k.strokeStyle = C.dim; k.lineWidth = 2; k.beginPath(); k.moveTo(sx, sy); k.lineTo(lx - 10, ly); k.stroke();
        k.fillStyle = C.dim; k.beginPath(); k.arc(sx, sy, 4, 0, 7); k.fill();
        txt(k, L.name, lx, ly + 1, `800 26px ${JP}`, '#fff', 'left', 'middle'); k.globalAlpha = 1;
      }
    });
  };

  // @element 24
  // 24 スプリットスクリーン（1枚の画面が2つ、3つに分かれて、別々の場面が同時に動く）
  CELLS[23] = (k, w, h, u) => {
    u = snapU(u);
    const s2 = eIO(P(u, 0.45, 0.95)), s3 = eIO(P(u, 1.4, 1.9)), m = eIO(P(u, 3.75, 4.4));
    let b1 = lerp(lerp(w, w / 2, s2), w / 3, s3), b2 = lerp(w, 2 * w / 3, s3);
    b1 = lerp(b1, w, m); b2 = lerp(b2, w, m);
    pnSea(k, 0, b1, h, u, false);
    if (b1 < w - 0.5) pnCity(k, b1, Math.max(b1, b2), h, u, false);
    if (b2 < w - 0.5) pnField(k, b2, w, h, u, false);
    k.fillStyle = '#fff';[b1, b2].forEach(b => { if (b < w - 0.5) k.fillRect(b - 3, 0, 6, h); });
  };

  // @end
  return { width: CW, height: CH, cycle: CYC, cells: CELLS, fonts: [] };
});

const catalog={"version":"1.45af2a203e","site":"https://showheyohtaki.github.io/motion-prompt/","repo":"https://github.com/showheyohtaki/motion-prompt","count":144,"packs":[{"pack":"motion","order":1,"title":{"ja":"モーショングラフィックスの動き","en":"Motion graphics moves","zh-Hant":"Motion Graphics 動態手法"},"langs":["en","ja","zh-Hant"],"categories":[{"slug":"entrances-text","ja":"登場・文字の演出","en":"Entrances & text","zh-Hant":"登場與文字動態"},{"slug":"motion-polish","ja":"動きの味付け","en":"Motion polish","zh-Hant":"動態質感"},{"slug":"transitions-highlights","ja":"切り替え・見せ場","en":"Transitions & highlights","zh-Hant":"轉場與吸睛效果"}],"count":24,"first":"001","last":"024","width":539,"height":208,"cycle":4.7,"fonts":[],"scalable":false},{"pack":"camera","order":2,"title":{"ja":"カメラワークと切り替え","en":"Camera moves & transitions","zh-Hant":"運鏡與轉場"},"langs":["en","ja","zh-Hant"],"categories":[{"slug":"camera-movement","ja":"カメラの動き","en":"Camera Movement","zh-Hant":"鏡頭運動"},{"slug":"shooting-style-time","ja":"撮り方・時間の演出","en":"Shooting Style & Time","zh-Hant":"拍攝手法與時間效果"},{"slug":"transitions","ja":"切り替え（トランジション）","en":"Transitions","zh-Hant":"轉場"}],"count":24,"first":"025","last":"048","width":539,"height":208,"cycle":9.4,"fonts":[],"scalable":false},{"pack":"ui","order":3,"title":{"ja":"UIパーツの名前","en":"UI component names","zh-Hant":"UI 元件名稱"},"langs":["en","ja","zh-Hant"],"categories":[{"slug":"open-overlay","ja":"開く・重なるパーツ","en":"Opening & overlays","zh-Hant":"展開與彈出式元件"},{"slug":"select-switch","ja":"選ぶ・切り替えるパーツ","en":"Choosing & switching","zh-Hant":"選擇與切換元件"},{"slug":"navigate-status","ja":"案内する・状態を伝えるパーツ","en":"Navigation & status","zh-Hant":"導覽與狀態元件"}],"count":24,"first":"049","last":"072","width":542,"height":191,"cycle":4.5,"fonts":[],"scalable":true},{"pack":"lp","order":4,"title":{"ja":"LP・Webサイトの演出","en":"Landing page & web effects","zh-Hant":"Landing Page 與網站效果"},"langs":["en","ja","zh-Hant"],"categories":[{"slug":"scroll","ja":"スクロールで起きる演出","en":"Scroll effects","zh-Hant":"捲動時的效果"},{"slug":"hover-click","ja":"マウス・クリックへの反応","en":"Hover & click interactions","zh-Hant":"滑鼠與點擊的互動"},{"slug":"loading-loops","ja":"読み込み・移動・動き続ける演出","en":"Loading, navigation & ambient loops","zh-Hant":"載入、轉場與持續動態"}],"count":24,"first":"073","last":"096","width":539,"height":208,"cycle":4.8,"fonts":[],"scalable":true},{"pack":"photo","order":5,"title":{"ja":"写真の表現・光と画風","en":"Photo looks, lighting & styles","zh-Hant":"攝影風格：光線、鏡頭與調色"},"langs":["en","ja","zh-Hant"],"categories":[{"slug":"lighting","ja":"光の当て方・時間帯","en":"Lighting & time of day","zh-Hant":"打光方式與時段"},{"slug":"lens-camera","ja":"レンズ・カメラの効果","en":"Lens & camera effects","zh-Hant":"鏡頭與相機效果"},{"slug":"tone-finish","ja":"仕上げ・画風","en":"Tones & finishing looks","zh-Hant":"調色與風格"}],"count":24,"first":"097","last":"120","width":539,"height":208,"cycle":5,"fonts":[],"scalable":true},{"pack":"motion2","order":6,"title":{"ja":"モーショングラフィックスの演出 第2弾","en":"Motion graphics moves, part 2"},"langs":["en","ja"],"categories":[{"slug":"techniques","ja":"動きのテクニック","en":"Motion techniques"},{"slug":"text-shapes","ja":"文字・図形の演出","en":"Text & shapes"},{"slug":"transitions-highlights","ja":"切り替え・見せ場","en":"Transitions & highlights"}],"count":24,"first":"121","last":"144","width":539,"height":208,"cycle":4.7,"fonts":[],"scalable":false}],"elements":[{"id":"001","pack":"motion","no":"01","slug":"pop-in","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"ポップイン","en":"Pop-in","zh-Hant":"Pop-in"},"meaning":{"ja":"ポンと弾んで現れる","en":"Pops into view with a small bounce","zh-Hant":"彈跳一下出現"},"ask":{"ja":"ロゴをポップインで出して。0.4秒で、行き過ぎは少しだけ。","en":"Bring the logo in with a pop-in, about 0.4 s, with a slight overshoot.","zh-Hant":"請用 Pop-in 讓 Logo 出現，大約 0.4 秒，Overshoot 只要一點點。"},"summary":{"ja":"アプリのアイコンがポンと弾んで現れ、通知バッジが遅れてポンと出る。","en":"An app icon pops in with a bounce, then a notification badge pops in a moment later."},"spec":{"ja":["2.35秒で1回（1周期4.7秒に2回。1回目はコーラル地に星、2回目は青地にハート）","アイコン: 116pxの角丸四角（角丸30）。0.28秒から拡大率 0→1 をばねで出す: 1 − e^(−6.5t)·cos(15t)（最大およそ1.26まで行き過ぎる）","同時に傾き −0.35rad（約−20°）→ 0 をばね（1 − e^(−6t)·cos(11t)）で戻す","通知バッジ: 半径25の黄色い丸に「1」。アイコン右上（+52, −52）に 0.62秒から ばね 1 − e^(−7t)·cos(17t) で出す","退場: 1.86〜2.12秒。拡大率に (1 − backIn(s=2.2)) を掛ける（少しふくらんでから 0 へ縮む）","床の影: 横62×縦8の楕円をアイコンの拡大率（0〜1に制限）に合わせて伸縮"],"en":["One pop per 2.35 s (twice per 4.7 s cycle: a star on coral first, then a heart on blue).","Icon: 116 px rounded square (radius 30). From 0.28 s, scale 0→1 with a spring: 1 − e^(−6.5t)·cos(15t), peaking at about 1.26.","At the same time, rotation −0.35 rad (about −20°) → 0 with a spring: 1 − e^(−6t)·cos(11t).","Badge: yellow circle, radius 25, with \"1\", at the icon's top-right (+52, −52). Starts at 0.62 s with spring 1 − e^(−7t)·cos(17t).","Exit: 1.86–2.12 s. Scale is multiplied by (1 − backIn, s = 2.2), so it swells slightly and then shrinks to 0.","Floor shadow: 62 × 8 ellipse that scales with the icon (clamped to 0–1)."]},"use":{"ja":"アイコン・ボタン・バッジなど、小さな要素を軽く目立たせて出したいとき。","en":"Use it to bring in a small element such as an icon, button or badge with a light accent."},"tags":["pop","pop-in","spring","bounce","scale","icon","badge","entrance"]},{"id":"002","pack":"motion","no":"02","slug":"stagger","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"スタガー","en":"Stagger","zh-Hant":"Stagger"},"meaning":{"ja":"少しずつ時間をずらして順に出す","en":"Items appear one after another, slightly offset in time","zh-Hant":"項目依序錯開時間逐一出現"},"ask":{"ja":"5枚のカードをスタガーで出して。左から0.08秒ずつずらして。","en":"Bring in the five cards with a stagger, 0.08 s apart, left to right.","zh-Hant":"請用 Stagger 讓 5 張卡片出現，由左至右每張間隔 0.08 秒。"},"summary":{"ja":"グラフの棒が、少しずつ時間をずらして左から順に立ち上がる。","en":"Chart bars rise one after another from the left, each slightly delayed."},"spec":{"ja":["2.35秒で1回。棒7本（幅44・間隔20・高さ 52, 84, 68, 112, 92, 136, 158）。色は青・コーラル・黄・ミントの順で繰り返す","i本目（0始まり）は 0.15 + 0.12×i 秒に開始。0.5秒かけて高さ 0→100% を backOut（s=2.6）で伸ばす（底辺固定・行き過ぎてから戻る）","棒の上の白い点（半径6.5・棒の上端から16px上）: 棒の開始から 0.34秒遅れて ばね 1 − e^(−7t)·cos(16t) で出す","退場: 棒は 1.78 + 0.045×i 秒から0.26秒で easeIn（3乗）で縮む。点は 1.70 + 0.045×i 秒から0.2秒で先に消える"],"en":["One pass per 2.35 s. Seven bars (width 44, gap 20, heights 52, 84, 68, 112, 92, 136, 158), coloured blue, coral, yellow, mint in rotation.","Bar i (0-based) starts at 0.15 + 0.12·i s and grows from 0 to full height in 0.5 s with backOut (s = 2.6), anchored at the baseline, overshooting and settling.","White dot (radius 6.5, 16 px above the bar top): starts 0.34 s after its bar with spring 1 − e^(−7t)·cos(16t).","Exit: bars shrink with cubic ease-in over 0.26 s starting at 1.78 + 0.045·i s; dots vanish first, over 0.2 s from 1.70 + 0.045·i s."]},"use":{"ja":"リスト・グラフ・カードなど、複数の要素を順番に出して視線を流したいとき。","en":"Use it to bring in several items (list rows, chart bars, cards) in sequence and lead the eye across them."},"tags":["stagger","sequence","delay","cascade","bar-chart","list","entrance"]},{"id":"003","pack":"motion","no":"03","slug":"burst","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"バースト","en":"Burst","zh-Hant":"Burst"},"meaning":{"ja":"登場に合わせて線や粒が弾ける","en":"Lines and dots burst outward as something appears","zh-Hant":"出現時線條與粒子向外迸開"},"ask":{"ja":"ハートが出る瞬間に、まわりへバーストを入れて。短い線を8本、0.3秒で消す。","en":"Add a burst around the heart the moment it appears: 8 short lines that fade in 0.3 s.","zh-Hant":"愛心出現的瞬間，在周圍加上 Burst：8 條短線，0.3 秒內淡出消失。"},"summary":{"ja":"「いいね」のハートが点くと同時に、まわりに輪・線・粒が弾ける。","en":"A like heart fills in, and a ring, lines and dots burst outward at the same moment."},"spec":{"ja":["2.35秒で1回。ハート（サイズ46・線幅7の輪郭）が中央にある","予備動作: 0.3〜0.5秒で拡大率 1→0.7（easeInOut 2乗）","0.5秒に発火: ハートをコーラルで塗り、拡大率 0.7→1 を ばね 1 − e^(−6.5t)·cos(16t) で戻す","輪: 黄色。半径 44→90、線幅 16→0 を0.6秒で easeOut（5乗）","放射の線10本（黄・ミント交互、線幅9）: 先端の半径 64→130（縦は0.82倍）。長さ36を発火後0.22〜0.7秒で0へ","粒10個（コーラル・青交互、半径 8→4.8）: 半径 58→150（横1.45倍・縦0.78倍の楕円状）。発火後0.3〜0.72秒でフェードアウト。塗りは 1.92〜2.2秒で消える"],"en":["One burst per 2.35 s. A heart (size 46, 7 px outline) sits in the centre.","Anticipation: 0.3–0.5 s, scale 1→0.7 (quadratic ease-in-out).","Trigger at 0.5 s: the heart fills with coral and scale returns 0.7→1 with spring 1 − e^(−6.5t)·cos(16t).","Ring: yellow, radius 44→90 while line width goes 16→0, over 0.6 s with quintic ease-out.","10 radial lines (yellow/mint alternating, width 9): outer end radius 64→130 (y scaled 0.82); length 36 shrinks to 0 between 0.22 and 0.7 s after the trigger.","10 dots (coral/blue alternating, radius 8→4.8): radius 58→150 on an ellipse (x ×1.45, y ×0.78), fading out 0.3–0.72 s after the trigger. The heart fill fades at 1.92–2.2 s."]},"use":{"ja":"いいね・達成・正解など、押した瞬間や決まった瞬間を強調したいとき。","en":"Use it to mark the instant something is triggered or achieved, such as a like, a success or a correct answer."},"tags":["burst","explosion","radial","like","heart","celebrate","accent","sparkle"]},{"id":"004","pack":"motion","no":"04","slug":"line-draw","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"ラインドロー","en":"Line draw","zh-Hant":"線條動畫"},"meaning":{"ja":"線が描かれるように伸びる","en":"A line extends as if it were being drawn","zh-Hant":"線條像被畫出來般延伸"},"ask":{"ja":"グラフの折れ線を、ラインドローで左から描いて。1.2秒かけて。","en":"Reveal the chart line with a line draw from the left, over 1.2 s.","zh-Hant":"請用線條動畫從左邊畫出折線圖的線條，花 1.2 秒。"},"summary":{"ja":"グラフの線が描かれるように伸び、消えるときは後ろから追いかけて消える。","en":"A chart line draws itself on, and is later erased from its starting end."},"spec":{"ja":["4.7秒で1回。線の見える範囲（始点側の割合〜終点側の割合）を動かして描く（トリムパス）","軸（L字・線幅6）: 0.08〜0.7秒で描く。折れ線（ミント・線幅11・7点を通るなめらかな曲線・端は丸）: 0.4〜1.95秒で描く。どちらも easeInOut（3乗）","描いている間、先端に黄色い丸（半径12、中心に白の半径5）を付ける","矢じり: 1.9〜2.2秒に backOut（s=2.5）で開く（羽の長さ26・開き20）","山の1点を囲む丸（コーラル・半径26・線幅7）: 2.2〜2.8秒に真上から時計回りに描く","消去: 丸 3.5〜4.0秒、折れ線 3.65〜4.45秒、軸 3.85〜4.55秒。いずれも始点側から縮めて消す。矢じりは 4.3〜4.45秒で消す"],"en":["One pass per 4.7 s. Drawn as a trim path: animate the visible range (start fraction to end fraction) of each stroke.","Axes (L shape, width 6) draw at 0.08–0.7 s; the line (mint, width 11, a smooth curve through 7 points, round caps) draws at 0.4–1.95 s. Both use cubic ease-in-out.","While drawing, a yellow dot (radius 12, white centre radius 5) rides the leading tip.","Arrowhead: opens at 1.9–2.2 s with backOut (s = 2.5); wings 26 long, 20 wide.","A coral circle (radius 26, width 7) is drawn around one peak at 2.2–2.8 s, clockwise from the top.","Erase: circle 3.5–4.0 s, line 3.65–4.45 s, axes 3.85–4.55 s, each shrinking from its starting end. The arrowhead fades at 4.3–4.45 s."]},"use":{"ja":"グラフ・経路・下線・囲み線など、線そのものを見せ場にしたいとき。","en":"Use it when the stroke itself is the point: charts, routes, underlines, hand-drawn circles."},"tags":["line-draw","trim-path","stroke","draw-on","chart","path","write-on"]},{"id":"005","pack":"motion","no":"05","slug":"mask-reveal","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"マスクリビール","en":"Mask reveal","zh-Hant":"Mask Reveal"},"meaning":{"ja":"見えない枠の中から文字がせり上がる","en":"Text rises into view from behind an invisible edge","zh-Hant":"文字從看不見的邊界後方升起"},"ask":{"ja":"タイトルをマスクリビールで下からせり上げて。0.6秒、行ごとに少しずらして。","en":"Bring the title in with a mask reveal from below, 0.6 s, each line slightly after the one before.","zh-Hant":"標題請用 Mask Reveal 從下方升起，0.6 秒，每一行稍微錯開。"},"summary":{"ja":"1本の線を境に、見えない枠の向こうから見出しがせり上がる。","en":"Headline text slides out from behind an invisible edge marked by a single line."},"spec":{"ja":["2.35秒で1回。境目の線（コーラル・380×6・y=124）: 0.1〜0.5秒で中央から左右へ伸ばす（easeInOut 3乗）。2.05〜2.3秒で縮めて消す","上の文字（太字98px・白）: 線より上だけ見える切り抜き（y=8〜119）の中で、120px下から定位置へ。0.35〜1.0秒・easeOut（5乗）","下の文字（32px・黄）: 線より下だけ見える切り抜き（y=129〜181）の中で、60px上から定位置へ。0.55〜1.15秒・easeOut（5乗）","退場: 上の文字は 1.7〜2.05秒に上へ150px（backIn s=1.2・いったん少し下がる）。下の文字は 1.75〜2.05秒に下へ70px（easeIn 3乗）","文字の透明度は変えない。切り抜きの外に出ると見えなくなるだけ"],"en":["One pass per 2.35 s. Divider line (coral, 380 × 6, y = 124): grows from the centre at 0.1–0.5 s (cubic ease-in-out), shrinks away at 2.05–2.3 s.","Top text (bold 98 px, white): clipped to the area above the line (y 8–119); moves up into place from 120 px below at 0.35–1.0 s, quintic ease-out.","Bottom text (32 px, yellow): clipped to the area below the line (y 129–181); moves down into place from 60 px above at 0.55–1.15 s, quintic ease-out.","Exit: top text moves 150 px up at 1.7–2.05 s (backIn, s = 1.2, dipping slightly first); bottom text moves 70 px down at 1.75–2.05 s (cubic ease-in).","Opacity never changes; the text is hidden only by leaving the clip area."]},"use":{"ja":"タイトルや見出しを、落ち着いた印象で出したいとき。","en":"Use it for titles and headings that should appear in a clean, composed way."},"tags":["mask","reveal","clip","wipe","title","text","slide-up","headline"]},{"id":"006","pack":"motion","no":"06","slug":"typewriter","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"タイプライター","en":"Typewriter","zh-Hant":"打字機效果"},"meaning":{"ja":"1文字ずつ打たれるように出る","en":"Text appears one character at a time, as if typed","zh-Hant":"文字像一個字一個字打出來"},"ask":{"ja":"この一文をタイプライターで出して。1文字0.05秒、末尾にカーソルを付けて。","en":"Show this sentence with a typewriter effect, 0.05 s per character, with a cursor at the end.","zh-Hant":"這句話請用打字機效果呈現，每個字 0.05 秒，結尾加上游標。"},"summary":{"ja":"入力欄に1文字ずつ打たれ、打ち終わると送信ボタンが点いて押される。","en":"Text is typed into an input field one character at a time, then the send button lights up and is pressed."},"spec":{"ja":["4.7秒で1回。白い入力欄（471×92・角丸30）に9文字を、0.3秒から0.24秒おきに1文字ずつ出す（2.46秒で打ち終わり）","出た文字は拡大率 1.35→1 に落ち着く: 1 + 0.35·e^(−16t)","カーソル（コーラル・5×44）: 最後の文字の右。打っている間は点灯、それ以外は0.94秒周期（0.5秒点灯）で点滅","送信ボタン（半径30）: 灰色 → 2.58秒から青の丸を ばね 1 − e^(−6.5t)·cos(15t) で出す","押下: 2.96〜3.21秒にボタンを最大20%縮める（sin の山）。3.13〜3.41秒に文字が上へ70px動きながら消える","文字が半分消えた時点（約3.27秒）でカーソルは先頭に戻り、3.51〜3.81秒にボタンの青が消える"],"en":["One pass per 4.7 s. Nine characters appear in a white input field (471 × 92, radius 30), one every 0.24 s starting at 0.3 s (typing ends at 2.46 s).","Each new character settles from scale 1.35 to 1: 1 + 0.35·e^(−16t).","Cursor (coral, 5 × 44) sits after the last character: solid while typing, otherwise blinking with a 0.94 s period (on for 0.5 s).","Send button (radius 30): grey, then a blue disc appears from 2.58 s with spring 1 − e^(−6.5t)·cos(15t).","Press: the button shrinks by up to 20% at 2.96–3.21 s (half sine). At 3.13–3.41 s the text moves 70 px up while fading out.","The cursor returns to the start once the text is half faded (about 3.27 s); at 3.51–3.81 s the blue fades."]},"use":{"ja":"プロンプト入力・検索・チャットなど、文字を打つ操作を見せたいとき。","en":"Use it to show someone typing: a prompt, a search query, a chat message."},"tags":["typewriter","typing","text","cursor","input","prompt","chat","type-on"]},{"id":"007","pack":"motion","no":"07","slug":"count-up","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"カウントアップ","en":"Count-up","zh-Hant":"數字跳動"},"meaning":{"ja":"数字が勢いよく増えていく","en":"A number runs up quickly to its final value","zh-Hant":"數字快速累加到最終數值"},"ask":{"ja":"数字を0から1,280までカウントアップさせて。1.5秒で、最後はゆっくり止めて。","en":"Count the figure up from 0 to 1,280 in 1.5 s, slowing down at the end.","zh-Hant":"請用數字跳動讓數字從 0 跳到 1,280，花 1.5 秒，最後慢慢停下來。"},"summary":{"ja":"数字が勢いよく増えて、最後にピタッと決まる。","en":"A number races upward and locks onto its final value."},"spec":{"ja":["4.7秒で1回。0.1〜0.4秒でフェードイン、4.0〜4.4秒でフェードアウト","数字（太字104px）: 0.45〜2.9秒で 0→2,480。値 = 目標 × (1 − (1 − p)^4) を四捨五入（最初は速く、最後はゆっくり）","桁区切りのカンマ付き。各桁は同じ幅で右そろえ（数字が変わっても横に揺れない）","2.9秒に確定: 色を白→黄に変え、拡大率を 1 + 0.07·e^(−7t)·cos(15t) で小さく弾ませる","左の上向き矢印（ミントの丸・半径34）: 0.35秒から ばね 1 − e^(−7t)·cos(14t)。数えている間は上下に 6px × (1 − p)^3 × sin(30u) で震える","下のバー（330×12・青→ミントのグラデーション）: 値 ÷ 目標 の割合で伸びる"],"en":["One pass per 4.7 s. Fades in at 0.1–0.4 s and out at 4.0–4.4 s.","Number (bold 104 px): 0→2,480 over 0.45–2.9 s. Value = round(target × (1 − (1 − p)^4)): fast at first, slow at the end.","Thousands separator included. Every digit has the same width and the number is right-aligned, so it does not jitter sideways.","Lands at 2.9 s: colour switches white→yellow and scale does a small bounce, 1 + 0.07·e^(−7t)·cos(15t).","Up-arrow chip on the left (mint circle, radius 34): appears from 0.35 s with spring 1 − e^(−7t)·cos(14t); while counting it shakes vertically by 6 px × (1 − p)^3 × sin(30u).","Bar below (330 × 12, blue→mint gradient): fills in proportion to value ÷ target."]},"use":{"ja":"売上・人数・達成率など、数字の大きさや伸びを印象づけたいとき。","en":"Use it to make a figure feel big or growing: revenue, user counts, completion rates."},"tags":["count-up","counter","number","odometer","stats","kpi","progress"]},{"id":"008","pack":"motion","no":"08","slug":"kinetic-typography","category":"entrances-text","width":539,"height":208,"cycle":4.7,"name":{"ja":"キネティックタイポグラフィ","en":"Kinetic typography","zh-Hant":"Kinetic Typography"},"meaning":{"ja":"言葉に合わせて文字が動き回る","en":"Words move, scale and turn in time with what is said","zh-Hant":"文字隨著話語移動、縮放、旋轉"},"ask":{"ja":"このナレーションをキネティックタイポグラフィにして。強調する語は大きく、拍に合わせて出して。","en":"Turn this narration into kinetic typography: make the stressed words larger and land them on the beat.","zh-Hant":"請把這段旁白做成 Kinetic Typography：強調的詞放大，並配合節拍出現。"},"summary":{"ja":"言葉の意味に合わせて文字が動く（のびる／はねる／まわる／ドン！）。","en":"Words move the way they mean: one stretches, one bounces, one spins, one slams down."},"spec":{"ja":["4語を1.175秒ずつ（太字88px）。各語は最後の0.2秒でフェードアウトしながら上へ46px（easeIn 3乗）","のびる（青）: 横の拡大率 0.3→1 を ばね 1 − e^(−4.2t)·cos(12t) で。縦は 1/√(横) で少し縮める","はねる（黄）: 1文字ずつ0.1秒ずらす。高さ 78px × |sin(πt/0.4)| × e^(−2.6t) で弾む。接地の瞬間は縦に最大16%つぶす","まわる（ミント）: 1文字ずつ0.12秒ずらす。0.62秒で −360°→0° を backOut（s=1.3）。拡大率 0→1 を0.25秒で easeOut（3乗）","ドン!（コーラル・100px・斜体風に傾ける）: 0.02〜0.2秒で拡大率 3.4→1（easeIn 3乗）で叩きつける","着地後: 横揺れ 10px × e^(−9t) × sin(38t)、縦つぶれ 20% × e^(−11t)、放射の線8本を0.4秒"],"en":["Four words, 1.175 s each (bold 88 px). Each exits in its last 0.2 s, fading out while moving 46 px up (cubic ease-in).","Stretch (blue): horizontal scale 0.3→1 with spring 1 − e^(−4.2t)·cos(12t); vertical scale is 1/√(horizontal).","Bounce (yellow): characters staggered by 0.1 s; height 78 px × |sin(πt/0.4)| × e^(−2.6t); squashed vertically by up to 16% at each contact.","Spin (mint): characters staggered by 0.12 s; rotation −360°→0° over 0.62 s with backOut (s = 1.3); scale 0→1 over 0.25 s, cubic ease-out.","Slam (coral, 100 px, slanted): scale 3.4→1 at 0.02–0.2 s with cubic ease-in.","After impact: horizontal shake 10 px × e^(−9t) × sin(38t), vertical squash 20% × e^(−11t), and 8 radial lines for 0.4 s."]},"use":{"ja":"ナレーションや歌詞のキーワードを、意味ごと印象に残したいとき。","en":"Use it to make key words from narration or lyrics memorable through how they move."},"tags":["kinetic-typography","text","typography","lyric","word","bounce","spin","slam"]},{"id":"009","pack":"motion","no":"09","slug":"easing","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"イージング","en":"Easing","zh-Hant":"Easing"},"meaning":{"ja":"緩急をつけて気持ちよく動かす","en":"Motion speeds up and slows down instead of moving at one speed","zh-Hant":"速度有快有慢，而不是等速移動"},"ask":{"ja":"この移動にイージングをかけて。イーズアウトで、止まり際をゆっくりに。","en":"Add easing to this move: ease-out, slowing down as it stops.","zh-Hant":"這段移動請加上 Easing，用 Ease-out，讓停下來之前慢慢減速。"},"summary":{"ja":"同じ距離を同じ時間で動く2つの四角。上は一定の速さ、下は緩急あり。","en":"Two squares cover the same distance in the same time: the top one at constant speed, the bottom one eased."},"spec":{"ja":["4.7秒で1往復。62pxの四角（角丸16）2つが横に316px動く。行き 0.2〜1.75秒（1.55秒）、0.8秒止まり、戻り 2.55〜4.1秒","上（一定）: 直線的に動く（linear）。形も色も変えない","下（緩急）: cubic-bezier(.86, 0, .14, 1)。ゆっくり出て、中盤で一気に速くなり、ゆっくり止まる","下は速さに比例して横に最大1.5倍のび、縦は0.8倍まで縮む（速さを3.6で割り 0〜1 に制限した値を使う）","下の後ろに速度線3本（最長150px×0.8〜1.25倍）と、0.035秒ずつ遅れた残像4枚","レールには等しい時間間隔での位置を12個の点で表示（上は等間隔、下は両端に詰まる）"],"en":["One round trip per 4.7 s. Two 62 px squares (radius 16) travel 316 px horizontally: out at 0.2–1.75 s (1.55 s), hold 0.8 s, back at 2.55–4.1 s.","Top (constant): linear motion; shape and colour never change.","Bottom (eased): cubic-bezier(.86, 0, .14, 1). Slow start, very fast middle, slow stop.","The bottom square stretches horizontally up to 1.5× and flattens to 0.8× in proportion to speed (speed ÷ 3.6, clamped to 0–1).","Behind it: 3 speed lines (up to 150 px × 0.8–1.25) and 4 ghost copies lagging 0.035 s each.","Each rail shows 12 dots marking positions at equal time intervals (evenly spaced on top, bunched at both ends below)."]},"use":{"ja":"移動・拡大・回転など、あらゆる動きに緩急を付けて機械的に見えないようにしたいとき。","en":"Use it on any move, scale or rotation so the motion accelerates and decelerates instead of looking mechanical."},"tags":["easing","ease-in-out","cubic-bezier","linear","timing","curve","acceleration"]},{"id":"010","pack":"motion","no":"10","slug":"overshoot","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"オーバーシュート","en":"Overshoot","zh-Hant":"Overshoot"},"meaning":{"ja":"行き過ぎてから戻って止まる","en":"Goes a little past the target, then settles back","zh-Hant":"衝過目標一點，再回彈停住"},"ask":{"ja":"メーターの針をオーバーシュートさせて。目標を1割ほど越えてから戻して。","en":"Give the gauge needle an overshoot: about 10% past the target, then back.","zh-Hant":"請讓儀表的指針加上 Overshoot，衝過目標約 10% 之後再回到目標。"},"summary":{"ja":"メーターの針が、目標を行き過ぎてから戻って止まる。","en":"A gauge needle swings past its target, comes back and settles."},"spec":{"ja":["4.7秒で1回。半円のメーター（半径128・線幅26）。目標は全体の0.7（左端から126°）","0.25秒に開始: 値 = 0.7 × (1 − e^(−4.6t)·cos(10.5t))。約0.3秒後に目標を約25%行き過ぎ、揺れながら目標に落ち着く","行き過ぎた分（目標より先の弧）はコーラルで塗る。目標の位置に黄色の印","弧の塗りは青→ミントのグラデーション。針は白・線幅9","戻り: 3.7秒から 値 = 0.7 × e^(−7.5t)·cos(8.5t) で 0 へ（0 をわずかに下回ってから止まる）"],"en":["One pass per 4.7 s. Semicircular gauge (radius 128, stroke 26). Target is 0.7 of the sweep (126° from the left end).","Starts at 0.25 s: value = 0.7 × (1 − e^(−4.6t)·cos(10.5t)). About 0.3 s later it is roughly 25% past the target, then it oscillates and settles on the target.","The part beyond the target is drawn in coral. A yellow tick marks the target.","The filled arc is a blue→mint gradient; the needle is white, width 9.","Return: from 3.7 s, value = 0.7 × e^(−7.5t)·cos(8.5t) back to 0 (dipping slightly below 0 before it stops)."]},"use":{"ja":"要素が到着する動きに勢いと弾力を出したいとき。","en":"Use it to give an arriving element energy and a springy feel."},"tags":["overshoot","spring","bounce","settle","elastic","gauge","meter","needle"]},{"id":"011","pack":"motion","no":"11","slug":"squash-and-stretch","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"スクワッシュ＆ストレッチ","en":"Squash & stretch","zh-Hant":"擠壓與伸展"},"meaning":{"ja":"つぶれて伸びて弾力を出す","en":"Squashes and stretches so that it feels elastic","zh-Hant":"物體擠壓再拉長，帶出彈性感"},"ask":{"ja":"ボールの着地にスクワッシュ＆ストレッチを入れて。つぶれは弱めに。","en":"Add squash and stretch when the ball lands; keep the squash subtle.","zh-Hant":"球落地時請加上擠壓與伸展，擠壓的幅度要小一點。"},"summary":{"ja":"弾むキャラクターが、着地でつぶれ、飛ぶときに伸びる。","en":"A bouncing character squashes on landing and stretches as it takes off."},"spec":{"ja":["半径37の丸いキャラクター。1.175秒で1回弾み（4.7秒で4回）、高さ92pxの放物線。左右には ±150px をsin波で1周期かけて往復","接地中（各バウンドの最初と最後の10%）: 縦の拡大率 0.52（着地の瞬間）⇄ 1.28（離れる瞬間）を2乗カーブで","空中: 縦の拡大率 = 1 + 0.28 × s^3。s は頂点からの時間のずれ（頂点で0、離れる瞬間と着く瞬間で1）（速いところで伸びる）","横の拡大率は常に 1 ÷ 縦（体積を保つ）。変形の基準は足元","影は高さに応じて小さく・細く。着地のたびに左右へ黄色い短い線が飛ぶ（1バウンドの約18%の間）"],"en":["A round character, radius 37. One bounce per 1.175 s (four per 4.7 s), a 92 px parabola. It drifts ±150 px sideways on a sine wave over the cycle.","On the ground (first and last 10% of each bounce): vertical scale goes between 0.52 (moment of impact) and 1.28 (moment of leaving) on a quadratic curve.","In the air: vertical scale = 1 + 0.28 × s^3, where s is the time offset from the apex (0 at the apex, 1 at take-off and touchdown), so it is stretched where it moves fast.","Horizontal scale is always 1 ÷ vertical (volume is preserved). The transform is anchored at the feet.","The shadow gets smaller and thinner with height. Short yellow lines flick out left and right at each landing (for about 18% of a bounce)."]},"use":{"ja":"キャラクターやロゴの動きに、重さとやわらかさを出したいとき。","en":"Use it to give a character or logo weight and softness."},"tags":["squash","stretch","squash-and-stretch","bounce","character","ball","animation-principle"]},{"id":"012","pack":"motion","no":"12","slug":"shape-morph","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"モーフィング","en":"Shape morph","zh-Hant":"形狀變形"},"meaning":{"ja":"形が別の形に変わる","en":"One shape turns smoothly into another","zh-Hant":"一個形狀平滑變成另一個形狀"},"ask":{"ja":"丸を星にモーフィングさせて。0.8秒で、途中で色も青から黄へ。","en":"Morph the circle into a star in 0.8 s, changing the color from blue to yellow on the way.","zh-Hant":"請用形狀變形把圓形變成星形，0.8 秒，過程中顏色也從藍色漸變成黃色。"},"summary":{"ja":"丸 → 四角 → 星 → ハートと、形と色がなめらかに変わる。","en":"A shape changes smoothly from circle to square to star to heart, with its colour."},"spec":{"ja":["4つの形を1.175秒ずつ（丸 → 角を丸く落とした四角 → 星 → ハート → 丸に戻る）。基準の半径64","各区間は前半で止まり、最後の0.62〜0.04秒前（0.58秒間）で次の形へ変形","形は輪郭上の240点で持ち、同じ番号の点どうしを直線補間する。進み具合は backOut（s=1.6）で少し行き過ぎる","色: 青 → コーラル → 黄 → ミント。easeInOut（2乗）で混ぜる","変形中は拡大率を 1 + 0.07 × sin(π × 進み具合) でふくらませる","下に4つの点。今の形の点が大きく色付きになる"],"en":["Four shapes, 1.175 s each: circle → square with rounded-off corners → star → heart → back to circle. Base radius 64.","Each segment holds first, then morphs to the next shape between 0.62 s and 0.04 s before its end (0.58 s).","Every outline is stored as 240 points; points with the same index are linearly interpolated. Progress uses backOut (s = 1.6), so it overshoots slightly.","Colour: blue → coral → yellow → mint, blended with quadratic ease-in-out.","During the morph the scale swells by 1 + 0.07 × sin(π × progress).","Four dots below; the dot for the current shape is larger and coloured."]},"use":{"ja":"アイコンやロゴを別の形へ、切らずにつなげて変えたいとき。","en":"Use it to turn one icon or logo into another without a cut."},"tags":["morph","morphing","shape","path","interpolate","transform","icon"]},{"id":"013","pack":"motion","no":"13","slug":"liquid-motion","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"リキッドモーション","en":"Liquid motion","zh-Hant":"液態動畫"},"meaning":{"ja":"液体のようにぬるっと動く","en":"Shapes move and merge like liquid","zh-Hant":"像液體一樣黏滑地流動、融合"},"ask":{"ja":"ロゴの登場をリキッドモーションにして。しずくが集まってロゴの形になるように。","en":"Make the logo entrance a liquid motion: drops gather and form the shape.","zh-Hant":"Logo 的登場請用液態動畫，像水滴聚在一起組成 Logo 的形狀。"},"summary":{"ja":"しずくが伸びて、ちぎれて、ぬるっと1つにまとまる。","en":"A blob stretches out, breaks into drops and merges back into one."},"spec":{"ja":["先頭の丸（半径44）: 0.35〜1.45秒で右へ300px、cubic-bezier(.7, 0, .2, 1)。移動中は sin の山で34px浮く。2.7〜3.8秒で同じ動きで戻る","後ろに7つの丸が0.065秒ずつ遅れて同じ経路を追う。半径は44→15へ小さく、上下に±6px揺れる","止まっている間も、まわりで小さな丸3つ（半径15・13・11）が距離34〜64pxを1周期に2回出入りする","つながる質感: 丸を白で描く → 9pxぼかす → 透明度をしきい値（112〜144の間だけなだらか）で切る → 残った形に色を塗る","色はミント → 青 → 紫（#7C5CFF）の斜めグラデーション。先頭に白い楕円のハイライト"],"en":["Lead circle (radius 44): moves 300 px right at 0.35–1.45 s with cubic-bezier(.7, 0, .2, 1), rising 34 px on a sine arc while moving; returns the same way at 2.7–3.8 s.","Seven circles follow the same path, each 0.065 s later, radius tapering 44→15, wobbling ±6 px vertically.","Even while it rests, three small circles (radius 15, 13, 11) move in and out between 34 and 64 px from it, twice per cycle.","Merged look: draw the circles in white → blur 9 px → threshold the alpha (soft only between 112 and 144) → fill what remains with colour.","Fill is a diagonal gradient mint → blue → violet (#7C5CFF), with a white elliptical highlight on the lead circle."]},"use":{"ja":"有機的でやわらかい印象を出したいとき。ロゴ・背景・切り替えのつなぎに。","en":"Use it for an organic, soft look in logos, backgrounds and connecting moves."},"tags":["liquid","blob","goo","gooey","metaball","fluid","organic","drip"]},{"id":"014","pack":"motion","no":"14","slug":"motion-trail","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"モーショントレイル","en":"Motion trail","zh-Hant":"動態殘影"},"meaning":{"ja":"動いた跡に残像が尾を引く","en":"A fading trail follows a moving object","zh-Hant":"移動的物體後方拖著漸淡的殘影"},"ask":{"ja":"飛んでいく丸にモーショントレイルを付けて。残像は5個、後ろほど薄く。","en":"Add a motion trail to the flying circle: five copies that fade out behind it.","zh-Hant":"飛行中的圓形請加上動態殘影，5 個殘影，越後面越淡。"},"summary":{"ja":"8の字に動く丸の跡に、残像が尾を引く。","en":"A ball moving in a figure eight leaves a fading trail of copies behind it."},"spec":{"ja":["丸（コーラル・半径25、中心に白の半径11）が8の字を4.7秒で1周: x = 196·sin(a)、y = 62·sin(2a)。a は一定の速さで進む","残像15個: 0.105rad（約0.079秒）ずつ過去の位置に置く","残像の半径は 22→6、透明度は 0.9 × (1 − i/15) + 0.05 で古いほど薄く小さい","残像の色は新しい順にコーラル → 黄 → 青","古い残像から先に描き、本体を最後に重ねる"],"en":["A ball (coral, radius 25, white centre radius 11) traces a figure eight once per 4.7 s: x = 196·sin(a), y = 62·sin(2a), with a advancing at constant speed.","15 copies, each placed 0.105 rad (about 0.079 s) further back along the path.","Copy radius goes 22→6 and opacity is 0.9 × (1 − i/15) + 0.05, so older copies are smaller and fainter.","Copy colour runs coral → yellow → blue from newest to oldest.","Draw the oldest copy first and the ball itself last."]},"use":{"ja":"速さや軌道を見せたいとき。飛ぶ物・カーソル・光の点に。","en":"Use it to show speed or a path: flying objects, cursors, points of light."},"tags":["trail","motion-trail","echo","afterimage","ghost","path","speed"]},{"id":"015","pack":"motion","no":"15","slug":"particles","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"パーティクル","en":"Particles","zh-Hant":"粒子特效"},"meaning":{"ja":"粒が飛び散る","en":"Many small pieces fly out and scatter","zh-Hant":"許多小粒子向外飛散"},"ask":{"ja":"達成の瞬間に、下からパーティクルを噴き上げて。4色で、1.5秒で落ちきるように。","en":"At the moment of success, shoot particles up from the bottom: four colors, all fallen within 1.5 s.","zh-Hant":"達成的瞬間，請用粒子特效從下方往上噴出，4 種顏色，1.5 秒內全部落完。"},"summary":{"ja":"粒が下の口から次々と噴き出して、飛び散って落ちる。","en":"Particles keep shooting up from an emitter, spread out and fall."},"spec":{"ja":["粒84個。下中央（横の中央・下端から20px上）から出る","初速: 横 ±190px/秒、上向き 250〜400px/秒。重力 470px/秒²（放物線）","各粒は 2.35秒 または 約1.57秒 の周期で繰り返し、開始のずれは乱数（シード固定なので毎回同じ絵になる）","寿命は最長1.5秒。出た直後0.06秒でフェードイン、寿命の最後30%でフェードアウト。拡大率 1.15→0.7","形は丸・四角・三角（大きさ5〜11px）、色は青・コーラル・黄・ミント。最大 ±4.5rad/秒で回転"],"en":["84 particles, emitted from the bottom centre (horizontal centre, 20 px above the bottom edge).","Initial velocity: ±190 px/s horizontally, 250–400 px/s upward. Gravity 470 px/s² (parabolic paths).","Each particle repeats with a period of 2.35 s or about 1.57 s, with a random start offset (fixed seed, so every run looks the same).","Lifetime up to 1.5 s: fade in over the first 0.06 s, fade out over the last 30%. Scale 1.15→0.7.","Shapes are circles, squares and triangles (size 5–11 px) in blue, coral, yellow and mint, spinning at up to ±4.5 rad/s."]},"use":{"ja":"お祝い・達成・にぎやかさを足したいとき。紙吹雪や火花の代わりに。","en":"Use it to add celebration or liveliness, in place of confetti or sparks."},"tags":["particles","confetti","emitter","fountain","gravity","celebration","sparks"]},{"id":"016","pack":"motion","no":"16","slug":"parallax","category":"motion-polish","width":539,"height":208,"cycle":4.7,"name":{"ja":"パララックス","en":"Parallax","zh-Hant":"Parallax"},"meaning":{"ja":"手前と奥をずらして動かし奥行きを出す","en":"Near and far layers move at different speeds to show depth","zh-Hant":"近景與遠景速度不同，營造景深"},"ask":{"ja":"この風景を3層に分けて、パララックスで横に流して。手前ほど速く。","en":"Split this landscape into three layers and scroll them with parallax, nearer layers faster.","zh-Hant":"請把這張風景分成 3 層，以 Parallax 橫向平移，越近的圖層移動越快。"},"summary":{"ja":"横に動く景色。手前ほど大きく、奥ほど小さく動いて、奥行きが出る。","en":"A landscape pans sideways; near layers move more and far layers move less, creating depth."},"spec":{"ja":["カメラの横移動: ±108px を sin波で4.7秒に1往復","各層は 移動量 × 係数 だけ逆向きにずらす。係数は奥から: 星 0.05、月 0.1、遠い山 0.28、中間の山 0.6、手前の丘と木 1.25、いちばん手前の暗い丸 2.1","奥の層ほど暗く背景に近い色、手前ほど明るい色。いちばん手前は暗い影として画面下に大きく置く","各層は画面の左右に200px以上はみ出して描き、端が見えないようにする"],"en":["Camera pan: ±108 px on a sine wave, one round trip per 4.7 s.","Each layer is offset by pan × factor in the opposite direction. Factors from back to front: stars 0.05, moon 0.1, far ridge 0.28, middle ridge 0.6, front hill and trees 1.25, nearest dark shapes 2.1.","Far layers use darker colours close to the background, nearer layers brighter ones; the nearest layer is a large dark silhouette along the bottom.","Every layer is drawn at least 200 px beyond both sides of the frame so its ends never show."]},"use":{"ja":"平面の絵や写真に奥行きを出したいとき。背景・風景・スクロール表現に。","en":"Use it to give flat artwork or photos depth: backgrounds, landscapes, scrolling scenes."},"tags":["parallax","depth","layers","pan","2.5d","background","landscape"]},{"id":"017","pack":"motion","no":"17","slug":"mask-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"マスクトランジション","en":"Mask transition","zh-Hant":"遮罩轉場"},"meaning":{"ja":"形の中から次の画面が現れる","en":"The next scene appears inside a growing shape","zh-Hant":"下一個畫面從擴大的形狀中現出"},"ask":{"ja":"次の場面へはマスクトランジションで。中央の丸が0.7秒で広がって切り替わるように。","en":"Go to the next scene with a mask transition: a circle grows from the center in 0.7 s.","zh-Hant":"切換到下一個場景請用遮罩轉場，中央的圓形在 0.7 秒內擴大並完成切換。"},"summary":{"ja":"丸や星の形の「窓」が広がり、その中に次の画面が見える。","en":"A circle- or star-shaped window grows, showing the next scene inside it."},"spec":{"ja":["昼の画面 → 夜の画面 → 昼の画面を2.35秒ずつ。各区間の 0.45〜1.6秒（1.15秒）で切り替え、easeInOut（3乗）","今の画面の上に、形で切り抜いた次の画面を重ねる。形を広げて画面全体を覆ったら完了","昼→夜: 丸。太陽の中心（112, 104）から半径 0→470","夜→昼: 5角の星。月の中心（427, 104）から外側の半径 0→1150、同時に1.2rad（約69°）回す","広がっている間、形のふちに白い線（線幅7）を付ける"],"en":["Day scene → night scene → day scene, 2.35 s each. The change runs at 0.45–1.6 s of each half (1.15 s), cubic ease-in-out.","The next scene is drawn on top of the current one, clipped to a shape; the shape grows until it covers the frame.","Day→night: a circle from the sun's centre (112, 104), radius 0→470.","Night→day: a five-point star from the moon's centre (427, 104), outer radius 0→1150, rotating 1.2 rad (about 69°) as it grows.","While it grows, the edge of the shape has a white outline (width 7)."]},"use":{"ja":"画面の中の物（太陽・ロゴ・ボタン）を起点に、次の場面へ切り替えたいとき。","en":"Use it to change scenes starting from an object in the frame, such as a sun, logo or button."},"tags":["mask","transition","iris","wipe","shape-wipe","reveal","scene-change"]},{"id":"018","pack":"motion","no":"18","slug":"shape-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"シェイプトランジション","en":"Shape transition","zh-Hant":"形狀轉場"},"meaning":{"ja":"図形が画面を覆って切り替わる","en":"Shapes cover the screen and uncover the next scene","zh-Hant":"形狀覆蓋畫面後露出下一個場景"},"ask":{"ja":"場面の切り替えはシェイプトランジションで。4色の斜めの帯が左から覆うように。","en":"Change scenes with a shape transition: four diagonal color bands sweep in from the left.","zh-Hant":"場景切換請用形狀轉場，4 種顏色的斜向色帶從左邊掃過來覆蓋畫面。"},"summary":{"ja":"色のついた帯が画面を覆い隠し、抜けると次の画面になっている。","en":"Coloured bands sweep across and cover the frame; when they leave, the next scene is there."},"spec":{"ja":["昼 → 夜 → 昼を2.35秒ずつ。横長の帯4本（高さ52・青、コーラル、黄、ミント）。帯の左右の端は80px斜め","覆う: 0.38〜1.0秒。各帯の先端が画面の端から反対の端まで進む。帯ごとに全体の14%ずつ遅らせ、1本あたり全体の58%の長さで easeInOut（3乗）","1.0秒（全部覆った瞬間）に下の画面を次の画面へ差し替える","抜ける: 1.12〜1.75秒。各帯の後ろの端が同じ遅れ・同じカーブで追いかけ、次の画面が現れる","向き: 昼→夜は左から右、夜→昼は左右反転"],"en":["Day → night → day, 2.35 s each. Four horizontal bands (height 52; blue, coral, yellow, mint) whose ends are slanted by 80 px.","Cover: 0.38–1.0 s. Each band's leading edge travels from one side of the frame to the other. Bands are delayed by 14% of the phase each, and each uses cubic ease-in-out over 58% of the phase.","At 1.0 s, when everything is covered, the scene underneath is swapped for the next one.","Uncover: 1.12–1.75 s. Each band's trailing edge follows with the same delays and curve, exposing the next scene.","Direction: left to right for day→night, mirrored for night→day."]},"use":{"ja":"ブランドカラーの図形で場面を切り替えたいとき。章の区切りや話題の転換に。","en":"Use it to change scenes with shapes in brand colours: chapter breaks, topic changes."},"tags":["shape-transition","transition","wipe","bands","stripes","cover","scene-change"]},{"id":"019","pack":"motion","no":"19","slug":"liquid-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"リキッドトランジション","en":"Liquid transition","zh-Hant":"液態轉場"},"meaning":{"ja":"液体が流れ込んで切り替わる","en":"Liquid flows in and replaces the scene","zh-Hant":"液體流入並取代原本的畫面"},"ask":{"ja":"ここはリキッドトランジションで。上から青いインクが垂れて画面を満たすように。","en":"Use a liquid transition here: blue ink drips down from the top and fills the frame.","zh-Hant":"這裡請用液態轉場，藍色墨水從上方滴下來填滿畫面。"},"summary":{"ja":"ペンキのような液体が上から垂れて流れ込み、次の画面になる。","en":"Paint-like liquid drips down from the top and fills the frame, becoming the next scene."},"spec":{"ja":["昼 → 夜 → 昼を2.35秒ずつ。液体は2層。どちらも上から下へ、easeInOut（2乗）","1層目（単色。昼→夜は青、夜→昼はコーラル）: 0.35〜1.5秒。2層目（次の画面そのものを液体の形で切り抜く）: 0.7〜1.8秒","液面は y = −110 から 画面下端+130 まで下がる。ふちは2つのsin波（振幅13pxと8px）で波打ち、波の大きさは途中で最大になる","しずく7本（太さ30〜54px・先端は丸）を液面から垂らす。長さは 基準30〜110px × (0.25 + 0.9 × 波の強さ) で、途中で最大になる","つながる質感: 形を白で描く → 7pxぼかす → 透明度をしきい値で切る → 色（または次の画面）を塗る"],"en":["Day → night → day, 2.35 s each. Two liquid layers, both moving top to bottom with quadratic ease-in-out.","Layer 1 (flat colour: blue for day→night, coral for night→day): 0.35–1.5 s. Layer 2 (the next scene itself, clipped to the liquid shape): 0.7–1.8 s.","The liquid front moves from y = −110 to 130 px below the bottom edge. Its edge waves with two sine waves (amplitudes 13 px and 8 px), strongest midway.","Seven drips (30–54 px wide, round tips) hang from the front; length = base 30–110 px × (0.25 + 0.9 × wave strength), greatest midway.","Merged look: draw the shape in white → blur 7 px → threshold the alpha → fill with the colour (or the next scene)."]},"use":{"ja":"やわらかく有機的に場面を切り替えたいとき。食品・美容・クリエイティブ系の映像に。","en":"Use it for a soft, organic scene change, for example in food, beauty or creative videos."},"tags":["liquid","transition","drip","paint","goo","fluid","wipe","scene-change"]},{"id":"020","pack":"motion","no":"20","slug":"zoom-through","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ズームスルー","en":"Zoom through","zh-Hant":"Zoom Through 穿越轉場"},"meaning":{"ja":"物の中へ突き抜けて次へ","en":"Zooms into an object and passes through it into the next scene","zh-Hant":"鑽進物體裡穿過去，進入下一個場景"},"ask":{"ja":"ロゴの「O」の穴へズームスルーして、次の場面へ。0.6秒で、加速しながら。","en":"Zoom through the hole of the \"O\" in the logo into the next scene, 0.6 s, accelerating.","zh-Hant":"請用 Zoom Through 穿越轉場鑽進 Logo「O」的洞，進入下一個場景，0.6 秒，逐漸加速。"},"summary":{"ja":"文字の「O」の穴へ突っ込んで、その先の画面へ抜ける。","en":"The camera pushes into the hole of a letter O and comes out in the next scene."},"spec":{"ja":["画面X（黄地に ZOOM）→ 画面Y（青地に GO!）→ 画面X を2.35秒ずつ","今の画面を「O」の穴の中心（半径24.5）を基準に拡大する。最大倍率は穴が画面全体を覆う値の1.08倍（約14倍）","倍率 = 最大倍率^p（指数で拡大。速さが一定に見える）","p = 0.8 × easeIn（3乗・0.25〜1.2秒）+ 0.2 × easeOut（3乗・1.2〜1.65秒）。加速して突っ込み、最後に減速","穴の中には次の画面を 1/最大倍率 に縮めて置く。拡大が終わるとちょうど等倍になり、そのまま次の画面に切り替わる"],"en":["Scene X (ZOOM on yellow) → scene Y (GO! on blue) → scene X, 2.35 s each.","The current scene is scaled around the centre of an O's hole (radius 24.5). Maximum scale is 1.08× the value at which the hole covers the whole frame (about 14×).","Scale = maxScale^p (exponential zoom, which reads as constant speed).","p = 0.8 × cubic ease-in (0.25–1.2 s) + 0.2 × cubic ease-out (1.2–1.65 s): accelerate in, slow down at the end.","Inside the hole the next scene is placed at 1/maxScale. When the zoom ends it is exactly at full size, and the view switches to the next scene."]},"use":{"ja":"ロゴや文字の中へ入り込んで、勢いよく次の場面へ進みたいとき。","en":"Use it to dive into a logo or letter and move to the next scene with momentum."},"tags":["zoom","zoom-through","transition","push-in","scale","tunnel","scene-change"]},{"id":"021","pack":"motion","no":"21","slug":"flip","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"フリップ","en":"Flip","zh-Hant":"卡片翻轉"},"meaning":{"ja":"カードのように裏返る","en":"Turns over like a card to show the other side","zh-Hant":"像卡片一樣翻到背面"},"ask":{"ja":"料金カードをフリップで裏返して、裏に詳細を出して。0.5秒で。","en":"Flip the pricing card to show the details on its back, in 0.5 s.","zh-Hant":"請用卡片翻轉讓價格卡片翻到背面，並在背面顯示詳細內容，0.5 秒。"},"summary":{"ja":"カードが縦の軸で回って裏返り、裏の面が出る。","en":"A card turns over around its vertical axis and shows its other side."},"spec":{"ja":["カード（300×156・角丸22）。表（青・Q）⇄ 裏（黄・A）を2.35秒ずつ","0.45〜1.5秒（1.05秒）で180°回す。backOut（s=1.5）で180°を少し行き過ぎてから戻る","カードの幅 = 元の幅 × |cos θ|。90°を越えたところで面の絵を差し替える","遠近感: カードを縦に細く切り、左右で高さを最大±20% × sin θ 変える（奥が低く、手前が高い）","回転中は sin の山で8%拡大し6px浮かせる。面に暗い色を透明度 0.34 × |sin θ| で重ねる。床に楕円の影"],"en":["A card (300 × 156, radius 22). Front (blue, Q) ⇄ back (yellow, A), 2.35 s each.","Rotates 180° at 0.45–1.5 s (1.05 s) with backOut (s = 1.5), going slightly past 180° and coming back.","Card width = original width × |cos θ|. The face artwork is swapped as it passes 90°.","Perspective: the card is drawn in thin vertical slices whose height varies by up to ±20% × sin θ from one side to the other (far side shorter, near side taller).","During the turn it scales up 8% and lifts 6 px on a sine curve; a dark overlay with opacity 0.34 × |sin θ| shades the face. An elliptical shadow sits on the floor."]},"use":{"ja":"問いと答え、ビフォーとアフターなど、表と裏の関係にある2つを見せたいとき。","en":"Use it for two things that are sides of one another: question and answer, before and after."},"tags":["flip","card","3d","rotate","turn","reveal","question-answer"]},{"id":"022","pack":"motion","no":"22","slug":"light-sweep","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ライトスイープ","en":"Light sweep","zh-Hant":"掃光"},"meaning":{"ja":"光が表面を横切る","en":"A band of light crosses a surface","zh-Hant":"一道光掃過表面"},"ask":{"ja":"ロゴが止まったあとに、ライトスイープを1回。左上から右下へ、弱めに。","en":"After the logo settles, add one light sweep from top-left to bottom-right, subtle.","zh-Hant":"Logo 停住之後，請加一次掃光，由左上掃到右下，亮度淡一點。"},"summary":{"ja":"ロゴの表面を、光の帯が斜めに横切る。","en":"A band of light crosses the surface of a logo badge at an angle."},"spec":{"ja":["2.35秒で1回。バッジ（400×112・角丸28・青のグラデーション）の形で切り抜いた中だけ光を描く","光の帯: 幅116pxの白いグラデーション（中央の透明度0.72、両端0）＋ 78px離れた幅12pxの細い帯（透明度0.5）。0.42rad（約24°）傾ける","0.45〜1.5秒でバッジの左130px外から右130px外まで（660px）進む。easeInOut（2乗）","きらめき: 1.38〜1.98秒、右上の角に4角の星。大きさ 30 × sin(πq) × (1 + 0.2(1 − q))、0.9rad回す","バッジ自体は動かさない"],"en":["One sweep per 2.35 s. The light is drawn only inside a clip of the badge (400 × 112, radius 28, blue gradient).","Light band: a 116 px wide white gradient (opacity 0.72 in the middle, 0 at the edges) plus a thin 12 px band (opacity 0.5) 78 px away, rotated 0.42 rad (about 24°).","It moves from 130 px left of the badge to 130 px right of it (660 px) at 0.45–1.5 s, quadratic ease-in-out.","Sparkle: a four-point star at the top-right corner at 1.38–1.98 s; size 30 × sin(πq) × (1 + 0.2(1 − q)), rotating 0.9 rad.","The badge itself does not move."]},"use":{"ja":"ロゴ・バッジ・ボタンに上質な印象を足したいとき。","en":"Use it to give a logo, badge or button a premium finish."},"tags":["light-sweep","shine","sheen","glint","highlight","logo","badge","premium"]},{"id":"023","pack":"motion","no":"23","slug":"glitch","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"グリッチ","en":"Glitch","zh-Hant":"Glitch"},"meaning":{"ja":"映像がバグったように乱れる","en":"The picture breaks up as if it were malfunctioning","zh-Hant":"畫面像故障一樣失真跳動"},"ask":{"ja":"タイトルに一瞬だけグリッチを入れて。0.3秒、色ずれは弱めで、点滅はさせないで。","en":"Add a brief glitch to the title: 0.3 s, a mild color split, no flashing.","zh-Hant":"標題請加上短暫的 Glitch，0.3 秒，RGB 分離輕微，不要閃爍。"},"summary":{"ja":"文字が横にずれ、色がずれ、帯が走る。明るさの点滅はさせない。","en":"Text slices shift sideways, colours split and small bars appear, with no brightness flashing."},"spec":{"ja":["白い太字（104px）。4.7秒に2回乱れる: 0.55〜1.25秒（5コマ）と 2.9〜3.74秒（6コマ）。それ以外は静止","1コマ0.14秒。コマごとに決め打ちの乱れを表示する（なめらかに動かさず、コマ送りで切り替える）","色ずれ: コーラルの文字を左へ7〜16px・下へ2px、シアン（#22D3EE）の文字を右へ同じ量・上へ2px、白の文字を上に重ねる","横ずれ: 高さ10〜35pxの横帯2〜4本（y=40〜150）を、左右どちらかへ18〜64pxずらす","小さな色の帯3本（コーラル・シアン・黄、幅30〜120×高さ5〜12）をランダムな位置に置く","背景の明るさは変えない（画面全体の点滅をしない）。乱数はシード固定"],"en":["White bold text (104 px). It glitches twice per 4.7 s: 0.55–1.25 s (5 steps) and 2.9–3.74 s (6 steps); otherwise it is still.","Each step lasts 0.14 s and shows one fixed disturbance (stepped, not smoothly animated).","Colour split: a coral copy shifted 7–16 px left and 2 px down, a cyan (#22D3EE) copy shifted the same amount right and 2 px up, with the white text on top.","Slice shift: 2–4 horizontal strips (10–35 px tall, y 40–150) are displaced 18–64 px to the left or right.","Three small colour bars (coral, cyan, yellow; 30–120 wide × 5–12 tall) at random positions.","Background brightness never changes (no full-frame flashing). The random values use a fixed seed."]},"use":{"ja":"デジタル感・エラー・不穏さを出したいとき。タイトルや場面転換のアクセントに。","en":"Use it for a digital, error or uneasy feel, as an accent on titles and scene changes."},"tags":["glitch","rgb-split","chromatic-aberration","distortion","digital","error","slice"]},{"id":"024","pack":"motion","no":"24","slug":"impact-shake","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"インパクトシェイク","en":"Impact shake","zh-Hant":"畫面震動"},"meaning":{"ja":"着地の衝撃で画面が揺れる","en":"The whole frame shakes when something lands","zh-Hant":"落地的衝擊讓整個畫面震動"},"ask":{"ja":"見出しがドンと落ちた瞬間に、インパクトシェイクを入れて。0.4秒で収まる程度に。","en":"Add an impact shake when the headline lands; it should settle within 0.4 s.","zh-Hant":"標題砰地落下的瞬間，請加上畫面震動，0.4 秒內要平息。"},"summary":{"ja":"重い見出しの板がドンと落ち、その衝撃で画面ごと揺れる。","en":"A heavy headline slab drops with a thud and the whole frame shakes from the impact."},"spec":{"ja":["2.35秒で1回（1回目は黄色の板、2回目はコーラルの板）。板は250×100・角丸18","落下: 0.3〜0.62秒で画面上の外から床へ。easeIn（3乗）で加速。落下中は縦に1.12倍のびる","0.62秒に着地。画面全体を1.1秒揺らす: 横 15px × e^(−5t) × sin(2π·5t)、縦 11px × e^(−5t) × cos(2π·6.5t)、傾き 0.02rad × e^(−5t) × sin(2π·5t + 0.6)","板は着地後0.3秒、縦に最大22%つぶれて戻る（横はその分ひろがる。基準は底辺）","背景の箱4つは0.03〜0.06秒遅れて最大24px跳ねる（0.5秒）。床から白い線6本と、ほこりの丸6個が0.55秒で広がって消える","退場: 1.85〜2.2秒に板が上へ300px（backIn s=1.6）"],"en":["One drop per 2.35 s (a yellow slab first, then a coral one). The slab is 250 × 100, radius 18.","Fall: 0.3–0.62 s from above the frame to the floor, cubic ease-in (accelerating). While falling it is stretched 1.12× vertically.","Lands at 0.62 s. The whole frame shakes for 1.1 s: x 15 px × e^(−5t) × sin(2π·5t), y 11 px × e^(−5t) × cos(2π·6.5t), rotation 0.02 rad × e^(−5t) × sin(2π·5t + 0.6).","For 0.3 s after landing the slab squashes vertically by up to 22% and recovers (it widens by the same amount; anchored at its base).","Four background blocks hop up to 24 px, 0.03–0.06 s late, over 0.5 s. Six white lines and six dust puffs spread from the floor and fade within 0.55 s.","Exit: the slab moves 300 px up at 1.85–2.2 s (backIn, s = 1.6)."]},"use":{"ja":"重要な見出しや数字を、重さと衝撃で強く印象づけたいとき。","en":"Use it to land an important headline or number with weight and force."},"tags":["shake","impact","camera-shake","slam","drop","thud","headline","emphasis"]},{"id":"025","pack":"camera","no":"01","slug":"pan","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"パン","en":"Pan","zh-Hant":"橫搖"},"meaning":{"ja":"カメラを横に振る","en":"Pivot the camera left or right","zh-Hant":"攝影機原地左右轉動"},"ask":{"ja":"カメラの位置は固定で、街並みを左から右へゆっくりパン。5秒かけて。","en":"Slow pan from left to right across the skyline, camera fixed in place, over 5 seconds.","zh-Hant":"攝影機位置固定，由左往右慢慢橫搖，掃過整片街景，整段花 5 秒。"},"summary":{"ja":"カメラの位置は変えず、首を左から右へ振る。回転なので手前も奥も同じ量だけ横に流れる。","en":"The camera stays in place and pivots from left to right; because it is a rotation, near and far layers slide sideways by the same amount."},"spec":{"ja":["カメラ: 位置固定（高さ1.5m）、ヨーだけ -0.32rad → +0.32rad（-18° → +18°、計約37°）","時間: 0.5秒から3.4秒まで2.9秒かけて回す。イージングは3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物（身長約1.8m）は正面8m先で動かない。画面上では右から左へ流れる","視差なし: 山・建物・木・人物が同じ角度ぶん動く（焦点距離330px、539×208のカード）","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）","右上に角度を整数の度で表示（-18° → +18°）"],"en":["Camera: position fixed (height 1.5 m); yaw only, -0.32 rad → +0.32 rad (-18° → +18°, about 37° in total)","Timing: rotate from 0.5 s to 3.4 s (2.9 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: a person (about 1.8 m tall) stands still 8 m ahead and slides right-to-left in frame","No parallax: mountains, buildings, trees and the person all shift by the same angle (focal length 330 px on a 539×208 card)","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)","Top-right readout shows the angle in whole degrees (-18° → +18°)"]},"use":{"ja":"横に広い場所を見せるとき、または視線を左右の別の対象へ移すとき。","en":"To reveal a wide location or to shift attention from one side of the scene to the other."},"tags":["pan","panning","yaw","rotate","horizontal","camera move","reveal"]},{"id":"026","pack":"camera","no":"02","slug":"tilt","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"ティルト","en":"Tilt","zh-Hant":"直搖"},"meaning":{"ja":"カメラを縦に振る","en":"Pivot the camera up or down","zh-Hant":"攝影機原地上下轉動"},"ask":{"ja":"人物の足元から塔の先まで、ゆっくりティルトアップ。","en":"Slow tilt up from the person's feet to the top of the tower.","zh-Hant":"攝影機原地不動，從人物的腳部慢慢往上直搖，一路搖到塔頂。"},"summary":{"ja":"カメラの位置は変えず、首を下から上へ振る。足元の人物から塔の先端まで見上げていく。","en":"The camera stays in place and pivots upward, from a person at ground level up to the top of a tower."},"spec":{"ja":["カメラ: 位置固定（高さ1.4m）、ピッチだけ -0.06rad → +0.36rad（-3° → +21°、計約24°）","時間: 0.5秒から3.4秒まで2.9秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は7m先で動かない。その奥26mに高さ9.5mの塔（先端のアンテナは11.8mまで）","画面上は全体が上から下へ流れ、人物は下へ切れていき、塔の上部と先端のアンテナが入ってくる","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）","右上に角度を整数の度で表示（-3° → +21°）"],"en":["Camera: position fixed (height 1.4 m); pitch only, -0.06 rad → +0.36 rad (-3° → +21°, about 24° in total)","Timing: 0.5 s to 3.4 s (2.9 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: a person stands still 7 m ahead; a 9.5 m tower (antenna tip at 11.8 m) stands 26 m away behind","On screen everything slides downward: the person leaves at the bottom while the tower top and its antenna enter","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)","Top-right readout shows the angle in whole degrees (-3° → +21°)"]},"use":{"ja":"建物や人物の高さ・大きさを見せるとき。","en":"To show the height or scale of a building or a person."},"tags":["tilt","tilt up","pitch","vertical","look up","camera move"]},{"id":"027","pack":"camera","no":"03","slug":"dolly-in","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"ドリーイン","en":"Dolly in","zh-Hant":"Dolly in"},"meaning":{"ja":"カメラごと被写体に近づく","en":"Move the camera toward the subject","zh-Hant":"攝影機本身朝被攝體前進"},"ask":{"ja":"人物の顔へゆっくりドリーイン。ズームではなく、カメラごと近づく。","en":"Slow dolly in toward her face; move the camera, do not zoom.","zh-Hant":"用 Dolly in 讓攝影機慢慢朝她的臉前進。要實際移動攝影機，不要用變焦。"},"summary":{"ja":"カメラそのものが被写体へ前進する。手前の物ほど大きく速く流れ、奥の山はほとんど変わらない。","en":"The camera itself moves toward the subject; near objects grow and pass quickly while the distant mountains barely change."},"spec":{"ja":["カメラ: 前（奥行き方向）へ 0m → 5.8m 進む。高さ1.5m、向きと焦点距離（330px＝24mm表示）は固定","時間: 0.5秒から3.4秒まで2.9秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は8m先で動かない。距離が8m → 2.2mになり、画面上の大きさは約3.6倍","視差あり: 手前の杭（左1.5m・奥3.6m）と岩（右1.6m・奥4.8m）は途中で画面外へ抜ける。120m以上先の山はほぼ同じ大きさ","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）","右上の表示は 24mm のまま変わらない（04 ズームインとの違い）"],"en":["Camera: moves forward (in depth) 0 m → 5.8 m; height 1.5 m, direction and focal length (330 px, shown as 24mm) fixed","Timing: 0.5 s to 3.4 s (2.9 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: a person stands still 8 m ahead; distance goes 8 m → 2.2 m, so they appear about 3.6× larger","Parallax: a foreground post (1.5 m left, 3.6 m deep) and a rock (1.6 m right, 4.8 m deep) pass out of frame; mountains 120 m+ away stay almost the same size","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)","The top-right readout stays at 24mm (the difference from 04 Zoom in)"]},"use":{"ja":"人物の感情や一点へ、空間の奥行きを感じさせながら寄るとき。","en":"To move in on a person or detail while keeping a sense of depth."},"tags":["dolly","dolly in","push in","track in","move forward","parallax","camera move"]},{"id":"028","pack":"camera","no":"04","slug":"zoom-in","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"ズームイン","en":"Zoom in","zh-Hant":"Zoom in"},"meaning":{"ja":"レンズで寄る（位置は動かない）","en":"Magnify with the lens (camera stays put)","zh-Hant":"攝影機不動，只用鏡頭放大"},"ask":{"ja":"カメラは動かさず、窓辺の人物へ3秒でズームイン。","en":"The camera stays still; zoom in on the person at the window over 3 seconds.","zh-Hant":"攝影機不動，用 3 秒對窗邊的人物做 Zoom in。"},"summary":{"ja":"カメラの位置は動かさず、レンズの焦点距離だけを伸ばす。画面全体が同じ比率で拡大する。","en":"The camera does not move; only the focal length gets longer, so the whole picture enlarges by the same ratio."},"spec":{"ja":["カメラ: 位置・向きは固定（高さ1.5m）。焦点距離だけ 330px → 1200px（24mm → 87mm表示、約3.6倍）","倍率は指数補間: f = 330 × (8/2.2)^p。p は 0.5秒〜3.4秒（2.9秒）の3次イーズインアウト","被写体: 人物は8m先で動かない。最終の大きさは 03 ドリーインと同じ約3.6倍","視差なし: 手前の杭・岩、人物、建物、山がすべて同じ比率で大きくなる（重なり方が変わらない）","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）","右上に焦点距離を mm で表示（24mm → 87mm）"],"en":["Camera: position and direction fixed (height 1.5 m); only the focal length changes, 330 px → 1200 px (shown as 24mm → 87mm, about 3.6×)","Exponential interpolation: f = 330 × (8/2.2)^p, where p is a cubic ease-in-out from 0.5 s to 3.4 s (2.9 s)","Subject: a person stands still 8 m ahead; the final size matches 03 Dolly in (about 3.6×)","No parallax: the foreground post and rock, the person, buildings and mountains all scale by the same ratio (overlaps do not change)","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)","Top-right readout shows the focal length in mm (24mm → 87mm)"]},"use":{"ja":"その場から動かずに一点へ注目を集めるとき。ドリーインより平面的で観察する印象になる。","en":"To direct attention to one point without moving the camera; it looks flatter and more observational than a dolly in."},"tags":["zoom","zoom in","focal length","lens","magnify","telephoto","camera move"]},{"id":"029","pack":"camera","no":"05","slug":"tracking-shot","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"トラッキング","en":"Tracking shot","zh-Hant":"跟拍"},"meaning":{"ja":"被写体と並んで動く","en":"Move along with the subject","zh-Hant":"攝影機跟著被攝體一起移動"},"ask":{"ja":"歩く人物を真横からトラッキング。同じ速さで並んで動く。","en":"Tracking shot from the side, moving along with the walking person at the same speed.","zh-Hant":"攝影機從正側面跟拍走路的人物，以相同速度與他並排移動。"},"summary":{"ja":"歩く人物と同じ速さでカメラが真横に並走する。人物は画面中央のまま、手前の杭ほど速く後ろへ流れる。","en":"The camera moves sideways at the same speed as a walking person; the person stays centred while nearer posts sweep past faster."},"spec":{"ja":["カメラ: 右へ等速 1.7m/s で横移動（x = -4.0m → +4.0m、4.7秒）。高さ1.3m、向きは正面のまま。イージングなし","被写体: 人物はカメラと同じ x を歩く（奥7.5m）。画面中央から動かない。脚と腕は sin(u×7)×0.42rad で振る","視差: 奥4mに1.6m間隔で並ぶ杭が最も速く左へ流れ、木、建物（48m先）の順に遅くなり、山はほぼ動かない","右上に「→ 1.7m/s」を表示","くり返し: 4.7秒ごとに開始位置へ戻る（杭と地面の格子は継ぎ目が合うが、背景の建物と木は位置が飛ぶ）"],"en":["Camera: moves right at a constant 1.7 m/s (x = -4.0 m → +4.0 m in 4.7 s); height 1.3 m, facing straight ahead; no easing","Subject: a person walks at the same x as the camera (7.5 m away) and stays in the centre of frame; legs and arms swing by sin(u×7)×0.42 rad","Parallax: posts every 1.6 m at 4 m depth sweep left fastest, then trees, then buildings (48 m away); mountains hardly move","Top-right readout shows \"→ 1.7m/s\"","Repeat: jumps back to the start every 4.7 s (posts and ground grid line up at the seam; background buildings and trees jump)"]},"use":{"ja":"歩く・走る人物に付いていき、移動している感じを保ったまま表情や動作を見せるとき。","en":"To follow a walking or running subject and keep the sense of movement while showing their action."},"tags":["tracking","tracking shot","follow","truck","lateral","sideways","parallax","walk"]},{"id":"030","pack":"camera","no":"06","slug":"orbit-arc-shot","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"オービット","en":"Orbit (Arc shot)","zh-Hant":"環繞運鏡"},"meaning":{"ja":"被写体の周りを回り込む","en":"Circle around the subject","zh-Hant":"攝影機繞著被攝體轉"},"ask":{"ja":"立っている人物の周りを半周オービット。人物は画面の中央のまま。","en":"Half orbit around the standing person, keeping them in the center of the frame.","zh-Hant":"用環繞運鏡讓攝影機繞著站立的人物走半圈，人物始終保持在畫面中央。"},"summary":{"ja":"被写体を中心に、カメラが円を描いて回り込む。人物は中央のまま、背景の木と建物が横に大きく流れる。","en":"The camera travels on a circle around the subject; the person stays centred while the trees and buildings behind sweep sideways."},"spec":{"ja":["カメラ: 人物（正面9m先）を中心とする半径6mの円周上を -0.95rad → +0.95rad（-54° → +54°、計約109°）移動","向き: 常に中心を向く（ヨー = -角度）。高さ1.7m、ピッチ -0.07rad（約4°下向き）で固定","時間: 0.5秒から3.6秒まで3.1秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は動かない。顔の白い点が角度に応じて横へずれ、回り込みが分かる。足元に半径1.3mの点線の円","背景: 半径10mに12本の木を等間隔で並べ、回り込むと人物の後ろを横切る","戻り: 3.6〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード。右上に角度（-54° → +54°）"],"en":["Camera: travels on a circle of radius 6 m centred on the person (9 m ahead), from -0.95 rad → +0.95 rad (-54° → +54°, about 109° in total)","Direction: always faces the centre (yaw = -angle); height 1.7 m, pitch fixed at -0.07 rad (about 4° down)","Timing: 0.5 s to 3.6 s (3.1 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: the person does not move; a white dot on the face shifts sideways with the angle; a dashed circle of radius 1.3 m marks the ground","Background: 12 trees evenly spaced on a 10 m radius cross behind the person as the camera moves round","Return: hold 3.6–4.2 s, then cross-fade back over the last 0.5 s; top-right readout shows the angle (-54° → +54°)"]},"use":{"ja":"人物や商品を立体的に見せたいとき、登場や決めの場面を強調するとき。","en":"To show a person or product in three dimensions, or to emphasise an entrance or a key moment."},"tags":["orbit","arc shot","circle","360","rotate around","revolve","camera move"]},{"id":"031","pack":"camera","no":"07","slug":"crane-up","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"クレーンアップ","en":"Crane up","zh-Hant":"升鏡"},"meaning":{"ja":"カメラが上へ昇っていく","en":"Lift the camera up","zh-Hant":"攝影機往上升起"},"ask":{"ja":"人物の目の高さから、街全体が見える高さまでクレーンアップ。","en":"Crane up from eye level until the whole town comes into view.","zh-Hant":"攝影機從人物的視線高度垂直往上升鏡，一路升到整個小鎮都入鏡為止。"},"summary":{"ja":"カメラが真上へ上昇しながら下を向き、人物を見下ろす構図になる。","en":"The camera rises while tilting down until it looks down on the person."},"spec":{"ja":["カメラ: 高さ 1.4m → 9m へ上昇。同時に前へ 0m → 1.5m 進む","向き: 人物（8m先）を画面に収めるよう下へ振る。ピッチ = -0.86 × atan2(高さ-1.0, 8-前進量)。約 -2.5° → -44°","時間: 0.5秒から3.4秒まで2.9秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は動かない。上昇につれて小さくなり、地面の格子が画面いっぱいに広がって地平線は上へ抜ける","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）","右上に高さを表示（↑ 1.4m → ↑ 9.0m）"],"en":["Camera: rises from 1.4 m to 9 m while moving forward 0 m → 1.5 m","Direction: tilts down to keep the person (8 m ahead) in frame; pitch = -0.86 × atan2(height - 1.0, 8 - forward), about -2.5° → -44°","Timing: 0.5 s to 3.4 s (2.9 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: the person does not move; they get smaller as the camera rises, the ground grid fills the frame and the horizon leaves at the top","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)","Top-right readout shows the height (↑ 1.4m → ↑ 9.0m)"]},"use":{"ja":"場面の終わりに人物から離れて全体を見せるとき、場所の広さを明かすとき。","en":"To pull away from a person at the end of a scene or to reveal how large the location is."},"tags":["crane","crane up","jib","boom up","rise","high angle","camera move"]},{"id":"032","pack":"camera","no":"08","slug":"dolly-zoom-vertigo","category":"camera-movement","width":539,"height":208,"cycle":9.4,"name":{"ja":"ドリーズーム","en":"Dolly zoom (Vertigo)","zh-Hant":"希區考克變焦"},"meaning":{"ja":"人物はそのまま背景だけ伸び縮み","en":"Subject stays, background warps","zh-Hant":"主體大小不變，背景被拉扯變形"},"ask":{"ja":"気づいた瞬間の顔にドリーズーム。人物の大きさは変えず、背景だけが遠ざかる。","en":"Dolly zoom on his face at the moment he realizes: he stays the same size while the background stretches away.","zh-Hant":"在他意識到的瞬間，對他的臉用希區考克變焦：人物大小維持不變，只有背景往後拉遠。"},"summary":{"ja":"カメラを引きながら同じ比率でズームする。人物の大きさは変わらず、背景だけが迫ってくる。","en":"The camera pulls back while zooming in by the same ratio; the person keeps the same size and only the background closes in."},"spec":{"ja":["カメラ: 人物（8m先）との距離 d を 3.2m → 8m に広げる（4.8m後退）。高さ1.3m","焦点距離: f = 330 × d/8 px。132px → 330px（10mm → 24mm表示）。距離と焦点距離の比を一定に保つ","時間: 0.5秒から3.4秒まで2.9秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は動かず、画面上の高さも一定。頭（1.8m）と足元に幅160pxの青い点線を引き、大きさが変わらないことを示す","背景: 建物（48m先）は約2.2倍、山は約2.4倍に拡大して人物の後ろに迫る。人物より手前の地面は逆に縮む","戻り: 3.4〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード（1周4.7秒）"],"en":["Camera: distance d to the person (8 m ahead) widens from 3.2 m → 8 m (a 4.8 m pull-back); height 1.3 m","Focal length: f = 330 × d/8 px, i.e. 132 px → 330 px (shown as 10mm → 24mm), keeping distance ÷ focal length constant","Timing: 0.5 s to 3.4 s (2.9 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: the person does not move and keeps the same height in frame; blue dashed lines 160 px wide at head (1.8 m) and feet show the size is constant","Background: buildings (48 m away) grow about 2.2× and mountains about 2.4×, closing in behind the person, while the ground in front of the person shrinks","Return: hold 3.4–4.2 s, then cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)"]},"use":{"ja":"人物が何かに気づいた瞬間や、不安・動揺を映像で表すとき。","en":"For a moment of realisation, or to show unease or shock visually."},"tags":["dolly zoom","vertigo","zolly","push pull","background stretch","unease","camera move"]},{"id":"033","pack":"camera","no":"09","slug":"rack-focus","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"ラックフォーカス","en":"Rack focus","zh-Hant":"焦點轉移"},"meaning":{"ja":"ピントを手前と奥のあいだで送る","en":"Shift focus between near and far","zh-Hant":"焦點在前景與後景之間轉移"},"ask":{"ja":"手前のカップから奥の人物へ、1秒でラックフォーカス。","en":"Rack focus from the cup in the foreground to the person behind it, in 1 second.","zh-Hant":"用 1 秒做焦點轉移，把對焦點從前景的杯子移到後方的人物。"},"summary":{"ja":"カメラは動かさず、ピントを手前の花から奥の人物へ送る。ぼけている側が入れ替わる。","en":"The camera does not move; focus shifts from a flower in the foreground to a person behind it, swapping which one is blurred."},"spec":{"ja":["カメラ: 位置・向き・焦点距離すべて固定（高さ1.1m）。変わるのはぼかしの量だけ","ぼかし: 手前の花（左0.75m・奥2m）を 0px → 7px、人物と背景（人物は右0.9m・奥9m）を 6px → 0px。地面の格子は背景の0.6倍","時間: 1.0秒から2.6秒まで1.6秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","ピント枠: 青い四隅の枠が花から人物へ直線移動し、一辺の半分が 46px → 30px に縮む","被写体: 花も人物も動かない","戻り: 2.6〜4.2秒は止め、最後の0.5秒で開始状態へクロスフェード。右上にピント距離（◎ 2m → ◎ 9m）"],"en":["Camera: position, direction and focal length all fixed (height 1.1 m); only the blur amounts change","Blur: the foreground flower (0.75 m left, 2 m away) goes 0 px → 7 px; the person and background (person 0.9 m right, 9 m away) go 6 px → 0 px; the ground grid uses 0.6× the background blur","Timing: 1.0 s to 2.6 s (1.6 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Focus marker: blue corner brackets travel in a straight line from the flower to the person, half-width shrinking 46 px → 30 px","Subject: neither the flower nor the person moves","Return: hold 2.6–4.2 s, then cross-fade back over the last 0.5 s; top-right readout shows focus distance (◎ 2m → ◎ 9m)"]},"use":{"ja":"カットを割らずに、見てほしい対象を手前から奥（または逆）へ移すとき。","en":"To move attention from foreground to background (or back) without cutting."},"tags":["rack focus","focus pull","pull focus","depth of field","blur","bokeh","foreground"]},{"id":"034","pack":"camera","no":"10","slug":"handheld","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"手持ち","en":"Handheld","zh-Hant":"手持"},"meaning":{"ja":"手で持って撮ったように小さく揺らす（ハンドヘルド）","en":"A slight shake, as if the camera were held by hand","zh-Hant":"像用手拿著拍的輕微晃動"},"ask":{"ja":"手持ちで、歩く人物の後ろをついていく。揺れは弱めに。","en":"Handheld shot following behind the walking person, with only a slight shake.","zh-Hant":"用手持攝影從後方跟著走路的人物拍攝，晃動要輕微。"},"summary":{"ja":"三脚を使わず手で持ったような、小さく不規則な揺れを画面全体に加える。","en":"Adds a small, irregular shake to the whole frame, as if the camera were held by hand instead of on a tripod."},"spec":{"ja":["カメラ: 位置はほぼ固定。ヨー・ピッチ・ロール・高さに、周期の違う正弦波を重ねた揺れを足す（T = 2π×u/4.7）","ヨー(rad) = 0.016·sin(3T) + 0.008·sin(7T+1) + 0.004·sin(13T+2)。最大で約±1.6°","ピッチ(rad) = 0.012·sin(4T+2) + 0.006·sin(9T+0.5) + 0.003·sin(17T+1.2)。最大で約±1.2°","ロール(rad) = 0.02·sin(5T+1) + 0.008·sin(11T+3)。最大で約±1.6°。高さ = 1.5 + 0.03·sin(6T) m","被写体: 人物は6.5m先で動かない。イージングや止めはなく揺れ続ける","係数がすべて整数倍なので4.7秒で継ぎ目なく戻る。右上に「HANDHELD」"],"en":["Camera: position almost fixed; yaw, pitch, roll and height each get a sum of sine waves with different periods (T = 2π×u/4.7)","Yaw (rad) = 0.016·sin(3T) + 0.008·sin(7T+1) + 0.004·sin(13T+2), at most about ±1.6°","Pitch (rad) = 0.012·sin(4T+2) + 0.006·sin(9T+0.5) + 0.003·sin(17T+1.2), at most about ±1.2°","Roll (rad) = 0.02·sin(5T+1) + 0.008·sin(11T+3), at most about ±1.6°; height = 1.5 + 0.03·sin(6T) m","Subject: a person stands still 6.5 m ahead; the shake runs continuously with no easing or hold","All multipliers are integers, so it loops seamlessly every 4.7 s; top-right readout shows \"HANDHELD\""]},"use":{"ja":"ドキュメンタリーのような臨場感や、その場にいる感じを出すとき。","en":"To give a documentary feel or the sense of being present in the scene."},"tags":["handheld","camera shake","shaky","documentary","wobble","noise","realism"]},{"id":"035","pack":"camera","no":"11","slug":"fpv-drone-shot","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"FPV","en":"FPV drone shot","zh-Hant":"FPV 穿越機"},"meaning":{"ja":"ドローンで突き進む疾走感","en":"Fast, immersive fly-through","zh-Hant":"高速、身歷其境的穿梭飛行"},"ask":{"ja":"FPVドローンで、森の木々の間をすり抜けて川の上へ出る。","en":"FPV drone shot weaving between the trees and out over the river.","zh-Hant":"用 FPV 穿越機鏡頭在樹林間高速穿梭，再飛出樹林、來到河面上方。"},"summary":{"ja":"並木の間を低空・高速で前進しながら、機体を左右に傾けて蛇行する一人称視点。","en":"A first-person view flying low and fast between two rows of trees, banking from side to side."},"spec":{"ja":["カメラ: 前へ等速 14m/s（50km/h表示）。イージングなしで進み続ける。ピッチは -0.05rad で固定","蛇行（T = 2π×u/4.7、4.7秒に2往復）: 横位置 0.6·sin(2T-0.4) m、高さ 1.4 + 0.5·sin(2T) m","傾き: ロール 0.22·sin(2T+0.6) rad（約±12.6°）、ヨー 0.05·sin(2T) rad（約±2.9°）","被写体なし。左右3.6mの位置に高さ4.2mの木を8m間隔で並べ、左右は4mずらす。次々に手前へ流れる","スピード線: 中心から放射状に10本、長さ約32〜76px（横方向ほど長い）、半透明の灰色。外側へ流れて循環する","止め・戻りのクロスフェードなし（4.7秒ごとに木の並びの位相がずれて切り替わる）"],"en":["Camera: flies forward at a constant 14 m/s (shown as 50km/h) with no easing; pitch fixed at -0.05 rad","Weave (T = 2π×u/4.7, two swings per 4.7 s): sideways 0.6·sin(2T-0.4) m, height 1.4 + 0.5·sin(2T) m","Bank: roll 0.22·sin(2T+0.6) rad (about ±12.6°), yaw 0.05·sin(2T) rad (about ±2.9°)","No subject. Trees 4.2 m tall stand 3.6 m to each side, every 8 m, the two rows offset by 4 m, and rush toward the camera","Speed lines: 10 radial strokes about 32–76 px long (longer toward the sides) in translucent grey, flowing outward and recycling","No hold and no cross-fade reset (the tree rows shift phase when it restarts every 4.7 s)"]},"use":{"ja":"スピード感と没入感を出すとき。場所の中を一気に通り抜けて見せるとき。","en":"For speed and immersion, or to fly through a location in one continuous move."},"tags":["fpv","drone","fly through","first person","banking","speed","aerial"]},{"id":"036","pack":"camera","no":"12","slug":"dutch-angle","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"ダッチアングル","en":"Dutch angle","zh-Hant":"荷蘭角"},"meaning":{"ja":"画面を斜めに傾ける","en":"Tilt the frame diagonally","zh-Hant":"讓畫面沿鏡頭軸向歪斜一邊"},"ask":{"ja":"不安な場面なので、ダッチアングルで15度ほど傾けて。","en":"Use a Dutch angle of about 15 degrees for this uneasy scene.","zh-Hant":"這場戲氣氛不安，請用荷蘭角，讓畫面歪斜約 15 度。"},"summary":{"ja":"水平だったカメラを光軸まわりに傾け、地平線を斜めにしたまま止める。","en":"A level camera rolls around its lens axis and holds with the horizon on a diagonal."},"spec":{"ja":["カメラ: 位置固定（高さ1.5m）。ロールだけ 0 → 0.36rad（約21°）。画面中央を軸に全体が回る","時間: 0.6秒から2.2秒まで1.6秒。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","被写体: 人物は7m先で動かない。地平線・建物・人物がそろって同じ角度だけ傾く","止め: 2.2〜4.2秒は傾いたまま保つ（傾けた構図そのものを見せる時間）","戻り: 最後の0.5秒で水平の開始状態へクロスフェード（1周4.7秒）","右上に角度を表示（∠ 0° → ∠ 21°）"],"en":["Camera: position fixed (height 1.5 m); roll only, 0 → 0.36 rad (about 21°); the whole picture turns around the frame centre","Timing: 0.6 s to 2.2 s (1.6 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Subject: a person stands still 7 m ahead; horizon, buildings and person all tilt by the same angle","Hold: stays tilted from 2.2 s to 4.2 s (time to read the tilted composition itself)","Return: cross-fade back to the level start over the last 0.5 s (one pass = 4.7 s)","Top-right readout shows the angle (∠ 0° → ∠ 21°)"]},"use":{"ja":"不安・緊張・違和感を画面で表すとき。","en":"To express unease, tension or the feeling that something is wrong."},"tags":["dutch angle","dutch tilt","canted angle","oblique","roll","tension","tilted horizon"]},{"id":"037","pack":"camera","no":"13","slug":"slow-motion","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"スローモーション","en":"Slow motion","zh-Hant":"慢動作"},"meaning":{"ja":"動きをゆっくり見せる","en":"Play the action slower","zh-Hant":"把動作放慢播放"},"ask":{"ja":"水しぶきが上がる瞬間を、スローモーションで。","en":"Show the moment of the splash in slow motion.","zh-Hant":"用慢動作呈現水花濺起的瞬間。"},"summary":{"ja":"固定カメラの前で人物がゆっくり跳び上がり、葉もゆっくり落ちる。動き全体を引き伸ばして見せる。","en":"In front of a fixed camera a person rises and falls slowly through a jump while leaves drift down slowly; the whole action is stretched out."},"spec":{"ja":["カメラ: 完全に固定（高さ1.3m）。動くのは被写体だけ","被写体: 人物（7m先）が1回の跳躍に3.8秒かける（0.5秒〜4.3秒）。高さ = 4q(1-q)×1.1m の放物線、頂点1.1m。q は等速","跳んでいる間は両腕を上げる。跳ぶ前の0.5秒と着地後の0.4秒は立ったまま","葉: 9枚が高さ3.4mから地面まで4.7秒かけて落ち、回転する。位相を1/9ずつずらして循環","右上に「120fps ×0.25」を表示（4倍に引き伸ばした再生という設定）","止め・クロスフェードなし。4.7秒で継ぎ目なくくり返す"],"en":["Camera: completely fixed (height 1.3 m); only the subject moves","Subject: a person 7 m away takes 3.8 s for one jump (0.5 s to 4.3 s); height = 4q(1-q)×1.1 m, a parabola peaking at 1.1 m, with q linear in time","Both arms are raised while airborne; the person stands still for 0.5 s before the jump and 0.4 s after landing","Leaves: 9 leaves fall from 3.4 m to the ground over 4.7 s while rotating, each offset by 1/9 of the cycle","Top-right readout shows \"120fps ×0.25\" (playback stretched 4×)","No hold and no cross-fade; loops seamlessly every 4.7 s"]},"use":{"ja":"一瞬の動きや表情をじっくり見せたいとき、感情の山場を強調するとき。","en":"To let viewers study a brief action or expression, or to emphasise an emotional peak."},"tags":["slow motion","slow-mo","slomo","high frame rate","120fps","time stretch","jump"]},{"id":"038","pack":"camera","no":"14","slug":"speed-ramp","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"スピードランプ","en":"Speed ramp","zh-Hant":"速度漸變"},"meaning":{"ja":"速い→遅いと速さを変える","en":"Change speed mid-shot","zh-Hant":"同一個鏡頭中途改變速度"},"ask":{"ja":"ジャンプの頂点だけ遅くなるスピードランプ。前後は通常の速さで。","en":"Speed ramp: normal speed, slowing at the top of the jump, then back to normal.","zh-Hant":"速度漸變：跳躍前後維持正常速度，只在跳到最高點時平順放慢。"},"summary":{"ja":"1つのショットの途中で再生速度を速い状態から遅い状態へ滑らかに変える。左下のグラフが速度を示す。","en":"Within one shot the playback speed changes smoothly from fast to slow; a graph at bottom left shows the speed."},"spec":{"ja":["カメラ: 完全に固定（高さ1.3m）。変わるのは再生速度だけ","再生速度: 2.4倍 → 0.25倍。切り替えは1.2秒から1.9秒までの0.7秒、2次のイーズインアウト（cubic-bezier(0.45,0,0.55,1) 相当）","被写体: 人物（8m先）が左6mから右へ走る。位置 x = -6 + 映像時間×2.0 m。速い区間で一気に近づく","跳躍: x が -1.5m〜2.5m の間で放物線、頂点0.99m、両腕を上げる。約0.94秒で踏み切り、滞空の大半をスローで見せて約3.68秒で着地","グラフ: 左下に幅120×高さ40pxの速度曲線と現在位置の青い点（半径5px）","戻り: 4.2秒で止め、最後の0.5秒で開始状態へクロスフェード。右上に倍率（×2.4 → ×0.3）"],"en":["Camera: completely fixed (height 1.3 m); only the playback speed changes","Playback speed: 2.4× → 0.25×; the change takes 0.7 s (1.2 s to 1.9 s) with a quadratic ease-in-out (about cubic-bezier(0.45,0,0.55,1))","Subject: a person 8 m away runs from 6 m left toward the right; x = -6 + footage time × 2.0 m; they close in quickly during the fast section","Jump: a parabola while x is between -1.5 m and 2.5 m, peak 0.99 m, arms raised; take-off at about 0.94 s, most of the airtime plays in slow motion, landing at about 3.68 s","Graph: a 120×40 px speed curve at bottom left with a blue dot (radius 5 px) at the current time","Return: stops at 4.2 s, then cross-fades back over the last 0.5 s; top-right readout shows the rate (×2.4 → ×0.3)"]},"use":{"ja":"動きの見せ場だけをスローにして、前後はテンポよく進めたいとき。","en":"To slow down only the key part of an action while keeping the lead-in quick."},"tags":["speed ramp","time remap","ramping","fast to slow","variable speed","velocity"]},{"id":"039","pack":"camera","no":"15","slug":"time-lapse","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"タイムラプス","en":"Time-lapse","zh-Hant":"縮時攝影"},"meaning":{"ja":"長い時間を早送りで見せる","en":"Compress hours into seconds","zh-Hant":"把幾個小時壓縮成幾秒"},"ask":{"ja":"夕方から夜まで、街の灯りがともっていくタイムラプス。","en":"Time-lapse of the city from dusk to night as the lights come on.","zh-Hant":"用縮時攝影拍城市從黃昏到入夜、燈一盞盞亮起來。"},"summary":{"ja":"固定カメラのまま、朝6時から夕方18時までを数秒に縮める。太陽・雲・人・影が早送りで動く。","en":"With a fixed camera, 06:00 to 18:00 is compressed into a few seconds; sun, clouds, people and shadows move in fast forward."},"spec":{"ja":["カメラ: 完全に固定（高さ1.6m、ピッチ +0.08rad＝約5°上向き）","時間: 0.4秒から4.1秒まで3.7秒で12時間ぶん進める。3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","太陽: 角度 a = -1.25rad → +1.25rad の弧を左から右へ。位置は (sin a×120, cos a×60 - 8) m、奥170m","雲3つ: 右へ合計140m流れ、80mごとに循環。人影7つ: 左右18mの幅をそれぞれ6回横切る（奇数番と偶数番は逆向き）","建物の影: 太陽と反対側へ伸び、太陽の動きに合わせて向きが振れる（半透明の灰色）","戻り: 最後の0.5秒で開始状態へクロスフェード。右上の時計は 06:00 → 18:00 を10分刻みで表示"],"en":["Camera: completely fixed (height 1.6 m, pitch +0.08 rad, about 5° up)","Timing: 12 hours pass in 3.7 s (0.4 s to 4.1 s), cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","Sun: travels left to right along an arc, angle a = -1.25 rad → +1.25 rad; position (sin a×120, cos a×60 - 8) m at 170 m depth","Three clouds drift 140 m to the right in total, wrapping every 80 m; seven small figures each cross an 18 m width 6 times (odd and even ones in opposite directions)","Building shadows fall away from the sun and swing as it moves (translucent grey)","Return: cross-fade back to the start over the last 0.5 s; the top-right clock runs 06:00 → 18:00 in 10-minute steps"]},"use":{"ja":"長い時間の経過や、街・空・作業の変化を短く見せるとき。","en":"To show a long stretch of time, or how a city, sky or task changes, in a short clip."},"tags":["time-lapse","timelapse","fast forward","time compression","sun","clouds","day to night"]},{"id":"040","pack":"camera","no":"16","slug":"freeze-frame","category":"shooting-style-time","width":539,"height":208,"cycle":9.4,"name":{"ja":"フリーズフレーム","en":"Freeze frame","zh-Hant":"定格"},"meaning":{"ja":"動きを一瞬止める","en":"Pause the action for a beat","zh-Hant":"讓動作停住一拍"},"ask":{"ja":"振り向いた瞬間でフリーズフレーム。1秒止めて、名前を出す。","en":"Freeze frame at the moment she turns around; hold for 1 second and show her name.","zh-Hant":"在她轉身的瞬間定格，停住 1 秒，並顯示她的名字字幕。"},"summary":{"ja":"跳び上がった人物が頂点に来た瞬間に映像を止め、1.4秒後に続きから再開する。","en":"The picture stops at the moment a jumping person reaches the top, then resumes from the same frame 1.4 s later."},"spec":{"ja":["カメラ: 完全に固定（高さ1.3m）。止まるのは映像の時間","停止: 1.6秒で止め、3.0秒で再開（1.4秒間）。映像時間は 0〜1.6秒は等速、停止中は1.6秒のまま、再開後は u-1.4","被写体: 人物（7m先）の跳躍は映像時間0.6〜2.6秒の放物線、頂点1.1m。停止位置は頂点ちょうど（進み50%）","停止中は落ち葉9枚も止まる。葉の速さは 13 スローモーションの1.5倍","停止の印: 太さ5pxの青い枠と、下中央の一時停止マーク（68×40pxの白い角丸に青い縦棒2本）。出入りは0.12秒のフェード","右上に停止中だけ「FREEZE」を表示。戻りのクロスフェードなし"],"en":["Camera: completely fixed (height 1.3 m); what stops is the footage time","Freeze: stops at 1.6 s and resumes at 3.0 s (1.4 s); footage time runs normally for 0–1.6 s, stays at 1.6 s while frozen, then continues as u-1.4","Subject: the jump of a person 7 m away is a parabola over footage time 0.6–2.6 s, peak 1.1 m; the freeze lands exactly on the peak (50% through)","Nine falling leaves also stop during the freeze; they fall 1.5× as fast as in 13 Slow motion","Freeze markers: a 5 px blue border and a pause icon at bottom centre (two blue bars on a 68×40 px white rounded box), fading in and out over 0.12 s","Top-right readout shows \"FREEZE\" only while frozen; no cross-fade reset"]},"use":{"ja":"決定的な瞬間を強調するとき、止めた画に名前や説明のテロップを載せるとき。","en":"To emphasise a decisive moment, or to pause so a name or caption can be placed over the frame."},"tags":["freeze frame","still frame","pause","hold","stop motion","highlight"]},{"id":"041","pack":"camera","no":"17","slug":"jump-cut","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"ジャンプカット","en":"Jump cut","zh-Hant":"跳接"},"meaning":{"ja":"同じ画角のまま時間を飛ばす","en":"Same framing, skip ahead in time","zh-Hant":"同樣的構圖，時間往前跳"},"ask":{"ja":"同じ画角のままジャンプカットでつないで、準備の様子をテンポよく見せる。","en":"Use jump cuts from the same framing to move quickly through the preparation.","zh-Hant":"維持同一個構圖，用跳接節奏明快地帶過準備的過程。"},"summary":{"ja":"カメラの位置も画角も同じまま、人物の位置と時刻だけが飛ぶ。同じ場面の中で時間を省く切り方。","en":"Camera position and framing stay the same while the person's position and the clock jump; time is skipped inside one scene."},"spec":{"ja":["つなぎ方: つなぎの効果なしの直結（0フレーム）。5ショットを0.94秒ずつ（4.7秒÷5）","カメラ: 全ショット同じ位置・同じ画角（高さ1.4m、正面向き）。背景は1pxも動かない","変わるもの: 人物（7m先）の横位置が -2.2m → 1.4m → -0.4m → 2.4m → 0.6m と飛ぶ。2・4番目は両腕を上げた姿勢","各ショットの中では人物は動かない（位置と姿勢の差だけで飛びを見せる）","右上の時計: 10:02 → 10:17 → 10:41 → 11:06 → 11:30。同じ場所で時間が飛んだことを示す","5番目から1番目へも直結で戻る"],"en":["Join: a straight cut with no effect (0 frames); 5 shots of 0.94 s each (4.7 s ÷ 5)","Camera: identical position and framing in every shot (height 1.4 m, facing forward); the background does not move by a pixel","What changes: the person (7 m away) jumps in sideways position, -2.2 m → 1.4 m → -0.4 m → 2.4 m → 0.6 m; in shots 2 and 4 both arms are raised","Within each shot the person is still (the jump is shown only by the difference in position and pose)","Top-right clock: 10:02 → 10:17 → 10:41 → 11:06 → 11:30, showing that time was skipped in the same place","Shot 5 cuts straight back to shot 1"]},"use":{"ja":"話や作業の間を詰めてテンポを上げるとき、時間の経過を短く示すとき。","en":"To tighten pauses in talk or work and raise the pace, or to show time passing quickly."},"tags":["jump cut","cut","time skip","same framing","vlog","ellipsis","edit"]},{"id":"042","pack":"camera","no":"18","slug":"match-cut","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"マッチカット","en":"Match cut","zh-Hant":"匹配剪接"},"meaning":{"ja":"形や動きをそろえて場面を変える","en":"Cut on a matching shape or motion","zh-Hant":"用相同的形狀或動作接到下一個鏡頭"},"ask":{"ja":"丸いコーヒーカップから、同じ位置にある満月へマッチカット。","en":"Match cut from the round coffee cup to a full moon in the same position.","zh-Hant":"用匹配剪接，從圓形的咖啡杯接到滿月，兩者在畫面中的位置相同。"},"summary":{"ja":"投げ上げたボールが、次のカットでは同じ位置・同じ大きさの太陽になる。形をそろえて別の場面へつなぐ。","en":"A thrown ball becomes, in the next shot, a sun at the same position and size; two different scenes are joined on a matching shape."},"spec":{"ja":["つなぎ方: 2.3秒で直結（0フレーム）。前後で青い円の位置（中心から右120px・上46px）と半径17pxを一致させる","前の絵（0〜2.3秒）: 固定カメラ（高さ1.4m）。人物（左1.2m・奥7m）が0.5秒から両腕を上げてボールを投げる。3次のイーズアウト（cubic-bezier(0.33,1,0.68,1) 相当）","ボール: 人物の頭上（高さ2.3m）から一致点へ移動。半径 5px → 17px、途中は最大30px上へふくらむ弧","後の絵（2.3〜4.7秒）: 別の場所（建物なし・高さ1.2m）。同じ位置の青い円が太陽になり、2.4秒かけて14px下がる","目印: 半径26pxの青い点線の円を、カットの前後0.7秒だけフェードで表示","右上に「SHOT 1」→「SHOT 2」。4.7秒でSHOT 1へ直結で戻る"],"en":["Join: a straight cut at 2.3 s (0 frames); the blue circle has the same position (120 px right, 46 px above centre) and radius 17 px on both sides","Outgoing shot (0–2.3 s): fixed camera (height 1.4 m); a person (1.2 m left, 7 m away) throws a ball from 0.5 s, cubic ease-out (about cubic-bezier(0.33,1,0.68,1))","Ball: travels from above the person's head (2.3 m high) to the match point; radius 5 px → 17 px, on an arc bulging up to 30 px","Incoming shot (2.3–4.7 s): a different place (no buildings, height 1.2 m); the blue circle in the same spot is now the sun and sinks 14 px over 2.4 s","Marker: a blue dashed circle of radius 26 px fades in and out within 0.7 s either side of the cut","Top-right readout shows \"SHOT 1\" → \"SHOT 2\"; at 4.7 s it cuts straight back to SHOT 1"]},"use":{"ja":"時間や場所が大きく離れた2つの場面を、形や動きの共通点で意味を持たせてつなぐとき。","en":"To link two scenes far apart in time or place through a shared shape or motion."},"tags":["match cut","graphic match","shape match","cut","transition","edit"]},{"id":"043","pack":"camera","no":"19","slug":"whip-pan","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"ホイップパン","en":"Whip pan","zh-Hant":"甩鏡"},"meaning":{"ja":"素早く振ってブレで次へ","en":"Fast pan blur into the next shot","zh-Hant":"快速橫搖，在動態模糊中接到下一個鏡頭"},"ask":{"ja":"ホイップパンで右へ素早く振って、次の場所へつなぐ。","en":"Whip pan to the right and land in the next location.","zh-Hant":"攝影機原地快速往右甩鏡，在動態模糊中接到下一個地點。"},"summary":{"ja":"カメラを素早く横に振り、流れてぼけた映像の中で次の場面に入れ替える。","en":"The camera swings sideways very fast and the next scene is swapped in during the streaked blur."},"spec":{"ja":["つなぎ方: 1.7秒から2.5秒までの0.8秒。前半0.4秒は前の絵を振り出し、後半0.4秒は次の絵が振り込んで止まる","前半: 前の絵のヨーを 0 → +0.45rad（約26°）、2次のイーズインアウト。後半: 次の絵のヨーを -0.45rad → 0、同じイージング","入れ替え: 進み50%の瞬間に直結で差し替える。ぶれが最大なので切れ目は見えない","ぶれ: 前後1.6フレームぶん（30fps）の範囲を9枚描いて平均する","カメラ: 高さ1.4m。振っている間以外は固定。被写体（Aは人物、Bは車と街）は動かない","4.7秒ごとに A→B、B→A を交互に行う（往復で9.4秒）。右上に「A → B」「B → A」"],"en":["Join: 0.8 s, from 1.7 s to 2.5 s; in the first 0.4 s the outgoing shot swings away, in the last 0.4 s the incoming shot swings in and settles","First half: outgoing yaw 0 → +0.45 rad (about 26°), quadratic ease-in-out; second half: incoming yaw -0.45 rad → 0, same easing","Swap: a straight replacement at the 50% point, hidden because the blur is at its strongest","Blur: 9 renders spread over ±1.6 frames (at 30 fps) are averaged","Camera: height 1.4 m, fixed except during the swing; the subjects (a person in A, a car and city in B) do not move","Alternates A→B and B→A every 4.7 s (9.4 s for the round trip); top-right readout shows \"A → B\" / \"B → A\""]},"use":{"ja":"勢いを保ったまま場所や話題を切り替えるとき。","en":"To change location or topic while keeping the energy up."},"tags":["whip pan","swish pan","motion blur","fast pan","transition","energy"]},{"id":"044","pack":"camera","no":"20","slug":"cross-dissolve","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"クロスディゾルブ","en":"Cross dissolve","zh-Hant":"交叉溶解"},"meaning":{"ja":"前後の映像を重ねて溶かす","en":"Blend one shot into the next","zh-Hant":"一個鏡頭漸漸疊化成下一個"},"ask":{"ja":"朝の部屋から夜の同じ部屋へ、1秒のクロスディゾルブ。","en":"Cross dissolve from the room in the morning to the same room at night, 1 second.","zh-Hant":"用 1 秒的交叉溶解，從早晨的房間轉到同一個房間的夜晚。"},"summary":{"ja":"前の絵に次の絵を重ね、不透明度を上げていって入れ替える。途中は2つの絵が透けて重なる。","en":"The next picture is laid over the current one and its opacity rises until it takes over; both show through each other midway."},"spec":{"ja":["つなぎ方: 1.5秒から3.0秒までの1.5秒。次の絵の不透明度を 0 → 100%","イージング: 2次のイーズインアウト（cubic-bezier(0.45,0,0.55,1) 相当）。中間の2.25秒で50%","前の絵は不透明のまま下に置き、その上に次の絵を重ねる（前の絵を先に消さない）","カメラ: 両方の絵とも固定（Aは高さ1.4m、Bは高さ1.6m・ピッチ+0.1rad）。被写体も動かない","0〜1.5秒は前の絵だけ、3.0〜4.7秒は次の絵だけを見せる","4.7秒ごとに A→B、B→A を交互に行う（往復で9.4秒）。右上に「A → B」「B → A」"],"en":["Join: 1.5 s, from 1.5 s to 3.0 s; the incoming picture's opacity goes 0 → 100%","Easing: quadratic ease-in-out (about cubic-bezier(0.45,0,0.55,1)); 50% at 2.25 s","The outgoing picture stays fully opaque underneath and the incoming one is drawn on top (the outgoing one is not faded out first)","Camera: fixed in both pictures (A at height 1.4 m; B at height 1.6 m, pitch +0.1 rad); the subjects do not move either","Only the outgoing picture shows for 0–1.5 s, only the incoming one for 3.0–4.7 s","Alternates A→B and B→A every 4.7 s (9.4 s for the round trip); top-right readout shows \"A → B\" / \"B → A\""]},"use":{"ja":"時間の経過や場所の移動を穏やかに伝えるとき、回想へ入るとき。","en":"To convey a gentle passage of time or change of place, or to move into a memory."},"tags":["cross dissolve","dissolve","crossfade","fade","opacity","blend","transition"]},{"id":"045","pack":"camera","no":"21","slug":"wipe","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"ワイプ","en":"Wipe","zh-Hant":"擦除轉場"},"meaning":{"ja":"境目が横切って画面が入れ替わる","en":"A moving edge replaces the shot","zh-Hant":"一條移動的邊界把畫面換掉"},"ask":{"ja":"左から右へのワイプで、次の場面に入れ替える。","en":"Wipe from left to right into the next scene.","zh-Hant":"用由左往右的擦除轉場，讓畫面換成下一個場景。"},"summary":{"ja":"縦の境界線が左から右へ動き、通過した側から次の絵に置き換わる。","en":"A vertical edge moves from left to right and the next picture replaces the current one behind it."},"spec":{"ja":["つなぎ方: 1.7秒から2.8秒までの1.1秒。境界線が左端の外（x=-4px）から右端の外（x=543px）へ移動","イージング: 3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当）","境界線の左側に次の絵、右側に前の絵を表示。どちらの絵も位置は動かさない（押し出しではなく切り抜き）","境界: 幅4pxの青い縦線を、移動中だけ表示","カメラ: 両方の絵とも固定。被写体も動かない","4.7秒ごとに A→B、B→A を交互に行う（往復で9.4秒）。右上に「A → B」「B → A」"],"en":["Join: 1.1 s, from 1.7 s to 2.8 s; the edge travels from just outside the left side (x = -4 px) to just outside the right side (x = 543 px)","Easing: cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1))","The incoming picture shows left of the edge and the outgoing one right of it; neither picture moves (a reveal by clipping, not a push)","Edge: a 4 px blue vertical line, visible only while it is moving","Camera: fixed in both pictures; the subjects do not move either","Alternates A→B and B→A every 4.7 s (9.4 s for the round trip); top-right readout shows \"A → B\" / \"B → A\""]},"use":{"ja":"場面や話題の区切りをはっきり見せたいとき、比較の前後を切り替えるとき。","en":"To mark a clear change of scene or topic, or to switch between the two sides of a comparison."},"tags":["wipe","linear wipe","reveal","clip","edge","left to right","transition"]},{"id":"046","pack":"camera","no":"22","slug":"smash-cut","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"スマッシュカット","en":"Smash cut","zh-Hant":"Smash cut"},"meaning":{"ja":"対照的な場面へ前触れなく切り替える","en":"Abrupt cut to a contrasting scene","zh-Hant":"突然切到反差很大的場景"},"ask":{"ja":"静かな寝室から、騒がしい交差点へスマッシュカット。","en":"Smash cut from the quiet bedroom to a noisy intersection.","zh-Hant":"用 Smash cut 從安靜的臥室直接切到吵雜的十字路口。"},"summary":{"ja":"人物が寝ている静かな場面から、前触れなく激しい場面へ直結で切り替える。音量メーターも一気に上がる。","en":"A quiet scene of a person asleep cuts with no warning straight to an intense one; the volume meter jumps at the same moment."},"spec":{"ja":["つなぎ方: 2.4秒で直結（0フレーム）。つなぎの効果は入れず、前後の落差で見せる","前の絵（0〜2.4秒）: 固定カメラ（高さ1.2m、焦点距離330px）。7m先で横になった人物、「z」の文字が3つ浮かんで消える。音量メーターは8段中ほぼ0〜1段（0.08±0.04）","後の絵（2.4〜4.2秒）: 焦点距離を2.6倍（858px）にして寄り、ロール -0.12rad（約-7°）で傾ける。人物は両腕を上げ、放射状の青い線18本","後の絵の揺れ: ロール ±0.03rad（毎秒約6回）と ヨー ±0.006rad（毎秒約8回）で振る。音量メーターは0.85±0.15でほぼ満杯","戻り: 最後の0.5秒で静かな絵へクロスフェード（2次のイーズインアウト）","右上に「♪ 静か」→「♪ 大音量」"],"en":["Join: a straight cut at 2.4 s (0 frames); no transition effect, the contrast does the work","Outgoing shot (0–2.4 s): fixed camera (height 1.2 m, focal length 330 px); a person lying down 7 m away, three \"z\" letters float up and fade; volume meter at about 0–1 of 8 bars (0.08±0.04)","Incoming shot (2.4–4.2 s): focal length 2.6× (858 px) for a tight framing, rolled -0.12 rad (about -7°); the person has both arms raised, with 18 radial blue lines","Shake in the incoming shot: roll ±0.03 rad (about 6 cycles per second) and yaw ±0.006 rad (about 8 per second); volume meter at 0.85±0.15, nearly full","Return: cross-fade back to the quiet shot over the last 0.5 s (quadratic ease-in-out)","Top-right readout shows \"♪ 静か\" (quiet) → \"♪ 大音量\" (loud)"]},"use":{"ja":"笑いや驚きを作るとき。静と動、予想と現実の落差を一瞬で見せるとき。","en":"For comedy or shock, showing in an instant the gap between calm and chaos or between expectation and reality."},"tags":["smash cut","hard cut","abrupt","contrast","quiet to loud","comedy","transition"]},{"id":"047","pack":"camera","no":"23","slug":"j-cut","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"Jカット","en":"J-cut","zh-Hant":"J-cut"},"meaning":{"ja":"次の場面の音が先に聞こえる","en":"Next scene's audio starts first","zh-Hant":"下一場的聲音先進來"},"ask":{"ja":"Jカットで、次の場面の波の音を先に聞かせてから、海の映像に切り替える。","en":"J-cut: let the sound of waves from the next scene start before cutting to the sea.","zh-Hant":"J-cut：先讓下一場的海浪聲響起，再切到海的畫面。"},"summary":{"ja":"映像が切り替わる前に、次の場面の音が先に入る。上に映像、下に映像と音のタイムラインを表示する。","en":"The next scene's audio starts before the picture changes; the picture is shown on top with video and audio timelines below."},"spec":{"ja":["つなぎ方: 映像は直結。音だけ映像より先に次の場面（B）へ切り替える。ずれはタイムライン全体の20%（0.72秒）","再生ヘッド: 0.4秒から4.0秒まで3.6秒かけて等速で左から右へ。音の切り替えは35%（約1.66秒）、映像の切り替えは55%（約2.38秒）","ずれている区間（35〜55%）は、映像がAのまま音だけBになる。区間を薄い青の帯と青い点線2本で強調","画面構成: 上134pxが映像（固定カメラ・被写体は動かない）、下74pxが「映像」「音」の2段のタイムライン（A＝灰色、B＝薄い青、音の段に波形）","表示: 映像の左下に「映像A / 映像B」、右下に今流れている音（「♪ Aの音」灰色 →「♪ Bの音」青）","戻り: 最後の0.5秒で開始状態へクロスフェード（1周4.7秒）"],"en":["Join: the picture is a straight cut; only the audio switches to the next scene (B) before the picture does. The offset is 20% of the timeline (0.72 s)","Playhead: moves left to right at constant speed over 3.6 s (0.4 s to 4.0 s); audio switches at 35% (about 1.66 s), picture at 55% (about 2.38 s)","In the offset section (35–55%) the picture is still A while the audio is already B; the section is marked with a pale blue band and two blue dashed lines","Layout: the top 134 px is the picture (fixed camera, subjects do not move); the bottom 74 px holds two timeline rows, video and audio (A grey, B pale blue, waveform on the audio row)","Labels: \"映像A / 映像B\" (video A / B) at bottom left of the picture; the audio now playing at bottom right (\"♪ Aの音\" grey → \"♪ Bの音\" blue)","Return: cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)"]},"use":{"ja":"次の場面への期待を先に作りたいとき、会話や場面転換を自然につなぐとき。","en":"To build anticipation for the next scene, or to make a change of scene or speaker feel natural."},"tags":["j-cut","j cut","split edit","audio lead","sound first","audio transition","edit"]},{"id":"048","pack":"camera","no":"24","slug":"l-cut","category":"transitions","width":539,"height":208,"cycle":9.4,"name":{"ja":"Lカット","en":"L-cut","zh-Hant":"L-cut"},"meaning":{"ja":"前の場面の音が後まで残る","en":"Previous scene's audio carries over","zh-Hant":"上一場的聲音延續過來"},"ask":{"ja":"Lカットで、彼女の話し声を残したまま、聞き手の顔に切り替える。","en":"L-cut: keep her voice going while cutting to the listener's face.","zh-Hant":"L-cut：切到聽她說話的人的臉，同時讓她的聲音繼續播放。"},"summary":{"ja":"映像が次の場面に切り替わったあとも、前の場面の音がしばらく残る。上に映像、下に映像と音のタイムラインを表示する。","en":"The previous scene's audio carries on for a while after the picture has changed; the picture is shown on top with video and audio timelines below."},"spec":{"ja":["つなぎ方: 映像は直結。音だけ映像より後に次の場面（B）へ切り替える。ずれはタイムライン全体の20%（0.72秒）","再生ヘッド: 0.4秒から4.0秒まで3.6秒かけて等速で左から右へ。映像の切り替えは55%（約2.38秒）、音の切り替えは75%（約3.10秒）","ずれている区間（55〜75%）は、映像がBになっても音はAのまま。区間を薄い青の帯と青い点線2本で強調","画面構成: 上134pxが映像（固定カメラ・被写体は動かない）、下74pxが「映像」「音」の2段のタイムライン（A＝灰色、B＝薄い青、音の段に波形）","表示: 映像の左下に「映像A / 映像B」、右下に今流れている音（「♪ Aの音」灰色 →「♪ Bの音」青）","戻り: 最後の0.5秒で開始状態へクロスフェード（1周4.7秒）"],"en":["Join: the picture is a straight cut; only the audio switches to the next scene (B) after the picture does. The offset is 20% of the timeline (0.72 s)","Playhead: moves left to right at constant speed over 3.6 s (0.4 s to 4.0 s); picture switches at 55% (about 2.38 s), audio at 75% (about 3.10 s)","In the offset section (55–75%) the picture is already B while the audio is still A; the section is marked with a pale blue band and two blue dashed lines","Layout: the top 134 px is the picture (fixed camera, subjects do not move); the bottom 74 px holds two timeline rows, video and audio (A grey, B pale blue, waveform on the audio row)","Labels: \"映像A / 映像B\" (video A / B) at bottom left of the picture; the audio now playing at bottom right (\"♪ Aの音\" grey → \"♪ Bの音\" blue)","Return: cross-fade back to the start over the last 0.5 s (one pass = 4.7 s)"]},"use":{"ja":"話している人の声を残したまま、聞き手の反応や関連する映像を見せるとき。","en":"To keep a speaker's voice running while showing the listener's reaction or related footage."},"tags":["l-cut","l cut","split edit","audio lag","sound carries over","audio transition","edit"]},{"id":"049","pack":"ui","no":"01","slug":"modal-dialog","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"モーダル","en":"Modal dialog","zh-Hant":"Modal"},"meaning":{"ja":"画面を暗くして中央に窓が出る","en":"A window opens in the middle while the page behind dims","zh-Hant":"畫面變暗，中央跳出一個視窗"},"ask":{"ja":"削除ボタンを押したらモーダルで確認を出して。背景は4割ほど暗くし、0.3秒で少し拡大しながらフェードイン。","en":"When the delete button is pressed, show a confirmation in a modal dialog. Dim the page about 40% and fade it in over 0.3 s with a slight scale-up.","zh-Hant":"按下刪除按鈕時，用 Modal 跳出確認。背景變暗約 40%，並在 0.3 秒內一邊微放大一邊淡入。"},"summary":{"ja":"「開く」ボタンを押すと画面全体が暗くなり、中央に小窓が少し拡大しながら出る。×を押すと閉じる。","en":"Clicking \"Open\" dims the whole page and a small window scales up slightly into the centre; clicking × closes it."},"spec":{"ja":["4.5秒周期・カード542×191。カーソルが0.95秒に左下の「開く」ボタン（120×36）へ着き、1.0秒にクリック","開く量 a: 1.0〜1.32秒に easeOutCubic で 0→1。全面に rgba(18,20,28) の幕を不透明度 0.42×a で敷く","窓: 白 280×140・角丸12を (271, 97) 中心に置き、影 blur 24・下へ8・濃さ0.25。拡大率 0.9+0.1×a、不透明度 a","窓の中: 見出しの太線・本文2行・右下に青いボタン 88×30・右上に×","閉じる: カーソルが3.0秒に×へ移り3.3秒にクリック。a に (1 − easeInOutCubic(3.3〜3.58秒)) を掛けて消す"],"en":["4.5 s cycle on a 542×191 card. The cursor reaches the \"Open\" button (120×36, lower left) at 0.95 s and clicks at 1.0 s.","Open amount a: 0→1 over 1.0–1.32 s with easeOutCubic. A full-card scrim rgba(18,20,28) at opacity 0.42·a.","Window: white 280×140, radius 12, centred at (271, 97), shadow blur 24, offset y 8, alpha 0.25. Scale 0.9 + 0.1·a, opacity a.","Inside: a bold title bar, two text lines, a blue 88×30 button at lower right and × at top right.","Close: the cursor moves to × by 3.0 s and clicks at 3.3 s; a is multiplied by (1 − easeInOutCubic over 3.3–3.58 s)."]},"use":{"ja":"確認・入力など、今の作業を止めて1つのことに集中させたいとき。","en":"Use it when the user must stop and deal with one thing, such as a confirmation or a short form."},"tags":["modal","modal-dialog","dialog","popup","overlay","backdrop","lightbox","confirm"]},{"id":"050","pack":"ui","no":"02","slug":"drawer","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"ドロワー","en":"Drawer (Off-canvas)","zh-Hant":"Drawer"},"meaning":{"ja":"横からメニューが引き出される","en":"A menu panel slides in from the side of the screen","zh-Hant":"從側邊滑出選單面板"},"ask":{"ja":"メニューボタンを押したら左からドロワーを出して。幅は画面の4割、0.4秒で引き出し、背景は少し暗く。","en":"Open a drawer from the left when the menu button is pressed: 40% of the screen wide, sliding in over 0.4 s, with the page slightly dimmed.","zh-Hant":"按下選單按鈕時，從左側滑出 Drawer。寬度為螢幕的 40%，0.4 秒滑出，背景稍微變暗。"},"summary":{"ja":"「メニュー」を押すと左から縦長のパネルが引き出され、外側を押すと戻る。","en":"Clicking \"Menu\" slides a tall panel in from the left; clicking outside slides it back."},"spec":{"ja":["4.5秒周期・カード542×191。カーソルが左上の「メニュー」ボタン（110×34）を1.0秒にクリック","開く量 a: 1.0〜1.38秒に easeOutCubic で 0→1。全面に rgba(18,20,28) の幕を不透明度 0.36×a","パネル: 白・幅210・カードの高さいっぱい。x = −210 + 210×a で左端から出る。影 blur 22・濃さ0.25","パネルの中: 上に丸アイコン（半径14）と名前、下に32px間隔で4行のメニュー。1行目は薄い青の帯で選択中","閉じる: カーソルがパネルの外 (420, 120) を3.3秒にクリック。a に (1 − easeInOutCubic(3.3〜3.65秒)) を掛けて左へ戻す"],"en":["4.5 s cycle on a 542×191 card. The cursor clicks the \"Menu\" button (110×34, top left) at 1.0 s.","Open amount a: 0→1 over 1.0–1.38 s with easeOutCubic. Full-card scrim rgba(18,20,28) at opacity 0.36·a.","Panel: white, 210 wide, full card height, x = −210 + 210·a so it slides in from the left edge. Shadow blur 22, alpha 0.25.","Inside: an avatar (radius 14) and name at the top, then four menu rows 32 px apart; the first row is selected with a light-blue band.","Close: the cursor clicks outside at (420, 120) at 3.3 s; a is multiplied by (1 − easeInOutCubic over 3.3–3.65 s) and the panel slides back."]},"use":{"ja":"スマホの全体メニューや、絞り込み条件など、場所を取る操作を横に隠しておきたいとき。","en":"Use it to keep navigation or filters off screen until needed, especially on mobile."},"tags":["drawer","off-canvas","offcanvas","side-menu","navigation-drawer","sheet","sidebar","slide-in"]},{"id":"051","pack":"ui","no":"03","slug":"bottom-sheet","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"ボトムシート","en":"Bottom sheet","zh-Hant":"Bottom Sheet"},"meaning":{"ja":"下からパネルがせり上がる","en":"A panel slides up from the bottom of the screen","zh-Hant":"面板從畫面底部往上滑出"},"ask":{"ja":"「詳細を見る」を押したらボトムシートで詳細を出して。高さは画面の4割、0.4秒でせり上げ、下へ引くと閉じる。","en":"Show the details in a bottom sheet when \"View details\" is tapped: 40% of the screen tall, rising over 0.4 s, closing when dragged down.","zh-Hant":"點「查看詳情」時，用 Bottom Sheet 顯示詳細內容。高度為螢幕的 40%，0.4 秒升起，往下拖曳就關閉。"},"summary":{"ja":"指で「詳細を見る」を押すと下からパネルがせり上がり、上端のつまみを下へ引くと閉じる。","en":"A finger taps \"View details\" and a panel rises from the bottom; dragging its handle down closes it."},"spec":{"ja":["4.5秒周期・カード542×191。指（半径17の半透明の丸＋白い縁）が下中央の「詳細を見る」（170×36の青い角丸）を1.0秒に押す","開く量: 1.05〜1.45秒に easeOutCubic で 0→1。全面に rgba(18,20,28) の幕を不透明度 0.36×a","シート: 白・高さ136・上の角丸18。上端 y = 191 − 136×a。影 blur 22・上へ4。上端中央につまみ 52×6","シートの中: 見出しの太線と、アイコン（26×26）付きの2行","閉じる: 指が2.75秒につまみ (271, 68) に乗り、3.0〜3.6秒に下へ引く。a に (1 − easeInOutCubic(3.0〜3.6秒)) を掛け、シートが指と一緒に下へ消える"],"en":["4.5 s cycle on a 542×191 card. A finger (semi-transparent circle, radius 17, white rim) taps the \"View details\" pill (170×36, bottom centre) at 1.0 s.","Open amount: 0→1 over 1.05–1.45 s with easeOutCubic. Full-card scrim rgba(18,20,28) at opacity 0.36·a.","Sheet: white, 136 tall, top corners radius 18, top edge at y = 191 − 136·a. Shadow blur 22, offset y −4. A 52×6 grab handle at top centre.","Inside: a bold title bar and two rows with 26×26 icons.","Close: the finger lands on the handle (271, 68) at 2.75 s and drags down over 3.0–3.6 s; a is multiplied by (1 − easeInOutCubic over 3.0–3.6 s), so the sheet follows the finger off the bottom."]},"use":{"ja":"スマホで、今の画面を残したまま詳細や選択肢を出したいとき。","en":"Use it on mobile to show details or choices while keeping the current screen in view."},"tags":["bottom-sheet","sheet","modal-sheet","mobile","slide-up","drag-to-dismiss","panel"]},{"id":"052","pack":"ui","no":"04","slug":"accordion","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"アコーディオン","en":"Accordion","zh-Hant":"手風琴"},"meaning":{"ja":"押すと中身が開閉する","en":"Click a heading to show or hide its content","zh-Hant":"點擊標題展開或收合內容"},"ask":{"ja":"よくある質問をアコーディオンにして。押した項目だけ0.35秒で開き、矢印を180度回して。","en":"Make the FAQ an accordion: the clicked item opens over 0.35 s and its arrow turns 180°.","zh-Hant":"把常見問題做成手風琴。只有點到的項目在 0.35 秒內展開，箭頭旋轉 180 度。"},"summary":{"ja":"3段の見出しのうち1段目を押すと下に本文が開き、下の段が押し下げられる。もう一度押すと閉じる。","en":"Clicking the first of three headings opens its content and pushes the rows below down; clicking again closes it."},"spec":{"ja":["4.5秒周期・カード542×191。3段の見出し（幅494・高さ34・角丸8・間隔6）。右端に下向きの矢印","カーソルが0.95秒に1段目に着き、1.0秒と3.3秒にクリック","開く量 ex: 1.0〜1.35秒に easeInOutCubic で 0→1、3.3〜3.62秒に同じく 1→0","1段目の高さを 34 → 92（+58×ex）に伸ばし、下の段をその分押し下げる。本文2行は枠の中に切り抜いて不透明度 ex で出す","開いている間、矢印は 180°×ex 回り、枠は薄い青・見出しは青になる"],"en":["4.5 s cycle on a 542×191 card. Three headings (494 wide, 34 tall, radius 8, gap 6) with a down chevron at the right.","The cursor reaches the first heading at 0.95 s and clicks at 1.0 s and 3.3 s.","Open amount ex: 0→1 over 1.0–1.35 s with easeInOutCubic, then 1→0 over 3.3–3.62 s.","The first row grows from 34 to 92 tall (+58·ex) and pushes the rows below down; its two content lines are clipped to the row and fade in with opacity ex.","While open, the chevron rotates 180°·ex, the border turns light blue and the heading blue."]},"use":{"ja":"FAQや詳細な説明など、見出しだけ並べて中身は必要な人にだけ見せたいとき。","en":"Use it for FAQs or long details where people scan the headings and open only what they need."},"tags":["accordion","collapsible","expand","collapse","disclosure","faq","details"]},{"id":"053","pack":"ui","no":"05","slug":"dropdown-menu","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"ドロップダウン","en":"Dropdown (select)","zh-Hant":"下拉選單"},"meaning":{"ja":"押すと選択肢が下に広がる","en":"Click a field to drop a list of options below it","zh-Hant":"點擊欄位，選項往下展開"},"ask":{"ja":"都道府県の入力欄をドロップダウンにして。押したら0.25秒で選択肢を下に開き、選んだら閉じて値を入れて。","en":"Make the prefecture field a dropdown: open the options below it in 0.25 s and close it with the value filled in once one is picked.","zh-Hant":"把縣市欄位做成下拉選單。點擊後 0.25 秒內往下展開選項，選好後收起並填入所選的值。"},"summary":{"ja":"入力欄を押すと下に4つの選択肢が開き、「名古屋」を選ぶと閉じて欄に入る。","en":"Clicking the field opens four options below it; picking \"Nagoya\" closes the list and fills the field."},"spec":{"ja":["4.5秒周期・カード542×191。入力欄 260×38（角丸8）に「選択してください」と右端の矢印。カーソルが1.0秒にクリック","開く量: 1.0〜1.25秒に easeOutCubic で 0→1。一覧（白 260×112・影 blur 18）が不透明度とともに上から6px下りて出る。矢印は180°回り、枠は青2px","一覧は26px間隔の4行（東京・大阪・名古屋・福岡）。カーソルが下りるにつれ1.55秒から大阪、1.95秒から名古屋の行を薄い青で強調","2.3秒に名古屋をクリック: 一覧は2.3〜2.45秒に (1 − easeInOutCubic) で閉じ、プレースホルダーは2.2〜2.3秒に消え、「名古屋」が2.32〜2.42秒に出る","戻し: 名古屋は3.9〜4.08秒に消え、プレースホルダーが4.1〜4.3秒に戻る（文字を重ねない）"],"en":["4.5 s cycle on a 542×191 card. A 260×38 field (radius 8) shows a placeholder and a chevron; the cursor clicks it at 1.0 s.","Open amount: 0→1 over 1.0–1.25 s with easeOutCubic. The list (white 260×112, shadow blur 18) fades in while dropping 6 px. The chevron turns 180° and the field border becomes 2 px blue.","Four options 26 px apart (Tokyo, Osaka, Nagoya, Fukuoka in Japanese). As the cursor moves down, Osaka is highlighted light blue from 1.55 s and Nagoya from 1.95 s.","Click on Nagoya at 2.3 s: the list closes over 2.3–2.45 s (1 − easeInOutCubic); the placeholder fades out over 2.2–2.3 s and \"Nagoya\" fades in over 2.32–2.42 s.","Reset: Nagoya fades out over 3.9–4.08 s, then the placeholder returns over 4.1–4.3 s, so the two texts never overlap."]},"use":{"ja":"フォームで、決まった候補の中から1つを選ばせたいとき。","en":"Use it in a form when people pick one value from a fixed list."},"tags":["dropdown","dropdown-menu","select","picker","combobox","options","form"]},{"id":"054","pack":"ui","no":"06","slug":"tooltip","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"ツールチップ","en":"Tooltip","zh-Hant":"Tooltip"},"meaning":{"ja":"乗せると小さな説明が出る","en":"Hover over something to show a short label","zh-Hant":"游標移上去顯示簡短說明"},"ask":{"ja":"「?」アイコンにツールチップを付けて。カーソルを乗せて0.2秒で上に説明を出し、離れたら消して。","en":"Add a tooltip to the \"?\" icon: show the note above it 0.2 s after hover, and hide it when the cursor leaves.","zh-Hant":"幫「?」圖示加上 Tooltip。游標移上去 0.2 秒後在上方顯示說明，移開就消失。"},"summary":{"ja":"カーソルを「?」に乗せると、上に黒い吹き出しで短い説明が出る。離れると消える。","en":"Hovering over a \"?\" icon shows a short note in a dark bubble above it; it disappears when the cursor leaves."},"spec":{"ja":["4.5秒周期・カード542×191。見出しの横に「?」（半径13の青い丸枠）を (196, 121) に置く","カーソルは押さずに乗せるだけ: 1.05秒に「?」へ着き、3.15秒まで留まり、4.1秒にカードの外へ出る","出る量 a: 1.15〜1.35秒に easeOutCubic で 0→1。不透明度 a で、6px下から所定の位置へ上がる","吹き出し: #26282c の 184×36・角丸8、上端 y 64。下に幅16・高さ8の三角で「?」を指す。白い15pxの文字「小さな説明が出る」","消える: 3.25〜3.45秒に直線で 1→0"],"en":["4.5 s cycle on a 542×191 card. A \"?\" icon (blue ring, radius 13) at (196, 121) next to a label.","The cursor only hovers, no click: it arrives on \"?\" at 1.05 s, stays until 3.15 s and leaves the card by 4.1 s.","Show amount a: 0→1 over 1.15–1.35 s with easeOutCubic; opacity a, rising 6 px into place.","Bubble: #26282c, 184×36, radius 8, top at y 64, with a 16-wide, 8-tall triangle pointing down at the icon; white 15 px text.","Hide: linear 1→0 over 3.25–3.45 s."]},"use":{"ja":"アイコンや略語など、見ればすぐ分かる補足を1行だけ添えたいとき。","en":"Use it to add a one-line hint to an icon or abbreviation without taking space on the page."},"tags":["tooltip","hint","hover","help","info","title"]},{"id":"055","pack":"ui","no":"07","slug":"popover","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"ポップオーバー","en":"Popover","zh-Hant":"Popover"},"meaning":{"ja":"押すと吹き出しの小窓が出る","en":"Click a button to open a small panel pointing at it","zh-Hant":"點擊後跳出帶箭頭的小面板"},"ask":{"ja":"「詳細」ボタンにポップオーバーを付けて。押したら右に吹き出しの小窓を0.3秒で出し、OKで閉じて。","en":"Attach a popover to the \"Details\" button: clicking opens a small panel to its right over 0.3 s, and OK closes it.","zh-Hant":"幫「詳情」按鈕加上 Popover。點擊後 0.3 秒內在右側跳出帶箭頭的小面板，按「確定」就關閉。"},"summary":{"ja":"「詳細」を押すと右に、三角でボタンを指す白い小窓が出る。小窓のOKを押すと閉じる。","en":"Clicking \"Details\" opens a small white panel to its right with a pointer at the button; clicking OK inside closes it."},"spec":{"ja":["4.5秒周期・カード542×191。青い枠のボタン「詳細」108×36 を (24, 112) に置く。カーソルが1.0秒にクリック","出る量 a: 1.0〜1.28秒に easeOutCubic で 0→1。不透明度 a で、6px右から所定の位置へ寄る","小窓: 白 300×120・角丸10を (156, 62) に置き、1pxの枠線、影 blur 22・下へ6。左辺の y 122〜138 に幅10の三角でボタンを指す","中身: 見出しの太線・本文2行・下に枠のボタン 70×26 と青いOK 72×26","閉じる: カーソルが3.0秒にOK (402, 157) へ移り3.3秒にクリック。a に (1 − easeInOutCubic(3.3〜3.5秒)) を掛ける"],"en":["4.5 s cycle on a 542×191 card. An outlined blue \"Details\" button (108×36) at (24, 112); the cursor clicks it at 1.0 s.","Show amount a: 0→1 over 1.0–1.28 s with easeOutCubic; opacity a, sliding 6 px in from the right.","Panel: white 300×120, radius 10, at (156, 62), 1 px border, shadow blur 22, offset y 6. A 10-wide triangle on its left edge (y 122–138) points at the button.","Inside: a bold title bar, two text lines, an outlined 70×26 button and a blue 72×26 OK button.","Close: the cursor moves to OK (402, 157) by 3.0 s and clicks at 3.3 s; a is multiplied by (1 − easeInOutCubic over 3.3–3.5 s)."]},"use":{"ja":"ボタンの近くで、短い設定や確認をその場で済ませたいとき。","en":"Use it for a short setting or confirmation that belongs right next to the button that opened it."},"tags":["popover","popup","callout","bubble","flyout","overlay"]},{"id":"056","pack":"ui","no":"08","slug":"toast","category":"open-overlay","width":542,"height":191,"cycle":4.5,"name":{"ja":"トースト","en":"Toast notification","zh-Hant":"Toast"},"meaning":{"ja":"隅に通知が出て自動で消える","en":"A short message appears in a corner and goes away on its own","zh-Hant":"角落跳出通知並自動消失"},"ask":{"ja":"保存したら右下にトーストで「保存しました」と出して。0.35秒で右から出し、2秒後に自動で消して。","en":"After saving, show \"Saved\" as a toast at the bottom right: slide it in from the right in 0.35 s and dismiss it automatically after 2 s.","zh-Hant":"儲存後在右下角用 Toast 顯示「已儲存」。0.35 秒內從右側滑入，2 秒後自動消失。"},"summary":{"ja":"「保存」を押すと右下に黒い通知が右から滑り込み、残り時間の線が縮みきると右へ消える。","en":"Clicking \"Save\" slides a dark notice into the bottom-right corner; when its time bar runs out it slides away."},"spec":{"ja":["4.5秒周期・カード542×191。左下の青い「保存」ボタン（110×36）をカーソルが1.0秒にクリックし、左下へ去る","通知: #26282c の 214×52・角丸10。右端から18px・下端から16pxの位置に、1.05〜1.4秒に easeOutCubic で右から240px滑り込む","中身: 青い丸に白いチェックと、白い15pxの「保存しました」","下端に残り時間の線（幅194→0・高さ3）を1.4〜3.2秒に直線で縮める","消える: 3.2〜3.55秒に easeInOutCubic で右へ240px滑り出る"],"en":["4.5 s cycle on a 542×191 card. The cursor clicks the blue \"Save\" button (110×36, bottom left) at 1.0 s and leaves to the bottom left.","Toast: #26282c, 214×52, radius 10, 18 px from the right and 16 px from the bottom; slides in 240 px from the right over 1.05–1.4 s with easeOutCubic.","Inside: a white check in a blue circle and white 15 px text \"Saved\".","A time-left line along the bottom (3 px tall) shrinks linearly from 194 px to 0 over 1.4–3.2 s.","Exit: slides 240 px out to the right over 3.2–3.55 s with easeInOutCubic."]},"use":{"ja":"保存・送信などの結果を、作業を止めずに短く知らせたいとき。","en":"Use it to confirm a result such as a save or send without interrupting the user."},"tags":["toast","snackbar","notification","alert","message","auto-dismiss"]},{"id":"057","pack":"ui","no":"09","slug":"tabs","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"タブ","en":"Tabs","zh-Hant":"頁籤"},"meaning":{"ja":"見出しを押して中身を切り替える","en":"Click a label to switch which panel is shown","zh-Hant":"點擊頁籤標題切換內容"},"ask":{"ja":"料金ページの上にタブを3つ置いて。押したら下線を0.25秒で滑らせ、中身を0.2秒のクロスフェードで切り替えて。","en":"Put three tabs at the top of the pricing page. On click, slide the underline over 0.25 s and cross-fade the content in 0.2 s.","zh-Hant":"在價格頁面上方放三個頁籤。點擊時底線在 0.25 秒內滑動過去，內容以 0.2 秒的交叉淡入淡出切換。"},"summary":{"ja":"「概要・料金・レビュー」のタブを順に押すと、青い下線が滑って移り、下の中身が入れ替わる。","en":"Clicking the tabs \"Overview, Pricing, Reviews\" in turn slides a blue underline across and swaps the content below."},"spec":{"ja":["4.5秒周期・カード542×191。タブ3つ（x 24・114・204、幅 70・70・100）。下に2pxの区切り線（y 50）と、4pxの青い下線","カーソルが1.0秒に2つ目、2.2秒に3つ目、3.4秒に1つ目をクリック","下線: 位置と幅を各クリックから0.25秒、easeInOutCubic で次のタブへ移す（3つ目から1つ目へは中央を通って戻る）","文字: 選択中は青・太字、それ以外は灰色。切り替わりは1.1・2.3・3.5秒","中身: 前のパネルが0.2秒で直線的に消え、0.1秒後に次のパネルが0.2秒で出る（出るとき8px下から上がる）"],"en":["4.5 s cycle on a 542×191 card. Three tabs at x 24, 114, 204, widths 70, 70, 100; a 2 px divider at y 50 and a 4 px blue underline.","The cursor clicks the second tab at 1.0 s, the third at 2.2 s and the first at 3.4 s.","Underline: position and width move to the new tab over 0.25 s from each click with easeInOutCubic (from the third back to the first it passes through the middle).","Labels: selected is blue and bold, others grey; the switch happens at 1.1, 2.3 and 3.5 s.","Content: the old panel fades out linearly in 0.2 s; 0.1 s later the new one fades in over 0.2 s while rising 8 px."]},"use":{"ja":"同じ場所で、並んだ種類の情報を切り替えて見せたいとき。","en":"Use it to show several related views in the same space and let people switch between them."},"tags":["tabs","tab-bar","tabbed","navigation","switch-view","underline"]},{"id":"058","pack":"ui","no":"10","slug":"carousel","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"カルーセル","en":"Carousel","zh-Hant":"輪播"},"meaning":{"ja":"横に送って順番に見せる","en":"Slides that move sideways to show one item at a time","zh-Hant":"橫向切換，依序展示內容"},"ask":{"ja":"トップの画像をカルーセルにして。右矢印で1枚ずつ0.4秒で送り、下に今の位置の点を出して。","en":"Turn the top images into a carousel: the right arrow moves one slide in 0.4 s, with position dots below.","zh-Hant":"把首頁頂部的圖片做成輪播。按右箭頭每次用 0.4 秒換一張，下方顯示目前位置的圓點。"},"summary":{"ja":"右の矢印を押すたびに、横に並んだ3種類の絵が1枚ずつ左へ送られ、下の点が移る。","en":"Each click on the right arrow slides a row of three different images one step to the left, and the dot below moves."},"spec":{"ja":["4.5秒周期・カード542×191。スライド 330×138・角丸8を中央に置き、間隔18。両隣が端から少し見える","左右に白い丸ボタン（半径18・影 blur 10）と矢印。下に点3つ（今の位置は青の 16×8、他は 8×8）","カーソルが右の矢印 (514, 88) を1.0・2.1・3.2秒にクリック","各クリックで、0.4秒かけて easeInOutCubic で列を左へ348px（1枚＋間隔）送る","絵は3種類（山の風景・丸3つ・棒グラフ）の繰り返しなので、3回送ると最初の絵に戻る"],"en":["4.5 s cycle on a 542×191 card. Slides 330×138, radius 8, centred with an 18 px gap; the neighbours peek in at the edges.","White round buttons (radius 18, shadow blur 10) with chevrons at left and right; three dots below (current one blue 16×8, others 8×8).","The cursor clicks the right arrow (514, 88) at 1.0, 2.1 and 3.2 s.","Each click moves the row 348 px left (one slide plus gap) over 0.4 s with easeInOutCubic.","The three pictures (landscape, three circles, bar chart) repeat, so after three moves the first is back."]},"use":{"ja":"限られた場所で、画像やおすすめを何枚も順に見せたいとき。","en":"Use it to show several images or featured items in limited space, one at a time."},"tags":["carousel","slider","slideshow","gallery","swipe","paging-dots"]},{"id":"059","pack":"ui","no":"11","slug":"toggle-switch","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"トグルスイッチ","en":"Toggle switch","zh-Hant":"Toggle"},"meaning":{"ja":"オン・オフを切り替える","en":"Flip a setting on or off","zh-Hant":"切換開啟或關閉"},"ask":{"ja":"通知設定の各行にトグルスイッチを置いて。押したら0.2秒でつまみを滑らせ、オンは青にして。","en":"Put a toggle switch on each notification setting: the knob slides in 0.2 s and the track turns blue when on.","zh-Hant":"在通知設定的每一列放上 Toggle。點擊時圓鈕在 0.2 秒內滑動，開啟時軌道變成藍色。"},"summary":{"ja":"設定の3行のうち上の2つのスイッチを順にオンにし、その後オフに戻す。","en":"The switches on the first two of three setting rows are turned on in turn, then off again."},"spec":{"ja":["4.5秒周期・カード542×191。設定の行3つ（60px間隔・区切り線あり）。右端 x 450 に 64×34・角丸17 の溝と、白いつまみ（半径13・影）","カーソルのクリック: 1行目オン1.0秒、2行目オン1.8秒、1行目オフ3.0秒、2行目オフ3.6秒。3行目はオフのまま","1回の切り替えは0.2秒・easeOutCubic。つまみを30px（17→47）滑らせる","溝の色は灰色 #d9d7d5 から青 #1f5ae8 へ、切り替えの進み具合で重ねて変える"],"en":["4.5 s cycle on a 542×191 card. Three setting rows 60 px apart with dividers. At x 450 a 64×34 track (radius 17) and a white knob (radius 13, shadow).","Clicks: row 1 on at 1.0 s, row 2 on at 1.8 s, row 1 off at 3.0 s, row 2 off at 3.6 s. Row 3 stays off.","Each switch takes 0.2 s with easeOutCubic; the knob slides 30 px (17 → 47).","The track colour blends from grey #d9d7d5 to blue #1f5ae8 with the switch progress."]},"use":{"ja":"設定画面で、すぐ反映されるオン・オフを並べたいとき。","en":"Use it for settings that take effect immediately and have only two states."},"tags":["toggle","switch","toggle-switch","on-off","boolean","settings"]},{"id":"060","pack":"ui","no":"12","slug":"segmented-control","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"セグメントコントロール","en":"Segmented control","zh-Hant":"Segmented Control"},"meaning":{"ja":"並んだボタンで表示を切り替える","en":"A row of joined buttons that switches the view","zh-Hant":"用並排按鈕切換檢視"},"ask":{"ja":"グラフの上に「日・週・月」のセグメントコントロールを置いて。押したら選択の背景を0.25秒で滑らせ、グラフも同時に変えて。","en":"Put a Day / Week / Month segmented control above the chart: the selected background slides over 0.25 s and the chart changes with it.","zh-Hant":"在圖表上方放「日／週／月」的 Segmented Control。點擊時選取背景在 0.25 秒內滑動，圖表同步改變。"},"summary":{"ja":"「日・週・月」を押すと青い選択部分が滑って移り、下の棒グラフの高さが変わる。","en":"Clicking Day, Week or Month slides a blue highlight across and the bar chart below changes height."},"spec":{"ja":["4.5秒周期・カード542×191。灰色の台 300×40・角丸10 を (121, 12) に置き、3等分（各100）に「日・週・月」","選択部分: 青の 92×32・角丸8（影 blur 6）。選ばれた文字は白","カーソルが1.0秒に「週」、2.1秒に「月」、3.3秒に「日」をクリック。選択部分は各0.25秒、easeInOutCubic で滑る","下の棒グラフ: 幅34・58px間隔の7本（6本目だけ青）。高さを3組のデータ（例 30〜85 / 40〜100 / 60〜115）の間で、選択部分と同時に easeInOutCubic で変える"],"en":["4.5 s cycle on a 542×191 card. A grey 300×40 base (radius 10) at (121, 12), split into three 100-wide segments: Day, Week, Month (in Japanese).","Selection: blue 92×32, radius 8, shadow blur 6; the selected label is white.","The cursor clicks Week at 1.0 s, Month at 2.1 s and Day at 3.3 s; the selection slides over 0.25 s each with easeInOutCubic.","Chart below: seven bars 34 wide, 58 px apart (the sixth is blue). Heights move between three data sets (about 30–85, 40–100, 60–115) together with the selection, eased the same way."]},"use":{"ja":"同じデータの見え方を、2〜4通りから切り替えたいとき。","en":"Use it to switch between two to four views of the same content, such as day, week and month."},"tags":["segmented-control","segmented-button","button-group","toggle-group","switcher","view-switch"]},{"id":"061","pack":"ui","no":"13","slug":"filter-chips","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"チップ","en":"Filter chips","zh-Hant":"Filter Chip"},"meaning":{"ja":"押して絞り込み条件を付け外し","en":"Small pills you click to add or remove a filter","zh-Hant":"點擊以加上或移除篩選條件"},"ask":{"ja":"一覧の上に絞り込みのチップを並べて。押したらチェックを付けて青くし、0.15秒で一覧を絞り込んで。","en":"Add filter chips above the list: a clicked chip gets a check mark and turns blue, and the list filters within 0.15 s.","zh-Hant":"在列表上方放 Filter Chip。點擊後出現勾號並變成藍色，0.15 秒內篩選列表。"},"summary":{"ja":"「新着」「無料」のチップを押すとチェックが付いて青くなり、条件に合わないカードが薄くなる。","en":"Clicking the \"New\" and \"Free\" chips adds a check mark and turns them blue, and cards that do not match fade out."},"spec":{"ja":["4.5秒周期・カード542×191。チップ4つ「すべて・新着・人気・無料」: 高さ34・角丸17、幅は文字幅+32、10px間隔で左から並べる","カーソルのクリック: 新着オン0.95秒、無料オン1.75秒、新着オフ3.0秒、無料オフ3.6秒","1回の切り替えは0.15秒・easeOutCubic。チップが18px広がって左にチェックが出て、地は薄い青・枠と文字は青","下の一覧: カード4枚（242×54、2列2段）。条件に合わないカードは不透明度を 1 → 0.12 に下げる"],"en":["4.5 s cycle on a 542×191 card. Four chips (\"All, New, Popular, Free\" in Japanese): 34 tall, radius 17, width = text + 32, 10 px apart from the left.","Clicks: New on at 0.95 s, Free on at 1.75 s, New off at 3.0 s, Free off at 3.6 s.","Each change takes 0.15 s with easeOutCubic: the chip widens 18 px to make room for a check mark; fill light blue, border and text blue.","List below: four cards (242×54, two columns, two rows); cards that do not match drop from opacity 1 to 0.12."]},"use":{"ja":"一覧や検索結果を、条件を重ねて手早く絞り込ませたいとき。","en":"Use it to let people narrow a list or search results by combining a few quick filters."},"tags":["chips","filter-chips","tags","filter","facets","pills"]},{"id":"062","pack":"ui","no":"14","slug":"range-slider","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"レンジスライダー","en":"Range slider","zh-Hant":"範圍滑桿"},"meaning":{"ja":"つまみ2つで範囲を選ぶ","en":"Two handles on one track pick a minimum and a maximum","zh-Hant":"用兩個滑鈕選出範圍"},"ask":{"ja":"価格の絞り込みをレンジスライダーにして。つまみは2つ、動かしている間は値を吹き出しで出して。","en":"Make the price filter a range slider with two handles, showing each value in a bubble while it is dragged.","zh-Hant":"把價格篩選做成範圍滑桿。要有兩個滑鈕，拖曳時用氣泡顯示數值。"},"summary":{"ja":"価格のスライダーで、左のつまみを右へ、右のつまみを左へ動かして範囲を狭め、元に戻す。","en":"On a price slider, the left handle is dragged right and the right handle left to narrow the range, then both go back."},"spec":{"ja":["4.5秒周期・カード542×191。溝: x 54〜488・高さ8・y 120。つまみ2つの間を青で塗る。範囲は ¥0〜¥10,000","つまみ: 白・半径13・青い3pxの縁。ドラッグ中は半径15になり、半径24の薄い青の円が付く","下限: 1.0〜1.6秒に 0.1→0.3（¥1,000→¥3,000）、3.55〜3.9秒に戻す。上限: 2.1〜2.6秒に 1.0→0.8（¥10,000→¥8,000）、2.95〜3.3秒に戻す。どれも easeInOutCubic","各つまみの上に値の吹き出し（高さ28・ドラッグ中は青地に白文字）。右上に「¥1,000 〜 ¥10,000」の形で範囲を青で出し、100円単位で更新","カーソルがつまみに乗って一緒に動く（押す時刻 1.0・2.1・2.95・3.55秒）"],"en":["4.5 s cycle on a 542×191 card. Track: x 54–488, 8 tall, at y 120; the part between the two handles is blue. Range ¥0–¥10,000.","Handles: white, radius 13, 3 px blue rim; while dragged, radius 15 with a light-blue halo of radius 24.","Low handle: 0.1 → 0.3 (¥1,000 → ¥3,000) over 1.0–1.6 s, back over 3.55–3.9 s. High handle: 1.0 → 0.8 (¥10,000 → ¥8,000) over 2.1–2.6 s, back over 2.95–3.3 s. All easeInOutCubic.","A value bubble (28 tall) above each handle, blue with white text while dragged. The range \"¥1,000 – ¥10,000\" is shown in blue at top right, updated in ¥100 steps.","The cursor sits on the handle it drags (presses at 1.0, 2.1, 2.95 and 3.55 s)."]},"use":{"ja":"価格・日付・数量などを、下限と上限の範囲で絞り込ませたいとき。","en":"Use it to filter by a range, such as price, date or size, with a minimum and a maximum."},"tags":["range-slider","slider","dual-thumb","min-max","price-filter","range"]},{"id":"063","pack":"ui","no":"15","slug":"stepper","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"ステッパー","en":"Stepper (+/−)","zh-Hant":"數量加減器"},"meaning":{"ja":"＋/−ボタンで数を増減する","en":"Plus and minus buttons that change a number by one","zh-Hant":"用 ＋/－ 按鈕增減數字"},"ask":{"ja":"数量の欄をステッパーにして。＋と−で1ずつ増減し、押すたびに数字を0.25秒で少し弾ませて。","en":"Make the quantity field a stepper: + and − change it by one, and the number pops slightly for 0.25 s on each press.","zh-Hant":"把數量欄位做成＋／－數量加減器。每按一次增減 1，數字輕輕彈一下，持續 0.25 秒。"},"summary":{"ja":"＋を3回押して数が1から4に増え、−を3回押して1に戻る。押すたびに数字が少し弾む。","en":"Pressing + three times raises the number from 1 to 4, and pressing − three times brings it back to 1; the number pops on each press."},"spec":{"ja":["4.5秒周期・カード542×191。枠 200×60・角丸12 を (171, 52) に置く。左60pxに「−」、右60pxに「＋」（青）、中央に30pxの太い数字","カーソルのクリック: ＋を0.9・1.35・1.8秒（1→4）、−を2.8・3.25・3.7秒（4→1）","押した側の区画を、押す0.05秒前から0.15秒後まで薄い青にする","数字: 押すたびに拡大率 1.18 → 1 を0.25秒で直線的に戻し、その間は青"],"en":["4.5 s cycle on a 542×191 card. A 200×60 box (radius 12) at (171, 52): \"−\" in the left 60 px, a blue \"+\" in the right 60 px, and a bold 30 px number in the middle.","Clicks: + at 0.9, 1.35, 1.8 s (1 → 4), − at 2.8, 3.25, 3.7 s (4 → 1).","The pressed segment is tinted light blue from 0.05 s before to 0.15 s after each click.","Number: on each press its scale goes linearly from 1.18 back to 1 over 0.25 s, and it is blue meanwhile."]},"use":{"ja":"カートの数量や人数など、小さな数を1つずつ変えさせたいとき。","en":"Use it for small whole numbers changed one at a time, such as quantity or number of guests."},"tags":["stepper","quantity","number-input","increment","decrement","plus-minus","spin-button"]},{"id":"064","pack":"ui","no":"16","slug":"pagination","category":"select-switch","width":542,"height":191,"cycle":4.5,"name":{"ja":"ページネーション","en":"Pagination","zh-Hant":"分頁（Pagination）"},"meaning":{"ja":"番号でページを送る","en":"Numbered buttons that move between pages","zh-Hant":"用頁碼切換頁面"},"ask":{"ja":"検索結果の下にページネーションを付けて。今のページは青い丸にし、押したら0.2秒で丸を移して一覧を入れ替えて。","en":"Add pagination under the search results: the current page is a blue circle that moves in 0.2 s on click, and the list is replaced.","zh-Hant":"在搜尋結果下方加上分頁頁碼。目前頁碼用藍色圓形標示，點擊後圓形在 0.2 秒內移動，並換成對應的列表。"},"summary":{"ja":"下の番号で2、3と押すと青い丸が移り、上の一覧が切り替わる。最後に1へ戻る。","en":"Clicking 2 and then 3 in the page numbers moves the blue circle and swaps the list above; finally it goes back to 1."},"spec":{"ja":["4.5秒周期・カード542×191。「‹ 1 2 3 4 5 ›」を直径36・間隔8で中央に並べる（y 160）。今のページに青い丸（半径18）、文字は白","カーソルが1.0秒に2、2.1秒に3、3.3秒に1をクリック","青い丸は各0.2秒、easeInOutCubic で1ページ44pxずつ移る（3から1へは一度に88px）","上の一覧（3行）は1.05・2.15・3.35秒の前後0.2秒で不透明度を 1→0→1 と下げて、中身を入れ替える"],"en":["4.5 s cycle on a 542×191 card. \"‹ 1 2 3 4 5 ›\" centred, each 36 in diameter with 8 px gaps, at y 160. A blue circle (radius 18) marks the current page, with white text.","The cursor clicks 2 at 1.0 s, 3 at 2.1 s and 1 at 3.3 s.","The blue circle moves 44 px per page over 0.2 s each with easeInOutCubic (88 px at once from 3 back to 1).","The three-row list above dips in opacity 1 → 0 → 1 within 0.2 s either side of 1.05, 2.15 and 3.35 s, and its content changes at the dip."]},"use":{"ja":"検索結果や記事一覧など、長い一覧をページに分けて見せたいとき。","en":"Use it to split a long list, such as search results or articles, into numbered pages."},"tags":["pagination","pager","page-numbers","paging","next-prev","navigation"]},{"id":"065","pack":"ui","no":"17","slug":"hamburger-menu","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"ハンバーガーメニュー","en":"Hamburger menu","zh-Hant":"漢堡選單"},"meaning":{"ja":"三本線を押すとメニューが開く","en":"A three-line icon that opens the menu","zh-Hant":"點擊三條線圖示打開選單"},"ask":{"ja":"スマホのヘッダー右にハンバーガーメニューを置いて。押したら三本線を0.3秒で×に変え、メニューを上から下ろして。","en":"Put a hamburger menu at the right of the mobile header: on tap, morph the three lines into × in 0.3 s and drop the menu down from the top.","zh-Hant":"在手機版頁首右側放漢堡選單。點擊時三條線在 0.3 秒內變成 ×，選單從上方往下展開。"},"summary":{"ja":"ヘッダー右の三本線を押すと×に変わり、ヘッダーの下からメニューが下りてくる。もう一度押すと閉じる。","en":"Clicking the three-line icon at the header's right turns it into ×, and a menu drops down from under the header; clicking again closes it."},"spec":{"ja":["4.5秒周期・カード542×191。高さ44の白いヘッダー。右の (500, 22) に三本線（長さ24・太さ3・8px間隔）","カーソルが1.0秒と3.3秒にクリック。開く量 a: 1.0〜1.3秒に easeInOutCubic で 0→1、3.3〜3.6秒に 1→0","三本線→×: 上下の線を中央へ8px寄せつつ ±45°回し、中の線を不透明度 1−a で消す。開いている間は青","メニュー: 白・高さ140。上端 y = 44 − 140 + 140×a でヘッダーの下から下りる（ヘッダーの下だけ見せる）。影 blur 16。中に4項目、1つ目は青"],"en":["4.5 s cycle on a 542×191 card. A white 44-tall header; three lines (24 long, 3 thick, 8 px apart) at (500, 22) on the right.","The cursor clicks at 1.0 s and 3.3 s. Open amount a: 0→1 over 1.0–1.3 s, 1→0 over 3.3–3.6 s, easeInOutCubic.","Lines to ×: the top and bottom lines move 8 px to the centre and rotate ±45°; the middle line fades with opacity 1 − a. Blue while open.","Menu: white, 140 tall, top at y = 44 − 140 + 140·a so it drops from under the header (clipped below the header), shadow blur 16, four items, the first blue."]},"use":{"ja":"スマホなど幅の狭い画面で、全体メニューを1つのボタンにしまいたいとき。","en":"Use it on narrow screens to tuck the main navigation behind one button."},"tags":["hamburger-menu","hamburger","menu-icon","nav-toggle","mobile-menu","menu"]},{"id":"066","pack":"ui","no":"18","slug":"breadcrumbs","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"パンくずリスト","en":"Breadcrumbs","zh-Hant":"麵包屑"},"meaning":{"ja":"今いる場所を階層で示す","en":"A trail of links showing where the page sits in the site","zh-Hant":"以階層顯示目前所在位置"},"ask":{"ja":"記事ページの上にパンくずリストを付けて。「ホーム › 講座 › Web制作」の形で、今のページは太字でリンクなし。","en":"Add breadcrumbs above the article: \"Home › Courses › Web design\", with the current page in bold and not linked.","zh-Hant":"在文章頁上方加上麵包屑。格式為「首頁 › 課程 › 網頁設計」，目前頁面用粗體且不加連結。"},"summary":{"ja":"パンくずの「講座」を押すと一つ上の一覧ページに戻り、一覧のカードを押すと元の詳細ページへ進む。","en":"Clicking \"Courses\" in the breadcrumbs goes up to the list page; clicking a card there returns to the detail page."},"spec":{"ja":["4.5秒周期・カード542×191。上に「ホーム › 講座 › Web制作」（17px）。リンクは青、今のページは黒の太字。下に区切り線（y 46）","カーソルが「講座」に乗ると0.9〜1.2秒に下線、1.0秒にクリック","上へ戻る量 up: 1.0〜1.25秒に easeInOutCubic で 0→1。「› Web制作」が消え、「講座」が今のページ（黒の太字）になる","中身: 詳細ページ（見出しと本文）から、3枚のカード（158×118・山の絵付き）の一覧へ不透明度で切り替える","戻る: カーソルが1枚目のカードに乗り（2.45〜2.8秒に青い枠）、2.7秒にクリック。2.7〜2.95秒に元の詳細ページへ"],"en":["4.5 s cycle on a 542×191 card. At the top \"Home › Courses › Web design\" (in Japanese, 17 px): links blue, current page black and bold; a divider at y 46.","The cursor hovers \"Courses\" (underline 0.9–1.2 s) and clicks at 1.0 s.","Up amount: 0→1 over 1.0–1.25 s with easeInOutCubic. \"› Web design\" fades out and \"Courses\" becomes the current page (black, bold).","Content cross-fades from a detail page (title and text) to a list of three cards (158×118, with a landscape picture).","Back: the cursor moves onto the first card (blue outline 2.45–2.8 s) and clicks at 2.7 s; the detail page returns over 2.7–2.95 s."]},"use":{"ja":"階層の深いサイトで、今いる場所と上の階層への戻り道を示したいとき。","en":"Use it on sites with deep hierarchies to show where the page is and give a way back up."},"tags":["breadcrumbs","breadcrumb","trail","hierarchy","navigation","path"]},{"id":"067","pack":"ui","no":"19","slug":"mega-menu","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"メガメニュー","en":"Mega menu","zh-Hant":"Mega Menu"},"meaning":{"ja":"大きな一覧メニューが広がる","en":"A wide panel of grouped links that opens from the main menu","zh-Hant":"展開大型的分組連結面板"},"ask":{"ja":"ヘッダーの「製品」にメガメニューを付けて。乗せたら0.25秒で全幅のパネルを下ろし、3列のリンクと画像を並べて。","en":"Give \"Products\" in the header a mega menu: on hover, drop a full-width panel in 0.25 s with three columns of links and an image.","zh-Hant":"幫頁首的「產品」加上 Mega Menu。游標移上去時 0.25 秒內往下展開滿版面板，排列三欄連結和一張圖片。"},"summary":{"ja":"ヘッダーの「製品」にカーソルを乗せると、全幅のパネルが下りて3列のリンクと画像が並ぶ。離れると閉じる。","en":"Hovering over \"Products\" in the header drops a full-width panel with three columns of links and an image; it closes when the cursor leaves."},"spec":{"ja":["4.5秒周期・カード542×191。高さ42のヘッダーに「製品・料金・サポート」（各16px、下向き矢印付き）","カーソルは押さずに乗せるだけ: 1.0秒に「製品」へ着く。開く量 a: 1.05〜1.3秒に easeOutCubic で 0→1。「製品」は青・下線付きになる","パネル: 白・全幅・高さ146。ヘッダーの下から12px上から下りつつ不透明度 a で出る。影 blur 18・下へ8","中身: 130px間隔の3列（青い見出しと3つのリンク）と、右に絵 104×112。カーソルが下りて1.75〜2.9秒に2列目の2つ目のリンクを薄い青で強調","閉じる: カーソルが2.9秒からパネルの外へ出て、3.15〜3.4秒に (1 − easeInOutCubic) で消える"],"en":["4.5 s cycle on a 542×191 card. A 42-tall header with \"Products, Pricing, Support\" (in Japanese, 16 px, each with a down chevron).","The cursor only hovers: it reaches \"Products\" at 1.0 s. Open amount a: 0→1 over 1.05–1.3 s with easeOutCubic; \"Products\" turns blue with an underline.","Panel: white, full width, 146 tall, dropping 12 px into place under the header while fading in with a. Shadow blur 18, offset y 8.","Inside: three columns 130 px apart (a blue heading and three links each) and a 104×112 picture at the right. The cursor moves down and the second link of the second column is highlighted light blue from 1.75 to 2.9 s.","Close: the cursor leaves the panel from 2.9 s; it fades over 3.15–3.4 s (1 − easeInOutCubic)."]},"use":{"ja":"製品やサービスが多いサイトで、全体を一度に見渡せるメニューにしたいとき。","en":"Use it on sites with many products or sections so visitors can see the whole range at once."},"tags":["mega-menu","megamenu","dropdown-navigation","navigation","header-menu","multi-column"]},{"id":"068","pack":"ui","no":"20","slug":"step-indicator","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"ステップインジケーター","en":"Step indicator","zh-Hant":"步驟指示器"},"meaning":{"ja":"手続きの何番目かを示す","en":"Shows which step of a process you are on","zh-Hant":"顯示目前進行到第幾步"},"ask":{"ja":"申し込みフォームの上にステップインジケーターを付けて。入力・確認・支払い・完了の4段階で、済んだ段階はチェックにして。","en":"Add a step indicator above the sign-up form with four steps: Details, Review, Payment, Done; completed steps show a check.","zh-Hant":"在申請表單上方加上步驟指示器。分為填寫、確認、付款、完成四個步驟，已完成的步驟顯示勾號。"},"summary":{"ja":"「次へ」を押すたびに、4段階の丸が順にチェックに変わり、青い線が次の段階へ伸びる。","en":"Each click on \"Next\" turns the next of four step circles into a check and extends the blue line to the following step."},"spec":{"ja":["4.5秒周期・カード542×191。4つの段階「入力・確認・支払い・完了」を x 80・207・334・461、y 35 に置く。丸は半径17、間を灰色の4pxの線でつなぐ","カーソルが右下の「次へ」（110×38）を0.9・1.7・2.5秒にクリック","押すたびに、今の段階は青い丸に白いチェック、次の段階は青い丸に白い番号になる。未到達は白い丸に灰色の縁と番号","青い線は1回につき127px、0.3秒の easeInOutCubic で伸びる。3回目で4つすべてがチェックになる","戻し: 3.75〜4.05秒に段階の表示ごと消し、4.05〜4.3秒に1段目の状態で出し直す"],"en":["4.5 s cycle on a 542×191 card. Four steps (\"Details, Review, Payment, Done\" in Japanese) at x 80, 207, 334, 461, y 35; circles of radius 17 joined by a 4 px grey line.","The cursor clicks \"Next\" (110×38, bottom right) at 0.9, 1.7 and 2.5 s.","On each click the current step becomes a blue circle with a white check and the next becomes the current one (blue circle, white number). Steps not reached are white with a grey rim.","The blue line grows 127 px per click over 0.3 s with easeInOutCubic; after the third click all four are checked.","Reset: the indicator fades out over 3.75–4.05 s and fades back in at step 1 over 4.05–4.3 s."]},"use":{"ja":"申し込みや購入など、何段階かに分かれた手続きで今の位置を示したいとき。","en":"Use it in multi-step flows such as sign-up or checkout to show progress and what is left."},"tags":["step-indicator","stepper","steps","progress-steps","wizard","multi-step","checkout"]},{"id":"069","pack":"ui","no":"21","slug":"skeleton-screen","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"スケルトン","en":"Skeleton screen","zh-Hant":"Skeleton"},"meaning":{"ja":"読み込み中に灰色の枠を出す","en":"Grey shapes stand in for content while it loads","zh-Hant":"載入時以灰色方塊佔位"},"ask":{"ja":"一覧の読み込み中はスケルトンを出して。中身と同じ形の灰色の枠にして、光が左から右へ0.9秒で流れるように。","en":"While the list loads, show a skeleton screen: grey blocks in the shape of the content, with a shine sweeping left to right every 0.9 s.","zh-Hant":"列表載入時顯示 Skeleton。做成和內容形狀相同的灰色方塊，並讓光澤每 0.9 秒由左向右掃過。"},"summary":{"ja":"再読み込みを押すと、一覧の中身が同じ形の灰色の枠に変わり、光が横に流れる。読み込みが済むと中身に戻る。","en":"Clicking reload turns the list into grey blocks of the same shape with a sweeping shine; the content returns when loading ends."},"spec":{"ja":["4.5秒周期・カード542×191。2行の一覧（絵 96×56 と文字3行）。右上の再読み込みアイコンをカーソルが1.0秒にクリック","1.05〜1.2秒に直線で、中身から同じ位置・同じ大きさの灰色 #e9e7e5 の角丸の枠へ切り替える","光: 白の帯（幅160、両端は透明・中央は不透明度0.75）を、0.9秒ごとに左（x −200）から右（x 742）へ流す。枠の上だけに重ねる","3.0〜3.3秒に直線で中身へ戻す"],"en":["4.5 s cycle on a 542×191 card. A two-row list (a 96×56 picture and three text lines each). The cursor clicks the reload icon at top right at 1.0 s.","Over 1.05–1.2 s (linear) the content switches to grey #e9e7e5 rounded blocks of the same size and position.","Shine: a white band 160 wide (transparent at the edges, opacity 0.75 in the middle) sweeps from x −200 to x 742 every 0.9 s, drawn only over the blocks.","The content returns over 3.0–3.3 s (linear)."]},"use":{"ja":"読み込みに少し時間がかかる一覧やカードで、待っている間も画面の形を見せたいとき。","en":"Use it for lists or cards that take a moment to load, so the layout is visible while people wait."},"tags":["skeleton","skeleton-screen","placeholder","shimmer","loading","ghost-content"]},{"id":"070","pack":"ui","no":"22","slug":"spinner","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"スピナー","en":"Spinner","zh-Hant":"Spinner"},"meaning":{"ja":"くるくる回って待ちを示す","en":"A spinning circle that means \"please wait\"","zh-Hant":"旋轉的圓圈表示請稍候"},"ask":{"ja":"送信中はボタンの上にスピナーを出して。1秒に1回転強で回し、終わったら青い丸のチェックに替えて。","en":"While sending, show a spinner over the form, turning a little over once per second, then replace it with a blue check when done.","zh-Hant":"送出中在按鈕上顯示 Spinner。大約每秒轉一圈多一點，完成後換成藍色圓形的勾號。"},"summary":{"ja":"「送信」を押すと画面が白くかすみ、中央で青い弧が回る。済むとチェックに変わって消える。","en":"Clicking \"Send\" washes the card white and a blue arc spins in the middle; when finished it changes to a check and fades."},"spec":{"ja":["4.5秒周期・カード542×191。下中央の「送信」（120×40）をカーソルが1.0秒にクリック","1.05〜1.2秒に直線で、全面に白の幕（不透明度0.78）とスピナーを出す","スピナー: (271, 92) に半径26・太さ6の薄い輪と、その上に長さ243°（1.35π）の青い弧（端は丸）。1秒に1.3回転（468°/秒）で回す","2.95〜3.05秒にスピナーを消し、2.95〜3.2秒に青い丸（半径28）と白いチェックを拡大率 0.7→1（easeOutCubic）で出す","3.75〜4.0秒に直線で幕ごと消す"],"en":["4.5 s cycle on a 542×191 card. The cursor clicks \"Send\" (120×40, bottom centre) at 1.0 s.","Over 1.05–1.2 s (linear) a white scrim (opacity 0.78) and the spinner fade in over the whole card.","Spinner at (271, 92): a pale ring, radius 26, 6 thick, with a blue 243° (1.35π) arc on top (round caps), turning 1.3 times per second (468°/s).","Over 2.95–3.05 s the spinner fades; over 2.95–3.2 s a blue circle (radius 28) with a white check scales 0.7 → 1 (easeOutCubic).","Everything fades out linearly over 3.75–4.0 s."]},"use":{"ja":"送信・保存など、終わるまでの時間が読めない短い待ちを示したいとき。","en":"Use it for short waits of unknown length, such as sending or saving."},"tags":["spinner","loading","loader","activity-indicator","progress-circle","busy"]},{"id":"071","pack":"ui","no":"23","slug":"badge","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"バッジ","en":"Badge","zh-Hant":"Badge"},"meaning":{"ja":"件数を小さな丸で示す","en":"A small dot with a number showing a count","zh-Hant":"以小圓點顯示數量"},"ask":{"ja":"ヘッダーのベルにバッジを付けて未読数を出して。増えるたびに0.3秒で少し弾ませ、開いたら消して。","en":"Add a badge to the bell in the header to show the unread count: it pops for 0.3 s each time the count goes up and disappears when opened.","zh-Hant":"在頁首的鈴鐺加上 Badge 顯示未讀數。每次數字增加就在 0.3 秒內微微彈跳，點開後消失。"},"summary":{"ja":"ヘッダーのベルに通知が届くたび、右上の青い丸の数が1・2・3と増える。ベルを押すと消える。","en":"Each time a notification arrives, the blue dot on the bell in the header counts up 1, 2, 3; clicking the bell clears it."},"spec":{"ja":["4.5秒周期・カード542×191。高さ54のヘッダー。右の (482, 27) にベルの線画","バッジ: ベル右上（+12, −12）に半径12の青い丸、白い2.5pxの縁、白い14pxの数字","通知が0.7・1.3・1.9秒に届き、数が 1→2→3。1つ目は0.7〜0.9秒に easeOutCubic で拡大して出る","届くたびに拡大率 1.3→1 を0.3秒で戻し、同時に波紋（半径 12→28、不透明度 0.5→0）を0.5秒で広げる","カーソルが2.95秒にベルへ着き3.0秒にクリック。3.0〜3.25秒に easeInOutCubic でバッジを0まで縮める"],"en":["4.5 s cycle on a 542×191 card. A 54-tall header with a line-drawn bell at (482, 27) on the right.","Badge: a blue circle of radius 12 at the bell's top right (+12, −12), 2.5 px white rim, white 14 px number.","Notifications arrive at 0.7, 1.3 and 1.9 s: the count goes 1 → 2 → 3. The first scales in over 0.7–0.9 s with easeOutCubic.","Each arrival pops the scale from 1.3 back to 1 over 0.3 s and sends out a ripple ring (radius 12 → 28, opacity 0.5 → 0) over 0.5 s.","The cursor reaches the bell at 2.95 s and clicks at 3.0 s; the badge shrinks to 0 over 3.0–3.25 s with easeInOutCubic."]},"use":{"ja":"未読・新着・カートの中身など、件数を目立たせたいとき。","en":"Use it to call attention to a count, such as unread messages or items in a cart."},"tags":["badge","notification-badge","counter","count","dot","unread"]},{"id":"072","pack":"ui","no":"24","slug":"empty-state","category":"navigate-status","width":542,"height":191,"cycle":4.5,"name":{"ja":"エンプティステート","en":"Empty state","zh-Hant":"Empty State"},"meaning":{"ja":"中身がないときの案内画面","en":"The screen shown when there is nothing to list yet","zh-Hant":"沒有內容時顯示的引導畫面"},"ask":{"ja":"リストが空になったらエンプティステートを出して。線画のアイコン、「まだ何もありません」、追加するボタンを0.35秒で出して。","en":"When the list is empty, show an empty state: a line icon, \"Nothing here yet\" and an add button, fading in over 0.35 s.","zh-Hant":"列表清空時顯示 Empty State。用 0.35 秒淡入線條圖示、「目前還沒有任何內容」和新增按鈕。"},"summary":{"ja":"一覧の2行をごみ箱で順に消すと、空の箱の線画と「まだ何もありません」「追加する」ボタンが出る。","en":"Deleting the two list rows with their trash icons brings up an empty-box drawing, \"Nothing here yet\" and an \"Add\" button."},"spec":{"ja":["4.5秒周期・カード542×191。2行の一覧（494×48・角丸8、右端にごみ箱）","カーソルがごみ箱を0.95秒と1.65秒にクリック。各行は0.3秒の easeInOutCubic で左へ60px動きながら消え、2行目は1行目の位置へ58px上がる","1.95〜2.3秒に直線で、空の状態を8px下から上げつつ出す: 青い線画の受け箱、「まだ何もありません」（16px）、青い「追加する」ボタン（112×34）","カーソルが3.3秒に「追加する」をクリック。空の状態は3.25〜3.45秒に消え、2行が3.35〜3.7秒に easeOutCubic で左から戻る"],"en":["4.5 s cycle on a 542×191 card. A two-row list (494×48, radius 8, a trash icon at the right).","The cursor clicks the trash icons at 0.95 s and 1.65 s. Each row slides 60 px left while fading out over 0.3 s (easeInOutCubic); the second row moves up 58 px into the first slot.","Over 1.95–2.3 s (linear) the empty state fades in while rising 8 px: a blue line drawing of an inbox tray, \"Nothing here yet\" (16 px, in Japanese) and a blue \"Add\" button (112×34).","The cursor clicks \"Add\" at 3.3 s; the empty state fades over 3.25–3.45 s and the two rows come back from the left over 3.35–3.7 s with easeOutCubic."]},"use":{"ja":"初めて使う画面や、検索で何も見つからないときに、次にすることを案内したいとき。","en":"Use it for first-use screens or no-results pages to tell people what to do next."},"tags":["empty-state","no-data","zero-state","blank-state","no-results","onboarding"]},{"id":"073","pack":"lp","no":"01","slug":"parallax-scrolling","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"パララックススクロール","en":"Parallax scrolling","zh-Hant":"Parallax 視差滾動"},"meaning":{"ja":"スクロールで奥の層ほどゆっくり動く","en":"On scroll, background layers move slower than the content","zh-Hant":"捲動時，越後面的圖層移動得越慢"},"ask":{"ja":"ファーストビューの背景をパララックススクロールにして。背景はスクロール量の0.3倍で動かして。","en":"Make the hero background a parallax scroll: move it at 0.3× the scroll distance.","zh-Hant":"Hero 區塊的背景做成 Parallax 視差滾動，背景的移動量是捲動距離的 0.3 倍。"},"summary":{"ja":"ページを下へスクロールすると、見出しはふつうに上がり、空と太陽・遠い山・近い山はそれより遅く動く。","en":"As the page scrolls down, the headline moves up normally while the sky and sun, far hills and near hills move more slowly."},"spec":{"ja":["表示域 511×168 のブラウザの窓。スクロール量: 0.3〜1.9秒で 0→120px、2.9〜4.3秒で 120→0（easeInOut 3乗）","各層の移動量 = スクロール量 × 係数。空と太陽 0.15、遠い山 0.4、近い山 0.7","見出し（28px）・ボタン・次のセクションは 1.0（ふつうのスクロール）","次のセクション（白地）はファーストビューの下端（168px）から始まり、遅れて動く背景の上にかぶさる","右端のスクロールバーのつまみもスクロール量に合わせて動く"],"en":["A browser window with a 511 × 168 viewport. Scroll: 0→120 px at 0.3–1.9 s, 120→0 at 2.9–4.3 s (cubic ease-in-out).","Each layer moves by scroll × factor: sky and sun 0.15, far hills 0.4, near hills 0.7.","Headline (28 px), button and the next section move at 1.0 (normal scrolling).","The next section (white) starts at the bottom of the hero (168 px) and slides over the slower background.","The scrollbar thumb on the right moves with the scroll."]},"use":{"ja":"ファーストビューや区切りの写真に奥行きを出したいとき。","en":"Use it to give the hero or a section photo a sense of depth."},"tags":["parallax","parallax-scrolling","scroll","depth","layers","hero","background"]},{"id":"074","pack":"lp","no":"02","slug":"fade-in-on-scroll","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"スクロールでフェードイン","en":"Fade-in on scroll","zh-Hant":"捲動淡入"},"meaning":{"ja":"画面に入った要素がふわっと現れる","en":"Elements fade in as they scroll into view","zh-Hant":"進入畫面的元素會柔和地淡入"},"ask":{"ja":"各セクションの見出しとカードを、スクロールでフェードインさせて。下から30px、0.6秒で。","en":"Fade in each section's heading and cards on scroll: up from 30 px below, over 0.6 s.","zh-Hant":"各區塊的標題和卡片加上捲動淡入，從下方 30 px 處往上浮現，時間 0.6 秒。"},"summary":{"ja":"スクロールで画面に入った見出し・カード・本文が、それぞれ下から浮かび上がりながら現れる。","en":"As the page scrolls, the heading, the cards and the body text each rise into place and fade in when they enter the view."},"spec":{"ja":["スクロール量: 0.35〜1.0秒で 0→95px、1.5〜2.1秒で 95→200px、3.2〜4.4秒で 200→0（いずれも easeInOut 3乗）","判定線は表示域の高さの85%（上から143px）。要素の上端がこの線より上に来た時刻に発火（Intersection Observer の考え方）","発火から0.7秒で 不透明度 0→1、下から28px → 0 へ（easeOut 3乗）","要素は見出し（ページ上 172px）・カード3枚の列（206px）・本文（334px）の3つ。最初はどれも画面の下に隠れている。列のカードは同時に出る","スクロールで戻って画面の下へ出た要素は、見えない所で元の状態に戻る（次に入るとまた出る）"],"en":["Scroll: 0→95 px at 0.35–1.0 s, 95→200 px at 1.5–2.1 s, 200→0 at 3.2–4.4 s (all cubic ease-in-out).","Trigger line at 85% of the viewport height (143 px from the top). An element fires when its top edge passes above it (the Intersection Observer idea).","After firing, over 0.7 s: opacity 0→1 and offset 28 px below → 0 (cubic ease-out).","Three elements: the heading (172 px down the page), a row of three cards (206 px) and body text (334 px), all below the view at first. The cards in the row appear together.","When an element leaves the bottom of the view on the way back up, it is reset out of sight and plays again next time."]},"use":{"ja":"縦に長いLPで、読み進めるごとに内容を一つずつ見せたいとき。","en":"Use it on a long landing page to bring content in piece by piece as the reader scrolls."},"tags":["fade-in","scroll-reveal","reveal-on-scroll","intersection-observer","aos","entrance","scroll"]},{"id":"075","pack":"lp","no":"03","slug":"sticky-header","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"追従ヘッダー","en":"Sticky header","zh-Hant":"Sticky Header"},"meaning":{"ja":"スクロールしてもヘッダーが上に残る","en":"The header stays at the top while the page scrolls","zh-Hant":"捲動頁面時，Header 固定停在最上方"},"ask":{"ja":"ヘッダーを追従ヘッダーにして。上に張り付いたら下に薄い影を付けて。","en":"Make the header a sticky header, with a soft shadow once it sticks to the top.","zh-Hant":"把 Header 做成 Sticky Header，黏到頂端之後在下緣加一層淡淡的陰影。"},"summary":{"ja":"上のお知らせの帯はスクロールで消えるが、その下のヘッダーは画面の上端に来たところで止まり、本文がその下を通っていく。","en":"The announcement strip scrolls away, but the header below it stops at the top edge and the content scrolls underneath."},"spec":{"ja":["スクロール量: 0.4〜1.3秒で 0→110px、1.9〜2.8秒で 110→250px、3.4〜4.4秒で 250→0（easeInOut 3乗）","ページの一番上に高さ22pxのお知らせの帯（濃紺）、その下に高さ34pxのヘッダー（ロゴ・メニュー3つ・ボタン）","ヘッダーの位置 = max(22 − スクロール量, 0)。帯が見えなくなった所で上端に止まる（position: sticky; top: 0）","止まってからの24pxのスクロールで、ヘッダーの下に高さ12pxの影を 不透明度 0→0.16 で付ける","本文（写真・見出し・カード3枚）はヘッダーの下をふつうにスクロールする"],"en":["Scroll: 0→110 px at 0.4–1.3 s, 110→250 px at 1.9–2.8 s, 250→0 at 3.4–4.4 s (cubic ease-in-out).","At the very top, a 22 px announcement strip (navy); below it a 34 px header (logo, three menu items, button).","Header position = max(22 − scroll, 0): once the strip is gone, it stops at the top edge (position: sticky; top: 0).","Over the next 24 px of scroll, a 12 px shadow under the header fades from 0 to 0.16 opacity.","The content (photo, heading, three cards) scrolls normally under the header."]},"use":{"ja":"長いページでも、メニューや申し込みボタンにいつでも手が届くようにしたいとき。","en":"Use it to keep the menu and the call-to-action within reach on a long page."},"tags":["sticky","sticky-header","fixed-header","position-sticky","navigation","header","scroll"]},{"id":"076","pack":"lp","no":"04","slug":"pinning","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"ピン留め","en":"Pinning","zh-Hant":"Pin（捲動固定）"},"meaning":{"ja":"セクションを止めて中身だけ進める","en":"A section stays fixed while scrolling advances its content","zh-Hant":"區塊固定不動，只讓內容隨捲動推進"},"ask":{"ja":"「3ステップ」のセクションをピン留めして、スクロールで1ステップずつ写真と番号を切り替えて。","en":"Pin the three-step section and switch the photo and number one step at a time as the user scrolls.","zh-Hant":"把「三步驟」區塊 Pin 住，隨著捲動，一次切換一個步驟的照片和編號。"},"summary":{"ja":"濃紺のセクションが画面いっぱいに来たところで止まり、スクロールし続けると番号と写真がステップ1→2→3と切り替わり、終わると再び流れていく。","en":"A navy section stops when it fills the view; further scrolling steps the number and photo through 1→2→3, then the section scrolls on."},"spec":{"ja":["スクロール量: 0.3〜3.0秒で 0→500px、3.5〜4.5秒で 500→0（easeInOut 3乗）","セクション（高さ168・濃紺）はスクロール量110pxで上端に着き、そこから300pxのあいだ止まる（GSAP ScrollTrigger の pin）","止まっている間の進み具合 p = (スクロール量 − 110) / 300。左の縦線（長さ124）が p に合わせて朱色で伸びる","p が 1/3 と 2/3 の所（前後 ±0.07、easeInOut 3乗）で次のステップへ: 番号（46px）が52px、写真（226×124）が124px 上へ送られる","300px 進むと止めを外し、セクションは次の白いセクションと一緒に上へ流れる"],"en":["Scroll: 0→500 px at 0.3–3.0 s, 500→0 at 3.5–4.5 s (cubic ease-in-out).","The section (168 tall, navy) reaches the top at 110 px of scroll and stays there for the next 300 px (a GSAP ScrollTrigger pin).","Progress while pinned: p = (scroll − 110) / 300. A vertical line (124 long) on the left fills in orange with p.","At p = 1/3 and 2/3 (±0.07, cubic ease-in-out) it moves to the next step: the number (46 px) rolls up 52 px and the photo (226 × 124) slides up 124 px.","After 300 px the pin is released and the section scrolls up with the white section below it."]},"use":{"ja":"手順・特長・ビフォーアフターを、1画面で順番に見せたいとき。","en":"Use it to walk through steps, features or a before/after in one screen."},"tags":["pin","pinning","scrolltrigger","gsap","scroll-driven","steps","storytelling"]},{"id":"077","pack":"lp","no":"05","slug":"horizontal-scroll","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"横スクロール","en":"Horizontal scroll","zh-Hant":"橫向捲動"},"meaning":{"ja":"縦のスクロールで中身が横に流れる","en":"Scrolling down moves the content sideways","zh-Hant":"往下捲動時，內容改為橫向移動"},"ask":{"ja":"実績のセクションを横スクロールにして。縦にスクロールした分だけ、カードを左へ流して。","en":"Turn the work section into a horizontal scroll: move the cards left as far as the user scrolls down.","zh-Hant":"把作品區塊做成橫向捲動：區塊固定在畫面上，使用者往下捲多少，卡片就往左移多少。"},"summary":{"ja":"縦にスクロールすると、セクションが止まったまま、番号付きの作品カード4枚が左へ流れていく。","en":"As the page scrolls down, the section holds still and four numbered work cards travel to the left."},"spec":{"ja":["スクロール量: 0.3〜3.0秒で 0→420px、3.5〜4.5秒で 420→0（easeInOut 3乗）","見出し「WORKS」は上へ流れ、セクションはスクロール量40pxで上端に着いて止まる","カード: 200×112 を4枚、間隔20、左右の余白34。横に動く量 = 34×2 + 200×4 + 20×3 − 511 = 417px","カードの横位置 = 元の位置 − p × 417。p = (スクロール量 − 40) / 380（スクロールに比例・イージングなし）","スクロールバーのつまみは縦に動き、カードは横に動く"],"en":["Scroll: 0→420 px at 0.3–3.0 s, 420→0 at 3.5–4.5 s (cubic ease-in-out).","The heading \"WORKS\" scrolls away; the section reaches the top at 40 px of scroll and stays there.","Cards: four at 200 × 112, gap 20, side padding 34. Horizontal travel = 34·2 + 200·4 + 20·3 − 511 = 417 px.","Card x = start x − p × 417, with p = (scroll − 40) / 380: linear in scroll, no easing.","The scrollbar thumb moves down while the cards move sideways."]},"use":{"ja":"作品・事例・商品を、縦長のページの中で横一列に見せたいとき。","en":"Use it to show work, case studies or products in a row inside a long vertical page."},"tags":["horizontal-scroll","sideways","scrolltrigger","pin","gallery","portfolio","scroll"]},{"id":"078","pack":"lp","no":"06","slug":"scroll-snap","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"スクロールスナップ","en":"Scroll snap","zh-Hant":"Scroll Snap"},"meaning":{"ja":"スクロールが区切りの位置にピタッと止まる","en":"Scrolling settles exactly on the next section","zh-Hant":"捲動後會剛好停在區塊的分界位置"},"ask":{"ja":"セクションごとにスクロールスナップさせて。少し回しただけで次のセクションの頭に合わせて。","en":"Add scroll snap per section, so a small scroll lands on the top of the next section.","zh-Hant":"每個區塊都加上 Scroll Snap，只要稍微捲一下，就自動對齊到下一個區塊的頂端。"},"summary":{"ja":"少しだけスクロールすると、残りは自動で送られて、次のセクションの頭がちょうど画面の上にそろう。","en":"After a small scroll, the page carries itself the rest of the way until the next section's top lines up with the top of the view."},"spec":{"ja":["セクションの高さ = 表示域の高さ（168px）。1つ目は薄い青地、2つ目は濃紺","2.4秒で1回。0.45〜0.85秒に手で34pxだけスクロール（easeOut 3乗）","0.9〜1.5秒に残りの134pxを自動で送り、次のセクションの頭に合わせる（easeOut 3乗）","後半の2.4秒は同じ動きを上向きに行い、1つ目のセクションへ戻る（scroll-snap-type: y mandatory の動き）"],"en":["Each section is as tall as the viewport (168 px). The first is pale blue, the second navy.","One snap per 2.4 s. At 0.45–0.85 s the user scrolls only 34 px (cubic ease-out).","At 0.9–1.5 s the page moves the remaining 134 px by itself and lines up the next section's top (cubic ease-out).","The second 2.4 s does the same upward, back to the first section (the behaviour of scroll-snap-type: y mandatory)."]},"use":{"ja":"1画面ずつ区切って見せるLPや、スライドのようなページにしたいとき。","en":"Use it for a page that should read one full screen at a time, like slides."},"tags":["scroll-snap","snap","full-page","sections","css","mandatory","scroll"]},{"id":"079","pack":"lp","no":"07","slug":"scroll-progress-bar","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"スクロールプログレスバー","en":"Scroll progress bar","zh-Hant":"閱讀進度條"},"meaning":{"ja":"読み進めた割合を上の線で見せる","en":"A bar at the top shows how far you have read","zh-Hant":"用最上方的線條顯示閱讀進度"},"ask":{"ja":"記事ページの上にスクロールプログレスバーを付けて。太さ4px、色はブランドの朱色で。","en":"Add a scroll progress bar at the top of the article page, 4 px thick, in the brand orange.","zh-Hant":"在文章頁最上方加上閱讀進度條，粗 4 px，顏色用品牌的橘紅色。"},"summary":{"ja":"記事を少しずつ読み進めるごとに、画面の上端の線が左から伸び、最後まで来ると端まで届く。","en":"As the article is read a bit at a time, the line along the top grows from the left and reaches the far end at the bottom of the page."},"spec":{"ja":["記事のページを 0→430px までスクロール。110pxずつ4回、それぞれ0.45秒で動いて0.4秒止まる（easeInOut 3乗）","3.75〜4.55秒で 430→0 に戻る","表示域の上端に高さ6pxの線。地は薄いグレー、伸びる部分は朱色","伸びる幅 = 511px × スクロール量 / 430（スクロールの割合そのまま。CSS の animation-timeline: scroll() と同じ）"],"en":["The article scrolls 0→430 px in four 110 px steps, each moving for 0.45 s then pausing 0.4 s (cubic ease-in-out).","It returns 430→0 at 3.75–4.55 s.","A 6 px bar along the top of the viewport: light grey track, orange fill.","Fill width = 511 px × scroll / 430, the scroll fraction itself (the same as CSS animation-timeline: scroll())."]},"use":{"ja":"長い記事やコラムで、あとどれくらいで読み終わるかを伝えたいとき。","en":"Use it on long articles to show how much is left to read."},"tags":["progress-bar","reading-progress","scroll-progress","indicator","scroll-driven","article"]},{"id":"080","pack":"lp","no":"08","slug":"highlighter-animation","category":"scroll","width":539,"height":208,"cycle":4.8,"name":{"ja":"マーカーアニメーション","en":"Highlighter animation","zh-Hant":"螢光筆動畫"},"meaning":{"ja":"大事な言葉に蛍光ペンの線が引かれる","en":"A highlighter stroke is drawn under key words","zh-Hant":"重點文字的下半部被螢光筆塗上顏色"},"ask":{"ja":"強調したい言葉に、スクロールで画面に入ったらマーカーアニメーションで黄色の線を引いて。0.8秒で左から。","en":"When the key phrase scrolls into view, draw a yellow highlighter animation under it, left to right in 0.8 s.","zh-Hant":"重點文字捲動進入畫面時，用螢光筆動畫由左到右塗上黃色底色，蓋住文字下半部，時間 0.8 秒。"},"summary":{"ja":"スクロールで文章が画面に入ると、大事な言葉の下半分に黄色い蛍光ペンの線が左から引かれる。","en":"As the copy scrolls into view, a yellow highlighter stroke is drawn left to right across the lower half of the key words."},"spec":{"ja":["スクロール量: 0.35〜1.0秒で 0→90px、1.6〜2.2秒で 90→180px、3.3〜4.4秒で 180→0（easeInOut 3乗）","文章は2行（20px・太字）。ページ上の 190px と 290px にあり、最初は画面の下に隠れている","行の上端が判定線（表示域の高さの80%＝134px）より上に来た時刻に、強調する言葉の下に線を引き始める","線: 黄色 #FFE36B、高さ11（文字の下寄り。ベースラインの8px上〜3px下）。幅 0→言葉の幅 を0.8秒で左から（easeOut 3乗）。文字の後ろに描く","画面の下へ出た行は、見えない所で線を消して元に戻す"],"en":["Scroll: 0→90 px at 0.35–1.0 s, 90→180 px at 1.6–2.2 s, 180→0 at 3.3–4.4 s (cubic ease-in-out).","Two lines of copy (20 px, bold) at 190 px and 290 px down the page, hidden below the view at first.","When a line's top passes the trigger line (80% of the viewport height, 134 px), the stroke under its key words starts.","Stroke: yellow #FFE36B, 11 tall, in the lower part of the text (8 px above to 3 px below the baseline). Width 0 → word width from the left over 0.8 s (cubic ease-out), drawn behind the text.","Lines that leave the bottom of the view are reset out of sight."]},"use":{"ja":"LPの本文で、いちばん伝えたい一言を読んでいる瞬間に目立たせたいとき。","en":"Use it in landing-page copy to make the one phrase that matters stand out as it is read."},"tags":["highlighter","marker","text-highlight","emphasis","scroll-reveal","copy","underline"]},{"id":"081","pack":"lp","no":"09","slug":"hover-lift","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"ホバーで浮き上がる","en":"Hover lift","zh-Hant":"Hover 浮起效果"},"meaning":{"ja":"カーソルを乗せると影を付けて浮く","en":"On hover, the element rises with a deeper shadow","zh-Hant":"滑鼠移上去時，元素加深陰影並浮起"},"ask":{"ja":"カードにカーソルを乗せたら、ホバーで浮き上がるようにして。上に8px、影を濃く、0.3秒で。","en":"Give the cards a hover lift: up 8 px with a deeper shadow, over 0.3 s.","zh-Hant":"卡片加上 Hover 浮起效果：滑鼠移上去時往上浮 8 px，陰影加深，時間 0.3 秒。"},"summary":{"ja":"カーソルが乗ったカードだけが少し上に持ち上がり、下の影が広がる。カーソルが離れると元に戻る。","en":"Only the card under the cursor lifts slightly and its shadow spreads; it settles back when the cursor leaves."},"spec":{"ja":["カード3枚（146×128・角丸10）。カーソルが左から順に約1秒ずつ乗る","乗ったら0.3秒で上へ10px（easeOut 3乗）。離れたら同じ0.3秒で戻る（CSS の transition と同じ）","影: ぼかし 6→22px、下へのずれ 2→12px、濃さ 0.08→0.22 を移動と一緒に変える","地は薄いグレー、カードは白（影が見えるように）"],"en":["Three cards (146 × 128, radius 10). The cursor rests on each, left to right, for about 1 s.","On hover the card rises 10 px over 0.3 s (cubic ease-out); on leave it returns over the same 0.3 s (like a CSS transition).","Shadow, changed together with the lift: blur 6→22 px, y offset 2→12 px, opacity 0.08→0.22.","Light grey page, white cards, so the shadow reads."]},"use":{"ja":"カード・ボタンなど、押せる物を押せそうに見せたいとき。","en":"Use it to make cards and buttons look clickable."},"tags":["hover","lift","float","card","shadow","translatey","interaction"]},{"id":"082","pack":"lp","no":"10","slug":"image-zoom-on-hover","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"ホバーで画像ズーム","en":"Image zoom on hover","zh-Hant":"Hover 圖片放大"},"meaning":{"ja":"枠はそのままで写真だけ拡大する","en":"The photo enlarges inside a fixed frame","zh-Hant":"外框不變，只有裡面的照片放大"},"ask":{"ja":"実績の写真にホバーで画像ズームを付けて。枠は固定で、中身を1.1倍まで0.5秒で。","en":"Add an image zoom on hover to the work photos: fixed frame, content to 1.1× over 0.5 s.","zh-Hant":"作品照片加上 Hover 圖片放大，外框固定，裡面的圖在 0.5 秒內放大到 1.1 倍。"},"summary":{"ja":"カーソルが乗った写真だけが、枠の大きさは変えずに中身がゆっくり拡大し、離れると戻る。","en":"The photo under the cursor slowly enlarges while its frame stays the same size, and shrinks back when the cursor leaves."},"spec":{"ja":["写真の枠 222×118（角丸8）を2つ並べる。カーソルが左、右の順に約1.5秒ずつ乗る","乗ったら0.5秒で中身の拡大率 1→1.15（中心から・easeOut 3乗）。離れたら同じ0.5秒で戻る","枠の外にはみ出した部分は切る（overflow: hidden）。枠と下の文字は動かない"],"en":["Two photo frames, 222 × 118 (radius 8). The cursor rests on the left one, then the right one, for about 1.5 s each.","On hover the content scales 1→1.15 from the centre over 0.5 s (cubic ease-out); on leave it returns over 0.5 s.","Anything outside the frame is clipped (overflow: hidden). The frame and the caption do not move."]},"use":{"ja":"写真の一覧（実績・商品・記事）で、どれを選ぼうとしているかを伝えたいとき。","en":"Use it on photo grids (work, products, articles) to show which item is about to be chosen."},"tags":["hover","zoom","image","scale","overflow-hidden","thumbnail","gallery"]},{"id":"083","pack":"lp","no":"11","slug":"cursor-follower","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"マウスストーカー","en":"Cursor follower","zh-Hant":"滑鼠跟隨效果"},"meaning":{"ja":"カーソルを丸が遅れて追いかける","en":"A shape trails the mouse pointer with a delay","zh-Hant":"一個圓形延遲跟隨滑鼠游標移動"},"ask":{"ja":"サイト全体にマウスストーカーを付けて。直径30pxの朱色の丸が、少し遅れてカーソルを追うように。","en":"Add a cursor follower across the site: a 30 px orange circle that trails the pointer slightly.","zh-Hant":"全站加上滑鼠跟隨效果，一個直徑 30 px 的橘紅色圓形，稍微延遲地跟著游標移動。"},"summary":{"ja":"カーソルがページの上を動き回ると、朱色の丸が少し遅れてそのあとを追いかける。","en":"As the cursor moves around the page, an orange circle follows it a little behind."},"spec":{"ja":["カーソルの道筋: x = 255 + 175·sin(2πt/4.8)、y = 86 + 46·sin(4πt/4.8)（8の字を横に寝かせた形・4.8秒で1周）","丸: 半径17・朱色・不透明度0.88。カーソルの下に描く","追いかけ方: 毎フレーム（60fps）残りの距離の12%ずつ近づく（x += (カーソルのx − x) × 0.12）","カーソル（矢印）はそのまま見せる"],"en":["Cursor path: x = 255 + 175·sin(2πt/4.8), y = 86 + 46·sin(4πt/4.8) (a figure eight lying on its side, one lap per 4.8 s).","Circle: radius 17, orange, opacity 0.88, drawn under the cursor.","Follow rule: every frame (60 fps) it covers 12% of the remaining distance (x += (cursor x − x) × 0.12).","The arrow cursor stays visible."]},"use":{"ja":"ブランドサイトやポートフォリオで、触っている感じや遊び心を足したいとき。","en":"Use it on brand sites and portfolios to add a playful, hands-on feel."},"tags":["cursor","custom-cursor","cursor-follower","mouse-follow","lerp","trail","interaction"]},{"id":"084","pack":"lp","no":"12","slug":"magnetic-button","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"マグネティックボタン","en":"Magnetic button","zh-Hant":"磁吸按鈕"},"meaning":{"ja":"近づいたカーソルにボタンが吸い寄せられる","en":"The button is pulled toward a nearby cursor","zh-Hant":"游標靠近時，按鈕會被吸過去"},"ask":{"ja":"問い合わせボタンをマグネティックボタンにして。カーソルとの差の0.3倍だけ寄って、離れたらぷるんと戻して。","en":"Make the contact button a magnetic button: move 0.3× toward the cursor, and spring back when it leaves.","zh-Hant":"把聯絡我們按鈕做成磁吸按鈕，往游標方向移動兩者距離的 0.3 倍，游標離開後要彈性地回到原位。"},"summary":{"ja":"カーソルが近づくとボタンがカーソルの方へ引き寄せられてついていき、離れるとぷるんと揺れて元の位置に戻る。","en":"As the cursor comes near, the button is drawn toward it and follows; when the cursor leaves, the button wobbles back to its place."},"spec":{"ja":["ボタン 168×52（朱色・角丸26）を中央に置く。引き寄せる範囲はボタンの中心から半径110px","範囲内: 目標のずれ = (カーソル − ボタンの中心) × 0.35。毎フレーム（60fps）残りの18%ずつ目標へ近づく","範囲外へ出たら、その時のずれから 0 へ1.1秒で戻す。イージングは elastic.out(1, 0.3)（2^(−10x)·sin((x − 0.075)·2π/0.3) + 1）","カーソルは左の外から入り、ボタンのまわりを回ってから右の外へ出る"],"en":["A 168 × 52 button (orange, radius 26) in the centre. The pull range is a 110 px radius from the button's centre.","Inside the range: target offset = (cursor − button centre) × 0.35; every frame (60 fps) the button covers 18% of the way to the target.","On leaving the range it returns from its current offset to 0 over 1.1 s with elastic.out(1, 0.3): 2^(−10x)·sin((x − 0.075)·2π/0.3) + 1.","The cursor enters from the left, circles the button and leaves to the right."]},"use":{"ja":"申し込み・問い合わせなど、いちばん押してほしいボタンを目立たせたいとき。","en":"Use it on the one button you most want clicked, such as sign-up or contact."},"tags":["magnetic","magnetic-button","hover","cursor","elastic","cta","interaction"]},{"id":"085","pack":"lp","no":"13","slug":"ripple-effect","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"リップルエフェクト","en":"Ripple effect","zh-Hant":"漣漪效果"},"meaning":{"ja":"押した場所から波紋が広がる","en":"A ripple spreads from the point that was pressed","zh-Hant":"從點擊的位置向外擴散出波紋"},"ask":{"ja":"送信ボタンにリップルエフェクトを付けて。押した位置から白い円が0.6秒で広がって消えるように。","en":"Add a ripple effect to the submit button: a white circle spreads from the click point and fades in 0.6 s.","zh-Hant":"送出按鈕加上漣漪效果，從點擊位置擴散出白色圓形，0.6 秒內擴散並淡出。"},"summary":{"ja":"ボタンを押すたびに、押した場所を中心に白い円が広がってボタンの中を満たし、薄れて消える。","en":"Each click sends a white circle out from the click point to fill the button, then it fades away."},"spec":{"ja":["ボタン 280×56（朱色・角丸10）。0.7秒に左寄り、2.9秒に右寄りの場所をクリック","円の中心 = クリックした点。半径 0 → クリック点から一番遠いボタンの角までの距離、0.6秒で（easeOut 3乗）","色は白・不透明度0.4。クリックから0.3〜0.8秒で 0 まで薄くする","円はボタンの形で切り取る（overflow: hidden）。文字は円の上に描く"],"en":["Button 280 × 56 (orange, radius 10). Clicks at 0.7 s (left of centre) and 2.9 s (right of centre).","The circle is centred on the click point; its radius grows from 0 to the distance to the button's farthest corner over 0.6 s (cubic ease-out).","White at 0.4 opacity, fading to 0 between 0.3 and 0.8 s after the click.","The circle is clipped to the button (overflow: hidden); the label sits above it."]},"use":{"ja":"ボタンやリストを押したことを、その場ですぐ返したいとき。","en":"Use it to confirm a press on a button or list item right where it happened."},"tags":["ripple","ink-ripple","material","click","tap","feedback","button"]},{"id":"086","pack":"lp","no":"14","slug":"underline-animation","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"下線アニメーション","en":"Underline animation","zh-Hant":"底線動畫"},"meaning":{"ja":"乗せたリンクの下線が左から伸びる","en":"A link's underline grows from the left on hover","zh-Hant":"滑鼠移到連結上時，底線從左邊延伸出來"},"ask":{"ja":"メニューのリンクに下線アニメーションを付けて。乗せたら左から0.3秒で伸び、離れたら右へ抜けるように。","en":"Add an underline animation to the menu links: grow from the left in 0.3 s on hover, and exit to the right on leave.","zh-Hant":"選單連結加上底線動畫，滑鼠移上去時底線在 0.3 秒內從左邊延伸出來，移開時往右邊收掉。"},"summary":{"ja":"カーソルが乗ったリンクの下に、朱色の線が左から伸び、離れると線は右へ縮んで抜けていく。","en":"Under the link the cursor is on, an orange line grows from the left; when the cursor leaves, the line shrinks away to the right."},"spec":{"ja":["リンク3つ（20px・太字・間隔56）。カーソルが左から順に約1秒ずつ乗る（当たり判定は文字の左右6px広め）","下線: 朱色・太さ3・ベースラインの8px下","乗ったら 幅 0→100% を0.3秒で左端から伸ばす（easeOut 3乗）","離れたら 左端を右へ0.3秒で動かし、右へ抜けるように消す（transform-origin を右にした scaleX と同じ）"],"en":["Three links (20 px, bold, 56 apart). The cursor rests on each, left to right, for about 1 s (hit area 6 px wider than the text on each side).","Underline: orange, 3 thick, 8 px below the baseline.","On hover, width 0→100% from the left end over 0.3 s (cubic ease-out).","On leave, the left end moves right over 0.3 s, so the line exits to the right (like scaleX with transform-origin on the right)."]},"use":{"ja":"ヘッダーのメニューや本文のリンクで、どこを指しているかを上品に伝えたいとき。","en":"Use it on menu and text links to show where the pointer is, quietly."},"tags":["underline","hover","link","navigation","menu","text-link","scalex"]},{"id":"087","pack":"lp","no":"15","slug":"before-after-slider","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"ビフォーアフタースライダー","en":"Before/after slider","zh-Hant":"Before/After 對比滑桿"},"meaning":{"ja":"境目をドラッグして前と後を見比べる","en":"Drag a divider to compare before and after","zh-Hant":"拖曳分隔線，比較前後的差異"},"ask":{"ja":"施工例の写真をビフォーアフタースライダーにして。真ん中の線をドラッグすると、左が施工前、右が施工後で見比べられるように。","en":"Show the project photos as a before/after slider: drag the middle line to compare before on the left and after on the right.","zh-Hant":"把施工案例照片做成 Before/After 對比滑桿，拖曳中間的線，左邊顯示施工前、右邊顯示施工後，方便比較。"},"summary":{"ja":"写真の真ん中の線をドラッグして左右に動かすと、左側は色のない「前」、右側は色のある「後」の範囲が入れ替わる。","en":"Dragging the line in the middle of the photo left and right changes how much of the grey \"before\" (left) and the coloured \"after\" (right) is shown."},"spec":{"ja":["写真の枠 359×140（角丸10）。右は加工後（色あり）、左は同じ写真を加工前に（彩度を抜き、濃紺 不透明度0.18 を重ねる）","境目より左だけ加工前を見せる（clip）。境目に白い線（幅3）と、左右の矢印の付いた白い丸（半径17）","0.7秒に丸をつかみ、境目の位置を 50%→20%（0.75〜1.55秒）→82%（1.55〜2.65秒）→50%（2.65〜3.55秒）。いずれも easeInOut 3乗","3.62秒に離す。左上に BEFORE、右上に AFTER の札"],"en":["Photo frame 359 × 140 (radius 10). Right: the edited photo in colour. Left: the same photo as the \"before\" (saturation removed, navy at 0.18 opacity on top).","The before image is clipped to the left of the divider. On the divider: a white line (3 wide) and a white circle (radius 17) with left/right arrows.","At 0.7 s the circle is grabbed; the divider goes 50%→20% (0.75–1.55 s) →82% (1.55–2.65 s) →50% (2.65–3.55 s), all cubic ease-in-out.","Released at 3.62 s. Labels BEFORE (top left) and AFTER (top right)."]},"use":{"ja":"施工・美容・写真の補正など、変化そのものを売りにするLPで。","en":"Use it on pages that sell a change: renovation, beauty, photo retouching."},"tags":["before-after","image-comparison","slider","drag","compare","clip","photo"]},{"id":"088","pack":"lp","no":"16","slug":"exit-intent-popup","category":"hover-click","width":539,"height":208,"cycle":4.8,"name":{"ja":"離脱防止ポップアップ","en":"Exit-intent popup","zh-Hant":"Exit-intent 彈出視窗"},"meaning":{"ja":"ページを離れそうな時に出す引き止めの小窓","en":"A popup shown when the visitor is about to leave","zh-Hant":"訪客快離開頁面時跳出的慰留視窗"},"ask":{"ja":"LPに離脱防止ポップアップを付けて。カーソルが画面の上へ出たら、クーポンの小窓を1回だけ出して。","en":"Add an exit-intent popup to the landing page: when the cursor leaves through the top, show a coupon popup once.","zh-Hant":"Landing Page 加上 Exit-intent 彈出視窗，游標移出畫面上緣時，跳出優惠券視窗，而且只出現一次。"},"summary":{"ja":"カーソルがページの上の方（タブや閉じるボタンのある所）へ出ていくと、背景が暗くなって「ちょっと待って！」の小窓が開く。×で閉じる。","en":"When the cursor heads out through the top of the page (toward the tabs and close button), the page dims and a \"Wait!\" popup opens. The × closes it."},"spec":{"ja":["カーソルは 0.7〜1.25秒にページの中からブラウザのアドレスバーの方へ上がる（easeInOut 3乗）","表示域の上端（y = 0）を越えた時刻（約1.07秒）に発火（document の mouseleave で clientY ≤ 0 と同じ判定）","発火の0.05〜0.45秒後に開く（easeOut 3乗）: 背景 濃紺 不透明度 0→0.5、小窓（260×132・角丸12）不透明度 0→1、拡大率 0.9→1","小窓の中は見出し・割引の一言（朱色）・クーポンのボタン・右上の×","2.9秒に×をクリック。0.03〜0.25秒後に消える（等速）"],"en":["The cursor rises from the page toward the browser's address bar at 0.7–1.25 s (cubic ease-in-out).","It fires when the cursor crosses the top edge of the viewport (y = 0, at about 1.07 s), the same test as mouseleave on document with clientY ≤ 0.","Opens 0.05–0.45 s after firing (cubic ease-out): backdrop navy 0→0.5 opacity; popup (260 × 132, radius 12) opacity 0→1 and scale 0.9→1.","Inside: a heading, a discount line (orange), a coupon button and an × at the top right.","Click on the × at 2.9 s; it disappears 0.03–0.25 s later (linear)."]},"use":{"ja":"申し込みや購入の直前で帰ってしまう人に、最後の一押しをしたいとき。","en":"Use it to make one last offer to visitors who are about to leave without converting."},"tags":["exit-intent","popup","mouseleave","coupon","conversion","retention","lp"]},{"id":"089","pack":"lp","no":"17","slug":"preloader","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"ローディング画面","en":"Preloader","zh-Hant":"Loading 畫面"},"meaning":{"ja":"読み込み中に出す画面","en":"A screen shown while the page loads","zh-Hant":"頁面載入期間顯示的畫面"},"ask":{"ja":"サイトを開いたときのローディング画面を作って。ロゴと％の数字を出して、100%になったら幕が上がるように。","en":"Make a preloader for the site: logo and a percentage, and the screen lifts away at 100%.","zh-Hant":"幫網站做開場的 Loading 畫面，顯示 Logo 和百分比數字，到 100% 時畫面像布幕一樣往上拉開。"},"summary":{"ja":"濃紺の画面でロゴの下の数字が0%から100%まで進み、終わると画面が上へ抜けて、下のページがふわっと現れる。","en":"On a navy screen the number under the logo counts from 0% to 100%; then the screen lifts away and the page underneath fades in."},"spec":{"ja":["表示域いっぱいの濃紺の画面に、ロゴ・数字（28px）・線（180×4）","0.25〜2.1秒で 0→100%（easeOut 3乗・整数に丸める）。線も同じ割合で朱色に伸びる","2.3〜2.85秒に画面ごと上へ168px抜ける（easeInOut 3乗）","ページの見出し・写真は 2.35〜2.95秒に 不透明度 0→1、14px下から上がる（easeOut 3乗）","4.25〜4.75秒に画面が上から下りてきて、0%の状態に戻る（次の読み込み）"],"en":["A navy screen fills the viewport with a logo, a number (28 px) and a bar (180 × 4).","0→100% at 0.25–2.1 s (cubic ease-out, rounded to whole numbers); the bar fills in orange at the same rate.","At 2.3–2.85 s the whole screen moves up 168 px and out (cubic ease-in-out).","The page heading and photo fade in 0→1 and rise from 14 px below at 2.35–2.95 s (cubic ease-out).","At 4.25–4.75 s the screen comes back down from the top, at 0% (the next load)."]},"use":{"ja":"写真や動画の多いサイトで、読み込みの待ち時間をブランドの見せ場にしたいとき。","en":"Use it on image- or video-heavy sites to turn the loading wait into a brand moment."},"tags":["preloader","loading-screen","loader","percentage","intro","splash","curtain"]},{"id":"090","pack":"lp","no":"18","slug":"lazy-loading","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"遅延読み込み","en":"Lazy loading","zh-Hant":"Lazy Loading"},"meaning":{"ja":"画面に入った画像だけを読み込む","en":"Images load only when they come into view","zh-Hant":"只載入進入畫面的圖片"},"ask":{"ja":"ギャラリーの画像を遅延読み込みにして。読み込むまでは灰色の枠、届いたら0.3秒でフェードインして。","en":"Lazy load the gallery images: grey placeholders until loaded, then fade in over 0.3 s.","zh-Hant":"相簿的圖片改用 Lazy Loading，載入前先顯示灰色佔位框，圖片載入後用 0.3 秒淡入。"},"summary":{"ja":"スクロールで画面に入った灰色の枠に読み込み中の印が回り、画像が届くと順にフェードインする。上の段は最初から読み込み済み。","en":"As grey placeholders scroll into view, a spinner turns in each, and the images fade in as they arrive. The top row is loaded from the start."},"spec":{"ja":["画像の枠 151×92 を3列×3段。1段目は最初から表示。スクロール量: 0.35〜1.1秒で 0→110px、1.7〜2.5秒で 110→225px、3.5〜4.5秒で 225→0（easeInOut 3乗）","枠の上端が表示域の下端（168px）より上に入った時刻に読み込み開始。列ごとに0.12秒ずつずらす","読み込み中の0.45秒は、枠の中央で回る印（半径11・0.8秒で1回転）","そのあと0.35秒で画像の不透明度 0→1（easeOut 3乗）。読み込み前の枠には画像の印を描く","画面の下へ出た枠は、見えない所で読み込み前に戻る"],"en":["A 3 × 3 grid of 151 × 92 placeholders; the first row is shown from the start. Scroll: 0→110 px at 0.35–1.1 s, 110→225 px at 1.7–2.5 s, 225→0 at 3.5–4.5 s (cubic ease-in-out).","Loading starts when a placeholder's top edge passes above the bottom of the viewport (168 px), with each column 0.12 s later than the one to its left.","For 0.45 s a spinner (radius 11, one turn per 0.8 s) turns in the placeholder's centre.","Then the image fades in 0→1 over 0.35 s (cubic ease-out). Unloaded placeholders show an image icon.","Placeholders that leave the bottom of the view are reset out of sight."]},"use":{"ja":"画像の多いページで、最初の表示を速くしたいとき。","en":"Use it on image-heavy pages to make the first view load faster."},"tags":["lazy-loading","lazy-load","images","placeholder","performance","spinner","gallery"]},{"id":"091","pack":"lp","no":"19","slug":"infinite-scroll","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"無限スクロール","en":"Infinite scroll","zh-Hant":"無限捲動"},"meaning":{"ja":"下まで来ると続きが自動で足される","en":"More items load automatically at the bottom","zh-Hant":"捲到底部時自動載入更多內容"},"ask":{"ja":"お知らせの一覧を無限スクロールにして。下まで来たら読み込み表示を出して、10件ずつ足して。","en":"Make the news list an infinite scroll: show a spinner at the bottom and add ten items at a time.","zh-Hant":"最新消息列表改成無限捲動，捲到底時顯示載入中的圖示，每次增加 10 筆。"},"summary":{"ja":"一覧を下へスクロールして最後まで来ると、読み込み中の印が回り、新しい項目が3件足されて続きが読めるようになる。","en":"Scrolling down to the end of the list brings up a spinner, then three new items are added so reading can go on."},"spec":{"ja":["項目（331×44・角丸8・間隔52）の一覧。最後の項目の下に読み込み中の印（半径10・0.8秒で1回転）","スクロール量: 0.25〜0.85秒で 38→116px、1.15〜1.75秒で 116→194px（easeInOut 3乗）。一覧の終わりが見えて止まる","2.6秒に3件を足す: 各項目 0.35秒で 不透明度 0→1、10px下から上がる（easeOut 3乗）。印は新しい終わりへ移る","1周期で3件（156px）ぶん進む。中身は3件ごとにくり返すので、周期の終わりと始まりは同じ見た目"],"en":["A list of items (331 × 44, radius 8, 52 apart) with a spinner (radius 10, one turn per 0.8 s) under the last item.","Scroll: 38→116 px at 0.25–0.85 s, 116→194 px at 1.15–1.75 s (cubic ease-in-out); it stops with the end of the list in view.","At 2.6 s three items are added: each fades 0→1 and rises from 10 px below over 0.35 s (cubic ease-out). The spinner moves to the new end.","Each cycle advances by three items (156 px). The content repeats every three items, so the end of the cycle looks the same as the start."]},"use":{"ja":"SNSのタイムラインやお知らせ一覧のように、終わりを気にせず読み続けてほしいとき。","en":"Use it for feeds and news lists that people should keep reading without paging."},"tags":["infinite-scroll","endless-scroll","load-more","feed","pagination","spinner","list"]},{"id":"092","pack":"lp","no":"20","slug":"page-transition","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"ページ遷移アニメーション","en":"Page transition","zh-Hant":"頁面轉場"},"meaning":{"ja":"ページを移るときの切り替えの演出","en":"An animation that bridges two pages","zh-Hant":"換頁時的過場動畫"},"ask":{"ja":"ページ遷移アニメーションを付けて。リンクを押したら朱色の幕が左から右へ横切って次のページに切り替わるように。","en":"Add a page transition: on link click, an orange panel sweeps across left to right and the next page appears.","zh-Hant":"加上頁面轉場，點擊連結後有一片橘紅色的幕布由左往右橫掃過畫面，接著切換到下一頁。"},"summary":{"ja":"作品の一覧でカードを押すと朱色の幕が左から画面を覆い、URLが変わって幕が右へ抜けると詳しいページになっている。「一覧へ」で同じように戻る。","en":"Clicking a card in the work list sweeps an orange panel across from the left; the URL changes and the panel exits to the right on the detail page. \"Back to list\" returns the same way."},"spec":{"ja":["0.8秒にカードをクリック。0.9〜1.3秒に幕（朱色・表示域いっぱい・中央にロゴ）が左から入って全体を覆う（easeInOut 3乗）","1.3秒、覆われている間にページとアドレスバーのURL（/works → /works/02）を切り替える","1.4〜1.85秒に幕が右へ抜ける（easeInOut 3乗）","3.0秒に「← 一覧へ」をクリック。3.1〜3.5秒に入り、3.5秒に切り替え、3.6〜4.05秒に抜ける","ヘッダーも含めて表示域全体を覆う"],"en":["Click on a card at 0.8 s. At 0.9–1.3 s a panel (orange, full viewport, logo in the centre) enters from the left and covers everything (cubic ease-in-out).","At 1.3 s, while covered, the page and the URL in the address bar (/works → /works/02) switch.","At 1.4–1.85 s the panel exits to the right (cubic ease-in-out).","Click on \"← Back to list\" at 3.0 s: the panel enters at 3.1–3.5 s, the page switches at 3.5 s and the panel exits at 3.6–4.05 s.","The panel covers the whole viewport, header included."]},"use":{"ja":"ブランドサイトやポートフォリオで、ページを移るときの間をつなぎたいとき。","en":"Use it on brand sites and portfolios to link one page to the next."},"tags":["page-transition","transition","view-transitions","navigation","wipe","barba","spa"]},{"id":"093","pack":"lp","no":"21","slug":"smooth-scroll","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"スムーススクロール","en":"Smooth scroll","zh-Hant":"平滑捲動"},"meaning":{"ja":"ページ内リンクでなめらかに移動する","en":"In-page links glide to their target instead of jumping","zh-Hant":"點擊錨點連結時順暢地移動過去"},"ask":{"ja":"メニューのページ内リンクをスムーススクロールにして。固定ヘッダーの高さ分ずらして止めて。","en":"Make the menu's in-page links smooth scroll, stopping below the fixed header.","zh-Hant":"選單的錨點連結改成平滑捲動，停止的位置要扣掉固定式 Header 的高度。"},"summary":{"ja":"メニューの「料金」を押すとページがなめらかに料金の欄まで動き、右下の上向きボタンを押すと同じように一番上へ戻る。","en":"Clicking \"Pricing\" in the menu glides the page down to the pricing section; the up arrow at the bottom right glides it back to the top."},"spec":{"ja":["0.9秒にメニューの「料金」をクリック。0.95〜2.0秒（1.05秒）でスクロール量 0→296px（easeInOut 3乗）","止まる位置 = 料金の欄の上端（330px）− 固定ヘッダーの高さ（34px）","スクロール量が60pxを超えると、右下に「ページの先頭へ」の丸ボタン（半径15）が40pxかけて現れる","3.1秒にそのボタンをクリック。3.15〜4.2秒で 296→0（easeInOut 3乗）","料金の欄に入っている間、メニューの「料金」を朱色にする"],"en":["At 0.9 s the \"Pricing\" menu item is clicked; scroll goes 0→296 px over 0.95–2.0 s (1.05 s, cubic ease-in-out).","Stop position = top of the pricing section (330 px) − fixed header height (34 px).","Once scroll passes 60 px, a round back-to-top button (radius 15) fades in over the next 40 px at the bottom right.","At 3.1 s that button is clicked; scroll goes 296→0 over 3.15–4.2 s (cubic ease-in-out).","While the pricing section is in view, \"Pricing\" in the menu turns orange."]},"use":{"ja":"目次やメニューから同じページの中の欄へ移るとき、今どこへ動いたかを分かりやすくしたいとき。","en":"Use it when a menu or table of contents jumps within the same page, so the reader sees where they went."},"tags":["smooth-scroll","scroll-behavior","anchor-link","in-page-link","back-to-top","navigation"]},{"id":"094","pack":"lp","no":"22","slug":"marquee","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"マーキー","en":"Marquee","zh-Hant":"Marquee 跑馬燈"},"meaning":{"ja":"文字や画像が帯で流れ続ける","en":"Text or logos scroll across in an endless band","zh-Hant":"文字或圖片在橫帶中不斷流動"},"ask":{"ja":"サービス名をマーキーで右から左へ流して。途切れずにループさせて、速さは1秒に80pxくらい。","en":"Run the service names in a marquee from right to left, looping without a gap, at about 80 px per second.","zh-Hant":"服務名稱用 Marquee 跑馬燈由右往左流動，無縫循環，速度大約每秒 80 px。"},"summary":{"ja":"濃紺の帯の中で、大きな英字のサービス名と朱色の点が、途切れずに左へ流れ続ける。","en":"Inside a navy band, large service names separated by orange dots keep moving to the left without a gap."},"spec":{"ja":["帯: 高さ58・濃紺・表示域の幅いっぱい。文字: 30px・太字・字間1px・白","4語（WEB DESIGN / BRANDING / MOTION / UI/UX）を1組とし、語の間は64px、その真ん中に朱色の点（半径6）","1周期（4.8秒）で1組の幅（この環境で約881px）だけ等速で左へ動かす。1組の幅を測って位置を 周期で折り返すので、つなぎ目が出ない","表示域の幅が埋まるまで同じ組をくり返して並べる"],"en":["Band: 58 tall, navy, full viewport width. Text: 30 px, heavy weight, 1 px letter spacing, white.","One set is four words (WEB DESIGN / BRANDING / MOTION / UI/UX), 64 px apart, with an orange dot (radius 6) in each gap.","Each cycle (4.8 s) moves left by the width of one set (about 881 px here) at constant speed. The set is measured and the offset wraps by that width, so there is no visible seam.","The set is repeated until the viewport width is filled."]},"use":{"ja":"サービス名・取引先のロゴ・キャッチコピーを、にぎやかに見せたいとき。","en":"Use it to show service names, client logos or a tagline with energy."},"tags":["marquee","ticker","infinite-loop","scrolling-text","logo-strip","band","loop"]},{"id":"095","pack":"lp","no":"23","slug":"animated-gradient","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"グラデーションアニメーション","en":"Animated gradient","zh-Hant":"漸層動畫"},"meaning":{"ja":"背景の色の混ざり方が動き続ける","en":"Background colours keep drifting and blending","zh-Hant":"背景色彩的混合不斷流動變化"},"ask":{"ja":"ファーストビューの背景をグラデーションアニメーションにして。朱色と青がゆっくり混ざり合うように、10秒で1周。","en":"Give the hero an animated gradient background: orange and blue slowly blending, one loop every 10 s.","zh-Hant":"Hero 區塊的背景做成漸層動畫，橘紅色和藍色慢慢地混合，10 秒循環一次。"},"summary":{"ja":"見出しの後ろで、朱色・薄い朱色・青・薄い青のぼんやりした色の塊がゆっくり回り、混ざり方が変わり続ける。","en":"Behind the headline, soft patches of orange, light orange, blue and light blue drift in circles and keep blending differently."},"spec":{"ja":["地は #FFF1EB。その上に円形のグラデーション4つ（中心の色→外側で透明・各不透明度0.85）","朱色（半径230）・薄い朱色 #FFB08F（210）・青（240）・薄い青 #9DB6FB（200）","各中心は楕円の上を4.8秒で1周する（横の半径 70・60・80・50、縦の半径 30・40・30・35、出だしの角度 0・2.1・4.2・1.0rad）","上に白の見出し（34px）とボタン。グラデーションだけが動く"],"en":["Base colour #FFF1EB, with four radial gradients on top (centre colour → transparent at the edge, each at 0.85 opacity).","Orange (radius 230), light orange #FFB08F (210), blue (240), light blue #9DB6FB (200).","Each centre travels an ellipse once per 4.8 s (x radii 70, 60, 80, 50; y radii 30, 40, 30, 35; start angles 0, 2.1, 4.2, 1.0 rad).","A white headline (34 px) and a button sit on top; only the gradient moves."]},"use":{"ja":"写真を使わずに、ファーストビューや見出しの背景に動きと華やかさを出したいとき。","en":"Use it to add movement and colour behind a hero or heading without using a photo."},"tags":["gradient","animated-gradient","mesh-gradient","background","hero","ambient","loop"]},{"id":"096","pack":"lp","no":"24","slug":"floating-animation","category":"loading-loops","width":539,"height":208,"cycle":4.8,"name":{"ja":"ふわふわアニメーション","en":"Floating animation","zh-Hant":"漂浮動畫"},"meaning":{"ja":"飾りがゆっくり上下に浮き沈みする","en":"Elements bob gently up and down","zh-Hant":"裝飾元素緩慢地上下飄浮"},"ask":{"ja":"ファーストビューのスマホの画像に、ふわふわアニメーションを付けて。上下8px、2.4秒で1往復。","en":"Give the phone image in the hero a floating animation: 8 px up and down, one bob every 2.4 s.","zh-Hant":"Hero 區塊的手機圖片加上漂浮動畫，上下 8 px，2.4 秒一個來回。"},"summary":{"ja":"見出しの横で、スマホの画像とハートの丸・評価の札が、それぞれ少しずつずれてゆっくり上下し、スマホの下の影も伸び縮みする。","en":"Next to the headline, a phone, a heart badge and a rating chip each bob gently out of step, and the shadow under the phone grows and shrinks."},"spec":{"ja":["スマホ（92×132）: y = −8·sin(2πt/2.4)（2.4秒で1往復・サイン波なので両端でゆっくり）","ハートの丸（半径20）: y = −6·sin(2πt/1.6 + 1.2)。評価の札（76×30）: y = −6·sin(2πt/2.4 + 2.4)","スマホの下の影（横54×縦6の楕円）: 大きさ・濃さを (1 + y/40) 倍にする。上がると小さく薄くなる","周期 2.4秒と1.6秒はどちらも4.8秒を割り切るので、つなぎ目が出ない"],"en":["Phone (92 × 132): y = −8·sin(2πt/2.4), one bob per 2.4 s; a sine slows at both ends.","Heart badge (radius 20): y = −6·sin(2πt/1.6 + 1.2). Rating chip (76 × 30): y = −6·sin(2πt/2.4 + 2.4).","Shadow under the phone (54 × 6 ellipse): size and opacity scale by (1 + y/40), so it shrinks and fades as the phone rises.","Both periods (2.4 s and 1.6 s) divide 4.8 s, so the loop has no seam."]},"use":{"ja":"アプリやサービスの画像、アイコンなどの飾りに、静かな動きを足したいとき。","en":"Use it to add quiet motion to product images, app mockups or decorative icons."},"tags":["floating","float","bob","hover-animation","keyframes","translatey","decoration","loop"]},{"id":"097","pack":"photo","no":"01","slug":"backlighting","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"逆光","en":"Backlighting","zh-Hant":"逆光"},"meaning":{"ja":"被写体の真後ろから光を当てる","en":"The light source sits behind the subject","zh-Hant":"光源在被攝者的正後方"},"ask":{"ja":"草原に立つ人物を逆光で。夕日を頭の真後ろに置き、髪の輪郭が光ってふんわりとかすむように。","en":"Backlit portrait of a person in a meadow, the low sun right behind their head, glowing hair outline and soft haze.","zh-Hant":"站在草原上的人物，用逆光拍攝，把夕陽放在頭部正後方，讓髮絲的輪廓發亮，整體帶一點柔柔的霧感。"},"summary":{"ja":"画面の外にあった太陽が人物の頭の真後ろへ回り込む。胸像の縁が細く光り、全体に淡い光の色がかかり、カメラ側の体は暗く沈む。","en":"The sun moves from outside the frame to directly behind the person's head; a thin bright edge appears around the figure, a pale warm haze covers the frame and the side facing the camera darkens."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。光はアンバー #FFC75A の平らな面、影は一段濃い #33405A","太陽: 半径20px。左上の画面外（x40, y−40）から頭の真後ろ（x270, y56）へ。周りに半径2.6倍・1.7倍の平らな光の輪（#FFE3A3、35%・60%）","輪郭: 胸像の形を幅7pxの線でなぞってから中を塗り、外側3.5pxの光の縁だけを残す","人物 #4D5A75 → #33405A。空 #FAF9F7 → #FFF4DC、全体に #FFE3A3 を22%重ねる","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). light is a flat amber #FFC75A shape, shadow a flat #33405A one","Sun: radius 20 px, from outside the frame (top left, x 40, y −40) to directly behind the head (x 270, y 56), with flat rings of 2.6× and 1.7× the radius (#FFE3A3 at 35% and 60%)","Outline: the figure is stroked with a 7 px line and then filled, leaving a 3.5 px bright edge outside it","Figure #4D5A75 → #33405A; sky #FAF9F7 → #FFF4DC; #FFE3A3 laid over the whole frame at 22%","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"やわらかく明るい人物写真や、光に包まれた雰囲気を出したいとき。","en":"For airy, glowing portraits or any image that should feel bathed in light."},"tags":["backlighting","backlit","contre-jour","sun behind","haze","glow","halo"]},{"id":"098","pack":"photo","no":"02","slug":"rim-light","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"リムライト","en":"Rim light","zh-Hant":"輪廓光"},"meaning":{"ja":"後ろからの光で輪郭だけを光らせる","en":"A light from behind that outlines the subject's edge","zh-Hant":"從後方打光，只讓輪廓發亮"},"ask":{"ja":"黒背景の人物に、斜め後ろ左右からリムライト。顔は暗いままで、頭と肩の輪郭だけ細く光らせて。","en":"Portrait on a black background with rim lights from both rear sides; the face stays dark and only the outline of the head and shoulders glows.","zh-Hant":"黑色背景的人像，用輪廓光，從左右兩側斜後方各打一盞。臉保持暗的，只讓頭部和肩膀的輪廓亮起一圈細細的光邊。"},"summary":{"ja":"周りが暗く落ち、斜め後ろ左右の2灯で、暗い人物の頭と肩の両側にだけ細い光の縁が出る。右下の図で2灯の位置を示す。","en":"The surroundings go dark and two lights behind the person, left and right, draw thin bright edges only along both sides of the head and shoulders; the plan at the bottom right shows where the two lights are."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。","背景: 明るい場面 → 暗い場面（空 #2B2D33、地面 #24252A）。人物 #4D5A75 → #1F2128","光の縁: 胸像と同じ形をアンバー #FFC75A で左右に3.5px・上に2.5pxずらして2枚、暗い胸像の後ろに置く（縁の幅3.5px）","右下の配置図（66×66px）: 光は真上から見て ±135°（斜め後ろ左右）。右上の表示「±135°」","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). ","Background: light scene → dark scene (sky #2B2D33, ground #24252A); figure #4D5A75 → #1F2128","Bright edges: two copies of the figure in amber #FFC75A, shifted 3.5 px left and right and 2.5 px up, placed behind the dark figure (3.5 px wide edges)","Plan at the bottom right (66×66 px): lights at ±135° seen from above (behind, left and right); top-right readout \"±135°\"","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"暗い背景から人物や商品を切り離して、形をくっきり見せたいとき。","en":"To separate a person or product from a dark background and show its shape."},"tags":["rim light","rim lighting","edge light","backlight","kicker","outline","studio"]},{"id":"099","pack":"photo","no":"03","slug":"silhouette","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"シルエット","en":"Silhouette","zh-Hant":"剪影"},"meaning":{"ja":"明るい空を背に、被写体を黒い形だけで見せる","en":"The subject shows as a black shape against a bright sky","zh-Hant":"以明亮的天空為背景，被攝者只呈現黑色的形狀"},"ask":{"ja":"夕焼けの浜辺でジャンプする人物をシルエットで。露出は空に合わせて、人物とヤシの木は真っ黒に。","en":"Silhouette of a person jumping on a beach at sunset; expose for the sky so the person and the palm tree turn pure black.","zh-Hant":"夕陽下在沙灘上跳躍的人物，拍成剪影。曝光以天空為準，讓人物和椰子樹變成全黑。"},"summary":{"ja":"露出を明るい夕空に合わせていくと、人物・建物・街灯・木が細部のない黒い形になり、空だけが明るく残る。","en":"As the exposure is set for the bright evening sky, the person, buildings, lamp and tree turn into flat black shapes with no detail and only the sky stays bright."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。","空: #FAF9F7 → 上 #FFEDC4・地平線近くの帯（y92〜150）#FFCF73","空以外の形はすべて #2A2D36、遠くの丘は #4A4546。人物は #22252D","太陽: 半径20px、x404 で y60 → y128 へ沈み、丘に半分隠れる","右上の表示: ±0.0 EV → −2.0 EV","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). ","Sky: #FAF9F7 → #FFEDC4 at the top and a #FFCF73 band near the horizon (y 92–150)","Everything but the sky becomes #2A2D36, the far hills #4A4546; the figure #22252D","Sun: radius 20 px at x 404, sinking from y 60 to y 128, half hidden by the hills","Top-right readout: ±0.0 EV → −2.0 EV","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"夕日や窓の光を背景に、形とポーズだけで印象を残したいとき。","en":"When the shape and pose should carry the picture, against a sunset or a bright window."},"tags":["silhouette","backlit","sunset","contre-jour","black shape","underexposed"]},{"id":"100","pack":"photo","no":"04","slug":"split-lighting","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"スプリットライティング","en":"Split lighting","zh-Hant":"分割光"},"meaning":{"ja":"真横からの光で顔を半分ずつ明暗に分ける","en":"Light from the side splits the face into lit and dark halves","zh-Hant":"從正側面打光，把臉分成一半亮一半暗"},"ask":{"ja":"男性の横からスプリットライティングで。光は真横90°、鼻筋を境に顔の左半分は影に沈めて。","en":"Portrait with split lighting: the light at 90° to the side, the face divided down the nose, the far half in shadow.","zh-Hant":"男性的人像，用分割光。光從正側面 90° 打過來，以鼻樑為界，臉的左半邊沉入陰影。"},"summary":{"ja":"光が正面寄り（20°）から真横（90°）へ回り、頭の影が三日月から半分へ広がって、顔が鼻筋の位置で縦に明暗2つに分かれる。","en":"The light swings from near the front (20°) to directly at the side (90°); the shadow on the head grows from a crescent to exactly half, splitting the face down the middle."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。背景は一段暗い場面（空 #E7E5E1）へ","光: 画面の左から。角度 20° → 90°（右下の配置図と右上の表示「90° · ↑0°」）","頭: 明暗の境 x = 270 + cos(角度)·√(29² − dy²) より右が影 #33405A、左が光 #FFC75A。90°で中心線の真っすぐな境","胴（半幅56px）: 境 x = 270 + cos(角度)·56 より右が影、左端の帯が光","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). the background drops to a darker scene (sky #E7E5E1)","Light: from the left of the frame, angle 20° → 90° (plan at the bottom right, top-right readout \"90° · ↑0°\")","Head: right of x = 270 + cos(angle)·√(29² − dy²) is shadow #33405A, left is light #FFC75A; at 90° the edge is the straight centre line","Body (half-width 56 px): right of x = 270 + cos(angle)·56 is shadow, a strip on the left edge is lit","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"強さや緊張感のある人物写真にしたいとき。","en":"For dramatic, tense or moody portraits."},"tags":["split lighting","side light","portrait lighting","half face","dramatic","chiaroscuro"]},{"id":"101","pack":"photo","no":"05","slug":"rembrandt-lighting","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"レンブラントライティング","en":"Rembrandt lighting","zh-Hant":"林布蘭光"},"meaning":{"ja":"影側の頬に三角形の光が残る斜め上からの光","en":"High side light that leaves a lit triangle on the shadow cheek","zh-Hant":"從斜上方打光，在陰影側的臉頰留下一塊三角形亮光"},"ask":{"ja":"老人の肖像をレンブラントライティングで。光は斜め45°・上から、影側の頬に小さな三角形の光を残して。","en":"Portrait of an old man in Rembrandt lighting: light from 45° to the side and above, leaving a small triangle of light on the shadow-side cheek.","zh-Hant":"老人的肖像，用林布蘭光。光從側前方 45°、偏高處往下打，在陰影側的臉頰上留下一小塊三角形的亮光。"},"summary":{"ja":"斜め45°・上45°の光が入り、顔の右側が影に沈む中で、影側の頬にだけ小さな逆三角形の光が残る。","en":"A light 45° to the side and 45° up comes on; the right side of the face falls into shadow except for a small inverted triangle of light on the shadow-side cheek."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。背景は一段暗い場面（空 #E7E5E1）へ","頭: x = 270 + 0.04·29 より右が影 #33405A、左が光 #FFC75A","光の三角形: (x270+0.24R, y78−0.12R)・(x270+0.7R, y78−0.12R)・(x270+0.24R, y78+0.5R)、R=29（幅約13px・高さ約18px）。光の面との間に約6pxの影の帯","胴: 左端（中心から−0.45×56px より左）が光、右（+0.3×56px より右）が影。右下の配置図で光は45°、右上の表示「45° · ↑45°」","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). the background drops to a darker scene (sky #E7E5E1)","Head: right of x = 270 + 0.04·29 is shadow #33405A, left is light #FFC75A","Light triangle: (x 270+0.24R, y 78−0.12R), (x 270+0.7R, y 78−0.12R), (x 270+0.24R, y 78+0.5R) with R = 29 (about 13 px wide, 18 px tall), separated from the lit side by a shadow strip about 6 px wide","Body: lit left of centre −0.45×56 px, shadow right of +0.3×56 px; plan shows the light at 45°, top-right readout \"45° · ↑45°\"","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"絵画のような重みと立体感のある人物写真にしたいとき。","en":"For portraits with a painterly, sculpted, classic look."},"tags":["rembrandt lighting","portrait lighting","triangle","45 degree light","chiaroscuro","painterly"]},{"id":"102","pack":"photo","no":"06","slug":"butterfly-lighting","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"バタフライライティング","en":"Butterfly lighting","zh-Hant":"蝴蝶光"},"meaning":{"ja":"正面の高い位置から当て、鼻の下に蝶形の影","en":"High frontal light that casts a butterfly shadow under the nose","zh-Hant":"從正前方偏高處打光，鼻子下方出現蝴蝶形的陰影"},"ask":{"ja":"女性のビューティーポートレートをバタフライライティングで。光は顔の正面・真上寄り45°、鼻の下に小さな蝶の形の影を。","en":"Beauty portrait with butterfly lighting: light straight in front and 45° above, a small butterfly-shaped shadow under the nose.","zh-Hant":"女性的美妝人像，用蝴蝶光。光在臉的正前方、偏上 45° 的位置，鼻子下方留下一小塊蝴蝶形狀的陰影。"},"summary":{"ja":"顔の正面・高い位置からの光が入り、顔は左右対称に明るくなり、あごの下にだけ左右対称の小さな影が落ちる。","en":"A light in front of the face and high above comes on; the face lights evenly on both sides and only a small symmetrical shadow falls under the chin."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。背景は一段暗い場面（空 #E7E5E1）へ","頭: 全体が光 #FFC75A（影なし）","あごの下の影: 楕円（中心 y78+1.06R・横0.72R・縦0.38R、R=29 → 約21×11px）、色 #33405A","胴: 中心から ±0.8×56px が光、外側の細い帯は元の色。右下の配置図で光はカメラ側（0°）、右上の表示「0° · ↑45°」","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). the background drops to a darker scene (sky #E7E5E1)","Head: entirely lit #FFC75A (no shadow side)","Shadow under the chin: an ellipse centred at y 78+1.06R, 0.72R wide and 0.38R tall (R = 29, about 21×11 px), colour #33405A","Body: lit within ±0.8×56 px of the centre, thin outer strips keep the base colour; plan shows the light on the camera side (0°), top-right readout \"0° · ↑45°\"","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"顔立ちをきれいに見せたい美容・ファッションの人物写真で。","en":"For beauty and fashion portraits that flatter the face."},"tags":["butterfly lighting","paramount lighting","beauty lighting","portrait lighting","overhead light","glamour"]},{"id":"103","pack":"photo","no":"07","slug":"golden-hour","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"ゴールデンアワー","en":"Golden hour","zh-Hant":"黃金時刻"},"meaning":{"ja":"日没前・日の出後の低く赤みのある光","en":"The low, warm light just after sunrise or before sunset","zh-Hant":"日落前、日出後那段低角度、偏暖的光線"},"ask":{"ja":"草原の人物をゴールデンアワーの光で。太陽は地平線近く、影が長く伸びて全体が橙色に。","en":"A person in a field at golden hour: the sun near the horizon, long shadows, everything warm orange.","zh-Hant":"草原上的人物，用黃金時刻的光線。太陽靠近地平線，影子拉得很長，整個畫面偏橘色。"},"summary":{"ja":"太陽が地平線近くまで下り、空と地面が橙に染まり、人物の左側が光り、街灯と木の影が右へ長く伸びる。","en":"The sun drops to just above the horizon; sky and ground turn orange, the left side of the person lights up and the shadows of the lamp and tree stretch far to the right."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。","太陽: 半径18px、(x110, y−30) → (x96, y136)。丘に半分隠れる","色: 空 #FAF9F7 → 上 #FFE8BC・地平線近く #FFCF80、地面 #F1F0EE → #F6DDB0。人物の光 #FFB547・影 #3E3650","頭: 光は左から約66°、境より右が影。胴は左側が光・右側が影","影: 街灯と木の根元から右へ、長さ 0 → 150px（色 #DDAA6E）。右上の時刻 12:00 → 17:40","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). ","Sun: radius 18 px, from (x 110, y −30) to (x 96, y 136), half hidden by the hills","Colour: sky #FAF9F7 → #FFE8BC at the top and #FFCF80 near the horizon, ground #F1F0EE → #F6DDB0; light on the figure #FFB547, shadow #3E3650","Head: light from the left at about 66°, shadow right of the edge; body lit on the left, shadow on the right","Shadows: from the foot of the lamp and tree to the right, length 0 → 150 px (#DDAA6E); top-right time 12:00 → 17:40","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"あたたかく、なつかしく、やさしい雰囲気の写真にしたいとき。","en":"For warm, nostalgic, gentle-feeling images."},"tags":["golden hour","magic hour","sunset light","warm light","long shadows","low sun"]},{"id":"104","pack":"photo","no":"08","slug":"blue-hour","category":"lighting","width":539,"height":208,"cycle":5,"name":{"ja":"ブルーアワー","en":"Blue hour","zh-Hant":"藍調時刻"},"meaning":{"ja":"日没後・日の出前の、空が深い青になる時間","en":"The time after sunset or before sunrise when the sky turns deep blue","zh-Hant":"日落後、日出前天空轉為深藍色的時段"},"ask":{"ja":"港町の夜景をブルーアワーで。空は深い青、ビルの窓と街灯の暖かい光が水面に映るように。","en":"Harbour city at blue hour: deep blue sky, warm windows and streetlights reflected in the water.","zh-Hant":"港口城市的夜景，拍藍調時刻。天空是深藍色，大樓的窗戶和路燈的暖光倒映在水面上。"},"summary":{"ja":"太陽が沈みきると、空が深い青の2段になり、建物の窓と街灯がアンバーに灯り、人物は青い影の形になる。","en":"Once the sun has set, the sky turns two bands of deep blue, the windows and street lamp come on in amber and the person becomes a dark blue shape."},"spec":{"ja":["場面①: 地平線（y150）の前に胸から上の人物（頭の中心 x270, y78・半径29px、顔・髪なし）。","太陽: 半径18px、x120 で y40 → y190 へ沈む（効果の量が70%に達するまで）。40〜80%で消える","色: 空 上 #2C3B5E・地平線近く #4A6191、地面 #283452、建物 #34446B、人物 #1C2439","灯り: 窓の3つに1つと街灯の電球が #FFC75A。電球の周りに半径13px・8pxの平らな光の輪（#FFE3A3、35%・60%）","右上の時刻 12:00 → 18:35","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 1: a head-and-shoulders figure in front of a horizon at y 150 (head centre x 270, y 78, radius 29 px, no face or hair). ","Sun: radius 18 px at x 120, sinking from y 40 to y 190 while the effect reaches 70%, fading out between 40% and 80%","Colour: sky #2C3B5E at the top and #4A6191 near the horizon, ground #283452, buildings #34446B, figure #1C2439","Lights: one window in three and the lamp bulb turn #FFC75A; flat rings of 13 px and 8 px (#FFE3A3 at 35% and 60%) around the bulb","Top-right time 12:00 → 18:35","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"夜景を、真っ暗になる前の青い空と街の灯りの両方で見せたいとき。","en":"For city and night scenes that need both a blue sky and glowing lights."},"tags":["blue hour","twilight","dusk","night city","cityscape","deep blue sky"]},{"id":"105","pack":"photo","no":"09","slug":"bokeh","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"ボケ","en":"Bokeh","zh-Hant":"散景"},"meaning":{"ja":"ピントの外の点光源が丸くやわらかくぼける","en":"Out-of-focus points of light melt into soft discs","zh-Hant":"對焦範圍外的點光源，化成圓形柔軟的光斑"},"ask":{"ja":"夜の街に立つ人物を、背景の街の灯りが大きな丸いボケになるように。f/1.4で、人物にはピントを合わせて。","en":"Person in a city at night with big round bokeh from the street lights behind; f/1.4, focus on the person.","zh-Hant":"夜晚的城市裡站著一個人，背景的路燈要變成大顆圓形的散景。光圈 f/1.4，對焦在人物身上。"},"summary":{"ja":"絞りを開けていくと、ピントの合った人物はそのまま、背景の建物はぼけ、街灯と遠くの灯りが大きく薄い光の丸に広がる。","en":"As the aperture opens, the in-focus person stays sharp, the buildings behind soften and the street lamps and distant lights spread into large, pale discs."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。背景は一段暗い場面（空 #E7E5E1）へ","背景（人物以外）のぼけ: 0 → 6px","灯り: 街灯3つ（大きさ1.25）と、横45pxおきの12個（高さ y44〜114・大きさ0.6〜1.2、固定シード）。丸の半径 = (2.4 + 15 × 効果の量) × 大きさ","丸: 不透明度 100% → 55%、街灯はアンバー #FFC75A・遠くの灯りは #FFE3A3、縁にアンバーの1.2pxの線","人物はくっきりのまま。右上の絞り f/16 → f/1.4（8段）","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). the background drops to a darker scene (sky #E7E5E1)","Background blur (everything but the person): 0 → 6 px","Lights: the three lamps (size 1.25) and 12 more spaced 45 px apart (y 44–114, size 0.6–1.2, fixed seed); disc radius = (2.4 + 15 × effect) × size","Discs: opacity 100% → 55%, lamps amber #FFC75A, distant lights #FFE3A3, with a 1.2 px amber rim","The person stays sharp; top-right aperture f/16 → f/1.4 (8 stops)","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"人物や商品を背景から浮かせ、夜や祝祭のやわらかな雰囲気を出したいとき。","en":"To lift a person or product off the background and add a soft, festive night mood."},"tags":["bokeh","shallow depth of field","background blur","wide aperture","f/1.4","out of focus","lights"]},{"id":"106","pack":"photo","no":"10","slug":"tilt-shift","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"ティルトシフト","en":"Tilt-shift","zh-Hant":"移軸"},"meaning":{"ja":"上下をぼかして本物の町を模型のように見せる","en":"Blur top and bottom so a real scene looks like a miniature","zh-Hant":"把上下兩側模糊，讓真實的街景看起來像模型"},"ask":{"ja":"高い所から見下ろした町をティルトシフトで。中央の帯だけピントを合わせて上下を強くぼかし、色を濃くしてミニチュア風に。","en":"High-angle view of a town with a tilt-shift look: a narrow sharp band across the middle, strong blur above and below, boosted colour, like a miniature model.","zh-Hant":"從高處俯瞰的城鎮，用移軸效果。只讓中間一條帶狀範圍對焦，上下強烈模糊，色彩調濃一點，做出迷你模型的感覺。"},"summary":{"ja":"街の上下の帯がぼけていき、道と車と小さな人たちの並ぶ中央の帯だけにピントが残って、模型の街のように見える。","en":"The top and bottom bands of the street blur while only the middle band with the road, the car and the small people stays in focus, so the street looks like a model."},"spec":{"ja":["街角（奥に建物の列・木・街灯、道は y132〜162）から手前の人物を外し、歩道に身長23〜26pxの小さな人4人（足元 y172）を置く。車は5秒で x−60 → 600 を走る","ピントの帯: y66〜176 はくっきり","ぼけ: y0〜42 と y190〜208 は 0 → 7px、y42〜66 と y176〜190 は 0 → 3px","帯の境に破線（6px線・5px間・#8E8E93・75%）","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["The street corner (buildings, trees and lamps behind a road at y 132–162) without the large person; four small people 23–26 px tall stand on the pavement (feet at y 172); the car drives from x −60 to 600 every 5 s","Focus band: y 66–176 stays sharp","Blur: y 0–42 and y 190–208 go 0 → 7 px; y 42–66 and y 176–190 go 0 → 3 px","Dashed lines on the band edges (6 px dash, 5 px gap, #8E8E93 at 75%)","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"街や行事を、かわいらしい模型の世界のように見せたいとき。","en":"To make a city or event look like a toy model world."},"tags":["tilt-shift","miniature","miniature effect","fake miniature","selective focus","toy town","focus band"]},{"id":"107","pack":"photo","no":"11","slug":"long-exposure","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"長時間露光","en":"Long exposure","zh-Hant":"長曝"},"meaning":{"ja":"シャッターを長く開け、動く光を線にする","en":"Keep the shutter open long so moving lights become lines","zh-Hant":"快門開很久，讓移動的光變成線條"},"ask":{"ja":"夜の道路を長時間露光で。シャッター8秒で、車の形は消えて、ヘッドライトとテールランプだけが白と赤の光の線になるように。","en":"Night road as a long exposure, 8-second shutter: the cars disappear and only their headlights and tail lights remain as white and red trails.","zh-Hant":"夜晚的馬路，用長曝拍攝。快門 8 秒，車子的形體消失，只剩頭燈和尾燈拉成白色與紅色的光軌。"},"summary":{"ja":"街が夜になり、走る車の本体は薄く消えていき、後ろに赤い尾灯の線が伸び、反対車線には白とアンバーの光の線が通る。","en":"The street turns to night; the moving car fades to almost nothing, a red tail-light line stretches out behind it and white and amber lines run along the opposite lane."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。色は夜（空 #2C3B5E、窓の3つに1つが #FFC75A）へ","車: 5秒で x−60 → 600。本体の不透明度 100% → 10%","尾灯の線: x−60 から車の位置まで。y145 に #FF5B4D 2.6px、y149 に #FF8A6E 1.4px","反対車線の線: 画面幅いっぱい。y135 #FFE9B8 2.6px、y138.5 #FFC75A 1.6px、y141.5 #FFE9B8 1.2px（効果の量で濃くなる）","右上のシャッター速度 1/250 → 8″","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). colours go to night (sky #2C3B5E, one window in three #FFC75A)","Car: x −60 → 600 every 5 s; body opacity 100% → 10%","Tail-light line: from x −60 to the car: #FF5B4D 2.6 px at y 145 and #FF8A6E 1.4 px at y 149","Opposite lane: full-width lines #FFE9B8 2.6 px at y 135, #FFC75A 1.6 px at y 138.5 and #FFE9B8 1.2 px at y 141.5 (they fade in with the effect)","Top-right shutter speed 1/250 → 8″","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"夜の街の流れや、水・雲のなめらかな動きを1枚で見せたいとき。","en":"To show traffic flow, or silky water and clouds, in a single still."},"tags":["long exposure","light trails","slow shutter","night photography","car trails","motion"]},{"id":"108","pack":"photo","no":"12","slug":"panning-shot","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"流し撮り","en":"Panning shot","zh-Hant":"追焦"},"meaning":{"ja":"動く被写体を追って撮り、背景だけ流す","en":"Follow a moving subject so only the background streaks","zh-Hant":"跟著移動的被攝者拍，只讓背景拉出流動線條"},"ask":{"ja":"走る赤い車を流し撮りで。シャッター1/15秒、車はくっきり、背景の木や建物は横に流れるように。","en":"Panning shot of a red car driving past, 1/15 s shutter: the car sharp, the trees and buildings behind streaked sideways.","zh-Hant":"行駛中的紅色汽車，用追焦拍攝：相機跟著車子水平移動，快門 1/15 秒，車子清楚銳利，背景的樹和建築往橫向拉出流動的線條。"},"summary":{"ja":"走る車をカメラが追い、車は画面の中央でくっきりしたまま、背景の建物や木や街灯だけが横に流れる。","en":"The camera follows the moving car: the car stays sharp in the middle of the frame while only the buildings, trees and lamps behind it streak sideways."},"spec":{"ja":["街角: 奥に建物の列・木・街灯、道は y132〜162（手前の人物なし）","車: 効果なしでは5秒で x−80 → 620 を走る。効果ありでは x270 ±10px にとどまる","流れ: 背景を横に46pxの幅へ12枚ずらして重ね、平均をとる（幅 0 → 46px）","車輪: 線が5秒で12回転","右上のシャッター速度 1/1000 → 1/15","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Street corner: buildings, trees and lamps behind a road at y 132–162 (no large person in front)","Car: without the effect it drives from x −80 to 620 in 5 s; with it, it stays at x 270 ±10 px","Streak: the background is drawn 12 times spread over 46 px sideways and averaged (spread 0 → 46 px)","Wheels: a spoke line turns 12 times per 5 s","Top-right shutter speed 1/1000 → 1/15","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"車・自転車・ランナーなどのスピード感を、1枚の写真で見せたいとき。","en":"To show the speed of a car, bike or runner in a still photo."},"tags":["panning","panning shot","motion blur","speed","sports photography","slow shutter"]},{"id":"109","pack":"photo","no":"13","slug":"lens-flare","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"レンズフレア","en":"Lens flare","zh-Hant":"鏡頭耀光"},"meaning":{"ja":"強い光でレンズの中に光の輪や玉が出る","en":"Rings and spots of light from a bright source in the lens","zh-Hant":"強光進入鏡頭，產生光環與光斑"},"ask":{"ja":"山の上の太陽を入れて、レンズフレアを。太陽から画面の中心をはさんで反対側へ、色のついた光の玉が並ぶように。","en":"Mountain landscape with the sun in frame and lens flare: coloured ghosts lined up from the sun through the centre to the opposite side.","zh-Hant":"把山頂的太陽拍進畫面，加上鏡頭耀光。讓彩色的光斑從太陽穿過畫面中心，一路排列到另一側。"},"summary":{"ja":"太陽が建物の陰から空へ出ると、太陽に光の筋が出て、太陽から画面の中心をはさんだ反対側まで、光の玉と六角形と輪が一列に並ぶ。","en":"As the sun comes out from behind a building, rays appear around it and a line of light dots, hexagons and a ring runs from the sun through the centre of the frame to the opposite side."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。","太陽: 半径13px、建物の陰（x428, y74）→ 空（x474, y30）","光の筋: 8本、太陽の中心から17pxの所から26px・44pxの所まで交互（長さ9px・27px、アンバー 1.6px・75%）","光の玉: 太陽から中心を通る線の上、t = 0.45・0.8・1.15・1.45・1.75・2.0（t=1 が画面の中心）に、円 半径7px・六角形13px・円5px・六角形22px・円9px・輪30px（幅3px）","色はアンバー #FFC75A と #FFE3A3、不透明度 40〜70% × 効果の量","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). ","Sun: radius 13 px, from behind a building (x 428, y 74) to open sky (x 474, y 30)","Rays: 8, from 17 px out from the centre of the sun to 26 px or 44 px, alternating (9 px and 27 px long; amber, 1.6 px, 75%)","Flare: on the line from the sun through the centre at t = 0.45, 0.8, 1.15, 1.45, 1.75 and 2.0 (t = 1 is the centre): a 7 px circle, a 13 px hexagon, a 5 px circle, a 22 px hexagon, a 9 px circle and a 30 px ring (3 px line)","Colours amber #FFC75A and #FFE3A3 at 40–70% × the effect","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"太陽や照明のまぶしさ、夏の日差し、映画のような光を足したいとき。","en":"To add glare, summer sunshine or a cinematic light feel."},"tags":["lens flare","flare","ghosting","sun flare","starburst","cinematic"]},{"id":"110","pack":"photo","no":"14","slug":"fisheye-lens","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"魚眼レンズ","en":"Fisheye lens","zh-Hant":"魚眼鏡頭"},"meaning":{"ja":"中心がふくらみ、直線が丸く曲がる超広角","en":"Ultra-wide lens that bulges the centre and bends straight lines","zh-Hant":"中心膨脹、直線彎曲成弧形的超廣角鏡頭"},"ask":{"ja":"街の通りを魚眼レンズで。画角180°で、ビルの縦の線が外側へ丸く曲がるように。","en":"City street through a fisheye lens, 180° view, the building edges bowing outward.","zh-Hant":"街道用魚眼鏡頭拍攝，視角 180°，大樓垂直的線條向外彎成圓弧。"},"summary":{"ja":"街角の中心がふくらみ、建物の縦の線と道の横の線が外側へ丸く曲がり、四隅はそのまま残る。","en":"The middle of the street scene bulges out; the vertical lines of the buildings and the lines of the road bow outward while the corners stay where they are."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。","変形: 中心からの距離 d の点を g = (1 + k) / (1 + k·d²/R²) 倍に動かす。R = 中心から角までの距離（289px）","k: 0 → 1.25。中心は2.25倍に拡大、四隅は動かない","形の輪郭は6pxおきに刻んでから変形するので、直線が曲線になる","右上の焦点距離 24mm → 8mm","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). ","Warp: a point at distance d from the centre moves to g = (1 + k) / (1 + k·d²/R²) times that distance, R = distance from the centre to a corner (289 px)","k: 0 → 1.25; the centre is magnified 2.25×, the corners do not move","Every outline is cut every 6 px before warping, so straight lines become curves","Top-right focal length 24mm → 8mm","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"迫力・遊び心・のぞき穴のような視点を出したいとき（スケボー、ミュージックビデオなど）。","en":"For bold, playful or peephole-like views (skateboarding, music videos)."},"tags":["fisheye","fisheye lens","barrel distortion","ultra wide","8mm","distortion"]},{"id":"111","pack":"photo","no":"15","slug":"chromatic-aberration","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"色収差","en":"Chromatic aberration","zh-Hant":"色差"},"meaning":{"ja":"明暗の境に赤や青紫の色ずれが出る","en":"Red and blue-violet colour fringes along high-contrast edges","zh-Hant":"明暗交界處出現紅色或藍紫色的色邊"},"ask":{"ja":"白い空と黒い枝の写真に、色収差を少し。画面の端に向かって、枝の縁に赤と青紫の色ずれが出るように。","en":"Black branches against a white sky with slight chromatic aberration: red and blue-violet fringes on the edges, stronger toward the corners.","zh-Hant":"白色天空與黑色樹枝的照片，加一點色差（邊緣的紅色與藍紫色色邊）。越靠近畫面邊緣，色邊越明顯。"},"summary":{"ja":"街角の絵を赤・緑・青に分け、少しずつ違う大きさで重ねると、人物や建物や街灯の縁に赤と青緑のずれが出て、画面の端ほど大きくなる。","en":"The street scene is split into red, green and blue and the three are laid back together at slightly different sizes, so red and cyan fringes appear on the edges of the person, buildings and lamps, larger towards the sides."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。","分け方: 絵に赤 #FF0000・緑 #00FF00・青 #0000FF を乗算して3枚にし、黒の上に加算で重ねる","大きさ（画面の中心から）: 赤 1 + 2s、緑 1 + s、青 1。s = 0 → 0.02","ずれ: 画面の左右の端で赤と青が約11px離れる、中心では0","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). ","Split: the image is multiplied by red #FF0000, green #00FF00 and blue #0000FF into three copies and added back together over black","Scale about the centre: red 1 + 2s, green 1 + s, blue 1, with s = 0 → 0.02","Offset: red and blue end up about 11 px apart at the left and right edges, 0 at the centre","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"古いレンズやVHS、グリッチのような、少し崩れた質感を足したいとき。","en":"To add an imperfect old-lens, VHS or glitch feel."},"tags":["chromatic aberration","color fringing","rgb split","lens aberration","fringe","glitch"]},{"id":"112","pack":"photo","no":"16","slug":"vignette","category":"lens-camera","width":539,"height":208,"cycle":5,"name":{"ja":"周辺減光（ビネット）","en":"Vignette","zh-Hant":"暗角"},"meaning":{"ja":"画面の四隅が暗くなり、中央に目が集まる","en":"The corners darken and draw the eye to the centre","zh-Hant":"畫面四角變暗，視線集中到中央"},"ask":{"ja":"海辺の写真に、ビネットを強めに。四隅だけなだらかに暗くして、中央の人物に目が行くように。","en":"Beach photo with a strong vignette: the corners darken gradually so the eye goes to the person in the middle.","zh-Hant":"海邊的照片，暗角加重、做得明顯一點。只讓四個角落平順地變暗，讓視線集中到中央的人物身上。"},"summary":{"ja":"画面の四隅からなだらかに暗くなり、中央の人物と道のあたりだけが明るく残る。","en":"The frame darkens smoothly from the corners while the person and the road in the middle stay bright."},"spec":{"ja":["場面②: 街角。奥に建物の列・木・街灯（x114, 292, 494）、道は y132〜162、人物は左手前（足元 x176, y200・身長124px）。","暗くする形: 画面の中心を中心にした楕円（縦は横の 208/539 × 1.35 倍）","楕円の半径（横）334px の45%までは素通し、そこから外へ向かって 0 → 70% の濃さで rgb(32,35,43) を重ねる","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 2: a street corner; buildings, trees and street lamps (x 114, 292, 494) behind a road at y 132–162; the person stands front left (feet at x 176, y 200, 124 px tall). ","Shape: an ellipse centred on the frame (vertical radius = horizontal × 208/539 × 1.35)","Clear out to 45% of the 334 px horizontal radius, then rgb(32,35,43) rising from 0% to 70% towards the edge","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"主役に視線を集めたいとき、古いレンズの雰囲気を出したいとき。","en":"To focus attention on the subject, or to suggest an old lens."},"tags":["vignette","vignetting","dark corners","edge darkening","lens falloff","focus"]},{"id":"113","pack":"photo","no":"17","slug":"high-key","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"ハイキー","en":"High-key","zh-Hant":"High Key（高調）"},"meaning":{"ja":"明るい色だけで作る、白っぽく影の薄い写真","en":"A bright, white-toned image with very light shadows","zh-Hant":"只用明亮的色調，畫面偏白、陰影很淡"},"ask":{"ja":"白い机の上のカップと瓶を、ハイキーで。背景は真っ白、影はごく薄く、全体を明るい色だけでまとめて。","en":"High-key still life of a cup and a bottle on a white table: pure white background, very faint shadows, only light tones.","zh-Hant":"白色桌上的杯子與瓶子，用 High Key 高調風格拍攝。背景純白，陰影非常淡，整體只用明亮的色調。"},"summary":{"ja":"風景と人物が白に近い明るい色だけになり、影はごく薄くなって、右下のヒストグラムの山が右端へ寄る。","en":"The landscape and the person turn to light, near-white colours with very faint shadows, and the hump of the histogram at the bottom right moves to the right end."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","色: 空 #FAF9F7 → #FFFFFF、丘 #EAEDF1 → #F5F6F8、人物 #4D5A75 → #B9C0CE、影 #33405A → #A6AEBF、太陽 #F5A524 → #FFD889","ヒストグラム（96×46px・20本）: 山の中心 0.56 → 0.85、幅 0.2 → 0.09","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Colour: sky #FAF9F7 → #FFFFFF, hills #EAEDF1 → #F5F6F8, figure #4D5A75 → #B9C0CE, shadow #33405A → #A6AEBF, sun #F5A524 → #FFD889","Histogram (96×46 px, 20 bars): peak centre 0.56 → 0.85, width 0.2 → 0.09","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"清潔感・軽やかさ・やさしさを出したい商品や人物の写真で。","en":"For clean, light, gentle product shots and portraits."},"tags":["high-key","high key","bright","white background","airy","low contrast"]},{"id":"114","pack":"photo","no":"18","slug":"low-key","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"ローキー","en":"Low-key","zh-Hant":"Low Key（低調）"},"meaning":{"ja":"暗い色が中心の、光の当たる所だけが浮かぶ写真","en":"A dark image where only the lit parts stand out","zh-Hant":"以暗色調為主，只有受光處浮現出來"},"ask":{"ja":"黒背景のウイスキーの瓶をローキーで。横からの1灯だけで、光の当たる縁だけ浮かび、画面の大半は黒に沈めて。","en":"Low-key shot of a whisky bottle on black, a single side light, only the lit edges showing and most of the frame in deep black.","zh-Hant":"黑色背景上的威士忌酒瓶，用 Low Key 低調風格拍攝。僅用側邊一盞燈，讓受光的邊緣浮現出來，畫面大半沉入黑色。"},"summary":{"ja":"画面の大半が暗く沈み、太陽も消えて、横から日の当たる胸像の右の縁だけが光って浮かぶ。ヒストグラムの山は左端へ寄る。","en":"Most of the frame sinks into darkness and the sun goes out; only the right edge of the bust, lit from the side, stays bright. The histogram hump moves to the left end."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","色: 空 #FAF9F7 → #2B2D33、丘 → #313339・#36383E、地面 → #24252A、人物 → #25272E。太陽と光の輪は空と同じ色になって消える","胸像の右の縁（光の面）は残り、#FFC75A → #FFB547","ヒストグラム: 山の中心 0.56 → 0.14、幅 0.2 → 0.08","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Colour: sky #FAF9F7 → #2B2D33, hills → #313339 and #36383E, ground → #24252A, figure → #25272E; the sun and its rings take the sky colour and disappear","The lit right edge of the bust stays, #FFC75A → #FFB547","Histogram: peak centre 0.56 → 0.14, width 0.2 → 0.08","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"高級感・緊張感・ミステリアスな雰囲気を出したいとき。","en":"For luxurious, tense or mysterious images."},"tags":["low-key","low key","dark","black background","moody","dramatic","chiaroscuro"]},{"id":"115","pack":"photo","no":"19","slug":"black-and-white","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"モノクロ","en":"Black and white","zh-Hant":"黑白"},"meaning":{"ja":"色を抜いて明るさだけで見せる","en":"Remove colour and show brightness only","zh-Hant":"去掉顏色，只用明暗呈現"},"ask":{"ja":"海辺のスナップをモノクロで。コントラストは少し強めに、空と砂の明るさの差を残して。","en":"Beach snapshot in black and white, contrast slightly raised, keeping the difference in brightness between sky and sand.","zh-Hant":"海邊的隨手拍，轉成黑白。對比稍微拉高一點，保留天空與沙灘之間的明暗差異。"},"summary":{"ja":"同じ風景から色が抜け、太陽も人物の縁の光も灰色になり、明るさの差だけで形が見える。","en":"The colour drains from the same landscape; the sun and the light on the figure turn grey and the shapes read only by their brightness."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","変換: 各色を明るさ（0.2126R + 0.7152G + 0.0722B）の灰色に置き換え、140を中心にコントラスト1.25倍","例: 人物 #4D5A75 → 約 #4D4D4D、太陽 #F5A524 → 約 #B5B5B5","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Conversion: each colour becomes the grey of its luminance (0.2126R + 0.7152G + 0.0722B), contrast ×1.25 around 140","For example the figure #4D5A75 → about #4D4D4D, the sun #F5A524 → about #B5B5B5","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"時代を感じさせたいとき、色より形・光・表情を見せたいとき。","en":"For a timeless feel, or when shape, light and expression matter more than colour."},"tags":["black and white","monochrome","b&w","grayscale","desaturated","classic"]},{"id":"116","pack":"photo","no":"20","slug":"duotone","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"デュオトーン","en":"Duotone","zh-Hant":"雙色調"},"meaning":{"ja":"暗部と明部を2色だけで表す","en":"Show the image in two colours, one for darks and one for lights","zh-Hant":"只用兩種顏色表現暗部與亮部"},"ask":{"ja":"人物写真を濃い藍とピンクのデュオトーンに。暗い所は藍、明るい所はピンクの2色だけで。","en":"Portrait photo as a navy-and-pink duotone: darks in navy, lights in pink, nothing else.","zh-Hant":"把人像照片做成深藍與粉紅的雙色調。暗部用深藍、亮部用粉紅，只用這兩種顏色。"},"summary":{"ja":"同じ風景の色が、暗い所は藍、明るい所はピンクの2色の間だけに置き換わる。","en":"The colours of the same landscape are replaced by a range between just two colours: indigo in the darks and pink in the lights."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","2色: 暗い側 #1F2A5C、明るい側 #FF9FB2","変換: 各色の明るさ L から t = ((L − 70) / 180)^2.4 を求め、2色を t で混ぜる（明るい色どうしの差を広げる）","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Two colours: #1F2A5C for the dark end, #FF9FB2 for the light end","Conversion: from each colour’s luminance L, t = ((L − 70) / 180)^2.4, and the two colours are mixed by t (this spreads the light tones apart)","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"ポスター・音楽・SNSの画像を、ブランドの色で統一したいとき。","en":"To unify posters, music artwork or social images in brand colours."},"tags":["duotone","two-tone","gradient map","color overlay","poster","graphic"]},{"id":"117","pack":"photo","no":"21","slug":"teal-and-orange","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"ティール＆オレンジ","en":"Teal and orange","zh-Hant":"Teal & Orange"},"meaning":{"ja":"影を青緑、肌や明部を橙に寄せる色調","en":"Pushes shadows to teal and skin and highlights to orange","zh-Hant":"陰影偏青綠色，膚色與亮部偏橘色的色調"},"ask":{"ja":"街を歩く人物を映画のようなティール＆オレンジで。影と空は青緑、肌と夕日は橙に寄せて。","en":"Person walking in the city with a cinematic teal and orange grade: shadows and sky toward teal, skin and sunlight toward orange.","zh-Hant":"在街上走路的人物，調成電影感的 Teal & Orange。陰影和天空偏青綠色，皮膚和夕陽偏橘色。"},"summary":{"ja":"同じ風景の空・丘・地面・人物の影が青緑へ、日の当たる人物の縁と太陽が橙へ寄り、補色の対比になる。","en":"In the same landscape the sky, hills, ground and the shadowed figure shift to teal while the sunlit edge of the figure and the sun shift to orange, a complementary contrast."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","青緑: 空 #CFE6E3、丘 #8CC1BE・#62A2A1、地面 #3F8083、木 #2F6A6E、人物 #1D4E53","橙: 人物の縁の光 #FF9248、太陽 #FF8236、光の輪 #FFC48C","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Teal: sky #CFE6E3, hills #8CC1BE and #62A2A1, ground #3F8083, trees #2F6A6E, figure #1D4E53","Orange: the light on the figure #FF9248, sun #FF8236, sun rings #FFC48C","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"映画のポスターや予告編のような、色の対比が強い画にしたいとき。","en":"For a blockbuster, trailer-like look with strong colour contrast."},"tags":["teal and orange","orange and teal","cinematic","color grading","blockbuster","film look"]},{"id":"118","pack":"photo","no":"22","slug":"film-grain","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"フィルムグレイン","en":"Film grain","zh-Hant":"底片顆粒"},"meaning":{"ja":"フィルム写真のような細かい粒子を乗せる","en":"Fine, film-like grain over the image","zh-Hant":"加上像底片相機拍出來的細緻顆粒"},"ask":{"ja":"海辺の写真にフィルムグレインを。細かい粒子を全体に、黒は少し浮かせて暖かい色に。","en":"Add film grain to the beach photo: fine grain all over, blacks slightly lifted and warm.","zh-Hant":"幫海邊的照片加上底片顆粒。整體加上細緻的顆粒，黑色稍微提起並帶一點暖色。"},"summary":{"ja":"同じ風景の全体に細かい粒が乗り、色が少し暖かいクリーム色に寄る。","en":"Fine grain appears over the whole of the same landscape and the colours lean slightly towards a warm cream."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","粒: 2600個（固定シード）、大きさ 0.8〜1.7px の四角。55%が暗い #3A3530、45%が白","粒の濃さ: 16〜38% × 効果の量。粒の位置は動かさない（ちらつかせない）","色: すべての色を #F2DDBE へ16%寄せる","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Grain: 2,600 squares (fixed seed), 0.8–1.7 px; 55% dark #3A3530, 45% white","Grain opacity: 16–38% × the effect; the grain does not move (no flicker)","Colour: every colour moves 16% towards #F2DDBE","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"デジタルのつるっとした感じを消して、フィルムの手触りを出したいとき。","en":"To remove the clean digital look and add an analogue film texture."},"tags":["film grain","grain","noise","analog","35mm film","texture","warm tone"]},{"id":"119","pack":"photo","no":"23","slug":"light-leak","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"ライトリーク","en":"Light leak","zh-Hant":"漏光"},"meaning":{"ja":"フィルムに光がもれたような赤橙のにじみ","en":"Red-orange glow as if light leaked onto the film","zh-Hant":"像底片被光線漏進去，出現紅橘色的暈染"},"ask":{"ja":"夏の思い出の写真に、ライトリークを右端から。赤と橙の光がにじみ込むように。","en":"Summer memory photo with a light leak coming in from the right edge, red and orange light bleeding in.","zh-Hant":"夏天回憶的照片，從右側邊緣加入漏光。讓紅色和橘色的光暈滲進畫面。"},"summary":{"ja":"同じ風景の右端から、外側ほど淡い黄、端ほど赤い光のにじみが帯になって入り、ゆっくり揺れる。","en":"From the right edge of the same landscape a band of leaked light comes in, pale yellow on the inside and red at the edge, swaying slowly."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","形: 縦長の楕円4枚。中心は右端の外30px（1周で左右に ±6px 揺れる）、縦の半径は画面の高さの1.1倍","横の半径と色: 250px #FFD089 35%、170px #FF9A3D 40%、95px #FF5A3A 45%、45px #FF3B30 50%（横の半径は 0 → この値に広がる）","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Shape: four tall ellipses centred 30 px outside the right edge (swaying ±6 px over the loop), vertical radius 1.1× the frame height","Horizontal radius and colour: 250 px #FFD089 at 35%, 170 px #FF9A3D at 40%, 95 px #FF5A3A at 45%, 45 px #FF3B30 at 50% (each grows from 0 to this radius)","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"思い出・夏・青春のような、なつかしく偶然っぽい雰囲気を出したいとき。","en":"For nostalgic, summery, accidental-looking memories."},"tags":["light leak","film leak","vintage","analog","lomo","warm glow"]},{"id":"120","pack":"photo","no":"24","slug":"double-exposure","category":"tone-finish","width":539,"height":208,"cycle":5,"name":{"ja":"二重露光（多重露光）","en":"Double exposure","zh-Hant":"多重曝光"},"meaning":{"ja":"2枚の写真を1枚に重ねて写し込む","en":"Two photos layered into one frame","zh-Hant":"把兩張照片疊在同一個畫面裡"},"ask":{"ja":"横顔のシルエットに森と山の風景を二重露光で重ねて。背景は白、顔の中にだけ風景が見えるように。","en":"Double exposure of a profile silhouette and a forest-and-mountain landscape on a white background, the landscape visible only inside the head.","zh-Hant":"把側臉剪影和森林山景用多重曝光疊在一起。背景是白色，風景只出現在臉的輪廓裡面。"},"summary":{"ja":"背景が白く飛び、胸像の形の中にだけ、縮めた丘・家・木・太陽の風景が写り込む。","en":"The background turns white and the landscape of hills, house, trees and sun appears, scaled down, only inside the shape of the bust."},"spec":{"ja":["場面③: 左に胸像（頭の中心 x140, y82・半径28px）、右に丘・家・木・太陽（x432, y54・半径15px）。","背景: 胸像の外は白 #FFFFFF","胸像の中: 同じ風景を0.7倍にして、太陽が頭の右上、丘の稜線が首のあたりに来るように置く","中の色: 空 #D3DBE6、丘 #9AA8BD・#76869F、地面 #55647E、木 #3F4C66","切り替え: 元の写真の上に、二重露光の絵を効果の量で重ねる","時間: 0.4〜1.4秒で効果が入り、4.0秒まで保ち、4.8秒までに元へ戻る（1周5秒、3次のイーズインアウト（cubic-bezier(0.65,0,0.35,1) 相当））"],"en":["Scene 3: a bust on the left (head centre x 140, y 82, radius 28 px) and hills, a house, trees and the sun (x 432, y 54, radius 15 px) on the right. ","Background: white #FFFFFF outside the bust","Inside the bust: the same landscape at 0.7×, placed so the sun sits at the top right of the head and the ridge of the hills runs across the neck","Inside colours: sky #D3DBE6, hills #9AA8BD and #76869F, ground #55647E, trees #3F4C66","Transition: the double exposure is laid over the original picture at the effect amount","Timing: the effect comes in from 0.4 s to 1.4 s, holds until 4.0 s and is gone again by 4.8 s (one pass = 5 s, cubic ease-in-out (about cubic-bezier(0.65,0,0.35,1)))"]},"use":{"ja":"人物と場所・記憶・内面を1枚で結びつけたい、ポスターやジャケットで。","en":"For posters and covers that tie a person to a place, a memory or an inner world."},"tags":["double exposure","multiple exposure","blend","silhouette","surreal","composite"]},{"id":"121","pack":"motion2","no":"01","slug":"anticipation","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"アンティシペーション","en":"Anticipation"},"meaning":{"ja":"動く前に逆へ少し溜める","en":"Pulls back briefly before moving forward"},"ask":{"ja":"ボタンが右へ飛び出す前にアンティシペーションを入れて。0.3秒かけて逆へ少し引き、つぶれてから出す。","en":"Add anticipation before the button shoots off to the right: pull back slightly for 0.3 s, squash, then go."},"summary":{"ja":"四角いキャラクターが進む向きと逆へ少し引き、つぶれて溜めてから勢いよく飛び出す。","en":"A square character pulls back against its direction of travel, squashes to wind up, then shoots forward."},"spec":{"ja":["2.35秒で1回（4.7秒に2回。1回目は左→右、2回目は右→左）。コーラルの角丸四角（86px・角丸24）に白い矢印。出発点は端から108px、床は y=178","溜め: 0.2〜0.95秒。easeInOut（2乗）で進む向きと逆へ44px下がり、横1→1.22・縦1→0.76につぶれ、後ろへ0.18rad傾く","飛び出し: 0.95〜1.38秒（0.43秒）。下がった位置から反対の端まで backOut(s=1.1)（わずかに行き過ぎる）。動きの前半60%で横最大1.55・縦最大0.72に伸ばし（sinの山）、前へ0.08rad傾く","着地: 1.38秒から 0.13·e^(−7t)·sin(17t) で縦横を逆向きに揺らして収める","飛び出しの瞬間、出発点に土けむりの丸3つ（動きの前半70%で消える）、後ろに黄色いスピード線3本（線幅8）"],"en":["One move per 2.35 s (twice per 4.7 s: left to right, then right to left). A coral rounded square (86 px, radius 24) with a white arrow. It starts 108 px from the edge; the floor is at y = 178.","Wind-up: 0.2–0.95 s, quadratic ease-in-out. It backs off 44 px against the direction of travel, squashes to 1.22 wide × 0.76 tall and leans back 0.18 rad.","Launch: 0.95–1.38 s (0.43 s). From the backed-off position to the far end with backOut (s = 1.1), a slight overshoot. In the first 60% of the move it stretches up to 1.55 wide × 0.72 tall (half sine) and leans forward 0.08 rad.","Landing: from 1.38 s, width and height wobble in opposite directions by 0.13·e^(−7t)·sin(17t).","At launch, three dust puffs at the start point (gone within the first 70% of the move) and three yellow speed lines (width 8) behind it."]},"use":{"ja":"ジャンプ・ダッシュ・ボタンの発射など、勢いのある動きの直前に。動きに「ため」と重さを出したいとき。","en":"Use it just before a jump, dash or launch to give the move build-up and weight."},"tags":["anticipation","wind-up","squash","character","jump","dash","animation-principle"]},{"id":"122","pack":"motion2","no":"02","slug":"follow-through","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"フォロースルー","en":"Follow-through"},"meaning":{"ja":"止まった後も一部が遅れて揺れる","en":"Parts keep swinging after the body stops"},"ask":{"ja":"キャラが止まったあと、髪と旗にフォロースルーを入れて。0.5秒くらい遅れて揺れて収まるように。","en":"Give the hair and the flag follow-through after the character stops: they keep swinging for about 0.5 s, then settle."},"summary":{"ja":"滑ってきた丸いキャラクターが急に止まり、頭の旗としっぽだけが遅れて揺れて収まる。","en":"A round character slides in and stops suddenly; only the flag on its head and its tail keep swinging, then settle."},"spec":{"ja":["2.35秒で1回（4.7秒に2回、向きを交互に）。体はミントの丸（半径38）。0.15〜0.85秒で303px進む: 最初の30%で加速し、あとは一定の速さのまま0.85秒で急に止まる","旗（白い棒58px＋黄色い旗）: 角度を体の加速度で押されるばねとして計算。a″ = −121a − 5.5a′ − 0.0175×加速度（固有角振動数11rad/s）。旗の布は棒の角度のさらに0.6倍曲げる","しっぽ: 14pxの節7つ（コーラル・線幅14→6）。遅いばね b″ = −56b − 2.8b′ − 0.012×加速度。節 j は 22/600秒（約0.037秒）×j 遅れた値を使い、振れ幅を ×(0.55 + 0.16j)","計算は1/600秒刻みで先に表にしておく（描画時は表を引くだけ）","各回の最後の0.3秒で、旗としっぽの振れを smoothstep で0にする（ループの継ぎ目を出さない）"],"en":["One move per 2.35 s (twice per 4.7 s, alternating direction). The body is a mint circle (radius 38). It travels 303 px at 0.15–0.85 s: it speeds up over the first 30%, then keeps a constant speed and stops abruptly at 0.85 s.","Flag (58 px white pole with a yellow flag): its angle is a spring pushed by the body's acceleration, a″ = −121a − 5.5a′ − 0.0175 × acceleration (natural frequency 11 rad/s). The cloth bends a further 0.6 × the pole angle.","Tail: seven 14 px segments (coral, width 14→6) on a slower spring, b″ = −56b − 2.8b′ − 0.012 × acceleration. Segment j uses the value from j × 22/600 s (about 0.037 s) earlier, scaled by (0.55 + 0.16j).","Both springs are precomputed in 1/600 s steps; drawing only looks values up.","In the last 0.3 s of each move the swing is faded to 0 with smoothstep, so the loop has no seam."]},"use":{"ja":"キャラクターの髪・服・アクセサリー、ロゴの飾りなど、本体に付いている部分に自然な重さを出したいとき。","en":"Use it on hair, clothes, accessories or the trim of a logo, so that the parts attached to the main body feel weighted."},"tags":["follow-through","overlapping-action","secondary-motion","spring","drag","character","animation-principle"]},{"id":"123","pack":"motion2","no":"03","slug":"bounce","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"バウンス","en":"Bounce"},"meaning":{"ja":"落ちて弾みながら止まる","en":"Falls and bounces lower until it stops"},"ask":{"ja":"ボールを上から落としてバウンスさせて。3回弾んで、だんだん低く。","en":"Drop the ball from the top with a bounce: three bounces, each lower than the last."},"summary":{"ja":"ボールが落ちて、だんだん低く弾みながら止まる。","en":"A ball drops and bounces lower each time until it comes to rest."},"spec":{"ja":["2.35秒で1回（4.7秒に2回。1回目は黄、2回目はコーラル）。半径26のボール","0.1秒から、床の190px上から落とす。重力1900px/s²、弾むたびに速さを56%に（反発係数0.56）、跳ね返りの速さが35px/s未満で止まる","横は x=150→390 を 0.1〜1.8秒の easeOut（3乗）で移動","着地の前後0.045秒だけつぶす: 横 1+sq・縦 1−sq、sq は最大 0.4 × min(1, 着地の速さ÷850)。速さ200px/s以上の着地では左右に白い短い線を0.3秒出す","影は高いほど小さく薄く。退場: 1.95〜2.25秒に拡大率へ (1 − backIn(s=2)) を掛けて消す"],"en":["One drop per 2.35 s (twice per 4.7 s: yellow first, then coral). The ball has radius 26.","From 0.1 s it falls from 190 px above the floor. Gravity 1900 px/s²; each bounce keeps 56% of the speed (restitution 0.56); it stops when the rebound speed is below 35 px/s.","Sideways it moves x = 150→390 over 0.1–1.8 s with cubic ease-out.","Squash for 0.045 s either side of each impact: width 1 + sq, height 1 − sq, with sq up to 0.4 × min(1, impact speed ÷ 850). Impacts faster than 200 px/s flick short white lines left and right for 0.3 s.","The shadow gets smaller with height. Exit: 1.95–2.25 s, scale multiplied by (1 − backIn, s = 2)."]},"use":{"ja":"物が落ちて着地するところ。アイコン・文字・商品を、重さと弾力を感じさせて置きたいとき。","en":"Use it whenever something drops and lands: an icon, a word or a product that should feel heavy and springy."},"tags":["bounce","drop","gravity","ball","physics","landing","easing"]},{"id":"124","pack":"motion2","no":"04","slug":"wiggle","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"ウィグル","en":"Wiggle"},"meaning":{"ja":"小刻みにランダムに揺れる","en":"Shakes in small, random, continuous jitters"},"ask":{"ja":"通知のベルに弱めのウィグルを付けて。角度は最大10°くらいで、鳴っている間ずっと。","en":"Add a subtle wiggle to the notification bell, up to about 10°, for as long as it rings."},"summary":{"ja":"ベルが小刻みに不規則に揺れ続ける。1回の衝撃ではなく、ずっと続く細かい揺れ。","en":"A bell keeps jittering irregularly: not one hit, but a small shake that never stops."},"spec":{"ja":["黄色いベル。上端（中央, y=34）を支点に、ずっと揺れ続ける（止まる区間はない）","角度 = 4つのsin波の和。4.7秒あたり23・31・43・59回（約4.9・6.6・9.1・12.6Hz）、振幅 0.085・0.065・0.05・0.035rad（重なると最大約0.235rad＝13.5°）","位置も揺らす: 横は29・47・61回で振幅4・3・2px、縦は37・53回で振幅2.4・1.8px","どの周波数も4.7秒にちょうど整数回なのでループがつながる。互いに割り切れない回数を混ぜて、規則的に見えないようにする","ベルの舌（コーラル・半径13）は逆へ振れる（角度×70px）。両わきに白い振動の弧（半径86と110・線幅6）を明滅させて出し続ける"],"en":["A yellow bell pivoting at its top (centre, y = 34). It never stops moving.","Angle = the sum of four sine waves: 23, 31, 43 and 59 cycles per 4.7 s (about 4.9, 6.6, 9.1 and 12.6 Hz), amplitudes 0.085, 0.065, 0.05 and 0.035 rad (up to about 0.235 rad, 13.5°, when they line up).","Position also jitters: x with 29, 47 and 61 cycles (4, 3, 2 px), y with 37 and 53 cycles (2.4, 1.8 px).","Every frequency is a whole number of cycles per 4.7 s, so the loop joins up; the counts share no common factor, so it does not look regular.","The clapper (coral, radius 13) swings the other way (angle × 70 px). White vibration arcs (radius 86 and 110, width 6) flicker on both sides the whole time."]},"use":{"ja":"通知・着信・注意を引きたい物に。ずっと続く小さな揺れで、落ち着かなさや手持ち感を出したいとき。","en":"Use it on a notification, an incoming call or anything that should catch the eye, or to add a restless, handheld feel."},"tags":["wiggle","jitter","shake","random","noise","bell","notification"]},{"id":"125","pack":"motion2","no":"05","slug":"pulse","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"パルス","en":"Pulse"},"meaning":{"ja":"鼓動のように大きさが脈打つ","en":"Its size throbs like a heartbeat"},"ask":{"ja":"ハートのアイコンをパルスさせて。1.2秒ごとに、10%ほど大きくなって戻る。","en":"Make the heart icon pulse: about 10% larger and back, every 1.2 s."},"summary":{"ja":"ハートが鼓動のように、ドクン・ドクンと大きさを脈打たせ、輪が広がる。","en":"A heart throbs like a heartbeat, a double beat each time, with rings spreading out."},"spec":{"ja":["コーラルのハート。1.175秒に1拍（4.7秒に4拍）。1拍は「ドクン・ドクン」の2段","拡大率 = 1 + 0.26·G(0.2秒, 幅0.065) + 0.15·G(0.44秒, 幅0.07)。G = e^(−((t − 中心)÷幅)²)（急にふくらんで、すぐ戻る山）","ハートの輪郭線を2つ広げる: 0.16秒と0.40秒から、0.8秒で拡大率1.2→2.4（easeOut・3乗）","輪は広がりながら不透明度0.75→0（2つ目は60%の濃さ）、線幅8.5→1.5px"],"en":["A coral heart. One beat per 1.175 s (four per 4.7 s); each beat is a double \"lub-dub\".","Scale = 1 + 0.26·G(0.2 s, width 0.065) + 0.15·G(0.44 s, width 0.07), where G = e^(−((t − centre) ÷ width)²): a quick swell that drops straight back.","Two heart-shaped outlines spread from 0.16 s and 0.40 s: scale 1.2→2.4 over 0.8 s, cubic ease-out.","As they spread, their opacity goes 0.75→0 (the second at 60%) and the line width 8.5→1.5 px."]},"use":{"ja":"「いいね」・録音中・ライブ配信中・押してほしいボタンなど、生きている感じや注目を出したいとき。","en":"Use it for a like, a recording or live indicator, or a button you want pressed, to make it feel alive."},"tags":["pulse","heartbeat","throb","scale","loop","like","attention"]},{"id":"126","pack":"motion2","no":"06","slug":"motion-path","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"モーションパス","en":"Motion path"},"meaning":{"ja":"決めた曲線に沿って動く","en":"Moves along a curve that you define"},"ask":{"ja":"紙飛行機を、この曲線のモーションパスに沿って4秒で飛ばして。向きは進む方向に合わせて。","en":"Fly the paper plane along this curve as a motion path in 4 s, turning it to face the direction of travel."},"summary":{"ja":"点線の道に沿って、紙飛行機が向きを変えながら進み、途中で宙返りする。","en":"A paper plane follows a dotted path, turning as it goes and looping the loop on the way."},"spec":{"ja":["4.7秒で1回、左の画面外から右の画面外へ。道は x = 270 + 112θ − 150·sinθ、y = 106 − 74·cosθ（θ = −π→π）。中央の上で輪になる（宙返り）","θ は時間に比例して進める（道の上の速さは一定でない。輪の部分はゆっくり見える）","紙飛行機は道の向きに回す: 角度 = atan2(74·sinθ, 112 − 150·cosθ)","道は点線（線幅6・間隔2/15）で先に見せておく。通ったあとにミントの線を24区間（θで0.03ずつ）残し、後ろほど細く薄くする"],"en":["One pass per 4.7 s, from off-screen left to off-screen right. The path is x = 270 + 112θ − 150·sinθ, y = 106 − 74·cosθ for θ = −π→π, which makes a loop at the top centre.","θ advances in proportion to time (so the speed along the path is not constant; the loop looks slower).","The plane turns to the path direction: angle = atan2(74·sinθ, 112 − 150·cosθ).","The path is shown in advance as a dotted line (width 6, dash 2/15). A mint trail of 24 segments (0.03 in θ each) follows, thinner and fainter towards the back."]},"use":{"ja":"飛ぶ物・走る車・地図の上の移動など、決まった道筋を通らせたいとき。","en":"Use it whenever something should follow a set route: a flying object, a car, a journey on a map."},"tags":["motion-path","path","curve","trajectory","follow-path","orient-to-path","loop"]},{"id":"127","pack":"motion2","no":"07","slug":"ping-pong-loop","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"ピンポンループ","en":"Ping-pong loop"},"meaning":{"ja":"行って戻るを繰り返す","en":"Plays forward, then backward, over and over"},"ask":{"ja":"ローディングの点をピンポンループで左右に往復させて。片道1秒で。","en":"Move the loading dot back and forth as a ping-pong loop, 1 s each way."},"summary":{"ja":"四角が端まで行ったら、同じ道を逆再生のように戻ってくる。往復をくり返す。","en":"A square travels to one end, then comes back along the same path as if played in reverse, again and again."},"spec":{"ja":["4.7秒で1往復: 前半2.35秒は再生、後半2.35秒は同じ動きを逆再生（進み具合 g は 0→1→0 を直線で）","ミントの角丸四角（48px・角丸13）が x=92→447 を、高さ 62·|sin(3πg)| の山3つで跳ねて進み、同時に g に合わせて1回転する","残像4つ（0.045秒ずつ遅れ・不透明度0.1〜0.4）","下に再生バー: 再生中は青で「▶ 再生」、逆再生中はコーラルで「◀ 逆再生」。進み具合のバーとつまみが g に合わせて行き来する","両端の折り返し点に縦の柱"],"en":["One round trip per 4.7 s: 2.35 s forward, then the same motion played backwards for 2.35 s (progress g goes 0→1→0, linear).","A mint rounded square (48 px, radius 13) hops from x = 92 to 447 along three arches of height 62·|sin(3πg)|, turning one full turn with g.","Four ghost copies, 0.045 s apart, opacity 0.1–0.4.","A playback bar below: blue with a play label while going forward, coral with a reverse label while going back. The progress bar and its knob follow g.","Vertical posts mark the two turning points."]},"use":{"ja":"ローディング・待機中の飾り・繰り返して見せたい動きに。途切れずに往復させたいとき。","en":"Use it for loaders, idle animations and any move that should repeat back and forth without a cut."},"tags":["ping-pong","loop","boomerang","yoyo","reverse","back-and-forth","loader"]},{"id":"128","pack":"motion2","no":"08","slug":"stop-motion-style","category":"techniques","width":539,"height":208,"cycle":4.7,"name":{"ja":"ストップモーション風","en":"Stop-motion style"},"meaning":{"ja":"コマを落としてカクカク動かす","en":"Moves in choppy steps, with frames dropped"},"ask":{"ja":"この動きをストップモーション風にして。1秒8コマで、コマごとに少しだけ位置をぶらして。","en":"Make this move stop-motion style: 8 frames per second, with a slight jitter on every frame."},"summary":{"ja":"星が1秒8コマほどのカクカクした動きで跳ねて進み、コマごとに位置が少しずつぶれる。","en":"A star hops across in choppy steps at about 8 frames per second, each frame slightly off."},"spec":{"ja":["4.7秒に38コマ（約8コマ/秒・1コマ約0.124秒）。そのコマの絵だけを出し、間は補わない","黄色い星（半径38）が x=−44→583 を、高さ 54·|sin(3πt)| の山3つで跳ねて進み、2回転する","コマごとに決め打ちの乱数でぶらす: 位置 横±5px・縦±4.5px、角度±0.15rad、大きさ±5%","直前の2コマを薄く残す（不透明度0.28と0.12。オニオンスキンのように）","上下に黒いフィルムの帯（各26px・送り穴つき）、右上に「8コマ/秒」"],"en":["38 frames per 4.7 s (about 8 per second, each held for about 0.124 s). Only those frames are drawn; nothing is drawn in between.","A yellow star (radius 38) hops from x = −44 to 583 along three arches of height 54·|sin(3πt)|, turning twice.","Each frame gets a fixed random jitter: position ±5 px across and ±4.5 px up and down, rotation ±0.15 rad, size ±5%.","The previous two frames stay faintly visible (opacity 0.28 and 0.12), like onion skin.","Black film-strip bands top and bottom (26 px each, with sprocket holes) and a frames-per-second label."]},"use":{"ja":"手作り感・クレイアニメ風・コラージュ風の映像に。なめらかすぎる動きを素朴に見せたいとき。","en":"Use it for a handmade, claymation or collage look, when smooth motion feels too slick."},"tags":["stop-motion","choppy","frame-rate","on-twos","jitter","handmade","claymation"]},{"id":"129","pack":"motion2","no":"09","slug":"text-scramble","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"テキストスクランブル","en":"Text scramble"},"meaning":{"ja":"文字がランダムに入れ替わってから決まる","en":"Letters shuffle at random, then settle"},"ask":{"ja":"見出しをテキストスクランブルで出して。ランダムな文字が1秒ほど入れ替わって、左から順に決まる。","en":"Bring the headline in with a text scramble: random characters for about 1 s, settling from left to right."},"summary":{"ja":"ランダムな文字が入れ替わり続け、左から順に正しい単語に決まる。","en":"Random characters keep changing, then lock into the right word from left to right."},"spec":{"ja":["前半2.35秒は「HELLO」、後半は「WORLD」。5文字の等幅フォント（92px）","決まっていない文字: A〜Z（IとOを除く）・0〜9・#$%&@? からランダムに選び、4.7秒に76回（約0.062秒ごと）入れ替える。ミントで不透明度0.75","左から順に決まる: i 文字目は 0.45 + 0.18i 秒（最後は1.17秒）。決まった瞬間から0.22秒は黄、その後は白。拡大率 1 + 0.2·e^(−14t) で落ち着く","1.85秒から右から順にまたランダムへ戻る（i 文字目は 1.85 + 0.08×(4 − i) 秒）","各文字の下に横棒: 決まった文字は青、次に決まる文字は黄、それ以外は紺"],"en":["\"HELLO\" in the first 2.35 s, \"WORLD\" in the second. Five monospaced letters (92 px).","Unsettled slots show random characters from A–Z (without I and O), 0–9 and #$%&@?, changing 76 times per 4.7 s (about every 0.062 s), mint at 75% opacity.","Slots lock from left to right: slot i at 0.45 + 0.18i s (the last at 1.17 s). A newly locked letter is yellow for 0.22 s, then white, settling with scale 1 + 0.2·e^(−14t).","From 1.85 s the slots return to random from right to left (slot i at 1.85 + 0.08 × (4 − i) s).","A bar under each slot: blue when locked, yellow for the next one to lock, navy otherwise."]},"use":{"ja":"見出し・数字・コードネームの登場に。解読・ハッキング・テック系の雰囲気を出したいとき。","en":"Use it to bring in a headline, a number or a code name with a decoding, hacker or tech feel."},"tags":["text-scramble","scramble","decode","shuffle","random","text","hacker"]},{"id":"130","pack":"motion2","no":"10","slug":"wave-text","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"ウェーブテキスト","en":"Wave text"},"meaning":{"ja":"文字が波のように順に上下する","en":"Letters rise and fall in turn, like a wave"},"ask":{"ja":"ロゴの文字をウェーブテキストで動かして。1文字ずつずらして、上下20pxくらい。","en":"Animate the logo letters as wave text, each letter slightly behind the last, about 20 px up and down."},"summary":{"ja":"「WAVE TEXT」の文字が1文字ずつ、波のように順に上下する。","en":"The letters of \"WAVE TEXT\" rise and fall one after another, like a wave."},"spec":{"ja":["「WAVE TEXT」（70px・太字・字間4px）。4.7秒に3回の波（1波1.567秒）","i 文字目の縦の位置 = −28·sin(φ − 0.62i)。φ = 2π × 3 × 時間 ÷ 4.7（隣の文字は0.62radずつ遅れる）","上がっている文字ほど縦に伸ばし（1 + 0.06·s）、色を白→黄に寄せる（s = sin の値。0〜1に制限して混ぜる）","各文字の下に影の楕円。文字が上がるほど小さくする"],"en":["\"WAVE TEXT\" (70 px, bold, 4 px letter spacing). Three waves per 4.7 s (1.567 s per wave).","Vertical offset of letter i = −28·sin(φ − 0.62i), with φ = 2π × 3 × time ÷ 4.7 (each letter lags the previous by 0.62 rad).","Rising letters stretch vertically (1 + 0.06·s) and shift from white towards yellow (s is the sine value, clamped to 0–1 for the colour).","A shadow ellipse under each letter shrinks as the letter rises."]},"use":{"ja":"ロゴ・短い見出し・BGMに合わせたテロップに。楽しさやリズム感を出したいとき。","en":"Use it on a logo, a short heading or a caption timed to music, to add fun and rhythm."},"tags":["wave-text","wave","text","letters","stagger","bounce","kinetic-type"]},{"id":"131","pack":"motion2","no":"11","slug":"text-on-a-path","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"テキストオンパス","en":"Text on a path"},"meaning":{"ja":"文字が線に沿って流れる","en":"Text flows along a line or curve"},"ask":{"ja":"キャッチコピーをテキストオンパスで、波線に沿って左から右へ流して。1周5秒で。","en":"Run the tagline as text on a path along a wavy line, scrolling left to right, one full pass every 5 s."},"summary":{"ja":"文字列が、波打つ線に沿って向きを変えながら流れていく。","en":"A line of text flows along a wavy line, each letter turning to follow it."},"spec":{"ja":["道: y = 118 + 42·sin(2πx ÷ 330 + 0.6)、x = −70〜609。紺の破線（14/10・線幅5）で6px下に見せる","「ALONG THE LINE • 」（42px・太字・字間2px）をくり返し並べる。1文字ずつ、道の上の長さ（弧長）の位置に置き、道の向きに回す","4.7秒で文字列1回分の長さだけ道に沿って進める（ループがつながる）","文字は白、「•」は黄"],"en":["Path: y = 118 + 42·sin(2πx ÷ 330 + 0.6) for x = −70 to 609, shown 6 px below as a navy dashed line (14/10, width 5).","\"ALONG THE LINE • \" (42 px, bold, 2 px letter spacing) is repeated. Each character is placed at its arc-length position on the path and rotated to the path direction.","The text moves along the path by the length of one copy of the string every 4.7 s, so the loop joins up.","Letters are white; the bullet is yellow."]},"use":{"ja":"ロゴのまわり・道や川・波の上など、形に沿って文字を流したいとき。ループする帯の文字にも。","en":"Use it to run text along a shape: around a logo, along a road, river or wave, or as a looping band of text."},"tags":["text-on-path","path-text","curved-text","text","marquee","wave","scroll"]},{"id":"132","pack":"motion2","no":"12","slug":"variable-font-animation","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"可変フォントアニメーション","en":"Variable font animation"},"meaning":{"ja":"文字の太さがなめらかに変わる","en":"The weight of the letters changes smoothly"},"ask":{"ja":"タイトルを可変フォントアニメーションで、細字から極太へ1秒で変えて。","en":"Use a variable font animation on the title: from Thin to Black (weight 100 to 900) in 1 s."},"summary":{"ja":"同じ単語の太さが、細→極太→細となめらかに変わり、下のつまみが太さを示す。","en":"The same word goes smoothly from thin to very bold and back, with a slider below showing the weight."},"spec":{"ja":["「MOTION」（112px・system-ui・字間2px）。太さを4.7秒に2往復: v = 0.5 − 0.5·cos(2π × 2 × 時間 ÷ 4.7)（cosなので両端でなめらかに止まる）","太さ = round(100 + 800v)（100〜900）をそのままフォントの太さに入れる","下にスライダー（x=112→427・y=180）。左に「細」、右に「太」。つまみ（黄・半径14）が v に合わせて動き、上に今の太さの数字を出す"],"en":["\"MOTION\" (112 px, system-ui, 2 px letter spacing). The weight goes back and forth twice per 4.7 s: v = 0.5 − 0.5·cos(2π × 2 × time ÷ 4.7), which eases at both ends.","Weight = round(100 + 800v), from 100 to 900, set directly as the font weight.","A slider below (x = 112→427, y = 180) labelled thin on the left and bold on the right. The knob (yellow, radius 14) follows v, with the current weight shown above it."]},"use":{"ja":"タイトル・ロゴ・強調したい一語に。文字の形そのものを動かして、音や感情の強弱を見せたいとき。","en":"Use it on a title, a logo or a single word to show loudness or emotion through the letters themselves."},"tags":["variable-font","font-weight","typography","text","weight","kinetic-type"]},{"id":"133","pack":"motion2","no":"13","slug":"text-mask","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"テキストマスク","en":"Text mask"},"meaning":{"ja":"文字の形にくり抜いて中の柄を見せる","en":"Letters cut out to show a picture inside"},"ask":{"ja":"「OCEAN」の文字をテキストマスクにして、中に波の映像を見せて。最後の1秒で外側も見せる。","en":"Use the word OCEAN as a text mask with ocean footage inside, and reveal the whole footage in the last second."},"summary":{"ja":"太い文字の形にくり抜いて、その中だけに動く海の景色が見える。周期の終わりに外側も見せる。","en":"Heavy letters are cut out so that a moving seascape shows only inside them; near the end of the cycle the whole picture appears."},"spec":{"ja":["「OCEAN」（太さ900・system-ui・字間2px）。幅500px以下に収まるよう、172pxから2pxずつ小さくして文字の大きさを決める","中の景色（動き続ける）: コーラルの空、黄色い太陽（上下±6px）、y=116から下は青い海に白い波線4本（4.7秒で240pxずつ交互の向きに流れる）、ヨットが4.7秒で1回横切る、雲が60px流れる","作り方: 別のキャンバスに文字を描き、source-in で景色を重ねる（文字の形の中だけ景色が残る）。文字のふちに白い線（線幅4）","文字の外では景色を不透明度12%で見せ、3.45〜3.85秒に100%まで上げ、4.25〜4.65秒に12%へ戻す（smoothstep）"],"en":["\"OCEAN\" (weight 900, system-ui, 2 px letter spacing). The font size starts at 172 px and drops 2 px at a time until the word is at most 500 px wide.","The scene inside keeps moving: coral sky, a yellow sun bobbing ±6 px, blue sea below y = 116 with four white wavy lines drifting 240 px per 4.7 s in alternating directions, a sailboat crossing once per 4.7 s, clouds drifting 60 px.","Method: draw the word on an offscreen canvas, then composite the scene onto it with source-in, so the scene remains only inside the letters. A white 4 px outline around the letters.","Outside the letters the scene shows at 12% opacity; it rises to 100% at 3.45–3.85 s and returns to 12% at 4.25–4.65 s (smoothstep)."]},"use":{"ja":"タイトル・ブランド名の中に写真や映像を見せたいとき。言葉とイメージを1つにまとめたいとき。","en":"Use it to show a photo or footage inside a title or brand name, putting the word and the picture together."},"tags":["text-mask","mask","clipping-mask","knockout","text","typography","title"]},{"id":"134","pack":"motion2","no":"14","slug":"repeater","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"リピーター","en":"Repeater"},"meaning":{"ja":"図形を複製して並べて回す","en":"Duplicates a shape and turns the copies"},"ask":{"ja":"この花びらの形をリピーターで12枚、円に並べて、4秒で1回転させて。","en":"Use a repeater to make 12 copies of this petal in a circle, turning once every 4 s."},"summary":{"ja":"1つの図形が複製されて円に並び、少しずつずれながら回る。","en":"One shape is duplicated around a circle, and the copies turn and pulse slightly out of step."},"spec":{"ja":["角丸の棒（24×60・角丸12）を中央の半径58の円に最大12個並べる。それぞれ外向きに回す（角度 + 90°）","個数: 0.35〜1.7秒に1→12、3.6〜4.45秒に12→1（easeInOut・2乗）。新しい複製は前の位置から30°先の自分の位置へ滑って出る（easeOut・3乗）","全体を4.7秒で1回転。各複製の大きさを 1 ± 0.22 で4.7秒に2回脈打たせ、1つ先ほど0.55radずつ遅らせる（輪をまわる波になる）","色は青・コーラル・黄・ミントの順。元の1個には白いふち。右上に「×個数」"],"en":["A rounded bar (24 × 60, radius 12) is copied up to 12 times around a circle of radius 58 at the centre, each turned to face outward (angle + 90°).","Count: 1→12 at 0.35–1.7 s and 12→1 at 3.6–4.45 s (quadratic ease-in-out). Each new copy slides from the previous slot to its own, 30° further on (cubic ease-out).","The whole ring turns once per 4.7 s. Each copy pulses in size by 1 ± 0.22 twice per 4.7 s, each one 0.55 rad later than the last, so a ripple runs round the ring.","Colours go blue, coral, yellow, mint. The original copy has a white outline. A \"×N\" counter at the top right."]},"use":{"ja":"ローディング・背景の模様・花や光の放射など、同じ形をくり返して並べたいとき。","en":"Use it for loaders, background patterns, flowers or rays: anything built from one shape repeated."},"tags":["repeater","duplicate","radial","array","clone","pattern","loader"]},{"id":"135","pack":"motion2","no":"15","slug":"kaleidoscope","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"カレイドスコープ","en":"Kaleidoscope"},"meaning":{"ja":"万華鏡のように対称に広がる","en":"Mirrored patterns spread out symmetrically"},"ask":{"ja":"ロゴの背景にカレイドスコープを入れて。8分割の対称で、ゆっくり回しながら広げて。","en":"Put a kaleidoscope behind the logo: 8-way mirror symmetry, turning slowly as it spreads out."},"summary":{"ja":"万華鏡のように、8分割の対称な模様が回りながら中心から広がる。","en":"An 8-way symmetrical pattern turns and spreads out from the centre, like a kaleidoscope."},"spec":{"ja":["中心のまわりを45°ずつ8つに分け、奇数番目は左右反転して描く（鏡の対称が8つ）","1区画の中に図形13個（丸・ひし形・三角、4色、乱数はシード固定）。中心から半径300まで外へ進み、4.7秒で半径1つ分（端まで行くと中心へ戻る）","図形は外へ行くほど大きく（(5 + 0.1r) × 0.7〜1.4）、進むほど回す（1pxあたり0.02rad）。最初の30pxで現れ、最後の70pxで消える。角度は4.7秒に1回 ±0.08rad 揺らす","模様全体は4.7秒で90°回す（区画2つ分なのでループがつながる）","中心に白い8角の星（半径20 ± 4・4.7秒に2回脈打つ）"],"en":["The area around the centre is split into eight 45° wedges; every other wedge is drawn mirrored, giving eight mirror-symmetric sections.","One wedge holds 13 shapes (circles, diamonds, triangles; four colours; fixed random seed). They travel outward from the centre to radius 300, one full radius per 4.7 s, wrapping back to the centre.","Shapes grow as they go out ((5 + 0.1r) × 0.7–1.4) and spin 0.02 rad per px. They fade in over the first 30 px and out over the last 70 px; each sways ±0.08 rad once per 4.7 s.","The whole pattern turns 90° per 4.7 s (two wedges, so the loop joins up).","A white eight-point star at the centre (radius 20 ± 4, pulsing twice per 4.7 s)."]},"use":{"ja":"ミュージックビデオ・ライブの背景・幻想的な場面転換に。くり返し見ても飽きない模様がほしいとき。","en":"Use it for music videos, live backdrops or dreamy scene changes, wherever a pattern has to hold up on repeat."},"tags":["kaleidoscope","symmetry","mirror","mandala","pattern","radial","psychedelic"]},{"id":"136","pack":"motion2","no":"16","slug":"line-boil","category":"text-shapes","width":539,"height":208,"cycle":4.7,"name":{"ja":"ラインボイル","en":"Line boil"},"meaning":{"ja":"手描きの線が小刻みに揺らぐ","en":"Hand-drawn lines wobble frame to frame"},"ask":{"ja":"手描きのイラストにラインボイルを付けて。1秒10コマで、線を2〜3pxだけ揺らして。","en":"Add line boil to the hand-drawn illustration: 10 frames per second, with the lines shifting only 2–3 px."},"summary":{"ja":"手描き風の線の絵が、数コマごとに小刻みに揺らぐ。絵そのものは動かない。","en":"A hand-drawn line picture wobbles every few frames while the picture itself stays still."},"spec":{"ja":["止まった線画（黄の星・白の雲・ミントのきらめき線・薄い地面の線）。線幅6〜8・端は丸","絵は動かさず、4.7秒に47回（約0.1秒ごと）全部の点を描き直す。各点を横・縦それぞれ±3.5pxの決め打ちの乱数でずらす","線はあらかじめ点の列にしておき（6〜13pxおき。雲は輪郭の96点）、隣の点の中点を通る2次曲線でつないで描く（手描きのコマのようにゆらぐ）","乱数はコマ番号と点の番号から作る（同じコマはいつも同じ形）"],"en":["A still line drawing (a yellow star, a white cloud, mint sparkle strokes, a faint ground line). Line widths 6–8, round caps.","The drawing does not move. 47 times per 4.7 s (about every 0.1 s) every point is redrawn with a fixed random offset of up to ±3.5 px in x and in y.","Each line is first turned into a row of points (every 6–13 px; 96 points round the cloud) and drawn as quadratic curves through the midpoints between them, so it wobbles like hand-drawn frames.","The offsets are a hash of the frame number and the point number, so the same frame always looks the same."]},"use":{"ja":"手描き風のイラスト・アイコン・文字に。止まった絵にも、手で描いたような生きた感じを出したいとき。","en":"Use it on hand-drawn illustrations, icons or lettering to make even a still picture feel drawn by hand."},"tags":["line-boil","boil","hand-drawn","wobble","jitter","sketch","frame-by-frame"]},{"id":"137","pack":"motion2","no":"17","slug":"push-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"プッシュ","en":"Push transition"},"meaning":{"ja":"次の画面が前の画面を押し出す","en":"The next scene pushes the current one out"},"ask":{"ja":"次のスライドへはプッシュで。右から0.8秒で押し出すように。","en":"Go to the next slide with a push transition from the right, 0.8 s."},"summary":{"ja":"次の画面が横から入ってきて、前の画面を一緒に押し出す。","en":"The next scene slides in from the side and pushes the current one out with it."},"spec":{"ja":["海の画面 → 山の画面 → 海の画面を2.35秒ずつ。各区間の 0.45〜1.6秒（1.15秒）で切り替え、easeInOut（3乗）","2つの画面をつなげたまま、一緒に画面の幅（539px）だけ動かす。重ねたり薄くしたりしない","向き: 海→山は左へ（次の画面は右から）、山→海は右へ","2つの画面の境目に紺の線（幅6）"],"en":["Sea scene → mountain scene → sea scene, 2.35 s each. The change runs at 0.45–1.6 s of each half (1.15 s), cubic ease-in-out.","The two scenes stay joined and move together by the full frame width (539 px); no overlap and no fade.","Direction: sea→mountain moves left (the next scene enters from the right); mountain→sea moves right.","A navy line (width 6) marks the seam between the two scenes."]},"use":{"ja":"スライド・写真・手順を順番に送るとき。続いている感じ、前へ進む感じを出したいとき。","en":"Use it to step through slides, photos or steps, when the change should feel continuous and moving forward."},"tags":["push","push-transition","slide","transition","scene-change","carousel"]},{"id":"138","pack":"motion2","no":"18","slug":"blinds-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ブラインド","en":"Blinds transition"},"meaning":{"ja":"細い帯の隙間から次の画面が開く","en":"The next scene opens through thin strips"},"ask":{"ja":"場面の切り替えをブラインドで。横の帯7本で、1秒かけて開くように。","en":"Change scenes with a blinds transition: seven horizontal strips that open over 1 s."},"summary":{"ja":"細い帯ごとのすき間がだんだん広がって、次の画面が開く。","en":"Gaps in a row of thin strips widen until the next scene is fully open."},"spec":{"ja":["昼の画面 → 夜の画面 → 昼を2.35秒ずつ。横の帯7本（1本 208÷7 ≒ 29.7px）","0.4〜1.65秒（1.25秒）、easeInOut（2乗）: どの帯でも、帯の上端から下へ次の画面が見える部分を広げ、0から帯の高さいっぱいまで同時に開く","前の画面は下に置いたまま動かさない。どちらの画面の絵も動かさない"],"en":["Day scene → night scene → day, 2.35 s each. Seven horizontal strips (208 ÷ 7 ≈ 29.7 px each).","0.4–1.65 s (1.25 s), quadratic ease-in-out: in every strip at once, the next scene is revealed from the strip's top edge downward, opening from 0 to the full strip height.","The previous scene stays underneath. Neither picture moves."]},"use":{"ja":"昼夜・季節・前後など、2つの場面をはっきり切り替えたいとき。レトロな雰囲気を出したいときにも。","en":"Use it for a clear switch between two scenes, such as day and night or before and after, or for a retro feel."},"tags":["blinds","venetian-blinds","stripes","transition","wipe","scene-change"]},{"id":"139","pack":"motion2","no":"19","slug":"cube-transition","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"キューブ","en":"Cube transition"},"meaning":{"ja":"立方体が回るように面が替わる","en":"Changes scenes like a turning cube"},"ask":{"ja":"商品写真の切り替えをキューブで。左へ90°回して、0.8秒で。","en":"Switch the product shots with a cube transition, turning 90° to the left in 0.8 s."},"summary":{"ja":"立方体が回るように、前の面が奥へ倒れて次の面が現れる。","en":"Like a turning cube, the front face swings away and the next face comes round."},"spec":{"ja":["面A（コーラル地に「A」）と面B（ミント地に「B」）、各250×146。2.35秒ずつ A→B→A","0.45〜1.6秒（1.15秒）に0→90°回す、easeInOut（3乗）。回転の軸は立方体の中心を通る縦の線（奥行きは面の幅と同じ250）","遠近: カメラまでの距離820px。面を幅2pxの縦の帯に分け、帯ごとに遠近の倍率で高さと位置を決めて描く","奥へ行く面は最大55%まで暗く（0.55·sinφ）、出てくる面は55%の暗さから明るくする（0.55·cosφ）。床の影の幅は見えている幅に合わせる"],"en":["Face A (an \"A\" on coral) and face B (a \"B\" on mint), each 250 × 146. 2.35 s each, A→B→A.","Rotation 0→90° at 0.45–1.6 s (1.15 s), cubic ease-in-out, around a vertical axis through the centre of the cube (depth equal to the face width, 250).","Perspective: camera distance 820 px. Each face is drawn as 2 px vertical slices, each sized and placed by its perspective factor.","The face turning away darkens up to 55% (0.55·sinφ); the incoming face starts 55% dark and brightens (0.55·cosφ). The floor shadow follows the visible width."]},"use":{"ja":"商品・プラン・画面を次々に見せるとき。立体感を出して、横に並んでいる物を順に見せたいとき。","en":"Use it to show products, plans or screens one after another with a sense of depth."},"tags":["cube","cube-transition","3d","rotate","transition","perspective"]},{"id":"140","pack":"motion2","no":"20","slug":"page-curl","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ページめくり","en":"Page curl"},"meaning":{"ja":"紙のようにめくれて次へ","en":"Peels back like paper to show the next page"},"ask":{"ja":"次の章へはページめくりで。右下の角から1.2秒でめくって。","en":"Go to the next chapter with a page curl from the bottom-right corner, 1.2 s."},"summary":{"ja":"角から紙がめくれて裏返り、下から次のページが現れる。","en":"A page peels back from its corner and folds over, revealing the next page beneath."},"spec":{"ja":["ページ1（白）→ ページ2（クリーム）→ ページ1を2.35秒ずつ。右下の角から、0.35〜1.75秒（1.4秒）、easeInOut（2乗）","折り目の線を、角から向き（−1, −0.42）（長さ1にそろえる）へ 0→600px 動かす","折り目より角側の部分を折り目で鏡に映して、めくれた裏面にする（薄いグレーかベージュ）。影（ぼかし14・ずれ4, 4）と白いふち（線幅2）を付ける","めくれたところには次のページを見せ、折り目に沿って50pxの影のグラデーション"],"en":["Page 1 (white) → page 2 (cream) → page 1, 2.35 s each. The curl starts at the bottom-right corner, 0.35–1.75 s (1.4 s), quadratic ease-in-out.","The fold line moves from the corner in the direction (−1, −0.42), normalised, by 0→600 px.","The part beyond the fold line is mirrored across it to form the flap, the back of the page (light grey or beige), with a drop shadow (blur 14, offset 4, 4) and a white 2 px edge.","The next page shows where the paper has lifted, with a 50 px shadow gradient along the fold."]},"use":{"ja":"本・カタログ・アルバム・章の切り替えに。紙の手ざわりや、物語を読み進める感じを出したいとき。","en":"Use it for books, catalogues, albums or chapter breaks, where a paper feel or reading on suits the content."},"tags":["page-curl","page-turn","page-peel","paper","book","transition"]},{"id":"141","pack":"motion2","no":"21","slug":"pixelate","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ピクセレート","en":"Pixelate"},"meaning":{"ja":"モザイクが粗くなって切り替わる","en":"Turns into coarse blocks, then switches"},"ask":{"ja":"ピクセレートで切り替えて。0.6秒でモザイクが粗くなり、いちばん粗いところで次の画面へ。","en":"Use a pixelate transition: the mosaic gets coarser over 0.6 s and the scene changes at the coarsest point."},"summary":{"ja":"画面がだんだん粗いモザイクになり、いちばん粗いところで切り替わって細かく戻る。","en":"The picture turns into coarser and coarser blocks, switches at the coarsest point, then sharpens again."},"spec":{"ja":["野原の画面 → 街の画面 → 野原を2.35秒ずつ。0.2〜1.9秒（1.7秒）に、モザイクの1マスの大きさを 1・2・3・4・6・8・11・15・20・27・36px と段階で上げて下げる（中間の1.05秒がいちばん粗い）","前半は前の画面、後半は次の画面（いちばん粗いところで差し替える）","作り方: 画面を 幅÷マス の大きさに縮めて（なめらか補間あり）、補間を切って元の大きさに引き伸ばす"],"en":["Field scene → city scene → field, 2.35 s each. At 0.2–1.9 s (1.7 s) the block size steps up and back down through 1, 2, 3, 4, 6, 8, 11, 15, 20, 27 and 36 px (coarsest at the midpoint, 1.05 s).","The first half shows the old scene and the second half the new one; the swap happens at the coarsest step.","Method: shrink the frame to width ÷ block size with smoothing on, then scale it back up with smoothing off."]},"use":{"ja":"ゲーム風・レトロ・デジタルな場面転換に。隠したい物をぼかして切り替えたいときにも。","en":"Use it for game-like, retro or digital scene changes, or to blur something out as the scene switches."},"tags":["pixelate","mosaic","pixel","transition","retro","8-bit","scene-change"]},{"id":"142","pack":"motion2","no":"22","slug":"shatter","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"ガラス割れ","en":"Shatter"},"meaning":{"ja":"ガラスのように割れて破片が飛ぶ","en":"Breaks like glass and the shards fly off"},"ask":{"ja":"タイトルの登場前に、前の画面をガラス割れで砕いて。ひびが入ってから破片が1秒で落ちるように。","en":"Before the title appears, break the previous scene with a shatter: cracks first, then the shards fall away in about 1 s."},"summary":{"ja":"画面がガラスのようにひび割れ、破片が飛び散って次の画面が現れる。","en":"The picture cracks like glass, the shards fly off and the next scene is revealed."},"spec":{"ja":["山の画面 → 昼の画面 → 山を2.35秒ずつ。割れる中心は（304, 92）","ひび: 0.3〜0.65秒。中心から放射の線13本と、半径およそ40・98・175（各±15%）の輪が、中心からの距離順に伸びる（easeOut・3乗で420pxまで）。中心に白い光の星（0.6秒で消える）","0.82秒に割れる: 破片52枚（13本×4段）に前の画面を切り抜き、中心から外へ 220〜480px/s で飛ばす（縦は0.7倍、上向きに最大120を足す）。重力1300px/s²、回転±4rad/s、1秒で最大35%縮む","外側の段ほど遅れて飛ぶ（1段0.035秒＋乱数で最大0.03秒）。各破片は飛び始めて0.55〜1.0秒で消える","破片には白いふち（線幅2.5）。下には次の画面"],"en":["Mountain scene → day scene → mountain, 2.35 s each. The impact point is (304, 92).","Cracks: 0.3–0.65 s. Thirteen radial lines and rings at radii of about 40, 98 and 175 (each ±15%) appear in order of distance from the centre (cubic ease-out, out to 420 px). A white flash star at the centre fades by 0.6 s.","The glass breaks at 0.82 s: 52 shards (13 × 4 rings) cut from the old scene fly outward at 220–480 px/s (vertical speed × 0.7, plus up to 120 upward), with gravity 1300 px/s², spinning ±4 rad/s and shrinking up to 35% over 1 s.","Outer rings leave later (0.035 s per ring plus up to 0.03 s at random). Each shard fades out 0.55–1.0 s after it starts moving.","Shards have a white 2.5 px edge; the next scene is underneath."]},"use":{"ja":"衝撃・破壊・どんでん返しの場面転換に。タイトルや結果を強く見せる直前に。","en":"Use it for an impact, a break or a twist, just before a title or a result that should hit hard."},"tags":["shatter","glass-break","broken-glass","shards","crack","transition","impact"]},{"id":"143","pack":"motion2","no":"23","slug":"exploded-view","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"分解図","en":"Exploded view"},"meaning":{"ja":"部品がばらけて中の構造を見せる","en":"Parts separate to show the structure inside"},"ask":{"ja":"製品の分解図を見せて。4つの部品が1秒でばらけて、名前のラベルを付けて。","en":"Show an exploded view of the product: four parts spread apart in 1 s, each with a name label."},"summary":{"ja":"スマホの部品が層ごとにばらけて中の構造を見せ、また組み上がる。","en":"A phone separates into its layers to show how it is built, then assembles again."},"spec":{"ja":["アイソメトリックのスマホを4層（背面・電池・基板・画面）で作る。各層は平らな角丸の板を、0.85倍・左右30°に傾けた座標で描き、側面の厚み6px","ばらける: 0.45秒から各層0.75秒、上の層ほど0.08秒ずつ遅らせる。backOut(s=1.3)。下から i 段目（0〜3）の高さ = 7i + 30i × 進み具合（いちばん下の背面は動かない）","ばらけている間: 各層を ±3px で4.7秒に2回上下させ、角を結ぶ点線の補助線と、右へ引き出し線つきの名前ラベル（背面・電池・基板・画面）を出す","組み上がる: 3.25秒から各層0.7秒、いちばん上の層から0.07秒ずつ遅らせる。easeInOut（3乗）"],"en":["An isometric phone built from four layers (back cover, battery, circuit board, screen). Each layer is a flat rounded plate drawn on axes scaled by 0.85 and tilted 30° either way, with 6 px thick sides.","Separate: from 0.45 s, 0.75 s per layer, each layer 0.08 s after the one below, backOut (s = 1.3). Height of layer i (0–3 from the bottom) = 7i + 30i × progress, so the back cover stays put.","While apart, each layer bobs ±3 px twice per 4.7 s, dotted guide lines join the corners, and name labels with leader lines appear on the right (in Japanese in the demo).","Reassemble: from 3.25 s, 0.7 s per layer, starting with the top layer, 0.07 s apart, cubic ease-in-out."]},"use":{"ja":"製品の中身・仕組み・構成要素を説明するとき。何でできているかを一目で見せたいとき。","en":"Use it to explain what is inside a product, how it works or what it is made of, at a glance."},"tags":["exploded-view","explode","layers","isometric","product","breakdown","explainer"]},{"id":"144","pack":"motion2","no":"24","slug":"split-screen","category":"transitions-highlights","width":539,"height":208,"cycle":4.7,"name":{"ja":"スプリットスクリーン","en":"Split screen"},"meaning":{"ja":"画面を分けて同時に見せる","en":"Divides the frame to show scenes side by side"},"ask":{"ja":"スプリットスクリーンで3つの場面を同時に見せて。1画面から2分割、3分割へ0.5秒ずつで。","en":"Show three scenes at once with a split screen: from one panel to two, then three, 0.5 s each."},"summary":{"ja":"1枚の画面が2つ、3つに分かれて、別々の場面が同時に動く。","en":"One full-frame scene splits into two panels, then three, each with its own scene moving."},"spec":{"ja":["画面いっぱいの海の場面が、0.45〜0.95秒に2分割（境目 539→269.5）、1.4〜1.9秒に3分割（境目は 1/3 と 2/3）になる。3.75〜4.4秒に1画面へ戻る。どれも easeInOut（3乗）","3つの場面（海・街・野原）は、それぞれ自分の枠の中で中央に置き、枠で切り抜く。中は動き続ける（波とヨット、街の窓が4.7秒に8回点滅、風車が4.7秒に2回転）","枠の境目に白い線（幅6）"],"en":["A full-frame sea scene splits into two panels at 0.45–0.95 s (divider 539→269.5), then into three at 1.4–1.9 s (dividers at 1/3 and 2/3), and merges back into one at 3.75–4.4 s, all cubic ease-in-out.","The three scenes (sea, city, field) are each centred in and clipped to their own panel and keep moving inside it (waves and a sailboat, city windows switching 8 times per 4.7 s, a windmill turning twice per 4.7 s).","White dividers (width 6) between the panels."]},"use":{"ja":"比較・同時進行・複数の人や場所を並べて見せたいとき。ビフォーアフターや選択肢の紹介に。","en":"Use it to compare, to show things happening at once, or to line up several people or places, such as before and after or a set of options."},"tags":["split-screen","multi-screen","panels","side-by-side","comparison","layout"]}]};
const locale={"note":"Workshop Traditional Chinese discovery labels. Original English/Japanese IDs and specs are unchanged.","packs":{"motion":"MG 基礎","camera":"運鏡與轉場","ui":"介面元件","lp":"網站互動","photo":"攝影風格","motion2":"MG 進階"},"names":["彈跳進場","錯開進場","放射爆發","線條描繪","遮罩揭幕","打字機","數字累加","動態文字","緩動曲線","過衝回彈","擠壓與拉伸","形狀變形","液態動作","運動殘影","粒子","視差","遮罩轉場","形狀轉場","液態轉場","穿越縮放","翻轉","光帶掃過","故障雜訊","衝擊震動","水平搖鏡","垂直搖鏡","鏡頭推近","變焦放大","跟拍","環繞運鏡","升降鏡頭","希區考克變焦","焦點轉移","手持感","穿越機視角","荷蘭角","慢動作","變速運鏡","縮時","定格","跳接","動作匹配轉場","甩鏡轉場","交叉溶接","擦拭轉場","突切","J-cut 聲音先行","L-cut 聲音延續","模態對話框","側邊抽屜","底部面板","手風琴折疊","下拉選單","工具提示","浮動面板","短暫通知","分頁標籤","輪播","切換開關","分段控制器","篩選標籤","範圍滑桿","數量增減器","分頁導覽","漢堡選單","麵包屑導覽","大型選單","步驟指示器","骨架載入","載入轉圈","徽章","空白狀態","捲動視差","捲動淡入","固定頁首","捲動釘選","水平捲動","捲動吸附","捲動進度條","螢光標記","懸停浮起","懸停圖片縮放","游標跟隨","磁吸按鈕","漣漪點擊","底線動畫","前後比較滑桿","離站彈窗","預載入動畫","延遲載入","無限捲動","頁面轉場","平滑捲動","跑馬燈","流動漸層","漂浮動畫","逆光","輪廓光","剪影","分割光","林布蘭光","蝴蝶光","黃金時刻","藍調時刻","散景","移軸","長時間曝光","追焦攝影","鏡頭耀光","魚眼鏡頭","色差","暗角","高調攝影","低調攝影","黑白","雙色調","青橙調色","底片顆粒","漏光","雙重曝光","預備動作","跟隨動作","彈跳","擺動","脈動","運動路徑","往返循環","停格風格","文字亂碼解碼","波浪文字","沿路徑排字","可變字型動畫","文字遮罩","重複排列","萬花筒","手繪抖線","推移轉場","百葉窗轉場","立方體轉場","翻頁轉場","像素化","碎裂","零件分解圖","分割畫面"],"meanings":{"121":"先朝反方向蓄力，再朝目標方向動作。","122":"主體停下後，附屬物件延遲收住。","123":"落下後彈起，反彈幅度逐次減小。","124":"以連續小幅的位置或角度變化增加活力。","125":"大小規律增減，像心跳一樣循環。","126":"沿著曲線或指定路徑移動。","127":"到達終點後反向返回，持續往返。","128":"位置逐格跳動，呈現停格拍攝感。","129":"亂碼逐步收斂成可讀的文字。","130":"文字逐字以不同相位上下起伏。","131":"字元沿曲線排列並移動。","132":"改變可變字型的粗細或寬度軸。","133":"以字形作為遮罩顯示內部畫面。","134":"將同一圖形依間距、角度或時間重複。","135":"鏡射與旋轉的圖形組成對稱圖案。","136":"輪廓逐格略微變化，呈現手繪感。","137":"前後場景沿同一方向推移。","138":"以平行條帶逐段切換場景。","139":"場景像立方體表面一樣翻轉。","140":"畫面以紙張翻頁的方式切換。","141":"畫面轉為大色塊後恢復細節。","142":"畫面碎成多個小片並散開。","143":"物件的組件分開展示，再回到原位。","144":"將畫面分成數個區域，同時呈現內容。"}};
const origin={"repository":"https://github.com/showheyohtaki/motion-prompt","commit":"36f5bdacb1e012eb00caf30741d2e2223ee514b4","retrieved":"2026-10-21","catalogVersion":"1.45af2a203e","license":"MIT","note":"Upstream reference demos; Workshop adaptations are separate editable layer recipes."};
// Included inside the generated offline library; all dependencies are local.
const lookup=new Map(catalog.elements.map(e=>[e.id,e]));
const idOf=id=>String(id).replace(/^#/, '').padStart(3,'0');
function entry(id){const value=lookup.get(idOf(id));if(!value)throw new Error('找不到動效編號：'+id);return value;}
function label(id){const e=entry(id);return locale.names[Number(e.id)-1]||e.name['zh-Hant']||e.name.en;}
function meaning(id){const e=entry(id);return locale.meanings[e.id]||e.meaning['zh-Hant']||e.meaning.en;}
function search(query='',pack='all'){
  const words=query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return catalog.elements.filter(e=>(pack==='all'||e.pack===pack)&&words.every(q=>[e.id,'#'+e.id,label(e.id),...Object.values(e.name),meaning(e.id),...e.tags].join(' ').toLowerCase().includes(q)));
}
function blocks(pack){
  if(!factories[pack])throw new Error('找不到分類：'+pack);
  const source=factories[pack].toString(),matches=[...source.matchAll(/^  \/\/ @(kit|shared|element|end)(?: (\d+))?\s*$/gm)];
  return matches.map((m,i)=>({kind:m[1],no:m[2],code:source.slice(m.index+m[0].length,matches[i+1]?.index??source.length).trim()})).filter(b=>b.kind!=='end');
}
const license=id=>`// Motion Prompt #${id} · MIT License (c) 2026 Shohei Ohtaki · https://showheyohtaki.github.io/motion-prompt/#${id}`;
function kit(pack){const p=catalog.packs.find(p=>p.pack===pack);if(!p)throw new Error('找不到分類：'+pack);return license(p.first+'-'+p.last)+'\n'+blocks(pack).filter(b=>['kit','shared'].includes(b.kind)).map(b=>b.code).join('\n\n');}
function elementCode(id){const e=entry(id),block=blocks(e.pack).find(b=>b.kind==='element'&&Number(b.no)===Number(e.no));if(!block)throw new Error('缺少原始程式：'+e.id);return license(e.id)+'\n'+block.code;}
function get(id){const e=entry(id);return [license(e.id),`#${e.id} ${label(e.id)} / ${e.name.en}`,meaning(e.id),`Pack: ${e.pack}; ${e.width}×${e.height}; cycle ${e.cycle}s. Needs: kit ${e.pack}.`,...e.spec.en.map(s=>'- '+s),'\nReference implementation:\n'+elementCode(e.id)].join('\n');}
function render(id,canvas,seconds,view={}){
  const e=entry(id);if(!Number.isFinite(seconds))throw new Error('預覽時間無效。');
  // Photo demos reuse offscreen contexts whose drawing state survives a seek in WebKit.
  // Recreate that pack for each still; the pinned upstream sources stay unchanged.
  const pack=['photo','motion2'].includes(e.pack)?factories[e.pack]():(packs[e.pack]||(packs[e.pack]=factories[e.pack]())),c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,x=view.x||0,y=view.y||0,vw=view.width||w,vh=view.height||h,scale=(view.fit==='cover'?Math.max(vw/e.width,vh/e.height):Math.min(vw/e.width,vh/e.height))*(view.zoom||1);
  c.save();try{c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.filter='none';c.clearRect(0,0,w,h);c.fillStyle=view.background||'#10171c';c.fillRect(0,0,w,h);c.beginPath();c.rect(x,y,vw,vh);c.clip();c.translate(x+(vw-e.width*scale)/2,y+(vh-e.height*scale)/2);c.scale(scale,scale);c.beginPath();c.rect(0,0,e.width,e.height);c.clip();pack.cells[Number(e.no)-1](c,e.width,e.height,((seconds%e.cycle)+e.cycle)%e.cycle);}finally{c.restore();}
}
function handoff(picks,options={}){
  const unique=[...new Map(picks.map(p=>{const e=entry(typeof p==='string'?p:p.id);return[e.id,{id:e.id,note:typeof p==='string'?'':String(p.note||'').slice(0,300)}];})).values()];
  if(!unique.length)throw new Error('請先挑選動效。');
  const lines=['# 動畫小工坊 1.5 · Motion Prompt 動效選擇',String(options.brief||'請依下列動效選擇完成我的作品。').slice(0,2000),`用途：${options.mode||'影片／網站／軟體'}。以下是參考規格，不代表已完成整部作品。`,'修改既有作品時，請另附 .motion.json 專案；請一併讀取 Skill ZIP 的 SKILL.md 與 references/motion-prompt.md。所有來源與程式都在 ZIP 內，不需要連到我的電腦。',`上游快照：${origin.commit}（${origin.retrieved}）；作者 Shohei Ohtaki，MIT。`,'先確認專案框架、畫面比例、FPS、內容與場景邊界。替換動畫時保留原場景長度與前後轉場；維持原始動作的先後與緩動，若改變節奏，請列出差異。','保留原始程式第一行授權。互動 UI 必須改為真正可操作的 DOM 元件；photo 類只用於圖像／影片提示詞，示範不是照片濾鏡。',''];
  for(const p of unique){const e=entry(p.id);lines.push(`## #${e.id} ${label(e.id)} / ${e.name.en}`,`用途備註：${p.note||'由製作需求決定'}`,meaning(e.id),`精確規格與程式：assets/motion-reference/packs/${e.pack}.js；查詢：node assets/motion-reference.mjs get ${e.id}；共用程式：node assets/motion-reference.mjs kit ${e.pack}`,`原版示範：https://showheyohtaki.github.io/motion-prompt/#${e.id}`,...e.spec.en.map(s=>'- '+s),'');}
  lines.push('請交付可編輯原始碼／專案，列出使用的動效編號、場景位置、調整與實際驗證結果。無法渲染時請說明，不要把參考示範當成已完成的成品。');
  return lines.join('\n');
}
window.MotionReference={catalog,origin,locale,entry,label,meaning,search,kit,elementCode,get,render,handoff};

})();
