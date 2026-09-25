/* ============================================================
   cibil.js — CIBIL Credit Report Module
   Loads data/cibil.json and renders the CIBIL/Credit section.
   ============================================================ */

const CIBIL = (() => {
  let data = null;

  async function load() {
    const res = await fetch('data/cibil.json');
    data = await res.json();
    return data;
  }

  function rs(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function renderScore() {
    const el = document.getElementById('cibilScore');
    if (!data) return;
    const d = data;
    const scoreColor = d.score >= 750 ? 'var(--green)' : d.score >= 700 ? 'var(--amber)' : 'var(--red)';
    const ringColor = d.score >= 750 ? 'var(--green)' : d.score >= 700 ? 'var(--amber)' : 'var(--red)';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
        <div class="ring" style="--p:${d.score/9};--c:${ringColor};width:120px;height:120px;flex-shrink:0;">
          <div class="ring-spark"></div>
          <span style="font-size:2rem;font-weight:800;color:${scoreColor};position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">${d.score}</span>
        </div>
        <div>
          <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.3rem;">As on ${d.scoreAsOn}</div>
          <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.3rem;">Control Number: <strong style="color:var(--fg);">${d.controlNumber}</strong></div>
          <div style="font-size:0.78rem;color:var(--fg-dim);margin-bottom:0.8rem;">Range: 300 – 900</div>
          <div class="progress-bar" style="height:8px;background:var(--bg);border-radius:999px;overflow:hidden;">
            <div class="progress-fill" style="width:${(d.score/900)*100}%;background:${ringColor};height:8px;border-radius:999px;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--fg-dim);margin-top:0.2rem;">
            <span>300</span><span>550 (Poor)</span><span>750 (Good)</span><span>900</span>
          </div>
          <div style="margin-top:0.6rem;font-size:0.9rem;font-weight:500;color:${scoreColor};">
            ${d.score >= 750 ? 'Good score — lenders view favorably' : d.score >= 700 ? 'Fair score — room to improve' : 'Below average — needs attention'}
          </div>
        </div>
      </div>
    `;
  }

  function renderPersonal() {
    const el = document.getElementById('cibilPersonal');
    if (!data) return;
    const p = data.personal;
    let html = `
      <div class="table-wrap"><table class="data-table">
        <tr><td style="width:140px;"><b>Name</b></td><td>${p.name}</td></tr>
        <tr><td><b>Date of Birth</b></td><td>${p.dob}</td></tr>
        <tr><td><b>Gender</b></td><td>${p.gender}</td></tr>
        <tr><td><b>PAN</b></td><td class="mono">${p.pan}</td></tr>
        <tr><td><b>Voter ID</b></td><td class="mono">${p.voterId}</td></tr>
        <tr><td><b>CKYC</b></td><td class="mono">${p.ckyc}</td></tr>
        <tr><td><b>Mobile</b></td><td>${p.mobile}</td></tr>
        <tr><td><b>Emails</b></td><td>${p.emails.join('<br>')}</td></tr>
      </table></div>
    `;
    el.innerHTML = html;
  }

  function renderAddresses() {
    const el = document.getElementById('cibilAddresses');
    if (!data) return;
    let html = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Type</th><th>Address</th><th>Reported</th></tr></thead><tbody>`;
    data.personal.addresses.forEach(a => {
      html += `<tr>
        <td style="font-weight:500;"><span class="tag tag-blue">${a.type}</span></td>
        <td style="font-size:0.8rem;color:var(--fg);">${a.address}</td>
        <td style="color:var(--fg-dim);">${a.reported}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  function renderOpenAccounts() {
    const el = document.getElementById('cibilOpenAccounts');
    if (!data) return;
    let html = `
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Lender</th><th>Type</th><th>Account No</th><th>Limit / Sanctioned</th><th>Balance</th><th>Status</th><th>Opened</th><th>Last Payment</th></tr></thead>
        <tbody>`;
    data.openAccounts.forEach(a => {
      const balColor = a.currentBalance > 50000 ? 'var(--warn)' : a.currentBalance > 0 ? 'var(--bad)' : 'var(--good)';
      const statusTag = a.status === 'STD' ? 'tag-green' : a.status === 'SMA' ? 'tag-amber' : 'tag-red';
      const isCard = a.type === 'Credit Card';
      html += `<tr>
        <td style="font-weight:500;"><i class="fas fa-${isCard?'_credit-card':'_money-bill-wave'}" style="color:var(--accent-light);margin-right:0.3rem;"></i>${a.member}</td>
        <td><span class="tag ${isCard?'tag-blue':'tag-accent'}">${a.type}</span></td>
        <td class="mono" style="font-size:0.72rem;">${a.accountNo}</td>
        <td class="mono">${isCard ? rs(a.creditLimit) : rs(a.sanctioned)}</td>
        <td class="mono" style="color:${balColor};font-weight:600;">${rs(a.currentBalance)}</td>
        <td><span class="tag ${statusTag}">${a.status}</span></td>
        <td class="sub" style="font-size:0.75rem;">${a.dateOpened}</td>
        <td class="sub" style="font-size:0.75rem;">${a.dateOfLastPayment}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    // DPD warnings
    const dpdAccounts = data.openAccounts.filter(a => a.dpdSummary && a.dpdSummary !== '0 across all months' && a.dpdSummary !== 'No DPD recorded');
    if (dpdAccounts.length > 0) {
      html += `<div style="margin-top:0.8rem;border-top:1px solid var(--border);padding-top:0.6rem;">
        <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.4rem;">Days Past Due (DPD) — Accounts with recorded delays</div>
        <div style="display:flex;flex-direction:column;gap:0.3rem;">`;
      dpdAccounts.forEach(a => {
        html += `<div style="display:flex;align-items:flex-start;gap:0.5rem;font-size:0.85rem;">
          <span style="color:var(--bad);margin-top:0.15rem;">⚠</span>
          <span style="font-weight:500;">${a.member}</span>
          <span style="color:var(--fg-dim);margin-left:auto;">${a.dpdSummary}</span>
        </div>`;
      });
      html += '</div></div>';
    }

    // Utilization
    const totalLimit = data.openAccounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + a.creditLimit, 0);
    const totalUsed = data.openAccounts.filter(a => a.type === 'Credit Card').reduce((s, a) => s + a.currentBalance, 0);
    const utilPct = totalLimit > 0 ? ((totalUsed / totalLimit) * 100).toFixed(1) : 0;
    html += `<div style="margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid var(--border);">
      <div class="two">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Total credit card limit</span><div style="font-size:1rem;font-weight:700;" class="mono">${rs(totalLimit)}</div></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Total used</span><div style="font-size:1rem;font-weight:700;color:${utilPct > 30 ? 'var(--warn)' : 'var(--green)'};" class="mono">${rs(totalUsed)}</div></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Overall utilization</span><div style="font-size:1rem;font-weight:700;color:${utilPct > 30 ? 'var(--warn)' : 'var(--green)'};" class="mono">${utilPct}%</div></div>
      </div>
      <div class="progress-bar" style="margin-top:0.5rem;">
        <div class="progress-fill" style="width:${utilPct}%;background:${utilPct > 50 ? 'var(--bad)' : utilPct > 30 ? 'var(--warn)' : 'var(--green)'};"></div>
      </div>
      <span style="font-size:0.72rem;color:var(--fg-dim);margin-top:0.2rem;">Target: below 30% for best score impact</span>
    </div>`;

    el.innerHTML = html;
  }

  function renderClosedAccounts() {
    const el = document.getElementById('cibilClosedAccounts');
    if (!data) return;
    if (data.closedAccounts.length === 0) {
      el.innerHTML = '<div style="color:var(--fg-dim);font-size:0.85rem;">No closed accounts on record.</div>';
      return;
    }
    let html = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>Lender</th><th>Type</th><th>Account No</th><th>Sanctioned</th><th>Closed On</th><th>Last Payment</th></tr></thead><tbody>`;
    data.closedAccounts.forEach(a => {
      html += `<tr>
        <td style="font-weight:500;">${a.member}</td>
        <td><span class="tag tag-accent">${a.type}</span></td>
        <td class="mono" style="font-size:0.72rem;">${a.accountNo}</td>
        <td class="mono">${rs(a.sanctioned)}</td>
        <td style="color:var(--fg-dim);">${a.dateClosed}</td>
        <td style="color:var(--fg-dim);">${a.dateOfLastPayment}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }

  function renderEnquiries() {
    const el = document.getElementById('cibilEnquiries');
    if (!data) return;
    const now = new Date();
    let html = `
      <div class="grid g2" style="margin-bottom:0.8rem;">
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Total Hard Enquiries</div>
          <div class="stat-value warn" style="font-size:1.4rem;">${data.enquiries.length}</div>
          <div class="stat-change" style="color:var(--fg-muted);">Since 2005 on file</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Recent (last 12 months)</div>
          <div class="stat-value ${data.enquiries.filter(e=>isWithinYear(e.date)).length > 0 ? 'warn' : 'good'}" style="font-size:1.4rem;">${data.enquiries.filter(e=>isWithinYear(e.date)).length}</div>
          <div class="stat-change" style="color:var(--fg-muted);">Impact window active</div>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Bank</th><th>Purpose</th><th>Date of Enquiry</th><th>Impact Status</th></tr></thead><tbody>`;
    data.enquiries.forEach(e => {
      const withinYear = isWithinYear(e.date);
      html += `<tr>
        <td style="font-weight:500;">${e.member}</td>
        <td><span class="tag tag-accent">${e.purpose}</span></td>
        <td class="mono">${e.date}</td>
        <td>${withinYear 
          ? '<span class="tag tag-amber">Active — within 12 months</span>' 
          : '<span class="tag tag-green">Aged — minimal impact</span>'}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    html += `<div style="margin-top:0.6rem;font-size:0.78rem;color:var(--fg-muted);font-style:italic;border-left:2px solid var(--accent);padding-left:0.7rem;">
      "Hard enquiries stay on your report for 24 months but impact your score primarily in the first 12 months. Multiple enquiries in a short period signal credit-hungriness to lenders."
    </div>`;

    el.innerHTML = html;
  }

  function isWithinYear(dateStr) {
    const d = new Date(dateStr.split('/').reverse().join('-')); // DD/MM/YYYY -> YYYY-MM-DD
    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return d >= yearAgo;
  }

  function renderFactors() {
    const el = document.getElementById('cibilFactors');
    if (!data) return;
    const f = data.scoreFactors;
    const factors = [
      { label: 'Payment History', value: f.paymentHistory, color: 'var(--good)' },
      { label: 'Credit Utilization', value: f.creditUtilization, color: 'var(--warn)' },
      { label: 'Credit Mix', value: f.creditMix, color: 'var(--good)' },
      { label: 'Hard Enquiries', value: f.enquiries, color: 'var(--warn)' },
      { label: 'Credit Age', value: f.creditAge, color: 'var(--good)' }
    ];
    let html = `<div style="display:flex;flex-direction:column;gap:0.6rem;">`;
    factors.forEach(f2 => {
      html += `<div style="padding:0.6rem 0.8rem;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;">
          <span style="color:${f2.color};font-weight:700;font-size:0.82rem;">${f2.label}</span>
        </div>
        <p style="font-size:0.8rem;color:var(--fg-muted);margin:0;line-height:1.4;">${f2.value}</p>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderActions() {
    const el = document.getElementById('cibilActions');
    if (!data) return;
    let html = `<div style="display:flex;flex-direction:column;gap:0.4rem;">`;
    data.actions.forEach(a => {
      const priorityLabel = a.priority.charAt(0).toUpperCase() + a.priority.slice(1);
      const priorityClass = a.priority === 'high' ? 'tag-red' : a.priority === 'medium' ? 'tag-amber' : a.priority === 'low' ? 'tag-blue' : 'tag-accent';
      html += `<div style="display:flex;align-items:flex-start;gap:0.6rem;padding:0.5rem 0.6rem;background:var(--bg);border-radius:8px;border:1px solid var(--border);">
        <span class="tag ${priorityClass}" style="margin-top:0.15rem;">${priorityLabel}</span>
        <div style="flex:1;">
          <div style="font-size:0.85rem;font-weight:500;">${a.action}</div>
          <div style="font-size:0.72rem;color:var(--fg-dim);margin-top:0.15rem;">Expected impact: ${a.impact}</div>
        </div>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function stripPrivateData(data) {
    if (!data) return data;
    const copy = JSON.parse(JSON.stringify(data));
    // Mask sensitive fields for display if needed — keeping full here since it's private/local
    return copy;
  }

  return {
    async init() {
      data = await load();
      renderScore();
      renderPersonal();
      renderAddresses();
      renderOpenAccounts();
      renderClosedAccounts();
      renderEnquiries();
      renderFactors();
      renderActions();
    },
    get data() { return data; }
  };
})();
