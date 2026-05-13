import React, { useEffect, useState } from 'react';
import { Radar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import api from '../services/api.js';
import TopNav from '../components/TopNav.jsx';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get('/student/progress')
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/student/report/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'progress-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDownloading(false);
    }
  };

  const metrics = data?.metrics;
  const analysis = data?.analysis;

  const radarData = {
    labels: ['Attendance', 'Assignments', 'Marks'],
    datasets: [
      {
        label: 'Current',
        data: [metrics?.attendanceRate || 0, metrics?.assignmentCompletion || 0, metrics?.averageMark || 0],
        backgroundColor: 'rgba(90, 156, 255, 0.3)',
        borderColor: '#4d7cfe',
      },
    ],
  };

  const trendData = {
    labels: metrics?.marks?.map((mark) => mark.examName) || [],
    datasets: [
      {
        label: 'Scores',
        data: metrics?.marks?.map((mark) => (mark.score / mark.maxScore) * 100) || [],
        borderColor: '#07c984',
        backgroundColor: 'rgba(7, 201, 132, 0.25)',
        fill: true,
      },
    ],
  };

  return (
    <div className="page">
      <TopNav />
      <div className="dashboard">
        <header>
          <h1>My Progress</h1>
          <p>AI-powered insights and progress analytics.</p>
        </header>

        {data ? (
          <>
            <div className="stats">
              <div className="stat">
                <span>Attendance</span>
                <strong>{metrics.attendanceRate}%</strong>
              </div>
              <div className="stat">
                <span>Assignments</span>
                <strong>{metrics.assignmentCompletion}%</strong>
              </div>
              <div className="stat">
                <span>Average Marks</span>
                <strong>{metrics.averageMark}%</strong>
              </div>
              <div className="stat">
                <span>Risk Level</span>
                <strong>{analysis.riskLevel}</strong>
              </div>
            </div>

            <div className="charts">
              <div className="chart-card">
                <h3>Performance Radar</h3>
                <Radar data={radarData} />
              </div>
              <div className="chart-card">
                <h3>Marks Trend</h3>
                <Line data={trendData} />
              </div>
            </div>

            <div className="card">
              <h3>AI Summary</h3>
              <p>{analysis.summary}</p>
              <h4>Recommendations</h4>
              <ul>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>

            <button className="primary" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'Preparing PDF...' : 'Download PDF Report'}
            </button>
          </>
        ) : (
          <div className="card">No data available yet.</div>
        )}
      </div>
    </div>
  );
}
