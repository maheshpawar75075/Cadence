  /* ---------------------------------------------------------------------
   * SVG Chart engine (no external dependencies)
   * ------------------------------------------------------------------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
  function uid(prefix) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }

  // Stacked bar chart — modern gradient version
  function stackedBarChart(days, opts) {
    const width = opts.width || 640, height = opts.height || 220;
    const padL = 36, padB = 28, padT = 20, padR = 12;
    const chartW = width - padL - padR, chartH = height - padT - padB;
    const n = days.length;
    const gap = chartW * 0.04;
    const barW = (chartW - gap * (n - 1)) / n;
    const seed = opts.uidSeed || 0;
    let defs = "", bars = "", gridLines = "";

    CATEGORY_ORDER.forEach((c) => {
      defs += `<linearGradient id="${catGradId(c, seed)}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${CATEGORIES[c].color}"/><stop offset="100%" stop-color="${CATEGORIES[c].color}99"/>
      </linearGradient>`;
    });

    [0, 25, 50, 75, 100].forEach((g) => {
      const y = padT + chartH - (g / 100) * chartH;
      gridLines += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#EEF0F6" stroke-width="1" stroke-dasharray="${g === 0 ? "0" : "4 4"}"/>`;
      gridLines += `<text x="${padL - 10}" y="${y + 4}" font-size="9" fill="#9AA1B4" text-anchor="end" font-family="'Inter',sans-serif" font-weight="500">${g}%</text>`;
    });

    days.forEach((day, i) => {
      const x = padL + i * (barW + gap);
      const totalH = (day.pct / 100) * chartH;
      let yCursor = padT + chartH;
      const totalDoneForDay = CATEGORY_ORDER.reduce((s, c) => s + (day.byCategory[c]?.done || 0), 0) || 1;
      let segSvg = "";
      CATEGORY_ORDER.forEach((c) => {
        const cat = day.byCategory[c];
        if (!cat || cat.done <= 0) return;
        const segH = (cat.done / totalDoneForDay) * totalH;
        yCursor -= segH;
        segSvg += `<rect x="${x}" y="${yCursor}" width="${barW}" height="${Math.max(segH, 0)}" fill="url(#${catGradId(c, seed)})"/>`;
      });
      const barTop = padT + chartH - totalH;
      const isToday = day.isToday;
      bars += `<g class="fl-bar-group" style="animation-delay:${i * 0.07}s">
        <rect x="${x}" y="${padT}" width="${barW}" height="${chartH}" rx="8" fill="#F4F5FA"/>
        <clipPath id="clip_${i}_${seed}"><rect x="${x}" y="${barTop}" width="${barW}" height="${Math.max(totalH, 0)}" rx="8"/></clipPath>
        <g clip-path="url(#clip_${i}_${seed})">${segSvg}</g>
        ${totalH > 6 ? `<text x="${x + barW / 2}" y="${barTop - 6}" font-size="9.5" font-weight="700" fill="${isToday ? "#6C5CE7" : "#6b7280"}" text-anchor="middle" font-family="'Inter',sans-serif">${day.pct}%</text>` : ""}
        ${isToday ? `<rect x="${x - 2}" y="${padT - 2}" width="${barW + 4}" height="${chartH + 4}" rx="10" fill="none" stroke="#6C5CE7" stroke-width="1.6" opacity="0.75"/>` : ""}
        <text x="${x + barW / 2}" y="${height - 8}" font-size="10.5" font-weight="${isToday ? 700 : 500}" fill="${isToday ? "#6C5CE7" : "#6b7280"}" text-anchor="middle" font-family="'Inter',sans-serif">${esc(day.label)}</text>
      </g>`;
    });

    return `<svg class="fl-stacked-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${gridLines}${bars}</svg>`;
  }

  // Donut chart for category breakdown — rounded caps, glow
  function donutChart(segments, opts) {
    const size = opts.size || 180;
    const cx = size / 2, cy = size / 2, r = size * 0.36, stroke = size * 0.17;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    const circumference = 2 * Math.PI * r;
    let offset = 0, paths = "";
    segments.forEach((seg, i) => {
      if (seg.value <= 0) return;
      const frac = seg.value / total;
      const dash = frac * circumference;
      paths += `<circle class="fl-donut-seg" style="animation-delay:${i * 0.08}s" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += dash;
    });
    return `<svg class="fl-donut-chart" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#F1F2F8" stroke-width="${stroke}"/>
      ${paths}
      ${opts.showCenter !== false ? `<text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="${size * 0.13}" font-weight="800" fill="#2d2d3a" font-family="'Poppins',sans-serif">${esc(opts.centerBig || "")}</text>
      <text x="${cx}" y="${cy + size * 0.11}" text-anchor="middle" font-size="${size * 0.065}" fill="#9AA1B4" font-family="'Inter',sans-serif" font-weight="600">${esc(opts.centerSmall || "")}</text>` : ""}
    </svg>`;
  }

  // Smooth bezier trend line with gradient fill
  function lineChart(points, opts) {
    const width = opts.width || 640, height = opts.height || 160;
    const padL = 32, padR = 12, padT = 18, padB = 24;
    const chartW = width - padL - padR, chartH = height - padT - padB;
    const n = points.length;
    const stepX = n > 1 ? chartW / (n - 1) : 0;
    const gid = uid("grad");
    const lineGid = uid("lg");
    const coords = points.map((p, i) => {
      const x = padL + i * stepX;
      const y = padT + chartH - (Math.max(0, Math.min(100, p.value)) / 100) * chartH;
      return [x, y];
    });

    let smoothPath = "";
    if (coords.length === 1) {
      smoothPath = `M ${coords[0][0]} ${coords[0][1]}`;
    } else {
      smoothPath = `M ${coords[0][0]} ${coords[0][1]}`;
      for (let i = 0; i < coords.length - 1; i++) {
        const [x0, y0] = coords[i];
        const [x1, y1] = coords[i + 1];
        const mx = (x0 + x1) / 2;
        smoothPath += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
      }
    }
    const areaPath = `${smoothPath} L ${coords[coords.length - 1][0]} ${padT + chartH} L ${coords[0][0]} ${padT + chartH} Z`;

    let gridLines = "";
    [0, 50, 100].forEach((g) => {
      const y = padT + chartH - (g / 100) * chartH;
      gridLines += `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#EEF0F6" stroke-width="1" stroke-dasharray="${g === 0 ? "0" : "4 4"}"/>`;
      gridLines += `<text x="${padL - 8}" y="${y + 4}" font-size="9" fill="#9AA1B4" text-anchor="end" font-family="'Inter',sans-serif">${g}%</text>`;
    });

    let labels = "";
    const labelEvery = Math.max(1, Math.ceil(n / 8));
    points.forEach((p, i) => {
      if (i % labelEvery === 0 || i === n - 1) {
        labels += `<text x="${coords[i][0]}" y="${height - 6}" font-size="9" fill="#9AA1B4" text-anchor="middle" font-family="'Inter',sans-serif">${esc(p.label)}</text>`;
      }
    });

    const last = coords[coords.length - 1];
    const dot = last ? `<circle class="fl-line-dot" cx="${last[0]}" cy="${last[1]}" r="5" fill="url(#${lineGid})" stroke="#fff" stroke-width="2"/>` : "";

    return `<svg class="fl-line-chart" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6C5CE7" stop-opacity="0.38"/><stop offset="100%" stop-color="#6C5CE7" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${lineGid}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6C5CE7"/><stop offset="100%" stop-color="#00B894"/>
        </linearGradient>
      </defs>
      ${gridLines}
      <path class="fl-line-area" d="${areaPath}" fill="url(#${gid})"/>
      <path class="fl-line-path" d="${smoothPath}" fill="none" stroke="url(#${lineGid})" stroke-width="2.8" stroke-linecap="round"/>
      ${dot}
      ${labels}
    </svg>`;
  }

  // GitHub-style month heatmap
  function monthHeatmap(year, month, pctFn, opts) {
    const cell = opts.cell || 15, gapPx = opts.gap || 3;
    const total = daysInMonth(year, month);
    const firstOffset = weekdayMon0(new Date(year, month, 1));
    const cols = Math.ceil((total + firstOffset) / 7);
    const width = cols * (cell + gapPx);
    const height = 7 * (cell + gapPx) + 14;
    let cells = "";
    for (let d = 1; d <= total; d++) {
      const idx = d - 1 + firstOffset;
      const col = Math.floor(idx / 7), row = idx % 7;
      const x = col * (cell + gapPx), y = row * (cell + gapPx) + 14;
      const pct = pctFn(d);
      const color = pct === null ? "#F4F5F9" : heatColor(pct);
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="3.5" fill="${color}"><title>${MONTH_NAMES[month]} ${d}: ${pct === null ? "n/a" : pct + "%"}</title></rect>`;
    }
    return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
  }
  function heatColor(pct) {
    if (pct <= 0) return "#F4F5F9";
    if (pct < 25) return "#D9D2F9";
    if (pct < 50) return "#B3A4F2";
    if (pct < 75) return "#8C74EB";
    return "#6C5CE7";
  }


  function catGradId(c, seed) { return `cg_${c}_${seed}`; }

  // Modern radial gauge with gradient arc
  function radialGauge(pct, opts) {
    opts = opts || {};
    const size = opts.size || 128;
    const stroke = opts.stroke || 11;
    const r = (size - stroke) / 2 - 6;
    const cx = size / 2, cy = size / 2;
    const circ = 2 * Math.PI * r;
    const val = Math.max(0, Math.min(100, pct));
    const dash = (val / 100) * circ;
    const gid = uid("rg");
    const c1 = opts.color1 || "#6C5CE7";
    const c2 = opts.color2 || "#00B894";
    const glow = opts.glow || c1;
    return `<svg class="fl-radial-gauge" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="--fl-circ:${circ};--fl-dash:${dash}">
      <defs>
        <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
        </linearGradient>
        <filter id="${gid}_glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="${cx}" cy="${cy}" r="${r + 1}" fill="none" stroke="${glow}" stroke-width="${stroke + 4}" opacity="0.12"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#EEF0F6" stroke-width="${stroke}"/>
      <circle class="fl-gauge-arc" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="url(#${gid})" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ - dash}"
        transform="rotate(-90 ${cx} ${cy})" filter="url(#${gid}_glow)"/>
      <text x="${cx}" y="${cy - 2}" text-anchor="middle" font-size="${size * 0.19}" font-weight="800" fill="#2d2d3a" font-family="'Poppins',sans-serif">${val}%</text>
      ${opts.label ? `<text x="${cx}" y="${cy + size * 0.13}" text-anchor="middle" font-size="${size * 0.075}" fill="#9AA1B4" font-family="'Inter',sans-serif" font-weight="600">${esc(opts.label)}</text>` : ""}
    </svg>`;
  }

  // Horizontal category progress bars (returns HTML)
  function categoryBars(items) {
    if (!items.length) return `<div class="fl-cat-empty">No habits in this view yet.</div>`;
    return `<div class="fl-cat-bars">${items.map((it) => `
      <div class="fl-cat-row">
        <div class="fl-cat-meta">
          <span class="fl-cat-icon">${it.icon || ""}</span>
          <span class="fl-cat-name">${esc(it.label)}</span>
          <span class="fl-cat-pct">${it.pct}%</span>
        </div>
        <div class="fl-cat-track">
          <div class="fl-cat-fill" style="width:${it.pct}%;background:linear-gradient(90deg,${it.color},${it.colorLight || it.color}cc)"></div>
        </div>
        <div class="fl-cat-sub">${it.done}/${it.total} done</div>
      </div>`).join("")}</div>`;
  }

  // Compact 7-day bar chart for panels / popup
  function weekMiniChart(days, opts) {
    opts = opts || {};
    const width = opts.width || 280, height = opts.height || 100;
    const padL = 4, padR = 4, padT = 18, padB = 22;
    const chartW = width - padL - padR, chartH = height - padT - padB;
    const n = days.length;
    const gap = 6;
    const barW = (chartW - gap * (n - 1)) / n;
    const seed = opts.uidSeed || 0;
    let defs = "", bars = "";
    CATEGORY_ORDER.forEach((c) => {
      defs += `<linearGradient id="${catGradId(c, seed)}" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="${CATEGORIES[c].color}"/><stop offset="100%" stop-color="${CATEGORIES[c].color}88"/>
      </linearGradient>`;
    });
    days.forEach((day, i) => {
      const x = padL + i * (barW + gap);
      const totalH = (day.pct / 100) * chartH;
      const barTop = padT + chartH - totalH;
      let yCursor = padT + chartH;
      let segSvg = "";
      const totalDone = CATEGORY_ORDER.reduce((s, c) => s + (day.byCategory[c]?.done || 0), 0) || 1;
      CATEGORY_ORDER.forEach((c) => {
        const cat = day.byCategory[c];
        if (!cat || cat.done <= 0) return;
        const segH = (cat.done / totalDone) * totalH;
        yCursor -= segH;
        segSvg += `<rect x="${x}" y="${yCursor}" width="${barW}" height="${Math.max(segH, 0)}" fill="url(#${catGradId(c, seed)})"/>`;
      });
      const isToday = day.isToday;
      bars += `<g class="fl-mini-bar" style="animation-delay:${i * 0.06}s">
        <rect x="${x}" y="${padT}" width="${barW}" height="${chartH}" rx="${barW / 2}" fill="#F4F5FA"/>
        <clipPath id="mc_${seed}_${i}"><rect x="${x}" y="${barTop}" width="${barW}" height="${Math.max(totalH, 0)}" rx="${barW / 2}"/></clipPath>
        <g clip-path="url(#mc_${seed}_${i})">${segSvg || `<rect x="${x}" y="${padT + chartH - 3}" width="${barW}" height="3" rx="1.5" fill="#E2E4EE"/>`}</g>
        ${totalH > 4 ? `<text x="${x + barW / 2}" y="${barTop - 4}" font-size="8" font-weight="700" fill="${isToday ? "#6C5CE7" : "#9AA1B4"}" text-anchor="middle" font-family="'Inter',sans-serif">${day.pct}%</text>` : ""}
        ${isToday ? `<rect x="${x - 1.5}" y="${padT - 2}" width="${barW + 3}" height="${chartH + 4}" rx="${barW / 2 + 1}" fill="none" stroke="#6C5CE7" stroke-width="1.5" opacity="0.7"/>` : ""}
        <text x="${x + barW / 2}" y="${height - 2}" font-size="9" font-weight="${isToday ? 700 : 500}" fill="${isToday ? "#6C5CE7" : "#8a8fa3"}" text-anchor="middle" font-family="'Inter',sans-serif">${esc(day.label)}</text>
      </g>`;
    });
    return `<svg class="fl-week-mini" viewBox="0 0 ${width} ${height}" width="100%" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${bars}</svg>`;
  }

  function sparkline(values, opts) {
    const width = opts.width || 100, height = opts.height || 28;
    const color = opts.color || "#6C5CE7";
    const n = values.length;
    const stepX = n > 1 ? width / (n - 1) : 0;
    const pts = values.map((v, i) => [i * stepX, height - (Math.max(0, Math.min(1, v)) * (height - 4)) - 2]);
    let path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
    return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

