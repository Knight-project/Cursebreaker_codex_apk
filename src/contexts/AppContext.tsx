

'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserProfile, Task, Rival, AppSettings, PomodoroSettings, IntervalTimerSetting, Attribute, CustomGraphSetting, CustomGraphDailyLogs, DailyGraphLog } from '@/lib/types'; // Updated import
import { ATTRIBUTES_LIST, INITIAL_USER_PROFILE, INITIAL_RIVAL, INITIAL_APP_SETTINGS, INITIAL_INTERVAL_TIMER_SETTINGS, INITIAL_CUSTOM_GRAPHS, INITIAL_CUSTOM_GRAPH_DAILY_LOGS, RANK_NAMES as RANK_NAMES_TYPED_ARRAY } from '@/lib/types'; // Added INITIAL_CUSTOM_GRAPHS
import {
  RANK_NAMES_LIST,
  MAX_SUB_RANKS,
  BASE_EXP_PER_SUBRANK,
  EXP_SCALING_FACTOR,
  TASK_DIFFICULTY_EXP_MULTIPLIER,
  BASE_TASK_EXP,
  RANK_EXP_SCALING_FACTOR,
  RIVAL_NAMES_POOL,
  APP_NAME,
  RIVAL_USER_DAILY_EXP_PERCENTAGE,
  RIVAL_DIFFICULTY_MULTIPLIERS,
  RIVAL_CATCH_UP_EXP_DIFFERENCE,
  RIVAL_CATCH_UP_BOOST_MULTIPLIER,
} from '@/lib/constants';
import { getAdaptiveTaunt } from '@/ai/flows/adaptive-taunts';
import type { AdaptiveTauntInput } from '@/ai/flows/adaptive-taunts';
import { format, isBefore, startOfDay, addHours, differenceInSeconds, subDays } from 'date-fns';


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
  intervalTimerSettings: IntervalTimerSetting[]; 
  setIntervalTimerSettings: React.Dispatch<React.SetStateAction<IntervalTimerSetting[]>>; 
  addIntervalTimerSetting: (setting: Omit<IntervalTimerSetting, 'id'>) => void;
  updateIntervalTimerSetting: (setting: IntervalTimerSetting) => void;
  deleteIntervalTimerSetting: (settingId: string) => void;
  customGraphs: CustomGraphSetting[];
  setCustomGraphs: React.Dispatch<React.SetStateAction<CustomGraphSetting[]>>;
  addCustomGraph: (graph: Omit<CustomGraphSetting, 'id' | 'data'>) => void;
  updateCustomGraph: (graph: CustomGraphSetting) => void;
  deleteCustomGraph: (graphId: string) => void;
  customGraphDailyLogs: CustomGraphDailyLogs;
  setCustomGraphDailyLogs: React.Dispatch<React.SetStateAction<CustomGraphDailyLogs>>;
  logCustomGraphData: (graphId: string, variableId: string, value: number) => void;
  commitStaleDailyLogs: () => void;
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


const AppProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useLocalStorage<UserProfile>(`${APP_NAME}UserProfile`, INITIAL_USER_PROFILE);
  const [tasks, setTasks] = useLocalStorage<Task[]>(`${APP_NAME}Tasks`, []);
  const [rival, setRival] = useLocalStorage<Rival>(`${APP_NAME}Rival`, INITIAL_RIVAL);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>(`${APP_NAME}Settings`, INITIAL_APP_SETTINGS);
  const [pomodoroSettings, setPomodoroSettings] = useLocalStorage<PomodoroSettings>(`${APP_NAME}PomodoroSettings`, INITIAL_POMODORO_SETTINGS);
  const [intervalTimerSettings, setIntervalTimerSettings] = useLocalStorage<IntervalTimerSetting[]>(`${APP_NAME}IntervalTimers`, INITIAL_INTERVAL_TIMER_SETTINGS);
  const [customGraphs, setCustomGraphs] = useLocalStorage<CustomGraphSetting[]>(`${APP_NAME}CustomGraphs`, INITIAL_CUSTOM_GRAPHS);
  const [customGraphDailyLogs, setCustomGraphDailyLogs] = useLocalStorage<CustomGraphDailyLogs>(`${APP_NAME}CustomGraphDailyLogs`, INITIAL_CUSTOM_GRAPH_DAILY_LOGS);


  const [isInitialized, setIsInitialized] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTabState] = useState('home');

  useEffect(() => {
    if (userProfile.customQuote === undefined || userProfile.customQuote.toLowerCase() === "fuck" ) {
       setUserProfile(prev => ({...prev, customQuote: INITIAL_USER_PROFILE.customQuote}));
    }
    if (!rival.name || !RIVAL_NAMES_POOL.includes(rival.name)) {
      setRival(prev => ({
        ...prev,
        name: RIVAL_NAMES_POOL[Math.floor(Math.random() * RIVAL_NAMES_POOL.length)]
      }));
    }
     if (!rival.expHistory) {
      setRival(prev => ({ ...prev, expHistory: [] }));
    }
     if (!rival.nextExpGainTime || isBefore(new Date(rival.nextExpGainTime), new Date())) {
      const nextMidnight = startOfDay(addHours(new Date(), 24));
      setRival(prev => ({ ...prev, nextExpGainTime: nextMidnight.toISOString() }));
    }
    // Initialize daily EXP tracking for user if needed
    const today = new Date().toISOString().split('T')[0];
    if (userProfile.lastExpResetDate !== today) {
      setUserProfile(prev => ({ ...prev, expGainedToday: 0, lastExpResetDate: today }));
    }

    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Added userProfile.lastExpResetDate dependencies if it changes elsewhere

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

      const today = new Date().toISOString().split('T')[0];
      let currentExpGainedToday = prev.expGainedToday;
      if (prev.lastExpResetDate !== today) { 
        currentExpGainedToday = 0;
      }
      currentExpGainedToday += expGained;

      return {
        ...prev,
        totalExp: newTotalExp,
        currentExpInSubRank: newCurrentExpInSubRank,
        subRank: newSubRank,
        rankName: newRankName,
        expToNextSubRank: newExpToNextSubRank,
        expGainedToday: currentExpGainedToday,
        lastExpResetDate: today,
      };
    });
  }, [setUserProfile, isInitialized, appSettings.enableAnimations]);


  const grantStatExp = useCallback((attribute: Attribute, expGainedStat: number) => {
    setUserProfile(prev => {
      const statKey = attribute.toLowerCase() as keyof typeof prev.stats;
      if (!prev.stats[statKey]) return prev; 
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
      setRival(prev => ({ ...prev, lastTaunt: "Hmph. My systems are... momentarily indisposed." }));
    }
  }, [userProfile.dailyTaskCompletionPercentage, userProfile.rankName, userProfile.subRank, rival.rankName, rival.subRank, setRival, isInitialized]);


  const calculatePotentialTaskExp = useCallback((taskData: Pick<Task, 'difficulty'>, userRankForCalc: string): number => {
    const rankIndex = RANK_NAMES_LIST.indexOf(userRankForCalc as typeof RANK_NAMES_LIST[number]);
    const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[taskData.difficulty];
    const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);
    return Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
  }, []);

  // Effect for scheduled Rival EXP gain
  useEffect(() => {
    if (!isInitialized || !rival.nextExpGainTime) return;

    const checkRivalExpGain = () => {
      const now = new Date();
      if (now.toISOString() >= rival.nextExpGainTime!) {
        
        const yesterdayStr = format(subDays(new Date(rival.nextExpGainTime!), 1), 'yyyy-MM-dd');

        let userExpGainedForRival = 0;
        // Check if userProfile.lastExpResetDate was indeed yesterday relative to rival's update time
        // And that expGainedToday has values from "yesterday"
        if (userProfile.lastExpResetDate === yesterdayStr) {
            userExpGainedForRival = userProfile.expGainedToday;
        } else {
            // If lastExpResetDate is not yesterday, it means user might not have gained EXP
            // or the timing is off. For safety, assume 0 or log a warning.
            // This could happen if app wasn't opened for a full day.
            userExpGainedForRival = 0; 
        }
        
        const expFromUserUncompletedTasks = tasks
          .filter(t => t.dateAdded === yesterdayStr && !t.isCompleted)
          .reduce((sum, task) => sum + calculatePotentialTaskExp(task, userProfile.rankName), 0);

        let baseRivalExpGain = 
            (userExpGainedForRival * RIVAL_USER_DAILY_EXP_PERCENTAGE) + 
            expFromUserUncompletedTasks;

        baseRivalExpGain *= RIVAL_DIFFICULTY_MULTIPLIERS[appSettings.rivalDifficulty];

        if ((userProfile.totalExp - rival.totalExp) > RIVAL_CATCH_UP_EXP_DIFFERENCE && userProfile.totalExp > rival.totalExp) {
          baseRivalExpGain *= RIVAL_CATCH_UP_BOOST_MULTIPLIER;
        }
        
        const expGainedByRival = Math.max(0, Math.floor(baseRivalExpGain)); // Ensure non-negative

        setRival(prev => {
          let newCurrentExp = prev.currentExpInSubRank + expGainedByRival;
          let newSubRank = prev.subRank;
          let newRankName = prev.rankName;
          let newExpToNext = prev.expToNextSubRank;
          let newTotalExp = prev.totalExp + expGainedByRival;

          while (newCurrentExp >= newExpToNext) {
            newCurrentExp -= newExpToNext;
            newSubRank++;
            if (newSubRank > MAX_SUB_RANKS) {
              newSubRank = 1;
              const currentRankIndex = RANK_NAMES_TYPED_ARRAY.indexOf(newRankName as typeof RANK_NAMES_TYPED_ARRAY[number]);
              if (currentRankIndex < RANK_NAMES_TYPED_ARRAY.length - 1) {
                newRankName = RANK_NAMES_TYPED_ARRAY[currentRankIndex + 1];
              } else { 
                newSubRank = MAX_SUB_RANKS;
                newCurrentExp = newExpToNext; 
              }
            }
            newExpToNext = calculateExpForNextSubRank(newRankName, newSubRank);
          }

          const newHistoryEntry = {
            date: format(new Date(rival.nextExpGainTime!), 'yyyy-MM-dd'), // Log with the date it was processed for
            expGained: expGainedByRival,
            totalExp: newTotalExp,
          };
          const updatedExpHistory = [...(prev.expHistory || []), newHistoryEntry].slice(-30);
          
          const nextGainTime = startOfDay(addHours(new Date(prev.nextExpGainTime!), 25)); // Ensure it's next day's midnight

          return {
            ...prev,
            currentExpInSubRank: newCurrentExp,
            subRank: newSubRank,
            rankName: newRankName,
            expToNextSubRank: newExpToNext,
            totalExp: newTotalExp,
            expHistory: updatedExpHistory,
            nextExpGainTime: nextGainTime.toISOString(),
          };
        });

        // Reset user's daily counter for the NEW day (which is now 'today')
        const newCurrentDateStr = format(new Date(), 'yyyy-MM-dd');
        setUserProfile(prevUser => ({
            ...prevUser,
            expGainedToday: 0,
            lastExpResetDate: newCurrentDateStr,
        }));
      }
    };

    const intervalId = setInterval(checkRivalExpGain, 60000); // Check every minute
    checkRivalExpGain(); // Initial check

    return () => clearInterval(intervalId);
  }, [isInitialized, rival.nextExpGainTime, userProfile, tasks, appSettings.rivalDifficulty, setRival, setUserProfile, calculateExpForNextSubRank, calculatePotentialTaskExp]);


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

  const addCustomGraph = (graphData: Omit<CustomGraphSetting, 'id' | 'data'>) => {
    const newGraph: CustomGraphSetting = {
      ...graphData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      data: {}, // Initialize with empty data
    };
    setCustomGraphs(prev => [...prev, newGraph]);
  };

  const updateCustomGraph = (updatedGraph: CustomGraphSetting) => {
    setCustomGraphs(prev => prev.map(g => g.id === updatedGraph.id ? updatedGraph : g));
  };

  const deleteCustomGraph = (graphId: string) => {
    setCustomGraphs(prev => prev.filter(g => g.id !== graphId));
    // Also clean up daily logs for this graph
    setCustomGraphDailyLogs(prevLogs => {
      const newLogs = {...prevLogs};
      delete newLogs[graphId];
      return newLogs;
    });
  };
  
  const logCustomGraphData = (graphId: string, variableId: string, value: number) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setCustomGraphDailyLogs(prevLogs => ({
      ...prevLogs,
      [graphId]: {
        ...(prevLogs[graphId] || {}),
        [variableId]: {
          date: todayStr,
          value: value,
        },
      },
    }));
  };

  const commitStaleDailyLogs = useCallback(() => {
    const todayDate = startOfDay(new Date());
    let logsUpdated = false;
    let graphsNeedUpdating = false;
  
    const newDailyLogsState: CustomGraphDailyLogs = JSON.parse(JSON.stringify(customGraphDailyLogs)); 
    const updatedCustomGraphsState: CustomGraphSetting[] = JSON.parse(JSON.stringify(customGraphs)); 
  
    for (const graphId in newDailyLogsState) {
      const graphVariables = newDailyLogsState[graphId];
      for (const variableId in graphVariables) {
        const logEntry = graphVariables[variableId];
        if (logEntry && logEntry.date && typeof logEntry.date === 'string') {
          const logDate = startOfDay(new Date(logEntry.date)); 
          if (isBefore(logDate, todayDate)) {
            const graphIndex = updatedCustomGraphsState.findIndex(g => g.id === graphId);
            if (graphIndex !== -1) {
              if (!updatedCustomGraphsState[graphIndex].data) {
                updatedCustomGraphsState[graphIndex].data = {};
              }
              if (!updatedCustomGraphsState[graphIndex].data[variableId]) {
                updatedCustomGraphsState[graphIndex].data[variableId] = {};
              }
              updatedCustomGraphsState[graphIndex].data[variableId][logEntry.date] = logEntry.value;
              graphsNeedUpdating = true;
            }
            delete newDailyLogsState[graphId][variableId];
            logsUpdated = true;
          }
        }
      }
      if (Object.keys(newDailyLogsState[graphId]).length === 0) {
        delete newDailyLogsState[graphId];
      }
    }
  
    if (graphsNeedUpdating) {
      setCustomGraphs(updatedCustomGraphsState);
    }
    if (logsUpdated) {
      setCustomGraphDailyLogs(newDailyLogsState);
    }
  }, [customGraphDailyLogs, customGraphs, setCustomGraphs, setCustomGraphDailyLogs]);

  useEffect(() => {
    if (isInitialized) {
      commitStaleDailyLogs();
    }
  }, [isInitialized, commitStaleDailyLogs]);


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
      customGraphs, setCustomGraphs,
      addCustomGraph, updateCustomGraph, deleteCustomGraph,
      customGraphDailyLogs, setCustomGraphDailyLogs,
      logCustomGraphData, commitStaleDailyLogs,
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

