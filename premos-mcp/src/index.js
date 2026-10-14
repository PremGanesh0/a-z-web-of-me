#!/usr/bin/env node
// PREM OS MCP server. Run by Hermes (or any MCP client) over stdio.
// Credentials: set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service-account JSON for project premganeshd.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { PremosRepo, ValidationError, todayIST } from "./repo.js";
import { CATEGORIES, ACCOUNTS, TX_TYPES, HEALTH, PLATFORMS, SOCIAL_METRICS, P_STATUS, P_AREA, COLLECTIONS } from "./schema.js";

initializeApp({ credential: applicationDefault(), projectId: process.env.FIREBASE_PROJECT_ID || "premganeshd" });
const repo = new PremosRepo(getFirestore());

const server = new McpServer({ name: "premos", version: "0.1.0" }, {
  instructions:
    "PREM OS is Prem's personal dashboard (finance, health, social, projects). Amounts are Indian rupees. " +
    "Dates are YYYY-MM-DD in IST; omit date for today. Everything you add or change goes to Prem's review queue, so " +
    "add what he tells you without asking for confirmation, and pass his original message as chat_message. " +
    "To fix a mistake, find the record with list_records and use correct_record; never create a duplicate.",
});

const ok = data => ({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
const wrap = fn => async args => {
  try { return ok(await fn(args)); }
  catch (e) {
    const msg = e instanceof ValidationError ? e.message : `PREM OS error: ${e.message}`;
    return { content: [{ type: "text", text: msg }], isError: true };
  }
};
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe(`YYYY-MM-DD; defaults to today (${todayIST()})`);
const chat = z.string().optional().describe("Prem's original message, kept for the review queue");

server.tool("add_transaction", "Record money in or out: expense, income, investment, transfer, refund or loan payment.", {
  amount: z.number().positive().describe("Rupees"),
  type: z.enum(TX_TYPES).default("expense"),
  category: z.enum(CATEGORIES),
  description: z.string().min(1),
  account: z.enum(ACCOUNTS).optional(),
  merchant: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  date, chat_message: chat,
}, wrap(({ chat_message, ...a }) => repo.create("transactions", a, chat_message)));

server.tool("add_health_log", `Log a health metric. Units: ${Object.entries(HEALTH).map(([k, u]) => `${k}=${u}`).join(", ")}.`, {
  metric: z.enum(Object.keys(HEALTH)), value: z.number().nonnegative(), note: z.string().optional(), date, chat_message: chat,
}, wrap(({ chat_message, ...a }) => repo.create("health", a, chat_message)));

server.tool("add_social_metric", "Record a snapshot of a social account number, e.g. Instagram followers or YouTube views.", {
  platform: z.enum(PLATFORMS), metric: z.enum(SOCIAL_METRICS), value: z.number().nonnegative(), note: z.string().optional(), date, chat_message: chat,
}, wrap(({ chat_message, ...a }) => repo.create("social", a, chat_message)));

server.tool("add_project", "Create a project.", {
  name: z.string().min(1), status: z.enum(P_STATUS).default("active"), area: z.enum(P_AREA).optional(),
  progress: z.number().min(0).max(100).optional(), due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  next_step: z.string().optional(), link: z.string().url().optional(), notes: z.string().optional(), chat_message: chat,
}, wrap(({ chat_message, ...a }) => repo.create("projects", a, chat_message)));

server.tool("correct_record", "Change fields on an existing record (fix a wrong amount, mark a project done, etc.). Get the id from list_records first.", {
  collection: z.enum(COLLECTIONS), id: z.string(),
  changes: z.record(z.any()).describe("Only the fields to change, e.g. {\"amount\": 380}"),
  reason: z.string().optional(),
}, wrap(({ collection, id, changes, reason }) => repo.correct(collection, id, changes, reason)));

server.tool("archive_record", "Archive a record that shouldn't count (duplicate, wrong entry). It stays in history and can be restored from the dashboard.", {
  collection: z.enum(COLLECTIONS), id: z.string(), reason: z.string().optional(),
}, wrap(({ collection, id, reason }) => repo.archive(collection, id, reason)));

server.tool("list_records", "Find records, newest first. Use to answer questions or to find an id before correcting.", {
  collection: z.enum(COLLECTIONS),
  from: z.string().optional().describe("YYYY-MM-DD inclusive"), to: z.string().optional().describe("YYYY-MM-DD inclusive"),
  match: z.string().optional().describe("Text to search for, e.g. 'fuel'"),
  include_archived: z.boolean().default(false), limit: z.number().int().min(1).max(200).default(30),
}, wrap(({ collection, include_archived, ...o }) => repo.list(collection, { ...o, includeArchived: include_archived })));

server.tool("month_summary", "Income, spending, investments and spending by category for a month.", {
  month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe("YYYY-MM; defaults to this month"),
}, wrap(({ month }) => repo.monthSummary(month)));

await server.connect(new StdioServerTransport());
