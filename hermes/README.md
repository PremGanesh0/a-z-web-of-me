# Hermes: Prem's personal assistant

Hermes runs on the laptop, chats with Prem on Telegram, thinks with models from OmniRoute, and keeps PREM OS up to date through the `premos` MCP server. It can also run commands, manage files and use apps on the laptop, asking first for anything risky.

```
Telegram ──► Hermes gateway (laptop, starts at login) ──► OmniRoute (models)
                  │
                  ├─► premos MCP server ──► Firestore ──► PREM OS dashboard (review queue)
                  └─► terminal · files · browser · computer use (approval rules in config)
```

## Before you run the setup

1. **Telegram bot**: talk to @BotFather → `/newbot` → copy the token. Get your numeric user ID from @userinfobot.
2. **OmniRoute** running on the laptop. Note its URL (default `http://localhost:20128/v1`), an API key, and the model or combo name to use.
3. **Firebase**: in the `premganeshd` console, enable Authentication → Google and create a Firestore database. Then Project settings → Service accounts → *Generate new private key*, saved as `%USERPROFILE%\.config\premos\service-account.json`. Never commit this file.

## Run it

```powershell
cd C:\Users\Ganesh\projects\a-z-web-of-me
git pull
powershell -ExecutionPolicy Bypass -File hermes\setup-windows.ps1 `
  -TelegramToken "<bot token>" -TelegramUserId <your id> `
  -OmniRouteKey "<key>" -Model "<model or combo>"
```

The script installs Node (if missing), the premos MCP server and Hermes; writes `%LOCALAPPDATA%\hermes\config.yaml` and `SOUL.md` (backing up old ones); locks Telegram to your user ID; tests the PREM OS connection; adds a 9:30 pm daily check-in and a Sunday 10 am money summary; and registers the gateway to start at login.

## Files

| File | What it is |
|---|---|
| `SOUL.md` | Hermes' personality and rules: log money/health/social to PREM OS without asking, confirm in one line, ask before deleting, sending, spending or posting. Edit freely and re-run, or copy to `%LOCALAPPDATA%\hermes\SOUL.md`. |
| `config.template.yaml` | Model (OmniRoute), time zone, approval rules and the premos MCP server. |
| `setup-windows.ps1` | The installer above. Safe to re-run. |

## Everyday commands

```powershell
hermes gateway status        # is it running?
hermes gateway restart       # after editing config or SOUL.md
hermes mcp test premos       # check the PREM OS connection
hermes cron list             # scheduled check-ins
hermes                        # chat in the terminal instead of Telegram
```

## Tested

`premos-mcp` has unit tests (`npm test`) and an end-to-end test (`npm run e2e`) that drives the real dashboard in a browser and the real MCP server over stdio. This config was validated with `hermes config check`, and `hermes mcp test premos` connected and discovered all 8 tools.
