const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskmanager.com',
      name: 'Admin User',
      passwordHash: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin: ${admin.email}`);

  // Create Member
  const member = await prisma.user.create({
    data: {
      email: 'member@taskmanager.com',
      name: 'Member User',
      passwordHash: passwordHash,
      role: 'MEMBER',
    },
  });
  console.log(`Created member: ${member.email}`);

  // Create a default project
  const project = await prisma.project.create({
    data: {
      name: 'Acme Website Redesign',
      description: 'Overhaul of the main corporate website for Acme Corp with glassmorphism design and responsive layout.',
      ownerId: admin.id,
      members: {
        connect: [{ id: member.id }, { id: admin.id }]
      }
    }
  });
  console.log(`Created project: ${project.name}`);

  // Create default tasks
  const task1 = await prisma.task.create({
    data: {
      title: 'Design high-fidelity UI wireframes',
      description: 'Create high-fidelity wireframes in Vanilla CSS and modern design systems.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup REST API Backend',
      description: 'Initialize Node Express app with Prisma ORM and implement security middlewares.',
      status: 'DONE',
      priority: 'MEDIUM',
      projectId: project.id,
      assigneeId: admin.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // Overdue by 2 days
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Verify JWT and RBAC Roles',
      description: 'Write integration checks to ensure Members cannot delete projects or invite users.',
      status: 'TODO',
      priority: 'HIGH',
      projectId: project.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
