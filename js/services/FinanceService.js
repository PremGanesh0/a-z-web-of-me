/**
 * services/FinanceService.js
 * Finance domain: transactions, budgets, accounts, loans, goals
 */
import { Database } from '../core/Database.js';
import { Models } from '../core/Models.js';

export class FinanceService {
  // ── Transactions ─────────────────────────────────────────────
  getAllTransactions() {
    return Database.getEntitiesByType('finance_transactions');
  }

  getTransactionsByMonth(month) {
    const prefix = month + '-';
    return this.getAllTransactions().filter(t => t.date.startsWith(prefix));
  }

  getTransactionsByAccount(accountId) {
    return this.getAllTransactions().filter(t => t.account_id === accountId);
  }

  getTransactionsByCategory(categoryId) {
    return this.getAllTransactions().filter(t => t.category_id === categoryId);
  }

  getTransactionsByType(type) {
    return this.getAllTransactions().filter(t => t.type === type);
  }

  addTransaction(data) {
    const tx = new Models.Transaction(data);
    const errors = tx.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const saved = Database.addEntity('finance_transactions', tx.toJSON());
    this._recalculateAccount(saved.account_id);
    this._updateCategoryBudget(saved);
    return saved;
  }

  updateTransaction(id, data) {
    const existing = Database.getEntity('finance_transactions', id);
    if (!existing) return null;
    const oldCategory = existing.category_id;
    const oldAccount = existing.account_id;
    const updated = Database.updateEntity('finance_transactions', id, data);
    if (updated) {
      this._recalculateAccount(oldAccount);
      this._recalculateAccount(updated.account_id);
      if (oldCategory !== updated.category_id) {
        this._updateCategoryBudget(updated, oldCategory);
        this._updateCategoryBudget(updated);
      }
    }
    return updated;
  }

  deleteTransaction(id) {
    const existing = Database.getEntity('finance_transactions', id);
    if (!existing) return false;
    Database.deleteEntity('finance_transactions', id);
    this._recalculateAccount(existing.account_id);
    this._updateCategoryBudget(existing, existing.category_id);
    return true;
  }

  _recalculateAccount(accountId) {
    const txns = this.getTransactionsByAccount(accountId);
    let balance = 0;
    for (const tx of txns) {
      if (tx.type === 'income') balance += tx.amount;
      else if (tx.type === 'expense') balance -= tx.amount;
      else if (tx.type === 'transfer') { /* ignore for now */ }
    }
    Database.updateEntity('finance_accounts', accountId, { current_balance: balance });
  }

  _updateCategoryBudget(tx, oldCategoryId = null) {
    const month = tx.date.substring(0, 7);
    const spent = this.getMonthCategoryTotal(month, tx.category_id);
    const budget = Database.getEntity('finance_budgets', tx.category_id + '_' + month);
    if (budget) {
      Database.updateEntity('finance_budgets', budget.id, {
        spent,
        remaining: Math.max(0, budget.amount - spent)
      });
    }
    if (oldCategoryId) {
      const oldSpent = this.getMonthCategoryTotal(month, oldCategoryId);
      const oldBudget = Database.getEntity('finance_budgets', oldCategoryId + '_' + month);
      if (oldBudget) {
        Database.updateEntity('finance_budgets', oldBudget.id, {
          spent: oldSpent,
          remaining: Math.max(0, oldBudget.amount - oldSpent)
        });
      }
    }
  }

  getMonthCategoryTotal(month, categoryId) {
    return this.getTransactionsByMonth(month)
      .filter(t => t.type === 'expense' && t.category_id === categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // ── Budgets ──────────────────────────────────────────────────
  getAllBudgets() {
    return Database.getEntitiesByType('finance_budgets');
  }

  getBudgetsByMonth(month) {
    return this.getAllBudgets().filter(b => b.month === month);
  }

  addBudget(data) {
    const budget = new Models.FinanceBudget(data);
    const errors = budget.validate();
    if (errors.length) throw new Error(errors.join('; '));
    // Check for duplicate
    const existing = this.getBudgetsByMonth(data.month).find(
      b => b.category_id === data.category_id
    );
    if (existing) throw new Error('Budget already exists for this category and month');
    return Database.addEntity('finance_budgets', budget.toJSON());
  }

  updateBudget(id, data) {
    return Database.updateEntity('finance_budgets', id, data);
  }

  deleteBudget(id) {
    return Database.deleteEntity('finance_budgets', id);
  }

  // ── Accounts ─────────────────────────────────────────────────
  getAllAccounts() {
    return Database.getEntitiesByType('finance_accounts');
  }

  getAccountById(id) {
    return Database.getEntity('finance_accounts', id);
  }

  addAccount(data) {
    const account = new Models.FinanceAccount(data);
    const errors = account.validate();
    if (errors.length) throw new Error(errors.join('; '));
    // Check for account_number uniqueness
    const existing = this.getAllAccounts().find(
      a => a.account_number === data.account_number && a.status !== 'closed'
    );
    if (existing) throw new Error('Account number already exists');
    return Database.addEntity('finance_accounts', account.toJSON());
  }

  updateAccount(id, data) {
    const existing = Database.getEntity('finance_accounts', id);
    if (!existing) return null;
    // Don't allow changing account_number if txns exist
    if (data.account_number && data.account_number !== existing.account_number) {
      const hasTxns = this.getTransactionsByAccount(id).length > 0;
      if (hasTxns) {
        throw new Error('Cannot change account number — transactions exist');
      }
    }
    return Database.updateEntity('finance_accounts', id, data);
  }

  closeAccount(id) {
    return Database.updateEntity('finance_accounts', id, { status: 'closed', closed_date: new Date().toISOString().split('T')[0] });
  }

  // ── Loans ────────────────────────────────────────────────────
  getAllLoans() {
    return Database.getEntitiesByType('loans');
  }

  getLoanById(id) {
    return Database.getEntity('loans', id);
  }

  addLoan(data) {
    const loan = new Models.Loan(data);
    const errors = loan.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('loans', loan.toJSON());
  }

  updateLoan(id, data) {
    return Database.updateEntity('loans', id, data);
  }

  makeLoanPayment(id, amount, date, by = 'system') {
    const loan = this.getLoanById(id);
    if (!loan) throw new Error('Loan not found');
    if (loan.status !== 'active') throw new Error('Loan is not active');
    if (amount <= 0) throw new Error('Amount must be positive');
    const newBalance = Math.max(0, loan.current_balance - amount);
    const paymentTxn = new Models.Transaction({
      date,
      amount,
      type: 'loan_payment',
      category_id: 'EMI',
      account_id: loan.account_number,
      description: `EMI payment — ${loan.name}`,
      payment_method: 'Bank Transfer',
      notes: `Loan: ${loan.name} (EMI)`
    });
    Database.addEntity('finance_transactions', paymentTxn.toJSON());
    Database.updateEntity('loans', id, {
      current_balance: newBalance,
      updated_at: new Date().toISOString(),
      updated_by: by
    });
    this._recalculateAccount(loan.account_number);
    return newBalance;
  }

  // ── Categories ───────────────────────────────────────────────
  getAllCategories() {
    return Database.getEntitiesByType('finance_categories');
  }

  getCategoryById(id) {
    return Database.getEntity('finance_categories', id);
  }

  addCategory(data) {
    const category = new Models.FinanceCategory(data);
    const errors = category.validate();
    if (errors.length) throw new Error(errors.join('; '));
    const existing = this.getAllCategories().find(
      c => c.name === data.name && c.type === data.type
    );
    if (existing) throw new Error('Category already exists');
    return Database.addEntity('finance_categories', category.toJSON());
  }

  updateCategory(id, data) {
    return Database.updateEntity('finance_categories', id, data);
  }

  deleteCategory(id) {
    // Check if any txns use this category
    const used = this.getTransactionsByCategory(id).length > 0;
    if (used) throw new Error('Category is used by transactions — reassign or delete those first');
    return Database.deleteEntity('finance_categories', id);
  }

  // ── Financial Goals ──────────────────────────────────────────
  getAllGoals() {
    return Database.getEntitiesByType('financial_goals');
  }

  getGoalById(id) {
    return Database.getEntity('financial_goals', id);
  }

  addGoal(data) {
    const goal = new Models.FinancialGoal(data);
    const errors = goal.validate();
    if (errors.length) throw new Error(errors.join('; '));
    return Database.addEntity('financial_goals', goal.toJSON());
  }

  updateGoal(id, data) {
    return Database.updateEntity('financial_goals', id, data);
  }

  contributeToGoal(id, amount) {
    const goal = this.getGoalById(id);
    if (!goal) throw new Error('Goal not found');
    if (amount <= 0) throw new Error('Amount must be positive');
    const newCurrent = goal.current_amount + amount;
    Database.updateEntity('financial_goals', id, {
      current_amount: newCurrent,
      updated_at: new Date().toISOString()
    });
    return newCurrent;
  }

  // ── Computed / Aggregates ────────────────────────────────────
  getMonthlyTotals(yearMonth) {
    const monthTxns = this.getTransactionsByMonth(yearMonth);
    const income = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const transfer = monthTxns.filter(t => t.type === 'transfer').reduce((s, t) => s + t.amount, 0);
    return {
      month: yearMonth,
      income,
      expense,
      transfer,
      netCashFlow: income - expense
    };
  }

  getCategoryExpenseBreakdown(month) {
    const monthTxns = this.getTransactionsByMonth(month).filter(t => t.type === 'expense');
    const byCat = {};
    for (const tx of monthTxns) {
      const catId = tx.category_id || 'uncategorized';
      byCat[catId] = (byCat[catId] || 0) + tx.amount;
    }
    const categories = this.getAllCategories().filter(c => c.type === 'expense');
    return categories.map(c => ({
      category: c,
      spent: byCat[c.id] || 0,
      budget: c.budget_monthly || 0,
      remaining: Math.max(0, (c.budget_monthly || 0) - (byCat[c.id] || 0)),
      utilPct: c.budget_monthly > 0 ? Math.round(((byCat[c.id] || 0) / c.budget_monthly) * 100) : 0
    }));
  }

  getAccountBalances() {
    const accounts = this.getAllAccounts().filter(a => a.status !== 'closed');
    return accounts.map(a => {
      const txns = this.getTransactionsByAccount(a.id);
      let computed = 0;
      for (const tx of txns) {
        if (tx.type === 'income') computed += tx.amount;
        else if (tx.type === 'expense') computed -= tx.amount;
      }
      return {
        ...a,
        computed_balance: computed,
        balance_diff: a.current_balance - computed
      };
    });
  }

  getNetWorth() {
    const assets = this.getAllAccounts()
      .filter(a => ['savings', 'investment', 'cash'].includes(a.type))
      .reduce((sum, a) => sum + a.current_balance, 0);
    const liabilities = this.getAllAccounts()
      .filter(a => ['loan', 'credit_card'].includes(a.type))
      .reduce((sum, a) => sum + a.current_balance, 0);
    return { assets, liabilities, netWorth: assets - liabilities };
  }

  getDASHBOARD() {
    const now = new Date();
    const yearMonth = now.toISOString().split('T')[0].substring(0, 7);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString().split('T')[0].substring(0, 7);
    const current = this.getMonthlyTotals(yearMonth);
    const previous = this.getMonthlyTotals(prevMonth);
    const incomeChange = previous.income > 0
      ? Math.round(((current.income - previous.income) / previous.income) * 100)
      : 0;
    const expenseChange = previous.expense > 0
      ? Math.round(((current.expense - previous.expense) / previous.expense) * 100)
      : 0;
    const categoryBreakdown = this.getCategoryExpenseBreakdown(yearMonth);
    const accountBalances = this.getAccountBalances();
    const nw = this.getNetWorth();
    const goals = this.getAllGoals();
    const totalGoalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
    const totalGoalCurrent = goals.reduce((s, g) => s + g.current_amount, 0);
    return {
      currentMonth: yearMonth,
      income: current.income,
      expense: current.expense,
      netCashFlow: current.netCashFlow,
      incomeChange,
      expenseChange,
      categoryBreakdown,
      accountBalances,
      netWorth: nw.netWorth,
      assets: nw.assets,
      liabilities: nw.liabilities,
      totalDebt: this.getAllLoans().reduce((s, l) => s + l.current_balance, 0),
      creditUtilization: this.getOverallCreditUtilization(),
      goals: {
        total: goals.length,
        totalTarget: totalGoalTarget,
        totalCurrent: totalGoalCurrent,
        progressPct: totalGoalTarget > 0 ? Math.round((totalGoalCurrent / totalGoalTarget) * 100) : 0
      },
      savingsRate: current.income > 0
        ? Math.round((current.income - current.expense) / current.income * 100)
        : 0
    };
  }

  getOverallCreditUtilization() {
    const cards = this.getAllAccounts().filter(a => a.type === 'credit_card' && a.status !== 'closed');
    const totalLimit = cards.reduce((s, c) => s + c.credit_limit, 0);
    const totalBalance = cards.reduce((s, c) => s + c.current_balance, 0);
    return totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  }
}
