import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Prisma client cannot be initialized.');
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const prismaUnavailable = new Proxy(
  {},
  {
    get() {
      throw new Error('Prisma client is unavailable in this environment.');
    },
  }
) as PrismaClient;

export const prisma = globalForPrisma.prisma ?? (isBuildPhase ? prismaUnavailable : createPrismaClient());

if (process.env.NODE_ENV !== 'production' && !isBuildPhase) {
  globalForPrisma.prisma = prisma;
}
