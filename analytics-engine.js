/**
 * Advanced Statistical & Predictive Analytics Engine
 * Implements Mean, Median, Mode, Variance, Standard Deviation,
 * Pearson Correlation Coefficient, and Simple Linear Regression (y = mx + c).
 */

function calculateMean(arr) {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

function calculateMedian(arr) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  } else {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

function calculateMode(arr) {
  if (!arr || arr.length === 0) return [];
  const freq = {};
  let maxFreq = 0;
  arr.forEach(val => {
    // Round to 1 decimal place for grouping if continuous
    const rounded = Math.round(val);
    freq[rounded] = (freq[rounded] || 0) + 1;
    if (freq[rounded] > maxFreq) maxFreq = freq[rounded];
  });
  
  if (maxFreq <= 1 && arr.length > 3) return [Math.round(calculateMean(arr))];
  const modes = [];
  for (const key in freq) {
    if (freq[key] === maxFreq) modes.push(Number(key));
  }
  return modes.slice(0, 3); // Return at most 3 modes if multi-modal
}

function calculateVariance(arr, meanVal) {
  if (!arr || arr.length <= 1) return 0;
  const mean = meanVal !== undefined ? meanVal : calculateMean(arr);
  const sumSquaredDiff = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  return sumSquaredDiff / (arr.length - 1); // Sample variance
}

function calculateStdDev(arr, meanVal) {
  return Math.sqrt(calculateVariance(arr, meanVal));
}

/**
 * Calculates Pearson Correlation Coefficient (r) between two numeric arrays
 * r = (n * Σ(xy) - Σx * Σy) / sqrt([n * Σ(x^2) - (Σx)^2] * [n * Σ(y^2) - (Σy)^2])
 */
function calculatePearsonCorrelation(xArr, yArr) {
  const n = Math.min(xArr.length, yArr.length);
  if (n <= 1) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xArr[i];
    const y = yArr[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Computes Simple Linear Regression: y = mx + c
 * m = (n * Σ(xy) - Σx * Σy) / (n * Σ(x^2) - (Σx)^2)
 * c = (Σy - m * Σx) / n
 * R^2 = r^2
 */
function calculateLinearRegression(xArr, yArr) {
  const n = Math.min(xArr.length, yArr.length);
  if (n <= 1) {
    return { slope: 0, intercept: 0, r2: 0, equation: 'y = 0', predict: () => 0 };
  }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xArr[i];
    const y = yArr[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { slope: 0, intercept: calculateMean(yArr), r2: 0, equation: `y = ${calculateMean(yArr).toFixed(2)}`, predict: () => calculateMean(yArr) };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  const r = calculatePearsonCorrelation(xArr, yArr);
  const r2 = Math.pow(r, 2);

  return {
    slope: Number(slope.toFixed(4)),
    intercept: Number(intercept.toFixed(2)),
    r: Number(r.toFixed(4)),
    r2: Number(r2.toFixed(4)),
    equation: `Marks = ${slope.toFixed(2)} × Attendance + ${intercept.toFixed(2)}`,
    predict: (attendance) => Number((slope * attendance + intercept).toFixed(1))
  };
}

/**
 * Full statistical summary of students dataset
 */
function computeComprehensiveAnalytics(studentsList, attendanceRecords, marksRecords, passingThreshold = 40) {
  // 1. Calculate per-student stats
  const studentMap = {};
  studentsList.forEach(s => {
    studentMap[s.id] = {
      ...s,
      attendancePresent: 0,
      attendanceTotal: 0,
      attendancePercentage: 0,
      marksObtainedTotal: 0,
      marksMaxTotal: 0,
      marksPercentage: 0,
      subjectMarks: {},
      status: 'Normal',
      riskLevel: 'Safe',
      riskReasons: []
    };
  });

  // Aggregate Attendance
  attendanceRecords.forEach(att => {
    if (studentMap[att.student_id]) {
      studentMap[att.student_id].attendanceTotal++;
      if (att.status === 'Present') {
        studentMap[att.student_id].attendancePresent++;
      }
    }
  });

  // Aggregate Marks
  marksRecords.forEach(m => {
    if (studentMap[m.student_id]) {
      const stu = studentMap[m.student_id];
      stu.marksObtainedTotal += m.marks_obtained;
      stu.marksMaxTotal += m.max_marks;
      
      if (!stu.subjectMarks[m.subject]) {
        stu.subjectMarks[m.subject] = { obtained: 0, max: 0 };
      }
      stu.subjectMarks[m.subject].obtained += m.marks_obtained;
      stu.subjectMarks[m.subject].max += m.max_marks;
    }
  });

  // Calculate percentages and risks
  const studentStats = Object.values(studentMap).map(stu => {
    stu.attendancePercentage = stu.attendanceTotal > 0
      ? Number(((stu.attendancePresent / stu.attendanceTotal) * 100).toFixed(1))
      : 0;

    stu.marksPercentage = stu.marksMaxTotal > 0
      ? Number(((stu.marksObtainedTotal / stu.marksMaxTotal) * 100).toFixed(1))
      : 0;

    // Determine Risk Level & Classification
    const reasons = [];
    if (stu.attendancePercentage < 75) {
      reasons.push(`Attendance Shortage (${stu.attendancePercentage}%)`);
    }
    if (stu.marksPercentage < passingThreshold) {
      reasons.push(`Below Passing Threshold (${stu.marksPercentage}%)`);
    } else if (stu.marksPercentage < 50) {
      reasons.push(`Borderline Academic Score (${stu.marksPercentage}%)`);
    }

    if (stu.attendancePercentage < 60 && stu.marksPercentage < 40) {
      stu.riskLevel = 'Critical Risk';
      stu.status = 'Critical Attention';
    } else if (stu.attendancePercentage < 75 || stu.marksPercentage < 50) {
      stu.riskLevel = 'At Risk';
      stu.status = 'Needs Improvement';
    } else if (stu.marksPercentage >= 80 && stu.attendancePercentage >= 85) {
      stu.riskLevel = 'Safe';
      stu.status = 'Excellent';
    } else {
      stu.riskLevel = 'Safe';
      stu.status = 'Good';
    }

    stu.riskReasons = reasons;
    return stu;
  });

  // Arrays for correlation and regression analysis
  const pairedData = studentStats.filter(s => s.attendanceTotal > 0 && s.marksMaxTotal > 0);
  const attendanceValues = pairedData.map(s => s.attendancePercentage);
  const marksValues = pairedData.map(s => s.marksPercentage);

  // Marks Descriptive Statistics
  const marksMean = Number(calculateMean(marksValues).toFixed(2));
  const marksMedian = Number(calculateMedian(marksValues).toFixed(2));
  const marksMode = calculateMode(marksValues);
  const marksVariance = Number(calculateVariance(marksValues, marksMean).toFixed(2));
  const marksStdDev = Number(calculateStdDev(marksValues, marksMean).toFixed(2));
  const marksMin = marksValues.length > 0 ? Math.min(...marksValues) : 0;
  const marksMax = marksValues.length > 0 ? Math.max(...marksValues) : 0;

  // Attendance Descriptive Statistics
  const attMean = Number(calculateMean(attendanceValues).toFixed(2));
  const attMedian = Number(calculateMedian(attendanceValues).toFixed(2));
  const attMode = calculateMode(attendanceValues);
  const attVariance = Number(calculateVariance(attendanceValues, attMean).toFixed(2));
  const attStdDev = Number(calculateStdDev(attendanceValues, attMean).toFixed(2));
  const attMin = attendanceValues.length > 0 ? Math.min(...attendanceValues) : 0;
  const attMax = attendanceValues.length > 0 ? Math.max(...attendanceValues) : 0;

  // Pearson Correlation & Linear Regression
  const regression = calculateLinearRegression(attendanceValues, marksValues);
  const correlation = regression.r;

  // Correlation interpretation in plain English
  let correlationText = '';
  if (correlation >= 0.7) {
    correlationText = 'Strong positive correlation. Higher class attendance strongly correlates with higher exam scores.';
  } else if (correlation >= 0.4) {
    correlationText = 'Moderate positive correlation. Better attendance generally relates to improved scores.';
  } else if (correlation >= 0) {
    correlationText = 'Weak positive correlation. Attendance shows mild relation to scores.';
  } else {
    correlationText = 'Negative or negligible correlation.';
  }

  // Regression trendline coordinates (from min to max attendance)
  const regressionPoints = [
    { x: 40, y: Math.max(0, Math.min(100, regression.predict(40))) },
    { x: 60, y: Math.max(0, Math.min(100, regression.predict(60))) },
    { x: 75, y: Math.max(0, Math.min(100, regression.predict(75))) },
    { x: 90, y: Math.max(0, Math.min(100, regression.predict(90))) },
    { x: 100, y: Math.max(0, Math.min(100, regression.predict(100))) }
  ];

  // Scatter plot points (Attendance vs Marks for each student)
  const scatterPoints = pairedData.map(s => ({
    x: s.attendancePercentage,
    y: s.marksPercentage,
    studentName: s.name,
    studentCode: s.student_code,
    course: s.course
  }));

  // Grade Distribution Brackets
  const gradeDistribution = {
    'Distinction (≥75%)': 0,
    'First Class (60-74%)': 0,
    'Second Class (50-59%)': 0,
    'Pass Class (40-49%)': 0,
    'Fail (<40%)': 0
  };

  pairedData.forEach(s => {
    if (s.marksPercentage >= 75) gradeDistribution['Distinction (≥75%)']++;
    else if (s.marksPercentage >= 60) gradeDistribution['First Class (60-74%)']++;
    else if (s.marksPercentage >= 50) gradeDistribution['Second Class (50-59%)']++;
    else if (s.marksPercentage >= passingThreshold) gradeDistribution['Pass Class (40-49%)']++;
    else gradeDistribution['Fail (<40%)']++;
  });

  // Attendance Brackets
  const attendanceDistribution = {
    'Excellent (≥85%)': 0,
    'Good (75-84%)': 0,
    'Warning (60-74%)': 0,
    'Critical (<60%)': 0
  };

  pairedData.forEach(s => {
    if (s.attendancePercentage >= 85) attendanceDistribution['Excellent (≥85%)']++;
    else if (s.attendancePercentage >= 75) attendanceDistribution['Good (75-84%)']++;
    else if (s.attendancePercentage >= 60) attendanceDistribution['Warning (60-74%)']++;
    else attendanceDistribution['Critical (<60%)']++;
  });

  // Subject Performance Averages
  const subjectTotals = {};
  marksRecords.forEach(m => {
    if (!subjectTotals[m.subject]) {
      subjectTotals[m.subject] = { obtained: 0, max: 0, count: 0 };
    }
    subjectTotals[m.subject].obtained += m.marks_obtained;
    subjectTotals[m.subject].max += m.max_marks;
    subjectTotals[m.subject].count++;
  });

  const subjectPerformance = Object.keys(subjectTotals).map(subj => {
    const item = subjectTotals[subj];
    const avgPct = item.max > 0 ? Number(((item.obtained / item.max) * 100).toFixed(1)) : 0;
    return {
      subject: subj,
      averagePercentage: avgPct,
      totalEntries: item.count
    };
  }).sort((a, b) => b.averagePercentage - a.averagePercentage);

  // Identify Students At Risk
  const atRiskStudents = studentStats.filter(s => s.riskLevel !== 'Safe');
  const passingCount = pairedData.filter(s => s.marksPercentage >= passingThreshold).length;
  const passPercentage = pairedData.length > 0 ? Number(((passingCount / pairedData.length) * 100).toFixed(1)) : 0;

  return {
    overview: {
      totalStudents: studentsList.length,
      averageAttendance: attMean,
      averageMarks: marksMean,
      studentsAtRiskCount: atRiskStudents.length,
      passPercentage: passPercentage,
      passingThreshold: passingThreshold
    },
    marksStatistics: {
      mean: marksMean,
      median: marksMedian,
      mode: marksMode,
      variance: marksVariance,
      stdDev: marksStdDev,
      min: marksMin,
      max: marksMax
    },
    attendanceStatistics: {
      mean: attMean,
      median: attMedian,
      mode: attMode,
      variance: attVariance,
      stdDev: attStdDev,
      min: attMin,
      max: attMax,
      below75Count: pairedData.filter(s => s.attendancePercentage < 75).length
    },
    regressionAnalysis: {
      slope: regression.slope,
      intercept: regression.intercept,
      correlation: regression.r,
      r2: regression.r2,
      equation: regression.equation,
      interpretation: correlationText,
      trendlinePoints: regressionPoints
    },
    scatterPoints: scatterPoints,
    gradeDistribution: gradeDistribution,
    attendanceDistribution: attendanceDistribution,
    subjectPerformance: subjectPerformance,
    studentStats: studentStats,
    atRiskStudents: atRiskStudents
  };
}

module.exports = {
  calculateMean,
  calculateMedian,
  calculateMode,
  calculateVariance,
  calculateStdDev,
  calculatePearsonCorrelation,
  calculateLinearRegression,
  computeComprehensiveAnalytics
};
