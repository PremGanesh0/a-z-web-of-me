# A-Z Web of Me — Ganesh's Life Dashboard

A comprehensive personal dashboard covering every dimension of life — **Finances**, **Health**, and **Career** — all in one place.

> "Track everything that matters. Know where you stand. Plan where you're going."

---

## What's Inside

### 📊 Finances (A-Z)
| Letter | Topic |
|--------|-------|
| A | Assets & Net Worth |
| B | Budget vs Actual spending |
| C | Cash & Liquid Savings |
| D | Debts & Liabilities |
| E | Expenses by Category |
| F | Financial Goals (with progress) |
| G | Gold & Alternative Investments |
| H | Housing Costs |
| I | Income Streams (salary, freelance, passive) |
| I₂ | Investments Portfolio |
| K | Credit Score & Cards |
| L | Liabilities Breakdown |
| M | Monthly Cash Flow |
| N | Net Worth Tracker |
| P | Passive Income |
| Q | Quarterly Tax Estimates |
| R | Retirement Planning (PPF, NPS) |
| S | Savings Rate & Goals |
| S₂ | Stock Portfolio |
| T | Tax Planning |
| U | Utility Bills |

### ❤️ Health (A-Z)
| Letter | Topic |
|--------|-------|
| A | Activity Level & Steps |
| B | Blood Reports & BP |
| C | Calorie Intake & Cheat Meals |
| D | Diet & Nutrition (macros, habits) |
| E | Exercise Routine |
| F | Fitness Metrics (weight, BMI, body fat) |
| G | Gym/Strength Training & Health Goals |
| H | Heart Rate (Resting) |
| I | Immune Health |
| J | Journal — Health & Mood |
| M | Mental Wellness (meditation, mood, stress) |
| N | Nutrition Plan |
| P | Physical Therapy / Recovery |
| R | Running (5K, 10K, half-marathon) |
| S | Sleep Tracking & Supplements & Strength PRs |
| T | Vitals & Temperature |
| W | Weight Journey |

### 💼 Career (A-Z)
| Letter | Topic |
|--------|-------|
| A | Achievements & Awards |
| B | Bug / Incident Log |
| C | Current Role, Certifications, Code Reviews, Community |
| D | Dart/Flutter Skills |
| E | Employment History |
| F | Freelance Projects |
| G | Goals & Growth Plan |
| I | Income — Career |
| K | Key Projects (Bike Guardian, etc.) |
| L | Learning & Courses |
| M | Mentorship |
| N | Network & Relationships |
| P | Portfolio of Work |
| R | Resume & CV |
| S | Skills Inventory & Tech Stack |
| T | Teach / Share |
| V | Videos / Content (Dusty Tires) |
| W | Work Wins |
| X | X-factor / Unique Value |

---

## Structure

```
a-z-web-of-me/
├── index.html          # Main single-page dashboard
├── css/
│   └── style.css       # Dark-themed stylesheet
├── js/
│   ├── dashboard.js    # Navigation, A-Z index, bootstrap
│   ├── finances.js     # Financial tracker module
│   ├── health.js       # Health & wellness tracker
│   └── career.js       # Career & professional tracker
├── data/
│   ├── finances.json   # All financial data
│   ├── health.json     # All health data
│   └── career.json     # All career data
├── assets/             # Images, icons (future)
└── README.md           # This file
```

---

## How to Use

1. Open `index.html` in any browser — no build step needed.
2. All data lives in `data/*.json` — edit them directly to update your numbers.
3. Goals can be checked/unchecked directly in the UI; the JS attempts to persist back to the JSON files (works when served from a local server with write access).
4. The A-Z Index on the last tab lets you browse every tracked dimension alphabetically.

### Running locally

```bash
# With Python (any version)
cd a-z-web-of-me
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Hosting

Push to GitHub and enable **GitHub Pages** (Settings → Pages → Source: `main` branch, `/root` folder) — the site will be live at `https://<your-username>.github.io/a-z-web-of-me/`.

---

## Data Files

| File | What it tracks |
|------|---------------|
| `data/finances.json` | Income streams, expenses by category, savings, investments, tax planning |
| `data/health.json` | Fitness, nutrition, sleep, mental wellness, vitals, health goals |
| `data/career.json` | Current role, skills inventory, achievements, learning, career goals, network |

---

## Tech Stack

- **Vanilla HTML + CSS + JavaScript** — zero dependencies, no build step
- **Font Awesome 6** (CDN) — icons
- **CSS Grid + Custom Properties** — responsive dark theme
- **JSON data files** — human-readable, editable with any text editor

---

## License

Personal use. Do whatever you want with it.
