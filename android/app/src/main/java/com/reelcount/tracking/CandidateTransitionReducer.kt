package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent

/**
 * Event metadata retained by the tracking engine.
 * Includes optional reel fingerprint, comment section exclusion, and pager index signals.
 */
internal data class EventMetadata(
  val eventType: Int,
  val packageName: String,
  val timestamp: Long,
  val reelFingerprint: String? = null,
  val isCommentInteraction: Boolean = false,
  val isShortVideoActive: Boolean = true,
  val pagerIndex: Int? = null,
)

/**
 * Pure transition reducer with token-aware fingerprint deduplication,
 * comments-section exclusion, progressive UI load suppression, and temporal burst debouncing.
 */
internal class CandidateTransitionReducer(
  private val debounceMillis: Long = DEFAULT_DEBOUNCE_MILLIS,
) {
  private var lastCandidateTimestamp: Long? = null
  private var lastScrollEventTimestamp: Long? = null
  private var lastReelFingerprint: String? = null
  private var lastPagerIndex: Int? = null
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

    val isScrollOrSelect =
      event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED ||
      event.eventType == AccessibilityEvent.TYPE_VIEW_SELECTED

    if (isScrollOrSelect) {
      val prevScroll = lastScrollEventTimestamp
      if (prevScroll == null || event.timestamp >= prevScroll) {
        lastScrollEventTimestamp = event.timestamp
      }
    }

    val previousTimestamp = lastCandidateTimestamp

    // Track explicit forward pager index transitions (handles back-to-back videos with identical creator/audio)
    val explicitForwardPagerMove =
      isScrollOrSelect &&
      event.pagerIndex != null &&
      lastPagerIndex != null &&
      event.pagerIndex > lastPagerIndex!! &&
      (previousTimestamp == null || event.timestamp - previousTimestamp >= debounceMillis)

    // Fingerprint-based detection: unique video transition
    if (event.reelFingerprint != null) {
      val sameAsCurrent = isSameVideoFingerprint(lastReelFingerprint, event.reelFingerprint)

      if (sameAsCurrent) {
        // Update stored fingerprint if the new snapshot carries strictly more tokens
        if (lastReelFingerprint != null && tokenList(event.reelFingerprint).size > tokenList(lastReelFingerprint!!).size) {
          lastReelFingerprint = event.reelFingerprint
          recordRecentFingerprint(event.reelFingerprint)
        }
        if (explicitForwardPagerMove) {
          lastPagerIndex = event.pagerIndex
          lastCandidateTimestamp = event.timestamp
          pendingFallbackBinding = false
          return true
        }
        return false
      }

      // Deduplicate against recent session videos (prevents swiping back up & down from inflating count)
      if (recentFingerprints.any { isSameVideoFingerprint(it, event.reelFingerprint) }) {
        return false
      }

      // If only the secondary caption/audio mutated on the SAME creator WITHOUT any recent scroll,
      // suppress to prevent audio marquee or CTA fade-in from overcounting on a single reel.
      val hadRecentScroll = lastScrollEventTimestamp?.let {
        event.timestamp >= it && (event.timestamp - it) <= RECENT_SCROLL_WINDOW_MILLIS
      } ?: false
      if (!isScrollOrSelect && !pendingFallbackBinding && !hadRecentScroll && sharesPrimaryIdentity(lastReelFingerprint, event.reelFingerprint)) {
        return false
      }

      // If a fallback scroll just counted this transition recently (<1200ms),
      // bind the new video's fingerprint to prevent double counting on settle.
      if (pendingFallbackBinding) {
        val timeSinceFallback = fallbackCandidateTimestamp?.let { event.timestamp - it } ?: Long.MAX_VALUE
        if (timeSinceFallback in 0..1200L) {
          lastReelFingerprint = event.reelFingerprint
          recordRecentFingerprint(event.reelFingerprint)
          if (event.pagerIndex != null) lastPagerIndex = event.pagerIndex
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
      if (event.pagerIndex != null) lastPagerIndex = event.pagerIndex
      lastCandidateTimestamp = event.timestamp
      pendingFallbackBinding = false
      return true
    }

    // Fallback detection: view scroll or item select events (only when no fingerprint is available)
    if (!isScrollOrSelect) {
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
    if (event.pagerIndex != null) lastPagerIndex = event.pagerIndex
    pendingFallbackBinding = true
    lastReelFingerprint = null
    return true
  }

  private fun tokenList(fingerprint: String): List<String> {
    val body = fingerprint.substringAfter(':', fingerprint)
    return body.split("||").map { it.trim().lowercase() }.filter { it.isNotEmpty() }
  }

  private fun isSameVideoFingerprint(existing: String?, candidate: String): Boolean {
    if (existing == null) return false
    if (existing == candidate) return true

    val existingPkg = existing.substringBefore(':', "")
    val candidatePkg = candidate.substringBefore(':', "")
    if (existingPkg.isNotEmpty() && candidatePkg.isNotEmpty() && existingPkg != candidatePkg) {
      return false
    }

    val existingTokens = tokenList(existing)
    val candidateTokens = tokenList(candidate)
    if (existingTokens.isEmpty() || candidateTokens.isEmpty()) return false

    // Subset/superset match handles progressive loading and control overlay fade-out on the same video
    return existingTokens.all { it in candidateTokens } || candidateTokens.all { it in existingTokens }
  }

  private fun sharesPrimaryIdentity(existing: String?, candidate: String): Boolean {
    if (existing == null) return false
    val existingTokens = tokenList(existing)
    val candidateTokens = tokenList(candidate)
    if (existingTokens.isEmpty() || candidateTokens.isEmpty()) return false
    return existingTokens.first() == candidateTokens.first()
  }

  private fun recordRecentFingerprint(fp: String) {
    if (recentFingerprints.size >= MAX_RECENT_FINGERPRINTS) {
      recentFingerprints.removeFirst()
    }
    recentFingerprints.addLast(fp)
  }

  fun reset() {
    lastCandidateTimestamp = null
    lastScrollEventTimestamp = null
    lastReelFingerprint = null
    lastPagerIndex = null
    pendingFallbackBinding = false
    fallbackCandidateTimestamp = null
    recentFingerprints.clear()
  }

  private companion object {
    const val DEFAULT_DEBOUNCE_MILLIS = 700L
    const val MIN_FINGERPRINT_TRANSITION_MILLIS = 200L
    const val RECENT_SCROLL_WINDOW_MILLIS = 1_500L
    const val MAX_RECENT_FINGERPRINTS = 12
  }
}
