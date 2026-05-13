import { Router } from 'express';
import prisma from '../utils/prisma.js';

const router = Router();

router.get('/me', async (req, res) => {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: req.user.id },
    include: {
      subjects: {
        include: {
          class: true,
          assignments: true,
          marks: true,
        },
      },
    },
  });

  if (!teacher) {
    return res.status(404).json({ message: 'Teacher profile not found' });
  }

  return res.json(teacher);
});

export default router;
