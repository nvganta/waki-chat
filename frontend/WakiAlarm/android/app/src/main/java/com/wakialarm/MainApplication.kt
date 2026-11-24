package com.wakialarm

import android.app.Application
import android.os.UserManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              add(com.wakialarm.alarm.AlarmPackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  private var reactNativeLoaded = false

  override fun onCreate() {
    super.onCreate()
    // Before the first unlock after a reboot only the alarm runs. It needs no React Native, and
    // React Native's native-library setup touches storage that is still encrypted.
    if (getSystemService(UserManager::class.java).isUserUnlocked) ensureReactNative()
  }

  /** Loads React Native once; MainActivity calls this in case the process started while locked. */
  fun ensureReactNative() {
    if (reactNativeLoaded) return
    loadReactNative(this)
    reactNativeLoaded = true
  }
}
