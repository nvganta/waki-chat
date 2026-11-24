# First principles

## Person and moment
Someone who dislikes waking to a harsh alarm opens Waki before bed to set tomorrow's wake-up.

## Job and core loop
I set a wake-up time, it rings and speaks a greeting, so I can wake up and stop or snooze it.

An alarm's first job is to ring, every time. A delightful alarm that misses one morning is worse than a plain one, so reliability comes before the voice.

## What works today
The app is one account-free screen. It sets a single alarm through Android's `setAlarmClock`, which ignores Doze. The native code compiles, its JVM rule tests pass, and a debug APK builds. Those tests cover the next occurrence, daylight saving time, time-zone and clock changes, rescheduling after reboot, stale deliveries and the fallback tone choice. Alarms are stored in device-protected storage and the alarm components are direct-boot aware, so a reboot re-arms them before the first unlock. The phone's alarm sound falls back to a tone bundled in the APK, and a failed text-to-speech greeting leaves the sound ringing. Exact-alarm, notification and full-screen access are checked on the home screen and explained in plain words. The mocked React Native tests pass, the website builds, and the backend starts without provider keys.

None of this has run on a phone or emulator yet. No Android emulator image is installed on this computer, so delivery, the lock-screen takeover, audio and reboot behaviour are proven only in code and unit tests.

## Fake, broken, or distracting
The old website claimed calendar, weather and news briefings, cross-platform apps and hands-free voice control. Those claims are gone. Chat, journal, goals, analytics, settings and sign-in screens did not serve waking up; they and their Firebase, navigation and HTTP dependencies are deleted from the app. The backend's journal, goals, analytics and Vapi routes are kept as dormant code that the app never calls; they do not make the morning greeting better today. Voice selection and a real spoken briefing do not exist yet; the greeting is fixed text.

## Finished for this run
- A stranger can set one local alarm without an account, and sees in plain words if Android is blocking it.
- The alarm re-arms after reboot (including before first unlock), app update, force stop plus reopen, a new exact-alarm grant, and clock or time-zone changes.
- If the alarm sound or text-to-speech fails, the bundled tone still rings.
- Rule tests and a debug APK build pass on this computer.
- The website describes only what the app does.
- [DEVICE-TEST.md](DEVICE-TEST.md) is a short phone script with a pass/fail line per step.

Until that phone script passes, reliability is an engineering result, not a verified promise.
