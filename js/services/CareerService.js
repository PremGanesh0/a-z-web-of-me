/**
 * services/CareerService.js
 * Career domain: employment, skills, achievements, projects, goals
 */
import { Database } from '../core/Database.js';
import { Models } from '../core/Models.js';

export class CareerService {
  // ── Employment ───────────────────────────────────────────────
  getAllEmployment() {
    return Database.getEntitiesByType('employments');
  }

  getEmploymentById(id) {
    return Database.getEntity('employments', id);
  }

  getActiveEmployment() {
    return Database.getEntitiesByType('employments').find(e => e.status_record === 'active');
  }

  addEmployment(data) {
    const emp = new Models.Employment(data);
    const errors = emp.validate();
    if (errors.length) throw new Error(errors.join('; '));
    // Check for overlapping employment (basic)
    const existing = this.getAllEmployment().filter(e => e.status_record === 'active');
    if (existing) {
      const newStart = new Date(data.start_date);
      const newEnd = data.end_date ? new Date(data.end_date) : new Date();
      for (const ex of existing) {
        const exStart = new Date(ex.start_date);
        const exEnd = ex.end_date ? new Date(ex.end_date) : new Date();
        if (newStart <= exEnd && newEnd >= exStart) {
          throw new Error('Employment period overlaps with existing active employment');
        }
      }
    }
    return Database.addEntity('employments', emp.toJSON());
  }

  updateEmployment(id, data) {
    return Database.updateEntity('employments', id, data);
  }

  closeEmployment(id) {
    const emp = this.getEmploymentById(id);
    if (!emp) throw new Error('Employment not found');
    return Database.updateEntity('employments', id, {
      status_record: 'closed',
      end_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });
  }

  // ── Skills ───────────────────────────────────────────────────
  getAllSkills() {
    return Database.getEntitiesByType('skills');
  }

  getSkillById(id) {
    return Database.getEntity('skills', id);
  }

  getSkillsByCategory(category) {
    return Database.getEntitiesByType('skills').filter(s => s.category === category);
  }

  getTopSkills(n = 5) {
    return [...this.getAllSkills()]
      .sort((a, b) => b.proficiency - a.proficiency)
      .slice(0, n);
  }

  getExpertSkills() {
    return this.getAllSkills().filter(s => s.proficiency >= 80);
  }

  addSkill(data) {
    const skill = new Models.Skill(data);
    const errors = skill.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const existing = this.getAllSkills().find(
      s => s.name.toLowerCase() === data.name.toLowerCase()
    );
    if (existing) throw new Error('Skill already exists');
    return Database.addEntity('skills', skill.toJSON());
  }

  updateSkill(id, data) {
    return Database.updateEntity('skills', id, data);
  }

  deleteSkill(id) {
    const usedInProfile = Database.getEntity('profile', 'profile-001')?.skills?.includes(id);
    if (usedInProfile) {
      const profile = Database.getEntity('profile', 'profile-001');
      if (profile) {
        profile.skills = profile.skills.filter(s => s !== id);
        Database.updateEntity('profile', 'profile-001', { skills: profile.skills });
      }
    }
    return Database.deleteEntity('skills', id);
  }

  // ── Achievements / Certifications ────────────────────────────
  getAllAchievements() {
    // Use goals with category 'achievement' as achievements
    return Database.getEntitiesByType('goals').filter(g => g.category === 'achievement');
  }

  getAchievementById(id) {
    return Database.getEntity('goals', id);
  }

  getAchievementsByCategory(category) {
    return Database.getEntitiesByType('goals').filter(g => g.category === 'achievement' && g.title?.includes(category || ''));
  }

  addAchievement(data) {
    const ach = new Models.Goal(data);
    ach.category = 'achievement';
    const errors = ach.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('goals', ach.toJSON());
  }

  updateAchievement(id, data) {
    return Database.updateEntity('goals', id, data);
  }

  deleteAchievement(id) {
    return Database.deleteEntity('goals', id);
  }

  // ── Learning / Certifications ────────────────────────────────
  getAllLearning() {
    return Database.getEntitiesByType('goals').filter(g => g.category === 'learning');
  }

  getLearningById(id) {
    return Database.getEntity('goals', id);
  }

  getLearningByStatus(status) {
    return Database.getEntitiesByType('goals').filter(g => g.category === 'learning' && g.status === status);
  }

  addLearning(data) {
    const lr = new Models.Goal(data);
    lr.category = 'learning';
    lr.target = data.target || '';
    lr.current_value = data.current_value || 0;
    lr.unit = data.unit || '';
    const errors = lr.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('goals', lr.toJSON());
  }

  updateLearning(id, data) {
    return Database.updateEntity('goals', id, data);
  }

  completeLearning(id) {
    return Database.updateEntity('goals', id, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });
  }

  // ── Projects (Career context) ────────────────────────────────
  getAllCareerProjects() {
    return Database.getEntitiesByType('projects').filter(p => p.category === 'career');
  }

  getCareerProjectById(id) {
    return Database.getEntity('projects', id);
  }

  addCareerProject(data) {
    const proj = new Models.Project(data);
    proj.category = 'career';
    const errors = proj.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('projects', proj.toJSON());
  }

  updateCareerProject(id, data) {
    return Database.updateEntity('projects', id, data);
  }

  // ── Career Goals ──────────────────────────────────────────────
  getAllCareerGoals() {
    return Database.getEntitiesByType('goals').filter(g => g.category === 'career');
  }

  getCareerGoalById(id) {
    return Database.getEntity('goals', id);
  }

  addCareerGoal(data) {
    const goal = new Models.Goal(data);
    goal.category = 'career';
    const errors = goal.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('goals', goal.toJSON());
  }

  updateCareerGoal(id, data) {
    return Database.updateEntity('goals', id, data);
  }

  completeCareerGoal(id) {
    return Database.updateEntity('goals', id, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });
  }

  getCareerGoalsDashboard() {
    const goals = this.getAllCareerGoals();
    return goals.map(g => {
      const progress = g.target_value ? Math.min(100, Math.round((g.current_value / g.target_value) * 100)) : 0;
      const latestSkill = g.skill_id ? this.getSkillById(g.skill_id) : null;
      return {
        ...g,
        progress,
        progressDisplay: g.display_current ?
          `${g.current_value} / ${g.target_value} ${g.unit || ''}` :
          `${(g.current_value / g.target_value * 100).toFixed(0)}%`,
        linkedSkill: latestSkill ? { name: latestSkill.name, proficiency: latestSkill.proficiency } : null
      };
    });
  }

  // ── Employment History Timeline ─────────────────────────────
  getEmploymentTimeline() {
    return [...this.getAllEmployment()]
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
      .map(emp => ({
        ...emp,
        startDate: emp.start_date,
        endDate: emp.end_date || 'Present',
        duration: emp.tenureMonths,
        durationDisplay: emp.tenureMonths >= 12
          ? `${Math.floor(emp.tenureMonths / 12)}y ${emp.tenureMonths % 12}m`
          : `${emp.tenureMonths}m`,
        isActive: emp.status_record === 'active'
      }));
  }

  // ── Salary History ───────────────────────────────────────────
  getSalaryHistory() {
    return this.getAllEmployment()
      .filter(e => e.salary && e.salary > 0)
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
      .map(e => ({
        company: e.company,
        role: e.role,
        salary: e.salary,
        currency: e.currency || 'INR',
        start_date: e.start_date,
        end_date: e.end_date,
        isActive: e.status_record === 'active',
        monthly: e.salary / 12
      }));
  }

  // ── Skills Matrix ─────────────────────────────────────────────
  getSkillsMatrix() {
    const categories = [...new Set(this.getAllSkills().map(s => s.category))];
    return categories.map(cat => ({
      category: cat,
      skills: this.getSkillsByCategory(cat)
        .sort((a, b) => b.proficiency - a.proficiency)
        .map(s => ({
        id: s.id,
        name: s.name,
        proficiency: s.proficiency,
        yearsExperience: s.yearsExperience,
        certified: s.certified,
        lastUsed: s.lastUsed,
        status: s.proficiency >= 80 ? 'expert' : s.proficiency >= 60 ? 'advanced' : s.proficiency >= 40 ? 'intermediate' : 'learning'
      }))
    }));
  }

  // ── Skills Radar Data ─────────────────────────────────────────
  getSkillsRadarData() {
    const skills = this.getAllSkills();
    const groups = {};
    skills.forEach(s => {
      if (!groups[s.category]) groups[s.category] = [];
      groups[s.category].push({ name: s.name, value: s.proficiency, certified: s.certified });
    });
    return Object.entries(groups).map(([category, items]) => ({
      category,
      skills: items
    }));
  }

  // ── Computed dashboard ────────────────────────────────────────
  getDASHBOARD() {
    const active = this.getActiveEmployment();
    const timeline = this.getEmploymentTimeline();
    const skills = this.getAllSkills();
    const achievements = this.getAllAchievements();
    const learning = this.getLearningByStatus('in_progress');
    const completedLearning = this.getLearningByStatus('completed');
    const careerGoals = this.getCareerGoalsDashboard();
    const salaryHistory = this.getSalaryHistory();
    const totalExperienceMonths = timeline
      .filter(e => e.isActive || e.end_date)
      .reduce((sum, e) => sum + e.duration, 0);
    const expertSkills = this.getExpertSkills();
    const salaryCurrent = active?.salary || 0;
    const salaryMax = Math.max(...salaryHistory.map(s => s.salary));
    return {
      activeEmployment: active ? {
        company: active.company,
        role: active.role,
        startDate: active.start_date,
        tenureMonths: active.tenureMonths,
        tenureDisplay: active.tenureMonths >= 12
          ? `${Math.floor(active.tenureMonths / 12)} years ${active.tenureMonths % 12} months`
          : `${active.tenureMonths} months`,
        salary: salaryCurrent,
        monthlySalary: salaryCurrent / 12,
        location: active.location,
        technologies: active.technologies
      } : null,
      totalExperienceMonths,
      totalExperienceDisplay: totalExperienceMonths >= 12
        ? `${Math.floor(totalExperienceMonths / 12)} years ${totalExperienceMonths % 12} months`
        : `${totalExperienceMonths} months`,
      skillCount: skills.length,
      expertSkillCount: expertSkills.length,
      topSkills: this.getTopSkills(5),
      skillsMatrix: this.getSkillsMatrix(),
      skillsRadar: this.getSkillsRadarData(),
      achievementCount: achievements.length,
      achievements: achievements.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
      learningInProgress: learning,
      completedLearningCount: completedLearning.length,
      careerGoals,
      careerGoalsProgress: careerGoals.filter(g => g.status === 'in_progress').length,
      careerGoalsCompleted: careerGoals.filter(g => g.status === 'completed').length,
      salaryHistory,
      salaryCurrent,
      salaryMax,
      salaryGrowthPct: salaryMax > 0 && salaryHistory.length > 1
        ? Math.round(((salaryCurrent - salaryHistory[salaryHistory.length - 1].salary) / salaryHistory[salaryHistory.length - 1].salary) * 100)
        : 0,
      timeline
    };
  }
}
