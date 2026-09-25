---
name: javascript-esm-modules
description: "ESM module architecture, IIFE-to-ESM migration, entity/service alignment."
version: 1.0.0
author: Ganesh, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [javascript, esm, modules, migration, architecture, debugging]
    related_skills: [systematic-debugging, simplify-code, spike]
---

# JavaScript ESM Modules

## Overview

Work reliably with JavaScript ES Module codebases: migrating legacy IIFE patterns to ESM, aligning entity types across service layers, and testing ESM modules in Node.js.

## When to Use

- Converting legacy IIFE/self-executing modules to proper ESM exports
- Adding ESM exports to existing IIFE modules without breaking browser `window` globals
- Splitting monolithic JS files into service/data/UI layers
- Debugging "Named export not found" or "is not a constructor" errors in ESM imports
- Verifying module health before wiring modules together
- Testing browser-targeted ESM modules (localStorage, window) in Node.js

---

## IIFE-to-ESM Migration

**Core pattern:** Legacy modules often use an IIFE that assigns to `window.NAME` and returns a singleton. Adding ESM exports requires keeping the IIFE intact while adding exports at the bottom.

### Step 1: Identify the current pattern

Read the module. If it looks like this:

```js
const Database = (() => {
  // ... implementation ...
  return { init, getData, setData, /* ... */ };
})();

if (typeof window !== 'undefined') window.Database = Database;
```

The module exports a **singleton object**, not a class. Services that do `import { Database } from '...'` and then call `Database.getEntitiesByType()` are using it as a namespace.

### Step 2: Determine how consumers use it

Before changing exports, grep all consumers:

```bash
# Find all files that import or reference this module
grep -rn "from.*Database" js/        # ESM imports
grep -rn "require.*Database" js/     # CJS requires
grep -rn "window.Database" js/       # window global usage
```

Three usage patterns to watch for:

| Pattern | Example | What it needs |
|---------|---------|---------------|
| Namespace calls | `Database.getEntity(...)` | Singleton object with methods |
| Class construction | `new Database()` | Class constructor export |
| Window global | `window.Database` | IIFE singleton assigned to window |

**Pitfall:** Don't assume — grep first. A module may be used both as `new Database()` in one file and `Database.getEntity()` in another.

### Step 3: Add ESM exports without breaking existing usage

For a singleton IIFE, append at the very bottom:

```js
// After the IIFE closes:
if (typeof window !== 'undefined') window.Database = Database;

export default Database;
export { Database };
```

This preserves the IIFE singleton for `window.Database` consumers while giving ESM importers both default and named exports.

**Pitfall:** Do NOT convert to `class Database` if consumers call static methods like `Database.getEntity()`. A class instance doesn't expose static methods the same way, and `new Database()` creates a fresh instance that lacks the singleton state.

### Step 4: For class-based modules, ensure proper exports

If rewriting to a class:

```js
class Database {
  constructor() { this._key = 'premos_database'; }
  // ... methods using this._load(), this._save() ...
}
export default Database;
export { Database };
```

Consumers then use `import Database from '...'` or `new Database()`.

**Pitfall:** A class-based module with consumers that call `Database.method()` (static-style) will break. Either keep it as a singleton object OR update all consumers to `const db = new Database(); db.method()`.

---

## Entity/Service Type Alignment

When splitting a monolithic JS file into layered modules (data → services → UI), entity type names and model class names must be consistent across ALL layers.

### Alignment checklist

Before testing, verify these match across every file:

1. **Entity type strings** — The strings passed to `Database.getEntitiesByType('XYZ')` must match the keys in the seed data's `entities` object. E.g., seed data has `"goals"` but a service calls `getEntitiesByType('career_goals')` → empty results.

2. **Model class names** — `new Models.SomeClass(data)` must reference a class that actually exists in the Models module's export. If the Models IIFE returns `{ Goal, ... }` but a service calls `new Models.CareerGoal(...)`, you get a runtime error.

3. **Seed data keys** — The standalone seed JSON's `entities` keys must match what services query. A mismatch (e.g., `"career_goals"` vs `"goals"`) silently returns empty arrays.

### Audit procedure

```bash
# 1. Extract all entity type strings from services
grep -oh "getEntitiesByType('[^']*')" js/services/*.js | sort -u

# 2. Extract all model class names used in new Models.XXX() calls
grep -oh "Models\.[A-Za-z]*" js/services/*.js | sort -u

# 3. Extract entity keys from seed data
jq 'keys[]' data/database.json

# 4. Extract exported names from Models module
grep -oh "export.*Models\.\|[A-Za-z]*, " js/core/Models.js | head -5

# 5. Cross-check: every service entity type must exist in seed data
# every service model class must exist in Models exports
```

**Pitfall:** Don't just check that the code runs — check that the DATA flows. A service can construct successfully with zero entities if the type strings don't match the seed data keys. Dashboards will show zeros and empty lists with no errors.

---

## Node.js ESM Testing with Browser Globals

Browser-targeted ESM modules often depend on `window`, `localStorage`, and `crypto`. Test them in Node with a mock harness.

### Minimal test harness

```js
// test-harness.mjs
import Database from './js/core/Database.js';
import Models from './js/core/Models.js';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};

// Mock window with all globals services expect
global.window = {
  localStorage,
  Database,
  Models,
  __PREMONOS_SEED__: { version: '1.0.0', entities: { /* ... */ } }
};

// Initialize the database singleton
await Database.initialize();

// Now import services — they read from window
const { FinanceService } = await import('./js/services/FinanceService.js');
const { HealthService } = await import('./js/services/HealthService.js');
const { CareerService } = await import('./js/services/CareerService.js');

// Test
const fin = new FinanceService();
console.log(fin.getDASHBOARD());
```

**Pitfall:** Services that use `import { Database } from '../core/Database.js'` at the top of their file get the ESM export directly and IGNORE `window.Database`. Services that use `const { Database } = window` at the top of an IIFE get the window global. Know which pattern each service uses before setting up the mock.

### Syntax checking before integration

Run `node --check` on every module before wiring them together:

```bash
node --check js/core/Database.js && \
node --check js/core/Models.js && \
node --check js/services/FinanceService.js && \
node --check js/services/HealthService.js && \
node --check js/services/CareerService.js && \
node --check js/services/Services.js && \
node --check js/components/Components.js && \
node --check js/app.js && \
echo "All modules pass syntax check"
```

**Pitfall:** Syntax errors in one module can cascade through imports. A `\n` literal inside a string (from a botched patch) causes a SyntaxError at module load time, before any of your test code runs. Always check syntax first.

---

## Patch Tool Safety

The `patch` tool can corrupt files when old_string/new_string contain embedded newlines that get serialized as literal `\n` characters.

**Rule:** After any `patch` call that modifies structural code (not just prose), immediately verify the file is syntactically valid:

```bash
node --check path/to/file.js
```

If the file fails, do NOT try another patch — read the full file, understand the corruption, and rewrite cleanly with `write_file`.

**Pitfall:** A botched patch can insert literal `\n` text into JavaScript strings, producing lines like `return {\n    BaseEntity, Profile...` — this is not valid JS and will fail at module load. The file looks almost correct on casual inspection but is syntactically broken.

---

## Debugging ESM Import Errors

Common error messages and their causes:

| Error | Cause | Fix |
|-------|-------|-----|
| `Named export 'X' not found` | Module exports only `default`, consumer uses `import { X }` | Either add `export { X }` to the module, or change consumer to `import X from '...'` |
| `is not a constructor` | Module exports a singleton object via IIFE, consumer uses `new Database()` | Either keep the IIFE pattern and use the singleton directly, or convert to a class export |
| `Module is a CommonJS module` | Node treats a `.js` file as CJS despite ESM syntax | Ensure `"type": "module"` in nearest `package.json`, or use `.mjs` extension |
| Empty results from service methods | Entity type string mismatch between service and seed data | Grep for the entity type string in both services and seed data; align them |
| `Cannot read properties of undefined` on dashboard | Service returned empty data because entity type or model class name was wrong | Check the alignment checklist above |

---

## File Structure for Layered JS Apps

Recommended structure when re-architecting a single-file app:

```
project/
├── index.html          # Shell, inline seed data, nav layout
├── css/style.css       # Design system
├── data/
│   └── database.json   # Standalone seed data (backup/sync)
├── docs/
│   └── schema.json     # Entity schema reference
└── js/
    ├── app.js          # Shell: router, init, nav rendering
    ├── core/
    │   ├── Database.js # localStorage persistence (singleton)
    │   └── Models.js   # Entity classes with audit fields
    ├── services/
    │   ├── Services.js       # Cross-domain service layer
    │   ├── FinanceService.js # Finance domain logic
    │   ├── HealthService.js  # Health domain logic
    │   └── CareerService.js  # Career domain logic
    └── components/
        └── Components.js # Reusable UI rendering functions
```

Architecture: UI → Services → Database → localStorage. No service should hardcode data; everything flows from the database through services to the UI.
