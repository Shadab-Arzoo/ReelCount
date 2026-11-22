package com.reelcount.tracking

import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

internal data class DetectionResult(
  val isShortVideoActive: Boolean,
  val isCommentSection: Boolean,
  val fingerprint: String?
)

/**
 * Intelligent detector that identifies active short-form video viewers (Instagram Reels,
 * YouTube Shorts, TikTok, Snapchat Spotlight), extracts a stable fingerprint for each video item,
 * and strictly filters out comment sections, bottom sheets, and modal drawers.
 */
internal class ShortVideoDetector {

  fun detect(event: AccessibilityEvent, rootNode: AccessibilityNodeInfo?): DetectionResult {
    val packageName = event.packageName?.toString() ?: ""
    if (packageName !in TargetPackages.all) {
      return DetectionResult(isShortVideoActive = false, isCommentSection = false, fingerprint = null)
    }

    // 1. Strict comment check: if the event or active window is inside a comment thread/sheet,
    // it MUST NOT trigger reel counts.
    val isComment = isCommentInteraction(event, rootNode)
    if (isComment) {
      return DetectionResult(
        isShortVideoActive = false,
        isCommentSection = true,
        fingerprint = null
      )
    }

    // 2. Verify short video viewer is currently visible on screen
    val isShortVideo = isShortVideoViewer(event, rootNode, packageName)

    // 3. Extract distinct video fingerprint (creator / sound / caption)
    val fingerprint = if (isShortVideo) {
      extractFingerprint(event, rootNode, packageName)
    } else {
      null
    }

    return DetectionResult(
      isShortVideoActive = isShortVideo,
      isCommentSection = false,
      fingerprint = fingerprint
    )
  }

  fun isCommentInteraction(event: AccessibilityEvent, rootNode: AccessibilityNodeInfo?): Boolean {
    // Check event source
    event.source?.let { source ->
      if (nodeMatchesComment(source)) return true
    }

    // Check event text
    for (t in event.text) {
      val s = t.toString().lowercase()
      if (
        s.contains("add a comment") ||
        s == "comments" ||
        s.contains("write a comment") ||
        s.contains("add comment") ||
        s.contains("reply to") ||
        s.contains("view replies")
      ) {
        return true
      }
    }

    // Check event content description
    val contentDesc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (
      contentDesc == "comments" ||
      contentDesc.contains("comment sheet") ||
      contentDesc.contains("comments list") ||
      contentDesc.contains("comment thread")
    ) {
      return true
    }

    // Check root active window if available for window state or content changes
    if (rootNode != null && (
        event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
        event.eventType == AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
      )) {
      return hasCommentSectionInTree(rootNode)
    }

    return false
  }

  private fun nodeMatchesComment(node: AccessibilityNodeInfo): Boolean {
    val viewId = node.viewIdResourceName?.lowercase() ?: ""
    if (
      viewId.contains("comment_thread") ||
      viewId.contains("comments_list") ||
      viewId.contains("comment_composer") ||
      viewId.contains("comment_rows") ||
      viewId.contains("comment_sheet") ||
      viewId.contains("layout_comment") ||
      viewId.contains("comment_recycler") ||
      viewId.contains("comments_recycler") ||
      viewId.contains("bottom_sheet_container")
    ) {
      return true
    }

    val text = node.text?.toString()?.lowercase() ?: ""
    if (
      text.contains("add a comment") ||
      text.contains("add comment") ||
      text == "comments" ||
      text.contains("write a comment")
    ) {
      return true
    }

    val className = node.className?.toString() ?: ""
    if (className.contains("EditText", ignoreCase = true) && (text.contains("comment") || viewId.contains("comment"))) {
      return true
    }

    return false
  }

  private fun hasCommentSectionInTree(root: AccessibilityNodeInfo): Boolean {
    var nodesChecked = 0

    fun traverse(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || nodesChecked++ > MAX_SEARCH_NODES) return false
      if (nodeMatchesComment(node)) return true

      val childCount = node.childCount
      for (i in 0 until childCount) {
        val child = node.getChild(i) ?: continue
        if (traverse(child, depth + 1)) return true
      }
      return false
    }

    return traverse(root, 0)
  }

  fun isShortVideoViewer(
    event: AccessibilityEvent,
    rootNode: AccessibilityNodeInfo?,
    packageName: String
  ): Boolean {
    val canonical = TargetPackages.getCanonicalName(packageName)

    return when (canonical) {
      TargetPackages.INSTAGRAM -> {
        eventMatchesInstagramReel(event) || (rootNode != null && hasInstagramReelIndicators(rootNode))
      }
      TargetPackages.YOUTUBE -> {
        eventMatchesYouTubeShorts(event) || (rootNode != null && hasYouTubeShortsIndicators(rootNode))
      }
      TargetPackages.TIKTOK -> {
        eventMatchesTikTokFeed(event) || (rootNode != null && hasTikTokFeedIndicators(rootNode))
      }
      TargetPackages.SNAPCHAT -> {
        eventMatchesSnapchatSpotlight(event) || (rootNode != null && hasSnapchatSpotlightIndicators(rootNode))
      }
      else -> false
    }
  }

  private fun eventMatchesInstagramReel(event: AccessibilityEvent): Boolean {
    val resName = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (
      resName.contains("clips_viewer") ||
      resName.contains("reel_viewer") ||
      resName.contains("clips_video") ||
      resName.contains("clips_pager")
    ) return true

    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (desc.contains("reel by") || desc.contains("original audio") || desc.contains("like reel")) return true

    return false
  }

  private fun hasInstagramReelIndicators(root: AccessibilityNodeInfo): Boolean {
    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      // Exclude generic navigation and tab bars to avoid false positives
      if (id.contains("tab_bar") || id.contains("bottom_navigation")) return false

      if (
        id.contains("clips_viewer") ||
        id.contains("clips_video") ||
        id.contains("reel_viewer") ||
        id.contains("clips_pager") ||
        id.contains("clips_author") ||
        id.contains("clips_swipe_refresh") ||
        id.contains("reel_feed_timeline")
      ) {
        return true
      }
      val desc = node.contentDescription?.toString()?.lowercase() ?: ""
      if (desc.contains("like reel") || desc.contains("reel by") || desc.contains("remix with reel")) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  private fun eventMatchesYouTubeShorts(event: AccessibilityEvent): Boolean {
    val res = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (res.contains("reel_player") || res.contains("shorts_container") || res.contains("reel_watch")) return true
    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    return desc.contains("shorts player") || desc.contains("sound used in this short")
  }

  private fun hasYouTubeShortsIndicators(root: AccessibilityNodeInfo): Boolean {
    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      // Exclude generic bottom navigation tab items
      if (id.contains("tab_bar") || id.contains("bottom_bar") || id.contains("navigation_bar")) return false
      if (
        id.contains("reel_player") ||
        id.contains("shorts_container") ||
        id.contains("reel_watch") ||
        id.contains("shorts_player") ||
        id.contains("reel_recycler")
      ) {
        return true
      }
      val desc = node.contentDescription?.toString()?.lowercase() ?: ""
      if (desc.contains("shorts player") || desc.contains("sound used in this short")) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  private fun eventMatchesTikTokFeed(event: AccessibilityEvent): Boolean {
    val res = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (
      res.contains("video_pager") ||
      res.contains("view_pager") ||
      res.contains("swipe_container") ||
      res.contains("video_player") ||
      res.contains("feed_video") ||
      res.contains("aweme_pager") ||
      res.contains("vertical_viewpager") ||
      res.contains("video_feed")
    ) return true

    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (
      desc.contains("double tap to") ||
      desc.contains("like video") ||
      desc.contains("follow") ||
      desc.contains("share video") ||
      desc.contains("original sound")
    ) return true

    // TikTok scroll events in the main feed are typically TYPE_VIEW_SCROLLED
    // with the main vertical pager as source
    val className = event.source?.className?.toString() ?: ""
    if (className.contains("ViewPager", ignoreCase = true) ||
        className.contains("RecyclerView", ignoreCase = true)) {
      // Only if the event looks like a vertical feed swipe
      if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) return true
    }

    return false
  }

  private fun hasTikTokFeedIndicators(root: AccessibilityNodeInfo): Boolean {
    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      // Skip navigation/non-feed areas
      if (id.contains("bottom_tab") || id.contains("bottom_navigation") || id.contains("tab_bar")) return false

      if (
        id.contains("video_pager") ||
        id.contains("view_pager") ||
        id.contains("swipe_container") ||
        id.contains("aweme_pager") ||
        id.contains("vertical_viewpager") ||
        id.contains("video_feed") ||
        id.contains("video_player")
      ) {
        return true
      }
      val desc = node.contentDescription?.toString()?.lowercase() ?: ""
      if (
        desc.contains("double tap to") ||
        desc.contains("like video") ||
        desc.contains("original sound") ||
        desc.contains("share video")
      ) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  private fun eventMatchesSnapchatSpotlight(event: AccessibilityEvent): Boolean {
    val res = event.source?.viewIdResourceName?.lowercase() ?: ""
    if (
      res.contains("spotlight_player") ||
      res.contains("spotlight_feed") ||
      res.contains("spotlight_pager") ||
      res.contains("video_player") ||
      res.contains("feed_pager") ||
      res.contains("vertical_pager")
    ) return true

    val desc = event.contentDescription?.toString()?.lowercase() ?: ""
    if (
      desc.contains("spotlight") ||
      desc.contains("video by") ||
      desc.contains("trending sound")
    ) return true

    return false
  }

  private fun hasSnapchatSpotlightIndicators(root: AccessibilityNodeInfo): Boolean {
    var count = 0
    fun check(node: AccessibilityNodeInfo?, depth: Int): Boolean {
      if (node == null || depth > MAX_SEARCH_DEPTH || count++ > MAX_SEARCH_NODES) return false
      val id = node.viewIdResourceName?.lowercase() ?: ""
      if (id.contains("tab") || id.contains("navigation") || id.contains("bottom_bar")) return false
      if (
        id.contains("spotlight_player") ||
        id.contains("spotlight_feed") ||
        id.contains("spotlight_carousel") ||
        id.contains("spotlight_pager") ||
        id.contains("video_player") ||
        id.contains("vertical_pager") ||
        id.contains("feed_pager")
      ) {
        return true
      }
      val desc = node.contentDescription?.toString()?.lowercase() ?: ""
      if (desc.contains("spotlight") || desc.contains("video by")) {
        return true
      }
      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        if (check(child, depth + 1)) return true
      }
      return false
    }
    return check(root, 0)
  }

  fun extractFingerprint(
    event: AccessibilityEvent,
    rootNode: AccessibilityNodeInfo?,
    packageName: String
  ): String? {
    // 1. Direct fast-path check on the event itself
    val directDesc = event.contentDescription?.toString()?.trim()
    if (!directDesc.isNullOrEmpty() && directDesc.length in 4..140) {
      val lower = directDesc.lowercase()
      if (
        lower.contains("reel by") ||
        lower.contains("sound used in this short") ||
        lower.contains("original audio") ||
        lower.contains("original sound") ||
        lower.contains("double tap to") ||
        lower.contains("video by") ||
        lower.contains("trending sound") ||
        lower.contains("spotlight")
      ) {
        return "$packageName:$directDesc"
      }
    }

    // 2. Direct check on event.source (the view that actually generated the event)
    event.source?.let { source ->
      if (!nodeMatchesComment(source)) {
        val sDesc = source.contentDescription?.toString()?.trim()
        if (!sDesc.isNullOrEmpty() && sDesc.length in 4..140) {
          val lower = sDesc.lowercase()
          if (
            lower.contains("reel by") ||
            lower.contains("original audio") ||
            lower.contains("sound used in this short") ||
            lower.contains("original sound") ||
            lower.contains("double tap to") ||
            lower.contains("video by") ||
            lower.contains("trending sound")
          ) {
            return "$packageName:$sDesc"
          }
        }
        val sText = source.text?.toString()?.trim()
        val sId = source.viewIdResourceName?.lowercase() ?: ""
        if (!sText.isNullOrEmpty() && sText.length in 3..140) {
          if (
            sId.contains("title") ||
            sId.contains("author") ||
            sId.contains("creator") ||
            sId.contains("caption") ||
            sId.contains("desc") ||
            sId.contains("username") ||
            sId.contains("nickname")
          ) {
            return "$packageName:$sText"
          }
        }
      }
    }

    if (rootNode == null) {
      val desc = event.contentDescription?.toString()?.trim()
      if (!desc.isNullOrEmpty() && desc.length in 4..120) return "$packageName:$desc"
      val text = event.text?.joinToString(" ")?.trim()
      if (!text.isNullOrEmpty() && text.length in 4..120) return "$packageName:$text"
      return null
    }

    val extractedTexts = mutableListOf<String>()
    var nodesInspected = 0

    fun collectTexts(node: AccessibilityNodeInfo?, depth: Int) {
      if (node == null || depth > MAX_SEARCH_DEPTH || nodesInspected++ > MAX_SEARCH_NODES) return
      if (nodeMatchesComment(node)) return

      val text = node.text?.toString()?.trim()
      if (!text.isNullOrEmpty() && text.length in 3..140) {
        val lower = text.lowercase()
        if (
          lower != "like" &&
          lower != "comment" &&
          lower != "share" &&
          lower != "remix" &&
          lower != "save" &&
          lower != "follow" &&
          lower != "audio" &&
          lower != "more" &&
          lower != "subscribe" &&
          lower != "send"
        ) {
          extractedTexts.add(text)
        }
      }

      val desc = node.contentDescription?.toString()?.trim()
      if (!desc.isNullOrEmpty() && desc.length in 4..140) {
        val lowerDesc = desc.lowercase()
        if (
          lowerDesc.contains("reel by") ||
          lowerDesc.contains("audio") ||
          lowerDesc.contains("profile picture") ||
          lowerDesc.contains("original sound") ||
          lowerDesc.contains("double tap to") ||
          lowerDesc.contains("video by") ||
          lowerDesc.contains("spotlight") ||
          lowerDesc.contains("trending")
        ) {
          extractedTexts.add(desc)
        }
      }

      for (i in 0 until node.childCount) {
        val child = node.getChild(i) ?: continue
        collectTexts(child, depth + 1)
      }
    }

    collectTexts(rootNode, 0)

    if (extractedTexts.isEmpty()) {
      return null
    }

    return extractedTexts.take(3).joinToString("||")
  }

  private companion object {
    const val MAX_SEARCH_DEPTH = 6
    const val MAX_SEARCH_NODES = 50
  }
}
