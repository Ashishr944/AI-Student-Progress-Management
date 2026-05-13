-- Add teacher login support.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TEACHER';

ALTER TABLE "Teacher" ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Teacher_userId_key" ON "Teacher"("userId");

ALTER TABLE "Teacher"
  ADD CONSTRAINT "Teacher_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
