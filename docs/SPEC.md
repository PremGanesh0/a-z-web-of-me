# PREM OS — Personal Operating System

You are rebuilding my existing website:

https://premganesh0.github.io/a-z-web-of-me/

The current project is called "A-Z Web of Me". Rename and rebrand the entire application to:

# PREM OS

Tagline:

**My life. My work. My money. My journey.**

The goal is NOT to simply redesign the existing dashboard.

Re-architect it into a professional, maintainable personal operating system that can eventually be controlled by my own personal AI assistant.

---

# 1. CORE PRODUCT IDEA

PREM OS is a private personal command center.

It should bring together:

* Finance
* Health
* Career
* Jobs
* Projects
* Development
* Social media
* Content creation
* Photography
* Travel
* Memories
* Goals
* Tasks
* Journal
* Documents
* Personal information

The application must be designed so that I can continuously add, correct, update and remove information without changing the frontend code every time.

The UI is only one layer.

The underlying data architecture must be clean and maintainable.

---

# 2. IMPORTANT: DATA MUST BE EDITABLE

Do NOT hardcode personal information directly inside UI components.

Bad:

```dart
Text("Salary: ₹50,000")
Text("Flutter Developer")
Text("YouTube: Dusty Tires")
```

Instead:

```text
UI
 ↓
Services / Repository
 ↓
Database
 ↓
Models
```

All personal information should come from structured data.

I should be able to:

* Add
* Edit
* Correct
* Delete
* Archive
* Restore

records from the application.

For example:

If my salary changes:

```text
Current salary
₹50,000
```

I should be able to edit it from the UI/database.

If I made a mistake in an expense:

```text
Fuel
₹1,200
```

I should be able to correct it to:

```text
Fuel
₹1,050
```

without touching application code.

---

# 3. DATABASE-FIRST ARCHITECTURE

Design the database so that PREM OS can eventually be managed by an AI agent.

Every major entity should have:

```text
id
created_at
updated_at
created_by
updated_by
status
metadata
```

Use proper relationships instead of storing everything inside one giant JSON document.

Create separate entities/tables/collections for:

```text
profile
career
employment
skills
projects
finance_accounts
finance_transactions
finance_categories
loans
budgets
financial_goals
health_metrics
habits
social_accounts
social_metrics
content
trips
trip_expenses
memories
photos
goals
tasks
journal_entries
documents
settings
activity_logs
```

Choose the database architecture based on the existing project.

Do NOT unnecessarily migrate technologies if the current database works well.

---

# 4. FINANCE MUST BE A REAL SYSTEM

Finance should not be a static dashboard.

Create a proper transaction system.

Each transaction should support:

```text
id
date
amount
type
category
account
description
merchant
payment_method
tags
notes
created_at
updated_at
```

Transaction types:

```text
income
expense
transfer
refund
investment
loan_payment
```

Categories should be configurable.

Examples:

```text
Salary
Food
Rent
Fuel
Travel
Shopping
Subscriptions
EMI
Bills
Photography
Bike
Entertainment
Medical
Other
```

I must be able to add a financial transaction whenever required.

Example:

```text
Add Expense

Amount: ₹850
Category: Fuel
Date: Today
Account: Credit Card
Description: Himalayan fuel
```

Save it to the database.

The dashboard should automatically recalculate:

* Monthly income
* Monthly expenses
* Savings
* Category spending
* Account balances
* Loan payments
* Financial goals
* Cash flow

Never hardcode calculated values.

---

# 5. FINANCE CORRECTION SYSTEM

Mistakes will happen.

Every important financial record must be editable.

Example:

```text
₹1,500 Fuel
```

Edit:

```text
₹1,350 Fuel
```

The system should update all dependent calculations automatically.

For important changes, maintain an audit history.

Example:

```text
AUDIT LOG

25 Sep 2026 12:31

Transaction updated

Fuel
₹1,500 → ₹1,350

Changed by:
Prem
```

Do NOT silently destroy important historical information.

---

# 6. ACTIVITY / AUDIT LOG

Create a central activity log.

Record important changes such as:

```text
Added expense
Edited expense
Deleted transaction
Created project
Updated project
Changed salary
Added job
Updated goal
Added trip
Updated trip expense
Changed profile information
```

Example:

```text
TODAY

12:31
Updated fuel transaction
₹1,500 → ₹1,350

11:20
Added Bike Guardian task

10:05
Updated career information
```

This will become extremely important when the personal AI is connected later.

---

# 7. DESIGN FOR FUTURE AI CONTROL

This is critical.

The application will eventually connect to my personal AI assistant.

The AI should eventually be able to understand requests such as:

```text
Add ₹800 fuel expense today.

Correct yesterday's food expense from ₹450 to ₹380.

Show my spending this month.

Update my current salary.

Add a new project called X.

Mark Bike Guardian as completed.

Create a travel expense for Maharashtra trip.

What are my financial goals?

Show me my current loans.

Update my Instagram follower count.
```

Therefore, create a clean service/API/repository layer.

Do NOT allow the future AI to directly manipulate UI state.

Architecture should eventually support:

```text
Personal AI
     ↓
API / Commands
     ↓
Business Logic
     ↓
Validation
     ↓
Database
     ↓
Activity Log
     ↓
UI
```

The AI should never bypass validation.

---

# 8. COMMAND/API READY DESIGN

Create service functions/endpoints around actions rather than UI-specific operations.

Examples:

```text
createTransaction()
updateTransaction()
deleteTransaction()

createGoal()
updateGoal()

createProject()
updateProject()

updateProfile()

createTrip()
addTripExpense()

updateCareer()

addSocialMetric()
```

Use clear validation and error handling.

The future AI should be able to call these operations safely.

---

# 9. PROFILE MANAGEMENT

Create a proper Profile section.

I should be able to edit:

```text
Name
Bio
Location
Profession
Skills
Website
GitHub
LinkedIn
YouTube
Instagram
Profile photo
Interests
```

Do not hardcode these values.

Create an admin/profile editor.

Example:

```text
PROFILE

Prem Ganesh

Flutter Developer
Engineer · Photographer · Rider · Creator

[Edit Profile]
```

---

# 10. CAREER / JOB MANAGEMENT

Create a career timeline.

Each employment record:

```text
Company
Role
Start date
End date
Location
Salary
Employment status
Technologies
Responsibilities
Achievements
Notes
```

I should be able to add a new job without changing source code.

Example:

```text
Career

Flutter Developer
Company A
2021 — 2026