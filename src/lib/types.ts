
import type { format } from 'date-fns';

export type Attribute = "Strength" | "Intelligence" | "Endurance" | "Creativity" | "Charisma" | "None";
export type TaskType = 'daily' | 'ritual' | 'event';

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetDate?: string; // ISO string
  status: 'active' | 'completed' | 'archived';
  linkedTaskIds: string[];
  createdAt: string; // ISO string
}

export interface Task {
  id:string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  attribute: Attribute;
  taskType: TaskType;
  isCompleted: boolean;
  dateAdded: string;
  baseExpValue: number;
  goalId?: string; // New: Link to a goal

  dateCompleted?: string;

  lastCompletedDate?: string;
  repeatIntervalDays?: number;
  nextDueDate?: string;

  scheduledDate?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  reminderOffsetMinutes?: number;

  statExpGained?: number;
  attributeAffectedForStatExp?: Attribute;
  expAwarded?: number;
}

export interface UserStat {
  level: number;
  exp: number;
  expToNextLevel: number;
}

export interface UserProfile {
  userName: string;
  rankName: string;
  subRank: number;
  totalExp: number;
  expToNextSubRank: number;
  currentExpInSubRank: number;
  stats: {
    strength: UserStat;
    intelligence: UserStat;
    endurance: UserStat;
    creativity: UserStat;
    charisma: UserStat;
  };
  currentStreak: number;
  dailyTaskCompletionPercentage: number;
  customQuote: string;
  taskHistory: Task[];
  journalEntries: { [date: string]: string };
  hourlyJournalEntries: { [date: string]: { [hour: string]: string } };
  avatarUrl?: string;
  expGainedToday: number;
  lastExpResetDate: string;
  lastDayAllTasksCompleted: string; // Kept for potential future reference, but not used for current "Consecutive Ops"
  goals: Goal[]; // New: User's goals
}

export interface Rival {
  name: string;
  rankName: string;
  subRank: number;
  totalExp: number;
  expToNextSubRank: number;
  currentExpInSubRank: number;
  avatarUrl?: string;
  lastTaunt?: string;
  expHistory: Array<{ date: string; expGained: number; totalExp: number }>;
  nextExpGainTime?: string;
}

export interface AppSettings {
  enableAnimations: boolean;
  rivalDifficulty: "Easy" | "Normal" | "Hard";
  autoAssignStatExp: boolean;
  enableSoundEffects: boolean;
  rivalName?: string;
}

export interface PomodoroSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export interface IntervalTimerSetting {
  id: string;
  taskName: string;
  isEnabled: boolean;
  timerMode: 'windowed' | 'duration';
  windowStart?: string;
  windowEnd?: string;
  durationHours?: number;
  durationMinutes?: number;
  startTime?: string;
  repeatInterval: number;
}

export interface CustomGraphVariable {
  id: string;
  name: string;
  color: string;
}

export type TimeView = 'weekly' | 'monthly' | 'yearly' | 'alltime';

export interface CustomGraphSetting {
  id: string;
  name: string;
  timeView: TimeView;
  variables: CustomGraphVariable[];
  data: { [variableId: string]: { [date: string]: number } };
}

export interface DailyGraphLog {
  date: string;
  value: number;
}
export interface CustomGraphDailyLogs {
  [graphId: string]: {
    [variableId: string]: DailyGraphLog;
  };
}

export interface AppSaveData {
  userProfile: UserProfile; // Will now contain goals
  tasks: Task[];
  rival: Rival;
  appSettings: AppSettings;
  pomodoroSettings: PomodoroSettings;
  intervalTimerSettings: IntervalTimerSetting[];
  customGraphs: CustomGraphSetting[];
  customGraphDailyLogs: CustomGraphDailyLogs;
  saveFileVersion: string; // Updated to 1.0.1 for goal feature
  appName: string;
}


export const RANK_NAMES = [
  "Aether Disciple",
  "Mystic Initiate",
  "Astral Adept",
  "Voidwalker",
  "Shadow Forger",
  "Chrono Ascendant",
  "Oblivion Herald",
  "Eclipse Sovereign",
  "Eternal Apex",
] as const;

export type RankName = (typeof RANK_NAMES)[number];

export const ATTRIBUTES_LIST: Attribute[] = ["Strength", "Intelligence", "Endurance", "Creativity", "Charisma"];

export const DEFAULT_USER_STAT: UserStat = {
  level: 1,
  exp: 0,
  expToNextLevel: 100,
};

export const INITIAL_USER_PROFILE: UserProfile = {
  userName: "Codex User",
  rankName: RANK_NAMES[0],
  subRank: 1,
  totalExp: 0,
  expToNextSubRank: 300,
  currentExpInSubRank: 0,
  stats: {
    strength: { ...DEFAULT_USER_STAT },
    intelligence: { ...DEFAULT_USER_STAT },
    endurance: { ...DEFAULT_USER_STAT },
    creativity: { ...DEFAULT_USER_STAT },
    charisma: { ...DEFAULT_USER_STAT },
  },
  currentStreak: 0,
  dailyTaskCompletionPercentage: 0,
  customQuote: "The journey of a thousand miles begins with a single step.",
  taskHistory: [],
  journalEntries: {},
  hourlyJournalEntries: {},
  avatarUrl: '',
  expGainedToday: 0,
  lastExpResetDate: new Date().toISOString().split('T')[0],
  lastDayAllTasksCompleted: "",
  goals: [], // New: Initialize goals as empty array
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0);

export const INITIAL_RIVAL: Rival = {
  name: "Kairos",
  rankName: RANK_NAMES[0],
  subRank: 1,
  totalExp: 0,
  expToNextSubRank: 300,
  currentExpInSubRank: 0,
  avatarUrl: `https://placehold.co/120x120.png`,
  expHistory: [],
  nextExpGainTime: tomorrow.toISOString(),
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  enableAnimations: true,
  rivalDifficulty: "Normal",
  autoAssignStatExp: true,
  enableSoundEffects: true,
  rivalName: "Kairos",
};

export const INITIAL_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

export const INITIAL_INTERVAL_TIMER_SETTINGS: IntervalTimerSetting[] = [];
export const INITIAL_CUSTOM_GRAPHS: CustomGraphSetting[] = [];
export const INITIAL_CUSTOM_GRAPH_DAILY_LOGS: CustomGraphDailyLogs = {};


export const CHART_COLOR_OPTIONS = [
  { label: 'Chart Color 1 (Cyan)', value: 'hsl(var(--chart-1))', key: 'chart-1' },
  { label: 'Chart Color 2 (Orange)', value: 'hsl(var(--chart-2))', key: 'chart-2' },
  { label: 'Chart Color 3 (Magenta)', value: 'hsl(var(--chart-3))', key: 'chart-3' },
  { label: 'Chart Color 4 (Yellow)', value: 'hsl(var(--chart-4))', key: 'chart-4' },
  { label: 'Chart Color 5 (Green)', value: 'hsl(var(--chart-5))', key: 'chart-5' },
  { label: 'Chart Color 6 (Blue)', value: 'hsl(var(--chart-6))', key: 'chart-6' },
  { label: 'Chart Color 7 (Pink)', value: 'hsl(var(--chart-7))', key: 'chart-7' },
  { label: 'Chart Color 8 (Teal)', value: 'hsl(var(--chart-8))', key: 'chart-8' },
];

export const REMINDER_OPTIONS = [
  { label: "No reminder", value: 0 },
  { label: "5 minutes before", value: 5 },
  { label: "15 minutes before", value: 15 },
  { label: "30 minutes before", value: 30 },
  { label: "1 hour before", value: 60 },
];
