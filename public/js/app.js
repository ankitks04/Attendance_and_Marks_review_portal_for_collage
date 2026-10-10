/**
 * College Attendance & Performance Analytics System - Frontend Application
 */

const state = {
  currentPage: 'dashboard',
  students: [],
  attendanceRecords: [],
  studentSummary: [],
  marksRecords: [],
  analyticsData: null,
  dashboardData: null,
  passingThreshold: 40,
  batchAttendanceData: []
};

// --- DOM Loaded Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initUserSession();
  setupNavigation();
  setupGlobalEvents();
  loadCurrentPageData();
});

function initUserSession() {
  const userStr = localStorage.getItem('currentUser');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (e) {}
  }

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  state.currentUser = user;

  const isStudent = user && user.role === 'student';
  if (isStudent) {
    document.body.classList.add('role-student');
  } else {
    document.body.classList.remove('role-student');
  }

  const nameEl = document.getElementById('userNameDisplay');
  const roleEl = document.getElementById('userRoleDisplay');
  const avatarEl = document.getElementById('userAvatar');

  if (user) {
    if (nameEl) nameEl.innerText = user.name;
    if (roleEl) {
      roleEl.innerText = user.role === 'teacher' ? 'Faculty Administrator' : `Student (${user.student_code || 'STU101'})`;
    }
    if (avatarEl) {
      const parts = user.name.split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : user.name.substring(0, 2).toUpperCase();
      avatarEl.innerText = initials || 'US';
    }

    // If logged in as student, personalize banner
    if (user.role === 'student') {
      const subtitle = document.querySelector('.banner-content p');
      if (subtitle) {
        subtitle.innerHTML = `Welcome back, <strong>${escapeHtml(user.name)}</strong>! Viewing your academic performance & attendance portfolio (View-Only Mode).`;
      }
    }
  }
}

function logoutUser() {
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// -------------------------------------------------------------
// NAVIGATION & ROUTING
// -------------------------------------------------------------
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = item.getAttribute('data-page');
      navigateTo(targetPage);
    });
  });

  // Handle URL hash if present
  const hash = window.location.hash.replace('#', '');
  if (['dashboard', 'students', 'attendance', 'marks', 'analytics', 'about'].includes(hash)) {
    navigateTo(hash);
  }

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function navigateTo(pageId) {
  state.currentPage = pageId;
  window.location.hash = pageId;

  // Update Nav links
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.getAttribute('data-page') === pageId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Switch Active Page View
  document.querySelectorAll('.page-view').forEach(view => {
    if (view.id === `view-${pageId}`) {
      view.classList.add('active-view');
    } else {
      view.classList.remove('active-view');
    }
  });

  // Close mobile sidebar if open
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');

  // Update Topbar Title
  const titles = {
    dashboard: { title: 'Dashboard Overview', desc: 'Monitor student attendance, academic performance, and progress in one place.' },
    students: { title: 'Student Directory', desc: 'Manage enrolled student records, attendance rates, and academic status.' },
    attendance: { title: 'Attendance Management', desc: 'Track daily attendance logs, calculate percentages, and monitor shortages.' },
    marks: { title: 'Academic Marks & Results', desc: 'Record test scores, compute grade rankings, and evaluate pass/fail standing.' },
    analytics: { title: 'Analytics & Reports', desc: 'Advanced statistical modeling, linear regression, and downloadable reports.' },
    about: { title: 'About Project & Architecture', desc: 'System overview, data science pipeline, and presentation documentation.' }
  };

  const header = titles[pageId] || titles.dashboard;
  const titleEl = document.getElementById('topbarPageTitle');
  const descEl = document.getElementById('topbarPageSubtitle');
  if (titleEl) titleEl.innerText = header.title;
  if (descEl) descEl.innerText = header.desc;

  loadCurrentPageData();
}

function loadCurrentPageData() {
  switch (state.currentPage) {
    case 'dashboard':
      fetchDashboardData();
      break;
    case 'students':
      fetchStudents();
      break;
    case 'attendance':
      fetchAttendance();
      break;
    case 'marks':
      fetchMarks();
      break;
    case 'analytics':
      fetchAnalytics();
      break;
    case 'about':
      // Static content with dynamic sample stat tags
      break;
  }
}

// -------------------------------------------------------------
// 1. DASHBOARD VIEW CONTROLLER
// -------------------------------------------------------------
async function fetchDashboardData() {
  try {
    const res = await fetch('/api/dashboard');
    const json = await res.json();
    if (!json.success) return;

    state.dashboardData = json.data;
    const { overview, trends, gradeDistribution, subjectPerformance, atRiskStudents, recentActivities } = json.data;

    // 4 Top Statistic Cards
    document.getElementById('statTotalStudents').innerText = overview.totalStudents || 0;
    document.getElementById('statAvgAttendance').innerText = `${overview.averageAttendance || 0}%`;
    document.getElementById('statAvgMarks').innerText = `${overview.averageMarks || 0}%`;
    document.getElementById('statStudentsAtRisk').innerText = overview.studentsAtRiskCount || 0;

    // Sidebar badge
    const badge = document.getElementById('sidebarRiskBadge');
    if (badge) badge.innerText = `${overview.studentsAtRiskCount} At Risk`;

    // Render Charts
    if (trends && trends.length > 0) {
      renderAttendanceTrendChart('chartAttendanceTrend', trends);
    }
    if (subjectPerformance && subjectPerformance.length > 0) {
      renderSubjectPerformanceChart('chartSubjectPerformance', subjectPerformance);
    }
    if (gradeDistribution) {
      renderMarksDistributionChart('chartMarksDistribution', gradeDistribution);
    }

    // Render At-Risk Students Mini Table
    renderDashboardAtRiskTable(atRiskStudents);

    // Render Recent Activities Table
    renderRecentActivitiesTable(recentActivities);

  } catch (err) {
    console.error('Error fetching dashboard data:', err);
  }
}

function renderDashboardAtRiskTable(students) {
  const tbody = document.getElementById('tbodyDashboardAtRisk');
  if (!tbody) return;

  if (!students || students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--green-text);">
      <div style="font-weight: 600;">All students are in good standing! No academic risk detected.</div>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const attBadge = s.attendancePercentage < 75 ? 'badge-orange' : 'badge-green';
    const marksBadge = s.marksPercentage < 50 ? 'badge-red' : 'badge-neutral';
    return `
      <tr>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div class="student-meta">
              <h4>${escapeHtml(s.name)}</h4>
              <p>${s.student_code} • ${s.course}</p>
            </div>
          </div>
        </td>
        <td><span class="badge ${attBadge}">${s.attendancePercentage}%</span></td>
        <td><span class="badge ${marksBadge}">${s.marksPercentage}%</span></td>
        <td><span class="badge badge-orange">${escapeHtml(s.riskReasons.join(', ') || 'At Risk')}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="viewStudentModal(${s.id})">
            View Profile
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderRecentActivitiesTable(activities) {
  const tbody = document.getElementById('tbodyRecentActivity');
  if (!tbody) return;

  if (!activities || activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-muted);">No recent logs recorded.</td></tr>`;
    return;
  }

  tbody.innerHTML = activities.map(a => {
    let badgeClass = 'badge-neutral';
    if (a.action_type.includes('ADD')) badgeClass = 'badge-green';
    if (a.action_type.includes('DELETE')) badgeClass = 'badge-red';
    if (a.action_type.includes('ATTENDANCE')) badgeClass = 'badge-orange';

    return `
      <tr>
        <td><span class="badge ${badgeClass}">${a.action_type.replace('_', ' ')}</span></td>
        <td>${escapeHtml(a.description)}</td>
        <td style="color: var(--text-muted); font-size: 12px; white-space: nowrap;">${a.timestamp}</td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 2. STUDENTS MANAGEMENT VIEW
// -------------------------------------------------------------
async function fetchStudents() {
  try {
    const search = document.getElementById('studentSearchInput')?.value || '';
    const course = document.getElementById('studentCourseFilter')?.value || 'All';
    const semester = document.getElementById('studentSemesterFilter')?.value || 'All';
    const status = document.getElementById('studentStatusFilter')?.value || 'All';

    const url = `/api/students?search=${encodeURIComponent(search)}&course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) return;

    state.students = json.data;
    renderStudentsTable(state.students);

    // Populate student dropdowns in marks/attendance modals
    populateStudentDropdowns(state.students);
  } catch (err) {
    console.error('Error fetching students:', err);
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('tbodyStudents');
  const countEl = document.getElementById('studentCountBadge');
  if (countEl) countEl.innerText = `${students.length} Records`;
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 30px; color: var(--text-muted);">
      No students found matching your criteria. Try adjusting your search or filters.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    let attColor = 'green';
    if (s.attendancePercentage < 60) attColor = 'red';
    else if (s.attendancePercentage < 75) attColor = 'orange';

    let marksBadge = 'badge-green';
    if (s.marksPercentage < 40) marksBadge = 'badge-red';
    else if (s.marksPercentage < 60) marksBadge = 'badge-orange';

    let statusBadge = 'badge-green';
    if (s.riskLevel === 'Critical Risk') statusBadge = 'badge-red';
    else if (s.riskLevel === 'At Risk') statusBadge = 'badge-orange';

    return `
      <tr>
        <td><strong>${s.student_code}</strong></td>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div class="student-meta">
              <h4>${escapeHtml(s.name)}</h4>
              <p>${escapeHtml(s.email)}</p>
            </div>
          </div>
        </td>
        <td>${escapeHtml(s.course)}</td>
        <td>Sem ${s.semester}</td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-track">
              <div class="progress-fill ${attColor}" style="width: ${Math.min(100, s.attendancePercentage)}%;"></div>
            </div>
            <span class="progress-text">${s.attendancePercentage}%</span>
          </div>
        </td>
        <td><span class="badge ${marksBadge}">${s.marksPercentage}%</span></td>
        <td><span class="badge ${statusBadge}">${s.riskLevel}</span></td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon-action" title="View Profile" onclick="viewStudentModal(${s.id})">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            ${(!state.currentUser || state.currentUser.role !== 'student') ? `
            <button class="btn-icon-action" title="Edit Student" onclick="openEditStudentModal(${s.id})">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button class="btn-icon-action delete" title="Delete Student" onclick="deleteStudent(${s.id}, '${escapeHtml(s.name)}')">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 3. ATTENDANCE MANAGEMENT VIEW
// -------------------------------------------------------------
async function fetchAttendance() {
  try {
    const course = document.getElementById('attCourseFilter')?.value || 'All';
    const semester = document.getElementById('attSemesterFilter')?.value || 'All';
    const date = document.getElementById('attDateFilter')?.value || '';

    const url = `/api/attendance?course=${encodeURIComponent(course)}&semester=${encodeURIComponent(semester)}&date=${encodeURIComponent(date)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) return;

    state.attendanceRecords = json.records || [];
    state.studentSummary = json.studentSummary || [];

    renderAttendanceSummaryTable(state.studentSummary);
    renderAttendanceLogTable(state.attendanceRecords);
    renderAttendanceShortageList(json.shortageList || []);
  } catch (err) {
    console.error('Error fetching attendance:', err);
  }
}

function renderAttendanceSummaryTable(summary) {
  const tbody = document.getElementById('tbodyAttendanceSummary');
  if (!tbody) return;

  if (summary.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No summary records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = summary.map(s => {
    let color = 'green';
    let badgeClass = 'badge-green';
    if (s.percentage < 60) {
      color = 'red';
      badgeClass = 'badge-red';
    } else if (s.percentage < 75) {
      color = 'orange';
      badgeClass = 'badge-orange';
    }

    return `
      <tr>
        <td><strong>${s.student_code}</strong></td>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.course)} (Sem ${s.semester})</td>
        <td>${s.present} / ${s.total}</td>
        <td>${s.absent}</td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-track">
              <div class="progress-fill ${color}" style="width: ${Math.min(100, s.percentage)}%;"></div>
            </div>
            <span class="progress-text">${s.percentage}%</span>
          </div>
        </td>
        <td><span class="badge ${badgeClass}">${s.statusBadge}</span></td>
      </tr>
    `;
  }).join('');
}

function renderAttendanceLogTable(records) {
  const tbody = document.getElementById('tbodyAttendanceLogs');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--text-muted);">No attendance entries matching this date/class filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = records.slice(0, 50).map(r => {
    const statusBadge = r.status === 'Present' ? 'badge-green' : 'badge-red';
    return `
      <tr>
        <td>${r.date}</td>
        <td><strong>${r.student_code}</strong></td>
        <td>${escapeHtml(r.student_name)}</td>
        <td>${escapeHtml(r.course)} (Sem ${r.semester})</td>
        <td>${escapeHtml(r.subject)}</td>
        <td><span class="badge ${statusBadge}">${r.status}</span></td>
        <td>
          ${(!state.currentUser || state.currentUser.role !== 'student') ? `
          <button class="btn-icon-action delete" title="Delete Entry" onclick="deleteAttendance(${r.id})">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>` : `<span style="color: var(--text-light); font-size: 11.5px; font-weight: 500;">Logged</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderAttendanceShortageList(shortage) {
  const container = document.getElementById('shortageListContainer');
  const countEl = document.getElementById('shortageCountBadge');
  if (countEl) countEl.innerText = `${shortage.length} Debarred/Warning`;
  if (!container) return;

  if (shortage.length === 0) {
    container.innerHTML = `<div style="padding: 16px; background-color: var(--green-subtle); border-radius: var(--radius-md); color: var(--green-text); font-weight: 600;">
      ✓ Excellent! No students are currently under the 75% mandatory attendance threshold.
    </div>`;
    return;
  }

  container.innerHTML = `
    <div style="background-color: var(--orange-subtle); border: 1px solid var(--orange-border); border-radius: var(--radius-md); padding: 16px; margin-bottom: 14px;">
      <h4 style="color: var(--orange-text); font-weight: 700; margin-bottom: 4px;">⚠️ Mandatory 75% Attendance Shortage Notice</h4>
      <p style="font-size: 12.5px; color: var(--text-main);">
        The following ${shortage.length} students currently have an overall attendance rate below 75%. They are at risk of exam debarment unless compensated through remedial sessions or medical sanction.
      </p>
    </div>
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Course & Sem</th>
            <th>Sessions</th>
            <th>Current Rate</th>
            <th>Deficit Sessions to 75%</th>
          </tr>
        </thead>
        <tbody>
          ${shortage.map(s => {
            // Needed = ceil((0.75 * total - present) / 0.25)
            const needed = Math.max(1, Math.ceil((0.75 * s.total - s.present) / 0.25));
            return `
              <tr>
                <td><strong>${s.student_code}</strong></td>
                <td>${escapeHtml(s.name)}</td>
                <td>${escapeHtml(s.course)} Sem-${s.semester}</td>
                <td>${s.present} / ${s.total}</td>
                <td><span class="badge badge-orange">${s.percentage}%</span></td>
                <td><span style="font-weight: 600; color: var(--orange-text);">Needs +${needed} consecutive presents</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// -------------------------------------------------------------
// 4. MARKS AND RESULTS VIEW
// -------------------------------------------------------------
async function fetchMarks() {
  try {
    const studentId = document.getElementById('marksStudentFilter')?.value || '';
    const subject = document.getElementById('marksSubjectFilter')?.value || 'All';
    const examType = document.getElementById('marksExamFilter')?.value || 'All';
    const threshold = state.passingThreshold;

    const url = `/api/marks?student_id=${encodeURIComponent(studentId)}&subject=${encodeURIComponent(subject)}&exam_type=${encodeURIComponent(examType)}&passing_threshold=${threshold}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) return;

    state.marksRecords = json.data;
    renderMarksTable(state.marksRecords);
  } catch (err) {
    console.error('Error fetching marks:', err);
  }
}

function renderMarksTable(marks) {
  const tbody = document.getElementById('tbodyMarks');
  const countBadge = document.getElementById('marksCountBadge');
  if (countBadge) countBadge.innerText = `${marks.length} Exam Records`;
  if (!tbody) return;

  if (marks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px; color: var(--text-muted);">No marks records found for this filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = marks.map(m => {
    let badgeClass = 'badge-green';
    if (m.status === 'Fail') badgeClass = 'badge-red';
    else if (m.status === 'Needs Improvement') badgeClass = 'badge-orange';

    return `
      <tr>
        <td><strong>${m.student_code}</strong></td>
        <td>${escapeHtml(m.student_name)}</td>
        <td>${escapeHtml(m.subject)}</td>
        <td><span class="badge badge-neutral">${escapeHtml(m.exam_type)}</span></td>
        <td><strong>${m.marks_obtained}</strong> / ${m.max_marks}</td>
        <td><strong>${m.percentage}%</strong></td>
        <td><span class="badge ${badgeClass}">${m.status}</span></td>
        <td>
          ${(!state.currentUser || state.currentUser.role !== 'student') ? `
          <button class="btn-icon-action delete" title="Delete Mark Record" onclick="deleteMarksRecord(${m.id})">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>` : `<span style="color: var(--text-light); font-size: 11.5px; font-weight: 500;">Recorded</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 5. ADVANCED ANALYTICS & REPORTS VIEW
// -------------------------------------------------------------
async function fetchAnalytics() {
  try {
    const threshold = state.passingThreshold;
    const res = await fetch(`/api/analytics?threshold=${threshold}`);
    const json = await res.json();
    if (!json.success) return;

    state.analyticsData = json.data;
    const a = json.data;

    // Overview Stats
    document.getElementById('analyticsMeanMarks').innerText = `${a.marksStatistics.mean}%`;
    document.getElementById('analyticsMedianMarks').innerText = `${a.marksStatistics.median}%`;
    document.getElementById('analyticsStdDevMarks').innerText = `${a.marksStatistics.stdDev}`;
    document.getElementById('analyticsVarianceMarks').innerText = `${a.marksStatistics.variance}`;
    document.getElementById('analyticsMeanAttendance').innerText = `${a.attendanceStatistics.mean}%`;
    document.getElementById('analyticsPearsonR').innerText = `${a.regressionAnalysis.correlation}`;
    document.getElementById('analyticsR2').innerText = `${a.regressionAnalysis.r2}`;
    document.getElementById('analyticsPassRate').innerText = `${a.overview.passPercentage}%`;

    // Regression Equation & Interpretation
    document.getElementById('regressionEquationDisplay').innerText = a.regressionAnalysis.equation;
    document.getElementById('regressionInterpretation').innerText = a.regressionAnalysis.interpretation;
    document.getElementById('regressionFormulaMath').innerHTML = `
      Slope (m) = <strong>${a.regressionAnalysis.slope}</strong> | 
      Intercept (c) = <strong>${a.regressionAnalysis.intercept}</strong> | 
      R² Score = <strong>${a.regressionAnalysis.r2}</strong>
    `;

    // Render Charts
    renderRegressionChart('chartRegressionScatter', a.scatterPoints, a.regressionAnalysis);
    renderAttendanceDistributionChart('chartAnalyticsAttendanceDoughnut', a.attendanceDistribution);
    renderMarksDistributionChart('chartAnalyticsMarksDistribution', a.gradeDistribution);

    // Subject Performance Ranking
    renderSubjectRankingTable(a.subjectPerformance);

    // High Attention List
    renderAttentionStudentsList(a.atRiskStudents);

  } catch (err) {
    console.error('Error fetching analytics:', err);
  }
}

function renderSubjectRankingTable(subjects) {
  const tbody = document.getElementById('tbodySubjectRanking');
  if (!tbody) return;

  tbody.innerHTML = subjects.map((s, idx) => {
    let color = 'green';
    if (s.averagePercentage < 60) color = 'orange';
    if (s.averagePercentage < 40) color = 'red';

    return `
      <tr>
        <td>#${idx + 1}</td>
        <td><strong>${escapeHtml(s.subject)}</strong></td>
        <td>
          <div class="progress-bar-container">
            <div class="progress-track">
              <div class="progress-fill ${color}" style="width: ${Math.min(100, s.averagePercentage)}%;"></div>
            </div>
            <span class="progress-text">${s.averagePercentage}%</span>
          </div>
        </td>
        <td>${s.totalEntries} Assessments</td>
        <td>
          <span class="badge ${s.averagePercentage >= 75 ? 'badge-green' : (s.averagePercentage >= 60 ? 'badge-neutral' : 'badge-orange')}">
            ${s.averagePercentage >= 75 ? 'High Scoring' : (s.averagePercentage >= 60 ? 'Average Difficulty' : 'Needs Academic Attention')}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAttentionStudentsList(students) {
  const tbody = document.getElementById('tbodyAttentionStudents');
  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--green-text);">No students currently require academic support!</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    return `
      <tr>
        <td><strong>${s.student_code}</strong></td>
        <td>
          <div class="student-cell">
            <div class="student-avatar">${s.name.charAt(0)}</div>
            <div class="student-meta">
              <h4>${escapeHtml(s.name)}</h4>
              <p>${escapeHtml(s.course)} Sem-${s.semester}</p>
            </div>
          </div>
        </td>
        <td><span class="badge ${s.attendancePercentage < 75 ? 'badge-orange' : 'badge-green'}">${s.attendancePercentage}%</span></td>
        <td><span class="badge ${s.marksPercentage < 50 ? 'badge-red' : 'badge-neutral'}">${s.marksPercentage}%</span></td>
        <td><span class="badge badge-orange">${escapeHtml(s.riskReasons.join('; ') || 'At Risk')}</span></td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------
// 6. MODALS & FORMS HANDLING
// -------------------------------------------------------------
function openModal(modalId) {
  if (state.currentUser && state.currentUser.role === 'student') {
    if (['modalAddStudent', 'modalEditStudent', 'modalAddMarks', 'modalSingleAttendance', 'modalBatchAttendance'].includes(modalId)) {
      showToast('Student accounts have view-only rights.', 'warning');
      return;
    }
  }
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('show');
}

function populateStudentDropdowns(students) {
  const selects = ['marksStudentSelect', 'attSingleStudentSelect'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const currentVal = el.value;
    el.innerHTML = '<option value="">-- Select Student --</option>' +
      students.map(s => `<option value="${s.id}">${s.student_code} - ${escapeHtml(s.name)} (${s.course})</option>`).join('');
    if (currentVal) el.value = currentVal;
  });
}

// Add Student Form Submission
async function handleAddStudentSubmit(e) {
  e.preventDefault();
  const payload = {
    student_code: document.getElementById('addStuCode').value.trim(),
    name: document.getElementById('addStuName').value.trim(),
    email: document.getElementById('addStuEmail').value.trim(),
    phone: document.getElementById('addStuPhone').value.trim(),
    course: document.getElementById('addStuCourse').value,
    semester: Number(document.getElementById('addStuSemester').value),
    gender: document.getElementById('addStuGender').value
  };

  if (!payload.name || !payload.email || !payload.course) {
    showToast('Please fill all required student details.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Student registered successfully!', 'success');
      closeModal('modalAddStudent');
      document.getElementById('formAddStudent').reset();
      fetchStudents();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Failed to add student.', 'error');
    }
  } catch (err) {
    showToast('Network error while saving student.', 'error');
  }
}

// View Student Profile Modal
async function viewStudentModal(studentId) {
  try {
    const res = await fetch(`/api/students/${studentId}`);
    const json = await res.json();
    if (!json.success) return;

    const { student, attendanceSummary, marksSummary, attendanceRecords, marksRecords } = json.data;

    document.getElementById('viewStuName').innerText = student.name;
    document.getElementById('viewStuCode').innerText = `${student.student_code} • ${student.course} Semester ${student.semester}`;
    document.getElementById('viewStuEmail').innerText = student.email;
    document.getElementById('viewStuPhone').innerText = student.phone || 'N/A';
    document.getElementById('viewStuGender').innerText = student.gender;
    document.getElementById('viewStuCreated').innerText = student.created_at || 'Registered';

    // Summary stats
    document.getElementById('viewStuAttPct').innerText = `${attendanceSummary.percentage}%`;
    document.getElementById('viewStuAttSessions').innerText = `${attendanceSummary.present} Present / ${attendanceSummary.total} Total`;
    document.getElementById('viewStuMarksPct').innerText = `${marksSummary.percentage}%`;
    document.getElementById('viewStuMarksScore').innerText = `${marksSummary.totalObtained} / ${marksSummary.totalMax}`;

    // Subject breakdown table
    const marksTbody = document.getElementById('viewStuMarksTbody');
    if (marksRecords.length === 0) {
      marksTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 12px;">No marks recorded yet.</td></tr>`;
    } else {
      marksTbody.innerHTML = marksRecords.map(m => {
        const pct = m.max_marks > 0 ? ((m.marks_obtained / m.max_marks) * 100).toFixed(1) : 0;
        return `
          <tr>
            <td><strong>${escapeHtml(m.subject)}</strong></td>
            <td>${escapeHtml(m.exam_type)}</td>
            <td>${m.marks_obtained} / ${m.max_marks}</td>
            <td><span class="badge ${pct >= 60 ? 'badge-green' : (pct >= 40 ? 'badge-orange' : 'badge-red')}">${pct}%</span></td>
          </tr>
        `;
      }).join('');
    }

    // Recent attendance list
    const attTbody = document.getElementById('viewStuAttTbody');
    if (attendanceRecords.length === 0) {
      attTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 12px;">No attendance logged yet.</td></tr>`;
    } else {
      attTbody.innerHTML = attendanceRecords.slice(0, 10).map(a => `
        <tr>
          <td>${a.date}</td>
          <td>${escapeHtml(a.subject)}</td>
          <td><span class="badge ${a.status === 'Present' ? 'badge-green' : 'badge-red'}">${a.status}</span></td>
          <td style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(a.remarks || '-')}</td>
        </tr>
      `).join('');
    }

    openModal('modalViewStudent');
  } catch (err) {
    showToast('Failed to load student profile.', 'error');
  }
}

// Edit Student Modal
async function openEditStudentModal(studentId) {
  try {
    const res = await fetch(`/api/students/${studentId}`);
    const json = await res.json();
    if (!json.success) return;

    const s = json.data.student;
    document.getElementById('editStuId').value = s.id;
    document.getElementById('editStuCode').value = s.student_code;
    document.getElementById('editStuName').value = s.name;
    document.getElementById('editStuEmail').value = s.email;
    document.getElementById('editStuPhone').value = s.phone || '';
    document.getElementById('editStuCourse').value = s.course;
    document.getElementById('editStuSemester').value = s.semester;
    document.getElementById('editStuGender').value = s.gender;

    openModal('modalEditStudent');
  } catch (err) {
    showToast('Could not open edit modal.', 'error');
  }
}

async function handleEditStudentSubmit(e) {
  e.preventDefault();
  const studentId = document.getElementById('editStuId').value;
  const payload = {
    student_code: document.getElementById('editStuCode').value.trim(),
    name: document.getElementById('editStuName').value.trim(),
    email: document.getElementById('editStuEmail').value.trim(),
    phone: document.getElementById('editStuPhone').value.trim(),
    course: document.getElementById('editStuCourse').value,
    semester: Number(document.getElementById('editStuSemester').value),
    gender: document.getElementById('editStuGender').value
  };

  try {
    const res = await fetch(`/api/students/${studentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Student updated successfully!', 'success');
      closeModal('modalEditStudent');
      fetchStudents();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Update failed.', 'error');
    }
  } catch (err) {
    showToast('Error saving changes.', 'error');
  }
}

// Delete Student
async function deleteStudent(studentId, studentName) {
  if (state.currentUser && state.currentUser.role === 'student') {
    showToast('Student accounts have view-only rights.', 'warning');
    return;
  }
  if (!confirm(`Are you sure you want to delete student "${studentName}"? This will permanently remove all associated attendance and marks records.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/students/${studentId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(`Student ${studentName} deleted.`, 'success');
      fetchStudents();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Failed to delete student.', 'error');
    }
  } catch (err) {
    showToast('Error deleting student.', 'error');
  }
}

// Add Marks Form Submission
async function handleAddMarksSubmit(e) {
  e.preventDefault();
  const payload = {
    student_id: Number(document.getElementById('marksStudentSelect').value),
    subject: document.getElementById('marksSubjectInput').value.trim(),
    exam_type: document.getElementById('marksExamTypeSelect').value,
    marks_obtained: Number(document.getElementById('marksObtainedInput').value),
    max_marks: Number(document.getElementById('marksMaxInput').value),
    semester: Number(document.getElementById('marksSemesterInput').value || 1)
  };

  if (!payload.student_id || !payload.subject || isNaN(payload.marks_obtained) || isNaN(payload.max_marks)) {
    showToast('Please fill all required mark details properly.', 'error');
    return;
  }

  if (payload.marks_obtained < 0 || payload.marks_obtained > payload.max_marks) {
    showToast(`Marks obtained must be between 0 and ${payload.max_marks}.`, 'error');
    return;
  }

  try {
    const res = await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Marks added successfully!', 'success');
      closeModal('modalAddMarks');
      document.getElementById('formAddMarks').reset();
      fetchMarks();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Failed to record marks.', 'error');
    }
  } catch (err) {
    showToast('Error recording marks.', 'error');
  }
}

// Delete Mark Record
async function deleteMarksRecord(markId) {
  if (state.currentUser && state.currentUser.role === 'student') {
    showToast('Student accounts have view-only rights.', 'warning');
    return;
  }
  if (!confirm('Are you sure you want to delete this mark entry?')) return;
  try {
    const res = await fetch(`/api/marks/${markId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Marks record deleted.', 'success');
      fetchMarks();
      fetchDashboardData();
    }
  } catch (err) {
    showToast('Error deleting mark entry.', 'error');
  }
}

// Mark Single Attendance Submission
async function handleSingleAttendanceSubmit(e) {
  e.preventDefault();
  const payload = {
    student_id: Number(document.getElementById('attSingleStudentSelect').value),
    date: document.getElementById('attSingleDateInput').value,
    subject: document.getElementById('attSingleSubjectInput').value.trim() || 'General Attendance',
    status: document.getElementById('attSingleStatusSelect').value,
    remarks: document.getElementById('attSingleRemarksInput').value.trim()
  };

  if (!payload.student_id || !payload.date || !payload.status) {
    showToast('Please select Student, Date, and Status.', 'error');
    return;
  }

  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Attendance recorded.', 'success');
      closeModal('modalSingleAttendance');
      fetchAttendance();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Failed to mark attendance.', 'error');
    }
  } catch (err) {
    showToast('Error marking attendance.', 'error');
  }
}

// Delete Attendance Entry
async function deleteAttendance(id) {
  if (state.currentUser && state.currentUser.role === 'student') {
    showToast('Student accounts have view-only rights.', 'warning');
    return;
  }
  if (!confirm('Delete this attendance entry?')) return;
  try {
    const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Attendance record deleted.', 'success');
      fetchAttendance();
      fetchDashboardData();
    }
  } catch (err) {
    showToast('Error deleting attendance.', 'error');
  }
}

// Batch Attendance Sheet
function openBatchAttendanceModal() {
  const dateInput = document.getElementById('batchAttDate');
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  populateBatchAttendanceGrid();
  openModal('modalBatchAttendance');
}

function populateBatchAttendanceGrid() {
  const courseFilter = document.getElementById('batchAttCourseFilter')?.value || 'All';
  let filtered = state.students;
  if (courseFilter !== 'All') {
    filtered = filtered.filter(s => s.course === courseFilter);
  }

  state.batchAttendanceData = filtered.map(s => ({
    student_id: s.id,
    student_code: s.student_code,
    name: s.name,
    course: s.course,
    status: 'Present'
  }));

  renderBatchAttendanceRows();
}

function renderBatchAttendanceRows() {
  const tbody = document.getElementById('tbodyBatchAttendance');
  if (!tbody) return;

  if (state.batchAttendanceData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 18px;">No students match this course.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.batchAttendanceData.map((item, idx) => `
    <tr>
      <td><strong>${item.student_code}</strong></td>
      <td>${escapeHtml(item.name)} (${item.course})</td>
      <td>
        <button type="button" class="btn btn-sm ${item.status === 'Present' ? 'btn-primary' : 'btn-outline'}" onclick="toggleBatchStatus(${idx}, 'Present')">
          Present
        </button>
        <button type="button" class="btn btn-sm ${item.status === 'Absent' ? 'btn-orange' : 'btn-outline'}" onclick="toggleBatchStatus(${idx}, 'Absent')">
          Absent
        </button>
      </td>
      <td><span class="badge ${item.status === 'Present' ? 'badge-green' : 'badge-red'}">${item.status}</span></td>
    </tr>
  `).join('');
}

function toggleBatchStatus(index, newStatus) {
  if (state.batchAttendanceData[index]) {
    state.batchAttendanceData[index].status = newStatus;
    renderBatchAttendanceRows();
  }
}

function setAllBatchStatus(status) {
  state.batchAttendanceData.forEach(item => {
    item.status = status;
  });
  renderBatchAttendanceRows();
}

async function handleBatchAttendanceSubmit() {
  const date = document.getElementById('batchAttDate').value;
  const subject = document.getElementById('batchAttSubject').value.trim() || 'General Attendance';

  if (!date || state.batchAttendanceData.length === 0) {
    showToast('Please select a valid date and at least one student.', 'error');
    return;
  }

  const payload = {
    date: date,
    subject: subject,
    entries: state.batchAttendanceData.map(item => ({
      student_id: item.student_id,
      status: item.status
    }))
  };

  try {
    const res = await fetch('/api/attendance/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Batch attendance saved!', 'success');
      closeModal('modalBatchAttendance');
      fetchAttendance();
      fetchDashboardData();
    } else {
      showToast(json.message || 'Failed to save batch attendance.', 'error');
    }
  } catch (err) {
    showToast('Error saving batch attendance.', 'error');
  }
}

// -------------------------------------------------------------
// 7. LINEAR REGRESSION PREDICTOR & PASS THRESHOLD
// -------------------------------------------------------------
function calculatePredictedMarks() {
  const attInput = document.getElementById('predictorAttendanceInput');
  const resultEl = document.getElementById('predictorMarksResult');
  if (!attInput || !resultEl) return;

  const att = Number(attInput.value);
  if (isNaN(att) || att < 0 || att > 100) {
    resultEl.innerText = 'Please enter an attendance between 0 and 100%.';
    return;
  }

  if (state.analyticsData && state.analyticsData.regressionAnalysis) {
    const { slope, intercept } = state.analyticsData.regressionAnalysis;
    const predicted = Math.max(0, Math.min(100, (slope * att + intercept))).toFixed(1);
    resultEl.innerHTML = `Predicted Marks: <span style="font-weight: 700; color: var(--green-primary); font-size: 18px;">${predicted}%</span> (Based on y = ${slope}x + ${intercept})`;
  }
}

function handleThresholdChange(val) {
  state.passingThreshold = Number(val);
  const display = document.getElementById('thresholdDisplay');
  if (display) display.innerText = `${val}%`;
  
  if (state.currentPage === 'marks') fetchMarks();
  if (state.currentPage === 'analytics') fetchAnalytics();
  if (state.currentPage === 'dashboard') fetchDashboardData();
}

// -------------------------------------------------------------
// 8. DATA EXPORTS & ACTIONS
// -------------------------------------------------------------
function exportData(type) {
  window.location.href = `/api/export/csv/${type}`;
  showToast(`Downloading ${type} CSV export...`, 'info');
}

function printReport() {
  window.print();
}

async function resetSampleData() {
  if (state.currentUser && state.currentUser.role === 'student') {
    showToast('Student accounts have view-only rights.', 'warning');
    return;
  }
  if (!confirm('Reset database to realistic sample dataset? This will restore 18 diverse college students, full attendance records, and exam marks.')) {
    return;
  }
  try {
    const res = await fetch('/api/system/reset-sample', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      showToast('Sample dataset restored successfully!', 'success');
      loadCurrentPageData();
    }
  } catch (err) {
    showToast('Error resetting dataset.', 'error');
  }
}

async function clearAllData() {
  if (state.currentUser && state.currentUser.role === 'student') {
    showToast('Student accounts have view-only rights.', 'warning');
    return;
  }
  if (!confirm('Are you sure you want to clear ALL student records, attendance, and marks? The system will be empty until you re-seed or add new records.')) {
    return;
  }
  try {
    const res = await fetch('/api/system/clear', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      showToast('All records cleared.', 'warning');
      loadCurrentPageData();
    }
  } catch (err) {
    showToast('Error clearing database.', 'error');
  }
}

// -------------------------------------------------------------
// 9. TOAST NOTIFICATIONS & UTILITIES
// -------------------------------------------------------------
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `
    <div style="font-weight: 700; font-size: 16px;">${icon}</div>
    <div style="font-size: 13px; font-weight: 500;">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global Event Listeners
function setupGlobalEvents() {
  // Modal Backdrop Click to close
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('show');
    });
  });

  // Topbar Search Input - live filters
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      if (state.currentPage === 'students') {
        const studentSearch = document.getElementById('studentSearchInput');
        if (studentSearch) {
          studentSearch.value = q;
          fetchStudents();
        }
      }
    });
  }

  // Pre-fill today's date in attendance forms
  const today = new Date().toISOString().split('T')[0];
  const singleDate = document.getElementById('attSingleDateInput');
  if (singleDate) singleDate.value = today;
  const batchDate = document.getElementById('batchAttDate');
  if (batchDate) batchDate.value = today;
}
