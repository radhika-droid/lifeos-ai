/* ═══════════════════════════════════════
   LifeOS TypeScript Interfaces
   Mirrors backend Pydantic schemas
   ═══════════════════════════════════════ */

// ── Auth ──────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

// ── Tasks ─────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type EnergyLevel = 'low' | 'medium' | 'high';

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description: string;
  priority: number;
  estimated_minutes: number;
  due_date: string | null;
  status: TaskStatus;
  energy_required: EnergyLevel;
  goal_id: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface TaskCreate {
  title: string;
  description?: string;
  priority?: number;
  estimated_minutes?: number;
  due_date?: string | null;
  energy_required?: EnergyLevel;
  goal_id?: number | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  priority?: number;
  estimated_minutes?: number;
  due_date?: string | null;
  status?: TaskStatus;
  energy_required?: EnergyLevel;
  goal_id?: number | null;
}

export interface ScoredTask extends Task {
  score: number;
  reason: string;
}

// ── Habits ────────────────────────────

export interface Habit {
  id: number;
  user_id: number;
  name: string;
  target_frequency: string;
  streak_count: number;
  last_logged_at: string | null;
  created_at: string;
}

export interface HabitCreate {
  name: string;
  target_frequency?: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  logged_at: string;
  completed: boolean;
}

// ── Goals ─────────────────────────────

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description: string;
  target_date: string | null;
  progress_percent: number;
  created_at: string;
  task_count: number;
  completed_task_count: number;
}

export interface GoalCreate {
  title: string;
  description?: string;
  target_date?: string | null;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  target_date?: string | null;
  progress_percent?: number;
}

// ── Check-in ──────────────────────────

export interface CheckIn {
  id: number;
  user_id: number;
  date: string;
  energy_level: number;
  mood: number;
  available_minutes: number;
  created_at: string;
}

export interface CheckInCreate {
  energy_level: number;
  mood: number;
  available_minutes: number;
}

// ── Recommendations ───────────────────

export interface RecommendRequest {
  energy_level: number;
  available_minutes: number;
  time_of_day: string;
}

// ── Notifications ─────────────────────

export interface Notification {
  id: number;
  message: string;
  type: string;
  read: boolean;
  created_at: string | null;
}

// ── Analytics ─────────────────────────

export interface HabitAnalytics {
  habit_id: number;
  name: string;
  streak_count: number;
  completion_rate: number;
  completed_days: number;
  total_days: number;
  daily_completions: Record<string, boolean>;
}

export interface ProductivityAnalytics {
  total_completed: number;
  total_pending: number;
  avg_priority_tackled: number;
  daily_completions: Array<{ date: string; completed: number }>;
  period_days: number;
}
