

<!-- repository-guide:start -->
## Repository operating guide

Read README.md, LOG.md and FOUNDER.md first, then ARCHITECTURE.md and ROADMAP.md. Existing detailed product and verification instructions in this repository still apply.

### Working area

frontend/WakiAlarm: canonical React Native Android app; backend: Express/TypeScript API; website: Vite introduction; CONSOLIDATION.md: imported features and preserved sources; ANDROID-TESTING.md: device checklist.

### Setup and checks

Use [DEVELOPMENT.md](DEVELOPMENT.md) for the exact package directories and commands. Inspect package manifests before running commands. Use the existing lockfile; do not switch package managers or regenerate locks incidentally. Run checks appropriate to changed behavior and report failures honestly. A documentation check is not a product acceptance test.

### Boundaries

Use frontend/WakiAlarm, not the historical root React Native package or frontend package. Native alarm code and a debug APK exist; real-phone acceptance remains outstanding. Vapi conversation is unfinished. Do not equate provider configuration with a tested wake-up flow.

Preserve pre-existing user changes. Never put credentials, personal data, local databases or generated build output in commits. Do not run paid-provider calls, publish, deploy, push, or mutate real service data without task authorization.

### Compass handoff

Keep root LOG.md and FOUNDER.md. Under `## Status`, keep one-line bullets named `State`, `Live URL`, `Stranger test`, `Currently working on`, and `Blocked on investor`. Use state `active`, `parked`, or `dormant` according to product activity, not the age of a documentation edit. Use `nothing` when no user decision or input is required; engineering work belongs in current work/roadmap.

Before ending meaningful work, update status and prepend a `- YYYY-MM-DD: ...` entry under `## Session notes`, newest first. Include the change, checks actually run, and remaining work. Preserve historical entries and decisions. Never record secrets or personal transcripts in this file.
<!-- repository-guide:end -->
