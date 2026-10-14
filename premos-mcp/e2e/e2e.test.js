// End-to-end: real dashboard (browser) + real MCP server (stdio, as Hermes runs it) + shared stand-in database.
// Run: npm run e2e   (first time on a new machine: npx playwright install chromium)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { start } from "./server.js";

let srv, browser, page, mcp;
const call = async (name, args) => {
  const r = await mcp.callTool({ name, arguments: args });
  if (r.isError) throw new Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};
const records = col => Object.entries(srv.data[col] || {}).map(([id, d]) => ({ id, ...d }));

before(async () => {
  srv = await start();
  browser = await chromium.launch();
  page = await browser.newPage();
  page.on("pageerror", e => { throw e; });
  await page.goto(`${srv.url}/premos/`);
  mcp = new Client({ name: "e2e-hermes", version: "1" });
  await mcp.connect(new StdioClientTransport({
    command: process.execPath, args: [fileURLToPath(new URL("../src/index.js", import.meta.url))],
    env: { ...process.env, PREMOS_TEST_DB: srv.url },
  }));
});
after(async () => { await mcp?.close(); await browser?.close(); srv?.close(); });

test("owner signs in and sees an empty live dashboard", async () => {
  await page.waitForSelector(".mode.live");
  assert.match(await page.textContent(".rail .foot"), /Live · Firebase/);
  assert.match(await page.textContent("main"), /Good \w+, Prem/);
});

test("MCP exposes the tools Hermes needs", async () => {
  const { tools } = await mcp.listTools();
  assert.deepEqual(tools.map(t => t.name).sort(), ["add_health_log","add_project","add_social_metric","add_transaction","archive_record","correct_record","list_records","month_summary"]);
});

let fuelId;
test("AI adds an expense → appears live in the review queue", async () => {
  const r = await call("add_transaction", { amount: 850, category: "Fuel", description: "Himalayan fuel", account: "Credit Card", chat_message: "spent 850 on fuel" });
  fuelId = r.id;
  assert.equal(r.needs_review, true);
  await page.waitForSelector('.nav[data-view="review"] .count');
  assert.equal(await page.textContent('.nav[data-view="review"] .count'), "1");
  await page.click('.nav[data-view="review"]');
  assert.match(await page.textContent(".ritem"), /Himalayan fuel · ₹850/);
});

test("Prem corrects the AI entry in the dashboard → stored, reviewed, diff logged", async () => {
  await page.click(".ritem [data-edit]");
  await page.fill("#f-amount", "800");
  await page.click("#save");
  await page.waitForSelector(".scrim", { state: "detached" });
  await page.waitForFunction(() => !document.querySelector('.nav[data-view="review"] .count'));
  const t = srv.data.transactions[fuelId];
  assert.equal(t.amount, 800);
  assert.equal(t.needs_review, false);
  const ev = records("activity").find(e => e.action === "correct");
  assert.deepEqual(ev.diff.amount, [850, 800]);
  assert.equal(ev.actor, "Prem");
});

test("AI sees Prem's correction and the month summary adds up", async () => {
  const found = await call("list_records", { collection: "transactions", match: "himalayan" });
  assert.equal(found[0].amount, 800);
  await call("add_transaction", { amount: 85000, type: "income", category: "Salary", description: "Salary" });
  const s = await call("month_summary", {});
  assert.equal(s.spent, 800); assert.equal(s.income, 85000); assert.equal(s.left, 84200);
});

test("AI correction sends the record back for review", async () => {
  await call("correct_record", { collection: "transactions", id: fuelId, changes: { amount: 820 }, reason: "receipt says 820" });
  await page.waitForFunction(() => document.querySelector('.nav[data-view="review"] .count')?.textContent === "2");
});

test("double-clicking Add creates one record, not two", async () => {
  await page.click('.nav[data-view="transactions"]');
  await page.click('[data-add="transactions"]');
  await page.fill("#f-amount", "120");
  await page.fill("#f-description", "Chai");
  await page.dblclick("#save");
  // If the save finishes before the second click, that click can land on the table behind and open a row; close it.
  await page.waitForTimeout(300);
  if (await page.$(".scrim")) await page.keyboard.press("Escape");
  await page.waitForSelector(".scrim", { state: "detached" });
  assert.equal(records("transactions").filter(t => t.description === "Chai").length, 1);
});

test("projects keep their stage when archived and restored", async () => {
  const p = await call("add_project", { name: "Shorebird spike", stage: "idea" });
  await page.click('.nav[data-view="projects"]');
  await page.waitForSelector(`[data-edit="projects:${p.id}"]`);
  await page.click(`[data-edit="projects:${p.id}"]`);
  await page.click("#askarch"); await page.click("#doarch");
  await page.waitForSelector(".scrim", { state: "detached" });
  assert.equal(srv.data.projects[p.id].stage, "idea");
  assert.equal((await call("list_records", { collection: "projects" })).length, 0);
  await page.click("#arch");
  await page.click(`[data-edit="projects:${p.id}"]`);
  await page.click("#restore");
  await page.waitForSelector(".scrim", { state: "detached" });
  assert.equal(srv.data.projects[p.id].status, "active");
  assert.equal(srv.data.projects[p.id].stage, "idea");
});

test("every write has a matching activity entry", async () => {
  const acts = records("activity");
  for (const col of ["transactions", "projects"]) for (const r of records(col)) assert.ok(acts.some(a => a.record_id === r.id), `${col}/${r.id} has no activity`);
});

test("any other account is turned away", async () => {
  const p2 = await browser.newPage();
  await p2.goto(`${srv.url}/premos/?as=stranger@gmail.com`);
  await p2.waitForSelector("#signin");
  assert.match(await p2.textContent(".gate"), /stranger@gmail.com doesn't have access/);
  await p2.close();
});

test("email and password login: wrong password is refused, right one opens the dashboard", async () => {
  const p3 = await browser.newPage();
  await p3.goto(`${srv.url}/premos/?signedout`);
  await p3.waitForSelector("#l-email");
  await p3.fill("#l-email", "premganesh2655@gmail.com");
  await p3.fill("#l-pass", "nope");
  await p3.click("#signin");
  await p3.waitForSelector("[role=alert]");
  assert.match(await p3.textContent("[role=alert]"), /don't match/);
  await p3.fill("#l-pass", "test-pass");
  await p3.click("#signin");
  await p3.waitForSelector(".mode.live");
  assert.match(await p3.textContent("main"), /Good \w+, Prem/);
  await p3.close();
});
