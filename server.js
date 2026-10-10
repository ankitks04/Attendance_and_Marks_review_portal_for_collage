const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const { sampleStudents, generateSampleAttendance, generateSampleMarks } = require('./sample-data');
const { computeComprehensiveAnalytics } = require('./analytics-engine');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.db');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite Database
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to local SQLite database at', DB_FILE);
  }
});

// Helper for Promisified DB Queries
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Log System Activity
async function logActivity(actionType, description) {
  try {
    await dbRun(
      `INSERT INTO activity_log (action_type, description, timestamp) VALUES (?, ?, datetime('now', 'localtime'))`,
      [actionType, description]
    );
  } catch (err) {
    console.error('Error logging activity:', err.message);
  }
}

// Initialize Database Schema & Seed if Empty
async function initializeDatabase() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      course TEXT NOT NULL,
      semester INTEGER NOT NULL,
      gender TEXT DEFAULT 'Other',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Ensure attendance table has full schema
  await dbRun(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      subject TEXT DEFAULT 'General Attendance',
      status TEXT NOT NULL,
      remarks TEXT
    )
  `);

  // Check if remarks column exists in existing attendance table; if not, add it
  try {
    await dbRun(`ALTER TABLE attendance ADD COLUMN remarks TEXT`);
  } catch (e) {
    // Column already exists, ignore
  }

  await dbRun(`
    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      marks_obtained REAL NOT NULL,
      max_marks REAL NOT NULL,
      semester INTEGER NOT NULL,
      date_recorded TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Ensure users table exists with roles & credentials
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      student_id INTEGER
    )
  `);

  try {
    await dbRun(`ALTER TABLE users ADD COLUMN student_id INTEGER`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Seed default teacher and student credentials
  await dbRun(`INSERT OR IGNORE INTO users (username, password, role, name, student_id) VALUES ('teacher', 'teacher123', 'teacher', 'Prof. A. K. Sharma', NULL)`);
  await dbRun(`INSERT OR IGNORE INTO users (username, password, role, name, student_id) VALUES ('admin', 'admin123', 'teacher', 'Prof. A. K. Sharma (Admin)', NULL)`);
  await dbRun(`INSERT OR IGNORE INTO users (username, password, role, name, student_id) VALUES ('student', 'student123', 'student', 'Aarav Sharma', 1)`);
  await dbRun(`INSERT OR IGNORE INTO users (username, password, role, name, student_id) VALUES ('student1', 'pass123', 'student', 'John Doe', 1)`);

  // Check if students table is empty; if so, seed sample data
  const countRow = await dbGet(`SELECT COUNT(*) as count FROM students`);
  if (!countRow || countRow.count === 0) {
    console.log('Seeding initial realistic college sample dataset...');
    await seedSampleData();
  } else {
    console.log(`Database already has ${countRow.count} students.`);
  }
}

async function seedSampleData() {
  // Clear existing records
  await dbRun(`DELETE FROM attendance`);
  await dbRun(`DELETE FROM marks`);
  await dbRun(`DELETE FROM students`);
  await dbRun(`DELETE FROM activity_log`);
  try {
    await dbRun(`DELETE FROM sqlite_sequence WHERE name IN ('students', 'attendance', 'marks', 'activity_log')`);
  } catch (e) {
    // sqlite_sequence might not exist if no autoincrement rows yet
  }

  // Insert sample students
  for (const s of sampleStudents) {
    await dbRun(
      `INSERT INTO students (student_code, name, email, phone, course, semester, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.student_code, s.name, s.email, s.phone, s.course, s.semester, s.gender]
    );
  }

  const allStudents = await dbAll(`SELECT * FROM students ORDER BY id ASC`);

  // Insert sample attendance
  const sampleAttendance = generateSampleAttendance(allStudents);
  for (const att of sampleAttendance) {
    await dbRun(
      `INSERT INTO attendance (student_id, date, subject, status, remarks) VALUES (?, ?, ?, ?, ?)`,
      [att.student_id, att.date, att.subject, att.status, att.remarks]
    );
  }

  // Insert sample marks
  const sampleMarks = generateSampleMarks(allStudents);
  for (const m of sampleMarks) {
    await dbRun(
      `INSERT INTO marks (student_id, subject, exam_type, marks_obtained, max_marks, semester) VALUES (?, ?, ?, ?, ?, ?)`,
      [m.student_id, m.subject, m.exam_type, m.marks_obtained, m.max_marks, m.semester]
    );
  }

  await logActivity('SYSTEM_RESET', 'Sample college dataset initialized with 18 students, attendance, and exam marks.');
  console.log('Sample data seeding complete!');
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// Explicit route for login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Authentication & Login API
app.post('/api/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both username and password.' });
    }

    let query = `SELECT id, username, role, name, student_id FROM users WHERE username = ? AND password = ?`;
    const params = [username, password];
    if (role && role !== 'all') {
      query += ` AND role = ?`;
      params.push(role);
    }

    const user = await dbGet(query, params);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username and password.' });
    }

    // If student, attach student code and course
    let studentDetails = null;
    if (user.student_id) {
      studentDetails = await dbGet(`SELECT student_code, course, semester FROM students WHERE id = ?`, [user.student_id]);
    }

    await logActivity('USER_LOGIN', `User ${user.name} (${user.role}) logged in successfully.`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        student_id: user.student_id,
        student_code: studentDetails ? studentDetails.student_code : null,
        course: studentDetails ? studentDetails.course : null,
        semester: studentDetails ? studentDetails.semester : null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Demo Credentials API (Convenience for college grading)
app.get('/api/users/demo-credentials', (req, res) => {
  res.json({
    success: true,
    credentials: {
      teacher: {
        username: 'teacher',
        password: 'teacher123',
        role: 'teacher',
        name: 'Prof. A. K. Sharma (Teacher)'
      },
      admin: {
        username: 'admin',
        password: 'admin123',
        role: 'teacher',
        name: 'Administrator (Teacher)'
      },
      student: {
        username: 'student',
        password: 'student123',
        role: 'student',
        name: 'Aarav Sharma (Student - STU101)'
      },
      student1: {
        username: 'student1',
        password: 'pass123',
        role: 'student',
        name: 'John Doe (Student)'
      }
    }
  });
});

// 1. Dashboard Overview API
app.get('/api/dashboard', async (req, res) => {
  try {
    const students = await dbAll(`SELECT * FROM students ORDER BY id ASC`);
    const attendance = await dbAll(`SELECT * FROM attendance`);
    const marks = await dbAll(`SELECT * FROM marks`);
    const activities = await dbAll(`SELECT * FROM activity_log ORDER BY id DESC LIMIT 6`);

    const analytics = computeComprehensiveAnalytics(students, attendance, marks, 40);

    // Recent 5 attendance trends (grouped by date)
    const dateAttendance = await dbAll(`
      SELECT date,
             SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present_count,
             COUNT(*) as total_count
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 8
    `);

    const trendDates = dateAttendance.reverse().map(d => ({
      date: d.date,
      percentage: d.total_count > 0 ? Number(((d.present_count / d.total_count) * 100).toFixed(1)) : 0
    }));

    res.json({
      success: true,
      data: {
        overview: analytics.overview,
        trends: trendDates,
        gradeDistribution: analytics.gradeDistribution,
        subjectPerformance: analytics.subjectPerformance.slice(0, 5),
        atRiskStudents: analytics.atRiskStudents.slice(0, 5),
        recentActivities: activities
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Students API (CRUD + Filter)
app.get('/api/students', async (req, res) => {
  try {
    const { search, course, semester, status } = req.query;

    const students = await dbAll(`SELECT * FROM students ORDER BY id ASC`);
    const attendance = await dbAll(`SELECT * FROM attendance`);
    const marks = await dbAll(`SELECT * FROM marks`);

    const analytics = computeComprehensiveAnalytics(students, attendance, marks, 40);
    let result = analytics.studentStats;

    // Search filter (name, student_code, email)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.student_code.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    // Course filter
    if (course && course !== 'All') {
      result = result.filter(s => s.course === course);
    }

    // Semester filter
    if (semester && semester !== 'All') {
      result = result.filter(s => s.semester === Number(semester));
    }

    // Status filter
    if (status && status !== 'All') {
      if (status === 'At Risk') {
        result = result.filter(s => s.riskLevel !== 'Safe');
      } else {
        result = result.filter(s => s.status === status);
      }
    }

    res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Single Student Detail (Profile, Attendance records, Marks records)
app.get('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await dbGet(`SELECT * FROM students WHERE id = ?`, [studentId]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const attendanceRecords = await dbAll(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`, [studentId]);
    const marksRecords = await dbAll(`SELECT * FROM marks WHERE student_id = ? ORDER BY id DESC`, [studentId]);

    const presentCount = attendanceRecords.filter(a => a.status === 'Present').length;
    const totalSessions = attendanceRecords.length;
    const attendancePercentage = totalSessions > 0 ? Number(((presentCount / totalSessions) * 100).toFixed(1)) : 0;

    let totalObtained = 0;
    let totalMax = 0;
    marksRecords.forEach(m => {
      totalObtained += m.marks_obtained;
      totalMax += m.max_marks;
    });
    const marksPercentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        student,
        attendanceSummary: {
          present: presentCount,
          absent: totalSessions - presentCount,
          total: totalSessions,
          percentage: attendancePercentage
        },
        marksSummary: {
          totalObtained,
          totalMax,
          percentage: marksPercentage
        },
        attendanceRecords,
        marksRecords
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create New Student
app.post('/api/students', async (req, res) => {
  try {
    const { student_code, name, email, phone, course, semester, gender } = req.body;

    if (!name || !email || !course || !semester) {
      return res.status(400).json({ success: false, message: 'Name, Email, Course, and Semester are required.' });
    }

    // Auto-generate student code if omitted
    let finalCode = student_code;
    if (!finalCode || finalCode.trim() === '') {
      const last = await dbGet(`SELECT id FROM students ORDER BY id DESC LIMIT 1`);
      const nextId = last ? last.id + 1 : 101;
      finalCode = `STU${100 + nextId}`;
    }

    // Check duplicate code
    const existing = await dbGet(`SELECT id FROM students WHERE student_code = ?`, [finalCode]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Student ID "${finalCode}" is already taken.` });
    }

    const result = await dbRun(
      `INSERT INTO students (student_code, name, email, phone, course, semester, gender) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [finalCode, name, email, phone || '', course, Number(semester), gender || 'Other']
    );

    await logActivity('STUDENT_ADD', `Added student ${name} (${finalCode}) in ${course} Sem-${semester}.`);

    res.json({ success: true, id: result.lastID, message: 'Student added successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Student
app.put('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { student_code, name, email, phone, course, semester, gender } = req.body;

    if (!name || !email || !course || !semester) {
      return res.status(400).json({ success: false, message: 'Name, Email, Course, and Semester are required.' });
    }

    // Check code collision with other students
    const conflict = await dbGet(`SELECT id FROM students WHERE student_code = ? AND id != ?`, [student_code, studentId]);
    if (conflict) {
      return res.status(400).json({ success: false, message: `Student ID "${student_code}" belongs to another student.` });
    }

    await dbRun(
      `UPDATE students SET student_code = ?, name = ?, email = ?, phone = ?, course = ?, semester = ?, gender = ? WHERE id = ?`,
      [student_code, name, email, phone || '', course, Number(semester), gender || 'Other', studentId]
    );

    await logActivity('STUDENT_UPDATE', `Updated student details for ${name} (${student_code}).`);

    res.json({ success: true, message: 'Student updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await dbGet(`SELECT name, student_code FROM students WHERE id = ?`, [studentId]);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Cascade delete marks and attendance
    await dbRun(`DELETE FROM attendance WHERE student_id = ?`, [studentId]);
    await dbRun(`DELETE FROM marks WHERE student_id = ?`, [studentId]);
    await dbRun(`DELETE FROM students WHERE id = ?`, [studentId]);

    await logActivity('STUDENT_DELETE', `Deleted student ${student.name} (${student.student_code}).`);

    res.json({ success: true, message: `Student ${student.name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. Attendance APIs
// -------------------------------------------------------------
app.get('/api/attendance', async (req, res) => {
  try {
    const { student_id, date, course, semester, shortage_only } = req.query;

    let query = `
      SELECT a.*, s.name as student_name, s.student_code, s.course, s.semester
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ` AND a.student_id = ?`;
      params.push(student_id);
    }
    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    }
    if (course && course !== 'All') {
      query += ` AND s.course = ?`;
      params.push(course);
    }
    if (semester && semester !== 'All') {
      query += ` AND s.semester = ?`;
      params.push(Number(semester));
    }

    query += ` ORDER BY a.date DESC, a.id DESC`;

    const records = await dbAll(query, params);

    // Compute student attendance summary stats
    const allStudents = await dbAll(`SELECT id, student_code, name, course, semester FROM students ORDER BY id ASC`);
    const allAttendance = await dbAll(`SELECT student_id, status FROM attendance`);

    const summaryMap = {};
    allStudents.forEach(s => {
      summaryMap[s.id] = {
        student_id: s.id,
        student_code: s.student_code,
        name: s.name,
        course: s.course,
        semester: s.semester,
        present: 0,
        absent: 0,
        total: 0,
        percentage: 0,
        statusBadge: 'Good'
      };
    });

    allAttendance.forEach(att => {
      if (summaryMap[att.student_id]) {
        summaryMap[att.student_id].total++;
        if (att.status === 'Present') summaryMap[att.student_id].present++;
        else summaryMap[att.student_id].absent++;
      }
    });

    const summaryList = Object.values(summaryMap).map(s => {
      s.percentage = s.total > 0 ? Number(((s.present / s.total) * 100).toFixed(1)) : 0;
      if (s.percentage >= 85) s.statusBadge = 'Excellent';
      else if (s.percentage >= 75) s.statusBadge = 'Good';
      else if (s.percentage >= 60) s.statusBadge = 'Shortage Warning';
      else s.statusBadge = 'Critical Shortage';
      return s;
    });

    const shortageList = summaryList.filter(s => s.percentage < 75);

    res.json({
      success: true,
      records: shortage_only === 'true' ? [] : records,
      studentSummary: summaryList,
      shortageList: shortageList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark Single Attendance Entry
app.post('/api/attendance', async (req, res) => {
  try {
    const { student_id, date, status, subject, remarks } = req.body;

    if (!student_id || !date || !status) {
      return res.status(400).json({ success: false, message: 'Student ID, Date, and Status are required.' });
    }

    const student = await dbGet(`SELECT name FROM students WHERE id = ?`, [student_id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Check if record already exists for this student on this date and subject
    const existing = await dbGet(
      `SELECT id FROM attendance WHERE student_id = ? AND date = ? AND subject = ?`,
      [student_id, date, subject || 'General Attendance']
    );

    if (existing) {
      await dbRun(
        `UPDATE attendance SET status = ?, remarks = ? WHERE id = ?`,
        [status, remarks || '', existing.id]
      );
      await logActivity('ATTENDANCE_MARK', `Updated attendance for ${student.name} on ${date}: ${status}.`);
      return res.json({ success: true, message: `Attendance updated to ${status} for ${student.name}.` });
    }

    const result = await dbRun(
      `INSERT INTO attendance (student_id, date, subject, status, remarks) VALUES (?, ?, ?, ?, ?)`,
      [student_id, date, subject || 'General Attendance', status, remarks || '']
    );

    await logActivity('ATTENDANCE_MARK', `Marked attendance for ${student.name} on ${date}: ${status}.`);

    res.json({ success: true, id: result.lastID, message: `Attendance recorded as ${status} for ${student.name}.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mark Batch Attendance for an entire class/date
app.post('/api/attendance/batch', async (req, res) => {
  try {
    const { date, subject, entries } = req.body; // entries: [{ student_id: 1, status: 'Present' }, ...]

    if (!date || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ success: false, message: 'Date and valid entries array are required.' });
    }

    let markedCount = 0;
    for (const item of entries) {
      const existing = await dbGet(
        `SELECT id FROM attendance WHERE student_id = ? AND date = ? AND subject = ?`,
        [item.student_id, date, subject || 'General Attendance']
      );

      if (existing) {
        await dbRun(`UPDATE attendance SET status = ? WHERE id = ?`, [item.status, existing.id]);
      } else {
        await dbRun(
          `INSERT INTO attendance (student_id, date, subject, status, remarks) VALUES (?, ?, ?, ?, ?)`,
          [item.student_id, date, subject || 'General Attendance', item.status, 'Batch Entry']
        );
      }
      markedCount++;
    }

    await logActivity('ATTENDANCE_MARK', `Marked batch attendance for ${markedCount} students on ${date}.`);

    res.json({ success: true, message: `Batch attendance successfully recorded for ${markedCount} students!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Attendance Entry
app.delete('/api/attendance/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM attendance WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. Marks and Results APIs
// -------------------------------------------------------------
app.get('/api/marks', async (req, res) => {
  try {
    const { student_id, subject, exam_type, semester, passing_threshold } = req.query;
    const threshold = passing_threshold ? Number(passing_threshold) : 40;

    let query = `
      SELECT m.*, s.name as student_name, s.student_code, s.course, s.semester as student_semester
      FROM marks m
      JOIN students s ON m.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) {
      query += ` AND m.student_id = ?`;
      params.push(student_id);
    }
    if (subject && subject !== 'All') {
      query += ` AND m.subject = ?`;
      params.push(subject);
    }
    if (exam_type && exam_type !== 'All') {
      query += ` AND m.exam_type = ?`;
      params.push(exam_type);
    }
    if (semester && semester !== 'All') {
      query += ` AND m.semester = ?`;
      params.push(Number(semester));
    }

    query += ` ORDER BY m.id DESC`;

    const records = await dbAll(query, params);

    // Compute percentage and status for each mark
    const enrichedRecords = records.map(r => {
      const percentage = r.max_marks > 0 ? Number(((r.marks_obtained / r.max_marks) * 100).toFixed(1)) : 0;
      let status = 'Pass';
      if (percentage < threshold) {
        status = 'Fail';
      } else if (percentage < 60) {
        status = 'Needs Improvement';
      } else if (percentage >= 75) {
        status = 'Distinction';
      } else {
        status = 'Pass';
      }
      return {
        ...r,
        percentage,
        status
      };
    });

    res.json({ success: true, count: enrichedRecords.length, data: enrichedRecords });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add Marks
app.post('/api/marks', async (req, res) => {
  try {
    const { student_id, subject, exam_type, marks_obtained, max_marks, semester } = req.body;

    if (!student_id || !subject || !exam_type || marks_obtained === undefined || !max_marks) {
      return res.status(400).json({ success: false, message: 'Student, Subject, Exam Type, Marks, and Max Marks are required.' });
    }

    const obtainedNum = Number(marks_obtained);
    const maxNum = Number(max_marks);

    if (isNaN(obtainedNum) || isNaN(maxNum)) {
      return res.status(400).json({ success: false, message: 'Marks must be valid numbers.' });
    }

    if (obtainedNum < 0) {
      return res.status(400).json({ success: false, message: 'Marks obtained cannot be less than zero.' });
    }

    if (obtainedNum > maxNum) {
      return res.status(400).json({ success: false, message: `Marks obtained (${obtainedNum}) cannot exceed maximum allowed marks (${maxNum}).` });
    }

    const student = await dbGet(`SELECT name, semester FROM students WHERE id = ?`, [student_id]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const sem = semester ? Number(semester) : student.semester;

    const result = await dbRun(
      `INSERT INTO marks (student_id, subject, exam_type, marks_obtained, max_marks, semester) VALUES (?, ?, ?, ?, ?, ?)`,
      [student_id, subject, exam_type, obtainedNum, maxNum, sem]
    );

    await logActivity('MARKS_ADD', `Recorded marks for ${student.name}: ${subject} (${exam_type}) - ${obtainedNum}/${maxNum}.`);

    res.json({ success: true, id: result.lastID, message: 'Marks recorded successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Marks
app.put('/api/marks/:id', async (req, res) => {
  try {
    const markId = req.params.id;
    const { subject, exam_type, marks_obtained, max_marks, semester } = req.body;

    const obtainedNum = Number(marks_obtained);
    const maxNum = Number(max_marks);

    if (obtainedNum < 0 || obtainedNum > maxNum) {
      return res.status(400).json({ success: false, message: 'Marks must be between 0 and maximum marks.' });
    }

    await dbRun(
      `UPDATE marks SET subject = ?, exam_type = ?, marks_obtained = ?, max_marks = ?, semester = ? WHERE id = ?`,
      [subject, exam_type, obtainedNum, maxNum, Number(semester), markId]
    );

    res.json({ success: true, message: 'Marks updated successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Marks
app.delete('/api/marks/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM marks WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Marks entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. Advanced Analytics & Statistical Engine API
// -------------------------------------------------------------
app.get('/api/analytics', async (req, res) => {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : 40;

    const students = await dbAll(`SELECT * FROM students ORDER BY id ASC`);
    const attendance = await dbAll(`SELECT * FROM attendance`);
    const marks = await dbAll(`SELECT * FROM marks`);

    const analytics = computeComprehensiveAnalytics(students, attendance, marks, threshold);

    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. CSV Export Endpoints
// -------------------------------------------------------------
app.get('/api/export/csv/:type', async (req, res) => {
  try {
    const type = req.params.type;
    let csvContent = '';
    let fileName = 'export.csv';

    if (type === 'students') {
      fileName = 'student_records.csv';
      const students = await dbAll(`SELECT * FROM students ORDER BY id ASC`);
      const attendance = await dbAll(`SELECT * FROM attendance`);
      const marks = await dbAll(`SELECT * FROM marks`);
      const analytics = computeComprehensiveAnalytics(students, attendance, marks, 40);

      csvContent = 'Student ID,Roll Code,Name,Email,Course,Semester,Attendance %,Average Marks %,Risk Level,Status\n';
      analytics.studentStats.forEach(s => {
        csvContent += `"${s.id}","${s.student_code}","${s.name}","${s.email}","${s.course}","${s.semester}","${s.attendancePercentage}%","${s.marksPercentage}%","${s.riskLevel}","${s.status}"\n`;
      });
    } else if (type === 'marks') {
      fileName = 'academic_marks.csv';
      const records = await dbAll(`
        SELECT m.*, s.student_code, s.name as student_name, s.course
        FROM marks m
        JOIN students s ON m.student_id = s.id
        ORDER BY m.id ASC
      `);

      csvContent = 'ID,Student ID,Student Name,Course,Subject,Exam Type,Marks Obtained,Max Marks,Percentage,Semester\n';
      records.forEach(r => {
        const pct = r.max_marks > 0 ? ((r.marks_obtained / r.max_marks) * 100).toFixed(1) : 0;
        csvContent += `"${r.id}","${r.student_code}","${r.student_name}","${r.course}","${r.subject}","${r.exam_type}","${r.marks_obtained}","${r.max_marks}","${pct}%","${r.semester}"\n`;
      });
    } else if (type === 'attendance') {
      fileName = 'attendance_records.csv';
      const records = await dbAll(`
        SELECT a.*, s.student_code, s.name as student_name, s.course, s.semester
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        ORDER BY a.date DESC, a.id ASC
      `);

      csvContent = 'ID,Student ID,Student Name,Course,Semester,Date,Subject,Status,Remarks\n';
      records.forEach(r => {
        csvContent += `"${r.id}","${r.student_code}","${r.student_name}","${r.course}","${r.semester}","${r.date}","${r.subject}","${r.status}","${r.remarks || ''}"\n`;
      });
    } else if (type === 'analytics-summary') {
      fileName = 'analytics_statistical_summary.csv';
      const students = await dbAll(`SELECT * FROM students`);
      const attendance = await dbAll(`SELECT * FROM attendance`);
      const marks = await dbAll(`SELECT * FROM marks`);
      const a = computeComprehensiveAnalytics(students, attendance, marks, 40);

      csvContent = 'Metric,Value,Interpretation\n';
      csvContent += `"Total Students","${a.overview.totalStudents}","Enrolled in system"\n`;
      csvContent += `"Mean Marks","${a.marksStatistics.mean}%","Average score across tests"\n`;
      csvContent += `"Median Marks","${a.marksStatistics.median}%","50th percentile mark"\n`;
      csvContent += `"Std Dev Marks","${a.marksStatistics.stdDev}","Spread of academic marks"\n`;
      csvContent += `"Mean Attendance","${a.attendanceStatistics.mean}%","Average class attendance"\n`;
      csvContent += `"Pearson Correlation (r)","${a.regressionAnalysis.correlation}","Relationship between attendance and marks"\n`;
      csvContent += `"Regression Slope (m)","${a.regressionAnalysis.slope}","Marks gain per unit attendance"\n`;
      csvContent += `"Regression Intercept (c)","${a.regressionAnalysis.intercept}","Baseline marks projection"\n`;
      csvContent += `"R-squared (R2)","${a.regressionAnalysis.r2}","Goodness of fit (variance explained)"\n`;
      csvContent += `"Students Below 75% Attendance","${a.attendanceStatistics.below75Count}","At risk of debarment"\n`;
      csvContent += `"Pass Rate","${a.overview.passPercentage}%","Passing threshold at 40%"\n`;
    } else {
      return res.status(400).send('Invalid export type');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. System Management (Reset / Clear)
// -------------------------------------------------------------
app.post('/api/system/reset-sample', async (req, res) => {
  try {
    await seedSampleData();
    res.json({ success: true, message: 'Sample college data successfully reset with 18 students!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/system/clear', async (req, res) => {
  try {
    await dbRun(`DELETE FROM attendance`);
    await dbRun(`DELETE FROM marks`);
    await dbRun(`DELETE FROM students`);
    await dbRun(`DELETE FROM activity_log`);
    await logActivity('SYSTEM_RESET', 'All records cleared by user.');
    res.json({ success: true, message: 'All student records, attendance, and marks cleared.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get System Activity Log
app.get('/api/activities', async (req, res) => {
  try {
    const logs = await dbAll(`SELECT * FROM activity_log ORDER BY id DESC LIMIT 20`);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for single-page routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server & Initialize Database
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` College Attendance & Performance Analytics System `);
    console.log(` Server running at: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
});