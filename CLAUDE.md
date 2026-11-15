## Startup
Before pulling any repo, you must first complete safety checks for local edits on each repo:
1. Check for uncommitted changes (staged or unstaged) using `git status`.
2. Check for an upstream tracking branch. If no upstream tracking branch is configured, treat this as unpushed work and stop for user guidance.
3. Check for commits that have been made locally but not yet pushed to the remote using `git log @{u}..HEAD`.

If any repo has uncommitted changes or unpushed commits, do NOT pull that repo. Instead, summarise the local edits found (listing files changed and a brief description of what the changes represent), then stop and ask the user what they want to do with them before proceeding.

After completing the safety checks above and confirming there are no uncommitted or unpushed changes, pull the following repos to ensure they are up to date:
Lock_Android
Then output the active branch in that repo and any open pull requests summarising whether they are ahead or behind the active branch, that is to say the active local branch on the pc running claude code.
List all open branches for each repo with their last commit date. Use `git branch -a` to list BOTH local and remote branches. For each local branch, check whether its remote tracking branch still exists (i.e. whether the remote was deleted after a merge). If a local branch has no corresponding remote branch, warn the user that it is orphaned and may be safe to delete.

All repos are in `C:\Users\Conor\Documents\GitHub` (local PC) or `/home/antigravity/conormcelvaney` (Antigravity Remote Conversations).

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

## Committing

When given the commit command, before committing you must:

1. Generate a clear summary of all changes being committed, listing every file changed and what was changed in each.

2. Perform a functionality check: diff the staged changes against the previous commit and verify that no functionality present in the previous commit has been removed or broken that falls outside the scope of the agreed plan. If any such functionality loss is detected, stop and report it to me before proceeding with the commit.

3. Once approved and committed, push only the repositories that have current edits to their remote origins. If the user instructs you to commit a single repo, then only consider that repo. The full list of repositories is:
- Lock_Android

All repos are in `C:\Users\Conor\Documents\GitHub` (local PC) or `/home/antigravity/conormcelvaney` (Antigravity Remote Conversations).

## Merging

**NEVER merge branches locally.** This is a hard rule with no exceptions.

- Only commits and pushes to remote are permitted locally.
- All branch merges must be performed manually on the remote via Pull Request (e.g., GitHub PR).
- Do not run `git merge`, `git rebase` to incorporate another branch, or any equivalent command that merges branches locally.
- If a merge is needed, stop, push the current branch, and instruct the user to complete the merge via a Pull Request on the remote.

## Pull Requests

When creating a pull request, always use the branch name as the PR title. Do not paraphrase, reword, or summarise — the PR title must match the branch name exactly.

## Shared Backend & Firebase Rules (Multi-Tenant Guardrails)
This ecosystem shares multi-tenant Firebase infrastructure (`lock-4ff2a`) across multiple web, mobile, bridge, and hardware repositories (including `Lock`, `smartbins-rollout`, `smartbin-devicemanager`, `smartbin-android-app`, `binbot-sms-bridge`, `binsight`, `LOCK-ASSET`, and firmware/provisioning tools).

1. **NEVER modify or deploy database (`firestore.rules`), storage (`storage.rules`), or indexes (`firestore.indexes.json`)** from this repository unless you have been given explicit, direct instructions from the user to modify and deploy the rules.
2. **If deploying frontend/hosting changes**, always use targeted deployment flags to prevent overwriting rules or indexes:
   `firebase deploy --only hosting` (or other target-specific flags, avoiding general `firebase deploy`).
3. **If you must modify rules** (only when explicitly instructed), first verify compatibility across all connected tenant apps, resident portals, admin consoles, SMS/WhatsApp bridges, and IoT/firmware clients.
