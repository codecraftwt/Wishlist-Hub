import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prismaGlobal;
} else {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
}

export default prisma;
