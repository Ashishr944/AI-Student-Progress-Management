import bcrypt from 'bcryptjs';
import prisma from '../src/utils/prisma.js';

const passwordHash = async (password) => bcrypt.hash(password, 10);

const main = async () => {
  const adminPasswordHash = await passwordHash('Admin@123');
  const teacherPasswordHash = await passwordHash('Teacher@123');
  const studentPasswordHash = await passwordHash('Student@123');

  await prisma.user.upsert({
    where: { email: 'admin@spm.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@spm.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@spm.com' },
    update: {
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
    },
    create: {
      email: 'teacher@spm.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
    },
  });

  const classTen = await prisma.class.upsert({
    where: { id: 'demo-class-10' },
    update: { name: 'Class 10' },
    create: {
      id: 'demo-class-10',
      name: 'Class 10',
    },
  });

  const sectionA = await prisma.section.upsert({
    where: { id: 'demo-section-a' },
    update: {
      name: 'Section A',
      classId: classTen.id,
    },
    create: {
      id: 'demo-section-a',
      name: 'Section A',
      classId: classTen.id,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { email: 'teacher@spm.com' },
    update: {
      userId: teacherUser.id,
      firstName: 'Demo',
      lastName: 'Teacher',
    },
    create: {
      userId: teacherUser.id,
      email: 'teacher@spm.com',
      firstName: 'Demo',
      lastName: 'Teacher',
    },
  });

  const math = await prisma.subject.upsert({
    where: { id: 'demo-subject-math' },
    update: {
      name: 'Mathematics',
      classId: classTen.id,
      teacherId: teacher.id,
    },
    create: {
      id: 'demo-subject-math',
      name: 'Mathematics',
      classId: classTen.id,
      teacherId: teacher.id,
    },
  });

  const science = await prisma.subject.upsert({
    where: { id: 'demo-subject-science' },
    update: {
      name: 'Science',
      classId: classTen.id,
      teacherId: teacher.id,
    },
    create: {
      id: 'demo-subject-science',
      name: 'Science',
      classId: classTen.id,
      teacherId: teacher.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@spm.com' },
    update: {
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
    create: {
      email: 'student@spm.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
  });

  const student = await prisma.student.upsert({
    where: { rollNumber: 'SPM001' },
    update: {
      userId: studentUser.id,
      firstName: 'Demo',
      lastName: 'Student',
      classId: classTen.id,
      sectionId: sectionA.id,
      guardianName: 'Demo Guardian',
      guardianPhone: '9999999999',
    },
    create: {
      userId: studentUser.id,
      rollNumber: 'SPM001',
      firstName: 'Demo',
      lastName: 'Student',
      classId: classTen.id,
      sectionId: sectionA.id,
      guardianName: 'Demo Guardian',
      guardianPhone: '9999999999',
    },
  });

  await prisma.enrollment.createMany({
    data: [
      { studentId: student.id, subjectId: math.id },
      { studentId: student.id, subjectId: science.id },
    ],
    skipDuplicates: true,
  });

  await prisma.mark.deleteMany({
    where: {
      studentId: student.id,
      examName: 'Unit Test 1',
    },
  });

  await prisma.mark.createMany({
    data: [
      { studentId: student.id, subjectId: math.id, examName: 'Unit Test 1', score: 78, maxScore: 100 },
      { studentId: student.id, subjectId: science.id, examName: 'Unit Test 1', score: 84, maxScore: 100 },
    ],
  });

  const today = new Date();
  const attendanceRows = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    return {
      studentId: student.id,
      date,
      status: index < 8 ? 'PRESENT' : 'ABSENT',
    };
  });

  for (const row of attendanceRows) {
    await prisma.attendance.upsert({
      where: {
        studentId_date: {
          studentId: row.studentId,
          date: row.date,
        },
      },
      update: { status: row.status },
      create: row,
    });
  }

  console.log('Demo data seeded.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
