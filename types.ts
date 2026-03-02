
export type Instrument = string;

export interface RehearsalSchedule {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface VacationPeriod {
  startDate: string; // ISO string
  endDate: string; // ISO string
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  password?: string;
  passcode: string; // 6-digit unique auth code
  instrument: Instrument;
  role: 'member' | 'admin';
  temp_access_from?: string | null; // ISO string
  temp_access_until: string | null; // ISO string
  other_parts_access_until?: string | null; // ISO string
  allowed_other_parts?: Instrument[];
  joined_at?: string; // ISO string
}

export interface Score {
  instrument: Instrument;
  notion_url: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  instrument: Instrument;
  accessedAt: string; // ISO string
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
