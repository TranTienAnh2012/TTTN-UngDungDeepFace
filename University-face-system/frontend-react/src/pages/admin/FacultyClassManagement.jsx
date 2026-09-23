import React, { useState, useEffect } from 'react';
import { Building2, Layers, Plus, Search, RefreshCw, X, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const FacultyClassManagement = () => {
    const [activeTab, setActiveTab] = useState('faculties'); // 'faculties' | 'batches' | 'classes'
    
    // Data states
    const [faculties, setFaculties] = useState([]);
    const [batches, setBatches] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterFaculty, setFilterFaculty] = useState('');

    // Modal states
    const [showFacultyModal, setShowFacultyModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);

    // Form states
    const [facultyForm, setFacultyForm] = useState({ faculty_code: '', faculty_name: '' });
    const [batchForm, setBatchForm] = useState({ batch_code: '', batch_name: '', start_year: 2023, end_year: 2027 });
    const [classForm, setClassForm] = useState({ class_code: '', class_name: '', faculty_id: '', batch_id: '' });
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [resFac, resBat, resCls] = await Promise.all([
                api.get('/structure/faculties'),
                api.get('/structure/batches'),
                api.get('/structure/classes')
            ]);
            if (resFac.data.success) setFaculties(resFac.data.data);
            if (resBat.data.success) setBatches(resBat.data.data);
            if (resCls.data.success) setClasses(resCls.data.data);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu Khoa - Khóa - Lớp:', err);
        } finally {
            setLoading(false);
        }
    };

    // Submits
    const handleCreateFaculty = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/structure/faculties', facultyForm);
            setShowFacultyModal(false);
            setFacultyForm({ faculty_code: '', faculty_name: '' });
            fetchAllData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể tạo Khoa mới');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/structure/batches', batchForm);
            setShowBatchModal(false);
            setBatchForm({ batch_code: '', batch_name: '', start_year: 2023, end_year: 2027 });
            fetchAllData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể tạo Khóa học mới');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        setFormError('');
        setIsSubmitting(true);
        try {
            await api.post('/structure/classes', classForm);
            setShowClassModal(false);
            setClassForm({ class_code: '', class_name: '', faculty_id: '', batch_id: '' });
            fetchAllData();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Không thể tạo Lớp sinh hoạt mới');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredClassesList = classes.filter(c => {
        const matchesSearch = c.class_code.toLowerCase().includes(search.toLowerCase()) || 
                              c.class_name.toLowerCase().includes(search.toLowerCase());
        const matchesFaculty = filterFaculty ? String(c.faculty_id) === String(filterFaculty) : true;
        return matchesSearch && matchesFaculty;
    });

    return (
        <div className="space-y-6 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <Building2 className="w-7 h-7 text-primary-600" />
                        Quản Lý Khoa & Lớp Sinh Hoạt
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Cấu trúc đào tạo: Khoa ➔ Khóa tuyển sinh ➔ Lớp sinh hoạt
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchAllData}
                        className="p-2.5 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {activeTab === 'faculties' && (
                        <button
                            onClick={() => { setFormError(''); setShowFacultyModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                        >
                            <Plus size={18} />
                            Thêm Khoa Mới
                        </button>
                    )}
                    {activeTab === 'batches' && (
                        <button
                            onClick={() => { setFormError(''); setShowBatchModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                        >
                            <Plus size={18} />
                            Thêm Khóa Mới
                        </button>
                    )}
                    {activeTab === 'classes' && (
                        <button
                            onClick={() => { setFormError(''); setShowClassModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors shadow-sm text-sm"
                        >
                            <Plus size={18} />
                            Thêm Lớp Mới
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-gray-200 gap-8">
                <button
                    onClick={() => setActiveTab('faculties')}
                    className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'faculties' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Building2 size={18} />
                    Danh Mục Khoa ({faculties.length})
                </button>
                <button
                    onClick={() => setActiveTab('batches')}
                    className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'batches' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Layers size={18} />
                    Khóa Tuyển Sinh ({batches.length})
                </button>
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 ${
                        activeTab === 'classes' 
                            ? 'border-primary-600 text-primary-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Building2 size={18} />
                    Lớp Sinh Hoạt ({classes.length})
                </button>
            </div>

            {/* Content: TAB 1 - KHOA */}
            {activeTab === 'faculties' && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="py-3.5 px-6">MÃ KHOA</th>
                                <th className="py-3.5 px-6">TÊN KHOA</th>
                                <th className="py-3.5 px-6">SỐ LỚP TRỰC THUỘC</th>
                                <th className="py-3.5 px-6">NGÀY TẠO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {faculties.map((f) => {
                                const classCount = classes.filter(c => c.faculty_id === f.id).length;
                                return (
                                    <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-gray-900">{f.faculty_code}</td>
                                        <td className="py-4 px-6 font-medium text-gray-800">{f.faculty_name}</td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                                                {classCount} Lớp
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400">
                                            {f.created_at ? new Date(f.created_at).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Content: TAB 2 - KHÓA */}
            {activeTab === 'batches' && (
                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="py-3.5 px-6">MÃ KHÓA</th>
                                <th className="py-3.5 px-6">TÊN KHÓA HỌC</th>
                                <th className="py-3.5 px-6">THỜI GIAN ĐÀO TẠO</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {batches.map((b) => (
                                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6 font-bold text-primary-600">{b.batch_code}</td>
                                    <td className="py-4 px-6 font-medium text-gray-800">{b.batch_name}</td>
                                    <td className="py-4 px-6 font-medium text-gray-600">
                                        {b.start_year && b.end_year ? `${b.start_year} - ${b.end_year}` : 'Chưa cập nhật'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Content: TAB 3 - LỚP SINH HOẠT */}
            {activeTab === 'classes' && (
                <div className="space-y-4">
                    {/* Filter bar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã lớp, tên lớp..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>

                        <select
                            value={filterFaculty}
                            onChange={e => setFilterFaculty(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                        >
                            <option value="">Tất cả các Khoa</option>
                            {faculties.map(f => (
                                <option key={f.id} value={f.id}>{f.faculty_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50/50 text-gray-700 font-semibold border-b border-gray-100">
                                <tr>
                                    <th className="py-3.5 px-6">MÃ LỚP</th>
                                    <th className="py-3.5 px-6">TÊN LỚP HỌC</th>
                                    <th className="py-3.5 px-6">THUỘC KHOA</th>
                                    <th className="py-3.5 px-6">KHÓA TUYỂN SINH</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClassesList.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-gray-900">{c.class_code}</td>
                                        <td className="py-4 px-6 font-medium text-gray-800">{c.class_name}</td>
                                        <td className="py-4 px-6 font-medium text-primary-600">
                                            {c.faculty_name || '—'}
                                        </td>
                                        <td className="py-4 px-6 font-medium text-gray-700">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                                {c.batch_code || '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Thêm Khoa */}
            {showFacultyModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Thêm Khoa Mới</h3>
                            <button onClick={() => setShowFacultyModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFaculty} className="p-5 space-y-4">
                            {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{formError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Khoa *</label>
                                <input
                                    type="text" required placeholder="VD: CNTT"
                                    value={facultyForm.faculty_code} onChange={e => setFacultyForm({...facultyForm, faculty_code: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Khoa *</label>
                                <input
                                    type="text" required placeholder="VD: Khoa Công Nghệ Thông Tin"
                                    value={facultyForm.faculty_name} onChange={e => setFacultyForm({...facultyForm, faculty_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowFacultyModal(false)} className="px-4 py-2 text-gray-600 text-sm">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Thêm Khóa */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Thêm Khóa Tuyển Sinh</h3>
                            <button onClick={() => setShowBatchModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateBatch} className="p-5 space-y-4">
                            {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{formError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Khóa *</label>
                                <input
                                    type="text" required placeholder="VD: K23"
                                    value={batchForm.batch_code} onChange={e => setBatchForm({...batchForm, batch_code: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Khóa *</label>
                                <input
                                    type="text" required placeholder="VD: Khóa 2023 (2023 - 2027)"
                                    value={batchForm.batch_name} onChange={e => setBatchForm({...batchForm, batch_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Năm bắt đầu</label>
                                    <input
                                        type="number" value={batchForm.start_year} onChange={e => setBatchForm({...batchForm, start_year: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Năm kết thúc</label>
                                    <input
                                        type="number" value={batchForm.end_year} onChange={e => setBatchForm({...batchForm, end_year: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-gray-600 text-sm">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Thêm Lớp */}
            {showClassModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Thêm Lớp Sinh Hoạt</h3>
                            <button onClick={() => setShowClassModal(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateClass} className="p-5 space-y-4">
                            {formError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{formError}</div>}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Khoa Trực Thuộc *</label>
                                <select
                                    required value={classForm.faculty_id} onChange={e => setClassForm({...classForm, faculty_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                >
                                    <option value="">-- Chọn Khoa --</option>
                                    {faculties.map(f => <option key={f.id} value={f.id}>{f.faculty_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Khóa Tuyển Sinh *</label>
                                <select
                                    required value={classForm.batch_id} onChange={e => setClassForm({...classForm, batch_id: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                                >
                                    <option value="">-- Chọn Khóa --</option>
                                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã Lớp *</label>
                                <input
                                    type="text" required placeholder="VD: K23CNT3"
                                    value={classForm.class_code} onChange={e => setClassForm({...classForm, class_code: e.target.value.toUpperCase()})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên Lớp Chi Tiết *</label>
                                <input
                                    type="text" required placeholder="VD: Lớp K23 Công Nghệ Thông Tin 3"
                                    value={classForm.class_name} onChange={e => setClassForm({...classForm, class_name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowClassModal(false)} className="px-4 py-2 text-gray-600 text-sm">Hủy</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium">Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyClassManagement;
