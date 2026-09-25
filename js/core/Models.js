/* ============================================================
   core/Models.js — Data model constructors for PREM OS
   ============================================================ */

const Models = (() => {
  /* ---- Base entity with audit fields ---- */
  class BaseEntity {
    constructor(data = {}) {
      this.id = data.id || crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      this.created_at = data.created_at || new Date().toISOString();
      this.updated_at = data.updated_at || new Date().toISOString();
      this.created_by = data.created_by || 'Prem';
      this.updated_by = data.updated_by || 'Prem';
      this.status = data.status || 'active';
      this.metadata = data.metadata || {};
    }

    toJSON() {
      return {
        id: this.id,
        created_at: this.created_at,
        updated_at: this.updated_at,
        created_by: this.created_by,
        updated_by: this.updated_by,
        status: this.status,
        metadata: this.metadata,
        ...this.getExtraFields()
      };
    }

    getExtraFields() { return {}; }

    update(data, by = 'Prem') {
      Object.assign(this, data);
      this.updated_at = new Date().toISOString();
      this.updated_by = by;
    }
  }

  /* ---- Profile ---- */
  class Profile extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.bio = data.bio || '';
      this.location = data.location || '';
      this.profession = data.profession || '';
      this.tagline = data.tagline || '';
      this.website = data.website || '';
      this.github = data.github || '';
      this.linkedin = data.linkedin || '';
      this.youtube = data.youtube || '';
      this.instagram = data.instagram || '';
      this.profilePhoto = data.profilePhoto || '';
      this.interests = data.interests || [];
      this.skills = data.skills || [];
    }
  }

  /* ---- Employment ---- */
  class Employment extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.company = data.company || '';
      this.role = data.role || '';
      this.start_date = data.start_date || '';
      this.end_date = data.end_date || null;
      this.location = data.location || '';
      this.salary = data.salary || 0;
      this.status_record = data.status_record || 'active';
      this.technologies = data.technologies || [];
      this.responsibilities = data.responsibilities || [];
      this.achievements = data.achievements || [];
      this.notes = data.notes || '';
    }

    get tenureMonths() {
      const start = new Date(this.start_date);
      const end = this.end_date ? new Date(this.end_date) : new Date();
      return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
    }
  }

  /* ---- Skill ---- */
  class Skill extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.category = data.category || 'General';
      this.proficiency = data.proficiency || 0;
      this.yearsExperience = data.yearsExperience || 0;
      this.certified = data.certified || false;
      this.lastUsed = data.lastUsed || '';
    }
  }

  /* ---- Project ---- */
  class Project extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.description = data.description || '';
      this.status = data.status || 'idea';
      this.priority = data.priority || 'medium';
      this.start_date = data.start_date || '';
      this.target_date = data.target_date || null;
      this.progress = data.progress || 0;
      this.technology = data.technology || [];
      this.repository = data.repository || '';
      this.website = data.website || '';
      this.notes = data.notes || '';
    }
  }

  /* ---- Finance Account ---- */
  class FinanceAccount extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.type = data.type || 'checking';
      this.institution = data.institution || '';
      this.account_number = data.account_number || '';
      this.currency = data.currency || 'INR';
      this.current_balance = data.current_balance || 0;
      this.credit_limit = data.credit_limit || null;
      this.interest_rate = data.interest_rate || null;
      this.opened_date = data.opened_date || '';
      this.closed_date = data.closed_date || null;
      this.status = data.status || 'active';
      this.notes = data.notes || '';
      this.dpd = data.dpd || [];
    }

    get utilization() {
      if (!this.credit_limit || this.credit_limit <= 0) return 0;
      return Math.round((this.current_balance / this.credit_limit) * 100);
    }

    get hasDPD() {
      return this.dpd.some(d => d.days > 0 && d.status !== 'disputed');
    }

    get worstDPD() {
      if (!this.dpd.length) return 0;
      return Math.max(...this.dpd.map(d => d.days));
    }

    get utilizationLevel() {
      const u = this.utilization;
      if (u <= 30) return 'good';
      if (u <= 50) return 'warning';
      return 'danger';
    }
  }

  /* ---- Finance Category ---- */
  class FinanceCategory extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.type = data.type || 'expense';
      this.icon = data.icon || '';
      this.color = data.color || '#8B929A';
      this.budget_monthly = data.budget_monthly || null;
    }
  }

  /* ---- Transaction ---- */
  class Transaction extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.date = data.date || new Date().toISOString().slice(0, 10);
      this.amount = data.amount || 0;
      this.type = data.type || 'expense';
      this.category_id = data.category_id || '';
      this.category_name = data.category_name || '';
      this.account_id = data.account_id || '';
      this.description = data.description || '';
      this.merchant = data.merchant || null;
      this.payment_method = data.payment_method || '';
      this.tags = data.tags || [];
      this.notes = data.notes || '';
    }

    validates() {
      const errors = [];
      if (!this.date) errors.push('Date is required');
      if (!this.amount || this.amount <= 0) errors.push('Amount must be > 0');
      if (!['income', 'expense', 'transfer', 'refund', 'investment', 'loan_payment'].includes(this.type))
        errors.push('Invalid transaction type');
      if (!this.category_id) errors.push('Category is required');
      if (!this.account_id) errors.push('Account is required');
      return errors;
    }
  }

  /* ---- Loan ---- */
  class Loan extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.institution = data.institution || '';
      this.original_amount = data.original_amount || 0;
      this.current_balance = data.current_balance || 0;
      this.emi = data.emi || 0;
      this.interest_rate = data.interest_rate || null;
      this.tenure_months = data.tenure_months || 0;
      this.remaining_payments = data.remaining_payments || 0;
      this.start_date = data.start_date || '';
      this.end_date = data.end_date || '';
      this.status = data.status || 'active';
      this.account_number = data.account_number || '';
      this.collateral = data.collateral || null;
      this.notes = data.notes || '';
    }

    get progress() {
      if (!this.original_amount || this.original_amount <= 0) return 0;
      return Math.round(((this.original_amount - this.current_balance) / this.original_amount) * 100);
    }

    get isOverdue() {
      if (this.status !== 'active') return false;
      return new Date() > new Date(this.end_date);
    }
  }

  /* ---- Financial Goal ---- */
  class FinancialGoal extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.title = data.title || '';
      this.description = data.description || '';
      this.category = data.category || 'savings';
      this.target_amount = data.target_amount || 0;
      this.current_amount = data.current_amount || 0;
      this.currency = data.currency || 'INR';
      this.deadline = data.deadline || '';
      this.status = data.status || 'active';
      this.priority = data.priority || 'medium';
    }

    get progress() {
      if (!this.target_amount || this.target_amount <= 0) return 0;
      return Math.min(100, Math.round((this.current_amount / this.target_amount) * 100));
    }

    get isOnTrack() {
      if (!this.deadline) return true;
      const totalDays = (new Date(this.deadline) - new Date()) / (1000 * 60 * 60 * 24);
      if (totalDays <= 0) return this.current_amount >= this.target_amount;
      const elapsed = (new Date() - new Date(this.created_at)) / (1000 * 60 * 60 * 24);
      const rate = elapsed > 0 ? (this.current_amount / elapsed) * totalDays : 0;
      return rate >= this.target_amount * 0.8;
    }
  }

  /* ---- Budget ---- */
  class Budget extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.month = data.month || '';
      this.category_id = data.category_id || '';
      this.allocated = data.allocated || 0;
      this.spent = data.spent || 0;
      this.remaining = data.remaining || 0;
    }

    get utilization() {
      if (!this.allocated || this.allocated <= 0) return 0;
      return Math.round((this.spent / this.allocated) * 100);
    }

    get status() {
      const u = this.utilization;
      if (u <= 70) return 'ok';
      if (u <= 90) return 'warning';
      return 'over';
    }
  }

  /* ---- Social Account ---- */
  class SocialAccount extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.platform = data.platform || '';
      this.username = data.username || '';
      this.profile_url = data.profile_url || '';
      this.display_name = data.display_name || '';
      this.followers = data.followers || 0;
      this.following = data.following || 0;
      this.posts = data.posts || 0;
      this.subscribers = data.subscribers || 0;
      this.last_updated = data.last_updated || '';
      this.update_method = data.update_method || 'manual';
    }
  }

  /* ---- Health Metric ---- */
  class HealthMetric extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.date = data.date || new Date().toISOString().slice(0, 10);
      this.type = data.type || '';
      this.value = data.value || 0;
      this.unit = data.unit || '';
      this.notes = data.notes || '';
      this.source = data.source || 'manual';
    }

    validates() {
      const errors = [];
      if (!this.date) errors.push('Date is required');
      if (!this.type) errors.push('Type is required');
      if (this.value === null || this.value === undefined || this.value === '') errors.push('Value is required');
      return errors;
    }
  }

  /* ---- Habit ---- */
  class Habit extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.description = data.description || '';
      this.frequency = data.frequency || 'daily';
      this.target_days_per_week = data.target_days_per_week || 7;
      this.current_streak = data.current_streak || 0;
      this.best_streak = data.best_streak || 0;
      this.status = data.status || 'active';
    }
  }

  /* ---- Goal ---- */
  class Goal extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.title = data.title || '';
      this.description = data.description || '';
      this.category = data.category || 'personal';
      this.target = data.target || '';
      this.current_value = data.current_value || '';
      this.unit = data.unit || '';
      this.deadline = data.deadline || '';
      this.status = data.status || 'active';
      this.priority = data.priority || 'medium';
    }
  }

  /* ---- Task ---- */
  class Task extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.title = data.title || '';
      this.description = data.description || '';
      this.status = data.status || 'pending';
      this.priority = data.priority || 'medium';
      this.due_date = data.due_date || '';
      this.completed_date = data.completed_date || null;
      this.project_id = data.project_id || null;
      this.goal_id = data.goal_id || null;
      this.tags = data.tags || [];
    }

    get isOverdue() {
      if (this.status === 'completed' || !this.due_date) return false;
      return new Date(this.due_date) < new Date();
    }

    get priorityOrder() {
      return { critical: 0, high: 1, medium: 2, low: 3 }[this.priority] ?? 3;
    }
  }

  /* ---- Trip ---- */
  class Trip extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.name = data.name || '';
      this.description = data.description || '';
      this.start_date = data.start_date || '';
      this.end_date = data.end_date || '';
      this.locations = data.locations || [];
      this.route = data.route || '';
      this.distance_km = data.distance_km || 0;
      this.duration_days = data.duration_days || 0;
      this.transport = data.transport || '';
      this.accommodation = data.accommodation || '';
      this.total_cost = data.total_cost || 0;
      this.status = data.status || 'planned';
      this.photos = data.photos || [];
      this.videos = data.videos || [];
      this.notes = data.notes || '';
    }

    get daysRemaining() {
      if (this.status === 'completed') return 0;
      return Math.max(0, Math.ceil((new Date(this.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
    }
  }

  /* ---- Trip Expense ---- */
  class TripExpense extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.trip_id = data.trip_id || '';
      this.date = data.date || '';
      this.amount = data.amount || 0;
      this.category = data.category || '';
      this.description = data.description || '';
      this.payment_method = data.payment_method || '';
    }
  }

  /* ---- Memory ---- */
  class Memory extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.title = data.title || '';
      this.date = data.date || '';
      this.location = data.location || '';
      this.content = data.content || '';
      this.photos = data.photos || [];
      this.tags = data.tags || [];
      this.privacy = data.privacy || 'private';
    }
  }

  /* ---- Journal Entry ---- */
  class JournalEntry extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.date = data.date || new Date().toISOString().slice(0, 10);
      this.title = data.title || '';
      this.content = data.content || '';
      this.mood = data.mood || '';
      this.tags = data.tags || [];
      this.privacy = data.privacy || 'private';
    }
  }

  /* ---- Document ---- */
  class Document extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.title = data.title || '';
      this.type = data.type || '';
      this.description = data.description || '';
      this.file_url = data.file_url || '';
      this.category = data.category || '';
      this.tags = data.tags || [];
      this.privacy = data.privacy || 'private';
    }
  }

  /* ---- Activity Log ---- */
  class ActivityLog extends BaseEntity {
    constructor(data = {}) {
      super(data);
      this.timestamp = data.timestamp || new Date().toISOString();
      this.action = data.action || '';
      this.entity_type = data.entity_type || '';
      this.entity_id = data.entity_id || '';
      this.entity_name = data.entity_name || '';
      this.change_summary = data.change_summary || '';
      this.old_value = data.old_value || null;
      this.new_value = data.new_value || null;
      this.performed_by = data.performed_by || 'Prem';
      this.ip_address = data.ip_address || null;
      this.metadata = data.metadata || {};
    }
  }

  /* ---- Export ---- */
  return {
    BaseEntity, Profile, Employment, Skill, Project,
    FinanceAccount, FinanceCategory, Transaction, Loan,
    FinancialGoal, Budget, SocialAccount, HealthMetric,
    Habit, Goal, Task, Trip, TripExpense, Memory,
    JournalEntry, Document, ActivityLog
  };
})();

if (typeof window !== 'undefined') window.Models = Models;

export default Models;
export { Models };
