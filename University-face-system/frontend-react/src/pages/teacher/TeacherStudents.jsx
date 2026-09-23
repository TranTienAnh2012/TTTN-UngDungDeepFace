import React, { useState, useEffect } from 'react';
import { Users, Search, Camera, RotateCcw, UserPlus, Filter, CheckCircle2, AlertCircle, UploadCloud, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const TeacherStudents = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFace, setFilterFace] = useState('all');

    // Quick Static Photo Upload Modal State
    const [uploadModalStudent, setUploadModalStudent] = useState(null);
    const [uploadImageBase64, setUploadImageBase64] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/student-list');
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách sinh viên:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadError('');
        setUploadSuccess('');
        if (!file.type.startsWith('image/')) {
            setUploadError('Vui lòng chọn định dạng hình ảnh (.jpg, .jpeg, .png, .webp)');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Dung lượng hình ảnh vượt quá 10MB');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setUploadImageBase64(reader.result);
        };
        reader.onerror = () => {
            setUploadError('Không thể đọc file ảnh');
        };
        reader.readAsDataURL(file);
    };

    const handleUploadSubmit = async () => {
        if (!uploadModalStudent || !uploadImageBase64) return;
        setIsUploading(true);
        setUploadError('');
        setUploadSuccess('');

        try {
            const res = await api.post('/student/register-face', {
                student_id: uploadModalStudent.id,
                image_base64: uploadImageBase64
            });

            if (res.data.success) {
                setUploadSuccess(`Đã đăng ký khuôn mặt thành công cho sinh viên ${uploadModalStudent.full_name}!`);
                setTimeout(() => {
                    setUploadModalStudent(null);
                    setUploadImageBase64(null);
                    setUploadSuccess('');
                    loadStudents();
                }, 1200);
            } else {
                setUploadError(res.data.message || 'Lỗi đăng ký khuôn mặt');
            }
        } catch (err) {
            console.error('Lỗi upload ảnh tĩnh:', err);
            setUploadError(err.response?.data?.message || err.response?.data?.detail || 'Không thể trích xuất khuôn mặt từ ảnh. Vui lòng chọn ảnh nét hơn.');
        } finally {
            setIsUploading(false);
        }
    };

    const filtered = students.filter(s => {
        const matchSearch = (s.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.student_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.class_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchSearch) return false;
        if (filterFace === 'registered') return s.has_face;
        if (filterFace === 'not_registered') return !s.has_face;
        return true;
    });

    return (
        <div className="space-y-6 w-full pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                        <Users size={24} className="text-indigo-600" />
                        Danh Sách Sinh Viên Giảng Dạy
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Quản lý danh sách sinh viên, xem tình trạng dữ liệu khuôn mặt AI và đăng ký/đăng ký lại khuôn mặt
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/teacher/face-registration?mode=upload')}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs"
                    >
                        <UploadCloud size={16} />
                        <span>Tải Ảnh Tĩnh</span>
                    </button>
                    <button
                        onClick={() => navigate('/teacher/face-registration?mode=camera')}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center gap-2 text-xs"
                    >
                        <Camera size={16} />
                        <span>Quét Camera AI</span>
                    </button>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên, Mã SV, Lớp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-400">Lọc mặt:</span>
                    <button
                        onClick={() => setFilterFace('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Tất cả ({students.length})
                    </button>
                    <button
                        onClick={() => setFilterFace('registered')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'registered' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Đã có khuôn mặt ({students.filter(s => s.has_face).length})
                    </button>
                    <button
                        onClick={() => setFilterFace('not_registered')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterFace === 'not_registered' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Chưa có ({students.filter(s => !s.has_face).length})
                    </button>
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4">Sinh viên</th>
                                <th className="py-3.5 px-4">Mã sinh viên</th>
                                <th className="py-3.5 px-4">Lớp học</th>
                                <th className="py-3.5 px-4">Dữ liệu khuôn mặt AI</th>
                                <th className="py-3.5 px-4 text-right">Đăng ký khuôn mặt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-slate-400">Không tìm thấy sinh viên nào</td>
                                </tr>
                            ) : (
                                filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                                {s.full_name?.charAt(0) || 'S'}
                                            </div>
                                            <span>{s.full_name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{s.student_code}</td>
                                        <td className="py-3.5 px-4 text-slate-600">{s.class_name || 'CNTT-K65'}</td>
                                        <td className="py-3.5 px-4">
                                            {s.has_face ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    <CheckCircle2 size={12} /> Đã có khuôn mặt
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                    <AlertCircle size={12} /> Chưa có khuôn mặt
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <div className="inline-flex items-center gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setUploadModalStudent(s);
                                                        setUploadImageBase64(null);
                                                        setUploadError('');
                                                        setUploadSuccess('');
                                                    }}
                                                    className="px-2.5 py-1.5 rounded-xl font-bold text-[11px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all flex items-center gap-1"
                                                    title="Tải ảnh tĩnh từ máy tính"
                                                >
                                                    <UploadCloud size={13} />
                                                    <span>Ảnh tĩnh</span>
                                                </button>

                                                <button
                                                    onClick={() => navigate(`/teacher/face-registration?student_id=${s.id}&mode=camera`)}
                                                    className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition-all ${
                                                        s.has_face
                                                            ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200'
                                                            : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white border border-amber-200'
                                                    }`}
                                                    title="Quét bằng camera trực tiếp"
                                                >
                                                    {s.has_face ? <RotateCcw size={13} /> : <Camera size={13} />}
                                                    <span>{s.has_face ? 'Lại' : 'Camera'}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* QUICK STATIC PHOTO UPLOAD MODAL */}
            {uploadModalStudent && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 overflow-hidden relative">
                        <button
                            onClick={() => setUploadModalStudent(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <UploadCloud size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Đăng Ký Khuôn Mặt Bằng Ảnh Tĩnh</h3>
                                <p className="text-xs text-slate-500">
                                    Sinh viên: <strong className="text-slate-800">{uploadModalStudent.full_name}</strong> (Mã SV: <span className="font-mono">{uploadModalStudent.student_code}</span>)
                                </p>
                            </div>
                        </div>

                        {uploadError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{uploadError}</span>
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 font-bold">
                                <CheckCircle size={16} className="shrink-0 text-emerald-600" />
                                <span>{uploadSuccess}</span>
                            </div>
                        )}

                        <div className="space-y-4">
                            {!uploadImageBase64 ? (
                                <label className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-800">Chọn hoặc kéo thả ảnh chân dung sinh viên</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                            ) : (
                                <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-200 bg-slate-900 group">
                                    <img
                                        src={uploadImageBase64}
                                        alt="Preview"
                                        className="w-full h-56 object-contain mx-auto"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setUploadImageBase64(null)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-xl transition-all"
                                        title="Chọn ảnh khác"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setUploadModalStudent(null)}
                                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUploadSubmit}
                                    disabled={!uploadImageBase64 || isUploading}
                                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Đang xử lý AI...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            <span>Lưu Khuôn Mặt</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;
