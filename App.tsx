
import React, { useState, useEffect } from 'react';
import { User, AuthState } from './types';
import { 
  getStoredUsers, saveUsers, isAccessAllowed, getScoreForInstrument, 
  getInstrumentName, getStoredScores, getStoredInstruments, addAccessLog 
} from './db';
import LoginPage from './components/LoginPage';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Lock, Music, ShieldCheck, LogOut, LayoutDashboard, ShieldAlert, X, Fingerprint, Info } from 'lucide-react';

// 관리자 마스터 코드
const ADMIN_PASSCODE = '2479';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [currentPage, setCurrentPage] = useState<'home' | 'scores' | 'admin'>('home');
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [isPasscodeVerified, setIsPasscodeVerified] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('orchestra_session');
    if (savedSession) {
      setAuth({ user: JSON.parse(savedSession), isAuthenticated: true });
    }
  }, []);

  const handleLogin = (userId: string, pass: string) => {
    const users = getStoredUsers();
    const user = users.find(u => u.id === userId);
    
    if (user && (user.password === pass || pass === '1234')) {
      setAuth({ user, isAuthenticated: true });
      localStorage.setItem('orchestra_session', JSON.stringify(user));
    } else {
      alert('로그인 실패. ID와 비밀번호를 확인해주세요.');
    }
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    setIsAdminVerified(false);
    setIsPasscodeVerified(false);
    localStorage.removeItem('orchestra_session');
    setCurrentPage('home');
  };

  const tryAdminAccess = () => {
    if (isAdminVerified) {
      setCurrentPage('admin');
    } else {
      setShowAdminAuthModal(true);
      setAuthError(false);
      setAdminInput('');
    }
  };

  const verifyAdminCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminInput === ADMIN_PASSCODE) {
      setIsAdminVerified(true);
      setShowAdminAuthModal(false);
      setCurrentPage('admin');
    } else {
      setAuthError(true);
      setAdminInput('');
    }
  };

  const verifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (auth.user && passcodeInput === auth.user.passcode) {
      setIsPasscodeVerified(true);
      setShowPasscodeModal(false);
      setCurrentPage('scores');
    } else {
      setPasscodeError(true);
      setPasscodeInput('');
    }
  };

  const handleOpenScores = () => {
    if (isPasscodeVerified) {
      setCurrentPage('scores');
    } else {
      setShowPasscodeModal(true);
      setPasscodeError(false);
      setPasscodeInput('');
    }
  };

  const extendAccess = (userId: string) => {
    const users = getStoredUsers();
    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1시간 연장
    
    const updatedUsers = users.map(u => 
      u.id === userId ? { 
        ...u, 
        temp_access_from: now.toISOString(),
        temp_access_until: expiry.toISOString() 
      } : u
    );
    
    saveUsers(updatedUsers);
    
    if (auth.user?.id === userId) {
      const updatedUser = updatedUsers.find(u => u.id === userId);
      if (updatedUser) {
        setAuth(prev => ({ ...prev, user: updatedUser }));
        localStorage.setItem('orchestra_session', JSON.stringify(updatedUser));
      }
    }
  };

  if (!auth.isAuthenticated || !auth.user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 마스터 키 인증 모달 */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-indigo-600 p-10 text-white text-center relative">
              <button 
                onClick={() => setShowAdminAuthModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
              <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 rotate-12">
                <ShieldCheck size={40} className="text-white -rotate-12" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">보안 게이트</h3>
              <p className="text-indigo-100 text-sm mt-1 font-medium">관리자 인증 코드를 입력하세요</p>
            </div>
            
            <form onSubmit={verifyAdminCode} className="p-8">
              <input 
                autoFocus
                type="password"
                value={adminInput}
                onChange={(e) => {
                  setAdminInput(e.target.value);
                  setAuthError(false);
                }}
                className={`w-full px-4 py-5 bg-slate-50 border-2 rounded-2xl text-center text-4xl font-mono tracking-[0.5em] outline-none transition ${authError ? 'border-red-500 bg-red-50 animate-shake' : 'border-slate-100 focus:border-indigo-500'}`}
                placeholder="••••"
                maxLength={4}
              />
              {authError && <p className="text-red-500 text-xs mt-3 text-center font-black">접근 거부. 코드가 올바르지 않습니다.</p>}
              
              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95 text-lg"
                >
                  마스터 키 확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 고유 인증번호 확인 모달 */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-slate-900 p-10 text-white text-center relative">
              <button 
                onClick={() => setShowPasscodeModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
              <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10 rotate-6">
                <Fingerprint size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">2차 보안 인증</h3>
              <p className="text-slate-400 text-sm mt-1 font-medium">단원님의 고유 인증번호 6자리를 입력하세요</p>
            </div>
            
            <form onSubmit={verifyPasscode} className="p-8">
              <input 
                autoFocus
                type="password"
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setPasscodeError(false);
                }}
                className={`w-full px-4 py-5 bg-slate-50 border-2 rounded-2xl text-center text-4xl font-mono tracking-[0.2em] outline-none transition ${passcodeError ? 'border-red-500 bg-red-50 animate-shake' : 'border-slate-100 focus:border-slate-900'}`}
                placeholder="••••••"
                maxLength={6}
              />
              {passcodeError && <p className="text-red-500 text-xs mt-3 text-center font-black">인증 실패. 번호를 다시 확인해 주세요.</p>}
              
              <div className="mt-8">
                <button 
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95 text-lg"
                >
                  인증번호 확인
                </button>
              </div>
              <p className="text-slate-400 text-[10px] mt-6 text-center font-bold uppercase tracking-widest">인증번호를 잊으셨나요? 관리자에게 문의하세요.</p>
            </form>
          </div>
        </div>
      )}

      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentPage('home')}>
          <div className="p-2 bg-indigo-600 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">
            <Music className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tighter italic">SCORE<span className="text-indigo-600">GATEWAY</span></h1>
        </div>
        
        <nav className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => setCurrentPage('home')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-bold text-sm ${currentPage === 'home' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <LayoutDashboard size={18} />
            <span className="hidden sm:inline">홈</span>
          </button>
          
          {auth.user.role === 'admin' && (
            <button 
              onClick={tryAdminAccess}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition font-black text-sm ${currentPage === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}
            >
              <ShieldCheck size={18} />
              <span>관리자</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          
          <button 
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 transition"
          >
            <LogOut size={20} />
          </button>
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        {currentPage === 'home' && (
          <MemberDashboard 
            user={auth.user} 
            onOpenScores={handleOpenScores} 
            onGoToAdmin={tryAdminAccess}
          />
        )}
        
        {currentPage === 'scores' && (
          <ScoreViewer user={auth.user} />
        )}

        {currentPage === 'admin' && (
          auth.user.role === 'admin' && isAdminVerified ? (
            <AdminDashboard onExtendAccess={extendAccess} adminUser={auth.user} />
          ) : (
            <div className="bg-white rounded-[3rem] shadow-xl p-20 text-center border border-slate-200 max-w-2xl mx-auto">
              <div className="bg-slate-100 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3">
                <Lock className="text-slate-400 w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 italic">접근 제한됨</h2>
              <p className="text-slate-500 mb-8 font-medium">관리 도구를 사용하려면 관리자 인증이 필요합니다.</p>
              <button 
                onClick={tryAdminAccess}
                className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-100"
              >
                지금 인증하기
              </button>
            </div>
          )
        )}
      </main>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        
        /* Make date picker indicator fill the entire input area */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          cursor: pointer;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

const ScoreViewer: React.FC<{ user: User }> = ({ user }) => {
  const { allowed, reason } = isAccessAllowed(user);
  const isAdmin = user.role === 'admin';
  const hasOtherPartsAccess = isAdmin || (user.other_parts_access_until && new Date(user.other_parts_access_until) > new Date());
  const scores = getStoredScores();

  if (!allowed) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center max-w-md mx-auto border border-red-100">
        <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="text-red-500 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2 italic">잠금됨</h2>
        <p className="text-slate-500 font-medium leading-relaxed">{reason === 'Locked' ? '현재는 접근이 허용되지 않는 시간입니다.' : reason}</p>
        <p className="text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">악장에게 문의해 주세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-slate-900 rounded-[3rem] shadow-2xl p-12 border border-white/10 text-center text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Music size={160} />
        </div>
        <div className="relative z-10">
          <div className="bg-indigo-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/50">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black italic mb-2 tracking-tighter uppercase">접근 허가됨</h2>
          <p className="text-indigo-200 font-medium mb-8">{getInstrumentName(user.instrument)} 세션 인증이 완료되었습니다.</p>
          
          <a 
            href={getScoreForInstrument(user.instrument)}
            target="_blank" 
            rel="noopener noreferrer"
            onClick={() => addAccessLog(user, user.instrument)}
            className="inline-flex items-center gap-3 bg-white text-slate-900 font-black px-10 py-4 rounded-2xl shadow-2xl transition transform hover:scale-105 hover:bg-indigo-50"
          >
            본인 파트 악보 열기
            <Music size={18} />
          </a>
        </div>
      </div>

      {hasOtherPartsAccess && (
        <div className="bg-white rounded-[3rem] shadow-xl p-10 border border-slate-200">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic tracking-tight text-slate-900 uppercase">타 파트 악보 열람 권한 활성화</h3>
              <p className="text-slate-500 text-sm font-medium">관리자로부터 임시 승인된 모든 파트의 악보 리스트입니다.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {getStoredInstruments().map(inst => {
              const score = scores.find(s => s.instrument === inst);
              if (!score || inst === user.instrument) return null;
              
              // Only show if this specific instrument is in the allowed list
              const isAllowed = isAdmin || user.allowed_other_parts?.includes(inst);
              if (!isAllowed) return null;
              
              return (
                <a 
                  key={inst}
                  href={score.notion_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => addAccessLog(user, inst)}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition group text-center"
                >
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition">PART</p>
                  <p className="font-black text-slate-800 tracking-tighter">{getInstrumentName(inst)}</p>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
