package io.github.rakvat.ccitimer.dndbypass

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DndBypassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DndBypass")

    Function("isNotificationPolicyAccessGranted") {
      val context = appContext.reactContext
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M || context == null) {
        return@Function true
      }
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
