package io.github.rakvat.ccitimer.dndbypass

import android.app.Activity
import android.app.AlarmManager
import android.app.Application
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import java.lang.reflect.Proxy
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DndBypassModule : Module() {
  private var activityLifecycleCallbacks: Application.ActivityLifecycleCallbacks? = null

  override fun definition() = ModuleDefinition {
    Name("DndBypass")

    OnCreate {
      registerActivityLifecycleCallbacks()
    }

    OnDestroy {
      runCatching {
        val app = appContext.reactContext?.applicationContext as? Application
          ?: return@runCatching
        activityLifecycleCallbacks?.let { app.unregisterActivityLifecycleCallbacks(it) }
        activityLifecycleCallbacks = null
      }
    }

    Function("isNotificationPolicyAccessGranted") {
      registerActivityLifecycleCallbacks()
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function false
      val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      notificationManager?.isNotificationPolicyAccessGranted ?: false
    }

    Function("openNotificationPolicySettings") {
      registerActivityLifecycleCallbacks()
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }

    Function("canScheduleExactAlarms") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function false
      val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
          ?: return@Function false
      alarmManager.canScheduleExactAlarms()
    }
  }

  private fun registerActivityLifecycleCallbacks() {
    if (activityLifecycleCallbacks != null) {
      return
    }
    val app = appContext.reactContext?.applicationContext as? Application ?: return
    val callbacks = object : Application.ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
      override fun onActivityStarted(activity: Activity) {}
      override fun onActivityResumed(activity: Activity) {}
      override fun onActivityPaused(activity: Activity) {}
      override fun onActivityStopped(activity: Activity) {}
      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}

      override fun onActivityDestroyed(activity: Activity) {
        if (!activity.isFinishing || activity.isChangingConfigurations) {
          return
        }
        cancelScheduledNotifications()
      }
    }
    app.registerActivityLifecycleCallbacks(callbacks)
    activityLifecycleCallbacks = callbacks
  }

  private fun cancelScheduledNotifications() {
    // Cancels all scheduled and displayed notifications via Notifee's core API.
    // NOTIFICATION_TYPE_ALL = 0 (see io.invertase.notifee.NotifeeApiModule).
    // Reflection is used because the core artifact is an `implementation`
    // dependency of @notifee/react-native and is not on this module's
    // compile classpath.
    runCatching {
      val notifeeClass = Class.forName("app.notifee.core.Notifee")
      val instance = notifeeClass.getMethod("getInstance").invoke(null)
      val resultType = Class.forName("app.notifee.core.interfaces.MethodCallResult")
      val callback = Proxy.newProxyInstance(
        resultType.classLoader,
        arrayOf(resultType),
      ) { _, _, _ -> null }
      notifeeClass
        .getMethod("cancelAllNotifications", Int::class.javaPrimitiveType, resultType)
        .invoke(instance, 0, callback)
    }
  }
}
