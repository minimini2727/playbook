/* ============================================================
   레퍼런스 레이아웃 (업로드 PDF에서 도형 모양·위치·배치만 차용)
   - 'ref' 테마일 때 기존 레이아웃을 같은 내용 구조의 레퍼런스 배치로 바꿔 그림
   - 문구·수치·이미지는 가져오지 않음 (구조만)
   ============================================================ */
const RFC = K => ({
  pill: K.dark ? '#0E0E0E' : '#161616', band: K.dark ? '#3A3A3A' : '#EFEFEF', bandT: K.dark ? '#E6E6E6' : '#333333',
  box: K.dark ? '#333333' : '#FFFFFF', line: K.dark ? '#555555' : '#D6D6D6', hiF: K.dark ? mix(K.p, '#2A2A2A', .72) : mix(K.p, '#FFFFFF', .93),
  soft: K.dark ? '#3A3A3A' : mix(K.p, '#FFFFFF', .9), beige: K.dark ? '#3A3A3A' : mix(K.p, '#FFFFFF', .86), panel: K.dark ? '#323232' : '#F6F6F6',
  ink: K.dark ? '#FFFFFF' : '#1E1E1E', sub: K.dark ? '#C8C8C8' : '#555555', mute: K.dark ? '#8C8C8C' : '#9A9A9A', tri: K.dark ? '#6A6A6A' : '#BDBDBD'
});
const rfLn = d => bl(d || '').map(s => s.replace(/^\s*[-·•]\s*/, '').replace(/^\s*\d+[).]\s*/, '').trim()).filter(Boolean);
const rfHead = s => { const m = String(s || '').split(/\s*[:：]\s*/); return m.length > 1 && m[0].length <= 18 ? [m[0], m.slice(1).join(': ')] : [String(s || ''), '']; };
const rfShort = (s, n = 16) => { const t = rfHead(s)[0].replace(/[(（].*$/, '').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
const CIRC = '①②③④⑤⑥';
function rfSlot(E, K, P, pg, k, x, y, w, h, o = {}){
  if ((pg.media || [])[k]?.data || !K.dark) return mediaSlot(E, pg, k, x, y, w, h, {...P, c1: K.p, tint2: '#C9C9C9', ink: '#555555'}, o);
  E.push(R(x, y, w, h, '#383838', {r: o.r ?? 8, ...(EXPORTING ? {} : {line: '#5A5A5A', dash: true})}));
  E.push(T(x, y + h / 2 - 22, w, 44, EXPORTING ? (o.label || '') : `${o.label ? o.label + '\n' : ''}이미지·영상 넣기`, {size: Math.min(14, w / 9), color: '#9A9A9A', align: 'center', valign: 'middle', keepColor: true}));
}
function rfBand(E, K, x, y, w, text){ const C = RFC(K); E.push(R(x, y, w, 26, C.band)); E.push(T(x + 10, y, w - 20, 26, text || '', {size: 12.5, wt: 600, color: C.bandT, align: 'center', valign: 'middle', minScale: .65, keepColor: true})); return y + 36; }
function rfPill(E, K, x, y, w, h, text, hi){ const C = RFC(K), f = hi ? K.p : C.pill; E.push(R(x, y, w, h, f, {r: h / 2})); E.push(T(x + 12, y, w - 24, h, text || '', {size: 13, bold: true, color: onC(f), align: 'center', valign: 'middle', minScale: .55, keepColor: true})); }
function rfBox(E, K, x, y, w, h, o = {}){ const C = RFC(K); E.push(R(x, y, w, h, o.fill || (o.hi ? C.hiF : C.box), {r: o.r ?? 8, line: o.hi ? K.p : (o.line || C.line)})); }
function rfTriD(E, K, cx, y, w = 28, h = 11){ E.push(SH('trap-down', cx - w / 2, y, w, h, RFC(K).tri, {inset: w / 2})); }
function rfTriR(E, K, cx, cy, s = 11){ E.push(SH('triR', cx - s * .4, cy - s / 2, s * .8, s, RFC(K).tri)); }
const rfFit = (fn, avail, hi = 14, lo = 11) => { let f = hi; while (f > lo && fn(f) > avail) f -= .5; return f; };
function rfFrame(E, K, P, pg, k, x, y, w, h, label){ // 휴대폰 프레임 + 화면(소재 슬롯)
  E.push(R(x, y, w, h, '#111111', {r: Math.min(24, w * .14)}));
  const sx = x + 6, sy = y + 6, sw = w - 12, shh = h - 12;
  rfSlot(E, K, P, pg, k, sx, sy, sw, shh, {r: Math.min(18, w * .1), label, video: true});
  E.push(R(x + w / 2 - 20, y + 10, 40, 9, '#111111', {r: 4.5}));
}

const REFL = {
  /* p5·p6: 검정 필 헤더 + ▶ + 세로 카드 (마지막 강조) */
  rfPhase(E, items, b, P, pg, K = K3(P, pg), o = {}){
    const C = RFC(K), cols = (o.cols || items).slice(0, 5), n = cols.length || 1, ag = 26, cw = (b.w - (n - 1) * ag) / n, ph = 32, hiI = o.hi ?? (n >= 3 ? n - 1 : -1);
    const cy = b.y + ph + 10, ch = b.h - ph - 10, iw = cw - 32;
    const need = f => Math.max(...cols.map(it => { const L = rfLn(it.d); let h = 0;
      if (o.num){ h += L[0] ? tH(L[0], f + 1, iw, 1.4, 700) + 10 : 0; h += L.slice(1).reduce((a, l) => a + tH('· ' + l, f - .5, iw, 1.5, 400) + 4, 0); if (it.v) h += 40 + tH(it.v, f - .5, iw, 1.5, 400); }
      else { if (it.v) h += tH(it.v, f, iw, 1.45, 700) + 14; h += L.reduce((a, l) => a + tH(l, f - .5, iw, 1.55, 400) + 4, 0); }
      return h + 40; }));
    const fs = rfFit(need, ch, 14.5, 11);
    cols.forEach((it, i) => {
      const x = b.x + i * (cw + ag), hi = i === hiI, L = rfLn(it.d);
      rfPill(E, K, x, b.y, cw, ph, o.num ? `${two(i + 1)}  ${it.h || ''}` : (it.h || ''), hi);
      if (i < n - 1) rfTriR(E, K, x + cw + ag / 2, b.y + ph / 2);
      rfBox(E, K, x, cy, cw, ch, {hi});
      let y = cy + 20; const px = x + 16;
      if (o.num){
        if (L[0]){ const h = tH(L[0], fs + 1, iw, 1.4, 700); E.push(T(px, y, iw, h + 2, L[0], {size: fs + 1, bold: true, color: C.ink, lh: 1.4})); y += h + 10; }
        L.slice(1).forEach(l => { const h = tH('· ' + l, fs - .5, iw, 1.5, 400); E.push(T(px, y, iw, h + 2, '· ' + l, {size: fs - .5, color: C.sub, lh: 1.5, wt: 400})); y += h + 4; });
        if (it.v){ y += 12; E.push(R(px, y, iw, 1, C.line)); y += 14; E.push(T(px, y, iw, 16, o.vLabel || '평가 기준', {size: 11.5, bold: true, color: C.ink})); y += 20; E.push(T(px, y, iw, cy + ch - y - 10, it.v, {size: fs - .5, color: C.sub, lh: 1.5, wt: 400, minScale: .7})); }
      } else {
        if (it.v){ const h = tH(it.v, fs, iw, 1.45, 700); E.push(T(px, y, iw, h + 2, it.v, {size: fs, bold: true, color: hi ? K.p : C.ink, lh: 1.45, keepColor: true})); y += h + 14; }
        if (o.label && L.length){ E.push(T(px, y, iw, 16, o.label, {size: 11.5, bold: true, color: C.ink})); y += 22; }
        L.forEach(l => { const h = tH(l, fs - .5, iw, 1.55, 400); if (y + h > cy + ch - 8) return; E.push(T(px, y, iw, h + 2, l, {size: fs - .5, color: C.sub, lh: 1.55, wt: 400})); y += h + 4; });
      }
    });
  },
  rfCriteria(E, items, b, P, pg, K = K3(P, pg)){ return REFL.rfPhase(E, items, b, P, pg, K, {num: true, hi: -1}); },

  /* p32: 큰 번호 01~ 라운드 패널 카드 + 화살표 */
  rfNumCards(E, items, b, P, pg, K = K3(P, pg)){
    const C = RFC(K), its = items.slice(0, 5), n = its.length || 1, ag = 28, cw = (b.w - (n - 1) * ag) / n, iw = cw - 40;
    const need = f => Math.max(...its.map(it => 50 + tH(it.h, 18, iw, 1.3, 700) + 30 + rfLn(it.d).reduce((a, l) => a + tH(l, f, iw, 1.5, 400) + 6, 0) + (it.v ? 40 : 0))) + 30;
    const fs = rfFit(need, b.h, 14, 11), ch = Math.min(b.h, Math.max(need(fs) + 20, b.h * .82)), y0 = b.y + (b.h - ch) * .4;
    its.forEach((it, i) => {
      const x = b.x + i * (cw + ag);
      E.push(R(x, y0, cw, ch, C.panel, {r: 12, line: K.dark ? '#444444' : '#E8E8E8'}));
      if (i < n - 1) rfTriR(E, K, x + cw + ag / 2, y0 + ch / 2, 12);
      let y = y0 + 26;
      E.push(T(x + 20, y, iw, 34, two(i + 1), {size: 28, wt: 500, color: K.p, lh: 1, keepColor: true})); y += 40;
      const ttl = String(it.h || '').replace(/^\s*(\d+|STEP\s*\d+)[.)]?\s*/i, ''), th = tH(ttl, 18, iw, 1.3, 700); E.push(T(x + 20, y, iw, th + 2, ttl, {size: 18, bold: true, color: C.ink, lh: 1.3})); y += th + 14;
      E.push(R(x + 20, y, 22, 2, C.mute)); y += 16;
      rfLn(it.d).forEach(l => { const [hd, tl] = rfHead(l), h = tH(l, fs, iw, 1.5, 400); if (y + h > y0 + ch - (it.v ? 40 : 14)) return;
        if (tl){ E.push(T(x + 20, y, iw, 16, hd, {size: fs - 1.5, bold: true, color: C.ink})); const h2 = tH(tl, fs, iw, 1.5, 400); E.push(T(x + 20, y + 18, iw, h2 + 2, tl, {size: fs, color: C.sub, lh: 1.5, wt: 400})); y += 18 + h2 + 10; }
        else { E.push(T(x + 20, y, iw, h + 2, l, {size: fs, color: C.sub, lh: 1.5, wt: 400})); y += h + 6; } });
      if (it.v) E.push(T(x + 20, y0 + ch - 34, iw, 18, it.v, {size: 12, color: C.mute, minScale: .6}));
    });
  },

  /* p34: 베이지 헤더 + 긴 테두리 카드, [라벨] 목록 */
  rfChannel(E, items, b, P, pg, K = K3(P, pg)){
    const C = RFC(K), its = items.slice(0, 6), n = its.length || 1, g = 10, cw = (b.w - (n - 1) * g) / n, hh = 28, iw = cw - 28;
    const rows = it => rfLn(it.d).map(l => { const m = l.match(/^\[(.+?)\]\s*(.*)$/); if (m) return [m[1], m[2]]; const [hd, tl] = rfHead(l); return tl ? [hd, tl] : ['', l]; });
    const need = f => Math.max(...its.map(it => rows(it).reduce((a, [hd, tl]) => a + (hd ? 20 : 0) + tH(tl, f, iw, 1.5, 400) + 10, 0) + (it.v ? 30 : 0))) + 30;
    const fs = rfFit(need, b.h - hh - 8, 13.5, 10.5);
    its.forEach((it, i) => {
      const x = b.x + i * (cw + g);
      E.push(R(x, b.y, cw, hh, C.beige)); E.push(T(x + 8, b.y, cw - 16, hh, it.h || '', {size: 12.5, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .6}));
      const cy = b.y + hh + 8, ch = b.h - hh - 8; rfBox(E, K, x, cy, cw, ch, {r: 4});
      let y = cy + 16;
      rows(it).forEach(([hd, tl]) => { const h = tH(tl, fs, iw, 1.5, 400); if (y + h + (hd ? 20 : 0) > cy + ch - (it.v ? 30 : 8)) return;
        if (hd){ E.push(T(x + 14, y, iw, 18, `[${hd}]`, {size: fs - .5, bold: true, color: C.ink, minScale: .7})); y += 20; }
        E.push(T(x + 14, y, iw, h + 2, tl, {size: fs, color: C.sub, lh: 1.5, wt: 400})); y += h + 10; });
      if (it.v) E.push(T(x + 14, cy + ch - 28, iw, 18, it.v, {size: 12, bold: true, color: K.acc, minScale: .6, keepColor: true}));
    });
  },

  /* p37: 겹친 원 사이클 + 기대효과 (외곽 필 → ▶ → 채운 바) */
  rfCycle(E, items, b, P, pg, K = K3(P, pg)){
    const C = RFC(K), its = items.slice(0, 5), n = its.length || 1, lw = Math.round(b.w * .4), rx = b.x + lw + 28, rw = b.w - lw - 28;
    rfBand(E, K, b.x, b.y, lw, pg.tag || '단계별 사이클'); rfBand(E, K, rx, b.y, rw, '기대효과');
    const cap = pg.keyMsg || '', capH = cap ? Math.min(70, tH(cap, 15, lw - 40, 1.4, 700) + 6) : 0;
    const ov = .2, d = Math.min(150, (lw - 44) / (n - (n - 1) * ov), b.h - 36 - capH - 60), tot = n * d - (n - 1) * d * ov, cy = b.y + 36 + (b.h - 36 - capH - 24 - d) * .45 + d / 2, x0 = b.x + (lw - tot) / 2;
    E.push(R(b.x + 4, cy - d / 2 - 14, lw - 8, d + 28, '#FFFFFF', {nofill: true, r: (d + 28) / 2, line: C.line}));
    its.forEach((it, i) => { const x = x0 + i * d * (1 - ov); E.push(EL(x, cy - d / 2, d, d, '#FFFFFF', {nofill: true, line: K.dark ? '#BBBBBB' : '#444444', lw: 1}));
      E.push(T(x + d * .14, cy - d / 2, d * .72, d, it.h || '', {size: Math.min(15, d * .12), wt: 500, color: C.ink, align: 'center', valign: 'middle', lh: 1.3, minScale: .6})); });
    if (cap) E.push(T(b.x + 20, cy + d / 2 + 30, lw - 40, capH, cap, {size: 15, bold: true, color: C.ink, align: 'center', lh: 1.4, minScale: .7}));
    const top = b.y + 40, rh = Math.min(52, (b.h - 40) / n), gap = Math.max(8, ((b.h - 40) - rh * n) / Math.max(1, n));
    its.forEach((it, i) => { const y = top + gap / 2 + i * (rh + gap * (n > 1 ? (n - 1) / n : 0)), pw = Math.min(170, rw * .34), h = Math.min(32, rh);
      E.push(R(rx, y, pw, h, C.box, {r: 4, line: K.dark ? '#BBBBBB' : '#333333'})); E.push(T(rx + 8, y, pw - 16, h, `${two(i + 1)}. ${it.h || ''}`, {size: 12.5, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .6}));
      rfTriR(E, K, rx + pw + 18, y + h / 2, 12);
      const f = i === n - 1 ? K.pDark : mix(K.p, K.dark ? '#2A2A2A' : '#FFFFFF', Math.max(.2, .5 - i * .1)), bx = rx + pw + 36;
      E.push(R(bx, y, rx + rw - bx, h, f, {r: 3})); E.push(T(bx + 12, y, rx + rw - bx - 24, h, rfLn(it.d)[0] || it.v || '', {size: 12.5, bold: true, color: onC(f), align: 'center', valign: 'middle', minScale: .55, keepColor: true})); });
  },

  /* p28~30: 세그먼트 카드(이미지 + 아이콘 행) + 2×2 체크 카드 */
  rfPersona(E, items, b, P, pg, K = K3(P, pg)){
    const C = RFC(K), f0 = items[0] || {}, rest = items.slice(1, 5), lw = Math.round(b.w * .31), rx = b.x + lw + 22, rw = b.w - lw - 22;
    let y = rfBand(E, K, b.x, b.y, lw, f0.h || '핵심 카드'); rfBand(E, K, rx, b.y, rw, pg.tag || '세부 포인트');
    const ih = Math.round((b.h - 36) * .34), img = pg.image || pg.img;
    if (img?.data || typeof img === 'string') E.push(IM(b.x, y, lw, ih, img.data || img, {cover: true, nw: img.w, nh: img.h}));
    else E.push(R(b.x, y, lw, ih, K.dark ? '#3A3A3A' : '#E9E9E9', {...(EXPORTING ? {} : {line: '#C9C9C9', dash: true})}));
    y += ih + 12;
    const L = rfLn(f0.d), rows = [f0.v ? ['', f0.v + (L[0] && !rfHead(L[0])[1] ? '  ' + L.shift() : '')] : null, ...L.map(l => rfHead(l))].filter(Boolean).slice(0, 3), rh = (b.y + b.h - y) / Math.max(1, rows.length);
    rows.forEach(([hd, tl], i) => { const yy = y + i * rh;
      E.push(EL(b.x + 4, yy + 10, 22, 22, K.dark ? '#555555' : '#E4E4E4')); E.push(EL(b.x + 11, yy + 17, 8, 8, K.p));
      if (i) E.push(R(b.x, yy - 6, lw, 1, C.line));
      if (!hd && i === 0){ const [big, ...more] = tl.split(/\s{2,}/); E.push(T(b.x + 38, yy + 2, lw - 38, 30, big, {size: 22, bold: true, color: C.ink, minScale: .5})); if (more.length) E.push(T(b.x + 38, yy + 34, lw - 38, 18, more.join(' '), {size: 12, color: C.sub, minScale: .6})); return; }
      if (tl) E.push(T(b.x + 38, yy + 2, lw - 38, 16, hd, {size: 11.5, color: C.mute}));
      const chips = (tl || hd).split(/\s*[,·/]\s*/).filter(Boolean).slice(0, 3), cwid = (lw - 38 - (chips.length - 1) * 6) / Math.max(1, chips.length);
      chips.forEach((c, k) => { const cx = b.x + 38 + k * (cwid + 6); const cy2 = tl ? yy + 22 : yy + 8; E.push(R(cx, cy2, cwid, 26, C.soft, {r: 13})); E.push(T(cx + 6, cy2, cwid - 12, 26, c, {size: 11.5, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .55})); }); });
    const cols = rest.length > 2 ? 2 : rest.length || 1, rws = Math.ceil(rest.length / cols) || 1, g = 12, cw = (rw - (cols - 1) * g) / cols, ch = (b.h - 36 - (rws - 1) * g) / rws;
    rest.forEach((it, i) => { const x = rx + (i % cols) * (cw + g), yy = b.y + 36 + Math.floor(i / cols) * (ch + g), iw = cw - 40;
      E.push(R(x, yy, cw, ch, K.dark ? '#333333' : mix(K.p, '#FFFFFF', .95), {r: 4}));
      E.push(T(x + 20, yy + 16, iw, 18, it.h || '', {size: 13, bold: true, color: C.ink}));
      const LL = rfLn(it.d).concat(it.v ? [it.v] : []), fs = rfFit(f => LL.reduce((a, l) => a + tH(l, f, iw - 18, 1.45, 400) + 6, 0), ch - 56, 13, 10.5); let y2 = yy + 44;
      LL.forEach(l => { const h = tH(l, fs, iw - 18, 1.45, 400); if (y2 + h > yy + ch - 8) return; E.push(T(x + 20, y2, 16, 18, '✓', {size: fs, bold: true, color: K.p, keepColor: true})); E.push(T(x + 38, y2, iw - 18, h + 2, l, {size: fs, color: C.sub, lh: 1.45, wt: 400})); y2 += h + 6; }); });
  },

  /* p50: 왼쪽 화면 흐름 / 오른쪽 STEP 스택 */
  rfStepForm(E, items, b, P, pg, K = K3(P, pg)){
    const C = RFC(K), its = items.slice(0, 5), lw = Math.round(b.w * .42), rx = b.x + lw + 28, rw = b.w - lw - 28;
    rfBand(E, K, b.x, b.y, lw, pg.tag || '전환 흐름'); rfBand(E, K, rx, b.y, rw, '단계별 실행');
    const fh = b.h - 50, fw = Math.min(170, fh * .5), gx = (lw - fw * 2) / 3;
    rfFrame(E, K, P, pg, 0, b.x + gx, b.y + 44, fw, fh, '지면'); rfFrame(E, K, P, pg, 1, b.x + gx * 2 + fw, b.y + 44, fw, fh, '랜딩');
    E.push(SH('arrow', b.x + gx + fw + 6, b.y + 44 + fh / 2 - 14, gx - 12, 28, C.tri));
    const n = its.length || 1, sh = Math.min(64, (b.h - 44 - (n - 1) * 16) / n), sw = 150;
    its.forEach((it, i) => { const y = b.y + 44 + i * (sh + 16);
      E.push(R(rx, y, sw, sh, K.dark ? '#444444' : '#E9E9E9', {r: 8})); E.push(T(rx + 8, y + 6, sw - 16, 20, `STEP ${i + 1}`, {size: 14, bold: true, color: C.ink, align: 'center'})); E.push(T(rx + 8, y + 26, sw - 16, sh - 30, it.h || '', {size: 12, color: C.sub, align: 'center', minScale: .6}));
      if (i < n - 1) rfTriD(E, K, rx + sw / 2, y + sh + 2, 30, 12);
      E.push(T(rx + sw + 24, y, rw - sw - 24, sh, [it.v, rfLn(it.d).join(' · ')].filter(Boolean).join('\n'), {size: 13, color: C.sub, valign: 'middle', lh: 1.45, minScale: .65})); });
  },

  /* ---------- 매체 전략 5종 (p8·p10·p17·p19·p33) ---------- */
  rfMediaEffect(E, items, b, P, pg, K = K3(P, pg)){ // 노출 지면 + 타겟팅 벤 + 기대효과 스택
    const C = RFC(K), M = mParts(items), lw = Math.round(b.w * .63), rx = b.x + lw + 26, rw = b.w - lw - 26, bot = b.y + b.h;
    const bud = M.bud ? rfLn(M.bud.d)[0] : '';
    const y1 = rfBand(E, K, b.x, b.y, lw, `${pg.tag || (pg.mediaName || '매체') + ' 운영 구조'}${bud ? '  ·  ' + bud : ''}`); rfBand(E, K, rx, b.y, rw, '기대효과');
    const c1w = Math.round(lw * .44), c2x = b.x + c1w + 22, c2w = lw - c1w - 22;
    rfPill(E, K, b.x, y1, c1w, 28, '매체 내 노출 지면'); rfPill(E, K, c2x, y1, c2w, 28, M.tgt?.h || '타겟팅 어프로치');
    const fy = y1 + 40, fw = (c1w - 16) / 2, fh = bot - fy - 22, img = pg.image || pg.img, labs = ['대표 지면', '확장 지면'];
    [0, 1].forEach(k => { const x = b.x + k * (fw + 16);
      E.push(T(x, fy, fw, 16, `[${labs[k]}]`, {size: 11.5, color: C.sub, align: 'center'}));
      E.push(R(x, fy + 22, fw, fh, C.box, {r: 10, line: C.line})); E.push(R(x + 10, fy + 32, fw - 20, 8, K.dark ? '#444444' : '#EDEDED', {r: 4}));
      if (k === 0 && img && (img.data || typeof img === 'string')) E.push(IM(x + 8, fy + 48, fw - 16, fh - 56, img.data || img, {cover: true, nw: img.w, nh: img.h, r: 6}));
      else { E.push(R(x + 8, fy + 48, fw - 16, fh - 56, K.dark ? '#3A3A3A' : '#F3F3F3', {r: 6})); if (!EXPORTING) E.push(T(x + 8, fy + 48, fw - 16, fh - 56, '지면 이미지', {size: 11, color: C.mute, align: 'center', valign: 'middle'})); } });
    const TL = rfLn(M.tgt?.d), XL = rfLn(M.exe?.d), PL = rfLn(M.pair?.d);
    const chips = XL.slice(0, 3).map(l => rfShort(l, 12)), resT = PL.slice(0, 2).join('\n') || pg.keyMsg || '';
    const resH = Math.max(52, Math.min(80, tH(resT, 13, c2w - 30, 1.45, 700) + 22)), vy = fy, avail = bot - vy - (chips.length ? 42 : 0) - resH - 18, d = Math.max(80, Math.min(170, avail, c2w * .52));
    const cx = c2x + c2w / 2, cyy = vy + d / 2 + Math.max(0, (avail - d) / 2);
    const vl = [TL[0] ? rfShort(TL[0], 16) : '핵심 타겟', TL[1] ? rfShort(TL[1], 16) : '확장 타겟'];
    E.push(EL(cx - d * .82, cyy - d / 2, d, d, mix(K.p, K.dark ? '#2A2A2A' : '#FFFFFF', .35), {alpha: .92}));
    E.push(EL(cx - d * .18, cyy - d / 2, d, d, mix(K.p, K.dark ? '#2A2A2A' : '#FFFFFF', .62), {alpha: .85}));
    E.push(T(cx - d * .78, cyy - 30, d * .55, 60, vl[0], {size: 14, lh: 1.3, bold: true, color: '#FFFFFF', align: 'center', valign: 'middle', minScale: .55, keepColor: true}));
    E.push(T(cx + d * .23, cyy - 30, d * .55, 60, vl[1], {size: 14, lh: 1.3, bold: true, color: K.dark ? '#FFFFFF' : '#2B2B2B', align: 'center', valign: 'middle', minScale: .55, keepColor: true}));
    let y = cyy + d / 2 + 14;
    if (chips.length){ const g = 20, cw = (c2w - (chips.length - 1) * g) / chips.length;
      chips.forEach((c, i) => { const x = c2x + i * (cw + g); E.push(R(x, y, cw, 28, C.box, {r: 3, line: K.dark ? '#888888' : '#444444'})); E.push(T(x + 6, y, cw - 12, 28, c, {size: 12, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .55}));
        if (i < chips.length - 1) E.push(T(x + cw, y, g, 28, '→', {size: 13, bold: true, color: C.sub, align: 'center', valign: 'middle'})); });
      y += 42; }
    const ry = Math.max(y, bot - resH); E.push(R(c2x, ry, c2w, bot - ry, K.dark ? '#3A3A3A' : mix(K.p, '#FFFFFF', .88), {r: 4, line: C.line}));
    E.push(T(c2x + 15, ry, c2w - 30, bot - ry, resT, {size: 13, bold: true, color: C.ink, align: 'center', valign: 'middle', lh: 1.45, minScale: .6}));
    // 기대효과
    const fx = [M.tgt, M.exe, M.scale, ...M.rest].filter(Boolean).slice(0, 3).map(it => [it.h, rfLn(it.d)[0] || it.v || '']);
    const fin1 = pg.keyMsg || (M.kpi ? rfLn(M.kpi.d)[0] || M.kpi.h : ''), fin2 = M.kpi?.v || '', finH = fin2 ? 84 : 60;
    const area = bot - y1 - finH - 30, k = fx.length || 1, bh = Math.min(84, (area - (k - 1) * 12) / k), gy = k > 1 ? (area - bh * k) / (k - 1) : 0;
    fx.forEach(([t, s], i) => { const yy = y1 + i * (bh + gy); rfBox(E, K, rx, yy, rw, bh, {r: 10});
      E.push(T(rx + 16, yy + bh / 2 - 22, rw - 32, 20, t, {size: 14, bold: true, color: C.ink, align: 'center', minScale: .6})); E.push(T(rx + 16, yy + bh / 2, rw - 32, bh / 2 - 6, s, {size: 12, color: C.sub, align: 'center', lh: 1.4, minScale: .6})); });
    const fy2 = bot - finH; rfTriD(E, K, rx + rw / 2, fy2 - 18, 36, 13);
    rfBox(E, K, rx, fy2, rw, finH, {r: 10});
    E.push(T(rx + 16, fy2 + 10, rw - 32, fin2 ? 36 : finH - 20, fin1, {size: 13.5, lh: 1.35, bold: true, color: C.ink, align: 'center', valign: fin2 ? 'top' : 'middle', minScale: .55}));
    if (fin2) E.push(T(rx + 16, fy2 + 50, rw - 32, 26, fin2, {size: 17, bold: true, color: K.p, align: 'center', minScale: .55, keepColor: true}));
  },
  rfAdset(E, items, b, P, pg, K = K3(P, pg)){ // 상단 필드 + 애드셋 컬럼(필 헤더 · 스택 카드), 강조 컬럼
    const C = RFC(K), M = mParts(items), bot = b.y + b.h;
    let y = rfBand(E, K, b.x, b.y, b.w, pg.tag || '캠페인 / 타겟 구조');
    const fields = [['KPI', M.kpi?.v || rfLn(M.kpi?.d)[0]], ['예산', M.bud ? rfLn(M.bud.d)[0] : ''], ['증감', M.scale ? rfShort(rfLn(M.scale.d)[0] || '', 22) : '']].filter(f => f[1]);
    if (fields.length){ const fw = Math.min(330, (b.w * .86 - (fields.length - 1) * 14) / fields.length), x0 = b.x + (b.w - (fields.length * fw + (fields.length - 1) * 14)) / 2;
      fields.forEach(([l, v], i) => { const x = x0 + i * (fw + 14); E.push(T(x, y, 44, 28, l, {size: 11.5, color: C.mute, valign: 'middle'})); E.push(R(x + 46, y, fw - 46, 28, C.box, {r: 3, line: C.line})); E.push(T(x + 56, y, fw - 66, 28, v, {size: 13, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .5})); });
      y += 42; }
    const TL = rfLn(M.tgt?.d), XL = rfLn(M.exe?.d), PL = rfLn(M.pair?.d);
    let cols = TL.length >= 2 ? TL.slice(0, 4).map((t, i) => ({h: rfShort(t, 18), a: rfHead(t)[1] || t, x: XL[i % Math.max(1, XL.length)] || '', p: PL[i % Math.max(1, PL.length)] || ''}))
      : items.filter(i => !isBudget(i.h)).slice(0, 4).map(it => { const L = rfLn(it.d); return {h: it.h, a: it.v || L[0] || '', x: L.slice(it.v ? 0 : 1, 3).join('\n'), p: L.slice(3).join('\n')}; });
    const n = cols.length || 1, g = 14, cw = (b.w - (n - 1) * g) / n, hiI = n >= 3 ? 1 : 0, ch = bot - y - 40, iw = cw - 24;
    const parts = [['세그먼트', 'a', .3], [M.exe?.h || '운영 실행안', 'x', .35], [M.pair?.h || '타겟 × 소재', 'p', .35]];
    cols.forEach((c, i) => { const x = b.x + i * (cw + g), hi = i === hiI;
      rfPill(E, K, x, y, cw, 30, `${TL.length >= 2 ? '타겟 ' + CIRC[i] + '  ' : ''}${c.h}`, hi);
      let yy = y + 40; parts.forEach(([lab, key, r], k) => { const hh = (ch - 16) * r; rfBox(E, K, x, yy, cw, hh, {r: 4, hi: hi && k === 0});
        E.push(T(x + 12, yy + 8, iw, 16, lab, {size: 11.5, bold: true, color: C.ink, align: 'center', minScale: .6}));
        E.push(T(x + 12, yy + 28, iw, hh - 34, c[key] || '-', {size: 12.5, color: C.sub, lh: 1.45, wt: 400, minScale: .6})); yy += hh + 8; }); });
  },
  rfTwoType(E, items, b, P, pg, K = K3(P, pg)){ // 좌: 필 헤더 2종 표 / 우: 흐름 칩 + 판단 기준 행
    const C = RFC(K), M = mParts(items), lw = Math.round(b.w * .58), rx = b.x + lw + 26, rw = b.w - lw - 26, bot = b.y + b.h;
    const y1 = rfBand(E, K, b.x, b.y, lw, pg.tag || '타겟팅 · 소재 운영 구조'); rfBand(E, K, rx, b.y, rw, M.exe?.h || '운영 실행안');
    const sw = (lw - 18) / 2, specs = [[M.tgt, l => rfHead(l)], [M.pair, l => { const s = l.split(/\s*→\s*/); return s.length > 1 ? [s[0], s.slice(1).join(' → ')] : rfHead(l); }]];
    specs.forEach(([it, sp], k) => { const x = b.x + k * (sw + 18); rfPill(E, K, x, y1, sw, 30, it?.h || (k ? '타겟 × 소재 결합' : '타겟팅 어프로치'));
      const rows = rfLn(it?.d).slice(0, 6).map(sp), by = y1 + 40, bh = bot - by; rfBox(E, K, x, by, sw, bh, {r: 4});
      const rh = Math.min(110, (bh - 20) / Math.max(1, rows.length)), lab = 96;
      rows.forEach(([hd, tl], i) => { const yy = by + 10 + i * rh; if (i) E.push(R(x + 14, yy, sw - 28, 1, K.dark ? '#444444' : '#EEEEEE'));
        if (tl){ E.push(T(x + 16, yy, lab - 8, rh, hd, {size: 12, color: C.mute, valign: 'middle', minScale: .6})); E.push(T(x + 16 + lab, yy, sw - lab - 30, rh, tl, {size: 12.5, color: C.ink, valign: 'middle', lh: 1.4, minScale: .6})); }
        else E.push(T(x + 16, yy, sw - 32, rh, hd, {size: 12.5, color: C.ink, valign: 'middle', lh: 1.4, minScale: .6})); }); });
    const XL = rfLn(M.exe?.d), steps = XL.slice(0, 3).map(l => rfShort(l, 10)), g = 22; let y = y1;
    if (steps.length){ const cw = (rw - (steps.length - 1) * g) / steps.length; steps.forEach((s, i) => { const x = rx + i * (cw + g); E.push(R(x, y, cw, 34, C.beige, {r: 4})); E.push(T(x + 6, y, cw - 12, 34, s, {size: 12.5, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .55})); if (i < steps.length - 1) rfTriR(E, K, x + cw + g / 2, y + 17); }); y += 46; }
    const rows = [...XL.map(l => { const [h, t] = rfHead(l); return [t ? h : '', t || h]; }), M.kpi ? [M.kpi.h, [M.kpi.v, rfLn(M.kpi.d)[0]].filter(Boolean).join(' · ')] : null, M.scale ? [M.scale.h, rfLn(M.scale.d)[0]] : null, M.bud ? [M.bud.h, rfLn(M.bud.d)[0]] : null].filter(Boolean).slice(0, 7);
    rfBox(E, K, rx, y, rw, bot - y, {r: 4}); const rh = Math.min(50, (bot - y - 16) / Math.max(1, rows.length)), lab = 92;
    rows.forEach(([h, t], i) => { const yy = y + 8 + i * rh; if (i) E.push(R(rx + 14, yy, rw - 28, 1, K.dark ? '#444444' : '#EEEEEE')); E.push(T(rx + 16, yy, lab - 8, rh, h, {size: 12, bold: true, color: /KPI|목표/.test(h) ? K.p : C.mute, valign: 'middle', minScale: .6, keepColor: true})); E.push(T(rx + 16 + lab, yy, rw - lab - 30, rh, t || '', {size: 12.5, color: C.ink, valign: 'middle', lh: 1.4, minScale: .6})); });
  },
  rfRule(E, items, b, P, pg, K = K3(P, pg)){ // 상단 화살표 바 + 룰 표(대괄호 연결)
    const C = RFC(K), M = mParts(items), bot = b.y + b.h;
    let y = rfBand(E, K, b.x, b.y, b.w, pg.tag || '운영 · 확장 룰');
    const XL = rfLn(M.exe?.d), ph = (XL.length ? XL : ['착수', '최적화', '확장']).slice(0, 4).map(l => rfShort(l, 14)), aw = b.w - 26, split = .5;
    ph.forEach((p, i) => { const fx = b.x + 30 + i * (aw - 60) / Math.max(1, ph.length - 1 || 1) * (ph.length > 1 ? 1 : 0); E.push(T(fx - 70, y, 140, 16, p, {size: 12, color: C.sub, align: 'center', minScale: .6})); E.push(SH('tri', fx - 7, y + 22, 14, 9, i / Math.max(1, ph.length - 1) >= split ? K.pDark : C.beige)); });
    E.push(R(b.x, y + 31, aw * split, 16, C.beige)); E.push(R(b.x + aw * split, y + 31, aw * (1 - split), 16, K.pDark)); E.push(SH('triR', b.x + aw, y + 25, 26, 28, K.pDark));
    y += 66;
    const rows = [M.kpi, M.tgt, M.pair, M.scale].filter(Boolean).map(it => { const L = rfLn(it.d); return {h: it.h, a: it.v || L[0] || '', s: (it.v ? L : L.slice(1)).slice(0, 3)}; }).filter(r => r.a);
    const c1 = 140, c2 = Math.round(b.w * .3), c3x = b.x + c1 + 10 + c2 + 36, c3w = b.x + b.w - c3x, hh = 28;
    [['구분', b.x, c1], ['핵심', b.x + c1 + 10, c2], ['세부 실행', c3x, c3w]].forEach(([t, x, w]) => { E.push(R(x, y, w, hh, C.beige)); E.push(T(x, y, w, hh, t, {size: 12.5, bold: true, color: C.ink, align: 'center', valign: 'middle'})); });
    y += hh + 8; const tot = rows.reduce((a, r) => a + Math.max(1, r.s.length), 0), unit = Math.min(44, (bot - y - (rows.length - 1) * 8) / Math.max(1, tot));
    rows.forEach(r => { const k = Math.max(1, r.s.length), rh = unit * k + (k - 1) * 4;
      E.push(R(b.x, y, c1, rh, C.panel, {line: C.line})); E.push(T(b.x + 8, y, c1 - 16, rh, r.h, {size: 13, bold: true, color: C.ink, align: 'center', valign: 'middle', minScale: .6}));
      E.push(R(b.x + c1 + 10, y, c2, rh, C.box, {line: C.line})); E.push(T(b.x + c1 + 22, y, c2 - 24, rh, r.a, {size: 12.5, bold: true, color: C.ink, align: 'center', valign: 'middle', lh: 1.4, minScale: .55}));
      const bx = b.x + c1 + 10 + c2; E.push(R(bx, y + rh / 2, 14, 1, C.tri));
      if (k > 1){ E.push(R(bx + 14, y + unit / 2, 1, rh - unit, C.tri)); }
      (r.s.length ? r.s : ['']).forEach((s, i) => { const yy = y + i * (unit + 4); E.push(R(bx + 14, yy + unit / 2, 22, 1, C.tri)); E.push(R(c3x, yy, c3w, unit, C.box, {line: C.line})); E.push(T(c3x + 12, yy, c3w - 24, unit, s, {size: 12.5, color: C.ink, align: 'center', valign: 'middle', minScale: .55})); });
      y += rh + 8; });
  },
  rfPhaseMedia(E, items, b, P, pg, K = K3(P, pg)){ // 매체 단계형: 타겟팅 → 실행 → 결합 → KPI(강조)
    const M = mParts(items), cols = [M.tgt, M.exe, M.pair, M.scale].filter(Boolean).map(it => ({h: it.h, d: it.d})), kpi = M.kpi ? {h: M.kpi.h, v: M.kpi.v, d: M.kpi.d} : null;
    const all = kpi ? [...cols.slice(0, 3), kpi] : cols; return REFL.rfPhase(E, all.length ? all : items, b, P, pg, K, {hi: kpi ? all.length - 1 : -1});
  },

  /* ---------- 크리에이티브 (p38~p43) ---------- */
  rfMock(E, items, b, P, pg, K = K3(P, pg)){ // 2~3열: 제목 · 설명 · 연결선 · 큰 세로 비주얼
    const C = RFC(K), n = pg._orig === 'crAB' ? 2 : 3, g = 44, cw = (b.w - (n - 1) * g) / n;
    for (let i = 0; i < n; i++){ const it = items[i] || {}, x = b.x + i * (cw + g), t = it.h || (n === 2 ? (i ? 'B안' : 'A안') : `소재 ${i + 1}`), dsc = [it.v, rfLn(it.d).join(' ')].filter(Boolean).join('\n');
      E.push(T(x, b.y, cw, 24, t, {size: 18, bold: true, color: C.ink, align: 'center', minScale: .6}));
      E.push(T(x + 20, b.y + 30, cw - 40, 40, dsc, {size: 12.5, color: C.sub, align: 'center', lh: 1.4, minScale: .6}));
      const iy = b.y + 98, ih = b.y + b.h - iy, iw = Math.min(cw * .92, ih * (n === 2 ? 1.25 : .82));
      E.push(R(x + cw / 2, b.y + 76, 1, iy - b.y - 80, C.sub)); E.push(EL(x + cw / 2 - 3, b.y + 73, 6, 6, C.sub));
      rfSlot(E, K, P, pg, i, x + (cw - iw) / 2, iy, iw, ih, {label: t, video: true, r: 2}); }
  },
  rfPhoneFlow(E, items, b, P, pg, K = K3(P, pg)){ // 좌: 카피 카드 스택 / 우: 휴대폰 3단 흐름 + 라벨·연결선
    const C = RFC(K), lw = 250, its = items.slice(0, 3), ch = Math.min(84, (b.h - 60 - (its.length - 1) * 10) / Math.max(1, its.length)), cy0 = b.y + 60 + (b.h - 60 - (ch * its.length + (its.length - 1) * 10)) / 2;
    its.forEach((it, i) => { const y = cy0 + i * (ch + 10); E.push(R(b.x, y, lw, ch, '#FFFFFF', {r: 2}));
      E.push(T(b.x + 12, y + 10, lw - 100, 20, it.h || '', {size: 13, bold: true, color: '#1E1E1E', minScale: .6, keepColor: true})); E.push(T(b.x + 12, y + 32, lw - 100, ch - 40, rfLn(it.d).join(' '), {size: 11, color: '#666666', lh: 1.4, minScale: .6, keepColor: true}));
      E.push(R(b.x + lw - 82, y + 10, 72, ch - 20, '#E4E4E4', {r: 2})); });
    const area = b.w - lw - 30, pw = Math.min(190, (area - 2 * 60) / 3), ph = Math.min(b.h - 60, pw * 2), gap = (area - pw * 3) / 3, labs = [its[0]?.h ? (its[0].v || '노출 지면') : '노출 지면', '상세 뷰', '랜딩 · 폼'];
    for (let i = 0; i < 3; i++){ const x = b.x + lw + 30 + gap / 2 + i * (pw + gap), y = b.y + b.h - ph;
      E.push(T(x - 20, b.y, pw + 40, 22, labs[i], {size: 15, bold: true, color: C.ink, align: 'center', minScale: .6})); E.push(R(x + pw / 2, b.y + 28, 1, y - b.y - 34, C.sub)); E.push(SH('tri', x + pw / 2 - 4, b.y + 26, 8, 6, C.sub));
      if (i < 2) rfFrame(E, K, P, pg, i, x, y, pw, ph, labs[i]);
      else { E.push(R(x, y, pw, ph, '#111111', {r: 24})); E.push(R(x + 6, y + 6, pw - 12, ph - 12, '#FFFFFF', {r: 18})); E.push(R(x + pw / 2 - 20, y + 10, 40, 9, '#111111', {r: 4.5}));
        E.push(T(x + 18, y + 34, pw - 36, 18, S.project.client || '', {size: 11, bold: true, color: '#1E1E1E', keepColor: true}));
        for (let k = 0; k < 5; k++){ E.push(R(x + 18, y + 62 + k * 30, pw - 36, 18, '#EFEFEF', {r: 3})); }
        E.push(R(x + 6, y + ph - 48, pw - 12, 42, K.p, {r: 0})); E.push(T(x + 6, y + ph - 48, pw - 12, 42, its[1]?.h || '신청하기', {size: 12, bold: true, color: onC(K.p), align: 'center', valign: 'middle', minScale: .6, keepColor: true})); }
      if (i < 2) E.push(SH('chevron', x + pw + gap / 2 - 9, y + ph / 2 - 20, 18, 40, C.tri)); }
  },
  rfMatrix(E, items, b, P, pg, K = K3(P, pg)){ // p38: 좌 메시지 매트릭스 표 / 우 2×2 소재 썸네일
    const C = RFC(K), lw = Math.round(b.w * .6), its = items.slice(0, 6), hh = 28, cws = [.22, .26, .52].map(r => r * lw), hdr = ['소재', '매체 · 규격', '메시지'];
    let x = b.x; hdr.forEach((h, i) => { E.push(R(x, b.y, cws[i] - 2, hh, C.beige)); E.push(T(x, b.y, cws[i] - 2, hh, h, {size: 12, bold: true, color: C.ink, align: 'center', valign: 'middle'})); x += cws[i]; });
    const rh = (b.h - hh - 6) / Math.max(1, its.length);
    its.forEach((it, r) => { const y = b.y + hh + 6 + r * rh; E.push(R(b.x, y + rh - 1, lw - 2, 1, C.line)); let xx = b.x;
      [it.h, it.v, rfLn(it.d).join('\n')].forEach((t, i) => { E.push(T(xx + 10, y, cws[i] - 22, rh, t || '', {size: i ? 12 : 12.5, bold: !i, color: i ? C.sub : C.ink, valign: 'middle', lh: 1.4, minScale: .55})); xx += cws[i]; }); });
    const rx = b.x + lw + 24, rw = b.w - lw - 24, g = 12, tw = (rw - g) / 2, th = (b.h - g) / 2;
    for (let k = 0; k < 4; k++) rfSlot(E, K, P, pg, k, rx + (k % 2) * (tw + g), b.y + Math.floor(k / 2) * (th + g), tw, th, {label: items[k]?.h || `소재 ${k + 1}`, video: true, r: 4});
  },
  rfPhones(E, items, b, P, pg, K = K3(P, pg)){ // p43: 매체별 휴대폰 화면 나열 + 상단 라벨
    const C = RFC(K), n = Math.max(3, Math.min(6, items.length || 3)), g = 16, pw = Math.min(180, (b.w - (n - 1) * g) / n), ph = Math.min(b.h - 70, pw * 2.05), x0 = b.x + (b.w - (n * pw + (n - 1) * g)) / 2;
    for (let i = 0; i < n; i++){ const it = items[i] || {}, x = x0 + i * (pw + g);
      E.push(T(x, b.y, pw, 22, it.h || `지면 ${i + 1}`, {size: 15, bold: true, color: C.ink, align: 'center', minScale: .6}));
      rfFrame(E, K, P, pg, i, x, b.y + 32, pw, ph, it.h || `지면 ${i + 1}`);
      const t = [it.v, rfLn(it.d)[0]].filter(Boolean).join(' · '); if (t) E.push(T(x, b.y + 40 + ph, pw, b.y + b.h - (b.y + 40 + ph), t, {size: 11.5, color: C.sub, align: 'center', lh: 1.4, minScale: .6})); }
  }
};
Object.assign(LAY, REFL);
const REF_OWN = ['rfCycle', 'rfMediaEffect', 'rfPersona', 'rfStepForm', 'rfTwoType', 'rfRule', 'rfAdset']; // 자체 띠·결론을 그림
const REF_KEYSELF = ['rfCycle', 'rfMediaEffect'];
const REF_IMG = ['rfPersona', 'rfMediaEffect', 'rfStepForm'];
const REF_DARK = ['crHero', 'crFeed', 'crShorts', 'crAB', 'crStory'];
/* 기존 레이아웃 → 같은 내용 구조의 레퍼런스 배치 */
function refMap(lay, pg, items){
  const n = items.length, t = `${pg.title || ''} ${pg.tag || ''}`;
  const M = {tkSpec: 'rfMediaEffect', tkFlow: 'rfAdset', tkQuad: 'rfTwoType', tkKpiBoard: 'rfPhaseMedia', tkRoad: 'rfRule',
    crFeed: 'rfPhoneFlow', crShorts: 'rfMock', crAB: 'rfMock', crGrid: 'rfMatrix', crStory: 'rfPhones'};
  if (M[lay]) return M[lay];
  if (lay === 'tkPillCols' && n >= 2 && n <= 5) return 'rfPhase';
  if (lay === 'tkSteps' && n >= 2 && n <= 5) return /폼|랜딩|전환\s*UX|가입|신청 과정/.test(t) ? 'rfStepForm' : 'rfNumCards';
  if (lay === 'tkGrid' && n >= 3 && n <= 6) return 'rfChannel';
  if (lay === 'tkList' && n >= 2 && n <= 4) return 'rfCriteria';
  if (lay === 'tkFunnel' && n >= 3 && n <= 5) return 'rfCycle';
  if (lay === 'tkHero' && n >= 3) return 'rfPersona';
  return lay;
}
if (typeof TK_NAMES !== 'undefined') Object.assign(TK_NAMES, {rfPhase: '레퍼런스: 필 헤더 단계 카드', rfCriteria: '레퍼런스: 기준 카드', rfNumCards: '레퍼런스: 번호 카드', rfChannel: '레퍼런스: 채널 매칭 컬럼', rfCycle: '레퍼런스: 사이클 + 기대효과', rfPersona: '레퍼런스: 세그먼트 카드 + 페르소나', rfStepForm: '레퍼런스: STEP 전환 흐름'});
