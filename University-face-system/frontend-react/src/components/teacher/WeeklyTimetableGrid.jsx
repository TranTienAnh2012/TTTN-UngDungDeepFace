import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Play, Info, AlertCircle } from 'lucide-react';

const CARD_COLOR_PALETTES = [
    {
        bg: 'bg-blue-100/90 hover:bg-blue-100',
        border: 'border-l-4 border-blue-600',
        text: 'text-blue-950',
        subtext: 'text-blue-700/80',
        badge: 'bg-blue-200/70 text-blue-800'
    },
    {
        bg: 'bg-amber-100/90 hover:bg-amber-100',
        border: 'border-l-4 border-amber-500',
        text: 'text-amber-950',
        subtext: 'text-amber-700/80',
        badge: 'bg-amber-200/70 text-amber-800'
    },
    {
        bg: 'bg-purple-100/90 hover:bg-purple-100',
        border: 'border-l-4 border-purple-500',
        text: 'text-purple-950',
        subtext: 'text-purple-700/80',
        badge: 'bg-purple-200/70 text-purple-800'
    },
    {
        bg: 'bg-emerald-100/90 hover:bg-emerald-100',
        border: 'border-l-4 border-emerald-500',
        text: 'text-emerald-950',
        subtext: 'text-emerald-700/80',
        badge: 'bg-emerald-200/70 text-emerald-800'
    },
    {
        bg: 'bg-rose-100/90 hover:bg-rose-100',
        border: 'border-l-4 border-rose-500',
        text: 'text-rose-950',
        subtext: 'text-rose-700/80',
        badge: 'bg-rose-200/70 text-rose-800'
    },
    {
        bg: 'bg-cyan-100/90 hover:bg-cyan-100',
        border: 'border-l-4 border-cyan-500',
        text: 'text-cyan-950',
        subtext: 'text-cyan-700/80',
        badge: 'bg-cyan-200/70 text-cyan-800'
    }
];

// Hours: 07:00 to 18:00 (ends at 19:00, removed 19:00 and 20:00 as requested)
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const ROW_HEIGHT = 64; // px per hour

const DAYS_HEADER = [
    { key: 1, label: 'T2', fullLabel: 'Thứ 2' },
    { key: 2, label: 'T3', fullLabel: 'Thứ 3' },
    { key: 3, label: 'T4', fullLabel: 'Thứ 4' },
    { key: 4, label: 'T5', fullLabel: 'Thứ 5' },
    { key: 5, label: 'T6', fullLabel: 'Thứ 6' },
    { key: 6, label: 'T7', fullLabel: 'Thứ 7' },
    { key: 0, label: 'CN', fullLabel: 'Chủ Nhật' }
];

const WeeklyTimetableGrid = ({ schedules = [], onSelectSchedule, onStartAttendance }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [nowTime, setNowTime] = useState(new Date());

    // Update real-time marker line every 30s
    useEffect(() => {
        const timer = setInterval(() => setNowTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Get Start of Week (Monday)
    const getMonday = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    };

    const monday = getMonday(currentDate);
    const weekStart = new Date(monday);
    weekStart.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekDates = DAYS_HEADER.map((dh, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        return {
            ...dh,
            dateObj: d,
            dayNum: d.getDate(),
            monthNum: d.getMonth() + 1,
            isToday: d.toDateString() === nowTime.toDateString()
        };
    });

    const isCurrentWeek = getMonday(nowTime).toDateString() === monday.toDateString();

    const handlePrevWeek = () => {
        const prev = new Date(monday);
        prev.setDate(prev.getDate() - 7);
        setCurrentDate(prev);
    };

    const handleNextWeek = () => {
        const next = new Date(monday);
        next.setDate(next.getDate() + 7);
        setCurrentDate(next);
    };

    const handleTodayWeek = () => {
        setCurrentDate(new Date());
    };

    // Filter schedules to ONLY include those falling in the selected week range [weekStart..sunday]
    const weekSchedules = schedules.filter(s => {
        if (!s.start_time) return true;
        const d = new Date(s.start_time);
        if (isNaN(d.getTime())) return true;
        return d >= weekStart && d <= sunday;
    });

    // Helper: Map schedule item to grid position
    const getScheduleGridProps = (s) => {
        let startDate = null;
        let endDate = null;

        if (s.start_time) startDate = new Date(s.start_time);
        if (s.end_time) endDate = new Date(s.end_time);

        // Fallback: parse from s.day and s.time string if start_time is missing
        if (!startDate || isNaN(startDate.getTime())) {
            const timeMatch = s.time ? s.time.match(/(\d{2}):(\d{2})\s*–\s*(\d{2}):(\d{2})/) : null;
            if (timeMatch) {
                startDate = new Date();
                startDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0);
                endDate = new Date();
                endDate.setHours(parseInt(timeMatch[3], 10), parseInt(timeMatch[4], 10), 0);
            } else {
                startDate = new Date();
                startDate.setHours(7, 0, 0);
                endDate = new Date();
                endDate.setHours(9, 15, 0);
            }
        }

        const dayOfWeek = startDate.getDay(); // 0 = Sun, 1 = Mon ...
        // Index in DAYS_HEADER: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        const dayColIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const startHour = startDate.getHours() + startDate.getMinutes() / 60;
        const endHour = endDate ? (endDate.getHours() + endDate.getMinutes() / 60) : (startHour + 2);

        const gridMinHour = HOURS[0]; // 7
        const gridMaxHour = HOURS[HOURS.length - 1] + 1; // 19

        const topOffset = Math.max(0, (startHour - gridMinHour) * ROW_HEIGHT);
        const cardHeight = Math.max(52, (endHour - startHour) * ROW_HEIGHT);

        // Palette selector based on course code / id
        const courseId = s.course_id || s.id || 1;
        const colorPalette = CARD_COLOR_PALETTES[courseId % CARD_COLOR_PALETTES.length];

        // Clear course name & course code formatting for teachers
        let courseName = s.course_name;
        if (!courseName && s.course) {
            courseName = s.course.includes('-') ? s.course.split('-').slice(1).join('-').trim() : s.course;
        }
        if (!courseName) courseName = 'Môn học';

        const courseCode = s.course_code || (s.course && s.course.includes('-') ? s.course.split('-')[0].trim() : '');
        const roomName = s.room_name || s.room || 'Phòng học';

        return {
            dayColIdx,
            topOffset,
            cardHeight,
            colorPalette,
            courseName,
            courseCode,
            roomName,
            startDate,
            endDate,
            timeStr: `${startDate.toTimeString().slice(0, 5)} - ${endDate ? endDate.toTimeString().slice(0, 5) : ''}`
        };
    };

    // Calculate real-time red line offset
    const nowHour = nowTime.getHours() + nowTime.getMinutes() / 60;
    const nowMinHour = HOURS[0];
    const nowMaxHour = HOURS[HOURS.length - 1] + 1;
    const showNowLine = isCurrentWeek && nowHour >= nowMinHour && nowHour <= nowMaxHour;
    const nowLineTop = (nowHour - nowMinHour) * ROW_HEIGHT;
    const todayColIdx = weekDates.findIndex(w => w.isToday);

    return (
        <div className="bg-[#faf7f2] p-5 sm:p-7 rounded-3xl border border-amber-200/60 shadow-sm space-y-5 font-sans">
            {/* Header Navigation & Title */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-200/40 pb-4">
                <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-300"></span>
                    <h2 className="text-xl font-black text-amber-950 tracking-tight flex items-center gap-2">
                        Thời Khóa Biểu Tuần
                    </h2>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900 border border-amber-300/50 font-mono">
                        {weekDates[0].dayNum}/{weekDates[0].monthNum} – {weekDates[6].dayNum}/{weekDates[6].monthNum}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevWeek}
                        className="p-2 hover:bg-amber-200/50 text-amber-900 rounded-xl transition-colors border border-amber-200/80 bg-white/80 shadow-2xs"
                        title="Tuần trước"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <button
                        onClick={handleTodayWeek}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                            isCurrentWeek
                                ? 'bg-amber-900 text-white border-amber-900 shadow-sm'
                                : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100/60'
                        }`}
                    >
                        Tuần này
                    </button>

                    <button
                        onClick={handleNextWeek}
                        className="p-2 hover:bg-amber-200/50 text-amber-900 rounded-xl transition-colors border border-amber-200/80 bg-white/80 shadow-2xs"
                        title="Tuần sau"
                    >
                        <ChevronRight size={18} />
                    </button>

                    <span className="text-xs font-bold text-amber-800/80 ml-2 font-mono">
                        Th{weekDates[0].monthNum} · {currentDate.getFullYear()}
                    </span>
                </div>
            </div>

            {/* Timetable Grid Table */}
            <div className="relative overflow-x-auto rounded-2xl border border-amber-200/50 bg-white shadow-inner scrollbar-thin">
                <div className="min-w-[760px] relative">
                    {/* Column Headers (Days) */}
                    <div className="grid grid-cols-8 border-b border-amber-200/50 bg-[#f7f2ea]">
                        <div className="py-3 px-2 text-center text-xs font-bold text-amber-900/60 border-r border-amber-200/40 uppercase tracking-wider">
                            Giờ
                        </div>
                        {weekDates.map((w, idx) => (
                            <div
                                key={idx}
                                className={`py-3 px-2 text-center transition-colors border-r border-amber-200/40 last:border-r-0 ${
                                    w.isToday ? 'bg-rose-50/90 text-rose-700 font-extrabold' : 'text-amber-950 font-bold'
                                }`}
                            >
                                <div className="text-sm tracking-tight">{w.label}</div>
                                <div className={`text-[11px] font-mono mt-0.5 ${w.isToday ? 'text-rose-600 font-bold' : 'text-amber-800/60'}`}>
                                    {w.dayNum < 10 ? `0${w.dayNum}` : w.dayNum}/{w.monthNum < 10 ? `0${w.monthNum}` : w.monthNum}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Grid Body (Hours x Days) */}
                    <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}px` }}>
                        {/* Background Hour Rows */}
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="grid grid-cols-8 border-b border-amber-100/60 transition-colors hover:bg-amber-50/30"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                {/* Time Label Column */}
                                <div className="p-2 border-r border-amber-200/40 text-[11px] font-semibold text-amber-800/60 font-mono flex items-start justify-center select-none">
                                    {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                                </div>
                                {/* 7 Day Column Slots */}
                                {weekDates.map((w, dIdx) => (
                                    <div
                                        key={dIdx}
                                        className={`border-r border-amber-100/60 last:border-r-0 ${
                                            w.isToday ? 'bg-rose-500/3' : ''
                                        }`}
                                    ></div>
                                ))}
                            </div>
                        ))}

                        {/* Real-time Red Line Indicator */}
                        {showNowLine && (
                            <div
                                className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                                style={{ top: `${nowLineTop}px` }}
                            >
                                <div className="w-2.5 h-2.5 bg-rose-600 rounded-full ring-4 ring-rose-200 -ml-1"></div>
                                <div className="flex-1 h-[2px] bg-rose-500 shadow-xs"></div>
                            </div>
                        )}

                        {/* Today Vertical Highlight Overlay */}
                        {todayColIdx >= 0 && (
                            <div
                                className="absolute top-0 bottom-0 pointer-events-none border-x-2 border-rose-300/40 bg-rose-500/4 z-0"
                                style={{
                                    left: `${(100 / 8) * (todayColIdx + 1)}%`,
                                    width: `${100 / 8}%`
                                }}
                            ></div>
                        )}

                        {/* Schedule Cards Overlay (Filtered ONLY for selected week) */}
                        {weekSchedules.map((s) => {
                            const grid = getScheduleGridProps(s);
                            const colWidthPercent = 100 / 8;
                            const leftPercent = colWidthPercent * (grid.dayColIdx + 1);

                            return (
                                <div
                                    key={s.id}
                                    onClick={() => onSelectSchedule && onSelectSchedule(s)}
                                    className={`absolute z-10 p-2 sm:p-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-0.5 group overflow-hidden flex flex-col justify-between ${grid.colorPalette.bg} ${grid.colorPalette.border} ${grid.colorPalette.shadow}`}
                                    style={{
                                        left: `calc(${leftPercent}% + 3px)`,
                                        width: `calc(${colWidthPercent}% - 6px)`,
                                        top: `${grid.topOffset + 3}px`,
                                        height: `${grid.cardHeight - 6}px`
                                    }}
                                    title={`${grid.courseName} (${grid.roomName}) - Click để xem chi tiết ca học`}
                                >
                                    <div className="space-y-1 overflow-hidden">
                                        <div className="flex items-center justify-between gap-1 flex-wrap">
                                            {grid.courseCode && (
                                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${grid.colorPalette.badge} font-mono tracking-tight`}>
                                                    {grid.courseCode}
                                                </span>
                                            )}
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${grid.colorPalette.badge} shrink-0 font-mono ml-auto`}>
                                                {grid.timeStr}
                                            </span>
                                        </div>

                                        <h4 className={`font-black text-xs sm:text-[12.5px] leading-snug line-clamp-2 ${grid.colorPalette.text}`}>
                                            {grid.courseName}
                                        </h4>

                                        <p className={`text-[10.5px] font-bold truncate ${grid.colorPalette.subtext}`}>
                                            {grid.roomName}
                                        </p>
                                    </div>

                                    {grid.cardHeight > 85 && (
                                        <div className="flex items-center justify-between pt-1 border-t border-black/5 text-[10px]">
                                            <span className="font-semibold text-slate-600 truncate">
                                                {s.group || 'Nhóm 01'} ({s.count || 40} SV)
                                            </span>
                                            {s.status === 'Active' && (
                                                <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md animate-pulse">
                                                    ● LIVE
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyTimetableGrid;
