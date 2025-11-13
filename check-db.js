import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const wishlists = await prisma.wishlist.findMany();
  console.log('Wishlists:', wishlists);

  const sessions = await prisma.session.findMany();
  console.log('Sessions:', sessions);

  const settings = await prisma.settings.findMany();
  console.log('Settings:', settings);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
