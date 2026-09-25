/* ============================================================
   services/Services.js — Business logic layer
   Wraps Database with validation, computed values, and rules.
   ============================================================ */

const Services = (() => {
  const { Models } = window;
  const { Database } = window;

  /* ---- Profile Service ---- */
  const Profile = {
    get() {
      return Database.getEntity('profile', 'profile-001');
    },

    update(data, by = 'Prem') {
      const existing = this.get();
      if (!existing) {
        const p = new Models.Profile(data);
        return Database.addEntity('profile', p.toJSON());
      }
      return Database.updateEntity('profile', 'profile-001', data, by);
    },

    getField(name) {
      const p = this.get();
      return p ? p[name] : null;
    }
  };

  /* ---- Employment Service ---- */
  const Employment = {
    getActive() {
      return Database.query('employments', { status_record: 'active' });
    },

    getAll() {
      return Database.getEntitiesByType('employments');
    },

    getById(id) {
      return Database.getEntity('employments', id);
    },

    add(data) {
      const emp = new Models.Employment(data);
      const errors = emp.validates?.() || [];
      if (errors.length) throw new Error(errors.join(', '));
      return Database.addEntity('employments', emp.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('employments', id, data);
    },

    close(id) {
      return Database.updateEntity('employments', id, { status_record: 'closed', end_date: new Date().toISOString().slice(0, 10) });
    }
  };

  /* ---- Skill Service ---- */
  const Skill = {
    getAll() {
      return Database.getEntitiesByType('skills');
    },

    getTop(n = 5) {
      return [...Database.getEntitiesByType('skills')]
        .sort((a, b) => b.proficiency - a.proficiency)
        .slice(0, n);
    },

    getByCategory(category) {
      return Database.query('skills', { category });
    },

    getById(id) {
      return Database.getEntity('skills', id);
    },

    add(data) {
      const s = new Models.Skill(data);
      return Database.addEntity('skills', s.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('skills', id, data);
    },

    delete(id) {
      return Database.deleteEntity('skills', id);
    }
  };

  /* ---- Project Service ---- */
  const Project = {
    getAll() {
      return Database.getEntitiesByType('projects');
    },

    getByStatus(status) {
      return Database.query('projects', { status });
    },

    getActive() {
      return this.getByStatus('building').concat(this.getByStatus('planning'));
    },

    getById(id) {
      return Database.getEntity('projects', id);
    },

    add(data) {
      const p = new Models.Project(data);
      return Database.addEntity('projects', p.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('projects', id, data);
    },

    setProgress(id, progress) {
      return Database.updateEntity('projects', id, { progress: Math.min(100, Math.max(0, progress)) });
    },

    archive(id) { return Database.archiveEntity('projects', id); },
    restore(id) { return Database.restoreEntity('projects', id); }
  };

  /* ---- Finance Account Service ---- */
  const FinanceAccount = {
    getAll() {
      return Database.getEntitiesByType('finance_accounts');
    },

    getByStatus(status) {
      return Database.query('finance_accounts', { status });
    },

    getActive() {
      return Database.query('finance_accounts', { status: 'active' });
    },

    getById(id) {
      return Database.getEntity('finance_accounts', id);
    },

    add(data) {
      const a = new Models.FinanceAccount(data);
      return Database.addEntity('finance_accounts', a.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('finance_accounts', id, data);
    },

    getBalances() {
      const accounts = this.getAll();
      return accounts.reduce((acc, a) => {
        acc[a.id] = a.current_balance;
        return acc;
      }, {});
    },

    getCreditCards() {
      return this.getActive().filter(a => a.type === 'credit_card');
    },

    getLoans() {
      return this.getActive().filter(a => a.type === 'loan');
    },

    getTotalCreditLimit() {
      return this.getCreditCards().reduce((s, c) => s + (c.credit_limit || 0), 0);
    },

    getTotalCreditBalance() {
      return this.getCreditCards().reduce((s, c) => s + c.current_balance, 0);
    },

    getOverallUtilization() {
      const limit = this.getTotalCreditLimit();
      if (!limit) return 0;
      return Math.round((this.getTotalCreditBalance() / limit) * 100);
    }
  };

  /* ---- Category Service ---- */
  const Category = {
    getAll() {
      return Database.getEntitiesByType('finance_categories');
    },

    getByType(type) {
      return Database.query('finance_categories', { type });
    },

    getExpenseCategories() {
      return this.getByType('expense');
    },

    getIncomeCategories() {
      return this.getByType('income');
    },

    getById(id) {
      return Database.getEntity('finance_categories', id);
    },

    add(data) {
      const c = new Models.FinanceCategory(data);
      return Database.addEntity('finance_categories', c.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('finance_categories', id, data);
    }
  };

  /* ---- Transaction Service ---- */
  const Transaction = {
    getAll() {
      return Database.getEntitiesByType('finance_transactions');
    },

    getByMonth(yearMonth) {
      return Database.getTransactionsForMonth(yearMonth);
    },

    getForAccount(accountId) {
      return Database.getEntitiesByType('finance_transactions').filter(t => t.account_id === accountId);
    },

    getById(id) {
      return Database.getEntity('finance_transactions', id);
    },

    add(data) {
      const t = new Models.Transaction(data);
      const errors = t.validates();
      if (errors.length) throw new Error('Validation: ' + errors.join(', '));
      // Update account balance
      const account = Database.getEntity('finance_accounts', data.account_id);
      if (account && account.type === 'credit_card') {
        const newBalance = account.current_balance + (data.type === 'expense' ? data.amount : -data.amount);
        Database.updateEntity('finance_accounts', data.account_id, { current_balance: Math.max(0, newBalance) });
      }
      const result = Database.addEntity('finance_transactions', t.toJSON());
      // Update budget spent
      this._updateBudget(t.date.slice(0, 7), data.category_id, data.type === 'expense' ? data.amount : 0);
      return result;
    },

    update(id, data) {
      const existing = this.getById(id);
      if (!existing) return null;
      const oldAmount = existing.amount;
      const oldType = existing.type;
      const oldCategory = existing.category_id;
      const oldAccount = existing.account_id;
      const result = Database.updateEntity('finance_transactions', id, data);
      if (!result) return null;
      // Recalculate account balance
      this._recalculateAccount(oldAccount);
      // Update budget if category changed
      if (oldCategory !== (data.category_id || existing.category_id)) {
        this._rebuildBudgets(oldCategory, data.date?.slice(0, 7));
        if (data.category_id) this._rebuildBudgets(data.category_id, data.date?.slice(0, 7));
      }
      return result;
    },

    delete(id) {
      const existing = this.getById(id);
      if (!existing) return false;
      Database.deleteEntity('finance_transactions', id);
      this._recalculateAccount(existing.account_id);
      this._rebuildBudgets(existing.category_id, existing.date?.slice(0, 7));
      return true;
    },

    /* ---- Private: helpers ---- */
    _recalculateAccount(accountId) {
      const balance = Database.getAccountBalance(accountId);
      Database.updateEntity('finance_accounts', accountId, { current_balance: balance });
    },

    _updateBudget(yearMonth, categoryId, expenseAmount) {
      const existing = Database.getEntitiesByType('budgets').find(b => b.month === yearMonth && b.category_id === categoryId);
      if (!existing) return;
      const newSpent = existing.spent + expenseAmount;
      Database.updateEntity('budgets', existing.id, {
        spent: newSpent,
        remaining: Math.max(0, existing.allocated - newSpent),
        utilization: Math.round((newSpent / existing.allocated) * 100)
      });
    },

    _rebuildBudgets(categoryId, yearMonth) {
      if (!categoryId || !yearMonth) return;
      const cat = Database.getEntity('finance_categories', categoryId);
      if (!cat || cat.type !== 'expense') return;
      const spent = Database.getCategorySpending(yearMonth, categoryId);
      const budget = Database.getEntitiesByType('budgets').find(b => b.month === yearMonth && b.category_id === categoryId);
      if (budget) {
        Database.updateEntity('budgets', budget.id, {
          spent, remaining: Math.max(0, budget.allocated - spent),
          utilization: budget.allocated > 0 ? Math.round((spent / budget.allocated) * 100) : 0
        });
      }
    },

    /* ---- Computed values ---- */
    getMonthlySummary(yearMonth) {
      const income = this.getMonthlyIncome(yearMonth);
      const expenses = this.getMonthlyExpenses(yearMonth);
      const transactions = this.getTransactionsForMonth(yearMonth);
      return {
        yearMonth,
        income,
        expenses,
        netFlow: income - expenses,
        transactions: transactions.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)),
        transactionCount: transactions.length,
        incomeCount: transactions.filter(t => t.type === 'income').length,
        expenseCount: transactions.filter(t => t.type === 'expense').length
      };
    },

    getMonthlyIncome(yearMonth) {
      return Database.getMonthlyIncome(yearMonth);
    },

    getMonthlyExpenses(yearMonth) {
      return Database.getMonthlyExpenses(yearMonth);
    },

    getCategoryBreakdown(yearMonth) {
      const expenses = this.getTransactionsForMonth(yearMonth).filter(t => t.type === 'expense');
      const byCat = {};
      expenses.forEach(t => {
        const catId = t.category_id || 'unknown';
        byCat[catId] = (byCat[catId] || 0) + (parseFloat(t.amount) || 0);
      });
      const catList = Database.getEntitiesByType('finance_categories').filter(c => c.type === 'expense');
      return catList.map(c => ({
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        budget: c.budget_monthly || 0,
        spent: byCat[c.id] || 0,
        remaining: Math.max(0, (c.budget_monthly || 0) - (byCat[c.id] || 0)),
        utilization: c.budget_monthly > 0 ? Math.round(((byCat[c.id] || 0) / c.budget_monthly) * 100) : 0
      })).sort((a, b) => b.spent - a.spent);
    },

    getAccountBalances() {
      return Database.getEntitiesByType('finance_accounts').map(a => ({
        id: a.id, name: a.name, type: a.type, institution: a.institution,
        account_number: a.account_number, balance: a.current_balance,
        credit_limit: a.credit_limit, utilization: a.utilization,
        utilizationLevel: a.utilizationLevel, hasDPD: a.hasDPD, worstDPD: a.worstDPD,
        status: a.status, opened_date: a.opened_date, closed_date: a.closed_date, notes: a.notes,
        dpd: a.dpd || []
      })).sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        return b.balance - a.balance;
      });
    },

    getRecentTransactions(limit = 10) {
      return [...this.getAll()]
        .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    }
  };

  /* ---- Loan Service ---- */
  const Loan = {
    getAll() {
      return Database.getEntitiesByType('loans');
    },

    getActive() {
      return Database.query('loans', { status: 'active' });
    },

    getById(id) {
      return Database.getEntity('loans', id);
    },

    add(data) {
      const l = new Models.Loan(data);
      return Database.addEntity('loans', l.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('loans', id, data);
    },

    makePayment(id, amount, by = 'Prem') {
      const loan = this.getById(id);
      if (!loan || loan.status !== 'active') return null;
      const newBalance = Math.max(0, loan.current_balance - amount);
      const result = Database.updateEntity('loans', id, {
        current_balance: newBalance,
        remaining_payments: Math.max(0, loan.remaining_payments - 1),
        notes: (loan.notes || '') + `\n[${new Date().toISOString().slice(0, 10)}] Payment of ₹${amount.toLocaleString('en-IN')} — new balance ₹${newBalance.toLocaleString('en-IN')}`
      }, by);
      // Log activity
      Database.logActivity('payment', 'loans', id, loan.name,
        `Paid ₹${amount.toLocaleString('en-IN')} — balance ₹${loan.current_balance.toLocaleString('en-IN')} → ₹${newBalance.toLocaleString('en-IN')}`,
        `₹${loan.current_balance.toLocaleString('en-IN')}`, `₹${newBalance.toLocaleString('en-IN')}`, by);
      return result;
    },

    getTotalDebt() {
      return this.getAll().reduce((s, l) => s + l.current_balance, 0);
    }
  };

  /* ---- Financial Goal Service ---- */
  const FinancialGoal = {
    getAll() {
      return Database.getEntitiesByType('financial_goals');
    },

    getByCategory(category) {
      return Database.query('financial_goals', { category });
    },

    getById(id) {
      return Database.getEntity('financial_goals', id);
    },

    add(data) {
      const g = new Models.FinancialGoal(data);
      return Database.addEntity('financial_goals', g.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('financial_goals', id, data);
    },

    progress(id) {
      const g = this.getById(id);
      return g ? g.progress : 0;
    },

    contribute(id, amount, by = 'Prem') {
      const g = this.getById(id);
      if (!g) return null;
      const newAmount = g.current_amount + amount;
      return Database.updateEntity('financial_goals', id, { current_amount: newAmount }, by);
    }
  };

  /* ---- Budget Service ---- */
  const Budget = {
    getAll() {
      return Database.getEntitiesByType('budgets');
    },

    getByMonth(yearMonth) {
      return Database.getEntitiesByType('budgets').filter(b => b.month === yearMonth);
    },

    getById(id) {
      return Database.getEntity('budgets', id);
    },

    add(data) {
      const b = new Models.Budget(data);
      return Database.addEntity('budgets', b.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('budgets', id, data);
    },

    delete(id) {
      return Database.deleteEntity('budgets', id);
    },

    getMonthlySummary(yearMonth) {
      const budgets = this.getByMonth(yearMonth);
      const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
      const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
      const totalRemaining = budgets.reduce((s, b) => s + b.remaining, 0);
      return {
        month: yearMonth,
        budgets,
        totalAllocated,
        totalSpent,
        totalRemaining,
        overallUtilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
        overBudgetCount: budgets.filter(b => b.status === 'over').length,
        warningCount: budgets.filter(b => b.status === 'warning').length
      };
    }
  };

  /* ---- Social Account Service ---- */
  const Social = {
    getAll() {
      return Database.getEntitiesByType('social_accounts');
    },

    getByPlatform(platform) {
      return Database.query('social_accounts', { platform });
    },

    getById(id) {
      return Database.getEntity('social_accounts', id);
    },

    add(data) {
      const s = new Models.SocialAccount(data);
      return Database.addEntity('social_accounts', s.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('social_accounts', id, data);
    },

    updateMetric(id, field, value, by = 'Prem') {
      return Database.updateEntity('social_accounts', id, { [field]: value, last_updated: new Date().toISOString() }, by);
    },

    getTotalFollowers() {
      return this.getAll().reduce((s, a) => s + (a.platform === 'youtube' ? (a.subscribers || 0) : (a.followers || 0)), 0);
    },

    getPlatformSummary() {
      return this.getAll().map(a => {
        const isYT = a.platform === 'youtube';
        return {
          id: a.id, platform: a.platform, display_name: a.display_name,
          username: a.username, profile_url: a.profile_url,
          followers: isYT ? (a.subscribers || 0) : (a.followers || 0),
          following: isYT ? 0 : (a.following || 0),
          posts: a.posts || 0,
          subscribers: isYT ? (a.subscribers || 0) : 0,
          update_method: a.update_method,
          last_updated: a.last_updated,
          status: a.status
        };
      });
    }
  };

  /* ---- Health Metric Service ---- */
  const Health = {
    getAll() {
      return Database.getEntitiesByType('health_metrics');
    },

    getByType(type) {
      return Database.query('health_metrics', { type });
    },

    getLatest(type) {
      const metrics = this.getByType(type);
      if (!metrics.length) return null;
      return metrics.sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))[0];
    },

    getById(id) {
      return Database.getEntity('health_metrics', id);
    },

    add(data) {
      const m = new Models.HealthMetric(data);
      const errors = m.validates();
      if (errors.length) throw new Error('Validation: ' + errors.join(', '));
      return Database.addEntity('health_metrics', m.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('health_metrics', id, data);
    },

    delete(id) {
      return Database.deleteEntity('health_metrics', id);
    },

    getTrend(type, days = 30) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const metrics = this.getByType(type).filter(m => new Date(m.date) >= cutoff);
      return metrics.sort((a, b) => a.date.localeCompare(b.date)).map(m => ({
        date: m.date, value: m.value, unit: m.unit, notes: m.notes
      }));
    },

    getAverages(type, days = 30) {
      const trend = this.getTrend(type, days);
      if (!trend.length) return null;
      const sum = trend.reduce((s, m) => s + (parseFloat(m.value) || 0), 0);
      return { average: sum / trend.length, count: trend.length, unit: trend[0]?.unit || '' };
    },

    /* ---- Computed health dashboard ---- */
    getDashboard() {
      const weight = this.getLatest('weight');
      const bmi = this.getLatest('bmi');
      const bodyFat = this.getLatest('body_fat');
      const bp = this.getLatest('blood_pressure');
      const bs = this.getLatest('blood_sugar');
      const chol = this.getLatest('cholesterol');
      const rhr = this.getLatest('resting_heart_rate');
      return {
        weight: weight ? { value: weight.value, unit: weight.unit, date: weight.date, notes: weight.notes } : null,
        bmi: bmi ? { value: bmi.value, unit: bmi.unit, date: bmi.date } : null,
        bodyFat: bodyFat ? { value: bodyFat.value, unit: bodyFat.unit, date: bodyFat.date } : null,
        bloodPressure: bp ? { value: bp.value, unit: bp.unit, date: bp.date, notes: bp.notes } : null,
        bloodSugar: bs ? { value: bs.value, unit: bs.unit, date: bs.date, notes: bs.notes } : null,
        cholesterol: chol ? { value: chol.value, unit: chol.unit, date: chol.date, notes: chol.notes } : null,
        restingHeartRate: rhr ? { value: rhr.value, unit: rhr.unit, date: rhr.date, notes: rhr.notes } : null
      };
    }
  };

  /* ---- Habit Service ---- */
  const Habit = {
    getAll() {
      return Database.getEntitiesByType('habits');
    },

    getActive() {
      return Database.query('habits', { status: 'active' });
    },

    getById(id) {
      return Database.getEntity('habits', id);
    },

    add(data) {
      const h = new Models.Habit(data);
      return Database.addEntity('habits', h.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('habits', id, data);
    },

    toggleToday(id) {
      const h = this.getById(id);
      if (!h) return null;
      const today = new Date().toISOString().slice(0, 10);
      const lastUpdate = h.updated_at?.slice(0, 10);
      let newStreak = h.current_streak;
      if (lastUpdate !== today) {
        newStreak = h.current_streak + 1;
        if (newStreak > h.best_streak) {
          Database.updateEntity('habits', id, { best_streak: newStreak });
        }
      }
      return Database.updateEntity('habits', id, { current_streak: newStreak, updated_at: new Date().toISOString() });
    },

    resetStreak(id) {
      return Database.updateEntity('habits', id, { current_streak: 0 });
    }
  };

  /* ---- Goal Service (generic goals) ---- */
  const Goal = {
    getAll() {
      return Database.getEntitiesByType('goals');
    },

    getByCategory(category) {
      return Database.query('goals', { category });
    },

    getActive() {
      return Database.query('goals', { status: 'active' });
    },

    getById(id) {
      return Database.getEntity('goals', id);
    },

    add(data) {
      const g = new Models.Goal(data);
      return Database.addEntity('goals', g.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('goals', id, data);
    },

    complete(id, by = 'Prem') {
      return Database.updateEntity('goals', id, { status: 'completed', updated_by: by }, by);
    },

    getProgress(id) {
      const g = this.getById(id);
      return g ? g.progress : 0;
    },

    getDashboard() {
      const active = this.getActive();
      const completed = Database.query('goals', { status: 'completed' });
      const byCategory = {};
      ['finance', 'career', 'health', 'travel', 'projects', 'personal'].forEach(cat => {
        byCategory[cat] = active.filter(g => g.category === cat);
      });
      return {
        active,
        completed,
        total: active.length,
        completedCount: completed.length,
        byCategory,
        all: active.concat(completed).sort((a, b) => {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
        })
      };
    }
  };

  /* ---- Task Service ---- */
  const Task = {
    getAll() {
      return Database.getEntitiesByType('tasks');
    },

    getByStatus(status) {
      return Database.query('tasks', { status });
    },

    getPending() {
      return Database.query('tasks', { status: 'pending' }).concat(Database.query('tasks', { status: 'in_progress' }));
    },

    getOverdue() {
      return this.getPending().filter(t => t.isOverdue);
    },

    getById(id) {
      return Database.getEntity('tasks', id);
    },

    add(data) {
      const t = new Models.Task(data);
      return Database.addEntity('tasks', t.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('tasks', id, data);
    },

    complete(id, by = 'Prem') {
      return Database.updateEntity('tasks', id, {
        status: 'completed',
        completed_date: new Date().toISOString().slice(0, 10),
        updated_by: by
      }, by);
    },

    delete(id) {
      return Database.deleteEntity('tasks', id);
    },

    getDashboard() {
      const pending = this.getPending();
      const overdue = this.getOverdue();
      const completed = this.getByStatus('completed');
      const todayDate = new Date().toISOString().slice(0, 10);
      const dueToday = pending.filter(t => t.due_date === todayDate);
      const dueThisWeek = pending.filter(t => {
        const due = new Date(t.due_date);
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 7);
        return due >= now && due <= weekEnd;
      });
      return {
        pending: pending.sort((a, b) => a.priorityOrder - b.priorityOrder),
        overdue: overdue.sort((a, b) => a.priorityOrder - b.priorityOrder),
        completed: completed.sort((a, b) => b.completed_date.localeCompare(a.completed_date)),
        todayCount: dueToday.length,
        weekCount: dueThisWeek.length,
        overdueCount: overdue.length,
        totalActive: pending.length
      };
    }
  };

  /* ---- Trip Service ---- */
  const Trip = {
    getAll() {
      return Database.getEntitiesByType('trip');
    },

    getByStatus(status) {
      return Database.query('trip', { status });
    },

    getActive() {
      return this.getByStatus('planned').concat(this.getByStatus('ongoing'));
    },

    getCompleted() {
      return this.getByStatus('completed');
    },

    getById(id) {
      return Database.getEntity('trip', id);
    },

    add(data) {
      const t = new Models.Trip(data);
      return Database.addEntity('trip', t.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('trip', id, data);
    },

    delete(id) {
      return Database.deleteEntity('trip', id);
    },

    startTrip(id) {
      return Database.updateEntity('trip', id, { status: 'ongoing' });
    },

    completeTrip(id) {
      return Database.updateEntity('trip', id, { status: 'completed' });
    },

    getExpensesForTrip(tripId) {
      return Database.getEntitiesByType('trip_expenses').filter(e => e.trip_id === tripId);
    },

    addExpense(data) {
      const e = new Models.TripExpense(data);
      const result = Database.addEntity('trip_expenses', e.toJSON());
      // Update trip total cost
      const trip = this.getById(data.trip_id);
      if (trip) {
        const expenses = this.getExpensesForTrip(data.trip_id);
        const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
        Database.updateEntity('trip', data.trip_id, { total_cost: total });
      }
      return result;
    },

    getDashboard() {
      const active = this.getActive();
      const completed = this.getCompleted();
      const totalSpent = completed.reduce((s, t) => s + (t.total_cost || 0), 0);
      const totalDistance = completed.reduce((s, t) => s + (t.distance_km || 0), 0);
      return {
        active,
        completed,
        totalTrips: active.length + completed.length,
        totalSpent,
        totalDistance,
        upcoming: active.filter(t => t.status === 'planned').sort((a, b) => a.start_date.localeCompare(b.start_date))
      };
    }
  };

  /* ---- Memory Service ---- */
  const Memory = {
    getAll() {
      return Database.getEntitiesByType('memories');
    },

    getByPrivacy(privacy) {
      return Database.query('memories', { privacy });
    },

    getPublic() {
      return Database.query('memories', { privacy: 'public' });
    },

    getPrivate() {
      return Database.query('memories', { privacy: 'private' });
    },

    getById(id) {
      return Database.getEntity('memories', id);
    },

    add(data) {
      const m = new Models.Memory(data);
      return Database.addEntity('memories', m.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('memories', id, data);
    },

    delete(id) {
      return Database.deleteEntity('memories', id);
    },

    togglePrivacy(id) {
      const m = this.getById(id);
      if (!m) return null;
      return Database.updateEntity('memories', id, { privacy: m.privacy === 'public' ? 'private' : 'public' });
    },

    getByTag(tag) {
      return this.getAll().filter(m => m.tags.includes(tag));
    }
  };

  /* ---- Journal Service ---- */
  const Journal = {
    getAll() {
      return Database.getEntitiesByType('journal_entries');
    },

    getByPrivacy(privacy) {
      return Database.query('journal_entries', { privacy });
    },

    getPrivate() {
      return Database.query('journal_entries', { privacy: 'private' });
    },

    getById(id) {
      return Database.getEntity('journal_entries', id);
    },

    add(data) {
      const j = new Models.JournalEntry(data);
      return Database.addEntity('journal_entries', j.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('journal_entries', id, data);
    },

    delete(id) {
      return Database.deleteEntity('journal_entries', id);
    },

    getRecent(limit = 10) {
      return [...this.getPrivate()]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, limit);
    },

    search(query) {
      if (!query) return this.getAll();
      const q = query.toLowerCase();
      return this.getAll().filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.content.toLowerCase().includes(q) ||
        j.tags.some(t => t.toLowerCase().includes(q))
      );
    }
  };

  /* ---- Document Service ---- */
  const Document = {
    getAll() {
      return Database.getEntitiesByType('documents');
    },

    getByPrivacy(privacy) {
      return Database.query('documents', { privacy });
    },

    getPrivate() {
      return Database.query('documents', { privacy: 'private' });
    },

    getById(id) {
      return Database.getEntity('documents', id);
    },

    add(data) {
      const d = new Models.Document(data);
      return Database.addEntity('documents', d.toJSON());
    },

    update(id, data) {
      return Database.updateEntity('documents', id, data);
    },

    delete(id) {
      return Database.deleteEntity('documents', id);
    }
  };

  /* ---- Settings Service ---- */
  const Settings = {
    get() {
      const db = Database.getData();
      return db?.settings || {};
    },

    update(data) {
      const db = Database.getData();
      if (!db) return null;
      db.settings = Object.assign({}, db.settings || {}, data, { updated_at: new Date().toISOString() });
      Database.setData(db);
      return db.settings;
    },

    getTheme() { return this.get().theme || 'dark'; },
    getLanguage() { return this.get().language || 'en-IN'; },
    getCurrency() { return this.get().currency || 'INR'; },
    getDateFormat() { return this.get().dateFormat || 'DD/MM/YYYY'; }
  };

  /* ---- Export all services ---- */
  return {
    Profile, Employment, Skill, Project,
    FinanceAccount, Category, Transaction, Loan,
    FinancialGoal, Budget, Social,
    Health, Habit, Goal, Task, Trip, Memory,
    Journal, Document, Settings
  };
})();

if (typeof window !== 'undefined') window.Services = Services;
