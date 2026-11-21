package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent

/**
 * Event metadata retained by the tracking engine.
 * Includes optional reel fingerprint and comment section flags for precision tracking.
 */
internal data class EventMetadata(
  val eventType: Int,
  val packageName: String,
  val timestamp: Long,
  val reelFingerprint: String? = null,
  val isCommentInteraction: Boolean = false,
  val isShortVideoActive: Boolean = true,
)

/**
 * Pure transition reducer with fingerprint-based video deduplication,
 * comments-section exclusion, and temporal burst debouncing.
 */
internal class CandidateTransitionReducer(
  private val debounceMillis: Long = DEFAULT_DEBOUNCE_MILLIS,
) {
  private var lastCandidateTimestamp: Long? = null
  private var lastReelFingerprint: String? = null
  private var pendingFallbackBinding = false
  private var fallbackCandidateTimestamp: Long? = null
  private val recentFingerprints = java.util.ArrayDeque<String>(MAX_RECENT_FINGERPRINTS)

  fun reduce(event: EventMetadata): Boolean {
    if (event.packageName !in TargetPackages.all) {
      return false
    }

    // Must be actively viewing a short-form video (not general feed, profiles, or DMs)
    if (!event.isShortVideoActive) {
      return false
    }

    // Explicit comment interactions are never counted as short-video transitions
    if (event.isCommentInteraction) {
      return false
    }

    val previousTimestamp = lastCandidateTimestamp

    // Fingerprint-based detection: unique video transition
    if (event.reelFingerprint != null) {
      // Deduplicate: identical video fingerprint or recently viewed video in this session never counts again
      if (event.reelFingerprint == lastReelFingerprint || event.reelFingerprint in recentFingerprints) {
        return false
      }

      // If a fallback scroll just counted this transition recently (<1200ms),
      // bind the new video's fingerprint to prevent double counting on settle.
      if (pendingFallbackBinding) {
        val timeSinceFallback = fallbackCandidateTimestamp?.let { event.timestamp - it } ?: Long.MAX_VALUE
        if (timeSinceFallback in 0..1200L) {
          lastReelFingerprint = event.reelFingerprint
          recordRecentFingerprint(event.reelFingerprint)
          pendingFallbackBinding = false
          return false
        }
        pendingFallbackBinding = false
      }

      // Fast transition between distinct video fingerprints (allow rapid skips down to 200ms)
      if (
        previousTimestamp != null &&
        (event.timestamp < previousTimestamp || event.timestamp - previousTimestamp < MIN_FINGERPRINT_TRANSITION_MILLIS)
      ) {
        return false
      }

      lastReelFingerprint = event.reelFingerprint
      recordRecentFingerprint(event.reelFingerprint)
      lastCandidateTimestamp = event.timestamp
      pendingFallbackBinding = false
      return true
    }

    // Fallback detection: view scroll or item select events
    if (
      event.eventType != AccessibilityEvent.TYPE_VIEW_SCROLLED &&
      event.eventType != AccessibilityEvent.TYPE_VIEW_SELECTED
    ) {
      return false
    }

    if (
      previousTimestamp != null &&
      (event.timestamp < previousTimestamp || event.timestamp - previousTimestamp < debounceMillis)
    ) {
      return false
    }

    lastCandidateTimestamp = event.timestamp
    fallbackCandidateTimestamp = event.timestamp
    pendingFallbackBinding = true
    lastReelFingerprint = null
    return true
  }

  private fun recordRecentFingerprint(fp: String) {
    if (recentFingerprints.size >= MAX_RECENT_FINGERPRINTS) {
      recentFingerprints.removeFirst()
    }
    recentFingerprints.addLast(fp)
  }

  fun reset() {
    lastCandidateTimestamp = null
    lastReelFingerprint = null
    pendingFallbackBinding = false
    fallbackCandidateTimestamp = null
    recentFingerprints.clear()
  }

  private companion object {
    const val DEFAULT_DEBOUNCE_MILLIS = 700L
    const val MIN_FINGERPRINT_TRANSITION_MILLIS = 200L
    const val MAX_RECENT_FINGERPRINTS = 8
  }
}
