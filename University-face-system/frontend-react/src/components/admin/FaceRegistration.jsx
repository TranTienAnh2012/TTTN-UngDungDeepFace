import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertCircle, RefreshCw, UserPlus, UserCheck, ArrowRight, ArrowLeft, Search, User, Filter, RotateCcw, Users, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const FaceRegistration = ({ onComplete }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const webcamRef = useRef(null);
    const containerRef = useRef(null);

    // Registration flow steps: 'student_info' -> 'camera_scan' -> 'success'
    const [pagePhase, setPagePhase] = useState('student_info'); 

    // Form state
    const [studentForm, setStudentForm] = useState({
        student_code: '',
        full_name: '',
        class_name: '',
        date_of_birth: ''
    });
    const [formError, setFormError] = useState('');
    const [isSavingStudent, setIsSavingStudent] = useState(false);
    const [existingStudents, setExistingStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null); // { id, student_code, full_name, class_name }

    // Search and filter for existing students
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFaceStatus, setFilterFaceStatus] = useState('all'); // 'all', 'registered', 'not_registered'

    // Registration Mode: 'camera' (Live 3-step scan) vs 'upload' (Static image upload)
    const [regMode, setRegMode] = useState('camera');
    const [uploadType, setUploadType] = useState('single'); // 'single' vs '3step'
    const [uploadedSingleImage, setUploadedSingleImage] = useState(null);
    const [uploaded3Images, setUploaded3Images] = useState({ straight: null, left: null, right: null });
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    // Camera 3-step state
    const [step, setStep] = useState('straight'); // straight, left, right, registering, error
    const [images, setImages] = useState({ straight: null, left: null, right: null });
    const [box, setBox] = useState(null); // [x, y, w, h] from MTCNN
    const [pose, setPose] = useState('none');
    const [imageSize, setImageSize] = useState([640, 480]);
    const [statusMessage, setStatusMessage] = useState('Vui lòng nhìn thẳng vào camera');
    const [isDetecting, setIsDetecting] = useState(false);
    const isProcessingRef = useRef(false);

    // Stability counter for pose auto-capture
    const stabilityCounter = useRef(0);
    const STABILITY_THRESHOLD = 3; // ~0.6s of stable pose

    // Load recent students list on mount
    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setExistingStudents(res.data.data);

                const paramStudentId = searchParams.get('student_id');
                if (paramStudentId) {
                    const found = res.data.data.find(s => s.id === parseInt(paramStudentId));
                    if (found) {
                        handleSelectExistingStudent(found);
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        }
    };

    // Handle student form submission
    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!studentForm.student_code.trim() || !studentForm.full_name.trim()) {
            setFormError('Vui lòng điền đầy đủ Mã Sinh Viên và Họ và Tên.');
            return;
        }

        setIsSavingStudent(true);
        try {
            const res = await api.post('/student/quick-create', {
                student_code: studentForm.student_code.trim(),
                full_name: studentForm.full_name.trim(),
                class_name: studentForm.class_name.trim(),
                date_of_birth: studentForm.date_of_birth || null
            });

            if (res.data.success && res.data.data) {
                setSelectedStudent(res.data.data);
                setPagePhase('camera_scan');
                setStep('straight');
                setIsDetecting(true);
                setStatusMessage('Vui lòng nhìn thẳng vào camera');
            } else {
                setFormError(res.data.message || 'Không thể tạo thông tin sinh viên');
            }
        } catch (err) {
            console.error('Lỗi lưu thông tin sinh viên:', err);
            setFormError(err.response?.data?.message || 'Lỗi server khi lưu sinh viên');
        } finally {
            setIsSavingStudent(false);
        }
    };

    // Select existing student from list
    const handleSelectExistingStudent = (student) => {
        setSelectedStudent(student);
        setStudentForm({
            student_code: student.student_code,
            full_name: student.full_name,
            class_name: student.class_name || '',
            date_of_birth: ''
        });
        setPagePhase('camera_scan');
        setStep('straight');
        setIsDetecting(true);
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    // Manual snap helper
    const handleManualSnapCurrentStep = () => {
        if (!webcamRef.current) return;
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        if (step === 'straight') {
            setImages(prev => ({ ...prev, straight: imageSrc }));
            setStep('left');
            stabilityCounter.current = 0;
            setStatusMessage('Tốt! Bây giờ vui lòng quay mặt từ từ sang TRÁI');
        } else if (step === 'left') {
            setImages(prev => ({ ...prev, left: imageSrc }));
            setStep('right');
            stabilityCounter.current = 0;
            setStatusMessage('Tốt! Cuối cùng, vui lòng quay mặt từ từ sang PHẢI');
        } else if (step === 'right') {
            setImages(prev => ({ ...prev, right: imageSrc }));
            setStep('registering');
            setIsDetecting(false);
            stabilityCounter.current = 0;
            setStatusMessage('Đang xử lý và lưu dữ liệu vector khuôn mặt...');
        }
    };

    // Camera pose detection callback
    const captureFrame = useCallback(async () => {
        if (!isDetecting || regMode !== 'camera' || pagePhase !== 'camera_scan' || step === 'registering' || step === 'error') return;
        if (isProcessingRef.current) return;

        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (!imageSrc) return;

            isProcessingRef.current = true;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            try {
                const response = await api.post('/face/detect-pose', { image_base64: imageSrc }, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (response.data.success && response.data.box) {
                    setBox(response.data.box);
                    setPose(response.data.pose);
                    if (response.data.image_size) {
                        setImageSize(response.data.image_size);
                    }

                    if (step === 'straight' && response.data.pose === 'straight') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt thẳng... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, straight: imageSrc }));
                            setStep('left');
                            stabilityCounter.current = 0;
                            setStatusMessage('Tốt! Bây giờ vui lòng quay mặt từ từ sang TRÁI');
                        }
                    } else if (step === 'left' && response.data.pose === 'left') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt trái... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, left: imageSrc }));
                            setStep('right');
                            stabilityCounter.current = 0;
                            setStatusMessage('Tốt! Cuối cùng, vui lòng quay mặt từ từ sang PHẢI');
                        }
                    } else if (step === 'right' && response.data.pose === 'right') {
                        stabilityCounter.current += 1;
                        setStatusMessage(`Đang giữ góc mặt phải... ${Math.round((stabilityCounter.current / STABILITY_THRESHOLD) * 100)}%`);
                        if (stabilityCounter.current >= STABILITY_THRESHOLD) {
                            setImages(prev => ({ ...prev, right: imageSrc }));
                            setStep('registering');
                            setIsDetecting(false);
                            stabilityCounter.current = 0;
                            setStatusMessage('Đang xử lý và lưu dữ liệu vector khuôn mặt...');
                        }
                    } else {
                        stabilityCounter.current = Math.max(0, stabilityCounter.current - 1);
                        if (stabilityCounter.current === 0) {
                            if (step === 'straight') setStatusMessage('Vui lòng nhìn thẳng vào camera');
                            else if (step === 'left') setStatusMessage('Vui lòng quay mặt sang TRÁI');
                            else if (step === 'right') setStatusMessage('Vui lòng quay mặt sang PHẢI');
                        }
                    }
                } else {
                    setBox(null);
                    setPose('none');
                    stabilityCounter.current = 0;
                    setStatusMessage('Không tìm thấy khuôn mặt trong khung hình');
                }
            } catch (err) {
                clearTimeout(timeoutId);
                if (err.name !== 'AbortError' && err.name !== 'CanceledError') {
                    console.error('Lỗi khi phân tích pose:', err);
                }
            } finally {
                isProcessingRef.current = false;
            }
        }
    }, [isDetecting, regMode, pagePhase, step]);

    useEffect(() => {
        let interval;
        if (isDetecting && regMode === 'camera' && pagePhase === 'camera_scan') {
            interval = setInterval(captureFrame, 200);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [captureFrame, isDetecting, regMode, pagePhase]);

    // Convert File object to Base64 data string
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSingleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError('');
        if (!file.type.startsWith('image/')) {
            setUploadError('File chọn phải là định dạng hình ảnh (.jpg, .jpeg, .png, .webp).');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Dung lượng hình ảnh quá lớn (tối đa 10MB).');
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setUploadedSingleImage(base64);
        } catch (err) {
            setUploadError('Không thể đọc file hình ảnh.');
        }
    };

    const handle3StepFileSelect = async (e, angleKey) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError('');
        if (!file.type.startsWith('image/')) {
            setUploadError('File chọn phải là định dạng hình ảnh.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Dung lượng hình ảnh quá lớn (tối đa 10MB).');
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setUploaded3Images(prev => ({ ...prev, [angleKey]: base64 }));
        } catch (err) {
            setUploadError('Không thể đọc file hình ảnh.');
        }
    };

    const handleSingleImageSubmit = async () => {
        if (!selectedStudent || !uploadedSingleImage) return;
        setIsUploading(true);
        setUploadError('');
        try {
            const res = await api.post('/student/register-face', {
                student_id: selectedStudent.id,
                image_base64: uploadedSingleImage
            });
            if (res.data.success) {
                setPagePhase('success');
                setStatusMessage('Đăng ký khuôn mặt từ ảnh tĩnh thành công!');
                loadStudents();
                if (onComplete) onComplete(selectedStudent);
            } else {
                setUploadError(res.data.message || 'Lỗi khi đăng ký khuôn mặt.');
            }
        } catch (err) {
            console.error('Single image upload failed:', err);
            setUploadError(err.response?.data?.message || err.response?.data?.detail || 'Không tìm thấy khuôn mặt trong ảnh hoặc hệ thống gặp lỗi.');
        } finally {
            setIsUploading(false);
        }
    };

    const handle3StepImagesSubmit = async () => {
        const { straight, left, right } = uploaded3Images;
        if (!selectedStudent || (!straight && !left && !right)) return;
        setIsUploading(true);
        setUploadError('');
        try {
            const imgStraight = straight || left || right;
            const imgLeft = left || imgStraight;
            const imgRight = right || imgStraight;

            const res = await api.post('/face/register-3step', {
                student_id: selectedStudent.id,
                image_straight: imgStraight,
                image_left: imgLeft,
                image_right: imgRight
            });
            if (res.data.success) {
                setPagePhase('success');
                setStatusMessage('Đăng ký khuôn mặt từ bộ ảnh góc mặt thành công!');
                loadStudents();
                if (onComplete) onComplete(selectedStudent);
            } else {
                setUploadError(res.data.message || 'Lỗi khi đăng ký 3 góc mặt.');
            }
        } catch (err) {
            console.error('3-step upload failed:', err);
            setUploadError(err.response?.data?.message || err.response?.data?.detail || 'Lỗi xử lý hình ảnh từ AI service.');
        } finally {
            setIsUploading(false);
        }
    };

    // Save vector when 3 images captured
    useEffect(() => {
        if (step === 'registering' && images.straight && images.left && images.right && selectedStudent) {
            submitRegistration();
        }
    }, [step, images, selectedStudent]);

    const submitRegistration = async () => {
        try {
            const response = await api.post('/face/register-3step', {
                student_id: selectedStudent.id,
                image_straight: images.straight,
                image_left: images.left,
                image_right: images.right
            });
            if (response.data.success) {
                setPagePhase('success');
                setStatusMessage('Đăng ký khuôn mặt thành công!');
                loadStudents(); // refresh list
                if (onComplete) onComplete(selectedStudent);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            setStep('error');
            setStatusMessage('Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    const resetProcess = () => {
        setStep('straight');
        setImages({ straight: null, left: null, right: null });
        stabilityCounter.current = 0;
        setIsDetecting(true);
        setStatusMessage('Vui lòng nhìn thẳng vào camera');
    };

    const startNewStudent = () => {
        setSelectedStudent(null);
        setStudentForm({ student_code: '', full_name: '', class_name: '', date_of_birth: '' });
        setImages({ straight: null, left: null, right: null });
        setUploadedSingleImage(null);
        setUploaded3Images({ straight: null, left: null, right: null });
        setUploadError('');
        setRegMode('camera');
        setStep('straight');
        setIsDetecting(false);
        setPagePhase('student_info');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-200">
                            <Camera size={22} />
                        </div>
                        Đăng Ký Khuôn Mặt Sinh Viên
                    </h1>
                    <p className="text-gray-500 mt-1">
                        BƯỚC 1: Điền thông tin sinh viên ➔ BƯỚC 2: Quét khuôn mặt 3 hướng AI
                    </p>
                </div>

                {/* Flow indicator */}
                <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl text-sm font-medium">
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'student_info' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        1. Thông tin
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'camera_scan' ? 'bg-white text-primary-700 shadow-sm font-bold' : 'text-gray-500'}`}>
                        2. Quét camera
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className={`px-3 py-1.5 rounded-lg transition-all ${pagePhase === 'success' ? 'bg-emerald-500 text-white shadow-sm font-bold' : 'text-gray-500'}`}>
                        3. Hoàn thành
                    </span>
                </div>
            </div>

            {/* PHASE 1: STUDENT INFO FORM */}
            {pagePhase === 'student_info' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Input Form */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-3 border-gray-100">
                            <UserPlus size={20} className="text-primary-600" />
                            Nhập Thông Tin Sinh Viên
                        </h2>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleStudentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Mã Sinh Viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: SV001 hoặc 2024001"
                                    value={studentForm.student_code}
                                    onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Họ và Tên Sinh Viên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    value={studentForm.full_name}
                                    onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Lớp Học
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: CNTT-K65"
                                        value={studentForm.class_name}
                                        onChange={(e) => setStudentForm({ ...studentForm, class_name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-gray-800"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Ngày Sinh
                                    </label>
                                    <input
                                        type="date"
                                        value={studentForm.date_of_birth}
                                        onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-gray-800"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSavingStudent}
                                    className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-md shadow-primary-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSavingStudent ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang lưu thông tin...
                                        </>
                                    ) : (
                                        <>
                                            Xác Nhận Thông Tin & Đăng Ký Khuôn Mặt
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right: Quick Select Existing Students */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                <User size={16} className="text-gray-500" />
                                Đăng Ký / Đăng Ký Lại ({existingStudents.length})
                            </h3>
                        </div>

                        {/* Search Input */}
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc mã SV..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-400"
                            />
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-3 text-[11px] font-bold">
                            <button
                                type="button"
                                onClick={() => setFilterFaceStatus('all')}
                                className={`flex-1 py-1 rounded-lg text-center transition-all ${filterFaceStatus === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Tất cả ({existingStudents.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterFaceStatus('registered')}
                                className={`flex-1 py-1 rounded-lg text-center transition-all ${filterFaceStatus === 'registered' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Đã có mặt ({existingStudents.filter(s => s.has_face).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterFaceStatus('not_registered')}
                                className={`flex-1 py-1 rounded-lg text-center transition-all ${filterFaceStatus === 'not_registered' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                            >
                                Chưa có ({existingStudents.filter(s => !s.has_face).length})
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto max-h-[340px] space-y-2 pr-1">
                            {existingStudents.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6">Chưa có sinh viên trong danh sách</p>
                            ) : (() => {
                                const filtered = existingStudents.filter(s => {
                                    const matchSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                        (s.student_code || '').toLowerCase().includes(searchTerm.toLowerCase());
                                    if (!matchSearch) return false;
                                    if (filterFaceStatus === 'registered') return s.has_face;
                                    if (filterFaceStatus === 'not_registered') return !s.has_face;
                                    return true;
                                });
                                if (filtered.length === 0) {
                                    return <p className="text-xs text-gray-400 text-center py-6">Không tìm thấy sinh viên phù hợp</p>;
                                }
                                return filtered.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => handleSelectExistingStudent(s)}
                                        className={`p-3 border rounded-xl hover:shadow-sm cursor-pointer transition-all flex items-center justify-between group ${
                                            s.has_face
                                                ? 'border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 hover:border-indigo-200'
                                                : 'border-amber-100 bg-amber-50/20 hover:bg-amber-50 hover:border-amber-200'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800 group-hover:text-primary-700 text-sm flex items-center gap-1.5">
                                                {s.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Mã SV: <span className="font-mono text-gray-700">{s.student_code}</span>
                                                {s.class_name && ` • Lớp: ${s.class_name}`}
                                            </div>
                                        </div>
                                        <div>
                                            {s.has_face ? (
                                                <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <RotateCcw size={12} /> Đăng ký lại
                                                </span>
                                            ) : (
                                                <span className="text-[11px] bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-all">
                                                    <Camera size={12} /> Đăng ký mới
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* PHASE 2: CAMERA 3-STEP SCAN / STATIC FILE UPLOAD */}
            {pagePhase === 'camera_scan' && selectedStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-2xl mx-auto">
                    {/* Selected Student Banner */}
                    <div className={`p-4 border-b flex items-center justify-between ${
                        selectedStudent.has_face
                            ? 'bg-indigo-50/80 border-indigo-100'
                            : 'bg-primary-50 border-primary-100'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm ${
                                selectedStudent.has_face ? 'bg-indigo-600' : 'bg-primary-600'
                            }`}>
                                {selectedStudent.full_name?.charAt(0) || 'S'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-900 text-sm">{selectedStudent.full_name}</h4>
                                    {selectedStudent.has_face && (
                                        <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <RotateCcw size={10} /> ĐĂNG KÝ LẠI
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600">
                                    Mã SV: <span className="font-mono font-semibold">{selectedStudent.student_code}</span> | Lớp: {selectedStudent.class_name || 'N/A'} (ID: #{selectedStudent.id})
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={startNewStudent}
                            className="text-xs font-semibold text-primary-700 hover:text-primary-800 bg-white border border-primary-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                        >
                            <ArrowLeft size={14} /> Thay đổi
                        </button>
                    </div>

                    {selectedStudent.has_face && (
                        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-xs text-indigo-900 font-medium flex items-center gap-2">
                            <RotateCcw size={14} className="text-indigo-600 shrink-0" />
                            <span><strong>Chế độ Đăng ký lại:</strong> Sau khi hoàn thành đăng ký, dữ liệu vector khuôn mặt cũ của sinh viên sẽ được cập nhật lại bằng dữ liệu mới.</span>
                        </div>
                    )}

                    {/* Registration Mode Switcher: Camera vs Upload */}
                    <div className="px-6 pt-4 pb-2 border-b bg-gray-50/50">
                        <div className="bg-gray-200/70 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => {
                                    setRegMode('camera');
                                    setIsDetecting(true);
                                }}
                                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    regMode === 'camera'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Camera size={16} />
                                <span>📹 Quét Trực Tiếp qua Camera (3 Hướng AI)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setRegMode('upload');
                                    setIsDetecting(false);
                                }}
                                className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    regMode === 'upload'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <UploadCloud size={16} />
                                <span>🖼️ Tải Ảnh Tĩnh Từ Máy Tính</span>
                            </button>
                        </div>
                    </div>

                    {/* REGISTRATION MODE 1: LIVE WEBCAM SCAN */}
                    {regMode === 'camera' && (
                        <div className="p-6 flex flex-col items-center">
                            {/* 3 Step progress bar */}
                            <div className="w-full flex justify-between items-center mb-6 px-8 relative">
                                <div className="absolute top-1/2 left-8 right-8 h-1 bg-gray-200 -z-10 rounded-full transform -translate-y-1/2"></div>
                                <div className={`absolute top-1/2 left-8 h-1 bg-primary-500 -z-10 rounded-full transform -translate-y-1/2 transition-all duration-500 ${step === 'straight' ? 'w-0' : step === 'left' ? 'w-1/2' : 'w-full'}`}></div>

                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'straight' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : 'bg-primary-600 text-white'}`}>1</div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'left' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : step === 'right' || step === 'registering' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${step === 'right' ? 'bg-primary-600 text-white ring-4 ring-primary-100' : step === 'registering' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                            </div>

                            <div className="text-center mb-4">
                                <p className={`text-base font-semibold ${step === 'error' ? 'text-red-600' : 'text-gray-800'}`}>
                                    {statusMessage}
                                </p>
                            </div>

                            {/* Mirror Video Container */}
                            <div
                                ref={containerRef}
                                className="relative w-full max-w-md bg-gray-900 rounded-xl overflow-hidden shadow-inner"
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

                                {/* Bounding box */}
                                {box && (
                                    <div
                                        className="absolute pointer-events-none"
                                        style={{
                                            left: `${(box[0] / imageSize[0]) * 100}%`,
                                            top: `${(box[1] / imageSize[1]) * 100}%`,
                                            width: `${(box[2] / imageSize[0]) * 100}%`,
                                            height: `${(box[3] / imageSize[1]) * 100}%`,
                                        }}
                                    >
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-400 rounded-tl-md"></div>
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-400 rounded-tr-md"></div>
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-400 rounded-bl-md"></div>
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-400 rounded-br-md"></div>
                                    </div>
                                )}

                                {/* Inverse text overlays */}
                                {box && step === 'straight' && pose !== 'straight' && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                        <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Hãy nhìn thẳng!</p>
                                    </div>
                                )}
                                {box && step === 'left' && pose !== 'left' && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                        <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Quay đầu sang trái ←</p>
                                    </div>
                                )}
                                {box && step === 'right' && pose !== 'right' && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                        <p className="text-white font-bold text-lg px-4 py-2 bg-red-500/80 rounded-lg">Quay đầu sang phải →</p>
                                    </div>
                                )}

                                {step === 'registering' && (
                                    <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center" style={{ transform: 'scaleX(-1)' }}>
                                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-white font-medium">Đang trích xuất vector khuôn mặt AI...</p>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons: Manual snap & Reset */}
                            {(step === 'straight' || step === 'left' || step === 'right') && (
                                <div className="mt-4 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={handleManualSnapCurrentStep}
                                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md flex items-center gap-2 text-sm transition-all"
                                    >
                                        <Camera size={16} /> Chụp góc này ngay
                                    </button>
                                </div>
                            )}

                            {step === 'error' && (
                                <button
                                    onClick={resetProcess}
                                    className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
                                >
                                    <RefreshCw size={18} /> Thử lại từ đầu
                                </button>
                            )}
                        </div>
                    )}

                    {/* REGISTRATION MODE 2: STATIC IMAGE UPLOAD */}
                    {regMode === 'upload' && (
                        <div className="p-6 flex flex-col items-center">
                            {/* Upload Sub-mode selector: Single Image vs 3-Step Angles */}
                            <div className="w-full max-w-md bg-gray-100 p-1 rounded-xl flex items-center mb-6 text-xs font-bold border border-gray-200/60">
                                <button
                                    type="button"
                                    onClick={() => setUploadType('single')}
                                    className={`flex-1 py-2 rounded-lg text-center transition-all ${
                                        uploadType === 'single' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    📷 1 Ảnh Chân Dung (Nhanh)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadType('3step')}
                                    className={`flex-1 py-2 rounded-lg text-center transition-all ${
                                        uploadType === '3step' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    📸 3 Góc Mặt (Chính Xác Cao)
                                </button>
                            </div>

                            {uploadError && (
                                <div className="w-full max-w-md mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{uploadError}</span>
                                </div>
                            )}

                            {/* Option A: Single Portrait Image */}
                            {uploadType === 'single' && (
                                <div className="w-full max-w-md space-y-4">
                                    {!uploadedSingleImage ? (
                                        <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <UploadCloud size={28} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">Bấm hoặc kéo thả ảnh chân dung vào đây</p>
                                            <p className="text-xs text-gray-500 mt-1">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSingleFileSelect}
                                                className="hidden"
                                            />
                                        </label>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 shadow-sm bg-gray-900 group">
                                            <img
                                                src={uploadedSingleImage}
                                                alt="Uploaded portrait"
                                                className="w-full h-64 object-contain mx-auto"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setUploadedSingleImage(null)}
                                                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm transition-all"
                                                title="Xóa / Chọn ảnh khác"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSingleImageSubmit}
                                        disabled={!uploadedSingleImage || isUploading}
                                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Đang trích xuất AI vector...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                <span>Xác Nhận & Đăng Ký Khuôn Mặt Từ Ảnh Tĩnh</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Option B: 3-Step Angle Photos */}
                            {uploadType === '3step' && (
                                <div className="w-full max-w-lg space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Angle 1: Straight */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-gray-700 mb-1.5">1. Nhìn thẳng</span>
                                            {uploaded3Images.straight ? (
                                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-indigo-200 bg-gray-900 group">
                                                    <img src={uploaded3Images.straight} alt="Straight" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploaded3Images(prev => ({ ...prev, straight: null }))}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-all">
                                                    <UploadCloud size={20} className="text-gray-400 mb-1" />
                                                    <span className="text-[11px] font-bold text-gray-600">Tải ảnh thẳng</span>
                                                    <input type="file" accept="image/*" onChange={(e) => handle3StepFileSelect(e, 'straight')} className="hidden" />
                                                </label>
                                            )}
                                        </div>

                                        {/* Angle 2: Left */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-gray-700 mb-1.5">2. Quay trái</span>
                                            {uploaded3Images.left ? (
                                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-indigo-200 bg-gray-900 group">
                                                    <img src={uploaded3Images.left} alt="Left" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploaded3Images(prev => ({ ...prev, left: null }))}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-all">
                                                    <UploadCloud size={20} className="text-gray-400 mb-1" />
                                                    <span className="text-[11px] font-bold text-gray-600">Tải ảnh trái</span>
                                                    <input type="file" accept="image/*" onChange={(e) => handle3StepFileSelect(e, 'left')} className="hidden" />
                                                </label>
                                            )}
                                        </div>

                                        {/* Angle 3: Right */}
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs font-bold text-gray-700 mb-1.5">3. Quay phải</span>
                                            {uploaded3Images.right ? (
                                                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-indigo-200 bg-gray-900 group">
                                                    <img src={uploaded3Images.right} alt="Right" className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => setUploaded3Images(prev => ({ ...prev, right: null }))}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-lg hover:bg-red-600 transition-all"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center cursor-pointer p-2 text-center transition-all">
                                                    <UploadCloud size={20} className="text-gray-400 mb-1" />
                                                    <span className="text-[11px] font-bold text-gray-600">Tải ảnh phải</span>
                                                    <input type="file" accept="image/*" onChange={(e) => handle3StepFileSelect(e, 'right')} className="hidden" />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handle3StepImagesSubmit}
                                        disabled={(!uploaded3Images.straight && !uploaded3Images.left && !uploaded3Images.right) || isUploading}
                                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Đang trích xuất AI vector...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle size={18} />
                                                <span>Xác Nhận & Đăng Ký 3 Góc Mặt Từ Ảnh Tĩnh</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 3: SUCCESS & NEXT ACTIONS */}
            {pagePhase === 'success' && selectedStudent && (
                <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 max-w-xl mx-auto text-center animate-in zoom-in-95 duration-300">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                        <CheckCircle size={48} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng Ký Khuôn Mặt Thành Công!</h2>
                    <p className="text-gray-600 mb-6">
                        Dữ liệu khuôn mặt AI đã được lưu trữ cho sinh viên{' '}
                        <strong className="text-gray-800">{selectedStudent.full_name}</strong> (Mã SV: <span className="font-mono font-bold text-primary-700">{selectedStudent.student_code}</span>).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => {
                                const base = window.location.pathname.startsWith('/teacher') ? '/teacher' : '/admin';
                                navigate(`${base}/face-recognition?student_id=${selectedStudent.id}`);
                            }}
                            className="py-3 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                        >
                            <UserCheck size={20} />
                            Nhận Diện Khuôn Mặt Ngay
                        </button>

                        <button
                            onClick={startNewStudent}
                            className="py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <UserPlus size={18} />
                            Đăng Ký Sinh Viên Khác
                        </button>

                        <button
                            onClick={() => {
                                const base = window.location.pathname.startsWith('/teacher') ? '/teacher/students' : '/admin/students';
                                navigate(base);
                            }}
                            className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Users size={18} />
                            Danh Sách Sinh Viên
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceRegistration;
