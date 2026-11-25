package com.reelcount.tracking

import android.os.Build
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

internal data class DetectionResult(
  val isShortVideoActive: Boolean,
  val isCommentSection: Boolean,
  val fingerprint: String?,
  val isHorizontalOrControlScroll: Boolean = false,
  val pagerIndex: Int? = null
)

internal data class NodeSignal(
  val viewId: String,
  val className: String = "",
  val text: String = "",
  val contentDesc: String = "",
  val isEditable: Boolean = false,
  val isScrollable: Boolean = false
)

internal data class EventSignal(
  val eventType: Int,
  val packageName: String,
  val sourceViewId: String = "",
  val sourceClassName: String = "",
  val sourceText: String = "",
  val sourceContentDesc: String = "",
  val sourceIsEditable: Boolean = false,
  val eventTexts: List<String> = emptyList(),
  val eventContentDesc: String = "",
  val isHorizontalOrControlScroll: Boolean = false,
  val pagerIndex: Int? = null
)

/**
 * High-precision detector for active short-form video viewers (Instagram Reels,
 * YouTube Shorts, TikTok, Snapchat Spotlight).
 *
 * Uses single-pass BFS visible-tree inspection, strict open comment-drawer exclusion,
 * obfuscated-ID resilient UI signal matching, and tier-prioritized creator/audio/caption
 * fingerprinting that ignores volatile timers, counts, captions/subtitles, and UI chrome.
 */
internal class ShortVideoDetector {

  fun detect(event: AccessibilityEvent, rootNode: AccessibilityNodeInfo?): DetectionResult {
    val packageName = event.packageName?.toString() ?: ""
    if (packageName !in TargetPackages.all) {
      return DetectionResult(isShortVideoActive = false, isCommentSection = false, fingerprint = null)
    }

    val eventSignal = extractEventSignal(event, packageName)
    val visibleNodes = collectVisibleNodes(rootNode)
    return detectSignals(eventSignal, visibleNodes)
  }

  internal fun detectSignals(event: EventSignal, nodes: List<NodeSignal>): DetectionResult {
    if (event.packageName !in TargetPackages.all) {
      return DetectionResult(isShortVideoActive = false, isCommentSection = false, fingerprint = null)
    }

    // Reject horizontal scrolls (switching tabs, swiping to profile/camera, marquee audio tickers, seekbars)
    if (event.isHorizontalOrControlScroll) {
      return DetectionResult(
        isShortVideoActive = false,
        isCommentSection = false,
        fingerprint = null,
        isHorizontalOrControlScroll = true
      )
    }

    // 1. Strict comment check: open comment drawers/sheets MUST NOT trigger reel counts.
    val isComment = isCommentInteraction(event, nodes)
    if (isComment) {
      return DetectionResult(
        isShortVideoActive = false,
        isCommentSection = true,
        fingerprint = null
      )
    }

    // 2. Verify short video viewer is currently active (works with both clear IDs and obfuscated/Litho UIs)
    val isShortVideo = isShortVideoViewer(event, nodes, event.packageName)

    // 3. Extract invariant creator/audio/caption fingerprint
    val fingerprint = if (isShortVideo) {
      extractFingerprint(event, nodes, event.packageName)
    } else {
      null
    }

    return DetectionResult(
      isShortVideoActive = isShortVideo,
      isCommentSection = false,
      fingerprint = fingerprint,
      isHorizontalOrControlScroll = false,
      pagerIndex = event.pagerIndex
    )
  }

  private fun extractEventSignal(event: AccessibilityEvent, packageName: String): EventSignal {
    val source = try {
      event.source
    } catch (_: Exception) {
      null
    }
    val sId = source?.viewIdResourceName?.lowercase() ?: ""
    val sClass = source?.className?.toString() ?: ""
    val sText = source?.text?.toString()?.trim() ?: ""
    val sDesc = source?.contentDescription?.toString()?.trim() ?: ""
    val sEditable = (try { source?.isEditable } catch (_: Exception) { false } == true) ||
      sClass.contains("EditText", ignoreCase = true)

    val eventTexts = try {
      event.text.mapNotNull { it?.toString()?.trim() }.filter { it.isNotEmpty() }
    } catch (_: Exception) {
      emptyList()
    }
    val eventDesc = event.contentDescription?.toString()?.trim() ?: ""

    var horizontalOrControl = false
    if (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED) {
      val sClassLower = sClass.lowercase()
      if (
        sClassLower.contains("horizontalscrollview") ||
        sClassLower.contains("seekbar") ||
        sClassLower.contains("tablayout") ||
        sClassLower.contains("tabwidget") ||
        sClassLower.endsWith("textview")
      ) {
        horizontalOrControl = true
      } else if (
        sId.contains("marquee") ||
        sId.contains("seek") ||
        sId.contains("scrubber") ||
        sId.contains("progress_bar") ||
        sId.contains("tab_layout") ||
        sId.contains("tab_bar") ||
        sId.contains("story_tray") ||
        sId.contains("stories_tray") ||
        sId.contains("reel_tray")
      ) {
        horizontalOrControl = true
      } else if (event.maxScrollX > 0 && event.maxScrollY <= 0) {
        horizontalOrControl = true
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && event.scrollDeltaX != 0 && event.scrollDeltaY == 0) {
        horizontalOrControl = true
      }
    }

    val pagerIndex = if (
      !horizontalOrControl &&
      (event.eventType == AccessibilityEvent.TYPE_VIEW_SCROLLED || event.eventType == AccessibilityEvent.TYPE_VIEW_SELECTED) &&
      event.fromIndex >= 0 &&
      event.toIndex >= 0 &&
      event.fromIndex == event.toIndex
    ) {
      event.toIndex
    } else {
      null
    }

    return EventSignal(
      eventType = event.eventType,
      packageName = packageName,
      sourceViewId = sId,
      sourceClassName = sClass,
      sourceText = sText,
      sourceContentDesc = sDesc,
      sourceIsEditable = sEditable,
      eventTexts = eventTexts,
      eventContentDesc = eventDesc,
      isHorizontalOrControlScroll = horizontalOrControl,
      pagerIndex = pagerIndex
    )
  }

  private fun collectVisibleNodes(root: AccessibilityNodeInfo?): List<NodeSignal> {
    if (root == null) return emptyList()
    val result = ArrayList<NodeSignal>(64)
    val queue = ArrayDeque<Pair<AccessibilityNodeInfo, Int>>()
    queue.addLast(root to 0)

    while (queue.isNotEmpty() && result.size < MAX_SEARCH_NODES) {
      val (node, depth) = queue.removeFirst()
      val viewId = node.viewIdResourceName?.lowercase() ?: ""
      val className = node.className?.toString() ?: ""
      val text = node.text?.toString()?.trim() ?: ""
      val desc = node.contentDescription?.toString()?.trim() ?: ""
      val isEditable = (try { node.isEditable } catch (_: Exception) { false }) ||
        className.contains("EditText", ignoreCase = true)
      val isScrollable = try { node.isScrollable } catch (_: Exception) { false }

      result.add(
        NodeSignal(
          viewId = viewId,
          className = className,
          text = text,
          contentDesc = desc,
          isEditable = isEditable,
          isScrollable = isScrollable
        )
      )

      if (depth >= MAX_SEARCH_DEPTH) continue

      val childCount = try { node.childCount } catch (_: Exception) { 0 }
      for (i in 0 until childCount) {
        val child = try { node.getChild(i) } catch (_: Exception) { null } ?: continue
        // Skip off-screen / hidden subtrees (preloaded next/previous ViewPager items or collapsed bottom sheets)
        val visible = try { child.isVisibleToUser } catch (_: Exception) { true }
        if (!visible) continue
        queue.addLast(child to (depth + 1))
      }
    }
    return result
  }

  internal fun isCommentInteraction(event: EventSignal, nodes: List<NodeSignal>): Boolean {
    // 1. Check event source directly
    if (hasExplicitCommentContainerId(event.sourceViewId)) return true
    if (event.sourceIsEditable && (event.sourceText.contains("comment", ignoreCase = true) || event.sourceViewId.contains("comment") || event.sourceViewId.contains("reply"))) {
      return true
    }

    // 2. Check event text / content descriptions
    for (t in event.eventTexts) {
      val s = t.lowercase()
      if (
        s.contains("add a comment") ||
        s.contains("write a comment") ||
        s.contains("add comment") ||
        s.contains("reply to ") ||
        s.contains("view replies") ||
        (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && s == "comments")
      ) {
        return true
      }
    }

    val eventDescLower = event.eventContentDesc.lowercase()
    if (
      eventDescLower.contains("comment sheet") ||
      eventDescLower.contains("comments list") ||
      eventDescLower.contains("comment thread") ||
      (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && eventDescLower == "comments")
    ) {
      return true
    }

    // 3. Check visible nodes in BFS tree (on ALL event types including TYPE_VIEW_SCROLLED)
    var replySignalCount = 0
    var hasCommentTitle = false
    var hasCommentComposerPrompt = false
    var hasCommentSortChip = false

    for (node in nodes) {
      if (hasExplicitCommentContainerId(node.viewId)) return true

      val textLower = node.text.lowercase()
      val descLower = node.contentDesc.lowercase()

      if (node.isEditable && (textLower.contains("comment") || descLower.contains("comment") || textLower.contains("reply") || node.viewId.contains("comment"))) {
        return true
      }

      if (
        textLower == "reply" ||
        textLower.startsWith("view replies") ||
        textLower.startsWith("view 1 reply") ||
        textLower.startsWith("hide replies") ||
        textLower.contains("reply to ") ||
        descLower.startsWith("view replies")
      ) {
        replySignalCount++
        if (replySignalCount >= 2) return true
      }

      if (textLower == "comments" || textLower.startsWith("comments (") || textLower.matches(COMMENTS_HEADER_REGEX)) {
        hasCommentTitle = true
      }
      if (textLower.contains("add a comment") || textLower.contains("write a comment") || textLower.contains("be the first to comment")) {
        hasCommentComposerPrompt = true
      }
      if (textLower == "top comments" || textLower == "newest first" || textLower == "most relevant" || descLower == "sort comments") {
        hasCommentSortChip = true
      }
    }

    return hasCommentTitle && (replySignalCount >= 1 || hasCommentComposerPrompt || hasCommentSortChip)
  }

  private fun hasExplicitCommentContainerId(viewId: String): Boolean {
    if (viewId.isEmpty()) return false
    return (
      viewId.contains("comment_thread") ||
      viewId.contains("comments_list") ||
      viewId.contains("comment_composer") ||
      viewId.contains("comment_rows") ||
      viewId.contains("comment_sheet") ||
      viewId.contains("layout_comment") ||
      viewId.contains("comment_recycler") ||
      viewId.contains("comments_recycler") ||
      viewId.contains("comment_list") ||
      viewId.contains("comments_panel") ||
      viewId.contains("comment_bottom_sheet") ||
      viewId.contains("comment_input")
    )
  }

  internal fun isShortVideoViewer(
    event: EventSignal,
    nodes: List<NodeSignal>,
    packageName: String
  ): Boolean {
    val canonical = TargetPackages.getCanonicalName(packageName)
    return when (canonical) {
      TargetPackages.INSTAGRAM -> matchesInstagramReels(event, nodes)
      TargetPackages.YOUTUBE -> matchesYouTubeShorts(event, nodes)
      TargetPackages.TIKTOK -> matchesTikTokFeed(event, nodes)
      TargetPackages.SNAPCHAT -> matchesSnapchatSpotlight(event, nodes)
      else -> false
    }
  }

  private fun matchesInstagramReels(event: EventSignal, nodes: List<NodeSignal>): Boolean {
    // 1. Direct event source explicit Clips viewId match
    if (
      event.sourceViewId.contains("clips_viewer") ||
      event.sourceViewId.contains("clips_video") ||
      event.sourceViewId.contains("clips_pager") ||
      event.sourceViewId.contains("clips_author") ||
      event.sourceViewId.contains("clips_swipe_refresh")
    ) {
      return true
    }

    val eDesc = event.eventContentDesc.lowercase()
    val sDesc = event.sourceContentDesc.lowercase()
    val eventHasReelDesc =
      eDesc.contains("reel by ") || eDesc.contains("like reel") || eDesc.contains("remix with reel") ||
      sDesc.contains("reel by ") || sDesc.contains("like reel") || sDesc.contains("remix with reel")

    if (nodes.isEmpty()) {
      return eventHasReelDesc
    }

    // 2. Inspect visible tree
    var hasExplicitClipsId = false
    var hasExplicitReelDesc = eventHasReelDesc
    var hasExclusion = false
    var actionSignals = 0
    var hasReelsLabel = false
    var hasVerticalPager = false

    for (node in nodes) {
      val id = node.viewId
      val t = node.text.lowercase()
      val d = node.contentDesc.lowercase()
      val cls = node.className.lowercase()

      if (
        id.contains("clips_viewer") ||
        id.contains("clips_video") ||
        id.contains("clips_pager") ||
        id.contains("clips_author") ||
        id.contains("clips_swipe_refresh") ||
        id.contains("clips_caption") ||
        id.contains("clips_audio") ||
        id.contains("clips_action")
      ) {
        hasExplicitClipsId = true
      }

      if (
        d.contains("like reel") ||
        d.contains("reel by ") ||
        d.contains("remix with reel") ||
        d.contains("original audio")
      ) {
        hasExplicitReelDesc = true
      }

      if (
        t == "your story" ||
        d.contains("add to story") ||
        (node.isEditable && (t.contains("message") || d.contains("message"))) ||
        t == "edit profile" ||
        t == "share profile" ||
        id.contains("direct_inbox") ||
        id.contains("reel_viewer_progress_bar") // Instagram Stories
      ) {
        hasExclusion = true
      }

      if (t == "reels" || d == "reels") hasReelsLabel = true
      if (node.isScrollable && (cls.contains("viewpager") || cls.contains("recyclerview"))) hasVerticalPager = true
      if (d == "like" || d == "unlike" || d == "liked") actionSignals++
      if (d == "comment" || d == "comments") actionSignals++
      if (d == "share" || d == "send") actionSignals++
      if (d.contains("audio") || d.contains("remix")) actionSignals++
    }

    if (hasExplicitClipsId) return true
    if (hasExclusion) return false
    if (hasExplicitReelDesc) return true

    return hasReelsLabel && hasVerticalPager && actionSignals >= 2
  }

  private fun matchesYouTubeShorts(event: EventSignal, nodes: List<NodeSignal>): Boolean {
    if (
      event.sourceViewId.contains("reel_player") ||
      event.sourceViewId.contains("shorts_container") ||
      event.sourceViewId.contains("reel_watch") ||
      event.sourceViewId.contains("shorts_player") ||
      event.sourceViewId.contains("reel_recycler")
    ) {
      return true
    }

    val eDesc = event.eventContentDesc.lowercase()
    val sDesc = event.sourceContentDesc.lowercase()
    val eventHasShortsDesc =
      eDesc.contains("shorts player") || eDesc.contains("sound used in this short") ||
      sDesc.contains("shorts player") || sDesc.contains("sound used in this short")

    if (nodes.isEmpty()) {
      return eventHasShortsDesc
    }

    var hasExplicitShortsId = false
    var hasExplicitShortsDesc = eventHasShortsDesc
    var hasNormalPlayerExclusion = false
    var hasLikeVideo = false
    var hasShortsAction = false

    for (node in nodes) {
      val id = node.viewId
      val t = node.text.lowercase()
      val d = node.contentDesc.lowercase()

      if (
        id.contains("reel_player") ||
        id.contains("shorts_container") ||
        id.contains("reel_watch") ||
        id.contains("shorts_player") ||
        id.contains("reel_recycler") ||
        id.contains("shorts_video") ||
        id.contains("shorts_pivot") ||
        id.contains("reel_dyn_") ||
        id.contains("reel_progress_bar") ||
        id.contains("reel_channel_bar")
      ) {
        hasExplicitShortsId = true
      }

      if (
        d.contains("shorts player") ||
        d.contains("sound used in this short") ||
        d.contains("remix this short")
      ) {
        hasExplicitShortsDesc = true
      }

      if (
        d.contains("enter fullscreen") ||
        d.contains("exit fullscreen") ||
        d.contains("autoplay") ||
        d.contains("miniplayer") ||
        d.contains("next video") ||
        t == "up next" ||
        id.contains("watch_player")
      ) {
        hasNormalPlayerExclusion = true
      }

      if (d.contains("like this video") || d.contains("dislike this video")) {
        hasLikeVideo = true
      }
      if (t == "remix" || d.contains("remix") || d.contains("view comments") || d.contains("share this video")) {
        hasShortsAction = true
      }
    }

    if (hasExplicitShortsId) return true
    if (hasNormalPlayerExclusion) return false
    if (hasExplicitShortsDesc) return true

    return hasLikeVideo && hasShortsAction
  }

  private fun matchesTikTokFeed(event: EventSignal, nodes: List<NodeSignal>): Boolean {
    if (
      event.sourceViewId.contains("video_pager") ||
      event.sourceViewId.contains("swipe_container") ||
      event.sourceViewId.contains("aweme_pager") ||
      event.sourceViewId.contains("vertical_viewpager") ||
      event.sourceViewId.contains("video_feed") ||
      event.sourceViewId.contains("feed_video")
    ) {
      return true
    }

    val eDesc = event.eventContentDesc.lowercase()
    val sDesc = event.sourceContentDesc.lowercase()
    val eventHasVideoDesc =
      eDesc.contains("double tap to") || eDesc.contains("like video") || eDesc.contains("share video") ||
      sDesc.contains("double tap to") || sDesc.contains("like video") || sDesc.contains("share video")

    if (nodes.isEmpty()) {
      return eventHasVideoDesc
    }

    // Because production TikTok APKs obfuscate almost all view IDs, inspect visible accessibility signals
    var hasExplicitFeedId = false
    var hasExplicitVideoDesc = eventHasVideoDesc
    var hasNonFeedScreen = false
    var hasFollowersStat = false
    var hasLikesStat = false
    var hasEffectsCamera = false
    var hasTimerCamera = false
    val feedSignals = HashSet<String>()

    for (node in nodes) {
      val id = node.viewId
      val t = node.text.lowercase()
      val d = node.contentDesc.lowercase()

      if (
        id.contains("video_pager") ||
        id.contains("swipe_container") ||
        id.contains("aweme_pager") ||
        id.contains("vertical_viewpager") ||
        id.contains("video_feed") ||
        id.contains("video_player") ||
        id.contains("feed_video")
      ) {
        hasExplicitFeedId = true
      }

      if (
        d.contains("double tap to") ||
        d.contains("like video") ||
        d.contains("unlike video") ||
        d.contains("share video") ||
        d.contains("read or add comments") ||
        d.contains("add to favorites") ||
        d.contains("original sound") ||
        d.contains("sonido original")
      ) {
        hasExplicitVideoDesc = true
      }

      // Non-feed screen exclusions (DMs, Profile, Inbox, Search, Create/Camera)
      if (
        (node.isEditable && (t.contains("message") || t.contains("search") || d.contains("message") || d.contains("search"))) ||
        t == "edit profile" ||
        t == "share profile" ||
        t == "new followers" ||
        t == "system notifications" ||
        t == "all activity" ||
        t == "recent searches" ||
        t == "you may like"
      ) {
        hasNonFeedScreen = true
      }
      if (t == "followers") hasFollowersStat = true
      if (t == "likes") hasLikesStat = true
      if (t == "effects" || d == "effects") hasEffectsCamera = true
      if (t == "templates" || (t == "timer" || d == "timer")) hasTimerCamera = true

      // Obfuscation-resilient UI signals present on the TikTok player
      if (t == "for you" || d == "for you") feedSignals.add("for_you")
      if (t == "following" || d == "following") feedSignals.add("following")
      if (t == "friends" || t == "explore" || t == "stem") feedSignals.add("tab")
      if (d.contains("like") || t == "like") feedSignals.add("like")
      if (d.contains("comment") || t == "comment") feedSignals.add("comment")
      if (d.contains("favorite") || d.contains("bookmark")) feedSignals.add("favorite")
      if (d.contains("share")) feedSignals.add("share")
      if (t.contains("original sound") || d.contains("original sound") || t.contains("sonido original")) feedSignals.add("sound")
      if (d.contains("follow") || t == "follow") feedSignals.add("follow")
    }

    if (hasExplicitFeedId && !hasNonFeedScreen) return true
    if (hasNonFeedScreen || (hasFollowersStat && hasLikesStat) || (hasEffectsCamera && hasTimerCamera)) {
      return false
    }
    if (hasExplicitVideoDesc) return true

    return feedSignals.size >= 3
  }

  private fun matchesSnapchatSpotlight(event: EventSignal, nodes: List<NodeSignal>): Boolean {
    if (
      event.sourceViewId.contains("spotlight_player") ||
      event.sourceViewId.contains("spotlight_feed") ||
      event.sourceViewId.contains("spotlight_pager") ||
      event.sourceViewId.contains("spotlight_carousel") ||
      event.sourceViewId.contains("spotlight_overlay")
    ) {
      return true
    }

    val eDesc = event.eventContentDesc.lowercase()
    val sDesc = event.sourceContentDesc.lowercase()
    val eventHasSpotlightDesc =
      eDesc.contains("spotlight by") || eDesc.contains("video by") || eDesc.contains("trending sound") ||
      sDesc.contains("spotlight by") || sDesc.contains("video by") || sDesc.contains("trending sound")

    if (nodes.isEmpty()) {
      return eventHasSpotlightDesc
    }

    var hasExplicitSpotlightId = false
    var hasOperaContainer = false
    var hasExplicitSpotlightDesc = eventHasSpotlightDesc
    var hasCameraSignal = false
    var hasChatOrMapSignal = false
    val spotlightSignals = HashSet<String>()

    for (node in nodes) {
      val id = node.viewId
      val t = node.text.lowercase()
      val d = node.contentDesc.lowercase()

      if (
        id.contains("spotlight_player") ||
        id.contains("spotlight_feed") ||
        id.contains("spotlight_pager") ||
        id.contains("spotlight_carousel") ||
        id.contains("spotlight_overlay") ||
        id.contains("spotlight_action") ||
        id.contains("spotlight_card")
      ) {
        hasExplicitSpotlightId = true
      }

      if (id.contains("opera_") || id.contains("vertical_pager") || id.contains("feed_pager")) {
        hasOperaContainer = true
      }

      if (
        d.contains("spotlight by") ||
        d.contains("video by") ||
        d.contains("trending sound") ||
        t.contains("spotlight by")
      ) {
        hasExplicitSpotlightDesc = true
      }

      // Non-Spotlight screen exclusions (Camera, Chat, Map)
      if (d == "take a snap" || t == "memories" || d == "memories" || d == "flip camera" || d == "lenses") {
        hasCameraSignal = true
      }
      if (
        (node.isEditable && (t.contains("chat") || t.contains("message") || d.contains("chat"))) ||
        t == "send a chat" ||
        t == "new chat" ||
        t == "snap map" ||
        t == "my bitmoji"
      ) {
        hasChatOrMapSignal = true
      }

      // Note: single "Spotlight" bottom nav tab only contributes 1 signal and is rejected when < 3 or when Camera/Chat is active
      if (t == "spotlight" || d.contains("spotlight")) spotlightSignals.add("spotlight")
      if (t == "remix" || d.contains("remix")) spotlightSignals.add("remix")
      if (d.contains("favorite") || d.contains("bookmark") || t == "favorite") spotlightSignals.add("favorite")
      if (t == "subscribe" || t == "subscribed" || d.contains("subscribe")) spotlightSignals.add("subscribe")
      if (d == "share" || t == "shares" || d.contains("share")) spotlightSignals.add("share")
      if (d.contains("comment") || t == "comments") spotlightSignals.add("comment")
      if (t.contains("original sound") || d.contains("original sound") || d.contains("trending sound")) spotlightSignals.add("sound")
    }

    if (hasExplicitSpotlightId) return true
    if (hasChatOrMapSignal) return false
    if (hasCameraSignal && !hasExplicitSpotlightDesc && !hasOperaContainer) return false
    if (hasExplicitSpotlightDesc) return true
    if (hasOperaContainer && spotlightSignals.size >= 2) return true

    return spotlightSignals.size >= 3
  }

  internal fun extractFingerprint(
    event: EventSignal,
    nodes: List<NodeSignal>,
    packageName: String
  ): String? {
    val tier1Creator = LinkedHashSet<String>()
    val tier2Audio = LinkedHashSet<String>()
    val tier3Caption = LinkedHashSet<String>()
    val tier4Fallback = LinkedHashSet<String>()

    fun classifyToken(text: String, viewId: String, isContentDesc: Boolean) {
      val trimmed = text.trim()
      val entryId = viewId.substringAfter(":id/", viewId)
      if (trimmed.isEmpty() || isExcludedNodeForFingerprint(entryId) || isNoisyOrStaticUiText(trimmed)) {
        return
      }
      val lower = trimmed.lowercase()

      // Tier 1: Creator / Author identity
      if (
        (trimmed.startsWith("@") && trimmed.length >= 3) ||
        (isContentDesc && (
          lower.contains("reel by ") ||
          lower.contains("video by ") ||
          lower.contains("spotlight by ") ||
          lower.contains("profile picture of ")
        )) ||
        (entryId.isNotEmpty() && (
          entryId.contains("author") ||
          entryId.contains("creator") ||
          entryId.contains("username") ||
          entryId.contains("handle") ||
          entryId.contains("channel")
        ))
      ) {
        tier1Creator.add(trimmed)
        return
      }

      // Tier 2: Audio / Sound attribution
      if (
        lower.contains("original audio") ||
        lower.contains("original sound") ||
        lower.contains("sound used in this short") ||
        lower.contains("trending sound") ||
        lower.contains("sonido original") ||
        (entryId.isNotEmpty() && (
          entryId.contains("audio") ||
          entryId.contains("music") ||
          entryId.contains("sound") ||
          entryId.contains("song")
        ))
      ) {
        tier2Audio.add(trimmed)
        return
      }

      // Tier 3: Explicit caption / title views (ignores volatile subtitles/timers/unclassified labels)
      if (
        entryId.isNotEmpty() && (
          entryId.contains("title") ||
          entryId.contains("caption") ||
          entryId.contains("desc")
        )
      ) {
        tier3Caption.add(trimmed)
        return
      }

      // Tier 4: Descriptive metadata fallback (strictly >= 10 chars to exclude tabs/buttons/counts)
      if (isContentDesc && trimmed.length >= 10) {
        tier4Fallback.add(trimmed)
      }
    }

    // 1. Inspect direct event metadata & event source
    if (event.eventContentDesc.isNotEmpty()) {
      classifyToken(event.eventContentDesc, event.sourceViewId, isContentDesc = true)
    }
    if (event.sourceContentDesc.isNotEmpty()) {
      classifyToken(event.sourceContentDesc, event.sourceViewId, isContentDesc = true)
    }
    if (event.sourceText.isNotEmpty()) {
      classifyToken(event.sourceText, event.sourceViewId, isContentDesc = false)
    }

    // 2. Inspect visible BFS nodes
    for (node in nodes) {
      if (node.contentDesc.isNotEmpty()) {
        classifyToken(node.contentDesc, node.viewId, isContentDesc = true)
      }
      if (node.text.isNotEmpty()) {
        classifyToken(node.text, node.viewId, isContentDesc = false)
      }
    }

    val combined = LinkedHashSet<String>()
    tier1Creator.firstOrNull()?.let { combined.add(it) }
    tier2Audio.firstOrNull()?.let { combined.add(it) }
    tier3Caption.firstOrNull()?.let { combined.add(it) }

    val finalTokens = if (combined.isNotEmpty()) {
      combined.take(3)
    } else {
      tier4Fallback.take(2)
    }

    if (finalTokens.isEmpty()) {
      return null
    }

    return "$packageName:${finalTokens.joinToString("||")}"
  }

  private fun isExcludedNodeForFingerprint(viewId: String): Boolean {
    if (viewId.isEmpty()) return false
    val entryId = viewId.substringAfter(":id/", viewId)
    return (
      entryId.contains("subtitle") ||
      entryId.contains("closed_caption") ||
      entryId.contains("auto_caption") ||
      entryId.contains("live_caption") ||
      entryId.contains("asr_") ||
      entryId.contains("timer") ||
      entryId.contains("duration") ||
      entryId.contains("progress") ||
      entryId.contains("seek") ||
      entryId.contains("scrubber") ||
      entryId.contains("playback_time") ||
      entryId.contains("elapsed") ||
      entryId.contains("remaining") ||
      entryId.contains("like_count") ||
      entryId.contains("comment_count") ||
      entryId.contains("share_count") ||
      entryId.contains("badge") ||
      entryId.contains("tab_bar") ||
      entryId.contains("bottom_navigation") ||
      entryId.contains("bottom_bar") ||
      entryId.contains("status_bar") ||
      entryId.contains("comment_") ||
      entryId == "sub"
    )
  }

  private fun isNoisyOrStaticUiText(raw: String): Boolean {
    if (raw.length < 2 || raw.length > 160) return true
    if (raw == "..." || raw == "…") return true

    // Timers / playback durations (e.g. "0:05", "01:23 / 02:00", "15s", "9:41")
    if (TIMER_REGEX.matches(raw) || DURATION_SHORT_REGEX.matches(raw)) return true

    // Pure numeric counters / engagement stats / playback speeds ("12.4K", "1,234", "345", "2.1M", "1.5x")
    if (METRIC_COUNT_REGEX.matches(raw) || SPEED_TAG_REGEX.matches(raw)) return true

    val lower = raw.lowercase()
    if (lower in STATIC_UI_CHROME_LABELS) return true
    if (lower.startsWith("double tap to ") && !lower.contains("@")) return true
    if (lower.startsWith("tap to ") && lower.length < 24) return true

    return false
  }

  private companion object {
    const val MAX_SEARCH_DEPTH = 22
    const val MAX_SEARCH_NODES = 240

    val TIMER_REGEX = Regex("^\\d{1,2}:\\d{2}(\\s*/\\s*\\d{1,2}:\\d{2})?$")
    val DURATION_SHORT_REGEX = Regex("^\\d+\\s*[smh]$", RegexOption.IGNORE_CASE)
    val METRIC_COUNT_REGEX = Regex("^[\\d,.+\\s]+[kKmMbBtT]?$")
    val SPEED_TAG_REGEX = Regex("^\\d+(\\.\\d+)?x$", RegexOption.IGNORE_CASE)
    val COMMENTS_HEADER_REGEX = Regex("^\\d+\\s+comments?$")

    val STATIC_UI_CHROME_LABELS = setOf(
      "like", "unlike", "liked", "comment", "comments", "share", "shares",
      "remix", "save", "saved", "follow", "following", "followed", "followers",
      "subscribe", "subscribed", "audio", "sound", "more", "more options",
      "send", "home", "friends", "inbox", "profile", "create", "explore",
      "search", "for you", "live", "stem", "shop", "shorts", "reels",
      "spotlight", "stories", "story", "camera", "map", "chat", "sponsored",
      "ad", "promoted", "learn more", "shop now", "view shop", "see translation",
      "original", "original audio", "original sound", "sonido original",
      "turn sound on", "turn sound off", "mute", "unmute", "play", "pause",
      "replay", "favorite", "favorited", "bookmark", "bookmarked", "dislike",
      "like this video", "dislike this video", "share this video", "view comments",
      "add comment", "add a comment", "read or add comments", "view all comments",
      "add to favorites", "remove from favorites", "tap to unmute", "tap to mute",
      "swipe up", "swipe up for more", "skip", "close", "back", "cancel", "done",
      "like video", "unlike video", "share video", "reply", "view replies"
    )
  }
}
