import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import api from '../services/api.js';
import TopNav from '../components/TopNav.jsx';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, []);

  const attendanceChart = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        label: 'Attendance',
        data: [60, 25, 15],
        backgroundColor: ['#07c984', '#f45b69', '#f9c74f'],
      },
    ],
  };

  const progressChart = {
    labels: ['Above 80%', '60-80%', 'Below 60%'],
    datasets: [
      {
        data: [45, 35, 20],
        backgroundColor: ['#4d7cfe', '#72c2ff', '#ffb74d'],
      },
    ],
  };

  return (
    <div className="page">
      <TopNav />
      <div className="dashboard">
        <header>
          <h1>Admin Overview</h1>
          <p>Track attendance, scores, and AI risk insights across classes.</p>
        </header>
        <div className="stats">
          <div className="stat">
            <span>Students</span>
            <strong>{summary?.students ?? '--'}</strong>
          </div>
          <div className="stat">
            <span>Classes</span>
            <strong>{summary?.classes ?? '--'}</strong>
          </div>
          <div className="stat">
            <span>Subjects</span>
            <strong>{summary?.subjects ?? '--'}</strong>
          </div>
          <div className="stat">
            <span>Attendance Logs</span>
            <strong>{summary?.attendance ?? '--'}</strong>
          </div>
        </div>
        <div className="charts">
          <div className="chart-card">
            <h3>Attendance Mix</h3>
            <Doughnut data={attendanceChart} />
          </div>
          <div className="chart-card">
            <h3>Progress Distribution</h3>
            <Bar data={progressChart} />
          </div>
        </div>
      </div>
    </div>
  );
}
