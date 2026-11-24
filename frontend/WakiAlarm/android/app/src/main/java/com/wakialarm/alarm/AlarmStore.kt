package com.wakialarm.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.os.UserManager
import org.json.JSONObject

/**
 * Saved alarms and the AlarmManager entries that ring them.
 *
 * The data lives in device-protected storage so the receiver can read and re-arm alarms after
 * LOCKED_BOOT_COMPLETED, before the user has unlocked the phone for the first time.
 */
class AlarmStore(context: Context) {
    private val context = context.applicationContext ?: context
    private val prefs = deviceStorage(this.context).getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private val manager = this.context.getSystemService(AlarmManager::class.java)

    fun allowed() = Build.VERSION.SDK_INT < 31 || manager.canScheduleExactAlarms()

    fun all(): List<JSONObject> =
        prefs.all.filterKeys { it.startsWith(ALARM_PREFIX) }.values.map { JSONObject(it as String) }

    fun get(id: String): JSONObject? = prefs.getString(ALARM_PREFIX + id, null)?.let { JSONObject(it) }

    fun active(): JSONObject? = prefs.getString(ACTIVE, null)?.let { JSONObject(it) }

    fun setActive(alarm: JSONObject?) {
        val editor = prefs.edit()
        if (alarm == null) {
            editor.remove(ACTIVE)
        } else {
            if (!alarm.has(RINGING_AT)) alarm.put(RINGING_AT, System.currentTimeMillis())
            editor.putString(ACTIVE, alarm.toString())
        }
        editor.commit()
    }

    /** A reboot kills a ringing alarm without running its cleanup; forget it so it cannot block Stop. */
    fun clearRingingFromBeforeBoot() {
        val bootedAt = System.currentTimeMillis() - SystemClock.elapsedRealtime()
        if ((active()?.optLong(RINGING_AT) ?: Long.MAX_VALUE) < bootedAt) setActive(null)
    }

    fun save(alarm: JSONObject): Long {
        require(alarm.getString("id").isNotBlank())
        require(alarm.optInt("snoozeDuration", 10) in 1..60)
        val enabled = alarm.getBoolean("enabled")
        val next = AlarmRules.next(alarm.getString("time"), days(alarm), System.currentTimeMillis())
        if (enabled) check(allowed()) { "Allow Alarms & reminders in Android settings, then retry." }
        write(alarm, Schedule(if (enabled) next else 0L))
        persist(alarm)
        try {
            arm(alarm)
        } catch (error: Exception) {
            write(alarm, Schedule(0L))
            persist(alarm)
            throw error
        }
        return alarm.getLong(NEXT_AT)
    }

    fun remove(id: String) {
        manager.cancel(pending(id))
        prefs.edit().remove(ALARM_PREFIX + id).commit()
        if (active()?.optString("id") == id) {
            setActive(null)
            context.stopService(Intent(context, AlarmService::class.java))
        }
    }

    /** Marks the alarm as ringing and arms its next occurrence. Returns null for stale deliveries. */
    fun fire(id: String): JSONObject? {
        val alarm = get(id) ?: return null
        if (!alarm.getBoolean("enabled")) return null
        val now = System.currentTimeMillis()
        val after = AlarmRules.afterRing(alarm.getString("time"), days(alarm), schedule(alarm), now)
            ?: return null
        val ringing = JSONObject(alarm.toString()).put(RINGING_AT, now)
        write(alarm, after)
        persist(alarm)
        arm(alarm)
        setActive(ringing)
        return ringing
    }

    fun snooze(id: String) {
        val ringing = active() ?: error("No ringing alarm")
        check(ringing.getString("id") == id)
        check(ringing.getBoolean("snoozeEnabled")) { "Snooze is disabled" }
        check(allowed()) { "Exact alarm permission is missing" }
        val alarm = get(id) ?: error("Alarm was removed")
        val before = schedule(alarm)
        val snoozeAt = System.currentTimeMillis() + alarm.getInt("snoozeDuration") * 60_000L
        write(alarm, before.copy(snoozeAt = snoozeAt))
        persist(alarm)
        try {
            arm(alarm)
        } catch (error: Exception) {
            write(alarm, before)
            persist(alarm)
            throw error
        }
        setActive(null)
    }

    /** Re-arms every saved alarm. Safe to call repeatedly. */
    fun restore(clockChanged: Boolean = false) {
        if (!allowed()) return
        val now = System.currentTimeMillis()
        all().forEach { alarm ->
            val schedule = AlarmRules.restored(
                alarm.getString("time"),
                days(alarm),
                schedule(alarm),
                now,
                clockChanged,
            )
            write(alarm, schedule)
            persist(alarm)
            arm(alarm)
        }
    }

    private fun arm(alarm: JSONObject) {
        val id = alarm.getString("id")
        manager.cancel(pending(id))
        val due = schedule(alarm).due
        if (!alarm.getBoolean("enabled") || due <= 0) return
        check(allowed()) { "Exact alarm permission is missing" }
        val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val show = PendingIntent.getActivity(context, 0, launch, PendingIntent.FLAG_IMMUTABLE)
        // setAlarmClock is exempt from Doze and shows the alarm icon in the status bar.
        manager.setAlarmClock(AlarmManager.AlarmClockInfo(due, show), pending(id))
    }

    private fun pending(id: String): PendingIntent {
        val intent = Intent(context, AlarmReceiver::class.java)
            .setAction(AlarmReceiver.ACTION_RING)
            .setData(Uri.parse("waki://alarm/${Uri.encode(id)}"))
            .putExtra("id", id)
        return PendingIntent.getBroadcast(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    private fun persist(alarm: JSONObject) {
        check(prefs.edit().putString(ALARM_PREFIX + alarm.getString("id"), alarm.toString()).commit())
    }

    private fun days(alarm: JSONObject): List<Int> {
        val data = alarm.getJSONArray("days")
        return (0 until data.length()).map { data.getInt(it) }
    }

    private fun schedule(alarm: JSONObject) =
        Schedule(alarm.optLong(NEXT_AT), alarm.optLong(SNOOZE_AT))

    private fun write(alarm: JSONObject, schedule: Schedule) {
        alarm.put(NEXT_AT, schedule.nextAt)
        if (schedule.snoozeAt > 0) alarm.put(SNOOZE_AT, schedule.snoozeAt) else alarm.remove(SNOOZE_AT)
    }

    companion object {
        private const val PREFS = "waki_alarms"
        private const val ALARM_PREFIX = "alarm:"
        private const val ACTIVE = "active"
        private const val NEXT_AT = "nextAt"
        private const val SNOOZE_AT = "snoozeAt"
        private const val RINGING_AT = "ringingAt"

        @Volatile private var migrated = false

        private fun deviceStorage(context: Context): Context {
            val storage = context.createDeviceProtectedStorageContext()
            val unlocked = context.getSystemService(UserManager::class.java).isUserUnlocked
            if (!migrated && unlocked) {
                // Builds before direct-boot support saved alarms in credential storage.
                storage.moveSharedPreferencesFrom(context, PREFS)
                migrated = true
            }
            return storage
        }
    }
}
