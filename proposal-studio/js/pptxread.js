/* =========================================================
   원본 PPTX 장표 읽기 (기본 장표 라이브러리용, 고정 장표)
   · 테마 색(lumMod/tint 등)·도형 스타일 참조·상속 텍스트 스타일 반영
   · 텍스트는 런(run) 단위로 글꼴·크기·색·굵기 유지
   · 프리셋/사용자 지정 도형, 회전·반전, 이미지 자르기, 표 스타일, 차트
   ========================================================= */
async function readPptx(file, opts = {}){
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const DP = new DOMParser(), xml = async p => { const s = await zip.file(p)?.async('string'); return s ? DP.parseFromString(s, 'application/xml') : null; };
  const kids = (el, t) => el ? [...el.children].filter(c => !t || c.tagName === t) : [];
  const kid = (el, t) => el ? [...el.children].find(c => c.tagName === t) : null;
  const path = (el, ...ts) => ts.reduce((e, t) => kid(e, t), el);
  const q1 = (el, t) => el ? el.getElementsByTagName(t)[0] : null;
  const num = n => +n.match(/(\d+)\.xml$/)[1];
  const relsOf = async p => { const d = await xml(p.replace(/([^/]+)$/, '_rels/$1.rels')); const o = {}; if (d) [...d.getElementsByTagName('Relationship')].forEach(r => o[r.getAttribute('Id')] = r.getAttribute('Target')); return o; };
  const resolve = (base, t) => { if (/^\//.test(t)) return t.slice(1); const parts = base.split('/').slice(0, -1); t.split('/').forEach(s => s === '..' ? parts.pop() : s !== '.' && parts.push(s)); return parts.join('/'); };

  const pres = await xml('ppt/presentation.xml');
  const sz = q1(pres, 'p:sldSz'), CX = +sz.getAttribute('cx'), CY = +sz.getAttribute('cy');
  const K = Math.min(W / CX, H / CY), OX = (W - CX * K) / 2, OY = (H - CY * K) / 2; // EMU → px (비율 유지)
  const PT = K * 12700; // 1pt → px
  const defTx = q1(pres, 'p:defaultTextStyle');
  const tblStyles = await xml('ppt/tableStyles.xml');

  /* ---------- 색 ---------- */
  const PRST = {black: '000000', white: 'FFFFFF', red: 'FF0000', green: '008000', blue: '0000FF', yellow: 'FFFF00', gray: '808080', grey: '808080', darkGray: 'A9A9A9', lightGray: 'D3D3D3', orange: 'FFA500'};
  const rgb2hsl = (r, g, b) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2; if (mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; };
  const hsl2rgb = (h, s, l) => { if (!s) return [l, l, l].map(v => Math.round(v * 255)); const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; }; const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(v => Math.round(Math.max(0, Math.min(1, v)) * 255)); };
  const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  function colorEl(c, ctx){ // a:srgbClr 등 색 노드 → {c, a}
    if (!c) return null;
    let base = null; const t = c.tagName;
    if (t === 'a:srgbClr') base = c.getAttribute('val');
    else if (t === 'a:sysClr') base = c.getAttribute('lastClr') || (c.getAttribute('val') === 'window' ? 'FFFFFF' : '000000');
    else if (t === 'a:prstClr') base = PRST[c.getAttribute('val')] || '000000';
    else if (t === 'a:scrgbClr') base = ['r', 'g', 'b'].map(k => Math.round(Math.pow(+c.getAttribute(k) / 1e5, 1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');
    else if (t === 'a:schemeClr'){ let v = c.getAttribute('val'); if (v === 'phClr'){ if (!ctx?.ph) return null; base = ctx.ph.c.slice(1); } else { v = ctx?.map?.[v] || v; base = (ctx?.scheme?.[v] || '#000000').slice(1); } }
    else return null;
    let [r, g, b] = [0, 2, 4].map(i => parseInt(base.substr(i, 2), 16)), a = 1;
    for (const m of kids(c)){ const v = +m.getAttribute('val') / 1e5;
      if (m.tagName === 'a:alpha') a = v;
      else if (m.tagName === 'a:tint'){ [r, g, b] = [r, g, b].map(x => x * v + 255 * (1 - v)); }
      else if (m.tagName === 'a:shade'){ [r, g, b] = [r, g, b].map(x => x * v); }
      else if (m.tagName === 'a:lumMod' || m.tagName === 'a:lumOff' || m.tagName === 'a:satMod'){ const [h, s, l] = rgb2hsl(r, g, b); [r, g, b] = m.tagName === 'a:lumMod' ? hsl2rgb(h, s, l * v) : m.tagName === 'a:lumOff' ? hsl2rgb(h, s, Math.min(1, l + v)) : hsl2rgb(h, Math.min(1, s * v), l); }
    }
    return {c: hex([r, g, b]), a};
  }
  const COLORS = ['a:srgbClr', 'a:schemeClr', 'a:sysClr', 'a:prstClr', 'a:scrgbClr'];
  const firstColor = (el, ctx) => { const c = el && kids(el).find(x => COLORS.includes(x.tagName)); return colorEl(c, ctx); };
  function fillOf(el, ctx){ // spPr/bgPr/tcPr 등의 채우기 → {c,a} | 'none' | {img} | null(지정 없음)
    if (!el) return null;
    for (const f of kids(el)){
      if (f.tagName === 'a:noFill') return 'none';
      if (f.tagName === 'a:solidFill') return firstColor(f, ctx);
      if (f.tagName === 'a:gradFill'){ const gs = [...f.getElementsByTagName('a:gs')].map(g => ({p: +g.getAttribute('pos') / 1e5, ...firstColor(g, ctx)})).filter(g => g.c).sort((a, b) => a.p - b.p); if (!gs.length) return null; const lin = q1(f, 'a:lin'), rad = !!q1(f, 'a:path'); return {c: gs[Math.floor(gs.length / 2)].c, a: gs[0].a, grad: gs, ang: lin ? +lin.getAttribute('ang') / 60000 : 90, radial: rad}; }
      if (f.tagName === 'a:pattFill') return firstColor(kid(f, 'a:fgClr'), ctx);
      if (f.tagName === 'a:blipFill') return {blip: f};
      if (f.tagName === 'a:grpFill') return ctx?.grpFill || null;
    }
    return null;
  }

  /* ---------- 마스터·레이아웃 컨텍스트 ---------- */
  const masters = {}, layouts = {};
  async function themeOf(mp){
    const mr = await relsOf(mp), tp = Object.values(mr).find(t => /theme/.test(t)); const d = tp ? await xml(resolve(mp, tp)) : null;
    const scheme = {}, fonts = {}; let fills = [], lines = [], bgFills = [];
    if (d){ const cs = q1(d, 'a:clrScheme'); kids(cs).forEach(k => { const c = colorEl(kids(k).find(x => COLORS.includes(x.tagName)), {}); if (c) scheme[k.tagName.slice(2)] = '#' + c.c.slice(1); });
      const fs = q1(d, 'a:fontScheme'); ['major', 'minor'].forEach(m => { const f = kid(fs, `a:${m}Font`); fonts[m] = {lt: kid(f, 'a:latin')?.getAttribute('typeface') || '', ea: kid(f, 'a:ea')?.getAttribute('typeface') || '', kr: [...(f?.getElementsByTagName('a:font') || [])].find(x => x.getAttribute('script') === 'Hang')?.getAttribute('typeface') || ''}; });
      fills = kids(q1(d, 'a:fillStyleLst')); lines = kids(q1(d, 'a:lnStyleLst')); bgFills = kids(q1(d, 'a:bgFillStyleLst')); }
    return {scheme, fonts, fills, lines, bgFills};
  }
  async function masterCtx(mp){
    if (masters[mp]) return masters[mp];
    const d = await xml(mp), th = await themeOf(mp), cm = q1(d, 'p:clrMap'), map = {};
    if (cm) [...cm.attributes].forEach(a => map[a.name] = a.value);
    const tx = q1(d, 'p:txStyles');
    return masters[mp] = {path: mp, doc: d, rels: await relsOf(mp), ...th, map, title: kid(tx, 'p:titleStyle'), body: kid(tx, 'p:bodyStyle'), other: kid(tx, 'p:otherStyle'), ph: phIndex(d)};
  }
  function phIndex(d){ const o = {byIdx: {}, byType: {}}; if (!d) return o; [...d.getElementsByTagName('p:sp')].forEach(sp => { const ph = q1(kid(sp, 'p:nvSpPr'), 'p:ph'); if (!ph) return; const t = normT(ph.getAttribute('type')); const idx = ph.getAttribute('idx'); if (idx != null) o.byIdx[idx] = sp; if (!o.byType[t]) o.byType[t] = sp; }); return o; }
  const normT = t => !t || t === 'obj' ? 'body' : t === 'ctrTitle' ? 'title' : t === 'subTitle' ? 'body' : t;
  const findPh = (idxMap, ph) => { if (!ph || !idxMap) return null; const idx = ph.getAttribute('idx'), t = normT(ph.getAttribute('type')); return (idx != null && idxMap.byIdx[idx] && normT(q1(idxMap.byIdx[idx], 'p:ph').getAttribute('type')) === t ? idxMap.byIdx[idx] : null) || idxMap.byType[t] || (idx != null ? idxMap.byIdx[idx] : null) || null; };

  /* ---------- 이미지 ---------- */
  const imgCache = {};
  async function loadImg(p){
    if (imgCache[p] !== undefined) return imgCache[p];
    const f = zip.file(p); if (!f) return imgCache[p] = null;
    const ext = p.split('.').pop().toLowerCase();
    if (!/^(png|jpe?g|gif|bmp|svg)$/.test(ext)) return imgCache[p] = null;
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    const url = `data:${mime};base64,` + await f.async('base64');
    return imgCache[p] = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = url; });
  }
  async function imgData(im, crop, maxW, alpha){ // 자르기·축소 → dataURL
    const nw = im.naturalWidth || 600, nh = im.naturalHeight || 400;
    const sx = nw * (crop.l || 0), sy = nh * (crop.t || 0), sw = Math.max(1, nw * (1 - (crop.l || 0) - (crop.r || 0))), sh = Math.max(1, nh * (1 - (crop.t || 0) - (crop.b || 0)));
    const s = Math.min(1, maxW / sw), cw = Math.max(1, Math.round(sw * s)), ch = Math.max(1, Math.round(sh * s));
    const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const g = cv.getContext('2d');
    if (alpha != null) g.globalAlpha = alpha;
    g.drawImage(im, sx, sy, sw, sh, 0, 0, cw, ch);
    let opaque = true; try { const px = g.getImageData(0, 0, cw, ch).data; for (let i = 3; i < px.length; i += 4 * 97) if (px[i] < 250){ opaque = false; break; } } catch(e){}
    return {data: opaque ? cv.toDataURL('image/jpeg', .9) : cv.toDataURL('image/png'), w: cw, h: ch};
  }
  async function blipEl(blipFill, relsMap, base, box, extra = {}){
    const b = kid(blipFill, 'a:blip'); if (!b) return null;
    let rid = b.getAttribute('r:embed'); const svg = [...b.getElementsByTagName('*')].find(x => x.localName === 'svgBlip'); if (svg && !rid) rid = svg.getAttribute('r:embed');
    const t = relsMap[rid]; if (!t) return null;
    const im = await loadImg(resolve(base, t)); if (!im) return null;
    const sr = kid(blipFill, 'a:srcRect'), crop = {}; if (sr) ['l', 't', 'r', 'b'].forEach(k => crop[k] = (+sr.getAttribute(k) || 0) / 1e5);
    const am = q1(b, 'a:alphaModFix'), alpha = am ? +am.getAttribute('amt') / 1e5 : null;
    const r = await imgData(im, crop, Math.max(400, Math.min(1800, box.w * 2)), alpha);
    return {k: 'i', ...box, data: r.data, nw: r.w, nh: r.h, cover: false, stretch: true, ...extra};
  }

  /* ---------- 도형 경로 ---------- */
  function presetPath(prst, w, h, adj){
    const a = (i, d) => (adj[i] ?? d) / 1e5, m = Math.min(w, h);
    const P = pts => 'M' + pts.map(p => p.join(',')).join(' L') + ' Z';
    switch (prst){
      case 'rect': case 'flowChartProcess': case 'textBox': return null;
      case 'roundRect': case 'flowChartAlternateProcess': { const r = Math.min(m / 2, m * a(0, 16667)); return `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h - r} A${r},${r} 0 0 1 ${w - r},${h} H${r} A${r},${r} 0 0 1 0,${h - r} V${r} A${r},${r} 0 0 1 ${r},0 Z`; }
      case 'round2SameRect': { const r = Math.min(m / 2, m * a(0, 16667)); return `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h} H0 V${r} A${r},${r} 0 0 1 ${r},0 Z`; }
      case 'round1Rect': { const r = Math.min(m / 2, m * a(0, 16667)); return `M0,0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${h} H0 Z`; }
      case 'snip1Rect': { const r = m * a(0, 16667); return P([[0, 0], [w - r, 0], [w, r], [w, h], [0, h]]); }
      case 'snip2SameRect': { const r = m * a(0, 16667); return P([[r, 0], [w - r, 0], [w, r], [w, h], [0, h], [0, r]]); }
      case 'flowChartTerminator': { const r = Math.min(h / 2, w / 2); return `M${r},0 H${w - r} A${r},${r} 0 0 1 ${w - r},${h} H${r} A${r},${r} 0 0 1 ${r},0 Z`; }
      case 'ellipse': case 'flowChartConnector': return `M0,${h / 2} A${w / 2},${h / 2} 0 1 1 ${w},${h / 2} A${w / 2},${h / 2} 0 1 1 0,${h / 2} Z`;
      case 'donut': { const t = m * a(0, 25000); return `M0,${h / 2} A${w / 2},${h / 2} 0 1 1 ${w},${h / 2} A${w / 2},${h / 2} 0 1 1 0,${h / 2} Z M${t},${h / 2} A${w / 2 - t},${h / 2 - t} 0 1 0 ${w - t},${h / 2} A${w / 2 - t},${h / 2 - t} 0 1 0 ${t},${h / 2} Z`; }
      case 'triangle': case 'flowChartExtract': return P([[w * a(0, 50000), 0], [w, h], [0, h]]);
      case 'flowChartMerge': return P([[0, 0], [w, 0], [w / 2, h]]);
      case 'rtTriangle': return P([[0, 0], [w, h], [0, h]]);
      case 'diamond': case 'flowChartDecision': return P([[w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2]]);
      case 'parallelogram': case 'flowChartInputOutput': { const d = m * a(0, 25000); return P([[d, 0], [w, 0], [w - d, h], [0, h]]); }
      case 'trapezoid': { const d = m * a(0, 25000); return P([[d, 0], [w - d, 0], [w, h], [0, h]]); }
      case 'homePlate': { const d = m * a(0, 50000); return P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h]]); }
      case 'chevron': { const d = m * a(0, 50000); return P([[0, 0], [w - d, 0], [w, h / 2], [w - d, h], [0, h], [d, h / 2]]); }
      case 'pentagon': return P([[w / 2, 0], [w, h * .38], [w * .81, h], [w * .19, h], [0, h * .38]]);
      case 'hexagon': { const d = m * a(0, 25000); return P([[d, 0], [w - d, 0], [w, h / 2], [w - d, h], [d, h], [0, h / 2]]); }
      case 'octagon': { const d = m * a(0, 29289); return P([[d, 0], [w - d, 0], [w, d], [w, h - d], [w - d, h], [d, h], [0, h - d], [0, d]]); }
      case 'plus': { const d = m * a(0, 25000); return P([[d, 0], [w - d, 0], [w - d, d], [w, d], [w, h - d], [w - d, h - d], [w - d, h], [d, h], [d, h - d], [0, h - d], [0, d], [d, d]]); }
      case 'rightArrow': { const t = h * a(0, 50000), hd = Math.min(w, m * a(1, 50000)); return P([[0, (h - t) / 2], [w - hd, (h - t) / 2], [w - hd, 0], [w, h / 2], [w - hd, h], [w - hd, (h + t) / 2], [0, (h + t) / 2]]); }
      case 'leftArrow': { const t = h * a(0, 50000), hd = Math.min(w, m * a(1, 50000)); return P([[w, (h - t) / 2], [hd, (h - t) / 2], [hd, 0], [0, h / 2], [hd, h], [hd, (h + t) / 2], [w, (h + t) / 2]]); }
      case 'downArrow': { const t = w * a(0, 50000), hd = Math.min(h, m * a(1, 50000)); return P([[(w - t) / 2, 0], [(w + t) / 2, 0], [(w + t) / 2, h - hd], [w, h - hd], [w / 2, h], [0, h - hd], [(w - t) / 2, h - hd]]); }
      case 'upArrow': { const t = w * a(0, 50000), hd = Math.min(h, m * a(1, 50000)); return P([[w / 2, 0], [w, hd], [(w + t) / 2, hd], [(w + t) / 2, h], [(w - t) / 2, h], [(w - t) / 2, hd], [0, hd]]); }
      case 'star5': { const pts = []; for (let i = 0; i < 10; i++){ const r = i % 2 ? .38 : .5, an = -Math.PI / 2 + i * Math.PI / 5; pts.push([w / 2 + w * r * Math.cos(an), h / 2 + h * r * Math.sin(an) + h * .05]); } return P(pts); }
      case 'line': case 'straightConnector1': case 'bentConnector2': case 'bentConnector3': case 'curvedConnector3': return `M0,0 L${w},${h}`;
      case 'leftBracket': return `M${w},0 Q0,0 0,${h * .1} V${h * .9} Q0,${h} ${w},${h}`;
      case 'rightBracket': return `M0,0 Q${w},0 ${w},${h * .1} V${h * .9} Q${w},${h} 0,${h}`;
      case 'leftBrace': return `M${w},0 Q${w / 2},0 ${w / 2},${h * .1} V${h * .4} Q${w / 2},${h / 2} 0,${h / 2} Q${w / 2},${h / 2} ${w / 2},${h * .6} V${h * .9} Q${w / 2},${h} ${w},${h}`;
      case 'rightBrace': return `M0,0 Q${w / 2},0 ${w / 2},${h * .1} V${h * .4} Q${w / 2},${h / 2} ${w},${h / 2} Q${w / 2},${h / 2} ${w / 2},${h * .6} V${h * .9} Q${w / 2},${h} 0,${h}`;
      case 'arc': { const s = (adj[0] ?? 16200000) / 60000 * Math.PI / 180, e = (adj[1] ?? 0) / 60000 * Math.PI / 180; const pt = t => [w / 2 + w / 2 * Math.cos(t), h / 2 + h / 2 * Math.sin(t)]; let sw = e - s; if (sw <= 0) sw += Math.PI * 2; const [x1, y1] = pt(s), [x2, y2] = pt(s + sw); return `M${x1},${y1} A${w / 2},${h / 2} 0 ${sw > Math.PI ? 1 : 0} 1 ${x2},${y2}`; }
      case 'blockArc': case 'pie': case 'chord': { const s = (adj[0] ?? 0) / 60000 * Math.PI / 180, e = (adj[1] ?? 16200000) / 60000 * Math.PI / 180; const pt = t => [w / 2 + w / 2 * Math.cos(t), h / 2 + h / 2 * Math.sin(t)]; let sw = e - s; if (sw <= 0) sw += Math.PI * 2; const [x1, y1] = pt(s), [x2, y2] = pt(s + sw); return `M${w / 2},${h / 2} L${x1},${y1} A${w / 2},${h / 2} 0 ${sw > Math.PI ? 1 : 0} 1 ${x2},${y2} Z`; }
    }
    return undefined; // 모르는 도형 → 사각형으로
  }
  function custPath(cg, w, h){ // a:custGeom → SVG d + pptx points(px 단위, 박스 기준)
    let d = '', pts = []; const ok = [];
    for (const p of [...cg.getElementsByTagName('a:path')]){
      const pw = +p.getAttribute('w') || w, ph = +p.getAttribute('h') || h, sx = w / pw, sy = h / ph;
      const fillNo = p.getAttribute('fill') === 'none', strokeNo = p.getAttribute('stroke') === '0';
      const XY = pt => [+pt.getAttribute('x') * sx, +pt.getAttribute('y') * sy];
      let cur = [0, 0], start = [0, 0];
      for (const c of kids(p)){
        const P2 = [...c.getElementsByTagName('a:pt')].map(XY);
        if (c.tagName === 'a:moveTo'){ cur = start = P2[0]; d += `M${P2[0].join(',')} `; pts.push({x: P2[0][0], y: P2[0][1], moveTo: true}); }
        else if (c.tagName === 'a:lnTo'){ cur = P2[0]; d += `L${P2[0].join(',')} `; pts.push({x: P2[0][0], y: P2[0][1]}); }
        else if (c.tagName === 'a:cubicBezTo'){ d += `C${P2.map(x => x.join(',')).join(' ')} `; pts.push({x: P2[2][0], y: P2[2][1], curve: {type: 'cubic', x1: P2[0][0], y1: P2[0][1], x2: P2[1][0], y2: P2[1][1]}}); cur = P2[2]; }
        else if (c.tagName === 'a:quadBezTo'){ d += `Q${P2.map(x => x.join(',')).join(' ')} `; pts.push({x: P2[1][0], y: P2[1][1], curve: {type: 'quadratic', x1: P2[0][0], y1: P2[0][1]}}); cur = P2[1]; }
        else if (c.tagName === 'a:arcTo'){
          const wR = +c.getAttribute('wR') * sx, hR = +c.getAttribute('hR') * sy, st = +c.getAttribute('stAng') / 60000 * Math.PI / 180, sw = +c.getAttribute('swAng') / 60000 * Math.PI / 180;
          const cx = cur[0] - wR * Math.cos(st), cy = cur[1] - hR * Math.sin(st), n = Math.max(2, Math.ceil(Math.abs(sw) / .2));
          for (let i = 1; i <= n; i++){ const t = st + sw * i / n, x = cx + wR * Math.cos(t), y = cy + hR * Math.sin(t); d += `L${x},${y} `; pts.push({x, y}); cur = [x, y]; }
        }
        else if (c.tagName === 'a:close'){ d += 'Z '; pts.push({close: true}); cur = start; }
      }
      ok.push({fillNo, strokeNo});
    }
    return {d: d.trim(), pts, fillNo: ok.length && ok.every(o => o.fillNo), strokeNo: ok.length && ok.every(o => o.strokeNo)};
  }

  /* ---------- 텍스트 ---------- */
  const lvlOf = (lst, L) => kid(lst, `a:lvl${L + 1}pPr`);
  function textChain(sp, layer){ // 상속 순서: 도형 lstStyle → 레이아웃 자리표시자 → 마스터 자리표시자 → 마스터 txStyles → 기본
    const ph = q1(kid(sp, 'p:nvSpPr') || kid(sp, 'p:nvGraphicFramePr'), 'p:ph'), t = ph ? normT(ph.getAttribute('type')) : null;
    const lists = [q1(kid(sp, 'p:txBody'), 'a:lstStyle')];
    const bodyPrs = [q1(kid(sp, 'p:txBody'), 'a:bodyPr')];
    if (ph){ for (const idx of [layer.lay?.ph, layer.mst.ph]){ const s2 = findPh(idx, ph); if (s2){ lists.push(q1(kid(s2, 'p:txBody'), 'a:lstStyle')); bodyPrs.push(q1(kid(s2, 'p:txBody'), 'a:bodyPr')); } } }
    lists.push(t === 'title' ? layer.mst.title : ph ? layer.mst.body : layer.mst.other);
    lists.push(defTx);
    return {lists: lists.filter(Boolean), bodyPrs: bodyPrs.filter(Boolean), title: t === 'title'};
  }
  const attr = (els, a) => { for (const e of els){ const v = e?.getAttribute(a); if (v != null) return v; } return null; };
  function fontName(f, ctx){ if (!f) return ''; const m = f.match(/^\+(mj|mn)-(lt|ea|cs)$/); if (!m) return f; const s = ctx.fonts[m[1] === 'mj' ? 'major' : 'minor'] || {}; return m[2] === 'ea' ? (s.ea || s.kr || s.lt) : s.lt; }
  function readText(txBody, chain, ctx, fontRef){
    const bp = [kid(txBody, 'a:bodyPr'), ...chain.bodyPrs];
    const ins = ['lIns', 'tIns', 'rIns', 'bIns'].map((k, i) => { const v = attr(bp, k); return (v != null ? +v : (i % 2 ? 45720 : 91440)) * K; });
    const anchor = attr(bp, 'anchor') || 't', wrap = attr(bp, 'wrap') !== 'none', vert = attr(bp, 'vert');
    const naf = bp.map(b => kid(b, 'a:normAutofit')).find(Boolean), fScale = naf?.getAttribute('fontScale') ? +naf.getAttribute('fontScale') / 1e5 : 1, lnRed = naf?.getAttribute('lnSpcReduction') ? +naf.getAttribute('lnSpcReduction') / 1e5 : 0;
    const shapeLst = q1(txBody, 'a:lstStyle');
    const paras = [];
    for (const p of kids(txBody, 'a:p')){
      const pPr = kid(p, 'a:pPr'), L = +(pPr?.getAttribute('lvl') || 0);
      const pChain = [pPr, lvlOf(shapeLst, L), ...chain.lists.map(l => lvlOf(l, L))].filter(Boolean);
      const defR = pChain.map(x => kid(x, 'a:defRPr')).filter(Boolean);
      const defRLocal = [pPr, lvlOf(shapeLst, L)].filter(Boolean).map(x => kid(x, 'a:defRPr')).filter(Boolean);
      const sp = (tag) => { for (const x of pChain){ const e = kid(x, tag); if (e){ const pct = kid(e, 'a:spcPct'), pts = kid(e, 'a:spcPts'); return pct ? {pct: +pct.getAttribute('val') / 1e5} : pts ? {pt: +pts.getAttribute('val') / 100} : null; } } return null; };
      const bu = (() => { for (const x of pChain){ if (kid(x, 'a:buNone')) return null; const c = kid(x, 'a:buChar'); if (c) return {ch: c.getAttribute('char')}; const n = kid(x, 'a:buAutoNum'); if (n) return {num: n.getAttribute('type') || 'arabicPeriod', start: +(n.getAttribute('startAt') || 1)}; } return null; })();
      const buColor = (() => { for (const x of pChain){ const c = kid(x, 'a:buClr'); if (c) return firstColor(c, ctx)?.c; } return null; })();
      const runs = [];
      const runStyle = rPr => {
        const els = [rPr, ...defR].filter(Boolean);
        const size = (+attr(els, 'sz') || 1800) / 100 * fScale;
        const cOf = list => { for (const e of list){ const f = kid(e, 'a:solidFill'); if (f) return firstColor(f, ctx); const g = kid(e, 'a:gradFill'); if (g){ const gf = fillOf({children: [g]}, ctx); return gf ? {c: gf.c, a: gf.a ?? 1, grad: gf.grad, ang: gf.ang} : null; } } return null; };
        let col = cOf([rPr, ...defRLocal].filter(Boolean)) || fontRef || cOf(defR);
        if (!col) col = {c: (ctx.scheme[ctx.map.tx1 || 'dk1'] || '#000000'), a: 1};
        let lt = '', ea = ''; for (const e of els){ if (!lt) lt = kid(e, 'a:latin')?.getAttribute('typeface') || ''; if (!ea) ea = kid(e, 'a:ea')?.getAttribute('typeface') || ''; }
        if (!lt) lt = chain.title ? '+mj-lt' : '+mn-lt'; if (!ea) ea = chain.title ? '+mj-ea' : '+mn-ea';
        const hl = els.map(e => kid(e, 'a:highlight')).find(Boolean);
        return {grad: col.grad || null, gang: col.ang, sz: +(size * PT).toFixed(2), b: attr(els, 'b') === '1' || attr(els, 'b') === 'true', i: attr(els, 'i') === '1', u: (attr(els, 'u') || 'none') !== 'none', st: (attr(els, 'strike') || 'noStrike') !== 'noStrike', c: col.c, a: col.a, lt: fontName(lt, ctx), ea: fontName(ea, ctx), spc: (+attr(els, 'spc') || 0) / 100 * PT, base: +(attr(els, 'baseline') || 0) / 1000, cap: attr(els, 'cap'), hl: hl ? firstColor(hl, ctx)?.c : null};
      };
      for (const r of kids(p)){
        if (r.tagName === 'a:r' || r.tagName === 'a:fld'){ let t = kid(r, 'a:t')?.textContent ?? ''; const st = runStyle(kid(r, 'a:rPr')); if (st.cap === 'all') t = t.toUpperCase(); runs.push({t, ...st}); }
        else if (r.tagName === 'a:br') runs.push({t: '\n', ...runStyle(kid(r, 'a:rPr'))});
      }
      const end = runStyle(kid(p, 'a:endParaRPr'));
      const ln = sp('a:lnSpc'), sb = sp('a:spcBef'), sa = sp('a:spcAft');
      const fs = (runs[0] || end).sz;
      paras.push({align: {ctr: 'center', r: 'right', just: 'justify', dist: 'justify'}[attr(pChain, 'algn')] || 'left', lvl: L,
        marL: (+attr(pChain, 'marL') || 0) * K, indent: (+attr(pChain, 'indent') || 0) * K,
        ln: ln ? (ln.pct ? {m: Math.max(.6, ln.pct * (1 - lnRed))} : {px: ln.pt * PT}) : {m: 1 - lnRed},
        sb: sb ? (sb.pct ? sb.pct * fs : sb.pt * PT) : 0, sa: sa ? (sa.pct ? sa.pct * fs : sa.pt * PT) : 0,
        bu: bu ? {...bu, c: buColor} : null, runs, end});
    }
    // 자동 번호
    const cnt = {}; paras.forEach(p => { if (p.bu?.num){ const k = p.lvl + p.bu.num; cnt[k] = (cnt[k] ?? (p.bu.start - 1)) + 1; p.bu.n = cnt[k]; } else Object.keys(cnt).forEach(k => { if (+k[0] >= p.lvl) delete cnt[k]; }); });
    if (!paras.some(p => p.runs.some(r => r.t.trim()))) return null;
    return {ins, anchor: anchor === 'ctr' ? 'middle' : anchor === 'b' ? 'bottom' : 'top', wrap, vert: vert && vert !== 'horz' ? vert : null, paras};
  }

  /* ---------- 도형 하나 → 요소 ---------- */
  function xfrmOf(el, tf){
    const xf = q1(kid(el, 'p:spPr') || kid(el, 'p:grpSpPr'), 'a:xfrm') || (el.tagName === 'p:graphicFrame' ? kid(el, 'p:xfrm') : null) || q1(kid(el, 'p:spPr'), 'a:xfrm');
    if (!xf) return null;
    const off = kid(xf, 'a:off'), ext = kid(xf, 'a:ext'); if (!off || !ext) return null;
    const x = tf.x + (+off.getAttribute('x')) * tf.sx, y = tf.y + (+off.getAttribute('y')) * tf.sy, w = +ext.getAttribute('cx') * tf.sx, h = +ext.getAttribute('cy') * tf.sy;
    return {x: OX + x * K, y: OY + y * K, w: w * K, h: h * K, rot: (+xf.getAttribute('rot') || 0) / 60000 + (tf.rot || 0), fh: xf.getAttribute('flipH') === '1', fv: xf.getAttribute('flipV') === '1'};
  }
  async function shapeEls(el, layer, tf, out){
    const tag = el.tagName;
    const nv = kid(el, 'p:nvSpPr') || kid(el, 'p:nvPicPr') || kid(el, 'p:nvCxnSpPr') || kid(el, 'p:nvGraphicFramePr') || kid(el, 'p:nvGrpSpPr');
    if (kid(nv, 'p:cNvPr')?.getAttribute('hidden') === '1') return;
    const ph = q1(nv, 'p:ph');
    if (layer.isTpl && ph) return; // 레이아웃·마스터 자리표시자는 그리지 않음
    let box = xfrmOf(el, tf);
    if (!box && ph){ for (const idx of [layer.lay?.ph, layer.mst.ph]){ const s2 = findPh(idx, ph); const b2 = s2 && xfrmOf(s2, {x: 0, y: 0, sx: 1, sy: 1}); if (b2){ box = b2; break; } } }
    if (!box) return;
    const ctx = layer.ctx;
    if (tag === 'p:grpSp'){
      const xf = q1(kid(el, 'p:grpSpPr'), 'a:xfrm'); const off = kid(xf, 'a:off'), ext = kid(xf, 'a:ext'), co = kid(xf, 'a:chOff'), ce = kid(xf, 'a:chExt');
      if (!off || !ext || !co || !ce) return;
      const sx = +ext.getAttribute('cx') / Math.max(1, +ce.getAttribute('cx')), sy = +ext.getAttribute('cy') / Math.max(1, +ce.getAttribute('cy'));
      const nt = {x: tf.x + (+off.getAttribute('x') - +co.getAttribute('x') * sx) * tf.sx, y: tf.y + (+off.getAttribute('y') - +co.getAttribute('y') * sy) * tf.sy, sx: tf.sx * sx, sy: tf.sy * sy, rot: tf.rot || 0};
      const gf = fillOf(kid(el, 'p:grpSpPr'), ctx);
      for (const c of kids(el)) await walkEl(c, {...layer, ctx: {...ctx, grpFill: gf && gf !== 'none' ? gf : ctx.grpFill}}, nt, out);
      return;
    }
    if (tag === 'p:pic'){
      const bf = kid(el, 'p:blipFill'); const im = bf && await blipEl(bf, layer.rels, layer.path, box, {rot: box.rot, fh: box.fh, fv: box.fv, ...effOf(kid(el, 'p:spPr'), ctx)});
      const geom = q1(kid(el, 'p:spPr'), 'a:prstGeom')?.getAttribute('prst');
      if (im){ if (geom === 'ellipse') im.round = true; else if (geom === 'roundRect') im.r = Math.min(box.w, box.h) * .16; out.push(im); }
      const ln = lineOf(kid(el, 'p:spPr'), null, ctx); if (ln) out.push({k: 'g', ...box, fill: null, ...ln});
      return;
    }
    if (tag === 'p:graphicFrame'){
      const gd = q1(el, 'a:graphicData'), tbl = q1(gd, 'a:tbl');
      if (tbl) return tableEls(tbl, box, ctx, layer, out);
      const ch = q1(gd, 'c:chart'), rid = ch?.getAttribute('r:id');
      if (rid && layer.rels[rid]){ try { const cx = await zip.file(resolve(layer.path, layer.rels[rid]))?.async('string'); const ce = cx && chartEls(DP.parseFromString(cx, 'application/xml'), box, d => firstColor(d, ctx)?.c || null, Object.fromEntries(Object.entries(ctx.scheme))); if (ce?.length){ out.push(...ce); return; } } catch(e){ console.warn(e); } }
      out.push({k: 'frame', ...box, chart: !!ch}); return;
    }
    // p:sp / p:cxnSp
    const spPr = kid(el, 'p:spPr'), style = kid(el, 'p:style');
    const refColor = r => r ? firstColor(r, ctx) : null;
    const fRef = kid(style, 'a:fillRef'), lRef = kid(style, 'a:lnRef'), tRef = kid(style, 'a:fontRef');
    let fill = fillOf(spPr, ctx);
    if (fill == null && fRef && +fRef.getAttribute('idx') > 0){ const rc = refColor(fRef); const st = ctx.fills[+fRef.getAttribute('idx') - 1]; fill = st ? fillOf({children: [st]}, {...ctx, ph: rc}) : rc; if (!fill) fill = rc; }
    if (fill === 'none') fill = null;
    let imgFill = null; if (fill?.blip){ imgFill = await blipEl(fill.blip, layer.rels, layer.path, box, {rot: box.rot}); fill = null; }
    const ln = lineOf(spPr, lRef, ctx);
    const pg = q1(spPr, 'a:prstGeom'), cg = q1(spPr, 'a:custGeom');
    const prst = pg?.getAttribute('prst') || (cg ? 'custom' : (tag === 'p:cxnSp' ? 'line' : 'rect'));
    const adj = (pg ? [...pg.getElementsByTagName('a:gd')] : []).map(g => +((g.getAttribute('fmla') || '').split(' ')[1] || 0));
    if (imgFill) out.push(imgFill);
    if (fill || ln){
      const g = {k: 'g', ...box, prst, adj, fill: fill?.c || null, fa: fill?.a ?? 1, grad: fill?.grad || null, gang: fill?.ang, radial: fill?.radial || false, ...(ln || {}), ...effOf(spPr, ctx)};
      if (prst === 'custom'){ const cp = custPath(cg, box.w, box.h); g.d = cp.d; g.pts = cp.pts; if (cp.fillNo) g.fill = null; if (cp.strokeNo) g.line = null; }
      else { const d = presetPath(prst, box.w, box.h, adj); if (d) g.d = d; else if (d === undefined) g.prst = 'rect'; }
      if (g.fill || g.line) out.push(g);
    }
    const tb = kid(el, 'p:txBody');
    if (tb){ const chain = textChain(el, layer); const t = readText(tb, chain, ctx, refColor(tRef)); if (t) out.push({k: 'rt', ...box, ...t}); }
  }
  function effOf(spPr, ctx){
    const ef = kid(spPr, 'a:effectLst'); if (!ef) return {};
    const o = {}, sh = kid(ef, 'a:outerShdw'), se = kid(ef, 'a:softEdge'), gl = kid(ef, 'a:glow');
    if (sh){ const c = firstColor(sh, ctx) || {c: '#000000', a: .35}, d = (+sh.getAttribute('dist') || 0) * K, dir = (+sh.getAttribute('dir') || 0) / 60000; o.shd = {blur: (+sh.getAttribute('blurRad') || 0) * K, dist: d, dir, dx: d * Math.cos(dir * Math.PI / 180), dy: d * Math.sin(dir * Math.PI / 180), c: c.c, a: c.a}; }
    if (se) o.soft = (+se.getAttribute('rad') || 0) * K;
    if (gl){ const c = firstColor(gl, ctx); if (c) o.glow = {r: (+gl.getAttribute('rad') || 0) * K, c: c.c, a: c.a}; }
    return o;
  }
  function lineOf(spPr, lRef, ctx){
    const ln = kid(spPr, 'a:ln');
    let c = null, wpx = null, dash = null;
    if (ln){ if (kid(ln, 'a:noFill')) return null; const f = fillOf(ln, ctx); if (f && f !== 'none') c = f; wpx = ln.getAttribute('w') != null ? +ln.getAttribute('w') * K : null; const pd = kid(ln, 'a:prstDash')?.getAttribute('val'); if (pd && pd !== 'solid') dash = pd; }
    if (!c && lRef && +lRef.getAttribute('idx') > 0){ c = firstColor(lRef, ctx); if (wpx == null){ const st = ctx.lines[+lRef.getAttribute('idx') - 1]; wpx = st?.getAttribute('w') ? +st.getAttribute('w') * K : 1; } }
    if (!c) return null;
    const head = ln && (kid(ln, 'a:tailEnd')?.getAttribute('type') || 'none') !== 'none' ? 'end' : null;
    return {line: c.c, la: c.a, lw: Math.max(.5, wpx ?? 12700 * K), dash, arrow: head};
  }

  /* ---------- 표 ---------- */
  function tblStyle(tbl, ctx){
    const id = q1(tbl, 'a:tableStyleId')?.textContent; const st = id && tblStyles ? [...tblStyles.getElementsByTagName('a:tblStyle')].find(s => s.getAttribute('styleId') === id) : null;
    const part = n => { const p = kid(st, `a:${n}`); if (!p) return null; const tc = kid(p, 'a:tcStyle'), tx = kid(p, 'a:tcTxStyle'); let fill = null; const f = kid(tc, 'a:fill'); if (f) fill = fillOf(f, ctx); const fr = kid(tc, 'a:fillRef'); if (!fill && fr) fill = firstColor(fr, ctx); const bd = kid(tc, 'a:tcBdr'); const bdr = {}; kids(bd).forEach(b => { const l = kid(b, 'a:ln'); if (l && !kid(l, 'a:noFill')){ const c = fillOf(l, ctx); if (c && c !== 'none') bdr[b.tagName.slice(2)] = {c: c.c, w: (+l.getAttribute('w') || 12700) * K}; } }); return {fill, b: tx?.getAttribute('b') === 'on', color: tx ? firstColor(tx, ctx) || (kid(tx, 'a:fontRef') ? firstColor(kid(tx, 'a:fontRef'), ctx) : null) : null, bdr}; };
    if (!st && id) return builtinTbl(id, ctx);
    return st ? {whole: part('wholeTbl'), band1H: part('band1H'), band2H: part('band2H'), first: part('firstRow'), last: part('lastRow'), firstCol: part('firstCol')} : null;
  }
  function builtinTbl(id, ctx){ // 정의가 파일에 없는 PowerPoint 기본 표 스타일
    const M2 = {'{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}': 'accent1', '{21E4AEA4-8DFA-4A89-87EB-49C32662AFE8}': 'accent2', '{F5AB1C69-6EDB-4FF4-983F-18BD219EF322}': 'accent3', '{00A15C55-8517-42AA-B614-E9B94910E393}': 'accent4', '{7DF18680-E054-41AD-8BC1-D1AEF772440D}': 'accent5', '{93296810-A885-4BE3-A3E7-6D5BEEA58F35}': 'accent6', '{073A0DAA-6AF3-43AB-8588-CEC1D06C72B9}': 'dk1'};
    const tint = (c, t) => hex([0, 2, 4].map(i => parseInt(c.substr(i + 1, 2), 16) * t + 255 * (1 - t)));
    const white = {c: '#FFFFFF', w: 12700 * K};
    if (M2[id]){ const base = ctx.scheme[ctx.map?.[M2[id]] || M2[id]] || '#4472C4', bd = {left: white, right: white, top: white, bottom: white, insideH: white, insideV: white};
      return {whole: {fill: {c: tint(base, .2), a: 1}, bdr: bd}, band1H: {fill: {c: tint(base, .4), a: 1}, bdr: {}}, first: {fill: {c: base, a: 1}, b: true, color: {c: '#FFFFFF', a: 1}, bdr: {bottom: {c: '#FFFFFF', w: 38100 * K}}}, last: {fill: {c: base, a: 1}, b: true, color: {c: '#FFFFFF', a: 1}, bdr: {}}, firstCol: {fill: {c: base, a: 1}, b: true, color: {c: '#FFFFFF', a: 1}, bdr: {}}}; }
    if (id === '{2D5ABB26-0587-4C30-8999-92F81FD0307C}') return null; // 스타일 없음, 눈금 없음
    const g = {c: id === '{5940675A-B579-460E-94D1-54222C63F5DA}' ? '#000000' : '#BFBFBF', w: 12700 * K};
    return {whole: {fill: null, bdr: {left: g, right: g, top: g, bottom: g, insideH: g, insideV: g}}};
  }
  function tableEls(tbl, box, ctx, layer, out){
    const pr = kid(tbl, 'a:tblPr'), S2 = tblStyle(tbl, ctx), on = a => pr?.getAttribute(a) === '1';
    const cols = kids(kid(tbl, 'a:tblGrid'), 'a:gridCol').map(g => +g.getAttribute('w') * K), rows = kids(tbl, 'a:tr');
    const rh = rows.map(r => +r.getAttribute('h') * K);
    let y = box.y; const vSpan = {};
    rows.forEach((r, ri) => {
      let x = box.x, ci = 0; const h = rh[ri];
      for (const tc of kids(r, 'a:tc')){
        const span = +tc.getAttribute('gridSpan') || 1, rs = +tc.getAttribute('rowSpan') || 1;
        const w = cols.slice(ci, ci + span).reduce((a, b) => a + b, 0);
        if (tc.getAttribute('hMerge') === '1' || tc.getAttribute('vMerge') === '1'){ x += cols[ci] || 0; ci++; continue; }
        const hh = rh.slice(ri, ri + rs).reduce((a, b) => a + b, 0);
        const parts = [S2?.whole, on('bandRow') && (ri - (on('firstRow') ? 1 : 0)) % 2 === 0 && !(on('firstRow') && ri === 0) ? S2?.band1H : null, on('firstCol') && ci === 0 ? S2?.firstCol : null, on('firstRow') && ri === 0 ? S2?.first : null, on('lastRow') && ri === rows.length - 1 ? S2?.last : null].filter(Boolean);
        const tcPr = kid(tc, 'a:tcPr');
        let fill = fillOf(tcPr, ctx); if (fill == null) for (const p of parts) if (p.fill) fill = p.fill;
        if (fill && fill !== 'none') out.push({k: 'g', x, y, w, h: hh, prst: 'rect', fill: fill.c, fa: fill.a ?? 1});
        // 테두리
        const bd = {}; parts.forEach(p => Object.assign(bd, p.bdr));
        const side = (n, sn) => { const l = kid(tcPr, `a:ln${n}`); if (l){ if (kid(l, 'a:noFill')) return null; const c = fillOf(l, ctx); return c && c !== 'none' ? {c: c.c, w: (+l.getAttribute('w') || 12700) * K} : null; } return bd[sn] || null; };
        const L = side('L', ci === 0 ? 'left' : 'insideV'), R = side('R', ci + span >= cols.length ? 'right' : 'insideV'), T2 = side('T', ri === 0 ? 'top' : 'insideH'), B = side('B', ri + rs >= rows.length ? 'bottom' : 'insideH');
        if (T2) out.push({k: 'g', x, y: y - T2.w / 2, w, h: Math.max(.5, T2.w), prst: 'rect', fill: T2.c});
        if (B) out.push({k: 'g', x, y: y + hh - B.w / 2, w, h: Math.max(.5, B.w), prst: 'rect', fill: B.c});
        if (L) out.push({k: 'g', x: x - L.w / 2, y, w: Math.max(.5, L.w), h: hh, prst: 'rect', fill: L.c});
        if (R) out.push({k: 'g', x: x + w - R.w / 2, y, w: Math.max(.5, R.w), h: hh, prst: 'rect', fill: R.c});
        const txb = kid(tc, 'a:txBody');
        if (txb){
          const pc = parts.reduce((a, p) => ({b: p.b || a.b, color: p.color || a.color}), {});
          const t = readText(txb, {lists: [layer.mst.other, defTx].filter(Boolean), bodyPrs: [], title: false}, ctx, pc.color);
          if (t){ if (pc.b) t.paras.forEach(p => p.runs.forEach(r => r.b = true));
            const m = ['marL', 'marT', 'marR', 'marB'].map((k, i) => (tcPr?.getAttribute(k) != null ? +tcPr.getAttribute(k) : (i % 2 ? 45720 : 91440)) * K);
            out.push({k: 'rt', x, y, w, h: hh, ...t, ins: m, anchor: {ctr: 'middle', b: 'bottom'}[tcPr?.getAttribute('anchor')] || 'top', cell: true}); }
        }
        x += w; ci += span;
      }
      y += h;
    });
  }

  async function walkEl(el, layer, tf, out){
    if (el.tagName === 'mc:AlternateContent'){ const alt = kid(el, 'mc:Fallback') || kid(el, 'mc:Choice'); if (alt) for (const c of kids(alt)) await walkEl(c, layer, tf, out); return; }
    if (!['p:sp', 'p:pic', 'p:cxnSp', 'p:graphicFrame', 'p:grpSp'].includes(el.tagName)) return;
    try { await shapeEls(el, layer, tf, out); } catch(e){ console.warn('shape', e); }
  }
  async function bgOf(d, ctx, rels, p){
    const bg = q1(d, 'p:bg'); if (!bg) return null;
    const pr = kid(bg, 'p:bgPr'), ref = kid(bg, 'p:bgRef');
    if (pr){ const f = fillOf(pr, ctx); if (f?.blip){ const im = await blipEl(f.blip, rels, p, {x: 0, y: 0, w: W, h: H}); return {color: '#FFFFFF', img: im?.data}; } if (f && f !== 'none') return {color: f.c, grad: f.grad, ang: f.ang}; }
    if (ref){ const c = firstColor(ref, ctx), idx = +ref.getAttribute('idx'); if (idx >= 1001){ const st = ctx.bgFills[idx - 1001]; const f = st && fillOf({children: [st]}, {...ctx, ph: c}); if (f?.blip){ const im = await blipEl(f.blip, ctx.rels || rels, ctx.path || p, {x: 0, y: 0, w: W, h: H}); return {color: c?.c || '#FFFFFF', img: im?.data}; } if (f && f !== 'none') return {color: f.c, grad: f.grad, ang: f.ang}; } if (c) return {color: c.c}; }
    return null;
  }

  const slides = [...pres.getElementsByTagName('p:sldId')].map(s => s.getAttribute('r:id'));
  const prels = await relsOf('ppt/presentation.xml');
  let order = slides.map(r => prels[r] && resolve('ppt/presentation.xml', prels[r])).filter(Boolean);
  if (!order.length) order = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  order = order.slice(0, opts.max || 150);
  const res = [];
  for (let i = 0; i < order.length; i++){
    const sp = order[i]; if (opts.onProgress) opts.onProgress(i + 1, order.length);
    const sd = await xml(sp); if (!sd) continue;
    if (q1(sd, 'p:sld')?.getAttribute('show') === '0' && opts.skipHidden) continue;
    const rels = await relsOf(sp), lp0 = Object.values(rels).find(t => /slideLayout/.test(t)), lp = lp0 && resolve(sp, lp0);
    const lrels = lp ? await relsOf(lp) : {}, mp0 = Object.values(lrels).find(t => /slideMaster/.test(t)), mp = mp0 && resolve(lp, mp0);
    const mst = mp ? await masterCtx(mp) : {scheme: {}, fonts: {}, fills: [], lines: [], bgFills: [], map: {}, ph: phIndex(null), rels: {}};
    if (lp && !layouts[lp]){ const ld = await xml(lp); layouts[lp] = {doc: ld, ph: phIndex(ld)}; }
    const lay = lp ? layouts[lp] : null;
    const ovr = m => { const o = q1(m, 'p:clrMapOvr'), om = o && q1(o, 'a:overrideClrMapping'); if (!om) return null; const r = {}; [...om.attributes].forEach(a => r[a.name] = a.value); return r; };
    const map = ovr(sd) || ovr(lay?.doc) || mst.map;
    const ctx = {scheme: mst.scheme, fonts: mst.fonts, fills: mst.fills, lines: mst.lines, bgFills: mst.bgFills, map, rels: mst.rels, path: mst.path};
    const bg = await bgOf(sd, ctx, rels, sp) || (lay && await bgOf(lay.doc, ctx, lrels, lp)) || (mst.doc && await bgOf(mst.doc, ctx, mst.rels, mp)) || {color: ctx.scheme[map.bg1 || 'lt1'] || '#FFFFFF'};
    const els = [], T0 = {x: 0, y: 0, sx: 1, sy: 1, rot: 0};
    const showM = (d) => q1(d, 'p:sld')?.getAttribute('showMasterSp') !== '0' && q1(d, 'p:sldLayout')?.getAttribute('showMasterSp') !== '0';
    const layers = [];
    if (mst.doc && showM(sd) && (!lay || showM(lay.doc))) layers.push([mst.doc, {isTpl: true, mst, lay, ctx, rels: mst.rels, path: mp}]);
    if (lay && showM(sd)) layers.push([lay.doc, {isTpl: true, mst, lay, ctx, rels: lrels, path: lp}]);
    layers.push([sd, {isTpl: false, mst, lay, ctx, rels, path: sp}]);
    for (const [d, layer] of layers){ const tree = q1(d, 'p:spTree'); if (tree) for (const c of kids(tree)) await walkEl(c, layer, T0, els); }
    if (OX > 1 || OY > 1){ /* 비율이 다른 원본: 여백은 배경색 */ }
    res.push({no: num(sp), bg: bg.color || '#FFFFFF', bgGrad: bg.grad || null, bgAng: bg.ang, bgImg: bg.img || null, els, v: 2});
  }
  return res;
}

/* ---------- 고정 장표 렌더링 (HTML) ---------- */
const FX_FONT = r => { const f = [r.ea, r.lt].filter(Boolean).map(x => `'${x.replace(/'/g, '')}'`); return [...new Set(f), 'Pretendard', "'Apple SD Gothic Neo'", "'Malgun Gothic'", 'sans-serif'].join(','); };
function gradCSS(g, ang, radial){ if (radial) return `radial-gradient(circle,${g.map(s => `${rgba(s.c, s.a)} ${Math.round(s.p * 100)}%`).join(',')})`; return `linear-gradient(${(ang ?? 90) + 90}deg,${g.map(s => `${rgba(s.c, s.a)} ${Math.round(s.p * 100)}%`).join(',')})`; }
const rgba = (c, a) => { const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a ?? 1})`; };
function fxFilter(e){ const f = []; if (e.shd) f.push(`drop-shadow(${e.shd.dx.toFixed(1)}px ${e.shd.dy.toFixed(1)}px ${(e.shd.blur / 2).toFixed(1)}px ${rgba(e.shd.c, e.shd.a)})`); if (e.glow) f.push(`drop-shadow(0 0 ${(e.glow.r / 2).toFixed(1)}px ${rgba(e.glow.c, e.glow.a)})`); if (e.soft) f.push(`blur(${(e.soft / 3).toFixed(1)}px)`); return f.length ? `filter:${f.join(' ')};` : ''; }
function fxTransform(e){ const t = []; if (e.rot) t.push(`rotate(${e.rot}deg)`); if (e.fh) t.push('scaleX(-1)'); if (e.fv) t.push('scaleY(-1)'); return t.length ? `transform:${t.join(' ')};` : ''; }
const DASH = {dash: '4 3', dot: '1 2', sysDash: '3 1', sysDot: '1 1', lgDash: '8 3', dashDot: '4 2 1 2', lgDashDot: '8 3 1 3'};
function fxGeomHTML(e){
  const pos = `left:${e.x}px;top:${e.y}px;width:${Math.max(.5, e.w)}px;height:${Math.max(.5, e.h)}px;${fxTransform(e)}${fxFilter(e)}`;
  if (!e.d && (e.prst === 'rect' || !e.prst) && !e.dash){ // 단순 사각형
    const bg = e.grad ? `background:${gradCSS(e.grad, e.gang, e.radial)};` : e.fill ? `background:${e.fill};` : '';
    return `<div class="r" style="${pos}${bg}${e.fa != null && e.fa < 1 ? `opacity:${e.fa};` : ''}${e.line ? `box-shadow:inset 0 0 0 ${e.lw}px ${e.line};` : ''}"></div>`;
  }
  const d = e.d || `M0,0 H${e.w} V${e.h} H0 Z`, id = 'g' + Math.random().toString(36).slice(2, 8);
  const stops = e.grad ? e.grad.map(s => `<stop offset="${s.p}" stop-color="${s.c}" stop-opacity="${s.a ?? 1}"/>`).join('') : '';
  const gdef = e.grad ? (e.radial ? `<defs><radialGradient id="${id}">${stops}</radialGradient></defs>` : `<defs><linearGradient id="${id}" gradientTransform="rotate(${e.gang ?? 90} .5 .5)">${stops}</linearGradient></defs>`) : '';
  const mk = e.arrow ? `<defs><marker id="m${id}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3 L0,6 Z" fill="${e.line}"/></marker></defs>` : '';
  return `<svg class="r" style="${pos}overflow:visible" width="${e.w}" height="${e.h}" viewBox="0 0 ${Math.max(.5, e.w)} ${Math.max(.5, e.h)}">${gdef}${mk}<path d="${d}" fill="${e.grad ? `url(#${id})` : e.fill || 'none'}" fill-opacity="${e.fa ?? 1}" fill-rule="evenodd" ${e.line ? `stroke="${e.line}" stroke-opacity="${e.la ?? 1}" stroke-width="${e.lw}" ${e.dash ? `stroke-dasharray="${(DASH[e.dash] || '4 3').split(' ').map(v => v * e.lw).join(' ')}"` : ''} ${e.arrow ? `marker-end="url(#m${id})"` : ''}` : ''} vector-effect="non-scaling-stroke"/></svg>`;
}
function buText(p){ if (!p.bu) return ''; if (p.bu.ch) return p.bu.ch; const n = p.bu.n || 1, t = p.bu.num; if (/alphaLc/.test(t)) return String.fromCharCode(96 + n) + (/Paren/.test(t) ? ')' : '.'); if (/alphaUc/.test(t)) return String.fromCharCode(64 + n) + (/Paren/.test(t) ? ')' : '.'); if (/circleNum/.test(t)) return String.fromCharCode(0x245F + n); return n + (/ParenR/.test(t) ? ')' : /ParenBoth/.test(t) ? ')' : '.'); }
function fxTextHTML(e){
  const [l, t, r, b] = e.ins || [0, 0, 0, 0];
  const pos = `left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;${fxTransform(e)}`;
  const ps = e.paras.map(p => {
    const fs = (p.runs[0] || p.end).sz, lh = p.ln.px ? `${p.ln.px}px` : (p.ln.m * 1.2).toFixed(3);
    const inner = p.runs.length ? p.runs.map(r => r.t === '\n' ? '<br>' : `<span style="font-size:${r.sz}px;font-weight:${r.b ? 700 : 400};${r.i ? 'font-style:italic;' : ''}${r.u || r.st ? `text-decoration:${[r.u && 'underline', r.st && 'line-through'].filter(Boolean).join(' ')};` : ''}color:${r.c};${r.a < 1 ? `opacity:${r.a};` : ''}font-family:${FX_FONT(r)};${r.spc ? `letter-spacing:${r.spc}px;` : ''}${r.base ? `vertical-align:${r.base > 0 ? 'super' : 'sub'};font-size:${r.sz * .7}px;` : ''}${r.hl ? `background:${r.hl};` : ''}${r.grad ? `background:${gradCSS(r.grad, r.gang)};-webkit-background-clip:text;background-clip:text;color:transparent;` : ''}">${esc(r.t)}</span>`).join('') : `<span style="font-size:${p.end.sz}px">&nbsp;</span>`;
    const bu = p.bu ? `<span style="display:inline-block;width:${Math.max(0, -p.indent) || fs * .9}px;margin-left:${p.indent < 0 ? 0 : 0}px;color:${p.bu.c || (p.runs[0] || p.end).c};font-size:${fs}px;font-family:${FX_FONT(p.runs[0] || p.end)}">${esc(buText(p))}</span>` : '';
    return `<p style="margin:${p.sb}px 0 ${p.sa}px 0;padding-left:${p.marL + (p.bu && p.indent < 0 ? p.indent : 0)}px;${!p.bu && p.indent ? `text-indent:${p.indent}px;` : ''}text-align:${p.align};line-height:${lh};font-size:${fs}px">${bu}${inner}</p>`;
  }).join('');
  return `<div class="fx-t" style="${pos}padding:${t}px ${r}px ${b}px ${l}px;justify-content:${e.anchor === 'middle' ? 'center' : e.anchor === 'bottom' ? 'flex-end' : 'flex-start'};${e.wrap === false ? 'white-space:pre;' : ''}${e.vert ? 'writing-mode:vertical-rl;' : ''}">${ps}</div>`;
}

/* ---------- 고정 장표 → PPT ---------- */
async function fxToPPT(sl, pptx, e, IN, hx){
  const base = {x: IN(e.x), y: IN(e.y), w: Math.max(.01, IN(e.w)), h: Math.max(.01, IN(e.h)), ...(e.rot ? {rotate: e.rot} : {}), ...(e.fh ? {flipH: true} : {}), ...(e.fv ? {flipV: true} : {})};
  if (e.k === 'g'){
    const fill = e.fill ? {color: hx(e.fill), transparency: Math.round((1 - (e.fa ?? 1)) * 100)} : {type: 'none'};
    const line = e.line ? {color: hx(e.line), width: +(e.lw * .75).toFixed(2), transparency: Math.round((1 - (e.la ?? 1)) * 100), ...(e.dash ? {dashType: e.dash} : {}), ...(e.arrow ? {endArrowType: 'triangle'} : {})} : {type: 'none'};
    const shadow = e.shd ? {shadow: {type: 'outer', blur: +(e.shd.blur * .75).toFixed(1), offset: +(e.shd.dist * .75).toFixed(1), angle: Math.round(e.shd.dir), color: hx(e.shd.c), opacity: +(e.shd.a ?? .35).toFixed(2)}} : {};
    Object.assign(base, shadow);
    if (e.prst === 'custom' && e.pts?.length){
      const P = e.pts.map(p => p.close ? {close: true} : {...p, x: IN(p.x), y: IN(p.y), ...(p.curve ? {curve: {...p.curve, x1: IN(p.curve.x1), y1: IN(p.curve.y1), ...(p.curve.x2 != null ? {x2: IN(p.curve.x2), y2: IN(p.curve.y2)} : {})}} : {})});
      sl.addShape(pptx.ShapeType.custGeom, {...base, fill, line, points: P});
    } else {
      const shp = e.prst && e.prst !== 'custom' ? e.prst : 'rect';
      sl.addShape(shp, {...base, fill, line, ...(shp === 'roundRect' ? {rectRadius: IN(Math.min(e.w, e.h) * Math.min(.5, (e.adj?.[0] ?? 16667) / 1e5))} : {})});
    }
    return;
  }
  if (e.k === 'rt'){
    const runs = [];
    e.paras.forEach((p, pi) => {
      const fsPt = +((p.runs[0] || p.end).sz * .75).toFixed(1);
      const popt = {align: p.align, paraSpaceBefore: +(p.sb * .75).toFixed(1), paraSpaceAfter: +(p.sa * .75).toFixed(1), ...(p.ln.px ? {lineSpacing: +(p.ln.px * .75).toFixed(1)} : {lineSpacingMultiple: +p.ln.m.toFixed(2)}),
        ...(p.bu ? {bullet: p.bu.ch ? {characterCode: p.bu.ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'), indent: Math.max(6, +((p.marL || Math.abs(p.indent || 0)) * .75).toFixed(1) || 14)} : {type: 'number', numberStartAt: p.bu.n || 1, indent: Math.max(6, +((p.marL || Math.abs(p.indent || 0)) * .75).toFixed(1) || 14)}} : {}),
        ...(p.marL && !p.bu ? {indentLevel: 0, margin: 0} : {})};
      const list = p.runs.length ? p.runs : [{...p.end, t: ' '}];
      list.forEach((r, ri) => {
        if (r.t === '\n'){ if (runs.length) runs[runs.length - 1].options.breakLine = true; return; }
        runs.push({text: r.t || ' ', options: {...(ri === 0 ? popt : {}), fontSize: +(r.sz * .75).toFixed(1), bold: !!r.b, italic: !!r.i, underline: r.u ? {style: 'sng'} : undefined, strike: r.st ? 'sngStrike' : undefined, color: hx(r.c), transparency: r.a < 1 ? Math.round((1 - r.a) * 100) : 0, fontFace: r.ea || r.lt || 'Pretendard', charSpacing: r.spc ? +(r.spc * .75).toFixed(2) : undefined, lang: 'ko-KR', superscript: r.base > 0 || undefined, subscript: r.base < 0 || undefined, highlight: r.hl ? hx(r.hl) : undefined}});
      });
      if (pi < e.paras.length - 1 && runs.length) runs[runs.length - 1].options.breakLine = true;
    });
    const [l, t, r, b] = e.ins || [0, 0, 0, 0];
    sl.addText(runs, {...base, margin: [l * .75, r * .75, b * .75, t * .75], valign: e.anchor, wrap: e.wrap !== false, fit: 'none', ...(e.vert ? {vert: e.vert === 'vert270' ? 'vert270' : 'eaVert'} : {})});
  }
}
