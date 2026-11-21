package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class CandidateTransitionReducerTest {
  private val reducer = CandidateTransitionReducer(debounceMillis = 700L)

  @Test
  fun firstScrollEventFromTargetIsCandidate() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.TIKTOK, 1_000L)))
  }

  @Test
  fun repeatedScrollBurstWithinDebounceIsSuppressed() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM, 1_699L)))
  }

  @Test
  fun scrollAtDebounceBoundaryIsCandidate() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.SNAPCHAT, 1_000L)))
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.SNAPCHAT, 1_700L)))
  }

  @Test
  fun unrelatedEventAndPackageAreNotCandidates() {
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED, TargetPackages.YOUTUBE, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, "com.example.other", 1_000L)))
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_001L)))
  }

  @Test
  fun resetAllowsNextScrollImmediately() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_000L)))
    reducer.reset()
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_001L)))
  }

  @Test
  fun outOfOrderEventDoesNotMoveDebounceWindowBackwards() {
    assertTrue(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 2_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 1_000L)))
    assertFalse(reducer.reduce(event(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE, 2_001L)))
  }

  @Test
  fun commentInteractionsAreStrictlyRejected() {
    // Opening comments or scrolling comments should NEVER trigger a reel candidate count
    val commentEvent = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = null,
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentEvent))

    // Even with a fingerprint present, if comment section is active, it is rejected
    val commentWithReelEvent = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_000L,
      reelFingerprint = "creatorA||songA||funny video",
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentWithReelEvent))
  }

  @Test
  fun fingerprintTransitionsDetectReelSwipesAccurately() {
    // First reel transition
    val reel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel1))

    // Staying on same reel with further content updates or touch gestures does NOT count again
    val reel1Update = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_300L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(reel1Update))

    // Opening comments on reel1 does NOT count
    val commentsOpen = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_500L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = true
    )
    assertFalse(reducer.reduce(commentsOpen))

    // Swiping to new reel (different fingerprint) after debounce period is detected!
    val reel2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_200L,
      reelFingerprint = "creatorB||songB||clip2",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel2))
  }

  @Test
  fun generalFeedScrollingIsNotCountedAsShortVideo() {
    // Regular feed scroll when user is NOT in Reels/Shorts viewer
    val generalFeedScroll = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = null,
      isCommentInteraction = false,
      isShortVideoActive = false
    )
    assertFalse(reducer.reduce(generalFeedScroll))

    val youtubeHomeScroll = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.YOUTUBE,
      timestamp = 2_000L,
      reelFingerprint = null,
      isCommentInteraction = false,
      isShortVideoActive = false
    )
    assertFalse(reducer.reduce(youtubeHomeScroll))
  }

  @Test
  fun fastSkipTransitionsAreDetectedPromptly() {
    // Reel 1
    val reel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = "creatorA||songA||clip1",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel1))

    // Fast skip after 350ms to Reel 2 - should be detected immediately with 0 delay
    val reel2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_350L,
      reelFingerprint = "creatorB||songB||clip2",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel2))
  }

  @Test
  fun swipeScrollFollowedByFingerprintSettlingDoesNotDoubleCount() {
    // Physical swipe starts (view scrolled event without fingerprint yet)
    val swipeScroll = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = null,
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(swipeScroll))

    // 250ms later the new reel settles and its fingerprint arrives
    val reelSettled = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_250L,
      reelFingerprint = "creatorX||songX||clipX",
      isCommentInteraction = false
    )
    // Must NOT double-count the same transition!
    assertFalse(reducer.reduce(reelSettled))

    // Later content update (e.g. at 2 seconds) on the same reel must also be rejected
    val laterUpdate = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_500L,
      reelFingerprint = "creatorX||songX||clipX",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(laterUpdate))
  }

  @Test
  fun slowSwipeDoesNotDoubleCount() {
    // User starts on Reel 1
    val reel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = "creator1||song1||clip1",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel1))

    // Dragging slowly over 1.2s - still showing Reel 1
    val slowDrag1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_400L,
      reelFingerprint = "creator1||song1||clip1",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(slowDrag1))

    // Drag continues
    val slowDrag2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_800L,
      reelFingerprint = "creator1||song1||clip1",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(slowDrag2))

    // Reel 2 finally appears in view
    val reel2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_300L,
      reelFingerprint = "creator2||song2||clip2",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel2))

    // Finger released on Reel 2
    val release = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_600L,
      reelFingerprint = "creator2||song2||clip2",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(release))
  }

  @Test
  fun swipingBackToRecentReelWithinHistoryDoesNotInflateCount() {
    val reel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 1_000L,
      reelFingerprint = "creator1||song1||clip1",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel1))

    val reel2 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 2_000L,
      reelFingerprint = "creator2||song2||clip2",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel2))

    // Swiping back up to reel1 (which is in recent history) should NOT count as a new reel!
    val swipeBackToReel1 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 3_000L,
      reelFingerprint = "creator1||song1||clip1",
      isCommentInteraction = false
    )
    assertFalse(reducer.reduce(swipeBackToReel1))

    // But swiping down to a completely new reel3 DOES count!
    val reel3 = EventMetadata(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.INSTAGRAM,
      timestamp = 4_000L,
      reelFingerprint = "creator3||song3||clip3",
      isCommentInteraction = false
    )
    assertTrue(reducer.reduce(reel3))
  }

  private fun event(type: Int, packageName: String, timestamp: Long) =
    EventMetadata(type, packageName, timestamp)
}
