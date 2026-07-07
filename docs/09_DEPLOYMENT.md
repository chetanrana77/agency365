# 09_DEPLOYMENT.md — Hosting & Live Deployment Procedures

This document outlines the deployment environments, custom domain mappings, and DNS configurations of **Agency365**.

---

## 1. Hosting Architecture

Agency365 is a static web application. It requires zero active server instances (like Node.js, Python, or Ruby) on the hosting provider.

### Target Platforms:
- **GitHub Pages:** Free, easy static hosting directly integrated with the repository.
- **Vercel (Recommended):** High-speed serverless deployment, offering automated Git-trigger previews, edge caching, and free SSL certificate generation.

---

## 2. GitHub & Vercel Sync Flow

The repository is integrated with Vercel's automated git-hook deployment:

1. **Local Commit:** Run local Git commands to stage and commit changes:
   ```bash
   git add .
   git commit -m "commit message"
   ```
2. **Push to Remote:** Push changes to GitHub:
   ```bash
   git push origin main
   ```
3. **Automated Deployment:** Vercel detects changes in the `main` branch, pulls the code, and redeploys the live site in under 20 seconds.

---

## 3. Custom Domain Configurations

Our active production URL is **`365.techmize.in`**.

To map this subdomain, the following DNS records are configured with our domain registrar:

| Record Type | Host / Name | Target Value | TTL |
|-------------|-------------|--------------|-----|
| `CNAME` | `365` | `cname.vercel-dns.com` | Automatic |

Vercel automatically detects this CNAME pointer, routes requests to the project build, and issues a free Let's Encrypt SSL certificate.
