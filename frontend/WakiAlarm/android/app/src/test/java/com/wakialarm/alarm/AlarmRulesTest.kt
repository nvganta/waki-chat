package com.wakialarm.alarm

import org.junit.Assert.*
import org.junit.Test
import java.util.Calendar

class AlarmRulesTest {
    private fun date(day: Int, hour: Int, minute: Int) = Calendar.getInstance().apply {
        clear(); set(2026, Calendar.SEPTEMBER, day, hour, minute)
    }.timeInMillis

    @Test fun oneTimeAlarmUsesTodayOrTomorrow() {
        assertEquals(date(10, 8, 0), AlarmRules.next("08:00", emptyList(), date(10, 7, 0)))
        assertEquals(date(11, 8, 0), AlarmRules.next("08:00", emptyList(), date(10, 8, 0)))
    }
    @Test fun repeatAtCurrentMinuteMovesToNextWeek() {
        assertEquals(date(17, 8, 0), AlarmRules.next("08:00", listOf(4), date(10, 8, 0)))
    }
    @Test fun weekdaysSkipWeekend() {
        assertEquals(date(14, 7, 0), AlarmRules.next("07:00", listOf(1, 2, 3, 4, 5), date(11, 8, 0)))
    }
    @Test fun repeatDayOrderingDoesNotChangeNextOccurrence() {
        assertEquals(date(12, 7, 0), AlarmRules.next("07:00", listOf(0, 6), date(11, 8, 0)))
    }
    @Test fun invalidScheduleIsRejected() {
        for (time in listOf("24:00", "09:60", "garbage", "9:00")) {
            assertThrows(IllegalArgumentException::class.java) { AlarmRules.next(time, emptyList(), date(10, 7, 0)) }
        }
        assertThrows(IllegalArgumentException::class.java) { AlarmRules.next("09:00", listOf(7), date(10, 7, 0)) }
    }
    @Test fun explicitCommandsAcceptCaseAndPunctuation() {
        assertEquals("stop", AlarmRules.command("Stop the alarm!"))
        assertEquals("snooze", AlarmRules.command("SNOOZE please."))
    }
    @Test fun ambiguousOrNegatedSpeechCannotDismissAlarm() {
        for (text in listOf("don't stop", "do not snooze", "stopwatch", "I said stop yesterday", "hello")) {
            assertNull(AlarmRules.command(text))
        }
    }
}
