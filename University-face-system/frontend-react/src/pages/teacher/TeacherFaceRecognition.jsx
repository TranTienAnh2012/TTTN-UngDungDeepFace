import React from 'react';
import TeacherFaceRecognitionModal from '../../components/teacher/TeacherFaceRecognitionModal';
import { useSearchParams, useNavigate } from 'react-router-dom';

const TeacherFaceRecognition = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const scheduleId = searchParams.get('schedule_id');
    const examScheduleId = searchParams.get('exam_schedule_id');

    return (
        <TeacherFaceRecognitionModal 
            isOpen={true}
            onClose={() => navigate('/teacher/schedule')}
            scheduleId={scheduleId ? parseInt(scheduleId) : null}
            examScheduleId={examScheduleId ? parseInt(examScheduleId) : null}
        />
    );
};

export default TeacherFaceRecognition;
