// Mirrors SCHEMA in portfolio/premos/index.html. Change both together.
export const CATEGORIES = ["Salary","Freelance","Food","Rent","Fuel","Bike","Travel","Shopping","Subscriptions","EMI","Bills","Photography","Entertainment","Medical","Investment","Other"];
export const ACCOUNTS = ["HDFC Savings","Credit Card","UPI / Cash","Investments"];
export const TX_TYPES = ["expense","income","transfer","investment","refund","loan_payment"];
export const HEALTH = { weight:"kg", sleep:"hrs", steps:"steps", workout:"min", water:"L", resting_hr:"bpm", mood:"/5" };
export const PLATFORMS = ["instagram","youtube","facebook","x"];
export const SOCIAL_METRICS = ["followers","views","likes","posts","subscribers"];
export const P_STATUS = ["idea","active","paused","done"];
export const P_AREA = ["work","personal","content","startup"];

export const SCHEMA = {
  transactions: { one: "transaction", title: r => r.description || r.category, fields: [
    { k:"date", t:"date", req:1 }, { k:"type", t:"select", o:TX_TYPES, req:1 },
    { k:"amount", t:"number", req:1, min:0.01 }, { k:"category", t:"select", o:CATEGORIES, req:1 },
    { k:"account", t:"select", o:ACCOUNTS }, { k:"description", t:"text", req:1 },
    { k:"merchant", t:"text" }, { k:"tags", t:"tags" }, { k:"notes", t:"textarea" } ] },
  health: { one: "health log", title: r => `${r.metric} ${r.value} ${r.unit || ""}`.trim(), fields: [
    { k:"date", t:"date", req:1 }, { k:"metric", t:"select", o:Object.keys(HEALTH), req:1 },
    { k:"value", t:"number", req:1, min:0 }, { k:"note", t:"textarea" } ] },
  social: { one: "social metric", title: r => `${r.platform} ${r.metric}`, fields: [
    { k:"date", t:"date", req:1 }, { k:"platform", t:"select", o:PLATFORMS, req:1 },
    { k:"metric", t:"select", o:SOCIAL_METRICS, req:1 }, { k:"value", t:"number", req:1, min:0 }, { k:"note", t:"textarea" } ] },
  projects: { one: "project", title: r => r.name, fields: [
    { k:"name", t:"text", req:1 }, { k:"stage", t:"select", o:P_STATUS, req:1 }, { k:"area", t:"select", o:P_AREA },
    { k:"progress", t:"number", min:0, max:100 }, { k:"due", t:"date" }, { k:"next_step", t:"text" },
    { k:"link", t:"url" }, { k:"notes", t:"textarea" } ] },
};
export const COLLECTIONS = Object.keys(SCHEMA);

// Real calendar date in YYYY-MM-DD (rejects 2026-02-31).
export const isDate = v => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};
// Numbers or numeric strings only (rejects true/false/null, which Number() would turn into 1/0).
export const isNum = v => (typeof v === "number" && Number.isFinite(v)) || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));

export function validate(col, data) {
  const errs = {};
  for (const f of SCHEMA[col].fields) {
    const v = data[f.k];
    const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);
    if (f.req && empty) { errs[f.k] = "required"; continue; }
    if (empty) continue;
    if (f.t === "number") {
      const n = Number(v);
      if (!isNum(v)) errs[f.k] = "must be a number";
      else if (f.min !== undefined && n < f.min) errs[f.k] = `must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errs[f.k] = `must be at most ${f.max}`;
    }
    if (f.t === "date" && !isDate(v)) errs[f.k] = "must be a real date, YYYY-MM-DD";
    if (f.t === "select" && !f.o.includes(v)) errs[f.k] = `must be one of: ${f.o.join(", ")}`;
    if (f.t === "url" && !/^https?:\/\//.test(v)) errs[f.k] = "must start with https://";
  }
  return errs;
}

export function clean(col, data) {
  const out = {};
  for (const f of SCHEMA[col].fields) {
    let v = data[f.k];
    if (v === undefined || v === null || v === "") continue;
    if (f.t === "number") v = Number(v);
    if (f.t === "tags") v = Array.isArray(v) ? v : String(v).split(",").map(s => s.trim()).filter(Boolean);
    out[f.k] = v;
  }
  if (col === "health" && out.metric) out.unit = HEALTH[out.metric];
  return out;
}
