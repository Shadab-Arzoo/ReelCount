package com.reelcount.tracking

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Outline
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewOutlineProvider
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import com.reelcount.R

/**
 * Interactive on-screen floating HUD overlay that displays live scroll counts
 * over supported short-form video applications using TYPE_ACCESSIBILITY_OVERLAY.
 *
 * Enhanced features:
 * - Polly Mascot Integration with 3 Adaptive Expression States:
 *     • 0–25 Swipes: Calm & Cheerful (mint glow, headphones on)
 *     • 25–50 Swipes: Attentive (amber glow, pointing to checklist)
 *     • 50+ Swipes: Sleepy/Concerned (rose pulse, gentle hand)
 * - Rapid Fidget Swipe alert overlay mode
 * - "One Last Reel" Conscious Exit Contract 60s wind-down countdown
 * - Post-Session Reality Check (3-Second Micro-Log) floating card
 * - Grayscale Feed Filter monochrome overlay & Daltonizer integration
 * - Draggable screen position memory & tactile feedback
 */
class ReelCountOverlayHud(private val context: Context) {
  private val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
  private val handler = Handler(Looper.getMainLooper())
  private val prefs = ReelCountPreferences.getInstance(context)

  private var hudView: LinearLayout? = null
  private var titleView: TextView? = null
  private var counterView: TextView? = null
  private var iconView: TextView? = null
  private var mascotContainer: FrameLayout? = null
  private var mascotImageView: ImageView? = null
  private var backgroundDrawable: GradientDrawable? = null
  private var mascotRingDrawable: GradientDrawable? = null
  private var isAttached = false
  private var isVisible = false

  // Reality Check Overlay
  private var realityCheckView: View? = null
  private var isRealityCheckShowing = false

  // Grayscale Filter Overlay
  private var grayscaleOverlayView: View? = null
  private var isGrayscaleOverlayShowing = false

  // Alert State Flags
  private var isFidgetAlertActive = false
  private var isConsciousExitActive = false
  private var speedbumpActive = false
  private val speedbumpRunnables = mutableListOf<Runnable>()
  private var fidgetResetRunnable: Runnable? = null

  // Display cycle: 0 = Current App, 1 = Daily Total / Limit, 2 = Estimated Minutes
  private var displayCycleMode = 0
  private var currentAppLabel = "Shorts"
  private var currentAppCount = 0
  private var isCurrentLimitReached = false

  private val layoutParams = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
      WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
    PixelFormat.TRANSLUCENT
  ).apply {
    gravity = Gravity.TOP or Gravity.END
    val savedPos = prefs.getSavedHudPosition()
    if (savedPos != null) {
      x = savedPos.first
      y = savedPos.second
    } else {
      x = dpToPx(16)
      y = dpToPx(72)
    }
  }

  init {
    handler.post { setupView() }
  }

  private fun getThemeAccentColor(): Int {
    return when (prefs.getThemeAccent().lowercase()) {
      "mint", "emerald" -> Color.parseColor("#6EE3AD")
      "cyan" -> Color.parseColor("#38BDF8")
      "amethyst" -> Color.parseColor("#C084FC")
      "amber" -> Color.parseColor("#FBBF24")
      "rose" -> Color.parseColor("#FB7185")
      "monochrome" -> Color.parseColor("#F9F8F9")
      else -> Color.parseColor("#6EE3AD")
    }
  }

  private fun setupView() {
    if (hudView != null) return

    val accent = getThemeAccentColor()
    val bg = GradientDrawable().apply {
      shape = GradientDrawable.RECTANGLE
      cornerRadius = dpToPx(24).toFloat()
      setColor(Color.parseColor("#E60B0B0B"))
      setStroke(dpToPx(2), accent)
    }
    backgroundDrawable = bg

    val container = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      val padH = dpToPx(12)
      val padV = dpToPx(7)
      setPadding(padH, padV, padH, padV)
      background = bg
      elevation = dpToPx(8).toFloat()
    }

    // Mascot Circular Avatar with Adaptive Ring Glow
    val mascotSize = dpToPx(28)
    val ring = GradientDrawable().apply {
      shape = GradientDrawable.OVAL
      setColor(Color.parseColor("#201A35"))
      setStroke(dpToPx(2), accent)
    }
    mascotRingDrawable = ring

    val mascotFrame = FrameLayout(context).apply {
      val frameSize = dpToPx(32)
      layoutParams = LinearLayout.LayoutParams(frameSize, frameSize).apply {
        marginEnd = dpToPx(8)
      }
      background = ring
      val pad = dpToPx(2)
      setPadding(pad, pad, pad, pad)
    }

    val mascotImg = ImageView(context).apply {
      layoutParams = FrameLayout.LayoutParams(mascotSize, mascotSize).apply {
        gravity = Gravity.CENTER
      }
      scaleType = ImageView.ScaleType.CENTER_CROP
      try {
        setImageResource(R.drawable.polly_mascot)
      } catch (_: Exception) {}

      clipToOutline = true
      outlineProvider = object : ViewOutlineProvider() {
        override fun getOutline(view: View, outline: Outline) {
          outline.setOval(0, 0, view.width, view.height)
        }
      }
    }
    mascotFrame.addView(mascotImg)
    mascotContainer = mascotFrame
    mascotImageView = mascotImg

    val icon = TextView(context).apply {
      text = "✦ "
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      setTextColor(accent)
      visibility = View.GONE // Mascot takes front stage
    }

    val title = TextView(context).apply {
      text = "Shorts: "
      setTextColor(Color.parseColor("#E5E5E4"))
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    val counter = TextView(context).apply {
      text = "0"
      setTextColor(accent)
      setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    }

    container.addView(mascotFrame)
    container.addView(icon)
    container.addView(title)
    container.addView(counter)

    // Interactive gestures: Drag to reposition, Tap to cycle modes, Long-press to launch ReelCount
    var initialX = 0
    var initialY = 0
    var touchStartX = 0f
    var touchStartY = 0f
    var touchStartTime = 0L

    container.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = layoutParams.x
          initialY = layoutParams.y
          touchStartX = event.rawX
          touchStartY = event.rawY
          touchStartTime = System.currentTimeMillis()
          true
        }
        MotionEvent.ACTION_MOVE -> {
          val deltaX = (event.rawX - touchStartX).toInt()
          val deltaY = (event.rawY - touchStartY).toInt()
          layoutParams.x = initialX - deltaX
          layoutParams.y = initialY + deltaY
          if (isAttached && hudView != null) {
            try {
              windowManager?.updateViewLayout(hudView, layoutParams)
            } catch (_: Exception) {}
          }
          true
        }
        MotionEvent.ACTION_UP -> {
          val deltaX = Math.abs(event.rawX - touchStartX)
          val deltaY = Math.abs(event.rawY - touchStartY)
          val duration = System.currentTimeMillis() - touchStartTime
          val isTap = deltaX < dpToPx(10) && deltaY < dpToPx(10)

          if (isTap) {
            if (duration >= 500) {
              // Long Press: Launch ReelCount Dashboard
              triggerHaptic(30)
              launchReelCountApp()
            } else {
              // Single Tap: Cycle HUD metrics
              triggerHaptic(12)
              displayCycleMode = (displayCycleMode + 1) % 3
              updateContent(currentAppLabel, currentAppCount, isCurrentLimitReached)
              pulse()
            }
          } else {
            // Drag completed: Persist user's preferred HUD coordinates
            prefs.saveHudPosition(layoutParams.x, layoutParams.y)
          }
          true
        }
        else -> false
      }
    }

    hudView = container
    titleView = title
    counterView = counter
    iconView = icon
  }

  fun show(appLabel: String, count: Int, limitReached: Boolean = false) {
    handler.post {
      ensureAttached()
      currentAppLabel = appLabel
      currentAppCount = count
      isCurrentLimitReached = limitReached

      if (prefs.isSpeedbumpEnabled()) {
        triggerSpeedbump(appLabel, count, limitReached)
      } else {
        applyHudStyleVisibility(limitReached)
        updateContent(appLabel, count, limitReached)
        pulse()
      }
    }
  }

  private fun cancelSpeedbumpTimers() {
    for (r in speedbumpRunnables) {
      handler.removeCallbacks(r)
    }
    speedbumpRunnables.clear()
    speedbumpActive = false
  }

  private fun cancelPendingOverlayTimers() {
    cancelSpeedbumpTimers()
    fidgetResetRunnable?.let { handler.removeCallbacks(it) }
    fidgetResetRunnable = null
    isFidgetAlertActive = false
  }

  private fun triggerSpeedbump(appLabel: String, count: Int, limitReached: Boolean) {
    cancelSpeedbumpTimers()

    speedbumpActive = true
    hudView?.visibility = View.VISIBLE
    isVisible = true

    val accent = getThemeAccentColor()
    titleView?.visibility = View.VISIBLE
    titleView?.text = "Polly Pause: "
    titleView?.setTextColor(accent)
    counterView?.text = "3s"
    counterView?.setTextColor(accent)
    backgroundDrawable?.setStroke(dpToPx(2), accent)
    mascotRingDrawable?.setStroke(dpToPx(2), accent)
    pulse()

    val step2 = Runnable {
      if (speedbumpActive) {
        counterView?.text = "2s"
        pulse()
      }
    }
    val step1 = Runnable {
      if (speedbumpActive) {
        counterView?.text = "1s"
        pulse()
      }
    }
    val finish = Runnable {
      if (speedbumpActive) {
        speedbumpActive = false
        speedbumpRunnables.clear()
        applyHudStyleVisibility(limitReached)
        updateContent(appLabel, count, limitReached)
        pulse()
      }
    }
    speedbumpRunnables.addAll(listOf(step2, step1, finish))
    handler.postDelayed(step2, 1000L)
    handler.postDelayed(step1, 2000L)
    handler.postDelayed(finish, 3000L)
  }

  fun updateCount(appLabel: String, count: Int, limitReached: Boolean = false) {
    handler.post {
      ensureAttached()
      currentAppLabel = appLabel
      currentAppCount = count
      isCurrentLimitReached = limitReached
      cancelSpeedbumpTimers()
      if (!isFidgetAlertActive && !isConsciousExitActive) {
        applyHudStyleVisibility(limitReached)
        updateContent(appLabel, count, limitReached)
        pulse()
      }
    }
  }

  /**
   * Rapid Fidget Swipe Warning Alert:
   * Temporarily shifts HUD into a mindful pause alert state with double pulse.
   */
  fun showFidgetAlert() {
    handler.post {
      ensureAttached()
      fidgetResetRunnable?.let { handler.removeCallbacks(it) }
      isFidgetAlertActive = true
      hudView?.visibility = View.VISIBLE
      isVisible = true

      val warningColor = Color.parseColor("#FBBF24") // Amber
      mascotRingDrawable?.setStroke(dpToPx(2), warningColor)
      backgroundDrawable?.setStroke(dpToPx(2), warningColor)
      titleView?.text = "Speed-Swiping! "
      titleView?.setTextColor(warningColor)
      counterView?.text = "Take 3 breaths"
      counterView?.setTextColor(Color.parseColor("#FFFFFF"))
      pulse(isWarning = true)

      val resetTask = Runnable {
        isFidgetAlertActive = false
        fidgetResetRunnable = null
        updateContent(currentAppLabel, currentAppCount, isCurrentLimitReached)
        pulse()
      }
      fidgetResetRunnable = resetTask
      handler.postDelayed(resetTask, 4000L)
    }
  }

  /**
   * "One Last Reel" Conscious Exit Contract:
   * Displays the 60s countdown wind-down banner.
   */
  fun updateConsciousExit(secondsRemaining: Int) {
    handler.post {
      ensureAttached()
      isConsciousExitActive = true
      hudView?.visibility = View.VISIBLE
      isVisible = true

      val roseColor = Color.parseColor("#FB7185")
      mascotRingDrawable?.setStroke(dpToPx(2), roseColor)
      backgroundDrawable?.setStroke(dpToPx(2), roseColor)
      titleView?.text = "One Last Reel: "
      titleView?.setTextColor(roseColor)
      counterView?.text = "${secondsRemaining}s"
      counterView?.setTextColor(Color.parseColor("#FFFFFF"))
      pulse(isWarning = true)
    }
  }

  fun endConsciousExit() {
    handler.post {
      isConsciousExitActive = false
      updateContent(currentAppLabel, currentAppCount, isCurrentLimitReached)
    }
  }

  private fun applyHudStyleVisibility(limitReached: Boolean) {
    val style = prefs.getHudStyle()
    val todayTotal = prefs.getTodayCount()
    val dailyLimit = prefs.getDailyShortLimit()

    if (style == "warning_only") {
      val isNearLimit = todayTotal >= (dailyLimit * 0.8)
      if (limitReached || isNearLimit) {
        hudView?.visibility = View.VISIBLE
        isVisible = true
      } else {
        hudView?.visibility = View.GONE
        isVisible = false
      }
      return
    }

    hudView?.visibility = View.VISIBLE
    isVisible = true
  }

  /**
   * Updates HUD metrics and Polly's 3 Adaptive Expression States:
   *   • 0–25 Swipes: Calm & Cheerful (mint glow)
   *   • 25–50 Swipes: Attentive (amber glow)
   *   • 50+ Swipes: Sleepy/Concerned (rose alert glow)
   */
  private fun updateContent(appLabel: String, count: Int, limitReached: Boolean) {
    val style = prefs.getHudStyle()
    val shortLabel = TargetPackages.getShortBadgeLabel(appLabel)
    val todayTotal = prefs.getTodayCount()
    val dailyLimit = prefs.getDailyShortLimit()
    val estimatedMins = (todayTotal * 30) / 60

    val isDot = style == "dot"

    if (isDot) {
      titleView?.visibility = View.GONE
      counterView?.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
      val pad = dpToPx(6)
      hudView?.setPadding(pad, pad, pad, pad)
    } else {
      titleView?.visibility = View.VISIBLE
      counterView?.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
      val padH = dpToPx(12)
      val padV = dpToPx(7)
      hudView?.setPadding(padH, padV, padH, padV)
    }

    // Determine Polly's expression mood ring color based on swipe count:
    val mascotColor = when {
      limitReached -> Color.parseColor("#EF4444")
      todayTotal < 25 -> getThemeAccentColor() // Calm & Cheerful (follows Sanctuary theme)
      todayTotal < 50 -> Color.parseColor("#FBBF24") // Attentive
      else -> Color.parseColor("#FB7185")            // Sleepy / Concerned
    }
    mascotRingDrawable?.setStroke(dpToPx(2), mascotColor)

    if (limitReached) {
      when (displayCycleMode) {
        0 -> {
          titleView?.text = "Limit Hit! "
          counterView?.text = "$count"
        }
        1 -> {
          titleView?.text = "Today: "
          counterView?.text = "$todayTotal/$dailyLimit"
        }
        else -> {
          titleView?.text = "Time: "
          counterView?.text = "${estimatedMins}m"
        }
      }
      titleView?.setTextColor(Color.parseColor("#FCA5A5"))
      counterView?.setTextColor(Color.parseColor("#EF4444"))
      backgroundDrawable?.setStroke(dpToPx(2), Color.parseColor("#EF4444"))
    } else {
      val accent = getThemeAccentColor()
      when (displayCycleMode) {
        0 -> {
          titleView?.text = "$shortLabel: "
          counterView?.text = "$count"
        }
        1 -> {
          titleView?.text = "Today: "
          counterView?.text = "$todayTotal/$dailyLimit"
        }
        else -> {
          titleView?.text = "Time: "
          counterView?.text = "${estimatedMins}m"
        }
      }
      titleView?.setTextColor(Color.parseColor("#E5E5E4"))
      counterView?.setTextColor(accent)
      backgroundDrawable?.setStroke(dpToPx(2), accent)
    }
  }

  /**
   * Post-Session Reality Check (3-Second Micro-Log):
   * Floating interactive toast/card presented when user exits a 15+ minute session.
   */
  fun showRealityCheckCard(appName: String, durationMinutes: Int, onResult: (rating: String) -> Unit) {
    handler.post {
      if (isRealityCheckShowing || windowManager == null) return@post
      isRealityCheckShowing = true

      val accent = getThemeAccentColor()
      val cardBg = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        cornerRadius = dpToPx(18).toFloat()
        setColor(Color.parseColor("#F012111A"))
        setStroke(dpToPx(1.5f.toInt()), accent)
      }

      val dialog = LinearLayout(context).apply {
        orientation = LinearLayout.VERTICAL
        background = cardBg
        val pad = dpToPx(16)
        setPadding(pad, pad, pad, pad)
        elevation = dpToPx(12).toFloat()
      }

      // Header row with Mascot + Title
      val headerRow = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER_VERTICAL
        val mb = dpToPx(8)
        setPadding(0, 0, 0, mb)
      }

      val mascotSmall = ImageView(context).apply {
        val s = dpToPx(24)
        layoutParams = LinearLayout.LayoutParams(s, s).apply { marginEnd = dpToPx(8) }
        try { setImageResource(R.drawable.polly_mascot) } catch (_: Exception) {}
        clipToOutline = true
        outlineProvider = object : ViewOutlineProvider() {
          override fun getOutline(v: View, o: Outline) { o.setOval(0, 0, v.width, v.height) }
        }
      }

      val headerText = TextView(context).apply {
        text = "POLLY · REALITY CHECK"
        setTextColor(accent)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
        setTypeface(typeface, android.graphics.Typeface.BOLD)
        letterSpacing = 0.08f
      }

      headerRow.addView(mascotSmall)
      headerRow.addView(headerText)
      dialog.addView(headerRow)

      // Question body
      val question = TextView(context).apply {
        text = "You spent $durationMinutes minutes on $appName.\nDid that feel nourishing or draining?"
        setTextColor(Color.parseColor("#FFFFFF"))
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        val mb = dpToPx(12)
        setPadding(0, 0, 0, mb)
      }
      dialog.addView(question)

      // Actions row
      val actionsRow = LinearLayout(context).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
      }

      fun makeBtn(label: String, colorHex: String, onClick: () -> Unit): TextView {
        val btnBg = GradientDrawable().apply {
          shape = GradientDrawable.RECTANGLE
          cornerRadius = dpToPx(12).toFloat()
          setColor(Color.parseColor("#26" + colorHex.removePrefix("#")))
          setStroke(dpToPx(1), Color.parseColor(colorHex))
        }
        return TextView(context).apply {
          text = label
          setTextColor(Color.parseColor(colorHex))
          setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
          setTypeface(typeface, android.graphics.Typeface.BOLD)
          background = btnBg
          val padH = dpToPx(14)
          val padV = dpToPx(8)
          setPadding(padH, padV, padH, padV)
          isClickable = true
          isFocusable = true
          setOnClickListener { onClick() }
        }
      }

      fun dismissRealityCheck() {
        if (realityCheckView != null && isRealityCheckShowing) {
          try {
            windowManager.removeView(realityCheckView)
          } catch (_: Exception) {}
          realityCheckView = null
          isRealityCheckShowing = false
        }
      }

      val btnNourishing = makeBtn("✦ Nourishing", "#6EE3AD") {
        triggerHaptic(20)
        onResult("nourishing")
        Toast.makeText(context, "Polly: Logged as Nourishing. Metacognition +10 XP!", Toast.LENGTH_SHORT).show()
        dismissRealityCheck()
      }

      val btnDraining = makeBtn("◈ Draining", "#FB7185") {
        triggerHaptic(20)
        onResult("draining")
        Toast.makeText(context, "Polly: Logged as Draining. A gentle reminder to pause sooner next time.", Toast.LENGTH_SHORT).show()
        dismissRealityCheck()
      }

      val spacer = View(context).apply {
        layoutParams = LinearLayout.LayoutParams(dpToPx(12), 1)
      }

      actionsRow.addView(btnNourishing)
      actionsRow.addView(spacer)
      actionsRow.addView(btnDraining)
      dialog.addView(actionsRow)

      val params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
        PixelFormat.TRANSLUCENT
      ).apply {
        gravity = Gravity.CENTER_HORIZONTAL or Gravity.BOTTOM
        y = dpToPx(96)
      }

      realityCheckView = dialog
      try {
        windowManager.addView(dialog, params)
      } catch (_: Exception) {
        isRealityCheckShowing = false
      }

      // Auto-dismiss after 9 seconds if untouched
      handler.postDelayed({ dismissRealityCheck() }, 9000L)
    }
  }

  /**
   * Grayscale Feed Filter on Overuse:
   * Strips color to eliminate hypnotic dopamine saturation.
   * Attempts system Daltonizer & applies a non-touchable desaturating overlay.
   */
  fun setGrayscaleOverlay(enable: Boolean) {
    handler.post {
      // 1. Attempt system Daltonizer toggle (if WRITE_SECURE_SETTINGS granted)
      try {
        Settings.Secure.putInt(context.contentResolver, "accessibility_display_daltonizer", 0)
        Settings.Secure.putInt(context.contentResolver, "accessibility_display_daltonizer_enabled", if (enable) 1 else 0)
      } catch (_: Exception) {}

      // 2. Full-screen desaturating overlay view
      if (enable) {
        if (grayscaleOverlayView == null && windowManager != null) {
          val filterView = View(context).apply {
            setBackgroundColor(Color.parseColor("#44808080")) // Semi-transparent desaturating layer
          }
          val filterParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
              WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
              WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
          )
          try {
            windowManager.addView(filterView, filterParams)
            grayscaleOverlayView = filterView
            isGrayscaleOverlayShowing = true
          } catch (_: Exception) {}
        }
      } else {
        if (grayscaleOverlayView != null && windowManager != null) {
          try {
            windowManager.removeView(grayscaleOverlayView)
          } catch (_: Exception) {}
          grayscaleOverlayView = null
          isGrayscaleOverlayShowing = false
        }
      }
    }
  }

  private fun launchReelCountApp() {
    try {
      val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      }
      if (intent != null) {
        Toast.makeText(context, "Opening Polly Dashboard...", Toast.LENGTH_SHORT).show()
        context.startActivity(intent)
      }
    } catch (_: Exception) {}
  }

  private fun triggerHaptic(durationMs: Long) {
    try {
      val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        val vm = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
        vm?.defaultVibrator
      } else {
        @Suppress("DEPRECATION")
        context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
      } else {
        @Suppress("DEPRECATION")
        vibrator?.vibrate(durationMs)
      }
    } catch (_: Exception) {}
  }

  fun hide() {
    handler.post {
      cancelPendingOverlayTimers()
      if (isVisible) {
        hudView?.visibility = View.GONE
        isVisible = false
      }
    }
  }

  fun destroy() {
    handler.post {
      cancelPendingOverlayTimers()
      setGrayscaleOverlay(false)
      if (realityCheckView != null) {
        try { windowManager?.removeView(realityCheckView) } catch (_: Exception) {}
        realityCheckView = null
      }
      if (isAttached && hudView != null) {
        try { windowManager?.removeView(hudView) } catch (_: Exception) {}
        isAttached = false
        isVisible = false
      }
    }
  }

  private fun ensureAttached() {
    if (hudView == null) {
      setupView()
    }
    if (!isAttached && hudView != null && windowManager != null) {
      try {
        windowManager.addView(hudView, layoutParams)
        isAttached = true
      } catch (_: Exception) {}
    }
  }

  private fun pulse(isWarning: Boolean = false) {
    val view = hudView ?: return
    try {
      if (isWarning || isCurrentLimitReached) {
        // Double heartbeat pulse for limit alert
        val scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 1.0f, 1.25f, 0.95f, 1.22f, 1.0f)
        val scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 1.0f, 1.25f, 0.95f, 1.22f, 1.0f)
        ObjectAnimator.ofPropertyValuesHolder(view, scaleX, scaleY).apply {
          duration = 420
          interpolator = android.view.animation.AccelerateDecelerateInterpolator()
          start()
        }
      } else {
        // Juicy, tactile spring bounce with overshoot
        val scaleX = PropertyValuesHolder.ofFloat(View.SCALE_X, 1.0f, 1.22f, 0.96f, 1.0f)
        val scaleY = PropertyValuesHolder.ofFloat(View.SCALE_Y, 1.0f, 1.22f, 0.96f, 1.0f)
        ObjectAnimator.ofPropertyValuesHolder(view, scaleX, scaleY).apply {
          duration = 280
          interpolator = android.view.animation.OvershootInterpolator(2.4f)
          start()
        }
      }
    } catch (_: Exception) {}
  }

  private fun dpToPx(dp: Int): Int {
    return TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      dp.toFloat(),
      context.resources.displayMetrics
    ).toInt()
  }
}
