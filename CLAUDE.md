# CLAUDE.md

## Prisma Migration Rule (CRITICAL)

**NEVER run `prisma generate` alone after changing `schema.prisma`.**

Always use `npx prisma migrate dev --name describe_change` instead. This single command:
1. Creates the SQL migration file
2. Applies it to the local database
3. Regenerates the Prisma client

Running `prisma generate` without `migrate dev` causes schema drift — the TypeScript types update but the database and migration history do not, leading to broken deploys and forced resets.

On deployment, `prisma migrate deploy` runs pending migrations against production.
