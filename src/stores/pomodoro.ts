import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useHomeAssistantStore } from './homeAssistant';
import { useSpotifyStore } from './spotify';

export type PomodoroPhase = 'idle' | 'focus' | 'short_break' | 'long_break';

export const usePomodoroStore = defineStore('pomodoro', () => {
  const haStore = useHomeAssistantStore();

  const SETTINGS_KEY = 'arcdock_pomodoro_settings';

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse pomodoro settings', e);
    }
    return {
      focusDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      automateScenes: false,
      focusSceneEntity: '',
      breakSceneEntity: '',
    };
  };

  const settings = ref(loadSettings());

  const focusDurationMinutes = ref<number>(settings.value.focusDurationMinutes || 25);
  const shortBreakDurationMinutes = ref<number>(settings.value.shortBreakDurationMinutes || 5);
  const longBreakDurationMinutes = ref<number>(settings.value.longBreakDurationMinutes || 15);
  const automateScenes = ref<boolean>(settings.value.automateScenes || false);
  const focusSceneEntity = ref<string>(settings.value.focusSceneEntity || '');
  const breakSceneEntity = ref<string>(settings.value.breakSceneEntity || '');

  const phase = ref<PomodoroPhase>('idle');
  const isRunning = ref<boolean>(false);
  const secondsLeft = ref<number>(focusDurationMinutes.value * 60);
  const totalSeconds = ref<number>(focusDurationMinutes.value * 60);
  const completedSessions = ref<number>(
    parseInt(localStorage.getItem('arcdock_pomodoro_completed_sessions') || '0', 10)
  );

  let timerInterval: number | null = null;

  const saveSettings = () => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          focusDurationMinutes: focusDurationMinutes.value,
          shortBreakDurationMinutes: shortBreakDurationMinutes.value,
          longBreakDurationMinutes: longBreakDurationMinutes.value,
          automateScenes: automateScenes.value,
          focusSceneEntity: focusSceneEntity.value,
          breakSceneEntity: breakSceneEntity.value,
        })
      );
    } catch (e) {
      console.warn('Failed to save pomodoro settings', e);
    }
  };

  // Gentle synthesized web audio chime (warm harmonic bell)
  const playChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.8); // C5
      playTone(659.25, now + 0.15, 0.9); // E5
      playTone(783.99, now + 0.3, 1.2); // G5
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  const triggerHaScene = (targetScene: string) => {
    if (!automateScenes.value || !targetScene || targetScene.trim() === '') return;
    try {
      haStore.activateScene(targetScene.trim());
    } catch (e) {
      console.warn('Failed to trigger HA scene:', e);
    }
  };

  const startTimer = () => {
    if (phase.value === 'idle') {
      phase.value = 'focus';
      secondsLeft.value = focusDurationMinutes.value * 60;
      totalSeconds.value = secondsLeft.value;
      triggerHaScene(focusSceneEntity.value);
    }

    // Pause Spotify playback when focus session begins
    if (phase.value === 'focus') {
      try {
        const spotify = useSpotifyStore();
        if (spotify.isPlaying) {
          spotify.pause();
        }
      } catch (e) {
        console.warn('Could not pause Spotify for Pomodoro:', e);
      }
    }

    isRunning.value = true;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      if (secondsLeft.value > 0) {
        secondsLeft.value--;
      } else {
        handlePhaseComplete();
      }
    }, 1000);
  };

  const pauseTimer = () => {
    isRunning.value = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const togglePlayPause = () => {
    if (isRunning.value) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const handlePhaseComplete = () => {
    pauseTimer();
    playChime();

    if (phase.value === 'focus') {
      completedSessions.value++;
      localStorage.setItem('arcdock_pomodoro_completed_sessions', completedSessions.value.toString());

      // Every 4 focus sessions, take a long break
      if (completedSessions.value % 4 === 0) {
        phase.value = 'long_break';
        secondsLeft.value = longBreakDurationMinutes.value * 60;
      } else {
        phase.value = 'short_break';
        secondsLeft.value = shortBreakDurationMinutes.value * 60;
      }
      totalSeconds.value = secondsLeft.value;
      triggerHaScene(breakSceneEntity.value);
    } else {
      // Break completed -> go back to focus
      phase.value = 'focus';
      secondsLeft.value = focusDurationMinutes.value * 60;
      totalSeconds.value = secondsLeft.value;
      triggerHaScene(focusSceneEntity.value);
    }
  };

  const resetTimer = () => {
    pauseTimer();
    phase.value = 'idle';
    secondsLeft.value = focusDurationMinutes.value * 60;
    totalSeconds.value = secondsLeft.value;
  };

  const skipPhase = () => {
    handlePhaseComplete();
  };

  const setPreset = (focusMin: number, breakMin: number) => {
    pauseTimer();
    focusDurationMinutes.value = focusMin;
    shortBreakDurationMinutes.value = breakMin;
    secondsLeft.value = focusMin * 60;
    totalSeconds.value = secondsLeft.value;
    phase.value = 'idle';
    saveSettings();
  };

  const formattedTime = computed(() => {
    const m = Math.floor(secondsLeft.value / 60);
    const s = secondsLeft.value % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const phaseLabel = computed(() => {
    switch (phase.value) {
      case 'focus':
        return 'Focus Session';
      case 'short_break':
        return 'Short Break';
      case 'long_break':
        return 'Long Break';
      case 'idle':
      default:
        return 'Ready';
    }
  });

  const progressPercent = computed(() => {
    if (totalSeconds.value <= 0) return 0;
    return Math.max(0, Math.min(100, ((totalSeconds.value - secondsLeft.value) / totalSeconds.value) * 100));
  });

  return {
    phase,
    phaseLabel,
    isRunning,
    secondsLeft,
    totalSeconds,
    completedSessions,
    focusDurationMinutes,
    shortBreakDurationMinutes,
    longBreakDurationMinutes,
    automateScenes,
    focusSceneEntity,
    breakSceneEntity,
    formattedTime,
    progressPercent,
    startTimer,
    pauseTimer,
    togglePlayPause,
    resetTimer,
    skipPhase,
    setPreset,
    saveSettings,
  };
});
