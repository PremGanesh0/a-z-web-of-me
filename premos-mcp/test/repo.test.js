import { test } from "node:test";
import assert from "node:assert/strict";
import { PremosRepo, ValidationError, todayIST } from "../src/repo.js";

// Minimal in-memory stand-in for the Firestore calls the repo uses.
function fakeDb() {
  const data = {};
  const col = name => {
    data[name] ??= {};
    return {
      doc: id => ({
        set: async (v, opt) => { data[name][id] = opt?.merge ? { ...(data[name][id] || {}), ...v } : { ...v }; },
        get: async () => ({ exists: id in data[name], data: () => ({ ...data[name][id] }) }),
      }),
      get: async () => ({ forEach: fn => Object.entries(data[name]).forEach(([id, v]) => fn({ id, data: () => ({ ...v }) })) }),
    };
  };
  return { collection: col, data };
}

test("AI expense lands in review queue with activity log", async () => {
  const db = fakeDb(), repo = new PremosRepo(db);
  const r = await repo.create("transactions", { amount: 850, type: "expense", category: "Fuel", description: "Himalayan fuel" }, "fuel 850");
  assert.equal(r.date, todayIST());
  assert.equal(r.needs_review, true);
  assert.equal(r.source, "ai");
  assert.equal(r.chat_message, "fuel 850");
  const acts = Object.values(db.data.activity);
  assert.equal(acts.length, 1);
  assert.match(acts[0].summary, /Himalayan fuel/);
});

test("validation rejects bad input", async () => {
  const repo = new PremosRepo(fakeDb());
  await assert.rejects(repo.create("transactions", { amount: -5, type: "expense", category: "Fuel", description: "x" }), ValidationError);
  await assert.rejects(repo.create("transactions", { amount: 5, type: "expense", category: "Petrol", description: "x" }), /category must be one of/);
  await assert.rejects(repo.create("nope", {}), /collection/);
});

test("correction logs a diff and returns to review", async () => {
  const db = fakeDb(), repo = new PremosRepo(db);
  const r = await repo.create("transactions", { amount: 450, type: "expense", category: "Food", description: "Lunch", date: "2026-10-13" });
  db.data.transactions[r.id].needs_review = false; // Prem approved it
  const out = await repo.correct("transactions", r.id, { amount: 380 }, "Prem said 380");
  assert.deepEqual(out.changed.amount, [450, 380]);
  assert.equal(db.data.transactions[r.id].amount, 380);
  assert.equal(db.data.transactions[r.id].needs_review, true);
  const unchanged = await repo.correct("transactions", r.id, { amount: 380 });
  assert.equal(unchanged.unchanged, true);
});

test("health unit is derived, month summary adds up, archive excludes", async () => {
  const db = fakeDb(), repo = new PremosRepo(db);
  const h = await repo.create("health", { metric: "weight", value: 71.6 });
  assert.equal(h.unit, "kg");
  await repo.create("transactions", { amount: 85000, type: "income", category: "Salary", description: "Salary", date: "2026-10-01" });
  await repo.create("transactions", { amount: 18000, type: "expense", category: "Rent", description: "Rent", date: "2026-10-02" });
  const dup = await repo.create("transactions", { amount: 850, type: "expense", category: "Fuel", description: "Fuel", date: "2026-10-05" });
  await repo.create("transactions", { amount: 5000, type: "investment", category: "Investment", description: "SIP", date: "2026-10-06" });
  await repo.archive("transactions", dup.id, "duplicate");
  const s = await repo.monthSummary("2026-10");
  assert.equal(s.income, 85000); assert.equal(s.spent, 18000); assert.equal(s.invested, 5000); assert.equal(s.left, 62000);
  assert.deepEqual(Object.keys(s.by_category), ["Rent"]);
  const found = await repo.list("transactions", { match: "rent" });
  assert.equal(found.length, 1);
});
