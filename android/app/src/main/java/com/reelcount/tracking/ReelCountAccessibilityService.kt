package com.reelcount.tracking

import android.accessibilityservice.AccessibilityService
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Toast
import com.reelcount.widget.PollyWidgetProvider
import java.util.ArrayDeque

/**
 * Event-only tracking and enforcement Accessibility Service.
 *
 * Implements:
 * 1. In-Feed Neuro-Interventions:
 *    • Grayscale Feed Filter on Overuse (cuts dopamine loop without hard blocks)
 *    • Rapid Fidget Swipe Detector (double buzz + 3-breath pause)
 *    • "One Last Reel" Conscious Exit Contract (60-second graceful wind-down)
 *    • Post-Session Reality Check (3-Second Micro-Log for 15+ min sessions)
 * 2. Polly Mascot Floating HUD Overlay with 3 adaptive expression states.
 * 3. Focus Mode & Bedtime Shield Enforcement.
 * 4. Doomscroll Vortex Nudges & Ambient Notification Shade Status.
 */
class ReelCountAccessibilityService : AccessibilityService() {
  private val trace = ArrayDeque<EventMetadata>(MAX_TRACE_EVENTS)
  private val reducer = CandidateTransitionReducer()
  private val detector = ShortVideoDetector()
  private val handler = Handler(Looper.getMainLooper())
  private val clearIdleState = Runnable { clearIdleTrace() }

  private var overlayHud: ReelCountOverlayHud? = null
  private var currentActivePackage: String? = null
  private var lastNotifiedPackage: String? = null
  private var lastNotificationTime: Long = 0L
  private var lastLimitAlertTime: Long = 0L
  private var lastBlockedToastTime: Long = 0L
  private var lastDoomscrollAlertTime: Long = 0L
  private var consecutiveShortsInApp = 0

  // Neuro-Intervention State
  private val recentSwipeTimes = ArrayDeque<Long>()
  private var lastFidgetAlertTime = 0L
  private var sessionStartTime = 0L
  private var isConsciousExitActive = false
  private var consciousExitSecondsLeft = 60

  private val consciousExitRunnable = object : Runnable {
    override fun run() {
      if (!isConsciousExitActive) return
      consciousExitSecondsLeft--
      if (consciousExitSecondsLeft > 0) {
        overlayHud?.updateConsciousExit(consciousExitSecondsLeft)
        handler.postDelayed(this, 1000L)
      } else {
        isConsciousExitActive = false
        overlayHud?.endConsciousExit()
        performGlobalAction(GLOBAL_ACTION_HOME)
        handler.post {
          Toast.makeText(
            applicationContext,
            "Polly Conscious Exit: Mindful session complete. Phone placed down.",
            Toast.LENGTH_LONG
          ).show()
        }
      }
    }
  }

  private lateinit var prefs: ReelCountPreferences
  private var notificationManager: NotificationManager? = null

  override fun onServiceConnected() {
    super.onServiceConnected()
    prefs = ReelCountPreferences.getInstance(this)
    notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager

    createNotificationChannels()
    PrototypeRuntimeStatus.connected(prefs)
    updateAmbientStatusNotification()

    if (overlayHud == null) {
      overlayHud = ReelCountOverlayHud(this)
    }
    PollyWidgetProvider.updateAllWidgets(applicationContext)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    val packageName = event.packageName?.toString() ?: return

    if (!::prefs.isInitialized) {
      prefs = ReelCountPreferences.getInstance(this)
    }

    val appLabel = TargetPackages.getDisplayLabel(packageName)
    val now = System.currentTimeMillis()

    // 1. BEDTIME SLEEP SHIELD ENFORCEMENT
    if (packageName in TargetPackages.all && prefs.isBedtimeShieldActive()) {
      overlayHud?.hide()
      overlayHud?.setGrayscaleOverlay(false)
      currentActivePackage = null
      performGlobalAction(GLOBAL_ACTION_HOME)

      if (now - lastBlockedToastTime > 3_000L) {
        lastBlockedToastTime = now
        handler.post {
          Toast.makeText(
            applicationContext,
            "Polly Bedtime Shield Active\nSleep sanctuary mode: $appLabel is blocked until morning",
            Toast.LENGTH_LONG
          ).show()
        }
        triggerWarningVibration()
      }
      return
    }

    // 2. FOCUS MODE ENFORCEMENT & APP BLOCKING
    val canonicalPkg = TargetPackages.getCanonicalName(packageName)
    if (prefs.isPackageBlocked(canonicalPkg) || prefs.isPackageBlocked(packageName)) {
      overlayHud?.hide()
      overlayHud?.setGrayscaleOverlay(false)
      currentActivePackage = null

      performGlobalAction(GLOBAL_ACTION_HOME)

      if (now - lastBlockedToastTime > 3_000L) {
        lastBlockedToastTime = now
        val remainingMin = (prefs.getFocusRemainingSeconds() / 60) + 1
        handler.post {
          Toast.makeText(
            applicationContext,
            "Polly Focus Mode Active\n$appLabel is blocked ($remainingMin min remaining)",
            Toast.LENGTH_LONG
          ).show()
        }
        triggerWarningVibration()
      }
      return
    }

    // 3. TARGET APP MONITORING & POST-SESSION REALITY CHECK
    if (packageName !in TargetPackages.all) {
      if (currentActivePackage != null && packageName != applicationContext.packageName) {
        val exitingPkg = currentActivePackage ?: ""
        val exitingLabel = TargetPackages.getDisplayLabel(exitingPkg)
        val elapsedMinutes = if (sessionStartTime > 0L) {
          ((now - sessionStartTime) / 60_000L).toInt()
        } else 0

        // Post-Session Reality Check (3-Second Micro-Log) for 15+ minute sessions
        if (prefs.isRealityCheckEnabled() && elapsedMinutes >= 15) {
          overlayHud?.showRealityCheckCard(exitingLabel, elapsedMinutes) { rating ->
            prefs.recordMicroLog(exitingLabel, elapsedMinutes, rating)
            PollyWidgetProvider.updateAllWidgets(applicationContext)
          }
        }

        overlayHud?.setGrayscaleOverlay(false)
        if (isConsciousExitActive) {
          isConsciousExitActive = false
          handler.removeCallbacks(consciousExitRunnable)
          overlayHud?.endConsciousExit()
        }

        currentActivePackage = null
        consecutiveShortsInApp = 0
        sessionStartTime = 0L
        recentSwipeTimes.clear()
        overlayHud?.hide()
      }
      return
    }

    val isAppSwitch = currentActivePackage != packageName
    currentActivePackage = packageName
    if (isAppSwitch) {
      consecutiveShortsInApp = 0
      sessionStartTime = now
      recentSwipeTimes.clear()
      reducer.reset()
    }

    // Check & apply Grayscale Feed Filter
    checkGrayscaleFeedFilter()

    // Notify when opening a short-video app
    if (isAppSwitch && (lastNotifiedPackage != packageName || now - lastNotificationTime > 15_000L)) {
      lastNotifiedPackage = packageName
      lastNotificationTime = now
      val count = PrototypeRuntimeStatus.getPackageCount(canonicalPkg, prefs)
      val dailyLimit = prefs.getDailyShortLimit()
      val isLimitHit = prefs.getTodayCount() >= dailyLimit

      handler.post {
        Toast.makeText(
          applicationContext,
          "Polly: $appLabel counter active",
          Toast.LENGTH_SHORT
        ).show()
      }
      overlayHud?.show(appLabel, count, isLimitHit)
    }

    // 4. CANDIDATE SCROLL DETECTION
    val rootNode = if (
      event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED ||
      event.eventType == AccessibilityEvent.TYPE_VIEW_SELECTED ||
      event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
      event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
    ) {
      try {
        rootInActiveWindow
      } catch (_: Exception) {
        null
      }
    } else {
      null
    }

    val detection = detector.detect(event, rootNode)
    val metadata = EventMetadata(
      eventType = event.eventType,
      packageName = packageName,
      timestamp = event.eventTime,
      reelFingerprint = detection.fingerprint,
      isCommentInteraction = detection.isCommentSection,
      isShortVideoActive = detection.isShortVideoActive
    )

    if (trace.size == MAX_TRACE_EVENTS) trace.removeFirst()
    trace.addLast(metadata)

    val candidate = reducer.reduce(metadata)
    PrototypeRuntimeStatus.recordEvent(candidate, trace.size, packageName, prefs)

    if (candidate) {
      consecutiveShortsInApp++
      val currentPkgCount = PrototypeRuntimeStatus.getPackageCount(canonicalPkg, prefs)
      val todayTotal = prefs.getTodayCount()
      val dailyLimit = prefs.getDailyShortLimit()
      val pkgLimit = prefs.getPackageLimit(canonicalPkg)
      val isPkgLimitHit = pkgLimit > 0 && currentPkgCount >= pkgLimit
      val isLimitHit = (todayTotal >= dailyLimit) || isPkgLimitHit

      // Update HUD overlay & Widget
      overlayHud?.updateCount(appLabel, currentPkgCount, isLimitHit)
      updateAmbientStatusNotification()
      PollyWidgetProvider.updateAllWidgets(applicationContext)

      // Re-check Grayscale filter after scroll
      checkGrayscaleFeedFilter()

      // Rapid "Fidget Swipe" Detector: 4+ swipes under 15 seconds
      recentSwipeTimes.addLast(now)
      while (recentSwipeTimes.isNotEmpty() && (now - recentSwipeTimes.first) > 15_000L) {
        recentSwipeTimes.removeFirst()
      }
      if (prefs.isFidgetSwipeEnabled() && recentSwipeTimes.size >= 4 && (now - lastFidgetAlertTime > 20_000L)) {
        lastFidgetAlertTime = now
        prefs.incrementFidgetSwipeCount()
        triggerFidgetDoubleBuzz()
        overlayHud?.showFidgetAlert()
        handler.post {
          Toast.makeText(
            applicationContext,
            "Polly: Speed-swiping without watching. Take a 3-breath pause.",
            Toast.LENGTH_LONG
          ).show()
        }
      }

      // "One Last Reel" Conscious Exit Contract
      if (isLimitHit) {
        if (prefs.isConsciousExitEnabled()) {
          if (!isConsciousExitActive) {
            isConsciousExitActive = true
            consciousExitSecondsLeft = 60
            overlayHud?.updateConsciousExit(consciousExitSecondsLeft)
            handler.removeCallbacks(consciousExitRunnable)
            handler.postDelayed(consciousExitRunnable, 1000L)
            triggerWarningVibration()
            handler.post {
              Toast.makeText(
                applicationContext,
                "One Last Reel Contract: Finish this video mindfully, then place your phone face down.",
                Toast.LENGTH_LONG
              ).show()
            }
          }
        } else {
          // Standard limit notifications if conscious exit is disabled
          if (todayTotal == dailyLimit || (isPkgLimitHit && currentPkgCount == pkgLimit) || (now - lastLimitAlertTime > 180_000L)) {
            lastLimitAlertTime = now
            val notifTitle = if (isPkgLimitHit) appLabel else "Daily"
            val notifLimit = if (isPkgLimitHit) pkgLimit else dailyLimit
            val notifCount = if (isPkgLimitHit) currentPkgCount else todayTotal
            sendLimitReachedNotification(notifCount, notifLimit, notifTitle)
            triggerWarningVibration()
          } else {
            triggerTickVibration()
          }
        }
      } else if (prefs.isDoomscrollAlertEnabled() && consecutiveShortsInApp >= 15 && (consecutiveShortsInApp % 10 == 5)) {
        if (now - lastDoomscrollAlertTime > 120_000L) {
          lastDoomscrollAlertTime = now
          sendDoomscrollNotification(consecutiveShortsInApp, appLabel)
          triggerWarningVibration()
        } else {
          triggerTickVibration()
        }
      } else {
        triggerTickVibration()
      }
    }

    handler.removeCallbacks(clearIdleState)
    handler.postDelayed(clearIdleState, TRACE_IDLE_TIMEOUT_MS)
  }

  private fun checkGrayscaleFeedFilter() {
    if (!prefs.isGrayscaleFilterEnabled()) {
      overlayHud?.setGrayscaleOverlay(false)
      return
    }
    val todayTotal = prefs.getTodayCount()
    val dailyLimit = prefs.getDailyShortLimit()
    val isOveruse = dailyLimit > 0 && todayTotal >= (dailyLimit * 0.8)
    val isBedtime = prefs.isBedtimeShieldActive()
    val mode = prefs.getGrayscaleTriggerMode()
    val shouldFilter = when (mode) {
      "overuse" -> isOveruse
      "bedtime" -> isBedtime
      else -> isOveruse || isBedtime
    }
    overlayHud?.setGrayscaleOverlay(shouldFilter)
  }

  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
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
      notificationManager?.createNotificationChannel(alertChannel)
      notificationManager?.createNotificationChannel(statusChannel)
    }
  }

  private fun updateAmbientStatusNotification() {
    val nm = notificationManager ?: return
    val total = prefs.getTodayCount()
    val limit = prefs.getDailyShortLimit()
    val percent = if (limit > 0) Math.min(100, (total * 100) / limit) else 0
    val launchPendingIntent = getLaunchPendingIntent()

    val focusIntent = Intent(this, com.reelcount.quicksettings.NotificationActionReceiver::class.java).apply {
      action = com.reelcount.quicksettings.NotificationActionReceiver.ACTION_START_FOCUS
    }
    val focusFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val focusPendingIntent = PendingIntent.getBroadcast(this, 201, focusIntent, focusFlags)

    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = android.app.Notification.Builder(this, CHANNEL_STATUS_ID)
          .setContentTitle("Polly: $total / $limit Shorts ($percent%)")
          .setContentText("Tap to open Dashboard · Stay mindful")
          .setSmallIcon(android.R.drawable.ic_menu_compass)
          .setOngoing(true)
          .setAutoCancel(false)

        if (launchPendingIntent != null) {
          builder.setContentIntent(launchPendingIntent)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          val icon = android.graphics.drawable.Icon.createWithResource(this, android.R.drawable.ic_lock_idle_lock)
          val action = android.app.Notification.Action.Builder(icon, "Focus 15m", focusPendingIntent).build()
          builder.addAction(action)
        } else {
          @Suppress("DEPRECATION")
          builder.addAction(
            android.R.drawable.ic_lock_idle_lock,
            "Focus 15m",
            focusPendingIntent
          )
        }

        nm.notify(NOTIFICATION_STATUS_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun getLaunchPendingIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    } ?: return null

    val flags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)

    return PendingIntent.getActivity(this, 0, launchIntent, flags)
  }

  private fun sendLimitReachedNotification(total: Int, limit: Int, label: String = "Daily") {
    val nm = notificationManager ?: return
    val pendingIntent = getLaunchPendingIntent()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val title = if (label == "Daily") "Polly: Daily Limit Reached" else "Polly: $label Limit Reached"
        val builder = android.app.Notification.Builder(this, CHANNEL_ID)
          .setContentTitle(title)
          .setContentText("You've watched $total shorts (Limit: $limit). Tap to take a mindful break.")
          .setSmallIcon(android.R.drawable.ic_dialog_alert)
          .setAutoCancel(true)

        if (pendingIntent != null) {
          builder.setContentIntent(pendingIntent)
        }

        nm.notify(NOTIFICATION_LIMIT_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun sendDoomscrollNotification(consecutive: Int, appName: String) {
    val nm = notificationManager ?: return
    val pendingIntent = getLaunchPendingIntent()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val builder = android.app.Notification.Builder(this, CHANNEL_ID)
          .setContentTitle("Doomscroll Loop Warning")
          .setContentText("$consecutive shorts watched in a row on $appName. Take a 4-4-4 breathing reset!")
          .setSmallIcon(android.R.drawable.ic_popup_reminder)
          .setAutoCancel(true)

        if (pendingIntent != null) {
          builder.setContentIntent(pendingIntent)
        }

        nm.notify(NOTIFICATION_DOOMSCROLL_ID, builder.build())
      }
    } catch (_: Exception) {}
  }

  private fun triggerTickVibration() {
    try {
      val vibrator = getVibrator() ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createOneShot(18, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(18)
      }
    } catch (_: Exception) {}
  }

  /**
   * Distinct double-buzz haptic pattern for the Rapid Fidget Swipe Detector.
   */
  private fun triggerFidgetDoubleBuzz() {
    try {
      val vibrator = getVibrator() ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val pattern = longArrayOf(0, 100, 60, 140)
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(longArrayOf(0, 100, 60, 140), -1)
      }
    } catch (_: Exception) {}
  }

  private fun triggerWarningVibration() {
    try {
      val vibrator = getVibrator() ?: return
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val pattern = longArrayOf(0, 150, 100, 250)
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(longArrayOf(0, 150, 100, 250), -1)
      }
    } catch (_: Exception) {}
  }

  private fun getVibrator(): Vibrator? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
      vm?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
  }

  override fun onInterrupt() {
    handler.removeCallbacks(clearIdleState)
    handler.removeCallbacks(consciousExitRunnable)
    trace.clear()
    reducer.reset()
    consecutiveShortsInApp = 0
    isConsciousExitActive = false
    PrototypeRuntimeStatus.interrupted()
    overlayHud?.hide()
    overlayHud?.setGrayscaleOverlay(false)
  }

  override fun onUnbind(intent: Intent?): Boolean {
    clearTransientState()
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    clearTransientState()
    overlayHud?.destroy()
    overlayHud = null
    super.onDestroy()
  }

  private fun clearTransientState() {
    handler.removeCallbacks(clearIdleState)
    handler.removeCallbacks(consciousExitRunnable)
    trace.clear()
    reducer.reset()
    consecutiveShortsInApp = 0
    isConsciousExitActive = false
    PrototypeRuntimeStatus.disconnected()
    overlayHud?.hide()
    overlayHud?.setGrayscaleOverlay(false)
    currentActivePackage = null
    try {
      notificationManager?.cancel(NOTIFICATION_STATUS_ID)
    } catch (_: Exception) {}
  }

  private fun clearIdleTrace() {
    trace.clear()
    consecutiveShortsInApp = 0
    recentSwipeTimes.clear()
    PrototypeRuntimeStatus.clearTrace()
  }

  private companion object {
    const val MAX_TRACE_EVENTS = 32
    const val TRACE_IDLE_TIMEOUT_MS = 30_000L
    const val CHANNEL_ID = "reelcount_alerts"
    const val CHANNEL_STATUS_ID = "reelcount_status"
    const val NOTIFICATION_LIMIT_ID = 1001
    const val NOTIFICATION_DOOMSCROLL_ID = 1002
    const val NOTIFICATION_STATUS_ID = 1003
  }
}
