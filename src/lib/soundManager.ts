
// src/lib/soundManager.ts

// CAPACITOR_NOTE: For native mobile apps, playing sounds with HTMLAudioElement can sometimes be unreliable
// or have limitations (e.g., background audio, system volume interaction).
// Consider using:
// 1. Capacitor Haptics plugin (@capacitor/haptics) for simple feedback like vibrations for button clicks.
// 2. Capacitor Local Notifications plugin (@capacitor/local-notifications) can play a sound with a notification.
// 3. For more complex sound effects, a community plugin like `capacitor-sound-effect` or
//    even `cordova-plugin-nativeaudio` (which can be used with Capacitor) might be necessary.
// This `playSound` function would need to be refactored to call the appropriate native API.

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
  // CAPACITOR_NOTE: This setting would also gate calls to native sound/haptic APIs.
  globalSoundEffectsEnabled = isEnabled;
};

// Store audio elements to prevent re-creation and allow for potential .pause() or .currentTime = 0 if needed
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {};

export const playSound = (soundName: SoundType) => {
  if (typeof window === 'undefined' || !globalSoundEffectsEnabled) {
    return;
  }

  // CAPACITOR_NOTE: Replace this HTMLAudioElement logic with calls to a native sound plugin.
  // Example (pseudo-code for a hypothetical native sound plugin):
  // if (Capacitor.isNativePlatform()) {
  //   NativeSound.play({ soundId: soundName }); // Assuming sound files are packaged with the native app
  //   return;
  // }

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

