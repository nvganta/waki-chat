package com.wakialarm.alarm

import java.util.Calendar
import java.util.Locale

object AlarmRules {
    fun next(time: String, days: List<Int>, now: Long): Long {
        require(Regex("(?:[01][0-9]|2[0-3]):[0-5][0-9]").matches(time)) { "Invalid alarm time" }
        require(days.all { it in 0..6 }) { "Invalid repeat day" }
        val (hour, minute) = time.split(":").map { it.toInt() }
        for (offset in 0..7) {
            val date = Calendar.getInstance().apply {
                timeInMillis = now
                add(Calendar.DATE, offset)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            if (date.timeInMillis > now && (days.isEmpty() || date.get(Calendar.DAY_OF_WEEK) - 1 in days)) {
                return date.timeInMillis
            }
        }
        error("No next occurrence")
    }

    fun command(text: String): String? {
        val words = text.lowercase(Locale.ROOT).replace(Regex("[^a-z ]"), " ").trim().replace(Regex("\\s+"), " ")
        // Match complete commands; do not interpret 'don't stop' as stop.
        return when (words) {
            "stop", "stop alarm", "stop the alarm", "turn off the alarm", "dismiss", "stop please" -> "stop"
            "snooze", "snooze alarm", "snooze the alarm", "snooze please" -> "snooze"
            else -> null
        }
    }
}
