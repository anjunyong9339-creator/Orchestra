
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, child, update, push } from "firebase/database";
import { User, Score, Instrument, Announcement, RehearsalSchedule, VacationPeriod, AccessLog } from './types';

// Firebase 설정 (사용자가 직접 입력해야 함)
const firebaseConfig = {
  apiKey: "AIzaSyDrrf_OPLKPcwGY-9PQedRpdsYGh-aMRrI",
  authDomain: "sarang123-8302a.firebaseapp.com",
  databaseURL: "https://sarang123-8302a-default-rtdb.firebaseio.com",
  projectId: "sarang123-8302a",
  storageBucket: "sarang123-8302a.firebasestorage.app",
  messagingSenderId: "377150877214",
  appId: "1:377150877214:web:00a816739367887dfe480f",
  measurementId: "G-FSPMCT43JW"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const INSTRUMENTS_KEY = 'instruments';
const TRANSLATIONS_KEY = 'translations';
const REHEARSAL_SCHEDULE_KEY = 'rehearsal_schedule';
const VACATION_PERIOD_KEY = 'vacation_period';
const ACCESS_LOGS_KEY = 'access_logs';
const USERS_KEY = 'users';
const SCORES_KEY = 'scores';
const ANNOUNCEMENTS_KEY = 'announcements';

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

// Cache for synchronous access
let dbCache: Record<string, any> = {};
let isSyncing = false;
let lastSyncTime = 0;
let listeners: Record<string, () => void> = {};

// Helper to fetch data from Firebase
const fetchFromFirebase = async (key: string) => {
  try {
    const dbRef = ref(db);
    const snapshot = await get(child(dbRef, key));
    if (snapshot.exists()) {
      dbCache[key] = snapshot.val();
      return snapshot.val();
    }
  } catch (e) {
    console.error(`Error fetching ${key} from Firebase:`, e);
  }
  return dbCache[key];
};

// Real-time listener setup
import { onValue } from "firebase/database";

export const subscribeToKey = (key: string, callback: (data: any) => void) => {
  const dbRef = ref(db, key);
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    dbCache[key] = data;
    callback(data);
  });
  listeners[key] = unsubscribe;
  return unsubscribe;
};

// Helper to save data to Firebase
const saveToFirebase = async (key: string, data: any) => {
  dbCache[key] = data;
  isSyncing = true;
  try {
    await set(ref(db, key), data);
    lastSyncTime = Date.now();
  } catch (e) {
    console.error(`Error saving ${key} to Firebase:`, e);
  } finally {
    isSyncing = false;
  }
};

// Initialization function to be called at app start
export const initDB = async () => {
  const keys = [
    INSTRUMENTS_KEY, TRANSLATIONS_KEY, REHEARSAL_SCHEDULE_KEY, 
    VACATION_PERIOD_KEY, ACCESS_LOGS_KEY, USERS_KEY, 
    SCORES_KEY, ANNOUNCEMENTS_KEY
  ];
  
  // 1. Fetch all data from Firebase
  await Promise.all(keys.map(key => fetchFromFirebase(key)));
  
  // 2. Set defaults if Firebase is empty
  if (!dbCache[USERS_KEY]) {
    const initialUsers = [
      { id: 'admin', name: 'Admin User', password: 'admin', passcode: '000000', instrument: 'Piano', role: 'admin', temp_access_until: null, joined_at: new Date('2024-01-01').toISOString() }
    ];
    await saveToFirebase(USERS_KEY, initialUsers);
  }
  
  if (!dbCache[INSTRUMENTS_KEY]) await saveToFirebase(INSTRUMENTS_KEY, DEFAULT_INSTRUMENTS);
  if (!dbCache[TRANSLATIONS_KEY]) await saveToFirebase(TRANSLATIONS_KEY, DEFAULT_TRANSLATIONS);
  if (!dbCache[REHEARSAL_SCHEDULE_KEY]) {
    await saveToFirebase(REHEARSAL_SCHEDULE_KEY, [
      { id: 'tue', dayOfWeek: 2, startTime: '18:00', endTime: '23:00' },
      { id: 'sat', dayOfWeek: 6, startTime: '10:00', endTime: '18:00' }
    ]);
  }
  if (!dbCache[VACATION_PERIOD_KEY]) await saveToFirebase(VACATION_PERIOD_KEY, { startDate: '', endDate: '', isActive: false });
  if (!dbCache[SCORES_KEY]) {
    const initialScores = DEFAULT_INSTRUMENTS.map(inst => ({
      instrument: inst,
      notion_url: `https://notion.so/orchestra/${inst.toLowerCase().replace(' ', '-')}-scores`
    }));
    await saveToFirebase(SCORES_KEY, initialScores);
  }
  
  // Refresh exported variables
  INSTRUMENTS = getStoredInstruments();
  instrumentTranslation = getStoredTranslations();
  lastSyncTime = Date.now();
};

export const getSyncStatus = () => ({ isSyncing, lastSyncTime });

export const getStoredInstruments = (): Instrument[] => {
  return dbCache[INSTRUMENTS_KEY] || DEFAULT_INSTRUMENTS;
};

export const saveInstruments = async (instruments: Instrument[]) => {
  await saveToFirebase(INSTRUMENTS_KEY, instruments);
};

export const getStoredTranslations = (): Record<string, string> => {
  return dbCache[TRANSLATIONS_KEY] || DEFAULT_TRANSLATIONS;
};

export const saveTranslations = async (translations: Record<string, string>) => {
  await saveToFirebase(TRANSLATIONS_KEY, translations);
};

export const getInstrumentName = (id: string): string => {
  const translations = getStoredTranslations();
  return translations[id] || id;
};

export let INSTRUMENTS = getStoredInstruments();
export let instrumentTranslation = getStoredTranslations();

export const addInstrument = async (name: string) => {
  const instruments = getStoredInstruments();
  const translations = getStoredTranslations();
  const id = name;
  
  if (!instruments.includes(id as Instrument)) {
    instruments.push(id as Instrument);
    translations[id] = name;
    await saveInstruments(instruments);
    await saveTranslations(translations);
    
    const scores = getStoredScores();
    if (!scores.some(s => s.instrument === id)) {
      scores.push({
        instrument: id as Instrument,
        notion_url: `https://notion.so/orchestra/${encodeURIComponent(id.toLowerCase())}-scores`
      });
      await saveScores(scores);
    }
  }
};

export const deleteInstrument = async (id: string) => {
  const instruments = getStoredInstruments();
  const translations = getStoredTranslations();
  
  const filtered = instruments.filter(i => i !== id);
  if (filtered.length !== instruments.length) {
    await saveInstruments(filtered);
    delete translations[id];
    await saveTranslations(translations);
    
    const scores = getStoredScores();
    const filteredScores = scores.filter(s => s.instrument !== id);
    await saveScores(filteredScores);
  }
};

export const getStoredAnnouncements = (): Announcement[] => {
  return dbCache[ANNOUNCEMENTS_KEY] || [];
};

export const saveAnnouncements = async (announcements: Announcement[]) => {
  await saveToFirebase(ANNOUNCEMENTS_KEY, announcements);
};

export const getStoredRehearsalSchedule = (): RehearsalSchedule[] => {
  return dbCache[REHEARSAL_SCHEDULE_KEY] || [];
};

export const saveRehearsalSchedule = async (schedule: RehearsalSchedule[]) => {
  await saveToFirebase(REHEARSAL_SCHEDULE_KEY, schedule);
};

export const getStoredVacationPeriod = (): VacationPeriod => {
  return dbCache[VACATION_PERIOD_KEY] || { startDate: '', endDate: '', isActive: false };
};

export const saveVacationPeriod = async (period: VacationPeriod) => {
  await saveToFirebase(VACATION_PERIOD_KEY, period);
};

export const getStoredAccessLogs = (): AccessLog[] => {
  return dbCache[ACCESS_LOGS_KEY] || [];
};

export const saveAccessLogs = async (logs: AccessLog[]) => {
  await saveToFirebase(ACCESS_LOGS_KEY, logs);
};

export const addAccessLog = async (user: User, instrument: Instrument) => {
  const logs = getStoredAccessLogs();
  const newLog: AccessLog = {
    id: Math.random().toString(36).substr(2, 9),
    userId: user.id,
    userName: user.name,
    instrument,
    accessedAt: new Date().toISOString()
  };
  const updatedLogs = [newLog, ...logs].slice(0, 1000);
  await saveAccessLogs(updatedLogs);
};

export const getStoredUsers = (): User[] => {
  return dbCache[USERS_KEY] || [];
};

export const saveUsers = async (users: User[]) => {
  await saveToFirebase(USERS_KEY, users);
};

export const getStoredScores = (): Score[] => {
  return dbCache[SCORES_KEY] || [];
};

export const saveScores = async (scores: Score[]) => {
  await saveToFirebase(SCORES_KEY, scores);
};

export const getScoreForInstrument = (instrument: Instrument): string => {
  const scores = getStoredScores();
  const score = scores.find(s => s.instrument === instrument);
  return score ? score.notion_url : '';
};

export const registerUser = async (userData: Omit<User, 'role' | 'temp_access_until' | 'joined_at' | 'passcode'>): Promise<{ success: boolean; message: string; passcode?: string }> => {
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
  await saveUsers([...users, newUser]);
  return { success: true, message: 'Registration successful!', passcode };
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const users = getStoredUsers();
  const updated = users.map(u => u.id === userId ? { ...u, ...updates } : u);
  await saveUsers(updated);
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  const users = getStoredUsers();
  const filtered = users.filter(u => u.id !== userId);
  if (filtered.length === users.length) return false;
  await saveUsers(filtered);
  return true;
};

export const isAccessAllowed = (user: User, vacationOverride?: VacationPeriod, scheduleOverride?: RehearsalSchedule[]): { allowed: boolean; reason?: string } => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  if (user.role === 'admin') return { allowed: true, reason: 'Admin Privilege' };

  // Check temporary main access
  if (user.temp_access_until) {
    try {
      const until = new Date(user.temp_access_until);
      const from = user.temp_access_from ? new Date(user.temp_access_from) : null;
      
      if (!isNaN(until.getTime())) {
        // Add a 10-second buffer for clock sync issues between admin and member devices
        const isAfterFrom = !from || isNaN(from.getTime()) || now.getTime() >= (from.getTime() - 10000);
        const isBeforeUntil = now < until;
        
        if (isAfterFrom && isBeforeUntil) {
          return { allowed: true, reason: 'Temp Access' };
        }
      }
    } catch (e) {
      console.error('Error parsing access dates:', e);
    }
  }

  // Check other parts access (if this is valid, the user should be allowed to enter the gateway)
  if (user.other_parts_access_until) {
    try {
      const until = new Date(user.other_parts_access_until);
      if (!isNaN(until.getTime()) && now < until) {
        return { allowed: true, reason: 'Other Parts Access' };
      }
    } catch (e) {
      console.error('Error parsing other parts access date:', e);
    }
  }

  const vacation = vacationOverride || getStoredVacationPeriod();
  if (vacation.isActive && vacation.startDate && vacation.endDate) {
    const start = new Date(vacation.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(vacation.endDate);
    end.setHours(23, 59, 59, 999);
    if (now >= start && now <= end) {
      return { allowed: false, reason: 'Vacation Period' };
    }
  }

  const schedule = scheduleOverride || getStoredRehearsalSchedule();
  const isRehearsalTime = schedule.some(s => {
    if (s.dayOfWeek !== day) return false;
    return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
  });

  if (isRehearsalTime) return { allowed: true, reason: 'Regular Rehearsal' };
  
  return { allowed: false, reason: 'Locked' };
};
