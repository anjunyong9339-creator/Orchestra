
import React, { useState, useEffect } from 'react';
import { User, Announcement, RehearsalSchedule, VacationPeriod } from '../types';
import { getInstrumentName, getStoredAnnouncements, getStoredRehearsalSchedule, getStoredVacationPeriod } from '../db';
import { formatDateWithDay, formatDateOnly } from '../utils/dateUtils';
import { Clock, ExternalLink, Calendar, ShieldCheck, Settings, Megaphone, ChevronRight, Info, ShieldAlert, Coffee } from 'lucide-react';

interface Props {
  user: User;
  onOpenScores: () => void;
  onGoToAdmin?: () => void;
}

const MemberDashboard: React.FC<Props> = ({ user, onOpenScores, onGoToAdmin }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [schedule, setSchedule] = useState<RehearsalSchedule[]>([]);
  const [vacation, setVacation] = useState<VacationPeriod>({ startDate: '', endDate: '', isActive: false });

  useEffect(() => {
    setAnnouncements(getStoredAnnouncements());
    setSchedule(getStoredRehearsalSchedule());
    setVacation(getStoredVacationPeriod());
  }, []);

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  
  // 1. 방학 기간 체크
  let isVacation = false;
  if (vacation.isActive && vacation.startDate && vacation.endDate) {
    const start = new Date(vacation.startDate);
    const end = new Date(vacation.endDate);
    if (now >= start && now <= end) {
      isVacation = true;
    }
  }

  // 2. 정기 연습 시간 체크
  const currentSlot = schedule.find(s => {
    if (s.dayOfWeek !== day) return false;
    return currentTimeStr >= s.startTime && currentTimeStr < s.endTime;
  });

  const isRehearsalTime = !isVacation && !!currentSlot;

  const getClosingTime = () => {
    return currentSlot ? currentSlot.endTime : "";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1">환영합니다, {user.name}님!</h2>
          <p className="text-slate-500">역할: <span className="font-medium text-slate-700">{user.role === 'admin' ? '관리자' : '단원'}</span> | 악기: <span className="font-medium text-slate-700">{getInstrumentName(user.instrument)}</span></p>
        </div>
        {user.role === 'admin' && (
          <div className="hidden sm:block">
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <ShieldCheck size={14} /> 관리자 권한 활성화됨
            </span>
          </div>
        )}
      </div>

      {/* Conditional Admin Quick Link Card */}
      {user.role === 'admin' && onGoToAdmin && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="bg-white/20 p-3 rounded-xl">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold">관리자 관리 도구</h3>
              <p className="text-indigo-100 text-sm">단원에게 임시 권한을 부여하거나 시스템 설정을 관리합니다.</p>
            </div>
          </div>
          <button 
            onClick={onGoToAdmin}
            className="whitespace-nowrap bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-2 px-6 rounded-xl transition shadow-md flex items-center gap-2"
          >
            관리자 패널 열기
            <ShieldCheck size={18} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Announcements Card */}
        <div className="md:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Megaphone size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-500/20 p-3 rounded-2xl text-indigo-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic tracking-tight uppercase">공지 및 전달사항</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-0.5">Latest Updates</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</span>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-black">{announcements.length}</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
              {announcements.length === 0 ? (
                <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <p className="text-slate-500 font-bold italic">현재 등록된 공지사항이 없습니다.</p>
                </div>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} className="bg-white/5 hover:bg-white/[0.08] p-6 rounded-[2rem] border border-white/5 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest">Notice</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{formatDateOnly(ann.createdAt)}</span>
                        </div>
                        <h4 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">{ann.title}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none transition-all">{ann.content}</p>
                        <div className="flex items-center gap-2 pt-2">
                          <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[8px] font-black text-slate-500">A</div>
                          <span className="text-[10px] font-bold text-slate-500">작성자: {ann.author}</span>
                        </div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl text-slate-600 group-hover:text-white transition-colors self-start">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Access Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Clock size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${isRehearsalTime ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                <Clock size={20} />
              </div>
              <h3 className="font-bold text-slate-800">현재 접속 상태</h3>
            </div>
            
            <div className="flex-1 space-y-4">
              {user.temp_access_until && new Date(user.temp_access_until) > new Date() ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-blue-800 font-semibold mb-1">활성: 임시 권한 부여됨</p>
                  <p className="text-blue-600 text-sm">유효 기간: {formatDateWithDay(user.temp_access_until)}</p>
                  {isVacation && (
                    <p className="text-blue-400 text-[10px] mt-2 font-medium italic">* 방학 기간 중 관리자 특별 승인됨</p>
                  )}
                </div>
              ) : isVacation ? (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <Coffee size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-blue-800 font-semibold mb-1">방학 기간 (접근 차단)</p>
                    <p className="text-blue-600 text-xs leading-relaxed">
                      {formatDateOnly(vacation.startDate)} ~ {formatDateOnly(vacation.endDate)} 기간 동안은 정기 연습 시간에도 악보 접근이 제한됩니다.
                    </p>
                  </div>
                </div>
              ) : isRehearsalTime ? (
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                  <p className="text-green-800 font-semibold mb-1">활성: 정기 연습 시간</p>
                  <p className="text-green-600 text-sm">오늘은 {getClosingTime()}까지 게이트가 열려 있습니다.</p>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl">
                  <p className="text-slate-600 font-semibold mb-1">비활성</p>
                  <p className="text-slate-500 text-sm">정기 연습 시간 외에는 접근이 제한됩니다.</p>
                </div>
              )}

              <button 
                onClick={onOpenScores}
                className={`w-full group flex items-center justify-center gap-2 font-semibold py-4 rounded-xl transition shadow-lg ${isRehearsalTime || (user.temp_access_until && new Date(user.temp_access_until) > new Date()) ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                disabled={!isRehearsalTime && !(user.temp_access_until && new Date(user.temp_access_until) > new Date())}
              >
                악보 게이트웨이로 이동
                <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Schedule Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Calendar size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Calendar size={20} />
              </div>
              <h3 className="font-bold text-slate-800">운영 정책</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                <div>
                  <p className="text-slate-700 font-medium text-sm">주간 정기 연습</p>
                  <div className="space-y-1 mt-1">
                    {schedule.length > 0 ? schedule.map(s => (
                      <p key={s.id} className="text-slate-500 text-xs">
                        매주 {['일', '월', '화', '수', '목', '금', '토'][s.dayOfWeek]}요일 {s.startTime} — {s.endTime}
                      </p>
                    )) : (
                      <p className="text-slate-400 text-xs italic">설정된 정기 연습 시간이 없습니다.</p>
                    )}
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2"></div>
                <div>
                  <p className="text-slate-700 font-medium text-sm">사전 준비 권한</p>
                  <p className="text-slate-500 text-xs">개인 연습이 필요할 경우 관리자가 개별 승인합니다.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
