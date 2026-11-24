# Android alarm flow

The app is `frontend/WakiAlarm`. It has one screen: pick a time, tap Set alarm, and the phone rings at that time with a spoken greeting. No account, no backend and no network are needed. The older `frontend/src` tree is preserved source and is not built.

## How the alarm works

- **Scheduling.** Set alarm stores the alarm on the phone and hands it to Android with `AlarmManager.setAlarmClock`. That is the API the system clock app uses: it ignores Doze and battery saver and shows the alarm icon in the status bar.
- **Exact-alarm access.** On Android 13 and later the app declares `USE_EXACT_ALARM`, which alarm-clock apps receive at install and which cannot be revoked. On Android 12 and 12L it uses `SCHEDULE_EXACT_ALARM`, which the user can turn off. If it is off, the home screen says so in plain words with an Open settings button, and the app never reports an alarm as scheduled. Granting it again re-arms saved alarms.
- **Notifications and full-screen alarms.** The ringing screen is shown through a full-screen notification, so the app asks for notifications (Android 13+) when you first tap Set alarm, and checks full-screen alarm access (Android 14+). The microphone is asked for only when you tap Speak a command while it rings.
- **Ringing.** A foreground service plays your phone's alarm sound. If that sound is set to None, cannot be read, or fails while playing, it plays a tone bundled in the app instead. After a couple of seconds the phone's text-to-speech says the time and "Good morning. Time to wake up." and then the sound resumes. If text-to-speech is missing or fails, the sound just keeps going. Unattended ringing stops after ten minutes.
- **Stop, Snooze, Speak.** The ringing screen and the notification have Stop and a ten-minute Snooze. Speak a command listens once for an exact English "stop" or "snooze". Phrases like "don't stop" are ignored.
- **Reboot.** Alarms live in device-protected storage and the alarm components are direct-boot aware, so after `LOCKED_BOOT_COMPLETED` the alarm is re-armed and can ring even if nobody has unlocked the phone since the restart. Before that first unlock the phone's own alarm sound and text-to-speech may be unavailable, in which case you hear the bundled tone. A one-time alarm that came due while the phone was off is dropped; a repeating one moves to its next day.
- **Clock and time-zone changes.** On `TIME_SET` and `TIMEZONE_CHANGED` every alarm is recomputed for its wall-clock time in the new local time, so 07:00 stays 07:00 after you fly or after daylight saving time changes. A pending snooze keeps its absolute time.
- **Force stop.** Android cancels every alarm of a force-stopped app. Opening Waki again re-arms them.

## Checks on this computer

`frontend/WakiAlarm/android/gradlew.bat :app:testDebugUnitTest :app:assembleDebug` runs the JVM rule tests (next occurrence, daylight saving time, time-zone changes, reboot rescheduling, stale deliveries, fallback tone choice, voice commands) and builds the debug APK. They do not simulate Android's process lifecycle, so the phone script still matters. LOG.md has the dated results.

## Install on a phone

The debug APK (`frontend/WakiAlarm/android/app/build/outputs/apk/debug/app-debug.apk`) loads its JavaScript from Metro on this computer. The release APK (`.../apk/release/app-release.apk`, built with `gradlew.bat :app:assembleRelease`; add `-PreactNativeArchitectures=arm64-v8a` for a faster build that covers almost every current phone) contains everything and runs without the computer. It is signed with the public debug key, so it is for testing only. Use the release APK for the phone script, because the reboot step needs the app to open without a USB cable.

1. On the phone, enable Developer options and USB debugging, connect it by USB and accept the prompt.
2. From `frontend/WakiAlarm`, with Android platform-tools on PATH:

   ```powershell
   adb devices
   adb install -r android/app/build/outputs/apk/release/app-release.apk
   ```

3. Open Waki and follow [DEVICE-TEST.md](DEVICE-TEST.md).

To watch what the alarm does, run `adb logcat -s WakiAlarm` while testing. Every broadcast, ring, ignored stale delivery and sound choice is logged under that tag.

For the debug APK instead, run `npm start` in `frontend/WakiAlarm`, then `adb reverse tcp:8081 tcp:8081` before opening the app.

References: [Android alarms](https://developer.android.com/develop/background-work/services/alarms), [direct boot](https://developer.android.com/privacy-and-security/direct-boot), [full-screen intents on Android 14](https://developer.android.com/about/versions/14/behavior-changes-14).
