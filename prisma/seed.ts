import { PrismaClient } from '../src/prisma/generated';
import { role, roleProject } from '../src/utils/enum';
import * as argon from 'argon2';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const config = new ConfigService();

const main = async () => {
  const adminRole = await prisma.role.create({
    data: { name: role.ADMIN },
  });
  await prisma.role.create({
    data: { name: role.USER },
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
  const hash = await argon.hash(config.get('PASSWORD_ADMIN') as string);
  await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      firstName: 'poste',
      lastName: 'man',
      username: 'posteMan',
      password: hash,
      roleId: adminRole.id,
      isActive: true,
    },
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
