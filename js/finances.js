/* ============================================================
   finances.js — Financial Tracking Module
   Loads data/finances.json and renders all finance views.
   ============================================================ */

const Finances = (() => {
  let data = null;

  async function load() {
    const res = await fetch('data/finances.json');
    data = await res.json();
    return data;
  }

  function fmt(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function renderIncome() {
    const el = document.getElementById('incomeBreakdown');
    if (!data) return;
    const d = data.income;
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1rem;">
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Monthly</span>
          <div class="mono" style="font-size:1.6rem;font-weight:700;">${fmt(d.monthlyTotal)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Yearly</span>
          <div class="mono" style="font-size:1.6rem;font-weight:700;color:var(--green);">${fmt(d.yearlyTotal)}</div>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>Source</th><th>Monthly</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>
    `;
    d.streams.forEach(s => {
      const tagClass = s.status === 'active' ? 'tag-green' : 'tag-red';
      html += `<tr>
        <td style="font-weight:500;">${s.source}</td>
        <td class="mono">${fmt(s.monthly)}</td>
        <td><span class="tag tag-blue">${s.type}</span></td>
        <td><span class="tag ${tagClass}">${s.status}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    // Mini income chart (CSS bars)
    const max = Math.max(...d.history.map(h => h.total));
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.4rem;">Monthly Income Trend (₹)</div>
      <div style="display:flex;align-items:end;gap:0.3rem;height:80px;">`;
    d.history.forEach(h => {
      const pct = (h.total / max) * 100;
      html += `<div style="flex:1;text-align:center;font-size:0.62rem;color:var(--fg-dim);position:relative;">
        <div style="width:100%;background:var(--green-dim);border-radius:4px 4px 0 0;height:${pct}%;min-height:4px;transition:height 0.3s;"></div>
        <span style="position:absolute;bottom:-18px;left:0;right:0;margin:auto;">${h.month.slice(5)}</span>
      </div>`;
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  function renderExpenses() {
    const el = document.getElementById('expenseBreakdown');
    if (!data) return;
    const d = data.expenses;
    const budgetPct = Math.round((d.monthlyTotal / d.budget) * 100);
    const isOver = d.monthlyTotal > d.budget;
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Spent this month</span>
          <div class="mono" style="font-size:1.6rem;font-weight:700;color:${isOver ? 'var(--red)' : 'var(--green)'};">${fmt(d.monthlyTotal)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Budget</span>
          <div class="mono" style="font-size:1.2rem;font-weight:600;">${fmt(d.budget)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Remaining</span>
          <div class="mono" style="font-size:1.2rem;font-weight:600;color:${d.remaining >= 0 ? 'var(--green)' : 'var(--red)'};">${fmt(Math.abs(d.remaining))}</div>
        </div>
      </div>
      <div class="progress-bar" style="height:10px;margin-bottom:1rem;">
        <div class="progress-fill" style="width:${budgetPct}%;background:${isOver ? 'var(--red)' : 'var(--green)'};"></div>
      </div>
      <span style="font-size:0.78rem;color:var(--fg-muted);">${budgetPct}% of budget used</span>
      <table class="data-table" style="margin-top:0.8rem;">
        <thead><tr><th>Category</th><th>Spent</th><th>Budget</th><th>%</th></tr></thead>
        <tbody>
    `;
    d.categories.forEach(c => {
      const pctClass = c.pct > 90 ? 'tag-red' : c.pct > 75 ? 'tag-amber' : 'tag-green';
      html += `<tr>
        <td style="font-weight:500;">${c.name}</td>
        <td class="mono">${fmt(c.amount)}</td>
        <td class="mono">${fmt(c.budgeted)}</td>
        <td><span class="tag ${pctClass}">${c.pct}%</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    // Mini expense chart
    const maxExp = Math.max(...d.history.map(h => h.total));
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.4rem;">Monthly Expense Trend (₹)</div>
      <div style="display:flex;align-items=end;gap:0.3rem;height:80px;">`;
    d.history.forEach(h => {
      const pct = (h.total / maxExp) * 100;
      html += `<div style="flex:1;text-align:center;font-size:0.62rem;color:var(--fg-dim);position:relative;">
        <div style="width:100%;background:var(--red-dim);border-radius:4px 4px 0 0;height:${pct}%;min-height:4px;transition:height 0.3s;"></div>
        <span style="position:absolute;bottom:-18px;left:0;right:0;margin:auto;">${h.month.slice(5)}</span>
      </div>`;
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  function renderSavings() {
    const el = document.getElementById('savingsBreakdown');
    if (!data) return;
    const d = data.savings;
    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1rem;">
        <div>
          <span style="color:var(--fg-muted);font-size:0.78rem;">Net Worth</span>
          <div class="mono" style="font-size:1.5rem;font-weight:700;color:var(--green);">${fmt(d.netWorth)}</div>
          <span style="font-size:0.75rem;color:var(--green);">▲ ${fmt(d.netWorthChange)} this period</span>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.78rem;">Emergency Fund</span>
          <div style="font-size:1.1rem;font-weight:600;margin-top:0.2rem;">${fmt(d.emergencyFund.current)} / ${fmt(d.emergencyFund.target)}</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${(d.emergencyFund.current/d.emergencyFund.target)*100}%;background:var(--blue);"></div></div>
          <span style="font-size:0.72rem;color:var(--fg-muted);">${d.emergencyFund.monthsCovered} months covered</span>
        </div>
      </div>
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Asset Breakdown</div>
      <table class="data-table">
        <thead><tr><th>Asset</th><th>Value</th><th>%</th></tr></thead>
        <tbody>
    `;
    const total = d.components.cash + d.components.investments + d.components.realEstate + d.components.otherAssets;
    Object.entries(d.components).forEach(([k, v]) => {
      const label = k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' ');
      html += `<tr>
        <td style="font-weight:500;">${label}</td>
        <td class="mono">${fmt(v)}</td>
        <td>${(v/total*100).toFixed(1)}%</td>
      </tr>`;
    });
    html += `<tr style="font-weight:700;border-top:2px solid var(--border);">
      <td>Total Assets</td><td class="mono">${fmt(total)}</td><td>100%</td></tr>`;
    html += '</tbody></table>';

    // Liabilities
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Liabilities</div>
      <table class="data-table">
        <thead><tr><th>Type</th><th>Amount</th></tr></thead>
        <tbody>`;
    Object.entries(d.liabilities).forEach(([k, v]) => {
      if (k === 'total') return;
      const label = k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' ');
      html += `<tr>
        <td style="font-weight:500;">${label}</td>
        <td class="mono">${v > 0 ? fmt(v) : '—'}</td>
      </tr>`;
    });
    html += `<tr style="font-weight:700;border-top:2px solid var(--border);">
      <td>Total Liabilities</td><td class="mono">${fmt(d.liabilities.total)}</td></tr>`;
    html += '</tbody></table>';

    // Savings goals
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Savings Goals</div>
      <div style="display:flex;flex-direction:column;gap:0.4rem;">`;
    d.savingsGoals.forEach(g => {
      const pct = Math.round((g.current / g.target) * 100);
      const done = g.done ? 'tag-green' : 'tag-amber';
      html += `<div style="display:flex;align-items:center;gap:0.6rem;">
        <span class="tag ${done}" style="margin:0;">${g.done ? '✓ Done' : 'In Progress'}</span>
        <div style="flex:1;font-size:0.85rem;">
          <div style="font-weight:500;">${g.name}</div>
          <div style="font-size:0.72rem;color:var(--fg-dim);">${fmt(g.current)} / ${fmt(g.target)} (${pct}%)</div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${g.done ? 'var(--green)' : 'var(--accent)'};"></div></div>
        </div>
      </div>`;
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  function renderInvestments() {
    const el = document.getElementById('investmentsBreakdown');
    if (!data) return;
    const d = data.investments;
    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0.8rem;margin-bottom:1rem;">
        <div>
          <span style="color:var(--fg-muted);font-size:0.78rem;">Portfolio Value</span>
          <div class="mono" style="font-size:1.4rem;font-weight:700;color:var(--green);">${fmt(d.totalValue)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.78rem;">Total Return</span>
          <div class="mono" style="font-size:1.2rem;font-weight:600;color:var(--green);">${fmt(d.totalReturn)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.78rem;">Return %</span>
          <div class="mono" style="font-size:1.2rem;font-weight:600;color:var(--green);">${d.returnPct}%</div>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>Holding</th><th>Value</th><th>Return</th><th>Allocation</th></tr></thead>
        <tbody>
    `;
    d.holdings.forEach(h => {
      const retColor = h.returnPct > 0 ? 'var(--green)' : 'var(--red)';
      html += `<tr>
        <td style="font-weight:500;">${h.name}</td>
        <td class="mono">${fmt(h.value)}</td>
        <td class="mono" style="color:${retColor};">${h.returnPct > 0 ? '+' : ''}${h.returnPct}%</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <div class="progress-bar" style="flex:1;height:5px;">
              <div class="progress-fill" style="width:${h.allocation}%;background:var(--accent);"></div>
            </div>
            <span style="font-size:0.72rem;color:var(--fg-dim);">${h.allocation}%</span>
          </div>
        </td>
      </tr>`;
    });
    html += '</tbody></table>';

    // Contribution history
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.4rem;">Monthly Contributions (₹)</div>
      <div style="display:flex;align-items:end;gap:0.3rem;height:70px;">`;
    const maxContrib = Math.max(...d.contributionHistory.map(h => h.amount));
    d.contributionHistory.forEach(h => {
      const pct = (h.amount / maxContrib) * 100;
      html += `<div style="flex:1;text-align:center;font-size:0.62rem;color:var(--fg-dim);position:relative;">
        <div style="width:100%;background:var(--amber-dim);border-radius:4px 4px 0 0;height:${pct}%;min-height:4px;"></div>
        <span style="position:absolute;bottom:-16px;left:0;right:0;margin:auto;">${h.month.slice(5)}</span>
      </div>`;
    });
    html += '</div></div>';

    el.innerHTML = html;
  }

  function renderTaxes() {
    const el = document.getElementById('taxesBreakdown');
    if (!data) return;
    const d = data.taxes;
    let html = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1rem;">
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Estimated Tax Liability (${d.year})</span>
          <div class="mono" style="font-size:1.4rem;font-weight:700;">${fmt(d.estimatedLiability)}</div>
        </div>
        <div>
          <span style="color:var(--fg-muted);font-size:0.82rem;">Deductions Claimed</span>
          <div class="mono" style="font-size:1.2rem;font-weight:600;color:var(--green);">${fmt(d.deductionsClaimed)}</div>
        </div>
      </div>
      <table class="data-table">
        <thead><tr><th>Section</th><th>Claimed</th><th>Max</th><th>Status</th></tr></thead>
        <tbody>
    `;
    d.sections.forEach(s => {
      const used = Math.min(s.claimed, s.max);
      const pct = s.max > 0 ? Math.round((used / s.max) * 100) : 0;
      const status = pct >= 100 ? 'tag-green' : pct >= 75 ? 'tag-amber' : 'tag-blue';
      html += `<tr>
        <td style="font-weight:500;">${s.section}</td>
        <td class="mono">${fmt(s.claimed)}</td>
        <td class="mono">${fmt(s.max)}</td>
        <td><span class="tag ${status}">${pct}%</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    el.innerHTML = html;
  }

  // Public API
  return {
    async init() {
      data = await load();
      renderIncome();
      renderExpenses();
      renderSavings();
      renderInvestments();
      if (data.taxes) renderTaxes();
    },

    get data() { return data; }
  };
})();
