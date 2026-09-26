import React from 'react';
import GoogleCalendarTimeline from '../common/GoogleCalendarTimeline';

const WeeklyTimetableGrid = ({ schedules = [], onSelectSchedule, onStartAttendance }) => {
    return (
        <GoogleCalendarTimeline
            schedules={schedules}
            type="class"
            isAdmin={false}
            onSelectSchedule={onSelectSchedule}
            onStartAttendance={onStartAttendance}
            title="Lịch Giảng Dạy Tuần"
        />
    );
};

export default WeeklyTimetableGrid;
