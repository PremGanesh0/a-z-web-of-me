/* ============================================================
   career.js — Career & Professional Tracking Module
   Loads data/career.json and renders all career views.
   ============================================================ */

const Career = (() => {
  let data = null;

  async function load() {
    const res = await fetch('data/career.json');
    data = await res.json();
    return data;
  }

  function renderCurrentRole() {
    const el = document.getElementById('currentRole');
    if (!data) return;
    const d = data.currentRole;
    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1rem;">
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Company</span><strong style="color:var(--fg);font-size:1.05rem;">${d.company}</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Role</span><strong style="color:var(--accent-light);font-size:1.05rem;">${d.role}</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Department</span><strong style="color:var(--fg);">${d.department}</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Started</span><strong style="color:var(--fg);">${d.startDate} (${d.tenureMonths} mo)</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Location</span><strong style="color:var(--fg);">${d.location}</strong></div>
        <div><span style="color:var(--fg-dim);font-size:0.78rem;">Resume</span><a href="${d.resume}" target="_blank" style="color:var(--accent-light);">${d.resume} <i class="fas fa-external-link-alt"></i></a></div>
      </div>
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Key Responsibilities</div>
      <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:0.35rem;">
    `;
    d.keyResponsibilities.forEach(r => {
      html += `<li style="padding:0.3rem 0;font-size:0.88rem;color:var(--fg);display:flex;align-items:center;gap:0.5rem;border-bottom:1px solid var(--border);">
        <span style="color:var(--accent-light);"><i class="fas fa-chevron-right"></i></span>${r}</li>`;
    });
    html += '</ul>';

    el.innerHTML = html;
  }

  function renderSkills() {
    const el = document.getElementById('skillsBreakdown');
    if (!data) return;
    const d = data.skills;
    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.8rem;">
        <span style="font-size:0.78rem;color:var(--fg-muted);">Technical Skills</span>
        <span style="font-size:0.78rem;color:var(--fg-muted);text-align:right;">Soft Skills</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;">
        <div>
          <table class="data-table">
            <thead><tr><th>Skill</th><th>Level</th><th>Years</th><th>Category</th></tr></thead>
            <tbody>
    `;
    d.technical.forEach(s => {
      const barColor = s.status === 'expert' ? 'var(--green)' : s.status === 'advanced' ? 'var(--blue)' : 'var(--amber)';
      html += `<tr>
        <td style="font-weight:500;">${s.skill}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span class="mono" style="font-size:0.8rem;font-weight:600;color:${barColor};min-width:2.5rem;">${s.level}%</span>
            <div class="progress-bar" style="flex:1;height:4px;">
              <div class="progress-fill" style="width:${s.level}%;background:${barColor};"></div>
            </div>
          </div>
        </td>
        <td style="color:var(--fg-dim);font-size:0.78rem;">${s.years} yr</td>
        <td style="color:var(--fg-dim);font-size:0.78rem;">${s.category}</td>
      </tr>`;
    });
    html += '</tbody></table></div><div><table class="data-table"><thead><tr><th>Skill</th><th>Level</th></tr></thead><tbody>';
    d.soft.forEach(s => {
      const barColor = s.level >= 85 ? 'var(--green)' : s.level >= 75 ? 'var(--blue)' : 'var(--amber)';
      html += `<tr>
        <td style="font-weight:500;">${s.skill}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span class="mono" style="font-size:0.8rem;font-weight:600;color:${barColor};min-width:2.5rem;">${s.level}%</span>
            <div class="progress-bar" style="flex:1;height:4px;">
              <div class="progress-fill" style="width:${s.level}%;background:${barColor};"></div>
            </div>
          </div>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div></div>';

    el.innerHTML = html;
  }

  function renderAchievements() {
    const el = document.getElementById('achievementsBreakdown');
    if (!data) return;
    const d = data.achievements;
    const typeColors = {
      career: 'tag-accent',
      promotion: 'tag-green',
      project: 'tag-blue',
      content: 'tag-amber',
      personal: 'tag-red'
    };
    let html = `
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Career Milestones</div>
      <table class="data-table">
        <thead><tr><th>Year</th><th>Event</th><th>Type</th></tr></thead>
        <tbody>
    `;
    d.milestones.forEach(m => {
      html += `<tr>
        <td style="font-weight:600;color:var(--accent-light);" class="mono">${m.year}</td>
        <td style="font-weight:500;">${m.event}</td>
        <td><span class="tag ${typeColors[m.type] || 'tag-accent'}">${m.type}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    html += `<div style="margin-top:1rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Awards & Recognitions</div>
      <table class="data-table">
        <thead><tr><th>Award</th><th>Organization</th><th>Year</th></tr></thead>
        <tbody>`;
    d.awards.forEach(a => {
      html += `<tr>
        <td style="font-weight:500;color:var(--green);">★ ${a.title}</td>
        <td style="color:var(--fg-dim);">${a.org}</td>
        <td class="mono" style="color:var(--fg-dim);">${a.year}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    el.innerHTML = html;
  }

  function renderLearning() {
    const el = document.getElementById('learningBreakdown');
    if (!data) return;
    const d = data.learning;
    let html = `
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Certifications</div>
      <table class="data-table">
        <thead><tr><th>Certification</th><th>Issuer</th><th>Year</th><th>Status</th></tr></thead>
        <tbody>
    `;
    d.certifications.forEach(c => {
      const tag = c.status === 'earned' ? 'tag-green' : 'tag-amber';
      html += `<tr>
        <td style="font-weight:500;">${c.name}</td>
        <td style="color:var(--fg-dim);">${c.issuer}</td>
        <td class="mono" style="color:var(--fg-dim);">${c.year}</td>
        <td><span class="tag ${tag}">${c.status}</span></td>
      </tr>`;
    });
    html += '</tbody></table>';

    html += `<div style="margin-top:0.8rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Courses Completed</div>
      <table class="data-table">
        <thead><tr><th>Course</th><th>Platform</th><th>Year</th></tr></thead>
        <tbody>`;
    d.coursesCompleted.forEach(c => {
      html += `<tr>
        <td style="font-weight:500;">${c.name}</td>
        <td style="color:var(--fg-dim);">${c.platform}</td>
        <td class="mono" style="color:var(--fg-dim);">${c.year}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    html += `<div style="margin-top:0.8rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Currently Learning</div>
      <table class="data-table">
        <thead><tr><th>Skill</th><th>Progress</th><th>Resource</th></tr></thead>
        <tbody>`;
    d.currentlyLearning.forEach(c => {
      const pct = parseInt(c.progress);
      const color = pct >= 50 ? 'var(--green)' : pct >= 25 ? 'var(--blue)' : 'var(--amber)';
      html += `<tr>
        <td style="font-weight:500;">${c.skill}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span class="mono" style="font-size:0.8rem;color:${color};min-width:2.5rem;">${c.progress}</span>
            <div class="progress-bar" style="flex:1;height:4px;">
              <div class="progress-fill" style="width:${pct}%;background:${color};"></div>
            </div>
          </div>
        </td>
        <td style="color:var(--fg-dim);font-size:0.78rem;">${c.resource}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    html += `<div style="margin-top:0.8rem;">
      <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Books Read</div>
      <table class="data-table">
        <thead><tr><th>Title</th><th>Author</th><th>Year</th></tr></thead>
        <tbody>`;
    d.booksRead.forEach(b => {
      html += `<tr>
        <td style="font-weight:500;">${b.title}</td>
        <td style="color:var(--fg-dim);">${b.author}</td>
        <td class="mono" style="color:var(--fg-dim);">${b.year}</td>
      </tr>`;
    });
    html += '</tbody></table></div>';

    el.innerHTML = html;
  }

  function renderCareerGoals() {
    const el = document.getElementById('careerGoals');
    if (!data) return;
    const d = data.careerGoals;
    let html = `<div style="display:flex;flex-direction:column;gap:0.3rem;">`;
    d.forEach(g => {
      const done = g.done;
      html += `<div class="goal-item">
        <div class="goal-checkbox ${done ? 'checked' : ''}" data-goal="${g.name}"></div>
        <div class="goal-text ${done ? 'done' : ''}">${g.name}</div>
        <div style="display:flex;gap:0.8rem;font-size:0.72rem;color:var(--fg-dim);">
          <span>Target: ${g.target}</span>
          <span>Current: ${g.current}</span>
          <span>Timeline: ${g.timeline}</span>
        </div>
      </div>`;
    });
    html += '</div>';

    el.innerHTML = html;

    el.querySelectorAll('.goal-checkbox').forEach(cb => {
      cb.addEventListener('click', () => {
        const goalName = cb.dataset.goal;
        cb.classList.toggle('checked');
        const text = cb.nextElementSibling;
        text.classList.toggle('done');
        const goal = data.careerGoals.find(g => g.name === goalName);
        if (goal) goal.done = cb.classList.contains('checked');
        saveData();
      });
    });
  }

  function renderNetwork() {
    const el = document.getElementById('networkBreakdown');
    if (!data) return;
    const d = data.network;
    let html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
        <div>
          <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Mentors</div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">
    `;
    d.mentors.forEach(m => {
      html += `<div style="padding:0.5rem 0.7rem;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
        <div style="font-weight:600;font-size:0.9rem;">👤 ${m.name}</div>
        <div style="font-size:0.78rem;color:var(--fg-muted);">${m.relationship}</div>
      </div>`;
    });
    html += `</div></div><div>
          <div><div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;">Peers</div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">`;
    d.peers.forEach(p => {
      html += `<div style="padding:0.5rem 0.7rem;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
        <div style="font-weight:600;font-size:0.9rem;">👤 ${p.name}</div>
        <div style="font-size:0.78rem;color:var(--fg-muted);">${p.relationship}</div>
      </div>`;
    });
    html += `</div></div><div>
          <div style="font-size:0.78rem;color:var(--fg-muted);margin-bottom:0.5rem;margin-top:0.5rem;">Community</div>
          <div style="display:flex;flex-direction:column;gap:0.6rem;">`;
    d.community.forEach(c => {
      html += `<div style="padding:0.5rem 0.7rem;background:var(--bg);border-radius:6px;border:1px solid var(--border);">
        <div style="font-weight:600;font-size:0.9rem;"><span class="tag tag-accent">${c.role}</span> ${c.name}</div>
        <div style="font-size:0.78rem;color:var(--fg-muted);">${c.activity}</div>
      </div>`;
    });
    html += '</div></div></div>';

    el.innerHTML = html;
  }

  async function saveData() {
    try {
      await fetch('data/career.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, null, 2)
      });
    } catch (e) {
      console.warn('Could not persist career data (file system read-only in browser).');
    }
  }

  return {
    async init() {
      data = await load();
      renderCurrentRole();
      renderSkills();
      renderAchievements();
      renderLearning();
      renderCareerGoals();
      renderNetwork();
    },
    get data() { return data; }
  };
})();
