/**
 * services/HealthService.js
 * Health domain: metrics, habits, goals
 */
import { Database } from '../core/Database.js';
import { Models } from '../core/Models.js';

export class HealthService {
  // ── Metrics ──────────────────────────────────────────────────
  getAllMetrics() {
    return Database.getEntitiesByType('health_metrics');
  }

  getMetricById(id) {
    return Database.getEntity('health_metrics', id);
  }

  getMetricsByType(type) {
    return Database.getEntitiesByType('health_metrics').filter(m => m.type === type);
  }

  getLatestMetric(type) {
    const metrics = this.getMetricsByType(type);
    if (!metrics.length) return null;
    return metrics.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(b.created_at))[0];
  }

  getMetricHistory(type, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return this.getMetricsByType(type)
      .filter(m => new Date(m.date) >= cutoff)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  addMetric(data) {
    const metric = new Models.HealthMetric(data);
    const errors = metric.validate();
    if (errors.length) throw new Error(errors.join('; '));
    // Check for duplicate date+type
    const existing = this.getMetricsByType(data.type).find(
      m => m.date === data.date
    );
    if (existing) throw new Error('Metric for this type already recorded on this date');
    return Database.addEntity('health_metrics', metric.toJSON());
  }

  updateMetric(id, data) {
    return Database.updateEntity('health_metrics', id, data);
  }

  deleteMetric(id) {
    return Database.deleteEntity('health_metrics', id);
  }

  // ── Habits ───────────────────────────────────────────────────
  getAllHabits() {
    return Database.getEntitiesByType('habits');
  }

  getHabitById(id) {
    return Database.getEntity('habits', id);
  }

  getActiveHabits() {
    return Database.getEntitiesByType('habits').filter(h => h.status === 'active');
  }

  addHabit(data) {
    const habit = new Models.Habit(data);
    const errors = habit.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const existing = this.getAllHabits().find(h => h.name.toLowerCase() === data.name.toLowerCase());
    if (existing) throw new Error('Habit with this name already exists');
    return Database.addEntity('habits', habit.toJSON());
  }

  updateHabit(id, data) {
    return Database.updateEntity('habits', id, data);
  }

  deleteHabit(id) {
    return Database.deleteEntity('habits', id);
  }

  toggleHabitCompletion(id) {
    const habit = this.getHabitById(id);
    if (!habit) throw new Error('Habit not found');
    const today = new Date().toISOString().split('T')[0];
    const lastCompleted = habit.last_completed_date;
    let newStreak = habit.current_streak;
    if (lastCompleted !== today) {
      // Check if yesterday (or the last day based on frequency) was completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastCompleted === yesterdayStr || !lastCompleted) {
        newStreak = habit.current_streak + 1;
      } else {
        newStreak = 1; // reset streak
      }
    }
    const newBest = Math.max(habit.best_streak, newStreak);
    return Database.updateEntity('habits', habit.id, {
      current_streak: newStreak,
      best_streak: newBest,
      last_completed_date: today,
      updated_at: new Date().toISOString()
    });
  }

  resetHabitStreak(id) {
    return Database.updateEntity('habits', id, {
      current_streak: 0,
      updated_at: new Date().toISOString()
    });
  }

  getHabitsDashboard() {
    const active = this.getActiveHabits();
    const today = new Date().toISOString().split('T')[0];
    return active.map(h => ({
      ...h,
      completedToday: h.last_completed_date === today,
      streakDisplay: h.current_streak > 0 ? `${h.current_streak} day${h.current_streak !== 1 ? 's' : ''}` : 'No streak',
      bestDisplay: h.best_streak > 0 ? `${h.best_streak} day${h.best_streak !== 1 ? 's' : ''}` : '—'
    }));
  }

  // ── Health Goals ──────────────────────────────────────────────
  getAllHealthGoals() {
    return Database.getEntitiesByType('health_goals');
  }

  getHealthGoalById(id) {
    return Database.getEntity('health_goals', id);
  }

  addHealthGoal(data) {
    const goal = new Models.HealthGoal(data);
    const errors = goal.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('health_goals', goal.toJSON());
  }

  updateHealthGoal(id, data) {
    return Database.updateEntity('health_goals', id, data);
  }

  completeHealthGoal(id) {
    return Database.updateEntity('health_goals', id, {
      status: 'completed',
      completed_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString()
    });
  }

  getHealthGoalsDashboard() {
    const goals = this.getAllHealthGoals();
    return goals.map(g => {
      const latestMetric = this.getLatestMetric(g.metric_type);
      const currentValue = latestMetric ? latestMetric.value : g.current_value;
      const progress = g.target_value > 0
        ? Math.min(100, Math.round((currentValue / g.target_value) * 100))
        : 0;
      return {
        ...g,
        currentValue,
        progress,
        latestMetricDate: latestMetric?.date || null,
        latestMetricValue: latestMetric?.value || null
      };
    });
  }

  // ── Fitness / Activity ───────────────────────────────────────
  getFitnessSummary() {
    const weight = this.getLatestMetric('weight');
    const bmi = this.getLatestMetric('bmi');
    const bodyFat = this.getLatestMetric('body_fat');
    const waist = this.getLatestMetric('waist_circumference');
    return {
      weight: weight ? { value: weight.value, date: weight.date, unit: weight.unit } : null,
      bmi: bmi ? { value: bmi.value, date: bmi.date } : null,
      bodyFat: bodyFat ? { value: bodyFat.value, date: bodyFat.date, unit: bodyFat.unit } : null,
      waist: waist ? { value: waist.value, date: waist.date, unit: waist.unit } : null
    };
  }

  getWeightTrend(days = 90) {
    return this.getMetricHistory('weight', days);
  }

  getBMITrend(days = 90) {
    return this.getMetricHistory('bmi', days);
  }

  // ── Vitals dashboard ─────────────────────────────────────────
  getVitalsDashboard() {
    const metrics = {
      weight: this.getLatestMetric('weight'),
      bmi: this.getLatestMetric('bmi'),
      bodyFat: this.getLatestMetric('body_fat'),
      bloodPressureSystolic: this.getLatestMetric('blood_pressure_systolic'),
      bloodPressureDiastolic: this.getLatestMetric('blood_pressure_diastolic'),
      heartRate: this.getLatestMetric('heart_rate'),
      bloodSugar: this.getLatestMetric('blood_sugar'),
      cholesterolTotal: this.getLatestMetric('cholesterol_total'),
      cholesterolHDL: this.getLatestMetric('cholesterol_hdl'),
      cholesterolLDL: this.getLatestMetric('cholesterol_ldl'),
      triglycerides: this.getLatestMetric('triglycerides')
    };
    return metrics;
  }

  // ── Computed dashboard ──────────────────────────────────────
  getDASHBOARD() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const fitness = this.getFitnessSummary();
    const vitals = this.getVitalsDashboard();
    const habits = this.getHabitsDashboard();
    const healthGoals = this.getHealthGoalsDashboard();
    const weightTrend = this.getWeightTrend(30);
    const weightChange = weightTrend.length >= 2
      ? weightTrend[weightTrend.length - 1].value - weightTrend[0].value
      : 0;
    const avgSteps = this.getMetricHistory('daily_steps', 7)
      .reduce((s, m) => s + (m.value || 0), 0) / Math.max(1, this.getMetricHistory('daily_steps', 7).length);
    return {
      today: todayStr,
      fitness,
      vitals,
      habits,
      healthGoals,
      weightChange,
      weightTrend: weightTrend.slice(-14),
      avgSteps7d: Math.round(avgSteps),
      completedHabitsToday: habits.filter(h => h.completedToday).length,
      totalActiveHabits: habits.length
    };
  }
}
