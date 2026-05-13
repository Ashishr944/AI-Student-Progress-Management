import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { getStudentMetrics } from '../services/metrics.js';
import { runStudentAnalysis } from '../services/analytics.js';
import { buildStudentReportPdf } from '../services/report.js';

const router = Router();

router.get('/me', async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { class: true, section: true },
  });
  if (!student) return res.status(404).json({ message: 'Student profile not found' });
  return res.json(student);
});

router.get('/progress', async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { class: true, section: true },
  });
  if (!student) return res.status(404).json({ message: 'Student profile not found' });

  const metrics = await getStudentMetrics(student.id);
  const analysis = runStudentAnalysis(metrics);

  return res.json({ student, metrics, analysis });
});

router.get('/report/pdf', async (req, res) => {
  const student = await prisma.student.findUnique({
    where: { userId: req.user.id },
    include: { class: true, section: true },
  });
  if (!student) return res.status(404).json({ message: 'Student profile not found' });

  const metrics = await getStudentMetrics(student.id);
  const analysis = runStudentAnalysis(metrics);
  const pdfBuffer = await buildStudentReportPdf({ student, metrics, analysis });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${student.rollNumber}-report.pdf`);
  return res.send(pdfBuffer);
});

export default router;
