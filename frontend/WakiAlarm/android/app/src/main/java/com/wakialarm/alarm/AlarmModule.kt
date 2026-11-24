package com.wakialarm.alarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import org.json.JSONObject

class AlarmModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "WakiAlarms"
    @ReactMethod fun setUser(user: String, promise: Promise) = UiThreadUtil.runOnUiThread { AlarmStore(context).setUser(user); promise.resolve(null) }
    @ReactMethod fun scheduled(promise: Promise) = UiThreadUtil.runOnUiThread {
        val store = AlarmStore(context)
        val alarms = store.all().map { if (!store.allowed()) it.put("nextAt", 0L).put("snoozeAt", 0L) else it }
        promise.resolve(org.json.JSONArray(alarms).toString())
    }
    @ReactMethod fun schedule(json: String, promise: Promise) = UiThreadUtil.runOnUiThread {
        try { promise.resolve(AlarmStore(context).save(JSONObject(json)).toDouble()) }
        catch (error: Exception) { promise.reject("SCHEDULE_FAILED", error.message, error) }
    }
    @ReactMethod fun cancel(id: String, promise: Promise) = UiThreadUtil.runOnUiThread {
        try { AlarmStore(context).remove(id); promise.resolve(null) } catch (error: Exception) { promise.reject("CANCEL_FAILED", error) }
    }
    @ReactMethod fun clear(promise: Promise) = UiThreadUtil.runOnUiThread { AlarmStore(context).clear(); promise.resolve(null) }
    @ReactMethod fun status(promise: Promise) {
        val manager = context.getSystemService(NotificationManager::class.java)
        promise.resolve(Arguments.createMap().apply {
            putBoolean("exact", AlarmStore(context).allowed())
            putBoolean("notifications", manager.areNotificationsEnabled())
            putBoolean("fullScreen", Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent())
        })
    }
    @ReactMethod fun openSettings(kind: String) {
        val action = when {
            kind == "exact" && Build.VERSION.SDK_INT >= 31 -> Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM
            kind == "fullScreen" && Build.VERSION.SDK_INT >= 34 -> Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT
            else -> Settings.ACTION_APPLICATION_DETAILS_SETTINGS
        }
        context.startActivity(Intent(action, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
    @ReactMethod fun restore(promise: Promise) = UiThreadUtil.runOnUiThread {
        try { AlarmStore(context).restore(); promise.resolve(null) } catch (error: Exception) { promise.reject("RESTORE_FAILED", error) }
    }
    @ReactMethod fun preview(json: String, promise: Promise) = UiThreadUtil.runOnUiThread {
        try {
            check(AlarmStore(context).active() == null) { "An alarm is already ringing. Stop it before previewing." }
            val alarm = JSONObject(json).put("id", "preview").put("days", org.json.JSONArray()).put("enabled", true)
            // A preview is dismissible but never creates a new recurring alarm.
            alarm.put("snoozeEnabled", false)
            AlarmStore(context).setActive(alarm)
            val intent = Intent(context, AlarmService::class.java).putExtra("alarm", alarm.toString())
            if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
            context.startActivity(Intent(context, AlarmActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            promise.resolve(null)
        } catch (error: Exception) { promise.reject("PREVIEW_FAILED", error) }
    }
}

class AlarmPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(AlarmModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
