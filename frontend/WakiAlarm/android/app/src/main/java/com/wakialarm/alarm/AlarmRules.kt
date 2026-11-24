package com.wakialarm.alarm

import java.util.Calendar
import java.util.Locale

/** A saved alarm's two trigger times in epoch milliseconds. Zero means "not scheduled". */
data class Schedule(val nextAt: Long, val snoozeAt: Long = 0L) {
    /** The earliest pending trigger, or zero when nothing will ring. */
    val due: Long
        get() = listOf(nextAt, snoozeAt).filter { it > 0 }.minOrNull() ?: 0L
}

/** Where the ringing sound comes from, in the order the service should try them. */
sealed interface AlarmSound {
    data class System(val uri: String) : AlarmSound
    object Bundled : AlarmSound
}

object AlarmRules {
    private const val EARLY_DELIVERY_TOLERANCE_MS = 1000L

    /** The next wall-clock occurrence of [time] after [now], in the device's current time zone. */
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
            val weekday = date.get(Calendar.DAY_OF_WEEK) - 1
            if (date.timeInMillis > now && (days.isEmpty() || weekday in days)) {
                return date.timeInMillis
            }
        }
        error("No next occurrence")
    }

    /**
     * Recomputes a saved schedule after a reboot, an app update, a permission grant or a clock change.
     *
     * A snooze keeps its absolute time because it means "ten minutes from when I tapped it".
     * Alarms mean a wall-clock time, so after a time-zone or clock change they are recomputed
     * from the new local time. A one-time alarm missed while the phone was off is dropped.
     */
    fun restored(
        time: String,
        days: List<Int>,
        current: Schedule,
        now: Long,
        clockChanged: Boolean,
    ): Schedule {
        val snoozeAt = if (current.snoozeAt > now) current.snoozeAt else 0L
        val nextAt = when {
            current.nextAt <= 0L -> 0L
            clockChanged || days.isNotEmpty() -> next(time, days, now)
            current.nextAt > now -> current.nextAt
            else -> 0L
        }
        return Schedule(nextAt, snoozeAt)
    }

    /**
     * The schedule after the alarm rings at [now], or null when the delivery is stale or early
     * (for example an old PendingIntent after the alarm was rescheduled).
     */
    fun afterRing(time: String, days: List<Int>, current: Schedule, now: Long): Schedule? {
        val due = current.due
        if (due <= 0L || due > now + EARLY_DELIVERY_TOLERANCE_MS) return null
        val nextAt = if (days.isEmpty()) 0L else next(time, days, now)
        return Schedule(nextAt)
    }

    /**
     * The phone's chosen alarm sound first, then the tone bundled in the APK. The bundled tone is
     * the fallback when the user picked "None", when the sound file is unreadable (for example
     * before the first unlock after a reboot), or when playback fails.
     */
    fun sounds(systemAlarmUri: String?): List<AlarmSound> =
        if (systemAlarmUri.isNullOrBlank()) listOf(AlarmSound.Bundled)
        else listOf(AlarmSound.System(systemAlarmUri), AlarmSound.Bundled)

    fun command(text: String): String? {
        val words = text.lowercase(Locale.ROOT)
            .replace(Regex("[^a-z ]"), " ")
            .trim()
            .replace(Regex("\\s+"), " ")
        // Match complete commands; do not interpret "don't stop" as stop.
        return when (words) {
            "stop", "stop alarm", "stop the alarm", "turn off the alarm", "dismiss", "stop please" -> "stop"
            "snooze", "snooze alarm", "snooze the alarm", "snooze please" -> "snooze"
            else -> null
        }
    }
}
