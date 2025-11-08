import { gemini, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

interface CodeAgentState {
  summary: string;
  files: { [path: string]: string };
}

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    // ==================== STEP 1: VALIDATE INPUT ====================
    console.log("\n🚀 ========================================");
    console.log("🚀 INNGEST FUNCTION STARTED");
    console.log("🚀 ========================================");
    console.log("📦 Full Event Data:", JSON.stringify(event.data, null, 2));
    console.log("🆔 Project ID:", event.data.projectId);
    console.log("💬 User Message:", event.data.value);

    if (!event.data.projectId) {
      console.error("❌ CRITICAL ERROR: No projectId in event.data!");
      console.error("❌ Event data keys:", Object.keys(event.data));
      throw new Error("Project ID is required but was not provided");
    }

    // ==================== STEP 2: CREATE SANDBOX ====================
    const sandboxId = await step.run("get-sandbox-id", async () => {
      console.log("\n📦 Creating E2B Sandbox...");
      try {
        const sandbox = await Sandbox.create("codeaura-nextjs-test-2");
        console.log("✅ Sandbox created successfully:", sandbox.sandboxId);
        return sandbox.sandboxId;
      } catch (error) {
        console.error("❌ Failed to create sandbox:", error);
        throw error;
      }
    });

    // ==================== STEP 3: CREATE AGENT ====================
    const codeAgent = createAgent<CodeAgentState>({
      name: "code-agent", 
      description: "An expert coding agent",
      system: PROMPT,
      model: gemini({ model: "gemini-2.0-flash" }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({ command }, { step }) => {
            return await step?.run("terminal", async () => {
              const buffer = { stdout: "", stderr: "" };
              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => { buffer.stdout += data; },
                  onStderr: (data: string) => { buffer.stderr += data; }
                });
                return result.stdout;
              } catch (e) {
                console.error(`Terminal command failed: ${e}\nstdout: ${buffer.stdout}\nstderr: ${buffer.stderr}`);
                return `Command failed: ${e}\nstdout: ${buffer.stdout}\nstderr: ${buffer.stderr}`;
              }
            });
          },
        }),
        createTool({
          name: "createOrUpdateFile",
          description: "Create or update a file in the codebase",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string(),
              }),
            ),
          }),
          handler: async ({ files }, { step, network }: Tool.Options<CodeAgentState>) => {
            const newFiles = await step?.run("create-or-update-file", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                return updatedFiles;
              } catch (e) {
                console.error(`Failed to create/update files: ${e}`);
                throw e;
              }
            }); 
            if (typeof newFiles === 'object') {
              network.state.data.files = newFiles;
            }
          }
        }),
        createTool({
          name: "readFile",
          description: "Read a file from the codebase",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("read-file", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                console.error(`Failed to read files: ${e}`);
                throw e;
              }
            });
          }
        })
      ],
      lifecycle: { 
        onResponse: async ({ result, network }) => {
          const lastAssistantMessageText = lastAssistantTextMessageContent(result);
          if (lastAssistantMessageText && network) {
            if (lastAssistantMessageText.includes("<task_summary>")) {
              network.state.data.summary = lastAssistantMessageText;
            }
          }
          return result;
        },
      },
    });

    // ==================== STEP 4: RUN NETWORK ====================
    const network = createNetwork<CodeAgentState>({
      name: "code-agent-network", 
      agents: [codeAgent],
      maxIter: 5,
      router: async ({ network }) => {
        const summary = network.state.data.summary;
        if (summary) return;
        return codeAgent;
      }
    });

    console.log("\n🤖 Running AI Agent Network...");
    const result = await network.run(event.data.value);
    console.log("✅ Agent network completed");
    console.log("📝 Summary exists:", !!result.state.data.summary);
    console.log("📁 Files created:", Object.keys(result.state.data.files || {}).length);

    // ==================== STEP 5: GET SANDBOX URL ====================
    const sandboxURL = await step.run("get-sandbox-url", async () => {
      try {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        const url = `https://${host}`;
        console.log("🌐 Sandbox URL generated:", url);
        return url;
      } catch (error) {
        console.error("❌ Failed to get sandbox URL:", error);
        throw error;
      }
    });

    // ==================== STEP 6: SAVE TO DATABASE ====================
    const savedMessage = await step.run("save-results", async () => {
      console.log("\n💾 ========================================");
      console.log("💾 SAVING RESULTS TO DATABASE");
      console.log("💾 ========================================");
      
      const projectId = event.data.projectId;
      console.log("🆔 Project ID to save:", projectId);

      if (!projectId) {
        console.error("❌ CRITICAL: projectId is undefined at save step!");
        throw new Error("Cannot save message: projectId is undefined");
      }

      // Check for errors
      const isError = !result.state.data.summary || 
                      Object.keys(result.state.data.files || {}).length === 0;

      console.log("🔍 Is Error:", isError);
      console.log("📝 Summary length:", result.state.data.summary?.length || 0);
      console.log("📁 Files count:", Object.keys(result.state.data.files || {}).length);

      if (isError) {
        console.log("⚠️  Saving ERROR message to database...");
        try {
          const errorMessage = await prisma.message.create({
            data: {
              projectId,
              content: "Something went wrong. Please try again.",
              role: "ASSISTANT",
              type: "ERROR",
            },
          });
          console.log("✅ ERROR message saved with ID:", errorMessage.id);
          console.log("🆔 Saved to project:", errorMessage.projectId);
          return errorMessage;
        } catch (dbError) {
          console.error("❌ DATABASE ERROR when saving error message:", dbError);
          throw dbError;
        }
      }

      // Save SUCCESS message with fragment
      console.log("✅ Saving SUCCESS message with fragment...");
      console.log("📝 Summary preview:", result.state.data.summary.substring(0, 100) + "...");
      console.log("📁 Files to save:", Object.keys(result.state.data.files));

      try {
        const message = await prisma.message.create({
          data: {
            projectId: projectId,
            content: result.state.data.summary,
            role: "ASSISTANT",
            type: "RESULT",
            fragment: {
              create: {
                sandboxUrl: sandboxURL,
                title: "Fragment",
                files: result.state.data.files,
              },
            },
          },
          include: {
            fragment: true,
          },
        });

        console.log("\n🎉 ========================================");
        console.log("🎉 MESSAGE SAVED SUCCESSFULLY!");
        console.log("🎉 ========================================");
        console.log("🆔 Message ID:", message.id);
        console.log("🆔 Fragment ID:", message.fragment?.id);
        console.log("🆔 Project ID:", message.projectId);
        console.log("👤 Role:", message.role);
        console.log("📋 Type:", message.type);
        console.log("🔗 Sandbox URL:", message.fragment?.sandboxUrl);
        console.log("========================================\n");
        
        return message;
      } catch (dbError) {
        console.error("\n❌ ========================================");
        console.error("❌ DATABASE ERROR!");
        console.error("❌ ========================================");
        console.error("Error details:", dbError);
        console.error("Attempted projectId:", projectId);
        console.error("========================================\n");
        throw dbError;
      }
    });

    console.log("\n✅ Inngest function completed successfully!");
    console.log("🆔 Final message ID:", savedMessage.id);
    console.log("========================================\n");

    return { 
      url: sandboxURL,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary,
      messageId: savedMessage.id,
      projectId: event.data.projectId,
    };
  },
);