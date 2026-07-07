# Operational Protocols & Product Validation

*This document defines how Techmize operates Agency365 internally and how product decisions are made.*

## 1. Definition of Success
Our core metric is no longer "no bugs". 
Our metric is: **"Did Agency365 save Techmize time today?"**
If we build features to solve real problems encountered while running Techmize, we will end up with a product other agencies naturally want to buy.

## 2. Issue Categorization
All friction, requests, and bugs must be logged in GitHub Issues under the following strict categories:
- **🐞 Bug:** Something doesn't work.
- **💡 Improvement:** Works, but feels slow, confusing, or repetitive.
- **✨ Feature:** Something genuinely missing.
- **📐 Architecture:** Requires structural changes.
- **⚡ Performance:** Slow loading, large datasets, rendering issues.
- **🔒 Security:** Permissions, Authentication, Authorization.
- **📱 UX:** Navigation, Workflow, Forms, Search.

## 3. The Engineering Rule for Issues
Every issue discovered during operational validation MUST answer three questions before being closed:
1. **Root Cause:** Why did this happen?
2. **Immediate Fix:** What solves the current problem?
3. **Long-Term Solution:** What architectural change prevents this class of problem from recurring?
*We do not just fix bugs; we eliminate categories of bugs.*

## 4. Founder Journal
Every evening, the Founder (Chetan) must answer these five questions:
1. What frustrated me today?
2. What took longer than expected?
3. What feature did I instinctively look for?
4. What workflow felt amazing?
5. If I could change one thing tomorrow, what would it be?

## 5. Weekly Product Reviews
**Schedule:** Every Sunday evening (30–60 minutes).
**Focus:** Metrics & Decisions, not Code.
**Agenda:**
- **Product:** What users loved, ignored, or what caused friction.
- **Engineering:** Tech debt created/removed, architecture decisions.
- **Business:** Did it save time? Close deals faster? Improve communication?
- **Roadmap:** What moves to next week, gets postponed, or rejected.

---
*No feature is added because it is a "good idea". It is added because Techmize **needs it**.*
