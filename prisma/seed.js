const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const librarianPassword = await bcrypt.hash('librarian123', 10);
  const memberPassword = await bcrypt.hash('member123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@library.com' },
    update: {},
    create: {
      email: 'admin@library.com',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const librarian = await prisma.user.upsert({
    where: { email: 'librarian@library.com' },
    update: {},
    create: {
      email: 'librarian@library.com',
      password: librarianPassword,
      name: 'Librarian User',
      role: Role.LIBRARIAN,
    },
  });

  const memberUser = await prisma.user.upsert({
    where: { email: 'member@library.com' },
    update: {},
    create: {
      email: 'member@library.com',
      password: memberPassword,
      name: 'Anetar Test',
      role: Role.MEMBER,
      member: {
        create: { phone: '+38344123456', address: 'Prishtine' },
      },
    },
  });

  const ismailKadare = await prisma.author.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'Ismail Kadare', bio: 'Shkrimtar shqiptar' },
  });
  const orwell = await prisma.author.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'George Orwell', bio: 'Shkrimtar britanik' },
  });

  const fiction = await prisma.category.upsert({
    where: { name: 'Fiction' },
    update: {},
    create: { name: 'Fiction' },
  });
  const classics = await prisma.category.upsert({
    where: { name: 'Classics' },
    update: {},
    create: { name: 'Classics' },
  });

  await prisma.book.upsert({
    where: { isbn: '978-99927-1-456-7' },
    update: {},
    create: {
      title: 'Gjenerali i ushtrise se vdekur',
      isbn: '978-99927-1-456-7',
      description: 'Romani i pare i Ismail Kadarese',
      publishedYear: 1963,
      totalCopies: 3,
      availableCopies: 3,
      authorId: ismailKadare.id,
      categoryId: classics.id,
    },
  });

  await prisma.book.upsert({
    where: { isbn: '978-0-452-28423-4' },
    update: {},
    create: {
      title: '1984',
      isbn: '978-0-452-28423-4',
      description: 'Dystopian novel',
      publishedYear: 1949,
      totalCopies: 5,
      availableCopies: 5,
      authorId: orwell.id,
      categoryId: fiction.id,
    },
  });

  console.log(`Seeded: admin=${admin.email}, librarian=${librarian.email}, member=${memberUser.email}`);
  console.log('Default passwords: admin123 / librarian123 / member123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
