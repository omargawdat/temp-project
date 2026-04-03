-- Update existing READY_FOR_INVOICING milestones to COMPLETED
UPDATE "Milestone" SET status = 'COMPLETED' WHERE status = 'READY_FOR_INVOICING';

-- AlterEnum
BEGIN;
CREATE TYPE "MilestoneStatus_new" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'INVOICED');
ALTER TABLE "public"."Milestone" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Milestone" ALTER COLUMN "status" TYPE "MilestoneStatus_new" USING ("status"::text::"MilestoneStatus_new");
ALTER TYPE "MilestoneStatus" RENAME TO "MilestoneStatus_old";
ALTER TYPE "MilestoneStatus_new" RENAME TO "MilestoneStatus";
DROP TYPE "public"."MilestoneStatus_old";
ALTER TABLE "Milestone" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
COMMIT;
