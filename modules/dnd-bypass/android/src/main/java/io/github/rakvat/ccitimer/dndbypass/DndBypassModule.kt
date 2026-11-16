package io.github.rakvat.ccitimer.dndbypass

import android.app.Activity
import android.app.Application
import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
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
        cancelScheduledNotifications(activity.applicationContext)
      }
    }
    app.registerActivityLifecycleCallbacks(callbacks)
    activityLifecycleCallbacks = callbacks
  }

  private fun cancelScheduledNotifications(context: Context) {
    for (type in listOf("removeAll", "dismissAll")) {
      val action = "expo.modules.notifications.NOTIFICATION_EVENT"
      val intent = Intent(action).setPackage(context.packageName).apply {
        putExtra("type", type)
      }
      val receiver = context.packageManager
        .queryBroadcastReceivers(Intent(action).setPackage(context.packageName), 0)
        .firstOrNull()
      if (receiver != null) {
        intent.component = ComponentName(receiver.activityInfo.packageName, receiver.activityInfo.name)
      }
      context.sendBroadcast(intent)
    }
  }
}
