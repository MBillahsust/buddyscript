const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('DB_CONNECTION_SUCCESS');
  } catch (e) {
    console.error('DB_CONNECTION_FAILED');
    console.error(e && e.message ? e.message : e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
