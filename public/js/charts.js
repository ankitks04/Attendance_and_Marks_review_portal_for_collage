/**
 * Chart.js Controller for College Attendance & Performance Analytics
 * Theme: Emerald Green, Warm Orange, Neutral Grays
 */

const chartInstances = {};

function destroyChart(chartId) {
  if (chartInstances[chartId]) {
    chartInstances[chartId].destroy();
    delete chartInstances[chartId];
  }
}

// 1. Attendance Trend Line Chart (Dashboard)
function renderAttendanceTrendChart(canvasId, trendsData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = trendsData.map(t => {
    const parts = t.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  });
  const dataValues = trendsData.map(t => t.percentage);

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(21, 128, 61, 0.25)');
  gradient.addColorStop(1, 'rgba(21, 128, 61, 0.0)');

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Daily Attendance (%)',
        data: dataValues,
        borderColor: '#15803D',
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: '#15803D',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 6.5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1F2937',
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => ` Attendance: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          min: 40,
          max: 100,
          grid: { color: '#F3F4F6' },
          ticks: {
            callback: (v) => `${v}%`,
            font: { size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

// 2. Student Performance by Subject Bar Chart (Dashboard)
function renderSubjectPerformanceChart(canvasId, subjectData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = subjectData.map(s => s.subject);
  const values = subjectData.map(s => s.averagePercentage);

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Class Average (%)',
        data: values,
        backgroundColor: values.map(v => v >= 75 ? '#15803D' : (v >= 60 ? '#10B981' : '#EA580C')),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1F2937',
          cornerRadius: 6,
          callbacks: {
            label: (ctx) => ` Average: ${ctx.parsed.y}%`
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: '#F3F4F6' },
          ticks: {
            callback: (v) => `${v}%`,
            font: { size: 11 }
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            maxRotation: 25
          }
        }
      }
    }
  });
}

// 3. Marks Distribution Chart (Grade Brackets)
function renderMarksDistributionChart(canvasId, distributionData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = Object.keys(distributionData);
  const counts = Object.values(distributionData);

  const colors = [
    '#15803D', // Distinction (Green)
    '#10B981', // First Class (Emerald)
    '#F59E0B', // Second Class (Amber)
    '#EA580C', // Pass Class (Orange)
    '#DC2626'  // Fail (Red)
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Students Count',
        data: counts,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1F2937',
          cornerRadius: 6
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: { size: 11 }
          },
          grid: { color: '#F3F4F6' }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { size: 10.5 },
            maxRotation: 20
          }
        }
      }
    }
  });
}

// 4. Attendance Distribution Doughnut Chart (Analytics Page)
function renderAttendanceDistributionChart(canvasId, attendanceData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labels = Object.keys(attendanceData);
  const counts = Object.values(attendanceData);

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: counts,
        backgroundColor: ['#15803D', '#10B981', '#EA580C', '#DC2626'],
        borderWidth: 2,
        borderColor: '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 11 }, padding: 14 }
        }
      },
      cutout: '68%'
    }
  });
}

// 5. Linear Regression & Correlation Scatter Plot with Trendline (Analytics Page)
function renderRegressionChart(canvasId, scatterPoints, regressionData) {
  destroyChart(canvasId);
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Trendline coordinates
  const trendline = regressionData.trendlinePoints || [
    { x: 40, y: 35 },
    { x: 100, y: 95 }
  ];

  chartInstances[canvasId] = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          type: 'line',
          label: 'Regression Line (Best Fit)',
          data: trendline,
          borderColor: '#EA580C',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          borderDash: [5, 4],
          pointRadius: 0,
          fill: false,
          tension: 0
        },
        {
          type: 'scatter',
          label: 'Student (Attendance vs Marks)',
          data: scatterPoints.map(p => ({ x: p.x, y: p.y, meta: p })),
          backgroundColor: '#15803D',
          borderColor: '#FFFFFF',
          borderWidth: 1.5,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 11.5 } }
        },
        tooltip: {
          backgroundColor: '#1F2937',
          cornerRadius: 6,
          padding: 10,
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.type === 'line') {
                return ` Trendline: y = ${ctx.parsed.y.toFixed(1)}%`;
              }
              const meta = ctx.raw.meta;
              if (meta) {
                return ` ${meta.studentName} (${meta.studentCode}): Att ${meta.x}% | Marks ${meta.y}%`;
              }
              return ` Att: ${ctx.parsed.x}%, Marks: ${ctx.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Attendance Percentage (%)',
            font: { size: 12, weight: 'bold' }
          },
          min: 40,
          max: 100,
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 11 } }
        },
        y: {
          title: {
            display: true,
            text: 'Academic Marks (%)',
            font: { size: 12, weight: 'bold' }
          },
          min: 30,
          max: 100,
          grid: { color: '#F3F4F6' },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}
