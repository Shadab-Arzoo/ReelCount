import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Easing,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon, type IconName } from './src/components/AppIcon';
import PrototypeSettings, {
  type DayHistoryItem,
  type PrototypeStatus,
  TARGET_PACKAGES,
} from './src/native/PrototypeSettings';

type Tab = 'counter' | 'timers' | 'block' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'counter', label: 'Dashboard', icon: 'dashboard' },
  { id: 'timers', label: 'Limits', icon: 'timer' },
  { id: 'block', label: 'Focus', icon: 'shield' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const TAB_INDEX_MAP: Record<Tab, number> = {
  counter: 0,
  timers: 1,
  block: 2,
  settings: 3,
};
type BreathePhase = 'Inhale' | 'Hold' | 'Exhale';
type CravingTab = 'breathing' | 'delay' | 'grounding' | 'stroop';
type HudStyle = 'pill' | 'dot' | 'warning_only';
type ThemeAccent = 'mint' | 'cyan' | 'amethyst' | 'amber' | 'rose' | 'monochrome' | 'emerald';
type UserMood = 'zen' | 'focused' | 'distracted' | 'craving';
type FocusSoundscape = 'rain' | 'forest' | 'waves' | 'cafe' | 'cosmic' | 'none';
type TriggerType = 'boredom' | 'stress' | 'procrastination' | 'habit' | 'fomo';


interface ThemeConfig {
  primary: string;
  primaryDark: string;
  glow: string;
  accentGlow: string;
  border: string;
  surface: string;
  surfaceRaised: string;
  background: string;
  hairline: string;
  actionFill: string;
  actionText: string;
  subtext: string;
  name: string;
  tagline: string;
  iconName: IconName;
}

const THEME_COLORS: Record<ThemeAccent, ThemeConfig> = {
  mint: {
    primary: '#6ee3ad',
    primaryDark: '#34d399',
    glow: 'rgba(110, 227, 173, 0.16)',
    accentGlow: 'rgba(110, 227, 173, 0.32)',
    border: 'rgba(110, 227, 173, 0.45)',
    surface: '#09130e',
    surfaceRaised: '#112019',
    background: '#030705',
    hairline: '#192d23',
    actionFill: '#132b1e',
    actionText: '#e8fff4',
    subtext: '#76a38b',
    name: 'Obsidian Mint',
    tagline: 'Deep Zen Clarity',
    iconName: 'sparkle',
  },
  emerald: {
    primary: '#6ee3ad',
    primaryDark: '#34d399',
    glow: 'rgba(110, 227, 173, 0.16)',
    accentGlow: 'rgba(110, 227, 173, 0.32)',
    border: 'rgba(110, 227, 173, 0.45)',
    surface: '#09130e',
    surfaceRaised: '#112019',
    background: '#030705',
    hairline: '#192d23',
    actionFill: '#132b1e',
    actionText: '#e8fff4',
    subtext: '#76a38b',
    name: 'Obsidian Mint',
    tagline: 'Deep Zen Clarity',
    iconName: 'sparkle',
  },
  cyan: {
    primary: '#38bdf8',
    primaryDark: '#0284c7',
    glow: 'rgba(56, 189, 248, 0.16)',
    accentGlow: 'rgba(56, 189, 248, 0.32)',
    border: 'rgba(56, 189, 248, 0.45)',
    surface: '#07121a',
    surfaceRaised: '#0d1d2b',
    background: '#02080d',
    hairline: '#152e42',
    actionFill: '#0c2538',
    actionText: '#e0f2fe',
    subtext: '#6594b2',
    name: 'Cyber Sky',
    tagline: 'Electric Flow State',
    iconName: 'wave',
  },
  amethyst: {
    primary: '#c084fc',
    primaryDark: '#9333ea',
    glow: 'rgba(192, 132, 252, 0.16)',
    accentGlow: 'rgba(192, 132, 252, 0.32)',
    border: 'rgba(192, 132, 252, 0.45)',
    surface: '#12091c',
    surfaceRaised: '#1c102b',
    background: '#07030c',
    hairline: '#2b1842',
    actionFill: '#26133c',
    actionText: '#f3e8ff',
    subtext: '#9978b8',
    name: 'Amethyst Aura',
    tagline: 'Mystic Calm & Depth',
    iconName: 'zen',
  },
  amber: {
    primary: '#fbbf24',
    primaryDark: '#d97706',
    glow: 'rgba(251, 191, 36, 0.16)',
    accentGlow: 'rgba(251, 191, 36, 0.32)',
    border: 'rgba(251, 191, 36, 0.45)',
    surface: '#161005',
    surfaceRaised: '#221908',
    background: '#0a0702',
    hairline: '#36280d',
    actionFill: '#30220a',
    actionText: '#fef3c7',
    subtext: '#b09363',
    name: 'Solar Amber',
    tagline: 'Vitality & Focus',
    iconName: 'flame',
  },
  rose: {
    primary: '#fb7185',
    primaryDark: '#e11d48',
    glow: 'rgba(251, 113, 133, 0.16)',
    accentGlow: 'rgba(251, 113, 133, 0.32)',
    border: 'rgba(251, 113, 133, 0.45)',
    surface: '#17070b',
    surfaceRaised: '#240d14',
    background: '#0a0205',
    hairline: '#38141f',
    actionFill: '#32111c',
    actionText: '#ffe4e6',
    subtext: '#b56f80',
    name: 'Neon Rose',
    tagline: 'Radical Awareness',
    iconName: 'target',
  },
  monochrome: {
    primary: '#f9f8f9',
    primaryDark: '#94a3b8',
    glow: 'rgba(255, 255, 255, 0.12)',
    accentGlow: 'rgba(255, 255, 255, 0.28)',
    border: 'rgba(255, 255, 255, 0.35)',
    surface: '#111111',
    surfaceRaised: '#1c1c1c',
    background: '#050505',
    hairline: '#2a2a2a',
    actionFill: '#242424',
    actionText: '#ffffff',
    subtext: '#9e9e9e',
    name: 'Pure Titanium',
    tagline: 'Brutalist Minimal',
    iconName: 'moon',
  },
};
const themeColors = THEME_COLORS;

const groundingSteps: { num: number; sense: string; iconName: IconName; title: string; prompt: string }[] = [
  {
    num: 5,
    sense: 'SEE',
    iconName: 'eye',
    title: 'Acknowledge 5 things you can see',
    prompt: 'Look around your room or space. Notice the shapes, colors, or shadows of 5 objects.',
  },
  {
    num: 4,
    sense: 'FEEL',
    iconName: 'hand',
    title: 'Acknowledge 4 things you can touch',
    prompt: 'Feel your feet on the floor, the texture of your clothing, the chair beneath you, or the cool air.',
  },
  {
    num: 3,
    sense: 'HEAR',
    iconName: 'ear',
    title: 'Acknowledge 3 sounds you can hear',
    prompt: 'Listen for subtle noises: the hum of electronics, distant chatter, your breath, or outdoor ambience.',
  },
  {
    num: 2,
    sense: 'SMELL',
    iconName: 'sparkle',
    title: 'Acknowledge 2 things you can smell',
    prompt: 'Take two conscious inhalations through your nose. Notice any ambient scent in the air.',
  },
  {
    num: 1,
    sense: 'TASTE',
    iconName: 'heart',
    title: 'Acknowledge 1 thing you can taste',
    prompt: 'Swallow, relax your jaw, or take a sip of cool water. Feel your prefrontal cortex return to clarity.',
  },
];

const STROOP_TRIALS = [
  { text: 'BLUE', color: '#38d39f', colorName: 'Emerald' },
  { text: 'RED', color: '#22d3ee', colorName: 'Cyan' },
  { text: 'AMBER', color: '#c084fc', colorName: 'Amethyst' },
  { text: 'GREEN', color: '#fbbf24', colorName: 'Amber' },
  { text: 'CYAN', color: '#38d39f', colorName: 'Emerald' },
];

const TRIGGER_DATA: Record<TriggerType, { label: string; iconName: IconName; advice: string }> = {
  boredom: {
    label: 'Boredom',
    iconName: 'coffee',
    advice: 'Boredom is the brain seeking stimulation. Channel it into a 2-minute physical stretch or hydration.',
  },
  stress: {
    label: 'Stress & Anxiety',
    iconName: 'wave',
    advice: 'Doomscrolling adds cognitive cortisol. Use the 4-4-4 Box Breathing reset to down-regulate your nervous system.',
  },
  procrastination: {
    label: 'Procrastination',
    iconName: 'timer',
    advice: 'Try the 2-Minute Rule: commit to doing just 120 seconds of your pending task. Starting breaks the freeze.',
  },
  habit: {
    label: 'Muscle Memory',
    iconName: 'refresh',
    advice: 'Your thumb unlocked out of reflex. The Mindful Floating HUD is here to make the invisible visible.',
  },
  fomo: {
    label: 'FOMO',
    iconName: 'users',
    advice: 'Algorithms manufacture synthetic urgency. Nothing happening on social media warrants losing your focus today.',
  },
};

const intentionsList: { id: string; title: string; iconName: IconName }[] = [
  { id: '1', title: 'Deep Work First, Feeds Later', iconName: 'shield' },
  { id: '2', title: 'Conscious Intent, No Idle Swipes', iconName: 'leaf' },
  { id: '3', title: 'Screens Off 1hr Before Sleep', iconName: 'moon' },
  { id: '4', title: 'Three Breaths Before Unlocking', iconName: 'zen' },
];

const soundscapesList: { id: FocusSoundscape; name: string; iconName: IconName; desc: string }[] = [
  { id: 'rain' as FocusSoundscape, name: 'Gentle Rain', iconName: 'rain', desc: 'Calming rain drops' },
  { id: 'forest' as FocusSoundscape, name: 'Pine Forest', iconName: 'tree', desc: 'Wind through trees' },
  { id: 'waves' as FocusSoundscape, name: 'Ocean Waves', iconName: 'wave', desc: 'Rhythmic surf' },
  { id: 'cafe' as FocusSoundscape, name: 'Quiet Library', iconName: 'coffee', desc: 'Soft ambient hum' },
  { id: 'cosmic' as FocusSoundscape, name: 'Cosmic Binaural', iconName: 'sparkle', desc: '432Hz deep focus' },
];

const moodsList: { id: UserMood; label: string; iconName: IconName; tip: string }[] = [
  { id: 'zen' as UserMood, label: 'Zen & Calm', iconName: 'zen', tip: 'Your mind is present and centered.' },
  { id: 'focused' as UserMood, label: 'Laser Focused', iconName: 'target', tip: 'Keep this deep momentum going.' },
  { id: 'distracted' as UserMood, label: 'Mildly Restless', iconName: 'wave', tip: 'Take a sip of water or 1m breath.' },
  { id: 'craving' as UserMood, label: 'Overstimulated', iconName: 'flame', tip: 'Surf the wave with Craving SOS.' },
];

const getHourDopamineProfile = (h: number): { period: string; risk: string; color: string; iconName: IconName; tip: string } => {
  if (h >= 6 && h < 11) {
    return {
      period: 'Morning Awakening & Focus',
      risk: 'Low Risk · High Willpower',
      color: '#38d39f',
      iconName: 'sun',
      tip: 'Cortisol awakening response primes natural clarity. Keep short feeds locked during this sacred window.',
    };
  }
  if (h >= 11 && h < 14) {
    return {
      period: 'Peak Execution Window',
      risk: 'Optimal Productivity',
      color: '#22d3ee',
      iconName: 'target',
      tip: 'High executive stamina. Perfect time for deep work sprints before the afternoon energy dip.',
    };
  }
  if (h >= 14 && h < 18) {
    return {
      period: 'Afternoon Slump & Vulnerability',
      risk: 'High Vulnerability Spike',
      color: '#fbbf24',
      iconName: 'bolt',
      tip: 'Natural circadian dip in core temperature & dopamine. Brain seeks instant gratification. Use Focus Shield.',
    };
  }
  if (h >= 18 && h < 22) {
    return {
      period: 'Twilight Leisure & Social',
      risk: 'Moderate Risk',
      color: '#a78bfa',
      iconName: 'moon',
      tip: 'Conscious wind-down time. Choose books, walks, or real conversations over mindless vertical swipes.',
    };
  }
  return {
    period: 'Melatonin Guard & Sleep Recovery',
    risk: 'Critical Disruption Zone',
    color: '#f87171',
    iconName: 'moon',
    tip: 'Short-form rapid video suppresses melatonin synthesis by up to 90 min. Keep phone away from bed.',
  };
};

const HOURLY_DOPAMINE_PROFILES = Array.from({ length: 24 }, (_, h) => getHourDopamineProfile(h));

const getZenLevel = (xp: number): { level: number; title: string; iconName: IconName; min: number; max: number } => {
  if (xp >= 1200) return { level: 5, title: 'Zen Grandmaster', iconName: 'sparkle', min: 1200, max: 2000 };
  if (xp >= 700) return { level: 4, title: 'Attention Sovereign', iconName: 'crown', min: 700, max: 1200 };
  if (xp >= 350) return { level: 3, title: 'Dopamine Alchemist', iconName: 'zen', min: 350, max: 700 };
  if (xp >= 150) return { level: 2, title: 'Feed Resistor', iconName: 'shield', min: 150, max: 350 };
  return { level: 1, title: 'Mindful Spark', iconName: 'leaf', min: 0, max: 150 };
};

const formatTimer = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good morning', iconName: 'sun' as IconName, tip: 'Fresh start — keep your morning scroll-free.' };
  if (hour < 17) return { text: 'Good afternoon', iconName: 'bolt' as IconName, tip: 'Notice if boredom triggers unconscious swipes.' };
  if (hour < 22) return { text: 'Good evening', iconName: 'moon' as IconName, tip: 'Wind down your dopamine levels for sound sleep.' };
  return { text: 'Late night hours', iconName: 'moon' as IconName, tip: 'Protect your melatonin and deep recovery rest.' };
};

const getChronoAnalysis = (): { level: string; badgeColor: string; iconName: IconName; title: string; advice: string } => {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) {
    return {
      level: 'Critical Vulnerability',
      badgeColor: '#f87171',
      iconName: 'moon',
      title: 'Melatonin & Deep Sleep Disruption',
      advice: 'Scrolling past 10 PM delays REM sleep by up to 90 minutes. Engage the Bedtime Shield now.',
    };
  }
  if (hour >= 13 && hour < 17) {
    return {
      level: 'Moderate Slump Risk',
      badgeColor: '#fbbf24',
      iconName: 'bolt',
      title: 'Afternoon Dopamine Fatigue',
      advice: 'Post-lunch cognitive drops trigger reflex swipes. Swap phone for 5 minutes of sunlight or cold water.',
    };
  }
  if (hour >= 5 && hour < 11) {
    return {
      level: 'Protected Morning Window',
      badgeColor: '#38d39f',
      iconName: 'sun',
      title: 'Morning Cortisol Alignment',
      advice: 'Keeping your first 60 minutes screen-free primes dopamine baseline for the entire day.',
    };
  }
  return {
    level: 'Evening Transition Zone',
    badgeColor: '#a78bfa',
    iconName: 'moon',
    title: 'Evening Decompression',
    advice: 'Avoid doomscrolling while unwinding. Give your eyes and mind real physical downtime.',
  };
};

function App() {
  const { width: windowWidth } = useWindowDimensions();
  const introScrollRef = useRef<any>(null);
  const [currentIntroSlide, setCurrentIntroSlide] = useState(0);

  const goToIntroSlide = useCallback((index: number) => {
    setCurrentIntroSlide(index);
    introScrollRef.current?.scrollTo({ x: index * (windowWidth || 360), animated: true });
  }, [windowWidth]);

  const [activeTab, setActiveTab] = useState<Tab>('counter');
  const [consentGiven, setConsentGiven] = useState(false);
  const [settingsError, setSettingsError] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [hasManuallyOpenedIntro, setHasManuallyOpenedIntro] = useState(false);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [introDemoHudCount, setIntroDemoHudCount] = useState(2);
  const [platformLimits, setPlatformLimits] = useState<Record<string, number>>({
    instagram: 25,
    tiktok: 25,
    youtube: 25,
    snapchat: 25,
  });

  // Settings & Limits state
  const [dailyLimit, setDailyLimit] = useState(50);
  const [dailyTimeLimitMin, setDailyTimeLimitMin] = useState(30);
  const [breakReminder, setBreakReminder] = useState(true);
  const [doomscrollAlert, setDoomscrollAlert] = useState(true);
  const [bedtimeShield, setBedtimeShield] = useState(false);
  const [speedbumpEnabled, setSpeedbumpEnabled] = useState(true);
  const [weeklyRecapAlert, setWeeklyRecapAlert] = useState(true);
  const [hudStyle, setHudStyle] = useState<HudStyle>('pill');
  const [themeAccent, setThemeAccent] = useState<ThemeAccent>('mint');
  const [selectedIntention, setSelectedIntention] = useState<string>(
    'Deep Work First, Feeds Later',
  );
  const [todayMood, setTodayMood] = useState<UserMood | null>(null);
  const [dopamineFastActive, setDopamineFastActive] = useState<boolean>(false);
  const [soundscape, setSoundscape] = useState<FocusSoundscape>('rain');
  const [soundscapePlaying, setSoundscapePlaying] = useState<boolean>(false);

  // Block & Focus state
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [blockInstagram, setBlockInstagram] = useState(true);
  const [blockTikTok, setBlockTikTok] = useState(true);
  const [blockYouTube, setBlockYouTube] = useState(false);
  const [blockSnapchat, setBlockSnapchat] = useState(false);
  const [focusTimerRunning, setFocusTimerRunning] = useState(false);
  const [focusTimerSeconds, setFocusTimerSeconds] = useState(15 * 60);

  // 7-Day History state & interaction
  const [dayHistory, setDayHistory] = useState<DayHistoryItem[]>([]);
  const dayHistoryRef = useRef<DayHistoryItem[]>(dayHistory);
  dayHistoryRef.current = dayHistory;
  const lastHistoryCandidateCountRef = useRef<number>(-1);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);

  // Mindful Breathing & Craving SOS Tool state
  const [showCravingModal, setShowCravingModal] = useState(false);
  const [cravingTab, setCravingTab] = useState<CravingTab>('breathing');
  const [breathePhase, setBreathePhase] = useState<BreathePhase>('Inhale');
  const [breatheSecondsRemaining, setBreatheSecondsRemaining] = useState(60);
  const [breatheCycleSec, setBreatheCycleSec] = useState(4);
  const [delaySeconds, setDelaySeconds] = useState(90);
  const [delayRunning, setDelayRunning] = useState(false);
  const [groundingStep, setGroundingStep] = useState(0);
  // Zen Mastery & XP Progression
  const [zenXp, setZenXp] = useState(380);
  const [dailyQuestsClaimed, setDailyQuestsClaimed] = useState<{
    compass: boolean;
    reset: boolean;
    shield: boolean;
    cap: boolean;
  }>({
    compass: true,
    reset: false,
    shield: false,
    cap: false,
  });

  // Stroop Cognitive Challenge State
  const [stroopRound, setStroopRound] = useState(0);
  const [stroopFeedback, setStroopFeedback] = useState<string | null>(null);
  const [stroopFinished, setStroopFinished] = useState(false);

  // 24-Hour Dopamine Clock
  const [selectedDopamineHour, setSelectedDopamineHour] = useState<number>(new Date().getHours());

  // Trigger & Craving Journal
  const [triggersLog, setTriggersLog] = useState<Record<TriggerType, number>>({
    boredom: 3,
    stress: 2,
    procrastination: 4,
    habit: 5,
    fomo: 1,
  });
  const [selectedTrigger, setSelectedTrigger] = useState<TriggerType>('procrastination');

  // Soundscape Duration
  const [soundscapeDurationMins, setSoundscapeDurationMins] = useState(25);

  // In-Feed Neuro-Interventions State
  const [grayscaleFilterEnabled, setGrayscaleFilterEnabled] = useState(true);
  const [grayscaleTriggerMode, setGrayscaleTriggerMode] = useState<'both' | 'overuse' | 'bedtime'>('both');
  const [fidgetSwipeEnabled, setFidgetSwipeEnabled] = useState(true);
  const [fidgetSwipeCount, setFidgetSwipeCount] = useState(0);
  const [consciousExitEnabled, setConsciousExitEnabled] = useState(true);
  const [showConsciousExitModal, setShowConsciousExitModal] = useState(false);
  const [consciousExitCountdown, setConsciousExitCountdown] = useState(60);
  const [realityCheckEnabled, setRealityCheckEnabled] = useState(true);
  const [showRealityCheckModal, setShowRealityCheckModal] = useState(false);
  const [realityCheckElapsedMins, _setRealityCheckElapsedMins] = useState(22);
  const [realityCheckApp, _setRealityCheckApp] = useState('Instagram Reels');
  const [nourishingCount, setNourishingCount] = useState(8);
  const [drainingCount, setDrainingCount] = useState(4);

  // Mascot Floating HUD Adaptive Simulator State
  const [simulatedHudSwipes, setSimulatedHudSwipes] = useState(18);

  // Polly's Morning Alignment State
  const [showMorningAlignment, setShowMorningAlignment] = useState(false);
  const [morningReclaimedMins, _setMorningReclaimedMins] = useState(45);
  const [morningCountdown, setMorningCountdown] = useState(5);
  const hasTriggeredMorningCheck = useRef(false);

  // Polly's Morning Alignment Card - Auto-trigger on morning hours
  useEffect(() => {
    if ((globalThis as any).process?.env?.NODE_ENV === 'test') return;
    if (hasTriggeredMorningCheck.current) return;
    hasTriggeredMorningCheck.current = true;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 14) {
      setShowMorningAlignment(true);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (showMorningAlignment) {
      setMorningCountdown(5);
      timer = setInterval(() => {
        setMorningCountdown(prev => {
          if (prev <= 1) {
            setShowMorningAlignment(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showMorningAlignment]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (showConsciousExitModal) {
      setConsciousExitCountdown(60);
      timer = setInterval(() => {
        setConsciousExitCountdown(prev => {
          if (prev <= 1) {
            setShowConsciousExitModal(false);
            Alert.alert('Mindful Session Complete', 'Phone rested face down.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showConsciousExitModal]);

  // Ambient Mindful Hero Ring Breathing Animation
  const ringBreathAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(ringBreathAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringBreathAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [ringBreathAnim]);

  const haloScale = ringBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.07],
  });

  const haloOpacity = ringBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.72, 1.0],
  });

  // Smooth Tab Screen Transitions
  const tabFadeAnim = useRef(new Animated.Value(1)).current;
  const tabTranslateY = useRef(new Animated.Value(0)).current;
  const tabScaleAnim = useRef(new Animated.Value(1)).current;
  const prevTabRef = useRef<Tab>(activeTab);

  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      tabFadeAnim.setValue(0.75);
      tabTranslateY.setValue(4);
      Animated.parallel([
        Animated.timing(tabFadeAnim, {
          toValue: 1,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tabTranslateY, {
          toValue: 0,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, tabFadeAnim, tabTranslateY]);

  // Liquid Glass Pill Dock & Gesture Navigation
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const [dockWidth, setDockWidth] = useState(windowWidth > 0 ? windowWidth - 28 : 340);
  const dockWidthRef = useRef(dockWidth);
  dockWidthRef.current = dockWidth;
  const dockLeftRef = useRef(14);
  const dockWrapRef = useRef<any>(null);

  const getDockRelativeX = (screenX?: number, fallbackX?: number): number => {
    const dockLeft = dockLeftRef.current > 0 ? dockLeftRef.current : Math.max(0, (windowWidth - dockWidthRef.current) / 2);
    if (screenX !== undefined && screenX !== null && !isNaN(screenX) && screenX > 0) {
      return Math.max(0, Math.min(dockWidthRef.current, screenX - dockLeft));
    }
    if (fallbackX !== undefined && fallbackX !== null && !isNaN(fallbackX) && fallbackX >= 0) {
      return Math.max(0, Math.min(dockWidthRef.current, fallbackX));
    }
    return dockWidthRef.current / 2;
  };

  const getTabIndexFromDockX = (dockX: number): number => {
    const dockInnerW = Math.max(1, dockWidthRef.current - 12);
    const slotW = dockInnerW / 4;
    const contentX = Math.max(0, Math.min(dockInnerW - 1, dockX - 6));
    return Math.max(0, Math.min(3, Math.floor(contentX / slotW)));
  };

  const getFractionalPosFromDockX = (dockX: number): number => {
    const dockInnerW = Math.max(1, dockWidthRef.current - 12);
    const slotW = dockInnerW / 4;
    const contentX = Math.max(0, Math.min(dockInnerW - 1, dockX - 6));
    return Math.max(0, Math.min(3, contentX / slotW - 0.5));
  };

  const sliderAnim = useRef(new Animated.Value(TAB_INDEX_MAP[activeTab])).current;
  const sliderScaleX = useRef(new Animated.Value(1.0)).current;
  const sliderScaleY = useRef(new Animated.Value(1.0)).current;
  const dockScale = useRef(new Animated.Value(1.0)).current;

  // Floating Scrub Tooltip Capsule animations
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipScale = useRef(new Animated.Value(0.82)).current;
  const tooltipX = useRef(new Animated.Value(TAB_INDEX_MAP[activeTab])).current;

  // Optical Crystal Shimmer Light Wave
  const shimmerAnim = useRef(new Animated.Value(-1)).current;
  const triggerDockShimmer = () => {
    shimmerAnim.setValue(-1);
    Animated.timing(shimmerAnim, {
      toValue: 2,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Water Droplet Touch Ripple
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const rippleX = useRef(new Animated.Value(0)).current;
  const rippleY = useRef(new Animated.Value(0)).current;
  const tooltipVisibleRef = useRef(false);
  const eqPulseAnim = useRef(new Animated.Value(0)).current;

  // Icon bounce animations
  const iconBounceAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const triggerIconBounce = (idx: number) => {
    Animated.sequence([
      Animated.spring(iconBounceAnims[idx], {
        toValue: 1.25,
        friction: 3.5,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(iconBounceAnims[idx], {
        toValue: 1.0,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Long-Press Quick Action Palette
  const [quickActionTab, setQuickActionTab] = useState<number | null>(null);
  const quickActionTabRef = useRef<number | null>(null);
  const quickActionScale = useRef(new Animated.Value(0)).current;
  const quickActionOpacity = useRef(new Animated.Value(0)).current;
  const longPressTimerRef = useRef<any>(null);
  const didLongPressRef = useRef(false);
  const initialTouchedTabIdxRef = useRef<number>(0);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const closeQuickActions = (immediate?: boolean | unknown) => {
    quickActionTabRef.current = null;
    if (immediate === true) {
      quickActionOpacity.setValue(0);
      quickActionScale.setValue(0.8);
      setQuickActionTab(null);
      return;
    }
    Animated.parallel([
      Animated.timing(quickActionOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(quickActionScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => setQuickActionTab(null));
  };

  const openQuickActions = (idx: number) => {
    try {
      Vibration.vibrate([0, 15, 30, 20]);
    } catch {}
    quickActionTabRef.current = idx;
    setQuickActionTab(idx);
    quickActionScale.setValue(0.75);
    quickActionOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(quickActionScale, {
        toValue: 1.0,
        friction: 6,
        tension: 150,
        useNativeDriver: true,
      }),
      Animated.timing(quickActionOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const nextThemeAccent = (): ThemeAccent => {
    const themes: ThemeAccent[] = ['mint', 'cyan', 'amethyst', 'amber', 'rose', 'monochrome'];
    const current = themeAccent === 'emerald' ? 'mint' : themeAccent;
    const currentIndex = themes.indexOf(current);
    return themes[(currentIndex + 1) % themes.length];
  };

  const getQuickActionsForTab = (idx: number): { label: string; icon: IconName; action: () => void }[] => {
    switch (idx) {
      case 0:
        return [
          { label: '1m Reset Breath', icon: 'zen', action: () => openCravingModal('breathing') },
          { label: '15m Focus Sprint', icon: 'bolt', action: () => handleQuickFocus15m() },
          { label: 'Reset Today (0)', icon: 'refresh', action: () => handleResetCounters() },
        ];
      case 1:
        return [
          { label: '+5 Daily Limit', icon: 'timer', action: () => handleAdjustLimit(5) },
          { label: '-5 Daily Limit', icon: 'timer', action: () => handleAdjustLimit(-5) },
          {
            label: bedtimeShield ? 'Day Feeds' : 'Bedtime Shield',
            icon: 'moon',
            action: () => {
              const n = !bedtimeShield;
              setBedtimeShield(n);
              PrototypeSettings.setBedtimeShield(n, 23, 6).catch(() => {});
            },
          },
        ];
      case 2:
        return [
          {
            label: '25m Focus Sprint',
            icon: 'timer',
            action: () => {
              handleSelectFocusPreset(25);
              handleToggleFocusSession();
            },
          },
          { label: '90s Wave Surfer', icon: 'wave', action: () => openCravingModal('delay') },
          {
            label: 'Stroop Urge Gate',
            icon: 'brain',
            action: () => {
              resetStroop();
              openCravingModal('stroop');
            },
          },
        ];
      case 3:
        return [
          {
            label: 'Next Palette',
            icon: 'palette',
            action: () => {
              const next = nextThemeAccent();
              setThemeAccent(next);
              PrototypeSettings.setThemeAccent(next).catch(() => {});
            },
          },
          {
            label: 'Accessibility',
            icon: 'shield',
            action: () => PrototypeSettings.openAccessibilitySettings(),
          },
          { label: 'Share Progress', icon: 'share', action: () => shareMindfulProgress() },
        ];
      default:
        return [];
    }
  };

  // Resting pulsating breathing droplet indicator
  const dropletPulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(dropletPulseAnim, {
          toValue: 1,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dropletPulseAnim, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [dropletPulseAnim]);

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (soundscapePlaying) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(eqPulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(eqPulseAnim, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
    } else {
      eqPulseAnim.setValue(0);
    }
    return () => {
      anim?.stop();
    };
  }, [soundscapePlaying, eqPulseAnim]);

  // 4 tabs scale, translateY, and tilt
  const tabScaleAnims = useRef([
    new Animated.Value(activeTab === 'counter' ? 1.12 : 1.0),
    new Animated.Value(activeTab === 'timers' ? 1.12 : 1.0),
    new Animated.Value(activeTab === 'block' ? 1.12 : 1.0),
    new Animated.Value(activeTab === 'settings' ? 1.12 : 1.0),
  ]).current;

  const tabTranslateYAnims = useRef([
    new Animated.Value(activeTab === 'counter' ? -3.5 : 0),
    new Animated.Value(activeTab === 'timers' ? -3.5 : 0),
    new Animated.Value(activeTab === 'block' ? -3.5 : 0),
    new Animated.Value(activeTab === 'settings' ? -3.5 : 0),
  ]).current;

  const tabTiltAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const triggerDockHaptic = () => {
    try {
      if (typeof Vibration?.vibrate === 'function') {
        Vibration.vibrate(8);
      }
    } catch {}
  };

  // Continuous Bell-Curve Fisheye Magnification - Direct 1:1 hardware values during dragging
  const applyContinuousFisheye = (fingerX: number, velocityX = 0) => {
    const slotW = (dockWidthRef.current - 12) / 4;
    for (let i = 0; i < 4; i++) {
      const tabCenter = (i + 0.5) * slotW + 6;
      const dist = Math.abs(fingerX - tabCenter) / slotW;
      // Parabolic falloff factor
      const factor = Math.max(0, 1 - Math.min(1, dist * 0.72));
      const targetScale = 1.0 + factor * 0.22; // up to 1.22x at peak
      const targetY = -factor * 5.0; // lifts up to -5.0dp without clipping top border
      const tiltVal = Math.max(-6, Math.min(6, velocityX * 8));

      tabScaleAnims[i].setValue(targetScale);
      tabTranslateYAnims[i].setValue(targetY);
      tabTiltAnims[i].setValue(dist < 1.0 ? tiltVal : 0);
    }
  };

  const resetDockRestingState = (targetIdx: number) => {
    tabScaleAnims.forEach((anim, i) => {
      Animated.spring(anim, {
        toValue: i === targetIdx ? 1.08 : 1.0,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }).start();
      Animated.spring(tabTranslateYAnims[i], {
        toValue: i === targetIdx ? -2.5 : 0,
        friction: 6,
        tension: 110,
        useNativeDriver: true,
      }).start();
      Animated.spring(tabTiltAnims[i], {
        toValue: 0,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    });
  };

  const lastAnimatedTabIdxRef = useRef<number | null>(null);
  const lastAnimateTimestampRef = useRef<number>(0);
  const hasScrubbedRef = useRef(false);

  const animateTabSelection = useCallback((targetIdx: number) => {
    const now = Date.now();
    if (now - lastAnimateTimestampRef.current < 250 && lastAnimatedTabIdxRef.current === targetIdx) {
      return;
    }
    lastAnimateTimestampRef.current = now;
    lastAnimatedTabIdxRef.current = targetIdx;

    const chosenTab = TABS[targetIdx]?.id ?? 'counter';

    triggerDockHaptic();
    triggerIconBounce(targetIdx);
    triggerDockShimmer();

    // Release 3D compression with spring bounce
    Animated.sequence([
      Animated.timing(dockScale, {
        toValue: 0.97,
        duration: 60,
        useNativeDriver: true,
      }),
      Animated.spring(dockScale, {
        toValue: 1.0,
        friction: 6,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();

    // Fluid spring of slider towards target tab with mercury squash & stretch
    Animated.parallel([
      Animated.spring(sliderAnim, {
        toValue: targetIdx,
        friction: 6.5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(tooltipX, {
        toValue: targetIdx,
        friction: 6.5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(sliderScaleX, {
          toValue: 0.92,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(sliderScaleX, {
          toValue: 1.0,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(sliderScaleY, {
          toValue: 1.08,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(sliderScaleY, {
          toValue: 1.0,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Smoothly elevate the selected tab and reset other tabs to resting state
    resetDockRestingState(targetIdx);

    setActiveTab(chosenTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const targetIdx = TAB_INDEX_MAP[activeTab];
    if (lastAnimatedTabIdxRef.current === targetIdx) {
      lastAnimatedTabIdxRef.current = null;
      return;
    }
    triggerDockShimmer();
    triggerIconBounce(targetIdx);

    Animated.parallel([
      Animated.spring(sliderAnim, {
        toValue: targetIdx,
        friction: 6.5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(tooltipX, {
        toValue: targetIdx,
        friction: 6.5,
        tension: 110,
        useNativeDriver: true,
      }),
      Animated.spring(sliderScaleX, {
        toValue: 1.0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(sliderScaleY, {
        toValue: 1.0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    resetDockRestingState(targetIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const currentHoveredIdxRef = useRef(TAB_INDEX_MAP[activeTab]);
  const isDragActiveRef = useRef(false);

  const getScrubTooltipInfo = (idx: number) => {
    switch (idx) {
      case 0:
        return {
          icon: 'dashboard' as IconName,
          title: 'Dashboard',
          sub: `${totalShorts} reels today · ${progressPercent}% cap`,
          accent: isOverLimit ? '#ef4444' : currentTheme.primary,
        };
      case 1:
        return {
          icon: 'timer' as IconName,
          title: 'Habit Limits',
          sub: `${dailyLimit} reels · ${dailyTimeLimitMin}m daily cap`,
          accent: currentTheme.primary,
        };
      case 2:
        return {
          icon: 'shield' as IconName,
          title: 'Focus Shield',
          sub: focusTimerRunning
            ? `${formatTimer(focusTimerSeconds)} remaining · Locked`
            : 'Shield ready to activate',
          accent: focusTimerRunning ? '#ef4444' : currentTheme.primary,
        };
      case 3:
        return {
          icon: 'settings' as IconName,
          title: 'Wellbeing Growth',
          sub: `Lvl ${zenLevel.level} Zen · ${zenXp} XP`,
          accent: currentTheme.primary,
        };
      default:
        return {
          icon: 'dashboard' as IconName,
          title: 'Dashboard',
          sub: `${totalShorts} videos today`,
          accent: currentTheme.primary,
        };
    }
  };

  const dockPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt, gesture) => {
        isDragActiveRef.current = true;
        hasScrubbedRef.current = false;
        didLongPressRef.current = false;
        setIsDraggingDock(true);

        const screenX = gesture?.x0 ?? evt?.nativeEvent?.pageX;
        const screenY = gesture?.y0 ?? evt?.nativeEvent?.pageY;
        touchStartPosRef.current = { x: screenX, y: screenY };

        const dockX = getDockRelativeX(screenX, evt?.nativeEvent?.locationX);
        const idx = getTabIndexFromDockX(dockX);

        initialTouchedTabIdxRef.current = idx;
        currentHoveredIdxRef.current = idx;
        setHoveredTabIndex(idx);

        // Schedule long-press quick action timer (450ms)
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        longPressTimerRef.current = setTimeout(() => {
          // Fire quick actions ONLY if finger hasn't scrubbed/moved away
          if (!hasScrubbedRef.current && isDragActiveRef.current) {
            didLongPressRef.current = true;
            openQuickActions(idx);
          }
        }, 450);

        // Touch ripple animation inside dock using native animated driver
        rippleX.setValue(dockX);
        rippleY.setValue(evt?.nativeEvent?.locationY || 35);
        rippleAnim.setValue(0);
        rippleOpacity.setValue(0.5);
        Animated.parallel([
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();

        // 3D Press Down Effect on dock container
        Animated.spring(dockScale, {
          toValue: 0.975,
          friction: 6,
          tension: 160,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (evt, gesture) => {
        if (!isDragActiveRef.current) return;

        const screenX =
          gesture?.moveX ||
          (gesture && gesture.x0 !== undefined ? gesture.x0 + gesture.dx : undefined) ||
          evt?.nativeEvent?.pageX;
        const currentX = screenX !== undefined ? screenX : 0;
        const startX = touchStartPosRef.current?.x ?? (gesture?.x0 ?? currentX);
        const diffX = Math.abs(currentX - startX);
        const moveDistance = Math.max(Math.hypot(gesture?.dx || 0, gesture?.dy || 0), diffX);

        if (moveDistance > 8) {
          hasScrubbedRef.current = true;

          // Kill long-press timer immediately when scrubbing motion starts
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }

          // If the quick actions palette was opened (user held and now moves to scrub),
          // dismiss it immediately so scrubbing is unobstructed
          if (quickActionTabRef.current !== null || didLongPressRef.current) {
            closeQuickActions(true);
            didLongPressRef.current = false;
          }
        }

        const dockX = getDockRelativeX(screenX, evt?.nativeEvent?.locationX);
        const idx = getTabIndexFromDockX(dockX);
        const fractionalPos = getFractionalPosFromDockX(dockX);

        if (hasScrubbedRef.current) {
          // Smoothly reveal scrub preview tooltip capsule when scrubbing starts (single trigger)
          if (!tooltipVisibleRef.current) {
            tooltipVisibleRef.current = true;
            Animated.parallel([
              Animated.spring(tooltipScale, {
                toValue: 1.0,
                friction: 6,
                tension: 130,
                useNativeDriver: true,
              }),
              Animated.timing(tooltipOpacity, {
                toValue: 1,
                duration: 120,
                useNativeDriver: true,
              }),
            ]).start();
          }

          // Direct fluid tracking for Slider & Tooltip right under thumb (0ms latency)
          sliderAnim.setValue(fractionalPos);
          tooltipX.setValue(fractionalPos);

          // Dynamic Mercury Stretch based on horizontal sliding speed
          const speedStretch = Math.min(1.24, 1.0 + Math.abs(gesture?.vx || 0) * 0.15);
          sliderScaleX.setValue(speedStretch);

          // Continuous fisheye magnification as thumb scrubs left and right
          applyContinuousFisheye(dockX, gesture?.vx || 0);

          if (idx !== currentHoveredIdxRef.current) {
            currentHoveredIdxRef.current = idx;
            setHoveredTabIndex(idx);
            triggerDockHaptic();
          }
        }
      },
      onPanResponderRelease: (evt, gesture) => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }

        const screenX =
          gesture?.moveX ||
          (gesture && gesture.x0 !== undefined ? gesture.x0 + gesture.dx : undefined) ||
          evt?.nativeEvent?.pageX;
        const currentX = screenX !== undefined ? screenX : 0;
        const startX = touchStartPosRef.current?.x ?? (gesture?.x0 ?? currentX);
        const diffX = Math.abs(currentX - startX);
        const wasScrubbing = hasScrubbedRef.current || diffX > 8;
        const wasLongPress = didLongPressRef.current && !wasScrubbing;

        isDragActiveRef.current = false;
        hasScrubbedRef.current = false;
        didLongPressRef.current = false;
        setIsDraggingDock(false);
        tooltipVisibleRef.current = false;

        const dockX = getDockRelativeX(screenX, evt?.nativeEvent?.locationX);
        const finalIdx =
          currentHoveredIdxRef.current !== null && currentHoveredIdxRef.current !== undefined && wasScrubbing
            ? currentHoveredIdxRef.current
            : getTabIndexFromDockX(dockX);

        setHoveredTabIndex(null);

        // Hide Scrub Tooltip
        Animated.parallel([
          Animated.timing(tooltipOpacity, {
            toValue: 0,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(tooltipScale, {
            toValue: 0.82,
            duration: 120,
            useNativeDriver: true,
          }),
        ]).start();

        // Release 3D compression with spring back
        Animated.spring(dockScale, {
          toValue: 1.0,
          friction: 6,
          tension: 140,
          useNativeDriver: true,
        }).start();

        if (wasScrubbing) {
          // User scrubbed across dock and released onto target tab
          animateTabSelection(finalIdx);
        } else if (wasLongPress) {
          // User held still for >450ms; shortcuts palette is open, keep current tab
        } else {
          // Quick tap -> switch to tapped tab
          const tapIdx = initialTouchedTabIdxRef.current ?? finalIdx;
          animateTabSelection(tapIdx);
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        isDragActiveRef.current = false;
        hasScrubbedRef.current = false;
        didLongPressRef.current = false;
        setIsDraggingDock(false);
        tooltipVisibleRef.current = false;
        setHoveredTabIndex(null);
        const activeIdx = TAB_INDEX_MAP[activeTab];

        Animated.spring(dockScale, {
          toValue: 1.0,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }).start();

        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();

        Animated.spring(sliderAnim, {
          toValue: activeIdx,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start();

        Animated.spring(tooltipX, {
          toValue: activeIdx,
          friction: 6,
          tension: 90,
          useNativeDriver: true,
        }).start();

        resetDockRestingState(activeIdx);
      },
    })
  ).current;

  // Mindful Box Breathing Scale Animation in Craving Modal
  const modalBreathAnim = useRef(new Animated.Value(1.0)).current;
  useEffect(() => {
    if (showCravingModal && cravingTab === 'breathing') {
      if (breathePhase === 'Inhale') {
        Animated.timing(modalBreathAnim, {
          toValue: 1.35,
          duration: 3900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      } else if (breathePhase === 'Exhale') {
        Animated.timing(modalBreathAnim, {
          toValue: 1.0,
          duration: 3900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    } else {
      modalBreathAnim.setValue(1.0);
    }
  }, [breathePhase, showCravingModal, cravingTab, modalBreathAnim]);

  const [prototypeStatus, setPrototypeStatus] = useState<PrototypeStatus>({
    serviceConnected: false,
    candidateCount: 0,
    bufferedEventCount: 0,
    instagramCount: 0,
    tiktokCount: 0,
    youtubeCount: 0,
    snapchatCount: 0,
  });

  // Load status and history periodically with smart diffing and background pause
  useEffect(() => {
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refreshStatus = () => {
      if (isDragActiveRef.current) return;

      PrototypeSettings.getPrototypeStatus()
        .then(status => {
          if (!mounted || !status) return;

          setPrototypeStatus(prev => {
            if (
              prev.candidateCount === status.candidateCount &&
              prev.serviceConnected === status.serviceConnected &&
              prev.instagramCount === status.instagramCount &&
              prev.tiktokCount === status.tiktokCount &&
              prev.youtubeCount === status.youtubeCount &&
              prev.snapchatCount === status.snapchatCount &&
              prev.dailyShortLimit === status.dailyShortLimit &&
              prev.dailyTimeLimitMinutes === status.dailyTimeLimitMinutes &&
              prev.focusModeActive === status.focusModeActive &&
              prev.focusRemainingSeconds === status.focusRemainingSeconds &&
              prev.zenXp === status.zenXp &&
              prev.hudStyle === status.hudStyle &&
              prev.bedtimeShieldEnabled === status.bedtimeShieldEnabled &&
              prev.themeAccent === status.themeAccent &&
              prev.onboardingCompleted === status.onboardingCompleted
            ) {
              return prev;
            }
            return status;
          });

          if (status.dailyShortLimit !== undefined) {
            const val = status.dailyShortLimit;
            setDailyLimit(prev => (prev !== val ? val : prev));
          }
          if (status.hudStyle) {
            const val = status.hudStyle as HudStyle;
            setHudStyle(prev => (prev !== val ? val : prev));
          }
          if (status.bedtimeShieldEnabled !== undefined) {
            const val = status.bedtimeShieldEnabled;
            setBedtimeShield(prev => (prev !== val ? val : prev));
          }
          if (status.doomscrollAlertEnabled !== undefined) {
            const val = status.doomscrollAlertEnabled;
            setDoomscrollAlert(prev => (prev !== val ? val : prev));
          }
          if (status.breakReminderEnabled !== undefined) {
            const val = status.breakReminderEnabled;
            setBreakReminder(prev => (prev !== val ? val : prev));
          }
          if (status.speedbumpEnabled !== undefined) {
            const val = status.speedbumpEnabled;
            setSpeedbumpEnabled(prev => (prev !== val ? val : prev));
          }
          if (status.zenXp !== undefined) {
            const val = status.zenXp;
            setZenXp(prev => (prev !== val ? val : prev));
          }
          if (status.userIntention) {
            const val = status.userIntention;
            setSelectedIntention(prev => (prev !== val ? val : prev));
          }
          if (status.userMood) {
            const val = status.userMood as UserMood;
            setTodayMood(prev => (prev !== val ? val : prev));
          }
          if (status.instagramLimit !== undefined) {
            setPlatformLimits(prev => {
              const nextIg = status.instagramLimit || prev.instagram;
              const nextTt = status.tiktokLimit || prev.tiktok;
              const nextYt = status.youtubeLimit || prev.youtube;
              const nextSc = status.snapchatLimit || prev.snapchat;
              if (
                prev.instagram === nextIg &&
                prev.tiktok === nextTt &&
                prev.youtube === nextYt &&
                prev.snapchat === nextSc
              ) {
                return prev;
              }
              return {
                instagram: nextIg,
                tiktok: nextTt,
                youtube: nextYt,
                snapchat: nextSc,
              };
            });
          }
          if (status.triggerBoredom !== undefined) {
            setTriggersLog(prev => {
              const b = status.triggerBoredom ?? 3;
              const s = status.triggerStress ?? 2;
              const p = status.triggerProcrastination ?? 4;
              const h = status.triggerHabit ?? 5;
              const f = status.triggerFomo ?? 1;
              if (
                prev.boredom === b &&
                prev.stress === s &&
                prev.procrastination === p &&
                prev.habit === h &&
                prev.fomo === f
              ) {
                return prev;
              }
              return { boredom: b, stress: s, procrastination: p, habit: h, fomo: f };
            });
          }
          if (status.themeAccent) {
            const savedAccent = status.themeAccent.toLowerCase() as ThemeAccent;
            if (
              savedAccent === 'mint' ||
              savedAccent === 'cyan' ||
              savedAccent === 'amethyst' ||
              savedAccent === 'amber' ||
              savedAccent === 'monochrome' ||
              savedAccent === 'emerald' ||
              savedAccent === 'rose'
            ) {
              setThemeAccent(prev => (prev !== savedAccent ? savedAccent : prev));
            }
          }
          if (status.onboardingCompleted && !hasManuallyOpenedIntro) {
            setShowIntro(false);
          }
          if (status.grayscaleFilterEnabled !== undefined) {
            setGrayscaleFilterEnabled(status.grayscaleFilterEnabled);
          }
          if (status.grayscaleTriggerMode) {
            setGrayscaleTriggerMode(status.grayscaleTriggerMode as any);
          }
          if (status.fidgetSwipeDetectorEnabled !== undefined) {
            setFidgetSwipeEnabled(status.fidgetSwipeDetectorEnabled);
          }
          if (status.fidgetSwipeCountToday !== undefined) {
            setFidgetSwipeCount(status.fidgetSwipeCountToday);
          }
          if (status.consciousExitEnabled !== undefined) {
            setConsciousExitEnabled(status.consciousExitEnabled);
          }
          if (status.realityCheckEnabled !== undefined) {
            setRealityCheckEnabled(status.realityCheckEnabled);
          }
          if (status.nourishingCount !== undefined) {
            setNourishingCount(status.nourishingCount);
          }
          if (status.drainingCount !== undefined) {
            setDrainingCount(status.drainingCount);
          }

          // Smart History Fetch: Only fetch history if candidateCount changed or on initial load
          if (lastHistoryCandidateCountRef.current !== status.candidateCount || dayHistoryRef.current.length === 0) {
            lastHistoryCandidateCountRef.current = status.candidateCount;
            PrototypeSettings.getDailyHistory()
              .then(history => {
                if (!mounted || !history || history.length === 0) return;
                setDayHistory(prev => {
                  if (
                    prev.length === history.length &&
                    prev.every(
                      (item, i) =>
                        item.date === history[i].date &&
                        item.count === history[i].count &&
                        item.label === history[i].label,
                    )
                  ) {
                    return prev;
                  }
                  return history;
                });
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    };

    const startPolling = () => {
      if (interval) clearInterval(interval);
      refreshStatus();
      interval = setInterval(refreshStatus, 1000);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startPolling();
      } else {
        stopPolling();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    startPolling();

    return () => {
      mounted = false;
      stopPolling();
      sub.remove();
    };
  }, [hasManuallyOpenedIntro]);

  // Sync Focus Mode timer and native service
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (focusTimerRunning) {
      timer = setInterval(() => {
        setFocusTimerSeconds(prev => {
          if (prev <= 1) {
            setFocusTimerRunning(false);
            setFocusModeActive(false);
            PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
            Alert.alert('Focus Session Complete!', 'Great job avoiding distraction and staying on track.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [focusTimerRunning]);

  // Mindful Breath Guide Engine (4-4-4 Box Breathing)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (showCravingModal && cravingTab === 'breathing') {
      interval = setInterval(() => {
        setBreatheSecondsRemaining(prev => {
          if (prev <= 1) {
            setShowCravingModal(false);
            Alert.alert('Mindful Reset Complete', 'Take this calm awareness with you into your day.');
            return 60;
          }
          return prev - 1;
        });

        setBreatheCycleSec(prev => {
          if (prev <= 1) {
            // Transition phase
            setBreathePhase(current => {
              if (current === 'Inhale') return 'Hold';
              if (current === 'Hold') return 'Exhale';
              return 'Inhale';
            });
            return 4; // 4-second cycles
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCravingModal, cravingTab]);

  // 90-Second Craving Surge Delay Engine
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (delayRunning) {
      interval = setInterval(() => {
        setDelaySeconds(prev => {
          if (prev <= 1) {
            setDelayRunning(false);
            Alert.alert(
              'Craving Wave Surfed!',
              'Awesome impulse victory! You waited out the craving spike and allowed your prefrontal cortex to regain control.',
            );
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [delayRunning]);

  const openCravingModal = (tab: CravingTab = 'breathing') => {
    setCravingTab(tab);
    setShowCravingModal(true);
  };

  const toggleSoundscapeAudio = useCallback((targetPlaying?: boolean, soundscapeType: FocusSoundscape = soundscape) => {
    const nextPlaying = targetPlaying !== undefined ? targetPlaying : !soundscapePlaying;
    setSoundscapePlaying(nextPlaying);
    if (nextPlaying) {
      PrototypeSettings.playSoundscape(soundscapeType, soundscapeDurationMins).catch(() => {});
    } else {
      PrototypeSettings.stopSoundscape().catch(() => {});
    }
  }, [soundscape, soundscapePlaying, soundscapeDurationMins]);

  const continueToSettings = useCallback(async () => {
    if (!consentGiven) {
      return;
    }

    setSettingsError(false);
    try {
      await PrototypeSettings.openAccessibilitySettings();
    } catch {
      setSettingsError(true);
    }
  }, [consentGiven]);

  const handleEnterDashboard = () => {
    setShowIntro(false);
    PrototypeSettings.setOnboardingCompleted(true).catch(() => {});
  };

  const handleResetCounters = async () => {
    Alert.alert(
      "Reset Today's Counters?",
      'This will reset your scroll count back to 0 for today. Past day history will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to 0',
          style: 'destructive',
          onPress: async () => {
            try {
              await PrototypeSettings.resetCounters();
              setPrototypeStatus(prev => ({
                ...prev,
                candidateCount: 0,
                bufferedEventCount: 0,
                instagramCount: 0,
                tiktokCount: 0,
                youtubeCount: 0,
                snapchatCount: 0,
              }));
              const updatedHistory = await PrototypeSettings.getDailyHistory();
              setDayHistory(updatedHistory);
            } catch {}
          },
        },
      ],
    );
  };

  const handleToggleBlockApp = useCallback((app: 'ig' | 'tt' | 'yt' | 'sc') => {
    let nextIg = blockInstagram;
    let nextTt = blockTikTok;
    let nextYt = blockYouTube;
    let nextSc = blockSnapchat;

    if (app === 'ig') {
      nextIg = !blockInstagram;
      setBlockInstagram(nextIg);
    } else if (app === 'tt') {
      nextTt = !blockTikTok;
      setBlockTikTok(nextTt);
    } else if (app === 'yt') {
      nextYt = !blockYouTube;
      setBlockYouTube(nextYt);
    } else if (app === 'sc') {
      nextSc = !blockSnapchat;
      setBlockSnapchat(nextSc);
    }

    if (focusModeActive || focusTimerRunning) {
      const blocked: string[] = [];
      if (nextIg) blocked.push(TARGET_PACKAGES.INSTAGRAM);
      if (nextTt) blocked.push(TARGET_PACKAGES.TIKTOK);
      if (nextYt) blocked.push(TARGET_PACKAGES.YOUTUBE);
      if (nextSc) blocked.push(TARGET_PACKAGES.SNAPCHAT);
      const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  }, [blockInstagram, blockTikTok, blockYouTube, blockSnapchat, focusModeActive, focusTimerRunning, focusTimerSeconds]);

  const handleToggleAllApps = useCallback((blockAll: boolean) => {
    setBlockInstagram(blockAll);
    setBlockTikTok(blockAll);
    setBlockYouTube(blockAll);
    setBlockSnapchat(blockAll);

    if (focusModeActive || focusTimerRunning) {
      const blocked: string[] = blockAll
        ? [
            TARGET_PACKAGES.INSTAGRAM,
            TARGET_PACKAGES.TIKTOK,
            TARGET_PACKAGES.YOUTUBE,
            TARGET_PACKAGES.SNAPCHAT,
          ]
        : [];
      const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  }, [focusModeActive, focusTimerRunning, focusTimerSeconds]);

  const getBlockedPackagesList = useCallback((): string[] => {
    const list: string[] = [];
    if (blockInstagram) list.push(TARGET_PACKAGES.INSTAGRAM);
    if (blockTikTok) list.push(TARGET_PACKAGES.TIKTOK);
    if (blockYouTube) list.push(TARGET_PACKAGES.YOUTUBE);
    if (blockSnapchat) list.push(TARGET_PACKAGES.SNAPCHAT);
    return list;
  }, [blockInstagram, blockTikTok, blockYouTube, blockSnapchat]);

  const handleToggleFocusSession = useCallback(async () => {
    if (focusTimerRunning) {
      setFocusTimerRunning(false);
      setFocusModeActive(false);
      await PrototypeSettings.setFocusMode(false, 0, []);
    } else {
      const blocked = getBlockedPackagesList();
      const minutes = Math.max(1, Math.ceil(focusTimerSeconds / 60));
      await PrototypeSettings.setFocusMode(true, minutes, blocked);
      setFocusModeActive(true);
      setFocusTimerRunning(true);
    }
  }, [focusTimerRunning, getBlockedPackagesList, focusTimerSeconds]);

  const handleQuickFocus15m = useCallback(async () => {
    setFocusTimerSeconds(15 * 60);
    const blocked = getBlockedPackagesList();
    await PrototypeSettings.setFocusMode(true, 15, blocked);
    setFocusModeActive(true);
    setFocusTimerRunning(true);
    setActiveTab('block');
  }, [getBlockedPackagesList]);

  const handleAdjustLimit = useCallback((delta: number) => {
    const next = Math.max(10, Math.min(300, dailyLimit + delta));
    setDailyLimit(next);
    PrototypeSettings.setDailyLimits(next, dailyTimeLimitMin).catch(() => {});
  }, [dailyLimit, dailyTimeLimitMin]);

  const handleAdjustTimeLimit = useCallback((delta: number) => {
    const next = Math.max(5, Math.min(180, dailyTimeLimitMin + delta));
    setDailyTimeLimitMin(next);
    PrototypeSettings.setDailyLimits(dailyLimit, next).catch(() => {});
  }, [dailyLimit, dailyTimeLimitMin]);

  const handleAdjustFocusTimer = useCallback((deltaMinutes: number) => {
    if (focusTimerRunning) return;
    const currentMins = Math.round(focusTimerSeconds / 60);
    const nextMins = Math.max(5, Math.min(120, currentMins + deltaMinutes));
    setFocusTimerSeconds(nextMins * 60);
  }, [focusTimerRunning, focusTimerSeconds]);

  const handleSelectDailyLimit = useCallback((limit: number) => {
    setDailyLimit(limit);
    PrototypeSettings.setDailyLimits(limit, dailyTimeLimitMin).catch(() => {});
  }, [dailyTimeLimitMin]);

  const handleSelectDailyTimeLimit = useCallback((mins: number) => {
    setDailyTimeLimitMin(mins);
    PrototypeSettings.setDailyLimits(dailyLimit, mins).catch(() => {});
  }, [dailyLimit]);

  const handleSelectFocusPreset = useCallback((mins: number) => {
    setFocusTimerSeconds(mins * 60);
    if (focusTimerRunning) {
      const blocked = getBlockedPackagesList();
      PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
    }
  }, [focusTimerRunning, getBlockedPackagesList]);

  // App breakdown
  const igCount = prototypeStatus.instagramCount ?? 0;
  const ttCount = prototypeStatus.tiktokCount ?? 0;
  const ytCount = prototypeStatus.youtubeCount ?? 0;
  const scCount = prototypeStatus.snapchatCount ?? 0;
  const platformTotal = igCount + ttCount + ytCount + scCount;
  const totalShorts = Math.max(prototypeStatus.candidateCount || 0, platformTotal);
  const estMinutes = useMemo(() => Math.round(totalShorts * 0.5), [totalShorts]); // avg 30s per short
  const progressRatio = useMemo(() => Math.min(totalShorts / (dailyLimit || 1), 1), [totalShorts, dailyLimit]);
  const progressPercent = useMemo(() => Math.round(progressRatio * 100), [progressRatio]);

  // Health pace categorization
  const isOverLimit = totalShorts >= dailyLimit;
  const isNearLimit = !isOverLimit && progressPercent >= 75;

  // 7-Day Stats (memoized)
  const dailyAverage = useMemo(() => {
    if (dayHistory.length === 0) return totalShorts;
    const total = dayHistory.reduce((acc, cur) => acc + cur.count, 0);
    return Math.round(total / dayHistory.length);
  }, [dayHistory, totalShorts]);

  const greeting = useMemo(() => getGreeting(), []);

  // Dynamic Mindful Streak (memoized)
  const mindfulStreak = useMemo(() => {
    let streak = 0;
    if (totalShorts <= dailyLimit) {
      streak += 1;
    }
    for (let i = dayHistory.length - 2; i >= 0; i--) {
      const item = dayHistory[i];
      if (item && item.count <= dailyLimit) {
        streak += 1;
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  }, [totalShorts, dailyLimit, dayHistory]);

  // Life Reclaimed Beyond Screen
  const typicalDailyDoomscrollMins = 90;
  const timeSavedMins = useMemo(() => Math.max(0, typicalDailyDoomscrollMins - estMinutes), [estMinutes]);
  const bookPagesEquivalent = useMemo(() => Math.max(1, Math.round(estMinutes * 0.75)), [estMinutes]);
  const walkingStepsEquivalent = useMemo(() => Math.max(50, Math.round(estMinutes * 95)), [estMinutes]);

  const shareMindfulProgress = useCallback(async () => {
    try {
      const text =
        `ReelCount Mindful Habit Summary:\n` +
        `${mindfulStreak}-Day Mindful Streak\n` +
        `${estMinutes}m watched today · ~${timeSavedMins}m saved beyond screen\n` +
        `Attention Mastery: ${zenXp} Zen XP\n` +
        `Take control of short-form doomscrolling with ReelCount!`;
      await Share.share({ message: text });
    } catch {}
  }, [mindfulStreak, estMinutes, timeSavedMins, zenXp]);

  const chronoShield = useMemo(() => getChronoAnalysis(), []);

  const milestones: { id: string; iconName: IconName; name: string; desc: string; unlocked: boolean }[] = useMemo(
    () => [
      {
        id: 'cap',
        iconName: 'target',
        name: 'Cap Champion',
        desc: 'Inside daily target',
        unlocked: totalShorts <= dailyLimit,
      },
      {
        id: 'zen',
        iconName: 'zen',
        name: 'Zen Master',
        desc: 'Used Craving Reset',
        unlocked: true,
      },
      {
        id: 'shield',
        iconName: 'shield',
        name: 'Focus Guardian',
        desc: 'Protected deep work',
        unlocked: focusTimerRunning || focusTimerSeconds < 15 * 60,
      },
      {
        id: 'streak',
        iconName: 'flame',
        name: `${mindfulStreak}d Streak`,
        desc: 'Consistent impulse control',
        unlocked: mindfulStreak >= 1,
      },
    ],
    [totalShorts, dailyLimit, focusTimerRunning, focusTimerSeconds, mindfulStreak],
  );

  const currentTheme = useMemo(
    () => THEME_COLORS[themeAccent] || THEME_COLORS.mint,
    [themeAccent],
  );

  useEffect(() => {
    try {
      StatusBar.setBarStyle('light-content', true);
      (StatusBar as any).setBackgroundColor?.(currentTheme.background, true);
    } catch {
      // Non-Android platforms ignore setBackgroundColor
    }
  }, [currentTheme.background]);

  // Zen Level & Attention Mastery
  const zenLevel = useMemo(() => getZenLevel(zenXp), [zenXp]);
  const xpInCurrentLevel = zenXp - zenLevel.min;
  const xpNeededForLevel = zenLevel.max - zenLevel.min;
  const xpPercent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));



  const handleStroopAnswer = (chosenColorName: string) => {
    const currentTrial = STROOP_TRIALS[stroopRound % STROOP_TRIALS.length];
    if (chosenColorName === currentTrial.colorName) {
      if (stroopRound >= 2) {
        setStroopFinished(true);
        setZenXp(prev => prev + 40);
        setDailyQuestsClaimed(prev => ({ ...prev, reset: true }));
      } else {
        setStroopRound(prev => prev + 1);
        setStroopFeedback('Correct! Prefrontal cortex taking over.');
      }
    } else {
      setStroopFeedback('Autopilot reflex detected! Focus on the INK COLOR.');
    }
  };

  const resetStroop = () => {
    setStroopRound(0);
    setStroopFeedback(null);
    setStroopFinished(false);
  };



  const selectedHourProfile = useMemo(
    () => getHourDopamineProfile(selectedDopamineHour),
    [selectedDopamineHour],
  );



  const handleLogTrigger = (t: TriggerType) => {
    setTriggersLog(prev => ({ ...prev, [t]: prev[t] + 1 }));
    setSelectedTrigger(t);
    PrototypeSettings.logTrigger(t).catch(() => {});
    PrototypeSettings.addZenXp(10).then(setZenXp).catch(() => {});
    Alert.alert(
      'Impulse Acknowledged (+10 XP)',
      TRIGGER_DATA[t].advice,
    );
  };


  // Digital Wellbeing Vitality Score (0-100) (memoized)
  const vitalityScore = useMemo(() => {
    let score = 100;
    if (totalShorts > dailyLimit) {
      const over = totalShorts - dailyLimit;
      score -= Math.min(45, over * 2);
    } else {
      const headroom = dailyLimit - totalShorts;
      score += Math.min(5, Math.floor(headroom / 10));
    }
    if (estMinutes > dailyTimeLimitMin) {
      score -= Math.min(30, (estMinutes - dailyTimeLimitMin) * 1.5);
    }
    score += Math.min(10, mindfulStreak * 2);
    if (bedtimeShield) {
      score += 5;
    }
    return Math.max(10, Math.min(100, Math.round(score)));
  }, [totalShorts, dailyLimit, estMinutes, dailyTimeLimitMin, mindfulStreak, bedtimeShield]);

  // Render Intro & Permissions Screen - Horizontal Multi-Slide Carousel (Memoized)
  const memoizedIntroScreen = useMemo(() => {
    if (!showIntro) return null;
    const isLastSlide = currentIntroSlide === 3;
    const slideWidth = windowWidth || 360;

    return (
      <View style={styles.introContainer}>
        {/* Top Header Bar */}
        <View style={styles.introTopBar}>
          <View style={styles.introBrandRow}>
            <View style={[styles.brandMascotWrap, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}>
              <Image
                source={require('./src/assets/images/app_mascot.jpg')}
                style={styles.introHeaderMascot}
                resizeMode="cover"
              />
            </View>
            <View>
              <Text style={styles.introBrandName}>ReelCount</Text>
              <Text style={[styles.introBrandMascotSub, { color: currentTheme.primary }]}>GUIDED BY POLLY</Text>
            </View>
          </View>

          {!isLastSlide ? (
            <Pressable
              onPress={() => goToIntroSlide(3)}
              style={[styles.introSkipPill, { borderColor: currentTheme.hairline }]}
            >
              <Text style={[styles.introSkipText, { color: currentTheme.primary }]}>Skip →</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleEnterDashboard}
              style={[styles.introSkipPill, { borderColor: currentTheme.hairline }]}
            >
              <Text style={[styles.introSkipText, { color: currentTheme.primary }]}>Dashboard →</Text>
            </Pressable>
          )}
        </View>

        {/* Top Story / Step Progress Indicators */}
        <View style={styles.introSegmentedRow}>
          {[
            { label: 'Intention', step: 0 },
            { label: 'Tactile HUD', step: 1 },
            { label: 'Sanctuary', step: 2 },
            { label: 'Activate', step: 3 },
          ].map(item => (
            <Pressable
              key={item.step}
              onPress={() => goToIntroSlide(item.step)}
              style={styles.introSegmentItem}
            >
              <View
                style={[
                  styles.introSegmentBar,
                  currentIntroSlide >= item.step
                    ? [styles.introSegmentBarActive, { backgroundColor: currentTheme.primary }]
                    : null,
                ]}
              />
              <Text
                style={[
                  styles.introSegmentLabel,
                  currentIntroSlide === item.step
                    ? [styles.introSegmentLabelActive, { color: currentTheme.primary }]
                    : styles.introSegmentLabelInactive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Horizontal Paging Carousel */}
        <ScrollView
          ref={introScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const page = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
            setCurrentIntroSlide(page);
          }}
          scrollEventThrottle={16}
          style={styles.introPager}
        >
          {/* SLIDE 1: AWARENESS & INTENTION */}
          <ScrollView
            style={{ width: slideWidth }}
            contentContainerStyle={styles.introSlideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCardWrap}>
              <Image
                source={require('./src/assets/images/intro_slide_focus.jpg')}
                style={styles.introHeroSlideImage}
                resizeMode="cover"
              />
              <View style={styles.introSlideBody}>
                <View style={styles.introEyebrowBadge}>
                  <Text style={[styles.introEyebrowText, { color: currentTheme.primary }]}>
                    STEP 1 OF 4 · MINDFUL INTENTION
                  </Text>
                </View>
                <Text style={styles.introSlideTitle}>Break the Doomscroll Loop</Text>
                <Text style={styles.introSlideSubtitle}>
                  Quietly observe short video scrolling across Instagram Reels, YouTube Shorts, and TikTok before hours slip away.
                </Text>

                {/* Meet Polly Hero Banner */}
                <View style={[styles.introMascotWelcomeHero, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}>
                  <Image
                    source={require('./src/assets/images/app_mascot.jpg')}
                    style={styles.introMascotHeroLarge}
                    resizeMode="cover"
                  />
                  <View style={styles.introMascotWelcomeTextWrap}>
                    <View style={[styles.introMascotBadgePill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                      <AppIcon name="sparkle" size={11} color={currentTheme.primary} />
                      <Text style={[styles.introMascotBadgeText, { color: currentTheme.primary }]}>YOUR MINDFUL GUIDE</Text>
                    </View>
                    <Text style={styles.introMascotWelcomeTitle}>Hi, I'm Polly!</Text>
                    <Text style={styles.introMascotWelcomeDesc}>
                      Short feeds are engineered to steal hours. I'm here to help you enjoy reels consciously without the dopamine drag!
                    </Text>
                  </View>
                </View>

                {/* Interactive Boundary Goal Selector */}
                <View style={styles.introInteractiveSection}>
                  <Text style={[styles.introSectionMiniTitle, { color: currentTheme.primary }]}>
                    CHOOSE YOUR DAILY MINDFUL BOUNDARY
                  </Text>
                  <View style={styles.introGoalRow}>
                    {[
                      { cap: 25, label: 'Strict Detox', sub: '~12m / day', iconName: 'bolt' as IconName },
                      { cap: 50, label: 'Balanced', sub: '~25m (Recommended)', iconName: 'leaf' as IconName },
                      { cap: 100, label: 'Gentle', sub: '~50m / day', iconName: 'target' as IconName },
                    ].map(preset => {
                      const isSelected = dailyLimit === preset.cap;
                      return (
                        <Pressable
                          key={preset.cap}
                          onPress={() => {
                            triggerDockHaptic();
                            setDailyLimit(preset.cap);
                            PrototypeSettings.setDailyLimits(preset.cap, dailyTimeLimitMin).catch(() => {});
                          }}
                          style={[
                            styles.introGoalOptionCard,
                            {
                              borderColor: isSelected ? currentTheme.primary : currentTheme.hairline,
                              backgroundColor: isSelected ? currentTheme.glow : currentTheme.surface,
                            },
                          ]}
                        >
                          <AppIcon name={preset.iconName} size={20} color={isSelected ? currentTheme.primary : currentTheme.subtext} style={{ marginBottom: 6 }} />
                          <Text style={[styles.introGoalOptionCap, isSelected && { color: currentTheme.primary }]}>
                            {preset.cap}
                          </Text>
                          <Text style={styles.introGoalOptionLabel}>{preset.label}</Text>
                          <Text style={styles.introGoalOptionSub}>{preset.sub}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Mascot Live Habit Advice */}
                <View style={[styles.introMascotCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                  <View style={styles.introMascotRow}>
                    <View style={[styles.introMascotAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                      <Image
                        source={require('./src/assets/images/app_mascot.jpg')}
                        style={styles.introMascotAvatar}
                        resizeMode="cover"
                      />
                      <View style={[styles.introMascotStatusDot, { backgroundColor: currentTheme.primary }]} />
                    </View>
                    <View style={styles.introMascotSpeechWrap}>
                      <View style={styles.introMascotHeaderRow}>
                        <Text style={[styles.introMascotName, { color: currentTheme.primary }]}>Polly's Habit Advice</Text>
                        <View style={[styles.introMascotPill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                          <Text style={[styles.introMascotPillText, { color: currentTheme.primary }]}>RECOMMENDED</Text>
                        </View>
                      </View>
                      <Text style={styles.introMascotSpeech}>
                        {dailyLimit === 25
                          ? 'Strict Detox selected! You will reclaim ~2 hours every single day for real-world life and creative focus.'
                          : dailyLimit === 50
                          ? 'Balanced 50-swipe boundary! The sweet spot: enjoy content during breaks without falling into autopilot scrolling.'
                          : 'Gentle 100-swipe cap! Keeps late-night rabbit holes from spiraling out of control while easing into habit change.'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.introChipRow}>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="reels" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Multi-App Tracking</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="zen" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Mindful Speedbump</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="trophy" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Zen XP Level</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* SLIDE 2: LIVE HUD & SIMULATOR */}
          <ScrollView
            style={{ width: slideWidth }}
            contentContainerStyle={styles.introSlideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCardWrap}>
              <Image
                source={require('./src/assets/images/intro_slide_hud.jpg')}
                style={styles.introHeroSlideImage}
                resizeMode="cover"
              />
              <View style={styles.introSlideBody}>
                <View style={styles.introEyebrowBadge}>
                  <Text style={[styles.introEyebrowText, { color: currentTheme.primary }]}>
                    STEP 2 OF 4 · TACTILE HUD
                  </Text>
                </View>
                <Text style={styles.introSlideTitle}>Live On-Screen Swipe HUD</Text>
                <Text style={styles.introSlideSubtitle}>
                  A discrete floating pill hovers over your screen with gentle haptic ticks on every video you swipe.
                </Text>

                {/* Interactive Floating HUD Simulator */}
                <View style={[styles.introHudSimulatorCard, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}>
                  <View style={styles.introHudSimHeader}>
                    <Text style={[styles.introHudSimTitle, { color: currentTheme.primary }]}>
                      Interactive Floating HUD Simulator
                    </Text>
                    <View style={[styles.introHudSimBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                      <Text style={[styles.introHudSimBadgeText, { color: currentTheme.primary }]}>LIVE PREVIEW</Text>
                    </View>
                  </View>

                  <View style={styles.introHudSimStage}>
                    <View style={[styles.introHudPreviewPill, { borderColor: currentTheme.border }]}>
                      <View style={[styles.introHudPillDot, { backgroundColor: currentTheme.primary }]} />
                      <Text style={styles.introHudPillText}>Reels HUD</Text>
                      <View style={[styles.introHudPillCounterBadge, { backgroundColor: currentTheme.glow }]}>
                        <Text style={[styles.introHudPillCounterVal, { color: currentTheme.primary }]}>
                          {`${introDemoHudCount} swipes`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      triggerDockHaptic();
                      setIntroDemoHudCount(c => c + 1);
                    }}
                    style={[styles.introSimulateSwipeBtn, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <AppIcon name="bolt" size={15} color={currentTheme.actionText} />
                      <Text style={[styles.introSimulateSwipeText, { color: currentTheme.actionText }]}>
                        Tap to Simulate Video Swipe (+1)
                      </Text>
                    </View>
                  </Pressable>
                  <Text style={styles.introSimulateHelpText}>
                    Discreetly floats on top of Instagram, TikTok, and YouTube with gentle haptic ticks.
                  </Text>
                </View>

                {/* Mascot Live Swipe Reaction Card */}
                <View style={[styles.introMascotCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                  <View style={styles.introMascotRow}>
                    <View style={[styles.introMascotAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                      <Image
                        source={require('./src/assets/images/app_mascot.jpg')}
                        style={styles.introMascotAvatar}
                        resizeMode="cover"
                      />
                      <View style={[styles.introMascotStatusDot, { backgroundColor: currentTheme.primary }]} />
                    </View>
                    <View style={styles.introMascotSpeechWrap}>
                      <View style={styles.introMascotHeaderRow}>
                        <Text style={[styles.introMascotName, { color: currentTheme.primary }]}>Polly · Tactile Coach</Text>
                        <View style={[styles.introMascotPill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                          <Text style={[styles.introMascotPillText, { color: currentTheme.primary }]}>
                            {introDemoHudCount > 2 ? 'ACTIVE PULSE' : 'TRY SWIPING'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.introMascotSpeech}>
                        {introDemoHudCount <= 2
                          ? 'Tap the button above to test me! Each swipe triggers a gentle haptic click to break autopilot mesmerization.'
                          : introDemoHudCount <= 5
                          ? `Swipe #${introDemoHudCount} counted! Feel that gentle pulse? It wakes up your prefrontal cortex before mindless scrolling takes over.`
                          : `${introDemoHudCount} swipes simulated! You can drag this floating pill anywhere on screen inside real video apps.`}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.introChipRow}>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="dashboard" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Draggable Anywhere</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="flame" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Haptic Tick</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="bolt" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Loop Nudge</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* SLIDE 3: BEDTIME & FOCUS SAFEGUARDS */}
          <ScrollView
            style={{ width: slideWidth }}
            contentContainerStyle={styles.introSlideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCardWrap}>
              <Image
                source={require('./src/assets/images/intro_slide_shield.jpg')}
                style={styles.introHeroSlideImage}
                resizeMode="cover"
              />
              <View style={styles.introSlideBody}>
                <View style={styles.introEyebrowBadge}>
                  <Text style={[styles.introEyebrowText, { color: currentTheme.primary }]}>
                    STEP 3 OF 4 · PROTECTION
                  </Text>
                </View>
                <Text style={styles.introSlideTitle}>Night Shield & Focus Lock</Text>
                <Text style={styles.introSlideSubtitle}>
                  Automatic 11 PM bedtime lockdown and 1-tap focus shields keep distraction feeds strictly closed.
                </Text>

                {/* Interactive Shield Defenses */}
                <View style={styles.introShieldsBox}>
                  <Pressable
                    onPress={() => {
                      triggerDockHaptic();
                      setBedtimeShield(prev => !prev);
                    }}
                    style={[
                      styles.introShieldRow,
                      {
                        borderColor: bedtimeShield ? currentTheme.border : currentTheme.hairline,
                        backgroundColor: currentTheme.surface,
                      },
                    ]}
                  >
                    <View style={styles.introShieldCol}>
                      <View style={styles.introShieldTitleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppIcon name="moon" size={16} color={currentTheme.primary} />
                          <Text style={styles.introShieldTitle}>11 PM Sleep Sanctuary</Text>
                        </View>
                        <View
                          style={[
                            styles.introShieldActiveTag,
                            bedtimeShield
                              ? [styles.introShieldTagActive, { backgroundColor: currentTheme.glow }]
                              : styles.introShieldTagIdle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.introShieldActiveTagText,
                              bedtimeShield
                                ? [styles.introShieldTagTextActive, { color: currentTheme.primary }]
                                : styles.introShieldTagTextIdle,
                            ]}
                          >
                            {bedtimeShield ? 'ENABLED' : 'OFF'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.introShieldDesc}>
                        Auto-shield late night feeds so midnight scrolling doesn't steal sleep.
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      triggerDockHaptic();
                      setSpeedbumpEnabled(prev => !prev);
                    }}
                    style={[
                      styles.introShieldRow,
                      styles.introShieldRowSpaced,
                      {
                        borderColor: speedbumpEnabled ? currentTheme.border : currentTheme.hairline,
                        backgroundColor: currentTheme.surface,
                      },
                    ]}
                  >
                    <View style={styles.introShieldCol}>
                      <View style={styles.introShieldTitleRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppIcon name="zen" size={16} color={currentTheme.primary} />
                          <Text style={styles.introShieldTitle}>Mindful Speedbump</Text>
                        </View>
                        <View
                          style={[
                            styles.introShieldActiveTag,
                            speedbumpEnabled
                              ? [styles.introShieldTagActive, { backgroundColor: currentTheme.glow }]
                              : styles.introShieldTagIdle,
                          ]}
                        >
                          <Text
                            style={[
                              styles.introShieldActiveTagText,
                              speedbumpEnabled
                                ? [styles.introShieldTagTextActive, { color: currentTheme.primary }]
                                : styles.introShieldTagTextIdle,
                            ]}
                          >
                            {speedbumpEnabled ? 'ENABLED' : 'OFF'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.introShieldDesc}>
                        Subtle 5-second breath pause every 15 short videos to break unconscious loops.
                      </Text>
                    </View>
                  </Pressable>
                </View>

                {/* Mascot Circadian Wisdom Card */}
                <View style={[styles.introMascotCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                  <View style={styles.introMascotRow}>
                    <View style={[styles.introMascotAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                      <Image
                        source={require('./src/assets/images/app_mascot.jpg')}
                        style={styles.introMascotAvatar}
                        resizeMode="cover"
                      />
                      <View style={[styles.introMascotStatusDot, { backgroundColor: currentTheme.primary }]} />
                    </View>
                    <View style={styles.introMascotSpeechWrap}>
                      <View style={styles.introMascotHeaderRow}>
                        <Text style={[styles.introMascotName, { color: currentTheme.primary }]}>Polly · Circadian Wisdom</Text>
                        <View style={[styles.introMascotPill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                          <Text style={[styles.introMascotPillText, { color: currentTheme.primary }]}>DEEP REST</Text>
                        </View>
                      </View>
                      <Text style={styles.introMascotSpeech}>
                        {bedtimeShield && speedbumpEnabled
                          ? 'Both shields armed! Bedtime lockdown defends melatonin after 11 PM, and speedbumps give 5s breath breaks.'
                          : bedtimeShield
                          ? 'Sleep Sanctuary armed! Late night doomscrolling will be locked at 11 PM so you get deep REM sleep.'
                          : speedbumpEnabled
                          ? 'Speedbump active! You get a gentle 5-second breath pause every 15 videos to choose consciously.'
                          : 'Tip: Late-night phone blue light delays REM sleep by up to 90 minutes. Turn on Sleep Sanctuary for sound sleep!'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.introChipRow}>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="moon" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>11 PM Sleep Sanctuary</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="shield" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Strict App Exit</Text>
                  </View>
                  <View style={[styles.introFeatureChip, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                    <AppIcon name="lock" size={14} color={currentTheme.primary} />
                    <Text style={styles.introChipText}>Quick Settings Tile</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* SLIDE 4: PRIVACY & PERMISSIONS */}
          <ScrollView
            style={{ width: slideWidth }}
            contentContainerStyle={styles.introSlideContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introCardWrap}>
              <Image
                source={require('./src/assets/images/intro_slide_privacy.jpg')}
                style={styles.introHeroSlideImage}
                resizeMode="cover"
              />
              <View style={styles.introSlideBody}>
                <View style={styles.introEyebrowBadge}>
                  <Text style={[styles.introEyebrowText, { color: currentTheme.primary }]}>
                    STEP 4 OF 4 · 100% PRIVATE
                  </Text>
                </View>
                <Text style={styles.introSlideTitle}>Zero Cloud. 100% Local</Text>
                <Text style={styles.introSlideSubtitle}>
                  Zero network transmission. No screen content, chats, passwords, or personal data are ever read.
                </Text>

                {/* Mascot Setup Guidance Card */}
                <View style={[styles.introMascotCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                  <View style={styles.introMascotRow}>
                    <View style={[styles.introMascotAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                      <Image
                        source={require('./src/assets/images/app_mascot.jpg')}
                        style={styles.introMascotAvatar}
                        resizeMode="cover"
                      />
                      <View style={[styles.introMascotStatusDot, { backgroundColor: prototypeStatus.serviceConnected ? '#38d39f' : currentTheme.primary }]} />
                    </View>
                    <View style={styles.introMascotSpeechWrap}>
                      <View style={styles.introMascotHeaderRow}>
                        <Text style={[styles.introMascotName, { color: currentTheme.primary }]}>Polly's Setup Checklist</Text>
                        <View style={[styles.introMascotPill, { backgroundColor: prototypeStatus.serviceConnected ? 'rgba(56, 211, 159, 0.15)' : currentTheme.glow, borderColor: currentTheme.hairline }]}>
                          <Text style={[styles.introMascotPillText, { color: prototypeStatus.serviceConnected ? '#38d39f' : currentTheme.primary }]}>
                            {prototypeStatus.serviceConnected ? 'ALL CHECKS GREEN' : '100% PRIVATE'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.introMascotSpeech}>
                        {prototypeStatus.serviceConnected
                          ? 'My checklist is complete! On-device tracking is live, private, and running smoothly. Welcome to your Sanctuary!'
                          : 'I run 100% on your device with zero internet permissions. Just follow the 3 quick steps on my checklist below!'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3-Step Visual Setup Guide */}
                <View style={[styles.introSetupGuideCard, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
                  <Text style={[styles.introSetupGuideHeader, { color: currentTheme.primary }]}>
                    3-STEP ANDROID SETUP (TAKES 5 SECONDS)
                  </Text>

                  <View style={styles.introSetupStepItem}>
                    <View style={[styles.introSetupStepNum, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                      <Text style={[styles.introSetupStepNumText, { color: currentTheme.primary }]}>1</Text>
                    </View>
                    <Text style={styles.introSetupStepText}>
                      Check consent below and tap Continue to Settings
                    </Text>
                  </View>

                  <View style={styles.introSetupStepItem}>
                    <View style={[styles.introSetupStepNum, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                      <Text style={[styles.introSetupStepNumText, { color: currentTheme.primary }]}>2</Text>
                    </View>
                    <Text style={styles.introSetupStepText}>
                      Look for Downloaded apps (or Installed services)
                    </Text>
                  </View>

                  <View style={styles.introSetupStepItem}>
                    <View style={[styles.introSetupStepNum, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                      <Text style={[styles.introSetupStepNumText, { color: currentTheme.primary }]}>3</Text>
                    </View>
                    <Text style={styles.introSetupStepText}>
                      Select ReelCount Tracker and toggle switch ON
                    </Text>
                  </View>
                </View>

                {/* Celebratory Live Badge if connected */}
                {prototypeStatus.serviceConnected && (
                  <View style={[styles.introCelebrationCard, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                    <Image
                      source={require('./src/assets/images/app_mascot.jpg')}
                      style={styles.introCelebrationMascot}
                      resizeMode="cover"
                    />
                    <View style={styles.introCelebrationCol}>
                      <Text style={[styles.introCelebrationTitle, { color: currentTheme.primary }]}>
                        Polly is Calibrated & Live Active!
                      </Text>
                      <Text style={styles.introCelebrationSub}>
                        ReelCount is quietly protecting your attention 100% on-device.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Service Status Badge */}
                <View style={styles.statusSection} accessibilityLiveRegion="polite">
                  <View
                    style={[
                      styles.statusBadge,
                      prototypeStatus.serviceConnected
                        ? [styles.statusBadgeActive, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]
                        : styles.statusBadgeInactive,
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppIcon name={prototypeStatus.serviceConnected ? 'check' : 'alert'} size={14} color={prototypeStatus.serviceConnected ? currentTheme.primary : '#a0a0a0'} />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          prototypeStatus.serviceConnected
                            ? [styles.statusBadgeTextActive, { color: currentTheme.primary }]
                            : styles.statusBadgeTextInactive,
                        ]}
                      >
                        {prototypeStatus.serviceConnected
                          ? 'Accessibility Service Connected'
                          : 'Service Not Enabled'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.body}>
                    Session scroll events detected: {prototypeStatus.candidateCount}
                  </Text>
                </View>

                {/* Consent Checkbox */}
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: consentGiven }}
                  onPress={() => setConsentGiven(value => !value)}
                  style={styles.consentRow}
                >
                  <View
                    style={[
                      styles.checkbox,
                      consentGiven && [styles.checkboxChecked, { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }],
                    ]}
                  >
                    {consentGiven ? <AppIcon name="check" size={12} color="#000000" /> : null}
                  </View>
                  <Text style={styles.consentText}>
                    I understand ReelCount operates 100% locally on-device and choose to continue to Android accessibility settings.
                  </Text>
                </Pressable>

                {/* Primary Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !consentGiven }}
                  disabled={!consentGiven}
                  onPress={continueToSettings}
                  style={[
                    styles.button,
                    consentGiven
                      ? [styles.buttonConsentActive, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]
                      : styles.buttonConsentDisabled,
                    !consentGiven && styles.buttonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      consentGiven
                        ? [styles.buttonTextConsentActive, { color: currentTheme.actionText }]
                        : styles.buttonTextConsentDisabled,
                    ]}
                  >
                    {prototypeStatus.serviceConnected
                      ? 'Manage Accessibility Settings'
                      : 'Continue to Accessibility Settings'}
                  </Text>
                </Pressable>

                {settingsError ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    Android accessibility settings could not be opened. Please enable manually in Android Settings.
                  </Text>
                ) : null}

                {/* Dashboard button */}
                <Pressable
                  onPress={handleEnterDashboard}
                  style={[styles.enterDashboardButton, { borderColor: currentTheme.hairline }]}
                >
                  <Text style={[styles.enterDashboardButtonText, { color: currentTheme.primary }]}>
                    {prototypeStatus.serviceConnected ? 'Enter Sanctuary Dashboard →' : 'Skip to Dashboard →'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </ScrollView>

        {/* Bottom Carousel Controls (Dots + Navigation) */}
        <View style={[styles.introBottomControls, { borderTopColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}>
          {/* Back button or placeholder */}
          <View style={styles.introNavSide}>
            {currentIntroSlide > 0 ? (
              <Pressable onPress={() => goToIntroSlide(currentIntroSlide - 1)} style={styles.introBackButton}>
                <Text style={styles.introBackText}>← Back</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Pagination Dots */}
          <View style={styles.introPaginationRow}>
            {[0, 1, 2, 3].map(idx => (
              <Pressable
                key={idx}
                onPress={() => goToIntroSlide(idx)}
                style={[
                  styles.introPaginationDot,
                  currentIntroSlide === idx
                    ? [styles.introPaginationDotActive, { backgroundColor: currentTheme.primary, width: 22 }]
                    : styles.introPaginationDotInactive,
                ]}
              />
            ))}
          </View>

          {/* Next / Done button */}
          <View style={styles.introNavSide}>
            {!isLastSlide ? (
              <Pressable
                onPress={() => goToIntroSlide(currentIntroSlide + 1)}
                style={[styles.introNextButton, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
              >
                <Text style={[styles.introNextButtonText, { color: currentTheme.actionText }]}>Next →</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleEnterDashboard}
                style={[styles.introNextButton, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
              >
                <Text style={[styles.introNextButtonText, { color: currentTheme.actionText }]}>Done</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }, [
    showIntro,
    currentIntroSlide,
    introDemoHudCount,
    bedtimeShield,
    speedbumpEnabled,
    consentGiven,
    settingsError,
    prototypeStatus.serviceConnected,
    prototypeStatus.candidateCount,
    currentTheme,
    windowWidth,
    continueToSettings,
    dailyLimit,
    dailyTimeLimitMin,
    goToIntroSlide,
  ]);
  const renderIntroScreen = () => memoizedIntroScreen;

  // Render Dashboard / Counter Tab (Clean, Minimal, Focused on Daily Essentials - Memoized)
  const memoizedCounterTab = useMemo(() => {
    if (activeTab !== 'counter') return null;

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
      {/* Top App Header with Adaptive Greeting & Live Service Status */}
      <View style={styles.dashboardHeader}>
        <View>
          <View style={styles.brandRow}>
            <View style={[styles.brandBadgeWrap, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}>
              <AppIcon name="reels" size={18} color={currentTheme.primary} />
            </View>
            <Text style={styles.appHeaderTitle}>ReelCount</Text>
          </View>
          <Text style={styles.greetingText}>
            {greeting.text} · <Text style={[styles.greetingTip, { color: currentTheme.primary }]}>{greeting.tip}</Text>
          </Text>
        </View>
        <View style={styles.dashboardHeaderActions}>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              const nextStyle: HudStyle =
                hudStyle === 'pill' ? 'dot' : hudStyle === 'dot' ? 'warning_only' : 'pill';
              setHudStyle(nextStyle);
              PrototypeSettings.setHudStyle(nextStyle).catch(() => {});
            }}
            style={[
              styles.dashboardHudPill,
              styles.dashboardHudPillActive,
              { borderColor: currentTheme.border, backgroundColor: currentTheme.glow },
            ]}
          >
            <AppIcon name="reels" size={12} color={currentTheme.primary} />
            <Text style={[styles.dashboardHudPillText, { color: currentTheme.primary }]}>
              {hudStyle === 'pill' ? 'HUD: Pill' : hudStyle === 'dot' ? 'HUD: Compact' : 'HUD: Stealth'}
            </Text>
          </Pressable>

          <View
            style={[
              styles.servicePill,
              prototypeStatus.serviceConnected
                ? [styles.servicePillActive, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]
                : styles.servicePillInactive,
            ]}
          >
            <View
              style={[
                styles.serviceDot,
                prototypeStatus.serviceConnected ? [styles.serviceDotActive, { backgroundColor: currentTheme.primary }] : styles.serviceDotInactive,
              ]}
            />
            <Text
              style={[
                styles.servicePillText,
                prototypeStatus.serviceConnected
                  ? [styles.servicePillTextActive, { color: currentTheme.primary }]
                  : styles.servicePillTextInactive,
              ]}
            >
              {prototypeStatus.serviceConnected ? 'Live Active' : 'Off'}
            </Text>
          </View>
        </View>
      </View>

      {/* Daily Compass & Zen XP Banner */}
      <View style={[styles.dashboardCompassStrip, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.dashboardCompassLeft}>
          <AppIcon name="compass" size={20} color={currentTheme.primary} style={{ marginRight: 8 }} />
          <View style={styles.dashboardCompassContent}>
            <Text style={[styles.dashboardCompassEyebrow, { color: currentTheme.primary }]}>DAILY COMPASS</Text>
            <Text style={styles.dashboardCompassTitle} numberOfLines={1}>"{selectedIntention}"</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            triggerDockHaptic();
            setActiveTab('settings');
          }}
          style={[styles.dashboardZenBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}
        >
          <Text style={[styles.dashboardZenBadgeText, { color: currentTheme.primary }]}>
            Lvl {zenLevel.level} · {zenXp} XP
          </Text>
        </Pressable>
      </View>

      {/* Focus Mode Live Banner if running */}
      {focusTimerRunning && (
        <Pressable onPress={() => setActiveTab('block')} style={[styles.activeFocusBanner, { borderColor: currentTheme.border }]}>
          <AppIcon name="shield" size={20} color={currentTheme.primary} />
          <View style={styles.activeFocusBannerCol}>
            <Text style={[styles.activeFocusBannerTitle, { color: currentTheme.primary }]}>Shield Mode Engaged</Text>
            <Text style={styles.activeFocusBannerSubtitle}>
              {formatTimer(focusTimerSeconds)} remaining · Distraction feeds locked
            </Text>
          </View>
          <Text style={[styles.activeFocusBannerAction, { color: currentTheme.primary }]}>View →</Text>
        </Pressable>
      )}

      {/* Hero Counter Card */}
      <View style={[styles.heroCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }, isOverLimit && styles.heroCardOverLimit]}>
        <View style={styles.heroTopRow}>
          <View
            style={[
              styles.habitPill,
              isOverLimit
                ? styles.habitPillDanger
                : isNearLimit
                ? styles.habitPillWarning
                : [styles.habitPillSafe, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }],
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <AppIcon
                name={isOverLimit ? 'bell' : isNearLimit ? 'bolt' : 'leaf'}
                size={13}
                color={isOverLimit ? '#f87171' : isNearLimit ? '#fbbf24' : currentTheme.primary}
              />
              <Text
                style={[
                  styles.habitPillText,
                  isOverLimit
                    ? styles.habitPillTextDanger
                    : isNearLimit
                    ? styles.habitPillTextWarning
                    : [styles.habitPillTextSafe, { color: currentTheme.primary }],
                ]}
              >
                {isOverLimit ? 'LIMIT BREACHED' : isNearLimit ? 'APPROACHING LIMIT' : 'MINDFUL PACE'}
              </Text>
            </View>
          </View>

          <View style={styles.heroTopActions}>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                openCravingModal('breathing');
              }}
              style={[styles.zenPauseButton, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <AppIcon name="zen" size={13} color={currentTheme.primary} />
                <Text style={[styles.zenPauseButtonText, { color: currentTheme.primary }]}>1m Reset</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                handleResetCounters();
              }}
              style={[styles.resetButton, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        {/* Circular / Concentric Visual Ring Center */}
        <View style={styles.circularMetricContainer}>
          <Animated.View
            style={[
              styles.circularRingHalo,
              {
                borderColor: currentTheme.border,
                backgroundColor: currentTheme.glow,
                transform: [{ scale: haloScale }],
                opacity: haloOpacity,
              },
            ]}
          >
            <View style={[styles.circularRingInner, { borderColor: currentTheme.border }]}>
              <Text style={[styles.heroCount, isOverLimit ? styles.heroCountOverLimit : { color: currentTheme.primary }]}>
                {totalShorts}
              </Text>
              <Text style={styles.heroUnitLabel}>videos today</Text>
              <Text style={styles.heroGoalSubtext}>of {dailyLimit} target</Text>
            </View>
          </Animated.View>
        </View>

        {/* Quick Stepper for Daily Boundary */}
        <View style={styles.heroTargetStepperRow}>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              const nextLimit = Math.max(10, dailyLimit - 5);
              setDailyLimit(nextLimit);
              PrototypeSettings.setDailyLimits(nextLimit, dailyTimeLimitMin).catch(() => {});
            }}
            style={[styles.heroStepperBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
          >
            <Text style={[styles.heroStepperBtnText, { color: currentTheme.primary }]}>- 5</Text>
          </Pressable>

          <View style={[styles.heroTargetPill, { borderColor: currentTheme.hairline }]}>
            <Text style={styles.heroTargetPillLabel}>
              Boundary: <Text style={[styles.heroTargetPillVal, { color: currentTheme.primary }]}>{dailyLimit} reels</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => {
              triggerDockHaptic();
              const nextLimit = dailyLimit + 5;
              setDailyLimit(nextLimit);
              PrototypeSettings.setDailyLimits(nextLimit, dailyTimeLimitMin).catch(() => {});
            }}
            style={[styles.heroStepperBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
          >
            <Text style={[styles.heroStepperBtnText, { color: currentTheme.primary }]}>+ 5</Text>
          </Pressable>
        </View>

        {/* Dynamic Dopamine Risk Gauge */}
        <View style={styles.riskGaugeContainer}>
          <View style={styles.riskGaugeHeader}>
            <Text style={styles.riskGaugeLabel}>DOPAMINE ATTRACTION</Text>
            <Text
              style={[
                styles.riskGaugeStatusText,
                isOverLimit
                  ? styles.textDanger
                  : isNearLimit
                  ? styles.textWarning
                  : { color: currentTheme.primary },
              ]}
            >
              {isOverLimit
                ? 'High Risk (Take a Walk)'
                : isNearLimit
                ? 'Elevated Friction'
                : 'Balanced & Mindful'}
            </Text>
          </View>
          <View style={styles.riskTrack}>
            <View
              style={[
                styles.riskFill,
                { width: `${Math.max(4, Math.min(100, progressPercent))}%` },
                isOverLimit
                  ? styles.progressBarDanger
                  : isNearLimit
                  ? styles.progressBarWarning
                  : { backgroundColor: currentTheme.primary },
              ]}
            />
          </View>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressPercentText}>{progressPercent}% consumed</Text>
            <Text style={styles.progressRemainingText}>
              {isOverLimit
                ? `${totalShorts - dailyLimit} over target`
                : `${dailyLimit - totalShorts} remaining`}
            </Text>
          </View>
        </View>

        {/* Dynamic Mindful Insight Card */}
        <View style={[styles.heroMindfulInsightBanner, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
          <AppIcon
            name={isOverLimit ? 'shield' : isNearLimit ? 'bolt' : 'leaf'}
            size={18}
            color={isOverLimit ? '#f87171' : isNearLimit ? '#fbbf24' : currentTheme.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.heroMindfulInsightText, { color: currentTheme.primary }]}>
            {isOverLimit
              ? `Target exceeded by ${totalShorts - dailyLimit} videos. Rest your prefrontal cortex.`
              : isNearLimit
              ? `Approaching daily boundary (${dailyLimit - totalShorts} left). Ready for a 1m mindful reset?`
              : `Pacing mindfully! You've reclaimed ~${timeSavedMins}m of real-world cognitive energy today.`}
          </Text>
        </View>

        {/* 4-Stat Quick Grid inside Hero Card */}
        <View style={styles.heroStatsGrid}>
          <View style={styles.heroStatItem}>
            <AppIcon name="timer" size={18} color={currentTheme.primary} />
            <Text style={styles.heroStatValue}>~{estMinutes}m</Text>
            <Text style={styles.heroStatLabel}>Screen Time</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <AppIcon name="target" size={18} color={currentTheme.primary} />
            <Text style={styles.heroStatValue}>{dailyLimit}</Text>
            <Text style={styles.heroStatLabel}>Daily Cap</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <AppIcon name="flame" size={18} color={currentTheme.primary} />
            <Text style={styles.heroStatValue}>{mindfulStreak} {mindfulStreak === 1 ? 'Day' : 'Days'}</Text>
            <Text style={styles.heroStatLabel}>Mindful Streak</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <AppIcon name="chart" size={18} color={currentTheme.primary} />
            <Text style={styles.heroStatValue}>{dailyAverage}</Text>
            <Text style={styles.heroStatLabel}>7d Average</Text>
          </View>
        </View>

        {/* Quick Action Button */}
        {!focusTimerRunning && (
          <Pressable
            onPress={handleQuickFocus15m}
            style={[styles.quickFocusActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.actionFill }]}
          >
            <AppIcon name="bolt" size={16} color={currentTheme.primary} />
            <Text style={[styles.quickFocusActionText, { color: currentTheme.actionText }]}>Start Quick 15m Focus Shield</Text>
          </Pressable>
        )}
      </View>

      {/* POLLY'S MORNING ALIGNMENT CARD LAUNCHER */}
      <View style={[styles.morningLauncherCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.morningLauncherRow}>
          <View style={[styles.morningAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
            <Image
              source={require('./src/assets/images/app_mascot.jpg')}
              style={styles.morningAvatarThumb}
              resizeMode="cover"
            />
          </View>
          <View style={styles.morningLauncherCol}>
            <View style={styles.morningLauncherEyebrowRow}>
              <Text style={[styles.morningLauncherEyebrow, { color: currentTheme.primary }]}>POLLY'S MORNING ALIGNMENT</Text>
              <View style={[styles.morningLauncherBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                <Text style={[styles.morningLauncherBadgeText, { color: currentTheme.primary }]}>DAILY CARD</Text>
              </View>
            </View>
            <Text style={styles.morningLauncherTitle}>
              Yesterday you reclaimed {morningReclaimedMins} minutes beyond feeds.
            </Text>
            <Text style={styles.morningLauncherSubtitle}>
              Let's keep your morning screen-free and set today's intention.
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            triggerDockHaptic();
            setShowMorningAlignment(true);
          }}
          style={[styles.morningLauncherActionBtn, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AppIcon name="sun" size={14} color={currentTheme.actionText} />
            <Text style={[styles.morningLauncherActionText, { color: currentTheme.actionText }]}>
              View 5-Second Morning Alignment Card →
            </Text>
          </View>
        </Pressable>
      </View>

      {/* POLLY ON THE FLOATING HUD: ADAPTIVE EXPRESSIONS SHOWCASE */}
      <View style={[styles.mascotHudCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="reels" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Polly on the Floating HUD</Text>
          </View>
          <View style={[styles.mascotExpressionBadge, {
            backgroundColor: simulatedHudSwipes < 25 ? 'rgba(110, 227, 173, 0.15)' : simulatedHudSwipes < 50 ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 113, 133, 0.15)',
            borderColor: simulatedHudSwipes < 25 ? '#6EE3AD' : simulatedHudSwipes < 50 ? '#FBBF24' : '#FB7185',
          }]}>
            <Text style={[styles.mascotExpressionBadgeText, {
              color: simulatedHudSwipes < 25 ? '#6EE3AD' : simulatedHudSwipes < 50 ? '#FBBF24' : '#FB7185',
            }]}>
              {simulatedHudSwipes < 25 ? 'CALM (0-25)' : simulatedHudSwipes < 50 ? 'ATTENTIVE (25-50)' : 'REST NEEDED (50+)'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Instead of just a raw number, Polly's mini face hovers over video feeds and adapts her expression to your swipe depth:
        </Text>

        {/* Live Adaptive HUD Stage */}
        <View style={styles.mascotHudStage}>
          {(() => {
            const moodColor = simulatedHudSwipes < 25 ? '#6EE3AD' : simulatedHudSwipes < 50 ? '#FBBF24' : '#FB7185';
            const moodLabel = simulatedHudSwipes < 25 ? 'Zen Guide' : simulatedHudSwipes < 50 ? 'Focus Mode' : 'Rest Alert';
            return (
              <View style={[styles.mascotHudPreviewPill, { borderColor: moodColor }]}>
                {/* Circular Mascot Avatar with Mood Ring */}
                <View style={[styles.mascotHudAvatarRing, { borderColor: moodColor }]}>
                  <Image
                    source={require('./src/assets/images/app_mascot.jpg')}
                    style={styles.mascotHudAvatarImg}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.mascotHudPillTextCol}>
                  <Text style={styles.mascotHudPillTitle}>{moodLabel}:</Text>
                  <Text style={[styles.mascotHudPillCount, { color: moodColor }]}>
                    {simulatedHudSwipes} swipes
                  </Text>
                </View>
              </View>
            );
          })()}
        </View>

        {/* Dynamic Expression Coaching Text */}
        <View style={[styles.mascotCoachingCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
          <Text style={styles.mascotCoachingDesc}>
            {simulatedHudSwipes < 25
              ? '• 0–25 Swipes: Calm, cheerful, headphones on. Polly keeps a tranquil presence while pacing is mindful.'
              : simulatedHudSwipes < 50
              ? '• 25–50 Swipes: Attentive, pointing to checklist. Polly perks up to gently signal you are approaching your threshold.'
              : '• 50+ Swipes: Sleepy/concerned, holding up a gentle hand. Polly urges a breath pause to protect your cognitive stamina.'}
          </Text>
        </View>

        {/* Interactive State Selector */}
        <View style={styles.mascotStateBtnRow}>
          {[
            { swipes: 14, label: '14 Swipes (Calm)' },
            { swipes: 38, label: '38 Swipes (Attentive)' },
            { swipes: 62, label: '62 Swipes (Rest)' },
          ].map(opt => (
            <Pressable
              key={opt.swipes}
              onPress={() => {
                triggerDockHaptic();
                setSimulatedHudSwipes(opt.swipes);
              }}
              style={[
                styles.mascotStateBtn,
                { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised },
                simulatedHudSwipes === opt.swipes && [
                  styles.mascotStateBtnActive,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <Text
                style={[
                  styles.mascotStateBtnText,
                  simulatedHudSwipes === opt.swipes && [styles.mascotStateBtnTextActive, { color: currentTheme.primary }],
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* POLLY ANDROID HOME SCREEN WIDGET SHOWCASE */}
      <View style={[styles.widgetShowcaseCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="dashboard" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Polly Home Screen Widget</Text>
          </View>
          <View style={[styles.activeThemeBadgePill, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}>
            <Text style={[styles.activeThemeBadgeText, { color: currentTheme.primary }]}>ANDROID NATIVE</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Set mindful intention before launching any app. Live count, remaining allowance, and a 1-tap Focus Sprint directly on your desktop.
        </Text>

        {/* Native Widget Preview Box */}
        <View style={[styles.widgetBoxPreview, { borderColor: currentTheme.border }]}>
          <View style={styles.widgetBoxHeader}>
            <View style={styles.widgetMascotHeaderRow}>
              <View style={[styles.widgetAvatarWrap, { borderColor: currentTheme.primary }]}>
                <Image
                  source={require('./src/assets/images/app_mascot.jpg')}
                  style={styles.widgetAvatarImg}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.widgetTitleCol}>
                <Text style={[styles.widgetBoxTitle, { color: currentTheme.primary }]}>POLLY · MINDFUL REELS</Text>
                <Text style={styles.widgetBoxMood}>
                  {focusModeActive ? 'Focus Shield Active' : totalShorts < 25 ? 'Zen & Calm Guide' : totalShorts < 50 ? 'Attentive Focus' : 'Mindful Rest Needed'}
                </Text>
              </View>
            </View>
            <View style={[styles.widgetAllowanceBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
              <Text style={[styles.widgetAllowanceText, { color: currentTheme.primary }]}>
                {Math.max(0, dailyLimit - totalShorts)} left
              </Text>
            </View>
          </View>

          <View style={styles.widgetCounterRow}>
            <Text style={styles.widgetBigCount}>{totalShorts}</Text>
            <Text style={styles.widgetLimitLabel}> / {dailyLimit} shorts today</Text>
          </View>

          {/* 1-Tap 15m Focus Sprint Button */}
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleQuickFocus15m();
            }}
            style={[styles.widgetSprintBtn, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AppIcon name="bolt" size={14} color={currentTheme.actionText} />
              <Text style={[styles.widgetSprintBtnText, { color: currentTheme.actionText }]}>
                {focusModeActive ? 'Focus Shield Active (Tap to Stop)' : '1-Tap 15m Focus Sprint'}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.widgetInstructionsText}>
          How to add: Long-press your phone's Home Screen → tap Widgets → select Polly → place on your screen.
        </Text>
      </View>

      {/* App-by-App Breakdown */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Platform Breakdown</Text>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>{totalShorts} Total</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Distribution of scrolls across monitored video feeds today.
        </Text>

        {[
          { id: 'instagram', name: 'Instagram Reels', count: igCount, unit: 'reels', iconName: 'camera' as IconName, pkg: TARGET_PACKAGES.INSTAGRAM, circleStyle: styles.igCircle, fillStyle: styles.igFill },
          { id: 'tiktok', name: 'TikTok', count: ttCount, unit: 'videos', iconName: 'music' as IconName, pkg: TARGET_PACKAGES.TIKTOK, circleStyle: styles.ttCircle, fillStyle: styles.ttFill },
          { id: 'youtube', name: 'YouTube Shorts', count: ytCount, unit: 'shorts', iconName: 'play' as IconName, pkg: TARGET_PACKAGES.YOUTUBE, circleStyle: styles.ytCircle, fillStyle: styles.ytFill },
          { id: 'snapchat', name: 'Snapchat Spotlight', count: scCount, unit: 'clips', iconName: 'ghost' as IconName, pkg: TARGET_PACKAGES.SNAPCHAT, circleStyle: styles.scCircle, fillStyle: styles.scFill },
        ].map(platform => {
          const isExpanded = expandedPlatform === platform.id;
          const sharePercent = totalShorts > 0 ? Math.round((platform.count / totalShorts) * 100) : 0;
          const timeEst = Math.round(platform.count * 0.5);

          return (
            <Pressable
              key={platform.id}
              onPress={() => {
                triggerDockHaptic();
                setExpandedPlatform(prev => (prev === platform.id ? null : platform.id));
              }}
              style={[
                styles.platformCard,
                { backgroundColor: currentTheme.surface, borderColor: isExpanded ? currentTheme.border : currentTheme.hairline },
              ]}
            >
              <View style={styles.platformCardTopRow}>
                <View style={[styles.platformIconCircle, platform.circleStyle]}>
                  <AppIcon name={platform.iconName} size={18} color="#ffffff" />
                </View>
                <View style={styles.platformDetailsCol}>
                  <View style={styles.platformTitleRow}>
                    <Text style={styles.platformName}>{platform.name}</Text>
                    <Text style={[styles.platformCountText, isExpanded && { color: currentTheme.primary }]}>
                      {platform.count} {platform.unit}
                    </Text>
                  </View>
                  <View style={[styles.platformTrack, { backgroundColor: currentTheme.hairline }]}>
                    <View
                      style={[
                        styles.platformFill,
                        platform.fillStyle,
                        { width: `${totalShorts > 0 ? (platform.count / totalShorts) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.platformMetaRow}>
                    <Text style={styles.platformTimeEstimate}>~{timeEst} mins spent</Text>
                    <Text style={styles.platformShareText}>{sharePercent}% of scrolls</Text>
                  </View>
                </View>
              </View>

              {/* Expandable Quick Action Bar & Per-App Quota Controls */}
              {isExpanded && (
                <View style={[styles.platformExpandedSection, { borderTopColor: currentTheme.hairline }]}>
                  <View style={styles.platformQuotaAdjustRow}>
                    <Text style={styles.platformQuotaAdjustLabel}>App Quota:</Text>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        const cur = platformLimits[platform.id] || 25;
                        const nextLimit = Math.max(5, cur - 5);
                        setPlatformLimits(prev => ({ ...prev, [platform.id]: nextLimit }));
                        PrototypeSettings.setPackageLimit(platform.pkg, nextLimit).catch(() => {});
                      }}
                      style={[styles.platformQuotaStepBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
                    >
                      <Text style={[styles.platformQuotaStepBtnText, { color: currentTheme.primary }]}>- 5</Text>
                    </Pressable>
                    <View style={[styles.platformQuotaBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                      <Text style={[styles.platformQuotaBadgeText, { color: currentTheme.primary }]}>
                        {platformLimits[platform.id] || 25} {platform.unit}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        const cur = platformLimits[platform.id] || 25;
                        const nextLimit = cur + 5;
                        setPlatformLimits(prev => ({ ...prev, [platform.id]: nextLimit }));
                        PrototypeSettings.setPackageLimit(platform.pkg, nextLimit).catch(() => {});
                      }}
                      style={[styles.platformQuotaStepBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
                    >
                      <Text style={[styles.platformQuotaStepBtnText, { color: currentTheme.primary }]}>+ 5</Text>
                    </Pressable>
                  </View>

                  <View style={styles.platformActionPillRow}>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        setActiveTab('block');
                      }}
                      style={[styles.platformMicroActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
                    >
                      <AppIcon name="shield" size={13} color={currentTheme.primary} />
                      <Text style={[styles.platformMicroActionText, { color: currentTheme.primary }]}>Lock in Shield</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        setActiveTab('timers');
                      }}
                      style={[styles.platformMicroActionBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface }]}
                    >
                      <AppIcon name="timer" size={13} color={currentTheme.primary} />
                      <Text style={[styles.platformMicroActionText, { color: currentTheme.primary }]}>All Limits</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* 7-Day Activity History Bar Chart */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.chartHeaderRow}>
          <View>
            <Text style={styles.cardSectionTitle}>Weekly Rhythm</Text>
            <Text style={styles.chartSubtitle}>
              Tap any column to inspect daily habits
            </Text>
          </View>
          <View style={[styles.chartAvgBadge, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.glow }]}>
            <Text style={[styles.chartAvgBadgeText, { color: currentTheme.primary }]}>Avg: {dailyAverage}/day</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {(() => {
            const maxHistoryCount = Math.max(1, ...dayHistory.map(d => d.count), dailyLimit);
            return dayHistory.length > 0
              ? dayHistory.map((item, idx) => {
                  const heightRatio = Math.min(item.count / maxHistoryCount, 1);
                  const isToday = item.label === 'Today' || idx === dayHistory.length - 1;
                  const exceeded = item.count >= dailyLimit;
                  const isSelected = selectedHistoryIndex === idx;

                  return (
                    <Pressable
                      key={item.date || idx}
                      onPress={() => {
                        triggerDockHaptic();
                        setSelectedHistoryIndex(idx === selectedHistoryIndex ? null : idx);
                      }}
                      style={styles.barCol}
                    >
                      <Text
                        style={[
                          styles.barCountText,
                          isSelected && [styles.barCountTextSelected, { color: currentTheme.primary }],
                        ]}
                      >
                        {item.count > 0 ? item.count : '-'}
                      </Text>
                      <View
                        style={[
                          styles.barTrack,
                          { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline },
                          isSelected && [styles.barTrackSelected, { borderColor: currentTheme.primary }],
                        ]}
                      >
                        <View
                          style={[
                            styles.barFill,
                            exceeded
                              ? styles.barFillLimit
                              : { backgroundColor: isToday ? currentTheme.primary : currentTheme.border },
                            { height: `${Math.max(8, Math.round(heightRatio * 100))}%` },
                          ]}
                        />
                      </View>
                      <Text
                        style={[
                          styles.barLabel,
                          isToday && [styles.barLabelToday, { color: currentTheme.primary }],
                          isSelected && [styles.barLabelSelected, { color: currentTheme.primary }],
                        ]}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })
              : ['M', 'T', 'W', 'T', 'F', 'S', 'Today'].map((label, idx) => (
                  <View key={idx} style={styles.barCol}>
                    <Text style={styles.barCountText}>-</Text>
                    <View style={[styles.barTrack, { backgroundColor: currentTheme.surface }]}>
                      <View style={[styles.barFill, styles.barPlaceholderFill, { backgroundColor: currentTheme.hairline }]} />
                    </View>
                    <Text style={[styles.barLabel, idx === 6 && [styles.barLabelToday, { color: currentTheme.primary }]]}>{label}</Text>
                  </View>
                ));
          })()}
        </View>

        {/* Selected Day Insight Card */}
        {selectedHistoryIndex !== null && dayHistory[selectedHistoryIndex] && (
          <View style={[styles.dayInsightCard, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AppIcon name="calendar" size={14} color={currentTheme.primary} />
              <Text style={[styles.dayInsightTitle, { color: currentTheme.primary }]}>
                {dayHistory[selectedHistoryIndex].label} ({dayHistory[selectedHistoryIndex].date})
              </Text>
            </View>
            <Text style={styles.dayInsightBody}>
              Scrolled <Text style={[styles.highlightText, { color: currentTheme.primary }]}>{dayHistory[selectedHistoryIndex].count} shorts</Text> (≈ {Math.round(dayHistory[selectedHistoryIndex].count * 0.5)} mins).{' '}
              {dayHistory[selectedHistoryIndex].count <= dailyLimit
                ? 'Kept inside your healthy target!'
                : `Exceeded target by ${dayHistory[selectedHistoryIndex].count - dailyLimit} videos.`}
            </Text>
          </View>
        )}

        {/* Weekly Trend Summary */}
        <View style={[styles.weeklyRhythmSummaryRow, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
          <AppIcon name={mindfulStreak > 1 ? 'flame' : 'leaf'} size={24} color={currentTheme.primary} style={{ marginRight: 8 }} />
          <View style={styles.weeklySummaryCol}>
            <Text style={[styles.weeklySummaryTitle, { color: currentTheme.primary }]}>
              {mindfulStreak > 1 ? `${mindfulStreak}-Day Mindful Streak` : 'Fresh Weekly Rhythm'}
            </Text>
            <Text style={styles.weeklySummarySubtitle}>
              {dayHistory.length > 0
                ? `${dayHistory.reduce((acc, d) => acc + d.count, 0)} total videos across 7 days · average ~${dailyAverage} per day`
                : 'Tracking your daily mindful rhythm across video feeds'}
            </Text>
          </View>
        </View>
      </View>

      {/* Dock Quick Shortcuts Row */}
      <View style={styles.dashboardShortcutsRow}>
        <Pressable onPress={() => setActiveTab('block')} style={[styles.dashboardShortcutCard, { borderColor: currentTheme.hairline }]}>
          <AppIcon name="shield" size={16} color={currentTheme.primary} />
          <Text style={styles.dashboardShortcutTitle}>Focus & Craving SOS →</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTab('timers')} style={[styles.dashboardShortcutCard, { borderColor: currentTheme.hairline }]}>
          <AppIcon name="timer" size={16} color={currentTheme.primary} />
          <Text style={styles.dashboardShortcutTitle}>Limits & Insights →</Text>
        </Pressable>
      </View>
    </ScrollView>
    );
  }, [
    activeTab,
    prototypeStatus,
    dailyLimit,
    dailyTimeLimitMin,
    greeting.text,
    greeting.tip,
    handleQuickFocus15m,
    hudStyle,
    focusTimerRunning,
    focusTimerSeconds,
    selectedIntention,
    zenLevel,
    zenXp,
    totalShorts,
    isOverLimit,
    isNearLimit,
    estMinutes,
    progressPercent,
    igCount,
    ttCount,
    ytCount,
    scCount,
    expandedPlatform,
    dayHistory,
    selectedHistoryIndex,
    dailyAverage,
    mindfulStreak,
    timeSavedMins,
    currentTheme,
    platformLimits,
    haloScale,
    haloOpacity,
    simulatedHudSwipes,
    morningReclaimedMins,
    focusModeActive,
  ]);
  const renderCounterTab = () => memoizedCounterTab;

  // Render Timers & Limits Tab (Memoized)
  const memoizedTimersTab = useMemo(() => {
    if (activeTab !== 'timers') return null;

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
      <Text style={styles.tabScreenTitle}>Limits & Insights</Text>
      <Text style={styles.tabScreenSubtitle}>
        Set deliberate habit boundaries and observe your circadian attention rhythm.
      </Text>

      {/* Daily Scroll Limit */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Daily Shorts Target</Text>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>{dailyLimit} Reels / Day</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Choose how many short videos you consider a reasonable daily maximum.
        </Text>

        <View style={styles.pillRow}>
          {[25, 50, 75, 100, 150].map(limit => (
            <Pressable
              key={limit}
              onPress={() => {
                triggerDockHaptic();
                handleSelectDailyLimit(limit);
              }}
              style={[
                styles.pillButton,
                dailyLimit === limit && [
                  styles.pillButtonSelected,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <Text
                style={[
                  styles.pillButtonText,
                  dailyLimit === limit && [
                    styles.pillButtonTextSelected,
                    { color: currentTheme.primary },
                  ],
                ]}
              >
                {limit}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stepper for custom values */}
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleAdjustLimit(-5);
            }}
            style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
          >
            <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>- 5</Text>
          </Pressable>
          <Text style={styles.stepperLabel}>Fine-tune: {dailyLimit} reels</Text>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleAdjustLimit(5);
            }}
            style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
          >
            <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>+ 5</Text>
          </Pressable>
        </View>
      </View>

      {/* Daily Time Limit */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Daily Time Cap</Text>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>{dailyTimeLimitMin} Minutes</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Target cap for cumulative screen time across short video feeds.
        </Text>

        <View style={styles.pillRow}>
          {[15, 30, 45, 60, 90].map(mins => (
            <Pressable
              key={mins}
              onPress={() => {
                triggerDockHaptic();
                handleSelectDailyTimeLimit(mins);
              }}
              style={[
                styles.pillButton,
                dailyTimeLimitMin === mins && [
                  styles.pillButtonSelected,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <Text
                style={[
                  styles.pillButtonText,
                  dailyTimeLimitMin === mins && [
                    styles.pillButtonTextSelected,
                    { color: currentTheme.primary },
                  ],
                ]}
              >
                {mins}m
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stepper for custom minutes */}
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleAdjustTimeLimit(-5);
            }}
            style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
          >
            <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>- 5m</Text>
          </Pressable>
          <Text style={styles.stepperLabel}>Fine-tune: {dailyTimeLimitMin} mins</Text>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleAdjustTimeLimit(5);
            }}
            style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
          >
            <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>+ 5m</Text>
          </Pressable>
        </View>
      </View>

      {/* 24-Hour Dopamine Matrix & Attention Clock */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.clockHeaderRow}>
          <View>
            <Text style={[styles.cardSectionEyebrow, { color: currentTheme.primary }]}>CIRCADIAN DOPAMINE MATRIX</Text>
            <Text style={styles.cardSectionTitle}>24-Hour Attention Clock</Text>
          </View>
          <View style={styles.liveNowPill}>
            <View style={[styles.liveNowDot, { backgroundColor: currentTheme.primary }]} />
            <Text style={styles.liveNowText}>Hour {new Date().getHours()}:00</Text>
          </View>
        </View>

        {/* 24-Hour Scrollable Hourly Bar Dial */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hourlyBarRow} nestedScrollEnabled={true} overScrollMode="never">
          {HOURLY_DOPAMINE_PROFILES.map((prof, h) => {
            const isSelected = selectedDopamineHour === h;
            const isCurrent = new Date().getHours() === h;

            return (
              <Pressable
                key={h}
                onPress={() => {
                  triggerDockHaptic();
                  setSelectedDopamineHour(h);
                }}
                style={[
                  styles.hourlyBarItem,
                  { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                  isSelected && [styles.hourlyBarItemSelected, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }],
                  isCurrent && [styles.hourlyBarItemCurrent, { borderColor: currentTheme.primary }],
                ]}
              >
                <Text style={[styles.hourlyBarHourText, isSelected && [styles.hourlyBarTextActive, { color: currentTheme.primary }]]}>
                  {h.toString().padStart(2, '0')}
                </Text>
                <View style={[styles.hourlyBarIndicator, { backgroundColor: prof.color }]} />
                <AppIcon name={prof.iconName} size={14} color={prof.color} style={{ marginTop: 2 }} />
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Selected Hour Insight Card */}
        <View style={[styles.hourInsightBox, { backgroundColor: currentTheme.surfaceRaised, borderColor: selectedHourProfile.color }]}>
          <View style={styles.hourInsightHeader}>
            <AppIcon name={selectedHourProfile.iconName} size={24} color={selectedHourProfile.color} style={{ marginRight: 10 }} />
            <View style={styles.hourInsightTitleCol}>
              <Text style={styles.hourInsightTimeRange}>
                {selectedDopamineHour.toString().padStart(2, '0')}:00 –{' '}
                {((selectedDopamineHour + 1) % 24).toString().padStart(2, '0')}:00
              </Text>
              <Text style={[styles.hourInsightRisk, { color: selectedHourProfile.color }]}>
                {selectedHourProfile.risk}
              </Text>
            </View>
          </View>
          <Text style={styles.hourInsightPeriodTitle}>{selectedHourProfile.period}</Text>
          <Text style={styles.hourInsightTip}>{selectedHourProfile.tip}</Text>
        </View>
      </View>

      {/* Impulse & Trigger Awareness Journal */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.triggerHeaderRow}>
          <View>
            <Text style={[styles.cardSectionEyebrow, { color: currentTheme.primary }]}>SELF-AWARENESS TRACKER</Text>
            <Text style={styles.cardSectionTitle}>Why did you reach for feeds?</Text>
          </View>
          <Text style={[styles.triggerXpHint, { color: currentTheme.primary }]}>+10 XP / log</Text>
        </View>
        <Text style={styles.triggerSubText}>
          Logging the emotion behind the impulse disarms unconscious muscle memory.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.triggerPillsRow} nestedScrollEnabled={true} overScrollMode="never">
          {(Object.keys(TRIGGER_DATA) as TriggerType[]).map(t => {
            const data = TRIGGER_DATA[t];
            const isSelected = selectedTrigger === t;
            const count = triggersLog[t] || 0;

            return (
              <Pressable
                key={t}
                onPress={() => {
                  triggerDockHaptic();
                  handleLogTrigger(t);
                }}
                style={[
                  styles.triggerPill,
                  { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                  isSelected && [styles.triggerPillSelected, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }],
                ]}
              >
                <AppIcon name={data.iconName} size={16} color={isSelected ? currentTheme.primary : currentTheme.subtext} />
                <Text style={[styles.triggerPillLabel, isSelected && [styles.triggerPillLabelSelected, { color: currentTheme.primary }]]}>
                  {data.label}
                </Text>
                <View style={[styles.triggerCountBadge, isSelected && { backgroundColor: currentTheme.primary }]}>
                  <Text style={[styles.triggerCountBadgeText, isSelected && { color: currentTheme.background }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Dynamic Behavioral Hack for Selected Trigger */}
        <View style={[styles.triggerAdviceCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <AppIcon name={TRIGGER_DATA[selectedTrigger].iconName} size={14} color={currentTheme.primary} />
            <Text style={[styles.triggerAdviceEyebrow, { color: currentTheme.primary }]}>
              NEURO-REPLACEMENT PROTOCOL
            </Text>
          </View>
          <Text style={styles.triggerAdviceBody}>{TRIGGER_DATA[selectedTrigger].advice}</Text>
        </View>
      </View>

      {/* Life Reclaimed Beyond Screen Card */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="leaf" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Life Beyond Feeds</Text>
          </View>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>~{timeSavedMins}m Saved</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Real-world experiences reclaimed compared to typical 90m doomscrolling.
        </Text>
        <View style={styles.lifeReclaimedGrid}>
          <View style={[styles.lifeReclaimedCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <AppIcon name="timer" size={24} color={currentTheme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.lifeReclaimedValue, { color: currentTheme.primary }]}>~{timeSavedMins}m</Text>
            <Text style={styles.lifeReclaimedLabel}>Time Reclaimed</Text>
          </View>
          <View style={[styles.lifeReclaimedCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <AppIcon name="book" size={24} color={currentTheme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.lifeReclaimedValue, { color: currentTheme.primary }]}>{bookPagesEquivalent} pgs</Text>
            <Text style={styles.lifeReclaimedLabel}>Book Reading Equiv</Text>
          </View>
          <View style={[styles.lifeReclaimedCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <AppIcon name="walk" size={24} color={currentTheme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.lifeReclaimedValue, { color: currentTheme.primary }]}>{walkingStepsEquivalent}</Text>
            <Text style={styles.lifeReclaimedLabel}>Physical Steps Equiv</Text>
          </View>
          <View style={[styles.lifeReclaimedCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <AppIcon name="brain" size={24} color={currentTheme.primary} style={{ marginBottom: 4 }} />
            <Text style={[styles.lifeReclaimedValue, { color: currentTheme.primary }]}>Grounded</Text>
            <Text style={styles.lifeReclaimedLabel}>Dopamine State</Text>
          </View>
        </View>
      </View>

      {/* Bedtime Wind-Down Shield */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="moon" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Bedtime Sleep Shield</Text>
          </View>
          <View style={[styles.statusBadgeSmall, bedtimeShield ? styles.badgeBlocked : styles.badgeNormal]}>
            <Text style={[styles.statusBadgeSmallText, bedtimeShield ? styles.textBlocked : styles.textNormal]}>
              {bedtimeShield ? 'SCHEDULED (11 PM)' : 'OFF'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => {
            const next = !bedtimeShield;
            setBedtimeShield(next);
            PrototypeSettings.setBedtimeShield(next, 23, 6).catch(() => {});
            Alert.alert(
              next ? 'Bedtime Shield Active' : 'Bedtime Shield Disabled',
              next
                ? 'Distracting feeds will be strictly blocked between 11:00 PM and 6:00 AM.'
                : 'Nighttime automatic lock has been turned off.',
            );
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-Lock Between 11 PM - 6 AM</Text>
            <Text style={styles.toggleSubtitle}>
              Protects nighttime rest and eliminates late-night doomscrolling before sleep.
            </Text>
          </View>
          <View style={[styles.switchTrack, bedtimeShield && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}>
            <View style={[styles.switchThumb, bedtimeShield && styles.switchThumbOn]} />
          </View>
        </Pressable>
      </View>

      {/* Smart Alerts */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <Text style={styles.cardSectionTitle}>Smart Scrolling Alerts</Text>

        <Pressable
          onPress={() => {
            const next = !speedbumpEnabled;
            setSpeedbumpEnabled(next);
            PrototypeSettings.setSpeedbumpEnabled(next).catch(() => {});
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Mindful Speedbump Pause</Text>
            <Text style={styles.toggleSubtitle}>
              Prompts a 3-second breathing countdown before entering video feeds to break unconscious reflexes.
            </Text>
          </View>
          <View
            style={[styles.switchTrack, speedbumpEnabled && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[
                styles.switchThumb,
                speedbumpEnabled && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            const next = !breakReminder;
            setBreakReminder(next);
            PrototypeSettings.setBreakReminder(next).catch(() => {});
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Daily Target Push Notification</Text>
            <Text style={styles.toggleSubtitle}>
              Sends an alert when your count hits {dailyLimit} shorts.
            </Text>
          </View>
          <View
            style={[styles.switchTrack, breakReminder && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[styles.switchThumb, breakReminder && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            const next = !doomscrollAlert;
            setDoomscrollAlert(next);
            PrototypeSettings.setDoomscrollAlert(next).catch(() => {});
          }}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Doomscroll Loop Alert & Haptic</Text>
            <Text style={styles.toggleSubtitle}>
              Vibrates & alerts after 15 consecutive shorts to break compulsive scrolling.
            </Text>
          </View>
          <View
            style={[styles.switchTrack, doomscrollAlert && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[
                styles.switchThumb,
                doomscrollAlert && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setWeeklyRecapAlert(prev => !prev)}
          style={styles.toggleRow}
        >
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Weekly Mindful Habit Recap</Text>
            <Text style={styles.toggleSubtitle}>
              Sunday evening summary comparing your weekly scrolls against your streak.
            </Text>
          </View>
          <View
            style={[styles.switchTrack, weeklyRecapAlert && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[
                styles.switchThumb,
                weeklyRecapAlert && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>
      </View>
    </ScrollView>
    );
  }, [
    activeTab,
    dailyLimit,
    dailyTimeLimitMin,
    selectedDopamineHour,
    selectedHourProfile,
    triggersLog,
    selectedTrigger,
    doomscrollAlert,
    breakReminder,
    bedtimeShield,
    speedbumpEnabled,
    weeklyRecapAlert,
    currentTheme,
    bookPagesEquivalent,
    handleAdjustLimit,
    handleAdjustTimeLimit,
    handleSelectDailyLimit,
    handleSelectDailyTimeLimit,
    timeSavedMins,
    walkingStepsEquivalent,
  ]);
  const renderTimersTab = () => memoizedTimersTab;

  // Render Block App & Focus Tab (Memoized)
  const memoizedBlockTab = useMemo(() => {
    if (activeTab !== 'block') return null;

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
      <Text style={styles.tabScreenTitle}>Block & Focus Shield</Text>
      <Text style={styles.tabScreenSubtitle}>
        Instantly lock distracting video feeds when you need deep focus or rest.
      </Text>

      {/* Focus Session Card */}
      <View
        style={[
          styles.focusHeroCard,
          { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline },
          focusTimerRunning && styles.focusHeroCardActive,
        ]}
      >
        <View style={styles.focusHeaderRow}>
          <Text style={[styles.focusHeroTitle, { color: currentTheme.primary }]}>DEEP WORK FOCUS SHIELD</Text>
          <View style={[styles.focusLiveBadge, focusTimerRunning ? styles.focusLiveBadgeActive : styles.focusLiveBadgeIdle, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <AppIcon
              name={focusTimerRunning ? 'shield' : 'timer'}
              size={11}
              color={focusTimerRunning ? '#38d39f' : currentTheme.subtext}
            />
            <Text style={[styles.focusLiveBadgeText, focusTimerRunning ? styles.focusLiveBadgeTextActive : styles.focusLiveBadgeTextIdle]}>
              {focusTimerRunning ? 'SHIELD ACTIVE' : 'IDLE'}
            </Text>
          </View>
        </View>

        <Text style={styles.focusTimerText}>{formatTimer(focusTimerSeconds)}</Text>
        <Text style={styles.focusHeroSubtitle}>
          {focusTimerRunning
            ? 'Distracting video feeds are actively locked. Opening them will instantly kick back to Home.'
            : 'Select session duration and start to block selected feeds.'}
        </Text>

        {/* Preset Duration Buttons */}
        {!focusTimerRunning && (
          <View style={styles.presetRow}>
            {[15, 25, 45, 60].map(mins => (
              <Pressable
                key={mins}
                onPress={() => {
                  triggerDockHaptic();
                  handleSelectFocusPreset(mins);
                }}
                style={[
                  styles.presetBtn,
                  focusTimerSeconds === mins * 60 && [
                    styles.presetBtnActive,
                    { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary },
                  ],
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  {mins === 25 && (
                    <AppIcon
                      name="timer"
                      size={11}
                      color={focusTimerSeconds === mins * 60 ? currentTheme.background : currentTheme.subtext}
                    />
                  )}
                  <Text
                    style={[
                      styles.presetBtnText,
                      focusTimerSeconds === mins * 60 && [
                        styles.presetBtnTextActive,
                        { color: currentTheme.background },
                      ],
                    ]}
                  >
                    {mins}m
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Stepper to customize timer while paused */}
        {!focusTimerRunning && (
          <View style={styles.stepperRow}>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                handleAdjustFocusTimer(-5);
              }}
              style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
            >
              <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>- 5m</Text>
            </Pressable>
            <Text style={styles.stepperLabel}>Duration: {Math.round(focusTimerSeconds / 60)} min</Text>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                handleAdjustFocusTimer(5);
              }}
              style={[styles.stepperBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.surface }]}
            >
              <Text style={[styles.stepperBtnText, { color: currentTheme.primary }]}>+ 5m</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.focusButtonsRow}>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              handleToggleFocusSession();
            }}
            style={[
              styles.focusActionButton,
              focusTimerRunning
                ? styles.focusStopButton
                : [styles.focusStartButton, { backgroundColor: currentTheme.primary }],
            ]}
          >
            <Text
              style={[
                styles.focusActionButtonText,
                !focusTimerRunning && { color: currentTheme.background },
              ]}
            >
              {focusTimerRunning ? 'Stop Focus Shield' : 'Start Focus Shield'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerDockHaptic();
              setFocusTimerRunning(false);
              setFocusModeActive(false);
              setFocusTimerSeconds(15 * 60);
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
            }}
            style={[styles.focusResetButton, { borderColor: currentTheme.border }]}
          >
            <Text style={styles.focusResetButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Focus Soundscape Companion */}
      <View style={[styles.focusSoundscapeBar, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.focusSoundscapeLeft}>
          <AppIcon name="wave" size={16} color={currentTheme.primary} />
          <Text style={[styles.focusSoundscapeTitle, { color: currentTheme.primary }]}>
            {soundscapePlaying ? `Ambient: ${soundscapesList.find(s => s.id === soundscape)?.name}` : 'Procedural Soundscape'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            triggerDockHaptic();
            toggleSoundscapeAudio();
          }}
          style={[
            styles.focusSoundscapeBtn,
            soundscapePlaying
              ? [styles.focusSoundscapeBtnActive, { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }]
              : [styles.focusSoundscapeBtnIdle, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }],
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AppIcon
              name={soundscapePlaying ? 'pause' : 'play'}
              size={13}
              color={soundscapePlaying ? currentTheme.background : currentTheme.primary}
            />
            <Text
              style={[
                styles.focusSoundscapeBtnText,
                { color: soundscapePlaying ? currentTheme.background : currentTheme.primary },
              ]}
            >
              {soundscapePlaying ? 'Stop Audio' : 'Play Noise'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Craving SOS / Urge Surfer Action Banner */}
      <View style={[styles.cravingSosBanner, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.cravingSosHeaderRow}>
          <View style={[styles.cravingSosBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <AppIcon name="bolt" size={11} color={currentTheme.primary} />
            <Text style={[styles.cravingSosBadgeText, { color: currentTheme.primary }]}>CRAVING SOS</Text>
          </View>
          <Text style={[styles.cravingSosWaveTag, { color: currentTheme.subtext }]}>Impulse Interrupter</Text>
        </View>
        <Text style={styles.cravingSosTitle}>Feeling the urge to swipe?</Text>
        <Text style={styles.cravingSosDesc}>
          Urges peak in 90 seconds. Interrupt the reflex loop with breathwork, wave delay, or sensory grounding.
        </Text>
        <View style={styles.cravingSosBtnRow}>
          <Pressable
            onPress={() => openCravingModal('delay')}
            style={[styles.cravingSosPrimaryBtn, { backgroundColor: currentTheme.primary }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <AppIcon name="wave" size={13} color={currentTheme.background} />
              <Text style={[styles.cravingSosPrimaryBtnText, { color: currentTheme.background }]}>90s Wave Surfer</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => openCravingModal('breathing')}
            style={[styles.cravingSosSecondaryBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <AppIcon name="zen" size={13} color={currentTheme.primary} />
              <Text style={[styles.cravingSosSecondaryBtnText, { color: currentTheme.primary }]}>4-4-4 Box Breath</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => openCravingModal('grounding')}
            style={[styles.cravingSosSecondaryBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surfaceRaised }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
              <AppIcon name="leaf" size={13} color={currentTheme.primary} />
              <Text style={[styles.cravingSosSecondaryBtnText, { color: currentTheme.primary }]}>Grounding</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Mindful Intercept Gate - Neural Circuit Breaker */}
      <View style={[styles.interceptCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.interceptTopRow}>
          <AppIcon name="brain" size={28} color={currentTheme.primary} />
          <View style={styles.interceptTitleCol}>
            <Text style={[styles.interceptEyebrow, { color: currentTheme.primary }]}>NEURAL CIRCUIT BREAKER</Text>
            <Text style={styles.interceptTitle}>Mindful Intercept Gate</Text>
          </View>
        </View>
        <Text style={styles.interceptDesc}>
          Compulsive scrolling is driven by autonomic basal-ganglia reflex. Engaging prefrontal color-word conflict breaks the dopamine urge.
        </Text>
        <Pressable
          onPress={() => {
            resetStroop();
            openCravingModal('stroop');
          }}
          style={[styles.interceptActionBtn, { backgroundColor: currentTheme.actionFill, borderColor: currentTheme.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AppIcon name="bolt" size={14} color={currentTheme.actionText} />
            <Text style={[styles.interceptActionBtnText, { color: currentTheme.actionText }]}>Challenge Urge with Stroop Test (+40 XP) →</Text>
          </View>
        </Pressable>
      </View>

      {/* IN-FEED NEURO-INTERVENTIONS (BREAK THE TRANCE IN REAL-TIME) */}
      <View style={[styles.neuroCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.neuroHeaderRow}>
          <View style={[styles.neuroIconHalo, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
            <AppIcon name="brain" size={20} color={currentTheme.primary} />
          </View>
          <View style={styles.neuroTitleCol}>
            <Text style={[styles.neuroEyebrow, { color: currentTheme.primary }]}>REAL-TIME TRANCE BREAKERS</Text>
            <Text style={styles.neuroTitle}>In-Feed Neuro-Interventions</Text>
          </View>
        </View>
        <Text style={styles.neuroDesc}>
          Break hypnotic dopamine loops at the neurological level before mindless scrolling takes over.
        </Text>

        {/* 1. Grayscale Feed Filter on Overuse */}
        <View style={[styles.neuroItemCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
          <View style={styles.neuroItemTopRow}>
            <View style={styles.neuroItemTitleRow}>
              <AppIcon name="filter" size={17} color={currentTheme.primary} />
              <Text style={styles.neuroItemTitle}>Grayscale Feed Filter</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                const nextVal = !grayscaleFilterEnabled;
                setGrayscaleFilterEnabled(nextVal);
                PrototypeSettings.setGrayscaleFilter(nextVal, grayscaleTriggerMode).catch(() => {});
              }}
              style={[styles.switchTrack, grayscaleFilterEnabled && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
            >
              <View style={[styles.switchThumb, grayscaleFilterEnabled && styles.switchThumbOn]} />
            </Pressable>
          </View>
          <Text style={styles.neuroItemDesc}>
            Algorithms rely on ultra-saturated visual stimuli to trigger dopamine. Stripping color instantly cuts the hypnotic trance without needing an aggressive hard block.
          </Text>
          <View style={styles.neuroModeRow}>
            {[
              { id: 'overuse' as const, label: '80% Cap' },
              { id: 'bedtime' as const, label: 'Night Time' },
              { id: 'both' as const, label: 'Both (Recommended)' },
            ].map(m => (
              <Pressable
                key={m.id}
                onPress={() => {
                  triggerDockHaptic();
                  setGrayscaleTriggerMode(m.id);
                  PrototypeSettings.setGrayscaleFilter(grayscaleFilterEnabled, m.id).catch(() => {});
                }}
                style={[
                  styles.neuroModeChip,
                  { borderColor: currentTheme.hairline, backgroundColor: currentTheme.surface },
                  grayscaleTriggerMode === m.id && [
                    styles.neuroModeChipActive,
                    { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.neuroModeText,
                    grayscaleTriggerMode === m.id && [styles.neuroModeTextActive, { color: currentTheme.primary }],
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              Alert.alert(
                'Grayscale Filter Activated',
                'Simulating monochrome mode: Feed color desaturated to break hyper-saturated dopamine triggers.',
              );
            }}
            style={[styles.neuroActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
          >
            <Text style={[styles.neuroActionBtnText, { color: currentTheme.primary }]}>
              Preview Monochrome Filter Effect
            </Text>
          </Pressable>
        </View>

        {/* 2. Rapid "Fidget Swipe" Detector */}
        <View style={[styles.neuroItemCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
          <View style={styles.neuroItemTopRow}>
            <View style={styles.neuroItemTitleRow}>
              <AppIcon name="bolt" size={17} color={currentTheme.primary} />
              <Text style={styles.neuroItemTitle}>Rapid Fidget Swipe Detector</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                const nextVal = !fidgetSwipeEnabled;
                setFidgetSwipeEnabled(nextVal);
                PrototypeSettings.setFidgetSwipeDetector(nextVal).catch(() => {});
              }}
              style={[styles.switchTrack, fidgetSwipeEnabled && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
            >
              <View style={[styles.switchThumb, fidgetSwipeEnabled && styles.switchThumbOn]} />
            </Pressable>
          </View>
          <Text style={styles.neuroItemDesc}>
            If you swipe 4–5 reels in under 15 seconds without watching, you are in autonomic panic-swiping mode. Polly delivers a distinct double-buzz: "You're speed-swiping without watching. Take a 3-breath pause."
          </Text>
          <View style={styles.neuroStatRow}>
            <View style={[styles.neuroStatBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
              <Text style={[styles.neuroStatBadgeText, { color: currentTheme.primary }]}>
                {fidgetSwipeCount} SPEED-SWIPES INTERRUPTED TODAY
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              setFidgetSwipeCount(c => c + 1);
              Alert.alert(
                'Polly: Double-Buzz Triggered',
                "You're speed-swiping without watching. Take a 3-breath pause.",
              );
            }}
            style={[styles.neuroActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
          >
            <Text style={[styles.neuroActionBtnText, { color: currentTheme.primary }]}>
              Simulate Fidget Swipes (Test Double-Buzz)
            </Text>
          </Pressable>
        </View>

        {/* 3. "One Last Reel" Conscious Exit Contract */}
        <View style={[styles.neuroItemCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
          <View style={styles.neuroItemTopRow}>
            <View style={styles.neuroItemTitleRow}>
              <AppIcon name="shield" size={17} color={currentTheme.primary} />
              <Text style={styles.neuroItemTitle}>"One Last Reel" Conscious Exit</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                const nextVal = !consciousExitEnabled;
                setConsciousExitEnabled(nextVal);
                PrototypeSettings.setConsciousExitEnabled(nextVal).catch(() => {});
              }}
              style={[styles.switchTrack, consciousExitEnabled && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
            >
              <View style={[styles.switchThumb, consciousExitEnabled && styles.switchThumbOn]} />
            </Pressable>
          </View>
          <Text style={styles.neuroItemDesc}>
            Abrupt blocking creates user frustration and leads people to disable accessibility services. When hitting the cap, offer a 60-second wind-down: "Finish this video mindfully, then place your phone face down."
          </Text>
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              setShowConsciousExitModal(true);
            }}
            style={[styles.neuroActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
          >
            <Text style={[styles.neuroActionBtnText, { color: currentTheme.primary }]}>
              Test 60s Conscious Exit Contract
            </Text>
          </Pressable>
        </View>

        {/* 4. Post-Session Reality Check (3-Second Micro-Log) */}
        <View style={[styles.neuroItemCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
          <View style={styles.neuroItemTopRow}>
            <View style={styles.neuroItemTitleRow}>
              <AppIcon name="sparkle" size={17} color={currentTheme.primary} />
              <Text style={styles.neuroItemTitle}>Post-Session Reality Check</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerDockHaptic();
                const nextVal = !realityCheckEnabled;
                setRealityCheckEnabled(nextVal);
                PrototypeSettings.setRealityCheckEnabled(nextVal).catch(() => {});
              }}
              style={[styles.switchTrack, realityCheckEnabled && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
            >
              <View style={[styles.switchThumb, realityCheckEnabled && styles.switchThumbOn]} />
            </Pressable>
          </View>
          <Text style={styles.neuroItemDesc}>
            When exiting Instagram/TikTok after a 15+ minute session, show a brief floating toast: "You spent 22 minutes. Did that feel nourishing or draining?" Single-tap thumb up / down builds metacognition over time.
          </Text>

          {/* Visual Ratio Bar */}
          {(() => {
            const totalLogs = nourishingCount + drainingCount;
            const nourishRatio = totalLogs > 0 ? Math.round((nourishingCount / totalLogs) * 100) : 67;
            const drainRatio = 100 - nourishRatio;
            return (
              <View style={styles.realityRatioBox}>
                <View style={styles.realityRatioBar}>
                  <View style={[styles.realityRatioNourishFill, { width: `${nourishRatio}%` }]} />
                  <View style={[styles.realityRatioDrainFill, { width: `${drainRatio}%` }]} />
                </View>
                <View style={styles.realityRatioLabelRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <AppIcon name="thumb-up" size={12} color="#38d39f" />
                    <Text style={styles.realityRatioNourishText}>{nourishRatio}% Nourishing ({nourishingCount})</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <AppIcon name="thumb-down" size={12} color="#fb7185" />
                    <Text style={styles.realityRatioDrainText}>{drainRatio}% Draining ({drainingCount})</Text>
                  </View>
                </View>
              </View>
            );
          })()}

          {/* Mascot Insight Message */}
          <View style={[styles.realityInsightCard, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
            <Text style={[styles.realityInsightText, { color: currentTheme.primary }]}>
              {nourishingCount >= drainingCount
                ? "Polly's Metacognitive Insight: Most sessions this week felt nourishing. You are consuming with conscious intention!"
                : "Polly's Metacognitive Insight: Notice when sessions turn draining. Try engaging the 15m Focus Sprint before opening feeds."}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              triggerDockHaptic();
              setShowRealityCheckModal(true);
            }}
            style={[styles.neuroActionBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
          >
            <Text style={[styles.neuroActionBtnText, { color: currentTheme.primary }]}>
              Test Reality Check Prompt (Thumbs Up / Down)
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Chrono-Shield Vulnerability Analyzer */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.chronoHeaderRow}>
          <AppIcon name={chronoShield.iconName} size={24} color={chronoShield.badgeColor} />
          <View style={styles.chronoTitleWrap}>
            <View style={styles.chronoBadgeRow}>
              <Text style={[styles.chronoLevelBadge, { color: chronoShield.badgeColor }]}>
                {chronoShield.level.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.chronoTitle}>{chronoShield.title}</Text>
          </View>
        </View>
        <Text style={styles.chronoAdviceText}>{chronoShield.advice}</Text>
      </View>

      {/* Per-App Distraction Locks */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Distraction Blocking Rules</Text>
          <View style={styles.quickSelectRow}>
            <Pressable onPress={() => handleToggleAllApps(true)} style={styles.quickSelectBtn}>
              <Text style={styles.quickSelectBtnText}>Lock All</Text>
            </Pressable>
            <Pressable onPress={() => handleToggleAllApps(false)} style={styles.quickSelectBtn}>
              <Text style={styles.quickSelectBtnText}>Unlock</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Select which video apps are immediately blocked during active focus sessions.
        </Text>

        {/* Master Focus Mode switch */}
        <Pressable
          onPress={() => {
            const next = !focusModeActive;
            setFocusModeActive(next);
            if (next) {
              const blocked = getBlockedPackagesList();
              const mins = Math.max(1, Math.ceil(focusTimerSeconds / 60));
              PrototypeSettings.setFocusMode(true, mins, blocked).catch(() => {});
              setFocusTimerRunning(true);
            } else {
              setFocusTimerRunning(false);
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
            }
          }}
          style={styles.masterToggleRow}
        >
          <View style={styles.toggleInfo}>
            <View style={styles.masterTitleRow}>
              <AppIcon name="shield" size={18} color={currentTheme.primary} />
              <Text style={styles.masterToggleTitle}>Master Focus Mode</Text>
            </View>
            <Text style={styles.toggleSubtitle}>
              {focusModeActive
                ? 'Active · Selected distraction feeds are blocked'
                : 'Disabled · Tap switch to turn on instant protection'}
            </Text>
          </View>
          <View
            style={[styles.switchTrack, focusModeActive && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[
                styles.switchThumb,
                focusModeActive && styles.switchThumbOn,
              ]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('ig')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="camera" size={16} color={currentTheme.primary} />
              <Text style={styles.toggleTitle}>Instagram Reels</Text>
            </View>
            <View style={[styles.statusBadgeSmall, blockInstagram && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockInstagram && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockInstagram ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockInstagram && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[styles.switchThumb, blockInstagram && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('tt')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="music" size={16} color={currentTheme.primary} />
              <Text style={styles.toggleTitle}>TikTok Feed</Text>
            </View>
            <View style={[styles.statusBadgeSmall, blockTikTok && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockTikTok && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockTikTok ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockTikTok && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[styles.switchThumb, blockTikTok && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('yt')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="play" size={16} color={currentTheme.primary} />
              <Text style={styles.toggleTitle}>YouTube Shorts</Text>
            </View>
            <View style={[styles.statusBadgeSmall, blockYouTube && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockYouTube && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockYouTube ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockYouTube && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[styles.switchThumb, blockYouTube && styles.switchThumbOn]}
            />
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleToggleBlockApp('sc')}
          style={styles.toggleRow}
        >
          <View style={styles.appLabelWithBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppIcon name="ghost" size={16} color={currentTheme.primary} />
              <Text style={styles.toggleTitle}>Snapchat Spotlight</Text>
            </View>
            <View style={[styles.statusBadgeSmall, blockSnapchat && focusModeActive ? styles.badgeBlocked : styles.badgeNormal]}>
              <Text style={[styles.statusBadgeSmallText, blockSnapchat && focusModeActive ? styles.textBlocked : styles.textNormal]}>
                {blockSnapchat ? (focusModeActive ? 'LOCKED' : 'WILL BLOCK') : 'ALLOWED'}
              </Text>
            </View>
          </View>
          <View
            style={[styles.switchTrack, blockSnapchat && [styles.switchTrackOn, { backgroundColor: currentTheme.primary }]]}
          >
            <View
              style={[styles.switchThumb, blockSnapchat && styles.switchThumbOn]}
            />
          </View>
        </Pressable>
      </View>

      {/* 24-Hour Dopamine Sabbath */}
      <View style={[styles.sectionCard, dopamineFastActive && styles.sabbathCardActive]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="zen" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>24-Hour Digital Sabbath</Text>
          </View>
          <View style={[styles.statusBadgeSmall, dopamineFastActive ? styles.badgeBlocked : styles.badgeNormal]}>
            <Text style={[styles.statusBadgeSmallText, dopamineFastActive ? styles.textBlocked : styles.textNormal]}>
              {dopamineFastActive ? 'FAST ACTIVE' : 'READY'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Lock all short-form feeds for 24 hours to deeply reset baseline dopamine sensitivity.
        </Text>
        <Pressable
          onPress={() => {
            const next = !dopamineFastActive;
            setDopamineFastActive(next);
            if (next) {
              const allPkgs = Object.values(TARGET_PACKAGES);
              PrototypeSettings.setFocusMode(true, 1440, allPkgs).catch(() => {});
              setFocusTimerSeconds(1440 * 60);
              setFocusTimerRunning(true);
              setFocusModeActive(true);
              Alert.alert(
                '24-Hour Digital Sabbath Begun!',
                'All monitored feeds are strictly locked until tomorrow. Reclaim your stillness.',
              );
            } else {
              PrototypeSettings.setFocusMode(false, 0, []).catch(() => {});
              setFocusTimerRunning(false);
              setFocusModeActive(false);
              Alert.alert('Digital Sabbath Ended', 'Distraction feeds have been unlocked.');
            }
          }}
          style={[styles.sabbathBtn, dopamineFastActive && styles.sabbathBtnActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AppIcon
              name={dopamineFastActive ? 'check' : 'leaf'}
              size={14}
              color={dopamineFastActive ? currentTheme.subtext : currentTheme.background}
            />
            <Text style={[styles.sabbathBtnText, dopamineFastActive && styles.sabbathBtnTextActive]}>
              {dopamineFastActive ? 'End 24-Hour Fast' : 'Begin 24-Hour Dopamine Fast'}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Focus Soundscape Ambient Companion */}
      <Image
        source={require('./src/assets/images/soundscape_banner.png')}
        style={styles.dashboardHeroBanner}
        resizeMode="cover"
      />
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={styles.cardHeaderTitleGroup}>
            <AppIcon name="wave" size={20} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Focus Soundscapes</Text>
          </View>
          <Pressable
            onPress={() => toggleSoundscapeAudio()}
            style={[styles.soundscapeToggleBtn, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow }]}
          >
            <Text style={[styles.soundscapeToggleBtnText, { color: currentTheme.primary }]}>
              {soundscapePlaying ? 'Stop Audio' : 'Play Audio'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.cardSubtitle}>
          Calming ambient backdrop to accompany deep work sessions.
        </Text>
        <View style={styles.soundscapeRow}>
          {soundscapesList.map(sItem => (
            <Pressable
              key={sItem.id}
              onPress={() => {
                triggerDockHaptic();
                setSoundscape(sItem.id);
                toggleSoundscapeAudio(true, sItem.id);
              }}
              style={[
                styles.soundscapeCard,
                { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                soundscape === sItem.id && [
                  styles.soundscapeCardActive,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <AppIcon
                name={sItem.iconName}
                size={22}
                color={soundscape === sItem.id ? currentTheme.primary : currentTheme.subtext}
              />
              <Text
                style={[
                  styles.soundscapeName,
                  soundscape === sItem.id && [
                    styles.soundscapeNameActive,
                    { color: currentTheme.primary },
                  ],
                ]}
              >
                {sItem.name}
              </Text>
            </Pressable>
          ))}
        </View>
        {soundscapePlaying && (
          <View style={[styles.equalizerRow, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <Animated.View
              style={[
                styles.eqBar,
                styles.eqBar1,
                {
                  backgroundColor: currentTheme.primary,
                  transform: [
                    {
                      scaleY: eqPulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 1.4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.eqBar,
                styles.eqBar2,
                {
                  backgroundColor: currentTheme.primary,
                  transform: [
                    {
                      scaleY: eqPulseAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1.3, 0.7, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.eqBar,
                styles.eqBar3,
                {
                  backgroundColor: currentTheme.primary,
                  transform: [
                    {
                      scaleY: eqPulseAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0.8, 1.4, 0.9],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.eqBar,
                styles.eqBar4,
                {
                  backgroundColor: currentTheme.primary,
                  transform: [
                    {
                      scaleY: eqPulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1.2, 0.5],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={[styles.eqLabel, { color: currentTheme.subtext }]}>
              Playing {soundscapesList.find(s => s.id === soundscape)?.name} ({soundscapeDurationMins}m session)
            </Text>
          </View>
        )}

        {/* Soundscape Duration & Play Controls */}
        <View style={styles.soundscapeDurationRow}>
          <Text style={styles.soundscapeDurationLabel}>Duration:</Text>
          {[15, 25, 45, 60].map(mins => (
            <Pressable
              key={mins}
              onPress={() => {
                triggerDockHaptic();
                setSoundscapeDurationMins(mins);
                if (soundscapePlaying) {
                  PrototypeSettings.playSoundscape(soundscape, mins).catch(() => {});
                }
              }}
              style={[
                styles.soundscapeDurationBtn,
                { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                soundscapeDurationMins === mins && [
                  styles.soundscapeDurationBtnActive,
                  { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.soundscapeDurationBtnText,
                  soundscapeDurationMins === mins && [
                    styles.soundscapeDurationBtnTextActive,
                    { color: currentTheme.background },
                  ],
                ]}
              >
                {mins}m
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              triggerDockHaptic();
              toggleSoundscapeAudio();
            }}
            style={[styles.soundscapePlayToggleBtn, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AppIcon
                name={soundscapePlaying ? 'pause' : 'play'}
                size={13}
                color={currentTheme.primary}
              />
              <Text style={[styles.soundscapePlayToggleText, { color: currentTheme.primary }]}>
                {soundscapePlaying ? 'Pause' : 'Play'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </ScrollView>
    );
  }, [
    activeTab,
    focusTimerRunning,
    focusTimerSeconds,
    blockInstagram,
    blockTikTok,
    blockYouTube,
    blockSnapchat,
    soundscape,
    soundscapePlaying,
    soundscapeDurationMins,
    chronoShield,
    currentTheme,
    dopamineFastActive,
    focusModeActive,
    getBlockedPackagesList,
    handleAdjustFocusTimer,
    handleSelectFocusPreset,
    handleToggleAllApps,
    handleToggleBlockApp,
    handleToggleFocusSession,
    toggleSoundscapeAudio,
    eqPulseAnim,
    grayscaleFilterEnabled,
    grayscaleTriggerMode,
    fidgetSwipeEnabled,
    fidgetSwipeCount,
    consciousExitEnabled,
    realityCheckEnabled,
    nourishingCount,
    drainingCount,
  ]);
  const renderBlockTab = () => memoizedBlockTab;

  // Render Settings Tab (Memoized)
  const memoizedSettingsTab = useMemo(() => {
    if (activeTab !== 'settings') return null;

    return (
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
      <Text style={styles.tabScreenTitle}>Settings & Wellbeing Growth</Text>
      <Text style={styles.tabScreenSubtitle}>
        Cultivate attention mastery, review your vitality score, and manage device permissions.
      </Text>

      {/* Attention Mastery & Zen XP Card */}
      <View style={[styles.masteryCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.masteryTopRow}>
          <View style={styles.masteryBadgeRow}>
            <AppIcon name={zenLevel.iconName} size={28} color={currentTheme.primary} />
            <View>
              <Text style={[styles.masteryEyebrow, { color: currentTheme.primary }]}>ATTENTION MASTERY · LEVEL {zenLevel.level}</Text>
              <Text style={styles.masteryTitle}>{zenLevel.title}</Text>
            </View>
          </View>
          <View style={[styles.masteryXpPill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
            <Text style={[styles.masteryXpText, { color: currentTheme.primary }]}>{zenXp} XP</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.masteryProgressTrack, { backgroundColor: currentTheme.surfaceRaised }]}>
          <View style={[styles.masteryProgressFill, { width: `${xpPercent}%`, backgroundColor: currentTheme.primary }]} />
        </View>
        <View style={styles.masteryProgressLabels}>
          <Text style={styles.masteryProgressSub}>
            {xpInCurrentLevel} / {xpNeededForLevel} XP in tier ({xpPercent}%)
          </Text>
          <Text style={[styles.masteryProgressNext, { color: currentTheme.primary }]}>Next: Lvl {Math.min(5, zenLevel.level + 1)}</Text>
        </View>

        {/* Daily Mindful Quests */}
        <Text style={styles.questsHeader}>DAILY MINDFUL QUESTS</Text>
        <View style={styles.questsGrid}>
          <Pressable
            onPress={() => {
              if (!dailyQuestsClaimed.compass) {
                setDailyQuestsClaimed(prev => ({ ...prev, compass: true }));
                setZenXp(prev => prev + 20);
                Alert.alert('Quest Complete!', '+20 XP added for setting your daily intention compass.');
              }
            }}
            style={[styles.questItem, dailyQuestsClaimed.compass && styles.questItemDone]}
          >
            <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon
                name={dailyQuestsClaimed.compass ? 'check' : 'target'}
                size={18}
                color={dailyQuestsClaimed.compass ? '#38d39f' : currentTheme.primary}
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Daily Compass</Text>
              <Text style={styles.questReward}>+20 XP · Intent Set</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => openCravingModal('stroop')}
            style={[styles.questItem, dailyQuestsClaimed.reset && styles.questItemDone]}
          >
            <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon
                name={dailyQuestsClaimed.reset ? 'check' : 'brain'}
                size={18}
                color={dailyQuestsClaimed.reset ? '#38d39f' : currentTheme.primary}
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Stroop Reset</Text>
              <Text style={styles.questReward}>+40 XP · Tap to Play</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={handleQuickFocus15m}
            style={[styles.questItem, (focusTimerRunning || dailyQuestsClaimed.shield) && styles.questItemDone]}
          >
            <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon
                name={focusTimerRunning || dailyQuestsClaimed.shield ? 'check' : 'shield'}
                size={18}
                color={focusTimerRunning || dailyQuestsClaimed.shield ? '#38d39f' : currentTheme.primary}
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Focus Shield</Text>
              <Text style={styles.questReward}>+50 XP · 15m Sprint</Text>
            </View>
          </Pressable>

          <View style={[styles.questItem, totalShorts <= dailyLimit && styles.questItemDone]}>
            <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon
                name={totalShorts <= dailyLimit ? 'check' : 'chart'}
                size={18}
                color={totalShorts <= dailyLimit ? '#38d39f' : currentTheme.primary}
              />
            </View>
            <View style={styles.questInfo}>
              <Text style={styles.questTitle}>Stay Under Cap</Text>
              <Text style={styles.questReward}>+100 XP · At Midnight</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Digital Wellbeing Vitality Score Banner */}
      <View style={[styles.vitalityCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.vitalityLeftCol}>
          <Text style={[styles.vitalityEyebrow, { color: currentTheme.primary }]}>DIGITAL WELLBEING VITALITY</Text>
          <View style={styles.vitalityScoreRow}>
            <Text style={[styles.vitalityScoreNum, { color: currentTheme.primary }]}>{vitalityScore}</Text>
            <Text style={styles.vitalityScoreMax}>/ 100</Text>
          </View>
          <Text style={styles.vitalityStatusText}>
            {vitalityScore >= 85
              ? 'Optimal Flow — High clarity & minimal reflex distraction'
              : vitalityScore >= 65
              ? 'Healthy Balance — Good awareness; keep under daily cap'
              : 'High Dopamine Drag — Engage Craving SOS to reset'}
          </Text>
        </View>
        <View style={styles.vitalityRingWrap}>
          <View
            style={[
              styles.vitalityMiniRing,
              vitalityScore >= 85
                ? styles.vitalityRingHigh
                : vitalityScore >= 65
                ? styles.vitalityRingMed
                : styles.vitalityRingLow,
            ]}
          >
            <AppIcon
              name={vitalityScore >= 85 ? 'sparkle' : vitalityScore >= 65 ? 'leaf' : 'bolt'}
              size={22}
              color={vitalityScore >= 85 ? '#38d39f' : vitalityScore >= 65 ? '#22d3ee' : '#fbbf24'}
            />
          </View>
        </View>
      </View>

      {/* Daily Intention Anchor */}
      <View style={[styles.intentionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.intentionHeaderRow}>
          <Text style={[styles.intentionEyebrow, { color: currentTheme.primary }]}>DAILY COMPASS</Text>
          <Text style={styles.intentionTag}>Conscious Intent</Text>
        </View>
        <Text style={styles.intentionText}>"{selectedIntention}"</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.intentionPillsRow} nestedScrollEnabled={true} overScrollMode="never">
          {intentionsList.map(item => (
            <Pressable
              key={item.id}
              onPress={() => {
                setSelectedIntention(item.title);
                PrototypeSettings.setUserIntention(item.title).catch(() => {});
              }}
              style={[
                styles.intentionPill,
                { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                selectedIntention === item.title && [
                  styles.intentionPillSelected,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <AppIcon
                name={item.iconName}
                size={15}
                color={selectedIntention === item.title ? currentTheme.primary : currentTheme.subtext}
              />
              <Text
                style={[
                  styles.intentionPillText,
                  selectedIntention === item.title && [
                    styles.intentionPillTextSelected,
                    { color: currentTheme.primary },
                  ],
                ]}
              >
                {item.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Daily Reflection & Mind Check-In */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="brain" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Attention & Mood Check-In</Text>
          </View>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>
            {todayMood ? moodsList.find(m => m.id === todayMood)?.label : 'Log Feeling'}
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Reflect on how your cognitive energy and impulse clarity feel right now.
        </Text>
        <View style={styles.moodGrid}>
          {moodsList.map(moodItem => (
            <Pressable
              key={moodItem.id}
              onPress={() => {
                setTodayMood(moodItem.id);
                PrototypeSettings.setUserMood(moodItem.id).catch(() => {});
              }}
              style={[
                styles.moodCard,
                todayMood === moodItem.id && styles.moodCardSelected,
              ]}
            >
              <AppIcon
                name={moodItem.iconName}
                size={22}
                color={todayMood === moodItem.id ? currentTheme.primary : currentTheme.subtext}
              />
              <Text
                style={[
                  styles.moodLabel,
                  todayMood === moodItem.id && styles.moodLabelSelected,
                ]}
              >
                {moodItem.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {todayMood && (
          <View style={[styles.moodTipBox, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <AppIcon name="info" size={14} color={currentTheme.primary} />
            <Text style={styles.moodTipText}>
              {moodsList.find(m => m.id === todayMood)?.tip}
            </Text>
          </View>
        )}
      </View>

      {/* Mindful Milestones & Badges */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="trophy" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Mindful Milestones</Text>
          </View>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>
            {milestones.filter(m => m.unlocked).length} of 4 Unlocked
          </Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Habit trophies celebrating impulse control and conscious digital presence.
        </Text>
        <View style={styles.milestonesGrid}>
          {milestones.map(badge => (
            <View
              key={badge.id}
              style={[
                styles.milestoneBadgeCard,
                { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline },
                badge.unlocked && [
                  styles.milestoneUnlocked,
                  { backgroundColor: currentTheme.glow, borderColor: currentTheme.border },
                ],
              ]}
            >
              <AppIcon
                name={badge.iconName}
                size={24}
                color={badge.unlocked ? currentTheme.primary : currentTheme.subtext}
              />
              <Text
                style={[
                  styles.milestoneName,
                  badge.unlocked ? styles.milestoneNameUnlocked : styles.milestoneNameLocked,
                ]}
              >
                {badge.name}
              </Text>
              <Text style={styles.milestoneDesc}>{badge.desc}</Text>
              <View
                style={[
                  styles.milestoneStatusTag,
                  badge.unlocked
                    ? [styles.milestoneStatusTagUnlocked, { backgroundColor: currentTheme.glow }]
                    : styles.milestoneStatusTagLocked,
                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                ]}
              >
                <AppIcon
                  name={badge.unlocked ? 'check' : 'lock'}
                  size={10}
                  color={badge.unlocked ? currentTheme.primary : currentTheme.subtext}
                />
                <Text
                  style={[
                    styles.milestoneStatusText,
                    badge.unlocked
                      ? [styles.milestoneStatusTextUnlocked, { color: currentTheme.primary }]
                      : styles.milestoneStatusTextLocked,
                  ]}
                >
                  {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Service Status Card */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <Text style={styles.cardSectionTitle}>Android System Health</Text>
          <View
            style={[
              styles.statusBadge,
              prototypeStatus.serviceConnected
                ? styles.statusBadgeActive
                : styles.statusBadgeInactive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                prototypeStatus.serviceConnected
                  ? styles.statusBadgeTextActive
                  : styles.statusBadgeTextInactive,
              ]}
            >
              {prototypeStatus.serviceConnected ? 'Active' : 'Offline'}
            </Text>
          </View>
        </View>

        {/* Permissions Checklist */}
        <View style={styles.healthList}>
          <View style={[styles.healthItem, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon
                name={prototypeStatus.serviceConnected ? 'check' : 'alert'}
                size={18}
                color={prototypeStatus.serviceConnected ? '#38d39f' : '#fbbf24'}
              />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Accessibility Tracking Service</Text>
              <Text style={styles.healthDesc}>
                {prototypeStatus.serviceConnected
                  ? 'Connected and listening for short video scrolls.'
                  : 'Requires enablement in Android Accessibility Settings.'}
              </Text>
            </View>
          </View>
          <View style={[styles.healthItem, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="check" size={18} color="#38d39f" />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Floating Screen Overlay (HUD)</Text>
              <Text style={styles.healthDesc}>TYPE_ACCESSIBILITY_OVERLAY enabled for draggable pill.</Text>
            </View>
          </View>
          <View style={[styles.healthItem, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
            <View style={{ width: 22, alignItems: 'center', justifyContent: 'center' }}>
              <AppIcon name="check" size={18} color="#38d39f" />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Local Device Storage</Text>
              <Text style={styles.healthDesc}>Volatile SharedPreferences storage active (offline).</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => {
            triggerDockHaptic();
            PrototypeSettings.openAccessibilitySettings();
          }}
          style={[styles.settingsActionBtn, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={[styles.settingsActionBtnText, { color: currentTheme.background }]}>
            Open Android Accessibility Settings
          </Text>
        </Pressable>
      </View>

      {/* Floating HUD Style Selection */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <Text style={styles.cardSectionTitle}>HUD Display Style</Text>
        <Text style={styles.cardSubtitle}>
          Choose how the on-screen live counter looks inside video apps.
        </Text>
        <View style={styles.hudStyleSelectorRow}>
          {[
            { id: 'pill' as HudStyle, label: 'Pill', iconName: 'reels' as IconName, countLabel: '14', desc: 'Badge with count' },
            { id: 'dot' as HudStyle, label: 'Compact', iconName: 'dot' as IconName, countLabel: '14', desc: 'Minimal dot' },
            { id: 'warning_only' as HudStyle, label: 'Stealth', iconName: 'alert' as IconName, countLabel: 'Only', desc: 'Only at limit' },
          ].map(styleOpt => (
            <Pressable
              key={styleOpt.id}
              onPress={() => {
                triggerDockHaptic();
                setHudStyle(styleOpt.id);
                PrototypeSettings.setHudStyle(styleOpt.id).catch(() => {});
                Alert.alert('HUD Style Updated', `Floating overlay set to ${styleOpt.label} mode.`);
              }}
              style={[
                styles.hudStyleCard,
                hudStyle === styleOpt.id && [
                  styles.hudStyleCardSelected,
                  { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow },
                ],
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                <AppIcon
                  name={styleOpt.iconName}
                  size={14}
                  color={hudStyle === styleOpt.id ? currentTheme.primary : currentTheme.subtext}
                />
                <Text style={[styles.hudStyleIcon, hudStyle === styleOpt.id && { color: currentTheme.primary }]}>
                  {styleOpt.countLabel}
                </Text>
              </View>
              <Text
                style={[
                  styles.hudStyleLabel,
                  hudStyle === styleOpt.id && [
                    styles.hudStyleLabelSelected,
                    { color: currentTheme.primary },
                  ],
                ]}
              >
                {styleOpt.label}
              </Text>
              <Text style={styles.hudStyleDesc}>{styleOpt.desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Floating HUD info */}
      <View style={[styles.tipCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
        <View style={styles.tipHeaderRow}>
          <AppIcon name="info" size={18} color={currentTheme.primary} />
          <Text style={[styles.tipTitle, { color: currentTheme.primary }]}>Live On-Screen Overlay HUD</Text>
        </View>
        <Text style={styles.tipText}>
          When you open Instagram, TikTok, or YouTube, a draggable floating pill appears showing your reel count in real time and vibrates gently on every swipe.
        </Text>
      </View>

      {/* Sanctuary Theme Atmospheric Palette Showcase */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={styles.cardHeaderTitleGroup}>
            <AppIcon name="palette" size={19} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Sanctuary Atmosphere</Text>
          </View>
          <View style={[styles.activeThemeBadgePill, { borderColor: currentTheme.border, backgroundColor: currentTheme.glow, flexDirection: 'row', alignItems: 'center', gap: 5 }]}>
            <AppIcon name={currentTheme.iconName} size={13} color={currentTheme.primary} />
            <Text style={[styles.activeThemeBadgeText, { color: currentTheme.primary }]}>{currentTheme.name}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          Choose your sanctuary ambiance. Adapts interface glow, dashboard metrics, rings, and floating video HUD in real-time.
        </Text>

        <View style={styles.themeShowcaseGrid}>
          {(['mint', 'cyan', 'amethyst', 'amber', 'rose', 'monochrome'] as ThemeAccent[]).map(accentKey => {
            const t = themeColors[accentKey];
            const isSelected = themeAccent === accentKey || (accentKey === 'mint' && themeAccent === 'emerald');
            return (
              <Pressable
                key={accentKey}
                onPress={() => {
                  triggerDockHaptic();
                  setThemeAccent(accentKey);
                  PrototypeSettings.setThemeAccent(accentKey).catch(() => {});
                }}
                style={[
                  styles.themeShowcaseCard,
                  {
                    backgroundColor: isSelected ? t.surfaceRaised : t.surface,
                    borderColor: isSelected ? t.primary : t.hairline,
                  },
                  isSelected && styles.themeShowcaseCardSelected,
                ]}
              >
                {/* Top Row: Icon Halo + Dual Swatch Dots */}
                <View style={styles.themeCardTopRow}>
                  <View style={[styles.themeCardIconHalo, { backgroundColor: t.glow, borderColor: t.border }]}>
                    <AppIcon name={t.iconName} size={18} color={t.primary} />
                  </View>
                  <View style={styles.themeCardSwatchWrap}>
                    <View style={[styles.themeSwatchDotPrimary, { backgroundColor: t.primary }]} />
                    <View style={[styles.themeSwatchDotDark, { backgroundColor: t.primaryDark }]} />
                  </View>
                </View>

                {/* Theme Name & Mood Tagline */}
                <View style={styles.themeCardMetaCol}>
                  <Text style={[styles.themeCardTitle, isSelected && { color: t.primary }]}>
                    {t.name}
                  </Text>
                  <Text style={[styles.themeCardTagline, { color: t.subtext }]}>
                    {t.tagline}
                  </Text>
                </View>

                {/* Bottom Status / Selection Indicator */}
                <View
                  style={[
                    styles.themeCardStatusPill,
                    isSelected
                      ? [styles.themeCardStatusPillSelected, { backgroundColor: t.glow, borderColor: t.border }]
                      : styles.themeCardStatusPillIdle,
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                  ]}
                >
                  {isSelected && <AppIcon name="check" size={11} color={t.primary} />}
                  <Text
                    style={[
                      styles.themeCardStatusText,
                      isSelected
                        ? [styles.themeCardStatusTextSelected, { color: t.primary }]
                        : styles.themeCardStatusTextIdle,
                    ]}
                  >
                    {isSelected ? 'Active Theme' : 'Tap to Activate'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Privacy Guarantee */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.privacyHeaderRow}>
          <AppIcon name="shield" size={18} color={currentTheme.primary} />
          <Text style={styles.cardSectionTitle}>On-Device Privacy Commitment</Text>
        </View>
        <Text style={styles.body}>
          • Only event type, app package, and event timestamps are observed.
        </Text>
        <Text style={styles.body}>
          • Zero screen text, UI tree content, messages, or screenshots are ever read.
        </Text>
        <Text style={styles.body}>
          • No internet analytics, advertising IDs, or external servers are used.
        </Text>
      </View>

      {/* Share Progress Card */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <View style={styles.cardHeaderWithAction}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppIcon name="share" size={18} color={currentTheme.primary} />
            <Text style={styles.cardSectionTitle}>Share Progress & Milestones</Text>
          </View>
          <Text style={[styles.cardSelectedHighlight, { color: currentTheme.primary }]}>{mindfulStreak}d Streak</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Export or share your digital wellbeing achievements and time reclaimed beyond feeds.
        </Text>
        <Pressable
          onPress={() => {
            triggerDockHaptic();
            shareMindfulProgress();
          }}
          style={[styles.settingsActionBtn, { backgroundColor: currentTheme.primary }]}
        >
          <Text style={[styles.settingsActionBtnText, { color: currentTheme.background }]}>
            Share Weekly Mindful Report Card →
          </Text>
        </Pressable>
      </View>

      {/* Management Actions */}
      <View style={[styles.sectionCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.hairline }]}>
        <Text style={styles.cardSectionTitle}>Maintenance & Onboarding</Text>
        <Pressable
          onPress={() => {
            setHasManuallyOpenedIntro(true);
            setShowIntro(true);
          }}
          style={styles.secondaryOutlineBtn}
        >
          <Text style={styles.secondaryOutlineBtnText}>
            View Intro & Permissions Guide
          </Text>
        </Pressable>

        <Pressable
          onPress={handleResetCounters}
          style={[styles.secondaryOutlineBtn, styles.dangerOutlineBtn]}
        >
          <Text style={[styles.secondaryOutlineBtnText, styles.dangerOutlineBtnText]}>
            Reset Today's Counters to 0
          </Text>
        </Pressable>
      </View>

      {/* App Version Footer */}
      <View style={styles.footerCol}>
        <Text style={styles.footerVersion}>ReelCount v0.4.31</Text>
        <Text style={styles.footerTagline}>Mindful Digital Wellbeing Sanctuary</Text>
      </View>
    </ScrollView>
    );
  }, [
    activeTab,
    themeAccent,
    hudStyle,
    prototypeStatus,
    zenLevel,
    xpInCurrentLevel,
    xpNeededForLevel,
    xpPercent,
    currentTheme,
    dailyLimit,
    dailyQuestsClaimed.compass,
    dailyQuestsClaimed.reset,
    dailyQuestsClaimed.shield,
    focusTimerRunning,
    handleQuickFocus15m,
    milestones,
    mindfulStreak,
    selectedIntention,
    shareMindfulProgress,
    todayMood,
    totalShorts,
    vitalityScore,
    zenXp,
  ]);
  const renderSettingsTab = () => memoizedSettingsTab;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentTheme.background }]}>
        <StatusBar barStyle="light-content" />

        {/* Main Body */}
        {showIntro ? (
          renderIntroScreen()
        ) : (
          <View style={[styles.mainContainer, { backgroundColor: currentTheme.background }]}>
            <Animated.View
              style={[
                styles.mainAnimatedContainer,
                {
                  opacity: tabFadeAnim,
                  transform: [
                    { translateY: tabTranslateY },
                    { scale: tabScaleAnim },
                  ],
                },
              ]}
            >
              {activeTab === 'counter' && renderCounterTab()}
              {activeTab === 'timers' && renderTimersTab()}
              {activeTab === 'block' && renderBlockTab()}
              {activeTab === 'settings' && renderSettingsTab()}
            </Animated.View>

            {/* Quick Action Dismiss Backdrop */}
            {quickActionTab !== null && (
              <Pressable
                onPress={closeQuickActions}
                style={styles.dockBackdropDismiss}
              />
            )}

            {/* Liquid Glass Pill Dock */}
            <View style={styles.liquidDockWrap}>
              {/* Long-Press Quick Action Palette */}
              {quickActionTab !== null && (
                <Animated.View
                  style={[
                    styles.dockQuickActionMenu,
                    {
                      opacity: quickActionOpacity,
                      transform: [{ scale: quickActionScale }],
                      borderColor: currentTheme.border,
                      backgroundColor: currentTheme.surface,
                    },
                  ]}
                >
                  <View style={styles.dockQuickActionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <AppIcon name="bolt" size={14} color={currentTheme.primary} />
                      <Text style={[styles.dockQuickActionTitle, { color: currentTheme.primary }]}>
                        {TABS[quickActionTab].label} Quick Shortcuts
                      </Text>
                    </View>
                    <Pressable onPress={closeQuickActions} style={styles.dockQuickActionCloseBtn}>
                      <AppIcon name="close" size={12} color={currentTheme.subtext} />
                    </Pressable>
                  </View>
                  <View style={styles.dockQuickActionRow}>
                    {getQuickActionsForTab(quickActionTab).map((act, i) => (
                      <Pressable
                        key={i}
                        onPress={() => {
                          triggerDockHaptic();
                          act.action();
                          closeQuickActions();
                        }}
                        style={[styles.dockQuickActionBtn, { borderColor: currentTheme.hairline, backgroundColor: currentTheme.glow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                      >
                        <AppIcon name={act.icon} size={12} color={currentTheme.primary} />
                        <Text style={[styles.dockQuickActionBtnText, { color: currentTheme.primary }]}>
                          {act.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Dynamic Island Scrub Tooltip Preview Capsule */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.dockScrubTooltip,
                  {
                    opacity: tooltipOpacity,
                    transform: [
                      {
                        translateX: tooltipX.interpolate({
                          inputRange: [0, 1, 2, 3],
                          outputRange: [
                            -dockWidth * 0.22,
                            -dockWidth * 0.08,
                            dockWidth * 0.08,
                            dockWidth * 0.22,
                          ],
                        }),
                      },
                      { scale: tooltipScale },
                    ],
                    borderColor: currentTheme.border,
                    backgroundColor: currentTheme.surface,
                  },
                ]}
              >
                <View style={styles.dockTooltipRow}>
                  <View style={[styles.dockTooltipIconWrap, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                    <AppIcon
                      name={getScrubTooltipInfo(hoveredTabIndex ?? TAB_INDEX_MAP[activeTab]).icon}
                      size={15}
                      color={getScrubTooltipInfo(hoveredTabIndex ?? TAB_INDEX_MAP[activeTab]).accent}
                    />
                  </View>
                  <View style={styles.dockTooltipTextWrap}>
                    <Text style={[styles.dockTooltipTitle, { color: getScrubTooltipInfo(hoveredTabIndex ?? TAB_INDEX_MAP[activeTab]).accent }]}>
                      {getScrubTooltipInfo(hoveredTabIndex ?? TAB_INDEX_MAP[activeTab]).title}
                    </Text>
                    <Text style={[styles.dockTooltipSub, { color: currentTheme.subtext }]} numberOfLines={1}>
                      {getScrubTooltipInfo(hoveredTabIndex ?? TAB_INDEX_MAP[activeTab]).sub}
                    </Text>
                  </View>
                </View>
                {/* Micro pointer arrow */}
                <View style={[styles.dockTooltipArrow, { borderTopColor: currentTheme.border }]} />
              </Animated.View>

              {/* Ambient Fluid Underglow that tracks slider position */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.liquidDockGlowBackdrop,
                  {
                    width: (dockWidth - 12) / 4 + 24,
                    transform: [
                      {
                        translateX: sliderAnim.interpolate({
                          inputRange: [0, 1, 2, 3],
                          outputRange: [
                            -6,
                            (dockWidth - 12) / 4 - 6,
                            ((dockWidth - 12) / 4) * 2 - 6,
                            ((dockWidth - 12) / 4) * 3 - 6,
                          ],
                        }),
                      },
                    ],
                    backgroundColor: currentTheme.glow,
                  },
                ]}
              />

              {/* The Liquid Glass Capsule Dock */}
              <Animated.View
                ref={dockWrapRef}
                testID="liquid-dock"
                pointerEvents="auto"
                style={[
                  styles.liquidDockPill,
                  {
                    transform: [{ scale: dockScale }],
                    backgroundColor: currentTheme.surfaceRaised,
                    borderColor: isDraggingDock ? currentTheme.primary : currentTheme.hairline,
                  },
                ]}
                onLayout={(e) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0 && Math.abs(w - dockWidthRef.current) > 2) {
                    setDockWidth(w);
                    dockWidthRef.current = w;
                  }
                  dockWrapRef.current?.measureInWindow((x: number) => {
                    if (x !== undefined && !isNaN(x)) {
                      dockLeftRef.current = x;
                    }
                  });
                }}
                {...dockPanResponder.panHandlers}
              >
                {/* Specular Top Rim Reflection Line */}
                <View pointerEvents="none" style={styles.dockSpecularHighlight} />

                {/* Frosted Curved Sheen */}
                <View pointerEvents="none" style={styles.dockUpperSheen} />

                {/* Optical Crystal Shimmer Light Wave */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.dockShimmerBeam,
                    {
                      transform: [
                        {
                          translateX: shimmerAnim.interpolate({
                            inputRange: [-1, 2],
                            outputRange: [-dockWidth * 0.8, dockWidth * 1.2],
                          }),
                        },
                        { skewX: '-25deg' },
                      ],
                    },
                  ]}
                />

                {/* Expanding Liquid Touch Ripple */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.dockTouchRipple,
                    {
                      opacity: rippleOpacity,
                      transform: [
                        { translateX: rippleX },
                        { translateY: rippleY },
                        {
                          scale: rippleAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.3, 2.5],
                          }),
                        },
                      ],
                      borderColor: currentTheme.primary,
                      backgroundColor: currentTheme.glow,
                    },
                  ]}
                />

                {/* Sliding Mercury Fluid Indicator Pill */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.liquidSliderPill,
                    {
                      width: (dockWidth - 12) / 4,
                      transform: [
                        {
                          translateX: sliderAnim.interpolate({
                            inputRange: [0, 1, 2, 3],
                            outputRange: [
                              0,
                              (dockWidth - 12) / 4,
                              ((dockWidth - 12) / 4) * 2,
                              ((dockWidth - 12) / 4) * 3,
                            ],
                          }),
                        },
                        { scaleX: sliderScaleX },
                        { scaleY: sliderScaleY },
                      ],
                      backgroundColor: currentTheme.glow,
                      borderColor: isDraggingDock ? currentTheme.primary : currentTheme.border,
                    },
                  ]}
                >
                  <View style={styles.liquidSliderInnerShine} />
                </Animated.View>

                {/* 4 Tabs with Interactive Magnification & Live Micro-Badges */}
                {TABS.map((tab, idx) => {
                  const isTabActive = activeTab === tab.id;
                  const isTabHovered = hoveredTabIndex === idx;

                  return (
                    <Animated.View
                      key={tab.id}
                      testID={`dock-tab-${tab.id}`}
                      accessible={true}
                      accessibilityRole="tab"
                      accessibilityLabel={tab.label}
                      accessibilityState={{ selected: isTabActive }}
                      onTouchEnd={() => {
                        // Handled by dockPanResponder on physical device; retained for synthetic test environments
                        if (!hasScrubbedRef.current && !isDragActiveRef.current) {
                          animateTabSelection(idx);
                        }
                      }}
                      style={[
                        styles.dockTabItem,
                        {
                          width: (dockWidth - 12) / 4,
                          transform: [
                            { scale: tabScaleAnims[idx] },
                            { translateY: tabTranslateYAnims[idx] },
                            {
                              rotate: tabTiltAnims[idx].interpolate({
                                inputRange: [-10, 0, 10],
                                outputRange: ['-10deg', '0deg', '10deg'],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.dockIconContainer,
                          {
                            transform: [{ scale: iconBounceAnims[idx] }],
                          },
                        ]}
                      >
                        {/* Soft Glowing Neon Ring behind Active Icon */}
                        {isTabActive && (
                          <Animated.View
                            pointerEvents="none"
                            style={[
                              styles.dockActiveIconGlowRing,
                              {
                                borderColor: currentTheme.border,
                                backgroundColor: currentTheme.glow,
                                opacity: dropletPulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.55, 0.95],
                                }),
                              },
                            ]}
                          />
                        )}

                        <AppIcon
                          name={tab.icon}
                          size={isTabHovered || isTabActive ? 22 : 20}
                          color={
                            isTabActive
                              ? currentTheme.primary
                              : isTabHovered
                              ? '#ffffff'
                              : currentTheme.subtext
                          }
                        />

                        {/* Live Micro Status Badges */}
                        {idx === 0 && (
                          <View
                            style={[
                              styles.dockMicroBadge,
                              isOverLimit
                                ? styles.dockMicroBadgeDanger
                                : { backgroundColor: currentTheme.glow, borderColor: currentTheme.border },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dockMicroBadgeText,
                                isOverLimit ? styles.dockMicroBadgeTextDanger : { color: currentTheme.primary },
                              ]}
                            >
                              {totalShorts}
                            </Text>
                          </View>
                        )}

                        {idx === 1 && (isOverLimit || isNearLimit) && (
                          <View
                            style={[
                              styles.dockMicroDot,
                              isOverLimit ? styles.dockMicroDotOverLimit : styles.dockMicroDotNearLimit,
                            ]}
                          />
                        )}

                        {idx === 2 && focusTimerRunning && (
                          <View style={styles.dockMicroShieldActiveBadge}>
                            <Text style={styles.dockMicroShieldActiveText}>
                              {Math.ceil(focusTimerSeconds / 60)}m
                            </Text>
                          </View>
                        )}

                        {idx === 3 && (
                          <View style={[styles.dockMicroBadge, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }]}>
                            <Text style={[styles.dockMicroBadgeText, { color: currentTheme.primary }]}>
                              L{zenLevel.level}
                            </Text>
                          </View>
                        )}
                      </Animated.View>

                      <Text
                        style={[
                          styles.dockTabLabel,
                          isTabActive
                            ? [styles.dockTabLabelActive, { color: currentTheme.primary }]
                            : isTabHovered
                            ? styles.dockTabLabelHovered
                            : [styles.dockTabLabelInactive, { color: currentTheme.subtext }],
                        ]}
                        numberOfLines={1}
                      >
                        {tab.label}
                      </Text>

                      {/* Living Breathing Active Droplet Indicator */}
                      {isTabActive && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.dockActiveDroplet,
                            {
                              backgroundColor: currentTheme.primary,
                              transform: [
                                {
                                  scale: dropletPulseAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1.0, 1.45],
                                  }),
                                },
                              ],
                              opacity: dropletPulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.75, 1.0],
                              }),
                            },
                          ]}
                        />
                      )}
                    </Animated.View>
                  );
                })}
              </Animated.View>
            </View>
          </View>
        )}

        {/* Craving SOS & Impulse Interrupter Sanctuary Modal */}
        <Modal
          visible={showCravingModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowCravingModal(false);
            setDelayRunning(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.breatheModalCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <Text style={[styles.breatheModalEyebrow, { color: currentTheme.primary }]}>NEURAL PATTERN INTERRUPT</Text>
              <Text style={styles.breatheModalTitle}>Craving SOS Sanctuary</Text>
              <Text style={styles.breatheModalDesc}>
                Break the dopamine compulsion loop with an evidence-based mindful pause.
              </Text>

              {/* 4-Mode Switcher */}
              <View style={[styles.modalTabRow, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    setCravingTab('breathing');
                  }}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'breathing' && [styles.modalTabBtnActive, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border }],
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                  ]}
                >
                  <AppIcon
                    name="zen"
                    size={13}
                    color={cravingTab === 'breathing' ? currentTheme.primary : currentTheme.subtext}
                  />
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'breathing' && [styles.modalTabBtnTextActive, { color: currentTheme.primary }],
                    ]}
                  >
                    Breath
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    setCravingTab('delay');
                  }}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'delay' && [styles.modalTabBtnActive, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border, borderWidth: 1 }],
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                  ]}
                >
                  <AppIcon
                    name="wave"
                    size={13}
                    color={cravingTab === 'delay' ? currentTheme.primary : currentTheme.subtext}
                  />
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'delay' && [styles.modalTabBtnTextActive, { color: currentTheme.primary }],
                    ]}
                  >
                    90s Delay
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    setCravingTab('grounding');
                  }}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'grounding' && [styles.modalTabBtnActive, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border, borderWidth: 1 }],
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                  ]}
                >
                  <AppIcon
                    name="leaf"
                    size={13}
                    color={cravingTab === 'grounding' ? currentTheme.primary : currentTheme.subtext}
                  />
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'grounding' && [styles.modalTabBtnTextActive, { color: currentTheme.primary }],
                    ]}
                  >
                    Grounding
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    resetStroop();
                    setCravingTab('stroop');
                  }}
                  style={[
                    styles.modalTabBtn,
                    cravingTab === 'stroop' && [styles.modalTabBtnActive, { backgroundColor: currentTheme.glow, borderColor: currentTheme.border, borderWidth: 1 }],
                    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
                  ]}
                >
                  <AppIcon
                    name="brain"
                    size={13}
                    color={cravingTab === 'stroop' ? currentTheme.primary : currentTheme.subtext}
                  />
                  <Text
                    style={[
                      styles.modalTabBtnText,
                      cravingTab === 'stroop' && [styles.modalTabBtnTextActive, { color: currentTheme.primary }],
                    ]}
                  >
                    Stroop
                  </Text>
                </Pressable>
              </View>

              {/* Mode 1: 4-4-4 Box Breathing */}
              {cravingTab === 'breathing' && (
                <View style={styles.cravingContentWrap}>
                  <View style={styles.breatheVisualWrap}>
                    <Animated.View
                      style={[
                        styles.breatheRingOuter,
                        breathePhase === 'Inhale'
                          ? styles.breatheRingInhale
                          : breathePhase === 'Hold'
                          ? styles.breatheRingHold
                          : styles.breatheRingExhale,
                        {
                          borderColor: currentTheme.border,
                          backgroundColor: currentTheme.glow,
                          transform: [{ scale: modalBreathAnim }],
                        },
                      ]}
                    >
                      <View style={[styles.breatheRingInner, { borderColor: currentTheme.border }]}>
                        <Text style={[styles.breathePhaseText, { color: currentTheme.primary }]}>{breathePhase}</Text>
                        <Text style={styles.breatheCycleCount}>{breatheCycleSec}s</Text>
                      </View>
                    </Animated.View>
                  </View>
                  <Text style={styles.breatheRemainingText}>
                    {breatheSecondsRemaining}s session remaining
                  </Text>
                </View>
              )}

              {/* Mode 2: 90-Second Craving Surge Delay */}
              {cravingTab === 'delay' && (
                <View style={styles.cravingContentWrap}>
                  <View style={styles.delayVisualWrap}>
                    <View style={[styles.delayTimerCircle, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                      <Text style={[styles.delaySecondsText, { color: currentTheme.primary }]}>{delaySeconds}s</Text>
                      <Text style={styles.delaySublabel}>Craving Surge</Text>
                    </View>
                  </View>
                  <Text style={styles.delayStageText}>
                    {delaySeconds > 60
                      ? 'Urge Rising: Observe the itch without judgment.'
                      : delaySeconds > 30
                      ? 'Wave Cresting: The dopamine spike is leveling off.'
                      : 'Wave Subsiding: Impulse fading, prefrontal cortex in control.'}
                  </Text>
                  <View style={styles.delayActionBtnRow}>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        setDelayRunning(prev => !prev);
                      }}
                      style={[
                        styles.delayActionBtn,
                        { backgroundColor: currentTheme.primary },
                        delayRunning && styles.delayActionBtnActive,
                      ]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <AppIcon
                          name={delayRunning ? 'pause' : 'play'}
                          size={14}
                          color={currentTheme.background}
                        />
                        <Text style={[styles.delayActionBtnText, { color: currentTheme.background }]}>
                          {delayRunning ? 'Pause Timer' : 'Surf the Wave (90s)'}
                        </Text>
                      </View>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        triggerDockHaptic();
                        setDelayRunning(false);
                        setDelaySeconds(90);
                      }}
                      style={[styles.delayResetBtn, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}
                    >
                      <Text style={[styles.delayResetBtnText, { color: currentTheme.primary }]}>Reset</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Mode 3: 5-4-3-2-1 Sensory Grounding */}
              {cravingTab === 'grounding' && (
                <View style={styles.cravingContentWrap}>
                  <View style={[styles.groundingCard, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}>
                    <View style={styles.groundingBadgeRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <AppIcon
                          name={groundingSteps[groundingStep].iconName}
                          size={13}
                          color={currentTheme.primary}
                        />
                        <Text style={[styles.groundingSenseTag, { color: currentTheme.primary }]}>
                          {groundingSteps[groundingStep].sense}
                        </Text>
                      </View>
                      <Text style={styles.groundingStepCount}>
                        Step {groundingStep + 1} of 5
                      </Text>
                    </View>
                    <Text style={styles.groundingTitle}>
                      {groundingSteps[groundingStep].title}
                    </Text>
                    <Text style={styles.groundingPrompt}>
                      {groundingSteps[groundingStep].prompt}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      triggerDockHaptic();
                      if (groundingStep < groundingSteps.length - 1) {
                        setGroundingStep(prev => prev + 1);
                      } else {
                        setGroundingStep(0);
                        setShowCravingModal(false);
                        Alert.alert('Grounding Complete', 'Your senses are anchored and mind is clear.');
                      }
                    }}
                    style={[styles.groundingNextBtn, { backgroundColor: currentTheme.primary }]}
                  >
                    <Text style={[styles.groundingNextBtnText, { color: currentTheme.background }]}>
                      {groundingStep < 4 ? 'Next Sensory Anchor →' : 'Complete Grounding Session'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Mode 4: Stroop Cognitive Conflict Test */}
              {cravingTab === 'stroop' && (
                <View style={styles.stroopContainer}>
                  {!stroopFinished ? (
                    <>
                      <Text style={styles.stroopRoundEyebrow}>
                        CHALLENGE {stroopRound + 1} OF 3
                      </Text>
                      <Text style={styles.stroopInstruction}>
                        Tap the <Text style={styles.stroopHighlight}>INK COLOR</Text> of the word below (ignore the letters):
                      </Text>

                      {/* Conflict Word Card */}
                      <View style={styles.stroopWordCard}>
                        <Text
                          style={[
                            styles.stroopWordText,
                            { color: STROOP_TRIALS[stroopRound % STROOP_TRIALS.length].color },
                          ]}
                        >
                          {STROOP_TRIALS[stroopRound % STROOP_TRIALS.length].text}
                        </Text>
                      </View>

                      {stroopFeedback && (
                        <Text style={styles.stroopFeedbackText}>{stroopFeedback}</Text>
                      )}

                      {/* 4 Ink Color Buttons */}
                      <View style={styles.stroopButtonsGrid}>
                        {['Emerald', 'Cyan', 'Amethyst', 'Amber'].map(cName => {
                          const colorMap: Record<string, string> = {
                            Emerald: '#38d39f',
                            Cyan: '#22d3ee',
                            Amethyst: '#c084fc',
                            Amber: '#fbbf24',
                          };
                          return (
                            <Pressable
                              key={cName}
                              onPress={() => handleStroopAnswer(cName)}
                              style={[
                                styles.stroopChoiceBtn,
                                { borderColor: colorMap[cName] },
                              ]}
                            >
                              <View
                                style={[
                                  styles.stroopColorSwatch,
                                  { backgroundColor: colorMap[cName] },
                                ]}
                              />
                              <Text style={styles.stroopChoiceText}>{cName}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <View style={styles.stroopSuccessCard}>
                      <View style={{ alignItems: 'center', marginBottom: 12 }}>
                        <AppIcon name="brain" size={44} color={currentTheme.primary} />
                      </View>
                      <Text style={styles.stroopSuccessTitle}>Prefrontal Cortex Restored!</Text>
                      <Text style={styles.stroopSuccessDesc}>
                        The color-word conflict forced your executive brain to override the basal-ganglia autonomic dopamine loop.
                      </Text>
                      <View style={styles.stroopXpBadge}>
                        <Text style={styles.stroopXpBadgeText}>+40 Zen XP Earned</Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          resetStroop();
                          setShowCravingModal(false);
                        }}
                        style={styles.stroopCompleteBtn}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <AppIcon name="check" size={14} color={currentTheme.background} />
                          <Text style={styles.stroopCompleteBtnText}>Conscious Awareness Restored</Text>
                        </View>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              <Pressable
                onPress={() => {
                  triggerDockHaptic();
                  setShowCravingModal(false);
                  setDelayRunning(false);
                  setBreatheSecondsRemaining(60);
                  setBreathePhase('Inhale');
                }}
                style={[styles.breatheCloseBtn, { backgroundColor: currentTheme.surfaceRaised, borderColor: currentTheme.hairline }]}
              >
                <Text style={[styles.breatheCloseBtnText, { color: currentTheme.primary }]}>Return to Sanctuary</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Polly's Morning Alignment 5-Second Daily Card Modal */}
        <Modal
          visible={showMorningAlignment}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMorningAlignment(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowMorningAlignment(false)}
          >
            <Pressable style={[styles.morningCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.morningAvatarHero, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                <Image
                  source={require('./src/assets/images/app_mascot.jpg')}
                  style={styles.morningAvatarImg}
                  resizeMode="cover"
                />
              </View>

              <View style={[styles.morningBadgePill, { backgroundColor: currentTheme.glow, borderColor: currentTheme.hairline }]}>
                <AppIcon name="sun" size={13} color={currentTheme.primary} />
                <Text style={[styles.morningBadgePillText, { color: currentTheme.primary }]}>POLLY'S MORNING ALIGNMENT</Text>
              </View>

              <Text style={styles.morningTitle}>Good morning!</Text>
              <Text style={[styles.morningHighlight, { color: currentTheme.primary }]}>
                Yesterday you reclaimed {morningReclaimedMins} minutes beyond feeds.
              </Text>
              <Text style={styles.morningDesc}>
                Let's keep your morning screen-free, nourish your real world, and start with intention.
              </Text>

              {/* 5-Second Animated Progress Bar */}
              <View style={styles.morningProgressWrap}>
                <View style={styles.morningProgressBarTrack}>
                  <View style={[styles.morningProgressBarFill, { width: `${(morningCountdown / 5) * 100}%`, backgroundColor: currentTheme.primary }]} />
                </View>
                <Text style={styles.morningCountdownText}>Auto-dismissing in {morningCountdown}s</Text>
              </View>

              <Pressable
                onPress={() => {
                  triggerDockHaptic();
                  setShowMorningAlignment(false);
                }}
                style={[styles.morningActionBtn, { backgroundColor: currentTheme.primary }]}
              >
                <Text style={[styles.morningActionBtnText, { color: currentTheme.background }]}>
                  Keep Morning Screen-Free →
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Post-Session Reality Check (3-Second Micro-Log) Modal */}
        <Modal
          visible={showRealityCheckModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowRealityCheckModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowRealityCheckModal(false)}
          >
            <Pressable style={[styles.realityCheckModalCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]} onPress={e => e.stopPropagation()}>
              <View style={styles.realityModalHeaderRow}>
                <View style={[styles.realityModalAvatarWrap, { borderColor: currentTheme.primary, backgroundColor: currentTheme.glow }]}>
                  <Image
                    source={require('./src/assets/images/app_mascot.jpg')}
                    style={styles.realityModalAvatarImg}
                    resizeMode="cover"
                  />
                </View>
                <View>
                  <Text style={[styles.realityModalEyebrow, { color: currentTheme.primary }]}>POLLY · REALITY CHECK</Text>
                  <Text style={styles.realityModalTitle}>Session Reflection</Text>
                </View>
              </View>

              <Text style={styles.realityModalQuestion}>
                You spent {realityCheckElapsedMins} minutes on {realityCheckApp}.{'\n'}Did that feel nourishing or draining?
              </Text>

              <View style={styles.realityBtnRow}>
                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    setNourishingCount(c => c + 1);
                    PrototypeSettings.recordMicroLog(realityCheckApp, realityCheckElapsedMins, 'nourishing').catch(() => {});
                    setShowRealityCheckModal(false);
                    Alert.alert('Polly: Session Logged', 'Logged as Nourishing. Metacognition +10 XP!');
                  }}
                  style={[styles.realityBtnNourish, { backgroundColor: 'rgba(56, 211, 159, 0.15)', borderColor: '#38d39f' }]}
                >
                  <AppIcon name="thumb-up" size={18} color="#38d39f" />
                  <Text style={[styles.realityBtnText, { color: '#38d39f' }]}>Nourishing</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerDockHaptic();
                    setDrainingCount(c => c + 1);
                    PrototypeSettings.recordMicroLog(realityCheckApp, realityCheckElapsedMins, 'draining').catch(() => {});
                    setShowRealityCheckModal(false);
                    Alert.alert('Polly: Session Logged', 'Logged as Draining. A reminder to pause sooner next time.');
                  }}
                  style={[styles.realityBtnDrain, { backgroundColor: 'rgba(251, 113, 133, 0.15)', borderColor: '#fb7185' }]}
                >
                  <AppIcon name="thumb-down" size={18} color="#fb7185" />
                  <Text style={[styles.realityBtnText, { color: '#fb7185' }]}>Draining</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => setShowRealityCheckModal(false)}
                style={styles.realityModalDismissBtn}
              >
                <Text style={styles.realityModalDismissText}>Dismiss</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* "One Last Reel" Conscious Exit Contract Modal */}
        <Modal
          visible={showConsciousExitModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConsciousExitModal(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowConsciousExitModal(false)}
          >
            <Pressable style={[styles.consciousExitModalCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]} onPress={e => e.stopPropagation()}>
              <View style={[styles.consciousExitAvatarWrap, { borderColor: '#fb7185', backgroundColor: 'rgba(251, 113, 133, 0.15)' }]}>
                <Image
                  source={require('./src/assets/images/app_mascot.jpg')}
                  style={styles.consciousExitAvatarImg}
                  resizeMode="cover"
                />
              </View>

              <Text style={[styles.consciousExitEyebrow, { color: '#fb7185' }]}>CONSCIOUS EXIT CONTRACT</Text>
              <Text style={styles.consciousExitTitle}>"One Last Reel" Wind-Down</Text>

              <Text style={styles.consciousExitDesc}>
                You've hit your mindful boundary of {dailyLimit} shorts. Finish this final video with calm intention, then place your phone face down.
              </Text>

              <View style={styles.consciousExitTimerWrap}>
                <Text style={[styles.consciousExitCountdownBig, { color: currentTheme.primary }]}>
                  {consciousExitCountdown}s
                </Text>
                <Text style={styles.consciousExitRemainingLabel}>Wind-down time remaining</Text>
              </View>

              <View style={styles.consciousExitProgressTrack}>
                <View style={[styles.consciousExitProgressFill, { width: `${(consciousExitCountdown / 60) * 100}%`, backgroundColor: currentTheme.primary }]} />
              </View>

              <Pressable
                onPress={() => {
                  triggerDockHaptic();
                  setShowConsciousExitModal(false);
                  Alert.alert('Mindful Session Complete', 'Phone placed down. Prefrontal clarity preserved.');
                }}
                style={[styles.consciousExitCompleteBtn, { backgroundColor: currentTheme.primary }]}
              >
                <Text style={[styles.consciousExitCompleteBtnText, { color: currentTheme.background }]}>
                  I'm Done · Place Phone Down
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({

  soundscapeDurationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  soundscapeDurationLabel: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 2,
  },
  soundscapeDurationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#111d17',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  soundscapeDurationBtnActive: {
    borderColor: '#38d39f',
    backgroundColor: '#15281f',
  },
  soundscapeDurationBtnText: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
  },
  soundscapeDurationBtnTextActive: {
    color: '#38d39f',
    fontWeight: '800',
  },
  soundscapePlayToggleBtn: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38d39f',
  },
  soundscapePlayToggleText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
  },


  // Attention Mastery & XP Styles
  masteryCard: {
    backgroundColor: '#0c1511',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  masteryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  masteryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masteryLevelIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  masteryEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  masteryTitle: {
    color: '#f1f5f3',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  masteryXpPill: {
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38d39f',
  },
  masteryXpText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '900',
  },
  masteryProgressTrack: {
    height: 8,
    backgroundColor: '#1b2821',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  masteryProgressFill: {
    height: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 4,
  },
  masteryProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  masteryProgressSub: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '600',
  },
  masteryProgressNext: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },
  questsHeader: {
    color: '#657e71',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  questsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questItem: {
    width: '48%',
    backgroundColor: '#111d17',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  questItemDone: {
    borderColor: 'rgba(56, 211, 159, 0.4)',
    backgroundColor: '#102219',
  },
  questIcon: {
    fontSize: 16,
    color: '#38d39f',
    marginRight: 8,
    fontWeight: '900',
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    color: '#e2e8e5',
    fontSize: 12,
    fontWeight: '700',
  },
  questReward: {
    color: '#8aa395',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },

  // Intercept Card Styles
  interceptCard: {
    backgroundColor: '#111728',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  interceptTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  interceptEmoji: {
    fontSize: 26,
    marginRight: 10,
  },
  interceptTitleCol: {
    flex: 1,
  },
  interceptEyebrow: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  interceptTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  interceptDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  interceptActionBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  interceptActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  // 24-Hour Dopamine Clock Styles
  clockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardSectionEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  liveNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111d17',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.4)',
  },
  liveNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38d39f',
    marginRight: 6,
  },
  liveNowText: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '700',
  },
  hourlyBarRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
  },
  hourlyBarItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#111d17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    minWidth: 44,
  },
  hourlyBarItemSelected: {
    borderColor: '#38d39f',
    backgroundColor: '#15251e',
  },
  hourlyBarItemCurrent: {
    borderWidth: 2,
  },
  hourlyBarHourText: {
    color: '#657e71',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourlyBarTextActive: {
    color: '#f1f5f3',
  },
  hourlyBarIndicator: {
    width: 14,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  hourlyBarEmoji: {
    fontSize: 12,
  },
  hourInsightBox: {
    backgroundColor: '#0c1511',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  hourInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hourInsightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  hourInsightTitleCol: {
    flex: 1,
  },
  hourInsightTimeRange: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '800',
  },
  hourInsightRisk: {
    fontSize: 11,
    fontWeight: '700',
  },
  hourInsightPeriodTitle: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  hourInsightTip: {
    color: '#8aa395',
    fontSize: 12,
    lineHeight: 17,
  },

  // Impulse Awareness Journal Styles
  triggerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  triggerXpHint: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
  },
  triggerSubText: {
    color: '#8aa395',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  triggerPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  triggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111d17',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  triggerPillSelected: {
    borderColor: '#38d39f',
    backgroundColor: '#15281f',
  },
  triggerPillIcon: {
    fontSize: 15,
    marginRight: 6,
  },
  triggerPillLabel: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  triggerPillLabelSelected: {
    color: '#f1f5f3',
  },
  triggerCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  triggerCountBadgeText: {
    color: '#657e71',
    fontSize: 10,
    fontWeight: '800',
  },
  triggerAdviceCard: {
    backgroundColor: '#0c1511',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.25)',
  },
  triggerAdviceEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  triggerAdviceBody: {
    color: '#d1fae5',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },

  // Stroop Modal Game Styles
  stroopContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  stroopRoundEyebrow: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  stroopInstruction: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  stroopHighlight: {
    color: '#22d3ee',
    fontWeight: '900',
  },
  stroopWordCard: {
    width: '100%',
    backgroundColor: '#090e0c',
    borderRadius: 18,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  stroopWordText: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 4,
  },
  stroopFeedbackText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  stroopButtonsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  stroopChoiceBtn: {
    width: '48%',
    backgroundColor: '#111d17',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  stroopColorSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  stroopChoiceText: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '800',
  },
  stroopSuccessCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  stroopSuccessIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  stroopSuccessTitle: {
    color: '#f1f5f3',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 6,
  },
  stroopSuccessDesc: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  stroopXpBadge: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38d39f',
    marginBottom: 16,
  },
  stroopXpBadgeText: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '900',
  },
  stroopCompleteBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  stroopCompleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  safeArea: { flex: 1, backgroundColor: '#000000' },
  mainContainer: { flex: 1, backgroundColor: '#000000' },
  mainAnimatedContainer: { flex: 1 },
  tabContentScreen: {
    flex: 1,
  },
  tabContentHidden: {
    display: 'none',
  },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 115 },

  // Visual Assets & Banner Styles
  introContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  introTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  introBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  introBrandName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  introSkipPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: '#0b0e0c',
  },
  introSkipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  introPager: {
    flex: 1,
  },
  introSlideContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  introCardWrap: {
    backgroundColor: '#0b0e0c',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1a211d',
    overflow: 'hidden',
  },
  introHeroSlideImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
  },
  introSlideBody: {
    padding: 18,
  },
  introEyebrowBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    marginBottom: 8,
  },
  introEyebrowText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  introSlideTitle: {
    color: '#f1f5f3',
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 29,
    marginBottom: 8,
  },
  introSlideSubtitle: {
    color: '#8aa395',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  introChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  introFeatureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  introChipText: {
    color: '#e1e9e4',
    fontSize: 12,
    fontWeight: '600',
  },
  introBottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  introNavSide: {
    width: 80,
    alignItems: 'center',
  },
  introPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  introPaginationDot: {
    height: 8,
    borderRadius: 4,
  },
  introPaginationDotActive: {
    width: 22,
  },
  introPaginationDotInactive: {
    width: 8,
    backgroundColor: '#222824',
  },
  introBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  introBackText: {
    color: '#8aa395',
    fontSize: 14,
    fontWeight: '600',
  },
  introNextButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  introNextButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  introSegmentedRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  introSegmentItem: {
    flex: 1,
  },
  introSegmentBar: {
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  introSegmentLabel: {
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  introInteractiveSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  introSectionMiniTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  introGoalRow: {
    flexDirection: 'row',
    gap: 8,
  },
  introGoalOptionCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  introGoalOptionIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  introGoalOptionCap: {
    color: '#f1f5f3',
    fontSize: 18,
    fontWeight: '900',
  },
  introGoalOptionLabel: {
    color: '#e1e9e4',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  introGoalOptionSub: {
    color: '#8aa395',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },
  introHudSimulatorCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  introHudSimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  introHudSimTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  introHudSimBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  introHudSimBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  introHudSimStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#050706',
    borderRadius: 12,
    marginBottom: 10,
  },
  introHudPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(10, 15, 12, 0.95)',
  },
  introHudPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  introHudPillText: {
    color: '#f1f5f3',
    fontSize: 12,
    fontWeight: '700',
  },
  introHudPillCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  introHudPillCounterVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  introSimulateSwipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  introSimulateSwipeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  introSimulateHelpText: {
    color: '#8aa395',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  introShieldsBox: {
    marginTop: 12,
    marginBottom: 12,
  },
  introShieldRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  introShieldCol: {
    flex: 1,
  },
  introShieldTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  introShieldTitle: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '700',
  },
  introShieldActiveTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  introShieldActiveTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  introShieldDesc: {
    color: '#8aa395',
    fontSize: 11,
    lineHeight: 16,
  },
  introShieldRowSpaced: {
    marginTop: 10,
  },
  introShieldTagActive: {
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  introShieldTagIdle: {
    backgroundColor: '#1a1f1c',
  },
  introShieldTagTextActive: {
    color: '#38d39f',
  },
  introShieldTagTextIdle: {
    color: '#64748b',
  },
  introSegmentBarActive: {
    backgroundColor: '#38d39f',
  },
  introSegmentLabelActive: {
    fontWeight: '800',
  },
  introSegmentLabelInactive: {
    color: '#5c7266',
    fontWeight: '600',
  },
  introSetupGuideCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
    marginBottom: 12,
  },
  introSetupGuideHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  introSetupStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  introSetupStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introSetupStepNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  introSetupStepText: {
    color: '#8aa395',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  introCelebrationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  introCelebrationCol: {
    flex: 1,
  },
  introCelebrationTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  introCelebrationSub: {
    color: '#a3b8ac',
    fontSize: 11,
    lineHeight: 15,
  },
  brandMascotWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introHeaderMascot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  introBrandMascotSub: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: -2,
  },
  introMascotWelcomeHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 14,
    gap: 14,
  },
  introMascotHeroLarge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  introMascotWelcomeTextWrap: {
    flex: 1,
  },
  introMascotBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  introMascotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  introMascotWelcomeTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  introMascotWelcomeDesc: {
    color: '#8aa395',
    fontSize: 12,
    lineHeight: 17,
  },
  introMascotCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginVertical: 10,
  },
  introMascotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  introMascotAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    position: 'relative',
  },
  introMascotAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  introMascotStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0b0e0c',
  },
  introMascotSpeechWrap: {
    flex: 1,
  },
  introMascotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  introMascotName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  introMascotPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  introMascotPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  introMascotSpeech: {
    color: '#d1ded7',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  introCelebrationMascot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 211, 159, 0.4)',
  },

  introHeroIllustration: {
    width: '100%',
    height: 210,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    backgroundColor: '#000000',
  },
  introCardWithImage: {
    backgroundColor: '#0b0b0b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    overflow: 'hidden',
    marginBottom: 14,
  },
  introFeatureVisual: {
    width: '100%',
    height: 160,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1d1d1d',
  },
  dashboardHeroBanner: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    backgroundColor: '#000000',
  },
  brandBadgeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },
  brandBadgeWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 8,
  },
  iconBadgePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
  connectedCheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Dashboard Header
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadgeEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  appHeaderTitle: {
    color: '#f1f5f3',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  greetingText: {
    color: '#a3b8ac',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  greetingTip: {
    color: '#6e8579',
    fontWeight: '400',
  },
  servicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  servicePillActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  servicePillInactive: {
    backgroundColor: '#1b2420',
    borderColor: '#374740',
  },
  serviceDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  serviceDotActive: {
    backgroundColor: '#34c759',
  },
  serviceDotInactive: {
    backgroundColor: '#7a8e84',
  },
  servicePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  servicePillTextActive: {
    color: '#4cd964',
  },
  servicePillTextInactive: {
    color: '#8aa395',
  },

  dashboardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardHudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dashboardHudPillActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
  },
  dashboardHudPillInactive: {
    backgroundColor: '#1b2420',
    borderColor: '#374740',
  },
  dashboardHudPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dashboardCompassStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  dashboardCompassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  dashboardCompassIcon: {
    fontSize: 20,
  },
  dashboardCompassEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dashboardCompassTitle: {
    color: '#e0ece4',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  dashboardCompassContent: {
    flex: 1,
  },
  dashboardZenBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  dashboardZenBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  focusSoundscapeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  focusSoundscapeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  focusSoundscapeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  focusSoundscapeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  focusSoundscapeBtnActive: {},
  focusSoundscapeBtnIdle: {},
  focusSoundscapeBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroTargetStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  heroStepperBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroStepperBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  heroTargetPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#0e1511',
    borderWidth: 1,
    borderColor: '#1d2720',
  },
  heroTargetPillLabel: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTargetPillVal: {
    fontWeight: '800',
  },
  heroMindfulInsightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
  },
  heroMindfulInsightIcon: {
    fontSize: 18,
  },
  heroMindfulInsightText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
    fontWeight: '600',
  },

  // Dashboard Shortcuts Row
  dashboardShortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  dashboardShortcutCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0c120f',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  dashboardShortcutTitle: {
    color: '#e1e9e4',
    fontSize: 12,
    fontWeight: '700',
  },

  // Focus Banner
  activeFocusBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFocusBannerIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  activeFocusBannerCol: {
    flex: 1,
  },
  activeFocusBannerTitle: {
    color: '#f87171',
    fontSize: 14,
    fontWeight: '700',
  },
  activeFocusBannerSubtitle: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
  activeFocusBannerAction: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },

  // Hero Counter Card
  heroCard: {
    backgroundColor: '#0b0b0b',
    borderColor: '#1d1d1d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCardOverLimit: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: '#1a1414',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTopActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zenPauseButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.35)',
    marginRight: 8,
  },
  zenPauseButtonText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '700',
  },
  habitPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  habitPillSafe: {
    backgroundColor: 'rgba(56, 211, 159, 0.1)',
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  habitPillWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  habitPillDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  habitPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  habitPillTextSafe: { color: '#38d39f' },
  habitPillTextWarning: { color: '#fbbf24' },
  habitPillTextDanger: { color: '#f87171' },

  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1a2b22',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#294335',
  },
  resetButtonText: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '600',
  },

  // Circular / Concentric Ring Visual Center
  circularMetricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  circularRingHalo: {
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  circularRingInner: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  heroCount: {
    color: '#f1f5f3',
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 58,
  },
  heroCountOverLimit: {
    color: '#f87171',
  },
  heroUnitLabel: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  heroGoalSubtext: {
    color: '#6e8579',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },

  // Dopamine Risk Gauge
  riskGaugeContainer: {
    marginTop: 8,
  },
  riskGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  riskGaugeLabel: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  riskGaugeStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textSafe: { color: '#38d39f' },
  textWarning: { color: '#fbbf24' },
  textDanger: { color: '#f87171' },

  riskTrack: {
    height: 9,
    backgroundColor: '#1b2d24',
    borderRadius: 5,
    overflow: 'hidden',
  },
  riskFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressBarNormal: {
    backgroundColor: '#38d39f',
  },
  progressBarWarning: {
    backgroundColor: '#fbbf24',
  },
  progressBarDanger: {
    backgroundColor: '#ef4444',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressPercentText: {
    color: '#a3b8ac',
    fontSize: 12,
    fontWeight: '600',
  },
  progressRemainingText: {
    color: '#7a9184',
    fontSize: 12,
    fontWeight: '500',
  },

  // 4-Stat Quick Grid inside Hero Card
  heroStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162720',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.1)',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatIcon: {
    fontSize: 15,
    marginBottom: 2,
  },
  heroStatValue: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#6e8579',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  heroStatDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#233a2e',
  },

  quickFocusActionBtn: {
    marginTop: 14,
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
    borderColor: 'rgba(56, 211, 159, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFocusActionText: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
  },

  // 7-Day History Chart
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chartSubtitle: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
  },
  chartAvgBadge: {
    backgroundColor: '#1b2d24',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2b4437',
  },
  chartAvgBadgeText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 125,
    paddingTop: 10,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
  },
  barCountText: {
    color: '#6e8579',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    minHeight: 14,
  },
  barCountTextSelected: {
    color: '#22d3ee',
    fontWeight: '900',
  },
  barTrack: {
    width: 22,
    height: 76,
    backgroundColor: '#1a2c23',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barTrackSelected: {
    borderWidth: 1,
    borderColor: '#22d3ee',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 7,
  },
  barFillToday: {
    backgroundColor: '#22d3ee',
  },
  barFillLimit: {
    backgroundColor: '#ef4444',
  },
  barPlaceholderFill: {
    height: '8%',
  },
  barLabel: {
    color: '#5b7367',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  barLabelToday: {
    color: '#22d3ee',
    fontWeight: '800',
  },
  barLabelSelected: {
    color: '#22d3ee',
  },

  dayInsightCard: {
    marginTop: 14,
    backgroundColor: '#162720',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
  },
  dayInsightTitle: {
    color: '#22d3ee',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  dayInsightBody: {
    color: '#a3b8ac',
    fontSize: 12,
    lineHeight: 17,
  },
  highlightText: {
    color: '#f1f5f3',
    fontWeight: '700',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#0b0b0b',
    borderColor: '#1d1d1d',
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderWithAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardSectionTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSelectedHighlight: {
    color: '#38d39f',
    fontSize: 13,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#6e8579',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },

  // Platform Cards
  platformCard: {
    backgroundColor: '#0f0f0f',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },
  platformCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformExpandedSection: {
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
  },
  platformQuotaAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },
  platformQuotaAdjustLabel: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '600',
  },
  platformQuotaStepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  platformQuotaStepBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  platformQuotaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  platformQuotaBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  weeklyRhythmSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  weeklySummaryEmoji: {
    fontSize: 20,
  },
  weeklySummaryCol: {
    flex: 1,
  },
  weeklySummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  weeklySummarySubtitle: {
    color: '#a3b8ac',
    fontSize: 11,
    lineHeight: 15,
  },
  platformActionPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  platformMicroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  platformMicroActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  platformIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  platformIconEmoji: {
    fontSize: 20,
  },
  platformDetailsCol: {
    flex: 1,
  },
  platformTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '700',
  },
  platformCountText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '800',
  },
  platformTrack: {
    height: 7,
    backgroundColor: '#1f342a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  platformFill: {
    height: '100%',
    borderRadius: 4,
  },
  platformMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  platformTimeEstimate: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '500',
  },
  platformShareText: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '600',
  },

  igCircle: { backgroundColor: '#381c2b' },
  igFill: { backgroundColor: '#e1306c' },
  ttCircle: { backgroundColor: '#16333c' },
  ttFill: { backgroundColor: '#06b6d4' },
  ytCircle: { backgroundColor: '#381d1d' },
  ytFill: { backgroundColor: '#ef4444' },
  scCircle: { backgroundColor: '#3b3a1a' },
  scFill: { backgroundColor: '#eab308' },

  // Tip Card
  tipCard: {
    backgroundColor: '#12231b',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tipTitleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  tipTitle: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 19,
  },

  // Timers & Limits Screen
  tabScreenTitle: {
    color: '#f1f5f3',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  tabScreenSubtitle: {
    color: '#6e8579',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pillButton: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    backgroundColor: '#182b22',
    borderRadius: 12,
    alignItems: 'center',
    borderColor: '#243e31',
    borderWidth: 1,
  },
  pillButtonSelected: {
    backgroundColor: '#38d39f',
    borderColor: '#38d39f',
  },
  pillButtonText: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '700',
  },
  pillButtonTextSelected: {
    color: '#090e0c',
    fontWeight: '900',
  },

  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#162720',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepperBtn: {
    backgroundColor: '#1f382c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a4d3c',
  },
  stepperBtnText: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '700',
  },
  stepperLabel: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '600',
  },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    borderBottomWidth: 1,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleSubtitle: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  appLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 10,
    borderWidth: 1,
  },
  badgeBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  badgeNormal: {
    backgroundColor: '#182b22',
    borderColor: '#284336',
  },
  statusBadgeSmallText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textBlocked: { color: '#f87171' },
  textNormal: { color: '#6e8579' },

  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#20342a',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: '#38d39f',
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f1f5f3',
  },
  switchThumbOn: {
    alignSelf: 'flex-end',
  },

  // Focus Mode Screen
  focusHeroCard: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.2)',
    borderWidth: 1,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  focusHeroCardActive: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: '#1a1414',
  },
  focusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  focusHeroTitle: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  focusLiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  focusLiveBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  focusLiveBadgeIdle: {
    backgroundColor: '#172720',
    borderColor: '#263d33',
  },
  focusLiveBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  focusLiveBadgeTextActive: { color: '#f87171' },
  focusLiveBadgeTextIdle: { color: '#6e8579' },

  focusTimerText: {
    color: '#f1f5f3',
    fontSize: 58,
    fontWeight: '900',
    marginVertical: 12,
    letterSpacing: 1,
  },
  focusHeroSubtitle: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#182b22',
    borderRadius: 10,
    marginHorizontal: 4,
    borderColor: '#263f33',
    borderWidth: 1,
  },
  presetBtnActive: {
    backgroundColor: '#38d39f',
    borderColor: '#38d39f',
  },
  presetBtnText: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '700',
  },
  presetBtnTextActive: {
    color: '#090e0c',
    fontWeight: '900',
  },
  focusButtonsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 14,
  },
  focusActionButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  focusStartButton: {
    backgroundColor: '#38d39f',
  },
  focusStopButton: {
    backgroundColor: '#ef4444',
  },
  focusActionButtonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
  },
  focusResetButton: {
    flex: 1,
    backgroundColor: '#1a2e24',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#294537',
  },
  focusResetButtonText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '600',
  },

  quickSelectRow: {
    flexDirection: 'row',
  },
  quickSelectBtn: {
    backgroundColor: '#1a2e24',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#294335',
  },
  quickSelectBtnText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },

  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15251e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.2)',
  },
  masterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterToggleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  masterToggleTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '700',
  },

  // Settings Screen
  healthList: {
    marginTop: 10,
    marginBottom: 14,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  healthIcon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 2,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '700',
  },
  healthDesc: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsActionBtn: {
    backgroundColor: '#38d39f',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  settingsActionBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  privacyShieldIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryOutlineBtn: {
    borderColor: '#243a2f',
    borderWidth: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryOutlineBtnText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerOutlineBtn: {
    marginTop: 12,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  dangerOutlineBtnText: {
    color: '#f87171',
    fontWeight: '700',
  },
  footerCol: {
    alignItems: 'center',
    marginVertical: 18,
  },
  footerVersion: {
    color: '#4e6258',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerTagline: {
    color: '#3c4c44',
    fontSize: 11,
    marginTop: 3,
  },

  // Liquid Glass Pill Dock Styles
  liquidDockWrap: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    alignItems: 'center',
    zIndex: 99,
  },
  liquidDockGlowBackdrop: {
    position: 'absolute',
    top: -4,
    bottom: -4,
    left: 0,
    borderRadius: 38,
    borderWidth: 0,
    opacity: 0.45,
  },
  liquidDockPill: {
    width: '100%',
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(11, 17, 13, 0.86)',
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 22,
    elevation: 20,
  },
  dockSpecularHighlight: {
    position: 'absolute',
    top: 0,
    left: 28,
    right: 28,
    height: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 1,
  },
  dockUpperSheen: {
    position: 'absolute',
    top: 1,
    left: 12,
    right: 12,
    height: 30,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.045)',
  },
  liquidSliderPill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    borderRadius: 29,
    borderWidth: 1.2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  liquidSliderInnerShine: {
    position: 'absolute',
    top: 1.5,
    left: 10,
    right: 10,
    height: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  dockTabItem: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dockIconContainer: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockTabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dockTabLabelActive: {
    fontWeight: '800',
  },
  dockTabLabelHovered: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dockTabLabelInactive: {
    fontWeight: '600',
  },
  dockActiveDroplet: {
    position: 'absolute',
    bottom: 3,
    alignSelf: 'center',
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  // Floating Scrub Tooltip Capsule Styles
  dockScrubTooltip: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 16,
    zIndex: 100,
  },
  dockTooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dockTooltipIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockTooltipTextWrap: {
    maxWidth: 200,
  },
  dockTooltipTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dockTooltipSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  dockTooltipArrow: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },

  // Micro Status Badges on Dock Tabs
  dockMicroBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 7,
    borderWidth: 1,
  },
  dockMicroBadgeDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  dockMicroBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
  },
  dockMicroBadgeTextDanger: {
    color: '#ef4444',
  },
  dockMicroDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dockMicroDotOverLimit: {
    backgroundColor: '#ef4444',
  },
  dockMicroDotNearLimit: {
    backgroundColor: '#f59e0b',
  },
  dockMicroShieldActiveBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: 7,
  },
  dockMicroShieldActiveText: {
    color: '#ef4444',
    fontSize: 8,
    fontWeight: '900',
  },

  // Full-screen backdrop to dismiss quick action menu
  dockBackdropDismiss: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 98,
  },

  // Long-press Quick Action Floating Hub
  dockQuickActionMenu: {
    position: 'absolute',
    bottom: 84,
    borderRadius: 22,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 20,
    zIndex: 105,
    minWidth: 290,
  },
  dockQuickActionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dockQuickActionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dockQuickActionCloseBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dockQuickActionCloseText: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '800',
  },
  dockQuickActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  dockQuickActionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockQuickActionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Optical Shimmer Beam
  dockShimmerBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  // Touch Ripple Wave
  dockTouchRipple: {
    position: 'absolute',
    left: -25,
    top: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
  },

  // Active Icon Glow Ring
  dockActiveIconGlowRing: {
    position: 'absolute',
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  // Legacy Tab Bar aliases for backwards compatibility
  tabBar: {
    display: 'none',
  },
  tabItem: {
    display: 'none',
  },
  tabItemActive: {},
  tabIcon: {},
  tabLabel: {},
  tabLabelActive: {},

  // Intro Screen Styles
  introHeader: {
    alignItems: 'center',
    marginVertical: 18,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#172c21',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.3)',
  },
  logoBadgeText: {
    fontSize: 32,
  },
  eyebrow: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#f1f5f3',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 34,
  },
  introSummary: {
    color: '#8aa395',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    paddingHorizontal: 6,
  },
  onboardingHighlights: {
    backgroundColor: '#111d17',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(56, 211, 159, 0.12)',
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  highlightIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  highlightInfo: {
    flex: 1,
  },
  highlightTitle: {
    color: '#f1f5f3',
    fontSize: 14,
    fontWeight: '700',
  },
  highlightDesc: {
    color: '#6e8579',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  statusSection: {
    backgroundColor: '#111d17',
    borderColor: 'rgba(56, 211, 159, 0.12)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: { color: '#f1f5f3', fontSize: 17, fontWeight: '700' },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderColor: 'rgba(52, 199, 89, 0.4)',
    borderWidth: 1,
  },
  statusBadgeInactive: {
    backgroundColor: '#19241f',
    borderColor: '#303f37',
    borderWidth: 1,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  statusBadgeTextActive: { color: '#4cd964' },
  statusBadgeTextInactive: { color: '#8aa395' },
  body: { color: '#9cb1a6', fontSize: 14, lineHeight: 21, marginTop: 8 },
  statusHint: { color: '#5b7367', fontSize: 12, lineHeight: 17, marginTop: 8 },
  connectedCard: {
    backgroundColor: '#0f2319',
    borderColor: 'rgba(56, 211, 159, 0.45)',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  connectedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  connectedCheckBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#38d39f',
    color: '#090e0c',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: 10,
  },
  connectedHeaderTextWrap: {
    flex: 1,
  },
  connectedHeaderTitle: {
    color: '#f1f5f3',
    fontSize: 16,
    fontWeight: '800',
  },
  connectedHeaderSubtitle: {
    color: '#9cb1a6',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  primaryLaunchButton: {
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLaunchButtonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 10,
    minHeight: 48,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#38d39f',
    borderRadius: 6,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
    width: 24,
  },
  checkboxChecked: { backgroundColor: '#38d39f' },
  checkmark: {
    color: '#090e0c',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 19,
  },
  consentText: { color: '#d0dbd3', flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    alignItems: 'center',
    backgroundColor: '#38d39f',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  buttonDisabled: { backgroundColor: '#1d2e25' },
  buttonConsentActive: {},
  buttonConsentDisabled: {
    backgroundColor: '#141414',
    borderColor: '#222222',
  },
  buttonText: {
    color: '#090e0c',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonTextConsentActive: {},
  buttonTextConsentDisabled: {
    color: '#666666',
  },
  settingsHint: {
    color: '#5b7367',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
    textAlign: 'center',
  },
  error: { color: '#f87171', fontSize: 13, lineHeight: 18, marginTop: 10 },
  enterDashboardButton: {
    alignItems: 'center',
    borderColor: 'rgba(56, 211, 159, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 48,
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
  },
  enterDashboardButtonText: {
    color: '#38d39f',
    fontSize: 15,
    fontWeight: '700',
  },

  // Mindful Breathing Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  breatheModalCard: {
    width: '100%',
    backgroundColor: '#111d17',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  breatheModalEyebrow: {
    color: '#22d3ee',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  breatheModalTitle: {
    color: '#f1f5f3',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  breatheModalDesc: {
    color: '#8aa395',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  breatheVisualWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  breatheRingOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breatheRingInhale: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  breatheRingHold: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  breatheRingExhale: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.08)',
  },
  breatheRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathePhaseText: {
    color: '#f1f5f3',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  breatheCycleCount: {
    color: '#9cb1a6',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  breatheRemainingText: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 18,
  },
  breatheCloseBtn: {
    width: '100%',
    paddingVertical: 13,
    backgroundColor: '#1b2d24',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2b473a',
  },
  breatheCloseBtnText: {
    color: '#9cb1a6',
    fontSize: 14,
    fontWeight: '700',
  },

  // Craving SOS Banner Styles
  cravingSosBanner: {
    backgroundColor: '#0c1d15',
    borderColor: 'rgba(56, 211, 159, 0.4)',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  cravingSosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cravingSosBadge: {
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
    borderColor: '#38d39f',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cravingSosBadgeText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cravingSosWaveTag: {
    color: '#7a9e8b',
    fontSize: 12,
    fontWeight: '600',
  },
  cravingSosTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  cravingSosDesc: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 14,
  },
  cravingSosBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cravingSosPrimaryBtn: {
    flex: 1.2,
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cravingSosPrimaryBtnText: {
    color: '#090e0c',
    fontSize: 13,
    fontWeight: '800',
  },
  cravingSosSecondaryBtn: {
    flex: 1,
    backgroundColor: '#16281f',
    borderColor: 'rgba(56, 211, 159, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cravingSosSecondaryBtnText: {
    color: '#c2d4cb',
    fontSize: 12,
    fontWeight: '700',
  },

  // Life Reclaimed Equivalents Grid
  lifeReclaimedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  lifeReclaimedCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#0d1813',
    borderColor: 'rgba(56, 211, 159, 0.12)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  lifeReclaimedIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  lifeReclaimedValue: {
    color: '#38d39f',
    fontSize: 16,
    fontWeight: '800',
  },
  lifeReclaimedLabel: {
    color: '#7a9e8b',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },

  // Chrono-Shield Styles
  chronoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chronoIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  chronoTitleWrap: {
    flex: 1,
  },
  chronoBadgeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  chronoLevelBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  chronoTitle: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '800',
  },
  chronoAdviceText: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 18,
  },

  // Milestones & Badges
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  milestoneBadgeCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  milestoneUnlocked: {
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    borderColor: 'rgba(56, 211, 159, 0.35)',
  },
  milestoneLocked: {
    backgroundColor: '#0e1613',
    borderColor: '#1e2d25',
    opacity: 0.6,
  },
  milestoneIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  milestoneNameUnlocked: {
    color: '#f1f5f3',
  },
  milestoneNameLocked: {
    color: '#7a9e8b',
  },
  milestoneDesc: {
    color: '#6e8579',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8,
  },
  milestoneStatusTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  milestoneStatusTagUnlocked: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
  },
  milestoneStatusTagLocked: {
    backgroundColor: '#1b2821',
  },
  milestoneStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  milestoneStatusTextUnlocked: {
    color: '#38d39f',
  },
  milestoneStatusTextLocked: {
    color: '#6e8579',
  },

  // HUD Style Selector
  hudStyleSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  hudStyleCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  hudStyleCardSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.1)',
  },
  hudStyleIcon: {
    fontSize: 15,
    color: '#38d39f',
    fontWeight: '800',
    marginBottom: 4,
  },
  hudStyleLabel: {
    color: '#9cb1a6',
    fontSize: 12,
    fontWeight: '700',
  },
  hudStyleLabelSelected: {
    color: '#f1f5f3',
  },
  hudStyleDesc: {
    color: '#6e8579',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },

  // Craving Modal Switcher & Tools
  modalTabRow: {
    flexDirection: 'row',
    backgroundColor: '#090e0c',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    width: '100%',
  },
  modalTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modalTabBtnActive: {
    backgroundColor: '#1b2d24',
    borderWidth: 1,
  },
  modalTabBtnText: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '700',
  },
  modalTabBtnTextActive: {
    color: '#38d39f',
  },
  cravingContentWrap: {
    width: '100%',
    alignItems: 'center',
  },
  delayVisualWrap: {
    marginVertical: 16,
    alignItems: 'center',
  },
  delayTimerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  delaySecondsText: {
    color: '#f1f5f3',
    fontSize: 36,
    fontWeight: '900',
  },
  delaySublabel: {
    color: '#7a9e8b',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  delayStageText: {
    color: '#c2d4cb',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  delayActionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 16,
  },
  delayActionBtn: {
    flex: 1,
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  delayActionBtnActive: {
    backgroundColor: '#eab308',
  },
  delayActionBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },
  delayResetBtn: {
    backgroundColor: '#16281f',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#263d30',
  },
  delayResetBtnText: {
    color: '#9cb1a6',
    fontSize: 13,
    fontWeight: '700',
  },
  groundingCard: {
    width: '100%',
    backgroundColor: '#0d1813',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginVertical: 14,
  },
  groundingBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  groundingSenseTag: {
    backgroundColor: 'rgba(56, 211, 159, 0.2)',
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '800',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groundingStepCount: {
    color: '#6e8579',
    fontSize: 12,
    fontWeight: '700',
  },
  groundingTitle: {
    color: '#f1f5f3',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  groundingPrompt: {
    color: '#9cb1a6',
    fontSize: 13,
    lineHeight: 19,
  },
  groundingNextBtn: {
    width: '100%',
    backgroundColor: '#38d39f',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  groundingNextBtnText: {
    color: '#090e0c',
    fontSize: 14,
    fontWeight: '800',
  },

  // Daily Intention Anchor
  intentionCard: {
    backgroundColor: '#0c1a14',
    borderColor: 'rgba(56, 211, 159, 0.25)',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  intentionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  intentionEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  intentionTag: {
    color: '#6e8579',
    fontSize: 11,
    fontWeight: '600',
  },
  intentionText: {
    color: '#f1f5f3',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  intentionPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  intentionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12221b',
    borderColor: '#23382d',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  intentionPillSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
  },
  intentionPillIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  intentionPillText: {
    color: '#8aa395',
    fontSize: 12,
    fontWeight: '700',
  },
  intentionPillTextSelected: {
    color: '#38d39f',
  },

  // Digital Wellbeing Vitality Score
  vitalityCard: {
    backgroundColor: '#0f2319',
    borderColor: 'rgba(56, 211, 159, 0.35)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vitalityLeftCol: {
    flex: 1,
  },
  vitalityEyebrow: {
    color: '#38d39f',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  vitalityScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  vitalityScoreNum: {
    color: '#f1f5f3',
    fontSize: 32,
    fontWeight: '900',
  },
  vitalityScoreMax: {
    color: '#6e8579',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 4,
  },
  vitalityStatusText: {
    color: '#9cb1a6',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  vitalityRingWrap: {
    marginLeft: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalityMiniRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalityRingHigh: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.15)',
  },
  vitalityRingMed: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  vitalityRingLow: {
    borderColor: '#f87171',
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  vitalityRingIcon: {
    fontSize: 22,
  },

  // Daily Mood Check-In
  moodGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  moodCardSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  moodIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  moodLabelSelected: {
    color: '#38d39f',
  },
  moodTipBox: {
    backgroundColor: 'rgba(56, 211, 159, 0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38d39f',
  },
  moodTipText: {
    color: '#c2d4cb',
    fontSize: 12,
    lineHeight: 16,
  },

  // 24-Hour Sabbath
  sabbathCardActive: {
    borderColor: 'rgba(248, 113, 113, 0.4)',
    backgroundColor: '#1a0f12',
  },
  sabbathBtn: {
    backgroundColor: '#1b2d24',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2b473a',
  },
  sabbathBtnActive: {
    backgroundColor: '#7f1d1d',
    borderColor: '#f87171',
  },
  sabbathBtnText: {
    color: '#38d39f',
    fontSize: 14,
    fontWeight: '800',
  },
  sabbathBtnTextActive: {
    color: '#fee2e2',
  },

  // Focus Soundscapes
  soundscapeToggleBtn: {
    backgroundColor: '#1a2c22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2d4a3b',
  },
  soundscapeToggleBtnText: {
    color: '#38d39f',
    fontSize: 12,
    fontWeight: '700',
  },
  soundscapeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  soundscapeCard: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  soundscapeCardActive: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  soundscapeIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  soundscapeName: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  soundscapeNameActive: {
    color: '#38d39f',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#0a1410',
    borderRadius: 10,
    borderWidth: 1,
  },
  eqBar: {
    width: 4,
    backgroundColor: '#38d39f',
    borderRadius: 2,
    marginRight: 4,
  },
  eqBar1: { height: 14 },
  eqBar2: { height: 22 },
  eqBar3: { height: 18 },
  eqBar4: { height: 12 },
  eqLabel: {
    color: '#7a9e8b',
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '600',
  },

  // Sanctuary Theme Atmosphere Showcase
  themeShowcaseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 14,
  },
  themeShowcaseCard: {
    width: '48.2%',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 13,
    justifyContent: 'space-between',
  },
  themeShowcaseCardSelected: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  themeCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  themeCardIconHalo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardSwatchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeSwatchDotPrimary: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeSwatchDotDark: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  themeCardMetaCol: {
    marginBottom: 10,
  },
  themeCardTitle: {
    color: '#f1f5f3',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  themeCardTagline: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  themeCardStatusPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeCardStatusPillSelected: {},
  themeCardStatusPillIdle: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  themeCardStatusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  themeCardStatusTextSelected: {},
  themeCardStatusTextIdle: {
    color: '#64748b',
  },
  activeThemeBadgePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeThemeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Legacy Theme Palette Chips
  themePaletteRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  themeChip: {
    flex: 1,
    backgroundColor: '#0d1813',
    borderColor: '#1d2c23',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  themeChipSelected: {
    borderColor: '#38d39f',
    backgroundColor: 'rgba(56, 211, 159, 0.12)',
  },
  themeChipIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  themeChipName: {
    color: '#8aa395',
    fontSize: 11,
    fontWeight: '700',
  },
  themeChipNameSelected: {
    color: '#f1f5f3',
  },

  // In-Feed Neuro-Interventions Styles
  neuroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  neuroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  neuroIconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  neuroTitleCol: {
    flex: 1,
  },
  neuroEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  neuroTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  neuroDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  neuroItemCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  neuroItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  neuroItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  neuroItemTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  neuroItemDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  neuroModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  neuroModeChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuroModeChipActive: {},
  neuroModeText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  neuroModeTextActive: {},
  neuroActionBtn: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  neuroActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  neuroStatRow: {
    marginBottom: 10,
  },
  neuroStatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  neuroStatBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  realityRatioBox: {
    marginBottom: 10,
  },
  realityRatioBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  realityRatioNourishFill: {
    height: '100%',
    backgroundColor: '#38d39f',
  },
  realityRatioDrainFill: {
    height: '100%',
    backgroundColor: '#fb7185',
  },
  realityRatioLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  realityRatioNourishText: {
    color: '#38d39f',
    fontSize: 11,
    fontWeight: '700',
  },
  realityRatioDrainText: {
    color: '#fb7185',
    fontSize: 11,
    fontWeight: '700',
  },
  realityInsightCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  realityInsightText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Morning Alignment Launcher
  morningLauncherCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  morningLauncherRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  morningAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginRight: 12,
  },
  morningAvatarThumb: {
    width: '100%',
    height: '100%',
  },
  morningLauncherCol: {
    flex: 1,
  },
  morningLauncherEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  morningLauncherEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  morningLauncherBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  morningLauncherBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  morningLauncherTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    marginBottom: 2,
  },
  morningLauncherSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  morningLauncherActionBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morningLauncherActionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Mascot Floating HUD Adaptive Simulator
  mascotHudCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  mascotExpressionBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  mascotExpressionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mascotHudStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#0a0a0f',
    borderRadius: 14,
    marginBottom: 12,
  },
  mascotHudPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12111a',
    borderRadius: 26,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 12,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  mascotHudAvatarRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  mascotHudAvatarImg: {
    width: '100%',
    height: '100%',
  },
  mascotHudPillTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mascotHudPillTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  mascotHudPillCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  mascotCoachingCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  mascotCoachingDesc: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
  mascotStateBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mascotStateBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotStateBtnActive: {},
  mascotStateBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  mascotStateBtnTextActive: {},

  // Home Screen Widget Showcase
  widgetShowcaseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  widgetBoxPreview: {
    backgroundColor: '#0e0e14',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 10,
  },
  widgetBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  widgetMascotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  widgetAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  widgetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  widgetTitleCol: {
    justifyContent: 'center',
  },
  widgetBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  widgetBoxMood: {
    color: '#94a3b8',
    fontSize: 11,
  },
  widgetAllowanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  widgetAllowanceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  widgetCounterRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  widgetBigCount: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '800',
  },
  widgetLimitLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  widgetSprintBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetSprintBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  widgetInstructionsText: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },

  // Modals Styles
  morningCard: {
    width: '88%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  morningAvatarHero: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 14,
  },
  morningAvatarImg: {
    width: '100%',
    height: '100%',
  },
  morningBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  morningBadgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  morningTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  morningHighlight: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  morningDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  morningProgressWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 18,
  },
  morningProgressBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    marginBottom: 6,
  },
  morningProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  morningCountdownText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  morningActionBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morningActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // Reality Check Modal
  realityCheckModalCard: {
    width: '88%',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 22,
    elevation: 20,
  },
  realityModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  realityModalAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  realityModalAvatarImg: {
    width: '100%',
    height: '100%',
  },
  realityModalEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  realityModalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  realityModalQuestion: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  realityBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  realityBtnNourish: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  realityBtnDrain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  realityBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  realityModalDismissBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  realityModalDismissText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  // Conscious Exit Modal
  consciousExitModalCard: {
    width: '88%',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    elevation: 20,
  },
  consciousExitAvatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 12,
  },
  consciousExitAvatarImg: {
    width: '100%',
    height: '100%',
  },
  consciousExitEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  consciousExitTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  consciousExitDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  consciousExitTimerWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  consciousExitCountdownBig: {
    fontSize: 36,
    fontWeight: '900',
  },
  consciousExitRemainingLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  consciousExitProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1e293b',
    overflow: 'hidden',
    marginBottom: 18,
  },
  consciousExitProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  consciousExitCompleteBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consciousExitCompleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});

export default App;
