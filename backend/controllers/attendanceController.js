
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ✅ Get attendance records for a user
exports.getAttendance = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        const attendanceRecords = await Attendance.find({ 
            userId: userId 
        }).sort({ checkInTime: -1 }); // Sort by check-in time, most recent first

        if (!attendanceRecords.length) {
            return res.status(404).json({ success: false, message: "No attendance records found" });
        }

        res.status(200).json({ success: true, data: attendanceRecords });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};
// ✅ Get complete attendance sessions for a user
exports.getAttendanceSessions = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // Get all check-in and check-out records for the user
        const records = await Attendance.find({ 
            userId: userId,
            type: { $in: ["check-in", "check-out"] }
        }).sort({ timestamp: -1 });

        // Group records by session ID to create complete sessions
        const sessions = {};
        records.forEach(record => {
            if (record.sessionId) {
                if (!sessions[record.sessionId]) {
                    sessions[record.sessionId] = {
                        sessionId: record.sessionId,
                        userId: record.userId,
                        attendance_date: record.attendance_date,
                        checkIn: null,
                        checkOut: null,
                        workDuration: null,
                        createdAt: record.createdAt
                    };
                }
                
                if (record.type === "check-in") {
                    sessions[record.sessionId].checkIn = {
                        timestamp: record.timestamp,
                        faceDescriptor: record.faceDescriptor,
                        similarityScore: record.similarityScore,
                        notes: record.notes
                    };
                } else if (record.type === "check-out") {
                    sessions[record.sessionId].checkOut = {
                        timestamp: record.timestamp,
                        faceDescriptor: record.faceDescriptor,
                        similarityScore: record.similarityScore,
                        notes: record.notes
                    };
                    
                    // Calculate work duration if both check-in and check-out exist
                    if (sessions[record.sessionId].checkIn) {
                        const duration = Math.round((record.timestamp - sessions[record.sessionId].checkIn.timestamp) / (1000 * 60));
                        sessions[record.sessionId].workDuration = duration;
                    }
                }
            }
        });

        // Convert to array and filter out incomplete sessions
        const completeSessions = Object.values(sessions).filter(session => 
            session.checkIn && session.checkOut
        );

        return res.json({ 
            success: true, 
            data: completeSessions,
            totalSessions: completeSessions.length
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ✅ Admin: List attendance with filters
exports.adminListAttendance = async (req, res) => {
    try {
        const { userId, from, to, type } = req.query;
        const query = {};
        
        // Filter by user ID
        if (userId) query.userId = userId;
        
        // Filter by date range using checkInTime
        if (from || to) {
            query.checkInTime = {};
            if (from) query.checkInTime.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999); // End of day
                query.checkInTime.$lte = toDate;
            }
        }
        
        // Get all attendance records
        const records = await Attendance.find(query)
            .populate('userId', 'name email')
            .sort({ checkInTime: -1 });
        
        // Transform records to show current status (one entry per user)
        let transformedRecords = records.map(record => {
            console.log('🔍 Processing record:', {
                id: record._id,
                userId: record.userId,
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                status: record.status
            });
            
            // Determine current status and latest timestamp
            const currentStatus = record.checkOutTime ? 'checked-out' : 'checked-in';
            const latestTimestamp = record.checkOutTime || record.checkInTime;
            
            return {
                ...record.toObject(),
                type: currentStatus === 'checked-out' ? 'check-out' : 'check-in',
                timestamp: latestTimestamp,
                status: currentStatus
            };
        });
        
        console.log('🔍 Transformed records count:', transformedRecords.length);
        console.log('🔍 Sample transformed record:', transformedRecords[0]);
        
        // Filter by type if specified
        if (type) {
            if (type === 'check-in') {
                transformedRecords = transformedRecords.filter(record => record.status === 'checked-in');
            } else if (type === 'check-out') {
                transformedRecords = transformedRecords.filter(record => record.status === 'checked-out');
            }
        }
        
        return res.json({ success: true, data: transformedRecords });
    } catch (error) {
        console.error('Error in adminListAttendance:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ✅ Mark attendance (Create an attendance record)
exports.markAttendance = async (req, res) => {
    try {
        const { user_id, attendance_date, time_entries, total_work_duration, total_break_duration } = req.body;

        if (!user_id || !attendance_date) {
            return res.status(400).json({ success: false, message: "User ID and Attendance Date are required" });
        }

        const newAttendance = new Attendance({
            user_id,
            attendance_date,
            time_entries,
            total_work_duration,
            total_break_duration
        });

        const savedAttendance = await newAttendance.save();

        res.status(201).json({
            success: true,
            message: "Attendance marked successfully",
            data: savedAttendance
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "Error marking attendance", error: error.message });
    }
};

// ✅ Face-verified Check In
exports.checkIn = async (req, res) => {
    try {
        console.log('Check-in request received for user:', req.user);
        
        const { descriptor } = req.body || {};
        if (!descriptor || !Array.isArray(descriptor)) {
            return res.status(400).json({ success: false, message: "Descriptor required" });
        }

        // 1. Get user and verify they exist
        console.log('Looking up user with ID:', req.user._id);
        const user = await User.findById(req.user._id)
            .populate('credentialId')
            .select('+faceData');
            
        console.log('Found user:', user ? {
            id: user._id,
            name: user.name,
            hasFaceData: !!user.faceData,
            faceDescriptors: user.faceData ? {
                front: !!user.faceData.frontDescriptor,
                left: !!user.faceData.leftDescriptor,
                right: !!user.faceData.rightDescriptor
            } : null
        } : 'Not found');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User profile not found. Please ensure you are properly registered.",
                debug: { 
                    credentialId: req.user.credentialId,
                    userId: req.user._id 
                }
            });
        }

        // 2. Get stored face data and verify it exists
        if (!user.faceData) {
            return res.status(400).json({ 
                success: false, 
                message: "No face data registered. Please register your face first." 
            });
        }

        // 3. Get valid face descriptors
        const stored = user.faceData;
        const candidates = [
            stored.frontDescriptor,
            stored.leftDescriptor,
            stored.rightDescriptor
        ].filter(desc => Array.isArray(desc) && desc.length > 0);

        // 4. Verify we have face descriptors to compare against
        if (candidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid face descriptors found. Please re-register your face." 
            });
        }

        // 5. Verify descriptor lengths match
        const validCandidates = candidates.filter(c => c.length === descriptor.length);
        if (validCandidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid face descriptor format. Please try again." 
            });
        }

        // 6. Face verification with detailed logging
        console.log('Comparing face descriptors...');
        const distances = validCandidates.map(candidate => {
            let sum = 0;
            for (let i = 0; i < candidate.length; i++) {
                const diff = candidate[i] - descriptor[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);
            console.log('Face comparison distance:', distance);
            return distance;
        });

        const minDist = Math.min(...distances);
        console.log('Best match distance:', minDist);

        const THRESHOLD = 0.6;
        if (minDist > THRESHOLD) {
            console.log('Face verification failed. Score:', minDist, 'Threshold:', THRESHOLD);
            return res.status(401).json({ 
                success: false, 
                message: "Face not recognized. Please ensure proper lighting and camera angle.",
                score: minDist,
                threshold: THRESHOLD
            });
        }

        console.log('Face verification successful. Score:', minDist);

        // Check for existing attendance today
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const existingAttendance = await Attendance.findOne({
            userId: user._id,
            checkInTime: { $gte: today, $lt: tomorrow }
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: "Already checked in for today."
            });
        }

        // Business hours validation (optional)
        const hour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        
        if (isWeekday && (hour < 6 || hour > 22)) {
            console.log('⚠️ Check-in outside normal business hours:', hour);
        }

        // Create attendance record in the old format
        const record = new Attendance({
            userId: user._id,
            checkInTime: now,
            status: 'checked-in',
            time_entries: []
        });

        await record.save();

        return res.status(201).json({
            success: true,
            message: "Checked in successfully",
            data: record
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Face-verified Check Out
exports.checkOut = async (req, res) => {
    try {
        const { descriptor } = req.body || {};
        if (!descriptor || !Array.isArray(descriptor)) {
            return res.status(400).json({ success: false, message: "Descriptor required" });
        }

        // 1. Get user and verify they exist
        console.log('Looking up user with ID for check-out:', req.user._id);
        const user = await User.findById(req.user._id)
            .populate('credentialId')
            .select('+faceData');
            
        console.log('Found user for check-out:', user ? {
            id: user._id,
            name: user.name,
            hasFaceData: !!user.faceData
        } : 'Not found');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User profile not found. Please ensure you are properly registered.",
                debug: { 
                    userId: req.user._id 
                }
            });
        }

        // 2. Get stored face data and verify it exists
        if (!user.faceData) {
            return res.status(400).json({ 
                success: false, 
                message: "No face data registered. Please register your face first." 
            });
        }

        // 3. Get valid face descriptors
        const stored = user.faceData;
        const candidates = [
            stored.frontDescriptor,
            stored.leftDescriptor,
            stored.rightDescriptor
        ].filter(desc => Array.isArray(desc) && desc.length > 0);

        // 4. Verify we have face descriptors to compare against
        if (candidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "No valid face descriptors found. Please re-register your face." 
            });
        }

        // 5. Verify descriptor lengths match
        const validCandidates = candidates.filter(c => c.length === descriptor.length);
        if (validCandidates.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid face descriptor format. Please try again." 
            });
        }

        // 6. Face verification with detailed logging
        console.log('Comparing face descriptors for check-out...');
        const distances = validCandidates.map(candidate => {
            let sum = 0;
            for (let i = 0; i < candidate.length; i++) {
                const diff = candidate[i] - descriptor[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);
            console.log('Face comparison distance:', distance);
            return distance;
        });

        const minDist = Math.min(...distances);
        console.log('Best match distance:', minDist);

        const THRESHOLD = 0.6;
        if (minDist > THRESHOLD) {
            console.log('Face verification failed. Score:', minDist, 'Threshold:', THRESHOLD);
            return res.status(401).json({ 
                success: false, 
                message: "Face not recognized. Please ensure proper lighting and camera angle.",
                score: minDist,
                threshold: THRESHOLD
            });
        }

        console.log('Face verification successful. Score:', minDist);

        const now = new Date();
        
        // Find today's attendance record
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find today's attendance record for the user
        console.log('Looking for attendance record for user:', user._id, 'between:', today, 'and', tomorrow);
        
        const todayAttendance = await Attendance.findOne({
            userId: user._id,
            checkInTime: { $gte: today, $lt: tomorrow }
        });
        
        console.log('Found attendance record:', todayAttendance ? {
            id: todayAttendance._id,
            checkInTime: todayAttendance.checkInTime,
            hasCheckOut: !!todayAttendance.checkOutTime
        } : 'No record found');

        if (!todayAttendance) {
            return res.status(404).json({
                success: false,
                message: "No check-in record found for today. Please check-in first."
            });
        }

        if (todayAttendance.checkOutTime) {
            return res.status(400).json({
                success: false,
                message: "Already checked out for today."
            });
        }

        // Update the existing record with check-out time
        todayAttendance.checkOutTime = now;
        todayAttendance.status = "checked-out";
        await todayAttendance.save();

        console.log('✅ Check-out successful. Updated record:', {
            id: todayAttendance._id,
            userId: todayAttendance.userId,
            checkInTime: todayAttendance.checkInTime,
            checkOutTime: todayAttendance.checkOutTime,
            status: todayAttendance.status
        });

        return res.status(200).json({
            success: true,
            message: "Checked out successfully",
            data: todayAttendance
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// ✅ Update an attendance record
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAttendance = await Attendance.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedAttendance) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }

        res.status(200).json({
            success: true,
            message: "Attendance record updated successfully",
            data: updatedAttendance
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating attendance", error: error.message });
    }
};

// ✅ Delete an attendance record
exports.deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAttendance = await Attendance.findByIdAndDelete(id);

        if (!deletedAttendance) {
            return res.status(404).json({ success: false, message: "Attendance record not found" });
        }

        res.status(200).json({ success: true, message: "Attendance record deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting attendance", error: error.message });
    }
};
