import { gemini, createAgent, createTool, createNetwork, type Tool } from "@inngest/agent-kit";
import { Result, Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { stdout, title } from "process";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";
import path from "path";

interface CodeAgentState {
  summary: string;
  files: { [path: string]: string };
};

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("codeaura-nextjs-test-2");
      return sandbox.sandboxId;
    });

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
                onStdout: (data: string) => {
                  buffer.stdout += data;
                },
                onStderr: (data: string) => {
                  buffer.stderr += data;
                }
              });
              return result.stdout;
            }
            catch (e) {
              console.error(
                `Command failed: ${e}\nstdout: ${buffer.stdout}\nstderr: ${buffer.stderr}`,
              );
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
        handler: async (
          { files },
          { step, network }: Tool.Options<CodeAgentState>
        ) => {
          const newFiles= await step?.run("create-or-update-file", async () => {
            try {
              const updatedFiles = network.state.data.files || {};
              const sandbox = await getSandbox(sandboxId);
              for (const file of files) {
                await sandbox.files.write(file.path, file.content);
                updatedFiles[file.path] = file.content;
              }
              return updatedFiles;
            }
            catch (e) {
              console.error(`Failed to create or update files: ${e}`);
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
              for (const file of files){
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
      onResponse: async ({ result, network}) => {
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

    const network = createNetwork<CodeAgentState>({
      name: "code-agent-network", 
      agents: [codeAgent],
      maxIter: 5,
      router: async ({ network }) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }
        return codeAgent;
      }
    })

    const result = await network.run(event.data.value);

    const isError = 
      !result.state.data.summary ||
      Object.keys(result.state.data.files || {}).length === 0;

    // const { output } = await codeAgent.run('Write the following snippets: ' + event.data.value);
    
    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host =  sandbox.getHost(3000);
      return `https://${host}`;
    });

    await step.run("save-results", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            content: "Something went wrong. Please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          }
        });
      }
      return await prisma.message.create({
        data: {
          content: result.state.data.summary,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: sandboxURL,
              title: "Fragemt",
              files: result.state.data.files,
            },
          },
        },
      })
    });

    return { 
      url: sandboxURL,
      title: "Fragemt",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);