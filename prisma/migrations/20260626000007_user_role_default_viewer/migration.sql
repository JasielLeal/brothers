-- Change UserRole default from ADMIN to VIEWER (#18)
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER';
