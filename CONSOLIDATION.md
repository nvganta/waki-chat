# Waki consolidation

Canonical application: Waki. Mobile app: `frontend/WakiAlarm`. Backend: `backend`. Concept website: `website`.

## Incorporated

- WakeUpChat's gentle/moderate/assertive wake-up pacing is now selectable in Settings, accepted/validated by the preferences API, persisted for new/existing users, and used by the wake-up message generator. Existing preferences default to moderate.
- AlarmChat's website, artwork, and visual direction are now the `website` surface of this project. Unsupported download/adoption claims were removed and the site is labeled a concept preview.
- Both inherited frontend source trees received the preference change to avoid divergence during cleanup.

## Verification

Backend build passes with strict TypeScript checks unchanged. All 17 offline regression tests pass, including pacing, preferences, journal queries, call control, and stop/snooze recognition. The 64 inherited TypeScript diagnostics have been resolved.

The website production build and desktop/mobile browser checks passed in the earlier consolidation pass. Native device behavior and live provider integration have not been tested. A clean backend build does not establish an end-to-end working alarm.

## Preserved and pending

Original sources: [WakeUpChat](../../Archive/Consolidation%20Sources/waki-chat/wakeupchat) and [AlarmChat](../../Archive/Consolidation%20Sources/waki-chat/alarmchat).

Keep WakeUpChat's document-context and calendar concepts for a later coherent implementation. Do not import its in-memory alarm store, simulated calendar, or logging-only LiveKit dispatch as working features. Reliable device alarms, snooze across restart, background/locked-screen delivery, and provider setup still need engineering and device tests. Compare the duplicated frontend trees before removing either.

## Commands

- Website: `cd website`, `npm ci`, `npm run dev`.
- Backend checks: from the repository root, `npm test --prefix backend` builds the backend and runs all 17 tests. Verified with Node 25.8.1; tests use compiled JavaScript.
- Follow the original README for mobile/backend setup, with the integration notes below.

## Backend repair — 2026-09-10

- Completed response return paths, retained the four-argument Express error handler, and removed unused imports/parameters without weakening compiler settings.
- Updated Weaviate inserts, typed collections, account-scoped filters, newest-first sorting, and grouped mood aggregation to the installed SDK.
- Updated Vapi construction and voice/model configuration. Outbound calls require `VAPI_PHONE_NUMBER_ID` for the configured calling number; the recipient goes in `customer.number`. The Friendli base URL and model come from `FRIENDLI_ENDPOINT` and `FRIENDLI_MODEL`. Configure the custom-LLM credential in Vapi separately; the backend Friendli key is not copied into assistant definitions.
- Call termination uses the provider's live control URL and reports failures. Transcripts come from call artifacts. Reference: [Vapi live call control](https://docs.vapi.ai/calls/call-features).
- Web-call preparation now returns only an `assistantId`, removing a fabricated embed URL. Each preparation creates a dedicated assistant instead of rewriting shared personal context. This does not start audio. The inherited ChatScreen still needs a media SDK, actual call IDs, event-driven status, and transcript lifecycle wiring. Assistant cleanup and per-user call ownership also remain to be implemented before exposing live calls.
- Added Friendli response validation and finite statistics for empty voice journals.

Tests replace external dependencies explicitly. No real provider calls, phone calls, cloud schema changes, or device tests were performed. Server startup still requires configured Firebase/OpenAI/Friendli services. Semantic search requires a suitable Weaviate vectorizer. Next: implement and verify the mobile alarm-to-audio-to-snooze/stop loop, including restart and locked-screen behavior.


## Android alarm implementation — 2026-09-10

The canonical `frontend/WakiAlarm` now connects alarm saves/cancellation to Android's scheduler, persists snooze, restores future schedules after boot/unlock, plays a saved personalized greeting through native TTS, and provides native Stop/Snooze plus tap-to-speak commands. The old `frontend/src` tree is retained as legacy source and was not extended with a second native implementation.

Verification: 17 backend tests, 10 mobile tests, and 7 native JVM alarm-rule tests pass; mobile TypeScript and changed-file lint pass. Android compilation and debug APK packaging pass. See [ANDROID-TESTING.md](ANDROID-TESTING.md) for the build, scope, and physical-device checks. There is no connected phone/emulator and no Firebase Android config in this checkout. Locked-screen audio, reboot persistence, live recognition, and the authenticated flow still need device validation. The Vapi chat pipeline remains separate and unfinished.
