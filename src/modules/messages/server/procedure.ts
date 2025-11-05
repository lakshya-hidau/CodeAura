import { inngest } from "@/inngest/client";
import { prisma } from "@/lib/db";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";

export const messagesRouter = createTRPCRouter({
    getMany: baseProcedure
        .input(
            z.object({
                projectId: z.string().min(1, "Project ID is required"),
            }),    
        )
        .query(async ({ input }) => {
            console.log(`[getMany] Fetching messages for project: ${input.projectId}`);
            
            const messages = await prisma.message.findMany({
                where: {
                    projectId: input.projectId,
                },
                include: {
                    fragment: true,
                },
                orderBy: {
                    createdAt: "asc"  // Changed from updatedAt to createdAt
                }
            });

            console.log(`[getMany] Found ${messages.length} messages`);
            messages.forEach((msg, index) => {
                console.log(`  ${index + 1}. ${msg.role}: ${msg.content?.substring(0, 30)}...`);
            });

            return messages;
        }),

    create: baseProcedure
        .input(
            z.object({
                value: z.string()
                    .min(1, "Value is required")
                    .max(10000, "Value is too long"),
                projectId: z.string().min(1, "Project ID is required"),
            }),    
        )
        .mutation(async ({ input }) => {
            console.log(`\n[create] Creating message for project: ${input.projectId}`);
            
            const createdMessage = await prisma.message.create({
                data: {
                    projectId: input.projectId,
                    content: input.value,
                    role: "USER",
                    type: "RESULT"
                }
            });

            console.log(`[create] ✅ Created USER message: ${createdMessage.id}`);

            // ⚠️ CRITICAL FIX: projectId MUST be inside data object
            try {
                await inngest.send({
                    name: "code-agent/run",
                    data: { 
                        value: input.value,
                        projectId: input.projectId,  // ✅ NOW INSIDE data object
                        messageId: createdMessage.id
                    },
                });
                console.log(`[create] ✅ Inngest event sent successfully\n`);
            } catch (error) {
                console.error(`[create] ❌ Failed to send Inngest event:`, error);
                throw error;
            }

            return createdMessage;
        })
});