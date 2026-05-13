import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import TopNav from '../components/TopNav.jsx';

const initialStudent = {
  email: '',
  password: '',
  rollNumber: '',
  firstName: '',
  lastName: '',
  classId: '',
  sectionId: '',
  subjectIds: [],
};

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentForm, setStudentForm] = useState(initialStudent);
  const [className, setClassName] = useState('');
  const [sectionForm, setSectionForm] = useState({ name: '', classId: '' });
  const [teacherForm, setTeacherForm] = useState({ firstName: '', lastName: '', email: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', classId: '', teacherId: '' });
  const [setupStatus, setSetupStatus] = useState({ type: '', message: '' });
  const [studentStatus, setStudentStatus] = useState({ type: '', message: '' });

  const filteredSections = sections.filter((item) => !studentForm.classId || item.classId === studentForm.classId);
  const filteredSubjects = subjects.filter((item) => !studentForm.classId || item.classId === studentForm.classId);

  const loadData = async () => {
    const [studentsRes, classesRes, sectionsRes, subjectsRes, teachersRes] = await Promise.all([
      api.get('/admin/students'),
      api.get('/admin/classes').catch(() => ({ data: [] })),
      api.get('/admin/sections').catch(() => ({ data: [] })),
      api.get('/admin/subjects').catch(() => ({ data: [] })),
      api.get('/admin/teachers').catch(() => ({ data: [] })),
    ]);
    setStudents(studentsRes.data || []);
    setClasses(classesRes.data || []);
    setSections(sectionsRes.data || []);
    setSubjects(subjectsRes.data || []);
    setTeachers(teachersRes.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStudentChange = (event) => {
    setStudentForm({ ...studentForm, [event.target.name]: event.target.value });
  };

  const handleStudentClassChange = (event) => {
    const classId = event.target.value;
    setStudentForm((current) => ({
      ...current,
      classId,
      sectionId: '',
      subjectIds: [],
    }));
  };

  const handleStudentSubjectsChange = (event) => {
    const selectedIds = Array.from(event.target.selectedOptions, (option) => option.value);
    setStudentForm((current) => ({ ...current, subjectIds: selectedIds }));
  };

  const createStudent = async (event) => {
    event.preventDefault();
    setStudentStatus({ type: '', message: '' });
    try {
      await api.post('/admin/students', {
        ...studentForm,
      });
      setStudentForm(initialStudent);
      setStudentStatus({ type: 'success', message: 'Student created.' });
      await loadData();
    } catch (err) {
      setStudentStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create student.' });
    }
  };

  const createClass = async (event) => {
    event.preventDefault();
    setSetupStatus({ type: '', message: '' });
    try {
      await api.post('/admin/classes', { name: className });
      setClassName('');
      setSetupStatus({ type: 'success', message: 'Class created.' });
      await loadData();
    } catch (err) {
      setSetupStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create class.' });
    }
  };

  const createSection = async (event) => {
    event.preventDefault();
    setSetupStatus({ type: '', message: '' });
    try {
      await api.post('/admin/sections', sectionForm);
      setSectionForm({ name: '', classId: '' });
      setSetupStatus({ type: 'success', message: 'Section created.' });
      await loadData();
    } catch (err) {
      setSetupStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create section.' });
    }
  };

  const createTeacher = async (event) => {
    event.preventDefault();
    setSetupStatus({ type: '', message: '' });
    try {
      await api.post('/admin/teachers', teacherForm);
      setTeacherForm({ firstName: '', lastName: '', email: '' });
      setSetupStatus({ type: 'success', message: 'Teacher created.' });
      await loadData();
    } catch (err) {
      setSetupStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create teacher.' });
    }
  };

  const createSubject = async (event) => {
    event.preventDefault();
    setSetupStatus({ type: '', message: '' });
    try {
      await api.post('/admin/subjects', {
        ...subjectForm,
        teacherId: subjectForm.teacherId || undefined,
      });
      setSubjectForm({ name: '', classId: '', teacherId: '' });
      setSetupStatus({ type: 'success', message: 'Subject created.' });
      await loadData();
    } catch (err) {
      setSetupStatus({ type: 'error', message: err.response?.data?.message || 'Failed to create subject.' });
    }
  };

  return (
    <div className="page">
      <TopNav />
      <div className="dashboard">
        <header>
          <h1>Student Management</h1>
          <p>Create student profiles, assign classes, and manage enrollments.</p>
        </header>

        <div className="form-grid">
          <div className="card">
            <h3>Core Setup</h3>
            <form onSubmit={createClass}>
              <label>
                New Class Name
                <input value={className} onChange={(e) => setClassName(e.target.value)} required />
              </label>
              <button className="primary" type="submit">Add Class</button>
            </form>
            <form onSubmit={createSection}>
              <label>
                Section Name
                <input value={sectionForm.name} onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })} required />
              </label>
              <label>
                Class
                <select value={sectionForm.classId} onChange={(e) => setSectionForm({ ...sectionForm, classId: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <button className="primary" type="submit">Add Section</button>
            </form>
            <form onSubmit={createTeacher}>
              <label>
                Teacher First Name
                <input value={teacherForm.firstName} onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })} required />
              </label>
              <label>
                Teacher Last Name
                <input value={teacherForm.lastName} onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })} required />
              </label>
              <label>
                Teacher Email
                <input value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} required />
              </label>
              <button className="primary" type="submit">Add Teacher</button>
            </form>
            <form onSubmit={createSubject}>
              <label>
                Subject Name
                <input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
              </label>
              <label>
                Class
                <select value={subjectForm.classId} onChange={(e) => setSubjectForm({ ...subjectForm, classId: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Teacher (optional)
                <select value={subjectForm.teacherId} onChange={(e) => setSubjectForm({ ...subjectForm, teacherId: e.target.value })}>
                  <option value="">No teacher assigned</option>
                  {teachers.map((item) => (
                    <option key={item.id} value={item.id}>{item.firstName} {item.lastName}</option>
                  ))}
                </select>
              </label>
              <button className="primary" type="submit">Add Subject</button>
            </form>
            {setupStatus.message && <div className={`status ${setupStatus.type}`}>{setupStatus.message}</div>}
          </div>

          <form className="card" onSubmit={createStudent}>
            <h3>New Student</h3>
            <label>
              Email
              <input name="email" value={studentForm.email} onChange={handleStudentChange} required />
            </label>
            <label>
              Password
              <input name="password" type="password" value={studentForm.password} onChange={handleStudentChange} required />
            </label>
            <label>
              Roll Number
              <input name="rollNumber" value={studentForm.rollNumber} onChange={handleStudentChange} required />
            </label>
            <label>
              First Name
              <input name="firstName" value={studentForm.firstName} onChange={handleStudentChange} required />
            </label>
            <label>
              Last Name
              <input name="lastName" value={studentForm.lastName} onChange={handleStudentChange} required />
            </label>
            <label>
              Class
              <select name="classId" value={studentForm.classId} onChange={handleStudentClassChange} required>
                <option value="">Select class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Section
              <select name="sectionId" value={studentForm.sectionId} onChange={handleStudentChange} required disabled={!studentForm.classId}>
                <option value="">Select section</option>
                {filteredSections.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Subjects
              <select
                name="subjectIds"
                multiple
                value={studentForm.subjectIds}
                onChange={handleStudentSubjectsChange}
                disabled={!studentForm.classId}
              >
                {filteredSubjects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <p className="hint">Hold `Cmd` on Mac while clicking to select multiple subjects.</p>
            <button className="primary" type="submit">Create Student</button>
            {studentStatus.message && <div className={`status ${studentStatus.type}`}>{studentStatus.message}</div>}
          </form>

          <div className="card">
            <h3>Quick Reference</h3>
            <div className="mini-list">
              <strong>Classes</strong>
              {classes.map((item) => (
                <div key={item.id}>{item.name} - {item.id}</div>
              ))}
            </div>
            <div className="mini-list">
              <strong>Sections</strong>
              {sections.map((item) => (
                <div key={item.id}>{item.class?.name ? `${item.class.name} / ` : ''}{item.name} - {item.id}</div>
              ))}
            </div>
            <div className="mini-list">
              <strong>Subjects</strong>
              {subjects.map((item) => (
                <div key={item.id}>{item.class?.name ? `${item.class.name} / ` : ''}{item.name} - {item.id}</div>
              ))}
            </div>
            <div className="mini-list">
              <strong>Teachers</strong>
              {teachers.map((item) => (
                <div key={item.id}>{item.firstName} {item.lastName} - {item.id}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>Students</h3>
          <div className="table">
            <div className="row header">
              <span>Roll</span>
              <span>Name</span>
              <span>Class</span>
              <span>Section</span>
            </div>
            {students.map((student) => (
              <div className="row" key={student.id}>
                <span>{student.rollNumber}</span>
                <span>{student.firstName} {student.lastName}</span>
                <span>{student.class?.name}</span>
                <span>{student.section?.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
