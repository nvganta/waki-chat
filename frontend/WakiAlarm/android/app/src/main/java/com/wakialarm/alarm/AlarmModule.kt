package com.wakialarm.alarm

import android.app.NotificationManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.ViewManager
import org.json.JSONArray
import org.json.JSONObject

/** The JavaScript bridge, exposed as NativeModules.WakiAlarms. */
class AlarmModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "WakiAlarms"

    @ReactMethod
    fun scheduled(promise: Promise) = UiThreadUtil.runOnUiThread {
        val store = AlarmStore(context)
        val allowed = store.allowed()
        // Without exact-alarm access Android has dropped the alarms, so never report them as scheduled.
        val alarms = store.all().map { if (allowed) it else it.put("nextAt", 0L).put("snoozeAt", 0L) }
        promise.resolve(JSONArray(alarms).toString())
    }

    @ReactMethod
    fun schedule(json: String, promise: Promise) = UiThreadUtil.runOnUiThread {
        try {
            promise.resolve(AlarmStore(context).save(JSONObject(json)).toDouble())
        } catch (error: Exception) {
            promise.reject("SCHEDULE_FAILED", error.message, error)
        }
    }

    @ReactMethod
    fun cancel(id: String, promise: Promise) = UiThreadUtil.runOnUiThread {
        try {
            AlarmStore(context).remove(id)
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("CANCEL_FAILED", error)
        }
    }

    @ReactMethod
    fun restore(promise: Promise) = UiThreadUtil.runOnUiThread {
        try {
            AlarmStore(context).restore()
            promise.resolve(null)
        } catch (error: Exception) {
            promise.reject("RESTORE_FAILED", error)
        }
    }

    @ReactMethod
    fun status(promise: Promise) {
        val manager = context.getSystemService(NotificationManager::class.java)
        promise.resolve(Arguments.createMap().apply {
            putBoolean("exact", AlarmStore(context).allowed())
            putBoolean("notifications", manager.areNotificationsEnabled())
            putBoolean("fullScreen", Build.VERSION.SDK_INT < 34 || manager.canUseFullScreenIntent())
        })
    }

    @ReactMethod
    fun openSettings(kind: String) {
        val packageUri = Uri.parse("package:${context.packageName}")
        val intent = when {
            kind == "exact" && Build.VERSION.SDK_INT >= 31 ->
                Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, packageUri)
            kind == "fullScreen" && Build.VERSION.SDK_INT >= 34 ->
                Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, packageUri)
            kind == "notifications" && Build.VERSION.SDK_INT >= 26 ->
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
            else -> Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri)
        }
        try {
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: ActivityNotFoundException) {
            // Some phones hide the specific screen; the app's settings page always exists.
            context.startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, packageUri).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            )
        }
    }
}

class AlarmPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(AlarmModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
