import { Router } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { hashPassword, signToken, verifyPassword } from '../utils/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, role: user.role });
  return res.json({ token, role: user.role });
});

router.post('/bootstrap-admin', async (req, res) => {
  const secret = req.headers['x-bootstrap-secret'];
  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid input' });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  const token = signToken({ id: user.id, role: user.role });
  return res.status(201).json({ token, role: user.role });
});

export default router;
