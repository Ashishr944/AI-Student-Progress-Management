import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { hashPassword } from '../utils/auth.js';
import { getStudentMetrics } from '../services/metrics.js';
import { runStudentAnalysis } from '../services/analytics.js';
import { buildStudentReportPdf } from '../services/report.js';

const router = Router();

const getValidationMessage = (parsed) => parsed.error.issues.map((issue) => issue.message).join(', ');

const classSchema = z.object({ name: z.string().min(1) });
const sectionSchema = z.object({ name: z.string().min(1), classId: z.string() });
const teacherSchema = z.object({ firstName: z.string(), lastName: z.string(), email: z.string().email() });
const subjectSchema = z.object({ name: z.string(), classId: z.string(), teacherId: z.string().optional() });

const studentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  rollNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  classId: z.string(),
  sectionId: z.string(),
  subjectIds: z.array(z.string()).default([]),
});

const attendanceSchema = z.object({
  studentId: z.string(),
  date: z.string(),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE']),
});

const markSchema = z.object({
  studentId: z.string(),
  subjectId: z.string(),
  examName: z.string(),
  score: z.number().int(),
  maxScore: z.number().int(),
});

const assignmentSchema = z.object({
  subjectId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string(),
  maxScore: z.number().int(),
});

const submissionSchema = z.object({
  assignmentId: z.string(),
  studentId: z.string(),
  score: z.number().int().optional(),
  submittedAt: z.string().optional(),
  feedback: z.string().optional(),
});

router.get('/dashboard', async (req, res) => {
  const [students, classes, subjects, attendance] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.attendance.count(),
  ]);
  return res.json({ students, classes, subjects, attendance });
});

router.get('/classes', async (req, res) => {
  const classes = await prisma.class.findMany({ orderBy: { name: 'asc' } });
  return res.json(classes);
});

router.get('/sections', async (req, res) => {
  const sections = await prisma.section.findMany({
    include: { class: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });
  return res.json(sections);
});

router.get('/subjects', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    include: { class: true, teacher: true },
    orderBy: [{ class: { name: 'asc' } }, { name: 'asc' }],
  });
  return res.json(subjects);
});

router.get('/teachers', async (req, res) => {
  const teachers = await prisma.teacher.findMany({ orderBy: { lastName: 'asc' } });
  return res.json(teachers);
});

router.post('/classes', async (req, res) => {
  const parsed = classSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: getValidationMessage(parsed) });
  const created = await prisma.class.create({ data: parsed.data });
  return res.status(201).json(created);
});

router.post('/sections', async (req, res) => {
  const parsed = sectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: getValidationMessage(parsed) });
  const existingClass = await prisma.class.findUnique({ where: { id: parsed.data.classId } });
  if (!existingClass) {
    return res.status(404).json({ message: 'Selected class was not found.' });
  }
  const created = await prisma.section.create({ data: parsed.data });
  return res.status(201).json(created);
});

router.post('/teachers', async (req, res) => {
  const parsed = teacherSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: getValidationMessage(parsed) });
  const created = await prisma.teacher.create({ data: parsed.data });
  return res.status(201).json(created);
});

router.post('/subjects', async (req, res) => {
  const parsed = subjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: getValidationMessage(parsed) });
  const existingClass = await prisma.class.findUnique({ where: { id: parsed.data.classId } });
  if (!existingClass) {
    return res.status(404).json({ message: 'Selected class was not found.' });
  }
  if (parsed.data.teacherId) {
    const existingTeacher = await prisma.teacher.findUnique({ where: { id: parsed.data.teacherId } });
    if (!existingTeacher) {
      return res.status(404).json({ message: 'Selected teacher was not found.' });
    }
  }
  const created = await prisma.subject.create({ data: parsed.data });
  return res.status(201).json(created);
});

router.post('/students', async (req, res) => {
  const parsed = studentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: getValidationMessage(parsed) });
  const { subjectIds, password, ...studentData } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: studentData.email } });
  if (existingUser) return res.status(409).json({ message: 'User already exists' });
  const [existingClass, existingSection, matchingSubjects] = await Promise.all([
    prisma.class.findUnique({ where: { id: studentData.classId } }),
    prisma.section.findUnique({ where: { id: studentData.sectionId } }),
    subjectIds.length
      ? prisma.subject.findMany({ where: { id: { in: subjectIds } } })
      : Promise.resolve([]),
  ]);

  if (!existingClass) {
    return res.status(404).json({ message: 'Selected class was not found.' });
  }

  if (!existingSection) {
    return res.status(404).json({ message: 'Selected section was not found.' });
  }

  if (existingSection.classId !== studentData.classId) {
    return res.status(400).json({ message: 'Selected section does not belong to the selected class.' });
  }

  if (subjectIds.length !== matchingSubjects.length) {
    return res.status(404).json({ message: 'One or more selected subjects were not found.' });
  }

  const invalidSubjects = matchingSubjects.filter((subject) => subject.classId !== studentData.classId);
  if (invalidSubjects.length) {
    return res.status(400).json({ message: 'Selected subjects must belong to the selected class.' });
  }

  const passwordHash = await hashPassword(password);
  const student = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: studentData.email,
        passwordHash,
        role: 'STUDENT',
      },
    });

    const createdStudent = await tx.student.create({
      data: {
        userId: user.id,
        rollNumber: studentData.rollNumber,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
        guardianName: studentData.guardianName,
        guardianPhone: studentData.guardianPhone,
        classId: studentData.classId,
        sectionId: studentData.sectionId,
      },
      include: { class: true, section: true },
    });

    if (subjectIds.length) {
      await tx.enrollment.createMany({
        data: subjectIds.map((subjectId) => ({ subjectId, studentId: createdStudent.id })),
        skipDuplicates: true,
      });
    }

    return createdStudent;
  });

  return res.status(201).json(student);
});

router.get('/students', async (req, res) => {
  const students = await prisma.student.findMany({
    include: { class: true, section: true },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(students);
});

router.post('/attendance', async (req, res) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
  const record = await prisma.attendance.upsert({
    where: {
      studentId_date: {
        studentId: parsed.data.studentId,
        date: new Date(parsed.data.date),
      },
    },
    update: { status: parsed.data.status },
    create: {
      studentId: parsed.data.studentId,
      date: new Date(parsed.data.date),
      status: parsed.data.status,
    },
  });
  return res.status(201).json(record);
});

router.post('/marks', async (req, res) => {
  const parsed = markSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
  const mark = await prisma.mark.create({ data: parsed.data });
  return res.status(201).json(mark);
});

router.post('/assignments', async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
  const assignment = await prisma.assignment.create({
    data: {
      ...parsed.data,
      dueDate: new Date(parsed.data.dueDate),
    },
  });
  return res.status(201).json(assignment);
});

router.post('/submissions', async (req, res) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid input' });
  const submission = await prisma.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: parsed.data.assignmentId,
        studentId: parsed.data.studentId,
      },
    },
    update: {
      score: parsed.data.score ?? null,
      submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : null,
      feedback: parsed.data.feedback,
    },
    create: {
      assignmentId: parsed.data.assignmentId,
      studentId: parsed.data.studentId,
      score: parsed.data.score ?? null,
      submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : null,
      feedback: parsed.data.feedback,
    },
  });
  return res.status(201).json(submission);
});

router.get('/analytics/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const metrics = await getStudentMetrics(studentId);
  const analysis = runStudentAnalysis(metrics);
  return res.json({ metrics, analysis });
});

router.get('/reports/:studentId/pdf', async (req, res) => {
  const { studentId } = req.params;
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: true, section: true },
  });
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const metrics = await getStudentMetrics(studentId);
  const analysis = runStudentAnalysis(metrics);
  const pdfBuffer = await buildStudentReportPdf({ student, metrics, analysis });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${student.rollNumber}-report.pdf`);
  return res.send(pdfBuffer);
});

export default router;
