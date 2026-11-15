# GitHub Copilot & Agent Instructions

## Coding & Product Architecture

1. **Propose the Optimum Modern Solution (No Legacy Patchwork):**
   - Do **not** artificially restrict yourself to "minimum lines changed" when doing so would bolt extra buttons, panels, modals, or brittle workarounds onto an outdated workflow or UI.
   - You have full freedom—and are actively expected—to suggest the **optimum modern, AI-native way** to carry out the user's intention (e.g. multimodal AI workflows, zero-friction UX, calm progressive disclosure, semantic/conversational search, and clean modern architecture).
   - When there is a choice between a narrow legacy patch and a cleaner modern design, present the trade-offs clearly and recommend the strongest modern approach.

2. **Plan First & Zero Silent Breaking Changes:**
   - Research the codebase and present a clear plan for approval before modifying application code.
   - **Never silently break, drop, or regress existing functionality, APIs, or cross-repo compatibility.**
   - If the optimum modern design replaces, consolidates, or retires an older UI pattern, workflow, or data field, **explicitly tell the user up front** what existing behaviour will change and how backward compatibility is preserved, then wait for approval before executing.
   - If unexpected blockers or scope changes arise during execution, pause, report the findings and options factually, and confirm before diverging from the agreed plan.

3. **Trace Full Data Flows Before Proposing Changes:**
   - **Before proposing any feature or fix that displays, transforms, or integrates data:** trace the full data flow first—read both the **write path** and **read path** across backend, web, mobile, and shared collections.
   - Confirm exact stored field names, IDs, labels, and values directly in code. Never assume or guess data shapes.

4. **Multi-Tenant & Firebase Rule Safety by Default:**
   - Respect at all times that this repository operates inside a shared **multi-tenant ecosystem** (`lock-4ff2a`) spanning `Lock`, `smartbins-rollout`, `smartbin-devicemanager`, `smartbin-android-app`, `binbot-sms-bridge`, `binsight`, `LOCK-ASSET`, and hardware/firmware services.
   - **NEVER modify or deploy `firestore.rules`, `storage.rules`, or `firestore.indexes.json`** unless explicitly instructed by the user.
   - Preserve tenant and user privacy boundaries and never mutate shared collections owned by sibling apps without explicit approval.

## Git, Merging & Pull Request Rules
- **NEVER merge branches locally** (`git merge` / `git rebase` prohibited). Only commit and push feature branches; all merges happen via GitHub Pull Request.
- **Pull Request Titles:** Always use the exact branch name verbatim as the PR title.
- **Pre-Commit Functionality Check:** Before committing, summarise every changed file and verify no existing functionality outside the approved plan was removed or regressed.

## Shared Backend & Firebase Rules (Multi-Tenant Guardrails)
This ecosystem shares multi-tenant Firebase infrastructure (`lock-4ff2a`) across multiple web, mobile, bridge, and hardware repositories (including `Lock`, `smartbins-rollout`, `smartbin-devicemanager`, `smartbin-android-app`, `binbot-sms-bridge`, `binsight`, `LOCK-ASSET`, and firmware/provisioning tools).

1. **NEVER modify or deploy database (`firestore.rules`), storage (`storage.rules`), or indexes (`firestore.indexes.json`)** from this repository unless you have been given explicit, direct instructions from the user to modify and deploy the rules.
2. **If deploying frontend/hosting changes**, always use targeted deployment flags to prevent overwriting rules or indexes:
   `firebase deploy --only hosting` (or other target-specific flags, avoiding general `firebase deploy`).
3. **If you must modify rules** (only when explicitly instructed), first verify compatibility across all connected tenant apps, resident portals, admin consoles, SMS/WhatsApp bridges, and IoT/firmware clients.
