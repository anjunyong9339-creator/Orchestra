
export const getDayOfWeek = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return days[date.getDay()];
};

export const formatDateWithDay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const day = getDayOfWeek(dateStr);
  
  let hh = date.getHours();
  const ampm = hh >= 12 ? '오후' : '오전';
  hh = hh % 12;
  hh = hh ? hh : 12;
  const hhStr = String(hh).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd} (${day}) ${ampm} ${hhStr}:${min}`;
};

export const formatDateOnly = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const day = getDayOfWeek(dateStr);
  
  return `${yyyy}-${mm}-${dd}(${day})`;
};

export const formatDateFilter = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const day = getDayOfWeek(dateStr);
  
  return `${yyyy}년-${mm}월-${dd}일(${day})`;
};

export const formatTimeOnly = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  let hh = date.getHours();
  const ampm = hh >= 12 ? '오후' : '오전';
  hh = hh % 12;
  hh = hh ? hh : 12;
  const hhStr = String(hh).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${ampm} ${hhStr}:${min}`;
};

export const formatTimeFilter = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '';
  const [hh, min] = timeStr.split(':').map(Number);
  if (isNaN(hh) || isNaN(min)) return '';
  
  const ampm = hh >= 12 ? '오후' : '오전';
  let displayHh = hh % 12;
  displayHh = displayHh ? displayHh : 12;
  const hhStr = String(displayHh).padStart(2, '0');
  const minStr = String(min).padStart(2, '0');
  
  return `${ampm} ${hhStr}:${minStr}`;
};
