export type Role = 'admin' | 'member';

export interface Profile {
  id: string;
  email: string;
  username: string;
  role: Role;
  created_at: string;
  last_active_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  plan_id: string | null;
  max_members: number;
  is_archived: boolean;
  created_at: string;
}

export interface GroupMembership {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  group?: Group;
  profile?: Profile;
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_by: string;
  created_at: string;
}

export interface PlanEntry {
  id: string;
  plan_id: string;
  scheduled_date: string;
  book: string;
  chapter_start: number;
  verse_start: number | null;
  chapter_end: number;
  verse_end: number | null;
}

export type ReadingStatus = 'complete' | 'skipped';

export interface ReadingLog {
  id: string;
  user_id: string;
  plan_entry_id: string;
  status: ReadingStatus;
  enjoyment: string | null;
  enlightenment: string | null;
  is_private: boolean;
  logged_at: string;
  plan_entry?: PlanEntry;
  profile?: Profile;
}
