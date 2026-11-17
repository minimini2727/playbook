/* =========================================================
   희망 레이아웃(참고 PPT) → 재사용 템플릿 변환
   · 도형 위치·색·배경·이미지를 그대로 옮기고, 텍스트 상자는 내용 칸(slot)으로 변환
   · 원본 문구는 쓰지 않음 (짧은 라벨만 장식으로 유지 가능)
   ========================================================= */
const TPL_TAGS = {body: '본문', divider: '간지', cover: '표지', closing: '클로징'};
async function parseRefPptx(file){
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
      if (isMaster && el.getElementsByTagName('p:ph').length) continue; // 레이아웃·마스터의 자리표시자는 그리지 않음
      const xf = el.getElementsByTagName(tag === 'p:graphicFrame' ? 'p:xfrm' : 'a:xfrm')[0]; if (!xf) continue;
      const off = xf.getElementsByTagName('a:off')[0], ext = xf.getElementsByTagName('a:ext')[0]; if (!off || !ext) continue;
      const box = {x: (tf.x + +off.getAttribute('x') * tf.sx) * KX, y: (tf.y + +off.getAttribute('y') * tf.sy) * KY, w: +ext.getAttribute('cx') * tf.sx * KX, h: +ext.getAttribute('cy') * tf.sy * KY};
      if (box.w < 1 && box.h < 1) continue;
      if (tag === 'p:graphicFrame'){ out.push({k: 'frame', ...box}); continue; }
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
        const paras = [...tx.getElementsByTagName('a:p')].map(p => [...p.getElementsByTagName('a:t')].map(t => t.textContent).join('')).filter(Boolean);
        if (!paras.length) continue;
        const r = tx.getElementsByTagName('a:rPr')[0] || tx.getElementsByTagName('a:endParaRPr')[0] || tx.getElementsByTagName('a:defRPr')[0];
        const szv = r?.getAttribute('sz'), size = szv ? +szv / 100 / .75 : 14;
        const ppr = tx.getElementsByTagName('a:pPr')[0], al = ppr?.getAttribute('algn'), anchor = tx.getElementsByTagName('a:bodyPr')[0]?.getAttribute('anchor');
        const latin = r?.getElementsByTagName('a:latin')[0]?.getAttribute('typeface') || '';
        const bold = r?.getAttribute('b') === '1' || /Bold|Black|ExtraBold|Heavy|SemiBold/.test(latin);
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
  const slides = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b)).slice(0, 60);
  const out = [];
  for (const sp of slides){
    const rels = await relsOf(sp), layout = Object.values(rels).find(t => /slideLayout/.test(t)), lp = layout && resolve(sp, layout);
    const lrels = lp ? await relsOf(lp) : {}, master = Object.values(lrels).find(t => /slideMaster/.test(t)), mp = master && resolve(lp, master);
    const bg = await bgOf(sp) || (lp && await bgOf(lp)) || (mp && await bgOf(mp)) || {color: '#FFFFFF'};
    const els = [], T0 = {x: 0, y: 0, sx: 1, sy: 1};
    for (const [p, isM] of [[mp, true], [lp, true], [sp, false]]){
      if (!p) continue; const x = await zip.file(p)?.async('string'); if (!x) continue;
      const d = P.parseFromString(x, 'application/xml'), tree = d.getElementsByTagName('p:spTree')[0]; if (!tree) continue;
      await walk(tree, p, isM ? (p === lp ? lrels : await relsOf(p)) : rels, T0, els, isM);
    }
    out.push(buildTemplate(els, bg, num(sp), file.name));
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
