# Waki

Waki is an Android alarm prototype for someone who wants a spoken greeting when they wake. Set a time on the phone; it rings with your alarm sound (or a built-in tone if that can't play), says the time and a short greeting with text-to-speech, and offers Stop, a ten-minute Snooze, and tap-to-speak commands when speech recognition is available. Alarms survive a reboot, even before the first unlock, and keep their clock time across time-zone and daylight saving changes. It has not yet been validated on a real phone and should not be your only alarm.

## Run locally

You need Node 20+, Java 17, Android Studio's SDK and an Android device or emulator. From the repository root:

```powershell
npm ci --cache .npm-cache --prefix frontend/WakiAlarm
npm start --prefix frontend/WakiAlarm
```

In another terminal run `npm run android --prefix frontend/WakiAlarm`. For a standalone APK that runs without Metro, see [ANDROID-TESTING.md](ANDROID-TESTING.md). Allow Android's alarm and notification permissions when prompted. The local alarm does not need Firebase or the backend. Android setup and debug APK details are in [ANDROID-TESTING.md](ANDROID-TESTING.md); follow [DEVICE-TEST.md](DEVICE-TEST.md) to record phone results. Build and installation may take longer than five minutes on a fresh Android toolchain.

The separate backend and website remain in this repository; the app's local alarm does not call paid providers. See [DEVELOPMENT.md](DEVELOPMENT.md) for their commands. Vapi conversation and briefings are not part of this alarm flow.

<!-- repository-guide:start -->
## Repository guide

- [Agent instructions](AGENTS.md)
- [Founder mission](FOUNDER.md)
- [Current status and session history](LOG.md)
- [Architecture](ARCHITECTURE.md)
- [Roadmap](ROADMAP.md)
- [Setup and verification](DEVELOPMENT.md)
<!-- repository-guide:end -->
