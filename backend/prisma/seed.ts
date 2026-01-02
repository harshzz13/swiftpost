import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create counters
  const counters = await Promise.all([
    prisma.counter.upsert({
      where: { number: 1 },
      update: {},
      create: { number: 1, status: 'ACTIVE' }
    }),
    prisma.counter.upsert({
      where: { number: 2 },
      update: {},
      create: { number: 2, status: 'ACTIVE' }
    }),
    prisma.counter.upsert({
      where: { number: 3 },
      update: {},
      create: { number: 3, status: 'ACTIVE' }
    }),
    prisma.counter.upsert({
      where: { number: 4 },
      update: {},
      create: { number: 4, status: 'INACTIVE' }
    })
  ]);

  console.log('Created counters:', counters);

  // Create some sample tokens
  const tokens = await Promise.all([
    prisma.token.create({
      data: {
        tokenNumber: 'P-001',
        serviceType: 'Parcel Drop-off',
        status: 'WAITING',
        queuePosition: 1
      }
    }),
    prisma.token.create({
      data: {
        tokenNumber: 'B-001',
        serviceType: 'Banking Services',
        status: 'WAITING',
        queuePosition: 2
      }
    }),
    prisma.token.create({
      data: {
        tokenNumber: 'G-001',
        serviceType: 'General Inquiry',
        status: 'SERVING',
        queuePosition: null,
        counterId: counters[0].id,
        calledAt: new Date()
      }
    })
  ]);

  console.log('Created tokens:', tokens);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });