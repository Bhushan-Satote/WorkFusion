import React from 'react';
import AttendanceActions from '../components/attendance/AttendanceActions';
import { FaUserCheck, FaFingerprint } from 'react-icons/fa';

const AttendancePage = () => {
  return (
    <div className="container mx-auto px-4 md:px-6 py-6">
      <div className="mb-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-[#377ff5] via-[#418EFD] to-[#8BBAFC] text-white rounded-2xl p-4 sm:p-6 shadow-lg border border-[#8BBAFC]/40">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start md:items-center">
              <div className="p-2.5 sm:p-3 bg-white/15 rounded-xl mr-2.5 sm:mr-3">
                <FaFingerprint className="text-white text-xl sm:text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">Attendance</h1> <div className="mt-1 h-1.5 w-24 sm:w-28 bg-gradient-to-r from-white/80 to-white/20 rounded-full animate-[pulse_2.5s_ease-in-out_infinite]"></div>
                <p className="text-white/90 text-xs sm:text-sm mt-1">Mark your presence using face recognition.</p>
              </div>
            </div>

            <div className="mt-3 md:mt-0 flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('attendance-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="bg-white text-[#1b66d1] hover:bg-[#f4f8ff] font-semibold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl flex items-center transition-colors border border-white/80 shadow-md focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <FaUserCheck className="mr-2" />
                Open Attendance
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="attendance-panel" className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-md border border-[#8BBAFC]/40">
          <h2 className="text-lg font-semibold mb-4">Face Recognition Attendance</h2>
          <AttendanceActions />
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;



