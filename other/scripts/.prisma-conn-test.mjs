import * as PrismaPkg from "./src/generated/prisma/client.ts";

const prisma = new PrismaPkg.PrismaClient();

try {
  await prisma.$queryRawUnsafe("SELECT 1");
  console.log("DB_CONNECTION_SUCCESS");
} catch (e) {
  console.error("DB_CONNECTION_FAILED");
  console.error(e && e.message ? e.message : String(e));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
