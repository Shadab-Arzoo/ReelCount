/** @format */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import PrototypeSettings from '../src/native/PrototypeSettings';

jest.mock('../src/native/PrototypeSettings', () => ({
  __esModule: true,
  default: {
    openAccessibilitySettings: jest.fn(),
    getPrototypeStatus: jest.fn().mockResolvedValue({
      serviceConnected: true,
      candidateCount: 2,
      bufferedEventCount: 4,
      instagramCount: 1,
      tiktokCount: 1,
      youtubeCount: 0,
      snapchatCount: 0,
      dailyShortLimit: 50,
      focusModeActive: false,
    }),
    getDailyHistory: jest.fn().mockResolvedValue([
      { date: '2026-11-15', label: 'Today', count: 2 },
    ]),
    setFocusMode: jest.fn().mockResolvedValue(true),
    setDailyLimits: jest.fn().mockResolvedValue(true),
    resetCounters: jest.fn().mockResolvedValue(null),
    setThemeAccent: jest.fn().mockResolvedValue(true),
    setOnboardingCompleted: jest.fn().mockResolvedValue(true),
    playSoundscape: jest.fn().mockResolvedValue(true),
    stopSoundscape: jest.fn().mockResolvedValue(true),
    setFloatingHudStyle: jest.fn().mockResolvedValue(true),
    setPackageLimit: jest.fn().mockResolvedValue(true),
  },
  TARGET_PACKAGES: {
    INSTAGRAM: 'com.instagram.android',
    TIKTOK: 'com.zhiliaoapp.musically',
    YOUTUBE: 'com.google.android.youtube',
    SNAPCHAT: 'com.snapchat.android',
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const mockReact = require('react') as typeof import('react');
  const ReactNative = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: import('react').ReactNode }) =>
      mockReact.createElement(ReactNative.View, null, children),
    SafeAreaView: ReactNative.View,
  };
});

test('requires an explicit opt-in before opening Android accessibility settings', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(
    renderer!.root
      .findAllByType(Text)
      .map(node => node.props.children)
      .flat(Infinity)
      .join(''),
  ).toContain('Session scroll events detected: 2');

  const checkbox = renderer!.root.findByProps({
    accessibilityRole: 'checkbox',
  });
  const continueButton = renderer!.root.findByProps({
    accessibilityRole: 'button',
  });
  expect(continueButton.props.disabled).toBe(true);
  await ReactTestRenderer.act(() => continueButton.props.onPress());
  expect(PrototypeSettings.openAccessibilitySettings).not.toHaveBeenCalled();

  await ReactTestRenderer.act(() => checkbox.props.onPress());
  expect(continueButton.props.disabled).toBe(false);
  await ReactTestRenderer.act(() => continueButton.props.onPress());
  expect(PrototypeSettings.openAccessibilitySettings).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('supports interactive intro onboarding: intention goals, HUD simulator, and setup guide', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  const allTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');

  // Check top story / step progress indicators
  expect(allTexts).toContain('Intention');
  expect(allTexts).toContain('Tactile HUD');
  expect(allTexts).toContain('Sanctuary');
  expect(allTexts).toContain('Activate');

  // Verify interactive boundary goal presets exist on Slide 1
  expect(allTexts).toContain('CHOOSE YOUR DAILY MINDFUL BOUNDARY');
  expect(allTexts).toContain('Strict Detox');
  expect(allTexts).toContain('Balanced');
  expect(allTexts).toContain('Gentle');

  // Tap "Strict Detox" (25 reels)
  const detoxNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Strict Detox');
  expect(detoxNode).toBeDefined();

  let detoxCard = detoxNode!.parent;
  while (detoxCard && !detoxCard.props.onPress) {
    detoxCard = detoxCard.parent;
  }
  expect(detoxCard).toBeDefined();
  await ReactTestRenderer.act(() => detoxCard!.props.onPress());
  expect(PrototypeSettings.setDailyLimits).toHaveBeenCalledWith(25, 30);

  // Verify interactive HUD simulator
  expect(allTexts).toContain('Interactive Floating HUD Simulator');
  expect(allTexts).toContain('LIVE PREVIEW');
  expect(allTexts).toContain('⚡ Tap to Simulate Video Swipe (+1)');

  // Tap HUD swipe simulator button
  const simulateNode = renderer!.root
    .findAllByType(Text)
    .find(node => typeof node.props.children === 'string' && node.props.children.includes('Tap to Simulate Video Swipe (+1)'));
  expect(simulateNode).toBeDefined();

  let simBtn = simulateNode!.parent;
  while (simBtn && !simBtn.props.onPress) {
    simBtn = simBtn.parent;
  }
  expect(simBtn).toBeDefined();
  await ReactTestRenderer.act(async () => {
    simBtn!.props.onPress();
  });

  // Check that the swipe simulation updated count from 2 to 3 swipes
  const updatedTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(updatedTexts).toContain('3 swipes');

  // Verify 3-step setup guide on slide 4
  expect(updatedTexts).toContain('3-STEP ANDROID SETUP (TAKES 5 SECONDS)');
  expect(updatedTexts).toContain('Downloaded apps');
  expect(updatedTexts).toContain('ReelCount Tracker');

  await ReactTestRenderer.act(async () => {
    renderer!.unmount();
  });
});

test('allows switching themes in the Sanctuary Atmosphere showcase', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  // Skip intro to enter dashboard
  const skipTextNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Skip →');
  expect(skipTextNode).toBeDefined();

  // Find parent Pressable of skipTextNode to jump to slide 3
  let skipButton = skipTextNode!.parent;
  while (skipButton && !skipButton.props.onPress) {
    skipButton = skipButton.parent;
  }
  expect(skipButton).toBeDefined();
  await ReactTestRenderer.act(() => skipButton!.props.onPress());

  // Enter dashboard
  const enterBtnText = renderer!.root
    .findAllByType(Text)
    .find(
      node =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('Dashboard →'),
    );
  expect(enterBtnText).toBeDefined();

  let enterBtn = enterBtnText!.parent;
  while (enterBtn && !enterBtn.props.onPress) {
    enterBtn = enterBtn.parent;
  }
  expect(enterBtn).toBeDefined();
  await ReactTestRenderer.act(() => enterBtn!.props.onPress());

  // Verify dashboard is shown
  const allTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(allTexts).toContain('ReelCount');

  // Find dock and slide to slot 3 (Settings tab)
  // Find dock tab for Settings
  const settingsTab = renderer!.root.findByProps({ testID: 'dock-tab-settings' });
  expect(settingsTab).toBeDefined();
  await ReactTestRenderer.act(() => settingsTab.props.onTouchEnd());

  // Verify Settings tab atmosphere showcase contains the 6 themes
  const settingsTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');

  expect(settingsTexts).toContain('Sanctuary Atmosphere');
  expect(settingsTexts).toContain('Obsidian Mint');
  expect(settingsTexts).toContain('Cyber Sky');
  expect(settingsTexts).toContain('Amethyst Aura');
  expect(settingsTexts).toContain('Solar Amber');
  expect(settingsTexts).toContain('Neon Rose');
  expect(settingsTexts).toContain('Pure Titanium');

  // Tap on "Neon Rose" theme card
  const roseTextNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Neon Rose');
  expect(roseTextNode).toBeDefined();

  let roseCardBtn = roseTextNode!.parent;
  while (roseCardBtn && !roseCardBtn.props.onPress) {
    roseCardBtn = roseCardBtn.parent;
  }
  expect(roseCardBtn).toBeDefined();
  await ReactTestRenderer.act(() => roseCardBtn!.props.onPress());

  // Assert PrototypeSettings.setThemeAccent was invoked with 'rose'
  expect(PrototypeSettings.setThemeAccent).toHaveBeenCalledWith('rose');

  // Switch back from Settings to Dashboard tab
  const dashboardTab = renderer!.root.findByProps({ testID: 'dock-tab-counter' });
  expect(dashboardTab).toBeDefined();
  await ReactTestRenderer.act(() => dashboardTab.props.onTouchEnd());

  // Verify dashboard screen is visible and active again
  const returnedTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(returnedTexts).toContain('ReelCount');
  expect(returnedTexts).toContain('Platform Breakdown');
  expect(returnedTexts).toContain('Weekly Rhythm');

  await ReactTestRenderer.act(() => renderer!.unmount());
});

test('supports focus mode soundscapes and limit steppers', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  // Skip intro to enter dashboard
  const skipTextNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === 'Skip →');
  let skipButton = skipTextNode!.parent;
  while (skipButton && !skipButton.props.onPress) {
    skipButton = skipButton.parent;
  }
  await ReactTestRenderer.act(() => skipButton!.props.onPress());

  // Enter dashboard
  const enterBtnText = renderer!.root
    .findAllByType(Text)
    .find(
      node =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('Dashboard →'),
    );
  let enterBtn = enterBtnText!.parent;
  while (enterBtn && !enterBtn.props.onPress) {
    enterBtn = enterBtn.parent;
  }
  await ReactTestRenderer.act(() => enterBtn!.props.onPress());

  // Verify Daily Compass is visible on dashboard
  const dashTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(dashTexts).toContain('DAILY COMPASS');

  // Switch to Focus tab (block)
  const focusTab = renderer!.root.findByProps({ testID: 'dock-tab-block' });
  expect(focusTab).toBeDefined();
  await ReactTestRenderer.act(() => focusTab.props.onTouchEnd());

  // Verify Focus screen has Procedural Soundscape companion
  const blockTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(blockTexts).toContain('Block & Focus Shield');
  expect(blockTexts).toContain('DEEP WORK FOCUS SHIELD');
  expect(blockTexts).toContain('Procedural Soundscape');

  // Tap "▶ Play Noise" soundscape button
  const playNoiseNode = renderer!.root
    .findAllByType(Text)
    .find(
      node =>
        typeof node.props.children === 'string' &&
        node.props.children.includes('Play Noise'),
    );
  expect(playNoiseNode).toBeDefined();

  let playNoiseBtn = playNoiseNode!.parent;
  while (playNoiseBtn && !playNoiseBtn.props.onPress) {
    playNoiseBtn = playNoiseBtn.parent;
  }
  expect(playNoiseBtn).toBeDefined();
  await ReactTestRenderer.act(() => playNoiseBtn!.props.onPress());
  expect(PrototypeSettings.playSoundscape).toHaveBeenCalledWith('rain', 25);

  // Switch to Limits tab (timers)
  const limitsTab = renderer!.root.findByProps({ testID: 'dock-tab-timers' });
  expect(limitsTab).toBeDefined();
  await ReactTestRenderer.act(() => limitsTab.props.onTouchEnd());

  // Verify Limits screen
  const limitTexts = renderer!.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .flat(Infinity)
    .join(' ');
  expect(limitTexts).toContain('Daily Shorts Target');

  // Tap "+ 5" stepper
  const stepperPlusNode = renderer!.root
    .findAllByType(Text)
    .find(node => node.props.children === '+ 5');
  expect(stepperPlusNode).toBeDefined();

  let plusBtn = stepperPlusNode!.parent;
  while (plusBtn && !plusBtn.props.onPress) {
    plusBtn = plusBtn.parent;
  }
  expect(plusBtn).toBeDefined();
  await ReactTestRenderer.act(() => plusBtn!.props.onPress());
  expect(PrototypeSettings.setDailyLimits).toHaveBeenCalledWith(55, 30);

  await ReactTestRenderer.act(() => renderer!.unmount());
});
