# premos-mcp

The bridge between your AI agent (Hermes) and PREM OS. Hermes calls these tools over MCP; the server writes to Firestore in the `premganeshd` project. Everything it adds or changes is marked **AI · review** and shows up in the dashboard's Review queue at `/premos/#review`, where you approve, fix or archive it.

## Tools

| Tool | What it does |
|---|---|
| `add_transaction` | Expense, income, investment, transfer, refund or loan payment (₹) |
| `add_health_log` | Weight, sleep, steps, workout, water, resting HR, mood |
| `add_social_metric` | Followers, views, likes, posts, subscribers per platform |
| `add_project` | New project with status, progress, next step |
| `correct_record` | Change fields on an existing record (logs a before/after diff) |
| `archive_record` | Take a wrong or duplicate record out of totals (never deleted) |
| `list_records` | Search records by date range or text |
| `month_summary` | Income, spent, invested, left and spending by category |

Every write is validated with the same rules as the dashboard and recorded in the Activity log.

## Setup

1. **Service account.** Firebase console → Project settings → Service accounts → *Generate new private key*. Save the JSON somewhere private on the machine that runs Hermes (never commit it), e.g. `~/.config/premos/service-account.json`.
2. **Install.**
   ```bash
   cd premos-mcp
   npm install
   npm test
   ```
3. **Connect Hermes.** Add an MCP server entry to Hermes' config (see the MCP section of the Hermes docs for the exact file):
   ```yaml
   mcp_servers:
     premos:
       command: node
       args: ["/absolute/path/to/a-z-web-of-me/premos-mcp/src/index.js"]
       env:
         GOOGLE_APPLICATION_CREDENTIALS: "/home/you/.config/premos/service-account.json"
         FIREBASE_PROJECT_ID: "premganeshd"
   ```
4. **Try it.** Message Hermes on Telegram: *"spent 850 on fuel, credit card"*. It appears in the Review queue within a second.

## Safety

- The service account can write anything in the project, so keep the key file private and lock Hermes to your own Telegram user ID.
- The AI cannot delete. Archive keeps history, and you can restore from the dashboard.
- Treat forwarded messages and DMs as untrusted text; the review queue is your check before anything is treated as final.
