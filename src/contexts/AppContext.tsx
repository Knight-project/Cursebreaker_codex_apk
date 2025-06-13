
'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { UserProfile, Task, TaskType, Rival, AppSettings, PomodoroSettings, IntervalTimerSetting, Attribute, CustomGraphSetting, CustomGraphDailyLogs } from '@/lib/types';
import { ATTRIBUTES_LIST, INITIAL_USER_PROFILE, INITIAL_RIVAL, INITIAL_APP_SETTINGS, INITIAL_INTERVAL_TIMER_SETTINGS, INITIAL_CUSTOM_GRAPHS, INITIAL_CUSTOM_GRAPH_DAILY_LOGS, RANK_NAMES as RANK_NAMES_TYPED_ARRAY } from '@/lib/types';
import {
  RANK_NAMES_LIST,
  MAX_SUB_RANKS,
  BASE_EXP_PER_SUBRANK,
  EXP_SCALING_FACTOR,
  TASK_DIFFICULTY_EXP_MULTIPLIER,
  BASE_TASK_EXP,
  RANK_EXP_SCALING_FACTOR,
  APP_NAME,
  RIVAL_USER_DAILY_EXP_PERCENTAGE,
  RIVAL_DIFFICULTY_MULTIPLIERS,
  RIVAL_CATCH_UP_EXP_DIFFERENCE,
  RIVAL_CATCH_UP_BOOST_MULTIPLIER,
} from '@/lib/constants';
import { getAdaptiveTaunt } from '@/ai/flows/adaptive-taunts';
import type { AdaptiveTauntInput } from '@/ai/flows/adaptive-taunts';
import { format, isBefore, startOfDay, addHours, subDays, parseISO } from 'date-fns';


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
  addTask: (taskData: Omit<Task, 'id' | 'dateAdded' | 'isCompleted'> & { taskType: TaskType; scheduledDate?: string }) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  getDailyDirectives: () => Task[];
  getRituals: () => Task[];
  getProtocolsForToday: () => Task[];
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
    const today = format(new Date(), 'yyyy-MM-dd');
    if (userProfile.customQuote === undefined || userProfile.customQuote.toLowerCase() === "fuck" ) {
       setUserProfile(prev => ({...prev, customQuote: INITIAL_USER_PROFILE.customQuote}));
    }
    if (!rival.name) {
      setRival(prev => ({ ...prev, name: INITIAL_RIVAL.name }));
    }
     if (!rival.expHistory) {
      setRival(prev => ({ ...prev, expHistory: [] }));
    }
     if (!rival.nextExpGainTime || isBefore(new Date(rival.nextExpGainTime), new Date())) {
      const nextMidnight = startOfDay(addHours(new Date(), 24));
      setRival(prev => ({ ...prev, nextExpGainTime: nextMidnight.toISOString() }));
    }
    if (userProfile.lastExpResetDate !== today) {
      setUserProfile(prev => ({ ...prev, expGainedToday: 0, lastExpResetDate: today }));
    }

    // Daily reset for rituals
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.taskType === 'ritual' && task.lastCompletedDate !== today) {
          return { ...task, isCompleted: false };
        }
        return task;
      })
    );

    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount and when `today` changes (implicitly via re-render if it were a state)


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

      const today = format(new Date(), 'yyyy-MM-dd');
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
      if (!prev.stats[statKey]) return prev; // Should not happen with ATTRIBUTES_LIST check
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


  const addTask = (taskData: Omit<Task, 'id' | 'dateAdded' | 'isCompleted'> & { taskType: TaskType; scheduledDate?: string }) => {
    const newTask: Task = {
      id: Date.now().toString() + Math.random().toString(36).substring(2,9),
      name: taskData.name,
      difficulty: taskData.difficulty,
      attribute: taskData.attribute,
      taskType: taskData.taskType,
      isCompleted: false,
      dateAdded: format(new Date(), 'yyyy-MM-dd'), // Creation date
      scheduledDate: taskData.taskType === 'protocol' ? taskData.scheduledDate : undefined,
      lastCompletedDate: undefined,
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
    const today = format(new Date(), 'yyyy-MM-dd');

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const task = prevTasks[taskIndex];
      if (task && !task.isCompleted) { // For rituals, isCompleted means for today
        const rankIndex = RANK_NAMES_LIST.indexOf(userProfile.rankName as typeof RANK_NAMES_LIST[number]);
        const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[task.difficulty];
        const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);

        const expFromTask = Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
        grantExp(expFromTask);

        let statExpGainedForTask: number | undefined = undefined;
        let attributeAffectedForStatExpForTask: Attribute | undefined = undefined;

        if (task.attribute !== "None" && appSettings.autoAssignStatExp && ATTRIBUTES_LIST.includes(task.attribute as typeof ATTRIBUTES_LIST[number])) {
          const statExp = Math.floor(expFromTask * 0.5); // Example: 50% of task EXP goes to attribute
          grantStatExp(task.attribute as Attribute, statExp);
          statExpGainedForTask = statExp;
          attributeAffectedForStatExpForTask = task.attribute;
        }

        const updatedTaskData: Partial<Task> = {
          isCompleted: true,
          statExpGained: statExpGainedForTask,
          attributeAffectedForStatExp: attributeAffectedForStatExpForTask
        };

        if (task.taskType === 'ritual') {
          updatedTaskData.lastCompletedDate = today;
        } else {
          updatedTaskData.dateCompleted = today;
        }

        const updatedTask = { ...task, ...updatedTaskData };
        completedTaskForHistory = { ...updatedTask }; // Capture state for history

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
          // If task is already in history (e.g. a ritual completed on a previous day), update it.
          // Or, decide if rituals should create new history entries each day.
          // For now, let's update if exists, otherwise add.
          newTaskHistory[historyIndex] = completedTaskForHistory!;
        } else {
          newTaskHistory.push(completedTaskForHistory!);
        }
        // Optionally, limit history size
        // newTaskHistory = newTaskHistory.slice(-100);
        return { ...prev, taskHistory: newTaskHistory };
      });
    }
  }, [setTasks, userProfile.rankName, grantExp, grantStatExp, appSettings.autoAssignStatExp, setUserProfile]);


  const getDailyDirectives = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => task.taskType === 'daily' && task.dateAdded === today);
  }, [tasks]);

  const getRituals = useCallback(() => {
    return tasks.filter(task => task.taskType === 'ritual');
  }, [tasks]);

  const getProtocolsForToday = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => task.taskType === 'protocol' && task.scheduledDate === today);
  }, [tasks]);


  const updateRivalTaunt = useCallback(async () => {
    if (!isInitialized) return;
    try {
      const rivalTaskCompletionRate = Math.random() * 0.4 + 0.5; // Simulate rival's completion
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
      // Fallback taunt
      setRival(prev => ({ ...prev, lastTaunt: "Hmph. My systems are... momentarily indisposed." }));
    }
  }, [userProfile.dailyTaskCompletionPercentage, userProfile.rankName, userProfile.subRank, rival.rankName, rival.subRank, setRival, isInitialized]);


  const calculatePotentialTaskExp = useCallback((taskData: Pick<Task, 'difficulty'>, userRankForCalc: string): number => {
    const rankIndex = RANK_NAMES_LIST.indexOf(userRankForCalc as typeof RANK_NAMES_LIST[number]);
    const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[taskData.difficulty];
    const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);
    return Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
  }, []);

  // Effect for scheduled Rival EXP gain & Daily Ritual Reset
  useEffect(() => {
    if (!isInitialized) return;

    const dailyCheck = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      // Rival EXP Gain Check
      if (rival.nextExpGainTime && now.toISOString() >= rival.nextExpGainTime) {
        const previousDayForExpCalc = format(subDays(parseISO(rival.nextExpGainTime), 1), 'yyyy-MM-dd');

        let userExpGainedForRival = 0;
        // Check if userProfile's lastExpResetDate corresponds to the day before rival's exp gain.
        // This ensures we are using the exp gained by the user on the correct day.
        if (userProfile.lastExpResetDate === previousDayForExpCalc) {
            userExpGainedForRival = userProfile.expGainedToday;
        } else {
            // If dates don't align (e.g., user didn't play, or data is from even earlier),
            // we might consider it 0 or fetch historical data if available. For simplicity, 0.
            userExpGainedForRival = 0;
        }

        const expFromUserUncompletedTasks = tasks
          .filter(t => t.dateAdded === previousDayForExpCalc && !t.isCompleted && t.taskType === 'daily') // Only count uncompleted 'daily' tasks from prev day
          .reduce((sum, task) => sum + calculatePotentialTaskExp(task, userProfile.rankName), 0);

        let baseRivalExpGain =
            (userExpGainedForRival * RIVAL_USER_DAILY_EXP_PERCENTAGE) +
            expFromUserUncompletedTasks;

        baseRivalExpGain *= RIVAL_DIFFICULTY_MULTIPLIERS[appSettings.rivalDifficulty];

        if ((userProfile.totalExp - rival.totalExp) > RIVAL_CATCH_UP_EXP_DIFFERENCE && userProfile.totalExp > rival.totalExp) {
          baseRivalExpGain *= RIVAL_CATCH_UP_BOOST_MULTIPLIER;
        }

        const expGainedByRival = Math.max(0, Math.floor(baseRivalExpGain));

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
            date: format(parseISO(prev.nextExpGainTime!), 'yyyy-MM-dd'), // Log with the date it was supposed to be gained
            expGained: expGainedByRival,
            totalExp: newTotalExp,
          };
          const updatedExpHistory = [...(prev.expHistory || []), newHistoryEntry].slice(-30); // Keep last 30 entries

          const nextGainTime = startOfDay(addHours(parseISO(prev.nextExpGainTime!), 25)); // Set for next day

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

        // Reset user's expGainedToday for the new day
        setUserProfile(prevUser => ({
            ...prevUser,
            expGainedToday: 0,
            lastExpResetDate: todayStr, // current actual day
        }));
      }

      // Daily Ritual Reset
      // Check if a reset is needed (e.g., based on a stored "lastRitualResetDate")
      // For simplicity, this effect runs once per day effectively on first load or if app is kept open.
      // If app is opened after midnight, this will trigger.
      const lastRitualResetDate = localStorage.getItem(`${APP_NAME}_lastRitualResetDate`);
      if (lastRitualResetDate !== todayStr) {
        setTasks(prevTasks =>
          prevTasks.map(task => {
            if (task.taskType === 'ritual' && task.lastCompletedDate !== todayStr) {
              return { ...task, isCompleted: false };
            }
            return task;
          })
        );
        localStorage.setItem(`${APP_NAME}_lastRitualResetDate`, todayStr);
      }
    };

    dailyCheck(); // Run once on mount
    const intervalId = setInterval(dailyCheck, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [isInitialized, rival.nextExpGainTime, userProfile, tasks, appSettings.rivalDifficulty, setRival, setUserProfile, calculatePotentialTaskExp, setTasks]);


  useEffect(() => {
    if (!isInitialized) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    // Calculate daily completion based on 'daily' tasks added today and 'protocol' tasks scheduled for today
    const relevantTasksForCompletion = tasks.filter(t =>
      (t.taskType === 'daily' && t.dateAdded === todayStr) ||
      (t.taskType === 'protocol' && t.scheduledDate === todayStr)
    );
    const completedRelevantTasks = relevantTasksForCompletion.filter(t => t.isCompleted).length;
    const completionPercentage = relevantTasksForCompletion.length > 0
      ? (completedRelevantTasks / relevantTasksForCompletion.length) * 100
      : 0;

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
      data: {},
    };
    setCustomGraphs(prev => [...prev, newGraph]);
  };

  const updateCustomGraph = (updatedGraph: CustomGraphSetting) => {
    setCustomGraphs(prev => prev.map(g => g.id === updatedGraph.id ? updatedGraph : g));
  };

  const deleteCustomGraph = (graphId: string) => {
    setCustomGraphs(prev => prev.filter(g => g.id !== graphId));
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
          const logDate = startOfDay(parseISO(logEntry.date));
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
      getDailyDirectives, getRituals, getProtocolsForToday,
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
