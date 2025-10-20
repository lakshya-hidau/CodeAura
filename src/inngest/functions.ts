import { gemini, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "@e2b/code-interpreter";

import { inngest } from "./client";
import { getSendbox } from "./utils";

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
    system: "You are an expert next.js developer who writes clean, efficient, and readable code. You write simple next.js and React code snippets.",
    model: gemini({ model: "gemini-2.0-flash" })
    });

    const { output } = await codeAgent.run('Write the following snippets: ' + event.data.value);
    
    const sandboxURL = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSendbox(sandboxId);
      const host =  sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { output, sandboxURL };
  },
);