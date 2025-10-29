import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';

import { messagesRouter } from '@/modules/messages/server/procedure';
import { projectsRouter } from '@/modules/projects/server/procedure';

export const appRouter = createTRPCRouter({
  message: messagesRouter,
  projects: projectsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;