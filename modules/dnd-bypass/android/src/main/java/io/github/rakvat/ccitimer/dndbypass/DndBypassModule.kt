package io.github.rakvat.ccitimer.dndbypass

import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DndBypassModule : Module() {
  private var appContextRef: Context? = null

  override fun definition() = ModuleDefinition {
    Name("DndBypass")

    OnCreate {
      appContextRef = appContext.reactContext
    }

    OnActivityDestroys {
      val context = appContextRef ?: return@OnActivityDestroys
      val action = "expo.modules.notifications.NOTIFICATION_EVENT"
      val removeAll = Intent(action).setPackage(context.packageName).apply {
        putExtra("type", "removeAll")
      }
      val receiver = context.packageManager
        .queryBroadcastReceivers(Intent(action).setPackage(context.packageName), 0)
        .firstOrNull()
      if (receiver != null) {
        removeAll.component = ComponentName(receiver.activityInfo.packageName, receiver.activityInfo.name)
      }
      context.sendBroadcast(removeAll)
    }

    Function("isNotificationPolicyAccessGranted") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
        return@Function true
      }
      val context = appContext.reactContext ?: return@Function false
      val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
      notificationManager?.isNotificationPolicyAccessGranted ?: false
    }

    Function("openNotificationPolicySettings") {
      val context = appContext.reactContext
      if (context != null) {
        val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
      }
    }
  }
}
