
// src/lib/soundManager.ts

export type SoundType = 
  | 'buttonClick' 
  | 'taskComplete' 
  | 'levelUp' 
  | 'rivalProvoke' 
  | 'notification'
  | 'pomodoroFocusStart'
  | 'pomodoroBreakStart'
  | 'timerTick'; // Could be used for countdowns if desired

const soundFileMap: Record<SoundType, string> = {
  buttonClick: '/sounds/button-click.mp3',
  taskComplete: '/sounds/task-complete.mp3',
  levelUp: '/sounds/level-up.mp3',
  rivalProvoke: '/sounds/rival-provoke.mp3',
  notification: '/sounds/notification.mp3',
  pomodoroFocusStart: '/sounds/pomodoro-focus-start.mp3',
  pomodoroBreakStart: '/sounds/pomodoro-break-start.mp3',
  timerTick: '/sounds/timer-tick.mp3',
};

let globalSoundEffectsEnabled = true; 
// This will be updated by AppContext based on user settings.
// We initialize it to true here so it doesn't block sounds if AppContext hasn't updated it yet.

export const updateGlobalSoundSetting = (isEnabled: boolean) => {
  globalSoundEffectsEnabled = isEnabled;
};

// Store audio elements to prevent re-creation and allow for potential .pause() or .currentTime = 0 if needed
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};

export const playSound = (soundName: SoundType) => {
  if (typeof window === 'undefined' || !globalSoundEffectsEnabled) {
    return;
  }

  try {
    let audio = audioCache[soundName];
    if (!audio) {
      const filePath = soundFileMap[soundName];
      if (!filePath) {
        console.warn(`Sound file path not found for: ${soundName}`);
        return;
      }
      audio = new Audio(filePath);
      audioCache[soundName] = audio;
    }
    
    // If the sound is already playing, stop it and restart from the beginning
    // This is useful for rapid-fire events like button clicks if they are long
    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }

    audio.play().catch(error => {
      // Autoplay was prevented or other error
      // console.warn(`Error playing sound ${soundName}:`, error.message);
      // This can happen if the user hasn't interacted with the page yet,
      // or if there's an issue with the audio file.
      // We don't want to spam the console for common autoplay issues.
      if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') {
        console.warn(`Error playing sound ${soundName}:`, error);
      }
    });
  } catch (error) {
    console.error(`Failed to play sound ${soundName}:`, error);
  }
};
