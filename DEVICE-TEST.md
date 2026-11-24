# Waki phone test

About fifteen minutes, ten of which is waiting for the snooze. Keep your normal alarm set as well; Waki has not passed this test yet.

Before you start: install the release APK as described in [ANDROID-TESTING.md](ANDROID-TESTING.md), turn the alarm volume up, and turn Do Not Disturb off. If a computer is handy, run `adb logcat -s WakiAlarm` and keep the output.

Phone model: ________ Android version: ________ Date: ________

| # | Step | What should happen | Pass / fail |
|---|---|---|---|
| 1 | **First run.** Open Waki. | One screen with a wake-up time and Set alarm. No sign-in. If Android is blocking exact alarms, a box explains it in plain words with Open settings. | |
| 2 | **Set alarm.** Choose a time three minutes from now and tap Set alarm. Allow notifications if asked. | "Scheduled for" shows the time you chose. The status bar shows an alarm icon. | |
| 3 | **Lock.** Lock the phone. | Nothing yet. | |
| 4 | **Reboot.** Restart the phone right away. When it comes back, leave it at the lock screen and do not unlock it. | The phone boots to the lock screen. | |
| 5 | **Wait and wake.** Wait for the alarm time without touching the phone. | At the chosen minute the screen lights up with the Waki alarm screen over the lock screen and a sound plays. Before the first unlock this may be Waki's own beeping tone rather than your usual alarm sound. A spoken greeting may be missing until you have unlocked once; the sound must still play. | |
| 6 | **Snooze.** Tap Snooze 10 minutes. | The sound stops at once. | |
| 7 | **Unlock and check.** Unlock the phone and open Waki. | "Scheduled for" shows a time ten minutes after you tapped Snooze. | |
| 8 | **Second ring.** Lock the phone and wait ten minutes. | It rings again, and this time it says the time and "Good morning. Time to wake up." | |
| 9 | **Talk back.** Tap Speak a command, allow the microphone, and say "stop". | The alarm stops. If your phone has no speech recognition, the screen says so; use Stop and note it here. | |
| 10 | **Nothing left over.** Open Waki. | "No alarm scheduled yet." The one-time alarm is used up. | |

Write down the actual times and anything odd, such as a delay, no sound, or the alarm showing only as a notification.

Separate checks for later, each needing its own alarm: change the time zone in Settings with an alarm set (the alarm should keep its clock time), force-stop Waki from App info and then open it again (the alarm should be re-armed), and, on phones from Xiaomi, Oppo, Vivo, OnePlus, Samsung and similar, try once with the battery saver on, because some of them block alarms from apps that are not whitelisted.
