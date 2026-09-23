import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
    X, Camera, CheckCircle2, UserCheck, AlertCircle, RefreshCw, 
    Play, Pause, BookOpen, Clock, MapPin, CheckCircle, User, ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

const TeacherFaceRecognitionModal = ({ isOpen, onClose, scheduleId = null, examScheduleId = null, sessionTitle = '' }) => {
    const webcamRef = useRef(null);
    const offscreenCanvasRef = useRef(null);
    const cooldownRef = useRef(false);
    const isProcessingRef = useRef(false);

    // Camera & Recognition State
    const [attendanceType, setAttendanceType] = useState('check_in'); // 'check_in' | 'check_out'
    const [isScanning, setIsScanning] = useState(true);
    const [box, setBox] = useState(null);
    const [imageSize, setImageSize] = useState([640, 480]);
    const [guidanceMessage, setGuidanceMessage] = useState('🎯 Vui lòng đưa khuôn mặt vào giữa khung tròn');
    
    // Recognition Results
    const [lastRecognized, setLastRecognized] = useState(null);
    const [recentScans, setRecentScans] = useState([]);
    
    // Schedules List
    const [schedules, setSchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(scheduleId);

    // Multi-frame Voting Buffer
    const VOTE_WINDOW = 3;
    const VOTE_THRESHOLD = 2;
    const voteBufferRef = useRef([]);
    const [voteProgress, setVoteProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            fetchSchedules();
            if (scheduleId) setSelectedScheduleId(scheduleId);
            setIsScanning(true);
            setRecentScans([]);
            setLastRecognized(null);
        }
    }, [isOpen, scheduleId]);

    const fetchSchedules = async () => {
        try {
            const res = await api.get('/schedules/today');
            if (res.data.success) {
                setSchedules(res.data.data);
                if (!selectedScheduleId && res.data.data.length > 0) {
                    setSelectedScheduleId(res.data.data[0].id);
                }
            }
        } catch (err) {
            console.error('Lỗi tải danh sách ca học:', err);
        }
    };

    const getScaledScreenshot = useCallback(() => {
        if (!webcamRef.current) return null;
        const video = webcamRef.current.video;
        if (!video || video.readyState < 2) {
            return webcamRef.current.getScreenshot();
        }
        try {
            if (!offscreenCanvasRef.current) {
                offscreenCanvasRef.current = document.createElement('canvas');
            }
            const canvas = offscreenCanvasRef.current;
            const maxW = 480;
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 480;
            const scale = Math.min(1, maxW / vWidth);

            canvas.width = Math.round(vWidth * scale);
            canvas.height = Math.round(vHeight * scale);

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.85);
        } catch (e) {
            return webcamRef.current.getScreenshot();
        }
    }, []);

    const processCameraFrame = useCallback(async () => {
        if (isProcessingRef.current || !webcamRef.current || !isScanning) return;
        const imageToSend = getScaledScreenshot();
        if (!imageToSend) return;

        isProcessingRef.current = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const res = await api.post('/attendance/auto-verify', {
                image_base64: imageToSend,
                attendance_type: attendanceType,
                schedule_id: selectedScheduleId || null,
                exam_schedule_id: examScheduleId || null
            }, { signal: controller.signal });

            clearTimeout(timeoutId);

            if (res.data.success) {
                if (res.data.message) {
                    setGuidanceMessage(res.data.message);
                }
                if (res.data.box) {
                    setBox(res.data.box);
                    if (res.data.image_size) setImageSize(res.data.image_size);
                } else {
                    setBox(null);
                }

                if (cooldownRef.current) {
                    voteBufferRef.current = [];
                    setVoteProgress(0);
                } else if (res.data.match) {
                    const buffer = voteBufferRef.current;
                    buffer.push({
                        student_id: res.data.student?.id,
                        confidence: res.data.confidence
                    });
                    if (buffer.length > VOTE_WINDOW) buffer.shift();

                    const countMap = {};
                    buffer.forEach(item => {
                        countMap[item.student_id] = (countMap[item.student_id] || 0) + 1;
                    });

                    let topStudentId = null;
                    let topVotes = 0;
                    Object.entries(countMap).forEach(([sid, count]) => {
                        if (count > topVotes) {
                            topVotes = count;
                            topStudentId = sid;
                        }
                    });

                    setVoteProgress(topVotes);

                    if (topVotes >= VOTE_THRESHOLD) {
                        cooldownRef.current = true;
                        voteBufferRef.current = [];
                        setVoteProgress(0);

                        const payload = {
                            student: res.data.student,
                            class_attendance: res.data.class_attendance,
                            exam_attendance: res.data.exam_attendance,
                            confidence: res.data.confidence,
                            attendance_type: attendanceType,
                            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        };

                        setLastRecognized(payload);
                        setRecentScans(prev => [payload, ...prev.slice(0, 9)]);

                        // Play audio beep
                        try {
                            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                            const osc = audioCtx.createOscillator();
                            const gain = audioCtx.createGain();
                            osc.type = 'sine';
                            osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                            osc.connect(gain);
                            gain.connect(audioCtx.destination);
                            osc.start();
                            osc.stop(audioCtx.currentTime + 0.15);
                        } catch (e) {}

                        setTimeout(() => {
                            cooldownRef.current = false;
                        }, 3500);
                    }
                } else {
                    voteBufferRef.current = [];
                    setVoteProgress(0);
                }
            }
        } catch (err) {
            clearTimeout(timeoutId);
        } finally {
            isProcessingRef.current = false;
        }
    }, [isScanning, attendanceType, selectedScheduleId, examScheduleId, getScaledScreenshot]);

    useEffect(() => {
        if (!isOpen || !isScanning) return;
        const interval = setInterval(processCameraFrame, 600);
        return () => clearInterval(interval);
    }, [isOpen, isScanning, processCameraFrame]);

    if (!isOpen) return null;

    const currentSchedule = schedules.find(s => s.id === selectedScheduleId);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">
                
                {/* Modal Header */}
                <div className="p-5 bg-[#175b9f] text-white flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner">
                            <Camera size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {examScheduleId ? 'Coi Thi AI' : 'Điểm Danh AI'}
                                </span>
                                {currentSchedule && (
                                    <span className="text-xs text-white/80 font-medium">
                                        {currentSchedule.room_name} · {currentSchedule.course_code}
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold truncate">
                                {sessionTitle || currentSchedule?.course_name || 'Hệ thống điểm danh khuôn mặt AI'}
                            </h3>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
                    
                    {/* Left: Camera & Overlay (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="relative bg-slate-950 rounded-2xl overflow-hidden shadow-lg aspect-[4/3] border border-slate-800 flex items-center justify-center">
                            
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                                className="w-full h-full object-cover"
                            />

                            {/* Circular Mask Overlay */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice">
                                    <defs>
                                        <mask id="teacherModalCircleMask">
                                            <rect width="640" height="480" fill="white" />
                                            <circle cx="320" cy="240" r="160" fill="black" />
                                        </mask>
                                    </defs>
                                    <rect width="640" height="480" fill="rgba(15, 23, 42, 0.65)" mask="url(#teacherModalCircleMask)" />
                                    <circle cx="320" cy="240" r="160" fill="none" stroke="#6366F1" strokeWidth="3" strokeDasharray="8 6" className="animate-pulse" />
                                </svg>
                            </div>

                            {/* Bounding Box overlay */}
                            {box && (
                                <div
                                    className="absolute border-2 border-emerald-400 bg-emerald-400/10 rounded-xl transition-all pointer-events-none shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                                    style={{
                                        left: `${(box[0] / imageSize[0]) * 100}%`,
                                        top: `${(box[1] / imageSize[1]) * 100}%`,
                                        width: `${((box[2] - box[0]) / imageSize[0]) * 100}%`,
                                        height: `${((box[3] - box[1]) / imageSize[1]) * 100}%`,
                                    }}
                                />
                            )}

                            {/* Guidance Message Banner */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center gap-2 max-w-[90%] truncate">
                                <span>{guidanceMessage}</span>
                            </div>

                            {/* Multi-frame voting progress bar */}
                            {voteProgress > 0 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-indigo-900/90 backdrop-blur-md text-white px-4 py-2 rounded-2xl border border-indigo-400/40 shadow-xl flex items-center gap-3">
                                    <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-xs font-bold">Đang đối soát AI ({voteProgress}/{VOTE_THRESHOLD})...</span>
                                </div>
                            )}
                        </div>

                        {/* Controls Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setAttendanceType('check_in')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        attendanceType === 'check_in'
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    🟢 Check-in Đầu Giờ
                                </button>
                                <button
                                    onClick={() => setAttendanceType('check_out')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        attendanceType === 'check_out'
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    🔵 Check-out Cuối Giờ
                                </button>
                            </div>

                            <button
                                onClick={() => setIsScanning(!isScanning)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isScanning
                                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                }`}
                            >
                                {isScanning ? <><Pause size={14} /> Tạm dừng quét</> : <><Play size={14} /> Tiếp tục quét</>}
                            </button>
                        </div>
                    </div>

                    {/* Right: Recognition Result & Recent List (5 cols) */}
                    <div className="lg:col-span-5 space-y-4 flex flex-col">
                        
                        {/* Latest Recognized Card */}
                        {lastRecognized ? (
                            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-md space-y-3 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                        <CheckCircle size={14} /> ĐÃ ĐIỂM DANH THÀNH CÔNG
                                    </span>
                                    <span className="text-xs font-mono text-slate-400 font-bold">{lastRecognized.time}</span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                                        {lastRecognized.student?.full_name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <h4 className="font-extrabold text-slate-900 text-base">{lastRecognized.student?.full_name}</h4>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Mã SV: <span className="font-mono font-bold text-slate-800">{lastRecognized.student?.student_code}</span> | Lớp: {lastRecognized.student?.class_name || 'CNTT'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                                    <span className="text-slate-600 font-medium">Độ chính xác AI:</span>
                                    <span className="font-extrabold text-indigo-600 font-mono">
                                        {(lastRecognized.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center space-y-2">
                                <UserCheck className="mx-auto text-indigo-400" size={32} />
                                <h4 className="font-bold text-slate-700 text-sm">Chưa có kết quả điểm danh</h4>
                                <p className="text-xs text-slate-400">Đưa khuôn mặt sinh viên vào khung hình camera để tiến hành đối soát AI.</p>
                            </div>
                        )}

                        {/* Recent Scans Session Roster */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex-1 flex flex-col min-h-[220px]">
                            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                                <span>Danh Sách Vừa Check-in ({recentScans.length})</span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Real-time</span>
                            </h4>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {recentScans.length === 0 ? (
                                    <div className="text-center py-8 text-xs text-slate-400 font-medium">
                                        Chưa có sinh viên nào check-in trong ca này
                                    </div>
                                ) : (
                                    recentScans.map((item, index) => (
                                        <div key={index} className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                                    {item.student?.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{item.student?.full_name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{item.student?.student_code}</p>
                                                </div>
                                            </div>
                                            <span className="font-mono text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                {item.time}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeacherFaceRecognitionModal;
