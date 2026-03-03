
import React, { useState, useEffect } from 'react';
import { User, Instrument, Score, Announcement, AccessLog } from '../types';
import { 
  getStoredUsers, deleteUser, updateUser, getStoredScores, saveScores, 
  isAccessAllowed, getStoredAnnouncements, saveAnnouncements,
  getStoredInstruments, getStoredTranslations, addInstrument, deleteInstrument,
  saveUsers, getStoredRehearsalSchedule, saveRehearsalSchedule, getStoredVacationPeriod, saveVacationPeriod,
  getStoredAccessLogs, saveAccessLogs, getInstrumentName
} from '../db';
import { formatDateWithDay, formatDateOnly, formatDateFilter, formatTimeOnly, formatTimeFilter, getDayOfWeek } from '../utils/dateUtils';
import { 
  Users, Search, Trash2, UserPlus, ShieldCheck, 
  FileText, Save, Clock, XCircle, MoreVertical,
  Filter, Download, ArrowUpDown, ChevronRight, Activity,
  Server, UserCheck, ShieldAlert, Calendar, X, Megaphone, Plus, Edit3, Settings, Info, Eye, Lock,
  CalendarDays, Coffee
} from 'lucide-react';
import { RehearsalSchedule, VacationPeriod } from '../types';

interface Props {
  onExtendAccess: (userId: string) => void;
  adminUser: User;
}

const AdminDashboard: React.FC<Props> = ({ onExtendAccess, adminUser }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'management' | 'announcements' | 'logs'>('management');
  const [users, setUsers] = useState<User[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterInstrument, setFilterInstrument] = useState<string>('All');
  const [showAddMember, setShowAddMember] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showOtherPartsModal, setShowOtherPartsModal] = useState(false);
  const [selectedParts, setSelectedParts] = useState<Instrument[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [isStartFromNow, setIsStartFromNow] = useState(true);
  const [includeOtherParts, setIncludeOtherParts] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPartDeleteConfirm, setShowPartDeleteConfirm] = useState(false);
  const [partToDelete, setPartToDelete] = useState<string | null>(null);
  const [showAnnouncementDeleteConfirm, setShowAnnouncementDeleteConfirm] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [isBulkSchedule, setIsBulkSchedule] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [userDetailUser, setUserDetailUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordVerifyModal, setShowPasswordVerifyModal] = useState(false);
  const [passwordVerifyInput, setPasswordVerifyInput] = useState('');
  
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [newPartName, setNewPartName] = useState('');
  
  // Schedule & Vacation state
  const [rehearsalSchedule, setRehearsalSchedule] = useState<RehearsalSchedule[]>([]);
  const [vacationPeriod, setVacationPeriod] = useState<VacationPeriod>({ startDate: '', endDate: '', isActive: false });
  const [newScheduleDay, setNewScheduleDay] = useState(1);
  const [newScheduleStart, setNewScheduleStart] = useState('18:00');
  const [newScheduleEnd, setNewScheduleEnd] = useState('21:00');

  const [newMember, setNewMember] = useState({ id: '', name: '', instrument: 'Sogeum' as Instrument, password: '1234' });
  
  // Announcement state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');

  // Log Filter state
  const [logFilterDate, setLogFilterDate] = useState('');
  const [logFilterTime, setLogFilterTime] = useState('');
  const [logFilterName, setLogFilterName] = useState('');
  const [logFilterInstrument, setLogFilterInstrument] = useState('All');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, s, a, i, t, rs, vp, al] = await Promise.all([
      getStoredUsers(),
      getStoredScores(),
      getStoredAnnouncements(),
      getStoredInstruments(),
      getStoredTranslations(),
      getStoredRehearsalSchedule(),
      getStoredVacationPeriod(),
      getStoredAccessLogs()
    ]);
    setUsers(u);
    setScores(s);
    setAnnouncements(a);
    setInstruments(i);
    setTranslations(t);
    setRehearsalSchedule(rs);
    setVacationPeriod(vp);
    setAccessLogs(al);
  };

  const handleAddSchedule = async () => {
    const newSlot: RehearsalSchedule = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: newScheduleDay,
      startTime: newScheduleStart,
      endTime: newScheduleEnd
    };
    const updated = [...rehearsalSchedule, newSlot];
    await saveRehearsalSchedule(updated);
    setRehearsalSchedule(updated);
    setSuccessMessage('정기 연습 시간이 추가되었습니다.');
    setShowSuccessModal(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    const updated = rehearsalSchedule.filter(s => s.id !== id);
    await saveRehearsalSchedule(updated);
    setRehearsalSchedule(updated);
  };

  const handleSaveVacation = async () => {
    await saveVacationPeriod(vacationPeriod);
    setSuccessMessage('방학 기간 설정이 저장되었습니다.');
    setShowSuccessModal(true);
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName) return;
    
    await addInstrument(newPartName);
    setNewPartName('');
    await loadData();
    setSuccessMessage(`새로운 파트(${newPartName})가 추가되었습니다.`);
    setShowSuccessModal(true);
  };

  const handleDeletePart = (id: string) => {
    if (id === 'FullScore') {
      alert('총보 파트는 삭제할 수 없습니다.');
      return;
    }
    setPartToDelete(id);
    setShowPartDeleteConfirm(true);
  };

  const confirmDeletePart = async () => {
    if (!partToDelete) return;
    await deleteInstrument(partToDelete);
    await loadData();
    setShowPartDeleteConfirm(false);
    setPartToDelete(null);
    setSuccessMessage('파트가 삭제되었습니다.');
    setShowSuccessModal(true);
  };
  const handleToggleRole = async (user: User) => {
    if (user.id === 'admin') return;
    await updateUser(user.id, { role: user.role === 'admin' ? 'member' : 'admin' });
    await loadData();
  };

  const handleRevokeAccess = async (userId: string) => {
    await updateUser(userId, { 
      temp_access_from: null,
      temp_access_until: null,
      other_parts_access_until: null,
      allowed_other_parts: []
    });
    await loadData();
  };

  const handleApproveOtherParts = async (isPermanent: boolean) => {
    if (!selectedUser || selectedParts.length === 0) return;
    
    const expiry = isPermanent 
      ? new Date('2099-12-31T23:59:59Z').toISOString()
      : new Date(Date.now() + 60 * 60 * 1000).toISOString();
      
    await updateUser(selectedUser.id, { 
      other_parts_access_until: expiry,
      allowed_other_parts: selectedParts
    });
    await loadData();
    setShowOtherPartsModal(false);
    setSelectedUser(null);
    setSelectedParts([]);
    setSuccessMessage(isPermanent 
      ? `해당 단원에게 ${selectedParts.length}개 파트의 악보 접근 권한이 반영구적으로 부여되었습니다.`
      : `해당 단원에게 ${selectedParts.length}개 파트의 악보 접근 권한(1시간)이 부여되었습니다.`
    );
    setShowSuccessModal(true);
  };

  const togglePartSelection = (inst: Instrument) => {
    setSelectedParts(prev => 
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = selectedUserIds.filter(id => id !== 'admin');
    if (idsToDelete.length === 0) {
      alert('삭제할 수 있는 단원이 없습니다 (관리자 계정 제외).');
      setShowDeleteConfirm(false);
      return;
    }
    
    await Promise.all(idsToDelete.map(id => deleteUser(id)));
    setSelectedUserIds([]);
    await loadData();
    setSuccessMessage(`${idsToDelete.length}명의 단원이 명단에서 삭제되었습니다.`);
    setShowSuccessModal(true);
    setShowDeleteConfirm(false);
  };

  const toggleUserSelection = (userId: string) => {
    if (userId === 'admin') return;
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleAllSelection = () => {
    const selectableUsers = filteredUsers.filter(u => u.id !== 'admin');
    if (selectedUserIds.length === selectableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map(u => u.id));
    }
  };

  const handleScheduleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleEnd) return;
    if (!isBulkSchedule && !selectedUser) return;
    
    try {
      const start = isStartFromNow 
        ? new Date(Date.now() - 60000).toISOString() 
        : new Date(scheduleStart).toISOString();
      const end = new Date(scheduleEnd).toISOString();
      
      const targetIds = isBulkSchedule 
        ? (selectedUserIds.length > 0 ? selectedUserIds : filteredUsers.map(u => u.id)).filter(id => id !== 'admin')
        : [selectedUser!.id];

      await Promise.all(targetIds.map(async (id) => {
        const user = users.find(u => u.id === id);
        if (!user) return;
        
        await updateUser(id, { 
          temp_access_from: start,
          temp_access_until: end,
          other_parts_access_until: includeOtherParts ? end : user.other_parts_access_until,
          allowed_other_parts: includeOtherParts ? selectedParts : user.allowed_other_parts
        });
      }));

      await loadData();
      setShowScheduleModal(false);
      setSelectedUser(null);
      setScheduleStart('');
      setScheduleEnd('');
      setIsStartFromNow(true);
      setIncludeOtherParts(false);
      setSelectedParts([]);
      setIsBulkSchedule(false);
      
      setSuccessMessage(isBulkSchedule ? `${targetIds.length}명의 예약 승인 설정이 완료되었습니다.` : '해당 단원의 예약 승인 설정이 완료되었습니다.');
      setShowSuccessModal(true);
    } catch (err) {
      alert('날짜 형식이 올바르지 않습니다.');
    }
  };

  const handleBulkRevokeAccess = async () => {
    const targets = selectedUserIds.length > 0 ? selectedUserIds : filteredUsers.map(u => u.id);
    const idsToRevoke = targets.filter(id => id !== 'admin');
    
    if (idsToRevoke.length === 0) {
      alert('회수할 권한이 있는 단원이 없습니다.');
      return;
    }
    
    await Promise.all(idsToRevoke.map(id => 
      updateUser(id, { 
        temp_access_from: null,
        temp_access_until: null,
        other_parts_access_until: null,
        allowed_other_parts: []
      })
    ));
    
    await loadData();
    setSuccessMessage(`${idsToRevoke.length}명의 권한을 모두 회수했습니다.`);
    setShowSuccessModal(true);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUsers = await getStoredUsers();
    if (currentUsers.some(u => u.id === newMember.id)) {
      alert('이미 존재하는 ID입니다.');
      return;
    }
    const newUser: User = { 
      ...newMember, 
      passcode: Math.floor(100000 + Math.random() * 900000).toString(),
      role: 'member', 
      temp_access_from: null,
      temp_access_until: null, 
      joined_at: new Date().toISOString() 
    };
    await saveUsers([...currentUsers, newUser]);
    await loadData();
    setShowAddMember(false);
    setNewMember({ id: '', name: '', instrument: 'Sogeum', password: '1234' });
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;

    const newAnnouncement: Announcement = {
      id: Math.random().toString(36).substr(2, 9),
      title: announcementTitle,
      content: announcementContent,
      createdAt: new Date().toISOString(),
      author: adminUser.name
    };

    const updated = [newAnnouncement, ...announcements];
    setAnnouncements(updated);
    await saveAnnouncements(updated);
    
    setAnnouncementTitle('');
    setAnnouncementContent('');
    setShowAnnouncementForm(false);
    setSuccessMessage('공지사항이 성공적으로 등록되었습니다.');
    setShowSuccessModal(true);
  };

  const handleDeleteAnnouncement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAnnouncementToDelete(id);
    setShowAnnouncementDeleteConfirm(true);
  };

  const confirmDeleteAnnouncement = async () => {
    if (!announcementToDelete) return;
    
    const updated = announcements.filter(a => a.id !== announcementToDelete);
    setAnnouncements(updated);
    await saveAnnouncements(updated);
    
    setSuccessMessage('공지사항이 삭제되었습니다.');
    setShowSuccessModal(true);
    setShowAnnouncementDeleteConfirm(false);
    setAnnouncementToDelete(null);
  };

  const handleDeleteLog = async (id: string) => {
    const updated = accessLogs.filter(log => log.id !== id);
    await saveAccessLogs(updated);
    setAccessLogs(updated);
  };

  const handleClearAllLogs = async () => {
    if (window.confirm('모든 열람 로그를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      await saveAccessLogs([]);
      setAccessLogs([]);
      setSuccessMessage('모든 로그가 초기화되었습니다.');
      setShowSuccessModal(true);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInst = filterInstrument === 'All' || u.instrument === filterInstrument;
    return matchesSearch && matchesInst;
  });

  // Stats
  const activeAccessCount = users.filter(u => isAccessAllowed(u, vacationPeriod, rehearsalSchedule).allowed).length;

  const filteredLogs = accessLogs.filter(log => {
    const matchesDate = !logFilterDate || log.accessedAt.startsWith(logFilterDate);
    
    let matchesTime = true;
    if (logFilterTime) {
      const logDate = new Date(log.accessedAt);
      const [filterHh, filterMin] = logFilterTime.split(':').map(Number);
      matchesTime = logDate.getHours() === filterHh && logDate.getMinutes() === filterMin;
    }
    
    const matchesName = !logFilterName || log.userName.toLowerCase().includes(logFilterName.toLowerCase());
    const matchesInst = logFilterInstrument === 'All' || log.instrument === logFilterInstrument;
    return matchesDate && matchesTime && matchesName && matchesInst;
  });

  return (
    <div className="space-y-8 pb-32">
      {/* Admin Navigation Bar */}
      <div className="flex bg-slate-900/50 p-1.5 rounded-[2rem] border border-white/5 backdrop-blur-md sticky top-4 z-50 max-w-fit mx-auto shadow-2xl">
        <button 
          onClick={() => setActiveAdminTab('management')}
          className={`px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2.5 ${activeAdminTab === 'management' ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Settings size={18} />
          기본 내용 관리
        </button>
        <button 
          onClick={() => setActiveAdminTab('announcements')}
          className={`px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2.5 ${activeAdminTab === 'announcements' ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Megaphone size={18} />
          공지사항
        </button>
        <button 
          onClick={() => setActiveAdminTab('logs')}
          className={`px-8 py-3.5 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2.5 ${activeAdminTab === 'logs' ? 'bg-white text-slate-950 shadow-xl scale-105' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Activity size={18} />
          열람 로그
        </button>
      </div>

      {activeAdminTab === 'management' ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* System Summary Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-white/5 flex items-center gap-5 shadow-2xl">
          <div className="bg-indigo-500/20 p-4 rounded-3xl">
            <Users className="text-indigo-400" size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">총 단원 수</p>
            <p className="text-3xl font-black">{users.length}</p>
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-white/5 flex items-center gap-5 shadow-2xl">
          <div className="bg-green-500/20 p-4 rounded-3xl">
            <UserCheck className="text-green-400" size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">현재 접속 권한</p>
            <p className="text-3xl font-black">{activeAccessCount}</p>
          </div>
        </div>
        <div className="bg-slate-900 rounded-[2rem] p-6 text-white border border-white/5 flex items-center gap-5 shadow-2xl">
          <div className="bg-amber-500/20 p-4 rounded-3xl">
            <Server className="text-amber-400" size={32} />
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">시스템 상태</p>
            <p className="text-3xl font-black">정상</p>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-3xl border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <Activity size={18} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Command Center v2.0</span>
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter text-white">단원 명단 관리</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium italic">악단 데이터 및 실시간 출입 권한을 제어합니다.</p>
            </div>
            
            <button 
              onClick={() => setShowAddMember(!showAddMember)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[2rem] font-black flex items-center gap-2 transition shadow-2xl shadow-indigo-500/20"
            >
              <UserPlus size={20} />
              신입 단원 등록
            </button>
          </div>

          {/* New Member Registration Inline Form */}
          {showAddMember && (
            <form onSubmit={handleAddMember} className="mb-12 grid grid-cols-1 sm:grid-cols-4 gap-4 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top-4 duration-500">
              <input 
                placeholder="이름" 
                className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newMember.name}
                onChange={e => setNewMember({...newMember, name: e.target.value})}
                required
              />
              <input 
                placeholder="아이디" 
                className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={newMember.id}
                onChange={e => setNewMember({...newMember, id: e.target.value})}
                required
              />
              <select 
                className="bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-white"
                value={newMember.instrument}
                onChange={e => setNewMember({...newMember, instrument: e.target.value as Instrument})}
              >
                {instruments.filter(i => i !== 'FullScore').map(i => <option key={i} value={i} className="bg-slate-900">{translations[i] || i}</option>)}
              </select>
              <button type="submit" className="bg-white text-slate-950 font-black rounded-2xl hover:bg-slate-100 transition shadow-xl">등록 완료</button>
            </form>
          )}

          {/* Table Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                type="text" 
                placeholder="단원 검색 (이름 또는 ID)"
                className="w-full pl-12 pr-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm focus:bg-white/10 focus:border-indigo-500 outline-none transition text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
              <div className="flex gap-4 w-full md:w-auto">
                <select 
                  className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/5 rounded-2xl text-sm outline-none cursor-pointer hover:bg-white/10 transition text-white"
                  value={filterInstrument}
                  onChange={e => setFilterInstrument(e.target.value)}
                >
                  <option value="All" className="bg-slate-900 text-white">모든 파트</option>
                  {instruments.filter(i => i !== 'FullScore').map(i => <option key={i} value={i} className="bg-slate-900 text-white">{translations[i] || i}</option>)}
                </select>
                
                {selectedUserIds.length === 1 && (
                  <button 
                    onClick={() => {
                      const user = users.find(u => u.id === selectedUserIds[0]);
                      if (user) {
                        setUserDetailUser(user);
                        setShowUserDetailModal(true);
                      }
                    }}
                    className="px-6 py-4 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition shadow-xl"
                  >
                    <Info size={18} />
                    <span>상세정보</span>
                  </button>
                )}

                <button 
                  onClick={handleBulkDelete}
                  disabled={selectedUserIds.length === 0}
                  className={`px-6 py-4 rounded-2xl font-black flex items-center gap-2 transition shadow-xl ${selectedUserIds.length > 0 ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                >
                  <Trash2 size={18} />
                  <span>삭제 {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}</span>
                </button>
              </div>
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-[2rem] border border-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-white">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">신원 확인</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">악기 / 역할</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">인증번호</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] min-w-[140px]">상태</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBulkSchedule(true);
                          setShowScheduleModal(true);
                          setIsStartFromNow(true);
                          
                          const now = new Date();
                          const offset = now.getTimezoneOffset() * 60000;
                          const localNow = new Date(now.getTime() - offset);
                          const defaultStart = localNow.toISOString().slice(0, 16);
                          const expiry = new Date(now.getTime() - offset + 60 * 60 * 1000);
                          const defaultEnd = expiry.toISOString().slice(0, 16);
                          
                          setScheduleStart(defaultStart);
                          setScheduleEnd(defaultEnd);
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white rounded-lg transition-all border border-blue-500/20"
                        title="일괄 예약 승인"
                      >
                        <Calendar size={14} />
                        <span className="text-[8px] font-black">일괄</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBulkRevokeAccess();
                        }}
                        className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white rounded-lg transition-all border border-amber-500/20"
                        title="일괄 권한 회수"
                      >
                        <XCircle size={14} />
                        <span className="text-[8px] font-black">일괄</span>
                      </button>
                      <span className="ml-1 opacity-50">작업</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map(user => {
                  const { allowed } = isAccessAllowed(user, vacationPeriod, rehearsalSchedule);
                  const hasOtherPartsAccess = user.other_parts_access_until && new Date(user.other_parts_access_until) > new Date();
                  const isSelected = selectedUserIds.includes(user.id);
                  
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => toggleUserSelection(user.id)}
                      className={`transition-all duration-200 group cursor-pointer ${isSelected ? 'bg-indigo-500/20 border-l-4 border-indigo-500' : 'hover:bg-white/[0.02] border-l-4 border-transparent'}`}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-white leading-none mb-1">{user.name}</p>
                            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">{user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-bold text-slate-300">{translations[user.instrument] || user.instrument}</span>
                          <button 
                            onClick={() => handleToggleRole(user)}
                            className={`text-[9px] font-black px-2 py-0.5 rounded-lg w-fit uppercase tracking-widest transition-all ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-slate-500 hover:bg-white/20 hover:text-white'}`}
                          >
                            {user.role === 'admin' ? '관리자' : '일반 단원'}
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-mono text-indigo-300 font-black tracking-widest bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/30 whitespace-nowrap">
                          {user.passcode}
                        </span>
                      </td>
                      <td className="px-8 py-6 min-w-[140px]">
                        <div className="flex flex-col gap-1.5">
                          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap w-fit ${allowed ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            <div className={`w-2 h-2 rounded-full ${allowed ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)] animate-pulse' : 'bg-red-500'}`}></div>
                            {allowed ? '승인됨' : '잠금'}
                          </div>
                          {allowed && user.temp_access_until && (
                            <div className="text-[8px] font-bold text-slate-600 ml-1 leading-tight opacity-80">
                              <p>~ {formatDateOnly(user.temp_access_until)}</p>
                              <p>{formatTimeOnly(user.temp_access_until)}</p>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-30 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              onExtendAccess(user.id); 
                              loadData(); 
                              setSuccessMessage('해당 단원에게 임시 권한이 부여되었습니다.');
                              setShowSuccessModal(true);
                            }}
                            className="p-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-2xl transition"
                            title="임시승인 (1시간)"
                          >
                            <Clock size={18} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              setIsBulkSchedule(false);
                              setSelectedUser(user);
                              setShowScheduleModal(true);
                              setIsStartFromNow(true);
                              
                              const now = new Date();
                              // Adjust to local time string for datetime-local input (YYYY-MM-DDTHH:mm)
                              const offset = now.getTimezoneOffset() * 60000;
                              const localNow = new Date(now.getTime() - offset);
                              const defaultStart = localNow.toISOString().slice(0, 16);
                              
                              const expiry = new Date(now.getTime() - offset + 60 * 60 * 1000);
                              const defaultEnd = expiry.toISOString().slice(0, 16);
                              
                              setScheduleStart(defaultStart);
                              setScheduleEnd(defaultEnd);
                            }}
                            className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-2xl transition"
                            title="예약 승인"
                          >
                            <Calendar size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setSelectedParts(user.allowed_other_parts || []);
                              setShowOtherPartsModal(true);
                            }}
                            className={`p-3 rounded-2xl transition ${hasOtherPartsAccess ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white'}`}
                            title="타 파트 악보 승인"
                          >
                            <ShieldCheck size={18} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevokeAccess(user.id);
                            }}
                            className="p-3 bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white rounded-2xl transition"
                            title="권한 회수"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Notion Link Integration */}
      <div className="bg-slate-900 rounded-[3rem] p-12 border border-white/5 text-white">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-2xl shadow-indigo-500/30">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic tracking-tighter text-white">악보 자산 관리</h3>
              <p className="text-slate-500 text-sm font-medium">파트별 노션 데이터베이스 URL을 동기화합니다.</p>
            </div>
          </div>
          <button 
            onClick={async () => { 
              await saveScores(scores); 
              setSuccessMessage('악보 자산 설정이 성공적으로 저장되었습니다.');
              setShowSuccessModal(true);
            }}
            className="flex items-center gap-3 bg-white text-slate-950 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition shadow-xl"
          >
            <Save size={20} />
            설정 저장하기
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {scores.map(s => (
            <div key={s.instrument} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition group relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{translations[s.instrument] || s.instrument} 파트</span>
                <div className="flex items-center gap-2">
                  {s.instrument !== 'FullScore' && (
                    <button 
                      onClick={() => handleDeletePart(s.instrument)}
                      className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"
                      title="파트 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <Activity size={14} className="text-indigo-500" />
                </div>
              </div>
              <input 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-indigo-300 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={s.notion_url}
                onChange={e => {
                  const updated = scores.map(item => item.instrument === s.instrument ? {...item, notion_url: e.target.value} : item);
                  setScores(updated);
                }}
                placeholder="Notion URL 입력..."
              />
            </div>
          ))}
        </div>

        {/* Add New Part Section */}
        <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/5 border-dashed">
          <h4 className="text-lg font-black italic mb-6 flex items-center gap-2">
            <Plus size={20} className="text-indigo-400" />
            새로운 파트 추가
          </h4>
          <form onSubmit={handleAddPart} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">파트 이름 (한글)</p>
              <input 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-indigo-500 transition"
                placeholder="예: 오보에, 트럼펫..."
                value={newPartName}
                onChange={e => setNewPartName(e.target.value)}
              />
            </div>
            <button 
              type="submit"
              disabled={!newPartName}
              className="md:self-end bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-10 py-4 rounded-2xl font-black transition shadow-xl"
            >
              파트 추가하기
            </button>
          </form>
          <p className="text-[10px] text-slate-500 mt-4 font-bold italic">* 파트를 추가하면 단원 명단 필터, 회원가입, 타파트 승인 목록에 즉시 반영됩니다.</p>
        </div>
      </div>

      {/* 시스템 설정 (연습시간 & 방학) */}
      <div className="bg-slate-900 rounded-[3rem] p-12 border border-white/5 text-white mt-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-amber-600 rounded-3xl shadow-2xl shadow-amber-500/30">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black italic tracking-tighter text-white">시스템 운영 설정</h3>
            <p className="text-slate-500 text-sm font-medium">정기 연습 시간 및 방학 기간을 관리합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 정기 연습 시간 관리 */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-black italic flex items-center gap-2">
                <Clock size={20} className="text-amber-400" />
                정기 연습 시간 설정
              </h4>
            </div>

            <div className="space-y-4">
              {rehearsalSchedule.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-black">
                      {['일', '월', '화', '수', '목', '금', '토'][s.dayOfWeek]}
                    </div>
                    <div>
                      <p className="text-sm font-black">{s.startTime} - {s.endTime}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">WEEKLY SESSION</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteSchedule(s.id)}
                    className="p-2 text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 border-dashed space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">새 연습 시간 추가</p>
                <div className="grid grid-cols-3 gap-3">
                  <select 
                    value={newScheduleDay}
                    onChange={e => setNewScheduleDay(Number(e.target.value))}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  >
                    {['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'].map((day, idx) => (
                      <option key={idx} value={idx}>{day}</option>
                    ))}
                  </select>
                  <input 
                    type="time"
                    value={newScheduleStart}
                    onChange={e => setNewScheduleStart(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  />
                  <input 
                    type="time"
                    value={newScheduleEnd}
                    onChange={e => setNewScheduleEnd(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-amber-500"
                  />
                </div>
                <button 
                  onClick={handleAddSchedule}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-black text-xs transition"
                >
                  연습 시간 추가
                </button>
              </div>
            </div>
          </div>

          {/* 방학 기간 관리 */}
          <div className="space-y-8">
            <h4 className="text-lg font-black italic flex items-center gap-2">
              <Coffee size={20} className="text-blue-400" />
              방학 기간 설정
            </h4>

            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black">방학 모드 활성화</p>
                  <p className="text-[10px] text-slate-500 font-bold">활성화 시 모든 정기 연습 시간 접근이 차단됩니다.</p>
                </div>
                <button 
                  onClick={() => setVacationPeriod(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${vacationPeriod.isActive ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${vacationPeriod.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">시작일</p>
                    <div className="relative">
                      <input 
                        type="text"
                        readOnly
                        value={vacationPeriod.startDate ? `${vacationPeriod.startDate} (${getDayOfWeek(vacationPeriod.startDate)})` : ''}
                        onClick={(e) => {
                          const picker = e.currentTarget.nextSibling as HTMLInputElement;
                          if (picker && typeof picker.showPicker === 'function') {
                            picker.showPicker();
                          }
                        }}
                        placeholder="시작일 선택"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer focus:border-blue-500 text-white"
                      />
                      <input 
                        type="date"
                        value={vacationPeriod.startDate}
                        onChange={e => setVacationPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">종료일</p>
                    <div className="relative">
                      <input 
                        type="text"
                        readOnly
                        value={vacationPeriod.endDate ? `${vacationPeriod.endDate} (${getDayOfWeek(vacationPeriod.endDate)})` : ''}
                        onClick={(e) => {
                          const picker = e.currentTarget.nextSibling as HTMLInputElement;
                          if (picker && typeof picker.showPicker === 'function') {
                            picker.showPicker();
                          }
                        }}
                        placeholder="종료일 선택"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer focus:border-blue-500 text-white"
                      />
                      <input 
                        type="date"
                        value={vacationPeriod.endDate}
                        onChange={e => setVacationPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                        className="absolute opacity-0 pointer-events-none w-0 h-0"
                      />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleSaveVacation}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black transition shadow-xl"
                >
                  방학 설정 저장
                </button>
              </div>

              {vacationPeriod.isActive && vacationPeriod.startDate && vacationPeriod.endDate && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3">
                  <ShieldAlert size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-200 font-medium leading-relaxed">
                    현재 방학 모드가 활성화되어 있습니다.<br/>
                    <span className="font-black">{formatDateOnly(vacationPeriod.startDate)} ~ {formatDateOnly(vacationPeriod.endDate)}</span> 기간 동안은 정기 연습 시간에도 악보 접근이 자동 차단됩니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : activeAdminTab === 'announcements' ? (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      {/* Announcement Header */}
      <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-3xl border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 mb-2">
              <Megaphone size={18} className="animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Communication Hub</span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter text-white">공지 및 전달사항 관리</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">단원들에게 중요한 소식을 전하세요.</p>
          </div>
          <button 
            onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-[2rem] font-black flex items-center gap-3 transition shadow-2xl shadow-indigo-500/20 group"
          >
            <Plus size={24} className={`transition-transform duration-300 ${showAnnouncementForm ? 'rotate-45' : ''}`} />
            새 공지 작성하기
          </button>
        </div>

        {showAnnouncementForm && (
          <form onSubmit={handleSaveAnnouncement} className="mt-12 p-10 bg-white/5 rounded-[2.5rem] border border-white/10 animate-in slide-in-from-top-8 duration-500 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">제목</label>
              <input 
                placeholder="공지사항 제목을 입력하세요" 
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                value={announcementTitle}
                onChange={e => setAnnouncementTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">내용</label>
              <textarea 
                placeholder="전달할 내용을 상세히 적어주세요..." 
                className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-sm min-h-[200px] focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                value={announcementContent}
                onChange={e => setAnnouncementContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => setShowAnnouncementForm(false)}
                className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-white transition"
              >
                취소
              </button>
              <button 
                type="submit"
                className="bg-white text-slate-950 px-10 py-4 rounded-2xl font-black hover:bg-indigo-50 transition shadow-xl flex items-center gap-2"
              >
                <Save size={20} />
                공지 등록하기
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Announcement List */}
      <div className="grid grid-cols-1 gap-6">
        {announcements.length === 0 ? (
          <div className="bg-slate-900/50 rounded-[3rem] p-20 text-center border border-dashed border-white/10">
            <div className="bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Megaphone size={40} className="text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-slate-400 italic">등록된 공지사항이 없습니다.</h3>
            <p className="text-slate-600 text-sm mt-2">새로운 소식을 단원들에게 공유해 보세요.</p>
          </div>
        ) : (
          announcements.map(ann => (
            <div key={ann.id} className="bg-slate-900 rounded-[3rem] p-10 border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <button 
                  onClick={(e) => handleDeleteAnnouncement(e, ann.id)}
                  className="p-4 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition shadow-xl"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="flex items-start gap-6">
                <div className="bg-indigo-500/20 p-5 rounded-3xl text-indigo-400 shrink-0">
                  <Edit3 size={28} />
                </div>
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">NOTICE</span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{formatDateOnly(ann.createdAt)}</span>
                  </div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{ann.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500">A</div>
                    <span className="text-xs font-bold text-slate-500">작성자: {ann.author}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  ) : (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
      {/* Logs Header */}
      <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-3xl border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <Activity size={18} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Real-time Monitoring</span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter text-white">악보 열람 로그</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">단원들의 악보 접근 기록을 실시간으로 확인하세요.</p>
          </div>
          <button 
            onClick={handleClearAllLogs}
            className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 transition shadow-xl"
          >
            <Trash2 size={20} />
            로그 초기화
          </button>
        </div>
      </div>

      {/* Logs Filters */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">날짜 필터</label>
          <div className="relative h-[46px] bg-slate-50 border border-slate-100 rounded-xl flex items-center group hover:border-blue-300 transition-colors">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
            
            <span className={`absolute left-12 right-10 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${logFilterDate ? 'text-slate-900' : 'text-slate-400'}`}>
              {logFilterDate ? formatDateFilter(logFilterDate) : '날짜 선택'}
            </span>
            
            <input 
              type="date"
              value={logFilterDate}
              onChange={e => setLogFilterDate(e.target.value)}
              onClick={(e) => {
                try { (e.currentTarget as any).showPicker(); } catch (err) {}
              }}
              onFocus={(e) => {
                try { (e.currentTarget as any).showPicker(); } catch (err) {}
              }}
              className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
              style={{ colorScheme: 'light' }}
            />

            {logFilterDate && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLogFilterDate('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 z-20 p-1 transition-colors"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">시간 필터</label>
          <div className="relative h-[46px] bg-slate-50 border border-slate-100 rounded-xl flex items-center group hover:border-blue-300 transition-colors">
            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={16} />
            
            <span className={`absolute left-12 right-10 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none ${logFilterTime ? 'text-slate-900' : 'text-slate-400'}`}>
              {logFilterTime ? formatTimeFilter(logFilterTime) : '시간 선택'}
            </span>
            
            <input 
              type="time"
              value={logFilterTime}
              onChange={e => setLogFilterTime(e.target.value)}
              onClick={(e) => {
                try { (e.currentTarget as any).showPicker(); } catch (err) {}
              }}
              onFocus={(e) => {
                try { (e.currentTarget as any).showPicker(); } catch (err) {}
              }}
              className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
              style={{ colorScheme: 'light' }}
            />

            {logFilterTime && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLogFilterTime('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 z-20 p-1 transition-colors"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">이름 필터</label>
          <div className="relative h-[46px]">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
            <input 
              type="text"
              placeholder="단원 이름 검색"
              value={logFilterName}
              onChange={e => setLogFilterName(e.target.value)}
              className="absolute inset-0 w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 py-3 text-xs font-bold outline-none focus:border-blue-500 transition text-slate-900"
            />
            {logFilterName && (
              <button 
                onClick={() => setLogFilterName('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 z-20 p-1"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">악보 필터</label>
          <div className="relative h-[46px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" size={16} />
            <select 
              value={logFilterInstrument}
              onChange={e => setLogFilterInstrument(e.target.value)}
              className="absolute inset-0 w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-8 py-3 text-xs font-bold outline-none focus:border-blue-500 transition appearance-none text-slate-900"
            >
              <option value="All">전체 악보</option>
              {instruments.map(inst => (
                <option key={inst} value={inst}>{getInstrumentName(inst)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">접근 날짜</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">접근 시간</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">접근자 명</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">접근 악보</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold italic">
                    {accessLogs.length === 0 ? '기록된 열람 로그가 없습니다.' : '필터 조건에 맞는 로그가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-slate-900">{formatDateOnly(log.accessedAt)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-bold text-slate-500">{formatTimeOnly(log.accessedAt)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center text-[10px] font-black text-indigo-600">
                          {log.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-black text-slate-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {getInstrumentName(log.instrument)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        title="로그 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}
      {/* 예약 승인 모달 */}
      {showScheduleModal && (isBulkSchedule || selectedUser) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-blue-600 p-6 text-white text-center relative">
              <button 
                onClick={() => {
                  setShowScheduleModal(false);
                  setIsBulkSchedule(false);
                }}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition"
              >
                <X size={20} />
              </button>
              <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30 rotate-12">
                <Calendar size={28} className="text-white -rotate-12" />
              </div>
              <h3 className="text-xl font-black italic tracking-tight uppercase">{isBulkSchedule ? '일괄 예약 승인 설정' : '예약 승인 설정'}</h3>
              <p className="text-blue-100 text-[11px] mt-0.5 font-medium">
                {isBulkSchedule 
                  ? `선택된 ${selectedUserIds.length > 0 ? selectedUserIds.length : filteredUsers.length}명의 단원에게 일괄 권한을 설정합니다.`
                  : `${selectedUser?.name} 단원의 접근 권한 기간을 설정합니다.`}
              </p>
            </div>
            
            <form onSubmit={handleScheduleAccess} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      권한 부여 일시
                    </label>
                    <div className="relative">
                      <div className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl text-[13px] text-slate-900 font-bold flex items-center justify-between transition-all ${isStartFromNow ? 'opacity-50 border-slate-100 cursor-not-allowed' : 'border-slate-100 hover:border-blue-300 focus-within:border-blue-500'}`}>
                        <span className="truncate">{scheduleStart ? formatDateWithDay(scheduleStart) : '날짜 선택'}</span>
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                      </div>
                      <input 
                        type="datetime-local"
                        value={scheduleStart}
                        onChange={(e) => {
                          setScheduleStart(e.target.value);
                          setIsStartFromNow(false);
                        }}
                        disabled={isStartFromNow}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed w-full h-full z-10"
                        required={!isStartFromNow}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                      접근 만료 일시
                    </label>
                    <div className="relative">
                      <div className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-[13px] text-slate-900 font-bold flex items-center justify-between hover:border-blue-300 focus-within:border-blue-500 transition-all">
                        <span className="truncate">{scheduleEnd ? formatDateWithDay(scheduleEnd) : '날짜 선택'}</span>
                        <Calendar size={14} className="text-slate-400 shrink-0" />
                      </div>
                      <input 
                        type="datetime-local"
                        value={scheduleEnd}
                        onChange={(e) => setScheduleEnd(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100 cursor-pointer select-none" onClick={() => setIsStartFromNow(!isStartFromNow)}>
                  <input 
                    type="checkbox"
                    checked={isStartFromNow}
                    onChange={(e) => setIsStartFromNow(e.target.checked)}
                    className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-blue-800 text-[11px] font-black">현재 시점부터 접근 권한을 부여합니다.</span>
                </div>

                {!isBulkSchedule && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100 cursor-pointer select-none" onClick={() => setIncludeOtherParts(!includeOtherParts)}>
                      <input 
                        type="checkbox"
                        checked={includeOtherParts}
                        onChange={(e) => setIncludeOtherParts(e.target.checked)}
                        className="w-4 h-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-emerald-800 text-[11px] font-black">타 파트 악보에도 접근 권한을 부여합니다.</span>
                    </div>

                    {includeOtherParts && (
                      <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">승인할 파트 선택</p>
                        <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-1.5 custom-scrollbar">
                          {instruments.map(inst => (
                            <div 
                              key={inst}
                              onClick={() => togglePartSelection(inst)}
                              className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-2 ${selectedParts.includes(inst) ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-200 hover:border-emerald-200'}`}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition ${selectedParts.includes(inst) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                {selectedParts.includes(inst) && <ShieldCheck size={8} className="text-white" />}
                              </div>
                              <span className={`text-[10px] font-bold ${selectedParts.includes(inst) ? 'text-emerald-700' : 'text-slate-500'}`}>
                                {translations[inst] || inst}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-black py-3 rounded-xl transition"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white text-sm font-black py-3 rounded-xl shadow-lg shadow-blue-200 transition transform active:scale-95"
                >
                  승인 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 타 파트 악보 승인 모달 */}
      {showOtherPartsModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-600 p-10 text-white text-center relative">
              <button 
                onClick={() => setShowOtherPartsModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
              <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30 rotate-12">
                <ShieldCheck size={40} className="text-white -rotate-12" />
              </div>
              <h3 className="text-2xl font-black italic tracking-tight uppercase">타 파트 악보 승인</h3>
              <p className="text-emerald-100 text-sm mt-1 font-medium">어떤 파트의 악보 접근 권한을 부여하시겠습니까?</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
                {instruments.map(inst => (
                  <div 
                    key={inst}
                    onClick={() => togglePartSelection(inst)}
                    className={`p-4 rounded-2xl border-2 transition cursor-pointer flex items-center gap-3 ${selectedParts.includes(inst) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-emerald-200'}`}
                  >
                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition ${selectedParts.includes(inst) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                      {selectedParts.includes(inst) && <ShieldCheck size={12} className="text-white" />}
                    </div>
                    <span className={`text-sm font-black ${selectedParts.includes(inst) ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {translations[inst] || inst}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  type="button"
                  onClick={() => setShowOtherPartsModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition"
                >
                  취소
                </button>
                <div className="flex-[3] flex gap-3">
                  <button 
                    type="button"
                    onClick={() => handleApproveOtherParts(false)}
                    disabled={selectedParts.length === 0}
                    className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-black py-4 rounded-2xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    임시 승인 (1시간)
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleApproveOtherParts(true)}
                    disabled={selectedParts.length === 0}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-200 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    승인 완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="bg-red-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200 rotate-6">
                <Trash2 size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">명단 삭제 확인</h3>
              <p className="text-slate-500 font-bold leading-relaxed">
                선택한 <span className="text-red-600">{selectedUserIds.filter(id => id !== 'admin').length}명</span>의 단원을 정말로 삭제하시겠습니까?<br/>
                <span className="text-[10px] text-slate-400">(이 작업은 되돌릴 수 없습니다)</span>
              </p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition"
                >
                  취소
                </button>
                <button 
                  onClick={confirmBulkDelete}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-200 transition transform active:scale-95"
                >
                  삭제 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 단원 상세 정보 모달 */}
      {showUserDetailModal && userDetailUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white relative">
              <button 
                onClick={() => {
                  setShowUserDetailModal(false);
                  setShowPassword(false);
                }}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center font-black text-3xl backdrop-blur-sm border border-white/30">
                  {userDetailUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight">{userDetailUser.name}</h3>
                  <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest opacity-70">{userDetailUser.id}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">비밀번호</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-slate-900 font-black tracking-widest">
                      {showPassword ? userDetailUser.password : '*'.repeat(userDetailUser.password?.length || 4)}
                    </p>
                    {!showPassword && (
                      <button 
                        onClick={() => setShowPasswordVerifyModal(true)}
                        className="p-1 text-indigo-500 hover:bg-indigo-50 rounded transition"
                        title="비밀번호 보기"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">고유 인증번호</p>
                  <p className="font-mono text-indigo-600 font-black tracking-widest">{userDetailUser.passcode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">파트</p>
                  <p className="font-bold text-slate-900">{translations[userDetailUser.instrument] || userDetailUser.instrument}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">역할</p>
                  <p className={`font-black text-[10px] px-2 py-0.5 rounded-lg w-fit uppercase tracking-widest ${userDetailUser.role === 'admin' ? 'bg-amber-500/20 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                    {userDetailUser.role === 'admin' ? '관리자' : '일반 단원'}
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">현재 상태</p>
                  {(() => {
                    const { allowed } = isAccessAllowed(userDetailUser, vacationPeriod, rehearsalSchedule);
                    return (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${allowed ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${allowed ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        {allowed ? '승인됨' : '잠금'}
                      </div>
                    );
                  })()}
                </div>

                {userDetailUser.temp_access_until && (
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">권한 만료 일시</p>
                    <p className="text-xs font-bold text-slate-600">{formatDateWithDay(userDetailUser.temp_access_until)}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">타 파트 권한</p>
                  {userDetailUser.allowed_other_parts && userDetailUser.allowed_other_parts.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {userDetailUser.allowed_other_parts.map(part => (
                        <span key={part} className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md border border-emerald-100">
                          {translations[part] || part}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-slate-400 italic">부여된 권한 없음</p>
                  )}
                  {userDetailUser.other_parts_access_until && (
                    <p className="text-[9px] font-bold text-emerald-500 mt-1">
                      만료: {formatDateWithDay(userDetailUser.other_parts_access_until)}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={() => {
                    setShowUserDetailModal(false);
                    setShowPassword(false);
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition shadow-xl"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 공지사항 삭제 확인 모달 */}
      {showAnnouncementDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="bg-red-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200 rotate-6">
                <Trash2 size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">공지 삭제 확인</h3>
              <p className="text-slate-500 font-bold leading-relaxed">
                선택한 공지를 정말로 삭제하시겠습니까?<br/>
                <span className="text-[10px] text-slate-400">(이 작업은 되돌릴 수 없습니다)</span>
              </p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    setShowAnnouncementDeleteConfirm(false);
                    setAnnouncementToDelete(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDeleteAnnouncement}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-200 transition transform active:scale-95"
                >
                  삭제 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 파트 삭제 확인 모달 */}
      {showPartDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="bg-red-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200 rotate-6">
                <Trash2 size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic">파트 삭제</h3>
              <p className="text-slate-500 font-bold leading-relaxed">
                선택한 파트를 정말 삭제하시겠습니까?<br />
                <span className="text-red-500">(이 작업은 되돌릴 수 없습니다)</span>
              </p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    setShowPartDeleteConfirm(false);
                    setPartToDelete(null);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition"
                >
                  취소
                </button>
                <button 
                  onClick={confirmDeletePart}
                  className="flex-[2] bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-200 transition transform active:scale-95"
                >
                  삭제 실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {showPasswordVerifyModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="bg-indigo-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 rotate-6">
                <Lock size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic">비밀번호 확인</h3>
              <p className="text-slate-500 font-bold leading-relaxed mb-6">
                비밀번호를 확인하시겠습니까?<br/>
                <span className="text-xs text-slate-400">관리자 패널 코드를 입력해주세요.</span>
              </p>
              
              <input 
                type="password"
                maxLength={4}
                className="w-full bg-slate-100 border-2 border-slate-200 rounded-2xl px-6 py-4 text-center text-2xl font-black tracking-[1em] outline-none focus:border-indigo-500 transition mb-8"
                value={passwordVerifyInput}
                onChange={e => setPasswordVerifyInput(e.target.value)}
                placeholder="****"
                autoFocus
              />

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowPasswordVerifyModal(false);
                    setPasswordVerifyInput('');
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition"
                >
                  취소
                </button>
                <button 
                  onClick={() => {
                    if (passwordVerifyInput === '2479') {
                      setShowPassword(true);
                      setShowPasswordVerifyModal(false);
                      setPasswordVerifyInput('');
                    } else {
                      alert('인증 코드가 올바르지 않습니다.');
                      setPasswordVerifyInput('');
                    }
                  }}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 transition transform active:scale-95"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 성공 알림 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-3xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="bg-green-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-200 rotate-6">
                <ShieldCheck size={40} className="text-white -rotate-6" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 italic">처리 완료</h3>
              <p className="text-slate-500 font-bold leading-relaxed">{successMessage}</p>
              
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="mt-8 w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
