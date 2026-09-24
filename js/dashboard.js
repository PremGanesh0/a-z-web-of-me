/* ============================================================
   dashboard.js — Main orchestration, navigation, A-Z index
   ============================================================ */

/* ---- Navigation ---- */
(function initNav() {
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  const sections = document.querySelectorAll('.content-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.dataset.section;
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById('section-' + sectionId);
      if (target) target.classList.add('active');
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Toggle sidebar on mobile
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Smooth scroll for anchor links in content
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
})();

/* ---- A-Z Index Data & Rendering ---- */
const AZ_INDEX = [
  // Finances — A-Z
  { letter: 'A', title: 'Assets (Net Worth)', desc: 'Total net worth: assets minus liabilities', section: 'finances' },
  { letter: 'B', title: 'Budget vs Actual', desc: 'Monthly spending tracked against budget', section: 'finances' },
  { letter: 'C', title: 'Cash & Liquid Savings', desc: 'Cash on hand and liquid reserves', section: 'finances' },
  { letter: 'D', title: 'Debts & Liabilities', desc: 'All outstanding debts, loans, credit cards', section: 'finances' },
  { letter: 'E', title: 'Expenses by Category', desc: 'Every expense category with budget tracking', section: 'finances' },
  { letter: 'F', title: 'Financial Goals', desc: 'Savings goals with progress tracking', section: 'finances' },
  { letter: 'G', title: 'Gold & Alternatives', desc: 'Gold ETF, alternatives allocation', section: 'finances' },
  { letter: 'H', title: 'Housing Costs', desc: 'Rent, utilities, housing-related expenses', section: 'finances' },
  { letter: 'I', title: 'Income Streams', desc: 'All income sources: salary, freelance, passive', section: 'finances' },
  { letter: 'I2', title: 'Investments Portfolio', desc: 'Full portfolio breakdown by holding', section: 'finances' },
  { letter: 'J', title: 'Journal — Financial', desc: 'Money decisions, learnings, reflections', section: 'finances' },
  { letter: 'K', title: 'Credit Score & Cards', desc: 'Credit health and card usage', section: 'finances' },
  { letter: 'L', title: 'Liabilities Breakdown', desc: 'Loan-by-loan detail with balances', section: 'finances' },
  { letter: 'M', title: 'Monthly Cash Flow', desc: 'Income minus expenses = monthly surplus/deficit', section: 'finances' },
  { letter: 'N', title: 'Net Worth Tracker', desc: 'Net worth over time — the big number', section: 'finances' },
  { letter: 'O', title: 'Other Income', desc: 'Side income, royalties, incidental earnings', section: 'finances' },
  { letter: 'P', title: 'Passive Income', desc: 'Dividends, interest, rental — money on autopilot', section: 'finances' },
  { letter: 'Q', title: 'Quarterly Tax Estimates', desc: 'Advance tax planning and payments', section: 'finances' },
  { letter: 'R', title: 'Retirement Planning', desc: 'PPF, NPS, long-term retirement corpus', section: 'finances' },
  { letter: 'S', title: 'Savings Rate', desc: 'What % of income goes to savings/investing', section: 'finances' },
  { letter: 'S2', title: 'Stock Portfolio', desc: 'Equity mutual funds, direct stocks, ETFs', section: 'finances' },
  { letter: 'T', title: 'Tax Planning', desc: 'Deductions, sections, estimated liability', section: 'finances' },
  { letter: 'U', title: 'Utility Bills', desc: 'Electricity, water, internet, phone', section: 'finances' },

  // Health — A-Z
  { letter: 'A3', title: 'Activity Level', desc: 'Daily movement, steps, active minutes', section: 'health' },
  { letter: 'B2', title: 'Blood Reports', desc: 'Latest blood work: sugar, lipids, CBC', section: 'health' },
  { letter: 'B3', title: 'Blood Pressure', desc: 'BP readings over time', section: 'health' },
  { letter: 'C2', title: 'Calorie Intake', desc: 'Daily calories target vs actual', section: 'health' },
  { letter: 'C3', title: 'Cheat Meals', desc: 'Planned flexibility in diet', section: 'health' },
  { letter: 'D2', title: 'Diet & Nutrition', desc: 'Macros, habits, supplements', section: 'health' },
  { letter: 'E2', title: 'Exercise Routine', desc: 'Running, strength, cycling schedule', section: 'health' },
  { letter: 'F2', title: 'Fitness Metrics', desc: 'Weight, BMI, body fat, PRs', section: 'health' },
  { letter: 'G2', title: 'Gym / Strength Training', desc: 'Weights, bodyweight, progression', section: 'health' },
  { letter: 'G3', title: 'Goals — Health', desc: 'Marathon, weight, sleep, meditation targets', section: 'health' },
  { letter: 'H2', title: 'Heart Rate (Resting)', desc: 'Resting HR — cardiovascular fitness indicator', section: 'health' },
  { letter: 'I3', title: 'Immune Health', desc: 'Vaccinations, illness frequency', section: 'health' },
  { letter: 'J2', title: 'Journal — Health & Mood', desc: 'Mental state, reflections, gratitude', section: 'health' },
  { letter: 'M2', title: 'Mental Wellness', desc: 'Meditation, mood, stress tracking', section: 'health' },
  { letter: 'N2', title: 'Nutrition Plan', desc: 'Diet structure, macros, hydration', section: 'health' },
  { letter: 'P2', title: 'Physical Therapy / Recovery', desc: 'Stretching, injuries, recovery routines', section: 'health' },
  { letter: 'R2', title: 'Running', desc: '5K, 10K, half-marathon, pacing', section: 'health' },
  { letter: 'S2', title: 'Sleep Tracking', desc: 'Hours, quality, consistency, deep sleep', section: 'health' },
  { letter: 'S3', title: 'Supplements', desc: 'Whey, vitamins, what and why', section: 'health' },
  { letter: 'S4', title: 'Strength PRs', desc: 'Max lifts, progressive overload log', section: 'health' },
  { letter: 'T2', title: 'Vitals & Temperature', desc: 'Body vitals at a glance', section: 'health' },
  { letter: 'W', title: 'Weight Journey', desc: 'Weight trend over time', section: 'health' },

  // Career — A-Z
  { letter: 'A4', title: 'Achievements & Awards', desc: 'Career wins, recognitions, awards', section: 'career' },
  { letter: 'B4', title: 'Bug / Incident Log', desc: 'Key bugs fixed and lessons learned', section: 'career' },
  { letter: 'C4', title: 'Current Role', desc: 'Company, position, responsibilities', section: 'career' },
  { letter: 'C5', title: 'Certifications', desc: 'AWS, Firebase, and other certs', section: 'career' },
  { letter: 'C6', title: 'Code Reviews Done', desc: 'Quality contributions to team code', section: 'career' },
  { letter: 'C7', title: 'Community Involvement', desc: 'Meetups, open source, creator circles', section: 'career' },
  { letter: 'D2', title: 'Dart / Flutter Skills', desc: 'Mobile development expertise', section: 'career' },
  { letter: 'E3', title: 'Employment History', desc: 'Timeline of all roles and companies', section: 'career' },
  { letter: 'F2', title: 'Freelance Projects', desc: 'Side consulting and contract work', section: 'career' },
  { letter: 'G3', title: 'Goals — Career', desc: 'Tech Lead, product, conference, passive income', section: 'career' },
  { letter: 'G4', title: 'Growth Plan', desc: 'Skills to learn next, promotions path', section: 'career' },
  { letter: 'I4', title: 'Income — Career', desc: 'Salary history, raises, total comp', section: 'career' },
  { letter: 'K2', title: 'Key Projects', desc: 'Bike Guardian, notable shipped work', section: 'career' },
  { letter: 'L2', title: 'Learning & Courses', desc: 'Completed courses and ongoing learning', section: 'career' },
  { letter: 'M3', title: 'Mentorship', desc: 'Mentors, mentees, giving back', section: 'career' },
  { letter: 'N3', title: 'Network & Relationships', desc: 'Peers, mentors, community connections', section: 'career' },
  { letter: 'P3', title: 'Portfolio of Work', desc: 'Apps, repos, demos to show', section: 'career' },
  { letter: 'R3', title: 'Resume & CV', desc: 'Current resume linked for sharing', section: 'career' },
  { letter: 'S5', title: 'Skills Inventory', desc: 'Technical + soft skills with proficiency', section: 'career' },
  { letter: 'S6', title: 'Stack — Tech', desc: 'Flutter, NestJS, Firebase, GraphQL, gRPC', section: 'career' },
  { letter: 'T3', title: 'Teach / Share', desc: 'Blog posts, talks, documentation written', section: 'career' },
  { letter: 'V', title: 'Videos / Content Created', desc: 'Dusty Tires YouTube — tech + motorcycle', section: 'career' },
  { letter: 'W2', title: 'Work Wins', desc: 'Quarterly highlights and delivered impact', section: 'career' },
  { letter: 'X', title: 'X-factor / Unique Value', desc: 'What sets this career apart', section: 'career' }
];

/* ---- Render A-Z Grid ---- */
(function renderAZ() {
  const grid = document.getElementById('azGrid');
  if (!grid) return;

  // Group by section
  const sections = {
    finances: { label: 'Finances', icon: 'fa-coins', items: [] },
    health: { label: 'Health', icon: 'fa-heartbeat', items: [] },
    career: { label: 'Career', icon: 'fa-briefcase', items: [] }
  };

  AZ_INDEX.forEach(item => {
    if (sections[item.section]) {
      sections[item.section].items.push(item);
    }
  });

  let html = '';
  for (const [key, sec] of Object.entries(sections)) {
    if (sec.items.length === 0) continue;
    html += `
      <div style="grid-column:1/-1;margin-bottom:0.5rem;">
        <span class="az-section" style="font-size:0.75rem;color:var(--accent-light);">
          <i class="fas ${sec.icon}"></i> ${sec.label} — ${sec.items.length} entries
        </span>
      </div>
    `;
    sec.items.forEach(item => {
      html += `
        <div class="az-item" data-section="${item.section}">
          <div class="az-letter">${item.letter}</div>
          <div class="az-title">${item.title}</div>
          <div class="az-desc">${item.desc}</div>
          <div class="az-section">${item.section}</div>
        </div>
      `;
    });
  }
  grid.innerHTML = html;

  // Click A-Z items to navigate to the right section
  grid.querySelectorAll('.az-item').forEach(el => {
    el.addEventListener('click', () => {
      const section = el.dataset.section;
      const navLink = document.querySelector(`.nav-link[data-section="${section}"]`);
      if (navLink) navLink.click();

      // Try to scroll to the relevant card
      const cardHeader = el.querySelector('.az-title')?.textContent;
      if (cardHeader) {
        setTimeout(() => {
          const cards = document.querySelectorAll(`#section-${section} .card h3`);
          for (const card of cards) {
            if (card.textContent.trim().includes(cardHeader.split('—')[0].trim())) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              break;
            }
          }
        }, 300);
      }
    });
  });
})();

/* ---- Initialize all modules ---- */
(async function init() {
  const statEl = document.getElementById('lastUpdated');
  statEl.innerHTML = '<i class="fas fa-sync-alt"></i> Loading...';

  try {
    await Promise.all([Finances.init(), Health.init(), Career.init()]);
  } catch (e) {
    console.error('Failed to initialize modules:', e);
    statEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading data';
    return;
  }

  // Update last updated
  const now = new Date();
  statEl.innerHTML = `<i class="fas fa-sync-alt"></i> Updated ${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;

  // Build dashboard stats
  buildDashboardStats();
})();

function buildDashboardStats() {
  const container = document.getElementById('dashboardStats');
  if (!container || !Finances.data || !Health.data || !Career.data) return;

  const f = Finances.data;
  const h = Health.data;
  const c = Career.data;

  const stats = [
    {
      label: 'Monthly Income',
      value: '₹' + Number(f.income.monthlyTotal).toLocaleString('en-IN'),
      change: `+${Math.round((f.income.monthlyTotal / f.income.history[0].total - 1) * 100)}% vs Jan`,
      cls: 'green'
    },
    {
      label: 'Monthly Expenses',
      value: '₹' + Number(f.expenses.monthlyTotal).toLocaleString('en-IN'),
      change: `₹${f.expenses.budget - f.expenses.monthlyTotal.toLocaleString('en-IN').replace(/,/g,'') > 0 ? '' : 'OVER'} budget`,
      cls: f.expenses.monthlyTotal <= f.expenses.budget ? 'green' : 'red'
    },
    {
      label: 'Net Worth',
      value: '₹' + Number(f.savings.netWorth).toLocaleString('en-IN'),
      change: `▲ ₹${Number(f.savings.netWorthChange).toLocaleString('en-IN')} this period`,
      cls: 'green'
    },
    {
      label: 'Portfolio Value',
      value: '₹' + Number(f.investments.totalValue).toLocaleString('en-IN'),
      change: `+${f.investments.returnPct}% return`,
      cls: 'green'
    },
    {
      label: 'Weight',
      value: `${h.fitness.currentWeight} kg`,
      change: `${h.fitness.weightChange > 0 ? '+' : ''}${h.fitness.weightChange} kg`,
      cls: h.fitness.weightChange < 0 ? 'green' : 'amber'
    },
    {
      label: 'Sleep (Avg)',
      value: `${h.sleep.avgSleepHours} hrs`,
      change: `Target: ${h.sleep.targetHours} hrs`,
      cls: parseFloat(h.sleep.avgSleepHours) >= 7 ? 'green' : 'amber'
    },
    {
      label: 'Meditation',
      value: `${h.mental.meditationMinutes.weeklyAvg} min/day`,
      change: `Target: ${h.mental.meditationMinutes.target} min`,
      cls: parseInt(h.mental.meditationMinutes.weeklyAvg) >= 18 ? 'green' : 'amber'
    },
    {
      label: 'Current Role',
      value: c.currentRole.role,
      change: `${c.currentRole.tenureMonths} months at ${c.currentRole.company.split(' ')[0]}`,
      cls: 'blue'
    },
    {
      label: 'Skills — Top',
      value: 'Flutter ' + (c.skills.technical.find(s => s.skill.includes('Flutter'))?.level || 0) + '%',
      change: `${c.skills.technical.filter(s => s.status === 'expert').length} expert skills`,
      cls: 'accent'
    },
    {
      label: 'Career Goals Done',
      value: `${c.careerGoals.filter(g => g.done).length} / ${c.careerGoals.length}`,
      change: `${c.careerGoals.filter(g => !g.done).length} in progress`,
      cls: 'blue'
    }
  ];

  container.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value ${s.cls}">${s.value}</div>
      <div class="stat-change ${s.cls === 'green' ? 'up' : 'down'}">${s.change}</div>
    </div>
  `).join('');
}

/* ---- Dashboard overview cards ---- */
(function renderDashboardOverviews() {
  const financeEl = document.getElementById('financeOverview');
  const healthEl = document.getElementById('healthOverview');
  const careerEl = document.getElementById('careerOverview');

  if (Finances.data) {
    const f = Finances.data;
    financeEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.8rem;">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Income</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--green);">₹${f.income.monthlyTotal.toLocaleString('en-IN')}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Expenses</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:${f.expenses.monthlyTotal > f.expenses.budget ? 'var(--red)' : 'var(--fg)'};">₹${f.expenses.monthlyTotal.toLocaleString('en-IN')}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Net Worth</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--green);">₹${f.savings.netWorth.toLocaleString('en-IN')}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Investments</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--accent-light);">₹${f.investments.totalValue.toLocaleString('en-IN')}</div>
        </div>
      </div>
    `;
  }

  if (Health.data) {
    const h = Health.data;
    healthEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.8rem;">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Weight</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--accent-light);">${h.fitness.currentWeight} kg</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">BMI</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--green);">${h.fitness.bmi}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Sleep</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:${parseFloat(h.sleep.avgSleepHours) >= 7 ? 'var(--green)' : 'var(--amber)'};">${h.sleep.avgSleepHours} hrs</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Stress</span>
          <div class="mono" style="font-size:1.1rem;font-weight:600;color:var(--amber);">${h.mental.stressLevel}</div>
        </div>
      </div>
    `;
  }

  if (Career.data) {
    const c = Career.data;
    careerEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.8rem;">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Role</span>
          <div style="font-size:1.1rem;font-weight:600;color:var(--accent-light);">${c.currentRole.role}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Tenure</span>
          <div style="font-size:1.1rem;font-weight:600;color:var(--fg);">${c.currentRole.tenureMonths} months</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Expert Skills</span>
          <div style="font-size:1.1rem;font-weight:600;color:var(--green);">${c.skills.technical.filter(s => s.status === 'expert').length}</div>
        </div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Goals</span>
          <div style="font-size:1.1rem;font-weight:600;color:var(--blue);">${c.careerGoals.filter(g => g.done).length}/${c.careerGoals.length}</div>
        </div>
      </div>
    `;
  }
})();
