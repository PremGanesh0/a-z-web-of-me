/* ============================================================
   health.js — Health & Wellness Tracking Module
   Loads data/health.json and renders all health views.
   ============================================================ */

const Health = (() => {
  let data = null;

  async function load() {
    const res = await fetch('data/health.json');
    data = await res.json();
    return data;
  }

  function renderFitness() {
    const el = document.getElementById('fitnessBreakdown');
    if (!data) return;
    const d = data.fitness;
    let html = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.7rem;margin-bottom:1rem;">
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Weight</div>
          <div class="stat-value accent" style="font-size:1.3rem;">${d.currentWeight} kg</div>
          <div class="stat-change ${d.weightChange < 0 ? 'down' : 'up'}">${d.weightChange > 0 ? '+' : ''}${d.weightChange} kg</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">BMI</div>
          <div class="stat-value blue" style="font-size:1.3rem;">${d.bmi}</div>
          <div class="stat-change" style="color:var(--fg-muted);">Normal range</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Body Fat</div>
          <div class="stat-value green" style="font-size:1.3rem;">${d.bodyFatPct}%</div>
          <div class="stat-change" style="color:var(--fg-muted);">Fit range</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Workouts This Week</div>
          <div class="stat-value accent" style="font-size:1.3rem;">${d.workoutsThisWeek} / ${d.weeklyGoal}</div>
          <div class="progress-bar" style="margin-top:0.3rem;">
            <div class="progress-fill" style="width:${(d.workoutsThisWeek/d.weeklyGoal)*100}%;background:var(--accent);"></div>
          </div>
        </div>
      </div>
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Activities</div>
      <table class="data-table">
        <thead><tr><th>Activity</th><th>Frequency</th><th>Duration</th><th>Details</th></tr></thead>
        <tbody>
    `;
    d.activities.forEach(a => {
      html += `<tr>
        <td style="font-weight:500;"><span class="tag tag-accent">${a.type}</span></td>
        <td>${a.frequency}</td>
        <td>${a.duration}</td>
        <td style="color:var(--fg-muted);">${a.distance || a.focus || '—'}</td>
      </tr>`;
    });
    html += '</tbody></table>';

    // PR records
    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.4rem;">Personal Records</div>
      <table class="data-table">
        <thead><tr><th>Activity</th><th>PR Time / Distance</th><th>Date</th></tr></thead>
        <tbody>`;
    d.prRecords.forEach(p => {
      html += `<tr>
        <td style="font-weight:500;">${p.activity}</td>
        <td class="mono" style="color:var(--green);font-weight:600;">${p.time}</td>
        <td style="color:var(--fg-dim);">${p.date}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    el.innerHTML = html;
  }

  function renderNutrition() {
    const el = document.getElementById('nutritionBreakdown');
    if (!data) return;
    const d = data.nutrition;
    let html = `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:0.6rem;margin-bottom:1rem;">
        <div class="stat-card" style="padding:0.8rem;">
          <div class="stat-label">Calories Target</div>
          <div class="stat-value accent" style="font-size:1.2rem;">${d.dailyCalories.target}</div>
        </div>
        <div class="stat-card" style="padding:0.8rem;">
          <div class="stat-label">Avg Intake</div>
          <div class="stat-value blue" style="font-size:1.2rem;">${d.dailyCalories.avgIntake}</div>
        </div>
        <div class="stat-card" style="padding:0.8rem;">
          <div class="stat-label">Today</div>
          <div class="stat-value" style="font-size:1.2rem;color:var(--fg);">${d.dailyCalories.today}</div>
        </div>
        <div class="stat-card" style="padding:0.8rem;">
          <div class="stat-label">Protein</div>
          <div class="stat-value green" style="font-size:1.2rem;">${d.macros.protein.avg} / ${d.macros.protein.target} g</div>
        </div>
        <div class="stat-card" style="padding:0.8rem;">
          <div class="stat-label">Water</div>
          <div class="stat-value blue" style="font-size:1.2rem;">${d.macros.water.avg} / ${d.macros.water.target} ml</div>
        </div>
      </div>
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Dietary Habits</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-bottom:0.8rem;">
    `;
    d.dietaryHabits.forEach(h => {
      html += `<span class="tag tag-green" style="margin:0;">✓ ${h}</span>`;
    });
    html += `</div><div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Supplements</div>
      <table class="data-table">
        <thead><tr><th>Supplement</th><th>Dose</th><th>Reason</th></tr></thead>
        <tbody>`;
    d.supplements.forEach(s => {
      html += `<tr>
        <td style="font-weight:500;">${s.name}</td>
        <td style="color:var(--fg-muted);">${s.dose}</td>
        <td style="color:var(--fg-dim);">${s.reason}</td>
      </tr>`;
    });
    html += '</tbody></table>';

    el.innerHTML = html;
  }

  function renderSleep() {
    const el = document.getElementById('sleepBreakdown');
    if (!data) return;
    const d = data.sleep;
    const scoreColor = d.consistencyScore >= 85 ? 'var(--green)' : d.consistencyScore >= 70 ? 'var(--amber)' : 'var(--red)';
    let html = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.7rem;margin-bottom:1rem;">
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Avg Sleep</div>
          <div class="stat-value accent" style="font-size:1.5rem;">${d.avgSleepHours} hrs</div>
          <div class="stat-change" style="color:var(--fg-muted);">Target: ${d.targetHours} hrs</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">This Week</div>
          <div class="stat-value blue" style="font-size:1.3rem;">${d.thisWeekAvg} hrs</div>
          <div class="stat-change" style="color:var(--fg-muted);">—</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Deep Sleep</div>
          <div class="stat-value green" style="font-size:1.3rem;">${d.deepSleepPct}%</div>
          <div class="stat-change" style="color:var(--fg-muted);">Good</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Consistency</div>
          <div class="stat-value" style="font-size:1.3rem;color:${scoreColor};">${d.consistencyScore}%</div>
          <div class="progress-bar" style="margin-top:0.3rem;">
            <div class="progress-fill" style="width:${d.consistencyScore}%;background:${scoreColor};"></div>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:0.8rem;flex-wrap:wrap;margin-bottom:0.8rem;">
        <span><span style="color:var(--fg-dim);margin-right:0.3rem;">🌙 Bedtime:</span><strong style="color:var(--fg);">${d.bedtime}</strong></span>
        <span><span style="color:var(--fg-dim);margin-right:0.3rem;">☀ Wake:</span><strong style="color:var(--fg);">${d.wakeTime}</strong></span>
        <span><span style="color:var(--fg-dim);margin-right:0.3rem;">📊 Quality:</span><strong style="color:var(--green);">${d.sleepQuality}</strong></span>
      </div>
      <div style="font-size:0.82rem;color:var(--fg-muted);font-style:italic;border-left:2px solid var(--accent);padding-left:0.7rem;">
        "${d.notes}"
      </div>
    `;

    el.innerHTML = html;
  }

  function renderMental() {
    const el = document.getElementById('mentalBreakdown');
    if (!data) return;
    const d = data.mental;
    const moodColors = {
      Great: 'var(--green)',
      Good: 'var(--blue)',
      Okay: 'var(--amber)',
      Bad: 'var(--red)'
    };
    let html = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.7rem;margin-bottom:1rem;">
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Meditation Today</div>
          <div class="stat-value accent" style="font-size:1.3rem;">${d.meditationMinutes.today} min</div>
          <div class="stat-change" style="color:var(--fg-muted);">Target: ${d.meditationMinutes.target} min</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Weekly Avg</div>
          <div class="stat-value blue" style="font-size:1.3rem;">${d.meditationMinutes.weeklyAvg} min</div>
          <div class="stat-change" style="color:var(--fg-muted);">—</div>
        </div>
        <div class="stat-card" style="padding:0.9rem;">
          <div class="stat-label">Stress Level</div>
          <div class="stat-value" style="font-size:1.3rem;color:var(--amber);">${d.stressLevel}</div>
          <div class="stat-change" style="color:var(--fg-muted);">—</div>
        </div>
      </div>
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Mood This Week</div>
      <div style="display:flex;gap:0.3rem;margin-bottom:0.8rem;flex-wrap:wrap;">
    `;
    Object.entries(d.moodThisWeek).forEach(([day, mood]) => {
      const color = moodColors[mood] || 'var(--fg-dim)';
      html += `<div style="text-align:center;padding:0.3rem 0.5rem;background:var(--bg);border-radius:6px;border:1px solid var(--border);min-width:50px;">
        <div style="font-size:0.62rem;color:var(--fg-dim);">${day.slice(0,3)}</div>
        <div style="font-size:0.75rem;font-weight:600;color:${color};">${mood}</div>
      </div>`;
    });
    html += `</div><div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Stress Relief</div>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:0.3rem;">
    `;
    d.stressReliefActivities.forEach(a => {
      html += `<li style="padding:0.25rem 0;font-size:0.85rem;color:var(--fg);"><span style="color:var(--accent-light);margin-right:0.4rem;">→</span>${a}</li>`;
    });
    html += `</ul>
      <div style="margin-top:0.8rem;display:flex;gap:1rem;flex-wrap:wrap;">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Journal entries:</span><strong style="color:var(--fg);">${d.journalEntriesThisMonth} / month</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Gratitude:</span><strong style="color:var(--green);">3 things daily ✓</strong></div>
      </div>
    `;

    el.innerHTML = html;
  }

  function renderVitals() {
    const el = document.getElementById('vitalsBreakdown');
    if (!data) return;
    const d = data.vitals;
    let html = `
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Recent Health Checks</div>
      <table class="data-table">
        <thead><tr><th>Metric</th><th>Value</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
    `;
    d.recentChecks.forEach(c => {
      const statusTag = c.status === 'Normal' || c.status === 'Excellent' ? 'tag-green' : 'tag-amber';
      html += `<tr>
        <td style="font-weight:500;">${c.metric}</td>
        <td class="mono" style="font-weight:600;">${c.value}</td>
        <td style="color:var(--fg-dim);">${c.date}</td>
        <td><span class="tag ${statusTag}">${c.status}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    html += `<div style="margin-top:1rem;display:flex;gap:1.5rem;flex-wrap:wrap;font-size:0.85rem;">
      <div><span style="color:var(--fg-dim);">Next checkup:</span><strong style="color:var(--fg);">${d.nextCheckup}</strong></div>
      <div><span style="color:var(--fg-dim);">Insurance:</span><strong style="color:var(--fg);">${d.healthInsurance.provider} (${fmtPolicy(d.healthInsurance.coverage)})</strong></div>
      <div><span style="color:var(--fg-dim);">Renew date:</span><strong style="color:var(--fg);">${d.healthInsurance.renewDate}</strong></div>
    </div>`;

    el.innerHTML = html;
  }

  function fmtPolicy(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  function renderHealthGoals() {
    const el = document.getElementById('healthGoals');
    if (!data) return;
    const d = data.healthGoals;
    let html = `<div style="display:flex;flex-direction:column;gap:0.3rem;">`;
    d.forEach(g => {
      const done = g.done;
      html += `<div class="goal-item">
        <div class="goal-checkbox ${done ? 'checked' : ''}" data-goal="${g.name}"></div>
        <div class="goal-text ${done ? 'done' : ''}">${g.name}</div>
        <div class="goal-date">Target: ${g.date} | ${g.current}</div>
      </div>`;
    });
    html += '</div>';

    el.innerHTML = html;

    // Wire up goal checkboxes
    el.querySelectorAll('.goal-checkbox').forEach(cb => {
      cb.addEventListener('click', () => {
        const goalName = cb.dataset.goal;
        cb.classList.toggle('checked');
        const text = cb.nextElementSibling;
        text.classList.toggle('done');
        // Persist to data
        const goal = data.healthGoals.find(g => g.name === goalName);
        if (goal) goal.done = cb.classList.contains('checked');
        saveData();
      });
    });
  }

  async function saveData() {
    try {
      await fetch('data/health.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2)
      });
    } catch (e) {
      console.warn('Could not persist health data (file system read-only in browser).');
    }
  }

  return {
    async init() {
      data = await load();
      renderFitness();
      renderNutrition();
      renderSleep();
      renderMental();
      renderVitals();
      renderHealthGoals();
    },
    get data() { return data; }
  };
})();
