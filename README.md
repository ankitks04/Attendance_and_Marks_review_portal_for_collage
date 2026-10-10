# College Attendance & Performance Analytics System 🎓

A complete, professional, full-stack web application designed for academic institutions to monitor student attendance, evaluate multi-subject performance, perform statistical data science analysis, and detect students at academic risk in real time.

Built with a clean college management dashboard design featuring a **light cream background**, **crisp white cards**, **emerald green accents**, and **warm orange highlights**.

---

## 🔑 Login Credentials

The portal features role-based authentication with dedicated **Teacher / Faculty** and **Student** views:

* **Login Page:** [http://localhost:3000/login](http://localhost:3000/login) (or `/login.html`)
* **Dashboard Page:** [http://localhost:3000/](http://localhost:3000/)

| Role | Username | Password | Access Rights / Profile |
| :--- | :--- | :--- | :--- |
| 👨‍🏫 **Teacher / Faculty** | `teacher` | `teacher123` | Full administrative control: Add/Edit/Delete students, Take Batch Attendance, Enter Marks, Configure Pass Threshold |
| 👨‍💼 **Administrator** | `admin` | `admin123` | Full department administrator rights |
| 🎓 **Student** | `student` | `student123` | Student view linked to **Aarav Sharma (STU101)**: View personal attendance, grades transcript, analytics |
| 🎓 **Student (Alt)** | `student1` | `pass123` | Alternative student account (**John Doe**) |

> **Tip:** The login page includes interactive **"Auto-Fill"** buttons for one-click testing without manual typing!

### 1. Dashboard Overview
* **4 Executive KPI Statistic Cards:**
  1. **Total Students:** Real-time count of enrolled students across departments.
  2. **Average Attendance:** Institutional average with ≥75% regulatory benchmark.
  3. **Average Marks:** Cohort-wide academic performance average.
  4. **Students at Risk:** Dynamic warning badge highlighting students with low attendance or failing scores.
* **Attendance Trend Line Chart:** Daily attendance rate progression over time.
* **Subject Performance Bar Chart:** Class-average score comparisons across core subjects.
* **Marks Distribution Chart:** Categorization into Distinction (≥75%), First Class (60–74%), Second Class (50–59%), Pass (40–49%), and Fail (<40%).
* **Recent Activity Log:** Live database audit trail for student additions, updates, attendance, and exam entries.
* **Students Needing Academic Attention Section:** Quick action table flagging attendance shortage or low scores.

### 2. Student Directory & Management
* Searchable and filterable student roster (search by Name, Roll Code, Email; filter by Course, Semester, and Academic Status).
* Complete CRUD operations: Add new students (with field validation), Edit details, View full student profile, and Delete.
* **Student Profile Modal:** View cumulative attendance percentage, exam transcripts, subject scores, and history.

### 3. Attendance Tracking & Shortage Analysis
* **Batch Attendance Marking Sheet:** Easily take attendance for an entire classroom roster with "Mark All Present" / "Mark All Absent" and quick toggle buttons.
* **Single Attendance Log:** Record individual session entries with subject and remarks (e.g., Medical leave, On-duty).
* **Automated Percentage Calculation:** Automatic calculation of present sessions vs total lectures.
* **75% Mandatory Attendance Shortage Warning:** Dedicated callout table identifying debarred students with a **Deficit Counter** showing exactly how many consecutive sessions they need to attend to regain eligibility.

### 4. Marks & Results Management
* Record Internal Tests (out of 25), Midterm Exams (out of 50), Assignments, and Semester Finals.
* Input validation ensuring $0 \le \text{Marks} \le \text{Max Marks}$.
* **Configurable Passing Threshold:** Interactive slider (30% to 60%) that re-evaluates all grades across Pass, Needs Improvement, and Fail in real time.
* Search and filter marks by student and subject.

### 5. Advanced Data Science & Statistical Engine
Calculated directly from persistent database records using rigorous mathematical formulations:
* **Descriptive Statistics:**
  * Mean ($\mu$), Median, and Mode of marks and attendance.
  * Sample Variance ($\sigma^2$) and Standard Deviation ($\sigma$).
* **Pearson Correlation Coefficient ($r$):**
  $$r = \frac{n \sum (xy) - \sum x \sum y}{\sqrt{[n \sum x^2 - (\sum x)^2][n \sum y^2 - (\sum y)^2]}}$$
  Evaluates the linear relationship between student attendance and academic scores ($r \approx 0.95$, strong positive correlation).
* **Simple Linear Regression Model ($y = mx + c$):**
  $$\hat{y} = mx + c$$
  Where $m$ is the slope, $c$ is the intercept, and $R^2$ measures goodness of fit.
* **Interactive Marks Predictor Calculator:** Input any projected attendance percentage (e.g., 85%) to predict expected examination marks.
* **Visualizations:** Scatter plot with fitted regression trendline, attendance distribution doughnut chart, and curriculum difficulty ranking.

### 6. Reports & Data Exports
* **Export to CSV:** Direct CSV downloads for Student Records, Academic Marks, Attendance Logs, and Statistical Summaries.
* **Printable Official Report:** Dedicated `@media print` layout featuring college letterhead, official date stamps, Dean/HOD signature blocks, and printable tables.

### 7. Sample Data & First-Time Experience
* Pre-populated with **18 diverse college students** across B.Tech Computer Science, AI & Data Science, BCA, and B.Sc IT.
* Realistic attendance records across 20 dates and multi-subject examination scores.
* "Reset Sample Data" and "Clear Database" options for demonstration purposes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Custom Responsive Design System), JavaScript (ES6+), Chart.js (Cached Locally) |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite3 (`database.db`) with persistent storage and cascading relational constraints |
| **Data Analysis** | Native Statistical & Regression Analytics Engine (`analytics-engine.js`) |
| **Dependencies** | `express`, `sqlite3`, `body-parser` |

---

## 🚀 How to Run the Project

### Prerequisites
* **Node.js** (v16 or higher) installed on your system.

### Starting the Application

1. Open your terminal in the project directory:
   ```bash
   cd "c:\Collage project"
   ```

2. Start the Express server:
   ```bash
   npm start
   # or
   node server.js
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

The dashboard will open populated with realistic sample data.

---

## 📁 Project Structure

```
c:\Collage project\
├── server.js               # Express application controller & REST API routes
├── analytics-engine.js     # Statistical compute engine (Mean, StdDev, Pearson r, Regression)
├── sample-data.js          # Realistic college dataset generator & seeder
├── database.db             # Local persistent SQLite database
├── package.json            # Project dependencies and startup scripts
├── README.md               # Complete documentation and viva guide
└── public/                 # Static web assets
    ├── index.html          # Main single-page application layout
    ├── dashboard.html      # Legacy redirect helper
    ├── css/
    │   └── styles.css      # College dashboard stylesheet with print formatting
    ├── js/
    │   ├── app.js          # Frontend controllers, modals, filters, and API handlers
    │   └── charts.js       # Chart.js visualization configurations
    └── vendor/
        └── chart.umd.min.js# Locally cached Chart.js library
```

---

## 📡 REST API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/dashboard` | `GET` | Fetches 4 KPI stats, recent trends, grade distribution, and at-risk students |
| `/api/students` | `GET` | Retrieves all students with calculated attendance % and marks % |
| `/api/students` | `POST` | Registers a new student record |
| `/api/students/:id`| `GET` | Fetches single student profile, transcript, and attendance logs |
| `/api/students/:id`| `PUT` | Updates student details |
| `/api/students/:id`| `DELETE`| Cascades delete for student, marks, and attendance |
| `/api/attendance` | `GET` | Retrieves attendance logs and shortage list (<75%) |
| `/api/attendance` | `POST` | Records attendance for a single student |
| `/api/attendance/batch` | `POST`| Marks attendance for an entire classroom roster |
| `/api/marks` | `GET` | Retrieves marks records with configurable pass threshold |
| `/api/marks` | `POST` | Records internal test or exam score |
| `/api/analytics` | `GET` | Returns full statistical parameters, correlation, and regression |
| `/api/export/csv/:type` | `GET` | Downloads CSV export (`students`, `marks`, `attendance`, `analytics-summary`) |
| `/api/system/reset-sample` | `POST`| Re-seeds 18 realistic sample students, attendance, and marks |
| `/api/system/clear` | `POST`| Clears all database tables for a fresh start |

---

## 🎓 College Viva & Presentation Guide

### 1. What is the business problem addressed by this project?
Traditional college management portals merely store records without analytical foresight. This system applies statistical analytics to correlate student attendance with academic performance, enabling educators to intervene before students fail or face exam debarment due to attendance shortages.

### 2. Why is Pearson Correlation ($r$) significant here?
Pearson's $r$ quantifies the strength and direction of the linear relationship between attendance ($x$) and marks ($y$). An $r$ value close to $+1.0$ statistically proves that higher classroom attendance directly correlates with higher academic achievement.

### 3. What does the Coefficient of Determination ($R^2$) tell us?
$R^2$ represents the proportion of variance in marks explained by attendance. An $R^2 \approx 0.90$ indicates that 90% of the variance in test scores is directly attributable to lecture attendance patterns.

### 4. How does the system enforce data integrity?
Foreign keys with `ON DELETE CASCADE` ensure that deleting a student cleanly removes all corresponding attendance logs and exam scores without leaving orphaned records.
