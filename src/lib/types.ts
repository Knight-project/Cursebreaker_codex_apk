
export type Attribute = "Strength" | "Intelligence" | "Endurance" | "Creativity" | "Charisma" | "None";

export interface Task {
  id: string;
  name: string;
  difficulty: "Easy" | "Moderate" | "Hard";
  attribute: Attribute;
  isCompleted: boolean;
  dateAdded: string; // ISO string
  dateCompleted?: string; // ISO string
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
  taskHistory: Task[]; // Potentially move to a separate store for large histories
  journalEntries: { [date: string]: string }; // date is YYYY-MM-DD
  avatarUrl?: string;
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

export interface IntervalTimerSettings {
  windowStart: string; // HH:mm
  windowEnd: string; // HH:mm
  repeatInterval: number; // minutes
  taskName: string;
  isEnabled: boolean;
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
  avatarUrl: '', // Default to empty or a placeholder like `https://placehold.co/100x100.png`
};

export const INITIAL_RIVAL: Rival = {
  name: "Kairos", // Default, can be randomized
  rankName: RANK_NAMES[0],
  subRank: 1,
  totalExp: 0,
  expToNextSubRank: 100,
  currentExpInSubRank: 0,
  avatarUrl: `https://placehold.co/120x120.png`, // Consistent size
};

export const INITIAL_APP_SETTINGS: AppSettings = {
  enableAnimations: true,
  rivalDifficulty: "Normal",
  autoAssignStatExp: true,
};
