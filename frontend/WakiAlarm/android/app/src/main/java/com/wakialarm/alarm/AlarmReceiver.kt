package com.wakialarm.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * Rings due alarms and re-arms saved alarms whenever Android may have dropped or shifted them.
 * Direct-boot aware, so it also runs after LOCKED_BOOT_COMPLETED, before the first unlock.
 */
class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val store = AlarmStore(context)
        Log.i(TAG, "Received ${intent.action}")
        when (intent.action) {
            ACTION_RING -> ring(context, store, intent.getStringExtra("id") ?: return)
            Intent.ACTION_LOCKED_BOOT_COMPLETED, Intent.ACTION_BOOT_COMPLETED -> {
                store.clearRingingFromBeforeBoot()
                store.restore()
            }
            Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED -> store.restore(clockChanged = true)
            // App updates and a newly granted exact-alarm permission.
            else -> store.restore()
        }
    }

    private fun ring(context: Context, store: AlarmStore, id: String) {
        val alarm = store.fire(id) ?: run {
            Log.i(TAG, "Ignored stale alarm $id")
            return
        }
        Log.i(TAG, "Ringing alarm $id")
        val service = Intent(context, AlarmService::class.java).putExtra("alarm", alarm.toString())
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service) else context.startService(service)
    }

    companion object {
        const val ACTION_RING = "ring"
        private const val TAG = "WakiAlarm"
    }
}
