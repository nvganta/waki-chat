package com.wakialarm.alarm

import android.app.AlarmManager
import android.app.Application
import android.content.Intent
import android.os.UserManager
import com.wakialarm.MainActivity
import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowAlarmManager

/**
 * After a reboot and before the first unlock, LOCKED_BOOT_COMPLETED re-arms saved alarms.
 * Package resolution then skips activities that are not direct-boot aware, so nothing about
 * re-arming may depend on resolving the launcher activity.
 */
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [35])
class AlarmStoreBootTest {
    private lateinit var app: Application
    private lateinit var alarms: AlarmManager

    @Before fun lockedAfterReboot() {
        app = RuntimeEnvironment.getApplication()
        alarms = app.getSystemService(AlarmManager::class.java)
        ShadowAlarmManager.setCanScheduleExactAlarms(true)
        // The launcher activity cannot be resolved while the user is still locked.
        assertEquals(null, app.packageManager.getLaunchIntentForPackage(app.packageName))
        shadowOf(app.getSystemService(UserManager::class.java)).setUserUnlocked(false)
    }

    private fun saved(id: String) = JSONObject()
        .put("id", id)
        .put("time", "07:00")
        .put("days", JSONArray())
        .put("enabled", true)
        .put("snoozeEnabled", true)
        .put("snoozeDuration", 10)

    @Test fun restoreBeforeFirstUnlockReArmsWithAnExplicitDisplayIntent() {
        val store = AlarmStore(app)
        store.save(saved("wake"))
        shadowOf(alarms).scheduledAlarms.toList().forEach { alarms.cancel(it.operation!!) }

        store.restore()

        val scheduled = shadowOf(alarms).nextScheduledAlarm
        assertNotNull("restore() must re-arm the alarm", scheduled)
        val show = scheduled!!.alarmClockInfo!!.showIntent
        val opens: Intent = shadowOf(show).savedIntent
        assertEquals(MainActivity::class.java.name, opens.component?.className)
        assertEquals(app.packageName, opens.component?.packageName)
        assertTrue(show.isActivity)
    }
}
