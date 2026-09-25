/* ============================================================
   core/Database.js — localStorage persistence layer
   Singleton object with ESM exports for service compatibility.
   ============================================================ */

const Database = (() => {
  const DB_KEY = 'premos_database';

  function _load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function _save(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    return data;
  }

  /* ---- Initialization ---- */
  async function initialize(seedData) {
    let db = _load();
    if (!db || !db.entities || Object.keys(db.entities).length === 0) {
      const seed = (typeof window !== 'undefined' && window.__PREMONOS_SEED__) ? window.__PREMONOS_SEED__ : seedData;
      db = seed && seed.entities ? seed : { version: '1.0.0', lastSynced: new Date().toISOString(), entities: {} };
      _save(db);
    }
    return db;
  }

  function isInitialized() {
    return !!_load()?.version;
  }

  function getData() { return _load(); }
  function setData(data) { return _save(data); }

  /* ---- Entity operations ---- */
  function getEntity(entityType, id) {
    const db = _load();
    if (!db || !db.entities[entityType]) return null;
    if (id) return db.entities[entityType].find(e => e.id === id) || null;
    return [...db.entities[entityType]];
  }

  function getEntitiesByType(entityType) {
    const db = _load();
    if (!db || !db.entities[entityType]) return [];
    return [...db.entities[entityType]];
  }

  function addEntity(entityType, data) {
    const db = _load() || { version: '1.0.0', lastSynced: new Date().toISOString(), entities: {} };
    if (!db.entities[entityType]) db.entities[entityType] = [];
    const newEntity = typeof data === 'function' ? data() : Object.assign({}, data);
    newEntity.id = newEntity.id || crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    if (!newEntity.created_at) newEntity.created_at = new Date().toISOString();
    if (!newEntity.updated_at) newEntity.updated_at = new Date().toISOString();
    if (!newEntity.created_by) newEntity.created_by = 'Prem';
    if (!newEntity.updated_by) newEntity.updated_by = 'Prem';
    if (!newEntity.status) newEntity.status = 'active';
    db.entities[entityType].push(newEntity);
    _save(db);
    _logActivity('create', entityType, newEntity.id, newEntity.name || newEntity.title || newEntity.role || newEntity.company || newEntity.type || entityType, 'Created record');
    return newEntity;
  }

  function updateEntity(entityType, id, data, by = 'Prem') {
    const db = _load();
    if (!db || !db.entities[entityType]) return null;
    const idx = db.entities[entityType].findIndex(e => e.id === id);
    if (idx === -1) return null;
    const old = db.entities[entityType][idx];
    const update = typeof data === 'function' ? data(old) : Object.assign({}, data);
    update.updated_at = new Date().toISOString();
    update.updated_by = by;
    db.entities[entityType][idx] = Object.assign({}, old, update);
    _save(db);
    const changes = [];
    for (const key of Object.keys(update)) {
      if (key === 'updated_at' || key === 'updated_by') continue;
      if (JSON.stringify(old[key]) !== JSON.stringify(update[key])) {
        changes.push({ field: key, old: old[key], new: update[key] });
      }
    }
    if (changes.length > 0) {
      _logActivity('update', entityType, id,
        old.name || old.title || old.role || old.company || old.type || entityType,
        changes.map(c => `${c.field}: ${JSON.stringify(c.old)} → ${JSON.stringify(c.new)}`).join(', '),
        changes.map(c => c.old), changes.map(c => c.new), by);
    }
    return db.entities[entityType][idx];
  }

  function deleteEntity(entityType, id, by = 'Prem') {
    const db = _load();
    if (!db || !db.entities[entityType]) return false;
    const idx = db.entities[entityType].findIndex(e => e.id === id);
    if (idx === -1) return false;
    const entity = db.entities[entityType][idx];
    db.entities[entityType].splice(idx, 1);
    _save(db);
    _logActivity('delete', entityType, id, entity.name || entity.title || entity.role || entity.company || entity.type || entityType, 'Record deleted', null, null, by);
    return true;
  }

  function archiveEntity(entityType, id, by = 'Prem') {
    return updateEntity(entityType, id, { status: 'archived' }, by);
  }

  function restoreEntity(entityType, id, by = 'Prem') {
    return updateEntity(entityType, id, { status: 'active' }, by);
  }

  /* ---- Query ---- */
  function query(entityType, filter = {}) {
    const entities = getEntitiesByType(entityType);
    if (!filter || Object.keys(filter).length === 0) return entities;
    const keys = Object.keys(filter);
    return entities.filter(e => keys.every(k => {
      if (k === 'status') return e.status === filter.status || filter.status === 'all';
      if (e[k] === undefined) return false;
      if (Array.isArray(filter[k])) return filter[k].includes(e[k]);
      return e[k] === filter[k];
    }));
  }

  function getByStatus(entityType, status) { return query(entityType, { status }); }
  function getActive(entityType) { return query(entityType, { status: 'active' }); }
  function getArchived(entityType) { return query(entityType, { status: 'archived' }); }

  /* ---- Finance helpers ---- */
  function getTransactionsForMonth(yearMonth) {
    return getEntitiesByType('finance_transactions').filter(t => t.date && t.date.startsWith(yearMonth));
  }

  function getMonthlyIncome(yearMonth) {
    return getTransactionsForMonth(yearMonth).filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }

  function getMonthlyExpenses(yearMonth) {
    return getTransactionsForMonth(yearMonth).filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }

  function getAccountBalance(accountId) {
    const txns = getEntitiesByType('finance_transactions').filter(t => t.account_id === accountId);
    const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
    return income - expense;
  }

  function getCategorySpending(yearMonth, categoryId) {
    return getTransactionsForMonth(yearMonth)
      .filter(t => t.type === 'expense' && t.category_id === categoryId)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  }

  /* ---- Activity Log ---- */
  function _logActivity(action, entityType, entityId, entityName, summary, oldVal = null, newVal = null, performedBy = 'Prem') {
    const db = _load() || { version: '1.0.0', lastSynced: new Date().toISOString(), entities: {} };
    if (!db.entities.activity_logs) db.entities.activity_logs = [];
    const entry = {
      id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      timestamp: new Date().toISOString(),
      action, entity_type: entityType, entity_id: entityId,
      entity_name: entityName, change_summary: summary,
      old_value: oldVal, new_value: newVal,
      performed_by: performedBy, ip_address: null, metadata: {},
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      created_by: performedBy, updated_by: performedBy, status: 'active'
    };
    db.entities.activity_logs.unshift(entry);
    if (db.entities.activity_logs.length > 500) {
      db.entities.activity_logs = db.entities.activity_logs.slice(0, 500);
    }
    _save(db);
    return entry;
  }

  function logActivity(action, entityType, entityId, entityName, summary, oldVal, newVal, performedBy) {
    return _logActivity(action, entityType, entityId, entityName, summary, oldVal, newVal, performedBy);
  }

  function getActivityLogs(limit = 50, since = null) {
    const db = _load();
    if (!db || !db.entities.activity_logs) return [];
    let logs = [...db.entities.activity_logs];
    if (since) logs = logs.filter(l => new Date(l.timestamp) > new Date(since));
    return logs.slice(0, limit);
  }

  function getTodayActivity() {
    const today = new Date().toISOString().slice(0, 10);
    return getActivityLogs(50).filter(l => l.timestamp.startsWith(today));
  }

  /* ---- Export / Import ---- */
  function exportData() {
    return JSON.stringify(_load(), null, 2);
  }

  function importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.entities || typeof data.entities !== 'object') return { success: false, error: 'Invalid format' };
      _save(data);
      return { success: true, entityCount: Object.keys(data.entities).length };
    } catch (e) {
      return { success: false, error: 'Invalid JSON: ' + e.message };
    }
  }

  function reset(seedData) {
    localStorage.removeItem(DB_KEY);
    return initialize(seedData);
  }

  /* ---- Public API ---- */
  return {
    initialize, isInitialized, getData, setData,
    getEntity, getEntitiesByType, addEntity, updateEntity,
    deleteEntity, archiveEntity, restoreEntity,
    query, getByStatus, getActive, getArchived,
    getTransactionsForMonth, getMonthlyIncome, getMonthlyExpenses,
    getAccountBalance, getCategorySpending,
    logActivity, getActivityLogs, getTodayActivity,
    exportData, importData, reset
  };
})();

if (typeof window !== 'undefined') window.Database = Database;

export default Database;
export { Database };
