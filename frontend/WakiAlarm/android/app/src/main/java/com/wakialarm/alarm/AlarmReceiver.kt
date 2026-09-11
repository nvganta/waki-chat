package com.wakialarm.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val store = AlarmStore(context)
        if (intent.action == "ring") {
            val alarm = store.fire(intent.getStringExtra("id") ?: return) ?: return
            val service = Intent(context, AlarmService::class.java).putExtra("alarm", alarm.toString())
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(service) else context.startService(service)
        } else store.restore()
    }
}
