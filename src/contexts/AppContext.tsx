
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
import { format, isBefore, startOfDay, addHours, subDays, parseISO, addDays, differenceInDays, isEqual, isValid as dateIsValid, isSameDay, isAfter } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { playSound, updateGlobalSoundSetting } from '@/lib/soundManager';


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
  addTask: (taskData: Omit<Task, 'id' | 'dateAdded' | 'isCompleted' | 'nextDueDate' | 'baseExpValue'> & { taskType: TaskType; scheduledDate?: string; repeatIntervalDays?: number; isAllDay?: boolean; startTime?: string; endTime?: string; reminderOffsetMinutes?: number; }) => void;
  updateTask: (updatedTask: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  undoCompleteTask: (taskId: string) => void;
  getDailyDirectives: () => Task[];
  getRituals: () => Task[];
  getEventsForToday: () => Task[];
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
  const { toast } = useToast();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [activeTab, setActiveTabState] = useState('home');

  useEffect(() => {
    updateGlobalSoundSetting(appSettings.enableSoundEffects);
  }, [appSettings.enableSoundEffects]);

  const calculateNextDueDate = useCallback((baseDateStr: string, intervalDays: number): string => {
    let currentDate = parseISO(baseDateStr);
    const today = startOfDay(new Date());
    while (isBefore(currentDate, today)) {
      currentDate = addDays(currentDate, intervalDays);
    }
    return format(currentDate, 'yyyy-MM-dd');
  }, []);

  const calculateExpForNextSubRank = useCallback((rankName: string, subRank: number): number => {
    const rankIndex = RANK_NAMES_LIST.indexOf(rankName as typeof RANK_NAMES_LIST[number]);
    const overallSubRankIndex = rankIndex * MAX_SUB_RANKS + (subRank -1) ;
    return Math.floor(BASE_EXP_PER_SUBRANK * Math.pow(EXP_SCALING_FACTOR, overallSubRankIndex));
  }, []);


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

    setUserProfile(prev => {
      const correctExpToNext = calculateExpForNextSubRank(prev.rankName, prev.subRank);
      if (prev.expToNextSubRank !== correctExpToNext) {
        return { ...prev, expToNextSubRank: correctExpToNext };
      }
      return prev;
    });

    setRival(prev => {
      const correctExpToNext = calculateExpForNextSubRank(prev.rankName, prev.subRank);
      if (prev.expToNextSubRank !== correctExpToNext) {
        return { ...prev, expToNextSubRank: correctExpToNext };
      }
      return prev;
    });

    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.taskType === 'ritual') {
          const interval = task.repeatIntervalDays || 1;
          let expectedNextDueDate = task.nextDueDate ? parseISO(task.nextDueDate) : parseISO(task.dateAdded);
          
          const daysSinceAddedOrLastDue = differenceInDays(startOfDay(new Date()), task.nextDueDate ? parseISO(task.nextDueDate) : parseISO(task.dateAdded));
          if (daysSinceAddedOrLastDue >= interval || !task.nextDueDate) { 
            const cyclesMissed = Math.floor(daysSinceAddedOrLastDue / interval);
            expectedNextDueDate = addDays(task.nextDueDate ? parseISO(task.nextDueDate) : parseISO(task.dateAdded), cyclesMissed * interval);
          }
                    
          if(isBefore(expectedNextDueDate, startOfDay(new Date()))) {
            expectedNextDueDate = addDays(expectedNextDueDate, interval);
          }

          const formattedExpectedNextDueDate = format(expectedNextDueDate, 'yyyy-MM-dd');
          let updatedTask = { ...task, nextDueDate: formattedExpectedNextDueDate };

          if (updatedTask.nextDueDate === today && updatedTask.lastCompletedDate !== today) {
            updatedTask.isCompleted = false;
          }
          return updatedTask;
        }
        if (task.baseExpValue === undefined) {
          return { ...task, baseExpValue: calculatePotentialTaskExp(task, userProfile.rankName) };
        }
        return task;
      })
    );

    setIsInitialized(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  useEffect(() => {
    if (!isInitialized) return;

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterday = subDays(today, 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    setUserProfile(prevProfile => {
      let newStreak = prevProfile.currentStreak;
      let newLastDayAllTasksCompleted = prevProfile.lastDayAllTasksCompleted;

      if (!newLastDayAllTasksCompleted || newLastDayAllTasksCompleted === "") {
        newStreak = 0;
        newLastDayAllTasksCompleted = yesterdayStr; 
      } else {
        const lastDayDate = parseISO(newLastDayAllTasksCompleted);
        if (!isSameDay(lastDayDate, today) && !isSameDay(lastDayDate, yesterday)) {
          newStreak = 0;
        }
      }
      
      if (newLastDayAllTasksCompleted !== todayStr && newLastDayAllTasksCompleted !== yesterdayStr) {
          const tasksActionableYesterday = tasks.filter(task =>
              (task.taskType === 'daily' && task.dateAdded === yesterdayStr) ||
              (task.taskType === 'ritual' && task.nextDueDate === yesterdayStr) ||
              (task.taskType === 'event' && task.scheduledDate === yesterdayStr)
          );
          if (tasksActionableYesterday.length > 0) {
              const allActionableYesterdayCompleted = tasksActionableYesterday.every(task =>
                  (task.taskType === 'daily' && task.isCompleted) ||
                  (task.taskType === 'ritual' && task.lastCompletedDate === yesterdayStr) ||
                  (task.taskType === 'event' && task.isCompleted)
              );
              if (!allActionableYesterdayCompleted) {
                  newStreak = 0;
              }
          }
      }


      if (newStreak !== prevProfile.currentStreak || newLastDayAllTasksCompleted !== prevProfile.lastDayAllTasksCompleted) {
        return { ...prevProfile, currentStreak: newStreak, lastDayAllTasksCompleted: newLastDayAllTasksCompleted };
      }
      return prevProfile;
    });

  }, [isInitialized, tasks, setUserProfile]); 


  useEffect(() => {
    if (!isInitialized) return;
    const intervalId = setInterval(() => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      tasks.forEach(task => {
        if (
          task.taskType === 'event' && 
          task.scheduledDate === todayStr &&
          !task.isAllDay &&
          task.startTime &&
          task.reminderOffsetMinutes &&
          task.reminderOffsetMinutes > 0
        ) {
          const [hours, minutes] = task.startTime.split(':').map(Number);
          const startTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          const reminderTime = new Date(startTimeToday.getTime() - task.reminderOffsetMinutes * 60000);
          
          const reminderSentKey = `reminderSent_event_${task.id}_${task.scheduledDate}`; 
          const reminderAlreadySent = localStorage.getItem(reminderSentKey);

          if (now >= reminderTime && now < startTimeToday && !reminderAlreadySent) {
            toast({
              title: "Event Reminder", 
              description: `${task.name} is scheduled to start at ${task.startTime}.`,
            });
            playSound('notification');
            localStorage.setItem(reminderSentKey, 'true');
          }
          if (now >= startTimeToday && reminderAlreadySent) {
            localStorage.removeItem(reminderSentKey);
          }
        }
      });
    }, 60000); 

    return () => clearInterval(intervalId);
  }, [isInitialized, tasks, toast]);


  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
  };

  const triggerLevelUpAnimation = () => {
    if(appSettings.enableAnimations) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 1500);
    }
    playSound('levelUp');
  };

  const grantExp = useCallback((expGained: number) => {
    setUserProfile(prev => {
      let newTotalExp = prev.totalExp + expGained;
      let newCurrentExpInSubRank = prev.currentExpInSubRank + expGained;
      let newSubRank = prev.subRank;
      let newRankName = prev.rankName;
      let newExpToNextSubRank = prev.expToNextSubRank;
      let leveledUp = false;

      while (newCurrentExpInSubRank >= newExpToNextSubRank && newExpToNextSubRank > 0) { 
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
      
      while (newCurrentExpInSubRank < 0 && (newSubRank > 1 || RANK_NAMES_LIST.indexOf(newRankName as typeof RANK_NAMES_LIST[number]) > 0) ) {
          newSubRank--;
          if (newSubRank < 1) {
              const currentRankIndex = RANK_NAMES_LIST.indexOf(newRankName as typeof RANK_NAMES_LIST[number]);
              if (currentRankIndex > 0) { // Can de-rank
                  newRankName = RANK_NAMES_LIST[currentRankIndex - 1];
                  newSubRank = MAX_SUB_RANKS;
                  const expForPreviousLevel = calculateExpForNextSubRank(newRankName, newSubRank);
                  newCurrentExpInSubRank += expForPreviousLevel;
                  newExpToNextSubRank = expForPreviousLevel; 
              } else { // At lowest rank and sub-rank
                  newSubRank = 1;
                  newRankName = RANK_NAMES_LIST[0];
                  newCurrentExpInSubRank = 0; 
                  newExpToNextSubRank = calculateExpForNextSubRank(newRankName, newSubRank);
                  // Adjust totalExp to not go below what it was before this negative gain
                  newTotalExp = prev.totalExp + (newCurrentExpInSubRank - prev.currentExpInSubRank) - expGained; 
                  if (newTotalExp < 0) newTotalExp = 0;
                  break; 
              }
          } else {
            const expForPreviousLevel = calculateExpForNextSubRank(newRankName, newSubRank);
            newCurrentExpInSubRank += expForPreviousLevel;
            newExpToNextSubRank = expForPreviousLevel;
          }
      }
      if (newCurrentExpInSubRank < 0) newCurrentExpInSubRank = 0; // Floor at 0 for the current sub-rank


      if (leveledUp && isInitialized && expGained > 0) { 
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
        totalExp: Math.max(0, newTotalExp), 
        currentExpInSubRank: Math.max(0, newCurrentExpInSubRank), 
        subRank: newSubRank,
        rankName: newRankName,
        expToNextSubRank: newExpToNextSubRank,
        expGainedToday: currentExpGainedToday, 
        lastExpResetDate: prev.lastExpResetDate !== today ? today : prev.lastExpResetDate, 
      };
    });
  }, [setUserProfile, isInitialized, appSettings.enableAnimations, calculateExpForNextSubRank]);


  const grantStatExp = useCallback((attribute: Attribute, expGainedStat: number) => {
    setUserProfile(prev => {
      const statKey = attribute.toLowerCase() as keyof typeof prev.stats;
      if (!prev.stats[statKey] || attribute === "None") return prev; 
      const currentStat = prev.stats[statKey];

      let newExp = currentStat.exp + expGainedStat;
      let newLevel = currentStat.level;
      let newExpToNext = currentStat.expToNextLevel;

      if (expGainedStat > 0) { 
        while (newExp >= newExpToNext && newExpToNext > 0) {
          newExp -= newExpToNext;
          newLevel++;
          newExpToNext = Math.floor(INITIAL_USER_PROFILE.stats.strength.expToNextLevel * Math.pow(1.2, newLevel -1));
        }
      } else { 
         while (newExp < 0 && newLevel > 1) { // Prevent level from dropping below 1
            newLevel--;
            const expForPrevLevel = Math.floor(INITIAL_USER_PROFILE.stats.strength.expToNextLevel * Math.pow(1.2, newLevel -1));
            newExp += expForPrevLevel;
            newExpToNext = expForPrevLevel;
        }
        if (newLevel === 1 && newExp < 0) newExp = 0; // Floor EXP at 0 for level 1
      }


      return {
        ...prev,
        stats: {
          ...prev.stats,
          [statKey]: {
            level: Math.max(1, newLevel), 
            exp: Math.max(0, newExp),     
            expToNextLevel: newExpToNext,
          }
        }
      };
    });
  }, [setUserProfile]);


  const calculatePotentialTaskExp = useCallback((taskData: Pick<Task, 'difficulty'>, userRankForCalc: string): number => {
    const rankIndex = RANK_NAMES_LIST.indexOf(userRankForCalc as typeof RANK_NAMES_LIST[number]);
    const difficultyMultiplier = TASK_DIFFICULTY_EXP_MULTIPLIER[taskData.difficulty];
    const rankMultiplier = 1 + (rankIndex * RANK_EXP_SCALING_FACTOR);
    return Math.floor(BASE_TASK_EXP * difficultyMultiplier * rankMultiplier);
  }, []);
  

  const addTask = (taskData: Omit<Task, 'id' | 'dateAdded' | 'isCompleted' | 'nextDueDate' | 'baseExpValue'> & { taskType: TaskType; scheduledDate?: string; repeatIntervalDays?: number; isAllDay?: boolean; startTime?: string; endTime?: string; reminderOffsetMinutes?: number; }) => {
    const dateAdded = format(new Date(), 'yyyy-MM-dd');
    let nextDueDateCalculated: string | undefined = undefined;
    if (taskData.taskType === 'ritual') {
      nextDueDateCalculated = calculateNextDueDate(dateAdded, taskData.repeatIntervalDays || 1);
    }
    
    const baseExp = calculatePotentialTaskExp(taskData, userProfile.rankName);

    const newTask: Task = {
      id: Date.now().toString() + Math.random().toString(36).substring(2,9),
      name: taskData.name,
      difficulty: taskData.difficulty,
      attribute: taskData.attribute,
      taskType: taskData.taskType,
      isCompleted: false,
      dateAdded: dateAdded,
      baseExpValue: baseExp, // Fixed EXP value set at creation
      repeatIntervalDays: taskData.taskType === 'ritual' ? (taskData.repeatIntervalDays || 1) : undefined,
      nextDueDate: taskData.taskType === 'ritual' ? nextDueDateCalculated : undefined,
      scheduledDate: taskData.taskType === 'event' ? taskData.scheduledDate : undefined, 
      isAllDay: taskData.taskType === 'event' ? taskData.isAllDay : undefined, 
      startTime: taskData.taskType === 'event' && !taskData.isAllDay ? taskData.startTime : undefined, 
      endTime: taskData.taskType === 'event' && !taskData.isAllDay ? taskData.endTime : undefined, 
      reminderOffsetMinutes: taskData.taskType === 'event' && !taskData.isAllDay ? taskData.reminderOffsetMinutes : undefined, 
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
    playSound('buttonClick'); 
  };

  const updateTask = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    playSound('buttonClick'); 
  };
  
  const completeTask = useCallback((taskId: string) => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

    let taskSnapshotForHistory: Task | null = null; 

    setTasks(prevTasks => {
      const taskIndex = prevTasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return prevTasks;

      const originalTask = prevTasks[taskIndex];
      let updatedTaskInMainList = { ...originalTask };

      const canCompleteDailyOrEvent = (originalTask.taskType === 'daily' || originalTask.taskType === 'event') && !originalTask.isCompleted && (originalTask.taskType === 'daily' || originalTask.scheduledDate === todayStr);
      const canCompleteRitual = originalTask.taskType === 'ritual' && originalTask.nextDueDate === todayStr && originalTask.lastCompletedDate !== todayStr;

      if (!canCompleteDailyOrEvent && !canCompleteRitual) {
        return prevTasks;
      }

      const expAwardedForThisCompletion = originalTask.baseExpValue; // Use the fixed baseExpValue
      
      let statExpGainedForThisInstance: number | undefined = undefined;
      let attributeAffectedForThisInstance: Attribute | undefined = undefined;

      if (originalTask.attribute !== "None" && appSettings.autoAssignStatExp && ATTRIBUTES_LIST.includes(originalTask.attribute as typeof ATTRIBUTES_LIST[number])) {
        const statExp = Math.floor(expAwardedForThisCompletion * 0.5);
        statExpGainedForThisInstance = statExp;
        attributeAffectedForThisInstance = originalTask.attribute;
      }
      
      // Create a snapshot for history
      taskSnapshotForHistory = {
        ...originalTask, // Copy base properties
        isCompleted: true, // Mark as completed for this historical instance
        dateCompleted: originalTask.taskType !== 'ritual' ? todayStr : undefined,
        lastCompletedDate: originalTask.taskType === 'ritual' ? todayStr : undefined,
        expAwarded: expAwardedForThisCompletion, // Store the exact EXP awarded
        statExpGained: statExpGainedForThisInstance,
        attributeAffectedForStatExp: attributeAffectedForThisInstance,
      };
      
      // Update the task in the main list
      if (originalTask.taskType === 'ritual') {
        updatedTaskInMainList.lastCompletedDate = todayStr;
        updatedTaskInMainList.isCompleted = true;
        const currentDueDate = originalTask.nextDueDate ? parseISO(originalTask.nextDueDate) : parseISO(originalTask.dateAdded);
        updatedTaskInMainList.nextDueDate = format(addDays(currentDueDate, originalTask.repeatIntervalDays || 1), 'yyyy-MM-dd');
      } else {
        updatedTaskInMainList.isCompleted = true;
        updatedTaskInMainList.dateCompleted = todayStr;
      }
      // Clear transient award fields from the main list item
      updatedTaskInMainList.expAwarded = undefined;
      updatedTaskInMainList.statExpGained = undefined;
      updatedTaskInMainList.attributeAffectedForStatExp = undefined;

      const newTasks = [...prevTasks];
      newTasks[taskIndex] = updatedTaskInMainList;

      // Streak Logic (remains the same)
      const tasksActionableToday = newTasks.filter(t =>
          (t.taskType === 'daily' && t.dateAdded === todayStr) ||
          (t.taskType === 'ritual' && (t.nextDueDate === todayStr || t.lastCompletedDate === todayStr) ) || 
          (t.taskType === 'event' && t.scheduledDate === todayStr)
      );
      const allTodayNowCompleted = tasksActionableToday.length > 0 && tasksActionableToday.every(t =>
          (t.taskType === 'daily' && t.isCompleted && t.dateCompleted === todayStr) ||
          (t.taskType === 'ritual' && t.lastCompletedDate === todayStr) || 
          (t.taskType === 'event' && t.isCompleted && t.dateCompleted === todayStr)
      );

      if (allTodayNowCompleted) {
          setUserProfile(prev => {
              if (prev.lastDayAllTasksCompleted === yesterdayStr) {
                  return { ...prev, currentStreak: prev.currentStreak + 1, lastDayAllTasksCompleted: todayStr };
              } else if (prev.lastDayAllTasksCompleted !== todayStr) { 
                  return { ...prev, currentStreak: 1, lastDayAllTasksCompleted: todayStr };
              }
              return prev;
          });
      }
      return newTasks;
    });

    // After setTasks, if a snapshot was created, grant EXP and update history
    if (taskSnapshotForHistory) {
      const finalHistoryRecord = taskSnapshotForHistory; // Use the captured snapshot

      if (finalHistoryRecord.expAwarded !== undefined) {
        grantExp(finalHistoryRecord.expAwarded);
      }
      if (finalHistoryRecord.attributeAffectedForStatExp && finalHistoryRecord.attributeAffectedForStatExp !== "None" && finalHistoryRecord.statExpGained !== undefined) {
        grantStatExp(finalHistoryRecord.attributeAffectedForStatExp, finalHistoryRecord.statExpGained);
      }
      
      playSound('taskComplete');
      setUserProfile(prev => {
        const newTaskHistory = [...prev.taskHistory];
        const existingIndex = newTaskHistory.findIndex(ht => 
            ht.id === finalHistoryRecord.id && 
            ( (ht.taskType !== 'ritual' && ht.dateCompleted === finalHistoryRecord.dateCompleted) || 
              (ht.taskType === 'ritual' && ht.lastCompletedDate === finalHistoryRecord.lastCompletedDate) )
        );
        if(existingIndex > -1){
             newTaskHistory[existingIndex] = finalHistoryRecord; // Update if somehow a duplicate for the same instance was there
        } else {
             newTaskHistory.push(finalHistoryRecord);
        }
        return { ...prev, taskHistory: newTaskHistory.slice(-100) }; // Limit history size
      });
    }
  }, [setTasks, userProfile.rankName, userProfile.lastDayAllTasksCompleted, grantExp, grantStatExp, appSettings.autoAssignStatExp, setUserProfile, calculatePotentialTaskExp]);

  const undoCompleteTask = useCallback((taskId: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    const taskToUndoFromHistory = userProfile.taskHistory.find(ht => 
        ht.id === taskId && 
        (ht.taskType === 'ritual' ? ht.lastCompletedDate === todayStr : ht.dateCompleted === todayStr)
      );
    
    if (!taskToUndoFromHistory) {
      toast({ title: "Cannot Undo", description: "Task not found in today's completion history or cannot be undone.", variant: "destructive" });
      return;
    }
    
    // Use the exact values from the history record
    const expToRevoke = taskToUndoFromHistory.expAwarded;
    const statExpToRevoke = taskToUndoFromHistory.statExpGained;
    const attributeForStatRevoke = taskToUndoFromHistory.attributeAffectedForStatExp;

    if (expToRevoke === undefined) { 
      toast({ title: "Error Undoing", description: "Could not reliably determine EXP to revoke from history.", variant: "destructive" });
      return; // Cannot proceed if expAwarded is missing in history
    }
    
    grantExp(-(expToRevoke)); // Revoke general EXP

    if (attributeForStatRevoke && attributeForStatRevoke !== "None" && statExpToRevoke !== undefined) {
      grantStatExp(attributeForStatRevoke, -statExpToRevoke); // Revoke stat EXP
    }

    setTasks(prevTasks =>
      prevTasks.map(t => {
        if (t.id === taskId) {
          const updatedTask = { 
            ...t, 
            isCompleted: false, 
            expAwarded: undefined, // Clear from main task item
            statExpGained: undefined, 
            attributeAffectedForStatExp: undefined,
          };
          if (t.taskType === 'ritual') {
            updatedTask.lastCompletedDate = undefined;
            if (t.nextDueDate && isAfter(parseISO(t.nextDueDate), startOfDay(new Date()))) {
                updatedTask.nextDueDate = todayStr; 
            } else if (!t.nextDueDate || isBefore(parseISO(t.nextDueDate), startOfDay(new Date())) ) { // If next due was in past or undefined
                updatedTask.nextDueDate = todayStr;
            }
          } else {
            updatedTask.dateCompleted = undefined;
          }
          return updatedTask;
        }
        return t;
      })
    );

    setUserProfile(prev => {
      const newHistory = prev.taskHistory.filter(ht => 
         !(ht.id === taskId && (ht.taskType === 'ritual' ? ht.lastCompletedDate === todayStr : ht.dateCompleted === todayStr))
      );
      
      let newStreak = prev.currentStreak;
      let newLastDayAllTasksCompleted = prev.lastDayAllTasksCompleted;

      if (prev.lastDayAllTasksCompleted === todayStr) {
         newStreak = Math.max(0, prev.currentStreak - 1); 
         newLastDayAllTasksCompleted = format(subDays(parseISO(todayStr), 1), 'yyyy-MM-dd'); 
      }

      return {
          ...prev,
          taskHistory: newHistory,
          currentStreak: newStreak,
          lastDayAllTasksCompleted: newLastDayAllTasksCompleted,
      };
    });

    toast({ title: "Task Undone", description: `${taskToUndoFromHistory.name} reverted to incomplete.` });
    playSound('buttonClick');
  }, [userProfile.taskHistory, grantExp, grantStatExp, setTasks, setUserProfile, toast]);


  const getDailyDirectives = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => task.taskType === 'daily' && task.dateAdded === today);
  }, [tasks]);

  const getRituals = useCallback(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => {
      if (task.taskType !== 'ritual') return false;
      // Show if due today OR was completed today
      return task.nextDueDate === today || task.lastCompletedDate === today;
    });
  }, [tasks]);

  const getEventsForToday = useCallback(() => { 
    const today = format(new Date(), 'yyyy-MM-dd');
    return tasks.filter(task => task.taskType === 'event' && task.scheduledDate === today); 
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
      playSound('rivalProvoke');

    } catch (error) {
      console.error("Failed to get rival taunt:", error);
      setRival(prev => ({ ...prev, lastTaunt: "Hmph. My systems are... momentarily indisposed." }));
    }
  }, [userProfile.dailyTaskCompletionPercentage, userProfile.rankName, userProfile.subRank, rival.rankName, rival.subRank, setRival, isInitialized]);


  useEffect(() => {
    if (!isInitialized) return;

    const dailyCheck = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');

      if (rival.nextExpGainTime && now.toISOString() >= rival.nextExpGainTime) {
        const previousDayForExpCalc = format(subDays(parseISO(rival.nextExpGainTime), 1), 'yyyy-MM-dd');
        
        let userExpGainedForRival = 0;
        if (userProfile.lastExpResetDate === previousDayForExpCalc) {
            userExpGainedForRival = userProfile.expGainedToday;
        } else {
             const previousDayHistory = userProfile.taskHistory.filter(
                th => (th.dateCompleted === previousDayForExpCalc || th.lastCompletedDate === previousDayForExpCalc)
            );
            userExpGainedForRival = previousDayHistory.reduce((acc, currTask) => acc + (currTask.expAwarded || 0), 0);
        }
        
        const expFromUserUncompletedDailyTasks = tasks
          .filter(t => t.taskType === 'daily' && t.dateAdded === previousDayForExpCalc && !t.isCompleted)
          .reduce((sum, task) => sum + (task.baseExpValue !== undefined ? task.baseExpValue : calculatePotentialTaskExp(task, userProfile.rankName)), 0);
        
        const expFromUserUncompletedEventTasksForYesterday = tasks 
          .filter(t => t.taskType === 'event' && t.scheduledDate === previousDayForExpCalc && !t.isCompleted) 
          .reduce((sum, task) => sum + (task.baseExpValue !== undefined ? task.baseExpValue : calculatePotentialTaskExp(task, userProfile.rankName)), 0);
        
        const expFromUserUncompletedRitualTasksForYesterday = tasks
            .filter(t => t.taskType === 'ritual' && t.nextDueDate === previousDayForExpCalc && t.lastCompletedDate !== previousDayForExpCalc)
            .reduce((sum,task) => sum + (task.baseExpValue !== undefined ? task.baseExpValue : calculatePotentialTaskExp(task, userProfile.rankName)), 0);


        let baseRivalExpGain =
            (userExpGainedForRival * RIVAL_USER_DAILY_EXP_PERCENTAGE) +
            expFromUserUncompletedDailyTasks + 
            expFromUserUncompletedEventTasksForYesterday +
            expFromUserUncompletedRitualTasksForYesterday;


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

          while (newCurrentExp >= newExpToNext && newExpToNext > 0) {
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
            date: format(parseISO(prev.nextExpGainTime!), 'yyyy-MM-dd'), 
            expGained: expGainedByRival,
            totalExp: newTotalExp,
          };
          const updatedExpHistory = [...(prev.expHistory || []), newHistoryEntry].slice(-30); 

          const nextGainTime = startOfDay(addHours(parseISO(prev.nextExpGainTime!), 25)); 

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
        setUserProfile(prevUser => ({
            ...prevUser,
            expGainedToday: 0,
            lastExpResetDate: todayStr, 
        }));
      }

      const lastRitualProcessingDate = localStorage.getItem(`${APP_NAME}_lastRitualProcessingDate`);
      if (lastRitualProcessingDate !== todayStr) {
        setTasks(prevTasks =>
          prevTasks.map(task => {
            if (task.taskType === 'ritual') {
              const interval = task.repeatIntervalDays || 1;
              const currentNextDueDate = task.nextDueDate ? parseISO(task.nextDueDate) : parseISO(task.dateAdded);
              let newNextDueDateStr = task.nextDueDate || format(currentNextDueDate, 'yyyy-MM-dd');
              let needsUpdate = false;

              let tempNextDueDate = currentNextDueDate;
              while(isBefore(tempNextDueDate, startOfDay(now))) {
                tempNextDueDate = addDays(tempNextDueDate, interval);
                needsUpdate = true;
              }
              newNextDueDateStr = format(tempNextDueDate, 'yyyy-MM-dd');
              
              if (newNextDueDateStr === todayStr && task.lastCompletedDate !== todayStr) {
                return { ...task, nextDueDate: newNextDueDateStr, isCompleted: false };
              } else if (needsUpdate) {
                 return { ...task, nextDueDate: newNextDueDateStr };
              }
            }
            return task;
          })
        );
        localStorage.setItem(`${APP_NAME}_lastRitualProcessingDate`, todayStr);
      }
    };

    dailyCheck(); 
    const intervalId = setInterval(dailyCheck, 60000 * 5); 

    return () => clearInterval(intervalId);
  }, [isInitialized, rival.nextExpGainTime, userProfile, tasks, appSettings.rivalDifficulty, setRival, setUserProfile, calculatePotentialTaskExp, setTasks, calculateNextDueDate, calculateExpForNextSubRank]);


  useEffect(() => {
    if (!isInitialized) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tasksActionableToday = tasks.filter(task =>
        (task.taskType === 'daily' && task.dateAdded === todayStr) ||
        (task.taskType === 'ritual' && (task.nextDueDate === todayStr || task.lastCompletedDate === todayStr )) || 
        (task.taskType === 'event' && task.scheduledDate === todayStr)
    );

    const relevantTasksForCompletion = tasksActionableToday.filter(t =>
      (t.taskType === 'daily' && t.dateAdded === todayStr && t.isCompleted) ||
      (t.taskType === 'ritual' && t.lastCompletedDate === todayStr) || 
      (t.taskType === 'event' && t.scheduledDate === todayStr && t.isCompleted)
    );
    
    const completionPercentage = tasksActionableToday.length > 0
      ? (relevantTasksForCompletion.length / tasksActionableToday.length) * 100
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
    playSound('buttonClick');
  };

  const updateIntervalTimerSetting = (updatedSetting: IntervalTimerSetting) => {
    setIntervalTimerSettings(prev => prev.map(s => s.id === updatedSetting.id ? updatedSetting : s));
     playSound('buttonClick');
  };

  const deleteIntervalTimerSetting = (settingId: string) => {
    setIntervalTimerSettings(prev => prev.filter(s => s.id !== settingId));
     playSound('buttonClick'); 
  };

  const addCustomGraph = (graphData: Omit<CustomGraphSetting, 'id' | 'data'>) => {
    const newGraph: CustomGraphSetting = {
      ...graphData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      data: {},
    };
    setCustomGraphs(prev => [...prev, newGraph]);
     playSound('buttonClick');
  };

  const updateCustomGraph = (updatedGraph: CustomGraphSetting) => {
    setCustomGraphs(prev => prev.map(g => g.id === updatedGraph.id ? updatedGraph : g));
     playSound('buttonClick');
  };

  const deleteCustomGraph = (graphId: string) => {
    setCustomGraphs(prev => prev.filter(g => g.id !== graphId));
    setCustomGraphDailyLogs(prevLogs => {
      const newLogs = {...prevLogs};
      delete newLogs[graphId];
      return newLogs;
    });
    playSound('buttonClick'); 
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
       setTasks(prevTasks =>
        prevTasks.map(task => {
          if (task.taskType === 'ritual') {
            const interval = task.repeatIntervalDays || 1;
            const newNextDueDate = calculateNextDueDate(task.nextDueDate || task.dateAdded, interval);
            if (task.nextDueDate !== newNextDueDate) {
              return { ...task, nextDueDate: newNextDueDate };
            }
          }
          return task;
        })
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, commitStaleDailyLogs, calculateNextDueDate]);


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
      addTask, updateTask, deleteTask, completeTask, undoCompleteTask,
      getDailyDirectives, getRituals, getEventsForToday, 
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
