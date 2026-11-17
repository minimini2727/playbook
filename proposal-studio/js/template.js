/* =========================================================
   희망 레이아웃(참고 PPT) → 재사용 템플릿 변환
   · 도형 위치·색·배경·이미지를 그대로 옮기고, 텍스트 상자는 내용 칸(slot)으로 변환
   · 원본 문구는 쓰지 않음 (짧은 라벨만 장식으로 유지 가능)
   ========================================================= */
const TPL_TAGS = {body: '본문', divider: '간지', cover: '표지', closing: '클로징'};
async function parseRefPptx(file, opts = {}){
  const PH = {}; // 자리표시자 위치 (레이아웃·마스터 → 슬라이드 상속)
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const pres = await zip.file('ppt/presentation.xml').async('string');
  const sz = pres.match(/sldSz[^>]*cx="(\d+)"[^>]*cy="(\d+)"/) || [0, 12192000, 6858000];
  const KX = W / +sz[1], KY = H / +sz[2];
  const themeXml = await (zip.file('ppt/theme/theme1.xml')?.async('string') || '');
  const scheme = {}; ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'].forEach(k => { const m = themeXml.match(new RegExp(`<a:${k}>[\\s\\S]*?(?:val|lastClr)="([0-9A-Fa-f]{6})"`)); if (m) scheme[k] = '#' + m[1].toUpperCase(); });
  scheme.tx1 = scheme.dk1 || '#000000'; scheme.bg1 = scheme.lt1 || '#FFFFFF'; scheme.tx2 = scheme.dk2; scheme.bg2 = scheme.lt2;
  const P = new DOMParser(), num = n => +n.match(/(\d+)\.xml$/)[1];
  const relsOf = async path => { const rp = path.replace(/([^/]+)$/, '_rels/$1.rels'); const x = await zip.file(rp)?.async('string'); const out = {}; if (x) (x.match(/<Relationship [^>]+>/g) || []).forEach(r => { const id = r.match(/Id="([^"]+)"/)[1], t = r.match(/Target="([^"]+)"/)[1]; out[id] = t; }); return out; };
  const resolve = (base, t) => { const parts = base.split('/').slice(0, -1); t.split('/').forEach(s => s === '..' ? parts.pop() : parts.push(s)); return parts.join('/'); };
  const imgCache = {};
  async function img(path){
    if (imgCache[path] !== undefined) return imgCache[path];
    const f = zip.file(path); if (!f || !/\.(png|jpe?g|gif)$/i.test(path)) return imgCache[path] = null;
    const ext = path.split('.').pop().toLowerCase(), raw = `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,` + await f.async('base64');
    const r = await resizeImage(raw, 1400, ext === 'png' ? 'image/png' : 'image/jpeg'); return imgCache[path] = r;
  }
  const colorOf = el => {
    if (!el) return null;
    const s = el.getElementsByTagName('a:srgbClr')[0]; if (s) return '#' + s.getAttribute('val').toUpperCase();
    const c = el.getElementsByTagName('a:schemeClr')[0]; if (c) return scheme[c.getAttribute('val')] || null;
    return null;
  };
  const kid = (el, tag) => [...el.children].find(c => c.tagName === tag);
  async function walk(tree, path, rels, tf, out, isMaster){
    for (const el of [...tree.children]){
      const tag = el.tagName;
      if (tag === 'p:grpSp'){
        const x = el.getElementsByTagName('a:xfrm')[0]; if (!x) continue;
        const g = k => x.getElementsByTagName(k)[0], off = g('a:off'), ext = g('a:ext'), co = g('a:chOff'), ce = g('a:chExt');
        const sx = +ext.getAttribute('cx') / Math.max(1, +ce.getAttribute('cx')), sy = +ext.getAttribute('cy') / Math.max(1, +ce.getAttribute('cy'));
        const nt = {x: tf.x + (+off.getAttribute('x') - +co.getAttribute('x') * sx) * tf.sx, y: tf.y + (+off.getAttribute('y') - +co.getAttribute('y') * sy) * tf.sy, sx: tf.sx * sx, sy: tf.sy * sy};
        await walk(el, path, rels, nt, out, isMaster); continue;
      }
      if (!['p:sp', 'p:pic', 'p:cxnSp', 'p:graphicFrame'].includes(tag)) continue;
      const ph = el.getElementsByTagName('p:ph')[0], phKey = ph ? [(ph.getAttribute('type') || 'body'), ph.getAttribute('idx') || ''] : null;
      const xf0 = el.getElementsByTagName(tag === 'p:graphicFrame' ? 'p:xfrm' : 'a:xfrm')[0];
      const off0 = xf0?.getElementsByTagName('a:off')[0], ext0 = xf0?.getElementsByTagName('a:ext')[0];
      let box = off0 && ext0 ? {x: (tf.x + +off0.getAttribute('x') * tf.sx) * KX, y: (tf.y + +off0.getAttribute('y') * tf.sy) * KY, w: +ext0.getAttribute('cx') * tf.sx * KX, h: +ext0.getAttribute('cy') * tf.sy * KY} : null;
      if (isMaster && ph){ if (box){ const t = phKey[0] === 'ctrTitle' ? 'title' : phKey[0]; if (phKey[1]) PH['i' + phKey[1]] = PH['i' + phKey[1]] || box; PH['t' + t] = PH['t' + t] || box; } continue; } // 레이아웃·마스터의 자리표시자는 위치만 기억
      if (!box && ph){ const t = phKey[0] === 'ctrTitle' ? 'title' : phKey[0]; box = (phKey[1] && PH['i' + phKey[1]]) || PH['t' + t] || (t === 'title' ? {x: 60, y: 40, w: W - 120, h: 70} : {x: 60, y: 130, w: W - 120, h: 520}); }
      if (!box) continue;
      const isTitlePh = ph && /title/i.test(phKey[0]);
      if (box.w < 1 && box.h < 1) continue;
      if (tag === 'p:graphicFrame'){
        const tbl = el.getElementsByTagName('a:tbl')[0];
        if (!tbl){
          const ch = el.getElementsByTagName('c:chart')[0], rid = ch?.getAttribute('r:id');
          if (rid && rels[rid]){ try { const cx = await zip.file(resolve(path, rels[rid]))?.async('string'); const ce = cx && chartEls(P.parseFromString(cx, 'application/xml'), box, colorOf, scheme); if (ce && ce.length){ out.push(...ce); continue; } } catch(er){ console.warn('chart', er); } }
          out.push({k: 'frame', ...box, chart: !!ch}); continue;
        }
        out.push({k: 'frame', ...box, table: true});
        const cols = [...tbl.getElementsByTagName('a:gridCol')].map(g => +g.getAttribute('w') * tf.sx * KX), rows = [...tbl.getElementsByTagName('a:tr')];
        const rh = rows.map(r => +r.getAttribute('h') * tf.sy * KY), sumH = rh.reduce((a, b) => a + b, 0), kH = sumH ? Math.max(1, box.h / sumH) : 1;
        let y = box.y;
        rows.forEach((r, ri) => { let x = box.x, ci = 0; const h = Math.max(18, rh[ri] * kH);
          [...r.children].filter(c => c.tagName === 'a:tc').forEach(tc => { const span = +tc.getAttribute('gridSpan') || 1, w = cols.slice(ci, ci + span).reduce((a, b) => a + b, 0); ci += span;
            if (tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1'){ x += w; return; }
            const tcPr = tc.getElementsByTagName('a:tcPr')[0], cf = tcPr && kid(tcPr, 'a:solidFill') ? colorOf(kid(tcPr, 'a:solidFill')) : null;
            out.push({k: 'r', x, y, w, h, fill: cf || '#FFFFFF', line: '#D9D9D9'});
            const paras = [...tc.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).filter(Boolean);
            if (paras.length){ const rp = tc.getElementsByTagName('a:rPr')[0], sz = rp?.getAttribute('sz'), al = tc.getElementsByTagName('a:pPr')[0]?.getAttribute('algn');
              out.push({k: 't', x: x + 6, y, w: w - 12, h, raw: paras.join('\n'), size: sz ? Math.round(+sz / 100 / .75 * 10) / 10 : 13, bold: rp?.getAttribute('b') === '1', color: colorOf(rp?.getElementsByTagName('a:solidFill')[0]) || (cf && onC(cf) === '#FFFFFF' ? '#FFFFFF' : '#222222'), align: al === 'ctr' ? 'center' : al === 'r' ? 'right' : 'left', valign: 'middle', lh: 1.3, cell: true}); }
            x += w; });
          y += h; });
        continue;
      }
      if (tag === 'p:pic'){ const b = el.getElementsByTagName('a:blip')[0], rid = b?.getAttribute('r:embed'); if (rid && rels[rid]){ const im = await img(resolve(path, rels[rid])); if (im) out.push({k: 'i', ...box, data: im.data}); } continue; }
      const spPr = kid(el, 'p:spPr') || el.getElementsByTagName('p:spPr')[0];
      const geom = spPr?.getElementsByTagName('a:prstGeom')[0]?.getAttribute('prst') || 'rect';
      const fillEl = spPr && kid(spPr, 'a:solidFill'), noFill = spPr && kid(spPr, 'a:noFill');
      const lnEl = spPr?.getElementsByTagName('a:ln')[0], lnFill = lnEl && !lnEl.getElementsByTagName('a:noFill').length ? colorOf(lnEl.getElementsByTagName('a:solidFill')[0]) : null;
      const fill = noFill ? null : colorOf(fillEl);
      const alphaEl = fillEl?.getElementsByTagName('a:alpha')[0], alpha = alphaEl ? +alphaEl.getAttribute('val') / 1e5 : null;
      if (tag === 'p:cxnSp'){ const c = lnFill || '#C4C4C4'; out.push({k: 'r', x: box.x, y: box.y, w: Math.max(1, box.w), h: Math.max(1, box.h), fill: c}); continue; }
      if (fill || lnFill){
        const sh = {k: geom === 'ellipse' ? 'e' : 'r', ...box, fill: fill || '#FFFFFF', nofill: !fill, line: lnFill, lw: 1, alpha};
        if (geom === 'roundRect') sh.r = Math.min(box.w, box.h) * .16;
        if (geom === 'chevron' || geom === 'homePlate' || geom === 'triangle' || geom === 'rightArrow'){ out.push({k: 's', shape: {chevron: 'chevron', homePlate: 'home', triangle: 'tri', rightArrow: 'arrow'}[geom], ...box, fill: fill || '#C4C4C4'}); }
        else out.push(sh);
      }
      const tx = el.getElementsByTagName('p:txBody')[0];
      if (tx && !isMaster){
        const paras = [...tx.getElementsByTagName('a:p')].map(p => { const t = [...p.getElementsByTagName('a:t')].map(t => t.textContent).join(''); return t && p.getElementsByTagName('a:buChar').length && !/^[•·\-–▪■□○●※]/.test(t) ? '· ' + t : t; }).filter(Boolean);
        if (!paras.length) continue;
        const r = tx.getElementsByTagName('a:rPr')[0] || tx.getElementsByTagName('a:endParaRPr')[0] || tx.getElementsByTagName('a:defRPr')[0];
        const szv = r?.getAttribute('sz'), size = szv ? +szv / 100 / .75 : (isTitlePh ? 30 : 16);
        const ppr = tx.getElementsByTagName('a:pPr')[0], al = ppr?.getAttribute('algn'), anchor = tx.getElementsByTagName('a:bodyPr')[0]?.getAttribute('anchor');
        const latin = r?.getElementsByTagName('a:latin')[0]?.getAttribute('typeface') || '';
        const bold = isTitlePh && r?.getAttribute('b') !== '0' || r?.getAttribute('b') === '1' || /Bold|Black|ExtraBold|Heavy|SemiBold/.test(latin);
        out.push({k: 't', ...box, raw: paras.join('\n'), size: Math.round(size * 10) / 10, bold, light: /Light|Thin/.test(latin), color: colorOf(r?.getElementsByTagName('a:solidFill')[0]) || scheme.tx1 || '#181818', align: al === 'ctr' ? 'center' : al === 'r' ? 'right' : 'left', valign: anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top', lh: 1.3});
      }
    }
  }
  async function bgOf(path){
    const x = await zip.file(path)?.async('string'); if (!x) return null;
    const d = P.parseFromString(x, 'application/xml'), bg = d.getElementsByTagName('p:bg')[0]; if (!bg) return null;
    const c = colorOf(bg.getElementsByTagName('a:solidFill')[0]);
    const blip = bg.getElementsByTagName('a:blip')[0];
    if (blip){ const rels = await relsOf(path), t = rels[blip.getAttribute('r:embed')]; if (t){ const im = await img(resolve(path, t)); if (im) return {img: im.data, color: c}; } }
    return c ? {color: c} : null;
  }
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b)).slice(0, opts.raw ? 120 : 60);
  const out = [];
  let si = 0;
  for (const sp of slides){
    si++; if (opts.onProgress) opts.onProgress(si, slides.length);
    const rels = await relsOf(sp), layout = Object.values(rels).find(t => /slideLayout/.test(t)), lp = layout && resolve(sp, layout);
    const lrels = lp ? await relsOf(lp) : {}, master = Object.values(lrels).find(t => /slideMaster/.test(t)), mp = master && resolve(lp, master);
    const bg = await bgOf(sp) || (lp && await bgOf(lp)) || (mp && await bgOf(mp)) || {color: '#FFFFFF'};
    const els = [], T0 = {x: 0, y: 0, sx: 1, sy: 1};
    for (const [p, isM] of [[mp, true], [lp, true], [sp, false]]){
      if (!p) continue; const x = await zip.file(p)?.async('string'); if (!x) continue;
      const d = P.parseFromString(x, 'application/xml'), tree = d.getElementsByTagName('p:spTree')[0]; if (!tree) continue;
      await walk(tree, p, isM ? (p === lp ? lrels : await relsOf(p)) : rels, T0, els, isM);
    }
    if (opts.raw) out.push({no: num(sp), bg: bg.color || '#FFFFFF', bgImg: bg.img || null, els: els.map(e => e.k === 't' ? {...e, text: e.raw ?? e.text, raw: undefined, minScale: e.minScale || .55} : e).filter(e => e.k !== 'frame' || e.chart)});
    else out.push(buildTemplate(els, bg, num(sp), file.name));
  }
  return out;
}
/* 텍스트 상자 → 내용 칸 지정 */
function buildTemplate(els, bg, no, fname){
  const texts = els.filter(e => e.k === 't');
  const keep = t => /^\s*0?\d\s*\.?\s*$/.test(t.raw) || /^\s*(시사점|핵심|Insight|INSIGHT|Key|KEY|Point|POINT|Note|NOTE|Summary|SUMMARY)\s*$/.test(t.raw); // 번호·범용 라벨만 유지, 원본 문구·수치는 가져오지 않음 // 짧은 라벨(시사점, 01 등)은 장식으로 유지
  const top = texts.filter(t => t.y < H * .2 && !keep(t)).sort((a, b) => b.size - a.size || a.y - b.y);
  const title = top[0], sub = top.find(t => t !== title && t.size < title.size);
  const frames = els.filter(e => e.k === 'frame');
  const bodyTexts = texts.filter(t => t !== title && t !== sub && !keep(t) && t.y >= (title ? title.y + title.h - 4 : 0) && t.size < 40);
  const bottomBar = bodyTexts.find(t => t.y > H * .78 && t.w > W * .5);
  const isDivider = !title && texts.some(t => t.size >= 30) || (texts.length <= 4 && texts.some(t => t.size >= 34));
  const frameMode = frames.length > 0 || bodyTexts.length > 14;
  const mapped = [];
  const groups = [...bodyTexts].filter(t => t !== bottomBar).sort((a, b) => Math.abs(a.y - b.y) < 14 ? a.x - b.x : a.y - b.y);
  for (const e of els){
    if (e.k === 'frame') continue;
    if (e.k !== 't'){ mapped.push(e); continue; }
    if (e === title) mapped.push({...e, slot: 'title'});
    else if (e === sub) mapped.push({...e, slot: 'sub'});
    else if (e === bottomBar) mapped.push({...e, slot: 'key'});
    else if (keep(e)) mapped.push({...e, slot: 'deco', text: e.raw});
    else if (isDivider) mapped.push({...e, slot: e.size >= 30 ? 'title' : 'sub'});
    else if (!frameMode){ const big = e.bold || e.size >= 15; const isV = /^[\d\s.,%+\-~약억만원건배]+$/.test(e.raw) && e.raw.length <= 12; mapped.push({...e, slot: isV ? 'v' : big ? 'h' : 'd'}); }
  }
  let body = null;
  if (frameMode){
    const zone = [...frames, ...bodyTexts.filter(t => t !== bottomBar)];
    if (zone.length){ const x1 = Math.min(...zone.map(z => z.x)), y1 = Math.min(...zone.map(z => z.y)), x2 = Math.max(...zone.map(z => z.x + z.w)), y2 = Math.max(...zone.map(z => z.y + z.h)); body = {x: Math.max(24, x1), y: y1, w: Math.min(W - 48, x2) - Math.max(24, x1), h: Math.min(bottomBar ? bottomBar.y - 16 : H - 60, y2) - y1}; }
    // 프레임 영역 안의 원본 장식 도형은 제거 (본문 레이아웃을 그 자리에 그림)
    for (let i = mapped.length - 1; i >= 0; i--){ const m = mapped[i]; if (body && m.k === 't' && m.slot === 'deco' && m.x + m.w / 2 > body.x && m.x + m.w / 2 < body.x + body.w && m.y + m.h / 2 > body.y && m.y + m.h / 2 < body.y + body.h){ mapped.splice(i, 1); continue; } if (!body || m.k === 't' || m.w * m.h >= W * H * .8) continue; const ox = Math.max(0, Math.min(m.x + m.w, body.x + body.w) - Math.max(m.x, body.x)), oy = Math.max(0, Math.min(m.y + m.h, body.y + body.h) - Math.max(m.y, body.y)); if (ox * oy > m.w * m.h * .4 || (m.w * m.h < 400 && ox * oy > 0)) mapped.splice(i, 1); }
  }
  const cnt = {h: 0, d: 0, v: 0}; mapped.forEach(m => { if (cnt[m.slot] != null) cnt[m.slot]++; });
  const freq = {}; mapped.forEach(m => [m.fill, m.line].forEach(c => { if (c && isChroma(c)) freq[c] = (freq[c] || 0) + m.w * m.h; }));
  const top3 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  const cmap = {}; top3.forEach((c, i) => cmap[c] = i + 1);
  return {id: uid(), name: `${fname.replace(/\.pptx?$/i, '').slice(0, 14)} p${no}`, slideNo: no, tag: isDivider ? 'divider' : 'body', use: false, recolor: true, chrome: false, mode: frameMode ? 'frame' : 'fill', bodyLayout: 'table', bg: bg.color || '#FFFFFF', bgImg: bg.img || null, els: mapped.map(m => m.k === 't' ? {...m, text: m.slot === 'deco' ? m.text : '', raw: undefined} : m), body, cnt, cmap};
}
function isChroma(c){ const [r, g, b] = hexRgb(c), mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx - mn > 40; }

/* ---------- 차트(막대·선·원형) → 도형 ---------- */
function chartEls(doc, box, colorOf, scheme){
  const q = (el, t) => el ? [...el.getElementsByTagName(t)] : [], q1 = (el, t) => q(el, t)[0];
  const kid = (el, t) => el && [...el.children].find(c => c.tagName === t);
  const acc = ['accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'].map(k => scheme[k]).filter(Boolean); if (!acc.length) acc.push('#2E5BFF', '#F04438', '#98A2B3');
  const plot = q1(doc, 'c:plotArea'); if (!plot) return null;
  const kind = ['c:barChart', 'c:lineChart', 'c:pieChart', 'c:doughnutChart', 'c:areaChart'].find(t => kid(plot, t)); if (!kind) return null;
  const C = kid(plot, kind), barDir = q1(C, 'c:barDir')?.getAttribute('val') || 'col', grouping = q1(C, 'c:grouping')?.getAttribute('val') || 'clustered';
  const pts = cache => { const o = []; q(cache, 'c:pt').forEach(p => o[+p.getAttribute('idx')] = q1(p, 'c:v')?.textContent ?? ''); return o; };
  const fmtOf = cache => q1(cache, 'c:formatCode')?.textContent || 'General';
  const ser = q(C, 'c:ser').map((sr, si) => {
    const cat = q1(sr, 'c:cat'), val = q1(sr, 'c:val'), vc = q1(val, 'c:numCache');
    const sp = kid(sr, 'c:spPr'), fillEl = sp && (kid(sp, 'a:solidFill') || q1(kid(sp, 'a:ln'), 'a:solidFill'));
    const dp = {}; q(sr, 'c:dPt').forEach(d => { const c = colorOf(q1(kid(d, 'c:spPr'), 'a:solidFill')); if (c) dp[+q1(d, 'c:idx').getAttribute('val')] = c; });
    const showVal = (q1(kid(sr, 'c:dLbls'), 'c:showVal') || q1(kid(C, 'c:dLbls'), 'c:showVal'))?.getAttribute('val') === '1';
    return {name: q1(kid(sr, 'c:tx'), 'c:v')?.textContent || '', cats: cat ? pts(q1(cat, 'c:strCache') || q1(cat, 'c:numCache')) : [], vals: pts(vc).map(v => v === '' || v == null ? null : +v), fmt: (q1(kid(sr, 'c:dLbls'), 'c:numFmt') || q1(kid(C, 'c:dLbls'), 'c:numFmt'))?.getAttribute('formatCode') || fmtOf(vc), color: colorOf(fillEl) || acc[si % acc.length], dp, showVal};
  }).filter(s => s.vals.length);
  if (!ser.length) return null;
  const fmt = (v, f) => { if (v == null || isNaN(v)) return ''; const fq = f.split(';')[0].replace(/"[^"]*"/g, ''); if (/general/i.test(fq) || !/0|#/.test(fq)) return String(+v.toFixed(2)); const dec = ((fq.split('.')[1] || '').match(/0/g) || []).length; const suf = (f.split(';')[0].match(/"([^"]*)"/) || [])[1] || ''; return /%/.test(fq) ? (v * 100).toFixed(dec) + '%' : v.toLocaleString('ko-KR', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + suf; };
  const E = [], cats = ser[0].cats.length ? ser[0].cats : ser[0].vals.map((_, i) => String(i + 1)), N = Math.max(...ser.map(s => s.vals.length));
  const fs = Math.max(9, Math.min(12, box.h / Math.max(8, N * 1.6))), ink = '#595959';
  const legend = ser.length > 1 && ser.some(s => s.name);
  let bx = {...box}; if (legend){ let lx = box.x; ser.forEach(s => { E.push({k: 'r', x: lx, y: box.y + 4, w: 10, h: 10, fill: s.color}); E.push({k: 't', x: lx + 14, y: box.y, w: 110, h: 18, text: s.name, size: 10, color: ink, align: 'left', valign: 'middle', lh: 1.2}); lx += 130; }); bx = {...box, y: box.y + 24, h: box.h - 24}; }
  if (kind === 'c:pieChart' || kind === 'c:doughnutChart'){
    const s0 = ser[0], tot = s0.vals.reduce((a, v) => a + (v || 0), 0) || 1, r = Math.min(bx.w * .45, bx.h) / 2, cx = bx.x + r + 8, cy = bx.y + bx.h / 2, hole = kind === 'c:doughnutChart' ? r * .55 : 0;
    let a0 = -Math.PI / 2;
    s0.vals.forEach((v, i) => { const a1 = a0 + (v || 0) / tot * Math.PI * 2, n = Math.max(2, Math.ceil((a1 - a0) / .12)), P2 = [];
      for (let k = 0; k <= n; k++){ const a = a0 + (a1 - a0) * k / n; P2.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
      if (hole) for (let k = n; k >= 0; k--){ const a = a0 + (a1 - a0) * k / n; P2.push([cx + hole * Math.cos(a), cy + hole * Math.sin(a)]); } else P2.push([cx, cy]);
      const c = s0.dp[i] || acc[i % acc.length]; E.push(polyEl(P2, c));
      const ly = bx.y + 8 + i * 22; if (ly < bx.y + bx.h - 16){ E.push({k: 'r', x: cx + r + 28, y: ly + 4, w: 10, h: 10, fill: c}); E.push({k: 't', x: cx + r + 44, y: ly, w: bx.x + bx.w - (cx + r + 44), h: 18, text: `${cats[i] || ''}  ${fmt(v, s0.fmt)}`, size: 10.5, color: ink, align: 'left', valign: 'middle', lh: 1.2}); }
      a0 = a1; });
    return E;
  }
  const stacked = /stacked/i.test(grouping), horiz = kind === 'c:barChart' && barDir === 'bar';
  const all = stacked ? cats.map((_, i) => ser.reduce((a, s) => a + Math.max(0, s.vals[i] || 0), 0)) : ser.flatMap(s => s.vals.filter(v => v != null));
  const mx = Math.max(0, ...all), mn = Math.min(0, ...ser.flatMap(s => s.vals.filter(v => v != null))), span = (mx - mn) || 1;
  if (horiz){
    const lw = Math.min(bx.w * .3, Math.max(...cats.map(c => mw(String(c), fs, 400))) + 10), vw = 54, px = bx.x + lw, pw = bx.w - lw - vw, rowH = bx.h / N, z = px + (-mn / span) * pw;
    cats.forEach((c, i) => { const y0 = bx.y + i * rowH; E.push({k: 't', x: bx.x, y: y0, w: lw - 8, h: rowH, text: String(c), size: fs, color: ink, align: 'right', valign: 'middle', lh: 1.15, minScale: .6});
      const n = stacked ? 1 : ser.length, bh = Math.min(28, rowH * .62 / n); let sx = z;
      ser.forEach((s, si) => { const v = s.vals[i]; if (v == null) return; const w = Math.abs(v) / span * pw, c = s.dp[i] || s.color;
        const y = stacked ? y0 + (rowH - bh) / 2 : y0 + (rowH - bh * n) / 2 + si * bh, x = stacked ? sx : (v >= 0 ? z : z - w);
        E.push({k: 'r', x, y, w: Math.max(1, w), h: bh * (stacked ? 1 : .9), fill: c}); if (stacked) sx += w;
        if (s.showVal) E.push({k: 't', x: (stacked ? x : (v >= 0 ? x + w : x - vw)) + (stacked ? 0 : 4), y, w: stacked ? Math.max(30, w) : vw - 4, h: bh, text: fmt(v, s.fmt), size: fs * .92, color: stacked ? onC(c) : ink, align: stacked ? 'center' : v >= 0 ? 'left' : 'right', valign: 'middle', lh: 1, minScale: .6}); }); });
    E.push({k: 'r', x: z, y: bx.y, w: 1, h: bx.h, fill: '#BFBFBF'});
    return E;
  }
  const lh = fs * 2.6, py = bx.y + 18, ph = bx.h - lh - 18, colW = bx.w / N, yOf = v => py + ph - ((v - mn) / span) * ph, z = yOf(0);
  E.push({k: 'r', x: bx.x, y: z, w: bx.w, h: 1, fill: '#BFBFBF'});
  cats.forEach((c, i) => E.push({k: 't', x: bx.x + i * colW, y: py + ph + 4, w: colW, h: lh - 4, text: String(c), size: fs, color: ink, align: 'center', valign: 'top', lh: 1.15, minScale: .6}));
  if (kind === 'c:barChart'){
    cats.forEach((c, i) => { const n = stacked ? 1 : ser.length, bw = Math.min(46, colW * .7 / n); let sy = z;
      ser.forEach((s, si) => { const v = s.vals[i]; if (v == null) return; const h = Math.abs(v) / span * ph, col = s.dp[i] || s.color;
        const x = bx.x + i * colW + (colW - bw * n) / 2 + (stacked ? 0 : si * bw), y = stacked ? sy - h : (v >= 0 ? z - h : z);
        E.push({k: 'r', x, y, w: bw * (stacked ? 1 : .88), h: Math.max(1, h), fill: col}); if (stacked) sy -= h;
        if (s.showVal) E.push({k: 't', x: x - 10, y: stacked ? y : (v >= 0 ? y - 16 : y + h + 2), w: bw + 20, h: 14, text: fmt(v, s.fmt), size: fs * .85, color: stacked ? onC(col) : ink, align: 'center', valign: stacked ? 'middle' : 'bottom', lh: 1, minScale: .6}); }); });
  } else {
    ser.forEach(s => { const P2 = s.vals.map((v, i) => v == null ? null : [bx.x + i * colW + colW / 2, yOf(v)]);
      for (let i = 1; i < P2.length; i++) if (P2[i - 1] && P2[i]) E.push(segEl(P2[i - 1], P2[i], 2.5, s.color));
      P2.forEach((p, i) => { if (!p) return; E.push({k: 'e', x: p[0] - 4, y: p[1] - 4, w: 8, h: 8, fill: '#FFFFFF', line: s.color, lw: 2}); if (s.showVal) E.push({k: 't', x: p[0] - 30, y: p[1] - 20, w: 60, h: 14, text: fmt(s.vals[i], s.fmt), size: fs * .85, color: ink, align: 'center', valign: 'bottom', lh: 1}); }); });
  }
  return E;
}
function polyEl(P2, fill){ const xs = P2.map(p => p[0]), ys = P2.map(p => p[1]), x = Math.min(...xs), y = Math.min(...ys); return {k: 's', shape: 'poly', x, y, w: Math.max(1, Math.max(...xs) - x), h: Math.max(1, Math.max(...ys) - y), fill, pts: P2.map(p => [+(p[0] - x).toFixed(1), +(p[1] - y).toFixed(1)])}; }
function segEl(a, b, t, fill){ const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * t / 2, ny = dx / L * t / 2; return polyEl([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], fill); }
