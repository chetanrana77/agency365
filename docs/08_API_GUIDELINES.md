# 08_API_GUIDELINES.md — API Communication & Integration Guidelines

This document specifies integration methods for external services (Supabase Database, Google Gemini AI) and defines standard error handling protocols.

---

## 1. Network Request Design

### A. Non-Blocking Async Execution
All network calls (Supabase DB inserts, AI completions, token validations) must be asynchronous and non-blocking to the main UI thread.
- Use `async/await` syntax. Avoid raw promise chains.
- Maintain interface availability during API transactions. Displays must show loading states (e.g. `⏳ Generating…` text inside buttons).

### B. dynamic Imports for External SDKs
To prevent offline network drops from blocking application startup, import external scripts dynamically or handle failures gracefully:
```js
// Dynamic Supabase client load helper
export async function initSupabase() {
    if (!supabase) {
        try {
            const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
            supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (err) {
            console.error('Network error loading Supabase:', err);
        }
    }
}
```

---

## 2. Supabase Integration Rules

- **Zero Direct Deletions:** Never expose unrestricted database deletion methods. Always scope deletion commands using `eq('user_id', user.id)` alongside target keys.
- **Fail-Safe Fallbacks:** When a database request fails, the application must log the exception and maintain local state storage. Do not let database synchronization errors crash the user session.

---

## 3. Gemini AI API Integration

- **API Endpoint:** Calls must target the official Google Gemini endpoint using the current stable model (`gemini-2.0-flash-exp` or equivalent).
- **Format Enforcement:** AI prompts must explicitly demand JSON formatted outputs matching a strict JSON schema. The prompt must instruct the model to omit conversational prefixes or markdown block indicators (` ```json `).
- **Local Fallback:** If the API key is invalid or request limits are reached, the code must catch the exception, present a user-friendly log, and fall back to clean placeholder template states.
