/**
 * Sample Data for College Attendance & Performance Analytics System
 * Provides realistic student profiles, attendance logs, and multi-subject marks
 */

const sampleStudents = [
  { student_code: 'STU101', name: 'Aarav Sharma', email: 'aarav.sharma@college.edu', phone: '9876543210', course: 'B.Tech CSE', semester: 4, gender: 'Male' },
  { student_code: 'STU102', name: 'Ananya Iyer', email: 'ananya.iyer@college.edu', phone: '9876543211', course: 'B.Tech CSE', semester: 4, gender: 'Female' },
  { student_code: 'STU103', name: 'Rohan Verma', email: 'rohan.verma@college.edu', phone: '9876543212', course: 'B.Tech CSE', semester: 4, gender: 'Male' },
  { student_code: 'STU104', name: 'Priya Patel', email: 'priya.patel@college.edu', phone: '9876543213', course: 'B.Tech CSE', semester: 4, gender: 'Female' },
  { student_code: 'STU105', name: 'Devendra Meena', email: 'devendra.meena@college.edu', phone: '9876543214', course: 'B.Tech CSE', semester: 4, gender: 'Male' },
  { student_code: 'STU106', name: 'Sneha Kulkarni', email: 'sneha.k@college.edu', phone: '9876543215', course: 'B.Tech CSE', semester: 4, gender: 'Female' },
  
  { student_code: 'STU107', name: 'Vikramaditya Roy', email: 'vikram.roy@college.edu', phone: '9876543216', course: 'B.Tech AI & DS', semester: 3, gender: 'Male' },
  { student_code: 'STU108', name: 'Kavya Nair', email: 'kavya.nair@college.edu', phone: '9876543217', course: 'B.Tech AI & DS', semester: 3, gender: 'Female' },
  { student_code: 'STU109', name: 'Aditya Deshmukh', email: 'aditya.d@college.edu', phone: '9876543218', course: 'B.Tech AI & DS', semester: 3, gender: 'Male' },
  { student_code: 'STU110', name: 'Ishita Sen', email: 'ishita.sen@college.edu', phone: '9876543219', course: 'B.Tech AI & DS', semester: 3, gender: 'Female' },
  
  { student_code: 'STU111', name: 'Manish Kumar', email: 'manish.k@college.edu', phone: '9876543220', course: 'BCA', semester: 2, gender: 'Male' },
  { student_code: 'STU112', name: 'Riya Chatterjee', email: 'riya.c@college.edu', phone: '9876543221', course: 'BCA', semester: 2, gender: 'Female' },
  { student_code: 'STU113', name: 'Karthik Raja', email: 'karthik.r@college.edu', phone: '9876543222', course: 'BCA', semester: 2, gender: 'Male' },
  { student_code: 'STU114', name: 'Meera Nambiar', email: 'meera.n@college.edu', phone: '9876543223', course: 'BCA', semester: 2, gender: 'Female' },
  
  { student_code: 'STU115', name: 'Zaid Khan', email: 'zaid.khan@college.edu', phone: '9876543224', course: 'B.Sc IT', semester: 5, gender: 'Male' },
  { student_code: 'STU116', name: 'Tanvi Joshi', email: 'tanvi.j@college.edu', phone: '9876543225', course: 'B.Sc IT', semester: 5, gender: 'Female' },
  { student_code: 'STU117', name: 'Abhinav Shukla', email: 'abhinav.s@college.edu', phone: '9876543226', course: 'B.Sc IT', semester: 5, gender: 'Male' },
  { student_code: 'STU118', name: 'Pooja Reddy', email: 'pooja.reddy@college.edu', phone: '9876543227', course: 'B.Sc IT', semester: 5, gender: 'Female' }
];

// Profile characteristics for realistic correlation:
// [target_attendance_prob, target_marks_mean]
const studentProfiles = {
  1: { attProb: 0.94, marksBase: 88 }, // Aarav - Top Performer
  2: { attProb: 0.96, marksBase: 92 }, // Ananya - Department Topper
  3: { attProb: 0.62, marksBase: 48 }, // Rohan - At Risk (low att, low marks)
  4: { attProb: 0.88, marksBase: 78 }, // Priya - Above Average
  5: { attProb: 0.55, marksBase: 42 }, // Devendra - High Risk (Attendance shortage & low marks)
  6: { attProb: 0.82, marksBase: 74 }, // Sneha - Good
  7: { attProb: 0.91, marksBase: 85 }, // Vikram - High Performer
  8: { attProb: 0.95, marksBase: 90 }, // Kavya - Top Performer
  9: { attProb: 0.70, marksBase: 58 }, // Aditya - Borderline Attendance
  10: { attProb: 0.85, marksBase: 80 }, // Ishita - Good
  11: { attProb: 0.58, marksBase: 44 }, // Manish - High Risk
  12: { attProb: 0.90, marksBase: 82 }, // Riya - Good
  13: { attProb: 0.78, marksBase: 68 }, // Karthik - Average
  14: { attProb: 0.84, marksBase: 76 }, // Meera - Good
  15: { attProb: 0.60, marksBase: 49 }, // Zaid - At Risk
  16: { attProb: 0.93, marksBase: 89 }, // Tanvi - Excellent
  17: { attProb: 0.76, marksBase: 65 }, // Abhinav - Average
  18: { attProb: 0.89, marksBase: 81 }  // Pooja - Good
};

const subjectsByCourse = {
  'B.Tech CSE': ['Data Structures', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Web Technologies'],
  'B.Tech AI & DS': ['Machine Learning', 'Data Structures', 'Database Systems', 'Linear Algebra & Stats', 'Python Programming'],
  'BCA': ['Web Development', 'Database Management', 'Object-Oriented Java', 'Data Structures', 'Computer Networks'],
  'B.Sc IT': ['Software Engineering', 'Information Security', 'Web Technologies', 'Database Systems', 'Operating Systems']
};

const dates = [
  '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
  '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-14',
  '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-21',
  '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28'
];

function generateSampleAttendance(students) {
  const records = [];
  students.forEach((stu, index) => {
    const profileIdx = (index % 18) + 1;
    const profile = studentProfiles[profileIdx] || { attProb: 0.8, marksBase: 70 };
    dates.forEach(date => {
      // Deterministic pseudo-random generation based on index and date
      const hash = (profileIdx * 37 + date.charCodeAt(9) * 19 + date.charCodeAt(8) * 11) % 100;
      const status = (hash / 100) < profile.attProb ? 'Present' : 'Absent';
      records.push({
        student_id: stu.id,
        date: date,
        subject: 'General Attendance',
        status: status,
        remarks: status === 'Absent' ? 'Unexcused leave' : 'On-time'
      });
    });
  });
  return records;
}

function generateSampleMarks(students) {
  const marksRecords = [];
  students.forEach((stu, index) => {
    const profileIdx = (index % 18) + 1;
    const profile = studentProfiles[profileIdx] || { marksBase: 70 };
    const subjects = subjectsByCourse[stu.course] || ['Data Structures', 'Database Systems', 'Web Technologies'];
    
    subjects.forEach((subj, subjIdx) => {
      // Internal Test 1 (Out of 25)
      const baseVariation1 = ((profileIdx * 7 + subjIdx * 13) % 15) - 7;
      const pct1 = Math.min(98, Math.max(30, profile.marksBase + baseVariation1));
      const score1 = Math.round((pct1 / 100) * 25 * 10) / 10;
      
      marksRecords.push({
        student_id: stu.id,
        subject: subj,
        exam_type: 'Internal Test 1',
        marks_obtained: Math.min(25, Math.max(0, score1)),
        max_marks: 25,
        semester: stu.semester
      });

      // Midterm Exam (Out of 50)
      const baseVariation2 = ((profileIdx * 11 + subjIdx * 17) % 15) - 7;
      const pct2 = Math.min(99, Math.max(28, profile.marksBase + baseVariation2));
      const score2 = Math.round((pct2 / 100) * 50 * 10) / 10;
      
      marksRecords.push({
        student_id: stu.id,
        subject: subj,
        exam_type: 'Midterm Exam',
        marks_obtained: Math.min(50, Math.max(0, score2)),
        max_marks: 50,
        semester: stu.semester
      });

      // Assignment Score (Out of 25)
      const baseVariation3 = ((profileIdx * 5 + subjIdx * 7) % 10) - 4;
      const pct3 = Math.min(100, Math.max(35, profile.marksBase + baseVariation3 + 5)); // Assignments generally slightly higher
      const score3 = Math.round((pct3 / 100) * 25 * 10) / 10;

      marksRecords.push({
        student_id: stu.id,
        subject: subj,
        exam_type: 'Assignment',
        marks_obtained: Math.min(25, Math.max(0, score3)),
        max_marks: 25,
        semester: stu.semester
      });
    });
  });
  return marksRecords;
}

module.exports = {
  sampleStudents,
  generateSampleAttendance,
  generateSampleMarks
};
