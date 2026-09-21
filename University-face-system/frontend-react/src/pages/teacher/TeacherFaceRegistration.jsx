import React from 'react';
import FaceRegistration from '../../components/admin/FaceRegistration';
import { useNavigate } from 'react-router-dom';

const TeacherFaceRegistration = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 max-w-5xl mx-auto">
            <FaceRegistration 
                onComplete={(student) => {
                    // Navigate to teacher student roster after completion
                    navigate('/teacher/students');
                }}
            />
        </div>
    );
};

export default TeacherFaceRegistration;
