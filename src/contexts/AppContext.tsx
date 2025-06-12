
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserProfile, Task, Rival, AppSettings, PomodoroSettings, IntervalTimerSetting, Attribute } from '@/lib/types'; // Updated import
import { ATTRIBUTES_LIST, INITIAL_USER_PROFILE, INITIAL_RIVAL, INITIAL_APP_SETTINGS, INITIAL_INTERVAL_TIMER_SETTINGS } from '@/lib/types'; // Added INITIAL_INTERVAL_TIMER_SETTINGS
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
  intervalTimerSettings: IntervalTimerSetting[]; // Updated type
  setIntervalTimerSettings: React.Dispatch<React.SetStateAction<IntervalTimerSetting[]>>; // Updated type
  addIntervalTimerSetting: (setting: Omit<IntervalTimerSetting, 'id'>) => void;
  updateIntervalTimerSetting: (setting: IntervalTimerSetting) => void;
  deleteIntervalTimerSetting: (settingId: string) => void;
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
  grantExp: (expGained: number) => void;
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

// INITIAL_INTERVAL_TIMER_SETTINGS is now imported from types.ts

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>('habitHorizonUserProfile', INITIAL_USER_PROFILE);
  const [tasks, setTasks] = useLocalStorage<Task[]>('habitHorizonTasks', []);
  const [rival, setRival] = useLocalStorage<Rival>('habitHorizonRival', INITIAL_RIVAL);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('habitHorizonSettings', INITIAL_APP_SETTINGS);
  const [pomodoroSettings, setPomodoroSettings] = useLocalStorage<PomodoroSettings>('habitHorizonPomodoroSettings', INITIAL_POMODORO_SETTINGS);
  const [intervalTimerSettings, setIntervalTimerSettings] = useLocalStorage<IntervalTimerSetting[]>('habitHorizonIntervalTimers', INITIAL_INTERVAL_TIMER_SETTINGS); // Key changed, type updated

  const [isInitialized, setIsInitialized] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTabState] = useState('home');

  useEffect(() => {
    if (userProfile.customQuote === undefined ) {
       setUserProfile(prev => ({...prev, customQuote: INITIAL_USER_PROFILE.customQuote}));
    }
    // Offensive word filter for customQuote
    if (userProfile.customQuote?.toLowerCase() === "fuck") {
      setUserProfile(prev => ({...prev, customQuote: INITIAL_USER_PROFILE.customQuote}));
    }
    if (!rival.name || !RIVAL_NAMES_POOL.includes(rival.name)) {
      setRival(prev => ({
        ...prev,
        name: RIVAL_NAMES_POOL[Math.floor(Math.random() * RIVAL_NAMES_POOL.length)]
      }));
    }
    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.customQuote, rival.name]); // Removed setUserProfile and setRival from deps to avoid loop, check logic if issues arise

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  const triggerLevelUpAnimation = () => {
    if(appSettings.enableAnimations) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 1500);
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
            newSubRank = MAX_SUB_RANKS;
            newCurrentExpInSubRank = newExpToNextSubRank;
          }
        }
        newExpToNextSubRank = calculateExpForNextSubRank(newRankName, newSubRank);
      }

      if (leveledUp && isInitialized && appSettings.enableAnimations) {
         triggerLevelUpAnimation();
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


  const grantStatExp = useCallback((attribute: Attribute, expGainedStat: number) => {
    // The check for attribute === "None" is already implicitly handled by type system for `stats` keys
    setUserProfile(prev => {
      const statKey = attribute.toLowerCase() as keyof typeof prev.stats;
      if (!prev.stats[statKey]) return prev; // Should not happen with proper types
      const currentStat = prev.stats[statKey];

      let newExp = currentStat.exp + expGainedStat;
      let newLevel = currentStat.level;
      let newExpToNext = currentStat.expToNextLevel;

      while (newExp >= newExpToNext) {
        newExp -= newExpToNext;
        newLevel++;
        newExpToNext = Math.floor(100 * Math.pow(1.2, newLevel -1));
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
      id: Date.now().toString() + Math.random().toString(36).substring(2,9),
      dateAdded: new Date().toISOString().split('T')[0],
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
    let completedTaskForHistory: Task | null = null;

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = prevTasks[taskIndex];
      if (task && !task.isCompleted) {
        const rankIndex = RANK_NAMES_LIST.indexOf(userProfile.rankName as typeof RANK_NAMES_LIST[number]);
        const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[task.difficulty];
        const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);

        const expFromTask = Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
        grantExp(expFromTask);

        let statExpGainedForTask: number | undefined = undefined;
        let attributeAffectedForStatExpForTask: Attribute | undefined = undefined;

        if (task.attribute !== "None" && appSettings.autoAssignStatExp && ATTRIBUTES_LIST.includes(task.attribute as typeof ATTRIBUTES_LIST[number])) {
          const statExp = Math.floor(expFromTask * 0.5);
          grantStatExp(task.attribute as Attribute, statExp);
          statExpGainedForTask = statExp;
          attributeAffectedForStatExpForTask = task.attribute;
        }

        const updatedTask = {
          ...task,
          isCompleted: true,
          dateCompleted: new Date().toISOString().split('T')[0],
          statExpGained: statExpGainedForTask,
          attributeAffectedForStatExp: attributeAffectedForStatExpForTask
        };
        completedTaskForHistory = { ...updatedTask };

        const newTasks = [...prevTasks];
        newTasks[taskIndex] = updatedTask;
        return newTasks;
      }
      return prevTasks;
    });

    if (completedTaskForHistory) {
      setUserProfile(prev => {
        const historyIndex = prev.taskHistory.findIndex(ht => ht.id === completedTaskForHistory!.id);
        let newTaskHistory = [...prev.taskHistory];
        if (historyIndex > -1) {
          newTaskHistory[historyIndex] = completedTaskForHistory!;
        } else {
          newTaskHistory.push(completedTaskForHistory!);
        }
        return { ...prev, taskHistory: newTaskHistory };
      });
    }
  }, [setTasks, userProfile.rankName, grantExp, grantStatExp, appSettings.autoAssignStatExp, setUserProfile]);


  const getTodaysTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(task => task.dateAdded === today || !task.isCompleted);
  }, [tasks]);

  const updateRivalTaunt = useCallback(async () => {
    if (!isInitialized) return;
    try {
      const rivalTaskCompletionRate = Math.random() * 0.4 + 0.5;
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

  useEffect(() => {
    if (!isInitialized) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const tasksAddedToday = tasks.filter(t => t.dateAdded === todayStr);
    const completedToday = tasksAddedToday.filter(t => t.isCompleted).length;
    const completionPercentage = tasksAddedToday.length > 0 ? (completedToday / tasksAddedToday.length) * 100 : 0;

    setUserProfile(prev => ({
      ...prev,
      dailyTaskCompletionPercentage: parseFloat(completionPercentage.toFixed(1)),
    }));

  }, [tasks, setUserProfile, isInitialized]);

  const addIntervalTimerSetting = (settingData: Omit<IntervalTimerSetting, 'id'>) => {
    const newSetting: IntervalTimerSetting = {
      ...settingData,
      id: Date.now().toString() + Math.random().toString(36).substring(2,9),
    };
    setIntervalTimerSettings(prev => [...prev, newSetting]);
  };

  const updateIntervalTimerSetting = (updatedSetting: IntervalTimerSetting) => {
    setIntervalTimerSettings(prev => prev.map(s => s.id === updatedSetting.id ? updatedSetting : s));
  };

  const deleteIntervalTimerSetting = (settingId: string) => {
    setIntervalTimerSettings(prev => prev.filter(s => s.id !== settingId));
  };


  if (!isInitialized) {
    return null;
  }

  return (
    <AppContext.Provider value={{
      userProfile, setUserProfile,
      tasks, setTasks,
      rival, setRival,
      appSettings, setAppSettings,
      pomodoroSettings, setPomodoroSettings,
      intervalTimerSettings, setIntervalTimerSettings,
      addIntervalTimerSetting, updateIntervalTimerSetting, deleteIntervalTimerSetting,
      addTask, updateTask, deleteTask, completeTask,
      getTodaysTasks,
      updateRivalTaunt,
      triggerLevelUpAnimation, showLevelUp,
      activeTab, setActiveTab,
      grantExp
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
