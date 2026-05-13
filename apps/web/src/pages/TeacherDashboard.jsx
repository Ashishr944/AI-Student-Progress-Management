import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import TopNav from '../components/TopNav.jsx';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/teacher/me')
      .then((res) => setTeacher(res.data))
      .catch(() => setError('Teacher profile not found.'));
  }, []);

  return (
    <div className="page">
      <TopNav />
      <div className="dashboard">
        <header>
          <h1>Teacher Dashboard</h1>
          <p>Assigned classes, subjects, and academic activity.</p>
        </header>

        {error && <div className="alert">{error}</div>}

        {teacher && (
          <>
            <div className="stats">
              <div className="stat">
                <span>Teacher</span>
                <strong>{teacher.firstName} {teacher.lastName}</strong>
              </div>
              <div className="stat">
                <span>Subjects</span>
                <strong>{teacher.subjects.length}</strong>
              </div>
              <div className="stat">
                <span>Assignments</span>
                <strong>{teacher.subjects.reduce((sum, subject) => sum + subject.assignments.length, 0)}</strong>
              </div>
              <div className="stat">
                <span>Marks Recorded</span>
                <strong>{teacher.subjects.reduce((sum, subject) => sum + subject.marks.length, 0)}</strong>
              </div>
            </div>

            <div className="card">
              <h3>Assigned Subjects</h3>
              <div className="table">
                <div className="row header">
                  <span>Subject</span>
                  <span>Class</span>
                  <span>Assignments</span>
                  <span>Marks</span>
                </div>
                {teacher.subjects.map((subject) => (
                  <div className="row" key={subject.id}>
                    <span>{subject.name}</span>
                    <span>{subject.class?.name}</span>
                    <span>{subject.assignments.length}</span>
                    <span>{subject.marks.length}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
