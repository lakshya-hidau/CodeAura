import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';

import { messagesRouter } from '@/modules/messages/server/procedure';
import { inngest } from '@/inngest/client';

export const appRouter = createTRPCRouter({
  // invoke: baseProcedure
  //   .input(
  //     z.object({
  //       value: z.string(),
  //     })
  //   )
  //   .mutation(async ({ input }) => {
  //     await inngest.send({
  //       name: "test/hello.world",
  //       data: { value: input.value },
  //     });
  //     return { ok: "success" };
  //   }),
  message: messagesRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;