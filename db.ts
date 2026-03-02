
import { User, Score, Instrument, Announcement, RehearsalSchedule, VacationPeriod, AccessLog } from './types';

const INITIAL_USERS: User[] = [
  { id: 'admin', name: 'Admin User', password: 'admin-password', passcode: '000000', instrument: 'Piano', role: 'admin', temp_access_until: null, joined_at: new Date('2024-01-01').toISOString() },
  { id: 'haegeum1', name: '김해금', password: '1234', passcode: '123456', instrument: 'Haegeum', role: 'member', temp_access_until: null, joined_at: new Date('2024-02-15').toISOString() },
  { id: 'cello1', name: '이첼로', password: '1234', passcode: '654321', instrument: 'Cello', role: 'member', temp_access_until: null, joined_at: new Date('2024-03-10').toISOString() },
];

const INSTRUMENTS_KEY = 'orchestra_gateway_instruments';
const TRANSLATIONS_KEY = 'orchestra_gateway_translations';
const REHEARSAL_SCHEDULE_KEY = 'orchestra_gateway_rehearsal_schedule';
const VACATION_PERIOD_KEY = 'orchestra_gateway_vacation_period';
const ACCESS_LOGS_KEY = 'orchestra_gateway_access_logs';

const DEFAULT_REHEARSAL_SCHEDULE: RehearsalSchedule[] = [
  { id: 'tue', dayOfWeek: 2, startTime: '18:00', endTime: '23:00' },
  { id: 'sat', dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }
];

const DEFAULT_VACATION_PERIOD: VacationPeriod = {
  startDate: '',
  endDate: '',
  isActive: false
};

const DEFAULT_INSTRUMENTS: Instrument[] = [
  'FullScore', 'Sogeum', 'Daegeum', 'Piri', 'Daepiri', 'Saenghwang', 
  'Taepyeongso', 'Haegeum', 'Ajaeng', 'Gayageum', 'Geumungo', 
  'Yanggeum', 'Percussion', 'Piano', 'Flute', 'Panflute', 'Cello'
];

const DEFAULT_TRANSLATIONS: Record<string, string> = {
  'Sogeum': '소금', 'Daegeum': '대금', 'Piri': '피리', 'Daepiri': '대피리', 'Saenghwang': '생황',
  'Taepyeongso': '태평소', 'Haegeum': '해금', 'Ajaeng': '아쟁', 'Gayageum': '가야금', 'Geumungo': '거문고',
  'Yanggeum': '양금', 'Percussion': '타악', 'Piano': '피아노', 'Flute': '플룻', 'Panflute': '팬플룻', 'Cello': '첼로', 'FullScore': '총보(스코어)'
};

export const getStoredInstruments = (): Instrument[] => {
  const stored = localStorage.getItem(INSTRUMENTS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_INSTRUMENTS;
};

export const saveInstruments = (instruments: Instrument[]) => {
  localStorage.setItem(INSTRUMENTS_KEY, JSON.stringify(instruments));
};

export const getStoredTranslations = (): Record<string, string> => {
  const stored = localStorage.getItem(TRANSLATIONS_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_TRANSLATIONS;
};

export const saveTranslations = (translations: Record<string, string>) => {
  localStorage.setItem(TRANSLATIONS_KEY, JSON.stringify(translations));
};

export const getInstrumentName = (id: string): string => {
  const translations = getStoredTranslations();
  return translations[id] || id;
};

// Re-exporting for compatibility but they should be used as functions now
export let INSTRUMENTS = getStoredInstruments();
export let instrumentTranslation = getStoredTranslations();

// Helper to refresh the exported variables
const refreshExports = () => {
  INSTRUMENTS = getStoredInstruments();
  instrumentTranslation = getStoredTranslations();
};

export const addInstrument = (name: string) => {
  const instruments = getStoredInstruments();
  const translations = getStoredTranslations();
  const id = name; // Use name as ID as requested
  
  if (!instruments.includes(id)) {
    instruments.push(id);
    translations[id] = name;
    saveInstruments(instruments);
    saveTranslations(translations);
    refreshExports();
    
    // Also add a default score for it
    const scores = getStoredScores();
    if (!scores.some(s => s.instrument === id)) {
      scores.push({
        instrument: id,
        notion_url: `https://notion.so/orchestra/${encodeURIComponent(id.toLowerCase())}-scores`
      });
      saveScores(scores);
    }
  }
};

export const deleteInstrument = (id: string) => {
  const instruments = getStoredInstruments();
  const translations = getStoredTranslations();
  
  const filtered = instruments.filter(i => i !== id);
  if (filtered.length !== instruments.length) {
    saveInstruments(filtered);
    delete translations[id];
    saveTranslations(translations);
    refreshExports();
    
    // Also delete the score for it
    const scores = getStoredScores();
    const filteredScores = scores.filter(s => s.instrument !== id);
    saveScores(filteredScores);
  }
};

const INITIAL_SCORES: Score[] = DEFAULT_INSTRUMENTS.map(inst => ({
  instrument: inst,
  notion_url: `https://notion.so/orchestra/${inst.toLowerCase().replace(' ', '-')}-scores`
}));

const USERS_KEY = 'orchestra_gateway_users';
const SCORES_KEY = 'orchestra_gateway_scores';
const ANNOUNCEMENTS_KEY = 'orchestra_gateway_announcements';

export const getStoredAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveAnnouncements = (announcements: Announcement[]) => {
  localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
};

export const getStoredRehearsalSchedule = (): RehearsalSchedule[] => {
  const stored = localStorage.getItem(REHEARSAL_SCHEDULE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_REHEARSAL_SCHEDULE;
};

export const saveRehearsalSchedule = (schedule: RehearsalSchedule[]) => {
  localStorage.setItem(REHEARSAL_SCHEDULE_KEY, JSON.stringify(schedule));
};

export const getStoredVacationPeriod = (): VacationPeriod => {
  const stored = localStorage.getItem(VACATION_PERIOD_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_VACATION_PERIOD;
};

export const saveVacationPeriod = (period: VacationPeriod) => {
  localStorage.setItem(VACATION_PERIOD_KEY, JSON.stringify(period));
};

export const getStoredAccessLogs = (): AccessLog[] => {
  const stored = localStorage.getItem(ACCESS_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveAccessLogs = (logs: AccessLog[]) => {
  localStorage.setItem(ACCESS_LOGS_KEY, JSON.stringify(logs));
};

export const addAccessLog = (user: User, instrument: Instrument) => {
  const logs = getStoredAccessLogs();
  const newLog: AccessLog = {
    id: Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    instrument,
    accessedAt: new Date().toISOString()
  };
  // Keep only last 1000 logs to avoid localStorage bloat
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  saveAccessLogs(updatedLogs);
};

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) return INITIAL_USERS;
  
  const users: User[] = JSON.parse(stored);
  // Migration: Ensure all users have a passcode
  let needsUpdate = false;
  const migratedUsers = users.map(u => {
    // Force admin passcode to '000000' as requested
    if (u.id === 'admin' && u.passcode !== '000000') {
      needsUpdate = true;
      return { ...u, passcode: '000000' };
    }
    if (!u.passcode) {
      needsUpdate = true;
      return { ...u, passcode: Math.floor(100000 + Math.random() * 900000).toString() };
    }
    return u;
  });

  if (needsUpdate) {
    saveUsers(migratedUsers);
  }
  
  return migratedUsers;
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const getStoredScores = (): Score[] => {
  const stored = localStorage.getItem(SCORES_KEY);
  const scores: Score[] = stored ? JSON.parse(stored) : INITIAL_SCORES;
  
  // Ensure all instruments have a score entry (Migration for new instruments like FullScore)
  let updated = false;
  const currentInstruments = getStoredInstruments();
  const finalScores = currentInstruments.map(inst => {
    const existing = scores.find(s => s.instrument === inst);
    if (existing) return existing;
    updated = true;
    return { 
      instrument: inst, 
      notion_url: `https://notion.so/orchestra/${inst.toLowerCase().replace(' ', '-')}-scores` 
    };
  });
  
  if (updated) {
    saveScores(finalScores);
  }
  
  return finalScores;
};

export const saveScores = (scores: Score[]) => {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
};

// Added getScoreForInstrument to fix import error in App.tsx
export const getScoreForInstrument = (instrument: Instrument): string => {
  const scores = getStoredScores();
  const score = scores.find(s => s.instrument === instrument);
  return score ? score.notion_url : '';
};

export const registerUser = (userData: Omit<User, 'role' | 'temp_access_until' | 'joined_at' | 'passcode'>): { success: boolean; message: string; passcode?: string } => {
  const users = getStoredUsers();
  if (users.some(u => u.id === userData.id)) return { success: false, message: 'ID already exists.' };
  
  // Generate 6-digit passcode
  const passcode = Math.floor(100000 + Math.random() * 900000).toString();
  
  const newUser: User = { 
    ...userData, 
    passcode,
    role: 'member', 
    temp_access_until: null,
    joined_at: new Date().toISOString()
  };
  saveUsers([...users, newUser]);
  return { success: true, message: 'Registration successful!', passcode };
};

export const updateUser = (userId: string, updates: Partial<User>) => {
  const users = getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  saveUsers(updated);
};

export const deleteUser = (userId: string): boolean => {
  const users = getStoredUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
};

export const isAccessAllowed = (user: User): { allowed: boolean; reason?: string } => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  // 1. 관리자 권한 체크 (최우선)
  if (user.role === 'admin') return { allowed: true, reason: 'Admin Privilege' };

  // 2. 임시 접근 권한 체크 (관리자가 수동으로 부여한 권한)
  if (user.temp_access_until) {
    try {
      const until = new Date(user.temp_access_until);
      const from = user.temp_access_from ? new Date(user.temp_access_from) : null;
      
      if (!isNaN(until.getTime())) {
        const isAfterFrom = !from || isNaN(from.getTime()) || now >= from;
        const isBeforeUntil = now < until;
        
        if (isAfterFrom && isBeforeUntil) {
          return { allowed: true, reason: 'Temp Access' };
        }
      }
    } catch (e) {
      console.error('Error parsing access dates:', e);
    }
  }

  // 3. 방학 기간 체크 (정기 연습 시간 자동 승인을 차단)
  const vacation = getStoredVacationPeriod();
  if (vacation.isActive && vacation.startDate && vacation.endDate) {
    const start = new Date(vacation.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(vacation.endDate);
    end.setHours(23, 59, 59, 999);
    if (now >= start && now <= end) {
      return { allowed: false, reason: 'Vacation Period' };
    }
  }

  // 4. 정기 연습 시간 체크
  const schedule = getStoredRehearsalSchedule();
  const isRehearsalTime = schedule.some(s => {
    if (s.dayOfWeek !== day) return false;
    return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
  });

  if (isRehearsalTime) return { allowed: true, reason: 'Regular Rehearsal' };
  
  return { allowed: false, reason: 'Locked' };
};
