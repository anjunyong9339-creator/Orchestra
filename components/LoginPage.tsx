
import React, { useState, useEffect } from 'react';
import { Music, Lock, User as UserIcon, UserPlus, ArrowLeft, ChevronDown } from 'lucide-react';
import { registerUser, getStoredInstruments, getStoredTranslations } from '../db';
import { Instrument } from '../types';

interface Props {
  onLogin: (id: string, pass: string) => Promise<void>;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  
  // Login State
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  // Signup State
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newInstrument, setNewInstrument] = useState<Instrument>('Sogeum');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registeredPasscode, setRegisteredPasscode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadData = async () => {
      const [i, t] = await Promise.all([
        getStoredInstruments(),
        getStoredTranslations()
      ]);
      setInstruments(i);
      setTranslations(t);
    };
    loadData();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onLogin(userId, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        id: newId,
        name: newName,
        password: newPassword,
        instrument: newInstrument
      });

      if (result.success && result.passcode) {
        setRegisteredPasscode(result.passcode);
        setUserId(newId);
      } else {
        alert(result.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredPasscode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-10 text-center">
          <div className="bg-green-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <UserPlus className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 italic">가입 완료!</h2>
          <p className="text-slate-500 mb-8 font-medium">단원님의 고유 인증번호가 발급되었습니다.<br/>악보 접근 시 필요하므로 반드시 기억해 주세요.</p>
          
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 mb-8">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">고유 인증번호 (6자리)</p>
            <p className="text-5xl font-mono font-black text-indigo-600 tracking-widest">{registeredPasscode}</p>
          </div>

          <button 
            onClick={() => {
              setRegisteredPasscode(null);
              setView('login');
            }}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition shadow-xl"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
        {/* Header Section */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white rounded-full"></div>
          </div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl mb-3 relative z-10">
            <Music className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 relative z-10">악보 게이트웨이</h1>
          <p className="text-indigo-100 text-xs opacity-80 relative z-10">
            {view === 'login' ? '단원 전용 보안 접속' : '신입 단원 등록'}
          </p>
        </div>
        
        <div className="p-8">
          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">단원 ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserIcon size={18} />
                  </span>
                  <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="아이디를 입력하세요"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">비밀번호</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? '로그인 중...' : '로그인'}
              </button>

              <div className="pt-6 border-t border-slate-100 text-center">
                <button 
                  type="button"
                  onClick={() => setView('signup')}
                  className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition text-sm"
                >
                  <UserPlus size={16} />
                  계정이 없으신가요? 회원가입
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">이름</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ID</label>
                  <input 
                    type="text" 
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="아이디"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">악기</label>
                <div className="relative">
                  <select 
                    value={newInstrument}
                    onChange={(e) => setNewInstrument(e.target.value as Instrument)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    {instruments.filter(inst => inst !== 'FullScore').map(inst => (
                      <option key={inst} value={inst}>{translations[inst] || inst}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">비밀번호</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="최소 4자 이상"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">비밀번호 확인</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="다시 입력하세요"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 mt-2 disabled:opacity-50"
              >
                {isSubmitting ? '처리 중...' : '계정 생성'}
              </button>

              <button 
                type="button"
                onClick={() => setView('login')}
                className="w-full inline-flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition text-sm py-2"
              >
                <ArrowLeft size={16} />
                로그인으로 돌아가기
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
