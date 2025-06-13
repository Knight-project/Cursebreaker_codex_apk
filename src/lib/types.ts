
export type Attribute = "Strength" | "Intelligence" | "Endurance" | "Creativity" | "Charisma" | "None";
export type TaskType = 'daily' | 'ritual' | 'protocol';

export interface Task {
  id: string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  attribute: Attribute;
  taskType: TaskType;
  isCompleted: boolean;
  dateAdded: string; // ISO string (creation date for all types)
  dateCompleted?: string; // ISO string (general completion, for daily/protocol)
  lastCompletedDate?: string; // ISO string (for rituals, marks last day completed)
  scheduledDate?: string; // ISO string (for protocol tasks)
  statExpGained?: number; // EXP gained for the specific attribute
  attributeAffectedForStatExp?: Attribute; // Which attribute got the stat EXP
}

export interface UserStat {
  level: number;
  exp: number;
  expToNextLevel: number;
}

export interface UserProfile {
  rankName: string;
  subRank: number; // 1-10
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
  dailyTaskCompletionPercentage: number; // 0-100
  customQuote: string;
  taskHistory: Task[]; // Stores completed tasks with details like statExpGained
  journalEntries: { [date: string]: string }; // date is YYYY-MM-DD
  avatarUrl?: string;
  expGainedToday: number; // Tracks EXP user gained since last daily reset
  lastExpResetDate: string; // YYYY-MM-DD, records when expGainedToday was last reset
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
  nextExpGainTime?: string; // ISO string for the next scheduled EXP gain
}

export interface AppSettings {
  enableAnimations: boolean;
  rivalDifficulty: "Easy" | "Normal" | "Hard"; // Affects EXP gain rate
  autoAssignStatExp: boolean;
}

export interface PomodoroSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}

export interface IntervalTimerSetting {
  id: string;
  taskName: string;
  isEnabled: boolean;
  timerMode: 'windowed' | 'duration';

  // Windowed mode specific (optional)
  windowStart?: string; // HH:mm
  windowEnd?: string; // HH:mm

  // Duration mode specific (optional)
  durationHours?: number;
  durationMinutes?: number;
  startTime?: string; // ISO string, when the current duration period started

  repeatInterval: number; // minutes (common to both)
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
  data: { [variableId: string]: { [date: string]: number } }; // date is YYYY-MM-DD
}

// For storing today's uncommitted graph data
export interface DailyGraphLog {
  date: string; // YYYY-MM-DD, should always be "today"
  value: number;
}
export interface CustomGraphDailyLogs {
  [graphId: string]: {
    [variableId: string]: DailyGraphLog;
  };
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
  rankName: RANK_NAMES[0],
  subRank: 1,
  totalExp: 0,
  expToNextSubRank: 100,
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
  avatarUrl: '',
  expGainedToday: 0,
  lastExpResetDate: new Date().toISOString().split('T')[0],
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(0, 0, 0, 0); // Set to midnight

export const INITIAL_RIVAL: Rival = {
  name: "Kairos",
  rankName: RANK_NAMES[0],
  subRank: 1,
  totalExp: 0,
  expToNextSubRank: 100,
  currentExpInSubRank: 0,
  avatarUrl: `https://placehold.co/120x120.png`,
  expHistory: [],
  nextExpGainTime: tomorrow.toISOString(),
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  enableAnimations: true,
  rivalDifficulty: "Normal",
  autoAssignStatExp: true,
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
