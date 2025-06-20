
import type { Attribute, RankName } from './types';

export const APP_NAME = "Cursebreaker_Codex";

export const RANK_NAMES_LIST: RankName[] = [
  "Aether Disciple",
  "Mystic Initiate",
  "Astral Adept",
  "Voidwalker",
  "Shadow Forger",
  "Chrono Ascendant",
  "Oblivion Herald",
  "Eclipse Sovereign",
  "Eternal Apex",
];

export const MAX_SUB_RANKS = 10;
export const BASE_EXP_PER_SUBRANK = 300; // Changed from 100 to 300
export const EXP_SCALING_FACTOR = 1.5;

export const TASK_DIFFICULTY_EXP_MULTIPLIER = {
  Easy: 1,
  Moderate: 1.5,
  Hard: 2.5,
};

// Base EXP gained per task completion, before difficulty and rank scaling
export const BASE_TASK_EXP = 10; 

// How much rank influences EXP gain from tasks (e.g. 1 means current rank index + 1 multiplier)
export const RANK_EXP_SCALING_FACTOR = 0.1; 

export const ATTRIBUTES: Attribute[] = ["Strength", "Intelligence", "Endurance", "Creativity", "Charisma", "None"];

export const STREAK_THRESHOLD_PERCENTAGE = 70;

// Local storage keys
export const LOCAL_STORAGE_USER_PROFILE_KEY = 'cursebreakerCodexUserProfile';
export const LOCAL_STORAGE_RIVAL_KEY = 'cursebreakerCodexRival';
export const LOCAL_STORAGE_TASKS_KEY = 'cursebreakerCodexTasks';
export const LOCAL_STORAGE_SETTINGS_KEY = 'cursebreakerCodexSettings';
export const LOCAL_STORAGE_POMODORO_KEY = 'cursebreakerCodexPomodoro';
export const LOCAL_STORAGE_INTERVAL_TIMER_KEY = 'cursebreakerCodexIntervalTimer';

export const RIVAL_NAMES_POOL = ["Kairos", "Zevik", "Ayen", "Lyra", "Sorin", "Vexia", "Draven"];

// New constants for rival EXP calculation
export const RIVAL_USER_DAILY_EXP_PERCENTAGE = 0.3; // Rival gets 30% of what user gained "yesterday"
export const RIVAL_DIFFICULTY_MULTIPLIERS = {
  Easy: 0.7,   // Rival gains 70% of the base calculated amount
  Normal: 1.0, // Rival gains 100%
  Hard: 1.3,   // Rival gains 130%
};
export const RIVAL_CATCH_UP_EXP_DIFFERENCE = 1000; // If rival is this much EXP behind user
export const RIVAL_CATCH_UP_BOOST_MULTIPLIER = 1.5; // They get a 1.5x boost on their daily gain

