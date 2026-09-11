# Android alarm flow

The active mobile application is `frontend/WakiAlarm`. The older `frontend/src` tree is preserved source, not the build receiving the new native alarm implementation.

## Implemented

- Saving/enabling an alarm schedules it with Android AlarmManager after checking exact-alarm, notification, and full-screen access. Disabling/deleting cancels the device schedule. Failed native scheduling is reported, and retrying a newly saved alarm reuses its ID.
- The list distinguishes locally scheduled alarms from server records and reads local schedules when offline. Empty repeat days mean one occurrence.
- A foreground alarm service plays the system alarm tone, speaks a saved greeting with the selected pacing, then resumes ringing. It stops unattended playback after ten minutes.
- The native ringing screen and notification offer Stop/Snooze. “Speak a command” requests microphone permission and accepts explicit English stop/snooze commands. It does not continuously listen. Speech recognition availability/network requirements depend on the phone's recognition service; buttons remain available.
- Schedules and snooze timestamps are persisted. A boot/time-change receiver restores future schedules after unlock. One-time alarms are consumed when delivered; repeating alarms schedule their next occurrence. Missed occurrences while the phone was off are skipped. Signing out or changing accounts clears that account's local alarms.
- A new authenticated backend endpoint, `GET /api/ai/alarm-message`, prepares a greeting without changing time/weather facts. The greeting is generated when saving, not while ringing. Native TTS speaks the current device time and saved greeting. If preparation fails, a local greeting is saved. Edit/save an alarm to refresh its greeting after changing preferences.

This alarm flow uses Android TTS and speech recognition. The separate Vapi Chat screen remains unfinished and is not used to ring or snooze alarms.

## Verified on this computer

- Backend strict TypeScript build and 17 offline tests pass.
- Mobile TypeScript and lint checks on changed screens/services pass; 10 Jest tests pass.
- Android native compilation and 7 JVM alarm-rule tests pass.
- Debug APK packaging passes for arm64-v8a and x86_64.
- Metro Android JavaScript bundle generation passes.

No physical phone or emulator was connected. Audio, microphone recognition, lock-screen delivery, persistence across device reboot, and the live authenticated flow are **not yet device-verified**. The JVM tests cover recurrence/validation/command parsing; they do not simulate Android's process lifecycle.

## Connect and run

The debug APK is `frontend/WakiAlarm/android/app/build/outputs/apk/debug/app-debug.apk`. It requires Metro on this computer; it is not a standalone production release.

1. Connect the Android phone by USB, enable USB debugging, and accept the computer authorization on the phone.
2. From `frontend/WakiAlarm`, run `npm start` in a terminal.
3. With Android platform-tools on PATH, run:

   ```powershell
   adb devices
   adb reverse tcp:8081 tcp:8081
   adb reverse tcp:3000 tcp:3000
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. Open Waki. This checkout does not contain `android/app/google-services.json`, so it shows an account-setup screen with “Try the alarm.” Grant the requested Android alarm permissions, return, and retry. This preview rings and supports Stop/voice Stop; it intentionally does not schedule or snooze an alarm.
5. To test saved alarms, add the correct Firebase Android config for package `com.wakialarm` to `frontend/WakiAlarm/android/app/google-services.json`, enable the intended authentication provider, and rebuild. The Google Services plugin is applied when that file exists. The Firebase project must match the backend. Configure/start the backend using its setup instructions. The debug API URL is `http://127.0.0.1:3000`, reached over the USB reverse mapping. Release API requests fail explicitly until a verified URL is set in `src/config.ts`.

Firebase configuration setup: [official guide](https://firebase.google.com/docs/android/setup).

## Physical-device acceptance checks

For each check, record phone model, Android version, permissions, expected time, actual time, and result.

| Check | Expected result |
|---|---|
| Preview with network unavailable | Alarm tone, local greeting, and Stop button work |
| One-time alarm two minutes ahead | Rings at that local minute and does not recur next day |
| Screen locked; app backgrounded | Alarm screen/notification appears and audio plays |
| Tap Snooze | Audio stops, new timestamp persists, alarm rings again |
| Say “stop” or “snooze” after tapping Speak | Corresponding action occurs; unavailable mic/recognition leaves buttons usable |
| Say “don't stop” | Alarm is not dismissed |
| Close/reopen the app while snoozed | Snoozed timestamp is retained |
| Reboot and unlock before the next alarm | Future alarm/snooze is restored and fires |
| Disable or delete an alarm | No later ring from that alarm |
| Deny/revoke exact-alarm access | App does not claim the alarm is scheduled; restoring access and retrying works |
| Sign out/change accounts | Previous account's device alarms are cancelled |

Force-stop, reboot-before-first-unlock, Do Not Disturb, zero alarm volume, and manufacturer battery restrictions need explicit phone checks; none is covered by a passing compile. The current boot receiver runs after unlock and cannot ring while the phone is powered off.

Implementation references: [Android alarms](https://developer.android.com/develop/background-work/services/alarms), [full-screen alarm access](https://developer.android.com/about/versions/14/behavior-changes-14), [speech recognition](https://developer.android.com/reference/android/speech/SpeechRecognizer).
