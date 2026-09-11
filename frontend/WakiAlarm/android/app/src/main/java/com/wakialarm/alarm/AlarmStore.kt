package com.wakialarm.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import org.json.JSONObject

class AlarmStore(private val context: Context) {
    private val prefs = context.getSharedPreferences("waki_alarms", Context.MODE_PRIVATE)
    private val manager = context.getSystemService(AlarmManager::class.java)
    fun allowed() = Build.VERSION.SDK_INT < 31 || manager.canScheduleExactAlarms()
    fun all(): List<JSONObject> = prefs.all.filterKeys { it.startsWith("alarm:") }.values.map { JSONObject(it as String) }
    fun setUser(user: String) {
        if (prefs.getString("user", "") != user || user.isEmpty()) clear()
        prefs.edit().putString("user", user).commit()
    }
    fun get(id: String): JSONObject? = prefs.getString("alarm:$id", null)?.let { JSONObject(it) }
    fun active(): JSONObject? = prefs.getString("active", null)?.let { JSONObject(it) }
    fun setActive(alarm: JSONObject?) { prefs.edit().apply { if (alarm == null) remove("active") else putString("active", alarm.toString()) }.commit() }
    private fun persist(alarm: JSONObject) { check(prefs.edit().putString("alarm:${alarm.getString("id")}", alarm.toString()).commit()) }
    private fun days(alarm: JSONObject) = alarm.getJSONArray("days").let { data -> (0 until data.length()).map { data.getInt(it) } }
    private fun pending(id: String): PendingIntent = PendingIntent.getBroadcast(context, 0,
        Intent(context, AlarmReceiver::class.java).setAction("ring").setData(Uri.parse("waki://alarm/${Uri.encode(id)}")).putExtra("id", id),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

    fun save(alarm: JSONObject): Long {
        require(alarm.getString("id").isNotBlank())
        require(alarm.optInt("snoozeDuration", 10) in 1..60)
        val next = AlarmRules.next(alarm.getString("time"), days(alarm), System.currentTimeMillis())
        if (alarm.getBoolean("enabled")) check(allowed()) { "Allow Alarms & reminders in Android settings, then retry." }
        alarm.put("nextAt", if (alarm.getBoolean("enabled")) next else 0L)
        alarm.remove("snoozeAt")
        persist(alarm)
        try { arm(alarm) } catch (error: Exception) {
            alarm.put("nextAt", 0L)
            persist(alarm)
            throw error
        }
        return alarm.getLong("nextAt")
    }

    private fun arm(alarm: JSONObject) {
        val id = alarm.getString("id")
        manager.cancel(pending(id))
        val next = alarm.optLong("snoozeAt", alarm.optLong("nextAt"))
        if (!alarm.getBoolean("enabled") || next <= 0) return
        check(allowed()) { "Exact alarm permission is missing" }
        val show = PendingIntent.getActivity(context, 0,
            context.packageManager.getLaunchIntentForPackage(context.packageName), PendingIntent.FLAG_IMMUTABLE)
        manager.setAlarmClock(AlarmManager.AlarmClockInfo(next, show), pending(id))
    }

    fun remove(id: String) {
        manager.cancel(pending(id)); prefs.edit().remove("alarm:$id").commit()
        if (active()?.optString("id") == id) { setActive(null); context.stopService(Intent(context, AlarmService::class.java)) }
    }
    fun clear() { all().forEach { remove(it.getString("id")) }; setActive(null); context.stopService(Intent(context, AlarmService::class.java)) }

    fun fire(id: String): JSONObject? {
        val alarm = get(id) ?: return null
        if (!alarm.getBoolean("enabled")) return null
        val due = alarm.optLong("snoozeAt", alarm.optLong("nextAt"))
        if (due > System.currentTimeMillis() + 1000 || due <= 0) return null
        val ringing = JSONObject(alarm.toString())
        alarm.remove("snoozeAt")
        val repeat = days(alarm)
        alarm.put("nextAt", if (repeat.isEmpty()) 0L else AlarmRules.next(alarm.getString("time"), repeat, System.currentTimeMillis()))
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
        alarm.put("snoozeAt", System.currentTimeMillis() + alarm.getInt("snoozeDuration") * 60000L)
        persist(alarm)
        try { arm(alarm) } catch (error: Exception) {
            alarm.remove("snoozeAt")
            persist(alarm)
            throw error
        }
        setActive(null)
    }

    fun restore() {
        if (!allowed()) return
        all().forEach { alarm ->
            val now = System.currentTimeMillis()
            if (alarm.optLong("snoozeAt") <= now) alarm.remove("snoozeAt")
            if (alarm.optLong("nextAt") > 0 && days(alarm).isNotEmpty()) {
                alarm.put("nextAt", AlarmRules.next(alarm.getString("time"), days(alarm), now))
            } else if (alarm.optLong("nextAt") <= now) alarm.put("nextAt", 0L)
            persist(alarm)
            arm(alarm)
        }
    }
}
