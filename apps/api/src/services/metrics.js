import prisma from '../utils/prisma.js';

export const getStudentMetrics = async (studentId) => {
  const [attendanceRecords, marks, submissions] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId } }),
    prisma.mark.findMany({ where: { studentId } }),
    prisma.submission.findMany({
      where: { studentId },
      include: { assignment: true },
    }),
  ]);

  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((record) => record.status === 'PRESENT').length;
  const attendanceRate = totalAttendance ? (presentCount / totalAttendance) * 100 : 0;

  const totalMarkScore = marks.reduce((sum, mark) => sum + mark.score, 0);
  const totalMarkMax = marks.reduce((sum, mark) => sum + mark.maxScore, 0);
  const averageMark = totalMarkMax ? (totalMarkScore / totalMarkMax) * 100 : 0;

  const totalAssignments = submissions.length;
  const completedAssignments = submissions.filter((sub) => sub.submittedAt || sub.score !== null).length;
  const assignmentCompletion = totalAssignments ? (completedAssignments / totalAssignments) * 100 : 0;

  return {
    attendanceRate: Number(attendanceRate.toFixed(1)),
    averageMark: Number(averageMark.toFixed(1)),
    assignmentCompletion: Number(assignmentCompletion.toFixed(1)),
    attendanceRecords,
    marks,
    submissions,
  };
};
