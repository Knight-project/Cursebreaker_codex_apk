
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserProfile, Task, Rival, AppSettings, PomodoroSettings, IntervalTimerSettings } from '@/lib/types';
import { ATTRIBUTES_LIST, INITIAL_USER_PROFILE, INITIAL_RIVAL, INITIAL_APP_SETTINGS } from '@/lib/types';
import { 
  RANK_NAMES_LIST,
  MAX_SUB_RANKS,
  BASE_EXP_PER_SUBRANK,
  EXP_SCALING_FACTOR,
  TASK_DIFFICULTY_EXP_MULTIPLIER,
  BASE_TASK_EXP,
  RANK_EXP_SCALING_FACTOR,
  RIVAL_NAMES_POOL
} from '@/lib/constants';
import { getAdaptiveTaunt } from '@/ai/flows/adaptive-taunts';
import type { AdaptiveTauntInput } from '@/ai/flows/adaptive-taunts';

interface AppContextType {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  rival: Rival;
  setRival: React.Dispatch<React.SetStateAction<Rival>>;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  pomodoroSettings: PomodoroSettings;
  setPomodoroSettings: React.Dispatch<React.SetStateAction<PomodoroSettings>>;
  intervalTimerSettings: IntervalTimerSettings;
  setIntervalTimerSettings: React.Dispatch<React.SetStateAction<IntervalTimerSettings>>;
  addTask: (task: Omit<Task, 'id' | 'dateAdded' | 'isCompleted'>) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  getTodaysTasks: () => Task[];
  updateRivalTaunt: () => Promise<void>;
  triggerLevelUpAnimation: () => void;
  showLevelUp: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  grantExp: (expGained: number) => void; // Added grantExp to interface
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const INITIAL_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

const INITIAL_INTERVAL_TIMER_SETTINGS: IntervalTimerSettings = {
  windowStart: "09:00",
  windowEnd: "17:00",
  repeatInterval: 60,
  taskName: "Micro-task break",
  isEnabled: false,
};

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(INITIAL_USER_PROFILE.customQuote ? 'habitHorizonUserProfile' : 'tempUserProfileKey', INITIAL_USER_PROFILE);
  const [tasks, setTasks] = useLocalStorage<Task[]>('habitHorizonTasks', []);
  const [rival, setRival] = useLocalStorage<Rival>('habitHorizonRival', INITIAL_RIVAL);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('habitHorizonSettings', INITIAL_APP_SETTINGS);
  const [pomodoroSettings, setPomodoroSettings] = useLocalStorage<PomodoroSettings>('habitHorizonPomodoroSettings', INITIAL_POMODORO_SETTINGS);
  const [intervalTimerSettings, setIntervalTimerSettings] = useLocalStorage<IntervalTimerSettings>('habitHorizonIntervalTimerSettings', INITIAL_INTERVAL_TIMER_SETTINGS);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTabState] = useState('home');

  useEffect(() => {
    // Ensure rival has a name on first load
    if (!rival.name || !RIVAL_NAMES_POOL.includes(rival.name)) {
      setRival(prev => ({
        ...prev,
        name: RIVAL_NAMES_POOL[Math.floor(Math.random() * RIVAL_NAMES_POOL.length)]
      }));
    }
    setIsInitialized(true);
  }, [rival.name, setRival]);
  
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  const triggerLevelUpAnimation = () => {
    if(appSettings.enableAnimations) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 1500); // Duration of animation + buffer
    }
  };

  const calculateExpForNextSubRank = (rankName: string, subRank: number): number => {
    const rankIndex = RANK_NAMES_LIST.indexOf(rankName as typeof RANK_NAMES_LIST[number]);
    const overallSubRankIndex = rankIndex * MAX_SUB_RANKS + (subRank -1) ;
    return Math.floor(BASE_EXP_PER_SUBRANK * Math.pow(EXP_SCALING_FACTOR, overallSubRankIndex));
  };

  const grantExp = useCallback((expGained: number) => {
    setUserProfile(prev => {
      let newTotalExp = prev.totalExp + expGained;
      let newCurrentExpInSubRank = prev.currentExpInSubRank + expGained;
      let newSubRank = prev.subRank;
      let newRankName = prev.rankName;
      let newExpToNextSubRank = prev.expToNextSubRank;
      let leveledUp = false;

      while (newCurrentExpInSubRank >= newExpToNextSubRank) {
        leveledUp = true;
        newCurrentExpInSubRank -= newExpToNextSubRank;
        newSubRank++;
        if (newSubRank > MAX_SUB_RANKS) {
          newSubRank = 1;
          const currentRankIndex = RANK_NAMES_LIST.indexOf(newRankName as typeof RANK_NAMES_LIST[number]);
          if (currentRankIndex < RANK_NAMES_LIST.length - 1) {
            newRankName = RANK_NAMES_LIST[currentRankIndex + 1];
          } else {
            // Max rank reached, cap subrank
            newSubRank = MAX_SUB_RANKS;
            newCurrentExpInSubRank = newExpToNextSubRank; // Fill the bar
          }
        }
        newExpToNextSubRank = calculateExpForNextSubRank(newRankName, newSubRank);
      }
      
      if (leveledUp) {
         // Trigger animation outside of setState if possible, or use an effect
         // For now, directly call. This might need refinement if it causes issues.
         if(isInitialized && appSettings.enableAnimations) triggerLevelUpAnimation();
      }

      return {
        ...prev,
        totalExp: newTotalExp,
        currentExpInSubRank: newCurrentExpInSubRank,
        subRank: newSubRank,
        rankName: newRankName,
        expToNextSubRank: newExpToNextSubRank,
      };
    });
  }, [setUserProfile, isInitialized, appSettings.enableAnimations]);


  const grantStatExp = useCallback((attribute: typeof ATTRIBUTES_LIST[number], expGained: number) => {
    setUserProfile(prev => {
      const statKey = attribute.toLowerCase() as keyof typeof prev.stats;
      const currentStat = prev.stats[statKey];
      // The check `if (!currentStat) return prev;` is removed as `attribute` type already ensures it's a valid key of `prev.stats`
      // because `ATTRIBUTES_LIST` (which `attribute` must be part of) does not include "None".

      let newExp = currentStat.exp + expGained;
      let newLevel = currentStat.level;
      let newExpToNext = currentStat.expToNextLevel;

      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(100 * Math.pow(1.2, newLevel -1)); // Example scaling for stat levels
      }

      return {
        ...prev,
        stats: {
          ...prev.stats,
          [statKey]: {
            level: newLevel,
            exp: newExp,
            expToNextLevel: newExpToNext,
          }
        }
      };
    });
  }, [setUserProfile]);


  const addTask = (taskData: Omit<Task, 'id' | 'dateAdded' | 'isCompleted'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substring(2,9), // more unique id
      dateAdded: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      isCompleted: false,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const completeTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (task && !task.isCompleted) {
        const rankIndex = RANK_NAMES_LIST.indexOf(userProfile.rankName as typeof RANK_NAMES_LIST[number]);
        const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[task.difficulty];
        const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);
        
        const expFromTask = Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
        grantExp(expFromTask);

        if (task.attribute !== "None" && ATTRIBUTES_LIST.includes(task.attribute as typeof ATTRIBUTES_LIST[number])) {
          const statExp = Math.floor(expFromTask * 0.5); // Example: 50% of task EXP goes to stat
          grantStatExp(task.attribute as typeof ATTRIBUTES_LIST[number], statExp);
        }
        
        return prevTasks.map(t => t.id === taskId ? { ...t, isCompleted: true, dateCompleted: new Date().toISOString().split('T')[0] } : t);
      }
      return prevTasks;
    });
  }, [setTasks, userProfile.rankName, grantExp, grantStatExp]);
  

  const getTodaysTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.dateAdded === today || !task.isCompleted); // Show today's or uncompleted past tasks
  }, [tasks]);

  const updateRivalTaunt = useCallback(async () => {
    if (!isInitialized) return;
    try {
      const rivalTaskCompletionRate = Math.random() * 0.4 + 0.5; // Simulate rival completion 50-90%
      const input: AdaptiveTauntInput = {
        userTaskCompletionRate: userProfile.dailyTaskCompletionPercentage / 100,
        rivalTaskCompletionRate: rivalTaskCompletionRate, 
        userRank: `${userProfile.rankName} (Sub-Rank ${userProfile.subRank})`,
        rivalRank: `${rival.rankName} (Sub-Rank ${rival.subRank})`,
      };
      const result = await getAdaptiveTaunt(input);
      setRival(prev => ({ ...prev, lastTaunt: result.taunt }));
    } catch (error) {
      console.error("Failed to get rival taunt:", error);
      setRival(prev => ({ ...prev, lastTaunt: "Hmph. Thinking..." }));
    }
  }, [userProfile.dailyTaskCompletionPercentage, userProfile.rankName, userProfile.subRank, rival.rankName, rival.subRank, setRival, isInitialized]);

  // Effect for daily updates (streaks, rival EXP, etc. - simplified for now)
  useEffect(() => {
    if (!isInitialized) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.dateAdded === todayStr);
    const completedToday = todaysTasks.filter(t => t.isCompleted).length;
    const completionPercentage = todaysTasks.length > 0 ? (completedToday / todaysTasks.length) * 100 : 0;

    setUserProfile(prev => ({
      ...prev,
      dailyTaskCompletionPercentage: parseFloat(completionPercentage.toFixed(1)),
    }));

    // Rival taunt update attempt on load or when user profile changes significantly
    // updateRivalTaunt(); // This might be too frequent, consider specific triggers

  }, [tasks, setUserProfile, isInitialized]);


  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <AppContext.Provider value={{ 
      userProfile, setUserProfile, 
      tasks, setTasks,
      rival, setRival,
      appSettings, setAppSettings,
      pomodoroSettings, setPomodoroSettings,
      intervalTimerSettings, setIntervalTimerSettings,
      addTask, updateTask, deleteTask, completeTask,
      getTodaysTasks,
      updateRivalTaunt,
      triggerLevelUpAnimation, showLevelUp,
      activeTab, setActiveTab,
      grantExp // Expose grantExp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
