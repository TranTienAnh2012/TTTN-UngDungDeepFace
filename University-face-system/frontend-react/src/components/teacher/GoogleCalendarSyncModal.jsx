import React, { useState } from 'react';
import { Calendar, Download, ExternalLink, Copy, Check, X, Sparkles, Clock, MapPin, AlertCircle, Info } from 'lucide-react';

const GoogleCalendarSyncModal = ({ isOpen, onClose, schedules = [], type = 'class', customTitle }) => {
    const [copied, setCopied] = useState(false);
    const [selectedTab, setSelectedTab] = useState('quick'); // 'quick' | 'ics' | 'sub'

    if (!isOpen) return null;

    // Helper: Build 1-click Google Calendar Event URL
    const buildGoogleCalendarUrl = (schedule) => {
        let titleStr = schedule.course_name || schedule.course || 'Lịch Giảng Dạy';
        if (schedule.course_code) {
            titleStr = `[${schedule.course_code}] ${titleStr}`;
        }

        const title = encodeURIComponent(titleStr);
        const location = encodeURIComponent(schedule.room_name || schedule.room || 'Phòng học');
        const details = encodeURIComponent(
            `Lớp: ${schedule.group || schedule.class_name || 'Nhóm học'}\n` +
            `Số sinh viên: ${schedule.count || 40} SV\n` +
            `Thời gian: ${schedule.day || ''} (${schedule.time || ''})\n` +
            `Hệ thống Điểm danh Khuôn mặt AI`
        );

        let startIso, endIso;
        if (schedule.start_time && schedule.end_time) {
            const startD = new Date(schedule.start_time);
            const endD = new Date(schedule.end_time);
            startIso = startD.toISOString().replace(/-|:|\.\d\d\d/g, "");
            endIso = endD.toISOString().replace(/-|:|\.\d\d\d/g, "");
        } else {
            const now = new Date();
            startIso = now.toISOString().replace(/-|:|\.\d\d\d/g, "");
            endIso = new Date(now.getTime() + 2 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        }

        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    };

    // Helper: Generate .ics file for downloading
    const handleDownloadICS = () => {
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//University Face Attendance System//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH'
        ];

        schedules.forEach((s, idx) => {
            let startIso = new Date().toISOString().replace(/-|:|\.\d\d\d/g, "");
            let endIso = new Date(Date.now() + 2 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");

            if (s.start_time && s.end_time) {
                startIso = new Date(s.start_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
                endIso = new Date(s.end_time).toISOString().replace(/-|:|\.\d\d\d/g, "");
            }

            const title = (s.course_code ? `[${s.course_code}] ` : '') + (s.course_name || s.course || 'Lịch học');
            const room = s.room_name || s.room || 'Phòng học';
            const desc = `Lớp: ${s.group || s.class_name || ''} - Điểm danh AI`;

            icsContent.push('BEGIN:VEVENT');
            icsContent.push(`UID:schedule-${s.id || idx}-${Date.now()}@university.edu`);
            icsContent.push(`DTSTAMP:${startIso}`);
            icsContent.push(`DTSTART:${startIso}`);
            icsContent.push(`DTEND:${endIso}`);
            icsContent.push(`SUMMARY:${title}`);
            icsContent.push(`LOCATION:${room}`);
            icsContent.push(`DESCRIPTION:${desc}`);
            icsContent.push('END:VEVENT');
        });

        icsContent.push('END:VCALENDAR');

        const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LichGiangDay_GoogleCalendar_${new Date().toISOString().slice(0, 10)}.ics`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Realtime iCal Feed URL
    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    const feedUrl = `${apiBase}/api/schedules/ical-feed.ics${type === 'exam' ? '?type=exam' : ''}`;

    const handleCopyFeedUrl = () => {
        navigator.clipboard.writeText(feedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                
                {/* Header with Google Brand Colors */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                            <Calendar size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                                {customTitle || (type === 'exam' ? 'Đồng Bộ Lịch Thi Google Calendar' : 'Đồng Bộ Google Calendar')}
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                                    Realtime
                                </span>
                            </h2>
                            <p className="text-xs text-blue-100 font-medium">
                                Hiển thị {type === 'exam' ? 'lịch thi cuối kỳ' : 'lịch giảng dạy & học phần'} trên Google Calendar máy tính & điện thoại
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="Đóng"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs Header */}
                <div className="flex border-b border-slate-100 bg-slate-50/80 px-6 pt-3 gap-2 flex-shrink-0">
                    <button
                        onClick={() => setSelectedTab('quick')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                            selectedTab === 'quick'
                                ? 'border-blue-600 text-blue-600 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <ExternalLink size={14} />
                        <span>1-Click Thêm Ca Học</span>
                    </button>

                    <button
                        onClick={() => setSelectedTab('sub')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                            selectedTab === 'sub'
                                ? 'border-blue-600 text-blue-600 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Sparkles size={14} />
                        <span>Đăng ký URL Thời Gian Thực</span>
                    </button>

                    <button
                        onClick={() => setSelectedTab('ics')}
                        className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                            selectedTab === 'ics'
                                ? 'border-blue-600 text-blue-600 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Download size={14} />
                        <span>Tải File Lịch .ICS</span>
                    </button>
                </div>

                {/* Tab Contents */}
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    
                    {/* TAB 1: 1-Click Direct Add */}
                    {selectedTab === 'quick' && (
                        <div className="space-y-3">
                            <div className="p-3 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-bold">Nhấn nút bên dưới mỗi ca học</span> để chuyển thẳng sang ứng dụng Google Calendar và lưu thông báo nhắc nhở tự động trước giờ học.
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                {schedules.length === 0 ? (
                                    <p className="text-center py-8 text-xs text-slate-400 font-medium">
                                        Không có ca giảng dạy nào trong danh sách.
                                    </p>
                                ) : (
                                    schedules.map((s) => {
                                        const googleUrl = buildGoogleCalendarUrl(s);
                                        return (
                                            <div
                                                key={s.id}
                                                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all flex items-center justify-between gap-3 shadow-2xs"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono">
                                                            {s.day || 'Hôm nay'} · {s.time || 'Ca học'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                                            <MapPin size={11} className="text-slate-400" />
                                                            {s.room_name || s.room || 'Phòng học'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-900">
                                                        {s.course_code ? `[${s.course_code}] ` : ''}{s.course_name || s.course}
                                                    </h4>
                                                </div>

                                                <a
                                                    href={googleUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
                                                >
                                                    <Calendar size={13} />
                                                    <span>Thêm vào Google Calendar</span>
                                                    <ExternalLink size={12} />
                                                </a>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Realtime URL Subscription */}
                    {selectedTab === 'sub' && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-950 space-y-2">
                                <h4 className="font-bold flex items-center gap-2 text-amber-900 text-sm">
                                    <Sparkles size={16} className="text-amber-600" />
                                    Tự động đồng bộ thời gian thực vào Google Calendar
                                </h4>
                                <p className="leading-relaxed">
                                    Bằng cách dán URL Lịch này vào Google Calendar một lần duy nhất, tất cả các thay đổi lịch giảng dạy mới từ hệ thống nhà trường sẽ <strong>tự động đồng bộ realtime</strong> về điện thoại của bạn.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    URL Đăng ký Lịch Thời Gian Thực (iCal Feed):
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={feedUrl}
                                        className="flex-1 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none select-all"
                                    />
                                    <button
                                        onClick={handleCopyFeedUrl}
                                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                                            copied
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                        }`}
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        <span>{copied ? 'Đã sao chép!' : 'Sao chép Link'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Step by step guide */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Hướng dẫn 3 bước thêm vào Google Calendar:
                                </h4>
                                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside font-medium">
                                    <li>Mở <strong>Google Calendar</strong> trên trình duyệt web.</li>
                                    <li>Ở cột bên trái, nhấn vào nút <strong>+ (Thêm lịch khác)</strong> &rarr; Chọn <strong>Từ URL (From URL)</strong>.</li>
                                    <li>Dán đường dẫn URL trên vào và nhấn <strong>Thêm lịch (Add calendar)</strong>. Hoàn tất!</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: ICS Download */}
                    {selectedTab === 'ics' && (
                        <div className="space-y-4 text-center py-4">
                            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
                                <Download size={30} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-extrabold text-slate-900 text-base">Tải xuống Tệp Lịch Chuẩn iCalendar (.ics)</h3>
                                <p className="text-xs text-slate-500 max-w-md mx-auto">
                                    Xuất toàn bộ {schedules.length} ca học hiện tại thành file chuẩn .ics để nhập (Import) vào Google Calendar, Outlook, Apple Calendar hoặc bất kỳ ứng dụng lịch nào.
                                </p>
                            </div>

                            <button
                                onClick={handleDownloadICS}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all inline-flex items-center gap-2 active:scale-95"
                            >
                                <Download size={16} />
                                <span>Tải File .ICS Cho Google Calendar</span>
                            </button>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
                    <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-400" />
                        <span>Thời gian thực đồng bộ tự động</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all"
                    >
                        Đóng
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GoogleCalendarSyncModal;
