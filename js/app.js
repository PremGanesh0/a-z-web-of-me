/* ============================================================
   app.js — PREM OS Application Shell & Router
   ============================================================ */

/* ---- Import all modules ---- */
import { Database } from './core/Database.js';
import { Services } from './services/Services.js';
import { FinanceService } from './services/FinanceService.js';
import { HealthService } from './services/HealthService.js';
import { CareerService } from './services/CareerService.js';
import { UI } from './components/Components.js';

/* ---- Make globally accessible for inline onclick handlers ---- */
window.Database = Database;
window.Services = Services;
window.FinanceService = FinanceService;
window.HealthService = HealthService;
window.CareerService = CareerService;
window.UI = UI;
window._tabChange = null;
window._currentSection = 'overview';

/* ---- Navigation sections definition ---- */
const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: 'fa-compass', order: 0 },
  { id: 'timeline', label: 'Timeline', icon: 'fa-timeline', order: 1 },
  { id: 'goals', label: 'Goals', icon: 'fa-bullseye', order: 2 },
  { id: 'tasks', label: 'Tasks', icon: 'fa-check-circle', order: 3 },
  { id: 'finance', label: 'Finance', icon: 'fa-coins', order: 10 },
  { id: 'health', label: 'Health', icon: 'fa-heart-pulse', order: 11 },
  { id: 'career', label: 'Career', icon: 'fa-briefcase', order: 12 },
  { id: 'creator', label: 'Creator', icon: 'fa-video', order: 13 },
  { id: 'travel', label: 'Travel', icon: 'fa-plane', order: 14 },
  { id: 'projects', label: 'Projects', icon: 'fa-folder-open', order: 20 },
  { id: 'memories', label: 'Memories', icon: 'fa-images', order: 21 },
  { id: 'journal', label: 'Journal', icon: 'fa-book', order: 22 },
  { id: 'jarvis', label: 'JARVIS', icon: 'fa-robot', order: 30 },
  { id: 'settings', label: 'Settings', icon: 'fa-gear', order: 40 }
];

const NAV_PRI_PUBLIC = ['overview', 'timeline', 'goals', 'tasks', 'creator', 'projects', 'memories', 'journal'];
const NAV_PRI_PRIVATE = ['finance', 'health', 'career', 'travel', 'settings'];

/* ---- App State ---- */
const App = {
  db: null,
  finance: null,
  health: null,
  career: null,
  sidebarOpen: true,
  currentSection: 'overview',
  initialized: false
};

/* ---- Init Database & Services ---- */
async function init() {
  try {
    App.db = Database.init();
    // Load seed data if empty
    const seed = window.__PREMONOS_SEED__;
    if (seed && seed.entities) {
      const db = Database.getData();
      const existingKeys = db ? Object.keys(db.entities || {}) : [];
      const seedKeys = Object.keys(seed.entities);
      for (const key of seedKeys) {
        if (!existingKeys.includes(key) || (db.entities[key]?.length === 0)) {
          if (!db.entities[key]) db.entities[key] = [];
          for (const entity of seed.entities[key]) {
            if (!db.entities[key].some(e => e.id === entity.id)) {
              db.entities[key].push(entity);
            }
          }
        }
      }
      Database.setData(db);
      App.db = Database.init();
    }
    App.finance = new FinanceService();
    App.health = new HealthService();
    App.career = new CareerService();
  } catch (e) {
    console.error('Init error:', e);
    UI.toast('Failed to initialize: ' + e.message, 'error');
  }
  App.initialized = true;
  renderNav();
  renderSidebarToggles();
  bindKeyboardShortcuts();
  bindFAB();
  navigateTo('overview');
}

/* ---- Navigation Rendering ---- */
function renderNav() {
  const navEl = document.getElementById('mainNav');
  if (!navEl) return;

  const sorted = [...NAV_SECTIONS].sort((a, b) => a.order - b.order);
  const publicSections = sorted.filter(s => NAV_PRI_PUBLIC.includes(s.id));

  let html = `<div class="nav-section"><div class="nav-section-label">Core</div><div class="nav-items">`;
  html += publicSections.map(s => `
    <button class="nav-item" data-section="${s.id}" onclick="navigateTo('${s.id}')" style="display:flex;align-items:center;gap:0.55rem;width:100%;padding:0.55rem 0.75rem;border:none;background:transparent;border-radius:var(--radius-sm);color:var(--fg-muted);font-size:0.82rem;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s ease;">
      <i class="fas ${s.icon}" style="width:1rem;font-size:0.9rem;color:var(--accent-light);"></i>
      <span style="overflow:hidden;text-overflow:ellipsis;">${s.label}</span>
    </button>
  `).join('');
  html += `</div></div>`;

  html += `<div class="nav-divider"></div>`;

  const privateSections = sorted.filter(s => NAV_PRI_PRIVATE.includes(s.id));
  html += `<div class="nav-section"><div class="nav-section-label">Private</div><div class="nav-items">`;
  html += privateSections.map(s => `
    <button class="nav-item" data-section="${s.id}" onclick="navigateTo('${s.id}')" style="display:flex;align-items:center;gap:0.55rem;width:100%;padding:0.55rem 0.75rem;border:none;background:transparent;border-radius:var(--radius-sm);color:var(--fg-muted);font-size:0.82rem;font-weight:500;cursor:pointer;text-align:left;transition:all 0.15s ease;">
      <i class="fas ${s.icon}" style="width:1rem;font-size:0.9rem;color:var(--accent-light);"></i>
      <span style="overflow:hidden;text-overflow:ellipsis;">${s.label}</span>
    </button>
  `).join('');
  html += `</div></div>`;

  navEl.innerHTML = html;
  updateNavActiveState();
}

function renderSidebarToggles() {
  // Mobile toggle is handled by CSS + existing sidebar structure
}

function updateNavActiveState() {
  document.querySelectorAll('.nav-item').forEach(item => {
    const section = item.dataset.section;
    item.style.background = section === App.currentSection ? 'var(--accent)' : 'transparent';
    item.style.color = section === App.currentSection ? 'white' : 'var(--fg-muted)';
  });
}

/* ---- Navigation ---- */
window.navigateTo = function(sectionId) {
  if (!Database?.getData()) {
    UI.toast('Loading...', 'info');
    setTimeout(() => navigateTo(sectionId), 200);
    return;
  }
  App.currentSection = sectionId;
  updateNavActiveState();
  renderSection(sectionId);
  // Update browser title
  const section = NAV_SECTIONS.find(s => s.id === sectionId);
  const baseTitle = 'PREM OS — Personal Operating System';
  document.title = section ? `${section.label} — ${baseTitle}` : baseTitle;
};

async function renderSection(sectionId) {
  const container = document.getElementById('mainContent');
  if (!container) return;

  // Show loading
  container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;padding:3rem;color:var(--fg-muted);"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;margin-right:0.75rem;"></i> Loading ${sectionId}...</div>`;

  try {
    let html = '';
    switch (sectionId) {
      case 'overview': html = await renderOverview(); break;
      case 'timeline': html = await renderTimeline(); break;
      case 'goals': html = await renderGoals(); break;
      case 'tasks': html = await renderTasks(); break;
      case 'finance': html = await renderFinance(); break;
      case 'health': html = await renderHealth(); break;
      case 'career': html = await renderCareer(); break;
      case 'creator': html = await renderCreator(); break;
      case 'travel': html = await renderTravel(); break;
      case 'projects': html = await renderProjects(); break;
      case 'memories': html = await renderMemories(); break;
      case 'journal': html = await renderJournal(); break;
      case 'jarvis': html = renderJarvis(); break;
      case 'settings': html = await renderSettings(); break;
      default: html = `<div style="color:var(--fg-muted);padding:2rem;text-align:center;">Section "${sectionId}" not found.</div>`;
    }
    container.innerHTML = html;
    // Bind section-specific events
    bindSectionEvents(sectionId);
  } catch (e) {
    console.error('Render error:', e);
    container.innerHTML = `<div style="color:var(--red);padding:2rem;text-align:center;">Error rendering section: ${e.message}</div>`;
  }
}

/* ---- Bind keyboard shortcuts ---- */
function bindKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K → search / command palette (placeholder)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      UI.showModal('Search PREM OS', `
        <div style="padding:1rem 0;color:var(--fg-muted);text-align:center;">
          <i class="fas fa-search" style="font-size:2rem;margin-bottom:0.75rem;opacity:0.5;"></i>
          <p style="font-size:0.85rem;">Search across transactions, goals, tasks, journal, and more.</p>
          <p style="font-size:0.75rem;margin-top:0.5rem;color:var(--fg-dim);">Coming in phase 2 — connect to AI assistant.</p>
        </div>
      `);
    }
    // Escape → close modal
    if (e.key === 'Escape') {
      const modal = document.querySelector('.premos-modal-overlay');
      if (modal) modal.remove();
    }
  });
}

/* ---- FAB ---- */
function bindFAB() {
  const fab = document.getElementById('fabMain');
  if (!fab) return;
  // FAB behavior depends on current section — set in each render
}

/* ---- Section event binding ---- */
function bindSectionEvents(sectionId) {
  // Subsections handled per-section
}

/* ---- Render: Overview ---- */
async function renderOverview() {
  const financeDash = App.finance?.getDASHBOARD?.() || {};
  const healthDash = App.health?.getDASHBOARD?.() || {};
  const careerDash = App.career?.getDASHBOARD?.() || {};

  const metrics = [
    {
      label: 'Monthly Income',
      value: UI.fmtCurrency(financeDash.income || 0),
      trend: financeDash.incomeChange || 0,
      icon: 'fa-arrow-down',
      color: 'var(--green)',
      subtext: 'September 2026'
    },
    {
      label: 'Monthly Expenses',
      value: UI.fmtCurrency(financeDash.expense || 0),
      trend: financeDash.expenseChange || 0,
      icon: 'fa-arrow-up',
      color: 'var(--red)',
      subtext: 'September 2026'
    },
    {
      label: 'Net Worth',
      value: UI.fmtCurrency(financeDash.netWorth || 0),
      trend: null,
      icon: 'fa-scale-balanced',
      color: 'var(--accent)',
      subtext: `Assets: ${UI.fmtCurrencyShort(financeDash.assets || 0)} · Liabilities: ${UI.fmtCurrencyShort(financeDash.liabilities || 0)}`
    },
    {
      label: 'Total Debt',
      value: UI.fmtCurrency(financeDash.totalDebt || 0),
      icon: 'fa-credit-card',
      color: 'var(--red)',
      subtext: 'All outstanding loans & credit cards'
    },
    {
      label: 'Credit Utilization',
      value: UI.fmtPct(financeDash.creditUtilization || 0),
      icon: 'fa-circle-percentage',
      color: (financeDash.creditUtilization || 0) > 50 ? 'var(--red)' : (financeDash.creditUtilization || 0) > 30 ? 'var(--amber)' : 'var(--green)',
      subtext: 'Target: below 30%'
    },
    {
      label: 'Savings Rate',
      value: UI.fmtPct(financeDash.savingsRate || 0),
      icon: 'fa-piggy-bank',
      color: 'var(--green)',
      subtext: 'Income minus expenses'
    },
    {
      label: 'Weight',
      value: healthDash.fitness?.weight?.value ? `${healthDash.fitness.weight.value} kg` : '—',
      trend: healthDash.weightChange || 0,
      icon: 'fa-weight-scale',
      color: 'var(--accent)',
      subtext: healthDash.fitness?.weight?.date ? `Last: ${UI.fmtShortDate(healthDash.fitness.weight.date)}` : ''
    },
    {
      label: 'BMI',
      value: healthDash.fitness?.bmi?.value || '—',
      icon: 'fa-ruler',
      color: 'var(--blue)',
      subtext: healthDash.fitness?.bmi?.date ? `Last: ${UI.fmtShortDate(healthDash.fitness.bmi.date)}` : ''
    },
    {
      label: 'Habits Done Today',
      value: `${healthDash.completedHabitsToday || 0} / ${healthDash.totalActiveHabits || 0}`,
      icon: 'fa-circle-check',
      color: (healthDash.completedHabitsToday || 0) >= (healthDash.totalActiveHabits || 0) ? 'var(--green)' : 'var(--amber)',
      subtext: 'Today\'s targets'
    },
    {
      label: 'Current Role',
      value: careerDash.activeEmployment?.role || '—',
      icon: 'fa-briefcase',
      color: 'var(--blue)',
      subtext: careerDash.activeEmployment?.company || ''
    },
    {
      label: 'Expert Skills',
      value: `${careerDash.expertSkillCount || 0} / ${careerDash.skillCount || 0}`,
      icon: 'fa-certificate',
      color: 'var(--green)',
      subtext: 'Skills at 80%+ proficiency'
    },
    {
      label: 'Salary Growth',
      value: UI.fmtPct(careerDash.salaryGrowthPct || 0),
      icon: 'fa-chart-line',
      color: (careerDash.salaryGrowthPct ?? 0) > 0 ? 'var(--green)' : 'var(--red)',
      subtext: `Current: ${UI.fmtCurrencyShort(careerDash.salaryCurrent || 0)}/mo`
    }
  ];

  const recentTxns = App.finance?.getRecentTransactions?.(10) || [];
  const recentTxnsHTML = recentTxns.length > 0
    ? recentTxns.map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);">
        <div>
          <div style="font-size:0.82rem;color:var(--fg);">${t.description || t.type}</div>
          <div style="font-size:0.7rem;color:var(--fg-muted);">${UI.fmtDate(t.date)} · ${t.category_name || t.category_id || '—'}</div>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.82rem;font-weight:600;color:${t.type === 'income' ? 'var(--green)' : 'var(--red)'};">
          ${t.type === 'income' ? '+' : '-'} ₹{Math.abs(t.amount).toLocaleString('en-IN')}
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No transactions yet.</div>';

  // Activity log (today)
  const todayActivity = Database?.getTodayActivity?.() || [];
  const activityHTML = todayActivity.length > 0
    ? todayActivity.slice(0, 8).map(a => `
      <div style="display:flex;gap:0.5rem;padding:0.4rem 0;border-bottom:1px solid var(--border);align-items:flex-start;">
        <div style="min-width:3.5rem;font-size:0.72rem;color:var(--fg-muted);font-family:var(--font-mono);">${UI.fmtRelativeTime(a.timestamp)}</div>
        <div style="flex:1;font-size:0.82rem;color:var(--fg);">
          <span style="font-weight:600;color:var(--accent-light);">${a.action}</span>
          <span style="color:var(--fg-muted);"> ${a.entity_name || a.entity_type || ''}</span>
          <span style="color:var(--fg-dim);font-size:0.72rem;display:block;white-space:pre-wrap;">${a.change_summary}</span>
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No recent activity.</div>';

  const goalsDash = App.career?.getDASHBOARD?.().careerGoalsDashboard || [];
  const goalsHTML = goalsDash.filter(g => g.status === 'in_progress').slice(0, 3).map(g => `
    <div style="padding:0.5rem 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
        <span style="font-size:0.82rem;color:var(--fg);font-weight:500;">${g.title}</span>
        <span style="font-size:0.72rem;color:var(--accent-light);font-weight:600;">${g.progress}%</span>
      </div>
      ${UI.progressBar(g.current_value, g.target_value, { color: 'var(--accent)', height: '4px' })}
    </div>
  `).join('') || '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No active goals.</div>';

  // Build metrics grid
  const metricsGrid = metrics.map(m => UI.metricCard(m.label, m.value, {
    subtext: m.subtext, icon: `<i class="fas ${m.icon}"></i>`, color: m.color, trend: m.trend, size: 'sm'
  })).join('');

  return `
    ${UI.sectionHeader('PREM OS', 'My life. My work. My money. My journey.', '<i class="fas fa-compass"></i>')}
    <div style="margin-bottom:1.5rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.75rem;">
      <div style="display:flex;align-items:center;gap:1rem;">
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-light));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1rem;">PG</div>
          <div>
            <div style="font-size:1rem;font-weight:700;color:var(--fg);">Prem Ganesh</div>
            <div style="font-size:0.75rem;color:var(--fg-muted);">${Services?.Profile?.get()?.profession || 'Senior Software Engineer'}</div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.5rem;">
        ${UI.tagPill('Flutter Developer', 'var(--accent)')}
        ${UI.tagPill('Creator', 'var(--blue)')}
        ${UI.tagPill('Rider', 'var(--green)')}
      </div>
    </div>
    <div class="metrics-grid">${metricsGrid}</div>
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Recent Financial Activity', '', '<i class="fas fa-receipt"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;max-height:280px;overflow-y:auto;">${recentTxnsHTML}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Today\'s Activity', '', '<i class="fas fa-clock"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;max-height:280px;overflow-y:auto;">${activityHTML}</div>
      </div>
    </div>
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Active Goals', '', '<i class="fas fa-bullseye"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;max-height:200px;overflow-y:auto;">${goalsHTML}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Key Metrics at a Glance', '', '<i class="fas fa-chart-simple"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
          <div style="padding:0.5rem;background:rgba(0,206,201,0.08);border-radius:var(--radius-sm);border:1px solid rgba(0,206,201,0.2);">
            <div style="font-size:0.65rem;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">Cash Flow</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--green);font-family:var(--font-mono);">${UI.fmtCurrency(financeDash.netCashFlow || 0)}</div>
            <div style="font-size:0.7rem;color:var(--fg-muted);">This month</div>
          </div>
          <div style="padding:0.5rem;background:rgba(108,92,231,0.08);border-radius:var(--radius-sm);border:1px solid rgba(108,92,231,0.2);">
            <div style="font-size:0.65rem;color:var(--accent-light);text-transform:uppercase;letter-spacing:0.05em;">Net Worth</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--accent-light);font-family:var(--font-mono);">${UI.fmtCurrencyShort(financeDash.netWorth || 0)}</div>
            <div style="font-size:0.7rem;color:var(--fg-muted);">Total net worth</div>
          </div>
          <div style="padding:0.5rem;background:rgba(255,107,107,0.08);border-radius:var(--radius-sm);border:1px solid rgba(255,107,107,0.2);">
            <div style="font-size:0.65rem;color:var(--red);text-transform:uppercase;letter-spacing:0.05em;">Total Debt</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--red);font-family:var(--font-mono);">${UI.fmtCurrencyShort(financeDash.totalDebt || 0)}</div>
            <div style="font-size:0.7rem;color:var(--fg-muted);">Outstanding</div>
          </div>
          <div style="padding:0.5rem;background:rgba(0,206,201,0.08);border-radius:var(--radius-sm);border:1px solid rgba(0,206,201,0.2);">
            <div style="font-size:0.65rem;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">Savings Rate</div>
            <div style="font-size:1.4rem;font-weight:700;color:var(--green);font-family:var(--font-mono);">${UI.fmtPct(financeDash.savingsRate || 0)}</div>
            <div style="font-size:0.7rem;color:var(--fg-muted);">Of income saved</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---- Render: Timeline ---- */
async function renderTimeline() {
  const employmentTimeline = App.career?.getEmploymentTimeline?.() || [];
  const activities = Database?.getActivityLogs?.(30) || [];

  const employmentHTML = employmentTimeline.length > 0
    ? employmentTimeline.map((emp, i) => `
      <div style="display:flex;gap:1rem;position:relative;padding-left:1rem;margin-left:-0.5rem;border-left:2px solid var(--border);padding-bottom:1.5rem;">
        <div style="position:absolute;left:-0.65rem;top:0.25rem;width:0.8rem;height:0.8rem;border-radius:50%;background:${emp.isActive ? 'var(--accent)' : 'var(--fg-dim)'};border:2px solid var(--card);z-index:1;"></div>
        <div style="flex:1;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
            <div>
              <div style="font-size:0.85rem;font-weight:600;color:var(--fg);">${emp.role}</div>
              <div style="font-size:0.75rem;color:${emp.isActive ? 'var(--green)' : 'var(--fg-muted)'};font-weight:500;">${emp.company}</div>
            </div>
            ${UI.statusBadge(emp.status_record, { colors: { active: 'var(--green)', closed: 'var(--fg-muted)' }, texts: { active: 'Active', closed: 'Closed' } })}
          </div>
          <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.5rem;">
            <span>${emp.durationDisplay}</span>
            ${emp.startDate ? `<span>From ${UI.fmtDate(emp.startDate)}</span>` : ''}
            ${emp.endDate ? `<span>To ${UI.fmtDate(emp.endDate)}</span>` : emp.isActive ? '<span style="color:var(--green);">Present</span>' : ''}
          </div>
          ${emp.technologies?.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.4rem;">${emp.technologies.map(t => UI.tagPill(t, 'var(--blue)')).join('')}</div>` : ''}
          ${emp.responsibilities?.length ? `<ul style="font-size:0.72rem;color:var(--fg-muted);padding-left:1rem;margin:0.25rem 0;">${emp.responsibilities.slice(0, 3).map(r => `<li style="margin-bottom:0.15rem;">${r}</li>`).join('')}</ul>` : ''}
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);text-align:center;padding:2rem;">No employment history yet.</div>';

  const activityHTML = activities.length > 0
    ? activities.map(a => `
      <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.5rem 0;border-bottom:1px solid var(--border);">
        <div style="min-width:4rem;font-size:0.7rem;color:var(--fg-muted);font-family:var(--font-mono);">${UI.fmtRelativeTime(a.timestamp)}</div>
        <div style="flex:1;">
          <span style="font-size:0.82rem;color:var(--fg);font-weight:500;">${a.action === 'create' ? 'Created' : a.action === 'update' ? 'Updated' : a.action === 'delete' ? 'Deleted' : a.action === 'payment' ? 'Payment' : a.action}</span>
          <span style="color:var(--fg-muted);"> ${a.entity_name || a.entity_type}</span>
          <span style="color:var(--fg-dim);font-size:0.72rem;display:block;white-space:pre-wrap;margin-top:0.15rem;">${a.change_summary}</span>
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);text-align:center;padding:2rem;">No activity recorded yet.</div>';

  return `
    ${UI.sectionHeader('Timeline', 'Your life events, career history, and activity log', '<i class="fas fa-timeline"></i>')}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Career History', '', '<i class="fas fa-briefcase"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">${employmentHTML}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Activity Log', '', '<i class="fas fa-history"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;max-height:360px;overflow-y:auto;">${activityHTML}</div>
      </div>
    </div>
  `;
}

/* ---- Render: Goals ---- */
async function renderGoals() {
  const allGoals = [...(Services?.Goal?.getAll?.() || []), ...(Services?.FinancialGoal?.getAll?.() || [])];
  const activeGoals = allGoals.filter(g => g.status === 'active' || g.status === 'in_progress');
  const completedGoals = allGoals.filter(g => g.status === 'completed');

  const sortedActive = activeGoals.sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  const goalsCards = sortedActive.map(g => {
    const progress = g.progress || 0;
    const catColor = {
      finance: 'var(--green)', career: 'var(--blue)', health: 'var(--accent)',
      travel: 'var(--amber)', projects: 'var(--blue)', personal: 'var(--fg-muted)'
    }[g.category] || 'var(--accent)';
    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem;border-left:3px solid ${catColor};">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:var(--fg);">${g.title}</div>
            <div style="font-size:0.72rem;color:var(--fg-muted);margin-top:0.15rem;">${g.description || g.category || ''}</div>
          </div>
          ${UI.statusBadge(g.status, {
            colors: { active: 'var(--green)', in_progress: 'var(--blue)', completed: 'var(--accent)' },
            texts: { active: 'Active', in_progress: 'In Progress', completed: 'Completed' }
          })}
        </div>
        ${g.target || g.target_amount ? `
          <div style="margin-bottom:0.4rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">
              <span>Progress</span>
              <span style="color:${progress >= 75 ? 'var(--green)' : progress >= 40 ? 'var(--amber)' : 'var(--red)'};font-weight:600;">${progress}%</span>
            </div>
            ${UI.progressBar(progress, 100, { color: catColor, height: '5px' })}
          </div>
        ` : ''}
        <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.72rem;color:var(--fg-muted);">
          ${g.category ? `<span>Category: ${g.category}</span>` : ''}
          ${g.deadline ? `<span>Deadline: ${UI.fmtDate(g.deadline)}</span>` : ''}
          ${g.priority ? `<span style="color:${g.priority === 'critical' ? 'var(--red)' : g.priority === 'high' ? 'var(--amber)' : 'var(--fg-muted)'};">Priority: ${g.priority}</span>` : ''}
          ${g.target_amount ? `<span>Target: ${UI.fmtCurrency(g.target_amount)}</span>` : ''}
          ${g.current_amount ? `<span style="color:var(--accent-light);">Current: ${UI.fmtCurrency(g.current_amount)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('') || UI.emptyState('No active goals. Start by setting your first goal!', 'fa-bullseye');

  const completedCards = completedGoals.slice(0, 5).map(g => `
    <div style="display:flex;gap:0.75rem;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);">
      <div style="width:0.75rem;height:0.75rem;border-radius:50%;background:var(--accent);margin-top:0.15rem;"></div>
      <div>
        <div style="font-size:0.82rem;color:var(--fg);">${g.title}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">${g.category || ''}</div>
      </div>
      <div style="margin-left:auto;">${UI.statusBadge('completed', { colors: { completed: 'var(--accent)' }, texts: { completed: 'Completed' } })}</div>
    </div>
  `).join('') || '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No completed goals yet.</div>';

  return `
    ${UI.sectionHeader('Goals', 'Track your progress across all areas of life', '<i class="fas fa-bullseye"></i>')}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Active Goals', `${sortedActive.length} goals`, '<i class="fas fa-play"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${goalsCards}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Completed Goals', `${completedGoals.length} done`, '<i class="fas fa-check-circle"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;max-height:300px;overflow-y:auto;">${completedCards}</div>
      </div>
    </div>
  `;
}

/* ---- Render: Tasks ---- */
async function renderTasks() {
  const taskDash = Services?.Task?.getDashboard?.() || {};

  const overdueTasks = (taskDash.overdue || []).map(t => `
    <div style="display:flex;gap:0.75rem;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border);">
      <div style="width:0.75rem;height:0.75rem;border-radius:50%;background:var(--red);margin-top:0.15rem;"></div>
      <div style="flex:1;">
        <div style="font-size:0.82rem;color:var(--red);font-weight:600;">${t.title}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">${t.description || ''} · Due: ${UI.fmtDate(t.due_date)}</div>
      </div>
      ${UI.statusBadge('overdue', { colors: { overdue: 'var(--red)' }, texts: { overdue: 'Overdue' } })}
    </div>
  `).join('') || '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No overdue tasks.</div>';

  const pendingTasks = (taskDash.pending || []).map(t => `
    <div style="display:flex;gap:0.75rem;align-items:center;padding:0.6rem 0;border-bottom:1px solid var(--border);cursor:pointer;" onclick="if(typeof completeTask === 'function') completeTask('${t.id}')">
      <div style="width:0.85rem;height:0.85rem;border-radius:50%;border:2px solid ${t.priority === 'critical' ? 'var(--red)' : t.priority === 'high' ? 'var(--amber)' : 'var(--fg-muted)'};margin-top:0.1rem;display:flex;align-items:center;justify-content:center;">
        <i class="fas fa-check" style="font-size:0.5rem;color:white;opacity:0;"></i>
      </div>
      <div style="flex:1;">
        <div style="font-size:0.82rem;color:var(--fg);font-weight:500;">${t.title}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">${t.description || ''}</div>
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        ${UI.statusBadge(t.status, {
          colors: { pending: 'var(--amber)', in_progress: 'var(--blue)', completed: 'var(--green)' },
          texts: { pending: 'Pending', in_progress: 'In Progress', completed: 'Done' }
        })}
        <span style="font-size:0.7rem;color:var(--fg-dim);font-family:var(--font-mono);">${UI.fmtDate(t.due_date)}</span>
      </div>
    </div>
  `).join('') || '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No pending tasks.</div>';

  const todayCount = taskDash.todayCount || 0;
  const weekCount = taskDash.weekCount || 0;
  const overdueCount = taskDash.overdueCount || 0;

  return `
    ${UI.sectionHeader('Tasks', 'What needs your attention right now', '<i class="fas fa-check-circle"></i>')}
    <div class="tasks-stats">
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;text-align:center;flex:1;">
        <div style="font-size:0.65rem;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.05em;">Due Today</div>
        <div style="font-size:2rem;font-weight:700;color:${todayCount > 0 ? 'var(--amber)' : 'var(--green)'};margin:0.25rem 0;">${todayCount}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">tasks due today</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;text-align:center;flex:1;">
        <div style="font-size:0.65rem;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.05em;">Due This Week</div>
        <div style="font-size:2rem;font-weight:700;color:var(--blue);margin:0.25rem 0;">${weekCount}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">tasks this week</div>
      </div>
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;text-align:center;flex:1;">
        <div style="font-size:0.65rem;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.05em;">Overdue</div>
        <div style="font-size:2rem;font-weight:700;color:${overdueCount > 0 ? 'var(--red)' : 'var(--green)'};margin:0.25rem 0;">${overdueCount}</div>
        <div style="font-size:0.7rem;color:var(--fg-muted);">tasks past due</div>
      </div>
    </div>
    <div class="dashboard-lower" style="margin-top:1.25rem;">
      <div class="dashboard-section">
        ${UI.sectionHeader('Overdue Tasks', `${overdueCount} tasks`, '<i class="fas fa-exclamation-triangle"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${overdueTasks}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Pending Tasks', `${taskDash.totalActive || 0} tasks`, '<i class="fas fa-list"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;max-height:340px;overflow-y:auto;">${pendingTasks}</div>
      </div>
    </div>
  `;
}

/* ---- Render: Finance ---- */
async function renderFinance() {
  const dash = App.finance?.getDASHBOARD?.() || {};
  const accounts = App.finance?.getAccountBalances?.() || [];
  const categoryBreakdown = dash.categoryBreakdown || [];
  const recentTxns = App.finance?.getRecentTransactions?.(15) || [];

  // Stats row
  const statsHTML = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${UI.metricCard('Monthly Income', UI.fmtCurrency(dash.income || 0), { icon: '<i class="fas fa-arrow-down"></i>', color: 'var(--green)', trend: dash.incomeChange || 0, size: 'sm' })}
      ${UI.metricCard('Monthly Expenses', UI.fmtCurrency(dash.expense || 0), { icon: '<i class="fas fa-arrow-up"></i>', color: 'var(--red)', trend: dash.expenseChange || 0, size: 'sm' })}
      ${UI.metricCard('Net Cash Flow', UI.fmtCurrency(dash.netCashFlow || 0), { icon: '<i class="fas fa-scale-balanced"></i>', color: dash.netCashFlow >= 0 ? 'var(--green)' : 'var(--red)', size: 'sm' })}
      ${UI.metricCard('Net Worth', UI.fmtCurrency(dash.netWorth || 0), { icon: '<i class="fas fa-coins"></i>', color: 'var(--accent)', size: 'sm' })}
      ${UI.metricCard('Total Debt', UI.fmtCurrency(dash.totalDebt || 0), { icon: '<i class="fas fa-credit-card"></i>', color: 'var(--red)', size: 'sm' })}
      ${UI.metricCard('Credit Util.', UI.fmtPct(dash.creditUtilization || 0), { icon: '<i class="fas fa-circle-percentage"></i>', color: (dash.creditUtilization || 0) > 50 ? 'var(--red)' : 'var(--green)', size: 'sm' })}
    </div>
  `;

  // Accounts table
  const accountsTable = accounts.length > 0
    ? UI.table(
      ['Account', 'Type', 'Balance', 'Limit', 'Util.', 'Status'],
      accounts.map(a => [
        `<div style="display:flex;align-items:center;gap:0.5rem;"><span style="font-size:0.9rem;">${typeIcon(a.type)}</span><span>${a.name}</span></div>`,
        a.type.replace('_', ' '),
        `<span style="font-family:var(--font-mono);font-weight:600;color:${a.balance === 0 ? 'var(--fg-muted)' : 'var(--fg)'};">${UI.fmtCurrency(a.current_balance)}</span>`,
        a.credit_limit ? `<span style="font-family:var(--font-mono);color:var(--fg-muted);">${UI.fmtCurrency(a.credit_limit)}</span>` : '—',
        `<span style="color:${a.utilizationLevel === 'good' ? 'var(--green)' : a.utilizationLevel === 'warning' ? 'var(--amber)' : 'var(--red)'};font-weight:600;">${a.utilization}%</span>`,
        UI.statusBadge(a.status, { colors: { active: 'var(--green)', closed: 'var(--fg-muted)' }, texts: { active: 'Active', closed: 'Closed' } })
      ]),
      { onClick: (row) => `navigateTo('finance')` }
    )
    : UI.emptyState('No financial accounts. Add your first account to start tracking.', 'fa-wallet');

  // Category breakdown
  const catBreakdownHTML = categoryBreakdown.length > 0
    ? categoryBreakdown.map(c => `
      <div style="margin-bottom:0.6rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.2rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.8rem;color:var(--fg);">
            <span>${c.category.icon || '📌'}</span>
            <span>${c.category.name}</span>
          </div>
          <div style="display:flex;gap:0.75rem;align-items:center;font-size:0.75rem;">
            <span style="color:var(--fg-muted);">Budget: ${UI.fmtCurrency(c.budget || 0)}</span>
            <span style="font-family:var(--font-mono);font-weight:600;color:var(--fg);">Spent: ${UI.fmtCurrency(c.spent || 0)}</span>
            <span style="color:${c.utilPct > 90 ? 'var(--red)' : c.utilPct > 70 ? 'var(--amber)' : 'var(--green)'};font-weight:600;">${c.utilPct}%</span>
          </div>
        </div>
        ${UI.progressBar(c.spent || 0, c.budget || 0, { color: c.utilPct > 90 ? 'var(--red)' : c.utilPct > 70 ? 'var(--amber)' : 'var(--green)' })}
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No expenses this month.</div>';

  // Recent transactions
  const txnsHTML = recentTxns.length > 0
    ? recentTxns.map(t => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);cursor:pointer;">
        <div>
          <div style="font-size:0.82rem;color:var(--fg);font-weight:500;">${t.description || t.type}</div>
          <div style="font-size:0.7rem;color:var(--fg-muted);display:flex;gap:0.5rem;">
            <span>${UI.fmtDate(t.date)}</span>
            <span>·</span>
            <span>${t.category_name || '—'}</span>
            <span>·</span>
            <span>${t.account_id ? `Acct: ${t.account_id.slice(0, 6)}...` : '—'}</span>
          </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:${t.type === 'income' ? 'var(--green)' : t.type === 'expense' ? 'var(--red)' : 'var(--fg-muted)'};">
          ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}${UI.fmtCurrencyShort(t.amount)}
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No transactions yet.</div>';

  // Quick add buttons
  const quickAddHTML = `
    <div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap;">
      <button onclick="openAddTransactionModal()" style="flex:1;min-width:120px;padding:0.6rem 1rem;border:1px solid var(--border);background:var(--card);border-radius:var(--radius-sm);color:var(--fg);cursor:pointer;font-size:0.78rem;font-weight:500;transition:all 0.15s;">
        <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Transaction
      </button>
      <button onclick="openAddAccountModal()" style="flex:1;min-width:120px;padding:0.6rem 1rem;border:1px solid var(--border);background:var(--card);border-radius:var(--radius-sm);color:var(--fg);cursor:pointer;font-size:0.78rem;font-weight:500;transition:all 0.15s;">
        <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Account
      </button>
    </div>
  `;

  return `
    ${UI.sectionHeader('Finance', 'Your complete financial picture', '<i class="fas fa-coins"></i>')}
    ${statsHTML}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Financial Accounts', `${accounts.length} accounts`, '<i class="fas fa-wallet"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">${accountsTable}</div>
        ${quickAddHTML}
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('September 2026 — Spending by Category', '', '<i class="fas fa-chart-pie"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">${catBreakdownHTML}</div>
      </div>
    </div>
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Recent Transactions', '', '<i class="fas fa-receipt"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);max-height:300px;overflow-y:auto;">${txnsHTML}</div>
        ${quickAddHTML}
      </div>
      <div class="dashboard-section">
        <div id="financeDetails"></div>
      </div>
    </div>
  `;
}

function typeIcon(type) {
  const icons = {
    'checking': 'fa-building-columns',
    'savings': 'fa-piggy-bank',
    'credit_card': 'fa-credit-card',
    'loan': 'fa-file-invoice-dollar',
    'investment': 'fa-chart-line',
    'cash': 'fa-money-bill',
    'wallet': 'fa-wallet'
  };
  return `<i class="fas ${icons[type] || 'fa-circle'}"></i>`;
}

/* ---- Render: Health ---- */
async function renderHealth() {
  const dash = App.health?.getDASHBOARD?.() || {};
  const habits = dash.habits || [];
  const vitals = dash.vitals || {};

  const statCards = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${dash.fitness?.weight ? UI.metricCard('Weight', `${dash.fitness.weight.value} kg`, {
        icon: '<i class="fas fa-weight-scale"></i>', color: 'var(--accent)',
        subtext: `Last: ${UI.fmtShortDate(dash.fitness.weight.date)}`,
        trend: dash.weightChange || 0, size: 'sm'
      }) : ''}
      ${dash.fitness?.bmi ? UI.metricCard('BMI', `${dash.fitness.bmi.value}`, {
        icon: '<i class="fas fa-ruler"></i>', color: 'var(--blue)',
        subtext: `Last: ${UI.fmtShortDate(dash.fitness.bmi.date)}`, size: 'sm'
      }) : ''}
      ${dash.fitness?.bodyFat ? UI.metricCard('Body Fat', `${dash.fitness.bodyFat.value}%`, {
        icon: '<i class="fas fa-water"></i>', color: 'var(--accent-light)',
        subtext: `Last: ${UI.fmtShortDate(dash.fitness.bodyFat.date)}`, size: 'sm'
      }) : ''}
      ${vitals.heartRate ? UI.metricCard('Resting HR', `${vitals.heartRate.value} bpm`, {
        icon: '<i class="fas fa-heart"></i>', color: 'var(--red)',
        subtext: `Last: ${UI.fmtShortDate(vitals.heartRate.date)}`, size: 'sm'
      }) : ''}
      ${vitals.bloodPressureSystolic ? UI.metricCard('Blood Pressure', `${vitals.bloodPressureSystolic.value}/${vitals.bloodPressureDiastolic?.value || '—'}`, {
        icon: '<i class="fas fa-truck-medical"></i>', color: 'var(--amber)',
        subtext: `Last: ${UI.fmtShortDate(vitals.bloodPressureSystolic.date)}`, size: 'sm'
      }) : ''}
      ${vitals.bloodSugar ? UI.metricCard('Blood Sugar', `${vitals.bloodSugar.value} mg/dL`, {
        icon: '<i class="fas fa-droplet"></i>', color: 'var(--green)',
        subtext: `Last: ${UI.fmtShortDate(vitals.bloodSugar.date)}`, size: 'sm'
      }) : ''}
      ${UI.metricCard('Habits Done', `${dash.completedHabitsToday || 0}/${dash.totalActiveHabits || 0}`, {
        icon: '<i class="fas fa-circle-check"></i>', color: (dash.completedHabitsToday || 0) >= (dash.totalActiveHabits || 0) ? 'var(--green)' : 'var(--amber)', size: 'sm'
      })}
      ${UI.metricCard('Avg Steps (7d)', `${dash.avgSteps7d || 0}`, {
        icon: '<i class="fas fa-shoe-prints"></i>', color: 'var(--blue)', size: 'sm'
      })}
    </div>
  `;

  // Habits grid
  const habitsGrid = habits.length > 0
    ? habits.map(h => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.85rem;display:flex;gap:0.75rem;align-items:center;cursor:pointer;" onclick="if(typeof toggleHabit === 'function') toggleHabit('${h.id}')">
        <div style="width:2.2rem;height:2.2rem;border-radius:50%;background:${h.completedToday ? 'rgba(0,206,201,0.15)' : 'rgba(255,255,255,0.04)'};border:2px solid ${h.completedToday ? 'var(--green)' : 'var(--border)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas ${h.completedToday ? 'fa-check' : 'fa-circle'}" style="font-size:0.75rem;color:${h.completedToday ? 'var(--green)' : 'var(--fg-muted)'};"></i>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.82rem;font-weight:600;color:var(--fg);">${h.name}</div>
          <div style="font-size:0.7rem;color:var(--fg-muted);margin-top:0.1rem;">${h.description || ''}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:0.72rem;font-weight:600;color:${h.completedToday ? 'var(--green)' : 'var(--fg-muted)'};">${h.streakDisplay}</div>
          <div style="font-size:0.65rem;color:var(--fg-dim);">Best: ${h.bestDisplay}</div>
        </div>
      </div>
    `).join('')
    : UI.emptyState('No habits tracked yet. Create your first habit!', 'fa-circle-check', `
      <button onclick="openAddHabitModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Create Habit</button>
    `);

  // Vitals table
  const vitalsTable = Object.entries(vitals).filter(([_, v]) => v !== null).map(([key, v]) => [
    formatVitalLabel(key),
    `${v.value} ${v.unit || ''}`,
    UI.fmtShortDate(v.date),
    v.notes || '—'
  ]);
  const vitalsHTML = vitalsTable.length > 0
    ? UI.table(['Vital', 'Value', 'Last Recorded', 'Notes'], vitalsTable)
    : UI.emptyState('No vitals recorded yet.', 'fa-heart-pulse');

  return `
    ${UI.sectionHeader('Health', 'Physical metrics, habits, and wellness tracking', '<i class="fas fa-heart-pulse"></i>')}
    ${statCards}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Daily Habits', `${habits.length} active`, '<i class="fas fa-list-check"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;display:flex;flex-direction:column;gap:0.5rem;">${habitsGrid}</div>
        <div style="margin-top:0.75rem;">
          <button onclick="openAddHabitModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Habit
          </button>
        </div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Vitals', '', '<i class="fas fa-heart"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">${vitalsHTML}</div>
      </div>
    </div>
    <div style="margin-top:1rem;">
      <button onclick="openAddMetricModal()" style="padding:0.5rem 1rem;background:var(--bg-card);color:var(--fg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
        <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Log New Metric
      </button>
    </div>
  `;
}

function formatVitalLabel(key) {
  const labels = {
    weight: 'Weight', bmi: 'BMI', bodyFat: 'Body Fat',
    bloodPressureSystolic: 'BP (Systolic)', bloodPressureDiastolic: 'BP (Diastolic)',
    heartRate: 'Heart Rate', bloodSugar: 'Blood Sugar',
    cholesterolTotal: 'Cholesterol (Total)', cholesterolHDL: 'HDL', cholesterolLDL: 'LDL',
    triglycerides: 'Triglycerides'
  };
  return labels[key] || key;
}

/* ---- Render: Career ---- */
async function renderCareer() {
  const dash = App.career?.getDASHBOARD?.() || {};

  const statCards = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${dash.activeEmployment ? UI.metricCard('Current Role', dash.activeEmployment.role, {
        icon: '<i class="fas fa-briefcase"></i>', color: 'var(--blue)',
        subtext: `${dash.activeEmployment.company} · ${dash.activeEmployment.tenureDisplay}`, size: 'sm'
      }) : ''}
      ${dash.activeEmployment ? UI.metricCard('Monthly Salary', UI.fmtCurrencyShort(dash.activeEmployment.monthlySalary), {
        icon: '<i class="fas fa-money-bill"></i>', color: 'var(--green)',
        subtext: `Total: ${UI.fmtCurrencyShort(dash.salaryCurrent)} · Max: ${UI.fmtCurrencyShort(dash.salaryMax)}`, size: 'sm'
      }) : ''}
      ${UI.metricCard('Total Experience', dash.totalExperienceDisplay, {
        icon: '<i class="fas fa-clock"></i>', color: 'var(--accent)', size: 'sm'
      })}
      ${UI.metricCard('Expert Skills', `${dash.expertSkillCount || 0}`, {
        icon: '<i class="fas fa-certificate"></i>', color: 'var(--green)',
        subtext: `out of ${dash.skillCount || 0} total skills`, size: 'sm'
      })}
      ${UI.metricCard('Career Goals', `${dash.careerGoalsCompleted || 0}/${dash.careerGoalsProgress + dash.careerGoalsCompleted || 0}`, {
        icon: '<i class="fas fa-bullseye"></i>', color: 'var(--amber)', size: 'sm'
      })}
      ${UI.metricCard('Salary Growth', UI.fmtPct(dash.salaryGrowthPct || 0), {
        icon: '<i class="fas fa-chart-line"></i>', color: (dash.salaryGrowthPct ?? 0) > 0 ? 'var(--green)' : 'var(--red)',
        subtext: 'Growth vs first role', size: 'sm'
      })}
    </div>
  `;

  // Skills matrix
  const skillsMatrix = dash.skillsMatrix || [];
  const skillsHTML = skillsMatrix.length > 0
    ? skillsMatrix.map(group => `
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.72rem;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.4rem;">${group.category}</div>
        ${group.skills.map(s => `
          <div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;border-bottom:1px solid var(--border);">
            <span style="width:12rem;font-size:0.8rem;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.name}</span>
            <div style="flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;">
              <div style="width:${s.proficiency}%;height:100%;background:${s.proficiency >= 80 ? 'var(--green)' : s.proficiency >= 60 ? 'var(--blue)' : s.proficiency >= 40 ? 'var(--amber)' : 'var(--fg-muted)'};border-radius:2px;"></div>
            </div>
            <span style="width:2.5rem;font-size:0.7rem;color:var(--fg-muted);text-align:right;font-family:var(--font-mono);">${s.proficiency}%</span>
            <span style="width:4rem;font-size:0.65rem;color:${s.certified ? 'var(--green)' : 'var(--fg-dim)'};">${s.certified ? '✓' : ''}</span>
            <span style="width:5rem;font-size:0.65rem;color:var(--fg-dim);text-align:right;">${s.status}</span>
          </div>
        `).join('')}
      </div>
    `).join('')
    : UI.emptyState('No skills recorded.', 'fa-certificate', `
      <button onclick="openAddSkillModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Add Skill</button>
    `);

  // Employment timeline (compact)
  const timelineHTML = dash.timeline?.length > 0
    ? dash.timeline.map(emp => `
      <div style="display:flex;gap:0.75rem;align-items:flex-start;padding:0.6rem 0;border-bottom:1px solid var(--border);">
        <div style="width:0.6rem;height:0.6rem;border-radius:50%;background:${emp.isActive ? 'var(--accent)' : 'var(--fg-dim)'};flex-shrink:0;margin-top:0.25rem;"></div>
        <div style="flex:1;">
          <div style="font-size:0.82rem;font-weight:600;color:var(--fg);">${emp.role}</div>
          <div style="font-size:0.72rem;color:var(--fg-muted);">${emp.company}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:0.75rem;color:${emp.isActive ? 'var(--green)' : 'var(--fg-muted)'};">${emp.durationDisplay}</div>
          <div style="font-size:0.65rem;color:var(--fg-dim);">${emp.startDate ? UI.fmtShortDate(emp.startDate) : '—'}${emp.endDate ? ' — ' + UI.fmtShortDate(emp.endDate) : emp.isActive ? ' Present' : ''}</div>
        </div>
      </div>
    `).join('')
    : UI.emptyState('No employment history.', 'fa-timeline');

  // Top skills
  const topSkillsHTML = dash.topSkills?.length > 0
    ? dash.topSkills.map(s => `
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;">
        <span style="font-size:0.78rem;color:var(--fg);">${s.name}</span>
        <div style="flex:1;height:4px;background:rgba(255,255,255,0.06);border-radius:2px;">
          <div style="width:${s.proficiency}%;height:100%;background:var(--green);border-radius:2px;"></div>
        </div>
        <span style="font-size:0.7rem;color:var(--fg-muted);font-family:var(--font-mono);width:2.5rem;text-align:right;">${s.proficiency}%</span>
        ${s.certified ? '<span style="color:var(--green);font-size:0.7rem;">✓</span>' : ''}
      </div>
    `).join('')
    : '';

  return `
    ${UI.sectionHeader('Career', 'Professional growth, skills, and trajectory', '<i class="fas fa-briefcase"></i>')}
    ${statCards}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Skills Matrix', `${dash.skillCount || 0} skills across ${skillsMatrix.length} categories`, '<i class="fas fa-code"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${skillsHTML}</div>
        <div style="margin-top:0.75rem;">
          <button onclick="openAddSkillModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Skill
          </button>
        </div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Top Skills', 'Highest proficiency', '<i class="fas fa-trophy"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${topSkillsHTML || '<div style="color:var(--fg-muted);font-size:0.82rem;">No skills yet.</div>'}</div>
      </div>
    </div>
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Employment Timeline', '', '<i class="fas fa-timeline"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${timelineHTML}</div>
        <div style="margin-top:0.75rem;">
          <button onclick="openAddEmploymentModal()" style="padding:0.5rem 1rem;background:var(--bg-card);color:var(--fg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Employment
          </button>
        </div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Salary History', '', '<i class="fas fa-chart-bar"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;max-height:250px;overflow-y:auto;">
          ${dash.salaryHistory?.map(s => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);">
              <div>
                <div style="font-size:0.82rem;color:var(--fg);font-weight:500;">${s.role}${s.company ? ` @ ${s.company}` : ''}</div>
                <div style="font-size:0.7rem;color:var(--fg-muted);">${UI.fmtShortDate(s.start_date)}${s.end_date ? ' — ' + UI.fmtShortDate(s.end_date) : s.isActive ? ' — Present' : ''}</div>
              </div>
              <div style="font-family:var(--font-mono);font-size:0.85rem;font-weight:600;color:var(--green);">${UI.fmtCurrency(s.monthly)}/mo</div>
            </div>
          `).join('') || '<div style="color:var(--fg-muted);font-size:0.82rem;">No salary history.</div>'}
        </div>
      </div>
    </div>
  `;
}

/* ---- Render: Creator ---- */
async function renderCreator() {
  const socials = Services?.Social?.getPlatformSummary?.() || [];
  const totalFollowers = Services?.Social?.getTotalFollowers?.() || 0;

  const statsHTML = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${UI.metricCard('Total Followers', totalFollowers, {
        icon: '<i class="fas fa-users"></i>', color: 'var(--accent)',
        subtext: 'Across all platforms', size: 'sm'
      })}
      ${UI.metricCard('Platforms', socials.length, {
        icon: '<i class="fas fa-globe"></i>', color: 'var(--blue)', size: 'sm'
      })}
      ${UI.metricCard('YouTube Subs', socials.find(s => s.platform === 'youtube')?.subscribers || 0, {
        icon: '<i class="fas fa-youtube"></i>', color: 'var(--red)', size: 'sm'
      })}
      ${UI.metricCard('GitHub Followers', socials.find(s => s.platform === 'github')?.followers || 0, {
        icon: '<i class="fas fa-github"></i>', color: 'var(--fg-muted)', size: 'sm'
      })}
    </div>
  `;

  const socialsTable = socials.length > 0
    ? UI.table(
      ['Platform', 'Profile', 'Followers', 'Posts', 'Last Updated', 'Update Method'],
      socials.map(s => [
        `<div style="display:flex;align-items:center;gap:0.5rem;">
          <i class="fab fa-${s.platform}" style="font-size:1rem;color:var(--accent-light);"></i>
          <span style="font-size:0.8rem;color:var(--fg);">${s.display_name || s.platform}</span>
        </div>`,
        `<a href="${s.profile_url}" target="_blank" style="font-size:0.75rem;color:var(--accent-light);text-decoration:none;">${s.username || '—'}</a>`,
        `<span style="font-family:var(--font-mono);font-weight:600;font-size:0.85rem;">${s.followers?.toLocaleString('en-IN') || '0'}</span>`,
        `<span style="font-family:var(--font-mono);color:var(--fg-muted);">${s.posts || 0}</span>`,
        UI.fmtRelativeTime(s.last_updated),
        `<span style="font-size:0.7rem;color:var(--fg-muted);">${s.update_method === 'manual' ? 'Manual' : 'Automatic'}</span>`
      ])
    )
    : UI.emptyState('No social accounts configured.', 'fa-globe', `
      <button onclick="openAddSocialModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Add Social Account</button>
    `);

  return `
    ${UI.sectionHeader('Creator', 'Your content, channels, and audience', '<i class="fas fa-video"></i>')}
    ${statsHTML}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Social Accounts', `${socials.length} platforms`, '<i class="fas fa-share-nodes"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;">${socialsTable}</div>
        <div style="margin-top:0.75rem;">
          <button onclick="openAddSocialModal()" style="padding:0.5rem 1rem;background:var(--bg-card);color:var(--fg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Add Platform
          </button>
        </div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Dusty Tires — YouTube Channel', 'Motorcycle travel & adventure content', '<i class="fas fa-youtube"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;text-align:center;">
          <div style="font-size:2.5rem;color:var(--red);margin-bottom:0.5rem;"><i class="fab fa-youtube"></i></div>
          <div style="font-size:1rem;font-weight:700;color:var(--fg);">Dusty Tires</div>
          <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.75rem;">Motorcycle travel, adventure rides, photography</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;padding:0 0.5rem;">
            <div style="padding:0.75rem;background:rgba(255,107,107,0.08);border-radius:var(--radius-sm);border:1px solid rgba(255,107,107,0.2);">
              <div style="font-size:0.65rem;color:var(--red);text-transform:uppercase;">Subscribers</div>
              <div style="font-size:1.3rem;font-weight:700;color:var(--red);font-family:var(--font-mono);">${(socials.find(s => s.platform === 'youtube')?.subscribers || 0).toLocaleString('en-IN')}</div>
            </div>
            <div style="padding:0.75rem;background:rgba(0,206,201,0.08);border-radius:var(--radius-sm);border:1px solid rgba(0,206,201,0.2);">
              <div style="font-size:0.65rem;color:var(--green);text-transform:uppercase;">Videos</div>
              <div style="font-size:1.3rem;font-weight:700;color:var(--green);font-family:var(--font-mono);">${(socials.find(s => s.platform === 'youtube')?.posts || 0)}</div>
            </div>
            <div style="padding:0.75rem;background:rgba(108,92,231,0.08);border-radius:var(--radius-sm);border:1px solid rgba(108,92,231,0.2);">
              <div style="font-size:0.65rem;color:var(--accent-light);text-transform:uppercase;">Status</div>
              <div style="font-size:0.85rem;font-weight:500;color:var(--accent-light);">Building</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ---- Render: Travel ---- */
async function renderTravel() {
  const tripDash = Services?.Trip?.getDashboard?.() || {};

  const statsHTML = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${UI.metricCard('Trips Completed', tripDash.completed?.length || 0, {
        icon: '<i class="fas fa-flag-checkered"></i>', color: 'var(--green)', size: 'sm'
      })}
      ${UI.metricCard('Active Trips', tripDash.active?.length || 0, {
        icon: '<i class="fas fa-map-marked-alt"></i>', color: 'var(--blue)', size: 'sm'
      })}
      ${UI.metricCard('Total Distance', `${tripDash.totalDistance || 0} km`, {
        icon: '<i class="fas fa-route"></i>', color: 'var(--accent)', size: 'sm'
      })}
      ${UI.metricCard('Total Spent', UI.fmtCurrencyShort(tripDash.totalSpent || 0), {
        icon: '<i class="fas fa-money-bill-trend-up"></i>', color: 'var(--amber)', size: 'sm'
      })}
    </div>
  `;

  // Upcoming trips
  const upcomingHTML = tripDash.upcoming?.length > 0
    ? tripDash.upcoming.map(t => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem;border-left:3px solid var(--blue);">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:var(--fg);">${t.name}</div>
            <div style="font-size:0.72rem;color:var(--fg-muted);">${t.description || ''}</div>
          </div>
          ${UI.statusBadge(t.status, { colors: { planned: 'var(--blue)', ongoing: 'var(--accent)', completed: 'var(--green)' }, texts: { planned: 'Planned', ongoing: 'Ongoing', completed: 'Done' } })}
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.5rem;">
          ${t.start_date ? `<span>Start: ${UI.fmtDate(t.start_date)}</span>` : ''}
          ${t.end_date ? `<span>End: ${UI.fmtDate(t.end_date)}</span>` : ''}
          ${t.distance_km ? `<span>${t.distance_km} km</span>` : ''}
          ${t.total_cost ? `<span>${UI.fmtCurrency(t.total_cost)}</span>` : ''}
          ${t.transport ? `<span>${t.transport}</span>` : ''}
        </div>
        ${t.locations?.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${t.locations.map(l => UI.tagPill(l, 'var(--accent)')).join('')}</div>` : ''}
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No upcoming trips planned.</div>';

  // Completed trips
  const completedHTML = tripDash.completed?.length > 0
    ? tripDash.completed.slice(0, 5).map(t => `
      <div style="display:flex;gap:0.75rem;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--border);cursor:pointer;">
        <div style="width:0.6rem;height:0.6rem;border-radius:50%;background:var(--green);flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:0.82rem;color:var(--fg);font-weight:500;">${t.name}</div>
          <div style="font-size:0.7rem;color:var(--fg-muted);">${t.distance_km || 0} km · ${UI.fmtCurrency(t.total_cost || 0)} · ${t.duration_days || 0} days</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.7rem;color:var(--fg-dim);">${UI.fmtShortDate(t.start_date)}</div>
          <div style="font-size:0.65rem;color:var(--green);">Completed</div>
        </div>
      </div>
    `).join('')
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No trips completed yet.</div>';

  return `
    ${UI.sectionHeader('Travel', 'Trips, routes, expenses, and memories', '<i class="fas fa-plane"></i>')}
    ${statsHTML}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Upcoming Trips', `${tripDash.upcoming?.length || 0} planned`, '<i class="fas fa-calendar-plus"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;max-height:300px;overflow-y:auto;">${upcomingHTML}</div>
        <div style="margin-top:0.75rem;">
          <button onclick="openAddTripModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
            <i class="fas fa-plus" style="margin-right:0.35rem;"></i> Plan New Trip
          </button>
        </div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Completed Trips', `${tripDash.completed?.length || 0} trips`, '<i class="fas fa-map"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;max-height:300px;overflow-y:auto;">${completedHTML}</div>
      </div>
    </div>
  `;
}

/* ---- Render: Projects ---- */
async function renderProjects() {
  const allProjects = Services?.Project?.getAll?.() || [];
  const activeProjects = allProjects.filter(p => ['building', 'planning'].includes(p.status));

  const statsHTML = `
    <div class="metrics-grid" style="margin-bottom:1.25rem;">
      ${UI.metricCard('Active Projects', activeProjects.length, {
        icon: '<i class="fas fa-folder-open"></i>', color: 'var(--blue)', size: 'sm'
      })}
      ${UI.metricCard('Total Projects', allProjects.length, {
        icon: '<i class="fas fa-layer-group"></i>', color: 'var(--accent)', size: 'sm'
      })}
      ${UI.metricCard('In Progress', allProjects.filter(p => p.status === 'building').length, {
        icon: '<i class="fas fa-spinner"></i>', color: 'var(--amber)', size: 'sm'
      })}
      ${UI.metricCard('Building', allProjects.filter(p => p.status === 'building').length, {
        icon: '<i class="fas fa-wrench"></i>', color: 'var(--green)', size: 'sm'
      })}
    </div>
  `;

  const projectsGrid = allProjects.length > 0
    ? allProjects.map(p => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem;">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.5rem;">
          <div>
            <div style="font-size:0.88rem;font-weight:700;color:var(--fg);">${p.name}</div>
            <div style="font-size:0.72rem;color:var(--fg-muted);margin-top:0.15rem;line-height:1.4;">${p.description || ''}</div>
          </div>
          ${UI.statusBadge(p.status, {
            colors: { idea: 'var(--fg-dim)', planning: 'var(--blue)', building: 'var(--green)', paused: 'var(--amber)', completed: 'var(--accent)', archived: 'var(--fg-dim)' },
            texts: { idea: 'Idea', planning: 'Planning', building: 'Building', paused: 'Paused', completed: 'Done', archived: 'Archived' }
          })}
        </div>
        <div style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.5rem;">
          ${p.priority ? `<span style="color:${p.priority === 'high' ? 'var(--red)' : p.priority === 'medium' ? 'var(--amber)' : 'var(--fg-muted)'};">Priority: ${p.priority}</span>` : ''}
          ${p.start_date ? `<span>Started: ${UI.fmtDate(p.start_date)}</span>` : ''}
          ${p.target_date ? `<span>Target: ${UI.fmtDate(p.target_date)}</span>` : ''}
        </div>
        ${p.progress > 0 ? `
          <div style="margin-bottom:0.5rem;">
            <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.2rem;">
              <span>Progress</span>
              <span style="color:var(--accent-light);font-weight:600;">${p.progress}%</span>
            </div>
            ${UI.progressBar(p.progress, 100, { color: 'var(--accent)', height: '5px' })}
          </div>
        ` : ''}
        ${p.technology?.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.4rem;">${p.technology.map(t => UI.tagPill(t, 'var(--blue)')).join('')}</div>` : ''}
        ${p.repository ? `<div style="font-size:0.75rem;color:var(--accent-light);"><a href="${p.repository}" target="_blank" style="color:var(--accent-light);text-decoration:none;"><i class="fab fa-github" style="margin-right:0.3rem;"></i>${p.repository}</a></div>` : ''}
        ${p.website ? `<div style="font-size:0.75rem;color:var(--fg-muted);"><a href="${p.website}" target="_blank" style="color:var(--fg-muted);text-decoration:none;"><i class="fas fa-external-link-alt" style="margin-right:0.3rem;"></i>${p.website}</a></div>` : ''}
      </div>
    `).join('')
    : UI.emptyState('No projects yet. Create your first project!', 'fa-folder-open', `
      <button onclick="openAddProjectModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Create Project</button>
    `);

  return `
    ${UI.sectionHeader('Projects', 'Your active and completed projects', '<i class="fas fa-folder-open"></i>')}
    ${statsHTML}
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${projectsGrid}</div>
    <div style="margin-top:0.75rem;">
      <button onclick="openAddProjectModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
        <i class="fas fa-plus" style="margin-right:0.35rem;"></i> New Project
      </button>
    </div>
  `;
}

/* ---- Render: Memories ---- */
async function renderMemories() {
  const memories = Services?.Memory?.getAll?.() || [];
  const publicMemories = memories.filter(m => m.privacy === 'public');
  const privateMemories = memories.filter(m => m.privacy === 'private');

  const memoriesGrid = memories.length > 0
    ? memories.map(m => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;cursor:pointer;" onclick="if(typeof viewMemory === 'function') viewMemory('${m.id}')">
        <div style="height:100px;background:linear-gradient(135deg,var(--bg) 0%,var(--bg-card) 100%);display:flex;align-items:center;justify-content:center;color:var(--fg-muted);font-size:2rem;border-bottom:1px solid var(--border);">
          ${m.photos?.length ? '<i class="fas fa-images"></i>' : '<i class="fas fa-image"></i>'}
        </div>
        <div style="padding:0.75rem 1rem;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.25rem;">
            <div style="font-size:0.85rem;font-weight:600;color:var(--fg);">${m.title}</div>
            ${UI.statusBadge(m.privacy === 'public' ? 'public' : 'private', {
              colors: { public: 'var(--green)', private: 'var(--fg-muted)' },
              texts: { public: 'Public', private: 'Private' }
            })}
          </div>
          <div style="font-size:0.72rem;color:var(--fg-muted);">${UI.fmtDate(m.date)} · ${m.location || ''}</div>
          <div style="font-size:0.75rem;color:var(--fg);margin-top:0.25rem;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${m.content}</div>
          ${m.tags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.35rem;">${m.tags.map(t => UI.tagPill(t, 'var(--accent)")).join('')}</div>` : ''}
        </div>
      </div>
    `).join('')
    : UI.emptyState('No memories yet. Capture your first memory!', 'fa-images', `
      <button onclick="openAddMemoryModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Add Memory</button>
    `);

  return `
    ${UI.sectionHeader('Memories', 'Life moments captured and preserved', '<i class="fas fa-images"></i>')}
    <div style="display:flex;gap:0.75rem;margin-bottom:1rem;">
      <button onclick="filterMemories('all')" style="padding:0.4rem 0.8rem;background:${true ? 'var(--accent)' : 'var(--bg)'};color:white;border:none;border-radius:var(--radius-sm);font-size:0.75rem;cursor:pointer;">All (${memories.length})</button>
      <button onclick="filterMemories('public')" style="padding:0.4rem 0.8rem;background:${false ? 'var(--accent)' : 'var(--bg)'};color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.75rem;cursor:pointer;">Public (${publicMemories.length})</button>
      <button onclick="filterMemories('private')" style="padding:0.4rem 0.8rem;background:${false ? 'var(--accent)' : 'var(--bg)'};color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:0.75rem;cursor:pointer;">Private (${privateMemories.length})</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.75rem;">${memoriesGrid}</div>
    <div style="margin-top:0.75rem;">
      <button onclick="openAddMemoryModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
        <i class="fas fa-plus" style="margin-right:0.35rem;"></i> New Memory
      </button>
    </div>
  `;
}

/* ---- Render: Journal ---- */
async function renderJournal() {
  const entries = Services?.Journal?.getRecent?.() || [];

  const entriesHTML = entries.length > 0
    ? entries.map(j => `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:0.75rem;cursor:pointer;" onclick="if(typeof viewJournalEntry === 'function') viewJournalEntry('${j.id}')">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.4rem;">
          <div>
            <div style="font-size:0.85rem;font-weight:600;color:var(--fg);">${j.title}</div>
            <div style="font-size:0.72rem;color:var(--fg-muted);">${UI.fmtDate(j.date)}</div>
          </div>
          ${j.mood ? `<span style="font-size:1.2rem;">${moodEmoji(j.mood)}</span>` : ''}
        </div>
        <div style="font-size:0.75rem;color:var(--fg);line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:0.35rem;">${j.content}</div>
        ${j.tags?.length ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${j.tags.map(t => UI.tagPill(t, 'var(--blue)')).join('')}</div>` : ''}
      </div>
    `).join('')
    : UI.emptyState('No journal entries yet. Start writing!', 'fa-book', `
      <button onclick="openAddJournalModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Write Entry</button>
    `);

  return `
    ${UI.sectionHeader('Journal', 'Your thoughts, reflections, and stories', '<i class="fas fa-book"></i>')}
    <div style="display:flex;gap:0.5rem;margin-bottom:1rem;">
      <button onclick="openAddJournalModal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
        <i class="fas fa-pen" style="margin-right:0.35rem;"></i> New Entry
      </button>
      <button onclick="openSearchJournal()" style="padding:0.5rem 1rem;background:var(--bg-card);color:var(--fg);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">
        <i class="fas fa-search" style="margin-right:0.35rem;"></i> Search
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.5rem;">${entriesHTML}</div>
  `;
}

function moodEmoji(mood) {
  const map = {
    'Happy': '😊', 'Grateful': '🙏', 'Reflective': '🤔', 'Motivated': '💪',
    'Calm': '😌', 'Stressed': '😰', 'Tired': '😴', 'Excited': '🎉',
    'Anxious': '😟', 'Inspired': '✨', 'Curious': '🧠', 'Productive': '⚡'
  };
  return map[mood] || '📝';
}

/* ---- Render: JARVIS ---- */
function renderJarvis() {
  return `
    ${UI.sectionHeader('JARVIS', 'Your personal AI assistant — coming soon', '<i class="fas fa-robot"></i>')}
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:2rem;text-align:center;margin-bottom:1rem;">
      <div style="font-size:4rem;color:var(--accent-light);margin-bottom:0.75rem;"><i class="fas fa-robot"></i></div>
      <div style="font-size:1.5rem;font-weight:700;color:var(--fg);margin-bottom:0.5rem;">JARVIS</div>
      <div style="font-size:0.85rem;color:var(--fg-muted);margin-bottom:1.5rem;">Your life assistant</div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:0.85rem 1rem;text-align:left;font-size:0.85rem;color:var(--fg-muted);margin-bottom:1rem;position:relative;">
        <span style="color:var(--accent-light);font-weight:500;">JARVIS:</span> Ask about your life...
        <div style="position:absolute;bottom:-0.6rem;left:1rem;">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 1.5s infinite;"></div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1.5rem;">
        ${[
          'What should I focus on today?',
          'Show my finances',
          'What are my goals?',
          'Any overdue tasks?',
          'How are my health metrics?',
          'What projects are active?'
        ].map(q => `
          <button onclick="jexec('${q.replace(/'/g, "\\'")}')" style="padding:0.6rem 1rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg-muted);cursor:pointer;font-size:0.78rem;text-align:left;transition:all 0.15s;">${q}</button>
        `).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;">
        <input id="jarvisInput" type="text" placeholder="Ask JARVIS anything..." style="flex:1;padding:0.7rem 1rem;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);font-size:0.85rem;outline:none;" onkeydown="if(event.key === 'Enter') jexec(document.getElementById('jarvisInput').value)">
        <button onclick="jexec(document.getElementById('jarvisInput').value)" style="padding:0.7rem 1.2rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-weight:600;">Ask</button>
      </div>
      <div style="margin-top:1rem;padding:0.75rem;background:rgba(255,107,107,0.06);border:1px solid rgba(255,107,107,0.2);border-radius:var(--radius-sm);font-size:0.72rem;color:var(--fg-muted);">
        <i class="fas fa-info-circle" style="margin-right:0.35rem;"></i> JARVIS will connect to your personal AI assistant in a future update. No AI responses are faked.
      </div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">
      <div style="font-size:0.72rem;color:var(--fg-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:0.75rem;">Capabilities (Future)</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
        ${[
          'Add transactions', 'Update goals', 'Create tasks',
          'Log health metrics', 'Manage projects', 'Track habits',
          'Update social stats', 'Plan trips', 'Write journal entries',
          'Search across all data'
        ].map(c => `<div style="display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;color:var(--fg-muted);"><i class="fas fa-circle" style="font-size:0.4rem;color:var(--fg-dim);"></i> ${c}</div>`).join('')}
      </div>
    </div>
  `;
}

function jexec(query) {
  if (!query || query.trim() === '') return;
  const input = document.getElementById('jarvisInput');
  if (input) input.value = '';
  UI.showModal('JARVIS — Thinking...', `
    <div style="padding:2rem 0;text-align:center;color:var(--fg-muted);">
      <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:0.75rem;opacity:0.5;"></i>
      <p style="font-size:0.85rem;">"${query}"</p>
      <p style="font-size:0.75rem;margin-top:0.75rem;color:var(--fg-dim);">JARVIS will connect to your personal AI assistant in a future phase. No AI responses are faked.</p>
    </div>
  `);
}

/* ---- Render: Settings ---- */
async function renderSettings() {
  const profile = Services?.Profile?.get?.() || {};
  const activityLogs = Database?.getActivityLogs?.(20) || [];

  const profileHTML = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;">
      <div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;">
        <div style="width:4rem;height:4rem;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-light));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.2rem;flex-shrink:0;">${profile.name?.charAt(0) || 'P'}{profile.name?.charAt(1) || 'G'}</div>
        <div>
          <div style="font-size:1rem;font-weight:700;color:var(--fg);">${profile.name || 'Prem Ganesh'}</div>
          <div style="font-size:0.75rem;color:var(--fg-muted);">${profile.profession || 'Senior Software Engineer'}</div>
        </div>
        <button onclick="openEditProfileModal()" style="margin-left:auto;padding:0.4rem 0.7rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.75rem;">Edit Profile</button>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:0.75rem;">
        ${UI.infoList([
          { label: 'Name', value: profile.name || '—' },
          { label: 'Profession', value: profile.profession || '—' },
          { label: 'Location', value: profile.location || '—' },
          { label: 'Bio', value: profile.bio || '—' },
          { label: 'GitHub', value: profile.github ? `<a href="https://github.com/${profile.github}" target="_blank" style="color:var(--accent-light);">${profile.github}</a>` : '—' },
          { label: 'YouTube', value: profile.youtube || '—' },
          { label: 'Website', value: profile.website || '—' },
          { label: 'Tagline', value: profile.tagline || '—' }
        ])}
      </div>
    </div>
  `;

  const activityHTML = activityLogs.length > 0
    ? UI.table(['Time', 'Action', 'Entity', 'Summary'],
      activityLogs.map(a => [
        UI.fmtRelativeTime(a.timestamp),
        a.action,
        a.entity_name || a.entity_type || '—',
        a.change_summary || '—'
      ])
    )
    : '<div style="color:var(--fg-muted);font-size:0.82rem;padding:0.5rem 0;">No activity recorded.</div>';

  const dataActionsHTML = `
    <div style="display:flex;flex-direction:column;gap:0.5rem;">
      <button onclick="exportData()" style="padding:0.6rem 1rem;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);cursor:pointer;font-size:0.8rem;display:flex;align-items:center;gap:0.5rem;">
        <i class="fas fa-download" style="color:var(--green);"></i> Export All Data
      </button>
      <button onclick="document.getElementById('importFileInput')?.click()" style="padding:0.6rem 1rem;background:var(--card);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--fg);cursor:pointer;font-size:0.8rem;display:flex;align-items:center;gap:0.5rem;">
        <i class="fas fa-upload" style="color:var(--blue);"></i> Import Data
      </button>
      <input type="file" id="importFileInput" style="display:none" accept=".json" onchange="importData(this)">
      <button onclick="confirmDialog('Clear all localStorage data? This cannot be undone.', () => { localStorage.clear(); location.reload(); })" style="padding:0.6rem 1rem;background:var(--card);border:1px solid var(--red);border-radius:var(--radius-sm);color:var(--red);cursor:pointer;font-size:0.8rem;display:flex;align-items:center;gap:0.5rem;">
        <i class="fas fa-trash"></i> Reset All Data
      </button>
    </div>
  `;

  return `
    ${UI.sectionHeader('Settings', 'Profile, data management, and preferences', '<i class="fas fa-gear"></i>')}
    <div class="dashboard-lower">
      <div class="dashboard-section">
        ${UI.sectionHeader('Profile', '', '<i class="fas fa-user"></i>')}
        ${profileHTML}
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Activity Log', 'Recent changes', '<i class="fas fa-history"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;max-height:300px;overflow-y:auto;">${activityHTML}</div>
      </div>
      <div class="dashboard-section">
        ${UI.sectionHeader('Data Management', 'Backup, restore, and reset', '<i class="fas fa-database"></i>')}
        <div style="background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:0.75rem 1rem;">${dataActionsHTML}</div>
      </div>
    </div>
    <div style="margin-top:1rem;padding:0.75rem;background:rgba(108,92,231,0.06);border:1px solid rgba(108,92,231,0.2);border-radius:var(--radius-sm);font-size:0.72rem;color:var(--fg-muted);">
      <i class="fas fa-shield" style="margin-right:0.35rem;"></i> PREM OS stores all data in your browser's localStorage. Export regularly to back up your data. Private data (Finance, Health, Career) is not synced to any server.
    </div>
  `;
}

/* ---- Utility functions exposed globally ---- */
window.exportData = function() {
  const data = Database.exportData();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `premos-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  UI.toast('Data exported successfully!', 'success');
};

window.importData = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const result = Database.importData(e.target.result);
    if (result.success) {
      UI.toast(`Imported ${result.entityCount} entity types`, 'success');
      location.reload();
    } else {
      UI.toast('Import failed: ' + result.error, 'error');
    }
  };
  reader.readAsText(file);
  input.value = '';
};

window.completeTask = async function(taskId) {
  await Services.Task.complete(taskId, 'Prem');
  UI.toast('Task completed!', 'success');
  navigateTo(App.currentSection);
};

window.toggleHabit = async function(habitId) {
  await Services.Habit.toggleHabitCompletion(habitId);
  UI.toast('Habit toggled!', 'success');
  navigateTo(App.currentSection);
};

window.viewMemory = function(memoryId) {
  // Simple view — could be expanded
  UI.toast('Memory view: ' + memoryId, 'info');
};

window.viewJournalEntry = function(entryId) {
  UI.toast('Journal view: ' + entryId, 'info');
};

window.filterMemories = function(filter) {
  UI.toast('Filter: ' + filter, 'info');
  navigateTo('memories');
};

window.openSearchJournal = function() {
  const q = prompt('Search journal entries:');
  if (q) {
    const results = Services.Journal.search(q);
    if (results.length > 0) {
      UI.toast(`Found ${results.length} entries`, 'success');
    } else {
      UI.toast('No entries found', 'info');
    }
  }
};

/* ---- Modal openers for each entity type ---- */
window.openAddTransactionModal = function() {
  const categories = Services.Category.getAll();
  const accounts = Services.FinanceAccount.getAll();
  const catOptions = categories.filter(c => c.type === 'expense').map(c =>
    `<option value="${c.id}">${c.icon || '📌'} ${c.name}</option>`
  ).join('');
  const catIncomeOptions = categories.filter(c => c.type === 'income').map(c =>
    `<option value="${c.id}">${c.icon || '💰'} ${c.name}</option>`
  ).join('');
  const accountOptions = accounts.filter(a => a.status === 'active').map(a =>
    `<option value="${a.id}">${a.name} (${a.type})</option>`
  ).join('');

  UI.showModal('Add Transaction', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="display:flex;gap:0.5rem;">
        <button id="txnTypeIncome" onclick="switchTxnType('income')" style="flex:1;padding:0.5rem;background:${true ? 'var(--green)' : 'var(--bg)'};color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Income</button>
        <button id="txnTypeExpense" onclick="switchTxnType('expense')" style="flex:1;padding:0.5rem;background:${false ? 'var(--red)' : 'var(--bg)'};color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Expense</button>
      </div>
      <div id="txnIncomeFields" style="display:none;">
        <div style="position:relative;">
          <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Income Category</label>
          <select id="txnCategoryId" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">${catIncomeOptions}</select>
        </div>
      </div>
      <div id="txnExpenseFields" style="display:none;">
        <div style="position:relative;">
          <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Expense Category</label>
          <select id="txnCategoryId" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">${catOptions}</select>
        </div>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Amount (₹)</label>
        <input id="txnAmount" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Date</label>
        <input id="txnDate" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Account</label>
        <select id="txnAccountId" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">${accountOptions}</select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Description</label>
        <input id="txnDescription" type="text" placeholder="What was this for?" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Payment Method</label>
        <select id="txnPaymentMethod" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Credit Card">Credit Card</option>
          <option value="Debit Card">Debit Card</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Tags (comma separated)</label>
        <input id="txnTags" type="text" placeholder="salary, freelance, food, fuel" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <textarea id="txnNotes" rows="2" placeholder="Optional notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveTransaction()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Transaction</button>
  `);

  window.switchTxnType = function(type) {
    document.getElementById('txnTypeIncome').style.background = type === 'income' ? 'var(--green)' : 'var(--bg)';
    document.getElementById('txnTypeIncome').style.color = type === 'income' ? 'white' : 'var(--fg-muted)';
    document.getElementById('txnTypeExpense').style.background = type === 'expense' ? 'var(--red)' : 'var(--bg)';
    document.getElementById('txnTypeExpense').style.color = type === 'expense' ? 'white' : 'var(--fg-muted)';
    document.getElementById('txnIncomeFields').style.display = type === 'income' ? 'block' : 'none';
    document.getElementById('txnExpenseFields').style.display = type === 'expense' ? 'block' : 'none';
    window._currentTxnType = type;
  };
  window._currentTxnType = 'expense';
  window.switchTxnType('expense');

  window.saveTransaction = async function() {
    const type = window._currentTxnType;
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const date = document.getElementById('txnDate').value;
    const accountId = document.getElementById('txnAccountId').value;
    const categoryId = document.getElementById('txnCategoryId').value;
    const description = document.getElementById('txnDescription').value;
    const paymentMethod = document.getElementById('txnPaymentMethod').value;
    const tags = document.getElementById('txnTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const notes = document.getElementById('txnNotes').value;

    if (!amount || amount <= 0) { UI.toast('Amount must be greater than zero', 'error'); return; }
    if (!date) { UI.toast('Date is required', 'error'); return; }
    if (!accountId) { UI.toast('Account is required', 'error'); return; }
    if (!categoryId) { UI.toast('Category is required', 'error'); return; }

    try {
      const cat = Services.Category.getById(categoryId);
      await Services.Transaction.add({
        date, amount, type, category_id: categoryId,
        category_name: cat?.name || '',
        account_id: accountId, description: description || type,
        payment_method: paymentMethod, tags, notes: notes || ''
      });
      UI.toast('Transaction added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddAccountModal = function() {
  const accountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'loan', label: 'Loan' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'cash', label: 'Cash Wallet' }
  ];
  const typeOptions = accountTypes.map(t => `<option value="${t.value}">${t.label}</option>`).join('');

  UI.showModal('Add Financial Account', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Account Type</label>
        <select id="accType" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">${typeOptions}</select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Account Name</label>
        <input id="accName" type="text" placeholder="e.g. ICICI Credit Card" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Institution</label>
        <input id="accInstitution" type="text" placeholder="e.g. ICICI Bank" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Account Number (last 4 digits or full)</label>
        <input id="accNumber" type="text" placeholder="Account number" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Current Balance (₹)</label>
        <input id="accBalance" type="number" min="0" step="0.01" placeholder="0.00" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Credit Limit (₹) — for credit cards only</label>
        <input id="accLimit" type="number" min="0" step="0.01" placeholder="0" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Opened Date</label>
        <input id="accOpened" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <textarea id="accNotes" rows="2" placeholder="Optional notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveAccount()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Account</button>
  `);

  window.saveAccount = async function() {
    const type = document.getElementById('accType').value;
    const name = document.getElementById('accName').value;
    const institution = document.getElementById('accInstitution').value;
    const accountNumber = document.getElementById('accNumber').value;
    const balance = parseFloat(document.getElementById('accBalance').value) || 0;
    const creditLimit = parseFloat(document.getElementById('accLimit').value) || null;
    const openedDate = document.getElementById('accOpened').value;
    const notes = document.getElementById('accNotes').value;

    if (!name) { UI.toast('Account name is required', 'error'); return; }
    if (!accountNumber) { UI.toast('Account number is required', 'error'); return; }

    try {
      await Services.FinanceAccount.add({
        type, name, institution, account_number: accountNumber,
        current_balance: balance, credit_limit: creditLimit,
        opened_date: openedDate || new Date().toISOString().split('T')[0],
        notes: notes || ''
      });
      UI.toast('Account added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddSkillModal = function() {
  const categories = ['Mobile', 'Language', 'State Management', 'Backend', 'API', 'Architecture', 'DevOps', 'Database', 'Cloud', 'Creative', 'Fitness', 'General'];

  UI.showModal('Add Skill', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Skill Name</label>
        <input id="skillName" type="text" placeholder="e.g. Flutter" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Category</label>
        <select id="skillCategory" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Proficiency (0-100)</label>
        <input id="skillProficiency" type="number" min="0" max="100" placeholder="85" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Years of Experience</label>
        <input id="skillYears" type="number" min="0" max="50" step="0.5" placeholder="4" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;">
        <input id="skillCertified" type="checkbox" style="width:1rem;height:1rem;accent-color:var(--accent);">
        <label for="skillCertified" style="font-size:0.8rem;color:var(--fg);">Currently certified in this skill</label>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Last Used (date)</label>
        <input id="skillLastUsed" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveSkill()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Skill</button>
  `);

  window.saveSkill = async function() {
    const name = document.getElementById('skillName').value;
    const category = document.getElementById('skillCategory').value;
    const proficiency = parseInt(document.getElementById('skillProficiency').value) || 0;
    const years = parseFloat(document.getElementById('skillYears').value) || 0;
    const certified = document.getElementById('skillCertified').checked;
    const lastUsed = document.getElementById('skillLastUsed').value;

    if (!name) { UI.toast('Skill name is required', 'error'); return; }

    try {
      await Services.Skill.add({ name, category, proficiency, yearsExperience: years, certified, lastUsed });
      UI.toast('Skill added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddEmploymentModal = function() {
  UI.showModal('Add Employment', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Company</label>
        <input id="empCompany" type="text" placeholder="Company name" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Role / Position</label>
        <input id="empRole" type="text" placeholder="e.g. Senior Software Engineer" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Start Date</label>
        <input id="empStart" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">End Date (leave empty if current)</label>
        <input id="empEnd" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Location</label>
        <input id="empLocation" type="text" placeholder="e.g. Hyderabad, India" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Annual Salary (₹)</label>
        <input id="empSalary" type="number" min="0" step="1000" placeholder="1100000" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Technologies (comma separated)</label>
        <input id="empTech" type="text" placeholder="Flutter, Dart, NestJS, Node.js" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Responsibilities (one per line)</label>
        <textarea id="empResp" rows="3" placeholder="Design microservices\nFrontend development\nAPI design" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Achievements (comma separated)</label>
        <input id="empAch" type="text" placeholder="Best Performer Q3 2024, Innovation Award" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <textarea id="empNotes" rows="2" placeholder="Optional notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveEmployment()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Employment</button>
  `);

  window.saveEmployment = async function() {
    const company = document.getElementById('empCompany').value;
    const role = document.getElementById('empRole').value;
    const startDate = document.getElementById('empStart').value;
    const endDate = document.getElementById('empEnd').value || null;
    const location = document.getElementById('empLocation').value;
    const salary = parseFloat(document.getElementById('empSalary').value) || 0;
    const technologies = document.getElementById('empTech').value.split(',').map(t => t.trim()).filter(Boolean);
    const responsibilities = document.getElementById('empResp').value.split('\n').map(r => r.trim()).filter(Boolean);
    const achievements = document.getElementById('empAch').value.split(',').map(a => a.trim()).filter(Boolean);
    const notes = document.getElementById('empNotes').value;

    if (!company) { UI.toast('Company is required', 'error'); return; }
    if (!role) { UI.toast('Role is required', 'error'); return; }
    if (!startDate) { UI.toast('Start date is required', 'error'); return; }

    try {
      await Services.Career.addEmployment({
        company, role, start_date: startDate, end_date: endDate,
        location, salary, technologies, responsibilities, achievements, notes
      });
      UI.toast('Employment added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddHabitModal = function() {
  UI.showModal('Add Habit', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Habit Name</label>
        <input id="habitName" type="text" placeholder="e.g. Daily Running" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Description</label>
        <input id="habitDesc" type="text" placeholder="What does this habit involve?" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Frequency</label>
        <select id="habitFrequency" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="weekdays">Weekdays</option>
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Target Days per Week</label>
        <input id="habitTarget" type="number" min="1" max="7" placeholder="5" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveHabit()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Habit</button>
  `);

  window.saveHabit = async function() {
    const name = document.getElementById('habitName').value;
    const description = document.getElementById('habitDesc').value;
    const frequency = document.getElementById('habitFrequency').value;
    const targetDays = parseInt(document.getElementById('habitTarget').value) || 7;

    if (!name) { UI.toast('Habit name is required', 'error'); return; }

    try {
      await Services.Habit.add({ name, description, frequency, target_days_per_week: targetDays });
      UI.toast('Habit added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddMetricModal = function() {
  const metricTypes = [
    { value: 'weight', label: 'Weight (kg)' },
    { value: 'bmi', label: 'BMI' },
    { value: 'body_fat', label: 'Body Fat (%)' },
    { value: 'blood_pressure_systolic', label: 'Blood Pressure — Systolic' },
    { value: 'blood_pressure_diastolic', label: 'Blood Pressure — Diastolic' },
    { value: 'heart_rate', label: 'Heart Rate (bpm)' },
    { value: 'blood_sugar', label: 'Blood Sugar (mg/dL)' },
    { value: 'cholesterol_total', label: 'Cholesterol — Total' },
    { value: 'cholesterol_hdl', label: 'Cholesterol — HDL' },
    { value: 'cholesterol_ldl', label: 'Cholesterol — LDL' },
    { value: 'triglycerides', label: 'Triglycerides' },
    { value: 'daily_steps', label: 'Daily Steps' }
  ];

  UI.showModal('Log Health Metric', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Metric Type</label>
        <select id="metricType" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          ${metricTypes.map(t => `<option value="${t.value}">${t.label}</option>`).join('')}
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Value</label>
        <input id="metricValue" type="number" step="0.01" placeholder="72" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Date</label>
        <input id="metricDate" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <input id="metricNotes" type="text" placeholder="Optional notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveMetric()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Metric</button>
  `);

  window.saveMetric = async function() {
    const type = document.getElementById('metricType').value;
    const value = parseFloat(document.getElementById('metricValue').value);
    const date = document.getElementById('metricDate').value;
    const notes = document.getElementById('metricNotes').value;

    if (!value || value <= 0) { UI.toast('Value must be greater than zero', 'error'); return; }
    if (!date) { UI.toast('Date is required', 'error'); return; }

    try {
      await Services.Health.addMetric({ type, value, date, notes: notes || '', source: 'manual' });
      UI.toast('Metric logged!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddProjectModal = function() {
  const statuses = ['idea', 'planning', 'building', 'paused', 'completed', 'archived'];
  const priorities = ['low', 'medium', 'high', 'critical'];

  UI.showModal('Create Project', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Project Name</label>
        <input id="projName" type="text" placeholder="e.g. Bike Guardian" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Description</label>
        <textarea id="projDesc" rows="2" placeholder="What is this project about?" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Status</label>
        <select id="projStatus" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          ${statuses.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Priority</label>
        <select id="projPriority" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          ${priorities.map(p => `<option value="${p}">${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Start Date</label>
        <input id="projStart" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Target Date</label>
        <input id="projTarget" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Technologies (comma separated)</label>
        <input id="projTech" type="text" placeholder="Flutter, Dart, NestJS" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Repository URL</label>
        <input id="projRepo" type="url" placeholder="https://github.com/..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Website URL</label>
        <input id="projSite" type="url" placeholder="https://..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <textarea id="projNotes" rows="2" placeholder="Notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Progress (0-100)</label>
        <input id="projProgress" type="number" min="0" max="100" placeholder="0" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveProject()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Create Project</button>
  `);

  window.saveProject = async function() {
    const name = document.getElementById('projName').value;
    const description = document.getElementById('projDesc').value;
    const status = document.getElementById('projStatus').value;
    const priority = document.getElementById('projPriority').value;
    const startDate = document.getElementById('projStart').value;
    const targetDate = document.getElementById('projTarget').value || null;
    const technologies = document.getElementById('projTech').value.split(',').map(t => t.trim()).filter(Boolean);
    const repository = document.getElementById('projRepo').value || '';
    const website = document.getElementById('projSite').value || '';
    const notes = document.getElementById('projNotes').value;
    const progress = parseInt(document.getElementById('projProgress').value) || 0;

    if (!name) { UI.toast('Project name is required', 'error'); return; }

    try {
      await Services.Project.add({ name, description, status, priority, start_date: startDate, target_date: targetDate, technology: technologies, repository, website, notes, progress });
      UI.toast('Project created!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddTripModal = function() {
  UI.showModal('Plan New Trip', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Trip Name</label>
        <input id="tripName" type="text" placeholder="e.g. Maharashtra Monsoon Ride 2026" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Description</label>
        <textarea id="tripDesc" rows="2" placeholder="Trip description..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Start Date</label>
        <input id="tripStart" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">End Date</label>
        <input id="tripEnd" type="date" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Route (comma separated locations)</label>
        <input id="tripRoute" type="text" placeholder="Hyderabad, Pune, Nashik, Mumbai" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Distance (km)</label>
        <input id="tripDistance" type="number" min="0" placeholder="1200" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Transport</label>
        <input id="tripTransport" type="text" placeholder="e.g. Royal Enfield Himalayan 411" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Accommodation</label>
        <input id="tripAccom" type="text" placeholder="e.g. Guest houses, tent camping" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Estimated Total Cost (₹)</label>
        <input id="tripCost" type="number" min="0" step="100" placeholder="25000" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Notes</label>
        <textarea id="tripNotes" rows="2" placeholder="Notes..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveTrip()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Plan Trip</button>
  `);

  window.saveTrip = async function() {
    const name = document.getElementById('tripName').value;
    const description = document.getElementById('tripDesc').value;
    const startDate = document.getElementById('tripStart').value;
    const endDate = document.getElementById('tripEnd').value;
    const route = document.getElementById('tripRoute').value.split(',').map(r => r.trim()).filter(Boolean);
    const distance = parseInt(document.getElementById('tripDistance').value) || 0;
    const transport = document.getElementById('tripTransport').value;
    const accommodation = document.getElementById('tripAccom').value;
    const cost = parseFloat(document.getElementById('tripCost').value) || 0;
    const notes = document.getElementById('tripNotes').value;

    if (!name) { UI.toast('Trip name is required', 'error'); return; }
    if (!startDate) { UI.toast('Start date is required', 'error'); return; }

    try {
      await Services.Trip.add({
        name, description, start_date: startDate, end_date: endDate,
        route: route.length > 0 ? route : undefined,
        distance_km: distance, transport, accommodation,
        total_cost: cost, notes: notes || ''
      });
      UI.toast('Trip planned!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddSocialModal = function() {
  const platforms = [
    { value: 'youtube', label: 'YouTube', icon: 'fab fa-youtube' },
    { value: 'github', label: 'GitHub', icon: 'fab fa-github' },
    { value: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { value: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin' },
    { value: 'twitter', label: 'Twitter/X', icon: 'fab fa-twitter' },
    { value: 'facebook', label: 'Facebook', icon: 'fab fa-facebook' }
  ];

  UI.showModal('Add Social Account', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Platform</label>
        <select id="socPlatform" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          ${platforms.map(p => `<option value="${p.value}">${p.label}</option>`).join('')}
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Display Name</label>
        <input id="socDisplay" type="text" placeholder="e.g. Dusty Tires" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Username / Handle</label>
        <input id="socUsername" type="text" placeholder="e.g. dustytires" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Profile URL</label>
        <input id="socUrl" type="url" placeholder="https://..." style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Followers / Subscribers</label>
        <input id="socFollowers" type="number" min="0" step="1" placeholder="0" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Posts / Videos</label>
        <input id="socPosts" type="number" min="0" step="1" placeholder="0" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;font-family:var(--font-mono);">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Update Method</label>
        <select id="socMethod" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          <option value="manual">Manual (you update numbers)</option>
          <option value="api">Automatic (API in future)</option>
        </select>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveSocial()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Account</button>
  `);

  window.saveSocial = async function() {
    const platform = document.getElementById('socPlatform').value;
    const displayName = document.getElementById('socDisplay').value;
    const username = document.getElementById('socUsername').value;
    const profileUrl = document.getElementById('socUrl').value;
    const followers = parseInt(document.getElementById('socFollowers').value) || 0;
    const posts = parseInt(document.getElementById('socPosts').value) || 0;
    const updateMethod = document.getElementById('socMethod').value;

    if (!displayName) { UI.toast('Display name is required', 'error'); return; }

    try {
      await Services.Social.add({
        platform, display_name: displayName, username, profile_url: profileUrl,
        followers, posts, subscribers: platform === 'youtube' ? followers : 0,
        following: 0, update_method: updateMethod
      });
      UI.toast('Social account added!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddMemoryModal = function() {
  UI.showModal('Add Memory', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Title</label>
        <input id="memTitle" type="text" placeholder="e.g. First Ride on Toothless" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Date</label>
        <input id="memDate" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Location</label>
        <input id="memLocation" type="text" placeholder="e.g. Hyderabad" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Content</label>
        <textarea id="memContent" rows="4" placeholder="What happened? How did it feel?" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Tags (comma separated)</label>
        <input id="memTags" type="text" placeholder="bike, toothless, first-ride" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;">
        <input id="memPrivate" type="radio" name="memPrivacy" value="private" checked style="width:1rem;height:1rem;accent-color:var(--accent);">
        <label for="memPrivate" style="font-size:0.8rem;color:var(--fg);">Private (only visible to you)</label>
      </div>
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.25rem 0;">
        <input id="memPublic" type="radio" name="memPrivacy" value="public" style="width:1rem;height:1rem;accent-color:var(--accent);">
        <label for="memPublic" style="font-size:0.8rem;color:var(--fg);">Public (shareable)</label>
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveMemory()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Memory</button>
  `);

  window.saveMemory = async function() {
    const title = document.getElementById('memTitle').value;
    const date = document.getElementById('memDate').value;
    const location = document.getElementById('memLocation').value;
    const content = document.getElementById('memContent').value;
    const tags = document.getElementById('memTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const privacy = document.getElementById('memPublic').checked ? 'public' : 'private';

    if (!title) { UI.toast('Title is required', 'error'); return; }
    if (!content) { UI.toast('Content is required', 'error'); return; }

    try {
      await Services.Memory.add({ title, date, location: location || '', content, tags, privacy });
      UI.toast('Memory saved!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openAddJournalModal = function() {
  UI.showModal('Write Journal Entry', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Title</label>
        <input id="jTitle" type="text" placeholder="e.g. Reflective Monday" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Date</label>
        <input id="jDate" type="date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Mood</label>
        <select id="jMood" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
          <option value="">Select mood...</option>
          <option value="Happy">😊 Happy</option>
          <option value="Grateful">🙏 Grateful</option>
          <option value="Reflective">🤔 Reflective</option>
          <option value="Motivated">💪 Motivated</option>
          <option value="Calm">😌 Calm</option>
          <option value="Stressed">😰 Stressed</option>
          <option value="Tired">😴 Tired</option>
          <option value="Excited">🎉 Excited</option>
          <option value="Anxious">😟 Anxious</option>
          <option value="Inspired">✨ Inspired</option>
          <option value="Curious">🧠 Curious</option>
          <option value="Productive">⚡ Productive</option>
        </select>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Content</label>
        <textarea id="jContent" rows="6" placeholder="What's on your mind today?" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.85rem;line-height:1.6;resize:vertical;"></textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Tags (comma separated)</label>
        <input id="jTags" type="text" placeholder="reflection, finance, career" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveJournal()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Entry</button>
  `);

  window.saveJournal = async function() {
    const title = document.getElementById('jTitle').value;
    const date = document.getElementById('jDate').value;
    const mood = document.getElementById('jMood').value;
    const content = document.getElementById('jContent').value;
    const tags = document.getElementById('jTags').value.split(',').map(t => t.trim()).filter(Boolean);

    if (!title) { UI.toast('Title is required', 'error'); return; }
    if (!content) { UI.toast('Content is required', 'error'); return; }

    try {
      await Services.Journal.add({ title, date, mood: mood || '', content, tags, privacy: 'private' });
      UI.toast('Journal entry saved!', 'success');
      document.querySelector('.premos-modal-overlay')?.remove();
      navigateTo(App.currentSection);
    } catch (e) {
      UI.toast('Error: ' + e.message, 'error');
    }
  };
};

window.openEditProfileModal = function() {
  const profile = Services.Profile.get() || {};

  UI.showModal('Edit Profile', `
    <div style="display:flex;flex-direction:column;gap:0.75rem;">
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Full Name</label>
        <input id="profName" type="text" value="${profile.name || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Profession</label>
        <input id="profProfession" type="text" value="${profile.profession || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Bio</label>
        <textarea id="profBio" rows="2" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;resize:vertical;">${profile.bio || ''}</textarea>
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Location</label>
        <input id="profLocation" type="text" value="${profile.location || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Website</label>
        <input id="profWebsite" type="url" value="${profile.website || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">GitHub Username</label>
        <input id="profGithub" type="text" value="${profile.github || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">YouTube Channel</label>
        <input id="profYoutube" type="text" value="${profile.youtube || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Instagram Handle</label>
        <input id="profInstagram" type="text" value="${profile.instagram || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Tagline</label>
        <input id="profTagline" type="text" value="${profile.tagline || ''}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Skills (comma separated)</label>
        <input id="profSkills" type="text" value="${(profile.skills || []).join(', ')}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
      <div style="position:relative;">
        <label style="display:block;font-size:0.72rem;color:var(--fg-muted);margin-bottom:0.25rem;">Interests (comma separated)</label>
        <input id="profInterests" type="text" value="${(profile.interests || []).join(', ')}" style="width:100%;padding:0.5rem;border:1px solid var(--border);background:var(--bg);color:var(--fg);border-radius:var(--radius-sm);font-size:0.8rem;">
      </div>
    </div>
  `, `
    <button onclick="document.querySelector('.premos-modal-overlay')?.remove()" style="padding:0.5rem 1rem;background:var(--bg);color:var(--fg-muted);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;">Cancel</button>
    <button onclick="saveProfile()" style="padding:0.5rem 1rem;background:var(--accent);color:white;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:0.8rem;font-weight:600;">Save Profile</button>
  `);

  window.saveProfile = async function() {
    const data = {
      name: document.getElementById('profName').value,
      profession: document.getElementById('profProfession').value,
      bio: document.getElementById('profBio').value,
      location: document.getElementById('profLocation').value,
      website: document.getElementById('profWebsite').value,
      github: document.getElementById('profGithub').value,
      youtube: document.getElementById('profYoutube').value,
      instagram: document.getElementById('profInstagram').value,
      tagline: document.getElementById('profTagline').value,
      skills: document.getElementById('profSkills').value.split(',').map(s => s.trim()).filter(Boolean),
      interests: document.getElementById('profInterests').value.split(',').map(i => i.trim()).filter(Boolean)
    };
    await Services.Profile.update(data, 'Prem');
    UI.toast('Profile updated!', 'success');
    document.querySelector('.premos-modal-overlay')?.remove();
    navigateTo(App.currentSection);
  };
};

/* ---- Start the app ---- */
document.addEventListener('DOMContentLoaded', init);
