package com.wakialarm.alarm

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class AlarmRulesTest {
    private lateinit var previousZone: TimeZone

    @Before fun pinZone() {
        previousZone = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"))
    }

    @After fun restoreZone() = TimeZone.setDefault(previousZone)

    private fun at(day: Int, hour: Int, minute: Int, month: Int = Calendar.SEPTEMBER) =
        Calendar.getInstance().apply { clear(); set(2026, month, day, hour, minute) }.timeInMillis

    private fun local(millis: Long) = Calendar.getInstance().apply { timeInMillis = millis }

    // Next occurrence

    @Test fun oneTimeAlarmUsesTodayOrTomorrow() {
        assertEquals(at(10, 8, 0), AlarmRules.next("08:00", emptyList(), at(10, 7, 0)))
        assertEquals(at(11, 8, 0), AlarmRules.next("08:00", emptyList(), at(10, 8, 0)))
    }

    @Test fun repeatAtCurrentMinuteMovesToNextWeek() {
        assertEquals(at(17, 8, 0), AlarmRules.next("08:00", listOf(4), at(10, 8, 0)))
    }

    @Test fun weekdaysSkipWeekend() {
        assertEquals(at(14, 7, 0), AlarmRules.next("07:00", listOf(1, 2, 3, 4, 5), at(11, 8, 0)))
    }

    @Test fun repeatDayOrderingDoesNotChangeNextOccurrence() {
        assertEquals(at(12, 7, 0), AlarmRules.next("07:00", listOf(0, 6), at(11, 8, 0)))
    }

    @Test fun invalidScheduleIsRejected() {
        for (time in listOf("24:00", "09:60", "garbage", "9:00")) {
            assertThrows(IllegalArgumentException::class.java) { AlarmRules.next(time, emptyList(), at(10, 7, 0)) }
        }
        assertThrows(IllegalArgumentException::class.java) { AlarmRules.next("09:00", listOf(7), at(10, 7, 0)) }
    }

    // Daylight saving time

    @Test fun springForwardGapRingsAtTheFirstValidMinute() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"))
        val night = at(8, 0, 0, Calendar.MARCH) // 02:00-03:00 does not exist on 8 March 2026.
        val next = local(AlarmRules.next("02:30", emptyList(), night))
        assertEquals(8, next.get(Calendar.DAY_OF_MONTH))
        assertEquals(3, next.get(Calendar.HOUR_OF_DAY))
        assertEquals(30, next.get(Calendar.MINUTE))
    }

    @Test fun alarmKeepsItsWallClockTimeAcrossSpringForward() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"))
        val saturday = at(7, 8, 0, Calendar.MARCH)
        val sunday = AlarmRules.next("07:00", emptyList(), saturday)
        assertEquals(7, local(sunday).get(Calendar.HOUR_OF_DAY))
        // Saturday 08:00 to Sunday 07:00 is normally 23 hours; the jump makes it 22.
        assertEquals(22 * 3_600_000L, sunday - saturday)
    }

    @Test fun alarmKeepsItsWallClockTimeAcrossFallBack() {
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"))
        val saturday = at(31, 8, 0, Calendar.OCTOBER)
        val sunday = AlarmRules.next("07:00", emptyList(), saturday)
        assertEquals(7, local(sunday).get(Calendar.HOUR_OF_DAY))
        assertEquals(24 * 3_600_000L, sunday - saturday)
    }

    @Test fun repeatingAlarmScheduledBeforeDstStillRingsAtSevenAfterIt() {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/London"))
        val friday = at(27, 8, 0, Calendar.MARCH) // Clocks go forward on Sunday 29 March 2026.
        val monday = local(AlarmRules.next("07:00", listOf(1), friday))
        assertEquals(30, monday.get(Calendar.DAY_OF_MONTH))
        assertEquals(7, monday.get(Calendar.HOUR_OF_DAY))
    }

    // Rescheduling after reboot, update and clock changes

    @Test fun timeZoneChangeMovesAOneTimeAlarmToTheNewLocalTime() {
        val evening = at(10, 21, 0)
        val savedInKolkata = AlarmRules.next("07:00", emptyList(), evening)
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/London"))
        val moved = AlarmRules.restored("07:00", emptyList(), Schedule(savedInKolkata), evening, clockChanged = true)
        val ring = local(moved.nextAt)
        assertEquals(7, ring.get(Calendar.HOUR_OF_DAY))
        assertEquals(0, ring.get(Calendar.MINUTE))
        assertEquals(4 * 3_600_000L + 30 * 60_000L, moved.nextAt - savedInKolkata)
    }

    @Test fun manualClockChangeRecomputesFromTheNewTime() {
        val original = Schedule(at(11, 7, 0))
        val clockMovedPastAlarm = at(11, 9, 0)
        val moved = AlarmRules.restored("07:00", emptyList(), original, clockMovedPastAlarm, clockChanged = true)
        assertEquals(at(12, 7, 0), moved.nextAt)
    }

    @Test fun rebootKeepsAFutureOneTimeAlarm() {
        val original = Schedule(at(11, 7, 0))
        assertEquals(original, AlarmRules.restored("07:00", emptyList(), original, at(10, 23, 0), clockChanged = false))
    }

    @Test fun rebootDropsAOneTimeAlarmMissedWhileThePhoneWasOff() {
        val restored = AlarmRules.restored("07:00", emptyList(), Schedule(at(11, 7, 0)), at(11, 9, 0), false)
        assertEquals(Schedule(0L), restored)
    }

    @Test fun rebootMovesAMissedRepeatingAlarmToItsNextDay() {
        val restored = AlarmRules.restored("07:00", listOf(1, 2, 3, 4, 5), Schedule(at(11, 7, 0)), at(11, 9, 0), false)
        assertEquals(at(14, 7, 0), restored.nextAt)
    }

    @Test fun clockChangeKeepsAPendingSnoozeAtItsAbsoluteTime() {
        val snoozed = Schedule(nextAt = 0L, snoozeAt = at(11, 7, 10))
        val restored = AlarmRules.restored("07:00", emptyList(), snoozed, at(11, 7, 2), clockChanged = true)
        assertEquals(snoozed, restored)
        assertEquals(at(11, 7, 10), restored.due)
    }

    @Test fun expiredSnoozeIsDroppedOnRestore() {
        val restored = AlarmRules.restored("07:00", emptyList(), Schedule(0L, at(11, 7, 10)), at(11, 8, 0), false)
        assertEquals(0L, restored.due)
    }

    @Test fun disabledAlarmStaysDisabledAfterRestore() {
        assertEquals(Schedule(0L), AlarmRules.restored("07:00", listOf(1), Schedule(0L), at(11, 8, 0), true))
    }

    // Ringing

    @Test fun oneTimeAlarmIsConsumedWhenItRings() {
        assertEquals(Schedule(0L), AlarmRules.afterRing("07:00", emptyList(), Schedule(at(11, 7, 0)), at(11, 7, 0)))
    }

    @Test fun repeatingAlarmArmsItsNextDayWhenItRings() {
        val after = AlarmRules.afterRing("07:00", listOf(1, 2, 3, 4, 5), Schedule(at(11, 7, 0)), at(11, 7, 0))
        assertEquals(Schedule(at(14, 7, 0)), after)
    }

    @Test fun staleOrEarlyDeliveryDoesNotRing() {
        assertNull(AlarmRules.afterRing("07:00", emptyList(), Schedule(at(12, 7, 0)), at(11, 7, 0)))
        assertNull(AlarmRules.afterRing("07:00", emptyList(), Schedule(0L), at(11, 7, 0)))
    }

    @Test fun snoozeRingsBeforeTheNextRepeat() {
        val snoozed = Schedule(nextAt = at(14, 7, 0), snoozeAt = at(11, 7, 10))
        assertEquals(at(11, 7, 10), snoozed.due)
        assertEquals(Schedule(at(14, 7, 0)), AlarmRules.afterRing("07:00", listOf(1, 2, 3, 4, 5), snoozed, at(11, 7, 10)))
    }

    // Fallback tone

    @Test fun systemAlarmSoundIsTriedFirstThenTheBundledTone() {
        assertEquals(
            listOf(AlarmSound.System("content://media/internal/audio/media/12"), AlarmSound.Bundled),
            AlarmRules.sounds("content://media/internal/audio/media/12"),
        )
    }

    @Test fun silentOrMissingSystemSoundUsesTheBundledTone() {
        assertEquals(listOf(AlarmSound.Bundled), AlarmRules.sounds(null))
        assertEquals(listOf(AlarmSound.Bundled), AlarmRules.sounds(""))
    }

    // Voice commands

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
