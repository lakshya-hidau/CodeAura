import { gemini, createAgent } from "@inngest/agent-kit";
// import { createAgent, anthropic } from "@inngest/agent-kit";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
    const codeAgent = createAgent({
    name: "code-agent", 
    system: "You are an expert next.js developer who writes clean, efficient, and readable code. You write simple next.js and React code snippets.",
    model: gemini({ model: "gemini-2.0-flash" })
    });

    const { output } = await codeAgent.run('Summarize the following text: ' + event.data.value);
    
    return { output };
  },
);