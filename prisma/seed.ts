import { PrismaClient } from '../src/prisma/generated';
import { role, roleProject } from '../src/utils/enum';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const config = new ConfigService();

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
  await prisma.role_Project.create({
    data: { name: roleProject.MODERATOR },
  });
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
      ],
    });
  }
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
