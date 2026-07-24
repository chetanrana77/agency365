# Agency 365

Agency 365 is a CRM, Billing, and Operations platform for agencies.

## 🚨 Security Warning (MUST READ BEFORE DEPLOYMENT)
**Do NOT commit `.env` or `config.js` to version control.**

If you are seeing this, it means the application was recently audited for security.
The previous version of this codebase had the Supabase `SUPABASE_ANON_KEY` hardcoded into the source code, which meant it was exposed in Git history.

**ACTION REQUIRED:**
1. Go to your Supabase dashboard right now.
2. Under Project Settings > API, find your `anon` `public` key.
3. Because it was previously hardcoded in Git, you MUST **rotate** or recreate this key to invalidate the leaked version.
4. Add the new key to Vercel Environment Variables (`SUPABASE_URL` and `SUPABASE_ANON_KEY`).
5. Vercel's `build.sh` script will automatically generate `config.js` with your secrets during the build process, preventing them from entering the client bundle as hardcoded literals.

Failure to rotate the key could leave your database vulnerable if an attacker finds the old key in Git history.
