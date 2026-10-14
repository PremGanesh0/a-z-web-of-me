import { randomUUID } from "node:crypto";
import { SCHEMA, COLLECTIONS, validate, clean, isDate } from "./schema.js";

const ACTOR = "AI";
export const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

export class ValidationError extends Error {
  constructor(errs) {
    super("Invalid input: " + Object.entries(errs).map(([k, v]) => `${k} ${v}`).join("; "));
    this.errs = errs;
  }
}

// Business logic for AI writes. `db` is a Firestore instance (firebase-admin) or a compatible fake.
// Every write: validated, marked source "ai" + needs_review, and recorded in the activity log.
export class PremosRepo {
  constructor(db) { this.db = db; }

  assertCollection(col) {
    if (!COLLECTIONS.includes(col)) throw new ValidationError({ collection: `must be one of: ${COLLECTIONS.join(", ")}` });
  }

  // Writes the record and its activity entry in one batch: both land or neither does.
  async write(col, id, doc, merge, action, summary, diff) {
    const ev = { id: randomUUID(), at: new Date().toISOString(), actor: ACTOR, action, collection: col, record_id: id, summary };
    if (diff && Object.keys(diff).length) ev.diff = diff;
    const batch = this.db.batch();
    batch.set(this.db.collection(col).doc(id), doc, merge ? { merge: true } : undefined);
    batch.set(this.db.collection("activity").doc(ev.id), ev);
    await batch.commit();
  }

  async create(col, input, chatMessage) {
    this.assertCollection(col);
    const data = { date: todayIST(), ...input };
    const errs = validate(col, data);
    if (Object.keys(errs).length) throw new ValidationError(errs);
    const now = new Date().toISOString();
    const doc = { ...clean(col, data), status: "active", source: "ai", needs_review: true,
      created_at: now, updated_at: now, created_by: ACTOR, updated_by: ACTOR };
    if (chatMessage) doc.chat_message = String(chatMessage).slice(0, 500);
    const id = randomUUID();
    await this.write(col, id, doc, false, "create", `Added ${SCHEMA[col].one}: ${SCHEMA[col].title(doc)}`);
    return { id, ...doc };
  }

  async get(col, id) {
    this.assertCollection(col);
    const snap = await this.db.collection(col).doc(id).get();
    if (!snap.exists) throw new ValidationError({ id: `no ${SCHEMA[col].one} with id ${id}` });
    return { id, ...snap.data() };
  }

  async correct(col, id, changes, reason) {
    const old = await this.get(col, id);
    const merged = { ...old, ...changes };
    const errs = validate(col, merged);
    if (Object.keys(errs).length) throw new ValidationError(errs);
    const next = clean(col, merged), diff = {};
    for (const f of SCHEMA[col].fields) {
      const a = old[f.k], b = next[f.k];
      if (JSON.stringify(a ?? "") !== JSON.stringify(b ?? "")) diff[f.k] = [a ?? null, b ?? null];
    }
    if (!Object.keys(diff).length) return { id, unchanged: true };
    const now = new Date().toISOString();
    // Write only the changed fields, so a concurrent edit to another field isn't overwritten.
    // An AI correction always goes back to the review queue.
    const patch = Object.fromEntries(Object.keys(diff).map(k => [k, next[k] ?? null]));
    if (diff.metric) patch.unit = next.unit;
    await this.write(col, id, { ...patch, needs_review: true, updated_at: now, updated_by: ACTOR }, true, "update", `AI corrected: ${SCHEMA[col].title(next)}${reason ? ` (${reason})` : ""}`, diff);
    return { id, changed: diff };
  }

  async archive(col, id, reason) {
    const old = await this.get(col, id);
    const now = new Date().toISOString();
    await this.write(col, id, { status: "archived", updated_at: now, updated_by: ACTOR }, true, "archive", `AI archived: ${SCHEMA[col].title(old)}${reason ? ` (${reason})` : ""}`);
    return { id, archived: true };
  }

  async list(col, { from, to, includeArchived = false, limit = 50, match } = {}) {
    return (await this.query(col, { from, to, includeArchived, match })).slice(0, Math.min(limit, 200));
  }

  // All matching rows, newest first, no cap (for totals).
  async query(col, { from, to, includeArchived = false, match } = {}) {
    this.assertCollection(col);
    const snap = await this.db.collection(col).get();
    let rows = [];
    snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
    if (!includeArchived) rows = rows.filter(r => r.status !== "archived");
    if (from) rows = rows.filter(r => !r.date || r.date >= from);
    if (to) rows = rows.filter(r => !r.date || r.date <= to);
    if (match) { const m = match.toLowerCase(); rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(m)); }
    rows.sort((a, b) => String(b.date || b.updated_at).localeCompare(String(a.date || a.updated_at)));
    return rows;
  }

  async monthSummary(month = todayIST().slice(0, 7)) {
    if (!/^\d{4}-\d{2}$/.test(month) || !isDate(`${month}-01`)) throw new ValidationError({ month: "must be a real month, YYYY-MM" });
    const tx = await this.query("transactions", { from: `${month}-01`, to: `${month}-31` });
    const sum = t => tx.filter(x => x.type === t).reduce((a, x) => a + (Number(x.amount) || 0), 0);
    const income = sum("income") + sum("refund"), spent = sum("expense") + sum("loan_payment"), invested = sum("investment");
    const byCategory = {};
    tx.filter(x => x.type === "expense" || x.type === "loan_payment").forEach(x => byCategory[x.category] = (byCategory[x.category] || 0) + Number(x.amount));
    return { month, income, spent, invested, left: income - spent - invested, transactions: tx.length,
      by_category: Object.fromEntries(Object.entries(byCategory).sort((a, b) => b[1] - a[1])),
      awaiting_review: tx.filter(x => x.needs_review).length };
  }
}
