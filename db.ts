
import { User, Score, Instrument, Announcement, RehearsalSchedule, VacationPeriod, AccessLog } from './types';

const INSTRUMENTS_KEY = 'orchestra_gateway_instruments';
const TRANSLATIONS_KEY = 'orchestra_gateway_translations';
const REHEARSAL_SCHEDULE_KEY = 'orchestra_gateway_rehearsal_schedule';
const VACATION_PERIOD_KEY = 'orchestra_gateway_vacation_period';
const ACCESS_LOGS_KEY = 'orchestra_gateway_access_logs';
const USERS_KEY = 'orchestra_gateway_users';
const SCORES_KEY = 'orchestra_gateway_scores';
const ANNOUNCEMENTS_KEY = 'orchestra_gateway_announcements';

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

const LOCAL_DEFAULTS: Record<string, any> = {
  [USERS_KEY]: [
    { id: 'admin', name: 'Admin User', password: 'admin', passcode: '000000', instrument: 'Piano', role: 'admin', temp_access_until: null, joined_at: new Date('2024-01-01').toISOString() },
  ],
  [INSTRUMENTS_KEY]: DEFAULT_INSTRUMENTS,
  [TRANSLATIONS_KEY]: DEFAULT_TRANSLATIONS,
  [REHEARSAL_SCHEDULE_KEY]: [
    { id: 'tue', dayOfWeek: 2, startTime: '18:00', endTime: '23:00' },
    { id: 'sat', dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }
  ],
  [VACATION_PERIOD_KEY]: { startDate: '', endDate: '', isActive: false },
  [SCORES_KEY]: DEFAULT_INSTRUMENTS.map(inst => ({
    instrument: inst,
    notion_url: `https://notion.so/orchestra/${inst.toLowerCase().replace(' ', '-')}-scores`
  })),
  [ANNOUNCEMENTS_KEY]: [],
  [ACCESS_LOGS_KEY]: []
};

// Cache for synchronous access
let dbCache: Record<string, any> = { ...LOCAL_DEFAULTS };

// Helper to fetch data from server
const fetchFromServer = async (key: string) => {
  try {
    const response = await fetch(`${window.location.origin}/api/data/${key}`);
    if (response.ok) {
      const data = await response.json();
      if (data) {
        dbCache[key] = data;
        return data;
      }
    }
  } catch (e) {
    console.error(`Error fetching ${key} from server:`, e);
  }
  return dbCache[key]; // Return cached/default if fetch fails
};

// Helper to save data to server
const saveToServer = async (key: string, data: any) => {
  dbCache[key] = data; // Update cache immediately
  try {
    await fetch(`${window.location.origin}/api/data/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch (e) {
    console.error(`Error saving ${key} to server:`, e);
  }
};

// Initialization function to be called at app start
export const initDB = async () => {
  const keys = [
    INSTRUMENTS_KEY, TRANSLATIONS_KEY, REHEARSAL_SCHEDULE_KEY, 
    VACATION_PERIOD_KEY, ACCESS_LOGS_KEY, USERS_KEY, 
    SCORES_KEY, ANNOUNCEMENTS_KEY
  ];
  
  // 1. Fetch all data from server
  await Promise.all(keys.map(key => fetchFromServer(key)));
  
  // 2. Migration: If server data is default/empty but localStorage has data, sync it to server
  for (const key of keys) {
    const localData = localStorage.getItem(key);
    if (localData) {
      try {
        const parsedLocal = JSON.parse(localData);
        const serverData = dbCache[key];
        
        // If server data is just the default admin or empty, and local has more
        if (key === USERS_KEY) {
          if (Array.isArray(parsedLocal) && parsedLocal.length > (Array.isArray(serverData) ? serverData.length : 0)) {
            console.log(`Migrating ${key} to server...`);
            // Merge users (keep server users, add local users that don't exist by ID)
            const merged = [...(Array.isArray(serverData) ? serverData : [])];
            parsedLocal.forEach((u: any) => {
              if (!merged.find(m => m.id === u.id)) {
                merged.push(u);
              }
            });
            await saveToServer(key, merged);
          }
        } else if (key === ACCESS_LOGS_KEY || key === ANNOUNCEMENTS_KEY) {
           if (Array.isArray(parsedLocal) && parsedLocal.length > 0 && (!serverData || serverData.length === 0)) {
             await saveToServer(key, parsedLocal);
           }
        }
      } catch (e) {
        console.error(`Migration error for ${key}:`, e);
      }
    }
  }
  
  // Refresh exported variables
  INSTRUMENTS = getStoredInstruments();
  instrumentTranslation = getStoredTranslations();
};

export const getStoredInstruments = (): Instrument[] => {
  return dbCache[INSTRUMENTS_KEY] || LOCAL_DEFAULTS[INSTRUMENTS_KEY];
};

export const saveInstruments = (instruments: Instrument[]) => {
  saveToServer(INSTRUMENTS_KEY, instruments);
};

export const getStoredTranslations = (): Record<string, string> => {
  return dbCache[TRANSLATIONS_KEY] || LOCAL_DEFAULTS[TRANSLATIONS_KEY];
};

export const saveTranslations = (translations: Record<string, string>) => {
  saveToServer(TRANSLATIONS_KEY, translations);
};

export const getInstrumentName = (id: string): string => {
  const translations = getStoredTranslations();
  return translations[id] || id;
};

export let INSTRUMENTS = getStoredInstruments();
export let instrumentTranslation = getStoredTranslations();

export const addInstrument = (name: string) => {
  const instruments = getStoredInstruments();
  const translations = getStoredTranslations();
  const id = name;
  
  if (!instruments.includes(id as Instrument)) {
    instruments.push(id as Instrument);
    translations[id] = name;
    saveInstruments(instruments);
    saveTranslations(translations);
    
    const scores = getStoredScores();
    if (!scores.some(s => s.instrument === id)) {
      scores.push({
        instrument: id as Instrument,
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
    
    const scores = getStoredScores();
    const filteredScores = scores.filter(s => s.instrument !== id);
    saveScores(filteredScores);
  }
};

export const getStoredAnnouncements = (): Announcement[] => {
  return dbCache[ANNOUNCEMENTS_KEY] || LOCAL_DEFAULTS[ANNOUNCEMENTS_KEY];
};

export const saveAnnouncements = (announcements: Announcement[]) => {
  saveToServer(ANNOUNCEMENTS_KEY, announcements);
};

export const getStoredRehearsalSchedule = (): RehearsalSchedule[] => {
  return dbCache[REHEARSAL_SCHEDULE_KEY] || LOCAL_DEFAULTS[REHEARSAL_SCHEDULE_KEY];
};

export const saveRehearsalSchedule = (schedule: RehearsalSchedule[]) => {
  saveToServer(REHEARSAL_SCHEDULE_KEY, schedule);
};

export const getStoredVacationPeriod = (): VacationPeriod => {
  return dbCache[VACATION_PERIOD_KEY] || LOCAL_DEFAULTS[VACATION_PERIOD_KEY];
};

export const saveVacationPeriod = (period: VacationPeriod) => {
  saveToServer(VACATION_PERIOD_KEY, period);
};

export const getStoredAccessLogs = (): AccessLog[] => {
  return dbCache[ACCESS_LOGS_KEY] || LOCAL_DEFAULTS[ACCESS_LOGS_KEY];
};

export const saveAccessLogs = (logs: AccessLog[]) => {
  saveToServer(ACCESS_LOGS_KEY, logs);
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
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  saveAccessLogs(updatedLogs);
};

export const getStoredUsers = (): User[] => {
  return dbCache[USERS_KEY] || LOCAL_DEFAULTS[USERS_KEY];
};

export const saveUsers = (users: User[]) => {
  saveToServer(USERS_KEY, users);
};

export const getStoredScores = (): Score[] => {
  return dbCache[SCORES_KEY] || LOCAL_DEFAULTS[SCORES_KEY];
};

export const saveScores = (scores: Score[]) => {
  saveToServer(SCORES_KEY, scores);
};

export const getScoreForInstrument = (instrument: Instrument): string => {
  const scores = getStoredScores();
  const score = scores.find(s => s.instrument === instrument);
  return score ? score.notion_url : '';
};

export const registerUser = (userData: Omit<User, 'role' | 'temp_access_until' | 'joined_at' | 'passcode'>): { success: boolean; message: string; passcode?: string } => {
  const users = getStoredUsers();
  if (users.some(u => u.id === userData.id)) return { success: false, message: 'ID already exists.' };
  
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
  
  if (user.role === 'admin') return { allowed: true, reason: 'Admin Privilege' };

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

  const schedule = getStoredRehearsalSchedule();
  const isRehearsalTime = schedule.some(s => {
    if (s.dayOfWeek !== day) return false;
    return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
  });

  if (isRehearsalTime) return { allowed: true, reason: 'Regular Rehearsal' };
  
  return { allowed: false, reason: 'Locked' };
};
