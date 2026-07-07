# 04_AI_RULES.md — AI Agent Coding Mandates & Architecture Rules

This document specifies absolute, non-negotiable mandates for all artificial intelligence coding agents (such as Antigravity, Gemini, or Claude) editing this codebase.

---

## 1. The CTO Cardinal Rule

Before modifying any line of code, the AI agent must explain in its reasoning/response:
1. **WHY** the current implementation is wrong or inadequate.
2. **WHAT** architectural issue it causes.
3. **HOW** the proposed solution fixes it.
4. **WHY** this is the best long-term engineering approach.

> [!CRITICAL]
> Never sacrifice architectural health for short-term completion speed. Quick fixes or patches over patches are unacceptable.

---

## 2. Code Review & Dependency Mandates
- **Read the module:** Review the entire target Javascript module and its DOM hooks in the corresponding HTML file before writing code.
- **Identify side effects:** Explicitly trace what other pages are affected by changing the schema (e.g. changing fields inside `agency365_clients` will break rendering in `finance.js` and `dashboard.js`).
- **No placeholder implementations:** Write production-ready, completed functions. Never output comment blocks like `// TODO: Implement later`.

---

## 3. Engineering Violations Checklist
- **No inline styles for layouts:** New UI layout blocks must be styled in `mobile-overrides.css` using CSS classes, not dynamic style attributes.
- **No duplicate state variables:** Do not create separate variables for items that can be computed dynamically from the core data model.
- **Use `customConfirm` and `customPrompt`:** Standard browser `window.confirm()` and `window.prompt()` are strictly forbidden. Use the custom DOM modules declared in `app.js`.

---

## 4. RLS Configuration Mandates
- Every time a new table is proposed, corresponding RLS policies isolating users by `auth.uid() = user_id` must be explicitly specified in the database migration scripts.
- Never write select/insert/update/delete policies without RLS protection unless they utilize secure tokens.
