import { role, roleProject } from '../src/utils/enum';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/generated/client';
const config = new ConfigService();
const databaseUrl = process.env.DATABASE_URL as string;
if (!databaseUrl) {
  throw new Error('DATABASE_URL not defined');
}
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const main = async () => {
  const adminRole = await prisma.role.create({
    data: { name: role.ADMIN },
    select: { id: true },
  });
  const userRole = await prisma.role.create({
    data: { name: role.USER },
    select: { id: true },
  });
  await prisma.role.create({
    data: { name: role.SUPERADMINMAN },
  });
  const moderator = await prisma.role_Project.create({
    data: { name: roleProject.MODERATOR },
    select: { id: true },
  });
  if (!moderator) {
    throw new ForbiddenException('Role not create');
  }
  await prisma.role_Project.create({
    data: { name: roleProject.MEMBER },
  });
  if (!process.env.IS_PRODUCTION || process.env.IS_PRODUCTION === 'false') {
    const hash = await argon.hash(config.get('PASSWORD_ADMIN') as string);
    await prisma.user.createMany({
      data: [
        {
          email: 'admin@admin.com',
          firstName: 'poste',
          lastName: 'man',
          username: 'posteMan',
          password: hash,
          roleId: adminRole.id,
          isActive: true,
        },
        {
          email: 'email2@email.com',
          firstName: 'test',
          lastName: 'test',
          username: 'user2',
          password: hash,
          isActive: true,
          roleId: userRole.id,
        },
        {
          email: 'email3@email.com',
          firstName: 'test',
          lastName: 'test',
          username: 'user3',
          password: hash,
          isActive: true,
          roleId: userRole.id,
        },
      ],
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.log('Seed failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
