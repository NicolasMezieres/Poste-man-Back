import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    url: env('DATABASE_URL') as string,
  },
});
