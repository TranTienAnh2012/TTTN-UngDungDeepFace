import React, { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
    Camera, CheckCircle, XCircle, Search, UserCheck, AlertTriangle, 
    User, BookOpen, Calendar, MapPin, Sparkles, RefreshCw, Layers,
    LogIn, LogOut, Clock, CheckCircle2, AlertCircle, History, ChevronDown
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';

// ── Helper: status badge bêm dưới dropdown chọn buổi học ─────────────────────────
const ScheduleStatusBadge = ({ scheduleId, schedules }) => {
    if (!scheduleId) return null;
    const sel = schedules.find(x => x.id === scheduleId);
    if (!sel) return null;
    const nowMs = Date.now();
    const isActive = new Date(sel.start_time) <= nowMs && new Date(sel.end_time) >= nowMs;
    return (
        <div className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
            <span className={`w-2 h-2 rounded-full ${
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
            }`}></span>
            {isActive ? '🟢 Buổi học đang diễn ra' : '⏸ Buổi học chưa bắt đầu / đã kết thúc'}
            {' · '}Đã check-in: <strong>{sel.checked_in_count || 0}</strong>
            {' · '}Đã check-out: <strong>{sel.checked_out_count || 0}</strong>
        </div>
    );
};

// ── Helper: thẻ kết quả nhận diện ──────────────────────────────────────────────────
const RecognitionResultCard = ({ recognized }) => {
    if (!recognized) return null;
    const isCheckIn = recognized.attendance_type === 'check_in';
    const ca = recognized.class_attendance;
    const ea = recognized.exam_attendance;
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`p-5 text-white flex items-center gap-4 ${
                isCheckIn
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
                    {recognized.student.full_name?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {isCheckIn ? 'Check-in Đầu Giờ' : 'Check-out Cuối Giờ'}
                        </span>
                        <span className="text-xs text-white/80 ml-auto font-mono">{recognized.time}</span>
                    </div>
                    <h2 className="text-xl font-bold truncate mt-0.5">{recognized.student.full_name}</h2>
                    <p className="text-xs text-white/90 font-medium">
                        Mã SV: <span className="font-mono font-bold">{recognized.student.student_code}</span> | Lớp: {recognized.student.class_name || 'CNTT'}
                    </p>
                </div>
            </div>
            {/* Confidence */}
            <div className="p-3.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Độ tin cậy AI:</span>
                <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-2 rounded-full ${isCheckIn ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(recognized.confidence * 100, 100)}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-extrabold text-gray-800 font-mono">
                        {(recognized.confidence * 100).toFixed(1)}%
                    </span>
                </div>
            </div>
            {/* Details */}
            <div className="p-5 space-y-4">
                {/* Class Attendance */}
                {ca ? (
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen size={14} className="text-blue-600" />
                                Điểm Danh Lớp Học
                            </span>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                ca.is_complete
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isCheckIn
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                                {ca.status}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{ca.course_code} - {ca.course_name}</h4>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className={`p-2.5 rounded-lg border text-xs ${
                                ca.check_in_time
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}>
                                <div className="flex items-center gap-1 font-semibold text-[11px] mb-1">
                                    <LogIn size={13} className="text-emerald-600" />
                                    <span>Đầu giờ (Check-in)</span>
                                </div>
                                <p className="font-bold font-mono text-sm">{ca.check_in_time || '--:--:--'}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg border text-xs ${
                                ca.check_out_time
                                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                                    : 'bg-gray-100 border-gray-200 text-gray-400'
                            }`}>
                                <div className="flex items-center gap-1 font-semibold text-[11px] mb-1">
                                    <LogOut size={13} className="text-blue-600" />
                                    <span>Cuối giờ (Check-out)</span>
                                </div>
                                <p className="font-bold font-mono text-sm">{ca.check_out_time || '--:--:--'}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-600 pt-1 border-t border-gray-200/60">
                            <span className="flex items-center gap-1">
                                <MapPin size={12} className="text-gray-400" />
                                {ca.room_name}
                            </span>
                            <span className="text-[11px] font-medium text-gray-500">
                                {ca.is_complete ? '✓ Đủ điều kiện chuyên cần' : 'Đang trong buổi học'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400 font-medium">
                        📅 Không có lịch học nào diễn ra hôm nay
                    </div>
                )}
                {/* Exam Attendance */}
                {ea ? (
                    <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar size={14} className="text-purple-600" />
                                Điểm Danh Phòng Thi
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                ea.is_eligible ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                            }`}>
                                {ea.is_eligible ? '✓ Đủ điều kiện thi' : '✕ Không đủ điều kiện'}
                            </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{ea.course_code} - {ea.course_name}</h4>
                        <div className="flex justify-between items-center text-xs text-purple-900 pt-1">
                            <span className="font-semibold">{ea.exam_room}</span>
                            <span className="font-bold bg-white px-2 py-0.5 rounded border border-purple-200">
                                Chỗ ngồi: {ea.seat}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-purple-50/30 border border-dashed border-purple-100 rounded-xl text-center text-xs text-purple-400 font-medium">
                        📋 Không có lịch thi nào diễn ra hôm nay
                    </div>
                )}
            </div>

            {/* Re-register face action footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Cần cập nhật lại khuôn mặt?</span>
                <a
                    href={`${window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin'}/face-registration?student_id=${recognized.student.id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                    🔄 Đăng ký lại khuôn mặt
                </a>
            </div>
        </div>
    );
};

const isFaceInsideOval = (box, imageSize = [640, 480], ovalConfig = { cx: 320, cy: 235, rx: 140, ry: 190 }) => {
    if (!box || !Array.isArray(box) || box.length < 4) return false;
    const [imgW, imgH] = imageSize && imageSize[0] ? imageSize : [640, 480];
    let x, y, w, h;
    if (box[2] > box[0] && box[3] > box[1] && box[2] > 50 && box[3] > 50 && box[0] < 500 && box[1] < 500) {
        x = box[0];
        y = box[1];
        w = box[2] - box[0];
        h = box[3] - box[1];
    } else {
        x = box[0];
        y = box[1];
        w = box[2];
        h = box[3];
    }
    const scaleX = 640 / (imgW || 640);
    const scaleY = 480 / (imgH || 480);
    const faceCenterX = (x + w / 2) * scaleX;
    const faceCenterY = (y + h / 2) * scaleY;
    const { cx, cy, rx, ry } = ovalConfig;
    const normalizedDist = Math.pow((faceCenterX - cx) / rx, 2) + Math.pow((faceCenterY - cy) / ry, 2);
    return normalizedDist <= 0.95;
};

const FaceRecognition = () => {
    const [searchParams] = useSearchParams();
    const webcamRef = useRef(null);

    // Mode: 'auto' (1:N automatic scan) vs 'manual' (1:1 specific student pick)
    const [mode, setMode] = useState('auto');

    // Attendance Session Type: 'check_in' (Đầu giờ) vs 'check_out' (Cuối giờ)
    const [attendanceType, setAttendanceType] = useState('check_in');

    // Auto-scan state
    const [isAutoScanning, setIsAutoScanning] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastRecognized, setLastRecognized] = useState(null); // { student, class_attendance, exam_attendance, confidence, time }
    const [recentScans, setRecentScans] = useState([]); // List of recent scans in this session
    const cooldownRef = useRef(false);

    // ── Multi-frame voting buffer ──────────────────────────────────────────
    // To prevent false positives, we require VOTE_THRESHOLD consecutive frames
    // to agree on the SAME student_id before triggering the check-in.
    const VOTE_WINDOW = 3;       // Look at last N frames
    const VOTE_THRESHOLD = 2;   // Need at least M of those frames to agree
    const voteBufferRef = useRef([]); // [{ student_id, confidence }]
    const [voteProgress, setVoteProgress] = useState(0); // 0-3 for progress bar
    const [voteLabel, setVoteLabel] = useState(''); // 'Đang xác nhận...' etc.
    // ──────────────────────────────────────────────────────────────────────

    // Camera visual feedback & Guidance
    const [box, setBox] = useState(null);
    const [imageSize, setImageSize] = useState([640, 480]);
    const [faceDetected, setFaceDetected] = useState(false);
    const [qualityReason, setQualityReason] = useState('no_face');
    const [guidanceMessage, setGuidanceMessage] = useState('🎯 Vui lòng đưa khuôn mặt vào khung hình tròn');

    // ── Lịch học hôm nay & buổi được chọn ────────────────────────────────
    const [todaySchedules, setTodaySchedules] = useState([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    // ──────────────────────────────────────────────────────────────────────

    // Manual mode state
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentInput, setStudentInput] = useState('');
    const [matchedStudentInfo, setMatchedStudentInfo] = useState(null);
    const [manualResult, setManualResult] = useState(null);

    // Load student list & today schedules on mount
    useEffect(() => {
        loadStudents();
        loadTodaySchedules();
    }, []);

    const loadStudents = async () => {
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setStudents(res.data.data);
                const paramStudentId = searchParams.get('student_id');
                if (paramStudentId) {
                    const found = res.data.data.find(s => s.id === parseInt(paramStudentId));
                    if (found) {
                        setSelectedStudentId(found.id.toString());
                        setStudentInput(found.student_code);
                        setMatchedStudentInfo(found);
                        setMode('manual');
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        }
    };

    const loadTodaySchedules = async () => {
        setLoadingSchedules(true);
        try {
            const allRes = await api.get('/schedules/all');
            let scheduleList = [];
            if (allRes.data.success && Array.isArray(allRes.data.data) && allRes.data.data.length > 0) {
                scheduleList = allRes.data.data;
            } else {
                const todayRes = await api.get('/schedules/today');
                if (todayRes.data.success) scheduleList = todayRes.data.data;
            }

            setTodaySchedules(scheduleList);

            const paramScheduleId = searchParams.get('schedule_id');
            let selected = null;
            if (paramScheduleId) {
                selected = scheduleList.find(s => Number(s.id) === Number(paramScheduleId));
            }

            if (!selected) {
                const now = Date.now();
                const active = scheduleList.find(s =>
                    new Date(s.start_time) <= now && new Date(s.end_time) >= now
                );
                selected = active || scheduleList[0];
            }

            if (selected) {
                setSelectedScheduleId(Number(selected.id));
            }
        } catch (err) {
            console.error('Lỗi khi tải lịch học:', err);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const offscreenCanvasRef = useRef(null);

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

    const isProcessingRef = useRef(false);

    // Continuous face detection & auto-identification loop
    const processCameraFrame = useCallback(async () => {
        if (isProcessingRef.current || !webcamRef.current) return;
        const imageToSend = getScaledScreenshot();
        if (!imageToSend) return;

        isProcessingRef.current = true;
        if (mode === 'manual') setIsProcessing(true);

        // Abort controller: timeout 5 giây để tránh treo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            if (mode === 'auto' && isAutoScanning) {
                const autoRes = await api.post('/attendance/auto-verify', {
                    image_base64: imageToSend,
                    attendance_type: attendanceType,
                    schedule_id: selectedScheduleId || null
                }, { signal: controller.signal });

                clearTimeout(timeoutId);

                if (autoRes.data.success) {
                    const isInside = autoRes.data.box && isFaceInsideOval(autoRes.data.box, autoRes.data.image_size || imageSize);
                    const isOutside = autoRes.data.quality_reason === 'outside_oval_frame' || (autoRes.data.box && !isInside);
                    const isTooDark = autoRes.data.quality_reason && autoRes.data.quality_reason.includes('too_dark');
                    const isSpoof = autoRes.data.is_live === false;

                    // Update quality reason & guidance message
                    if (isOutside) {
                        setQualityReason('outside_oval_frame');
                        setGuidanceMessage('🎯 Vui lòng di chuyển khuôn mặt vào trong vòng tròn hướng dẫn');
                        setBox(null);
                        setFaceDetected(false);
                        voteBufferRef.current = [];
                        setVoteProgress(0);
                        setVoteLabel('');
                    } else if (isTooDark) {
                        setQualityReason('too_dark');
                        setGuidanceMessage('💡 Ánh sáng không đủ! Vui lòng di chuyển đến nơi sáng hơn hoặc bật thêm đèn');
                        setBox(null);
                        setFaceDetected(false);
                        voteBufferRef.current = [];
                        setVoteProgress(0);
                        setVoteLabel('');
                    } else if (isSpoof) {
                        setQualityReason('spoof_detected');
                        setGuidanceMessage('⚠️ Phát hiện ảnh chụp/màn hình giả lập. Vui lòng quay khuôn mặt trực tiếp');
                        setBox(null);
                        setFaceDetected(false);
                        voteBufferRef.current = [];
                        setVoteProgress(0);
                        setVoteLabel('');
                    } else {
                        if (autoRes.data.box && isInside) {
                            setBox(autoRes.data.box);
                            setFaceDetected(true);
                            if (autoRes.data.image_size) setImageSize(autoRes.data.image_size);
                        } else {
                            setBox(null);
                            setFaceDetected(false);
                            if (autoRes.data.quality_reason) setQualityReason(autoRes.data.quality_reason);
                            if (autoRes.data.message) setGuidanceMessage(autoRes.data.message);
                        }
                    }

                    if (cooldownRef.current || isOutside || isTooDark || isSpoof) {
                        voteBufferRef.current = [];
                        setVoteProgress(0);
                        setVoteLabel('');
                    } else if (autoRes.data.match && isInside && autoRes.data.is_live !== false) {
                        // ── Multi-frame voting logic (only after liveness blink is confirmed) ──
                        const buffer = voteBufferRef.current;
                        buffer.push({
                            student_id: autoRes.data.student?.id,
                            confidence: autoRes.data.confidence
                        });
                        if (buffer.length > VOTE_WINDOW) buffer.shift();

                        const voteCounts = {};
                        buffer.forEach(v => {
                            if (v.student_id) {
                                voteCounts[v.student_id] = (voteCounts[v.student_id] || 0) + 1;
                            }
                        });

                        const bestId = Object.keys(voteCounts)
                            .sort((a, b) => voteCounts[b] - voteCounts[a])[0];
                        const bestVotes = bestId ? voteCounts[bestId] : 0;

                        setVoteProgress(bestVotes);

                        if (bestVotes >= 1) {
                            const winConfidences = buffer
                                .filter(v => String(v.student_id) === String(bestId))
                                .map(v => v.confidence);
                            const avgConf = winConfidences.reduce((a, b) => a + b, 0) / winConfidences.length;

                            setVoteLabel('✓ Xác nhận!');
                            const newRecognized = {
                                student: autoRes.data.student,
                                class_attendance: autoRes.data.class_attendance,
                                exam_attendance: autoRes.data.exam_attendance,
                                confidence: avgConf,
                                attendance_type: attendanceType,
                                time: new Date().toLocaleTimeString('vi-VN')
                            };
                            setLastRecognized(newRecognized);
                            setRecentScans(prev => {
                                const filtered = prev.filter(item => item.student.id !== newRecognized.student.id);
                                return [newRecognized, ...filtered].slice(0, 5);
                            });

                            voteBufferRef.current = [];
                            setVoteProgress(0);
                            setVoteLabel('');
                            blinkRef.current = { hasSeenClosed: false, lastClosedTime: 0 };
                            setBlinkStatus('WAIT_BLINK');
                            cooldownRef.current = true;
                            setTimeout(() => { cooldownRef.current = false; }, 3500);
                        } else {
                            setVoteLabel(`Xác nhận ${bestVotes}/${VOTE_THRESHOLD}...`);
                        }
                    } else {
                        // Non-matching frame: push null to let unconfirmed votes expire out of buffer
                        const buffer = voteBufferRef.current;
                        buffer.push({ student_id: null, confidence: 0 });
                        if (buffer.length > VOTE_WINDOW) buffer.shift();

                        const voteCounts = {};
                        buffer.forEach(v => {
                            if (v.student_id) {
                                voteCounts[v.student_id] = (voteCounts[v.student_id] || 0) + 1;
                            }
                        });
                        const bestId = Object.keys(voteCounts).sort((a, b) => voteCounts[b] - voteCounts[a])[0];
                        const bestVotes = bestId ? voteCounts[bestId] : 0;
                        setVoteProgress(bestVotes);
                        if (bestVotes > 0) {
                            setVoteLabel(`Xác nhận ${bestVotes}/${VOTE_THRESHOLD}...`);
                        } else {
                            setVoteLabel('');
                        }
                    }
                }
            } else if (mode === 'manual') {
                const poseRes = await api.post('/face/detect-pose', { image_base64: imageToSend },
                    { signal: controller.signal });
                clearTimeout(timeoutId);
                if (poseRes.data.success && poseRes.data.box) {
                    setBox(poseRes.data.box);
                    setFaceDetected(true);
                    if (poseRes.data.image_size) setImageSize(poseRes.data.image_size);
                } else {
                    setBox(null);
                    setFaceDetected(false);
                }
            }
        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError' || err.name === 'CanceledError') {
                console.warn('[FaceRecognition] Request timeout - bỏ qua frame này');
                setBox(null);
                setFaceDetected(false);
            }
        } finally {
            isProcessingRef.current = false;
            if (mode === 'manual') setIsProcessing(false);
        }
    }, [mode, isAutoScanning, attendanceType, selectedScheduleId, getScaledScreenshot]);

    useEffect(() => {
        const interval = setInterval(processCameraFrame, mode === 'auto' ? 200 : 300);
        return () => clearInterval(interval);
    }, [processCameraFrame, mode]);

    // Manual verify button click
    const handleManualVerify = async () => {
        const targetId = selectedStudentId || studentInput;
        if (!targetId || !webcamRef.current) return;

        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        setIsProcessing(true);
        setManualResult(null);

        try {
            const response = await api.post('/attendance/verify', {
                student_id: parseInt(targetId),
                image_base64: imageSrc,
                attendance_type: attendanceType
            });

            if (response.data.success) {
                setManualResult({
                    match: true,
                    confidence: response.data.confidence,
                    attendance: response.data.attendance,
                    message: response.data.message || `Xác thực thành công! Độ chính xác: ${(response.data.confidence * 100).toFixed(1)}%`
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi kết nối server';
            const confidence = error.response?.data?.confidence || 0;
            setManualResult({
                match: false,
                confidence: confidence,
                message: msg
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-primary-700 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                            <Sparkles size={22} />
                        </div>
                        Nhận Diện & Điểm Danh Khuôn Mặt
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Hệ thống AI nhận diện thời gian thực, hỗ trợ <strong>Điểm danh Đầu giờ (Check-in)</strong> và <strong>Điểm danh Cuối giờ (Check-out)</strong>
                    </p>
                </div>

                {/* Mode Switcher: Auto vs Manual */}
                <div className="flex items-center bg-gray-100 p-1.5 rounded-xl self-start md:self-auto border border-gray-200">
                    <button
                        onClick={() => setMode('auto')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            mode === 'auto' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Sparkles size={16} /> Quét Tự Động (1:N)
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                            mode === 'manual' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Search size={16} /> Chọn Sinh Viên (1:1)
                    </button>
                </div>
            </div>

            {/* Attendance Session Selector: Check-in vs Check-out */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full animate-ping ${attendanceType === 'check_in' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    <span className="text-sm font-bold text-gray-700">Phiên điểm danh hiện tại:</span>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setAttendanceType('check_in')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                            attendanceType === 'check_in'
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-2'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                    >
                        <LogIn size={18} />
                        <span>Điểm Danh Đầu Giờ (Check-in)</span>
                    </button>

                    <button
                        onClick={() => setAttendanceType('check_out')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all ${
                            attendanceType === 'check_out'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-600 ring-offset-2'
                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                    >
                        <LogOut size={18} />
                        <span>Điểm Danh Cuối Giờ (Check-out)</span>
                    </button>
                </div>
            </div>

            {/* ── Chọn Buổi Học ─────────────────────────────────────────────── */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2 shrink-0">
                        <Calendar size={18} className="text-indigo-500" />
                        <span className="text-sm font-bold text-gray-700">Buổi học hôm nay:</span>
                    </div>
                    <div className="relative flex-1">
                        <select
                            value={selectedScheduleId || ''}
                            onChange={e => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
                            disabled={loadingSchedules}
                            className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 cursor-pointer"
                        >
                            <option value="">-- Không chọn buổi cụ thể (tự động lấy hôm nay) --</option>
                            {todaySchedules.map(s => {
                                const timeStart = s.start_time ? new Date(s.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                                const timeEnd   = s.end_time ? new Date(s.end_time).toLocaleTimeString('vi-VN',   { hour: '2-digit', minute: '2-digit' }) : '';
                                const dayStr    = s.day ? `${s.day}, ` : '';
                                return (
                                    <option key={s.id} value={s.id}>
                                        [{s.course_code}] {s.course_name} — {s.room_name} ({dayStr}{timeStart}–{timeEnd})
                                        {s.checked_in_count > 0 ? ` ✓ ${s.checked_in_count} đã check-in` : ''}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    <button
                        onClick={loadTodaySchedules}
                        disabled={loadingSchedules}
                        title="Làm mới danh sách buổi học"
                        className="shrink-0 p-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all disabled:opacity-40"
                    >
                        <RefreshCw size={16} className={loadingSchedules ? 'animate-spin' : ''} />
                    </button>
                </div>
                <ScheduleStatusBadge scheduleId={selectedScheduleId} schedules={todaySchedules} />
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Camera Feed (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                        <span className="font-bold text-gray-800 flex items-center gap-2">
                            <Camera size={18} className="text-primary-600" />
                            Camera Live Scan AI
                        </span>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                                faceDetected ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {faceDetected ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        Đã phát hiện khuôn mặt
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                        Chưa có khuôn mặt
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-center">
                        <div
                            className="relative w-full bg-gray-900 rounded-xl overflow-hidden shadow-inner"
                            style={{ transform: 'scaleX(-1)' }}
                        >
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                mirrored={false}
                                videoConstraints={{
                                    facingMode: "user",
                                    width: { ideal: 640 },
                                    height: { ideal: 480 }
                                }}
                                className="w-full h-auto block"
                            />

                            {/* Oval Target Frame Mask Overlay */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <svg className="w-full h-full" viewBox="0 0 640 480" preserveAspectRatio="none">
                                    <defs>
                                        <mask id="oval-mask">
                                            <rect width="640" height="480" fill="white" />
                                            <ellipse cx="320" cy="235" rx="140" ry="190" fill="black" />
                                        </mask>
                                    </defs>
                                    {/* Darkened vignette outside the oval target area */}
                                    <rect width="640" height="480" fill="rgba(15, 23, 42, 0.55)" mask="url(#oval-mask)" />
                                    {/* Oval Border Target Ring */}
                                    <ellipse
                                        cx="320"
                                        cy="235"
                                        rx="140"
                                        ry="190"
                                        fill="none"
                                        stroke={
                                            faceDetected
                                                ? (attendanceType === 'check_in' ? '#10b981' : '#3b82f6')
                                                : (qualityReason && qualityReason.includes('too_dark'))
                                                ? '#f59e0b'
                                                : qualityReason === 'outside_oval_frame'
                                                ? '#ef4444'
                                                : qualityReason === 'face_too_small'
                                                ? '#3b82f6'
                                                : 'rgba(255, 255, 255, 0.8)'
                                        }
                                        strokeWidth={faceDetected ? '4' : (qualityReason === 'outside_oval_frame' || (qualityReason && qualityReason.includes('too_dark'))) ? '3' : '2'}
                                        strokeDasharray={faceDetected ? 'none' : '8 6'}
                                        className="transition-all duration-300"
                                    />
                                </svg>

                                {/* Target Guidance Hint Header */}
                                <div
                                    className={`absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold flex items-center gap-2 border shadow-lg transition-all duration-300 ${
                                        faceDetected
                                            ? 'bg-emerald-600/90 border-emerald-400'
                                            : (qualityReason && qualityReason.includes('too_dark'))
                                            ? 'bg-amber-600/95 border-amber-400 animate-pulse'
                                            : qualityReason === 'outside_oval_frame'
                                            ? 'bg-red-600/95 border-red-400 animate-bounce'
                                            : qualityReason === 'face_too_small'
                                            ? 'bg-blue-600/95 border-blue-400'
                                            : 'bg-black/70 border-white/20'
                                    }`}
                                    style={{ transform: 'scaleX(-1)' }}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${
                                        faceDetected
                                            ? 'bg-emerald-300 animate-pulse'
                                            : qualityReason === 'outside_oval_frame'
                                            ? 'bg-amber-300 animate-ping'
                                            : qualityReason === 'face_too_small'
                                            ? 'bg-blue-300'
                                            : 'bg-amber-400'
                                    }`}></span>
                                    <span>
                                        {guidanceMessage}
                                    </span>
                                </div>

                                {/* Passive Liveness Protection Indicator Badge */}
                                {faceDetected && (
                                    <div
                                        className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all duration-300 z-10"
                                        style={{ transform: 'scaleX(-1)' }}
                                    >
                                        <span className="bg-emerald-600/95 text-white px-3 py-1 rounded-full border border-emerald-300 text-[11px] font-bold flex items-center gap-1 shadow-md">
                                            🛡️ Tự động xác thực 3D Anti-Spoofing
                                        </span>
                                    </div>
                                )}
                            </div>
                            {box && (
                                <div
                                    className="absolute pointer-events-none transition-all duration-150"
                                    style={{
                                        left: `${(box[0] / imageSize[0]) * 100}%`,
                                        top: `${(box[1] / imageSize[1]) * 100}%`,
                                        width: `${(box[2] / imageSize[0]) * 100}%`,
                                        height: `${(box[3] / imageSize[1]) * 100}%`,
                                    }}
                                >
                                    <div className={`absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] rounded-tl-md ${
                                        attendanceType === 'check_in' ? 'border-emerald-400' : 'border-blue-400'
                                    }`}></div>
                                    <div className={`absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] rounded-tr-md ${
                                        attendanceType === 'check_in' ? 'border-emerald-400' : 'border-blue-400'
                                    }`}></div>
                                    <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] rounded-bl-md ${
                                        attendanceType === 'check_in' ? 'border-emerald-400' : 'border-blue-400'
                                    }`}></div>
                                    <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] rounded-br-md ${
                                        attendanceType === 'check_in' ? 'border-emerald-400' : 'border-blue-400'
                                    }`}></div>
                                </div>
                            )}

                            {/* Status Overlay Indicator */}
                            {isProcessing && (
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2" style={{ transform: 'scaleX(-1)' }}>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang đối soát AI ({attendanceType === 'check_in' ? 'Đầu giờ' : 'Cuối giờ'})...
                                </div>
                            )}

                            {/* Vote Progress Indicator */}
                            {voteLabel && !cooldownRef.current && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-3" style={{ transform: 'scaleX(-1)' }}>
                                    <span>{voteLabel}</span>
                                    <div className="flex gap-1">
                                        {Array.from({ length: VOTE_THRESHOLD }).map((_, i) => (
                                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < voteProgress ? 'bg-emerald-400 scale-110' : 'bg-white/30'}`} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Mode indicator badge */}
                            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-bold text-white flex items-center gap-1.5" style={{ transform: 'scaleX(-1)' }}>
                                {attendanceType === 'check_in' ? (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                        <span>CHẾ ĐỘ ĐIỂM DANH ĐẦU GIỜ</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                        <span>CHẾ ĐỘ ĐIỂM DANH CUỐI GIỜ</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {mode === 'auto' && (
                            <div className="mt-3 text-center">
                                <p className="text-xs text-gray-500 font-medium">
                                    💡 <strong className="text-gray-700">Chế độ Tự Động:</strong> Chỉ cần hướng mặt vào camera, hệ thống sẽ tự động nhận diện và cập nhật {attendanceType === 'check_in' ? 'giờ vào (check-in)' : 'giờ ra (check-out)'} khi xác nhận đủ {VOTE_THRESHOLD}/{VOTE_WINDOW} frame liên tiếp.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Information & Attendance Results (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* MODE 1: AUTO RECOGNIZED RESULT DISPLAY */}
                    {mode === 'auto' && (
                        <>
                            {lastRecognized
                                ? <RecognitionResultCard recognized={lastRecognized} />
                                : (
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                                            attendanceType === 'check_in' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {attendanceType === 'check_in' ? <LogIn size={32} /> : <LogOut size={32} />}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">
                                            Sẵn Sàng {attendanceType === 'check_in' ? 'Điểm Danh Đầu Giờ' : 'Điểm Danh Cuối Giờ'}
                                        </h3>
                                        <p className="text-gray-500 text-sm max-w-xs">
                                            Vui lòng đưa khuôn mặt sinh viên vào khung camera để hệ thống tự động ghi nhận thời gian {attendanceType === 'check_in' ? 'vào lớp' : 'kết thúc buổi học'}.
                                        </p>
                                    </div>
                                )
                            }

                            {/* Recent Scans */}
                            {recentScans.length > 0 && (

                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <History size={14} className="text-indigo-600" />
                                        Các Lượt Quét Gần Nhất
                                    </h4>
                                    <div className="divide-y divide-gray-100">
                                        {recentScans.map((item, idx) => (
                                            <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                                <div>
                                                    <p className="font-bold text-gray-800">{item.student.full_name}</p>
                                                    <p className="text-gray-400 font-mono">{item.student.student_code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                                        item.attendance_type === 'check_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                        {item.attendance_type === 'check_in' ? 'Check-in' : 'Check-out'}: {item.time}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* MODE 2: MANUAL SPECIFIC STUDENT PICK */}
                    {mode === 'manual' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2 border-b pb-3 border-gray-100">
                                <Search size={18} className="text-primary-600" />
                                Chọn Sinh Viên Để Xác Thực ({attendanceType === 'check_in' ? 'Đầu Giờ' : 'Cuối Giờ'})
                            </h3>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                                    Chọn từ danh sách sinh viên
                                </label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => {
                                        setSelectedStudentId(e.target.value);
                                        const found = students.find(s => s.id === parseInt(e.target.value));
                                        setMatchedStudentInfo(found || null);
                                    }}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                                >
                                    <option value="">-- Chọn sinh viên --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.full_name} ({s.student_code})
                                        </option>
                                    ))}
                                </select>
                                {selectedStudentId && (
                                    <div className="mt-1.5 flex justify-end">
                                        <a
                                            href={`${window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin'}/face-registration?student_id=${selectedStudentId}`}
                                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                                        >
                                            🔄 Đăng ký lại khuôn mặt cho SV này
                                        </a>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleManualVerify}
                                disabled={isProcessing || (!selectedStudentId && !studentInput)}
                                className={`w-full py-3 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                    attendanceType === 'check_in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                <UserCheck size={18} />
                                Xác Thực {attendanceType === 'check_in' ? 'Check-in Đầu Giờ' : 'Check-out Cuối Giờ'}
                            </button>

                            {manualResult && (
                                <div className={`p-4 rounded-xl border text-sm ${
                                    manualResult.match ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    <div className="font-bold flex items-center gap-2">
                                        {manualResult.match ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        {manualResult.match ? 'Xác thực thành công' : 'Thất bại'}
                                    </div>
                                    <p className="mt-1 text-xs">{manualResult.message}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FaceRecognition;
