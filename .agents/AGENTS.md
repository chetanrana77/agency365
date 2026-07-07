# Agency365 Development Rules & Code Guidelines

All future development on this project must strictly comply with the documentation located in `/docs`. 

## ⚠️ Absolute Mandates for AI Agents

### 1. The Cardinal Architectural Rule
Before modifying any line of code in the repository, you must write a brief explanation in your response detailing:
1. **WHY** the current implementation is wrong or inadequate.
2. **WHAT** architectural issue it causes.
3. **HOW** the proposed solution fixes it.
4. **WHY** this is the best long-term engineering approach.

> [!CRITICAL]
> Never sacrifice architectural health for short-term completion speed. Quick fixes or patches over patches are unacceptable.

### 2. Development Guidelines
- Always read the entire related module (HTML and Javascript hooks) before making code edits.
- Keep UI layouts, business logic, and database sync separated.
- Consolidate duplicate logic. Do not duplicate arrays or structures.
- All new database tables must have Row-Level Security (RLS) configured in SQL.
- Always use `customConfirm` and `customPrompt` declared in `app.js` instead of the browser defaults.
- Keep page loads within 500ms by using lazy loading or dynamic imports.

---
*Refer to [00_START_HERE.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/00_START_HERE.md) for onboarding details.*
