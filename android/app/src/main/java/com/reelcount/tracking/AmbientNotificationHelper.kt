package com.reelcount.tracking

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

/**
 * Shared notification helper ensuring ambient Focus/counter status notifications stay
 * synchronized whether updated from AccessibilityService, Widget, Quick Settings, or React Native.
 */
internal object AmbientNotificationHelper {
  const val CHANNEL_ID = "reelcount_alerts"
  const val CHANNEL_STATUS_ID = "reelcount_status"
  const val NOTIFICATION_STATUS_ID = 1003

  fun createChannels(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val alertChannel = NotificationChannel(
      CHANNEL_ID,
      "ReelCount Alerts",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Daily limits, Doomscroll alerts, and Focus Mode reminders"
      enableVibration(true)
    }
    val statusChannel = NotificationChannel(
      CHANNEL_STATUS_ID,
      "ReelCount Ambient Status",
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = "Live scroll counter & quick Focus button in notification shade"
      enableVibration(false)
      setShowBadge(false)
    }
    nm.createNotificationChannel(alertChannel)
    nm.createNotificationChannel(statusChannel)
  }

  fun getLaunchPendingIntent(context: Context): PendingIntent? {
    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    } ?: return null

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)

    return PendingIntent.getActivity(context, 0, launchIntent, flags)
  }

  fun updateStatusNotification(context: Context, prefs: ReelCountPreferences) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    createChannels(context)

    val total = prefs.getTodayCount()
    val limit = prefs.getDailyShortLimit()
    val percent = if (limit > 0) Math.min(100, (total * 100) / limit) else 0
    val isFocusActive = prefs.isFocusModeActive()
    val launchPendingIntent = getLaunchPendingIntent(context)

    val focusIntent = Intent(context, com.reelcount.quicksettings.NotificationActionReceiver::class.java).apply {
      action = if (isFocusActive) {
        com.reelcount.quicksettings.NotificationActionReceiver.ACTION_STOP_FOCUS
      } else {
        com.reelcount.quicksettings.NotificationActionReceiver.ACTION_START_FOCUS
      }
    }
    val focusFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val focusPendingIntent = PendingIntent.getBroadcast(
      context,
      if (isFocusActive) 202 else 201,
      focusIntent,
      focusFlags
    )

    val focusLabel = if (isFocusActive) "Stop Focus" else "Focus 15m"
    val statusBody = if (isFocusActive) {
      val remMin = (prefs.getFocusRemainingSeconds() / 60) + 1
      "Focus Shield Active (${remMin}m left) · Tap to open Dashboard"
    } else {
      "Tap to open Dashboard · Stay mindful"
    }

    try {
      val builder = android.app.Notification.Builder(context, CHANNEL_STATUS_ID)
        .setContentTitle("Polly: $total / $limit Shorts ($percent%)")
        .setContentText(statusBody)
        .setSmallIcon(android.R.drawable.ic_menu_compass)
        .setOngoing(true)
        .setAutoCancel(false)

      if (launchPendingIntent != null) {
        builder.setContentIntent(launchPendingIntent)
      }

      val icon = android.graphics.drawable.Icon.createWithResource(context, android.R.drawable.ic_lock_idle_lock)
      val action = android.app.Notification.Action.Builder(icon, focusLabel, focusPendingIntent).build()
      builder.addAction(action)

      nm.notify(NOTIFICATION_STATUS_ID, builder.build())
    } catch (_: Exception) {}
  }

  fun updateStatusNotificationIfActive(context: Context, prefs: ReelCountPreferences) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val isStatusVisible = try {
      nm.activeNotifications.any { it.id == NOTIFICATION_STATUS_ID }
    } catch (_: Exception) {
      false
    }
    if (isStatusVisible || PrototypeRuntimeStatus.snapshot(prefs).serviceConnected) {
      updateStatusNotification(context, prefs)
    }
  }
}
