/* ============================================================
   ui/Components.js — Reusable UI rendering functions
   Uses DOM API directly (no template libraries needed).
   ============================================================ */

const UI = (() => {
  /* ---- Currency formatting ---- */
  function fmtCurrency(amount, currency = 'INR', showSymbol = true) {
    if (amount === null || amount === undefined) return '—';
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    if (num < 0) formatted = '-' + formatted;
    if (showSymbol) return '₹' + formatted;
    return formatted;
  }

  function fmtCurrencyShort(amount) {
    if (amount === null || amount === undefined) return '—';
    const num = Math.abs(parseFloat(amount) || 0);
    if (num >= 10000000) return '₹' + (num / 10000000).toFixed(1) + ' Cr';
    if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + ' L';
    if (num >= 1000) return '₹' + (num / 1000).toFixed(1) + ' K';
    return '₹' + num.toLocaleString('en-IN');
  }

  /* ---- Percentage ---- */
  function fmtPct(value, decimals = 0) {
    if (value === null || value === undefined) return '—';
    return parseFloat(value).toFixed(decimals) + '%';
  }

  /* ---- Date formatting ---- */
  function fmtDate(dateStr, format = 'en-IN') {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(format === 'en-US' ? 'en-US' : 'en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch { return dateStr; }
  }

  function fmtShortDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return dateStr; }
  }

  function fmtRelativeTime(isoString) {
    if (!isoString) return '—';
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return diffMin + 'm ago';
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h ago';
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return diffDays + 'd ago';
    return fmtDate(isoString);
  }

  /* ---- Status badges ---- */
  function statusBadge(status, options = {}) {
    const colors = options.colors || {
      active: 'var(--green)',
      inactive: 'var(--fg-muted)',
      completed: 'var(--accent)',
      pending: 'var(--amber)',
      in_progress: 'var(--blue)',
      building: 'var(--blue)',
      planning: 'var(--amber)',
      paused: 'var(--fg-muted)',
      idea: 'var(--fg-dim)',
      closed: 'var(--fg-muted)',
      archived: 'var(--fg-dim)',
      overdue: 'var(--red)',
      cancelled: 'var(--red)'
    };
    const text = options.texts || {
      active: 'Active', inactive: 'Inactive', completed: 'Completed',
      pending: 'Pending', in_progress: 'In Progress', building: 'Building',
      planning: 'Planning', paused: 'Paused', idea: 'Idea',
      closed: 'Closed', archived: 'Archived', overdue: 'Overdue',
      cancelled: 'Cancelled', done: 'Done'
    };
    const color = colors[status] || 'var(--fg-muted)';
    const label = text[status] || status;
    return `<span style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.2rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600;background:${color}22;color:${color};border:1px solid ${color}44;">${label}</span>`;
  }

  /* ---- Progress bar ---- */
  function progressBar(value, max = 100, options = {}) {
    const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    const color = options.color || (pct <= 50 ? 'var(--green)' : pct <= 80 ? 'var(--amber)' : 'var(--red)');
    const showLabel = options.showLabel !== false;
    const height = options.height || '6px';
    const rounded = options.rounded !== false;
    return `
      <div style="width:100%;${showLabel ? 'display:flex;align-items:center;gap:0.5rem;' : ''}">
        <div style="flex:1;height:${height};background:rgba(255,255,255,0.06);border-radius:${rounded ? '999px' : '0'};">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:${rounded ? '999px' : '0'};transition:width 0.4s ease;"></div>
        </div>
        ${showLabel ? `<span style="font-size:0.72rem;color:var(--fg-muted);font-weight:600;white-space:nowrap;min-width:3.5rem;text-align:right;">${pct.toFixed(0)}%</span>` : ''}
      </div>
    `;
  }

  /* ---- Metric card ---- */
  function metricCard(label, value, options = {}) {
    const { subtext, icon, color, trend, size } = options;
    const cardColor = color || 'var(--accent)';
    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;${size === 'sm' ? 'padding:0.75rem;' : ''}${size === 'lg' ? 'padding:1.25rem;' : ''}">
        ${icon ? `<div style="font-size:1.2rem;color:${cardColor};margin-bottom:0.4rem;">${icon}</div>` : ''}
        <div style="font-size:0.72rem;color:var(--fg-muted);font-weight:500;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.25rem;">${label}</div>
        <div style="font-size:${size === 'sm' ? '1rem' : '1.2rem'};font-weight:700;color:var(--fg);${trend ? 'display:flex;align-items:baseline;gap:0.4rem;' : ''}">
          ${value}
          ${trend ? `<span style="font-size:0.7rem;font-weight:600;color:${trend > 0 ? 'var(--green)' : trend < 0 ? 'var(--red)' : 'var(--fg-muted)'};">${trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} ${Math.abs(trend).toFixed(1)}%</span>` : ''}
        </div>
        ${subtext ? `<div style="font-size:0.7rem;color:var(--fg-muted);margin-top:0.2rem;">${subtext}</div>` : ''}
      </div>
    `;
  }

  /* ---- Section header ---- */
  function sectionHeader(title, subtitle = '', icon = '') {
    return `
      <div class="section-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          ${icon ? `<span style="font-size:1.3rem;color:var(--accent-light);">${icon}</span>` : ''}
          <div>
            <h2 style="font-size:1.15rem;font-weight:700;color:var(--fg);letter-spacing:-0.02em;margin:0;">${title}</h2>
            ${subtitle ? `<p style="font-size:0.78rem;color:var(--fg-muted);margin-top:0.15rem;">${subtitle}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /* ---- Card wrapper ---- */
  function card(title, content, options = {}) {
    const { subtitle, icon, className, style } = options;
    return `
      <div class="card${className ? ' ' + className : ''}" style="${style || ''}">
        <div class="card-header">
          ${icon ? `<i class="${icon}" style="color:var(--accent-light);margin-right:0.5rem;"></i>` : ''}
          <h3 style="font-size:0.85rem;font-weight:600;color:var(--fg);margin:0;letter-spacing:-0.01em;">${title}</h3>
          ${subtitle ? `<span style="font-size:0.7rem;color:var(--fg-muted);margin-left:0.5rem;">${subtitle}</span>` : ''}
        </div>
        <div class="card-body">${content}</div>
      </div>
    `;
  }

  /* ---- Empty state ---- */
  function emptyState(message, icon = 'fa-inbox', action = null) {
    return `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2.5rem 1rem;text-align:center;color:var(--fg-muted);">
        <i class="fas ${icon}" style="font-size:2rem;margin-bottom:0.75rem;opacity:0.5;"></i>
        <p style="font-size:0.85rem;max-width:280px;line-height:1.5;">${message}</p>
        ${action ? `<div style="margin-top:0.75rem;">${action}</div>` : ''}
      </div>
    `;
  }

  /* ---- KBD / keyboard hint ---- */
  function kbd(keys) {
    if (!keys) return '';
    const parts = keys.split('+');
    return `<span style="display:inline-flex;align-items:center;gap:0.15rem;background:rgba(255,255,255,0.08);border:1px solid var(--border);border-radius:4px;padding:0.1rem 0.35rem;font-family:var(--font-mono);font-size:0.68rem;color:var(--fg-muted);">${parts.map(p => `<kbd style="background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:0.05rem 0.25rem;font-size:0.65rem;">${p.trim()}</kbd>`).join('<span style="color:var(--fg-dim);margin:0 0.1rem;">+</span>')}</span>`;
  }

  /* ---- Scrollable container ---- */
  function scrollContainer(content, options = {}) {
    const { height, horizontal } = options;
    return `
      <div style="max-height:${height || '60vh'};overflow:${horizontal ? 'auto' : 'auto'};overflow-y:${horizontal ? 'hidden' : 'auto'};scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.1) transparent;">
        ${content}
      </div>
    `;
  }

  /* ---- FAB button ---- */
  function fab(label, onClick, icon = 'fa-plus') {
    return `
      <button class="fab" onclick="${onClick}" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:200;display:flex;align-items:center;justify-content:center;width:3rem;height:3rem;border-radius:50%;background:var(--accent);color:white;border:none;cursor:pointer;box-shadow:0 4px 16px var(--accent-glow);transition:transform 0.15s ease, box-shadow 0.15s ease;font-size:1.1rem;" title="${label}">
        <i class="fas ${icon}"></i>
      </button>
    `;
  }

  /* ---- Tag pill ---- */
  function tagPill(tag, color = 'var(--accent)') {
    return `<span style="display:inline-block;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.68rem;font-weight:500;background:${color}18;color:${color};border:1px solid ${color}30;white-space:nowrap;">${tag}</span>`;
  }

  function tagsList(tags, options = {}) {
    if (!tags || !tags.length) return '';
    const color = options.color || 'var(--accent)';
    return `<div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.5rem;">${tags.map(t => tagPill(t, color)).join('')}</div>`;
  }

  /* ---- Loading skeleton ---- */
  function skeleton(lines = 3, width = '100%') {
    return Array.from({ length: lines }, (_, i) =>
      `<div style="height:${i === 0 ? '1rem' : i === 1 ? '0.75rem' : '0.85rem'};background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:4px;width:${width};margin-bottom:0.5rem;"></div>`
    ).join('');
  }

  /* ---- Confirm dialog (simple) ---- */
  function confirmDialog(message, onConfirm, options = {}) {
    const title = options.title || 'Confirm';
    const confirmText = options.confirmText || 'Confirm';
    const cancelText = options.cancelText || 'Cancel';
    const danger = options.danger ? 'var(--red)' : 'var(--accent)';
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1.5rem;max-width:400px;width:100%;box-shadow:var(--shadow);">
        <h3 style="font-size:1rem;font-weight:700;color:var(--fg);margin-bottom:0.5rem;">${title}</h3>
        <p style="font-size:0.85rem;color:var(--fg-muted);line-height:1.5;margin-bottom:1.25rem;">${message}</p>
        <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
          <button style="padding:0.5rem 1rem;border-radius:var(--radius-sm);border:1px solid var(--border);background:var(--bg);color:var(--fg-muted);cursor:pointer;font-size:0.85rem;font-weight:500;">${cancelText}</button>
          <button style="padding:0.5rem 1rem;border-radius:var(--radius-sm);border:none;background:${danger};color:white;cursor:pointer;font-size:0.85rem;font-weight:600;">${confirmText}</button>
        </div>
      </div>
    `;
    const btns = overlay.querySelector('div').querySelectorAll('button');
    btns[0].onclick = () => overlay.remove();
    btns[1].onclick = () => { overlay.remove(); onConfirm(); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  /* ---- Interactive table ---- */
  function table(headers, rows, options = {}) {
    const { keyField, onClick, compact } = options;
    const thStyle = compact ? 'padding:0.5rem 0.75rem;font-size:0.72rem;' : 'padding:0.75rem 1rem;font-size:0.75rem;';
    const tdStyle = compact ? 'padding:0.45rem 0.75rem;font-size:0.8rem;border-top:1px solid var(--border);' : 'padding:0.65rem 1rem;font-size:0.82rem;border-top:1px solid var(--border);';
    return `
      <div style="overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius);background:var(--card);">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead>
            <tr style="background:var(--bg);border-bottom:1px solid var(--border);">
              ${headers.map((h, i) => `<th style="${thStyle}text-align:${i === 0 ? 'left' : 'right'};font-weight:600;color:var(--fg-muted);white-space:nowrap;">${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, ri) => `
              <tr style="${ri % 2 === 0 ? 'background:var(--card);' : 'background:rgba(255,255,255,0.015);'}">
                ${row.map((cell, ci) => `<td style="${tdStyle}text-align:${ci === 0 ? 'left' : 'right'};color:var(--fg);${onClick ? 'cursor:pointer;' : ''}"${onClick ? `onclick="${onClick(row)}"` : ''}>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ---- Two-column layout ---- */
  function twoCol(left, right, options = {}) {
    const { gap } = options;
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:${gap || '1.25rem'};align-items:start;">
        ${left}
        ${right}
      </div>
    `;
  }

  function splitCol(left, right, ratio = 1.2) {
    return `
      <div style="display:grid;grid-template-columns:${ratio}fr 1fr;gap:1.25rem;align-items:start;">
        ${left}
        ${right}
      </div>
    `;
  }

  /* ---- Divider ---- */
  function divider(label = '') {
    return `
      <div style="display:flex;align-items:center;gap:0.75rem;margin:1.25rem 0;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        ${label ? `<span style="font-size:0.7rem;color:var(--fg-dim);text-transform:uppercase;letter-spacing:0.06em;white-space:nowrap;">${label}</span>` : ''}
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
    `;
  }

  /* ---- Info row (label: value) ---- */
  function infoRow(label, value, options = {}) {
    const { mono, color, labelColor } = options;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid var(--border);${options.last ? 'border-bottom:none;' : ''}">
        <span style="font-size:0.78rem;color:${labelColor || 'var(--fg-muted)'};font-weight:500;">${label}</span>
        <span style="font-size:0.82rem;color:${color || 'var(--fg)'};${mono ? 'font-family:var(--font-mono);font-weight:600;' : ''}text-align:right;">${value}</span>
      </div>
    `;
  }

  function infoList(rows, options = {}) {
    return `<div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">${rows.map((r, i) => infoRow(r.label, r.value, { ...options, last: i === rows.length - 1 })).join('')}</div>`;
  }

  /* ---- Tab bar ---- */
  function tabBar(tabs, active, onChange) {
    return `
      <div style="display:flex;gap:0.25rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.35rem;margin-bottom:1rem;overflow-x:auto;">
        ${tabs.map((t, i) => `
          <button onclick="window._tabChange(${i})" style="flex:1;min-width:0;padding:0.5rem 0.75rem;border-radius:var(--radius-sm);border:none;background:${active === i ? 'var(--accent)' : 'transparent'};color:${active === i ? 'white' : 'var(--fg-muted)'};cursor:pointer;font-size:0.78rem;font-weight:600;transition:all 0.15s ease;white-space:nowrap;">${t}</button>
        `).join('')}
      </div>
    `;
  }

  /* ---- Toast notification ---- */
  let toastTimeout = null;
  function toast(message, type = 'success') {
    const colors = {
      success: 'var(--green)',
      error: 'var(--red)',
      warning: 'var(--amber)',
      info: 'var(--accent)'
    };
    const color = colors[type] || 'var(--accent)';
    // Remove existing toast
    const existing = document.querySelector('.premos-toast');
    if (existing) existing.remove();
    if (toastTimeout) clearTimeout(toastTimeout);
    const el = document.createElement('div');
    el.className = 'premos-toast';
    el.style.cssText = `
      position:fixed;bottom:1.5rem;right:1.5rem;z-index:1001;
      padding:0.75rem 1rem;border-radius:var(--radius-sm);
      background:${color};color:white;font-size:0.85rem;font-weight:500;
      box-shadow:var(--shadow);border:1px solid ${color}44;
      display:flex;align-items:center;gap:0.5rem;
      animation:slideIn 0.2s ease;
      max-width:360px;
    `;
    el.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> ${message}`;
    document.body.appendChild(el);
    toastTimeout = setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(1rem)';
      el.style.transition = 'all 0.2s ease';
      setTimeout(() => el.remove(), 250);
    }, 3500);
  }

  /* ---- Modal (simple) ---- */
  function showModal(title, bodyHTML, footerHTML, options = {}) {
    const { width, height } = options;
    // Remove existing modal
    const existing = document.querySelector('.premos-modal-overlay');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.className = 'premos-modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:900;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);width:${width || '500px'};max-width:90vw;max-height:${height || '80vh'};overflow-y:auto;box-shadow:var(--shadow);animation:fadeIn 0.15s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid var(--border);">
          <h3 style="font-size:1rem;font-weight:700;color:var(--fg);margin:0;">${title}</h3>
          <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="background:none;border:none;color:var(--fg-muted);cursor:pointer;font-size:1.2rem;padding:0.25rem;border-radius:4px;">&times;</button>
        </div>
        <div style="padding:1.25rem;">${bodyHTML}</div>
        ${footerHTML ? `<div style="padding:0.75rem 1.25rem;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:0.5rem;">${footerHTML}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    return overlay;
  }

  /* ---- Return public API ---- */
  return {
    fmtCurrency, fmtCurrencyShort, fmtPct, fmtDate, fmtShortDate, fmtRelativeTime,
    statusBadge, progressBar, metricCard, sectionHeader, card, emptyState,
    kbd, scrollContainer, fab, tagPill, tagsList, skeleton, confirmDialog,
    table, twoCol, splitCol, divider, infoRow, infoList, tabBar,
    toast, showModal
  };
})();

if (typeof window !== 'undefined') window.UI = UI;
