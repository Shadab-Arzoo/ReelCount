package com.reelcount.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import android.widget.Toast
import com.reelcount.MainActivity
import com.reelcount.R
import com.reelcount.tracking.ReelCountPreferences
import com.reelcount.tracking.TargetPackages

/**
 * Android Home Screen Widget for Polly:
 * - Displays live daily short video count & remaining allowance
 * - Displays Polly's dynamic mascot expression status
 * - 1-tap "15m Focus Sprint" action button to set intentional focus before opening feeds
 */
class PollyWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) {
      updateAppWidget(context, appWidgetManager, appWidgetId)
    }
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    if (intent.action == ACTION_WIDGET_FOCUS_SPRINT) {
      val prefs = ReelCountPreferences.getInstance(context)
      val isFocus = prefs.isFocusModeActive()
      if (!isFocus) {
        prefs.setFocusMode(true, 15, TargetPackages.all)
        Toast.makeText(context, "Polly: 15m Focus Sprint started! Stay intentional.", Toast.LENGTH_SHORT).show()
      } else {
        Toast.makeText(context, "Focus Sprint already active.", Toast.LENGTH_SHORT).show()
      }
      updateAllWidgets(context)
    }
  }

  companion object {
    const val ACTION_WIDGET_FOCUS_SPRINT = "com.reelcount.widget.ACTION_FOCUS_SPRINT"

    fun updateAllWidgets(context: Context) {
      try {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val componentName = ComponentName(context, PollyWidgetProvider::class.java)
        val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
        for (id in appWidgetIds) {
          updateAppWidget(context, appWidgetManager, id)
        }
      } catch (_: Exception) {}
    }

    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val prefs = ReelCountPreferences.getInstance(context)
      val count = prefs.getTodayCount()
      val limit = prefs.getDailyShortLimit()
      val remaining = maxOf(0, limit - count)
      val isFocus = prefs.isFocusModeActive()

      val moodText = when {
        isFocus -> "Focus Shield Active"
        count < 25 -> "Zen & Calm Guide"
        count < 50 -> "Attentive Focus"
        else -> "Mindful Rest Needed"
      }

      val views = RemoteViews(context.packageName, R.layout.widget_polly).apply {
        setTextViewText(R.id.widget_counter_text, "$count")
        setTextViewText(R.id.widget_limit_text, " / $limit shorts")
        setTextViewText(R.id.widget_allowance_badge, "$remaining left")
        setTextViewText(R.id.widget_mascot_mood, moodText)

        if (isFocus) {
          setTextViewText(R.id.widget_focus_button_text, "In Focus (15m)")
        } else {
          setTextViewText(R.id.widget_focus_button_text, "15m Focus Sprint")
        }

        // Tap widget body to launch ReelCount app
        val launchIntent = Intent(context, MainActivity::class.java).apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or
          (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
        val pendingLaunch = PendingIntent.getActivity(context, appWidgetId, launchIntent, flags)
        setOnClickPendingIntent(R.id.widget_root, pendingLaunch)

        // Tap 1-tap Focus Sprint button
        val focusIntent = Intent(context, PollyWidgetProvider::class.java).apply {
          action = ACTION_WIDGET_FOCUS_SPRINT
        }
        val pendingFocus = PendingIntent.getBroadcast(context, appWidgetId + 1000, focusIntent, flags)
        setOnClickPendingIntent(R.id.widget_focus_button, pendingFocus)
      }

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
