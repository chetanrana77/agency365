# 01_PRODUCT.md — Product Scope & Requirements

This document defines the core product modules, feature scopes, and operational workflows of **Agency365**.

---

## 1. Core Modules

### A. Client Command Center (`client-detail.html`)
The main working cockpit for individual client management. Serves as a 360-degree overview.
- **Overview Tab:** Contract amounts, accumulated payments, open tasks, general progress gauges, and metadata settings.
- **Meetings Tab:** Complete list of scheduled, completed, and canceled meetings. Includes attendee lists, agenda, notes, and call recording links.
- **Work Updates Tab:** Chronological logs of work completed, divided into four categories: `Done`, `In-Progress`, `Milestone`, and `Blocked`.
- **Communication Tab:** Consolidated history of all notes, emails, phone calls, and WhatsApp messages exchanged.
- **Finance Tab:** Invoices list, raw transactions registry (payments received / expenses logged), and custom payment milestones.
- **Suggestions Box:** Dynamic dashboard listing upsell offers recommended to the account manager based on client engagement metadata.

### B. Lead Pipeline & CRM (`crm.html`)
Deals and prospective clients tracker. Holds raw records with `status = 'Lead'`.
- Pipeline states matching standard sales processes.
- Fields for client source, referral attribution, follow-up dates, lead confidence scales, and project scope notes.
- One-click transformation: converts a `Lead` into an `Active` client, maintaining all historic notes and transition events.

### C. Resource Planner & Calendar (`calendar.html`)
A unified scheduling grid using FullCalendar library integration.
- Syncs standalone calendar events, scheduled client meetings, and project tasks containing a `dueDate`.
- Support for dragging and dropping items to dynamically reschedule.

### D. Document Builder & Billing (`proposals.html`, `finance.html`, `invoice.html`, `proposal-detail.html`)
- **Proposals Builder:** Create professional multi-item service estimates, applying dynamic discounts, tax calculations, and printable styling themes.
- **Billing Ledger:** Central table showing total due payments across all active clients, standalone operating expenses registry, and profit-and-loss overview.
- **Print Engine:** Custom print-ready invoice formats (A4 layout templates) populated dynamically from client data.

### E. Integrations & Portals (`onboarding.html`, `portal.html`)
- **Self-Onboarding Form:** A public step-by-step form where clients input company details, contact records, and project scopes.
- **Customer Portal:** Secure read-only dashboard allowing clients to see project progress, payment states, and work timelines without auth credentials.

---

## 2. Target Users & Roles
- **Admin/Owner:** Full read/write access. Permissions to manage Billing, Settings, and Team access lists.
- **Manager:** Full read/write access to clients, calendar, CRM, and proposals. Read-only access to Settings and team invite lists. No access to financial/payment ledgers.
- **Member:** Read/write access to client work updates, meetings logging, and communications notes. Read-only access to all other modules.

---

## 3. Product Success Metrics
1. **Zero Data Loss:** Fail-safe local cache updates when internet connectivity drops.
2. **Reliable Billing:** Complete consistency between client contracts, payments, and generated invoices.
3. **High Performance:** Dashboards load within 1.5 seconds even with thousands of database rows.
