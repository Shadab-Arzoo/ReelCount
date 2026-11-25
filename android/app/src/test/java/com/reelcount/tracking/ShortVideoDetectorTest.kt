package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ShortVideoDetectorTest {
  private val detector = ShortVideoDetector()

  @Test
  fun obfuscatedTikTokVideoFeedExtractsStableFingerprintAndIgnoresVolatileTimersAndCaptions() {
    val baseNodes = listOf(
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/a1b", text = "Following"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/a1c", text = "For You"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/t01", text = "0:04"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/t02", text = "12.4K"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/sub", text = "Hey guys look at this trick"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/u99", text = "@travel.alex"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/m88", text = "original sound - Summer Synth"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/b1", contentDesc = "Like video, 12.4K likes"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/b2", contentDesc = "Read or add comments, 320 comments"),
      NodeSignal(viewId = "com.zhiliaoapp.musically:id/b3", contentDesc = "Share video"),
    )

    val event1 = EventSignal(
      eventType = AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED,
      packageName = TargetPackages.TIKTOK,
    )
    val res1 = detector.detectSignals(event1, baseNodes)
    assertTrue(res1.isShortVideoActive)
    assertFalse(res1.isCommentSection)
    assertEquals("com.zhiliaoapp.musically:@travel.alex||original sound - Summer Synth", res1.fingerprint)

    // Timer ticks to 0:09, like count increases, subtitles update -> fingerprint MUST stay identical!
    val updatedNodes = baseNodes.map { node ->
      when (node.viewId) {
        "com.zhiliaoapp.musically:id/t01" -> node.copy(text = "0:09")
        "com.zhiliaoapp.musically:id/t02" -> node.copy(text = "12.5K")
        "com.zhiliaoapp.musically:id/sub" -> node.copy(text = "Now watch carefully!")
        else -> node
      }
    }
    val res2 = detector.detectSignals(event1, updatedNodes)
    assertTrue(res2.isShortVideoActive)
    assertEquals(res1.fingerprint, res2.fingerprint)
  }

  @Test
  fun tikTokProfileDmAndInboxAreNotCountedAsShortVideos() {
    val profileNodes = listOf(
      NodeSignal(viewId = "id/p1", text = "Edit profile"),
      NodeSignal(viewId = "id/p2", text = "Followers"),
      NodeSignal(viewId = "id/p3", text = "Following"),
      NodeSignal(viewId = "id/p4", text = "Likes"),
    )
    val profileResult = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.TIKTOK),
      profileNodes
    )
    assertFalse(profileResult.isShortVideoActive)

    val dmNodes = listOf(
      NodeSignal(viewId = "id/dm1", className = "android.widget.EditText", text = "Send a message...", isEditable = true),
      NodeSignal(viewId = "id/dm2", text = "Like"),
    )
    val dmResult = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.TIKTOK),
      dmNodes
    )
    assertFalse(dmResult.isShortVideoActive)
  }

  @Test
  fun snapchatCameraWithSpotlightNavButtonDoesNotTriggerWhileActualSpotlightDoes() {
    // Camera screen has the bottom nav tab "Spotlight", must NOT count
    val cameraNodes = listOf(
      NodeSignal(viewId = "com.snapchat.android:id/ngs_nav", contentDesc = "Spotlight"),
      NodeSignal(viewId = "com.snapchat.android:id/cam1", contentDesc = "Take a Snap"),
      NodeSignal(viewId = "com.snapchat.android:id/cam2", text = "Memories"),
      NodeSignal(viewId = "com.snapchat.android:id/cam3", contentDesc = "Lenses"),
    )
    val cameraRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED, TargetPackages.SNAPCHAT),
      cameraNodes
    )
    assertFalse(cameraRes.isShortVideoActive)

    // Actual Spotlight player with Opera container & actions
    val spotlightNodes = listOf(
      NodeSignal(viewId = "com.snapchat.android:id/opera_page_view", contentDesc = "Spotlight by maya_creates"),
      NodeSignal(viewId = "com.snapchat.android:id/act1", contentDesc = "Remix"),
      NodeSignal(viewId = "com.snapchat.android:id/act2", contentDesc = "Favorite"),
      NodeSignal(viewId = "com.snapchat.android:id/act3", contentDesc = "Share"),
      NodeSignal(viewId = "com.snapchat.android:id/snd", text = "Trending Sound - Chillwave"),
    )
    val spotlightRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED, TargetPackages.SNAPCHAT),
      spotlightNodes
    )
    assertTrue(spotlightRes.isShortVideoActive)
    assertEquals("com.snapchat.android:Spotlight by maya_creates||Trending Sound - Chillwave", spotlightRes.fingerprint)
  }

  @Test
  fun instagramReelsVsHomeFeedAndBottomSheetFalsePositivePrevention() {
    // Empty/collapsed bottom_sheet_container on active Instagram Reel should NOT falsely block tracking
    val reelNodes = listOf(
      NodeSignal(viewId = "com.instagram.android:id/bottom_sheet_container", text = ""),
      NodeSignal(viewId = "com.instagram.android:id/clips_viewer_view_pager", isScrollable = true),
      NodeSignal(viewId = "com.instagram.android:id/clips_author_username", text = "nature.daily"),
      NodeSignal(viewId = "com.instagram.android:id/clips_caption", text = "Alpine sunrise hike"),
      NodeSignal(viewId = "com.instagram.android:id/comment_btn", text = "Comments", contentDesc = "Comment"),
    )
    val reelRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM),
      reelNodes
    )
    assertFalse(reelRes.isCommentSection)
    assertTrue(reelRes.isShortVideoActive)
    assertEquals("com.instagram.android:nature.daily||Alpine sunrise hike", reelRes.fingerprint)

    // Home feed with inline "Reel by" card + "Your story" MUST NOT count
    val homeNodes = listOf(
      NodeSignal(viewId = "com.instagram.android:id/tray", text = "Your story"),
      NodeSignal(viewId = "com.instagram.android:id/feed", contentDesc = "Reel by creator_x"),
    )
    val homeRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM),
      homeNodes
    )
    assertFalse(homeRes.isShortVideoActive)
  }

  @Test
  fun openCommentDrawerIsRejectedEvenOnViewScrolledEvents() {
    val openCommentsNodes = listOf(
      NodeSignal(viewId = "com.instagram.android:id/clips_viewer_view_pager"),
      NodeSignal(viewId = "com.instagram.android:id/header", text = "Comments"),
      NodeSignal(viewId = "com.instagram.android:id/row1", text = "View replies (4)"),
      NodeSignal(viewId = "com.instagram.android:id/row2", text = "Reply"),
      NodeSignal(viewId = "com.instagram.android:id/composer", className = "android.widget.EditText", text = "Add a comment...", isEditable = true),
    )
    val commentScrollRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.INSTAGRAM),
      openCommentsNodes
    )
    assertTrue(commentScrollRes.isCommentSection)
    assertFalse(commentScrollRes.isShortVideoActive)
    assertNull(commentScrollRes.fingerprint)
  }

  @Test
  fun youTubeShortsVsNormalPlayerAndHorizontalScrollRejection() {
    val shortsNodes = listOf(
      NodeSignal(viewId = "com.google.android.youtube:id/reel_recycler", isScrollable = true),
      NodeSignal(viewId = "com.google.android.youtube:id/reel_channel_bar", text = "@TechTips"),
      NodeSignal(viewId = "com.google.android.youtube:id/shorts_video_title_view", text = "3 Battery Myths"),
      NodeSignal(viewId = "com.google.android.youtube:id/comment_btn", text = "Comments"),
    )
    val shortsRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_VIEW_SCROLLED, TargetPackages.YOUTUBE),
      shortsNodes
    )
    assertTrue(shortsRes.isShortVideoActive)
    assertFalse(shortsRes.isCommentSection)
    assertEquals("com.google.android.youtube:@TechTips||3 Battery Myths", shortsRes.fingerprint)

    // Normal watch page with "Enter fullscreen" should NOT trigger Shorts
    val normalVideoNodes = listOf(
      NodeSignal(viewId = "id/p1", contentDesc = "Like this video"),
      NodeSignal(viewId = "id/p2", contentDesc = "Enter fullscreen"),
      NodeSignal(viewId = "id/p3", contentDesc = "Autoplay is on"),
    )
    val normalRes = detector.detectSignals(
      EventSignal(AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED, TargetPackages.YOUTUBE),
      normalVideoNodes
    )
    assertFalse(normalRes.isShortVideoActive)

    // Horizontal tab swipe / marquee scroll MUST be rejected
    val horizontalRes = detector.detectSignals(
      EventSignal(
        eventType = AccessibilityEvent.TYPE_VIEW_SCROLLED,
        packageName = TargetPackages.TIKTOK,
        isHorizontalOrControlScroll = true
      ),
      shortsNodes
    )
    assertFalse(horizontalRes.isShortVideoActive)
    assertTrue(horizontalRes.isHorizontalOrControlScroll)
  }
}
