import { gemini, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Result, Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSendbox, lastAssistantTextMessageContent } from "./utils";
import z from "zod";
import { stdout, title } from "process";
import { PROMPT } from "@/prompt";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("codeaura-nextjs-test-2");
      return sandbox.sandboxId;
    });

    const codeAgent = createAgent({
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
              const sandbox = await getSendbox(sandboxId);
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
          { step, network }
        ) => {
          const newFiles= await step?.run("create-or-update-file", async () => {
            try {
              const updatedFiles = network.state.data.files || {};
              const sandbox = await getSendbox(sandboxId);
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
              const sandbox = await getSendbox(sandboxId);
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

    const network = createNetwork({
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

    // const { output } = await codeAgent.run('Write the following snippets: ' + event.data.value);
    
    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSendbox(sandboxId);
      const host =  sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { 
      url: sandboxURL,
      title: "Fragemt",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
  },
);